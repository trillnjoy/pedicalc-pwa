# PediCalc PWA - Development Context

## Project Overview

PediCalc is a progressive web app providing evidence-based pediatric clinical calculators. Built as a single-page React application with Medical Records theme styling, deployed to GitHub Pages at `trillnjoy.github.io/pedicalc-pwa/`.

## Current State (v23 - May 2026)

### Architecture

**Multi-file setup for GitHub Pages:**

- `index.html` — PWA entry point with runtime JSX transpilation via Babel (stable, do not modify)
- `PediatricCalc.jsx` — React component (~6300+ lines as of v23)
- `sw.js` — Service worker v23 with cache busting
- `manifest.json` — PWA configuration (unchanged)
- `icon-192.png`, `icon-512.png` — App icons (unchanged)

**Key constraint:** Runtime Babel transpilation at page load. `index.html` fetches `PediatricCalc.jsx`, strips imports, transpiles JSX→JS, then renders. This architecture is fragile — adding complexity to the loading sequence has consistently broken the app in past attempts.

**Testing:** `PediatricCalc.jsx` as artifact works. `index.html` always fails in artifacts — only works on GitHub Pages. Never test index.html in artifacts.

**Rollback:** `cp /mnt/user-data/outputs/PediatricCalc.jsx.STABLE /mnt/user-data/outputs/PediatricCalc.jsx`

-----

## Changes This Session (v22 → v23)

### GrowthCalc — Major Refinements

This session was almost entirely GrowthCalc. Changes are documented in detail below.

**Fenton 2025 LMS data substituted.** The placeholder `FENTON_LMS` constant has been replaced with data extracted directly from the official Fenton 2025 Clinical Calculator v1.23 (University of Calgary, Excel workbook provided by Tannis Fenton under Creative Commons). Data comes from the “daily LMS & key percentiles” sheet. Six tables: weight (female/male, 22.5–50.0 decimal weeks, 194 rows each), HC (female/male, same range), length (female/male, 23.5–50.0 decimal weeks, 187 rows each). Weight M values converted from grams to kg. Daily resolution means the interpolation engine spans at most 1/7 of a week between nodes — functionally continuous curves, no staircase artifacts at integer-week boundaries. Citation: Fenton TR, Elmrayed S, Alshaikh BN. Paediatr Perinat Epidemiol. 2025.

**Specialty curves — all now validated.** The four placeholder specialty curve constants have been replaced with validated published data:

- `DS_LFA_0to36m` / `DS_LFA_2to20y` — Zemel 2015 (DSGS/CDC), with correct non-unity L values for weight (−0.27/−0.18 infant, −0.50/−0.62 older)
- `DS_WFA_0to36m` / `DS_WFA_2to20y` — Zemel 2015
- `DS_HCA_0to36m` / `DS_HCA_2to20y` — Zemel 2015
- `TURNER_SFA` — Isojima 2010 (Japanese reference, adult median ~142 cm; label note for US/European use)
- `NELLHAUS_HC` — Nellhaus 1968 / CDC-digitized; now sex-specific (`male`/`female` keys instead of `both`)
- `ROLLINS_HC` — Rollins 2010 US (0–21yr), real sex-specific L=1 LOESS-derived values; was previously aliased to WHO_HCFA (a stub)

Age-split DS tables use helper functions `dsLFA(sex, ageMo)`, `dsWFA(sex, ageMo)`, `dsHCA(sex, ageMo)` to select 0–36m or 2–20y table by corrected age. All DS weight tables now carry published non-unity L values. `GROWTHCALC DATA STATUS` comment updated throughout — all tables are now validated except WHO_WFL_* which are abbreviated to 5cm intervals.

**New calculators added.** Free Water Deficit (Hypernatremia), FENa/FEUrea (AKI), Mentzer Index, Corrected Reticulocyte Count/RPI. Hematology added as a new category (🩸) with Mentzer and Retic grouped under it.

**`chartConfig` — corrected-age labeling.** `isPrem` boolean (derived from `egaWeeks < 37`) is now passed into `chartConfig` as an eighth parameter. WHO-zone charts show “Corrected Age (months)” on the x-axis and “WHO Age Corrected” as the chart identifier only when the patient is actually premature. Term infants see “Age (months)” and “WHO 2006”. The chart notes line below the chart (“WHO 2006 plotted at corrected age”) similarly conditions on `isPrem`.

