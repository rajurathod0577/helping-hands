import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';

export class CustomizeView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            /* Section eyebrows (SESSION / APPEARANCE / group headers) */
            .surface-title {
                font-family: var(--font-mono);
                font-size: 11px;
                font-weight: 500;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: var(--text-muted);
                margin-bottom: var(--space-md);
            }

            /* HUD readout tick */
            .surface-title::before {
                content: '▸ ';
                color: var(--accent);
            }

            .surface-title.danger {
                color: var(--danger);
            }

            .surface-title.danger::before {
                color: var(--danger);
            }

            /* Settings rows — sharp HUD rows with left accent tick */
            .form-group {
                position: relative;
                background: var(--bg-elevated);
                border: 1px solid var(--border);
                border-radius: 0;
                padding: 12px;
                transition:
                    border-color var(--transition),
                    background var(--transition);
            }

            .form-group::before {
                content: '';
                position: absolute;
                top: -1px;
                left: -1px;
                bottom: -1px;
                width: 2px;
                background: var(--accent);
                opacity: 0;
                pointer-events: none;
                transition: opacity var(--transition);
            }

            .form-group:hover {
                border-color: var(--border-strong);
            }

            .form-group:hover::before,
            .form-group:focus-within::before {
                opacity: 1;
            }

            .form-group.vertical .control {
                width: 100%;
            }

            .form-label {
                color: var(--text-secondary);
                font-size: 13px;
            }

            /* Inputs & selects — kit styling + focus ring */
            .control {
                font-family: var(--font-mono);
                background: var(--bg-surface);
            }

            .control:hover:not(:focus) {
                border-color: var(--border-strong);
            }

            .control:focus {
                outline: none;
                border-color: var(--border-strong);
                box-shadow:
                    inset 0 0 0 1px var(--accent),
                    0 0 0 3px rgba(59, 232, 107, 0.06);
            }

            select.control {
                color: var(--text-primary);
                font-size: 13px;
            }

            .danger-surface {
                border-color: rgba(255, 92, 87, 0.3);
            }

            /* Warning callout (caution tint) */
            .warning-callout {
                position: relative;
                margin-top: 4px;
                padding: 10px 12px;
                border: 1px solid rgba(224, 201, 58, 0.3);
                border-radius: 0;
                color: var(--warning);
                font-size: var(--font-size-xs);
                line-height: 1.4;
                background: rgba(224, 201, 58, 0.1);
            }

            .warning-callout::before {
                content: '';
                position: absolute;
                top: -6px;
                left: 16px;
                width: 10px;
                height: 10px;
                background: var(--bg-elevated);
                border-top: 1px solid rgba(224, 201, 58, 0.3);
                border-left: 1px solid rgba(224, 201, 58, 0.3);
                transform: rotate(45deg);
            }

            /* Toggle / switch */
            .toggle-row {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                cursor: pointer;
                user-select: none;
            }

            .toggle-input {
                appearance: none;
                -webkit-appearance: none;
                position: absolute;
                width: 1px;
                height: 1px;
                opacity: 0;
                margin: 0;
            }

            .toggle-label {
                flex: 1;
                color: var(--text-secondary);
                font-size: 13px;
                cursor: pointer;
            }

            .switch {
                position: relative;
                flex-shrink: 0;
                width: 42px;
                height: 24px;
                border-radius: 0;
                background: var(--bg-elevated);
                border: 1px solid var(--border);
                transition:
                    background var(--transition),
                    box-shadow var(--transition),
                    border-color var(--transition);
            }

            .switch::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 18px;
                height: 18px;
                border-radius: 0;
                background: var(--text-muted);
                transition:
                    transform var(--transition),
                    background var(--transition);
            }

            .toggle-input:checked ~ .switch {
                background: var(--accent-gradient);
                border-color: transparent;
                box-shadow: var(--shadow-accent);
            }

            .toggle-input:checked ~ .switch::after {
                transform: translateX(18px);
                background: #04140a;
            }

            .toggle-input:focus-visible ~ .switch {
                box-shadow: 0 0 0 3px rgba(59, 232, 107, 0.06);
            }

            .field-hint {
                margin-top: var(--space-xs);
                font-size: var(--font-size-xs);
                color: var(--text-muted);
                line-height: 1.4;
            }

            /* Slider */
            .slider-wrap {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: var(--space-sm);
            }

            .slider-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-sm);
            }

            .slider-value {
                font-family: var(--font-mono);
                font-size: 12px;
                color: var(--accent);
            }

            .slider-input {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 6px;
                border-radius: 0;
                background: var(--bg-elevated);
                outline: none;
                cursor: pointer;
            }

            .slider-input::-webkit-slider-runnable-track {
                height: 6px;
                border-radius: 0;
                background: var(--bg-elevated);
            }

            .slider-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                margin-top: -4px;
                border-radius: 0;
                background: var(--accent);
                border: 1px solid var(--accent);
                box-shadow: var(--shadow-accent);
            }

            .slider-input::-moz-range-track {
                height: 6px;
                border-radius: 0;
                background: var(--bg-elevated);
            }

            .slider-input::-moz-range-progress {
                height: 6px;
                border-radius: 0;
                background: linear-gradient(90deg, #12a24a, var(--accent));
            }

            .slider-input::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border: 1px solid var(--accent);
                border-radius: 0;
                background: var(--accent);
                box-shadow: var(--shadow-accent);
            }

            /* Keyboard shortcut rows */
            .keybind-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-md);
                padding: 10px 12px;
                margin-bottom: var(--space-xs);
                background: var(--bg-elevated);
                border: 1px solid var(--border);
                border-radius: 0;
            }

            .keybind-name {
                color: var(--text-secondary);
                font-size: 13px;
            }

            .keybind-input {
                width: 150px;
                text-align: center;
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: var(--accent);
                background: var(--bg-surface);
                border: 1px solid var(--border-strong);
                border-bottom-width: 2px;
                border-radius: 0;
                padding: 6px 9px;
            }

            /* Buttons — HUD mono uppercase */
            .btn {
                font-family: var(--font-mono);
                font-size: 13px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                border-radius: 0;
                padding: 11px 20px;
                cursor: pointer;
                border: 1px solid transparent;
                transition:
                    border-color var(--transition),
                    background var(--transition),
                    box-shadow var(--transition),
                    filter var(--transition);
            }

            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .btn-primary {
                background: var(--accent-gradient);
                color: #04140a;
                border: none;
                /* chamfer clip hides box-shadow — use drop-shadow for glow */
                clip-path: polygon(
                    0 0,
                    calc(100% - var(--hud-cut-sm, 6px)) 0,
                    100% var(--hud-cut-sm, 6px),
                    100% 100%,
                    var(--hud-cut-sm, 6px) 100%,
                    0 calc(100% - var(--hud-cut-sm, 6px))
                );
                filter: drop-shadow(0 0 10px rgba(59, 232, 107, 0.5));
            }

            .btn-primary:hover:not(:disabled) {
                filter: drop-shadow(0 0 14px rgba(59, 232, 107, 0.7));
            }

            .btn-secondary {
                background: transparent;
                border: 1px solid var(--border-strong);
                color: var(--accent);
            }

            .btn-secondary:hover:not(:disabled) {
                border-color: var(--accent);
                box-shadow: 0 0 0 1px var(--accent) inset;
            }

            .btn-ghost {
                background: var(--bg-elevated);
                border: 1px solid var(--border);
                color: var(--text-secondary);
            }

            .btn-ghost:hover:not(:disabled) {
                border-color: var(--border-strong);
            }

            .btn-danger {
                background: rgba(255, 92, 87, 0.08);
                border: 1px solid rgba(255, 92, 87, 0.3);
                color: var(--danger);
            }

            .btn-danger:hover:not(:disabled) {
                background: rgba(255, 92, 87, 0.14);
            }

            .status {
                margin-top: var(--space-sm);
                padding: var(--space-sm);
                border-radius: 0;
                border: 1px solid var(--border);
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                letter-spacing: 0.04em;
            }

            .status.success {
                border-color: rgba(59, 232, 107, 0.3);
                color: var(--accent);
                background: var(--accent-soft);
            }

            .status.success::before {
                content: '● ';
            }

            .status.error {
                border-color: rgba(255, 92, 87, 0.3);
                color: var(--danger);
                background: rgba(255, 92, 87, 0.08);
            }

            .status.error::before {
                content: '✕ ';
            }
        `,
    ];

    static properties = {
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        selectedImageQuality: { type: String },
        layoutMode: { type: String },
        keybinds: { type: Object },
        googleSearchEnabled: { type: Boolean },
        answerFormat: { type: String },
        desiMode: { type: Boolean },
        backgroundTransparency: { type: Number },
        fontSize: { type: Number },
        theme: { type: String },
        onProfileChange: { type: Function },
        onLanguageChange: { type: Function },
        onImageQualityChange: { type: Function },
        onLayoutModeChange: { type: Function },
        isClearing: { type: Boolean },
        isRestoring: { type: Boolean },
        clearStatusMessage: { type: String },
        clearStatusType: { type: String },
        // Provider config
        _audioProvider: { state: true },
        _textProvider: { state: true },
        _imageProvider: { state: true },
        _openrouterModel: { state: true },
        _openrouterModels: { state: true },
        _openrouterModelsLoading: { state: true },
        _openrouterSearch: { state: true },
        _testResults: { state: true },
        _testingModel: { state: true },
    };

    constructor() {
        super();
        this.selectedProfile = 'interview';
        this.selectedLanguage = 'en-US';
        this.selectedImageQuality = 'medium';
        this.layoutMode = 'normal';
        this.keybinds = this.getDefaultKeybinds();
        this.onProfileChange = () => {};
        this.onLanguageChange = () => {};
        this.onImageQualityChange = () => {};
        this.onLayoutModeChange = () => {};
        this.googleSearchEnabled = true;
        this.answerFormat = 'bullets';
        this.desiMode = false;
        this.isClearing = false;
        this.isRestoring = false;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.backgroundTransparency = 0.8;
        this.fontSize = 20;
        this.audioMode = 'speaker_only';
        this.customPrompt = '';
        this.theme = 'dark';
        this._audioProvider = 'gemini';
        this._textProvider = 'groq';
        this._imageProvider = 'gemini';
        this._openrouterModel = 'meta-llama/llama-3.3-70b-instruct';
        this._openrouterModels = [];
        this._openrouterModelsLoading = false;
        this._openrouterSearch = '';
        this._testResults = {};
        this._testingModel = null;
        this._loadFromStorage();
    }

    getThemes() {
        return helpingHands.theme.getAll();
    }

    async _loadFromStorage() {
        try {
            const [prefs, keybinds] = await Promise.all([helpingHands.storage.getPreferences(), helpingHands.storage.getKeybinds()]);
            this.googleSearchEnabled = prefs.googleSearchEnabled ?? true;
            this.answerFormat = prefs.answerFormat ?? 'bullets';
            this.desiMode = prefs.desiMode ?? false;
            this.backgroundTransparency = prefs.backgroundTransparency ?? 0.8;
            this.fontSize = prefs.fontSize ?? 20;
            this.audioMode = prefs.audioMode ?? 'speaker_only';
            this.customPrompt = prefs.customPrompt ?? '';
            this.theme = prefs.theme ?? 'dark';
            const providerConfig = prefs.providerConfig || { audio: 'gemini', text: 'groq', image: 'gemini' };
            this._audioProvider = providerConfig.audio;
            this._textProvider = providerConfig.text;
            this._imageProvider = providerConfig.image;
            this._openrouterModel = prefs.openrouterTextModel || 'meta-llama/llama-3.3-70b-instruct';
            if (keybinds) {
                this.keybinds = { ...this.getDefaultKeybinds(), ...keybinds };
            }
            this.updateBackgroundAppearance();
            this.updateFontSize();
            this.requestUpdate();
            if (this._textProvider === 'openrouter' || this._imageProvider === 'openrouter') {
                this._fetchOpenRouterModels();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async _fetchOpenRouterModels() {
        if (this._openrouterModelsLoading || this._openrouterModels.length > 0) return;
        this._openrouterModelsLoading = true;
        this.requestUpdate();
        try {
            const result = await helpingHands.storage.fetchOpenRouterModels();
            if (result.success && result.data) {
                this._openrouterModels = result.data;
            }
        } catch (error) {
            console.error('Error fetching OpenRouter models:', error);
        } finally {
            this._openrouterModelsLoading = false;
            this.requestUpdate();
        }
    }

    _filterModels(searchQuery) {
        if (!searchQuery || !searchQuery.trim()) return this._openrouterModels.slice(0, 20);
        const q = searchQuery.toLowerCase();
        return this._openrouterModels.filter(m => m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q))).slice(0, 20);
    }

    getProfiles() {
        return [
            { value: 'interview', name: 'Job Interview' },
            { value: 'sales', name: 'Sales Call' },
            { value: 'meeting', name: 'Business Meeting' },
            { value: 'presentation', name: 'Presentation' },
            { value: 'negotiation', name: 'Negotiation' },
            { value: 'exam', name: 'Exam Assistant' },
        ];
    }

    getLanguages() {
        return [
            { value: 'en-US', name: 'English (US)' },
            { value: 'en-GB', name: 'English (UK)' },
            { value: 'en-AU', name: 'English (Australia)' },
            { value: 'en-IN', name: 'English (India)' },
            { value: 'de-DE', name: 'German (Germany)' },
            { value: 'es-US', name: 'Spanish (US)' },
            { value: 'es-ES', name: 'Spanish (Spain)' },
            { value: 'fr-FR', name: 'French (France)' },
            { value: 'fr-CA', name: 'French (Canada)' },
            { value: 'hi-IN', name: 'Hindi (India)' },
            { value: 'pt-BR', name: 'Portuguese (Brazil)' },
            { value: 'ar-XA', name: 'Arabic (Generic)' },
            { value: 'id-ID', name: 'Indonesian (Indonesia)' },
            { value: 'it-IT', name: 'Italian (Italy)' },
            { value: 'ja-JP', name: 'Japanese (Japan)' },
            { value: 'tr-TR', name: 'Turkish (Turkey)' },
            { value: 'vi-VN', name: 'Vietnamese (Vietnam)' },
            { value: 'bn-IN', name: 'Bengali (India)' },
            { value: 'gu-IN', name: 'Gujarati (India)' },
            { value: 'kn-IN', name: 'Kannada (India)' },
            { value: 'ml-IN', name: 'Malayalam (India)' },
            { value: 'mr-IN', name: 'Marathi (India)' },
            { value: 'ta-IN', name: 'Tamil (India)' },
            { value: 'te-IN', name: 'Telugu (India)' },
            { value: 'nl-NL', name: 'Dutch (Netherlands)' },
            { value: 'ko-KR', name: 'Korean (South Korea)' },
            { value: 'cmn-CN', name: 'Mandarin Chinese (China)' },
            { value: 'pl-PL', name: 'Polish (Poland)' },
            { value: 'ru-RU', name: 'Russian (Russia)' },
            { value: 'th-TH', name: 'Thai (Thailand)' },
        ];
    }

    getDefaultKeybinds() {
        const isMac = helpingHands.isMacOS || navigator.platform.includes('Mac');
        return {
            moveUp: isMac ? 'Alt+Up' : 'Ctrl+Up',
            moveDown: isMac ? 'Alt+Down' : 'Ctrl+Down',
            moveLeft: isMac ? 'Alt+Left' : 'Ctrl+Left',
            moveRight: isMac ? 'Alt+Right' : 'Ctrl+Right',
            toggleVisibility: isMac ? 'Cmd+\\' : 'Ctrl+\\',
            toggleClickThrough: isMac ? 'Cmd+M' : 'Ctrl+M',
            nextStep: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
            previousResponse: isMac ? 'Cmd+[' : 'Ctrl+[',
            nextResponse: isMac ? 'Cmd+]' : 'Ctrl+]',
            scrollUp: isMac ? 'Cmd+Shift+Up' : 'Ctrl+Shift+Up',
            scrollDown: isMac ? 'Cmd+Shift+Down' : 'Ctrl+Shift+Down',
        };
    }

    getKeybindActions() {
        return [
            { key: 'moveUp', name: 'Move Window Up', description: 'Move the app window up' },
            { key: 'moveDown', name: 'Move Window Down', description: 'Move the app window down' },
            { key: 'moveLeft', name: 'Move Window Left', description: 'Move the app window left' },
            { key: 'moveRight', name: 'Move Window Right', description: 'Move the app window right' },
            { key: 'toggleVisibility', name: 'Toggle Visibility', description: 'Show or hide the app window' },
            { key: 'toggleClickThrough', name: 'Toggle Click-through', description: 'Enable or disable click-through mode' },
            { key: 'nextStep', name: 'Ask Next Step', description: 'Take screenshot and ask for next step' },
            { key: 'previousResponse', name: 'Previous Response', description: 'Move to previous AI response' },
            { key: 'nextResponse', name: 'Next Response', description: 'Move to next AI response' },
            { key: 'scrollUp', name: 'Scroll Response Up', description: 'Scroll response content upward' },
            { key: 'scrollDown', name: 'Scroll Response Down', description: 'Scroll response content downward' },
        ];
    }

    async saveKeybinds() {
        await helpingHands.storage.setKeybinds(this.keybinds);
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', this.keybinds);
        }
    }

    handleProfileSelect(e) {
        this.selectedProfile = e.target.value;
        this.onProfileChange(this.selectedProfile);
    }

    handleLanguageSelect(e) {
        this.selectedLanguage = e.target.value;
        this.onLanguageChange(this.selectedLanguage);
    }

    handleImageQualitySelect(e) {
        this.selectedImageQuality = e.target.value;
        this.onImageQualityChange(this.selectedImageQuality);
    }

    handleLayoutModeSelect(e) {
        this.layoutMode = e.target.value;
        this.onLayoutModeChange(this.layoutMode);
    }

    async handleCustomPromptInput(e) {
        this.customPrompt = e.target.value;
        await helpingHands.storage.updatePreference('customPrompt', this.customPrompt);
    }

    async handleAudioModeSelect(e) {
        this.audioMode = e.target.value;
        await helpingHands.storage.updatePreference('audioMode', this.audioMode);
        this.requestUpdate();
    }

    async handleThemeChange(e) {
        this.theme = e.target.value;
        await helpingHands.theme.save(this.theme);
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    async handleGoogleSearchChange(e) {
        this.googleSearchEnabled = e.target.checked;
        await helpingHands.storage.updatePreference('googleSearchEnabled', this.googleSearchEnabled);
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('update-google-search-setting', this.googleSearchEnabled);
            } catch (error) {
                console.error('Failed to notify main process:', error);
            }
        }
        this.requestUpdate();
    }

    async handleAnswerFormatChange(e) {
        this.answerFormat = e.target.value;
        await helpingHands.storage.updatePreference('answerFormat', this.answerFormat);
        this.requestUpdate();
    }

    async handleDesiModeChange(e) {
        this.desiMode = e.target.checked;
        await helpingHands.storage.updatePreference('desiMode', this.desiMode);
        this.requestUpdate();
    }

    async handleBackgroundTransparencyChange(e) {
        this.backgroundTransparency = parseFloat(e.target.value);
        await helpingHands.storage.updatePreference('backgroundTransparency', this.backgroundTransparency);
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    updateBackgroundAppearance() {
        const colors = helpingHands.theme.get(this.theme);
        helpingHands.theme.applyBackgrounds(colors.background, this.backgroundTransparency);
    }

    async handleFontSizeChange(e) {
        this.fontSize = parseInt(e.target.value, 10);
        await helpingHands.storage.updatePreference('fontSize', this.fontSize);
        this.updateFontSize();
        this.requestUpdate();
    }

    updateFontSize() {
        document.documentElement.style.setProperty('--response-font-size', `${this.fontSize}px`);
    }

    handleKeybindChange(action, value) {
        this.keybinds = { ...this.keybinds, [action]: value };
        this.saveKeybinds();
        this.requestUpdate();
    }

    handleKeybindFocus(e) {
        e.target.placeholder = 'Press key combination...';
        e.target.select();
    }

    handleKeybindInput(e) {
        e.preventDefault();
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.metaKey) modifiers.push('Cmd');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        let mainKey = e.key;

        switch (e.code) {
            case 'ArrowUp':
                mainKey = 'Up';
                break;
            case 'ArrowDown':
                mainKey = 'Down';
                break;
            case 'ArrowLeft':
                mainKey = 'Left';
                break;
            case 'ArrowRight':
                mainKey = 'Right';
                break;
            case 'Enter':
                mainKey = 'Enter';
                break;
            case 'Space':
                mainKey = 'Space';
                break;
            case 'Backslash':
                mainKey = '\\';
                break;
            default:
                if (e.key.length === 1) mainKey = e.key.toUpperCase();
                break;
        }

        if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

        const action = e.target.dataset.action;
        const keybind = [...modifiers, mainKey].join('+');
        this.handleKeybindChange(action, keybind);
        e.target.value = keybind;
        e.target.blur();
    }

    async handleProviderChange(task, e) {
        const value = e.target.value;
        if (task === 'audio') this._audioProvider = value;
        if (task === 'text') this._textProvider = value;
        if (task === 'image') this._imageProvider = value;

        await helpingHands.storage.updatePreference('providerConfig', {
            audio: this._audioProvider,
            text: this._textProvider,
            image: this._imageProvider,
        });
        await helpingHands.storage.updatePreference('openrouterTextModel', this._openrouterModel);
        await helpingHands.storage.updatePreference('openrouterImageModel', this._openrouterModel);
        if (this._textProvider === 'openrouter' || this._imageProvider === 'openrouter') {
            this._fetchOpenRouterModels();
        }
        this.requestUpdate();
    }

    async handleOpenRouterModelSelect(modelId) {
        this._openrouterModel = modelId;
        await helpingHands.storage.updatePreference('openrouterTextModel', modelId);
        await helpingHands.storage.updatePreference('openrouterImageModel', modelId);
    }

    handleOpenRouterSearch(e) {
        this._openrouterSearch = e.target.value;
        this.requestUpdate();
    }

    async testOpenRouterModel(modelId) {
        this._testingModel = modelId;
        this._testResults = { ...this._testResults, [modelId]: { status: 'testing' } };
        this.requestUpdate();
        try {
            const result = await helpingHands.storage.testOpenRouterModel(modelId);
            if (result.success) {
                this._testResults = { ...this._testResults, [modelId]: { status: 'success', reply: result.reply } };
            } else {
                this._testResults = { ...this._testResults, [modelId]: { status: 'error', error: result.error } };
            }
        } catch (error) {
            this._testResults = { ...this._testResults, [modelId]: { status: 'error', error: error.message } };
        } finally {
            this._testingModel = null;
            this.requestUpdate();
        }
    }

    async resetKeybinds() {
        this.keybinds = this.getDefaultKeybinds();
        await helpingHands.storage.setKeybinds(null);
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', this.keybinds);
        }
        this.requestUpdate();
    }

    async restoreAllSettings() {
        if (this.isRestoring) return;
        this.isRestoring = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();
        try {
            // Restore all preferences to defaults
            const defaults = {
                customPrompt: '',
                selectedProfile: 'interview',
                selectedLanguage: 'en-US',
                selectedScreenshotInterval: '5',
                selectedImageQuality: 'medium',
                audioMode: 'speaker_only',
                fontSize: 20,
                backgroundTransparency: 0.8,
                googleSearchEnabled: false,
                theme: 'dark',
            };
            for (const [key, value] of Object.entries(defaults)) {
                await helpingHands.storage.updatePreference(key, value);
            }

            // Restore keybinds
            this.keybinds = this.getDefaultKeybinds();
            await helpingHands.storage.setKeybinds(null);
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('update-keybinds', this.keybinds);
            }

            // Apply to local state
            this.selectedProfile = defaults.selectedProfile;
            this.selectedLanguage = defaults.selectedLanguage;
            this.selectedImageQuality = defaults.selectedImageQuality;
            this.audioMode = defaults.audioMode;
            this.fontSize = defaults.fontSize;
            this.backgroundTransparency = defaults.backgroundTransparency;
            this.googleSearchEnabled = defaults.googleSearchEnabled;
            this.customPrompt = defaults.customPrompt;
            this.theme = defaults.theme;

            // Notify parent callbacks
            this.onProfileChange(defaults.selectedProfile);
            this.onLanguageChange(defaults.selectedLanguage);
            this.onImageQualityChange(defaults.selectedImageQuality);

            // Apply visual changes
            this.updateBackgroundAppearance();
            this.updateFontSize();
            await helpingHands.theme.save(defaults.theme);

            this.clearStatusMessage = 'All settings restored to defaults';
            this.clearStatusType = 'success';
        } catch (error) {
            console.error('Error restoring settings:', error);
            this.clearStatusMessage = `Error restoring settings: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isRestoring = false;
            this.requestUpdate();
        }
    }

    async clearLocalData() {
        if (this.isClearing) return;
        this.isClearing = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();
        try {
            await helpingHands.storage.clearAll();
            this.clearStatusMessage = 'Successfully cleared all local data';
            this.clearStatusType = 'success';
            this.requestUpdate();
            setTimeout(() => {
                this.clearStatusMessage = 'Closing application...';
                this.requestUpdate();
                setTimeout(async () => {
                    if (window.require) {
                        const { ipcRenderer } = window.require('electron');
                        await ipcRenderer.invoke('quit-application');
                    }
                }, 1000);
            }, 2000);
        } catch (error) {
            console.error('Error clearing data:', error);
            this.clearStatusMessage = `Error clearing data: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isClearing = false;
            this.requestUpdate();
        }
    }

    renderAudioSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Audio Input</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Audio Mode</label>
                        <select class="control" .value=${this.audioMode} @change=${this.handleAudioModeSelect}>
                            <option value="speaker_only">Speaker Only (Interviewer)</option>
                            <option value="mic_only">Microphone Only (Me)</option>
                            <option value="both">Both Speaker and Microphone</option>
                        </select>
                    </div>
                    ${this.audioMode !== 'speaker_only'
                        ? html` <div class="warning-callout">May cause unexpected behavior. Only change this if you know what you're doing.</div> `
                        : ''}
                    <div class="form-group">
                        <label class="form-label">Image Quality</label>
                        <select class="control" .value=${this.selectedImageQuality} @change=${this.handleImageQualitySelect}>
                            <option value="high">High Quality</option>
                            <option value="medium">Medium Quality</option>
                            <option value="low">Low Quality</option>
                        </select>
                    </div>
                </div>
            </section>
        `;
    }

    renderAnswerStyleSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Answer Style</div>
                <div class="form-grid">
                    <div class="form-group vertical">
                        <label class="form-label">Response Format</label>
                        <select class="control" .value=${this.answerFormat} @change=${this.handleAnswerFormatChange}>
                            <option value="bullets">Concise bullet points (fast)</option>
                            <option value="detailed">Detailed explanations</option>
                        </select>
                        <div class="field-hint">Bullets give short, scannable answers you can read at a glance during a live call.</div>
                    </div>
                    <div class="form-group vertical">
                        <label class="form-label">Desi Mode</label>
                        <label class="toggle-row">
                            <input
                                class="toggle-input"
                                type="checkbox"
                                .checked=${this.desiMode}
                                @change=${this.handleDesiModeChange}
                            />
                            <span class="toggle-label">Reply in Hinglish</span>
                            <span class="switch"></span>
                        </label>
                        <div class="field-hint">Answers come back in natural Hinglish, matching the language of the question — reply in Hindi/Hinglish when asked in Hindi.</div>
                    </div>
                </div>
            </section>
        `;
    }

    renderLanguageSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Language</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Speech Language</label>
                        <select class="control" .value=${this.selectedLanguage} @change=${this.handleLanguageSelect}>
                            ${this.getLanguages().map(language => html`<option value=${language.value}>${language.name}</option>`)}
                        </select>
                    </div>
                </div>
            </section>
        `;
    }

    renderAppearanceSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Appearance</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Theme</label>
                        <select class="control" .value=${this.theme} @change=${this.handleThemeChange}>
                            ${this.getThemes().map(theme => html`<option value=${theme.value}>${theme.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group slider-wrap">
                        <div class="slider-header">
                            <label class="form-label">Background Transparency</label>
                            <span class="slider-value">${Math.round(this.backgroundTransparency * 100)}%</span>
                        </div>
                        <input
                            class="slider-input"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            .value=${this.backgroundTransparency}
                            @input=${this.handleBackgroundTransparencyChange}
                        />
                    </div>
                    <div class="form-group slider-wrap">
                        <div class="slider-header">
                            <label class="form-label">Response Font Size</label>
                            <span class="slider-value">${this.fontSize}px</span>
                        </div>
                        <input
                            class="slider-input"
                            type="range"
                            min="12"
                            max="32"
                            step="1"
                            .value=${this.fontSize}
                            @input=${this.handleFontSizeChange}
                        />
                    </div>
                </div>
            </section>
        `;
    }

    renderKeyboardSection() {
        return html`
            <section class="surface">
                <div class="surface-title">Keyboard Shortcuts</div>
                ${this.getKeybindActions().map(
                    action => html`
                        <div class="keybind-row">
                            <span class="keybind-name">${action.name}</span>
                            <input
                                type="text"
                                class="control keybind-input"
                                .value=${this.keybinds[action.key]}
                                data-action=${action.key}
                                @keydown=${this.handleKeybindInput}
                                @focus=${this.handleKeybindFocus}
                                readonly
                            />
                        </div>
                    `
                )}
                <div style="margin-top: var(--space-sm);">
                    <button class="btn btn-ghost" style="padding:8px 14px;" @click=${this.resetKeybinds}>Reset to defaults</button>
                </div>
            </section>
        `;
    }

    renderProviderSection() {
        const audioProviders = [
            { id: 'gemini', name: 'Google Gemini (Live API)' },
            { id: 'speechmatics', name: 'Speechmatics (Live captions)' },
            { id: 'whisper-local', name: 'Whisper (Local)' },
        ];
        const textProviders = [
            { id: 'groq', name: 'Groq' },
            { id: 'gemini', name: 'Google Gemma' },
            { id: 'openrouter', name: 'OpenRouter' },
            { id: 'deepseek', name: 'DeepSeek' },
            { id: 'ollama', name: 'Ollama (Local)' },
        ];
        const imageProviders = [
            { id: 'gemini', name: 'Google Gemini Flash' },
            { id: 'openrouter', name: 'OpenRouter' },
            { id: 'deepseek', name: 'DeepSeek' },
            { id: 'ollama', name: 'Ollama (Local)' },
        ];

        const filteredModels = this._filterModels(this._openrouterSearch);
        const showOpenRouter = this._textProvider === 'openrouter' || this._imageProvider === 'openrouter';

        return html`
            <section class="surface">
                <div class="surface-title">AI Providers</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Audio Transcription</label>
                        <select class="control" .value=${this._audioProvider} @change=${e => this.handleProviderChange('audio', e)}>
                            ${audioProviders.map(p => html`<option value=${p.id}>${p.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Text Generation</label>
                        <select class="control" .value=${this._textProvider} @change=${e => this.handleProviderChange('text', e)}>
                            ${textProviders.map(p => html`<option value=${p.id}>${p.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Image Analysis</label>
                        <select class="control" .value=${this._imageProvider} @change=${e => this.handleProviderChange('image', e)}>
                            ${imageProviders.map(p => html`<option value=${p.id}>${p.name}</option>`)}
                        </select>
                    </div>
                    ${showOpenRouter
                        ? html`
                              <div class="form-group vertical">
                                  <label class="form-label">OpenRouter Model</label>
                                  <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 4px;">
                                      Selected: <span style="color: var(--text-primary);">${this._openrouterModel}</span>
                                  </div>
                                  <input
                                      class="control"
                                      type="text"
                                      placeholder="Search models..."
                                      .value=${this._openrouterSearch}
                                      @input=${this.handleOpenRouterSearch}
                                  />
                                  ${this._openrouterModelsLoading
                                      ? html`<div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">
                                            Loading models...
                                        </div>`
                                      : html`
                                            <div
                                                class="model-list"
                                                style="margin-top: 6px; max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-sm);"
                                            >
                                                ${filteredModels.length === 0
                                                    ? html`<div style="font-size: var(--font-size-xs); color: var(--text-muted); padding: 8px;">
                                                          No models found
                                                      </div>`
                                                    : filteredModels.map(
                                                          m => html`
                                                              <div
                                                                  class="model-item"
                                                                  style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; cursor: pointer; border-bottom: 1px solid var(--border); ${this
                                                                      ._openrouterModel === m.id
                                                                      ? 'background: var(--bg-hover);'
                                                                      : ''}"
                                                                  @click=${() => this.handleOpenRouterModelSelect(m.id)}
                                                              >
                                                                  <div style="flex: 1; min-width: 0;">
                                                                      <div
                                                                          style="font-size: var(--font-size-sm); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                      >
                                                                          ${m.name || m.id}
                                                                      </div>
                                                                      <div
                                                                          style="font-size: var(--font-size-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                                                                      >
                                                                          ${m.id}
                                                                      </div>
                                                                  </div>
                                                                  <button
                                                                      class="btn btn-ghost"
                                                                      style="width: auto; padding: 4px 10px; font-size: var(--font-size-xs); margin-left: 8px; flex-shrink: 0;"
                                                                      @click=${e => {
                                                                          e.stopPropagation();
                                                                          this.testOpenRouterModel(m.id);
                                                                      }}
                                                                      ?disabled=${this._testingModel === m.id}
                                                                  >
                                                                      ${this._testingModel === m.id
                                                                          ? 'Testing...'
                                                                          : this._testResults[m.id]?.status === 'success'
                                                                            ? 'Pass'
                                                                            : this._testResults[m.id]?.status === 'error'
                                                                              ? 'Fail'
                                                                              : 'Test'}
                                                                  </button>
                                                              </div>
                                                              ${this._testResults[m.id]
                                                                  ? html`
                                                                        <div
                                                                            style="padding: 4px 8px; font-size: var(--font-size-xs); border-bottom: 1px solid var(--border); ${this
                                                                                ._testResults[m.id].status === 'success'
                                                                                ? 'color: var(--success);'
                                                                                : 'color: var(--danger);'}"
                                                                        >
                                                                            ${this._testResults[m.id].status === 'success'
                                                                                ? `OK: ${this._testResults[m.id].reply}`
                                                                                : `Error: ${this._testResults[m.id].error}`}
                                                                        </div>
                                                                    `
                                                                  : ''}
                                                          `
                                                      )}
                                            </div>
                                        `}
                              </div>
                          `
                        : ''}
                </div>
            </section>
        `;
    }

    renderPrivacySection() {
        return html`
            <section class="surface danger-surface">
                <div class="surface-title danger">Privacy and Data</div>
                <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
                    <button class="btn btn-secondary" @click=${this.restoreAllSettings} ?disabled=${this.isRestoring}>
                        ${this.isRestoring ? 'Restoring...' : 'Restore all settings'}
                    </button>
                    <button class="btn btn-danger" @click=${this.clearLocalData} ?disabled=${this.isClearing}>
                        ${this.isClearing ? 'Clearing...' : 'Delete all data'}
                    </button>
                </div>
                ${this.clearStatusMessage
                    ? html` <div class="status ${this.clearStatusType === 'success' ? 'success' : 'error'}">${this.clearStatusMessage}</div> `
                    : ''}
            </section>
        `;
    }

    render() {
        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div class="page-title">Settings</div>
                    ${this.renderProviderSection()} ${this.renderAnswerStyleSection()} ${this.renderAudioSection()} ${this.renderLanguageSection()}
                    ${this.renderAppearanceSection()}
                    ${this.renderKeyboardSection()} ${this.renderPrivacySection()}
                </div>
            </div>
        `;
    }
}

customElements.define('customize-view', CustomizeView);
