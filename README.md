# PediCalc EMR - Pediatric Clinical Decision Support

A Progressive Web App providing 27 evidence-based pediatric clinical calculators for point-of-care decision support.

## Features

- **27 Clinical Calculators** spanning neonatal, neurologic, withdrawal, toxicology, hepatic, respiratory, fluid, dosing, renal, sepsis, cardiac, and risk assessment categories
- **Evidence-Based References** - Each calculator includes primary literature citations and current clinical guidelines
- **Visual Nomograms** - Rumack-Matthew acetaminophen toxicity and Bhutani hyperbilirubinemia nomograms with patient plotting
- **Offline Capable** - Full PWA functionality with service worker caching
- **Mobile Optimized** - iOS-style interface with touch-friendly controls
- **Medical Records Theme** - Clean EHR-grade interface with IBM Plex fonts

## Installation

### GitHub Pages Deployment

1. Copy all files to your GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to main branch / root
4. Access at `https://[username].github.io/[repo-name]/`

### Required Files

- `index.html` - Main HTML entry point
- `PediatricCalc.jsx` - React component (keep intact for iOS development)
- `manifest.json` - PWA manifest
- `sw.js` - Service worker for offline functionality
- `icon-192.png` - App icon 192x192 (you need to create this)
- `icon-512.png` - App icon 512x512 (you need to create this)

## Icons

You need to create two PNG icons:

**icon-192.png** (192×192 pixels)
- Use medical caduceus or stethoscope symbol
- Navy background (#1a2332)
- Sky blue accent (#0066cc)

**icon-512.png** (512×512 pixels)
- Same design, higher resolution
- Required for app installation

Quick icon generation options:
- Use Figma/Canva with medical icons
- Use https://realfavicongenerator.net/
- Or generate with any design tool

## Usage

### As PWA
1. Open in mobile browser (Safari/Chrome)
2. Tap "Add to Home Screen"
3. Opens in standalone app mode

### Development
- Edit `PediatricCalc.jsx` for calculator logic
- Deploy entire folder to GitHub Pages
- Changes propagate on next load

## Calculators Included

**Neonatal (4)**
- APGAR Score
- Neonatal Hypoglycemia 
- Prematurity Risk Assessment
- Neonatal Hyperbilirubinemia (Bhutani)

**Neurologic (3)**
- Pediatric Glasgow Coma Scale
- PECARN Head CT Rule
- CATCH Head CT Rule

**Withdrawal (3)**
- COWS (Clinical Opiate Withdrawal Scale)
- Modified Finnegan NAS
- WAT-1

**Toxicology (1)**
- Acetaminophen Toxicity (Rumack-Matthew)

**Respiratory (2)**
- Bronchiolitis Severity
- PRAM Asthma Score

**Fluids/Nutrition (2)**
- Holliday-Segar Maintenance Fluids
- Parkland Burns Resuscitation

**Dosing/Weight (1)**
- Common Pediatric Drug Dosing

**Renal (2)**
- U25 eGFR (Cystatin-C & SCr)
- Hyponatremia Correction

**Sepsis/Infection (3)**
- Pediatric SIRS/Sepsis
- Clinical Dehydration (WHO/Gorelick)
- Kawasaki Disease Criteria

**Cardiac (2)**
- Wells DVT Score
- Corrected QT (Bazett)

**Risk Scores (3)**
- Pediatric Readmission Risk
- PEWS (Early Warning Score)
- FLACC Pain Scale
- NAT Fracture Risk Indicators

## Safety Features

- ✅ No trailing zeros on numerical outputs (prevents 1.0/10 confusion)
- ✅ Auto-select on focus for easy value replacement
- ✅ Reference citations for every calculator
- ✅ Age-adjusted thresholds and parameters

## Technical Stack

- React 18 (via ESM CDN)
- Vanilla JavaScript (no build step required)
- Service Worker for offline capability
- IBM Plex Sans + IBM Plex Mono fonts

## License

For clinical decision support only. Always verify with clinical judgment and current guidelines. Not a substitute for professional medical advice.

## Credits

Created by Troy Lawrence McGuire, MD
Pediatrician | Educator | Developer
