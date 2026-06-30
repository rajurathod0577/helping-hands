# Helping Hands — Design System ("Aurora")

A complete UI redesign, informed by research into Chiku AI, LockedIn AI, Final Round AI,
and Verve AI, plus the `ui-ux-pro-max` design intelligence skill.

## Direction
Premium, technical, **dark-first glass copilot**. Minimal and scannable for live use, with a
single confident **violet→indigo** brand accent. Inter for UI, mono for code/timers/numbers.

## Color (dark, default)
| Role | Value |
|------|-------|
| Brand accent | `#6D5EF8` (violet-indigo) |
| Accent hover | `#7C6CFF` |
| Accent gradient | `linear-gradient(135deg, #7C6CFF, #5B8DEF)` |
| Accent soft (wash) | `rgba(109,94,248,0.14)` |
| App background | `#0B0B0F` (near-black, slight cool) |
| Surface / Elevated | layered translucent grays |
| Text primary/secondary/muted | `#F4F4F7` / `#A1A1AD` / `#5C5C68` |
| Success / Warning / Danger | `#22C55E` / `#E0A92E` / `#F0524B` |

The brand accent is a **single source of truth** (`--accent`, set per theme in `renderer.js`),
so it can be re-tuned in one place.

## Typography
- UI: **Inter** (300–700)
- Mono: SF Mono / Menlo (code blocks, timers, tabular numbers)
- Scale: 11 / 13 / 14 / 16 / 20 / 28; line-height 1.6 body, 1.3 headings.

## Spacing & Radius
- 4 / 8 / 16 / 24 / 40 / 64 spacing rhythm.
- Radius: sm 6 · md 10 · lg 14 · xl 18 · pill 999.

## Elevation (new tokens)
- `--shadow-sm`, `--shadow-md`, `--shadow-lg` — soft, low-spread shadows for floating glass.

## Motion
- Transitions 150–200ms ease. Scale-on-press 0.97. Pulsing live dot. Respect reduced-motion.

## Components
- **Glass cards** (blur + subtle border + soft shadow), pill chips, **gradient primary CTA**,
  segmented controls, status pills, floating live toolbar.

## Surfaces redesigned
- Foundation tokens (`index.html` `:root`) + brand accent (`renderer.js` theme palettes)
- App shell + sidebar nav
- Main / Home (hero + provider cards + keys + start)
- Live assistant overlay (floating glass toolbar + live transcript bar + answer card)
- Settings and remaining views inherit the refreshed token system.
