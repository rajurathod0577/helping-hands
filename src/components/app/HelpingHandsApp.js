import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { MainView } from '../views/MainView.js';
import { CustomizeView } from '../views/CustomizeView.js';
import { HelpView } from '../views/HelpView.js';
import { HistoryView } from '../views/HistoryView.js';
import { AssistantView } from '../views/AssistantView.js';
import { OnboardingView } from '../views/OnboardingView.js';
import { AICustomizeView } from '../views/AICustomizeView.js';
import { FeedbackView } from '../views/FeedbackView.js';

export class HelpingHandsApp extends LitElement {
    static styles = css`
        * {
            box-sizing: border-box;
            font-family: var(--font);
            margin: 0;
            padding: 0;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            height: 100vh;
            /* Uses the Settings "Background Transparency" alpha (baked into --bg-app),
               so the whole overlay — live and non-live — matches the chosen transparency. */
            background: var(--bg-app);
            color: var(--text-primary);
        }

        /* ── Full app shell: top bar + sidebar/content ── */

        .app-shell {
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        .top-drag-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            height: 38px;
            background: transparent;
        }

        .drag-region {
            flex: 1;
            height: 100%;
            -webkit-app-region: drag;
        }

        .top-drag-bar.hidden {
            display: none;
        }

        .traffic-lights {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 var(--space-md);
            height: 100%;
            -webkit-app-region: no-drag;
        }

        .traffic-light {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            padding: 0;
            transition: opacity 0.15s ease;
        }

        .traffic-light:hover {
            opacity: 0.8;
        }

        .traffic-light.close {
            background: #ff5f57;
        }

        .traffic-light.minimize {
            background: #febc2e;
        }

        .traffic-light.maximize {
            background: #28c840;
        }

        .sidebar {
            width: var(--sidebar-width);
            min-width: var(--sidebar-width);
            background: var(--bg-surface);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 42px 0 var(--space-md) 0;
            transition:
                width var(--transition),
                min-width var(--transition),
                opacity var(--transition);
        }

        .sidebar.hidden {
            width: 0;
            min-width: 0;
            padding: 0;
            overflow: hidden;
            border-right: none;
            opacity: 0;
        }

        .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: var(--space-sm) var(--space-lg);
            padding-top: var(--space-md);
            margin-bottom: var(--space-lg);
        }

        .brand-mark {
            width: 26px;
            height: 26px;
            border-radius: 8px;
            background: var(--accent-gradient);
            box-shadow: var(--shadow-accent);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .brand-mark svg {
            width: 15px;
            height: 15px;
            color: #fff;
        }

        .sidebar-brand h1 {
            font-size: var(--font-size-base);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            letter-spacing: -0.02em;
        }

        .sidebar-nav {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--space-xs);
            padding: 0 var(--space-sm);
            -webkit-app-region: no-drag;
        }

        .nav-item {
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px var(--space-md);
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            cursor: pointer;
            transition:
                color var(--transition),
                background var(--transition);
            border: none;
            background: none;
            width: 100%;
            text-align: left;
        }

        .nav-item:hover {
            color: var(--text-primary);
            background: var(--bg-hover);
        }

        .nav-item.active {
            color: var(--accent);
            background: var(--accent-soft);
        }

        .nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 18px;
            border-radius: 0 3px 3px 0;
            background: var(--accent);
        }

        .nav-item svg {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
        }

        .sidebar-footer {
            padding: var(--space-sm);
            margin-top: var(--space-sm);
            -webkit-app-region: no-drag;
        }

        .update-btn {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            width: 100%;
            padding: var(--space-sm) var(--space-md);
            border-radius: var(--radius-md);
            border: 1px solid rgba(239, 68, 68, 0.2);
            background: rgba(239, 68, 68, 0.08);
            color: var(--danger);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            cursor: pointer;
            text-align: left;
            transition:
                background var(--transition),
                border-color var(--transition);
            animation: update-wobble 5s ease-in-out infinite;
        }

        .update-btn:hover {
            background: rgba(239, 68, 68, 0.14);
            border-color: rgba(239, 68, 68, 0.35);
        }

        @keyframes update-wobble {
            0%,
            90%,
            100% {
                transform: rotate(0deg);
            }
            92% {
                transform: rotate(-2deg);
            }
            94% {
                transform: rotate(2deg);
            }
            96% {
                transform: rotate(-1.5deg);
            }
            98% {
                transform: rotate(1.5deg);
            }
        }

        .update-btn svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        .version-text {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            padding: var(--space-xs) var(--space-md);
        }

        /* ── Main content area ── */

        .content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: var(--bg-app);
        }

        /* Live mode: let the floating toolbar + answer card sit over a transparent window */
        .content.live {
            background: transparent;
        }

        /* ============================================================
           FLOATING LIVE TOOLBAR — Chiku-style grouped glass pill.
           Drop-in REPLACEMENT for the existing .live-bar block and all
           its children (.live-bar-left/center/right, .brand-chip,
           .brand-dot, .live-bar-profile, .tool-chip, .status-pill,
           .status-dot, .live-timer, .live-bar-text, .icon-btn).
           NOTE: .content.live { background: transparent } and the
           @keyframes status-pulse already exist in this stylesheet and
           are intentionally reused — do NOT re-declare them.
           ============================================================ */

        /* ---- Container: the glass pill ---- */
        .live-toolbar {
            position: relative;
            z-index: 20; /* lift the bar + its overflow menu above the answer card below */
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            min-width: 0;
            height: 46px;
            margin: var(--space-sm);
            padding: 7px 10px 7px 12px;
            /* --bg-surface already carries the user's Settings transparency (alpha);
               use it directly so the toolbar matches the chosen transparency. */
            background: var(--bg-surface);
            backdrop-filter: blur(20px) saturate(1.2);
            -webkit-backdrop-filter: blur(20px) saturate(1.2);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg, 0 10px 32px rgba(0, 0, 0, 0.34));
            /* the bar background is itself a drag handle */
            -webkit-app-region: drag;
            animation: tb-enter 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes tb-enter {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ---- Clusters — every interactive surface lives in a no-drag cluster ---- */
        .tb-left,
        .tb-center,
        .tb-right {
            display: flex;
            align-items: center;
            min-width: 0;
            -webkit-app-region: no-drag;
            z-index: 1;
        }
        .tb-left   { gap: var(--space-sm); }
        .tb-center { gap: var(--space-sm); flex-shrink: 0; }  /* center never shrinks/wraps */
        .tb-right  { gap: 6px; flex-shrink: 0; }

        /* ---- Cluster dividers (hairlines) ---- */
        .tb-divider {
            flex: 0 0 auto;
            width: 1px;
            height: 22px;
            margin: 0 2px;
            background: var(--border-strong);
            -webkit-app-region: drag;
        }
        .tb-subdivider {
            flex: 0 0 auto;
            width: 1px;
            height: 18px;
            margin: 0 1px;
            background: var(--border);
            -webkit-app-region: drag;
        }

        /* ============================================================
           LEFT — brand + profile + live-status indicators
           ============================================================ */
        .tb-brand {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 4px 2px 4px 4px;
            white-space: nowrap;
            min-width: 0;
        }
        .tb-mark {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 6px;
            background: var(--accent-gradient);
            color: var(--text-primary);
            box-shadow: 0 2px 8px var(--accent-soft);
            flex-shrink: 0;
        }
        .tb-mark svg { width: 12px; height: 12px; display: block; }
        .tb-wordmark {
            font-size: 13px;
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            letter-spacing: -0.01em;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .tb-profile {
            flex: 0 0 auto;
            font-size: 11px;
            color: var(--text-muted);
            padding: 2px 8px;
            border: 1px solid var(--border);
            border-radius: var(--radius-pill);
            white-space: nowrap;
        }

        /* ---- live status indicator group ---- */
        .tb-status {
            display: inline-flex;
            align-items: center;
            gap: var(--space-sm);
            cursor: default;
        }

        /* (1) faux audio waveform — CSS-only; no real amplitude is wired in */
        .tb-wave {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            width: 18px;
            height: 16px;
        }
        .tb-bar {
            width: 2px;
            height: 12px;
            border-radius: 1px;
            background: var(--success-color);
            transform: scaleY(0.3);     /* idle: flat */
            transform-origin: center;
            opacity: 0.4;
        }
        .tb-wave.is-listening .tb-bar {
            opacity: 1;
            animation: tb-wave-bounce 0.9s ease-in-out infinite alternate;
        }
        .tb-wave.is-listening .tb-bar:nth-child(1) { animation-delay: 0s; }
        .tb-wave.is-listening .tb-bar:nth-child(2) { animation-delay: 0.12s; }
        .tb-wave.is-listening .tb-bar:nth-child(3) { animation-delay: 0.24s; }
        .tb-wave.is-listening .tb-bar:nth-child(4) { animation-delay: 0.16s; }
        .tb-wave.is-listening .tb-bar:nth-child(5) { animation-delay: 0.08s; }
        @keyframes tb-wave-bounce {
            from { transform: scaleY(0.3); }
            to   { transform: scaleY(1); }
        }

        /* (2)(3) screen + mic glyphs with red dot badge */
        .tb-ind {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            color: var(--text-muted);   /* idle */
            cursor: default;
        }
        .tb-ind svg { width: 16px; height: 16px; display: block; }
        .tb-ind.is-active { color: var(--text-secondary); }

        .tb-badge {
            position: absolute;
            top: -1px;
            right: -1px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--error-color);
            box-shadow: 0 0 0 1.5px var(--bg-surface);
            opacity: 0;
            transform: scale(0.6);
            transition: opacity var(--transition), transform var(--transition);
        }
        .tb-ind.is-active .tb-badge {
            opacity: 1;
            transform: scale(1);
        }
        /* mic badge pulses while active (reuses existing status-pulse keyframe) */
        .tb-mic.is-active .tb-badge-pulse {
            animation: status-pulse 1.4s ease-in-out infinite;
        }

        /* ============================================================
           CENTER — primary action pills
           ============================================================ */
        .tb-action {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 30px;
            padding: 0 12px;
            font-size: 13px;
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
            background: transparent;
            border: 1px solid transparent;  /* reserve box so hover doesn't shift layout */
            border-radius: var(--radius-pill);
            cursor: pointer;
            white-space: nowrap;
            touch-action: manipulation;
            -webkit-app-region: no-drag;
            transition: background var(--transition), border-color var(--transition), transform var(--transition);
        }
        .tb-action svg { width: 14px; height: 14px; flex-shrink: 0; }
        .tb-action:hover {
            background: var(--bg-hover);
            border-color: var(--border);
        }
        .tb-action:active { transform: scale(0.97); }
        .tb-action:focus-visible {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 2px var(--accent-soft);
        }
        .tb-action:disabled {
            opacity: 0.4;
            cursor: default;
            pointer-events: none;
        }

        /* Answer = primary action: faint persistent accent tint (only when enabled) */
        .tb-answer:not(:disabled) {
            background: var(--accent-soft);
        }
        .tb-answer:not(:disabled):hover {
            background: color-mix(in srgb, var(--accent) 22%, transparent);
            border-color: transparent;
        }

        /* ============================================================
           RIGHT — timer + window/meta controls
           ============================================================ */
        .tb-timer {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 26px;
            padding: 4px 10px;
            background: var(--bg-app);
            border: 1px solid var(--border);
            border-radius: var(--radius-pill);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
            white-space: nowrap;
            cursor: default;
            -webkit-app-region: no-drag;
        }
        .tb-time-digits {
            font-family: var(--font-mono);
            font-variant-numeric: tabular-nums;
            font-size: 12px;
            color: var(--text-secondary);
        }
        .tb-rec-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--text-muted);   /* idle */
            flex-shrink: 0;
        }
        .tb-timer.is-recording .tb-rec-dot {
            background: var(--error-color);
            animation: status-pulse 1.4s ease-in-out infinite;
        }

        /* ---- icon-only utility buttons ---- */
        .tb-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            color: var(--text-secondary);
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-app-region: no-drag;
            transition: background var(--transition), color var(--transition), transform var(--transition);
        }
        .tb-icon svg { width: 16px; height: 16px; display: block; }
        .tb-icon:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }
        .tb-icon:active { transform: scale(0.94); }
        .tb-icon:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--accent-soft);
        }
        .tb-overflow.is-open {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        /* move handle is the explicit drag grab point */
        .tb-move {
            cursor: move;
            -webkit-app-region: drag;
        }
        .tb-move:active { transform: none; }

        /* collapse chevron flip */
        .tb-chevron { transition: transform var(--transition); }
        .tb-chevron.is-collapsed { transform: rotate(180deg); }

        /* ---- overflow popover menu ---- */
        .tb-menu-wrap {
            position: relative;
            display: inline-flex;
            -webkit-app-region: no-drag;
        }
        .tb-menu {
            position: absolute;
            top: calc(100% + 6px);
            right: 0;
            z-index: 50;
            min-width: 184px;
            padding: 4px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            -webkit-app-region: no-drag;
            animation: tb-menu-in 140ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes tb-menu-in {
            from { opacity: 0; transform: translateY(-4px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tb-menu-item {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            height: 32px;
            padding: 0 12px;
            font-size: 13px;
            color: var(--text-primary);
            background: transparent;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-align: left;
            white-space: nowrap;
            transition: background var(--transition), color var(--transition);
        }
        .tb-menu-item svg { width: 16px; height: 16px; flex-shrink: 0; color: var(--text-secondary); }
        .tb-menu-item:hover { background: var(--bg-hover); }
        .tb-menu-item:focus-visible {
            outline: none;
            box-shadow: inset 0 0 0 1px var(--accent);
        }
        .tb-menu-hint {
            margin-left: 6px;
            font-family: var(--font-mono);
            font-size: 0.72rem;
            color: var(--text-muted);
        }
        .tb-menu-item.tb-danger { color: var(--error-color); }
        .tb-menu-item.tb-danger svg { color: var(--error-color); }
        .tb-menu-item.tb-danger:hover { background: rgba(240, 82, 75, 0.14); }
        .tb-menu-sep {
            height: 1px;
            margin: 4px 6px;
            background: var(--border);
        }
        .tb-menu-status {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            height: 28px;
            padding: 0 12px;
            font-size: 12px;
            color: var(--text-muted);
        }
        .tb-menu-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 6px var(--accent);
            flex-shrink: 0;
        }

        /* ---- collapse gate: hide answer card + detached transcript, keep toolbar ---- */
        .content-inner.live.collapsed { display: none; }

        /* ============================================================
           Responsive degradation — LEFT collapses first; center protected
           ============================================================ */
        @media (max-width: 720px) {
            .tb-status { display: none; }
            .tb-subdivider { display: none; }
        }
        @media (max-width: 600px) {
            .tb-profile { display: none; }
        }
        @media (max-width: 520px) {
            .tb-wordmark { display: none; }
        }

        /* ============================================================
           Reduced motion
           ============================================================ */
        @media (prefers-reduced-motion: reduce) {
            .live-toolbar,
            .tb-menu { animation: none; }
            .tb-wave.is-listening .tb-bar { animation: none; transform: scaleY(0.3); }
            .tb-mic.is-active .tb-badge-pulse,
            .tb-timer.is-recording .tb-rec-dot { animation: none; }
            .tb-action:active,
            .tb-icon:active { transform: none; }
            .tb-chevron { transition: none; }
        }

        /* Content inner */
        .content-inner {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .content-inner.live {
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Onboarding fills everything */
        .fullscreen {
            position: fixed;
            inset: 0;
            z-index: 100;
            background: var(--bg-app);
        }

        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }
    `;

