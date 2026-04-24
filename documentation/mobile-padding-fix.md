# Mobile Padding Fix — Root Cause and Solution

## The Problem

On mobile, SEP articles displayed large left/right padding around the text. Adding CSS rules to remove it (via Stylus or an injected `<style>` tag) appeared to work briefly, then the padding came back roughly half a second after page load.

## Why CSS Alone Doesn't Work

There are two layered reasons:

### 1. No viewport meta tag — Stylus media queries never fire

SEP has no `<meta name="viewport">` tag. Without it, mobile Chrome renders the page at ~980px logical width. Stylus evaluates its `@media (max-width: 768px)` rules at initial render time, sees 980px, and skips them entirely. Our viewport meta tag is injected by `sep_modern_companion.js` at `document-end`, but by then Stylus has already decided which rules apply — too late.

**Fix:** All critical mobile CSS must live inside the JS companion's own injected `<style>` tag, which is evaluated after the viewport tag is added.

### 2. SEP's own JS overwrites inline styles after load

SEP ships a `pageScript.bundle.js` that runs after Tampermonkey and sets inline `style` attributes directly on elements like `#aueditable`, `#preamble`, `#container`, etc. Inline styles have higher specificity than any stylesheet rule, including ones with `!important`. This is why the padding looked correct for ~0.5 seconds (our CSS applied first) and then disappeared (SEP's JS ran and overwrote it).

## How It Was Fixed

### Step 1 — Move mobile CSS into the JS companion

Instead of relying on Stylus `@media` rules (which never fire on Android), a `<style>` tag is injected by `sep_modern_companion.js` with a mobile media query block that zeroes out padding/margin on all containers and applies `1em` reading padding to `#aueditable`:

```css
@media (max-width: 768px), (max-width: 1024px) and (hover: none) {
    body, #container, #content, #article,
    #aueditable, #article-content,
    #preamble, #article-header, #article-banner {
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        box-sizing: border-box !important;
    }
    #aueditable, #article-content {
        padding: 0 1em !important;
    }
}
```

This fires correctly because the viewport tag has already been added by the time the `<style>` tag is evaluated.

### Step 2 — MutationObserver to counter SEP's JS overrides

Because SEP's JS sets inline `style` attributes after our script runs, a `MutationObserver` watches those elements for any `style` attribute mutation and immediately re-enforces our values using `element.style.setProperty(prop, value, 'important')` — the only way to beat inline styles.

To avoid an infinite loop (observer fires → we set style → observer fires again), the observer is disconnected before applying styles and reconnected on the next animation frame:

```js
const enforceLayout = () => {
    if (padObserver) padObserver.disconnect();
    // apply styles via setProperty(..., 'important')
    requestAnimationFrame(() => {
        padObserver = new MutationObserver(enforceLayout);
        for (const el of mobileContainers) {
            padObserver.observe(el, { attributes: true, attributeFilter: ['style'] });
        }
    });
};
enforceLayout();
```

## Scoping Bug That Broke the MutationObserver

After the MutationObserver was added, it silently never ran. The reason: `mobileQuery` was declared with `const` inside an `if (toc)` block in section 10. `const` is block-scoped, so `mobileQuery` was not accessible in section 11 where the MutationObserver check `if (mobileQuery.matches)` lived. This threw a `ReferenceError` at that line, halting execution of sections 11 and 12 entirely. The MutationObserver never got set up, so SEP's JS won every time.

This is the same class of bug as `mobileTocOpen` (also initially declared inside `if (toc)` and inaccessible in the floating search scroll callback).

**Fix:** Hoist `mobileQuery` to the IIFE scope, before the `if (toc)` block — same as `mobileTocOpen`.

```js
// CORRECT — both hoisted to IIFE scope
let mobileTocOpen = false;
const mobileQuery = window.matchMedia('(max-width: 768px), (max-width: 1024px) and (hover: none)');
const toc = document.getElementById('toc');
if (toc) {
    // mobileQuery and mobileTocOpen accessible here via closure
}
// also accessible in sections 11, 12, etc.
```

## Key Takeaway

Any mobile CSS that needs to survive on SEP must either:
- Live in the JS companion's injected `<style>` tag (handles the viewport timing issue), **and**
- Be re-enforced via `element.style.setProperty(..., 'important')` inside a `MutationObserver` (handles SEP's JS overwriting inline styles)

Stylesheet rules with `!important`, no matter where they come from, lose to inline styles set by JS.

Variables used across sections of the IIFE must be declared at the IIFE scope — `const`/`let` inside `if` blocks are not accessible outside those blocks.
