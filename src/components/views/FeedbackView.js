import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';

const FEEDBACK_FORM_URL = 'https://forms.gle/1JPoh81mUPkJMvje7';

export class FeedbackView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            .feedback-embed {
                position: relative;
                width: 100%;
                height: min(78vh, 900px);
                border: 1px solid var(--border-strong);
                border-radius: 0;
                background: var(--bg-elevated);
                box-shadow: 0 0 0 3px var(--accent-soft);
            }

            /* L-shaped HUD corner brackets framing the panel */
            .feedback-embed::before,
            .feedback-embed::after {
                content: '';
                position: absolute;
                width: 14px;
                height: 14px;
                border: 1px solid var(--accent);
                pointer-events: none;
                z-index: 1;
                opacity: 0.85;
            }

            .feedback-embed::before {
                top: -1px;
                left: -1px;
                border-right: none;
                border-bottom: none;
            }

            .feedback-embed::after {
                right: -1px;
                bottom: -1px;
                border-left: none;
                border-top: none;
            }

            .feedback-iframe {
                width: 100%;
                height: 100%;
                border: 0;
                background: #fff;
            }
        `,
    ];

    render() {
        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div class="page-title">Feedback</div>

                    <section class="surface">
                        <div class="feedback-embed">
                            <iframe class="feedback-iframe" src=${FEEDBACK_FORM_URL} title="Feedback Form"></iframe>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }
}

customElements.define('feedback-view', FeedbackView);
