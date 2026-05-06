# PediCalc PWA — CLAUDE.md
## Current version: v11
**Deployed:** `trillnjoy.github.io/pedicalc-pwa/`
**Working file:** `PediatricCalc.jsx` (single-file React, runtime Babel)
**SW cache:** `pedicalc-v11`

---

## SESSION START PROTOCOL — MANDATORY

Before any patch, run this guard:

```python
import hashlib
up  = hashlib.md5(open('/mnt/user-data/uploads/PediatricCalc.jsx','rb').read()).hexdigest()
try:
    out = hashlib.md5(open('/mnt/user-data/outputs/PediatricCalc.jsx','rb').read()).hexdigest()
except FileNotFoundError:
    out = None

print(f"Upload: {up}")
print(f"Output: {out or 'NOT PRESENT'}")
print(f"Match:  {up == out}")
```

**Rules:**
- If output is NOT PRESENT → copy upload to output first, then patch output only
- If Match = True → patch either, but write to output
- If Match = False → **always patch output, never open upload for writing**
- After every patch, verify the previous session's key changes are still present in output
- Never grep upload for line numbers then write to output — read and write the same file

---

## Burn Fluid Resuscitation — SVG Status

### BURN_SVG variants

| Variant | Side  | vw    | vh    | Zones | Status |
|---------|-------|-------|-------|-------|--------|
| baby    | front | 100.0 | 196.45 | 16   | Validated — component trace, dilate_px=3 |
| baby    | back  | 100.0 | 203.88 | 17   | Validated — component trace, dilate_px=3 |
| adult   | front | 100.0 | 194.0 | 16    | Validated + laterality confirmed correct |
| adult   | back  | 100.0 | 183.6 | 17    | Validated + laterality confirmed correct |
| child   | front | 100.0 | 218.2 | 16    | Validated + laterality confirmed correct |
| child   | back  | 100.0 | 219.7 | 17    | Validated + laterality confirmed correct |

### Baby SVG methodology (validated, do not alter)
Direct connected-component extraction from line art at full resolution.
- Black outline threshold: (0,0,0)–(80,80,80)
- Background threshold: (235,235,235)–(255,255,255)
- Interior = NOT(black) AND NOT(background)
- connectedComponentsWithStats → component mask → dilate_px=3 (half stroke width ~6px) → approxPolyDP eps=0.6 → Laplacian smooth 1 pass
- No parametric warping from adult or child — this has failed repeatedly

### Front component map (BurnBabyF_1052.png, 535×1051)
```
head=2, neck=12, trunkAnt=14, genitalia=115
upArmR=25, upArmL=26, forearmR=44, forearmL=46
handR=88, handL=90
thighR=96, thighL=97, legR=147, legL=148, footR=174, footL=175
```

### Back component map (BurnBabyB_1052.png, 516×1052)
```
head=2, neck=70, trunkPost=85
upArmL=102, upArmR=107, forearmL=164, forearmR=165
handL=288, handR=285
buttockL=314, buttockR=312
thighL=410, thighR=451, legL=550, legR=552, footL=624, footR=626
```

### Laterality rules (CRITICAL — do not violate)
**Front view** (patient facing viewer):
- Screen LEFT = patient RIGHT → key name ends in R
- Screen RIGHT = patient LEFT → key name ends in L

**Back view** (patient facing away):
- Screen LEFT = patient LEFT → key name ends in L
- Screen RIGHT = patient RIGHT → key name ends in R

### Zone names
**Front:** head, neck, trunkAnt, genitalia, upArmR, upArmL, forearmR, forearmL, handR, handL, thighR, thighL, legR, legL, footR, footL (16)
**Back:** head, neck, trunkPost, buttockR, buttockL, upArmR, upArmL, forearmR, forearmL, handR, handL, thighR, thighL, legR, legL, footR, footL (17)

### ZONE_LABELS (in BurnsCalc component)
```js
const ZONE_LABELS = {
  head:"Head", neck:"Neck", trunkAnt:"Trunk Ant.", trunkPost:"Trunk Post.",
  genitalia:"Genitalia", upArmL:"Arm L", upArmR:"Arm R",
  forearmL:"Forearm L", forearmR:"Forearm R", handL:"Hand L", handR:"Hand R",
  buttockL:"Buttock L", buttockR:"Buttock R",
  thighL:"Thigh L", thighR:"Thigh R", legL:"Leg L", legR:"Leg R",
  footL:"Foot L", footR:"Foot R",
};
```

### BURN_ZONE_COLORS (in BurnsCalc component)
```js
const BURN_ZONE_COLORS = {
  head:"#f5d485", thighR:"#a8c8e8", thighL:"#a8c8e8",
  legR:"#a8d4a8", legL:"#a8d4a8", _default:"#e8eaed",
};
```

