import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';

export class HistoryView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            .unified-page {
                overflow-y: hidden;
            }

            .unified-wrap {
                height: 100%;
            }

            .search-wrap {
                position: relative;
                max-width: 280px;
            }

            .search-icon {
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                width: 14px;
                height: 14px;
                color: var(--text-muted);
                pointer-events: none;
            }

            .search-wrap .control {
                padding-left: 30px;
            }

            .list-shell {
                overflow: hidden;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            .sessions-list {
                overflow-y: auto;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
                padding: 2px;
            }

            .session-card {
                position: relative;
                width: 100%;
                border: 1px solid var(--border);
                border-radius: 0;
                background: var(--bg-elevated);
                text-align: left;
                padding: 13px;
                cursor: pointer;
                transition:
                    background var(--transition),
                    border-color var(--transition),
                    box-shadow var(--transition);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-sm);
            }

            /* L-shaped HUD corner brackets (top-left / bottom-right) */
            .session-card::before,
            .session-card::after {
                content: '';
                position: absolute;
                width: 10px;
                height: 10px;
                border: 1px solid var(--accent);
                pointer-events: none;
                opacity: 0.4;
                transition: opacity var(--transition);
            }

            .session-card::before {
                top: -1px;
                left: -1px;
                border-right: none;
                border-bottom: none;
            }

            .session-card::after {
                right: -1px;
                bottom: -1px;
                border-left: none;
                border-top: none;
            }

            .session-card:hover {
                background: var(--bg-hover);
                border-color: var(--border-strong);
                box-shadow: 0 0 0 3px var(--accent-soft);
            }

            .session-card:hover::before,
            .session-card:hover::after {
                opacity: 1;
            }

            .session-left {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .session-profile {
                color: var(--text-primary);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-semibold);
            }

            .session-date {
                color: var(--text-muted);
                font-size: 10px;
                font-family: var(--font-mono);
            }

            .session-badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                color: var(--accent);
                font-size: 10px;
                font-family: var(--font-mono);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                background: var(--accent-soft);
                border: 1px solid var(--border-strong);
                border-radius: 0;
                padding: 3px 8px;
                white-space: nowrap;
            }

            .session-badge::before {
                content: '●';
                font-size: 7px;
                line-height: 1;
                color: var(--accent);
            }

            .session-right {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }

            .session-cost {
                color: var(--accent);
                font-size: 10px;
                font-family: var(--font-mono);
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }

            .detail-cost {
                margin: var(--space-sm) 0 var(--space-md);
                padding: 12px;
                background: var(--accent-soft);
                border: 1px solid var(--border-strong);
            }

            .detail-cost-head {
                display: flex;
                align-items: baseline;
                gap: 10px;
                margin-bottom: 8px;
            }

            .detail-cost-total {
                font-family: var(--font-mono);
                font-size: 20px;
                font-weight: 700;
                color: var(--text-primary);
            }

            .detail-cost-inr {
                font-size: 12px;
                color: var(--accent);
            }

            .detail-cost-dur {
                margin-left: auto;
                font-size: 10px;
                font-family: var(--font-mono);
                color: var(--text-muted);
            }

            .detail-cost-line {
                display: flex;
                justify-content: space-between;
                font-family: var(--font-mono);
                font-size: 11px;
                color: var(--text-secondary);
                padding: 2px 0;
            }

            .detail-cost-actual {
                margin-top: 4px;
                padding-top: 6px;
                border-top: 1px dashed var(--accent);
                color: var(--accent);
                font-weight: 700;
            }

            .detail-top {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }

            .back-btn {
                border: none;
                background: none;
                color: var(--text-muted);
                padding: 0;
                font-size: var(--font-size-sm);
                cursor: pointer;
                display: flex;
                align-items: center;
            }

            .back-btn svg {
                cursor: pointer;
            }

            .back-btn:hover {
                color: var(--text-primary);
            }

            .detail-info {
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
            }

            .tab-row {
                display: flex;
                gap: 6px;
            }

            .tab-btn {
                border: 1px solid var(--border);
                border-radius: 0;
                background: var(--bg-elevated);
                color: var(--text-secondary);
                padding: 8px 14px;
                cursor: pointer;
                font-family: var(--font-mono);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                transition:
                    background var(--transition),
                    color var(--transition),
                    border-color var(--transition),
                    box-shadow var(--transition);
            }

            .tab-btn:hover {
                color: var(--text-primary);
                border-color: var(--border-strong);
            }

            .tab-btn.active {
                color: #04140a;
                background: var(--accent);
                border-color: var(--accent);
                box-shadow: var(--shadow-accent);
            }

            .details-scroll {
                overflow-y: auto;
                flex: 1;
                min-height: 0;
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
                padding: var(--space-sm) 0;
            }

            .message-row {
                display: flex;
            }

            .message-row.user {
                justify-content: flex-end;
            }

            .message-row.ai,
            .message-row.screen {
                justify-content: flex-start;
            }

            .message {
                max-width: 75%;
                border-radius: 0;
                padding: 8px 12px;
                word-break: break-word;
                user-select: text;
                cursor: text;
                font-size: var(--font-size-sm);
                line-height: 1.45;
            }

            .message-body {
                white-space: pre-wrap;
            }

            .message-meta {
                font-size: 10px;
                margin-top: 4px;
                opacity: 0.5;
            }

            .message-row.user .message {
                background: var(--accent);
                color: var(--bg-app);
                border-bottom-right-radius: 4px;
            }

            .message-row.user .message-meta {
                text-align: right;
            }

            .message-row.ai .message {
                background: var(--bg-elevated);
                color: var(--text-primary);
                border: 1px solid var(--border);
                border-bottom-left-radius: 4px;
            }

            .message-row.screen .message {
                background: var(--bg-elevated);
                color: var(--text-primary);
                border: 1px solid var(--border);
                border-bottom-left-radius: 4px;
            }

            .context-row {
                display: flex;
                align-items: flex-start;
                gap: var(--space-sm);
                padding: var(--space-sm);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--bg-elevated);
            }

            .context-key {
                width: 84px;
                color: var(--text-muted);
                font-size: var(--font-size-xs);
                text-transform: uppercase;
                letter-spacing: 0.4px;
                flex-shrink: 0;
            }

            .context-value {
                color: var(--text-primary);
                font-size: var(--font-size-sm);
                line-height: 1.45;
                white-space: pre-wrap;
                word-break: break-word;
                user-select: text;
                cursor: text;
            }

            .empty {
                color: var(--text-muted);
                font-size: var(--font-size-sm);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 120px;
                border: 1px dashed var(--border);
                border-radius: var(--radius-sm);
            }
        `,
    ];

    static properties = {
        sessions: { type: Array },
        selectedSession: { type: Object },
        selectedSessionId: { type: String },
        loading: { type: Boolean },
        activeTab: { type: String },
        searchQuery: { type: String },
    };

    constructor() {
        super();
        this.sessions = [];
        this.selectedSession = null;
        this.selectedSessionId = null;
        this.loading = true;
        this.activeTab = 'conversation';
        this.searchQuery = '';
        this.loadSessions();
    }

    async loadSessions() {
        try {
            this.loading = true;
            this.sessions = await helpingHands.storage.getAllSessions();
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.sessions = [];
        } finally {
            this.loading = false;
            this.requestUpdate();
        }
    }

    async openSession(sessionId) {
        try {
            const session = await helpingHands.storage.getSession(sessionId);
            if (session) {
                this.selectedSession = session;
                this.selectedSessionId = sessionId;
                this.activeTab = 'conversation';
                this.requestUpdate();
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
    }

    closeSession() {
        this.selectedSession = null;
        this.selectedSessionId = null;
        this.activeTab = 'conversation';
    }

    handleSearchInput(e) {
        this.searchQuery = e.target.value;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    _getProfileLabel(session) {
        if (session.profile) {
            const names = this.getProfileNames();
            return names[session.profile] || session.profile;
        }
        return 'Session';
    }

    getSessionPreview(session) {
        const parts = [];
        if (session.messageCount > 0) parts.push(`${session.messageCount} messages`);
        if (session.screenAnalysisCount > 0) parts.push(`${session.screenAnalysisCount} screen`);
        if (session.profile) {
            const profileNames = this.getProfileNames();
            parts.push(profileNames[session.profile] || session.profile);
        }
        return parts.length > 0 ? parts.join(' · ') : 'Empty session';
    }

    getFilteredSessions() {
        if (!this.searchQuery.trim()) return this.sessions;
        const q = this.searchQuery.toLowerCase();
        return this.sessions.filter(session => {
            const preview = this.getSessionPreview(session).toLowerCase();
            const date = this.formatDate(session.createdAt).toLowerCase();
            return preview.includes(q) || date.includes(q);
        });
    }

    collectConversation(session) {
        const messages = [];
        const history = session.conversationHistory || [];
        history.forEach(turn => {
            if (turn.transcription) messages.push({ type: 'user', content: turn.transcription, timestamp: turn.timestamp });
            if (turn.ai_response) messages.push({ type: 'ai', content: turn.ai_response, timestamp: turn.timestamp });
        });
        return messages;
    }

    renderTabContent() {
        if (!this.selectedSession) return html`<div class="empty">Select a session.</div>`;

        if (this.activeTab === 'conversation') {
            const messages = this.collectConversation(this.selectedSession);
            if (!messages.length) return html`<div class="empty">No conversation data.</div>`;
            return messages.map(
                msg => html`
                    <div class="message-row ${msg.type}">
                        <div class="message">
                            <div class="message-body">${msg.content}</div>
                            <div class="message-meta">${this.formatTime(msg.timestamp)}</div>
                        </div>
                    </div>
                `
            );
        }

        if (this.activeTab === 'screen') {
            const screen = this.selectedSession.screenAnalysisHistory || [];
            if (!screen.length) return html`<div class="empty">No screen analysis data.</div>`;
            return screen.map(
                entry => html`
                    <div class="message-row screen">
                        <div class="message">
                            <div class="message-body">${entry.response || ''}</div>
                            <div class="message-meta">${this.formatTime(entry.timestamp)}</div>
                        </div>
                    </div>
                `
            );
        }

        const profile = this.selectedSession.profile;
        const prompt = this.selectedSession.customPrompt;
        if (!profile && !prompt) return html`<div class="empty">No context saved for this session.</div>`;

        return html`
            ${profile
                ? html`
                      <div class="context-row">
                          <span class="context-key">Profile</span>
                          <span class="context-value">${this.getProfileNames()[profile] || profile}</span>
                      </div>
                  `
                : ''}
            ${prompt
                ? html`
                      <div class="context-row">
                          <span class="context-key">Prompt</span>
                          <span class="context-value">${prompt}</span>
                      </div>
                  `
                : ''}
        `;
    }

    renderListView() {
        const filteredSessions = this.getFilteredSessions();
        return html`
            <div class="page-title">History</div>

            <div class="search-wrap">
                <svg
                    class="search-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input class="control" type="text" placeholder="Search sessions..." .value=${this.searchQuery} @input=${this.handleSearchInput} />
            </div>

            <section class="list-shell">
                <div class="sessions-list">
                    ${this.loading ? html`<div class="empty" style="margin:var(--space-md);">Loading sessions...</div>` : ''}
                    ${!this.loading && filteredSessions.length === 0
                        ? html`<div class="empty" style="margin:var(--space-md);">No matching sessions.</div>`
                        : ''}
                    ${!this.loading
                        ? filteredSessions.map(
                              session => html`
                                  <button class="session-card" @click=${() => this.openSession(session.sessionId)}>
                                      <div class="session-left">
                                          <span class="session-profile">${this._getProfileLabel(session)}</span>
                                          <span class="session-date"
                                              >${this.formatDate(session.createdAt)} · ${this.formatTime(session.createdAt)}</span
                                          >
                                      </div>
                                      <div class="session-right">
                                          ${session.cost && session.cost.totalUSD > 0
                                              ? html`<span class="session-cost" title="Estimated API cost">${session.cost.totalText} · ${session.cost.inrText}</span>`
                                              : ''}
                                          ${session.messageCount > 0 ? html`<span class="session-badge">${session.messageCount}</span>` : ''}
                                      </div>
                                  </button>
                              `
                          )
                        : ''}
                </div>
            </section>
        `;
    }

    _renderCostSummary(cost) {
        if (!cost) return '';
        return html`
            <div class="detail-cost">
                <div class="detail-cost-head">
                    <span class="detail-cost-total">${cost.totalText}</span>
                    <span class="detail-cost-inr">≈ ${cost.inrText}</span>
                    <span class="detail-cost-dur">${cost.durationText}${cost.estimated ? ' · est.' : ''}</span>
                </div>
                ${(cost.lines || []).map(
                    l => html`
                        <div class="detail-cost-line">
                            <span>${l.label}</span>
                            <span>${l.usdText}</span>
                        </div>
                    `
                )}
                ${cost.actualCharged && cost.actualCharged.amount > 0
                    ? html`<div class="detail-cost-line detail-cost-actual">
                          <span>✓ Charged (DeepSeek balance)</span>
                          <span>${cost.actualCharged.text}</span>
                      </div>`
                    : ''}
            </div>
        `;
    }

    renderDetailView() {
        const conversationCount = this.collectConversation(this.selectedSession).length;
        const screenCount = this.selectedSession?.screenAnalysisHistory?.length || 0;

        return html`
            <div class="page-title">Session Detail</div>
            <div class="detail-top">
                <button class="back-btn" @click=${this.closeSession}>
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <span class="detail-info"
                    >${this._getProfileLabel(this.selectedSession)} · ${this.formatDate(this.selectedSession.createdAt)} ·
                    ${this.formatTime(this.selectedSession.createdAt)}</span
                >
            </div>
            ${this.selectedSession.cost ? this._renderCostSummary(this.selectedSession.cost) : ''}
            <div class="tab-row">
                <button
                    class="tab-btn ${this.activeTab === 'conversation' ? 'active' : ''}"
                    @click=${() => {
                        this.activeTab = 'conversation';
                    }}
                >
                    Conversation (${conversationCount})
                </button>
                <button
                    class="tab-btn ${this.activeTab === 'screen' ? 'active' : ''}"
                    @click=${() => {
                        this.activeTab = 'screen';
                    }}
                >
                    Screen (${screenCount})
                </button>
                <button
                    class="tab-btn ${this.activeTab === 'context' ? 'active' : ''}"
                    @click=${() => {
                        this.activeTab = 'context';
                    }}
                >
                    Context
                </button>
            </div>
            <section class="details-scroll">${this.renderTabContent()}</section>
        `;
    }

    render() {
        return html`
            <div class="unified-page">
                <div class="unified-wrap">${this.selectedSession ? this.renderDetailView() : this.renderListView()}</div>
            </div>
        `;
    }
}

customElements.define('history-view', HistoryView);
