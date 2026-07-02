# Plan: Add AI Provider Selection (Mix & Match)

## Goal
Add OpenRouter and DeepSeek as Hosted AI providers, and allow users to mix providers per task (Audio STT, Text LLM, Image Vision) via settings page dropdowns.

## Current Architecture
- **Hosted AI mode**: Gemini Live (audio) → Groq/Gemma (text) → Gemini Flash (images)
- **Local mode**: Whisper (STT) → Ollama (LLM)
- Provider selection is a binary toggle (Hosted AI vs Local) on MainView

## Target Architecture
Users configure providers per task in Settings (CustomizeView):

| Task | Available Providers |
|------|-------------------|
| **Audio Transcription** | Gemini Live API, Whisper (local) |
| **Text Generation** | Gemini Gemma, Groq, OpenRouter, DeepSeek, Ollama |
| **Image Analysis** | Gemini Flash, OpenRouter, DeepSeek, Ollama |

## Files to Modify

### 1. `src/storage.js` — Add provider config defaults
- Add `providerConfig` to `DEFAULT_PREFERENCES`:
  ```js
  providerConfig: {
      audio: 'gemini',    // 'gemini' | 'whisper-local'
      text: 'groq',       // 'gemini' | 'groq' | 'openrouter' | 'deepseek' | 'ollama'
      image: 'gemini',    // 'gemini' | 'openrouter' | 'deepseek' | 'ollama'
  }
  ```
- Add `openrouterApiKey` and `deepseekApiKey` to `DEFAULT_CREDENTIALS`
- Add getter/setter functions for new credentials

### 2. `src/utils/providers.js` — NEW: Provider registry
Create a central provider registry defining:
- Provider ID, display name, API key requirement, supported tasks
- Model lists per provider (e.g., OpenRouter models, DeepSeek models)
- Validation logic (check if API key exists for a provider)

### 3. `src/components/views/CustomizeView.js` — Add provider selection UI
Add a new "AI Providers" section with three dropdowns:
- **Audio Provider**: Gemini Live / Whisper Local
- **Text Provider**: Gemini / Groq / OpenRouter / DeepSeek / Ollama
- **Image Provider**: Gemini / OpenRouter / DeepSeek / Ollama

Each dropdown shows only providers that support that task. When a provider requiring an API key is selected but no key is set, show a warning/link to enter the key.

### 4. `src/components/views/MainView.js` — Add API key inputs
Add input fields for OpenRouter and DeepSeek API keys in the Hosted AI mode section (alongside existing Gemini and Groq key inputs).

### 5. `src/utils/renderer.js` — Update initialization
- Read `providerConfig` from preferences
- Route initialization to correct provider based on task config
- Add `initializeOpenRouter()` and `initializeDeepSeek()` functions

### 6. `src/utils/gemini.js` — Add OpenRouter/DeepSeek text adapters
- Add `sendToOpenRouter(transcription)` — calls OpenRouter API (OpenAI-compatible)
- Add `sendToDeepSeek(transcription)` — calls DeepSeek API (OpenAI-compatible)
- Modify `generationComplete` handler to route based on `providerConfig.text`
- Add `sendImageToOpenRouter()` and `sendImageToDeepSeek()` for vision tasks

### 7. `src/utils/localai.js` — Minor updates
- Ensure Ollama can be used as a text/image provider even when audio is handled by Gemini

### 8. `src/components/app/HelpingHandsApp.js` — Update handleStart
- Read `providerConfig` and route to correct audio provider
- Pass provider config through to initialization functions

## Implementation Order

1. **Storage layer** — Add defaults, credentials, getters/setters
2. **Provider registry** — Create `providers.js` with provider definitions
3. **MainView UI** — Add OpenRouter/DeepSeek API key inputs
4. **CustomizeView UI** — Add provider selection dropdowns
5. **Renderer init** — Update to read provider config and route correctly
6. **Gemini.js adapters** — Add OpenRouter/DeepSeek text and image functions
7. **Text routing** — Update `generationComplete` to use selected text provider
8. **Image routing** — Update `send-image-content` to use selected image provider
9. **Testing** — Verify each provider combination works

## OpenRouter API Details
- Base URL: `https://openrouter.ai/api/v1/chat/completions`
- Auth: `Authorization: Bearer <key>`
- Models: `meta-llama/llama-3.3-70b-instruct`, `anthropic/claude-3.5-sonnet`, `google/gemini-2.0-flash-001`, etc.
- OpenAI-compatible format

## DeepSeek API Details
- Base URL: `https://api.deepseek.com/v1/chat/completions`
- Auth: `Authorization: Bearer <key>`
- Models: `deepseek-chat`, `deepseek-reasoner`
- OpenAI-compatible format

## Backwards Compatibility
- Existing users with a legacy `providerMode` of `'byok'`/`'cloud'` are normalized to `'api'` on load and continue working with Gemini + Groq
- New `providerConfig` defaults match current behavior (Gemini audio, Groq text, Gemini image)
- No breaking changes to IPC handlers
