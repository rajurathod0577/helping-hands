const { GoogleGenAI, Modality } = require('@google/genai');
const { BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const { saveDebugAudio } = require('../audioUtils');
const { getSystemPrompt, buildAnswerModifiers } = require('./prompts');
const {
    getAvailableModel,
    incrementLimitCount,
    getApiKey,
    getGroqApiKey,
    getOpenRouterApiKey,
    getDeepSeekApiKey,
    incrementCharUsage,
    getModelForToday,
    getProviderConfig,
    getPreferences,
    saveSession,
} = require('../storage');
const { connectCloud, sendCloudAudio, sendCloudText, sendCloudImage, closeCloud, isCloudActive, setOnTurnComplete } = require('./cloud');
const { computeCost } = require('./pricing');

// Lazy-loaded to avoid circular dependency (localai.js imports from gemini.js)
let _localai = null;
function getLocalAi() {
    if (!_localai) _localai = require('./localai');
    return _localai;
}

// Lazy-loaded to avoid circular dependency (speechmatics.js imports from gemini.js)
let _speechmatics = null;
function getSpeechmatics() {
    if (!_speechmatics) _speechmatics = require('./speechmatics');
    return _speechmatics;
}

// Provider mode: 'api' (hosted providers via API keys), 'cloud', 'local', or 'speechmatics'
let currentProviderMode = 'api';

// Groq conversation history for context
let groqConversationHistory = [];

// Conversation tracking variables
let currentSessionId = null;
let currentTranscription = '';
let conversationHistory = [];
let screenAnalysisHistory = [];
let currentProfile = null;
let currentCustomPrompt = null;
let isInitializingSession = false;
let currentSystemPrompt = null;

// ── Per-session API usage / cost tracking ──────────────────────────────────
// Accumulates token usage (reported by each provider) and audio duration for the
// active session, so we can show an estimated cost when the session ends. Reset
// on every new session via resetSessionUsage().
let sessionUsage = createEmptyUsage();

function createEmptyUsage() {
    return {
        startedAt: null, // ms epoch when the session (audio) began
        text: {}, // `${provider}/${model}` -> { provider, model, inputTokens, outputTokens, cachedInputTokens, requests, exactCostUSD? }
        audioProvider: null, // 'speechmatics' | 'gemini' | null
        estimated: false, // true if any tokens were estimated from characters
        deepseekStartBalance: null, // { currency: amount } snapshot for the balance-delta reconciliation
    };
}

function resetSessionUsage() {
    sessionUsage = createEmptyUsage();
    sessionUsage.startedAt = Date.now();
}

function markAudioProvider(provider) {
    if (!sessionUsage.startedAt) sessionUsage.startedAt = Date.now();
    sessionUsage.audioProvider = provider;
}

// Fold one text-generation response into the running usage. `usage` is the provider's
// own usage object (OpenAI-compatible: prompt_tokens/completion_tokens, plus DeepSeek's
// prompt_cache_hit_tokens). `fallback` supplies char counts so we can estimate tokens
// (~4 chars/token) when a provider doesn't report usage.
function recordTextUsage(provider, model, usage, fallback) {
    if (!sessionUsage.startedAt) sessionUsage.startedAt = Date.now();

    let inTok;
    let outTok;
    let cachedTok = 0;
    const hasUsage = usage && (usage.prompt_tokens != null || usage.completion_tokens != null);
    if (hasUsage) {
        inTok = usage.prompt_tokens || 0;
        outTok = usage.completion_tokens || 0;
        cachedTok = usage.prompt_cache_hit_tokens || usage.prompt_tokens_details?.cached_tokens || 0;
    } else {
        inTok = Math.round((fallback?.inputChars || 0) / 4);
        outTok = Math.round((fallback?.outputChars || 0) / 4);
        sessionUsage.estimated = true;
    }

    const key = `${provider}/${model}`;
    const entry = sessionUsage.text[key] || { provider, model, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, requests: 0 };
    entry.inputTokens += inTok;
    entry.outputTokens += outTok;
    entry.cachedInputTokens += cachedTok;
    entry.requests += 1;
    // OpenRouter reports the exact per-request cost (in credits = USD) when usage.include
    // is set — prefer that over rate math when present.
    if (usage && typeof usage.cost === 'number') {
        entry.exactCostUSD = (entry.exactCostUSD || 0) + usage.cost;
    }
    sessionUsage.text[key] = entry;

    emitLiveCost();
}

// Snapshot the current usage into a computed cost object. For Speechmatics the audio
// duration is exact (byte-counted from the PCM stream); otherwise fall back to wall-clock.
function computeSessionCost(extra = {}) {
    let audioSeconds = 0;
    if (sessionUsage.audioProvider === 'speechmatics') {
        try {
            audioSeconds = getSpeechmatics().getAudioSeconds();
        } catch (e) {
            audioSeconds = 0;
        }
    } else if (sessionUsage.startedAt) {
        audioSeconds = (Date.now() - sessionUsage.startedAt) / 1000;
    }
    return computeCost({
        text: sessionUsage.text,
        audioProvider: sessionUsage.audioProvider,
        audioSeconds,
        estimated: sessionUsage.estimated,
        actualCharged: extra.actualCharged || null,
    });
}

// Push a running cost snapshot to the UI (for the live counter).
function emitLiveCost() {
    try {
        sendToRenderer('update-cost', computeSessionCost());
    } catch (e) {
        // non-fatal
    }
}

// ── DeepSeek balance reconciliation ──
// DeepSeek exposes the account balance, so (balance before − balance after) = the exact
// money this session cost. We snapshot the balance at session start and re-read it at the
// end. All best-effort: any failure just omits the "actually charged" figure.
async function fetchDeepSeekBalance() {
    try {
        const key = getDeepSeekApiKey();
        if (!key) return null;
        // Never let a slow/hung balance call block session start or the End button.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        let res;
        try {
            res = await fetch('https://api.deepseek.com/user/balance', {
                headers: { Authorization: `Bearer ${key}` },
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timer);
        }
        if (!res.ok) return null;
        const j = await res.json();
        const map = {};
        for (const info of j.balance_infos || []) {
            const amt = parseFloat(info.total_balance);
            if (!Number.isNaN(amt)) map[info.currency] = amt;
        }
        return Object.keys(map).length ? map : null;
    } catch (e) {
        return null;
    }
}

function snapshotDeepSeekStartBalance() {
    let usesDeepSeek = false;
    try {
        usesDeepSeek = getProviderConfig().text === 'deepseek';
    } catch (e) {
        usesDeepSeek = false;
    }
    if (!usesDeepSeek) return;
    fetchDeepSeekBalance()
        .then(b => {
            if (b) sessionUsage.deepseekStartBalance = b;
        })
        .catch(() => {});
}

async function computeActualCharged() {
    const start = sessionUsage.deepseekStartBalance;
    if (!start) return null;
    const end = await fetchDeepSeekBalance();
    if (!end) return null;
    for (const cur of Object.keys(start)) {
        const delta = (start[cur] || 0) - (end[cur] || 0);
        if (delta > 1e-7) return { amount: delta, currency: cur };
    }
    return { amount: 0, currency: Object.keys(start)[0] || 'USD' };
}

// Called when a session ends: reconcile against the DeepSeek balance, snapshot the final
// cost, persist it onto the session's saved history record, and return it for the card.
async function finalizeSessionCost() {
    const actualCharged = await computeActualCharged();
    const cost = computeSessionCost({ actualCharged });
    if (currentSessionId) {
        try {
            saveSession(currentSessionId, { cost });
        } catch (e) {
            console.error('Failed to persist session cost:', e.message);
        }
    }
    return cost;
}

function formatSpeakerResults(results) {
    let text = '';
    for (const result of results) {
        if (result.transcript && result.speakerId) {
            const speakerLabel = result.speakerId === 1 ? 'Interviewer' : 'Candidate';
            text += `[${speakerLabel}]: ${result.transcript}\n`;
        }
    }
    return text;
}

module.exports.formatSpeakerResults = formatSpeakerResults;

// Audio capture variables
let systemAudioProc = null;
let messageBuffer = '';

// Reconnection variables
let isUserClosing = false;
let sessionParams = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000;

function sendToRenderer(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send(channel, data);
    }
}

// Build context message for session restoration
function buildContextMessage() {
    const lastTurns = conversationHistory.slice(-20);
    const validTurns = lastTurns.filter(turn => turn.transcription?.trim() && turn.ai_response?.trim());

    if (validTurns.length === 0) return null;

    const contextLines = validTurns.map(turn => `[Interviewer]: ${turn.transcription.trim()}\n[Your answer]: ${turn.ai_response.trim()}`);

    return `Session reconnected. Here's the conversation so far:\n\n${contextLines.join('\n\n')}\n\nContinue from here.`;
}

// Conversation management functions
function initializeNewSession(profile = null, customPrompt = null) {
    currentSessionId = Date.now().toString();
    currentTranscription = '';
    conversationHistory = [];
    screenAnalysisHistory = [];
    groqConversationHistory = [];
    currentProfile = profile;
    currentCustomPrompt = customPrompt;
    resetSessionUsage();
    snapshotDeepSeekStartBalance(); // for the exact balance-delta reconciliation at session end
    console.log('New conversation session started:', currentSessionId, 'profile:', profile);

    // Save initial session with profile context
    if (profile) {
        sendToRenderer('save-session-context', {
            sessionId: currentSessionId,
            profile: profile,
            customPrompt: customPrompt || '',
        });
    }
}

function saveConversationTurn(transcription, aiResponse) {
    if (!currentSessionId) {
        initializeNewSession();
    }

    const conversationTurn = {
        timestamp: Date.now(),
        transcription: transcription.trim(),
        ai_response: aiResponse.trim(),
    };

    conversationHistory.push(conversationTurn);
    console.log('Saved conversation turn:', conversationTurn);

    // Send to renderer to save in IndexedDB
    sendToRenderer('save-conversation-turn', {
        sessionId: currentSessionId,
        turn: conversationTurn,
        fullHistory: conversationHistory,
    });
}

function saveScreenAnalysis(prompt, response, model) {
    if (!currentSessionId) {
        initializeNewSession();
    }

    const analysisEntry = {
        timestamp: Date.now(),
        prompt: prompt,
        response: response.trim(),
        model: model,
    };

    screenAnalysisHistory.push(analysisEntry);
    console.log('Saved screen analysis:', analysisEntry);

    // Send to renderer to save
    sendToRenderer('save-screen-analysis', {
        sessionId: currentSessionId,
        analysis: analysisEntry,
        fullHistory: screenAnalysisHistory,
        profile: currentProfile,
        customPrompt: currentCustomPrompt,
    });
}

function getCurrentSessionData() {
    return {
        sessionId: currentSessionId,
        history: conversationHistory,
    };
}

async function getEnabledTools() {
    const tools = [];

    // Check if Google Search is enabled (default: true)
    const googleSearchEnabled = await getStoredSetting('googleSearchEnabled', 'true');
    console.log('Google Search enabled:', googleSearchEnabled);

    if (googleSearchEnabled === 'true') {
        tools.push({ googleSearch: {} });
        console.log('Added Google Search tool');
    } else {
        console.log('Google Search tool disabled');
    }

    return tools;
}

async function getStoredSetting(key, defaultValue) {
    try {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            // Wait a bit for the renderer to be ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Try to get setting from renderer process localStorage
            const value = await windows[0].webContents.executeJavaScript(`
                (function() {
                    try {
                        if (typeof localStorage === 'undefined') {
                            console.log('localStorage not available yet for ${key}');
                            return '${defaultValue}';
                        }
                        const stored = localStorage.getItem('${key}');
                        console.log('Retrieved setting ${key}:', stored);
                        return stored || '${defaultValue}';
                    } catch (e) {
                        console.error('Error accessing localStorage for ${key}:', e);
                        return '${defaultValue}';
                    }
                })()
            `);
            return value;
        }
    } catch (error) {
        console.error('Error getting stored setting for', key, ':', error.message);
    }
    console.log('Using default value for', key, ':', defaultValue);
    return defaultValue;
}

