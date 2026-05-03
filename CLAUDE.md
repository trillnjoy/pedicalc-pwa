# PediCalc PWA - Development Context

## Project Overview
PediCalc is a progressive web app providing 26 evidence-based pediatric clinical calculators. Built as a single-page React application with Medical Records theme styling, deployed to GitHub Pages at `trillnjoy.github.io/Claude_Artifacts/`.

## Current State (v5 - May 2026)

### Recent Changes (v5)
- **PECARN complete overhaul** — two-tier architecture for both age groups (<2yr and ≥2yr) matching CalACEP/PECARN card
- **CATCH Head CT Rule removed** — 27 → 26 calculators
- **ResultBadge** — `detail` prop for bullet lists; `pre-line` score for line breaks
- **Prematurity Risk** — EGA split into weeks + days fields; `ga = gaWeeks + (gaDays/7)`
- **Neonatal Hypoglycemia** — Blood Glucose + Age on same row
- **Acetaminophen Toxicity** — Weight + Hours paired row 1; Level row 2 (Serum mode)
- **Back button** — ← replaced with ⬅️
- **Bilirubin** — Level + Age on same row; View Nomogram button; off-scale pulsing arrow
- **Nomogram scroll** — explicit button trigger only, no eager auto-scroll

### Architecture
**Multi-file setup for GitHub Pages:**
- `index.html` - PWA entry point with runtime JSX transpilation via Babel
- `PediatricCalc.jsx` - React component (~2350 lines)
- `sw.js` - Service worker v5
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
- Test case: Acetaminophen 20kg × 400mg/kg = 8000mg must display as "8000", not "8"

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
2. **Bhutani** — Two SVG graphs (risk zones + treatment thresholds); pulsing patient point; off-scale red pulsing arrow at correct age x-coordinate if bili > 22 mg/dL

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
unit (physical measure): #b8860b / 600 weight
unit (descriptor/synonym): COLORS.textMuted / 400 weight
field: white / #d0d4d9 inactive / 2px navy focused
value: IBM Plex Mono 14px
enterKeyHint="done" / blur on Enter
```

**Gold unit rule:** Gold only for physical units (mg/dL, kg, weeks, hr, mcg/mL, etc.). NOT for descriptors (COLOR, REFLEX, HEART RATE).

### ResultBadge
```
Props: score, label, color, sublabel, detail (optional)
score: 28px IBM Plex Sans, white-space: pre-line (\n = line break)
detail: { title, bullets[] } — rendered below sublabel with divider
```

### Inline Info Modal Pattern (ℹ)
- `useState(false)` show/hide per modal
- Button: transparent, `COLORS.textMuted`, right-justified on label line
- Modal: fixed scrim, bottom sheet, tap-outside dismiss
- **Must be placed outside conditional age-group fragments**

## PECARN Architecture

### <2 Years
**High-risk (4.4%) — any positive = immediate CT:**
GCS · AMS (ℹ) [same row] · Palpable Skull Fracture

**Intermediate (0.9%):**
Scalp Hematoma (4 options) · LOC · Not Acting Normally + Severe Mechanism (ℹ) [paired]

**Low (<0.02%):** CT NOT Indicated (Observe)

### ≥2 Years
**High-risk (4.3%) — any positive = immediate CT:**
GCS · AMS (ℹ) [same row] · Signs of Basilar Skull Fracture

**Intermediate (0.8%):**
Vomiting + Severe Headache [paired] · LOC + Severe Mechanism (ℹ) [paired]

**Low (<0.05%):** CT NOT Indicated (Observe)

**Notes:**
- Severe Mechanism fall height: >3 ft (<2yr) / >5 ft (≥2yr) — modal reads `ageGroup` dynamically
- <2yr intermediate detail includes "Very young infant (< 3 months old)"; ≥2yr does not
- Both modals (AMS, Mech) are outside age fragments — fire for both groups

## Emoji Glossary
See memory "PediCalc emoji glossary A/B". In-use: 👶🏼 Neonatal · 💧 FEN · 🧠 Neurologic · 🫁 Respiratory · ♥️ Cardiac · ☠️ Toxicology · 💊 Common Rx · 📊 Risk Scores · ⬅️ Back · ℹ️ Information

## Deployment

### Workflow
1. Increment CACHE_NAME in `sw.js`
2. Bump version string in JSX footer pill
3. Upload: `index.html` + `PediatricCalc.jsx` + `sw.js` + `manifest.json`
4. **Always redeploy `index.html` with `sw.js`** even if unchanged — required for cache sync

### Current versions
- Service worker: `pedicalc-v5`
- Footer pill: `v5`

### What Works ✅ / Breaks ❌
✅ Direct JSX edits · ScoreRow/NumberInput changes (global) · SW version bumps · Replacing splash content
❌ New HTML layers · CSS animations on load · ESM imports · Anything before/during Babel transpilation

**Golden Rule:** The app loads fast (<1s). Don't add complexity to the loading sequence.

## User Background
Troy is a pediatrician (MD) in Los Angeles. Values infrastructure he owns — no third-party tokens, no freemium models. Explicit protocols, epistemically humble approaches.

---
**Last Updated:** May 2, 2026 · v5
