# CLAUDE.md — PediCalc PWA Handoff Document
_Last updated: May 2026 · v13_

## Project Identity
- **Deployed:** `trillnjoy.github.io/pedicalc-pwa/`
- **Working file:** `PediatricCalc.jsx` (single-file React, runtime Babel, no build step)
- **SW cache name:** `pedicalc-v13` (bump in `sw.js` on every deploy)
- **Repo:** `trillnjoy/pedicalc-pwa`

---

## Session Start Protocol — MANDATORY

```python
import hashlib
up  = hashlib.md5(open('/mnt/user-data/uploads/PediatricCalc.jsx','rb').read()).hexdigest()
try:
    out = hashlib.md5(open('/mnt/user-data/outputs/PediatricCalc.jsx','rb').read()).hexdigest()
except FileNotFoundError:
    out = None
print(f"Upload: {up}\nOutput: {out or 'NOT PRESENT'}\nMatch: {up==out}")
```

**Rules:** Always patch the output file. Never treat the upload as writable. If hashes mismatch, patch output only.

---

## Architecture

- React with runtime Babel — **no JSX inside template literals containing regex** (causes Babel "Unexpected EOF"). Always pre-compute complex path strings as JS variables before JSX.
- Single-file: all components, styles, data tables, and the app shell live in `PediatricCalc.jsx`.
- PWA: `sw.js` (cache name must match footer version string), `manifest.json`, `index.html`, icons unchanged unless explicitly modified.
- Deployed to GitHub Pages via `trillnjoy/pedicalc-pwa` repo root.

---

## Design System

```js
COLORS = { navy, skyBlue, bg, surface, card, border, textMuted, success, warning, orange, danger }
// Fonts: Sora (headings/status), IBM Plex Sans (labels), IBM Plex Mono / DM Mono (values/data)
// iOS aesthetic, light mode, sky blue accents
```

---

## Calculator Registry — ordered to match filter tabs, alpha within group

| Group | Calculators |
|---|---|
| Neonatal | APGAR Score, Modified Finnegan NAS, Neonatal Hyperbilirubinemia, Neonatal Hypoglycemia, Prematurity Risk Assessment |
| FEN | Burn Fluid Resuscitation, Dehydration Score, Hyponatremia Correction, Maintenance Fluids, U25 eGFR |
| Neurologic | COWS Score, FLACC Pain Scale, PECARN Head CT, Pediatric Glasgow Coma Scale, WAT-1 |
| Respiratory | Asthma Severity (PRAM), Bronchiolitis Severity |
| Cardiac | Corrected QT (Bazett), Kawasaki Disease Criteria, Wells DVT Score |
| Toxicology | Acetaminophen Toxicity |
| Common Rx | Common Drug Doses |
| Risk Scores | NAT Fracture Risk, PEWS, Pediatric Readmission Risk, Pediatric SIRS/Sepsis |

---

## Neonatal Hyperbilirubinemia — v13 Major Rewrite

Full AAP 2022 guideline (Kemper et al, Pediatrics 150:3). Valid through August 2027.

### Threshold Engine
- Four lookup tables: `PT_NR`, `PT_WR`, `ET_NR`, `ET_WR` (GA → day → 24-hr array)
- Exact published values from Supplemental Tables 1–4
- `effectiveRisk = hasRisk || ga < 38` — GA <38 auto-activates risk-adjusted thresholds
- Escalation threshold = ET − 2.0 mg/dL (pre-computed as JS variable `escFillPath` before JSX)
- B/A ratio thresholds: ≥38w no-risk 8.0, ≥38w risk 7.2, 35–37w no-risk 7.2, 35–37w risk 6.8

### UI Layout
1. Input row: TSB (flex:5) | Albumin (flex:4) | Age (flex:3) | GA selector 35–≥40 (flex:3)
2. Neurotoxicity risk toggle (None/Present) + factor list always visible; GA <38 not listed (handled structurally)
3. Threshold summary tiles: Phototherapy | Escalation | Exchange
4. Primary results card (neutral border until TSB>0, then status color):
   - Interpretive text first (status headline + action bullets)
   - Graph: `width="100%" viewBox="0 0 340 250"` PAD={t:8,r:4,b:22,l:34}
   - Escalation zone: pale pink fill between esc (dashed) and ET (solid) curves
5. Bhutani — collapsible, predischarge follow-up only, not a treatment guide
6. Info panel: AAP 2022 citation, Aug 2027 validity, race not a risk modifier

---

## Known Fragilities

1. **Babel regex in template literals** — pre-compute as JS variable before JSX
2. **Literal `\n` in single-quoted strings** — use ` · ` or template literals
3. **CALCULATORS array `];`** — verify closing bracket survives line-number splices
4. **SW cache name** — must match footer version string in both files

---

## Deployment Checklist

1. Bump SW cache name in `sw.js` (`pedicalc-v13`)
2. Verify footer version string matches
3. Push: `PediatricCalc.jsx` + `sw.js` + `CLAUDE.md`

---

## Next Session Recommendations (priority order)

1. **Drug dose data** — ~89/100 drugs lack dosing; populate most-used (amoxicillin-clavulanate, cetirizine, clonidine, methadone, methylphenidate, prednisolone, etc.)
2. **Common Rx UX** — daily max cap for ibuprofen; flat 8mg cap for ondansetron; notes field per drug
3. **Sepsis** — review SIRS thresholds against current Phoenix/Sepsis-3 criteria
4. **U25 eGFR** — add CKD stage label to result card