// helper to check if groq has been configured
function hasGroqKey() {
    const key = getGroqApiKey();
    return key && key.trim() != '';
}

function trimConversationHistoryForGemma(history, maxChars = 42000) {
    if (!history || history.length === 0) return [];
    let totalChars = 0;
    const trimmed = [];

    for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i];
        const turnChars = (turn.content || '').length;

        if (totalChars + turnChars > maxChars) break;
        totalChars += turnChars;
        trimmed.unshift(turn);
    }
    return trimmed;
}

function stripThinkingTags(text) {
    return (
        text
            // Completed reasoning blocks (qwen3 etc.)
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            // Unterminated reasoning still streaming in (no closing tag yet) — hide it so the
            // raw "<think>…" reasoning never flashes on screen before the answer arrives.
            .replace(/<think(?:ing)?>[\s\S]*$/i, '')
            .trim()
    );
}

async function sendToGroq(transcription) {
    const groqApiKey = getGroqApiKey();
    if (!groqApiKey) {
        console.log('No Groq API key configured, skipping Groq response');
        return;
    }

    if (!transcription || transcription.trim() === '') {
        console.log('Empty transcription, skipping Groq');
        return;
    }

    const modelToUse = getModelForToday();
    if (!modelToUse) {
        console.log('All Groq daily limits exhausted');
        sendToRenderer('update-status', 'Groq limits reached for today');
        return;
    }

    console.log(`Sending to Groq (${modelToUse}):`, transcription.substring(0, 100) + '...');

    groqConversationHistory.push({
        role: 'user',
        content: transcription.trim(),
    });

    if (groqConversationHistory.length > 20) {
        groqConversationHistory = groqConversationHistory.slice(-20);
    }

    try {
        const doFetch = () =>
            fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelToUse,
                    messages: [{ role: 'system', content: currentSystemPrompt || 'You are a helpful assistant.' }, ...groqConversationHistory],
                    stream: true,
                    stream_options: { include_usage: true },
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });

        let response = await doFetch();

        // On a rate limit (429), wait the server-suggested delay and retry once.
        if (response.status === 429) {
            const errorText = await response.text();
            const headerRetry = parseFloat(response.headers.get('retry-after'));
            const bodyRetry = parseFloat((errorText.match(/try again in ([\d.]+)s/) || [])[1]);
            const waitMs = Math.min(Math.ceil(headerRetry || bodyRetry || 5) * 1000, 15000);
            console.warn(`Groq 429 rate limit — retrying in ${waitMs}ms`);
            sendToRenderer('update-status', `Rate limit — retrying in ${Math.ceil(waitMs / 1000)}s…`);
            await new Promise(r => setTimeout(r, waitMs));
            response = await doFetch();
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', response.status, errorText);
            sendToRenderer(
                'update-status',
                response.status === 429
                    ? 'Groq rate limit reached — wait a moment or upgrade your Groq tier'
                    : `Groq error: ${response.status}`
            );
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let isFirst = true;
        let usageInfo = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        if (json.usage) usageInfo = json.usage;
                        const token = json.choices?.[0]?.delta?.content || '';
                        if (token) {
                            fullText += token;
                            const displayText = stripThinkingTags(fullText);
                            if (displayText) {
                                sendToRenderer(isFirst ? 'new-response' : 'update-response', displayText);
                                isFirst = false;
                            }
                        }
                    } catch (parseError) {
                        // Skip invalid JSON chunks
                    }
                }
            }
        }

        const cleanedResponse = stripThinkingTags(fullText);
        const modelKey = modelToUse.split('/').pop();

        const systemPromptChars = (currentSystemPrompt || 'You are a helpful assistant.').length;
        const historyChars = groqConversationHistory.reduce((sum, msg) => sum + (msg.content || '').length, 0);
        const inputChars = systemPromptChars + historyChars;
        const outputChars = cleanedResponse.length;

        incrementCharUsage('groq', modelKey, inputChars + outputChars);
        recordTextUsage('groq', modelKey, usageInfo, { inputChars, outputChars });

        if (cleanedResponse) {
            groqConversationHistory.push({
                role: 'assistant',
                content: cleanedResponse,
            });

            saveConversationTurn(transcription, cleanedResponse);
        }

        console.log(`Groq response completed (${modelToUse})`);
        sendToRenderer('update-status', 'Listening...');
    } catch (error) {
        console.error('Error calling Groq API:', error);
        sendToRenderer('update-status', 'Groq error: ' + error.message);
    }
}