    static properties = {
        currentView: { type: String },
        statusText: { type: String },
        startTime: { type: Number },
        isRecording: { type: Boolean },
        sessionActive: { type: Boolean },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        responses: { type: Array },
        currentResponseIndex: { type: Number },
        liveTranscript: { type: String },
        selectedScreenshotInterval: { type: String },
        selectedImageQuality: { type: String },
        layoutMode: { type: String },
        _viewInstances: { type: Object, state: true },
        _isClickThrough: { state: true },
        _awaitingNewResponse: { state: true },
        shouldAnimateResponse: { type: Boolean },
        _storageLoaded: { state: true },
        _updateAvailable: { state: true },
        _whisperDownloading: { state: true },
        _collapsed: { state: true },
        _menuOpen: { state: true },
    };

    constructor() {
        super();
        this.currentView = 'main';
        this.statusText = '';
        this.startTime = null;
        this.isRecording = false;
        this.sessionActive = false;
        this.selectedProfile = 'interview';
        this.selectedLanguage = 'en-US';
        this.selectedScreenshotInterval = '5';
        this.selectedImageQuality = 'medium';
        this.layoutMode = 'normal';
        this.responses = [];
        this.currentResponseIndex = -1;
        this.liveTranscript = '';
        this._viewInstances = new Map();
        this._isClickThrough = false;
        this._awaitingNewResponse = false;
        this._currentResponseIsComplete = true;
        this.shouldAnimateResponse = false;
        this._storageLoaded = false;
        this._timerInterval = null;
        this._updateAvailable = false;
        this._whisperDownloading = false;
        this._localVersion = '';
        this._collapsed = false;
        this._menuOpen = false;

        this._loadFromStorage();
        this._checkForUpdates();
    }

