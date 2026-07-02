// speechmatics.js — real-time speech-to-text provider (dual-stream).
//
// Speechmatics only transcribes audio; it does NOT generate answers. The interview has two
// physically separate audio sources — the interviewer (system audio) and the interviewee /
// candidate (microphone) — so we run ONE independent Speechmatics stream per role. Because
// each stream carries a single speaker, role labels are deterministic (no voice diarization
// guesswork). Each stream surfaces its transcript on the shared 'update-transcript' channel
// tagged with its role; on end-of-utterance the interviewer stream hands finished questions
// to gemini.js's triggerAnswerGeneration(), while the interviewee stream feeds what the
// candidate actually said into the answer context via gemini.js's recordIntervieweeUtterance().

const { RealtimeClient } = require('@speechmatics/real-time-client');
const { createSpeechmaticsJWT } = require('@speechmatics/auth');
const { getSpeechmaticsApiKey, getPreferences } = require('../storage');

// Lazy-require gemini.js to avoid a circular dependency (gemini.js lazy-requires this module
// from its IPC handlers). By the time any of these functions run, gemini.js is fully loaded.
let _gemini = null;
function getGemini() {
    if (!_gemini) _gemini = require('./gemini');
    return _gemini;
}

function makeStream(role) {
    return {
        role,
        client: null,
        conversation: '', // full running conversation (every finalized utterance) — shown live
        currentUtterance: '', // finalized text for the in-progress segment (resets each utterance)
        lastUtterance: '', // the most recently completed utterance
        audioBytes: 0, // raw PCM bytes streamed — for exact audio-duration/cost
    };
}

const streams = {
    interviewer: makeStream('interviewer'),
    interviewee: makeStream('interviewee'),
};
let isStarting = false;

// Map app language codes (e.g. 'en-US') to Speechmatics ISO codes (e.g. 'en').
function toSpeechmaticsLanguage(language) {
    if (!language) return 'en';
    return language.split('-')[0].toLowerCase();
}

// Live preview = the WHOLE conversation so far + the in-progress utterance + current partial.
function buildDisplay(s, partial) {
    return [s.conversation.trim(), s.currentUtterance.trim(), (partial || '').trim()].filter(Boolean).join(' ');
}

// Heuristic: does this utterance look like a question worth answering? Used so we only
// answer ACTUAL questions automatically (not every statement / pause). The manual Answer
// button can still answer anything.
function isLikelyQuestion(text) {
    const t = (text || '').trim().toLowerCase();
    if (!t) return false;
    if (t.includes('?')) return true;
    return /^(what|why|how|when|where|who|whose|whom|which|can|could|would|will|should|shall|do|does|did|is|are|am|was|were|have|has|had|may|might|tell me|explain|describe|walk me|give me|share|name|define|compare|difference)\b/.test(
        t
    );
}

// Transcript updates are tagged with the speaker role so the UI can show two panels.
function emitTranscript(role, text) {
    getGemini().sendToRenderer('update-transcript', { role, text });
}

function handleMessage(s, data) {
    const gemini = getGemini();

    switch (data.message) {
        case 'AddPartialTranscript': {
            const partial = data.metadata?.transcript || '';
            emitTranscript(s.role, buildDisplay(s, partial));
            break;
        }
        case 'AddTranscript': {
            const finalText = data.metadata?.transcript || '';
            if (finalText.trim()) {
                s.currentUtterance = [s.currentUtterance.trim(), finalText.trim()].filter(Boolean).join(' ');
            }
            emitTranscript(s.role, buildDisplay(s, ''));
            break;
        }
        case 'EndOfUtterance': {
            const utt = s.currentUtterance.trim();
            if (utt) {
                s.conversation = [s.conversation.trim(), utt].filter(Boolean).join(' ');
                s.lastUtterance = utt;
                if (s.role === 'interviewer') {
                    // Only the interviewer's speech auto-triggers an answer.
                    if (isLikelyQuestion(utt)) gemini.triggerAnswerGeneration(utt);
                } else if (typeof gemini.recordIntervieweeUtterance === 'function') {
                    // The candidate spoke — feed it into the answer context; never auto-answer it.
                    gemini.recordIntervieweeUtterance(utt);
                }
            }
            s.currentUtterance = '';
            emitTranscript(s.role, s.conversation);
            break;
        }
        case 'Error': {
            console.error(`[Speechmatics:${s.role}] Error:`, data.type, data.reason);
            gemini.sendToRenderer('update-status', 'Speechmatics error: ' + data.reason);
            break;
        }
        case 'Warning': {
            console.warn(`[Speechmatics:${s.role}] Warning:`, data.type, data.reason);
            break;
        }
        default:
            break;
    }
}