async function sendToGemma(transcription) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.log('No Gemini API key configured');
        return;
    }

    if (!transcription || transcription.trim() === '') {
        console.log('Empty transcription, skipping Gemma');
        return;
    }

    console.log('Sending to Gemma:', transcription.substring(0, 100) + '...');

    groqConversationHistory.push({
        role: 'user',
        content: transcription.trim(),
    });

    const trimmedHistory = trimConversationHistoryForGemma(groqConversationHistory, 42000);

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const messages = trimmedHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const systemPrompt = currentSystemPrompt || 'You are a helpful assistant.';
        const messagesWithSystem = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
            ...messages,
        ];

        const response = await ai.models.generateContentStream({
            model: 'gemma-4-26b-a4b-it',
            contents: messagesWithSystem,
        });

        let fullText = '';
        let isFirst = true;

        for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                sendToRenderer(isFirst ? 'new-response' : 'update-response', fullText);
                isFirst = false;
            }
        }

        const systemPromptChars = (currentSystemPrompt || 'You are a helpful assistant.').length;
        const historyChars = trimmedHistory.reduce((sum, msg) => sum + (msg.content || '').length, 0);
        const inputChars = systemPromptChars + historyChars;
        const outputChars = fullText.length;

        incrementCharUsage('gemini', 'gemma-4-26b-a4b-it', inputChars + outputChars);
        // Gemma runs on the free tier ($0) — record token estimate so the live counter still works.
        recordTextUsage('gemini', 'gemma', null, { inputChars, outputChars });

        if (fullText.trim()) {
            groqConversationHistory.push({
                role: 'assistant',
                content: fullText.trim(),
            });

            if (groqConversationHistory.length > 40) {
                groqConversationHistory = groqConversationHistory.slice(-40);
            }

            saveConversationTurn(transcription, fullText);
        }

        console.log('Gemma response completed');
        sendToRenderer('update-status', 'Listening...');
    } catch (error) {
        console.error('Error calling Gemma API:', error);
        sendToRenderer('update-status', 'Gemma error: ' + error.message);
    }
}

