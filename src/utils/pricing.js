// pricing.js — turns a session's measured API usage into a REAL cost (not an estimate).
//
// Prices come from LiteLLM's community price map, which is updated daily and covers
// DeepSeek / Gemini / OpenRouter / etc. We cache it on disk and refresh every 24h, so
// the per-token rates track whatever the providers currently charge. Token counts are
// read from each provider's own usage report, so cost = (real tokens) × (current rate)
// = exactly what you are billed. At session end we additionally reconcile against
// DeepSeek's account balance (the literal money that left your account).
//
// The only knobs you might edit: USD_TO_INR (fx rate) and SPEECHMATICS_PER_MINUTE
// (0 while you're on the free plan — set your rate here if you upgrade).

const os = require('os');
const path = require('path');
const fs = require('fs');

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // refresh the price map once a day

// Approximate FX for display alongside USD. Currency conversion is inherently a moving
// number; the USD figure is the authoritative one. Edit to your current rate.
const USD_TO_INR = 88;
const CURRENCY_TO_INR = { USD: 88, CNY: 12.2, INR: 1 };
const CURRENCY_SYMBOL = { USD: '$', CNY: '¥', INR: '₹', EUR: '€' };

// Speechmatics has no cost API. You're on the free plan, so audio is $0. If you move to a
// paid plan, put your per-minute rate here (e.g. enhanced realtime ≈ 1.04/60).
const SPEECHMATICS_PER_MINUTE = 0;

// Providers whose usage is free in this app regardless of any list price.
const FREE_TEXT_KEYS = new Set(['gemini/gemma']); // gemma runs on Gemini's free tier
const FREE_PROVIDERS = new Set(['groq']); // Groq is used under a free daily quota here

// Minimal built-in rates so the very first run (before the LiteLLM cache exists) is still
// accurate for the providers this app bills on. Per-token USD. Refreshed values from
// LiteLLM override these as soon as the cache populates.
const FALLBACK_PRICES = {
    'deepseek/deepseek-v4-flash': { input_cost_per_token: 1.4e-7, output_cost_per_token: 2.8e-7, cache_read_input_token_cost: 1.4e-8 },
    'deepseek/deepseek-v4-pro': { input_cost_per_token: 4.35e-7, output_cost_per_token: 8.7e-7, cache_read_input_token_cost: 4.35e-8 },
    'deepseek/deepseek-chat': { input_cost_per_token: 2.8e-7, output_cost_per_token: 4.2e-7, cache_read_input_token_cost: 2.8e-8 },
    'deepseek/deepseek-reasoner': { input_cost_per_token: 2.8e-7, output_cost_per_token: 4.2e-7, cache_read_input_token_cost: 2.8e-8 },
    'gemini/gemini-2.0-flash': { input_cost_per_token: 1e-7, output_cost_per_token: 4e-7, cache_read_input_token_cost: 2.5e-8 },
};

let priceMap = null; // LiteLLM map: modelKey -> { input_cost_per_token, output_cost_per_token, cache_read_input_token_cost }
let priceMapFetchedAt = 0;
let refreshing = false;

function configDir() {
    const home = os.homedir();
    if (process.platform === 'win32') return path.join(home, 'AppData', 'Roaming', 'helping-hands-config');
    if (process.platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'helping-hands-config');
    return path.join(home, '.config', 'helping-hands-config');
}

function cachePath() {
    return path.join(configDir(), 'litellm-prices.json');
}

function loadCacheSync() {
    try {
        const raw = fs.readFileSync(cachePath(), 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
            priceMap = parsed.data;
            priceMapFetchedAt = parsed.fetchedAt || 0;
        }
    } catch (e) {
        // no cache yet — fallback table is used until the first refresh lands
    }
}

async function refreshPrices(force = false) {
    if (refreshing) return;
    const fresh = priceMapFetchedAt && Date.now() - priceMapFetchedAt < CACHE_TTL_MS;
    if (!force && priceMap && fresh) return;
    refreshing = true;
    try {
        const res = await fetch(LITELLM_URL);
        if (!res.ok) return;
        const data = await res.json();
        priceMap = data;
        priceMapFetchedAt = Date.now();
        try {
            fs.mkdirSync(configDir(), { recursive: true });
            fs.writeFileSync(cachePath(), JSON.stringify({ fetchedAt: priceMapFetchedAt, data }));
        } catch (e) {
            /* cache write is best-effort */
        }
    } catch (e) {
        // offline / GitHub unreachable — keep whatever we have (cache or fallback)
    } finally {
        refreshing = false;
    }
}

// Load cache immediately (sync) and kick off a background refresh if stale.
loadCacheSync();
refreshPrices().catch(() => {});

// Look up a model's per-token rates, trying the common key spellings.
function getModelPrice(provider, model) {
    const bare = String(model || '').split('/').pop();
    const candidates = [`${provider}/${model}`, model, `${provider}/${bare}`, bare];
    const maps = [priceMap, FALLBACK_PRICES];
    for (const map of maps) {
        if (!map) continue;
        for (const key of candidates) {
            const v = key && map[key];
            if (v && v.input_cost_per_token != null) return v;
        }
    }
    return null;
}