---

## BurnsCalc state and calculation

AGE_BANDS:
  0-1y → baby/lbIdx0, 1-4y → child/lbIdx1, 5-9y → child/lbIdx2,
  10-14y → child/lbIdx3, 15-18y → adult/lbIdx4, Adult → adult/lbIdx5

LB variable zones:
  head:   [9.5, 8.5, 6.5, 5.5, 4.5, 3.5]
  thighR/L each: [2.75, 3.25, 4.0, 4.25, 4.5, 4.75]
  legR/L each:   [2.5, 2.5, 2.75, 3.0, 3.25, 3.5]

Fixed zones: trunkAnt=13%, trunkPost=13%, genitalia=1%, each buttock=2.5%,
  each upArm=2%, each forearm=1.5%, each hand=1.5%

Parkland: 4 × kg × TBSA% = 24h; 1st 8h = half; next 16h = half
Galveston: 5000×m²_burned + 2000×m²_total (requires height)

### setBurnSide — partial+full clamping
```js
const setBurnSide = (side, zone, depth, val) => {
  const setter = side === "front" ? setBurnsFront : setBurnsBack;
  const otherDepth = depth === "partial" ? "full" : "partial";
  setter(b => {
    const other = b[zone]?.[otherDepth] ?? 0;
    const clamped = Math.min(100 - other, Math.max(0, val));
    return { ...b, [zone]: { ...b[zone], [depth]: clamped } };
  });
};
```

### ZonePopover — draft input pattern (prevents focus ejection)
Input holds local draft string while typing; commits to state on blur only.
Fraction buttons clear draft and call setBurnSide directly.

---

## U25 eGFR — equations (v11)

Height input is in cm; all equations require metres. Always use `hM = height / 100`.

### Eq 1 — Bedside Schwartz 2009 (SCr only, no BUN)
```js
const egfr_scr_eq1 = (0.413 * height / creatinine).toFixed(1); // height in cm
```

### Eq 2 — Modified Schwartz 2009 (SCr + BUN)
```js
const egfr_scr_eq2 = (40.7 * Math.pow(hM / creatinine, 0.640) * Math.pow(30 / bun, 0.25)).toFixed(1);
```
Toggle via `useBUN` checkbox. Preferred by nephrology when BUN available.
Active equation drives the SCr row and the Combined mean.

### CysC — Filler & Lepage 2003
```js
const egfr_cys = (70.69 * Math.pow(cystatin, -0.931)).toFixed(1);
```

### Combined U25 (CKiD) — arithmetic mean of active SCr + CysC
```js
const egfr_combined = ((parseFloat(egfr_scr) + parseFloat(egfr_cys)) / 2).toFixed(1);
```

### CKiD 2012 Full Combined (Schwartz) — separate result card
```js
const sexFactor2012 = sex === "male" ? 1.076 : 1.0;
const egfr_ckid2012 = (39.8
  * Math.pow(hM / creatinine, 0.456)
  * Math.pow(1.8 / cystatin, 0.418)
  * Math.pow(30 / bun, 0.079)
  * Math.pow(hM / 1.4, 0.179)
  * sexFactor2012
).toFixed(1);
```
Requires all four inputs: height, SCr, CysC, BUN. Shown in separate bordered card below main ResultBadge.
`getStage` called after its definition — do not move above line ~1912.

### Input layout
- Row 1: Age (flex:3) | Height (flex:3) | Sex toggle —/M/F (flex:2), null default
- Row 2: BUN | SCr | Cystatin C (equal flex:1 each)
- Checkbox: "Include BUN in SCr equation (Schwartz Eq 2)"

---

## Hyponatremia Correction (SodiumCalc) — v11
- Input row: Curr Na (flex:4) | Target Na (flex:4) | Pt Wt (flex:2) — inline inputs, not NumberInput
- Formula shown: `Na deficit = 0.6 × weight(kg) × (Target Na − Current Na)`
- ⚠️ on Max per 24hr result row; ⛔️ on 3% NaCl result row
- ⚠ CPM warning + ⛔ 3% NaCl contraindication warning in results card

## Dehydration Score — v11
All 8 rows use shortened labels to fit 3 options on one row:
- General Appearance: Normal | Irritable | Lethargic
- Eyes: Normal | Sl Sunken | V Sunken
- Skin Turgor: Normal | Diminished | Tenting
- Respiration: Normal | Deep/Rapid | V Deep/Irreg
- Pulse: Normal | Rapid | V Rapid/Weak

---

## Deployment
Push to trillnjoy/pedicalc-pwa:
1. PediatricCalc.jsx
2. sw.js (cache: pedicalc-v11)
3. CLAUDE.md
4. index.html (unchanged)
5. manifest.json, icons (unchanged)
