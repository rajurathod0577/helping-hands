import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class OnboardingView extends LitElement {
    static styles = css`
        * {
            font-family: var(--font);
            cursor: default;
            user-select: none;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :host {
            display: block;
            height: 100%;
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            overflow: hidden;
        }

        .onboarding {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0;
            border: 1px solid var(--border-strong);
            overflow: hidden;
            background: var(--bg-app);
        }

        /* HUD corner brackets — top-left / bottom-right ticks framing the console */
        .onboarding::before,
        .onboarding::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            border: 1px solid var(--accent);
            pointer-events: none;
            z-index: 3;
            opacity: 0.7;
        }

        .onboarding::before {
            top: 12px;
            left: 12px;
            border-right: none;
            border-bottom: none;
        }

        .onboarding::after {
            right: 12px;
            bottom: 12px;
            border-left: none;
            border-top: none;
        }

        /* Faint CRT scanline overlay above the aurora/dither canvases, below content */
        .scanlines {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background: repeating-linear-gradient(0deg, rgba(59, 232, 107, 0.05) 0 1px, transparent 1px 3px);
        }

        canvas.aurora {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }

        canvas.dither {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            opacity: 0.12;
            mix-blend-mode: overlay;
            pointer-events: none;
            image-rendering: pixelated;
        }

        .slide {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 400px;
            padding: var(--space-xl);
            gap: var(--space-md);
        }

        .eyebrow {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-muted);
        }

        /* HUD readout prefix */
        .eyebrow::before {
            content: '// ';
            color: var(--accent);
        }

        .slide-title {
            font-family: var(--font-display);
            font-size: 28px;
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1.1;
            text-shadow: 0 0 8px rgba(59, 232, 107, 0.35);
        }

        .slide-text {
            font-size: 13px;
            line-height: 1.5;
            color: var(--text-secondary);
        }

        .context-input {
            width: 100%;
            min-height: 120px;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 0;
            background: rgba(17, 26, 20, 0.6);
            backdrop-filter: blur(8px);
            color: var(--text-primary);
            font-size: 13px;
            font-family: var(--font);
            line-height: 1.5;
            resize: vertical;
            text-align: left;
            transition: border-color 0.15s, box-shadow 0.15s;
        }

        .context-input::placeholder {
            color: var(--text-muted);
        }

        .context-input:focus {
            outline: none;
            border-color: var(--border-strong);
            box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 3px rgba(59, 232, 107, 0.06);
        }

        .actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }

        .btn-primary {
            background: var(--accent-gradient);
            border: none;
            color: #04140a;
            padding: 11px 20px;
            border-radius: 0;
            font-family: var(--font-mono);
            font-size: 13px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            cursor: pointer;
            /* Angular chamfer — top-right + bottom-left cut */
            clip-path: polygon(
                0 0,
                calc(100% - var(--hud-cut)) 0,
                100% var(--hud-cut),
                100% 100%,
                var(--hud-cut) 100%,
                0 calc(100% - var(--hud-cut))
            );
            /* clip-path hides box-shadow, so glow via drop-shadow */
            filter: drop-shadow(0 0 10px rgba(59, 232, 107, 0.5));
            transition: opacity 0.15s, filter 0.15s;
        }

        .btn-primary:hover {
            opacity: 0.92;
            filter: drop-shadow(0 0 16px rgba(59, 232, 107, 0.65));
        }

        .btn-back {
            background: none;
            border: none;
            color: var(--text-muted);
            font-family: var(--font-mono);
            font-size: 11px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            cursor: pointer;
            padding: 4px 8px;
        }

        .btn-back:hover {
            color: var(--text-secondary);
        }
    `;

    static properties = {
        currentSlide: { type: Number },
        contextText: { type: String },
        onComplete: { type: Function },
    };

    constructor() {
        super();
        this.currentSlide = 0;
        this.contextText = '';
        this.onComplete = () => {};
        this._animId = null;
        this._time = 0;
    }

    firstUpdated() {
        this._startAurora();
        this._drawDither();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._animId) cancelAnimationFrame(this._animId);
    }

    _drawDither() {
        const canvas = this.shadowRoot.querySelector('canvas.dither');
        if (!canvas) return;
        const blockSize = 5;
        const cols = Math.ceil(canvas.offsetWidth / blockSize);
        const rows = Math.ceil(canvas.offsetHeight / blockSize);
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(cols, rows);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() > 0.5 ? 255 : 0;
            img.data[i] = v;
            img.data[i + 1] = v;
            img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
    }

    _startAurora() {
        const canvas = this.shadowRoot.querySelector('canvas.aurora');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const scale = 0.35;
        const resize = () => {
            canvas.width = Math.floor(canvas.offsetWidth * scale);
            canvas.height = Math.floor(canvas.offsetHeight * scale);
        };
        resize();

        const blobs = [
            {
                parts: [
                    { ox: 0, oy: 0, r: 1.0 },
                    { ox: 0.22, oy: 0.1, r: 0.85 },
                    { ox: 0.11, oy: 0.05, r: 0.5 },
                ],
                color: [40, 200, 110],
                x: 0.15,
                y: 0.2,
                vx: 0.35,
                vy: 0.25,
                phase: 0,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.95 },
                    { ox: 0.18, oy: -0.08, r: 0.75 },
                    { ox: 0.09, oy: -0.04, r: 0.4 },
                ],
                color: [90, 230, 140],
                x: 0.75,
                y: 0.2,
                vx: -0.3,
                vy: 0.35,
                phase: 1.2,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.9 },
                    { ox: 0.24, oy: 0.12, r: 0.9 },
                    { ox: 0.12, oy: 0.06, r: 0.35 },
                ],
                color: [30, 180, 130],
                x: 0.5,
                y: 0.65,
                vx: 0.25,
                vy: -0.3,
                phase: 2.4,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.8 },
                    { ox: -0.15, oy: 0.18, r: 0.7 },
                    { ox: -0.07, oy: 0.09, r: 0.45 },
                ],
                color: [140, 245, 120],
                x: 0.1,
                y: 0.75,
                vx: 0.4,
                vy: 0.2,
                phase: 3.6,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.75 },
                    { ox: 0.12, oy: -0.15, r: 0.65 },
                    { ox: 0.06, oy: -0.07, r: 0.35 },
                ],
                color: [60, 210, 90],
                x: 0.85,
                y: 0.55,
                vx: -0.28,
                vy: -0.32,
                phase: 4.8,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.95 },
                    { ox: -0.2, oy: -0.12, r: 0.75 },
                    { ox: -0.1, oy: -0.06, r: 0.4 },
                ],
                color: [40, 190, 160],
                x: 0.6,
                y: 0.1,
                vx: -0.2,
                vy: 0.38,
                phase: 6.0,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.85 },
                    { ox: 0.17, oy: 0.15, r: 0.75 },
                    { ox: 0.08, oy: 0.07, r: 0.35 },
                ],
                color: [110, 240, 150],
                x: 0.35,
                y: 0.4,
                vx: 0.32,
                vy: -0.22,
                phase: 7.2,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.75 },
                    { ox: -0.13, oy: 0.18, r: 0.65 },
                    { ox: -0.06, oy: 0.1, r: 0.4 },
                ],
                color: [30, 170, 110],
                x: 0.9,
                y: 0.85,
                vx: -0.35,
                vy: -0.25,
                phase: 8.4,
            },

            {
                parts: [
                    { ox: 0, oy: 0, r: 0.7 },
                    { ox: 0.16, oy: -0.1, r: 0.6 },
                    { ox: 0.08, oy: -0.05, r: 0.35 },
                ],
                color: [150, 235, 100],
                x: 0.45,
                y: 0.9,
                vx: 0.22,
                vy: -0.4,
                phase: 9.6,
            },
        ];

        const baseRadius = 0.32;

        const draw = () => {
            this._time += 0.012;
            const w = canvas.width;
            const h = canvas.height;
            const dim = Math.min(w, h);

            ctx.fillStyle = '#060f09';
            ctx.fillRect(0, 0, w, h);

            for (const blob of blobs) {
                const t = this._time;
                const cx = (blob.x + Math.sin(t * blob.vx + blob.phase) * 0.22) * w;
                const cy = (blob.y + Math.cos(t * blob.vy + blob.phase * 0.7) * 0.22) * h;

                for (const part of blob.parts) {
                    const wobble = Math.sin(t * 2.5 + part.ox * 25 + blob.phase) * 0.02;
                    const px = cx + (part.ox + wobble) * dim;
                    const py = cy + (part.oy + wobble * 0.7) * dim;
                    const pr = part.r * baseRadius * dim;

                    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
                    grad.addColorStop(0, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0.55)`);
                    grad.addColorStop(0.4, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0.3)`);
                    grad.addColorStop(0.7, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0.1)`);
                    grad.addColorStop(1, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0)`);

                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, w, h);
                }
            }

            this._animId = requestAnimationFrame(draw);
        };

        draw();
    }

    handleContextInput(e) {
        this.contextText = e.target.value;
    }

    async completeOnboarding() {
        if (this.contextText.trim()) {
            await helpingHands.storage.updatePreference('customPrompt', this.contextText.trim());
        }
        await helpingHands.storage.updateConfig('onboarded', true);
        this.onComplete();
    }

    renderSlide() {
        if (this.currentSlide === 0) {
            return html`
                <div class="slide">
                    <div class="eyebrow">Step 01</div>
                    <div class="slide-title">Helping Hands</div>
                    <div class="slide-text">Real-time AI that listens, watches, and helps during interviews, meetings, and exams.</div>
                    <div class="actions">
                        <button
                            class="btn-primary"
                            @click=${() => {
                                this.currentSlide = 1;
                            }}
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="slide">
                <div class="eyebrow">Step 02</div>
                <div class="slide-title">Add context</div>
                <div class="slide-text">Paste your resume or any info the AI should know. You can skip this and add it later.</div>
                <textarea
                    class="context-input"
                    placeholder="Resume, job description, notes..."
                    .value=${this.contextText}
                    @input=${this.handleContextInput}
                ></textarea>
                <div class="actions">
                    <button class="btn-primary" @click=${this.completeOnboarding}>Get Started →</button>
                    <button
                        class="btn-back"
                        @click=${() => {
                            this.currentSlide = 0;
                        }}
                    >
                        ← Back
                    </button>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="onboarding">
                <canvas class="aurora"></canvas>
                <canvas class="dither"></canvas>
                <div class="scanlines"></div>
                ${this.renderSlide()}
            </div>
        `;
    }
}

customElements.define('onboarding-view', OnboardingView);
