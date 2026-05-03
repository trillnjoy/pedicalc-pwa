# PediCalc PWA - Development Context

## Project Overview
PediCalc is a progressive web app providing 26 evidence-based pediatric clinical calculators. Built as a single-page React application with Medical Records theme styling, deployed to GitHub Pages at `trillnjoy.github.io/Claude_Artifacts/`.

## Current State (v6 - May 2026)

### Recent Changes (v6)
- **Maintenance Fluids complete overhaul** — full Holliday-Segar + 4:2:1 implementation with clinical modifiers:
  - Weight + Rate Calculation Method toggle (H-S / 4:2:1) on same row, equal halves, aligned labels
  - Gold double-score accordion divider with centered ∨/∧ chevron — top divider always visible, bottom only when open
  - Accordion contains: selected method detail + formula + three clinical modifier steppers
  - Clinical modifier steppers (pip-based, no arrow boxes): Insensible Losses (5 stops), Temperature (7 stops, 34–40°C), Metabolic State (9 stops, −40% to +40%)
  - Adjusted volume = H-S base × (1 + insensible%) × (1 + temp%) × (1 + metabolic%)
  - IV fluid selection: NS / D5NS / D5½NS (⚠ hypotonic) / D10NS / D10W (⚠ no Na)
  - KCl: 10/20/30/40 mEq/L, default 20
  - Result card: ResultBadge-styled (green), primary = adjusted mL/hr, secondary = mL/day, detail shows only active modifiers
  - Delivered vs Required table: Fluid, Rate, Na, K, GIR with green/amber color coding

### Recent Changes (v5)
- PECARN two-tier overhaul, CATCH removed, Prematurity EGA weeks+days, Acetaminophen layout, back button ⬅️, Bilirubin off-scale arrow, nomogram scroll button

### Architecture
**Multi-file setup for GitHub Pages:**
- `index.html` - PWA entry point with runtime JSX transpilation via Babel
- `PediatricCalc.jsx` - React component (~2600 lines)
- `sw.js` - Service worker v6
- `manifest.json` - PWA configuration
- `icon-192.png`, `icon-512.png` - App icons

**Key constraint:** Runtime Babel transpilation at page load. Fragile — do not add complexity to loading sequence.

### Testing
- `PediatricCalc.jsx` as artifact ✅
- `index.html` in artifacts ❌ (only works on GitHub Pages)

## Medical Records Theme
```
bg: #ffffff
navy: #1a2332
surface: #f8f9fb
border (inactive input): #d0d4d9
border (focused input): 2px navy
textMuted: #5f6b7c
success: #0f9960 / warning: #d9822b / danger: #db3737
gold (chrome): #d4a444 / gold (unit labels): #b8860b
```

**Typography:** IBM Plex Sans (UI) · IBM Plex Mono (data/values) · -apple-system (buttons)

## Critical Safety Features

### Trailing Zero Handling
**CORRECT regex:** `(\.\d*?)0+$`
- Preserves whole number zeros: `8000` stays `8000`
- Test: Acetaminophen 20kg × 400mg/kg = 8000mg must show "8000" not "8"

## 8 Categories / 26 Calculators

| # | Category | Icon | Count | Calculators |
|---|---|---|---|---|
| 1 | Neonatal | 👶🏼 | 5 | APGAR, Bhutani Bilirubin, Hypoglycemia, Prematurity, Finnegan NAS |
| 2 | FEN | 💧 | 5 | Holliday-Segar, Parkland Burns, Dehydration, Hyponatremia, U25 eGFR |
| 3 | Neurologic | 🧠 | 5 | Pediatric GCS, PECARN, COWS, WAT-1, FLACC |
| 4 | Respiratory | 🫁 | 2 | Bronchiolitis, PRAM Asthma |
| 5 | Cardiac | ♥️ | 3 | Wells DVT, Corrected QT, Kawasaki |
| 6 | Toxicology | ☠️ | 1 | Acetaminophen (Rumack-Matthew) |
| 7 | Common Rx | 💊 | 1 | Common Drug Doses |
| 8 | Risk Scores | 📊 | 4 | SIRS/Sepsis, NAT Fracture, Readmission, PEWS |

**Visual Nomograms:**
1. **Acetaminophen** — Rumack-Matthew; off-scale arrow if level > plot range
2. **Bhutani** — Two SVG graphs; pulsing patient point; off-scale red pulsing arrow at correct age x-coordinate if bili > 22 mg/dL

## Shared UI Components

### ScoreRow
```
label: 12px / 700 / navy / uppercase / IBM Plex Sans
buttons: -apple-system 15px / flex:1 / white-space:nowrap / 8px padding
unselected: white / #d0d4d9 border / navy text
selected: #e8eaed / #d0d4d9 border / navy text — NO blue
```

### NumberInput
```
label: 12px / 700 / navy / uppercase / IBM Plex Sans
unit (physical measure): #b8860b / 600 weight — gold
unit (descriptor/synonym): COLORS.textMuted / 400 — muted
field: white / #d0d4d9 inactive / 2px navy focused
value: IBM Plex Mono 14px
enterKeyHint="done" / blur on Enter
```

**Gold unit rule:** Gold for physical units (mg/dL, kg, weeks, hr, mcg/mL, etc.). NOT for descriptors (COLOR, REFLEX, HEART RATE).

