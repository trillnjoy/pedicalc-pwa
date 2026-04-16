# Deployment Guide - PediCalc PWA

## Quick Start - GitHub Pages

### Step 1: Create Repository
```bash
# Create new repo on GitHub: pedicalc-pwa
# Clone locally
git clone https://github.com/[YOUR-USERNAME]/pedicalc-pwa.git
cd pedicalc-pwa
```

### Step 2: Copy Files
Copy these files to your repository:
- ✅ `PediatricCalc.jsx` (main React component - KEEP INTACT)
- ✅ `index.html` (PWA entry point)
- ✅ `manifest.json` (PWA manifest)
- ✅ `sw.js` (service worker)
- ✅ `README.md` (documentation)
- ✅ `.gitignore` (git configuration)
- ⚠️ `icon-192.png` (YOU NEED TO CREATE THIS)
- ⚠️ `icon-512.png` (YOU NEED TO CREATE THIS)

### Step 3: Create Icons

**Option A: Quick placeholder icons**
```bash
# Create simple solid color placeholders (temporary)
convert -size 192x192 xc:"#1a2332" -fill "#0066cc" \
  -draw "circle 96,96 96,160" icon-192.png

convert -size 512x512 xc:"#1a2332" -fill "#0066cc" \
  -draw "circle 256,256 256,410" icon-512.png
```

**Option B: Professional icons (recommended)**
1. Use Figma/Canva with medical caduceus/stethoscope
2. Background: Navy #1a2332
3. Icon: Sky blue #0066cc
4. Export as PNG at exact dimensions
5. Or use: https://realfavicongenerator.net/

### Step 4: Deploy to GitHub
```bash
git add .
git commit -m "Initial deployment of PediCalc PWA"
git push origin main
```

### Step 5: Enable GitHub Pages
1. Go to repository Settings
2. Navigate to Pages section
3. Source: Deploy from a branch
4. Branch: `main` / `root`
5. Click Save
6. Wait 2-3 minutes for deployment

### Step 6: Access Your PWA
```
https://[YOUR-USERNAME].github.io/pedicalc-pwa/
```

## Testing PWA Installation

### iOS (Safari)
1. Open URL in Safari
2. Tap Share button
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"
5. Icon appears on home screen
6. Tap to open in standalone mode

### Android (Chrome)
1. Open URL in Chrome
2. Tap menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Follow prompts
5. Icon appears in app drawer

## Verification Checklist

- [ ] All files uploaded to GitHub
- [ ] Icons created (192px and 512px)
- [ ] GitHub Pages enabled
- [ ] Site loads at GitHub Pages URL
- [ ] Calculators work correctly
- [ ] "Add to Home Screen" prompt appears on mobile
- [ ] PWA installs successfully
- [ ] Offline mode works (airplane mode test)
- [ ] Info modal shows references correctly

## Updating the PWA

### Update Calculator Logic
1. Edit `PediatricCalc.jsx` locally
2. Test changes
3. Commit and push:
```bash
git add PediatricCalc.jsx
git commit -m "Update: [description of changes]"
git push origin main
```
4. Changes live in 1-2 minutes
5. Users need to refresh to see updates

### Versioning Service Worker
When making significant changes, update cache version in `sw.js`:
```javascript
const CACHE_NAME = 'pedicalc-v2'; // Increment version
```

## Custom Domain (Optional)

### Add Custom Domain
1. Purchase domain (e.g., pedicalc.app)
2. In GitHub Pages settings, add custom domain
3. Configure DNS with your registrar:
   ```
   Type: CNAME
   Name: www
   Value: [username].github.io
   ```
4. Enable "Enforce HTTPS" in GitHub settings

## Troubleshooting

**Icons not showing:**
- Verify exact filenames: `icon-192.png` and `icon-512.png`
- Check file sizes: Should be ~5-50KB each
- Clear browser cache and reinstall PWA

**Service worker not registering:**
- Must be served over HTTPS (GitHub Pages does this automatically)
- Check browser console for errors
- Verify `sw.js` path is correct

**Calculators not loading:**
- Check browser console for JavaScript errors
- Verify `PediatricCalc.jsx` uploaded correctly
- Test in private/incognito window

**Changes not appearing:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear service worker cache in browser dev tools
- Update service worker cache version

## iOS Development Path

Keep `PediatricCalc.jsx` intact for:
- React Native conversion
- Native iOS app development
- Future Expo/Capacitor builds

The JSX component is framework-agnostic and ready for:
- React Native
- Ionic Capacitor
- Expo
- NativeScript

## Support

GitHub Issues: Enable in repository settings for bug reports
Updates: Watch repository for new versions
