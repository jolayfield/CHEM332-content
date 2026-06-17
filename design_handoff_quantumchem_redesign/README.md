# Handoff: QuantumChem Mobile — Direction A v2 Redesign

## Overview

This package is a design handoff for a styling + layout refresh of the **photoelectric-effect** Vite + TypeScript + Capacitor codebase (the QuantumChem quantum-mechanics teaching app). The redesign applies an **editorial-textbook** aesthetic across the home screen, simulation index, and 12 simulation shells.

**The goal:** update the existing codebase to match the prototype — *without touching simulation math, canvas rendering logic, or Capacitor plugins*. Every change is CSS, HTML markup, and template rendering in `landing.ts` / `simulations.ts`.

## About the Design Files

The files in `references/` are **design references created in HTML** — prototypes showing the intended look and behavior, not production code to copy directly. They are:

- **`Tech Transfer.html`** — the authoritative spec. Read this first. It contains design tokens, CSS snippets, HTML markup patterns, TypeScript render function signatures, a file-by-file rollout checklist, and "gotchas" sections.
- **`QuantumChem Mobile v2.html`** — the reference prototype showing the final look across home + sim screens (the "Figma-equivalent").
- **`QuantumChem Mobile.html`** — earlier iteration; kept for comparison only.

Your job is to **recreate these designs inside the existing `photoelectric-effect` codebase** using its established patterns (vanilla TS + `style.css` tokens + per-page `*.html` shells). Do **not** add a framework, do **not** introduce new fonts, do **not** rewrite simulations.

## Fidelity

**High-fidelity.** All colors, type sizes, spacing tokens, and component styles in the Tech Transfer doc are final. Copy the CSS verbatim. The prototype HTML is pixel-intentional.

## Target Codebase

- **Repo:** `photoelectric-effect/`
- **Stack:** Vite · TypeScript · Capacitor (iOS + Android)
- **Files that change:** `style.css`, `index.html`, `simulations.html`, all 12 sim `*.html` shells, `landing.ts`, `simulations.ts`
- **Files that DO NOT change:** `*Simulation.ts`, `graph.ts` (except stroke-color reads), `transmissionGraph.ts`, `orbitals-math.ts`, `hybridization-math.ts`, anything under `android/`, `ios/`, `capacitor.config.ts`, simulation `.ts` event handlers

## Recommended Workflow (Claude Code)

1. Place this `design_handoff_quantumchem_redesign/` folder at the root of the `photoelectric-effect` repo.
2. `cd photoelectric-effect && claude`
3. Prompt Claude Code:

   > Read `design_handoff_quantumchem_redesign/README.md` and `references/Tech Transfer.html`. The Tech Transfer doc is the spec. Start by updating `style.css` with the new design tokens (§ 2) and component styles (§ 4), then tackle one page at a time following the rollout checklist (§ 8). Show me your plan before making changes and check in after each major step.

4. Claude Code will read the spec, grep the codebase, propose a plan, and make edits with your approval per file.

## Design Tokens (summary — full spec in Tech Transfer § 2)

### Color
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#f4f1ec` | Page background |
| `--paper-2` | `#ece7df` | Alt row, subtle fill |
| `--paper-3` | `#e4dccb` | Deeper paper |
| `--line` | `#d9d2c5` | Hairline borders, slider tracks |
| `--ink` | `#1a1520` | Primary text |
| `--ink-2` | `#4b4554` | Secondary text, lead paragraphs |
| `--ink-3` | `#7b7681` | Tertiary text, eyebrows, meta |
| `--accent` | `#340E51` | St Thomas purple (existing brand) |
| `--accent-2` | `#5b2a84` | Italic accent word in titles |
| `--amber` | `#c8892a` | Callout left-border only |
| `--canvas-bg` | `#0a0612` | Dark sim viewports only |

### Radius
- `--r-sm: 0` · flat cards/panels
- `--r-md: 2px` · chips, sliders, buttons
- `--r-pill: 999px` · never (kept as escape hatch)

### Spacing (4px base)
`--s-1: 4px` · `--s-2: 8px` · `--s-3: 12px` · `--s-4: 16px` · `--s-5: 20px` (page gutter) · `--s-6: 24px` · `--s-8: 32px` · `--s-10: 40px`

