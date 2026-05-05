# PediCalc PWA — CLAUDE.md
## Current version: v9
**Deployed:** `trillnjoy.github.io/pedicalc-pwa/`
**Working file:** `PediatricCalc.jsx` (single-file React, runtime Babel)
**SW cache:** `pedicalc-v9`

---

## Burn Fluid Resuscitation — SVG Status

### BURN_SVG variants

| Variant | Side  | vw    | vh    | Zones | Status |
|---------|-------|-------|-------|-------|--------|
| baby    | front | 100.0 | 167.4 | 16    | NOT validated — next session priority |
| baby    | back  | 100.0 | 168.8 | 17    | NOT validated — next session priority |
| adult   | front | 100.0 | 194.0 | 16    | Validated + laterality confirmed correct |
| adult   | back  | 100.0 | 183.6 | 17    | Validated + laterality confirmed correct |
| child   | front | 100.0 | 218.2 | 16    | Validated + laterality confirmed correct |
| child   | back  | 100.0 | 219.7 | 17    | Validated + laterality confirmed correct |

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

### Laterality fix history (for context)
- Adult front: all zones correct from source trace
- Adult back: all zones correct from source trace
- Child front: zones sourced from child_proof.html SVG[0]; key names renamed so
  screen-left shapes carry R suffix (upArmR↔upArmL, forearmR↔forearmL, handR↔handL,
  thighR↔thighL, legR↔legL, footR↔footL)
- Child back: sourced from child_proof.html SVG[1]; buttockR↔buttockL and
  thighR↔thighL key names renamed

---

## Baby SVG — PENDING (next session #1 priority)

### Source images
- Front (JPEG, 535×1056): `/mnt/user-data/uploads/8A49B644-E1CA-4B6A-8638-DC98D4121940.jpeg`
  Clean separated front figure with genitalia. Solid closed outlines. Pre-colored fills.
- Back: right-half crop of `/mnt/user-data/uploads/8A49B644-E1CA-4B6A-8638-DC98D4121940.png`
  Combined image (front left, back right). Buttock zones clearly labeled.

### Agreed methodology
Direct contour trace — NO parametric warping.
Mid-stroke dilation: fill contour mask → dilate outward by dilate_px=5 → trace outer boundary.
This produces shared-wall fills with no gaps.

```python
def make_path(c, w, h, vw, vh, dilate=5, eps=0.8, smooth=3):
    mask = np.zeros((h,w), dtype=np.uint8)
    cv2.drawContours(mask, [c], 0, 255, -1)
    k = np.ones((dilate*2+1, dilate*2+1), np.uint8)
    dilated = cv2.dilate(mask, k)
    conts, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)
    best = max(conts, key=cv2.contourArea)
    approx = cv2.approxPolyDP(best, eps, True).reshape(-1, 2)
    pts = [(p[0]/w*vw, p[1]/h*vh) for p in approx]
    # Laplacian smooth x smooth iters
    return "M x,y L x,y ... Z"
```

### Front contour map (535×1056 JPEG, verified):
```
[2]=head  [15]=neck  [1]=trunk  [16]=genitalia
[7]=upArmL [8]=forearmL [13]=handL
[9]=upArmR [10]=forearmR [14]=handR
[3]=thighL [4]=thighR
[5]=legL   [6]=legR
[11]=footL [12]=footR
```

### Back contour map (right-half crop of PNG):
Needs fresh audit at session start. Key zones: head, neck, trunk (clip y=26.5–53.5%),
buttockR, buttockL (labeled in image), thighR, thighL, legR, legL, footR, footL,
upArmR, upArmL, forearmR, forearmL, handR, handL.

### Validation workflow
1. Audit contours fresh
2. Trace → render PNG → Claude Vision check
3. Fix disconnects/gaps
4. Render side-by-side proof HTML
5. Human validation before embedding
6. After approval: replace baby block in BURN_SVG, bump to v10

### CRITICAL: key naming after embedding
Apply same laterality rules as above.
Run audit script before declaring done:
- Front: R keys must have cx < 50, L keys must have cx > 50
- Back: R keys must have cx > 50, L keys must have cx < 50

---

## Adult SVG methodology (validated, do not alter)

Adult front: direct trace from burn_adult_f_648.png
  head=4, neck=15, trunkAnt=1, genitalia=16, thighR=3, thighL=2,
  legR=5, legL=6, footR=11, footL=12,
  upArmR=7, forearmR=8, handR=14, upArmL=10, forearmL=9, handL=13

Adult back: direct trace from burn_adult_b_648.png
  idx2 split at 55% for buttocks/thighs using quad_bezier_pts() U-fold
  Plain to_path() for legs/feet

Child: parametric warp from adult + key renaming for laterality
  Source of truth: child_proof.html (uploaded to Claude artifacts this session)

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

---

## Deployment
Push to trillnjoy/pedicalc-pwa:
1. PediatricCalc.jsx
2. sw.js (cache: pedicalc-v9)
3. index.html (unchanged)
4. manifest.json, icons (unchanged)