**`zoneLabel` — full chart identifier.** Previously returned only “Fenton 2025”, “WHO 2006”, or “CDC 2000”. Now encodes special population and HC variant context: “Down Syndrome 2015”, “Turner Syndrome 2010”, “Nellhaus 1968”, “Rollins US 2010”, “WHO Age Corrected” (premature WHO), “WHO 2006” (term WHO). Used in the Chart tile and chart attribution line.

**`zoneColor` decoupled from clinical meaning.** Previously green for WHO, teal for Fenton, blue for CDC — colors that implied clinical judgment. Now always `C.accent` (neutral blue) for the chart identifier tile border and label. Clinical color now comes exclusively from `classify()`.

**`classify()` — neutral for normal range.** Green was removed from the 25th–75th percentile band. New logic: red only at Z beyond ±2.5 (< 0.6th or > 99.4th percentile), amber for 3rd–10th and 90th–97th watch bands, navy for everything in between. Green implies goodness; growth charts don’t have a “good” percentile.

**Sex-specific curve colors.** `GrowthChart` now receives `sex` prop. Female charts use rose/pink family (`#d46b8a` curves, `#a0203e` 50th); male charts use steel blue family (`#5b9ad4` curves, `#1a4f8a` 50th). CDC convention for growth charts.

**Specialty curve stub warnings removed.** Down syndrome, Turner, Nellhaus, Rollins no longer show stub warnings — they have validated data. Russell-Silver still shows an amber warning (no LMS data exists). Fenton zone chart note now shows a citation rather than a warning.

**Chart layout — portrait 8:11 ratio, full width, tiles below.** Chart now spans full content width (was previously 63% with sidebar). The three result tiles (Chart, Percentile, Z Score) moved from a right-side vertical column into a three-column row below the chart. Portrait 8:11 ratio (CHART_W=400, CHART_H=550) preserved — growth velocity is encoded in curve slope; landscape distortion changes clinical meaning.

**Measurement input layout — inline stats.** The three measurement fields (Weight, Ht/Len, HC/OFC) plus a computed BMI or Wt-for-Length display field are arranged in two rows of two half-width columns. Each field shows its percentile and Z score as a sibling div to the right of the input field — outside the input’s border box, never inside it. **Critical implementation note:** stats must be sibling divs, not inline component definitions. Defining components (`const MeasField = ...`) inside a render IIFE gives them a new identity on every render, causing React to unmount/remount their children, which dismisses the iOS keyboard on every keystroke. All measurement JSX is flat — no inline component definitions, `statDiv()` is a plain function returning JSX, not a component.

**BMI / Wt-for-Length mutual exclusivity.** BMI applies from corrected age ≥ 731.5 days (2 years). Wt-for-Length applies below that threshold. Both are computed from `calcResult()` simultaneously with the other three metrics. The computed field is display-only (muted background, “calc” label annotation, same border styling as inputs).

**Chart attribution line in calculated fields card.** A `zoneLabel`-driven line reads “Percentiles and Z-scores based on **[chart name]**”, separated from the age fields above by a hairline rule.

**Per-metric results computed simultaneously.** `calcResult()` is a pure function. It is called four times on every render (weight, length, HC, composite) regardless of which metric tab is active. This surfaces all percentiles and Z-scores without requiring the user to tap between tabs.

**Unit qualifier color convention documented.** Unit qualifiers adjacent to labels use `#b8860b` (dark gold) throughout PediCalc — not `C.accent` (blue) or `C.muted`. This is visible in `NumberInput` (line 307), `BilirubinCalc`, and now consistently in the GrowthCalc measurement labels.

-----

## Previous Session Changes (v21 → v22)

### GrowthCalc Integration (v21→v22)