### Typography
**Keep existing fonts: Lora (serif) + Lato (sans).** Do not introduce Fraunces, Newsreader, or JetBrains Mono — the prototype uses them but spec explicitly overrides this for mobile/offline reasons. Lato at 600 weight + `font-variant-numeric: tabular-nums` + wide letter-spacing does the monospace-adjacent duty for readouts and eyebrows.

Type scale:
- **Display** · Lora 500 · 32px / 1.05 / -0.7px
- **H2** · Lora 500 · 24px / -0.4px
- **Body** · Lora 400 · 16px / 1.55
- **Lead** · Lora 400 · 16px / color `--ink-2`
- **Label** · Lato 600 · 14px
- **Eyebrow** · Lato 600 · 10px · letter-spacing 0.22em · UPPERCASE · color `--ink-3`
- **Readout** · Lora 500 · 20px · `tabular-nums`
- **Byline/meta** · Lato 600 · 10px · letter-spacing 0.12em · UPPERCASE · color `--ink-3`

## Component Library (8 building blocks — full CSS in Tech Transfer § 4)

1. **Breadcrumb** — eyebrow-tracked crumbs, `/` separator, last crumb ink
2. **Page header** — accent eyebrow + Lora 32 title with italic accent word
3. **Fig caption** — mono-style eyebrow above every framed figure
4. **Readout row** — 3-cell strip with hairline top/bottom, tabular-nums values
5. **Slider** (`.qc-slider`) — 2px track, 14px circular thumb, accent fill; gradient variant for wavelength
6. **Chip** (`.qc-chip`) — flat 2px-radius option button; inverts to accent when on
7. **Progress bar** (`.qc-prog`) — flat segmented rectangle of ticks
8. **TOC row** — Lora italic numeral + title + meta + micro-progress ticks

## Screens

### Home (`index.html`)
Replace current hero + chapter grid with three regions:
1. **Nav bar** — 48px, breadcrumb style, no pill bg
2. **Page header** — eyebrow "Course · Phys Chem II · Spring 2026" + display title
3. **Resume card** (`#resume-card`) — rendered by `renderResume()` in `landing.ts`
4. **Course progress strip** (`#course-progress`) — rendered by `renderProgressStrip()`
5. **Table of Contents** (`#toc`) — rendered by `renderTOC()`; each chapter is a `.toc-row`

See Tech Transfer § 5 for exact HTML + TS.

### Simulation shell pattern (applies to all 12 sims)
Every sim page follows the same skeleton. See Tech Transfer § 6 for the full HTML template. Structure:
1. `.main-nav.sim-nav` — back arrow + section number + bookmark
2. `.breadcrumb`
3. `.page-header` — eyebrow (chapter · section) + title with italic accent word
4. `.fig-caption` → `.sim-canvas-wrap` → optional `.fig-desc`
5. `.readouts` — 3-cell stats strip
6. `.control-panel` — stacked controls, no card chrome
7. Optional secondary figure + caption

### Sim archetypes (Tech Transfer § 7)
Each sim falls into one of three shells:
- **Diagram + graph** (dark canvas) — Photoelectric, Bohr, Particle 1D, Barrier
- **3D scene** (dark canvas, chip-grid controls) — Orbitals, Hybridization, Particle 2D
- **Graph-dominant** (light or dark canvas) — Blackbody, Basis Set, MO Scheme, IR, Rot, VibRot

## Existing class remapping (no renames — just restyle)

| Existing class | New treatment |
|---|---|
| `.main-nav` | 48px bar, breadcrumb left, brand center, icons right; `1px solid --line` bottom |
| `.glass-panel` | **Flatten**. Remove blur/gradient. `background:#fff; border:1px solid --line; border-radius:--r-md` |
| `.control-panel` | No card chrome; inline `padding:0 var(--s-5)` |
| `.slider-group` | Restyle `input[type="range"]` globally via `.qc-slider` |
| `.value-display` | Apply `.readout` class |
| `.metal-selector`, `.element-chips` | Use new `.qc-chip` |
| `.sim-canvas-wrap` | `border:1px solid --line; background:var(--canvas-bg)` + `.fig-caption` above |
| `.chapter-card` | Becomes a `.toc-row` (not a card) |
| `.hero`, `.hero-title` | Replace with resume card + course-progress strip |