function fmtTokens(n) {
    return Math.round(n || 0).toLocaleString('en-US');
}

function formatUSD(v) {
    const n = v || 0;
    if (n === 0) return '$0';
    if (n < 0.01) return '$' + n.toFixed(4);
    if (n < 1) return '$' + n.toFixed(3);
    return '$' + n.toFixed(2);
}

function formatINR(v) {
    const n = v || 0;
    if (n === 0) return '₹0';
    if (n < 1) return '₹' + n.toFixed(2);
    if (n < 100) return '₹' + n.toFixed(1);
    return '₹' + Math.round(n).toLocaleString('en-IN');
}

function formatMoney(amount, currency) {
    const sym = CURRENCY_SYMBOL[currency] || currency + ' ';
    const n = amount || 0;
    if (n === 0) return sym + '0';
    if (n < 0.01) return sym + n.toFixed(4);
    if (n < 1) return sym + n.toFixed(3);
    return sym + n.toFixed(2);
}

function formatDuration(sec) {
    const s = Math.max(0, Math.round(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

// usage = {
//   text: { '<provider>/<model>': { provider, model, inputTokens, outputTokens, cachedInputTokens, requests, exactCostUSD? } },
//   audioProvider, audioSeconds, estimated,
//   actualCharged: { amount, currency } | null   // reconciled from DeepSeek balance
// }
function computeCost(usage = {}) {
    const text = usage.text || {};
    const lines = [];
    let totalUSD = 0;

    for (const key of Object.keys(text)) {
        const t = text[key] || {};
        const provider = t.provider || key.split('/')[0];
        const isFree = FREE_PROVIDERS.has(provider) || FREE_TEXT_KEYS.has(key);

        let usd = null;
        let note = '';
        if (typeof t.exactCostUSD === 'number') {
            usd = t.exactCostUSD; // provider reported an exact per-request cost (OpenRouter)
        } else if (isFree) {
            usd = 0;
            note = 'free — $0';
        } else {
            const price = getModelPrice(provider, t.model || key.split('/').slice(1).join('/'));
            if (price) {
                const cachedIn = t.cachedInputTokens || 0;
                const freshIn = Math.max(0, (t.inputTokens || 0) - cachedIn);
                const cacheRate = price.cache_read_input_token_cost != null ? price.cache_read_input_token_cost : price.input_cost_per_token;
                usd = freshIn * price.input_cost_per_token + cachedIn * cacheRate + (t.outputTokens || 0) * price.output_cost_per_token;
            } else {
                note = 'rate unavailable — refreshing prices';
            }
        }

        if (typeof usd === 'number') totalUSD += usd;
        lines.push({
            label: key,
            detail: `${fmtTokens(t.inputTokens)} in / ${fmtTokens(t.outputTokens)} out tok` + (t.requests ? ` · ${t.requests} calls` : ''),
            usd,
            usdText: typeof usd === 'number' ? formatUSD(usd) : '—',
            note,
        });
    }

    if (usage.audioProvider && usage.audioSeconds > 0) {
        const minutes = usage.audioSeconds / 60;
        const perMin = usage.audioProvider === 'speechmatics' ? SPEECHMATICS_PER_MINUTE : 0;
        const usd = minutes * perMin;
        totalUSD += usd;
        lines.push({
            label: usage.audioProvider === 'speechmatics' ? 'Speechmatics audio' : `${usage.audioProvider} audio`,
            detail: `${minutes.toFixed(1)} min audio`,
            usd,
            usdText: formatUSD(usd),
            note: perMin === 0 ? 'free plan — $0' : '',
        });
    }

    const totalINR = totalUSD * USD_TO_INR;
    const audioUsdPerSec = usage.audioProvider === 'speechmatics' ? SPEECHMATICS_PER_MINUTE / 60 : 0;

    // Reconciled "actually charged" figure from the provider's balance (definitive).
    let actualCharged = null;
    if (usage.actualCharged && typeof usage.actualCharged.amount === 'number') {
        const cur = usage.actualCharged.currency || 'USD';
        actualCharged = {
            amount: usage.actualCharged.amount,
            currency: cur,
            text: formatMoney(usage.actualCharged.amount, cur),
            inrText: formatINR(usage.actualCharged.amount * (CURRENCY_TO_INR[cur] || USD_TO_INR)),
        };
    }

    return {
        lines,
        totalUSD,
        totalINR,
        totalText: formatUSD(totalUSD),
        inrText: formatINR(totalINR),
        durationSec: Math.round((usage.durationSeconds != null ? usage.durationSeconds : usage.audioSeconds) || 0),
        durationText: formatDuration((usage.durationSeconds != null ? usage.durationSeconds : usage.audioSeconds) || 0),
        estimated: !!usage.estimated,
        pricesFetchedAt: priceMapFetchedAt || null,
        usdToInr: USD_TO_INR,
        audioUsdPerSec,
        actualCharged,
    };
}

module.exports = {
    computeCost,
    getModelPrice,
    refreshPrices,
    formatUSD,
    formatINR,
    formatMoney,
    formatDuration,
    USD_TO_INR,
};