GrowthCalc.jsx integrated into PediatricCalc.jsx. Growth category (📈) added first in CATEGORIES and CALCULATORS. Palette unified to COLORS via `const C = {...COLORS aliases}`. MM/DD/YYYY spinner inputs replacing `type="date"` (native date picker’s rendered width is not controllable on iOS). Collapsible Special Population / HC variant picker using the same gold-divider accordion pattern as the Fluids calculator. Portrait 8:11 chart ratio established. See v22 entry for full GrowthCalc data status at time of integration.

### KD Calculator (v20)

Fever threshold corrected to ≥38.0°C. Fever ScoreRow subscore suppressed via `hideScore` prop. Required labs updated: `CBC diff · ESR · CRP · CMP · Bag/CC UA w/micro (detect urethritis)`.

### BilirubinCalc Restoration (v21)

Full v13 implementation restored — all four AAP 2022 supplemental tables (PT_NR, PT_WR, ET_NR, ET_WR) with exact hour-specific values by GA and risk, three-tier decision logic (phototherapy / escalation of care / exchange), B/A ratio, SVG threshold graph, collapsible Bhutani nomogram.

-----

## GrowthCalc Data Status (as of v23)

**All tables clinically validated:**

- WHO 2006: WHO_WFA, WHO_LFA, WHO_HCFA, WHO_WFL_* (abbreviated to 5cm intervals — replace with 0.5cm-step for production)
- CDC 2000: CDC_WFA, CDC_SFA, CDC_BMIFA
- Fenton 2025: FENTON_LMS — official v1.23 data, daily resolution, 22.5–50.0 wks
- Down Syndrome: DS_LFA/WFA/HCA 0to36m and 2to20y — Zemel 2015 (DSGS/CDC)
- Turner Syndrome: TURNER_SFA — Isojima 2010 (Japanese reference; adult median ~142 cm; consider +3–5 cm for US/European populations)
- Nellhaus HC: NELLHAUS_HC — Nellhaus 1968/CDC-digitized, sex-specific, L=1 approximation
- Rollins HC: ROLLINS_HC — Rollins 2010 US 0–21yr, sex-specific, L=1 from LOESS

**No validated data (Russell-Silver):** Stub only. Amber warning shown in UI when selected.

-----

## Medical Records Theme

```
bg: #ffffff          navy: #1a2332       accent: #0066cc
surface: #f8f9fa     border: #e1e4e8     textMuted: #6c757d
warning: #d9822b     danger: #c0392b     success: #27ae60
```

Fonts: IBM Plex Sans (UI) · IBM Plex Mono (data/values) · Sora (hero values). 3px border radius. EHR-grade density.

**Unit qualifier color convention:** `#b8860b` (dark gold) — used in all label+unit pairs throughout the app. Do not use `C.accent` (blue) or `C.muted` for unit qualifiers.

-----

## Critical Safety Notes

**Trailing zero regex:** Use `stripTrailingZeros()` utility throughout. Never use `/\.?0+$/` — it strips significant zeros (8000→8, causing 1000× dosing errors).

**`dose[]` is per dose not per day:** Never divide by `dosesPerDay` when computing per-dose targets. Multiply `dose[lo/hi] * weight` directly.

**`formulationDefs[i]` must index-align with `formulations[i]`** — every formulation string needs a matching entry even if just `{ route: "other" }`.

**iOS slider pattern:** For smooth drag on iPhone Safari, use ref-based approach: `defaultValue` (uncontrolled input), `onInput` updates `dragVal.current` and DOM directly via `ref.current.style.setProperty`, `onPointerUp` reads `dragVal.current` for single `setState` commit. Add `touch-action: none` to the input’s CSS class.

**iOS keyboard dismissal trap:** Never define component functions inside a render IIFE or render function. Inline component definitions (`const MyComp = ({...}) => ...`) get a new function identity on every render. React unmounts/remounts their children, which dismisses the iOS keyboard on every keystroke. Use plain functions returning JSX values, or hoist components outside the render function entirely.

**Babel landmines:**

- No regex literals in template literals — use `new RegExp()` instead
- No literal newlines in single-quoted strings — use `\n` escape
- Array spread inside JSX must use brackets: `[...arr]` not bare spread

-----

## Deployment Workflow

