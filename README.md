# SEP Modern

A better reading experience for the [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu).

## What it does

- Reading progress bar and section progress indicator
- Floating search bar that appears when you scroll up
- TOC scroll spy with keyboard navigation (j/k/h/l)
- Collapsible TOC sidebar (desktop) and drawer (mobile)
- Footnote and citation hover previews
- Section anchor links
- Reading time estimate
- Proper mobile layout that matches Wikipedia-style padding and typography

## Installation

You need two browser extensions: **Stylus** for the CSS and **Tampermonkey** for the JS.

### 1. Install the extensions

| Browser | Stylus | Tampermonkey |
|---------|--------|--------------|
| Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne) | [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/styl-us/) | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Safari | — | [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089) |

### 2. Install the CSS (Stylus)

1. Open the Stylus extension popup and click **Write new style**
2. Paste the contents of `sep.css` into the editor
3. Save

### 3. Install the JS (Tampermonkey)

1. Open the Tampermonkey dashboard and click **Create a new script**
2. Delete the placeholder content and paste in `sep_modern_companion.js`
3. Save (Ctrl+S / Cmd+S)

### Mobile (Android Chrome)

Both Stylus and Tampermonkey are available for **Kiwi Browser**, which supports Chrome extensions on Android. Install Kiwi from the Play Store, then install both extensions from the Chrome Web Store inside Kiwi.

## Changelog

### 1.1.29
- **Fix:** Back-to-top button was permanently hidden — `.visible` CSS rule had `display: none` instead of `display: flex`
- **Fix:** Reader bar (mobile) stayed hidden after dismissing the TOC — `closeMobileToc` now restores the bar if it was visible when the TOC was opened
- **Fix:** Citation linker now indexes co-authors — "Clark, A. and Chalmers, D., 1998" now produces keys for both "Clark" and "Chalmers", so in-text citations of either author link correctly
- **Fix:** Ambiguous year-suffix fallback — when both "Clark 2008a" and "Clark 2008b" exist, a bare "Clark 2008" citation previously always resolved to whichever entry appeared first in the bibliography; it now correctly goes unlinked rather than showing the wrong entry
- **Fix:** `enterMobileMode` could be skipped at exactly 768px — the `MediaQueryList` change handler had a redundant `isMobileViewport()` double-check that could disagree with the MQL result at the resize boundary

## Files

| File | Purpose |
|------|---------|
| `sep.css` | Stylus userscript — dark mode, desktop TOC sidebar, base styles |
| `sep_modern_companion.js` | Tampermonkey userscript — all interactive features and mobile layout fixes |
| `documentation/` | Notes on tricky implementation details |