    async _checkForUpdates() {
        try {
            this._localVersion = await helpingHands.getVersion();
            this.requestUpdate();

            const res = await fetch('https://raw.githubusercontent.com/sohzm/cheating-daddy/refs/heads/master/package.json');
            if (!res.ok) return;
            const remote = await res.json();
            const remoteVersion = remote.version;

            const toNum = v => v.split('.').map(Number);
            const [rMaj, rMin, rPatch] = toNum(remoteVersion);
            const [lMaj, lMin, lPatch] = toNum(this._localVersion);

            if (rMaj > lMaj || (rMaj === lMaj && rMin > lMin) || (rMaj === lMaj && rMin === lMin && rPatch > lPatch)) {
                this._updateAvailable = true;
                this.requestUpdate();
            }
        } catch (e) {
            // silently ignore
        }
    }

    async _loadFromStorage() {
        try {
            const [config, prefs] = await Promise.all([helpingHands.storage.getConfig(), helpingHands.storage.getPreferences()]);

            this.currentView = config.onboarded ? 'main' : 'onboarding';
            this.selectedProfile = prefs.selectedProfile || 'interview';
            this.selectedLanguage = prefs.selectedLanguage || 'en-US';
            this.selectedScreenshotInterval = prefs.selectedScreenshotInterval || '5';
            this.selectedImageQuality = prefs.selectedImageQuality || 'medium';
            this.layoutMode = config.layout || 'normal';

            this._storageLoaded = true;
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading from storage:', error);
            this._storageLoaded = true;
            this.requestUpdate();
        }
    }