async function sendToOpenRouter(transcription, model) {
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
        console.log('No OpenRouter API key configured, skipping OpenRouter response');
        return;
    }

    if (!transcription || transcription.trim() === '') {
        console.log('Empty transcription, skipping OpenRouter');
        return;
    }

    const modelToUse = model || 'meta-llama/llama-3.3-70b-instruct';
    console.log(`Sending to OpenRouter (${modelToUse}):`, transcription.substring(0, 100) + '...');

    groqConversationHistory.push({
        role: 'user',
        content: transcription.trim(),
    });

    if (groqConversationHistory.length > 20) {
        groqConversationHistory = groqConversationHistory.slice(-20);
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://helping-hands.app',
                'X-Title': 'Helping Hands',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [{ role: 'system', content: currentSystemPrompt || 'You are a helpful assistant.' }, ...groqConversationHistory],
                stream: true,
                stream_options: { include_usage: true },
                usage: { include: true }, // OpenRouter returns the exact per-request cost in the usage chunk
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', response.status, errorText);
            sendToRenderer('update-status', `OpenRouter error: ${response.status}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let isFirst = true;
        let usageInfo = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        if (json.usage) usageInfo = json.usage;
                        const token = json.choices?.[0]?.delta?.content || '';
                        if (token) {
                            fullText += token;
                            const displayText = stripThinkingTags(fullText);
                            if (displayText) {
                                sendToRenderer(isFirst ? 'new-response' : 'update-response', displayText);
                                isFirst = false;
                            }
                        }
                    } catch (parseError) {
                        // Skip invalid JSON chunks
                    }
                }
            }
        }

        const cleanedResponse = stripThinkingTags(fullText);

        const orSystemChars = (currentSystemPrompt || 'You are a helpful assistant.').length;
        const orHistoryChars = groqConversationHistory.reduce((sum, msg) => sum + (msg.content || '').length, 0);
        recordTextUsage('openrouter', modelToUse, usageInfo, { inputChars: orSystemChars + orHistoryChars, outputChars: cleanedResponse.length });

        if (cleanedResponse) {
            groqConversationHistory.push({
                role: 'assistant',
                content: cleanedResponse,
            });

            saveConversationTurn(transcription, cleanedResponse);
        }

        console.log(`OpenRouter response completed (${modelToUse})`);
        sendToRenderer('update-status', 'Listening...');
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        sendToRenderer('update-status', 'OpenRouter error: ' + error.message);
    }
}

async function sendToDeepSeek(transcription) {
    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
        console.log('No DeepSeek API key configured, skipping DeepSeek response');
        return;
    }

    if (!transcription || transcription.trim() === '') {
        console.log('Empty transcription, skipping DeepSeek');
        return;
    }

    const modelToUse = 'deepseek-chat';
    console.log(`Sending to DeepSeek (${modelToUse}):`, transcription.substring(0, 100) + '...');

    groqConversationHistory.push({
        role: 'user',
        content: transcription.trim(),
    });

    if (groqConversationHistory.length > 20) {
        groqConversationHistory = groqConversationHistory.slice(-20);
    }

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [{ role: 'system', content: currentSystemPrompt || 'You are a helpful assistant.' }, ...groqConversationHistory],
                stream: true,
                stream_options: { include_usage: true },
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', response.status, errorText);
            sendToRenderer('update-status', `DeepSeek error: ${response.status}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let isFirst = true;
        let usageInfo = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        if (json.usage) usageInfo = json.usage;
                        const token = json.choices?.[0]?.delta?.content || '';
                        if (token) {
                            fullText += token;
                            const displayText = stripThinkingTags(fullText);
                            if (displayText) {
                                sendToRenderer(isFirst ? 'new-response' : 'update-response', displayText);
                                isFirst = false;
                            }
                        }
                    } catch (parseError) {
                        // Skip invalid JSON chunks
                    }
                }
            }
        }

        const cleanedResponse = stripThinkingTags(fullText);

        const dsSystemChars = (currentSystemPrompt || 'You are a helpful assistant.').length;
        const dsHistoryChars = groqConversationHistory.reduce((sum, msg) => sum + (msg.content || '').length, 0);
        recordTextUsage('deepseek', modelToUse, usageInfo, { inputChars: dsSystemChars + dsHistoryChars, outputChars: cleanedResponse.length });

        if (cleanedResponse) {
            groqConversationHistory.push({
                role: 'assistant',
                content: cleanedResponse,
            });

            saveConversationTurn(transcription, cleanedResponse);
        }

        console.log(`DeepSeek response completed (${modelToUse})`);
        sendToRenderer('update-status', 'Listening...');
    } catch (error) {
        console.error('Error calling DeepSeek API:', error);
        sendToRenderer('update-status', 'DeepSeek error: ' + error.message);
    }
}

// Route a finished transcript to the configured text provider to generate an answer.
// Shared by the Gemini Live path (on generationComplete) and the Speechmatics path
// (on end-of-utterance) so answer generation behaves identically regardless of how
// the audio was transcribed.
function triggerAnswerGeneration(transcript) {
    if (!transcript || transcript.trim() === '') return;

    const providerConfig = getProviderConfig();
    const textProvider = providerConfig.text || 'groq';

    if (textProvider === 'openrouter') {
        const prefs = getPreferences();
        sendToOpenRouter(transcript, prefs.openrouterTextModel);
    } else if (textProvider === 'deepseek') {
        sendToDeepSeek(transcript);
    } else if (textProvider === 'ollama') {
        getLocalAi().sendLocalText(transcript);
    } else if (textProvider === 'gemini') {
        sendToGemma(transcript);
    } else if (hasGroqKey()) {
        sendToGroq(transcript);
    } else {
        sendToGemma(transcript);
    }
}

