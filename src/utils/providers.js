// Provider registry — defines available providers, their capabilities, and models

const PROVIDERS = {
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        requiresApiKey: true,
        credentialKey: 'apiKey',
        tasks: ['audio', 'text', 'image'],
        models: {
            audio: 'gemini-3.1-flash-live-preview',
            text: 'gemma-4-26b-a4b-it',
            image: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
        },
        setupUrl: 'https://aistudio.google.com/apikey',
    },
    groq: {
        id: 'groq',
        name: 'Groq',
        requiresApiKey: true,
        credentialKey: 'groqApiKey',
        tasks: ['text'],
        models: {
            text: ['qwen/qwen3-32b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'moonshotai/kimi-k2-instruct'],
        },
        setupUrl: 'https://console.groq.com/keys',
    },
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        requiresApiKey: true,
        credentialKey: 'openrouterApiKey',
        tasks: ['text', 'image'],
        models: {
            text: ['meta-llama/llama-3.3-70b-instruct', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001', 'deepseek/deepseek-chat'],
            image: ['meta-llama/llama-3.3-70b-instruct', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001'],
        },
        setupUrl: 'https://openrouter.ai/keys',
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        requiresApiKey: true,
        credentialKey: 'deepseekApiKey',
        tasks: ['text', 'image'],
        models: {
            text: ['deepseek-chat', 'deepseek-reasoner'],
            image: ['deepseek-chat'],
        },
        setupUrl: 'https://platform.deepseek.com/api_keys',
    },
    ollama: {
        id: 'ollama',
        name: 'Ollama (Local)',
        requiresApiKey: false,
        tasks: ['text', 'image'],
        models: {
            text: ['llama3.1', 'gemma3:4b', 'mistral-small'],
            image: ['gemma3:4b'],
        },
        setupUrl: 'https://ollama.com/download',
    },
    'whisper-local': {
        id: 'whisper-local',
        name: 'Whisper (Local)',
        requiresApiKey: false,
        tasks: ['audio'],
        models: {
            audio: ['Xenova/whisper-tiny', 'Xenova/whisper-base', 'Xenova/whisper-small', 'Xenova/whisper-medium'],
        },
        setupUrl: null,
    },
    speechmatics: {
        id: 'speechmatics',
        name: 'Speechmatics',
        requiresApiKey: true,
        credentialKey: 'speechmaticsApiKey',
        tasks: ['audio'],
        models: {
            audio: 'enhanced',
        },
        setupUrl: 'https://portal.speechmatics.com/settings/api-keys',
    },
};

const TASK_LABELS = {
    audio: 'Audio Transcription',
    text: 'Text Generation',
    image: 'Image Analysis',
};

const TASK_DESCRIPTIONS = {
    audio: 'How audio is transcribed to text',
    text: 'How text responses are generated',
    image: 'How screenshots are analyzed',
};

function getProvidersForTask(task) {
    return Object.values(PROVIDERS).filter(p => p.tasks.includes(task));
}

function getProvider(id) {
    return PROVIDERS[id] || null;
}

function getProviderName(id) {
    return PROVIDERS[id]?.name || id;
}

function getProviderSetupUrl(id) {
    return PROVIDERS[id]?.setupUrl || null;
}

function getProviderModels(providerId, task) {
    const provider = PROVIDERS[providerId];
    if (!provider) return [];
    const models = provider.models[task];
    if (!models) return [];
    return Array.isArray(models) ? models : [models];
}

module.exports = {
    PROVIDERS,
    TASK_LABELS,
    TASK_DESCRIPTIONS,
    getProvidersForTask,
    getProvider,
    getProviderName,
    getProviderSetupUrl,
    getProviderModels,
};