    connectedCallback() {
        super.connectedCallback();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.on('new-response', (_, response) => this.addNewResponse(response));
            ipcRenderer.on('update-response', (_, response) => this.updateCurrentResponse(response));
            ipcRenderer.on('update-transcript', (_, transcript) => this.updateLiveTranscript(transcript));
            ipcRenderer.on('update-status', (_, status) => this.setStatus(status));
            ipcRenderer.on('click-through-toggled', (_, isEnabled) => {
                this._isClickThrough = isEnabled;
            });
            ipcRenderer.on('reconnect-failed', (_, data) => this.addNewResponse(data.message));
            ipcRenderer.on('whisper-downloading', (_, downloading) => {
                this._whisperDownloading = downloading;
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopTimer();
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.removeAllListeners('new-response');
            ipcRenderer.removeAllListeners('update-response');
            ipcRenderer.removeAllListeners('update-transcript');
            ipcRenderer.removeAllListeners('update-status');
            ipcRenderer.removeAllListeners('click-through-toggled');
            ipcRenderer.removeAllListeners('reconnect-failed');
            ipcRenderer.removeAllListeners('whisper-downloading');
        }
    }

    // ── Timer ──

    _startTimer() {
        this._stopTimer();
        if (this.startTime) {
            this._timerInterval = setInterval(() => this.requestUpdate(), 1000);
        }
    }

    _stopTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    getElapsedTime() {
        if (!this.startTime) return '0:00';
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const pad = n => String(n).padStart(2, '0');
        if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
        return `${m}:${pad(s)}`;
    }

    // ── Status & Responses ──

    setStatus(text) {
        this.statusText = text;
        if (text.includes('Ready') || text.includes('Listening') || text.includes('Error')) {
            this._currentResponseIsComplete = true;
        }
    }

    addNewResponse(response) {
        const wasOnLatest = this.currentResponseIndex === this.responses.length - 1;
        this.responses = [...this.responses, response];
        if (wasOnLatest || this.currentResponseIndex === -1) {
            this.currentResponseIndex = this.responses.length - 1;
        }
        this._awaitingNewResponse = false;
        this.requestUpdate();
    }

    updateCurrentResponse(response) {
        if (this.responses.length > 0) {
            this.responses = [...this.responses.slice(0, -1), response];
        } else {
            this.addNewResponse(response);
        }
        this.requestUpdate();
    }

    updateLiveTranscript(transcript) {
        this.liveTranscript = transcript || '';
        this.requestUpdate();
    }

    // ── Navigation ──

    navigate(view) {
        this.currentView = view;
        this.requestUpdate();
    }

    async handleClose() {
        if (this.currentView === 'assistant') {
            helpingHands.stopCapture();
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('close-session');
            }
            this.sessionActive = false;
            this._collapsed = false;
            this._menuOpen = false;
            this._stopTimer();
            this.currentView = 'main';
        } else {
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('quit-application');
            }
        }
    }

    async _handleMinimize() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('window-minimize');
        }
    }

    async handleHideToggle() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('toggle-window-visibility');
        }
    }

    // ── Session start ──

    async handleStart() {
        const prefs = await helpingHands.storage.getPreferences();
        const providerMode = prefs.providerMode === 'cloud' ? 'byok' : prefs.providerMode || 'byok';
        const providerConfig = prefs.providerConfig || { audio: 'gemini', text: 'groq', image: 'gemini' };

        if (providerMode === 'cloud') {
            const creds = await helpingHands.storage.getCredentials();
            if (!creds.cloudToken || creds.cloudToken.trim() === '') {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }

            const success = await helpingHands.initializeCloud(this.selectedProfile);
            if (!success) {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }
        } else if (providerMode === 'local' || providerConfig.audio === 'whisper-local') {
            const success = await helpingHands.initializeLocal(this.selectedProfile);
            if (!success) {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }
        } else if (providerConfig.audio === 'speechmatics') {
            const smKey = await helpingHands.storage.getSpeechmaticsApiKey();
            if (!smKey || smKey.trim() === '') {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }

            const success = await helpingHands.initializeSpeechmatics(this.selectedProfile, this.selectedLanguage);
            if (!success) {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }
        } else {
            const apiKey = await helpingHands.storage.getApiKey();
            if (!apiKey || apiKey === '') {
                const mainView = this.shadowRoot.querySelector('main-view');
                if (mainView && mainView.triggerApiKeyError) {
                    mainView.triggerApiKeyError();
                }
                return;
            }

            await helpingHands.initializeGemini(this.selectedProfile, this.selectedLanguage);
        }

        helpingHands.startCapture(this.selectedScreenshotInterval, this.selectedImageQuality);
        this.responses = [];
        this.currentResponseIndex = -1;
        this.liveTranscript = '';
        this._collapsed = false;
        this.startTime = Date.now();
        this.sessionActive = true;
        this.currentView = 'assistant';
        this._startTimer();
    }

    async handleAPIKeyHelp() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', 'https://cheatingdaddy.com/help/api-key');
        }
    }

    async handleGroqAPIKeyHelp() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', 'https://console.groq.com/keys');
        }
    }

    // ── Settings handlers ──

    async handleProfileChange(profile) {
        this.selectedProfile = profile;
        await helpingHands.storage.updatePreference('selectedProfile', profile);
    }

    async handleLanguageChange(language) {
        this.selectedLanguage = language;
        await helpingHands.storage.updatePreference('selectedLanguage', language);
    }

    async handleScreenshotIntervalChange(interval) {
        this.selectedScreenshotInterval = interval;
        await helpingHands.storage.updatePreference('selectedScreenshotInterval', interval);
    }

    async handleImageQualityChange(quality) {
        this.selectedImageQuality = quality;
        await helpingHands.storage.updatePreference('selectedImageQuality', quality);
    }

    async handleLayoutModeChange(layoutMode) {
        this.layoutMode = layoutMode;
        await helpingHands.storage.updateConfig('layout', layoutMode);
        this.requestUpdate();
    }

    async handleExternalLinkClick(url) {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('open-external', url);
        }
    }

    async handleSendText(message) {
        const result = await window.helpingHands.sendTextMessage(message);
        if (!result.success) {
            this.setStatus('Error sending message: ' + result.error);
        } else {
            this.setStatus('Message sent...');
            this._awaitingNewResponse = true;
        }
    }

    handleResponseIndexChanged(e) {
        this.currentResponseIndex = e.detail.index;
        this.shouldAnimateResponse = false;
        this.requestUpdate();
    }

    handleOnboardingComplete() {
        this.currentView = 'main';
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (changedProperties.has('currentView') && window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('view-changed', this.currentView);
        }
    }

    // ── Helpers ──

    _isLiveMode() {
        return this.currentView === 'assistant';
    }

    // ── Render ──

    renderCurrentView() {
        switch (this.currentView) {
            case 'onboarding':
                return html`
                    <onboarding-view .onComplete=${() => this.handleOnboardingComplete()} .onClose=${() => this.handleClose()}></onboarding-view>
                `;

            case 'main':
                return html`
                    <main-view
                        .selectedProfile=${this.selectedProfile}
                        .onProfileChange=${p => this.handleProfileChange(p)}
                        .onStart=${() => this.handleStart()}
                        .onExternalLink=${url => this.handleExternalLinkClick(url)}
                        .whisperDownloading=${this._whisperDownloading}
                    ></main-view>
                `;

            case 'ai-customize':
                return html`
                    <ai-customize-view
                        .selectedProfile=${this.selectedProfile}
                        .onProfileChange=${p => this.handleProfileChange(p)}
                    ></ai-customize-view>
                `;

            case 'customize':
                return html`
                    <customize-view
                        .selectedProfile=${this.selectedProfile}
                        .selectedLanguage=${this.selectedLanguage}
                        .selectedScreenshotInterval=${this.selectedScreenshotInterval}
                        .selectedImageQuality=${this.selectedImageQuality}
                        .layoutMode=${this.layoutMode}
                        .onProfileChange=${p => this.handleProfileChange(p)}
                        .onLanguageChange=${l => this.handleLanguageChange(l)}
                        .onScreenshotIntervalChange=${i => this.handleScreenshotIntervalChange(i)}
                        .onImageQualityChange=${q => this.handleImageQualityChange(q)}
                        .onLayoutModeChange=${lm => this.handleLayoutModeChange(lm)}
                    ></customize-view>
                `;

            case 'feedback':
                return html`<feedback-view></feedback-view>`;

            case 'help':
                return html`<help-view .onExternalLinkClick=${url => this.handleExternalLinkClick(url)}></help-view>`;

            case 'history':
                return html`<history-view></history-view>`;

            case 'assistant':
                return html`
                    <assistant-view
                        .responses=${this.responses}
                        .currentResponseIndex=${this.currentResponseIndex}
                        .liveTranscript=${this.liveTranscript}
                        .selectedProfile=${this.selectedProfile}
                        .onSendText=${msg => this.handleSendText(msg)}
                        .shouldAnimateResponse=${this.shouldAnimateResponse}
                        @response-index-changed=${this.handleResponseIndexChanged}
                        @response-animation-complete=${() => {
                            this.shouldAnimateResponse = false;
                            this._currentResponseIsComplete = true;
                            this.requestUpdate();
                        }}
                    ></assistant-view>
                `;

            default:
                return html`<div>Unknown view: ${this.currentView}</div>`;
        }
    }

    renderSidebar() {
        const items = [
            {
                id: 'main',
                label: 'Home',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path
                            d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.67 2.67 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"
                        />
                        <path d="M16 15c-2.21 1.333-5.792 1.333-8 0" />
                    </g>
                </svg>`,
            },
            {
                id: 'ai-customize',
                label: 'AI Customization',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 3v7h6l-8 11v-7H5z"
                    />
                </svg>`,
            },
            {
                id: 'history',
                label: 'History',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path
                            d="M10 20.777a9 9 0 0 1-2.48-.969M14 3.223a9.003 9.003 0 0 1 0 17.554m-9.421-3.684a9 9 0 0 1-1.227-2.592M3.124 10.5c.16-.95.468-1.85.9-2.675l.169-.305m2.714-2.941A9 9 0 0 1 10 3.223"
                        />
                        <path d="M12 8v4l3 3" />
                    </g>
                </svg>`,
            },
            {
                id: 'customize',
                label: 'Settings',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path
                            d="M19.875 6.27A2.23 2.23 0 0 1 21 8.218v7.284c0 .809-.443 1.555-1.158 1.948l-6.75 4.27a2.27 2.27 0 0 1-2.184 0l-6.75-4.27A2.23 2.23 0 0 1 3 15.502V8.217c0-.809.443-1.554 1.158-1.947l6.75-3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98z"
                        />
                        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
                    </g>
                </svg>`,
            },
            {
                id: 'feedback',
                label: 'Feedback',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM9.5 9h.01m4.99 0h.01" />
                        <path d="M9.5 13a3.5 3.5 0 0 0 5 0" />
                    </g>
                </svg>`,
            },
            {
                id: 'help',
                label: 'Help',
                icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                        <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9s-9-1.8-9-9s1.8-9 9-9m0 13v.01" />
                        <path d="M12 13a2 2 0 0 0 .914-3.782a1.98 1.98 0 0 0-2.414.483" />
                    </g>
                </svg>`,
            },
        ];

        return html`
            <div class="sidebar ${this._isLiveMode() ? 'hidden' : ''}">
                <div class="sidebar-brand">
                    <span class="brand-mark">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2v6m0 0 3-2m-3 2L9 6M5 12H2m20 0h-3M7 17l-2 2m12-2 2 2M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                        </svg>
                    </span>
                    <h1>Helping Hands</h1>
                </div>
                <nav class="sidebar-nav">
                    ${items.map(
                        item => html`
                            <button
                                class="nav-item ${this.currentView === item.id ? 'active' : ''}"
                                @click=${() => this.navigate(item.id)}
                                title=${item.label}
                            >
                                ${item.icon} ${item.label}
                            </button>
                        `
                    )}
                </nav>
                <div class="sidebar-footer">
                    ${this._updateAvailable
                        ? html`
                              <button class="update-btn" @click=${() => this.handleExternalLinkClick('https://cheatingdaddy.com/download')}>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                      <path
                                          fill="none"
                                          stroke="currentColor"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                          stroke-width="2"
                                          d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5l5-5m-5-7v12"
                                      />
                                  </svg>
                                  Update available
                              </button>
                          `
                        : html` <div class="version-text">v${this._localVersion}</div> `}
                </div>
            </div>
        `;
    }

    renderLiveBar() {
        if (!this._isLiveMode()) return '';

        const profileLabels = {
            interview: 'Interview',
            sales: 'Sales Call',
            meeting: 'Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation',
            exam: 'Exam',
        };

        const isListening = (this.statusText || '').toLowerCase().includes('listen');
        const sessionActive = this.sessionActive === true;
        const hasTranscript = (this.liveTranscript || '').trim() !== '';
        const menuOpen = this._menuOpen === true;
        const collapsed = this._collapsed === true;

        return html`
            <div class="live-toolbar" role="toolbar" aria-label="Live session controls">
                <!-- LEFT: identity + live status -->
                <div class="tb-left">
                    <span class="tb-brand">
                        <span class="tb-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15l-1.7-4L6 9.3l4.3-1.7L12 3Z" />
                                <path d="M18.5 14.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7Z" />
                            </svg>
                        </span>
                        <span class="tb-wordmark">Helping Hands</span>
                    </span>

                    <span class="tb-profile">${profileLabels[this.selectedProfile] || 'Session'}</span>

                    <span class="tb-subdivider" aria-hidden="true"></span>

                    <span class="tb-status" role="group" aria-label="Live status">
                        <!-- (1) faux audio waveform — CSS-only, animates only while listening -->
                        <span
                            class="tb-wave ${isListening ? 'is-listening' : ''}"
                            role="img"
                            aria-label=${isListening ? 'Audio activity, listening' : 'Audio idle'}
                        >
                            <span class="tb-bar"></span>
                            <span class="tb-bar"></span>
                            <span class="tb-bar"></span>
                            <span class="tb-bar"></span>
                            <span class="tb-bar"></span>
                        </span>

                        <!-- (2) screen capture glyph + red dot -->
                        <span
                            class="tb-ind tb-screen ${sessionActive ? 'is-active' : ''}"
                            role="img"
                            aria-label=${sessionActive ? 'Screen capture active' : 'Screen capture inactive'}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="12" rx="2" />
                                <path d="M8 20h8M12 16v4" />
                            </svg>
                            <span class="tb-badge" aria-hidden="true"></span>
                        </span>

                        <!-- (3) mic glyph + pulsing red dot -->
                        <span
                            class="tb-ind tb-mic ${isListening ? 'is-active' : ''}"
                            role="img"
                            aria-label=${isListening ? 'Microphone active' : 'Microphone idle'}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <rect x="9" y="3" width="6" height="11" rx="3" />
                                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                            </svg>
                            <span class="tb-badge tb-badge-pulse" aria-hidden="true"></span>
                        </span>
                    </span>
                </div>

                <span class="tb-divider" aria-hidden="true"></span>

                <!-- CENTER: primary actions -->
                <div class="tb-center" role="group" aria-label="Actions">
                    <button
                        class="tb-action tb-answer"
                        @click=${() => this.handleForceAnswer()}
                        ?disabled=${!hasTranscript}
                        aria-label="Generate an answer from what's been said"
                        title="Generate an answer from what's been said"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
                            <path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
                        </svg>
                        <span>Answer</span>
                    </button>

                    <button
                        class="tb-action"
                        @click=${() => this.handleAnalyze()}
                        aria-label="Analyze screen — capture and answer"
                        title="Analyze screen (capture &amp; answer)"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
                            <circle cx="12" cy="12" r="2.5" />
                        </svg>
                        <span>Analyze</span>
                    </button>

                    <button
                        class="tb-action"
                        @click=${() => this.handleChat()}
                        aria-label="Focus the chat input"
                        title="Type a message"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 12a8 8 0 0 1-11.3 7.3L3 21l1.7-6.7A8 8 0 1 1 21 12Z" />
                        </svg>
                        <span>Chat</span>
                    </button>
                </div>

                <span class="tb-divider" aria-hidden="true"></span>

                <!-- RIGHT: session meta + window controls -->
                <div class="tb-right" role="group" aria-label="Session and window controls">
                    <span class="tb-timer ${sessionActive ? 'is-recording' : ''}" aria-label="Elapsed time ${this.getElapsedTime()}">
                        <span class="tb-rec-dot" aria-hidden="true"></span>
                        <span class="tb-time-digits">${this.getElapsedTime()}</span>
                    </span>

                    <div class="tb-menu-wrap">
                        <button
                            class="tb-icon tb-overflow ${menuOpen ? 'is-open' : ''}"
                            @click=${() => this.toggleOverflowMenu()}
                            aria-haspopup="menu"
                            aria-expanded=${menuOpen ? 'true' : 'false'}
                            aria-label="More options"
                            title="More options"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <circle cx="12" cy="5" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="12" cy="19" r="1.8" />
                            </svg>
                        </button>

                        ${menuOpen
                            ? html`
                                <div class="tb-menu" role="menu" aria-label="More options">
                                    ${this._isClickThrough
                                        ? html`<div class="tb-menu-status" role="presentation">
                                            <span class="tb-menu-dot" aria-hidden="true"></span>
                                            <span>Click-through on</span>
                                        </div>`
                                        : ''}
                                    <button class="tb-menu-item" role="menuitem" @click=${() => this.menuAction('hide')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                            <path d="M9.4 5.2A9 9 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3M6.6 6.6A12 12 0 0 0 3 12c0 2.5 4 7 9 7a9 9 0 0 0 3.2-.6" />
                                        </svg>
                                        <span>Hide overlay <span class="tb-menu-hint">⌘\\</span></span>
                                    </button>
                                    <button class="tb-menu-item" role="menuitem" @click=${() => this.menuAction('new')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />
                                        </svg>
                                        <span>New session</span>
                                    </button>
                                    <div class="tb-menu-sep" role="separator"></div>
                                    <button class="tb-menu-item tb-danger" role="menuitem" @click=${() => this.menuAction('end')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <path d="M18 6 6 18M6 6l12 12" />
                                        </svg>
                                        <span>End session</span>
                                    </button>
                                </div>`
                            : ''}
                    </div>

                    <button class="tb-icon tb-move" aria-label="Move window — drag to reposition" title="Drag to move">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5" />
                        </svg>
                    </button>

                    <button
                        class="tb-icon tb-collapse"
                        @click=${() => this.toggleCollapsed()}
                        aria-pressed=${collapsed ? 'true' : 'false'}
                        aria-label=${collapsed ? 'Expand panel' : 'Collapse panel'}
                        title=${collapsed ? 'Expand' : 'Collapse'}
                    >
                        <svg class="tb-chevron ${collapsed ? 'is-collapsed' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M6 15l6-6 6 6" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    handleAnalyze() {
        // Route through the assistant view so it shows the "Analyzing your screen…" progress
        // state (spinner) instead of silently capturing.
        const av = this.shadowRoot.querySelector('assistant-view');
        if (av && av.handleScreenAnswer) {
            av.handleScreenAnswer();
        } else if (window.captureManualScreenshot) {
            window.captureManualScreenshot();
        }
    }

    async handleNewSession() {
        this.responses = [];
        this.currentResponseIndex = -1;
        this.liveTranscript = '';
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('start-new-session');
            } catch (e) {
                console.error('Failed to start new session:', e);
            }
        }
        this.requestUpdate();
    }

    async handleForceAnswer() {
        const transcript = (this.liveTranscript || '').trim();
        if (transcript === '') return; // mirrors the ?disabled rule
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('force-answer', transcript);
            } catch (e) {
                console.error('Failed to force answer:', e);
            }
        }
    }

    handleChat() {
        // Un-collapse first so the input is visible, then focus it across the child shadow root.
        if (this._collapsed) this._collapsed = false;
        this.updateComplete.then(() => {
            this.shadowRoot.querySelector('assistant-view')?.focusChat();
        });
    }

    toggleCollapsed() {
        this._collapsed = !this._collapsed;
        // Shrink/restore the actual window so the collapsed state is a toolbar-only strip
        // (not just a hidden card over a full-size translucent window).
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.invoke('set-overlay-collapsed', this._collapsed);
            } catch (e) {
                console.error('Failed to toggle overlay collapse:', e);
            }
        }
    }

    toggleOverflowMenu() {
        this._menuOpen = !this._menuOpen;
        if (this._menuOpen) {
            // Close on the next click outside the host (capture phase so it always fires).
            const close = e => {
                if (!e.composedPath().includes(this)) {
                    this._menuOpen = false;
                }
                if (!this._menuOpen) {
                    document.removeEventListener('click', close, true);
                }
            };
            // Defer so the click that OPENED the menu doesn't immediately close it.
            setTimeout(() => document.addEventListener('click', close, true), 0);
        }
    }

    menuAction(kind) {
        this._menuOpen = false;
        if (kind === 'hide') this.handleHideToggle();
        else if (kind === 'new') this.handleNewSession();
        else if (kind === 'end') this.handleClose();
    }

    render() {
        // Onboarding is fullscreen, no sidebar
        if (this.currentView === 'onboarding') {
            return html` <div class="fullscreen">${this.renderCurrentView()}</div> `;
        }

        const isLive = this._isLiveMode();

        return html`
            <div class="app-shell">
                <div class="top-drag-bar ${isLive ? 'hidden' : ''}">
                    <div class="traffic-lights">
                        <button class="traffic-light close" @click=${() => this.handleClose()} title="Close"></button>
                        <button class="traffic-light minimize" @click=${() => this._handleMinimize()} title="Minimize"></button>
                        <button class="traffic-light maximize" title="Maximize"></button>
                    </div>
                    <div class="drag-region"></div>
                </div>
                ${this.renderSidebar()}
                <div class="content ${isLive ? 'live' : ''}">
                    ${isLive ? this.renderLiveBar() : ''}
                    <div class="content-inner ${isLive ? 'live' : ''} ${isLive && this._collapsed ? 'collapsed' : ''}">${this.renderCurrentView()}</div>
                </div>
            </div>
        `;
    }
}

customElements.define('helping-hands-app', HelpingHandsApp);
