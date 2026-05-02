# PediCalc PWA - Development Context

## Project Overview
PediCalc is a progressive web app providing 27 evidence-based pediatric clinical calculators. Built as a single-page React application with Medical Records theme styling, deployed to GitHub Pages at `trillnjoy.github.io/Claude_Artifacts/`.

## Current State (v4 - May 2026)

### Recent Changes (v4)
- **Category restructure** — 12 categories → 8, with clinical sequencing: Neonatal → FEN → Neurologic → Respiratory → Cardiac → Toxicology → Common Rx → Risk Scores
- **Calculator reassignments** — Bilirubin + Finnegan NAS → Neonatal; COWS + WAT-1 + FLACC → Neurologic; Hyponatremia + U25 eGFR → FEN; Kawasaki → Cardiac; SIRS/Sepsis + NAT Fracture → Risk Scores
- **Eliminated categories** — Hepatic, Withdrawal, Sepsis/Infection, Renal
- **Category filter bar** — icon-only 40×40px buttons (Apple HIG compliant), 22px emoji, "ALL" in IBM Plex Mono caps (gold when active)
- **List row icons** — 40×40px neutral gray boxes (`#f0f1f3` fill, `COLORS.border` border), 22px emoji, left-aligned with filter bar
- **Header chrome** — gold (`#d4a444`) for secondary text (EMR badge, calculator count, category breadcrumb); white for primary; navy background
- **Green status dot removed**
- **Disclaimer** — moved to footer pill; single line replacing previous two-element stack
- **ScoreRow (all toggle buttons)** — `-apple-system` sans-serif, 15px, `fontWeight: 500`, `white-space: nowrap`, `flex: 1` (equal width, no wrap); unselected: white/`#d0d4d9` border/navy text; selected: `#e8eaed` gray/same border/navy text; no blue in button states; 8px vertical padding; section labels 12px/`fontWeight: 700`/navy
- **NumberInput (all numeric fields)** — `type="number"` with global CSS spinner suppression; inactive border `#d0d4d9`; focused: 2px navy border; label 12px/700/navy; unit qualifiers: gold `#b8860b`/`fontWeight: 600` for physical units only (mg/dL, kg, weeks, etc.), muted gray for descriptors
- **Gold unit qualifier rule** — gold only when parenthetical is a physical unit of measure; descriptors/synonyms (COLOR, REFLEX, HEART RATE) remain muted gray
- **Result card** — color (green/yellow/red) reserved exclusively for result severity; no color elsewhere in calculator UI

### Architecture
**Multi-file setup for GitHub Pages:**
- `index.html` - PWA entry point with runtime JSX transpilation via Babel
- `PediatricCalc.jsx` - React component (~2130 lines)
- `sw.js` - Service worker v4 with cache busting
- `manifest.json` - PWA configuration
- `icon-192.png`, `icon-512.png` - App icons (calculator graphic, full-bleed square PNGs)

**Key constraint:** Runtime Babel transpilation at page load. `index.html` fetches `PediatricCalc.jsx`, strips imports, transpiles JSX→JS, then renders. This architecture is fragile — adding complexity to the loading sequence has consistently broken the app.

### File Locations
- **Deployment files:** `/mnt/user-data/outputs/`
- **Stable backups:** `/mnt/user-data/outputs/*.STABLE`
- **Restore command:** `cp /mnt/user-data/outputs/*.STABLE /mnt/user-data/outputs/`

### Testing Limitations
- `PediatricCalc.jsx` loads immediately as a direct artifact ✅
- `index.html` fails in artifacts (no file system for fetch) ❌
- **Never test index.html in artifacts** — only works on GitHub Pages

## Medical Records Theme
**Color System:**
```
bg: #ffffff
navy: #1a2332 (header, primary text)
accent: #0066cc (search border only; not used in calculator UI)
surface: #f8f9fb
border: #d0d9e3
textMuted: #5f6b7c
textSub: #8a9ba8
success: #0f9960
warning: #d9822b
danger: #db3737
gold (chrome): #d4a444
gold (unit labels): #b8860b
```

**Typography:**
- UI labels/headers: IBM Plex Sans
- Data values / result display: IBM Plex Mono
- Option buttons: `-apple-system` sans-serif (15px)
- 3px border radius (sharp corners)
- EHR-grade density

## Critical Safety Features

### Trailing Zero Handling
**DANGER:** Original regex `/\.?0+$/` stripped significant zeros (8000→8, causing 1000× dosing errors)

**CORRECT regex:** `(\.\d*?)0+$`
- Removes trailing zeros ONLY after decimal: `12.50` → `12.5`
- Preserves whole number zeros: `8000` stays `8000`

**Applied in:**
- `NumberInput` component `displayValue`
- `ResultBadge` component `displayScore`
- Drug dosing calculator

**Test case:** Acetaminophen 20kg × 400mg/kg = 8000mg must display as "8000", not "8"

## 8 Categories / 27 Calculators

**Sequence (clinical logic: growth → systems → intervention → risk):**

