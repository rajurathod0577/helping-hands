import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';

export class AICustomizeView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            .unified-page {
                height: 100%;
            }
            .unified-wrap {
                height: 100%;
            }
            .eyebrow {
                font-family: var(--font-mono);
                font-size: 11px;
                font-weight: 500;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: var(--text-muted);
                margin-bottom: 6px;
            }
            /* HUD readout prefix */
            .eyebrow::before {
                content: '// ';
                color: var(--accent);
            }
            .form-label {
                font-size: 12px;
                font-weight: var(--font-weight-medium);
            }
            .control:focus {
                outline: none;
                border-color: var(--border-strong);
                box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 3px rgba(59, 232, 107, 0.06);
            }
            section.surface {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .form-grid {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: var(--space-md);
            }
            .form-group.vertical {
                display: flex;
                flex-direction: column;
            }
            .form-group.grow {
                flex: 1;
                min-height: 0;
            }
            .form-group.grow textarea.control {
                flex: 1;
                resize: none;
                overflow-y: auto;
                min-height: 0;
            }
            textarea.resume {
                min-height: 110px;
                max-height: 220px;
                resize: vertical;
            }

            .resume-header {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                margin-bottom: 6px;
            }
            .resume-header .form-label {
                margin: 0;
            }
            .resume-actions {
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            .attach-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                font-family: var(--font-mono);
                font-size: 12px;
                font-weight: var(--font-weight-medium);
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: var(--accent);
                background: var(--accent-soft);
                border: 1px solid var(--border-strong);
                border-radius: var(--radius-md);
                /* Angular chamfer — top-right + bottom-left cut */
                clip-path: polygon(
                    0 0,
                    calc(100% - var(--hud-cut-sm)) 0,
                    100% var(--hud-cut-sm),
                    100% 100%,
                    var(--hud-cut-sm) 100%,
                    0 calc(100% - var(--hud-cut-sm))
                );
                cursor: pointer;
                transition: background var(--transition), border-color var(--transition), filter var(--transition);
            }
            .attach-btn:hover {
                background: color-mix(in srgb, var(--accent) 22%, transparent);
                filter: drop-shadow(0 0 8px rgba(59, 232, 107, 0.35));
            }
            .attach-btn:disabled {
                opacity: 0.6;
                cursor: default;
            }
            .attach-btn svg {
                width: 14px;
                height: 14px;
            }
            .link-btn {
                background: none;
                border: none;
                color: var(--text-muted);
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                text-transform: uppercase;
                letter-spacing: 0.06em;
                cursor: pointer;
                padding: 2px 4px;
            }
            .link-btn:hover {
                color: var(--text-secondary);
            }
            /* HUD status line — leading glyph per state */
            .resume-status {
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                letter-spacing: 0.06em;
                color: var(--text-muted);
            }
            .resume-status.ok {
                color: var(--accent);
            }
            .resume-status.ok::before {
                content: '● ';
            }
            .resume-status.err {
                color: var(--danger);
            }
            .resume-status.err::before {
                content: '✕ ';
            }
        `,
    ];

    static properties = {
        selectedProfile: { type: String },
        onProfileChange: { type: Function },
        _context: { state: true },
        _resume: { state: true },
        _resumeStatus: { state: true },
        _resumeStatusKind: { state: true },
        _attaching: { state: true },
    };

    constructor() {
        super();
        this.selectedProfile = 'interview';
        this.onProfileChange = () => {};
        this._context = '';
        this._resume = '';
        this._resumeStatus = '';
        this._resumeStatusKind = '';
        this._attaching = false;
        this._loadFromStorage();
    }

    async _loadFromStorage() {
        try {
            const prefs = await helpingHands.storage.getPreferences();
            this._context = prefs.customPrompt || '';
            this._resume = prefs.resume || '';
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading AI customize storage:', error);
        }
    }

    _handleProfileChange(e) {
        this.onProfileChange(e.target.value);
    }

    async _saveContext(val) {
        this._context = val;
        await helpingHands.storage.updatePreference('customPrompt', val);
    }

    async _saveResume(val) {
        this._resume = val;
        this._resumeStatus = '';
        this._resumeStatusKind = '';
        await helpingHands.storage.updatePreference('resume', val);
    }

    async _attachResume() {
        if (this._attaching) return;
        this._attaching = true;
        this.requestUpdate();
        try {
            const result = await helpingHands.storage.attachResumeFile();
            if (result && result.success) {
                this._resume = result.text;
                await helpingHands.storage.updatePreference('resume', result.text);
                this._resumeStatus = `Loaded “${result.name}” (${result.text.length.toLocaleString()} chars)`;
                this._resumeStatusKind = 'ok';
            } else if (result && result.canceled) {
                // no-op
            } else {
                this._resumeStatus = (result && result.error) || 'Could not read that file.';
                this._resumeStatusKind = 'err';
            }
        } catch (e) {
            this._resumeStatus = 'Could not read that file.';
            this._resumeStatusKind = 'err';
        } finally {
            this._attaching = false;
            this.requestUpdate();
        }
    }

    async _clearResume() {
        this._resume = '';
        this._resumeStatus = '';
        this._resumeStatusKind = '';
        await helpingHands.storage.updatePreference('resume', '');
        this.requestUpdate();
    }

    render() {
        const profiles = [
            { value: 'interview', label: 'Job Interview' },
            { value: 'sales', label: 'Sales Call' },
            { value: 'meeting', label: 'Business Meeting' },
            { value: 'presentation', label: 'Presentation' },
            { value: 'negotiation', label: 'Negotiation' },
            { value: 'exam', label: 'Exam Assistant' },
        ];

        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div>
                        <div class="eyebrow">Customize</div>
                        <div class="page-title">AI Context</div>
                    </div>

                    <section class="surface">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Profile</label>
                                <select class="control" .value=${this.selectedProfile} @change=${this._handleProfileChange}>
                                    ${profiles.map(profile => html`<option value=${profile.value}>${profile.label}</option>`)}
                                </select>
                            </div>

                            <div class="form-group vertical">
                                <div class="resume-header">
                                    <label class="form-label">Résumé</label>
                                    <div class="resume-actions">
                                        ${this._resume ? html`<button class="link-btn" @click=${this._clearResume}>Clear</button>` : ''}
                                        <button class="attach-btn" @click=${this._attachResume} ?disabled=${this._attaching}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                            </svg>
                                            ${this._attaching ? 'Reading…' : 'Attach file'}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    class="control resume"
                                    placeholder="Paste your résumé here, or attach a PDF/TXT file. The AI uses this to answer background questions (e.g. “tell me about yourself”) instantly and specifically."
                                    .value=${this._resume}
                                    @input=${e => this._saveResume(e.target.value)}
                                ></textarea>
                                ${this._resumeStatus
                                    ? html`<div class="resume-status ${this._resumeStatusKind}">${this._resumeStatus}</div>`
                                    : html`<div class="form-help">Attach a PDF/TXT résumé or paste text. Answered instantly when the interviewer asks about you.</div>`}
                            </div>

                            <div class="form-group vertical grow">
                                <label class="form-label">Custom Instructions</label>
                                <textarea
                                    class="control"
                                    placeholder="Role requirements, job description, constraints, anything else…"
                                    .value=${this._context}
                                    @input=${e => this._saveContext(e.target.value)}
                                ></textarea>
                                <div class="form-help">Sent as context at session start. Keep it short.</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }
}

customElements.define('ai-customize-view', AICustomizeView);
