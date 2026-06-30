# Helping-Hands — Competitor Feature Research & Implementation Plan

> Research date: 2026-06-30
> Competitors analyzed: Chiku AI, LockedIn AI, Final Round AI, Verve AI, Parakeet AI, Google Interview Warmup
> Method: page-level review of product/docs pages + grounding against the helping-hands codebase

---

## 0. The "live text" feature (what you saw in Chiku)

What Chiku / Parakeet / LockedIn / Verve show on screen is a **live transcript panel**:
the interviewer's words appear on your screen *as they speak*, word-by-word, and the AI
answer is generated from that transcript. It is **speech-to-text rendered live on the UI** —
not the app speaking aloud. (A separate, rarer feature is **read-aloud TTS** of the answer.)

**Key code finding:** the app *already captures* this transcript — `inputTranscription` is
accumulated into `currentTranscription` in `src/utils/gemini.js:693` and used to build context
and trigger the answer — but it is **never sent to the renderer for display**. Only AI answers
reach the UI via `new-response` / `update-response`. So a live transcript pane is a **small,
well-scoped addition**: the data already flows, we just don't show it. **Highest-value UI win.**

---

## 1. Competitor UI / interaction feature catalog

| UI / interaction feature | Who has it | We have it? |
|---|---|---|
| **Live transcript panel** (interviewer's words on screen, real-time) | Chiku, Parakeet, LockedIn, Verve, FinalRound | ❌ (captured, not shown) |
| **Auto-scroll toggle** (pin to newest suggestion) | Verve, all | ❌ |
| **Response length control** via hotkey (concise ↔ detailed, Cmd/Ctrl+↑/↓) | Verve | ❌ |
| **"Show question in response"** (Q+A pairing) | Verve, LockedIn | ❌ |
| **Prompter mode** (distraction-free single panel) | Verve, FinalRound | ❌ (have `layoutMode`) |
| **Picture-in-Picture** (see what's being captured) | Verve | ❌ |
| **Smart area / region selection** for screen capture | LockedIn, Verve | ❌ (full-screen only) |
| **Movable / resizable / floating overlay** | all | partial (always-on-top, transparent) |
| **Bullet-point answer format** | Parakeet, LockedIn | partial (markdown) |
| **Model picker** (choose GPT-5 / Claude / etc. live) | Parakeet | ✅ (provider routing) |
| **Keyboard shortcuts surfaced in UI** | Verve, all | partial (keybinds exist) |
| **Custom response style / tone** | Verve, FinalRound | partial (customPrompt) |
| **Web search mid-interview** | LockedIn | ❌ |
| **Bilingual auto-detect** (no manual switch) | LockedIn | ❌ |
| **Question auto-detection / auto-answer** | Parakeet, FinalRound | ✅ (turn-complete triggers answer) |
| **Export / share transcript** | Verve | partial (saved, not exported) |
| **Confidence meter / speech analytics** (WPM, filler words, tone) | FinalRound, Parakeet, LockedIn | ❌ |
| **Auto note-taking** (key points, action items) | Parakeet | ❌ |
| **Dual-pane Copilot + Coach** | LockedIn | ❌ |
| **Screen-share invisibility (stealth)** | all | ✅ (`src/utils/window.js:45`) |

### Per-competitor headline notes
- **Chiku AI** — live transcription on UI, "Desi Mode" (natural Indian-English phrasing),
  52+ languages incl. Hindi/Tamil/Telugu/Marathi, reads LeetCode/HackerRank/Superset,
  AI resume builder (10 ATS templates), per-minute credits that never expire.
- **LockedIn AI** — dual-layer Copilot + Coach, <1s responses, web search mid-interview,
  bilingual auto-detect (45+ langs), "Duo" human helper, simulation mode with scoring.
- **Final Round AI** — resume/JD/Q&A upload for grounded answers, stealth overlay, 91 languages,
  mock interviews, post-interview scorecard (speech clarity, engagement, sentiment), coding copilot.
- **Verve AI** — richest pure-UI mechanics: auto-scroll, response-length hotkeys, show-question,
  prompter mode, picture-in-picture, screen-capture region, export transcript, session sharing.
- **Parakeet AI** — 2-4s bullet-point answers, live transcript, model picker (GPT-5/Claude/4.1),
  auto note-taking (key points/action items), 52 languages; live-only (no practice/analytics).
- **Google Interview Warmup** — free practice loop; real-time feedback on job-related terms,
  most-used words, and talking points covered.

---

## 2. Implementation plan (prioritized)

### Tier 1 — Live transcript panel (headline feature)
**Why:** makes the UI feel "live"; the data pipeline already produces it.
**How:**
1. In `src/utils/gemini.js` where `currentTranscription` updates (~L693-697), emit
   `sendToRenderer('update-transcript', currentTranscription)`. Mirror in `src/utils/cloud.js:98`
   and `src/utils/localai.js`.
2. In `src/components/app/HelpingHandsApp.js:464`, add `ipcRenderer.on('update-transcript', ...)`
   beside the existing `new-response` listener; store on a reactive `liveTranscript` property.
3. In `src/components/views/AssistantView.js`, add a transcript strip above the response
   container, themed with existing CSS tokens, streaming the interviewer's words.

**Effort:** ~half day. Highest impact-to-effort ratio in the list.

### Tier 1 batch — UI polish (all in `AssistantView.js`, builds on the copy-button work)
- **Auto-scroll toggle** — in `updateResponseContent()` (`AssistantView.js:667`), pin
  `scrollTop = scrollHeight` when enabled. (~1 hr)
- **Show question in response (Q+A pairing)** — render the live transcript turn above its answer.
  (~half day; reuses transcript work above)
- **Response length hotkey** — Cmd/Ctrl+↑/↓ swaps a concise/detailed flag injected into the
  prompt; wire in `src/utils/renderer.js` `handleShortcut` (L810). (~half day)
- **Font size A-/A+** + **syntax highlighting** (highlight.js, pairs with copy buttons). (~2-3 hrs)

### Tier 2 — Prompter mode
**Why:** distraction-free reading; competitors universally have it.
**How:** extend `layoutMode` on `HelpingHandsApp.js` with a `prompter` mode that hides chrome and
shows only the response container full-width, large font.
**Effort:** ~1 day.

### Tier 2 — Smart area / region selection for screenshots
**Why:** capture just the coding problem → faster, more accurate vision answers, less token cost.
**How:** before `captureManualScreenshot` (`renderer.js:595`), let the user drag a rectangle
(transparent selection overlay), then crop the canvas via source x/y/w/h in `drawImage`.
**Effort:** ~1-2 days.

### Tier 3 — Bigger bets
- **Post-interview analytics** (WPM, filler words, talking-point coverage, confidence meter) —
  transcript+answer turns already persisted (`gemini.js:107`); compute on session end + dashboard.
  (~3-4 days)
- **Auto note-taking** — post-session LLM pass over saved transcript → key points / action items.
  (~1 day)
- **Export transcript** — serialize saved session to `.md` / `.txt`. (~half day)
- **PiP "what's captured" preview** + **movable/resizable overlay** — window/UX work. (~1-2 days each)
- **Resume + JD context** + **Desi Mode / language toggle** — inject into prompts
  (`renderer.js:590` `MANUAL_SCREENSHOT_PROMPT` + Gemini Live system prompt). (~1 day / ~half day)

---

## 3. Recommended build order
1. **Live transcript panel** (data already flows — fastest big win)
2. **Auto-scroll + Q+A pairing** (same files, compounding)
3. **Syntax highlighting + font size + response-length hotkey** (UI batch)
4. **Prompter mode** + **region selection**
5. **Analytics / notes / export** + **resume/JD + Desi mode** as roadmap

Items 1-3 are concentrated in `src/components/views/AssistantView.js`, `src/utils/gemini.js`, and
`src/components/app/HelpingHandsApp.js`, and build directly on the code-copy buttons already shipped.

---

## 4. Recommended skills (from `npx skills find`)

| Skill | Installs | Use for |
|---|---|---|
| `anthropics/skills@frontend-design` | 606.4K | Tier 1 UI work (transcript strip, toggles, prompter, fonts) |
| `anthropics/skills@webapp-testing` | 106.3K | Verifying renderer/UI changes in the Electron app |
| `wshobson/agents@prompt-engineering-patterns` | 16.9K | Resume/JD injection, STAR framing, Desi-mode prompts |
| `teachingai/full-stack-skills@electron` | 2.3K | Window/layout work (prompter, region capture, analytics window) |

---

## 5. Sources
- Chiku AI — https://www.chiku-ai.in/
- Verve Copilot docs — https://docs.vervecopilot.com/features/interview-copilot
- Verve — https://www.vervecopilot.com/blog/most-undetectable-interview-copilot
- LockedIn AI — https://www.lockedinai.com/ai-copilot
- Final Round AI — https://www.finalroundai.com/ , https://www.finalroundai.com/interview-copilot
- ParakeetAI — https://www.parakeet-ai.com/ , https://interviewsidekick.com/blog/parakeet-ai-review
- Google Interview Warmup — https://blog.google/outreach-initiatives/grow-with-google/interview-warmup/
