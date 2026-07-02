import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class AssistantView extends LitElement {
    static styles = css`
        :host {
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 0 8px 8px;
            gap: 8px;
            box-sizing: border-box;
        }

        * {
            font-family: var(--font);
            cursor: default;
        }

        /* ── Answer card (kit "Floating live assistant" answer surface) ── */

        .answer-card {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            position: relative;
            /* Alpha-carrying tokens so the answer overlay honors the Settings
               "Background Transparency" slider (was a fixed 0.94 gradient). */
            background: linear-gradient(180deg, var(--bg-elevated), var(--bg-surface));
            border: 1px solid var(--border-strong);
            border-radius: 0;
            box-shadow: var(--shadow-accent), 0 20px 50px rgba(0, 0, 0, 0.5);
            overflow: hidden;
        }

        /* CRT scanline overlay — faint, non-interactive, sits beneath the content (z-index 2) */
        .answer-card::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background: repeating-linear-gradient(0deg, rgba(59, 232, 107, 0.05) 0 1px, transparent 1px 3px);
        }

        /* HUD corner bracket — bottom-right */
        .answer-card::after {
            content: '';
            position: absolute;
            right: 0;
            bottom: 0;
            width: 12px;
            height: 12px;
            border: 1px solid var(--accent);
            border-left: none;
            border-top: none;
            z-index: 3;
            pointer-events: none;
        }

        .answer-card-head {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
            position: relative;
            z-index: 2;
            padding: 12px 16px 10px;
            border-bottom: 1px solid var(--border);
        }

        /* HUD corner bracket — top-left (anchored to the card's top-left corner) */
        .answer-card-head::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 12px;
            height: 12px;
            border: 1px solid var(--accent);
            border-right: none;
            border-bottom: none;
            pointer-events: none;
        }

        .answer-card-mark {
            width: 20px;
            height: 20px;
            border-radius: 0;
            flex-shrink: 0;
            /* Angular chamfer + phosphor glow (clip-path hides box-shadow, so glow via drop-shadow) */
            clip-path: polygon(
                0 0,
                calc(100% - var(--hud-cut-sm)) 0,
                100% var(--hud-cut-sm),
                100% 100%,
                var(--hud-cut-sm) 100%,
                0 calc(100% - var(--hud-cut-sm))
            );
            filter: drop-shadow(0 0 6px rgba(59, 232, 107, 0.5));
        }

        .answer-card-eyebrow {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: var(--font-weight-medium, 500);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--accent);
            text-shadow: 0 0 8px rgba(59, 232, 107, 0.35);
        }

        /* HUD readout tick before the wordmark */
        .answer-card-eyebrow::before {
            content: '▸ ';
            color: var(--accent);
        }

        /* ── Response body (scrolls inside the answer card) ── */

        .response-container {
            flex: 1;
            min-height: 0;
            position: relative;
            z-index: 2;
            overflow-y: auto;
            font-size: var(--response-font-size, 15px);
            line-height: var(--line-height);
            background: transparent;
            padding: var(--space-md) var(--space-md);
            scroll-behavior: smooth;
            user-select: text;
            cursor: text;
            color: var(--text-primary);
        }

        .response-container * {
            user-select: text;
            cursor: text;
        }

        .response-container a {
            cursor: pointer;
        }

        .response-container [data-word] {
            display: inline-block;
        }

        /* ── Markdown ── */

        .response-container h1,
        .response-container h2,
        .response-container h3,
        .response-container h4,
        .response-container h5,
        .response-container h6 {
            margin: 1em 0 0.5em 0;
            color: var(--text-primary);
            font-weight: var(--font-weight-semibold);
        }

        .response-container h1 {
            font-size: 1.5em;
        }
        .response-container h2 {
            font-size: 1.3em;
        }
        .response-container h3 {
            font-size: 1.15em;
        }
        .response-container h4 {
            font-size: 1.05em;
        }
        .response-container h5,
        .response-container h6 {
            font-size: 1em;
        }

        .response-container p {
            margin: 0.6em 0;
            color: var(--text-primary);
        }

        .response-container ul,
        .response-container ol {
            margin: 0.6em 0;
            padding-left: 1.5em;
            color: var(--text-primary);
        }

        .response-container li {
            margin: 0.3em 0;
        }

        .response-container blockquote {
            margin: 0.8em 0;
            padding: 0.5em 1em;
            border-left: 2px solid var(--border-strong);
            background: var(--bg-surface);
            border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        .response-container code {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            padding: 0.15em 0.4em;
            border-radius: var(--radius-sm);
            font-family: var(--font-mono);
            font-size: 0.85em;
        }

        /* HUD code block — sharp mono panel with a thin accent top tick */
        .response-container pre {
            background: #040806;
            border: 1px solid var(--border);
            border-top: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
            border-radius: 0;
            padding: 14px 16px;
            overflow-x: auto;
            margin: 0.8em 0;
            font-family: var(--font-mono);
            font-size: 12px;
            line-height: 1.7;
        }

        .response-container pre code {
            background: none;
            border: none;
            padding: 0;
            font-size: 12px;
            line-height: 1.7;
        }

        .code-block-wrapper {
            position: relative;
        }

        .copy-code-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            font-family: var(--font-mono);
            font-size: 0.72rem;
            line-height: 1;
            color: var(--text-secondary);
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
            z-index: 2;
        }

        .code-block-wrapper:hover .copy-code-btn {
            opacity: 1;
        }

        .copy-code-btn:hover {
            color: var(--text-primary);
            border-color: var(--border-strong);
        }

        .copy-code-btn.copied {
            opacity: 1;
            color: var(--success-color);
            border-color: var(--success-color);
        }

        .copy-code-btn svg {
            width: 12px;
            height: 12px;
        }

        .live-transcript {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            flex-shrink: 0;
            padding: 12px 14px;
            background: var(--bg-surface);
            backdrop-filter: blur(18px) saturate(1.15);
            -webkit-backdrop-filter: blur(18px) saturate(1.15);
            border: 1px solid var(--border-strong);
            border-left: 2px solid color-mix(in srgb, var(--accent) 45%, transparent);
            border-radius: 0;
            max-height: 4.8em;
            overflow-y: auto;
        }

        /* Idle transcript: cool the HUD accent edge down to a neutral hairline */
        .live-transcript.waiting {
            border-color: var(--border);
            border-left-color: var(--border);
        }

        .live-transcript-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
            font-family: var(--font-mono);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--accent);
            padding-top: 2px;
        }

        .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 8px var(--accent);
            animation: live-pulse 1.4s ease-in-out infinite;
        }

        @keyframes live-pulse {
            0%,
            100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.3;
                transform: scale(0.82);
            }
        }

        .live-transcript-text {
            font-size: 13px;
            line-height: 1.55;
            color: var(--text-secondary);
        }

        /* Idle state: muted dot + placeholder text */
        .live-transcript.waiting .live-transcript-label,
        .live-transcript.waiting .live-dot {
            color: var(--text-muted);
            background: var(--text-muted);
            box-shadow: none;
            animation: none;
        }

        .live-transcript.waiting .live-transcript-label {
            background: none;
        }

        .live-transcript.waiting .live-transcript-text {
            color: var(--text-muted);
            font-style: italic;
        }

        /* Interviewee ("You") panel — distinct edge/label so the two streams read apart. */
        .live-transcript.interviewee {
            margin-top: 6px;
            border-left-color: color-mix(in srgb, var(--text-secondary) 60%, transparent);
        }
        .live-transcript.interviewee:not(.waiting) .live-transcript-label {
            color: var(--text-secondary);
        }
        .live-transcript.interviewee:not(.waiting) .live-dot {
            background: var(--text-secondary);
            box-shadow: 0 0 8px var(--text-secondary);
        }

        /* Progress banner shown while an answer is being generated (Analyze / Chat) */
        .answer-progress {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-shrink: 0;
            padding: 9px 14px;
            background: var(--accent-soft);
            border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
            border-radius: 0;
            font-size: 0.84rem;
            color: var(--text-primary);
        }

        .answer-progress-q {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .answer-spinner {
            flex-shrink: 0;
            width: 14px;
            height: 14px;
            border: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: answer-spin 0.7s linear infinite;
        }

        @keyframes answer-spin {
            to {
                transform: rotate(360deg);
            }
        }

        .response-container a {
            color: var(--accent);
            text-decoration: underline;
            text-underline-offset: 2px;
        }

        .response-container strong,
        .response-container b {
            font-weight: var(--font-weight-semibold);
        }

        .response-container hr {
            border: none;
            border-top: 1px solid var(--border);
            margin: 1.5em 0;
        }

        .response-container table {
            border-collapse: collapse;
            width: 100%;
            margin: 0.8em 0;
        }

        .response-container th,
        .response-container td {
            border: 1px solid var(--border);
            padding: var(--space-sm);
            text-align: left;
        }

        .response-container th {
            background: var(--bg-surface);
            font-weight: var(--font-weight-semibold);
        }

        .response-container::-webkit-scrollbar {
            width: 6px;
        }

        .response-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .response-container::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 0;
        }

        .response-container::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }

        /* ── Answer-panel toolbar (separate from the top menu bar) ── */

        .answer-toolbar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 6px 10px;
            margin-bottom: 8px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            -webkit-app-region: no-drag;
        }

        .at-left {
            flex: 1 1 0;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }

        .at-opacity-label {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            font-family: var(--font-mono);
        }

        .at-opacity {
            width: 96px;
            max-width: 40%;
            accent-color: var(--accent);
            cursor: pointer;
            -webkit-app-region: no-drag;
        }

        .at-opacity-val {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            font-family: var(--font-mono);
            font-variant-numeric: tabular-nums;
            min-width: 34px;
        }

        .at-center {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .at-nav {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: var(--bg-app);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            cursor: pointer;
            -webkit-app-region: no-drag;
        }

        .at-nav:not(:disabled):hover {
            color: var(--accent);
            border-color: var(--accent);
        }

        .at-nav:disabled {
            opacity: 0.35;
            cursor: default;
        }

        .at-nav svg {
            width: 14px;
            height: 14px;
        }

        .at-page {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            font-family: var(--font-mono);
            font-variant-numeric: tabular-nums;
            min-width: 46px;
            text-align: center;
        }

        .at-right {
            flex: 1 1 0;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
        }

        .at-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            cursor: pointer;
            -webkit-app-region: no-drag;
        }

        .at-icon:hover:not(:disabled) {
            color: var(--text-primary);
            border-color: var(--border-strong);
        }

        .at-icon:disabled {
            opacity: 0.35;
            cursor: default;
        }

        .at-icon.at-danger:hover:not(:disabled) {
            color: var(--error-color);
            border-color: var(--error-color);
        }

        .at-icon svg {
            width: 15px;
            height: 15px;
        }

        /* ── Response navigation strip ── */

        .response-nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-sm);
            padding: var(--space-xs) var(--space-md);
            border-top: 1px solid var(--border);
            background: var(--bg-app);
        }

        .nav-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: var(--space-xs);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color var(--transition);
        }

        .nav-btn:hover:not(:disabled) {
            color: var(--text-primary);
        }

        .nav-btn:disabled {
            opacity: 0.25;
            cursor: default;
        }

        .nav-btn svg {
            width: 14px;
            height: 14px;
        }

        .response-counter {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            font-family: var(--font-mono);
            min-width: 40px;
            text-align: center;
        }

        /* ── Bottom input bar ── */

        .input-bar {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-md);
            background: var(--bg-app);
        }

        .autoscroll-btn {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            background: var(--bg-elevated);
            color: var(--text-muted);
            cursor: pointer;
            transition: color var(--transition), background var(--transition), border-color var(--transition);
        }

        .autoscroll-btn svg {
            width: 16px;
            height: 16px;
        }

        .autoscroll-btn:hover {
            color: var(--text-secondary);
            border-color: var(--border-strong);
        }

        /* On = following latest: accent-tinted with a phosphor HUD glow */
        .autoscroll-btn.on {
            color: var(--accent);
            background: var(--accent-soft);
            border-color: color-mix(in srgb, var(--accent) 40%, transparent);
            box-shadow: var(--shadow-accent);
        }

        .input-bar-inner {
            display: flex;
            align-items: center;
            flex: 1;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 0;
            padding: 0 var(--space-md);
            height: 32px;
            transition: border-color var(--transition);
        }

        .input-bar-inner:focus-within {
            border-color: var(--accent);
            box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 3px rgba(59, 232, 107, 0.06);
        }

        .input-prompt {
            flex-shrink: 0;
            margin-right: 6px;
            font-family: var(--font-mono);
            font-size: var(--font-size-sm);
            color: var(--accent);
            user-select: none;
        }

        .input-bar-inner input {
            flex: 1;
            background: none;
            color: var(--text-primary);
            border: none;
            padding: 0;
            font-size: var(--font-size-sm);
            font-family: var(--font);
            height: 100%;
            outline: none;
        }

        .input-bar-inner input::placeholder {
            color: var(--text-muted);
        }

        /* Primary-tinted HUD "analyze" action. Shape left sharp/rectangular on purpose:
           the analyze-canvas traces its particle perimeter from geometry (r = height / 2),
           so no clip-path chamfer here — restyle colors/type only. */
        .analyze-btn {
            position: relative;
            background: var(--accent-soft);
            border: 1px solid var(--border-strong);
            color: var(--accent);
            cursor: pointer;
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium, 500);
            font-family: var(--font-mono);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            white-space: nowrap;
            padding: var(--space-xs) var(--space-md);
            border-radius: 0;
            height: 32px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition:
                border-color 0.4s ease,
                background var(--transition),
                box-shadow var(--transition);
            flex-shrink: 0;
            overflow: hidden;
        }

        .analyze-btn:hover:not(.analyzing) {
            border-color: var(--accent);
            background: color-mix(in srgb, var(--accent) 18%, transparent);
            box-shadow: var(--shadow-accent);
        }

        .analyze-btn.analyzing {
            cursor: default;
            border-color: transparent;
        }

        .analyze-btn-content {
            display: flex;
            align-items: center;
            gap: 4px;
            transition: opacity 0.4s ease;
            z-index: 1;
            position: relative;
        }

        .analyze-btn.analyzing .analyze-btn-content {
            opacity: 0;
        }

        .analyze-canvas {
            position: absolute;
            inset: -1px;
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            pointer-events: none;
        }
    `;

    static properties = {
        responses: { type: Array },
        currentResponseIndex: { type: Number },
        liveTranscript: { type: String },
        liveTranscriptInterviewee: { type: String },
        showInterviewee: { type: Boolean },
        selectedProfile: { type: String },
        onSendText: { type: Function },
        shouldAnimateResponse: { type: Boolean },
        backgroundTransparency: { type: Number },
        onOpacityChange: { type: Function },
        onClose: { type: Function },
        onClear: { type: Function },
        isAnalyzing: { type: Boolean, state: true },
        _pendingQuestion: { type: String, state: true },
        autoScroll: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.responses = [];
        this.currentResponseIndex = -1;
        this.liveTranscript = '';
        this.liveTranscriptInterviewee = '';
        this.showInterviewee = false;
        this.selectedProfile = 'interview';
        this.onSendText = () => {};
        this.backgroundTransparency = 0.8;
        this.onOpacityChange = () => {};
        this.onClose = () => {};
        this.onClear = () => {};
        this.isAnalyzing = false;
        this._pendingQuestion = ''; // chat question awaiting an answer (for the progress banner)
        this._pendingCountStart = 0;
        this.autoScroll = true; // pin the response to the newest content; auto-pauses if you scroll up
        this._animFrame = null;
    }

    getProfileNames() {
        return {
            interview: 'Job Interview',
            sales: 'Sales Call',
            meeting: 'Business Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation',
            exam: 'Exam Assistant',
        };
    }

    getCurrentResponse() {
        const profileNames = this.getProfileNames();
        return this.responses.length > 0 && this.currentResponseIndex >= 0
            ? this.responses[this.currentResponseIndex]
            : `Listening to your ${profileNames[this.selectedProfile] || 'session'}...`;
    }

    renderMarkdown(content) {
        if (typeof window !== 'undefined' && window.marked) {
            try {
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false,
                });
                let rendered = window.marked.parse(content);
                rendered = this.wrapWordsInSpans(rendered);
                return rendered;
            } catch (error) {
                console.warn('Error parsing markdown:', error);
                return content;
            }
        }
        return content;
    }

    wrapWordsInSpans(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tagsToSkip = ['PRE'];

        function wrap(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !tagsToSkip.includes(node.parentNode.tagName)) {
                const words = node.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                words.forEach(word => {
                    if (word.trim()) {
                        const span = document.createElement('span');
                        span.setAttribute('data-word', '');
                        span.textContent = word;
                        frag.appendChild(span);
                    } else {
                        frag.appendChild(document.createTextNode(word));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && !tagsToSkip.includes(node.tagName)) {
                Array.from(node.childNodes).forEach(wrap);
            }
        }
        Array.from(doc.body.childNodes).forEach(wrap);
        return doc.body.innerHTML;
    }

    navigateToPreviousResponse() {
        if (this.currentResponseIndex > 0) {
            this.currentResponseIndex--;
            this.dispatchEvent(
                new CustomEvent('response-index-changed', {
                    detail: { index: this.currentResponseIndex },
                })
            );
            this.requestUpdate();
        }
    }

    navigateToNextResponse() {
        if (this.currentResponseIndex < this.responses.length - 1) {
            this.currentResponseIndex++;
            this.dispatchEvent(
                new CustomEvent('response-index-changed', {
                    detail: { index: this.currentResponseIndex },
                })
            );
            this.requestUpdate();
        }
    }

    scrollResponseUp() {
        const container = this.shadowRoot.querySelector('.response-container');
        if (container) {
            const scrollAmount = container.clientHeight * 0.3;
            container.scrollTop = Math.max(0, container.scrollTop - scrollAmount);
        }
    }

    scrollResponseDown() {
        const container = this.shadowRoot.querySelector('.response-container');
        if (container) {
            const scrollAmount = container.clientHeight * 0.3;
            container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + scrollAmount);
        }
    }

    connectedCallback() {
        super.connectedCallback();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');

            this.handlePreviousResponse = () => this.navigateToPreviousResponse();
            this.handleNextResponse = () => this.navigateToNextResponse();
            this.handleScrollUp = () => this.scrollResponseUp();
            this.handleScrollDown = () => this.scrollResponseDown();

            ipcRenderer.on('navigate-previous-response', this.handlePreviousResponse);
            ipcRenderer.on('navigate-next-response', this.handleNextResponse);
            ipcRenderer.on('scroll-response-up', this.handleScrollUp);
            ipcRenderer.on('scroll-response-down', this.handleScrollDown);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopWaveformAnimation();

        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            if (this.handlePreviousResponse) ipcRenderer.removeListener('navigate-previous-response', this.handlePreviousResponse);
            if (this.handleNextResponse) ipcRenderer.removeListener('navigate-next-response', this.handleNextResponse);
            if (this.handleScrollUp) ipcRenderer.removeListener('scroll-response-up', this.handleScrollUp);
            if (this.handleScrollDown) ipcRenderer.removeListener('scroll-response-down', this.handleScrollDown);
        }
    }

    async handleSendText() {
        const textInput = this.shadowRoot.querySelector('#textInput');
        if (textInput && textInput.value.trim()) {
            const message = textInput.value.trim();
            textInput.value = '';
            // Show the question in a progress banner so it's clear what the next answer responds to.
            this._pendingQuestion = message;
            this._pendingCountStart = this.responses.length;
            await this.onSendText(message);
        }
    }

    handleTextKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    async handleScreenAnswer() {
        if (this.isAnalyzing) return;
        if (window.captureManualScreenshot) {
            this.isAnalyzing = true;
            this._responseCountWhenStarted = this.responses.length;
            window.captureManualScreenshot();
        }
    }

    _startWaveformAnimation() {
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const dangerColor = getComputedStyle(this).getPropertyValue('--danger').trim() || '#EF4444';
        const startTime = performance.now();
        const FADE_IN = 0.5; // seconds
        const PARTICLE_SPREAD = 4; // px inward from border
        const PARTICLE_COUNT = 250;

        // Pill perimeter helpers
        const w = rect.width;
        const h = rect.height;
        const r = h / 2; // pill radius = half height
        const straightLen = w - 2 * r;
        const arcLen = Math.PI * r;
        const perimeter = 2 * straightLen + 2 * arcLen;

        // Given a distance along the perimeter, return {x, y, nx, ny} (position + inward normal)
        const pointOnPerimeter = d => {
            d = ((d % perimeter) + perimeter) % perimeter;
            // Top straight: left to right
            if (d < straightLen) {
                return { x: r + d, y: 0, nx: 0, ny: 1 };
            }
            d -= straightLen;
            // Right arc
            if (d < arcLen) {
                const angle = -Math.PI / 2 + (d / arcLen) * Math.PI;
                return {
                    x: w - r + Math.cos(angle) * r,
                    y: r + Math.sin(angle) * r,
                    nx: -Math.cos(angle),
                    ny: -Math.sin(angle),
                };
            }
            d -= arcLen;
            // Bottom straight: right to left
            if (d < straightLen) {
                return { x: w - r - d, y: h, nx: 0, ny: -1 };
            }
            d -= straightLen;
            // Left arc
            const angle = Math.PI / 2 + (d / arcLen) * Math.PI;
            return {
                x: r + Math.cos(angle) * r,
                y: r + Math.sin(angle) * r,
                nx: -Math.cos(angle),
                ny: -Math.sin(angle),
            };
        };

        // Pre-seed random offsets for stable particles
        const seeds = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            seeds.push({ pos: Math.random(), drift: Math.random(), depthSeed: Math.random() });
        }

        const draw = now => {
            const elapsed = (now - startTime) / 1000;
            const fade = Math.min(1, elapsed / FADE_IN);

            ctx.clearRect(0, 0, w, h);

            // ── Particle border ──
            ctx.fillStyle = dangerColor;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const s = seeds[i];
                const along = (s.pos + s.drift * elapsed * 0.03) * perimeter;
                const depth = s.depthSeed * PARTICLE_SPREAD;
                const density = 1 - depth / PARTICLE_SPREAD;

                if (Math.random() > density) continue;

                const p = pointOnPerimeter(along);
                const px = p.x + p.nx * depth;
                const py = p.y + p.ny * depth;
                const size = 0.8 + density * 0.6;

                ctx.globalAlpha = fade * density * 0.85;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Waveform ──
            const midY = h / 2;
            const waves = [
                { freq: 3, amp: 0.35, speed: 2.5, opacity: 0.9, width: 1.8 },
                { freq: 5, amp: 0.2, speed: 3.5, opacity: 0.5, width: 1.2 },
                { freq: 7, amp: 0.12, speed: 5, opacity: 0.3, width: 0.8 },
            ];

            for (const wave of waves) {
                ctx.beginPath();
                ctx.strokeStyle = dangerColor;
                ctx.globalAlpha = wave.opacity * fade;
                ctx.lineWidth = wave.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                for (let x = 0; x <= w; x++) {
                    const norm = x / w;
                    const envelope = Math.sin(norm * Math.PI);
                    const y = midY + Math.sin(norm * Math.PI * 2 * wave.freq + elapsed * wave.speed) * (midY * wave.amp) * envelope;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
            this._animFrame = requestAnimationFrame(draw);
        };

        this._animFrame = requestAnimationFrame(draw);
    }

    _stopWaveformAnimation() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        const canvas = this.shadowRoot.querySelector('.analyze-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const container = this.shadowRoot.querySelector('.response-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    firstUpdated() {
        super.firstUpdated();
        this.updateResponseContent();

        // Auto-pause/resume auto-scroll based on where the user has scrolled. If they scroll
        // up to read earlier text, stop pinning; when they return to the bottom, resume.
        const container = this.shadowRoot.querySelector('#responseContainer');
        if (container) {
            container.addEventListener('scroll', () => {
                const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 48;
                if (this.autoScroll !== nearBottom) this.autoScroll = nearBottom;
            });
        }
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        if (this.autoScroll) this.scrollToBottom();
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('responses') || changedProperties.has('currentResponseIndex')) {
            this.updateResponseContent();
        }

        if (changedProperties.has('isAnalyzing')) {
            if (this.isAnalyzing) {
                this._startWaveformAnimation();
            } else {
                this._stopWaveformAnimation();
            }
        }

        if (changedProperties.has('responses') && this.isAnalyzing) {
            if (this.responses.length > this._responseCountWhenStarted) {
                this.isAnalyzing = false;
            }
        }

        // Clear the chat "You asked…" banner once its answer has started streaming in.
        if (changedProperties.has('responses') && this._pendingQuestion) {
            if (this.responses.length > this._pendingCountStart) {
                this._pendingQuestion = '';
            }
        }

        // Keep the running conversation transcript scrolled to the latest words.
        if (changedProperties.has('liveTranscript')) {
            const tb = this.shadowRoot.querySelector('.live-transcript');
            if (tb) tb.scrollTop = tb.scrollHeight;
        }
    }

    updateResponseContent() {
        const container = this.shadowRoot.querySelector('#responseContainer');
        if (container) {
            const currentResponse = this.getCurrentResponse();
            const renderedResponse = this.renderMarkdown(currentResponse);
            container.innerHTML = renderedResponse;
            this.addCopyButtonsToCodeBlocks(container);
            if (this.autoScroll) {
                container.scrollTop = container.scrollHeight;
            }
            if (this.shouldAnimateResponse) {
                this.dispatchEvent(new CustomEvent('response-animation-complete', { bubbles: true, composed: true }));
            }
        }
    }

    addCopyButtonsToCodeBlocks(container) {
        const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

        container.querySelectorAll('pre').forEach(pre => {
            // Skip if already wrapped (e.g. on streaming re-render)
            if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.type = 'button';
            btn.innerHTML = `${copyIcon}<span>Copy</span>`;

            btn.addEventListener('click', async () => {
                const code = (pre.querySelector('code') || pre).innerText;
                try {
                    await navigator.clipboard.writeText(code);
                } catch (err) {
                    // Fallback for environments without async clipboard access
                    const textarea = document.createElement('textarea');
                    textarea.value = code;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }

                btn.classList.add('copied');
                btn.querySelector('span').textContent = 'Copied!';
                clearTimeout(btn._copyTimer);
                btn._copyTimer = setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.querySelector('span').textContent = 'Copy';
                }, 1500);
            });

            wrapper.appendChild(btn);
        });
    }

    // Called by the parent toolbar's "Chat" action to focus the message input.
    focusChat() {
        this.shadowRoot.querySelector('#textInput')?.focus();
    }

    render() {
        const transcript = (this.liveTranscript || '').trim();
        const intervieweeTranscript = (this.liveTranscriptInterviewee || '').trim();

        return html`
            <div class="live-transcript ${transcript ? '' : 'waiting'}" title="What the interviewer is saying (live)">
                <span class="live-transcript-label">
                    <span class="live-dot"></span>
                    // Interviewer · Live
                </span>
                <span class="live-transcript-text">${transcript || 'Waiting for speech…'}</span>
            </div>

            ${this.showInterviewee
                ? html`
                      <div class="live-transcript interviewee ${intervieweeTranscript ? '' : 'waiting'}" title="What you (the interviewee) are saying (live)">
                          <span class="live-transcript-label">
                              <span class="live-dot"></span>
                              // You · Live
                          </span>
                          <span class="live-transcript-text">${intervieweeTranscript || 'Waiting for you…'}</span>
                      </div>
                  `
                : ''}

            <div class="answer-toolbar" role="toolbar" aria-label="Answer panel controls">
                <div class="at-left">
                    <span class="at-opacity-label">Opacity</span>
                    <input
                        class="at-opacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        .value=${this.backgroundTransparency}
                        @input=${e => this.onOpacityChange(parseFloat(e.target.value))}
                        aria-label="Overlay opacity"
                    />
                    <span class="at-opacity-val">${Math.round((this.backgroundTransparency || 0) * 100)}%</span>
                </div>
                <div class="at-center">
                    <button
                        class="at-nav"
                        @click=${this.navigateToPreviousResponse}
                        ?disabled=${this.currentResponseIndex <= 0}
                        aria-label="Previous response"
                        title="Previous response"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <span class="at-page">${this.responses.length ? this.currentResponseIndex + 1 : 0} / ${this.responses.length}</span>
                    <button
                        class="at-nav"
                        @click=${this.navigateToNextResponse}
                        ?disabled=${this.currentResponseIndex >= this.responses.length - 1}
                        aria-label="Next response"
                        title="Next response"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
                <div class="at-right">
                    <button
                        class="at-icon at-danger"
                        @click=${() => this.onClear()}
                        ?disabled=${!this.responses.length}
                        aria-label="Clear answers"
                        title="Clear answers"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /></svg>
                    </button>
                    <button class="at-icon" @click=${() => this.onClose()} aria-label="Close session" title="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            ${this.isAnalyzing
                ? html`
                      <div class="answer-progress">
                          <span class="answer-spinner"></span>
                          <span>Analyzing your screen…</span>
                      </div>
                  `
                : this._pendingQuestion
                  ? html`
                          <div class="answer-progress">
                              <span class="answer-spinner"></span>
                              <span class="answer-progress-q">Answering: ${this._pendingQuestion}</span>
                          </div>
                      `
                  : ''}

            <div class="answer-card">
                <div class="answer-card-head">
                    <img class="answer-card-mark" src="assets/logo.png" alt="Helping Hands" />
                    <span class="answer-card-eyebrow">Helping Hands</span>
                </div>
                <div class="response-container" id="responseContainer"></div>
            </div>

            <div class="input-bar">
                <button
                    class="autoscroll-btn ${this.autoScroll ? 'on' : ''}"
                    @click=${this.toggleAutoScroll}
                    title=${this.autoScroll ? 'Auto-scroll on (following latest)' : 'Auto-scroll off'}
                    aria-pressed=${this.autoScroll ? 'true' : 'false'}
                    aria-label="Toggle auto-scroll"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 5v14M6 13l6 6 6-6" />
                    </svg>
                </button>
                <div class="input-bar-inner">
                    <span class="input-prompt" aria-hidden="true">›</span>
                    <input type="text" id="textInput" placeholder="Type a message..." @keydown=${this.handleTextKeydown} />
                </div>
                <button class="analyze-btn ${this.isAnalyzing ? 'analyzing' : ''}" @click=${this.handleScreenAnswer}>
                    <canvas class="analyze-canvas"></canvas>
                    <span class="analyze-btn-content">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 3v7h6l-8 11v-7H5z"
                            />
                        </svg>
                        Analyze Screen
                    </span>
                </button>
            </div>
        `;
    }
}

customElements.define('assistant-view', AssistantView);
