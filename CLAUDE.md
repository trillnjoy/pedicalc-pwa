# PediCalc PWA - Development Context

## Project Overview

PediCalc is a progressive web app providing 27 evidence-based pediatric clinical calculators. Built as a single-page React application with Medical Records theme styling, deployed to GitHub Pages at `trillnjoy.github.io/Claude_Artifacts/`.

## Current State (v13 - May 2026)

### Recent Changes (v12 → v13)

**Dose Engine Integration (Common Rx calculator):**

A purpose-built dosing engine was integrated into `DoseCalc()` above the component as module-level pure functions:

- `freqToDoses(freqStr)` — maps frequency strings to doses/day integer
- `buildTabSteps(strength, divisibility)` — returns achievable mg steps for a tablet
- `backCalcThreshold(maxDayMg, hiDosePerKg, dosesPerDay, tabStrength, divisibility)` — computes weight threshold where adult daily cap applies
- `selectSuspDose(w, lo, hi, dosesPerDay, maxDayMg, strengthPer5)` — returns snapped volume, dose, syringe label
- `selectTabDose(w, lo, hi, dosesPerDay, maxDayMg, tabStrength, divisibility, override)` — returns tablet fraction and dose

**Drug data model extended** — five pilot drugs (acetaminophen, ibuprofen, amoxicillin, amoxicillin_clavulanate, azithromycin) received `dosesPerDay` and `formulationDefs[]` arrays. Six additional drugs with `dose[]` (atropine, ceftriaxone, dexamethasone, epinephrine_cardiac, morphine, ondansetron) also received `formulationDefs[]`.

**Route vocabulary in `formulationDefs`:**

- `"susp"` — oral suspensions/liquids
- `"tab"` — tablets, chewable tabs, caps, ODTs
- `"inj"` — IV, IM, IO injectable formulations
- `"supp"` — rectal suppositories
- `"other"` — topical, ophthalmic, MDI, otic (no route button rendered)

**UI changes to DoseCalc():**

The result card was restructured. Row 1 of the output grid is now three columns: Dose Per kg | Low Dose | High Dose (using `2fr 1.5fr 1.5fr` column weighting to prevent wrap on narrow screens). Row 2 is Route | Frequency. Max Single Dose was permanently removed as a standalone field; when the weight-based high dose hits the per-dose ceiling, "(max)" appends inline to the High Dose value. Route cell now shows formulation-appropriate route ("PO" for susp/tab) rather than the drug-level catch-all string.

The segmented control is now dynamic — it builds from `ROUTE_META` in fixed display order (SUSP → TAB → INJ → SUPP → OTHER), filtered to only routes present in the current drug's `formulationDefs`. Drugs with a single route show no toggle. The formulation dropdown filters to show only formulations matching the selected route.

The threshold advisory (adult cap warning + override toggle) now renders only when the entered weight actually exceeds the back-calculated threshold.

**Pearl + bracket card architecture:**

Four drugs (acetaminophen, ibuprofen, dexamethasone, ondansetron) received `brackets[]` and `pearl` fields. The pearl card renders below the output grid when `d.pearl` is present, showing a 3px accent left-bar pearl block. The bracket row display was removed (redundant given weight input). The formulation pills section was removed (dropdown is now the single source).

**Clinical decision support reframe:**

The Common Rx tab is positioned as a curated clinical pearl and formulation reference, not a volume calculator. The Give card engine remains in the codebase but the architecture is evolving toward bracket-based standardized dosing tables (formulation-specific, ±20% tolerance, minimal rows) rather than per-weight volume calculation. Substantial work was done developing the algorithm for acetaminophen liquid dosing tables — this work is preserved in session history but not yet coded into the UI.

**Safety fix:** The trailing-zero regex bug (`/\.?0+$/`) in the old `fmt()` function was corrected to use the existing `stripTrailingZeros()` utility throughout DoseCalc.

**Azithromycin formulation fix:** The malformed `"500 mg tab 1% ophthalmic liq"` entry was split into two properly separate formulation entries.

**Dexamethasone formulation fix:** The `0.1 mg/mL liq` entry (impractically dilute) was replaced with `4 mg/mL liq (oral)` — the IV solution given orally for croup, `strengthPer5: 20`.

### Architecture

**Multi-file setup for GitHub Pages:**

- `index.html` — PWA entry point with runtime JSX transpilation via Babel (unchanged this session)
- `PediatricCalc.jsx` — React component (~3800+ lines as of v13)
- `sw.js` — Service worker v13 with cache busting
- `manifest.json` — PWA configuration (unchanged)
- `icon-192.png`, `icon-512.png` — App icons (unchanged)

