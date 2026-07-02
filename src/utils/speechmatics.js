// speechmatics.js — real-time speech-to-text provider.
//
// Speechmatics only transcribes audio; it does NOT generate answers. So this module
// streams the interviewer's audio to Speechmatics over a WebSocket, surfaces the live
// transcript on the UI (via the shared 'update-transcript' channel), and on end-of-utterance
// hands the finished transcript to the configured text provider through gemini.js's
// triggerAnswerGeneration() — the exact same answer pipeline the Gemini Live path uses.

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

let client = null;
let isStarting = false;
let audioBytesSent = 0; // raw PCM bytes streamed this session — for exact audio-duration/cost
let conversation = ''; // full running conversation (every finalized utterance) — shown live
let currentUtterance = ''; // finalized text for the in-progress segment (resets each utterance)
let lastUtterance = ''; // the most recently completed utterance (the "last asked question" candidate)

// Map app language codes (e.g. 'en-US') to Speechmatics ISO codes (e.g. 'en').
function toSpeechmaticsLanguage(language) {
    if (!language) return 'en';
    return language.split('-')[0].toLowerCase();
}

// Live preview = the WHOLE conversation so far + the in-progress utterance + current partial.
function buildDisplay(partial) {
    return [conversation.trim(), currentUtterance.trim(), (partial || '').trim()].filter(Boolean).join(' ');
}

// Heuristic: does this utterance look like a question worth answering? Used so we only
// answer ACTUAL questions automatically (not every statement / pause), which is what makes
// the old behaviour feel "random". The manual Answer button can still answer anything.
function isLikelyQuestion(text) {
    const t = (text || '').trim().toLowerCase();
    if (!t) return false;
    if (t.includes('?')) return true;
    return /^(what|why|how|when|where|who|whose|whom|which|can|could|would|will|should|shall|do|does|did|is|are|am|was|were|have|has|had|may|might|tell me|explain|describe|walk me|give me|share|name|define|compare|difference)\b/.test(
        t
    );
}

function handleMessage(data) {
    const gemini = getGemini();

    switch (data.message) {
        case 'AddPartialTranscript': {
            // Interim result — show it live (appended to the running conversation), don't commit.
            const partial = data.metadata?.transcript || '';
            gemini.sendToRenderer('update-transcript', buildDisplay(partial));
            break;
        }
        case 'AddTranscript': {
            // Final result for a span — commit it to the current utterance.
            const finalText = data.metadata?.transcript || '';
            if (finalText.trim()) {
                currentUtterance = [currentUtterance.trim(), finalText.trim()].filter(Boolean).join(' ');
            }
            gemini.sendToRenderer('update-transcript', buildDisplay(''));
            break;
        }
        case 'EndOfUtterance': {
            // Speaker paused — the utterance is complete. Fold it into the running conversation
            // (which stays on screen), remember it as the last question, and ONLY auto-answer
            // if it actually looks like a question.
            const utt = currentUtterance.trim();
            if (utt) {
                conversation = [conversation.trim(), utt].filter(Boolean).join(' ');
                lastUtterance = utt;
                if (isLikelyQuestion(utt)) {
                    gemini.triggerAnswerGeneration(utt);
                }
            }
            currentUtterance = '';
            gemini.sendToRenderer('update-transcript', conversation);
            break;
        }
        case 'Error': {
            console.error('[Speechmatics] Error:', data.type, data.reason);
            gemini.sendToRenderer('update-status', 'Speechmatics error: ' + data.reason);
            break;
        }
        case 'Warning': {
            console.warn('[Speechmatics] Warning:', data.type, data.reason);
            break;
        }
        default:
            break;
    }
}

async function initSpeechmatics(apiKey, options = {}) {
    const key = apiKey || getSpeechmaticsApiKey();
    if (!key) {
        getGemini().sendToRenderer('update-status', 'No Speechmatics API key configured');
        return false;
    }
    if (isStarting) return false;
    isStarting = true;

    // Tear down any previous session first.
    await closeSpeechmatics();

    const prefs = getPreferences();
    const language = toSpeechmaticsLanguage(options.language || prefs.selectedLanguage);
    const eouTrigger =
        typeof prefs.speechmaticsEouTrigger === 'number' ? prefs.speechmaticsEouTrigger : 1.5;

    conversation = '';
    currentUtterance = '';
    lastUtterance = '';
    audioBytesSent = 0;
    client = new RealtimeClient();

    client.addEventListener('receiveMessage', ({ data }) => {
        try {
            handleMessage(data);
        } catch (err) {
            console.error('[Speechmatics] message handler error:', err);
        }
    });

    try {
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
        console.log(`[Speechmatics] Session started (language=${language}, eou=${eouTrigger}s)`);
        getGemini().sendToRenderer('update-status', 'Live session connected');
        isStarting = false;
        return true;
    } catch (error) {
        console.error('[Speechmatics] Failed to start:', error);
        // The auth endpoint returns an HTML error page (not JSON) when the API key is
        // rejected — the SDK then throws a JSON parse error. Translate that into a clear,
        // actionable message instead of the cryptic "Failed to parse JSON response".
        const raw = (error && (error.message || String(error))) || '';
        const cause = error && error.cause ? String(error.cause) : '';
        const looksLikeBadKey =
            /parse JSON|Unexpected token|Unauthorized|forbidden|\b40[13]\b/i.test(raw) ||
            /Unexpected token '<'|not valid JSON|<html/i.test(cause);
        const message = looksLikeBadKey
            ? 'Speechmatics API key looks invalid or expired — check it in Settings, or switch the Audio provider.'
            : 'Speechmatics error: ' + (raw || 'failed to start');
        getGemini().sendToRenderer('update-status', message);
        client = null;
        isStarting = false;
        return false;
    }
}

function sendAudio(base64Data) {
    if (!client || client.socketState !== 'open') return false;
    try {
        const buffer = Buffer.from(base64Data, 'base64');
        client.sendAudio(buffer);
        audioBytesSent += buffer.length;
        return true;
    } catch (error) {
        console.error('[Speechmatics] sendAudio error:', error);
        return false;
    }
}

async function closeSpeechmatics() {
    if (!client) return;
    try {
        if (client.socketState === 'open') {
            await client.stopRecognition({ noTimeout: true }).catch(() => {});
        }
    } catch (err) {
        // best-effort teardown
    }
    client = null;
    conversation = '';
    currentUtterance = '';
    lastUtterance = '';
}

function isActive() {
    return !!client && client.socketState === 'open';
}

// The most recently completed utterance — used by the manual "Answer" button so it answers
// the last thing said (typically the last question) rather than the whole conversation.
function getLastUtterance() {
    return (lastUtterance || currentUtterance || '').trim();
}

function getConversation() {
    return [conversation.trim(), currentUtterance.trim()].filter(Boolean).join(' ');
}

// Exact audio duration streamed to Speechmatics, derived from bytes sent.
// Format is raw PCM s16le @ 24 kHz mono = 2 bytes/sample × 24000 = 48000 bytes/sec.
function getAudioSeconds() {
    return audioBytesSent / 48000;
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