1. Update `CACHE_NAME` in `sw.js` (increment version) — only when Troy requests
1. Update version string in `PediatricCalc.jsx` footer (must match)
1. Update this `CLAUDE.md`
1. Upload to GitHub: `index.html`, `PediatricCalc.jsx`, `sw.js`, `manifest.json`, icons
1. GitHub Actions auto-deploys to Pages

**Current version: v23.** Next will be v24.

-----

## Outstanding Work (Logged)

**Burn calculator — overlay drawer refinement (deferred):** Region detail panel position and homunculus visibility during editing has room for improvement. Deferred.

**Common Rx — dosing table UI (deferred):** Bracket table algorithm designed and verified but UI not yet built. Scoped down pending re-evaluation.

**Common Rx — regimen architecture (deferred):** Ibuprofen, amoxicillin, amoxicillin-clavulanate need a `regimens[]` data model. Deferred.

**Ibuprofen data correction (deferred):** Current `dose: [5, 10]` is clinically misleading (standard is 10 mg/kg q6h). Deferred pending regimen architecture.

**KD algorithm image:** AHA flowchart URL is paywalled. `algorithmUrl` field populated but `<img>` fails silently. Awaiting non-paywalled source.

**WHO_WFL_* full resolution:** Currently 5cm-interval nodes. Replace with 0.5cm-step tables for production Wt-for-Length accuracy.

**GrowthCalc — Russell-Silver:** No validated LMS data exists. Amber stub warning shown in UI.

-----

## User Background

Troy is a Board Certified Clinical Informaticist and executive physician (pediatrics) based in Los Angeles. PediCalc development philosophy: clinical pearls and curated decision support at point of care, not a LexiComp replacement. Infrastructure Troy owns (no third-party tokens, no freemium models). Primary test device: iPhone Safari. No browser DevTools in that environment — all debugging via screenshot and device testing.

**Development discipline:** Diagnosis before implementation. Read code before writing. Confirm before expanding. Never assume the problem matches the prior hypothesis when new evidence arrives. No version bumps unless Troy requests.

-----

## PediCalc Emoji Glossaries

**A:** ✍🏼Orders 👂🏼ENT 🦻🏼Audiology 👁️Ophthalmology 👓Optometry 🫀Cardiology 🫁Pulmonology 🧠Neurology 🗣️SLP 🦷Dentistry 💊Pharmacy 🤱🏻Lactation 🍼Formula 🚑ED 🦼PT ⚙️Settings 🔬Lab 🩻Radiology 💉Immunization 🩸Hematology 🧬Genetics 🦠Virology 🧫Microbiology 🛏️Bed 🗓️Schedule 🔍Search ✏️Edit 🔒Lock 🔓Unlock

**B:** ☣️Radiation 🛑Stop ⚠️Caution/Alert ♻️Update ✅Confirm ❌Delete 📊Analytics/Risk 🧑‍🧑‍🧒‍🧒Family 🚻Sex 📬Outbox ✉️Message 📨Inbox 🏷️Tag 📎Attachment ⚧️Gender ℹ️Information ⬅️Back ➡️Forward 🕒Time 🇺🇸English 🇲🇽Spanish ☠️Poison/Toxicology 🦿Prosthetics 👶🏼Baby/Infant/Neonatology 🍎Education

-----

## Reduction Linocut Principles (for linocut tool sessions)

**P1 — Plate Selection:** Reduction for large contiguous zones with complex organic edges. Separate plate for isolated color islands needing defensive carving (yellow = canonical example). Key plate opacity for shadows instead of dedicated shadow plate. Drum transfer for hybrid multi-block with reduction-quality registration.
**P2:** Ink color perception = inherent color × opacity × layer sequence.
**P3:** Prefer single spot color without layering where feasible.
**P4:** Split fountain populates distinct zones from one plate.
**P5:** Colors covering >25% of image surface get spot color priority.
**P6:** Within spot-color-priority regions, flatten intra-region variation. Dominant perceptual hue wins.
**P7 — Edge fidelity:** Fine detail must be preserved and never treated as artifact.

-----

**Last Updated:** May 2026 (v23 — Fenton 2025 official data substituted; all specialty curves validated; six new calculators added; GrowthCalc layout, color semantics, inline stats, keyboard focus bug fixed; CLAUDE.md comprehensively updated)