**Key constraint:** Runtime Babel transpilation at page load. `index.html` fetches `PediatricCalc.jsx`, strips imports, transpiles JSX→JS, then renders. This architecture is fragile — adding complexity to the loading sequence has consistently broken the app in past attempts.

### File Locations

- **Deployment files:** `/mnt/user-data/outputs/`
- **Stable backups:** `/mnt/user-data/outputs/*.STABLE`
- **Restore command:** `cp /mnt/user-data/outputs/*.STABLE /mnt/user-data/outputs/`

### Testing Limitations

**Artifact sandbox behavior:**

- `PediatricCalc.jsx` loads immediately as a direct artifact ✅
- `index.html` fails in artifacts (no file system for fetch) ❌
- **Never test index.html in artifacts** — it only works on GitHub Pages

**For testing:** Always create `PediatricCalc.jsx` as artifact, not `index.html`

## Medical Records Theme

**Color System:**

```
bg: #ffffff (pure white)
navy: #1a2332 (header)
accent: #0066cc (sky blue)
surface: #f8f9fa (subtle gray)
border: #e1e4e8 (light borders)
textMuted: #6c757d
warning: #d9822b (amber — used for override toggle active state)
```

**Typography:**

- UI: IBM Plex Sans
- Data/values: IBM Plex Mono
- Hero values: Sora
- Tight tabular rows with row-striping
- 3px border radius (sharp corners)
- EHR-grade density (compact 10px padding)

## Critical Safety Features

### Trailing Zero Handling

**DANGER:** Original regex `/\.?0+$/` stripped significant zeros (8000→8, causing 1000× dosing errors)

**CORRECT regex:** `(\.\d*?)0+$` — implemented as `stripTrailingZeros()` utility in the file

- Removes trailing zeros ONLY after decimal: `12.50` → `12.5`
- Preserves whole number zeros: `8000` stays `8000`

**Test case:** Acetaminophen 20kg × 400mg/kg = 8000mg must display as "8000", not "8"

## DoseCalc Architecture Notes

### `dose[]` is per dose, not per day

`dose[lo, hi]` in every drug entry is `mg/kg/DOSE`. Never divide by `dosesPerDay` when computing per-dose targets. Multiply `dose[lo/hi] * weight` directly.

### formulationDefs[] index alignment

`formulationDefs[i]` must always correspond to `formulations[i]` at the same index. Every formulation string must have a matching formulationDefs entry, even if just `{ route: "other" }`.

### Give card suppression rules

The Give card does not render when:
- `formulationDefs[fmtIdx].route` is not `"susp"` or `"tab"`
- `dosesPerDay` is null
- weight is 0 or not set
- No matching result from the engine functions

### Threshold advisory suppression

Advisory only renders when `weight > thresholdInfo.thresholdKg`. Below threshold it is entirely hidden.

### Max dose display

Max Single Dose is permanently removed as a standalone field. When `calcHigh >= d.maxMg * 0.99`, the High Dose cell appends "(max)" inline.

## 27 Clinical Calculators

**Categories:**

- Neonatal (4): APGAR, Bhutani, Hypoglycemia, Prematurity
- Neurologic (3): Pediatric GCS, PECARN, CATCH
- Withdrawal (3): COWS, Finnegan, WAT-1
- Toxicology (1): Acetaminophen/Rumack-Matthew with visual nomogram
- Respiratory (2): Bronchiolitis, PRAM
- Fluids (2): Holliday-Segar, Parkland
- Renal (2): U25 eGFR, Hyponatremia
- Cardiac (2): Wells DVT, QTc
- Sepsis (3): SIRS, Dehydration, Kawasaki
- Risk (4): Readmission, PEWS, FLACC, NAT Fracture
- Dosing (10): Common Drug Doses (DoseCalc)

## Dosing Table Work (In Progress — Not Yet Coded)

A significant design discussion established the following architecture for future standardized dosing tables, to be implemented as a UI addition to DoseCalc or a separate calculator:

**Algorithm:** For each formulation, build a minimal-row table where each row represents the largest safe volume/dose step that keeps every patient weight within ±20% of the target mg/kg dose. Rows are fewest possible; spacing is uneven by design (narrow at low weights, wide at high weights). No artificial floor on volume — 0.1 mL increments throughout for liquid formulations using 1 mL and 3 mL oral syringes.