## State Management

Add a persisted progress store (localStorage key `qc.progress`):
```ts
interface Progress {
  lastSim: string;        // e.g. "photoelectric"
  bookmark: string;       // human label, e.g. "KE vs frequency"
  step: number;           // current within sim
  total: number;          // total steps
  section: string;        // "2.1"
  title: string;          // "The Photoelectric Effect"
  done: Record<string, boolean>;  // per-sim completion, keyed by sim id
}
```
Used by `renderResume()` on the home screen and `done` flags on each TOC row.

## Assets

- `references/assets/logo.svg`, `logo-dark.svg` — existing QuantumChem marks, already in your repo. Listed for completeness.
- **No new icons or images** are introduced by the redesign.
- Fonts: **Lora + Lato stay**. Already self-hosted in `public/fonts/` for offline Capacitor use. Do not add network font calls.

## Interactions & Behavior

- **Flat cards intentional** — no shadows, no rounded panels. The 1px line is the affordance. Push back on stakeholders who say "looks unfinished."
- **No `:hover` states on touch** — chips and TOC rows use `:active` (invert colors) only. Do not add desktop-parity hovers.
- **Italic accent word** — every screen title has exactly ONE italic word in `--accent-2`. Don't italicize more.
- **Tabular numerals everywhere numbers update** — readouts, slider values, byline meta. Use `font-variant-numeric: tabular-nums`.

## Gotchas (Tech Transfer § 9)

- **Canvas stroke colors:** `graph.ts` and similar hardcode stroke colors. Two changes needed: default stroke reads from `getComputedStyle(document.documentElement).getPropertyValue('--accent')`; axis/grid lines use `--line` (light viewports) or `rgba(255,255,255,0.15)` (dark viewports).
- **KaTeX:** keep the existing `@import "katex/dist/katex.min.css"`. Override `.katex { color: var(--ink) }` so math inherits the new ink.
- **No fake italic:** Lora italic is weight 400 only. For italic at 500, the redesign uses **upright 500 in accent color instead** of synthesized italic.
- **Mobile gutter** is always `var(--s-5)` (20px). The sim-canvas-wrap extends to gutters, but inner canvas keeps its own margin.
- **Capacitor** — no network font calls. Do not introduce new font families.
- **Safe area** — `.main-nav` needs `padding-top: env(safe-area-inset-top)` on iOS. Already in current `style.css` — keep it.

## Rollout Order (Tech Transfer § 8)

1. Replace `:root` tokens in `style.css`
2. Add the 8 component styles
3. Remove existing `.glass-panel` blur/gradient
4. Restyle `.main-nav` to 48px bar
5. Restyle `input[type="range"]` globally via `.qc-slider`
6. Update `index.html` body to resume + progress + TOC markup
7. Extend `landing.ts` with `renderResume`, `renderProgressStrip`, `renderTOC`
8. Add per-sim progress state (localStorage `qc.progress`)
9. Apply universal sim shell to `photoelectric.html` first — verify canvas still mounts
10. Apply to `bohr.html`, `atomic-orbitals.html`, `ir-spectra.html` next (one per archetype)
11. Apply to remaining 8 sim HTMLs
12. Update `simulations.html` index grid to TOC-row style
13. Smoke test on iOS + Android via Capacitor
14. Sniff-check: every dark viewport uses `--canvas-bg`; body stays paper
15. Accessibility pass: confirm 4.5:1 on `--ink-3` over `--paper`

## What to Push Back On

These are design calls, not bugs. If a reviewer objects, cite the Tech Transfer:
- Flat cards are intentional (§ 10)
- No hover states on touch (§ 10)
- One italic accent word per title (§ 10)

## Files in This Bundle

```
design_handoff_quantumchem_redesign/
├── README.md                          ← you are here
└── references/
    ├── Tech Transfer.html             ← THE SPEC — read this
    ├── QuantumChem Mobile v2.html     ← Final prototype (target visual)
    ├── QuantumChem Mobile.html        ← Earlier iteration (comparison only)
    └── assets/
        ├── logo.svg
        └── logo-dark.svg
```

Open `references/Tech Transfer.html` and `references/QuantumChem Mobile v2.html` in a browser to read/view. Both are self-contained.