async function initializeGeminiSession(apiKey, customPrompt = '', profile = 'interview', language = 'en-US', isReconnect = false) {
    if (isInitializingSession) {
        console.log('Session initialization already in progress');
        return false;
    }

    isInitializingSession = true;
    if (!isReconnect) {
        sendToRenderer('session-initializing', true);
    }

    // Store params for reconnection
    if (!isReconnect) {
        sessionParams = { apiKey, customPrompt, profile, language };
        reconnectAttempts = 0;
    }

    const client = new GoogleGenAI({
        vertexai: false,
        apiKey: apiKey,
        httpOptions: { apiVersion: 'v1alpha' },
    });

    // Get enabled tools first to determine Google Search status
    const enabledTools = await getEnabledTools();
    const googleSearchEnabled = enabledTools.some(tool => tool.googleSearch);

    const stylePrefs = getPreferences();
    const systemPrompt = getSystemPrompt(profile, customPrompt, googleSearchEnabled, {
        answerFormat: stylePrefs.answerFormat,
        desiMode: stylePrefs.desiMode,
        resume: stylePrefs.resume,
    });
    currentSystemPrompt = systemPrompt; // Store for Groq

    // Initialize new conversation session only on first connect
    if (!isReconnect) {
        initializeNewSession(profile, customPrompt);
    }

    // If text or image provider is Ollama, initialize Ollama client
    const providerConfig = getProviderConfig();
    if (providerConfig.text === 'ollama' || providerConfig.image === 'ollama') {
        const prefs = require('../storage').getPreferences();
        const ollamaHost = prefs.ollamaHost || 'http://127.0.0.1:11434';
        const ollamaModel = prefs.ollamaModel || 'llama3.1';
        await getLocalAi().initializeOllamaOnly(ollamaHost, ollamaModel);
    }

    try {
        const session = await client.live.connect({
            model: 'gemini-3.1-flash-live-preview',
            callbacks: {
                onopen: function () {
                    sendToRenderer('update-status', 'Live session connected');
                },
                onmessage: function (message) {
                    console.log('----------------', message);

                    // Handle input transcription (what was spoken)
                    if (message.serverContent?.inputTranscription?.results) {
                        currentTranscription += formatSpeakerResults(message.serverContent.inputTranscription.results);
                        sendToRenderer('update-transcript', currentTranscription);
                    } else if (message.serverContent?.inputTranscription?.text) {
                        const text = message.serverContent.inputTranscription.text;
                        if (text.trim() !== '') {
                            currentTranscription += text;
                            sendToRenderer('update-transcript', currentTranscription);
                        }
                    }

                    // DISABLED: Gemini's outputTranscription - using Groq for faster responses instead
                    // if (message.serverContent?.outputTranscription?.text) { ... }

                    if (message.serverContent?.generationComplete) {
                        if (currentTranscription.trim() !== '') {
                            triggerAnswerGeneration(currentTranscription);
                            currentTranscription = '';
                        }
                        messageBuffer = '';
                    }

                    if (message.serverContent?.turnComplete) {
                        sendToRenderer('update-status', 'Listening...');
                    }
                },
                onerror: function (e) {
                    console.log('Session error:', e.message);
                    sendToRenderer('update-status', 'Error: ' + e.message);
                },
                onclose: function (e) {
                    console.log('Session closed:', e.reason);

                    // Don't reconnect if user intentionally closed
                    if (isUserClosing) {
                        isUserClosing = false;
                        sendToRenderer('update-status', 'Session closed');
                        return;
                    }

                    // Attempt reconnection
                    if (sessionParams && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        attemptReconnect();
                    } else {
                        sendToRenderer('update-status', 'Session closed');
                    }
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                proactivity: { proactiveAudio: true },
                outputAudioTranscription: {},
                tools: enabledTools,
                // Enable speaker diarization
                inputAudioTranscription: {
                    enableSpeakerDiarization: true,
                    minSpeakerCount: 2,
                    maxSpeakerCount: 2,
                },
                contextWindowCompression: { slidingWindow: {} },
                speechConfig: { languageCode: language },
                systemInstruction: {
                    parts: [{ text: systemPrompt }],
                },
            },
        });

        isInitializingSession = false;
        if (!isReconnect) {
            sendToRenderer('session-initializing', false);
        }
        return session;
    } catch (error) {
        console.error('Failed to initialize Gemini session:', error);
        isInitializingSession = false;
        if (!isReconnect) {
            sendToRenderer('session-initializing', false);
        }
        return null;
    }
}

async function attemptReconnect() {
    reconnectAttempts++;
    console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

    // Clear stale buffers
    messageBuffer = '';
    currentTranscription = '';
    // Don't reset groqConversationHistory to preserve context across reconnects

    sendToRenderer('update-status', `Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    // Wait before attempting
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));

    try {
        const session = await initializeGeminiSession(
            sessionParams.apiKey,
            sessionParams.customPrompt,
            sessionParams.profile,
            sessionParams.language,
            true // isReconnect
        );

        if (session && global.geminiSessionRef) {
            global.geminiSessionRef.current = session;

            // Restore context from conversation history via text message
            const contextMessage = buildContextMessage();
            if (contextMessage) {
                try {
                    console.log('Restoring conversation context...');
                    await session.sendRealtimeInput({ text: contextMessage });
                } catch (contextError) {
                    console.error('Failed to restore context:', contextError);
                    // Continue without context - better than failing
                }
            }

            // Don't reset reconnectAttempts here - let it reset on next fresh session
            sendToRenderer('update-status', 'Reconnected! Listening...');
            console.log('Session reconnected successfully');
            return true;
        }
    } catch (error) {
        console.error(`Reconnection attempt ${reconnectAttempts} failed:`, error);
    }

    // If we still have attempts left, try again
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        return attemptReconnect();
    }

    // Max attempts reached - notify frontend
    console.log('Max reconnection attempts reached');
    sendToRenderer('reconnect-failed', {
        message: 'Tried 3 times to reconnect. Must be upstream/network issues. Try restarting or download updated app from site.',
    });
    sessionParams = null;
    return false;
}

function killExistingSystemAudioDump() {
    return new Promise(resolve => {
        console.log('Checking for existing SystemAudioDump processes...');

        // Kill any existing SystemAudioDump processes
        const killProc = spawn('pkill', ['-f', 'SystemAudioDump'], {
            stdio: 'ignore',
        });

        killProc.on('close', code => {
            if (code === 0) {
                console.log('Killed existing SystemAudioDump processes');
            } else {
                console.log('No existing SystemAudioDump processes found');
            }
            resolve();
        });

        killProc.on('error', err => {
            console.log('Error checking for existing processes (this is normal):', err.message);
            resolve();
        });

        // Timeout after 2 seconds
        setTimeout(() => {
            killProc.kill();
            resolve();
        }, 2000);
    });
}

async function startMacOSAudioCapture(geminiSessionRef) {
    if (process.platform !== 'darwin') return false;

    // Kill any existing SystemAudioDump processes first
    await killExistingSystemAudioDump();

    console.log('Starting macOS audio capture with SystemAudioDump...');

    const { app } = require('electron');
    const path = require('path');

    let systemAudioPath;
    if (app.isPackaged) {
        systemAudioPath = path.join(process.resourcesPath, 'SystemAudioDump');
    } else {
        systemAudioPath = path.join(__dirname, '../assets', 'SystemAudioDump');
    }

    console.log('SystemAudioDump path:', systemAudioPath);

    const spawnOptions = {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...process.env,
        },
    };

    systemAudioProc = spawn(systemAudioPath, [], spawnOptions);

    if (!systemAudioProc.pid) {
        console.error('Failed to start SystemAudioDump');
        return false;
    }

    console.log('SystemAudioDump started with PID:', systemAudioProc.pid);

    const CHUNK_DURATION = 0.1;
    const SAMPLE_RATE = 24000;
    const BYTES_PER_SAMPLE = 2;
    const CHANNELS = 2;
    const CHUNK_SIZE = SAMPLE_RATE * BYTES_PER_SAMPLE * CHANNELS * CHUNK_DURATION;

    let audioBuffer = Buffer.alloc(0);

    systemAudioProc.stdout.on('data', data => {
        audioBuffer = Buffer.concat([audioBuffer, data]);

        while (audioBuffer.length >= CHUNK_SIZE) {
            const chunk = audioBuffer.slice(0, CHUNK_SIZE);
            audioBuffer = audioBuffer.slice(CHUNK_SIZE);

            const monoChunk = CHANNELS === 2 ? convertStereoToMono(chunk) : chunk;

            if (currentProviderMode === 'cloud') {
                sendCloudAudio(monoChunk);
            } else if (currentProviderMode === 'local') {
                getLocalAi().processLocalAudio(monoChunk);
            } else if (currentProviderMode === 'speechmatics') {
                getSpeechmatics().sendAudio(monoChunk.toString('base64'));
            } else {
                const base64Data = monoChunk.toString('base64');
                sendAudioToGemini(base64Data, geminiSessionRef);
            }

            if (process.env.DEBUG_AUDIO) {
                console.log(`Processed audio chunk: ${chunk.length} bytes`);
                saveDebugAudio(monoChunk, 'system_audio');
            }
        }

        const maxBufferSize = SAMPLE_RATE * BYTES_PER_SAMPLE * 1;
        if (audioBuffer.length > maxBufferSize) {
            audioBuffer = audioBuffer.slice(-maxBufferSize);
        }
    });

    systemAudioProc.stderr.on('data', data => {
        console.error('SystemAudioDump stderr:', data.toString());
    });

    systemAudioProc.on('close', code => {
        console.log('SystemAudioDump process closed with code:', code);
        systemAudioProc = null;
    });

    systemAudioProc.on('error', err => {
        console.error('SystemAudioDump process error:', err);
        systemAudioProc = null;
    });

    return true;
}

function convertStereoToMono(stereoBuffer) {
    const samples = stereoBuffer.length / 4;
    const monoBuffer = Buffer.alloc(samples * 2);

    for (let i = 0; i < samples; i++) {
        const leftSample = stereoBuffer.readInt16LE(i * 4);
        monoBuffer.writeInt16LE(leftSample, i * 2);
    }

    return monoBuffer;
}

function stopMacOSAudioCapture() {
    if (systemAudioProc) {
        console.log('Stopping SystemAudioDump...');
        systemAudioProc.kill('SIGTERM');
        systemAudioProc = null;
    }
}

async function sendAudioToGemini(base64Data, geminiSessionRef) {
    if (!geminiSessionRef.current) return;

    try {
        process.stdout.write('.');
        await geminiSessionRef.current.sendRealtimeInput({
            audio: {
                data: base64Data,
                mimeType: 'audio/pcm;rate=24000',
            },
        });
    } catch (error) {
        console.error('Error sending audio to Gemini:', error);
    }
}

// Errors Google returns transiently when a model is overloaded/rate-limited.
// These are worth retrying (and falling back to another model) rather than
// surfacing straight to the user.
function isTransientGeminiError(error) {
    const status = error?.status || error?.code;
    if (status === 503 || status === 429 || status === 500) return true;
    const msg = String(error?.message || '');
    return /503|UNAVAILABLE|overloaded|high demand|rate limit|RESOURCE_EXHAUSTED|try again later/i.test(
        msg
    );
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function sendImageToGeminiHttp(base64Data, prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return { success: false, error: 'No API key configured' };
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const contents = [
        {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
            },
        },
        { text: prompt },
    ];

    // Pick the rate-limit-aware model first, then fall back to the alternate
    // Flash variant if the primary keeps coming back overloaded.
    const primaryModel = getAvailableModel();
    const fallbackModel =
        primaryModel === 'gemini-2.5-flash' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
    const modelsToTry = [primaryModel, fallbackModel];

    const MAX_ATTEMPTS = 3;
    let lastError = null;

    for (const model of modelsToTry) {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                console.log(
                    `Sending image to ${model} (streaming, attempt ${attempt}/${MAX_ATTEMPTS})...`
                );
                const response = await ai.models.generateContentStream({
                    model: model,
                    contents: contents,
                });

                // Increment count after successful call
                incrementLimitCount(model);

                // Stream the response
                let fullText = '';
                let isFirst = true;
                for await (const chunk of response) {
                    const chunkText = chunk.text;
                    if (chunkText) {
                        fullText += chunkText;
                        // Send to renderer - new response for first chunk, update for subsequent
                        sendToRenderer(isFirst ? 'new-response' : 'update-response', fullText);
                        isFirst = false;
                    }
                }

                console.log(`Image response completed from ${model}`);

                // Save screen analysis to history
                saveScreenAnalysis(prompt, fullText, model);

                return { success: true, text: fullText, model: model };
            } catch (error) {
                lastError = error;

                if (!isTransientGeminiError(error)) {
                    // Permanent error (bad key, invalid request, etc.) - don't retry.
                    console.error('Error sending image to Gemini HTTP:', error);
                    return { success: false, error: error.message };
                }

                const moreAttempts = attempt < MAX_ATTEMPTS;
                console.warn(
                    `Gemini ${model} overloaded (transient). ${
                        moreAttempts ? 'Retrying' : 'Giving up on this model'
                    }...`
                );
                if (moreAttempts) {
                    // Exponential backoff: 1s, 2s
                    await sleep(1000 * attempt);
                }
            }
        }
    }

    console.error('Error sending image to Gemini HTTP (all retries exhausted):', lastError);
    return {
        success: false,
        error: 'Gemini is overloaded right now. Please try analyzing the screen again in a moment.',
    };
}

async function sendImageToOpenRouter(base64Data, prompt, model) {
    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
        return { success: false, error: 'No OpenRouter API key configured' };
    }

    const modelToUse = model || 'meta-llama/llama-3.3-70b-instruct';

    try {
        console.log(`Sending image to OpenRouter (${modelToUse})...`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://helping-hands.app',
                'X-Title': 'Helping Hands',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
                            },
                        ],
                    },
                ],
                stream: true,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter image API error:', response.status, errorText);
            return { success: false, error: `OpenRouter error: ${response.status}` };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let isFirst = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        const token = json.choices?.[0]?.delta?.content || '';
                        if (token) {
                            fullText += token;
                            sendToRenderer(isFirst ? 'new-response' : 'update-response', fullText);
                            isFirst = false;
                        }
                    } catch (parseError) {
                        // Skip invalid JSON chunks
                    }
                }
            }
        }

        console.log(`OpenRouter image response completed (${modelToUse})`);
        saveScreenAnalysis(prompt, fullText, `openrouter/${modelToUse}`);
        return { success: true, text: fullText, model: `openrouter/${modelToUse}` };
    } catch (error) {
        console.error('Error sending image to OpenRouter:', error);
        return { success: false, error: error.message };
    }
}

async function sendImageToDeepSeek(base64Data, prompt) {
    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
        return { success: false, error: 'No DeepSeek API key configured' };
    }

    const modelToUse = 'deepseek-chat';

    try {
        console.log(`Sending image to DeepSeek (${modelToUse})...`);
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
                            },
                        ],
                    },
                ],
                stream: true,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek image API error:', response.status, errorText);
            return { success: false, error: `DeepSeek error: ${response.status}` };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let isFirst = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        const token = json.choices?.[0]?.delta?.content || '';
                        if (token) {
                            fullText += token;
                            sendToRenderer(isFirst ? 'new-response' : 'update-response', fullText);
                            isFirst = false;
                        }
                    } catch (parseError) {
                        // Skip invalid JSON chunks
                    }
                }
            }
        }

        console.log(`DeepSeek image response completed (${modelToUse})`);
        saveScreenAnalysis(prompt, fullText, `deepseek/${modelToUse}`);
        return { success: true, text: fullText, model: `deepseek/${modelToUse}` };
    } catch (error) {
        console.error('Error sending image to DeepSeek:', error);
        return { success: false, error: error.message };
    }
}

function setupGeminiIpcHandlers(geminiSessionRef) {
    // Store the geminiSessionRef globally for reconnection access
    global.geminiSessionRef = geminiSessionRef;

    ipcMain.handle('initialize-cloud', async (event, token, profile, userContext) => {
        try {
            currentProviderMode = 'cloud';
            initializeNewSession(profile);
            setOnTurnComplete((transcription, response) => {
                saveConversationTurn(transcription, response);
            });
            sendToRenderer('session-initializing', true);
            await connectCloud(token, profile, userContext);
            sendToRenderer('session-initializing', false);
            return true;
        } catch (err) {
            console.error('[Cloud] Init error:', err);
            currentProviderMode = 'api';
            sendToRenderer('session-initializing', false);
            return false;
        }
    });

    ipcMain.handle('initialize-gemini', async (event, apiKey, customPrompt, profile = 'interview', language = 'en-US') => {
        currentProviderMode = 'api';
        const session = await initializeGeminiSession(apiKey, customPrompt, profile, language);
        if (session) {
            geminiSessionRef.current = session;
            return true;
        }
        return false;
    });

    ipcMain.handle('initialize-local', async (event, ollamaHost, ollamaModel, whisperModel, profile, customPrompt) => {
        currentProviderMode = 'local';
        const success = await getLocalAi().initializeLocalSession(ollamaHost, ollamaModel, whisperModel, profile, customPrompt);
        if (!success) {
            currentProviderMode = 'api';
        }
        return success;
    });

    ipcMain.handle('initialize-speechmatics', async (event, apiKey, profile = 'interview', language = 'en-US', customPrompt = '') => {
        currentProviderMode = 'speechmatics';
        sendToRenderer('session-initializing', true);
        // Set up a fresh conversation session so turns are tracked and saved.
        initializeNewSession(profile, customPrompt);
        // Speechmatics only transcribes — the answer is generated by the configured text
        // provider (Groq/Gemma/etc.), which reads currentSystemPrompt. Set it here since
        // the Gemini Live session (which normally sets it) is not started in this mode.
        const smStylePrefs = getPreferences();
        currentSystemPrompt = getSystemPrompt(profile, customPrompt, false, {
            answerFormat: smStylePrefs.answerFormat,
            desiMode: smStylePrefs.desiMode,
            resume: smStylePrefs.resume,
        });
        // If the text/image provider is Ollama, make sure its client is initialized.
        const smProviderConfig = getProviderConfig();
        if (smProviderConfig.text === 'ollama' || smProviderConfig.image === 'ollama') {
            const prefs = getPreferences();
            await getLocalAi().initializeOllamaOnly(
                prefs.ollamaHost || 'http://127.0.0.1:11434',
                prefs.ollamaModel || 'llama3.1'
            );
        }
        // Speechmatics streams audio for the whole session — track it for cost estimation.
        markAudioProvider('speechmatics');
        emitLiveCost(); // show the live cost counter from the start (audio accrues immediately)
        const success = await getSpeechmatics().initSpeechmatics(apiKey, { language, profile, customPrompt });
        sendToRenderer('session-initializing', false);
        if (!success) {
            currentProviderMode = 'api';
        }
        return success;
    });

    ipcMain.handle('send-audio-content', async (event, { data, mimeType }) => {
        if (currentProviderMode === 'cloud') {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                sendCloudAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending cloud audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (currentProviderMode === 'local') {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                getLocalAi().processLocalAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending local audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (currentProviderMode === 'speechmatics') {
            getSpeechmatics().sendAudio(data);
            return { success: true };
        }
        if (!geminiSessionRef.current) return { success: false, error: 'No active Gemini session' };
        try {
            process.stdout.write('.');
            await geminiSessionRef.current.sendRealtimeInput({
                audio: { data: data, mimeType: mimeType },
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending system audio:', error);
            return { success: false, error: error.message };
        }
    });

    // Handle microphone audio on a separate channel
    ipcMain.handle('send-mic-audio-content', async (event, { data, mimeType }) => {
        if (currentProviderMode === 'cloud') {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                sendCloudAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending cloud mic audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (currentProviderMode === 'local') {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                getLocalAi().processLocalAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending local mic audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (currentProviderMode === 'speechmatics') {
            getSpeechmatics().sendAudio(data);
            return { success: true };
        }
        if (!geminiSessionRef.current) return { success: false, error: 'No active Gemini session' };
        try {
            process.stdout.write(',');
            await geminiSessionRef.current.sendRealtimeInput({
                audio: { data: data, mimeType: mimeType },
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending mic audio:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('send-image-content', async (event, { data, prompt }) => {
        try {
            if (!data || typeof data !== 'string') {
                console.error('Invalid image data received');
                return { success: false, error: 'Invalid image data' };
            }

            // Apply the user's answer-style preferences (bullets / Desi mode) to screenshot answers too.
            const imgPrefs = getPreferences();
            const styleModifiers = buildAnswerModifiers({
                answerFormat: imgPrefs.answerFormat,
                desiMode: imgPrefs.desiMode,
            });
            if (styleModifiers && typeof prompt === 'string') {
                prompt = prompt + styleModifiers;
            }

            const buffer = Buffer.from(data, 'base64');

            if (buffer.length < 1000) {
                console.error(`Image buffer too small: ${buffer.length} bytes`);
                return { success: false, error: 'Image buffer too small' };
            }

            process.stdout.write('!');

            if (currentProviderMode === 'cloud') {
                const sent = sendCloudImage(data);
                if (!sent) {
                    return { success: false, error: 'Cloud connection not active' };
                }
                return { success: true, model: 'cloud' };
            }

            if (currentProviderMode === 'local') {
                const result = await getLocalAi().sendLocalImage(data, prompt);
                return result;
            }

            // Route based on image provider config
            const providerConfig = getProviderConfig();
            const imageProvider = providerConfig.image || 'gemini';

            if (imageProvider === 'openrouter') {
                const prefs = getPreferences();
                return await sendImageToOpenRouter(data, prompt, prefs.openrouterImageModel);
            } else if (imageProvider === 'deepseek') {
                return await sendImageToDeepSeek(data, prompt);
            } else if (imageProvider === 'ollama') {
                return await getLocalAi().sendLocalImage(data, prompt);
            } else {
                // Default: use Gemini HTTP API
                return await sendImageToGeminiHttp(data, prompt);
            }
        } catch (error) {
            console.error('Error sending image:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('send-text-message', async (event, text) => {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return { success: false, error: 'Invalid text message' };
        }

        if (currentProviderMode === 'cloud') {
            try {
                console.log('Sending text to cloud:', text);
                sendCloudText(text.trim());
                return { success: true };
            } catch (error) {
                console.error('Error sending cloud text:', error);
                return { success: false, error: error.message };
            }
        }

        if (currentProviderMode === 'local') {
            try {
                console.log('Sending text to local Ollama:', text);
                return await getLocalAi().sendLocalText(text.trim());
            } catch (error) {
                console.error('Error sending local text:', error);
                return { success: false, error: error.message };
            }
        }

        // Speechmatics only transcribes audio — there is no live session for text. Route the
        // typed message straight to the configured text provider (Groq/Gemma/etc.) for an answer.
        if (currentProviderMode === 'speechmatics') {
            try {
                console.log('Sending text (speechmatics mode):', text);
                triggerAnswerGeneration(text.trim());
                return { success: true };
            } catch (error) {
                console.error('Error sending speechmatics text:', error);
                return { success: false, error: error.message };
            }
        }

        if (!geminiSessionRef.current) return { success: false, error: 'No active Gemini session' };

        try {
            console.log('Sending text message:', text);

            // Route based on text provider config
            const providerConfig = getProviderConfig();
            const textProvider = providerConfig.text || 'groq';

            if (textProvider === 'openrouter') {
                const prefs = getPreferences();
                sendToOpenRouter(text.trim(), prefs.openrouterTextModel);
            } else if (textProvider === 'deepseek') {
                sendToDeepSeek(text.trim());
            } else if (textProvider === 'ollama') {
                getLocalAi().sendLocalText(text.trim());
            } else if (textProvider === 'gemini') {
                sendToGemma(text.trim());
            } else if (hasGroqKey()) {
                sendToGroq(text.trim());
            } else {
                sendToGemma(text.trim());
            }

            await geminiSessionRef.current.sendRealtimeInput({ text: text.trim() });
            return { success: true };
        } catch (error) {
            console.error('Error sending text:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('start-macos-audio', async event => {
        if (process.platform !== 'darwin') {
            return {
                success: false,
                error: 'macOS audio capture only available on macOS',
            };
        }

        try {
            const success = await startMacOSAudioCapture(geminiSessionRef);
            return { success };
        } catch (error) {
            console.error('Error starting macOS audio capture:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stop-macos-audio', async event => {
        try {
            stopMacOSAudioCapture();
            return { success: true };
        } catch (error) {
            console.error('Error stopping macOS audio capture:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('close-session', async event => {
        try {
            stopMacOSAudioCapture();

            // Reconcile + persist the real cost before tearing anything down.
            const cost = await finalizeSessionCost();

            if (currentProviderMode === 'cloud') {
                closeCloud();
                currentProviderMode = 'api';
                return { success: true, cost };
            }

            if (currentProviderMode === 'local') {
                getLocalAi().closeLocalSession();
                currentProviderMode = 'api';
                return { success: true, cost };
            }

            if (currentProviderMode === 'speechmatics') {
                await getSpeechmatics().closeSpeechmatics();
                currentProviderMode = 'api';
                return { success: true, cost };
            }

            // Set flag to prevent reconnection attempts
            isUserClosing = true;
            sessionParams = null;

            // Cleanup session
            if (geminiSessionRef.current) {
                await geminiSessionRef.current.close();
                geminiSessionRef.current = null;
            }

            return { success: true, cost };
        } catch (error) {
            console.error('Error closing session:', error);
            return { success: false, error: error.message };
        }
    });

    // Conversation history IPC handlers
    ipcMain.handle('get-current-session', async event => {
        try {
            return { success: true, data: getCurrentSessionData() };
        } catch (error) {
            console.error('Error getting current session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('start-new-session', async event => {
        try {
            initializeNewSession();
            return { success: true, sessionId: currentSessionId };
        } catch (error) {
            console.error('Error starting new session:', error);
            return { success: false, error: error.message };
        }
    });

    // Manually trigger an answer from whatever has been transcribed so far (toolbar "Answer").
    // The renderer passes the transcript it is displaying (this.liveTranscript), which works for
    // every audio provider (Gemini Live, Speechmatics, etc.); fall back to gemini's accumulator.
    ipcMain.handle('force-answer', async (event, transcript) => {
        try {
            let text = (transcript || '').trim();
            if (currentProviderMode === 'speechmatics') {
                // Answer the LAST asked question, not the whole running conversation.
                const sm = getSpeechmatics();
                text = sm.getLastUtterance() || sm.getConversation() || text;
            } else if (!text) {
                text = currentTranscription;
            }
            triggerAnswerGeneration(text); // self-guards empty transcript
            return { success: true };
        } catch (error) {
            console.error('Error forcing answer:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('update-google-search-setting', async (event, enabled) => {
        try {
            console.log('Google Search setting updated to:', enabled);
            // The setting is already saved in localStorage by the renderer
            // This is just for logging/confirmation
            return { success: true };
        } catch (error) {
            console.error('Error updating Google Search setting:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = {
    initializeGeminiSession,
    getEnabledTools,
    getStoredSetting,
    sendToRenderer,
    initializeNewSession,
    saveConversationTurn,
    getCurrentSessionData,
    killExistingSystemAudioDump,
    startMacOSAudioCapture,
    convertStereoToMono,
    stopMacOSAudioCapture,
    sendAudioToGemini,
    sendImageToGeminiHttp,
    setupGeminiIpcHandlers,
    formatSpeakerResults,
    triggerAnswerGeneration,
};