**Acetaminophen liquid (32 mg/mL) tables** were fully computed for both regimens:
- 12.5 mg/kg q4h: 11 rows, 0.50 kg → 25 kg
- 15 mg/kg q6h: 11 rows, 0.50 kg → 25 kg

Above 25 kg transitions to tablet formulations. Tablet tables (325 mg, 500 mg) to be computed separately. Each table is formulation-specific — one table per formulation, never mixing products.

**Pearl + bracket field** (`d.brackets[]`, `d.pearl`) are in the data model for acetaminophen, ibuprofen, dexamethasone, and ondansetron. The bracket display was removed from the UI (redundant with weight input); the pearl displays in the pearl card. The `brackets[]` data is preserved for future use as the dosing table seed.

## Service Worker Versioning

**Current:** v13 (`pedicalc-v13`) — must match app version footer in PediatricCalc.jsx

**Cache busting:** Increment `CACHE_NAME` in `sw.js` on every deployment that changes any cached file.

```javascript
const CACHE_NAME = 'pedicalc-v14'; // Next version
```

## Deployment Workflow

1. Update `CACHE_NAME` in `sw.js` (pedicalc-v13 → v14)
2. Update version string in `PediatricCalc.jsx` footer (v13 → v14)
3. Update `Last Updated` in this `CLAUDE.md`
4. Upload to GitHub: `index.html`, `PediatricCalc.jsx`, `sw.js`, `manifest.json`, icons
5. GitHub Actions auto-deploys to Pages
6. Users get fresh files on next load (cache busted by new service worker version)

### Testing Before Deployment

- Test `PediatricCalc.jsx` as artifact (works immediately)
- **DO NOT** test `index.html` in artifacts (will always fail)
- Deploy to GitHub Pages for full testing with all files

### Rollback

```bash
cp /mnt/user-data/outputs/PediatricCalc.jsx.STABLE /mnt/user-data/outputs/PediatricCalc.jsx
```

## Development Principles

### What Works

- Direct modifications to `PediatricCalc.jsx` ✅
- Simple CSS changes to Medical Records theme ✅
- Adding/modifying calculator logic ✅
- Updating clinical references ✅
- Service worker cache version bumps ✅
- Replacing loading screen content (not adding layers) ✅

### What Breaks Things

- Adding new HTML layers/overlays to `index.html` ❌
- CSS animations on loading sequence ❌
- JavaScript that runs before/during Babel transpilation ❌
- External module imports (ESM `import` statements) ❌
- Anything that delays or interferes with the render sequence ❌

### Golden Rule

**The app loads fast (<1 second). Don't add complexity to the loading sequence. If you want something to show during load, REPLACE the existing loading screen content, don't layer on top of it.**

## PediCalc Emoji Glossary A

✍🏼Orders 👂🏼ENT 🦻🏼Audiology 👁️Ophthalmology 👓Optometry 🫀Cardiology 🫁Pulmonology 🧠Neurology 🗣️SLP 🦷Dentistry 💊Pharmacy 🤱🏻Lactation 🍼Formula 🚑ED 🦼PT ⚙️Settings 🔬Lab 🩻Radiology 💉Immunization 🩸Hematology 🧬Genetics 🦠Virology 🧫Microbiology 🛏️Bed 🗓️Schedule 🔍Search ✏️Edit 🔒Lock 🔓Unlock

## PediCalc Emoji Glossary B

☣️Radiation 🛑Stop ⚠️Caution/Alert ♻️Update ✅Confirm ❌Delete 📊Analytics/Risk 🧑‍🧑‍🧒‍🧒Family 🚻Sex 📬Outbox ✉️Message 📨Inbox 🏷️Tag 📎Attachment ⚧️Gender ℹ️Information ⬅️Back ➡️Forward 🕒Time 🇺🇸English 🇲🇽Spanish ☠️Poison/Toxicology 🦿Prosthetics 👶🏼Baby/Infant/Neonatology 🍎Education

## User Background

Troy is a Board Certified Clinical Informaticist and executive physician (pediatrics) based in Los Angeles. PediCalc development philosophy: clinical pearls and curated decision support at point of care, not a LexiComp replacement. Infrastructure Troy owns (no third-party tokens, no freemium models). Primary test device: iPhone Safari. No browser DevTools available in that environment.

---

**Last Updated:** May 2026 (v13 — Dose engine integration, dynamic route control, pearl card, result card restructure, formulationDefs route vocabulary expansion)