async function startStream(role, key, language, eouTrigger) {
    const s = streams[role];
    s.conversation = '';
    s.currentUtterance = '';
    s.lastUtterance = '';
    s.audioBytes = 0;

    const client = new RealtimeClient();
    client.addEventListener('receiveMessage', ({ data }) => {
        try {
            handleMessage(s, data);
        } catch (err) {
            console.error(`[Speechmatics:${role}] message handler error:`, err);
        }
    });

    // The realtime API authenticates with a short-lived JWT minted from the API key.
    const jwt = await createSpeechmaticsJWT({ type: 'rt', apiKey: key, ttl: 3600 });
    await client.start(jwt, {
        audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: 24000 },
        transcription_config: {
            language,
            model: 'enhanced',
            enable_partials: true,
            max_delay: 1.5,
            conversation_config: { end_of_utterance_silence_trigger: eouTrigger },
        },
    });
    s.client = client;
    console.log(`[Speechmatics:${role}] stream started (language=${language}, eou=${eouTrigger}s)`);
}

// options.roles: which speaker streams to start (default ['interviewer']). Pass
// ['interviewer','interviewee'] when the audio mode captures both sides.
async function initSpeechmatics(apiKey, options = {}) {
    const key = apiKey || getSpeechmaticsApiKey();
    if (!key) {
        getGemini().sendToRenderer('update-status', 'No Speechmatics API key configured');
        return false;
    }
    if (isStarting) return false;
    isStarting = true;

    // Tear down any previous streams first.
    await closeSpeechmatics();

    const prefs = getPreferences();
    const language = toSpeechmaticsLanguage(options.language || prefs.selectedLanguage);
    const eouTrigger = typeof prefs.speechmaticsEouTrigger === 'number' ? prefs.speechmaticsEouTrigger : 1.5;
    const roles = Array.isArray(options.roles) && options.roles.length ? options.roles : ['interviewer'];

    // The interviewer stream is essential — if it fails, the session fails.
    try {
        await startStream('interviewer', key, language, eouTrigger);
    } catch (error) {
        console.error('[Speechmatics] Failed to start:', error);
        // The auth endpoint returns an HTML error page (not JSON) when the API key is rejected —
        // the SDK then throws a JSON parse error. Translate that into a clear, actionable message.
        const raw = (error && (error.message || String(error))) || '';
        const cause = error && error.cause ? String(error.cause) : '';
        const looksLikeBadKey =
            /parse JSON|Unexpected token|Unauthorized|forbidden|\b40[13]\b/i.test(raw) ||
            /Unexpected token '<'|not valid JSON|<html/i.test(cause);
        getGemini().sendToRenderer(
            'update-status',
            looksLikeBadKey
                ? 'Speechmatics API key looks invalid or expired — check it in Settings, or switch the Audio provider.'
                : 'Speechmatics error: ' + (raw || 'failed to start')
        );
        await closeSpeechmatics();
        isStarting = false;
        return false;
    }

    // The interviewee (mic) stream is optional — if it can't start, keep the interviewer running.
    if (roles.includes('interviewee')) {
        try {
            await startStream('interviewee', key, language, eouTrigger);
        } catch (error) {
            console.warn('[Speechmatics:interviewee] failed to start (continuing interviewer-only):', error && error.message);
            getGemini().sendToRenderer('update-status', 'Your-mic transcription unavailable — interviewer only');
        }
    }

    console.log(`[Speechmatics] Session started (language=${language}, roles=${roles.join('+')})`);
    getGemini().sendToRenderer('update-status', 'Live session connected');
    isStarting = false;
    return true;
}

function sendAudio(base64Data, role = 'interviewer') {
    const s = streams[role];
    if (!s || !s.client || s.client.socketState !== 'open') return false;
    try {
        const buffer = Buffer.from(base64Data, 'base64');
        s.client.sendAudio(buffer);
        s.audioBytes += buffer.length;
        return true;
    } catch (error) {
        console.error(`[Speechmatics:${role}] sendAudio error:`, error);
        return false;
    }
}

async function closeSpeechmatics() {
    for (const role of Object.keys(streams)) {
        const s = streams[role];
        if (s.client) {
            try {
                if (s.client.socketState === 'open') {
                    await s.client.stopRecognition({ noTimeout: true }).catch(() => {});
                }
            } catch (err) {
                // best-effort teardown
            }
            s.client = null;
        }
        s.conversation = '';
        s.currentUtterance = '';
        s.lastUtterance = '';
        s.audioBytes = 0;
    }
}

function isActive() {
    return !!streams.interviewer.client && streams.interviewer.client.socketState === 'open';
}

// The interviewer's most recently completed utterance — used by the manual "Answer" button
// so it answers the last question rather than the whole conversation.
function getLastUtterance() {
    const s = streams.interviewer;
    return (s.lastUtterance || s.currentUtterance || '').trim();
}

function getConversation() {
    const s = streams.interviewer;
    return [s.conversation.trim(), s.currentUtterance.trim()].filter(Boolean).join(' ');
}

// Exact audio duration streamed to Speechmatics (both streams summed), derived from bytes.
// Format is raw PCM s16le @ 24 kHz mono = 2 bytes/sample × 24000 = 48000 bytes/sec.
function getAudioSeconds() {
    return (streams.interviewer.audioBytes + streams.interviewee.audioBytes) / 48000;
}

module.exports = {
    initSpeechmatics,
    sendAudio,
    closeSpeechmatics,
    isActive,
    getLastUtterance,
    getConversation,
    getAudioSeconds,
};
