# Helping Hands — Design System ("Matrix")

A complete UI redesign of Helping Hands into a dark-first, neon-green "Matrix" copilot,
generated from the shared brand render and the `Helping Hands Kit` UI kit. Replaces the
previous violet "Aurora" direction as the single brand system.

## Direction
Premium, technical, **dark-first hacker copilot**. Near-black surfaces with a single
confident **neon-green** brand accent and live "code-rain" motion. Minimal and scannable
for live use during interviews, meetings, and exams. Chakra Petch for display/wordmark,
IBM Plex Sans for UI, JetBrains Mono for code / timers / tokens.

## Color (dark, default)
| Role | Token | Value |
|------|-------|-------|
| Brand accent | `--g` | `#3BE86B` (neon green) |
| Accent deep | `--g2` | `#12A24A` |
| Accent dim | `--g-dim` | `#1F8F45` |
| Accent (on light) | `--g-deep` | `#0B7A34` |
| Accent gradient | — | `linear-gradient(135deg, #3BE86B, #12A24A)` |
| Accent soft (wash) | `--g-soft` | `rgba(59,232,107,0.12)` |
| App background | `--bg` | `#060A07` (near-black, cool-green) |
| Surface | `--surface` | `#0C120E` |
| Elevated | `--elev` | `#121A15` |
| Hover | `--hover` | `#18231B` |
| Border | `--g-line` | `rgba(74,240,130,0.14)` |
| Border strong | `--g-line2` | `rgba(74,240,130,0.26)` |
| Text primary | `--tx` | `#E8FBEE` |
| Text secondary | `--tx2` | `#8FB89C` |
| Text muted | `--tx3` | `#5A7563` |
| Warning | `--warn` | `#E0C93A` |
| Danger | `--danger` | `#FF5C57` |
| Success | — | reuse `--g` `#3BE86B` |

The brand accent is a **single source of truth** (`--g`), so it can be re-tuned in one place.
Neon green also carries "success" / "live" states — there is no separate green.

## Typography
- Display / wordmark: **Chakra Petch** (500 / 600 / 700) — squared, technical.
- UI / body: **IBM Plex Sans** (300–600).
- Mono: **JetBrains Mono** (400 / 500 / 700) — code blocks, timers, model IDs, tabular numbers.
- Scale: 11 / 13 / 14 / 16 / 20 / 28; line-height 1.6 body, ~1.05 display headings.
- Uppercase mono micro-labels with `letter-spacing: .1em` for section eyebrows.

## Spacing & Radius
- 4 / 8 / 16 / 24 / 40 / 64 spacing rhythm.
- Radius: sm 6 · md 10 · lg 14 · xl 18 · pill 999.

## Elevation & Glow
- `--glow: 0 0 18px rgba(59,232,107,.45)` and `--glow-lg: 0 0 34px rgba(59,232,107,.5)`
  for neon emphasis on primary CTAs, live dots, the app mark, and answer cards.
- Soft black shadows (`0 18–24px 50–60px rgba(0,0,0,.5)`) for floating glass and windows.

## Motion
- Transitions 150–200ms ease. Scale-on-press ~0.97.
- Pulsing live dot (`hh-pulse`), blinking answer caret (`hh-blink`), scan-line sweep
  (`hh-scan`), gentle float on the hero mark (`hh-float`).
- Background **code-rain** canvas (katakana + hex glyphs) at low opacity. Respect
  `prefers-reduced-motion` — fall back to a static faint field.

## Components
- **Glass cards** (blur + green hairline border + soft shadow), pill chips, **gradient
  neon primary CTA** with keyboard-hint badge, secondary/ghost/danger buttons.
- Segmented control (Audio / Text / Image), toggles, transparency slider.
- Status pills: Live (pulsing) · Connecting · Idle · Error.
- Provider card (icon + model + task tags + status), code block, `kbd` shortcut keys.
- **Floating live assistant**: translucent toolbar (Listening + timer + controls) +
  live transcript bar + streaming answer card.

## Surfaces redesigned
- Foundation tokens (`index.html` `:root`) — swap Aurora violet vars for the Matrix
  green tokens above; keep the legacy-compatibility aliases mapped to the new names.
- App shell + sidebar nav.
- Home (brand hero + profile chips + provider/API-key + Start Session).
- Live assistant overlay (floating glass toolbar + transcript + answer card).
- Onboarding (mark + tagline + permission steps).
- Settings / Customize, History, Help inherit the refreshed token system.

## Brand & icon kit
Source assets from the UI Kit are vendored into [src/assets/brand/](src/assets/brand/):
- `hh_app_icon.png` (1024 master) + `icons/hh_icon_*.png` set (16 → 1024).
- `hh_favicon.ico` (multi-res 16–64).
- `hh_logo_dark.svg` (`#3BE86B`) / `hh_logo_light.svg` (`#0B7A34`) wordmark lockups.
- `hh_mark.png` (neon handshake mark).

**Shipped app icon** (used by `forge.config.js` for all platforms) is generated from the
1024 master into the formats packaging needs — `src/assets/logo.png` (512),
`logo.ico` (16→256), `logo.icns` (16→1024):

```bash
node scripts/gen-icons.cjs          # source: src/assets/source-logo.png (the 1024² master)
# CROP="left,top,w,h" node scripts/gen-icons.cjs   # to crop a glyph out of a composite
```

Reference implementation and full component gallery: the kit's `Helping Hands Kit.dc.html`.