| # | Category | Icon | Count | Calculators |
|---|---|---|---|---|
| 1 | Neonatal | 👶🏼 | 5 | APGAR, Bhutani Bilirubin, Hypoglycemia, Prematurity, Finnegan NAS |
| 2 | FEN | 💧 | 5 | Holliday-Segar, Parkland Burns, Dehydration, Hyponatremia, U25 eGFR |
| 3 | Neurologic | 🧠 | 6 | Pediatric GCS, PECARN, CATCH, COWS, WAT-1, FLACC |
| 4 | Respiratory | 🫁 | 2 | Bronchiolitis, PRAM Asthma |
| 5 | Cardiac | ♥️ | 3 | Wells DVT, Corrected QT, Kawasaki |
| 6 | Toxicology | ☠️ | 1 | Acetaminophen (Rumack-Matthew) |
| 7 | Common Rx | 💊 | 1 | Common Drug Doses |
| 8 | Risk Scores | 📊 | 4 | SIRS/Sepsis, NAT Fracture, Readmission, PEWS |

**Visual Nomograms:**
1. **Acetaminophen toxicity** — 4–24h window, Rumack-Matthew treatment line
2. **Bhutani hyperbilirubinemia** — Two interactive SVG graphs (risk zones + treatment thresholds), pulsing patient point marker

## Shared UI Components

### ScoreRow
All toggle/option button groups across every calculator. Changes here propagate to all 27.
```
label: 12px / fontWeight 700 / navy / uppercase / IBM Plex Sans
buttons: -apple-system 15px / flex:1 / white-space:nowrap / 8px vertical padding
unselected: white fill / #d0d4d9 border / navy text
selected: #e8eaed fill / #d0d4d9 border / navy text
NO blue anywhere in button states
```

### NumberInput
All numeric entry fields. `type="number"` with global CSS spinner suppression.
```
label: 12px / fontWeight 700 / navy / uppercase / IBM Plex Sans
unit (physical): #b8860b / fontWeight 600
unit (descriptor): COLORS.textMuted / fontWeight 400
field inactive: white / #d0d4d9 border
field focused: white / 2px navy border
value display: IBM Plex Mono 14px
```

**Physical unit gold rule:** Gold only for units of measure (mg/dL, kg, weeks, bpm, °C, mEq/L, etc.). Descriptors like (COLOR), (REFLEX), (HEART RATE) stay muted gray.

### ResultBadge
Color-coded result display. **Color used here only** — not in inputs or buttons.
```
success (green): #0f9960
warning (orange): #d9822b
danger (red): #db3737
```

## Clinical References System
**CALC_REFERENCES object** contains complete citations for all 27 calculators:
- Summary, Primary Reference, Guidelines, Disclaimer

**Display:** ℹ️ button in calculator header opens modal with full reference details.

## Known Issues & Fragilities

### iOS Input Behavior
- `type="number"` with global CSS spinner suppression (`-webkit-appearance: none`) — numeric decimal keyboard on iOS ✅
- Text selection handles on focus: iOS system behavior, cannot be fully suppressed. Less intrusive with `type="number"` than `type="text"`

### Splash Screen
- Gold gradient splash (2-second minimum display) implemented in `index.html`
- All attempts to add animated splash to loading sequence have broken the app
- **Golden rule:** Replace existing loading screen content, never layer on top

### Service Worker Versioning
- **Current:** v4 (`pedicalc-v4`)
- Cache busting: increment version in `sw.js`

### iOS PWA Icon Conventions
- Full-bleed square PNGs, no transparency
- System applies squircle mask automatically
- Safe zone: inset 10% from edges
- Filenames: `icon-192.png`, `icon-512.png`

## Deployment Workflow

1. Update version in `sw.js` (increment CACHE_NAME)
2. Upload to GitHub: `index.html`, `PediatricCalc.jsx`, `sw.js`, `manifest.json`, icons
3. GitHub Actions auto-deploys to Pages
4. Users get fresh files on next load (cache busted by new service worker)

### Rollback
```bash
cp /mnt/user-data/outputs/*.STABLE /mnt/user-data/outputs/
```

## Development Principles

### What Works ✅
- Direct modifications to `PediatricCalc.jsx`
- Changes to ScoreRow / NumberInput propagate globally
- Simple CSS/style changes
- Calculator logic additions/modifications
- Clinical reference updates
- Service worker cache version bumps
- Replacing loading screen content (not layering)

### What Breaks Things ❌
- Adding new HTML layers/overlays to `index.html`
- CSS animations on loading sequence
- JavaScript that runs before/during Babel transpilation
- External module imports (ESM `import` statements)
- Anything that delays or interferes with the render sequence

### Golden Rule
**The app loads fast (<1 second). Don't add complexity to the loading sequence. If you want something during load, REPLACE the existing loading screen content — don't layer on top.**

## User Background
Troy is a pediatrician (MD) based in Los Angeles with interests in clinical education, health informatics, and point-of-care tools. Values: infrastructure he owns (no third-party tokens, no freemium models), explicit protocols, epistemically humble approaches. Lifelong reader, poet, translator, printmaker.

---
**Last Updated:** May 2, 2026 (v4 — UI overhaul: category restructure, ScoreRow/NumberInput global redesign, gold chrome, filter bar)