### ResultBadge
```
Props: score, label, color, sublabel, detail (optional)
score: 28px IBM Plex Sans, white-space: pre-line (\n = line break)
detail: { title, bullets[] } — rendered below sublabel with divider
success: #0f9960 / warning: #d9822b / danger: #db3737
```

### Pip Stepper (FluidCalc only)
```
No arrow boxes — full-width pip row, 28px tall tap targets
Active pip: colored dot (blue=reducing, red=increasing, navy=neutral)
Inactive pips: COLORS.border gray
Label + pct top-right, left/right notes below
```

### Inline Info Modal Pattern (ℹ)
- `useState(false)` per modal
- Button: transparent, COLORS.textMuted, right-justified on label line
- Modal: fixed scrim, bottom sheet, tap-outside dismiss
- **Must be outside conditional age-group fragments**

### Gold Accordion Divider (FluidCalc)
- 2px gold (#d4a444) horizontal rule, centered ∨/∧ chevron
- Top divider always visible (closed state shows ∨ only)
- Bottom divider only renders when open
- Both toggle the accordion

## Maintenance Fluids Calculator Detail

### Formulas displayed in accordion
```
H-S: (100×Wt1)+(50×Wt2)+(20×Wt3)
= XXXX mL/day [÷24 = ~XX.X mL/hr]

4:2:1: (4×Wt1)+(2×Wt2)+(1×Wt3)
= XX mL/hr [×24 = ~XXXX mL/day]
```

### Clinical Modifiers (inside accordion)
| Modifier | Stops | Range | Default |
|---|---|---|---|
| Insensible | 5 | Ventilator−10% → Hot/Dry+10% | Room Air 0% |
| Temperature | 7 | 34°C−20% → 40°C+20% | 37°C 0% |
| Metabolic | 9 | −40% → +40% | Baseline 0% |

Adjusted = H-S base × (1+ins%) × (1+temp%) × (1+met%)

### Mathematical properties
- Perfect agreement (exact): 35 kg only
- Functional agreement (round-to-5 convention): 30–50 kg
- Maximum divergence: 20 kg (4:2:1 underestimates by ~4%)
- 4:2:1 always underestimates H-S below 35 kg, overestimates above

### IV Fluids
| Fluid | Na (mEq/L) | Dextrose | Note |
|---|---|---|---|
| NS 0.9% | 154 | 0% | Isotonic, no GIR |
| D5NS | 154 | 5% | Default |
| D5½NS | 77 | 5% | ⚠ Hypotonic (amber caution) |
| D10NS | 154 | 10% | High GIR (neonates) |
| D10W | 0 | 10% | ⚠ No sodium (amber caution) |

GIR (mg/kg/min) = (dex% × 10 × rate_mL/hr) / (60 × weight_kg)
Target: 3–6 mg/kg/min

## PECARN Architecture

### <2 Years
**High-risk (4.4%):** GCS · AMS (ℹ) [paired] · Palpable Skull Fracture — any positive = immediate CT

**Intermediate (0.9%):** Scalp Hematoma (4 options) · LOC · Not Acting Normally + Severe Mechanism (ℹ) [paired]

**Low (<0.02%):** CT NOT Indicated (Observe)

### ≥2 Years
**High-risk (4.3%):** GCS · AMS (ℹ) [paired] · Basilar Skull Fracture — any positive = immediate CT

**Intermediate (0.8%):** Vomiting + Severe Headache [paired] · LOC + Severe Mechanism (ℹ) [paired]

**Low (<0.05%):** CT NOT Indicated (Observe)

**Notes:**
- Severe Mechanism fall height: >3 ft (<2yr) / >5 ft (≥2yr) — modal reads ageGroup dynamically
- Both modals outside age fragments — fire for both groups
- High-risk result posts immediately on any single positive criterion

## Emoji Glossary
See memory "PediCalc emoji glossary A/B". In-use: 👶🏼 Neonatal · 💧 FEN · 🧠 Neurologic · 🫁 Respiratory · ♥️ Cardiac · ☠️ Toxicology · 💊 Common Rx · 📊 Risk Scores · ⬅️ Back · ℹ️ Information

## Deployment

### Workflow
1. Increment CACHE_NAME in `sw.js`
2. Bump version string in JSX footer pill
3. Upload ALL: `index.html` + `PediatricCalc.jsx` + `sw.js` + `manifest.json`
4. **Always redeploy `index.html` with `sw.js`** — required for cache sync

### Current versions
- Service worker: `pedicalc-v6`
- Footer pill: `v6`

### What Works ✅ / Breaks ❌
✅ Direct JSX edits · ScoreRow/NumberInput changes (global) · SW version bumps · Replacing splash content
❌ New HTML layers · CSS animations on load · ESM imports · Anything before/during Babel transpilation

**Golden Rule:** App loads fast (<1s). Don't add complexity to the loading sequence.

## User Background
Troy is a pediatrician (MD) in Los Angeles with 35+ years teaching experience. Values infrastructure he owns — no third-party tokens, no freemium models. Explicit protocols, epistemically humble approaches. Deep expertise in pediatric fluids, clinical education, and point-of-care tool design.

---
**Last Updated:** May 2026 · v6
