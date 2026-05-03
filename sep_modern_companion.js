// ==UserScript==
// @name         SEP Modern Companion
// @namespace    http://tampermonkey.net/
// @version      1.1.12
// @description  Modernizes the Stanford Encyclopedia of Philosophy reading experience
// @author       You
// @match        https://plato.stanford.edu/entries/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stanford.edu
// @updateURL    https://raw.githubusercontent.com/112345brian/stanford-encyclopedia-modern/mobile-toc-fixes/sep_modern_companion.js
// @downloadURL  https://raw.githubusercontent.com/112345brian/stanford-encyclopedia-modern/mobile-toc-fixes/sep_modern_companion.js
// @grant        none
// @noframes
// @run-at       document-end
// ==/UserScript==

(() => {

    // Ensure mobile media queries fire correctly — SEP has no viewport meta tag
    if (!document.querySelector('meta[name="viewport"]')) {
        const vp = document.createElement('meta');
        vp.name = 'viewport';
        vp.content = 'width=device-width, initial-scale=1';
        document.head.appendChild(vp);
    }

    // =============================================
    // STYLES
    // =============================================
    const style = document.createElement('style');
    style.textContent = `
        /* Reading progress bar */
        #sep-progress {
            position: fixed; top: 0; left: 0; height: 2px; z-index: 9999;
            background: #7ba4ff; width: 0%; transition: width 0.1s linear;
            pointer-events: none;
        }

        /* Section progress bar */
        #sep-section-progress {
            position: fixed; top: 0; left: 0; height: 2px; z-index: 9998;
            background: #242424; width: 0%;
            transition: width 0.1s linear; pointer-events: none;
        }

        /* Section progress tick — sits above the blue bar */
        #sep-section-tick {
            position: fixed; top: 0; left: 0; width: 8px; height: 2px;
            z-index: 10000; background: #3a3a3a; pointer-events: none;
            transition: left 0.1s linear;
        }

        /* Back to top button */
        #sep-top-btn {
            position: fixed; top: 3.75em; left: 20px; z-index: 9998;
            width: 22px; height: 22px; border-radius: 4px;
            background: #1a1a1a; border: 1px solid #333; color: #888;
            font-size: 11px; cursor: pointer; display: none;
            align-items: center; justify-content: center;
            transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
            font-family: -apple-system, sans-serif; line-height: 1;
            padding: 0;
        }
        #sep-top-btn:hover { background: #252525; color: #7ba4ff; border-color: #7ba4ff; }
        #sep-top-btn.visible { display: flex; }
        #sep-top-btn.reader-hidden { display: none !important; }

        /* Reading time badge */
        #sep-reading-time {
            display: inline-block; font-size: 0.8em; color: #666;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin-top: 0.375em; padding: 0.25em 0.625em; background: #1a1a1a;
            border-radius: 0.25em; border: 1px solid #2a2a2a;
        }

        /* Footnote popup */
        #sep-footnote-popup {
            position: absolute; z-index: 9999; max-width: 26em;
            background: #1a1a1a; border: 1px solid #333; border-radius: 0.5em;
            padding: 0.875em 1em; box-shadow: 0 0.25em 1.25em rgba(0,0,0,0.5);
            font-size: 0.85em; line-height: 1.65; color: #c0c0c0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
        }
        #sep-footnote-popup.visible { opacity: 1; pointer-events: auto; }
        #sep-footnote-popup a { color: #7ba4ff !important; }

        /* Section anchor links (on hover) */
        .sep-anchor-link {
            opacity: 0; margin-left: 0.5em; color: #555 !important;
            text-decoration: none !important; font-size: 0.7em;
            transition: opacity 0.15s ease; cursor: pointer;
            font-weight: 400 !important; vertical-align: middle;
        }
        h2:hover .sep-anchor-link, h3:hover .sep-anchor-link { opacity: 1; }
        .sep-anchor-link:hover { color: #7ba4ff !important; }

        /* Smooth scroll globally */
        html { scroll-behavior: smooth; }

        /* Mobile layout reset + Wikipedia-matched typography */
        @media (max-width: 768px) {
            /* Strip all container padding/margin first */
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
            /* Reading padding + MinervaNeue-matched typography */
            #aueditable,
            #article-content {
                padding: 0 1rem !important;
                font-size: 1rem !important;
                line-height: 1.5 !important;
                letter-spacing: 0 !important;
            }
            #aueditable p,
            #article-content p {
                margin: 0.5rem 0 1rem 0 !important;
            }
            h1, .pagetitle {
                font-size: 1.5rem !important;
                line-height: 1.33 !important;
                margin-bottom: 0.25em !important;
            }
            h2 {
                font-size: 1.25rem !important;
                line-height: 1.35 !important;
                padding: 0.875rem 0 0.375rem !important;
                margin: 0 !important;
            }
            h3 {
                font-size: 1rem !important;
                line-height: 1.5 !important;
                font-weight: bold !important;
                margin: 1rem 0 0.25rem 0 !important;
            }
            /* TOC drawer */
            #toc {
                top: 0 !important;
                bottom: 0 !important;
                left: auto !important;
                right: 0 !important;
                width: min(82vw, 320px) !important;
                max-width: min(82vw, 320px) !important;
                height: 100dvh !important;
                max-height: 100dvh !important;
                padding: 0 0 1.25rem !important;
                border-radius: 16px 0 0 16px !important;
                overflow-y: auto !important;
                overscroll-behavior: contain !important;
                touch-action: pan-y !important;
                -webkit-overflow-scrolling: touch !important;
                transform: translateX(105%) !important;
                transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            #toc.toc-open {
                transform: translateX(0) !important;
            }
            #toc > ul {
                padding: 0.45rem 1rem 5rem !important;
            }
            #toc li {
                padding: 0 !important;
            }
            #toc ul ul {
                margin: 0.38rem 0 !important;
                padding-left: 1.1rem !important;
            }
            #toc a:link,
            #toc a:visited {
                display: block !important;
                box-sizing: border-box !important;
                min-height: 1.8rem !important;
                padding: 0.28rem 0 !important;
            }
            #sep-toc-panel-header {
                position: sticky;
                top: 0;
                z-index: 1;
                display: flex !important;
                align-items: center;
                justify-content: space-between;
                height: 3.25rem;
                padding: 0 0.875rem 0 1rem;
                background: #121212;
                border-bottom: 1px solid #262626;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
            }
            #sep-toc-panel-title {
                color: #d6d6d6;
                font: 600 0.875rem/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                letter-spacing: 0;
            }
            #sep-toc-panel-close {
                width: 2.25rem;
                height: 2.25rem;
                border: 0;
                border-radius: 999px;
                background: transparent;
                color: #aaa;
                font-size: 1.25rem;
                line-height: 1;
                cursor: pointer;
            }
            #sep-toc-panel-close:hover,
            #sep-toc-panel-close:focus-visible {
                color: #d6d6d6;
                background: #242424;
            }
            /* TOC font hierarchy: level 1 > body text, decreasing per level */
            #toc > ul > li > a,
            #toc > ul > li > span {
                font-size: 0.9rem !important;
                font-weight: 500 !important;
                line-height: 1.38 !important;
            }
            #toc > ul > li > ul > li > a {
                font-size: 0.82rem !important;
                font-weight: 400 !important;
                line-height: 1.35 !important;
            }
            #toc > ul > li > ul > li > ul > li > a {
                font-size: 0.78rem !important;
                font-weight: 400 !important;
                line-height: 1.35 !important;
            }
        }

        /* Keyboard nav hint */
        #sep-kb-hint {
            position: fixed; bottom: 1.75em; left: 1.75em; z-index: 9998;
            font-size: 0.7em; color: #444; padding: 0.375em 0.625em;
            background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 0.375em;
            font-family: -apple-system, sans-serif; opacity: 0;
            transition: opacity 0.3s ease; pointer-events: none;
        }
        #sep-kb-hint.visible { opacity: 1; }
        #sep-kb-hint kbd {
            display: inline-block; padding: 0.1em 0.3em; background: #252525;
            border: 1px solid #333; border-radius: 0.2em; font-size: 0.9em;
            font-family: -apple-system, sans-serif; color: #888;
        }

        /* Citation links */
        a.sep-cite-link {
            color: #7ba4ff !important; text-decoration: none !important;
            border-bottom: 1px dotted #555; cursor: pointer;
            transition: border-color 0.15s ease;
        }
        a.sep-cite-link:hover {
            border-bottom-color: #7ba4ff; text-decoration: none !important;
        }

        /* TOC scroll spy */
        #toc a.toc-active {
            color: #8fb1ff !important; font-weight: 500 !important;
            box-shadow: inset 2px 0 #7ba4ff;
            padding-left: 0.6rem !important;
            margin-left: -0.6rem;
        }

        @media (min-width: 769px) {
            #sep-toc-panel-header {
                display: none !important;
            }
        }

        /* Mobile TOC: hamburger button */
        #sep-toc-hamburger {
            position: fixed; bottom: max(1rem, env(safe-area-inset-bottom)); right: 1rem; z-index: 1005;
            min-width: 2.75em; height: 2.5em; border-radius: 8px;
            background: #1a1a1a; border: 1px solid #333; color: #d6d6d6;
            font-size: 0.875em; cursor: pointer;
            display: none; align-items: center; justify-content: center;
            padding: 0 0.95em;
            box-shadow: none;
            transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
        }
        #sep-toc-hamburger:hover { color: #7ba4ff; border-color: #7ba4ff; background: #1e1e1e; }

        /* Mobile TOC: dark backdrop */
        #sep-mobile-backdrop {
            position: fixed; inset: 0; z-index: 1003;
            background: rgba(0,0,0,0.6); opacity: 0; pointer-events: none;
            transition: opacity 0.25s ease;
        }
        #sep-mobile-backdrop.visible { opacity: 1; pointer-events: auto; touch-action: none; }

        @media (max-width: 768px) {
            #sep-toc-hamburger { display: none !important; }
            #sep-toc-toggle { display: none !important; }
            #sep-top-btn { display: none !important; }
            #sep-reading-time { display: none !important; }
            #sep-toc-hamburger.toc-is-open { opacity: 0 !important; pointer-events: none !important; }

            #toc::before { display: none !important; }
        }

        /* Reader app bar (appears on scroll-up) */
        #sep-reader-bar {
            position: fixed; top: 0; left: 0; right: 0; z-index: 1003;
            height: 48px;
            display: flex; align-items: center; gap: 0.75rem;
            box-sizing: border-box;
            padding: 0 1rem;
            background: #121212;
            border-bottom: 1px solid #2a2a2a;
            box-shadow: none;
            transform: translateY(-100%);
            transition: transform 0.16s ease;
            pointer-events: none;
        }
        #sep-reader-bar.visible {
            transform: translateY(0);
            pointer-events: auto;
        }
        #sep-reader-title {
            flex: 1 1 auto;
            min-width: 0;
            color: #e0e0e0;
            font: 600 1rem/1.2 Georgia, "Times New Roman", serif;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        #sep-reader-toc-btn {
            flex: 0 0 auto;
            height: 32px;
            border: 0;
            border-radius: 4px;
            background: transparent;
            color: #9bb8ff;
            font: 600 0.78rem/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0 0.35rem;
            cursor: pointer;
        }
        #sep-reader-toc-btn:hover,
        #sep-reader-toc-btn:focus-visible {
            color: #d6d6d6;
            background: #202020;
            outline: none;
        }
        #sep-floating-search {
            flex: 0 1 18rem;
            min-width: 9rem;
            max-width: 22rem;
            height: 34px;
            box-sizing: border-box;
            display: flex; align-items: center; gap: 0.5em;
            background: #151515;
            border: 1px solid #2f2f2f;
            border-radius: 4px;
            padding: 0 0.65em;
            margin: 0 !important;
        }
        #sep-floating-search:focus-within { outline: none; border-color: #555; }
        #sep-floating-search .sep-fs-icon { color: #555; flex-shrink: 0; display: flex; align-items: center; }
        #sep-floating-search .sep-fs-icon svg { display: block; }
        #sep-floating-search input[type="search"] {
            flex: 1; background: transparent; border: none; outline: none;
            height: 100%; min-height: 0;
            color: #d6d6d6; font-size: 0.9em; line-height: normal;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-appearance: none; align-self: center;
            padding: 0; margin: 0;
        }
        #sep-floating-search input[type="search"]::placeholder { color: #444; }
        #sep-floating-search input[type="search"]:focus::placeholder { color: transparent; }
        #sep-floating-search input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; }
        @media (max-width: 768px) {
            #sep-reader-bar {
                height: 48px;
                padding: 0 max(0.75rem, env(safe-area-inset-right)) 0 max(0.75rem, env(safe-area-inset-left));
                gap: 0.65rem;
            }
            #sep-reader-title {
                font-size: 1rem;
            }
            #sep-floating-search {
                flex: 0 0 2rem;
                width: 2rem;
                min-width: 2rem;
                height: 2rem;
                justify-content: center;
                padding: 0;
                border-color: transparent !important;
                background: transparent !important;
            }
            #sep-floating-search input[type="search"] {
                position: absolute;
                width: 1px;
                height: 1px;
                opacity: 0;
                pointer-events: none;
            }
        }

        /* Citation popup */
        #sep-cite-popup {
            position: absolute; z-index: 9999; max-width: 30em; min-width: 17.5em;
            background: #1a1a1a; border: 1px solid #333; border-radius: 0.5em;
            padding: 0.875em 1em; box-shadow: 0 0.25em 1.25em rgba(0,0,0,0.5);
            font-size: 0.85em; line-height: 1.65; color: #c0c0c0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
        }
        #sep-cite-popup.visible { opacity: 1; pointer-events: auto; }
        #sep-cite-popup a { color: #7ba4ff !important; }
        #sep-cite-popup .sep-cite-label {
            font-size: 0.7em; color: #555; text-transform: uppercase;
            letter-spacing: 0.05em; margin-bottom: 0.375em; font-weight: 600;
        }
    `;
    document.head.appendChild(style);


    // =============================================
    // 1. READING PROGRESS BAR
    // =============================================
    const progressBar = document.createElement('div');
    progressBar.id = 'sep-progress';
    document.body.appendChild(progressBar);

    const sectionProgressBar = document.createElement('div');
    sectionProgressBar.id = 'sep-section-progress';
    document.body.appendChild(sectionProgressBar);

    const sectionTick = document.createElement('div');
    sectionTick.id = 'sep-section-tick';
    document.body.appendChild(sectionTick);


    // =============================================
    // 2. BACK TO TOP BUTTON
    // =============================================
    const topBtn = document.createElement('div');
    topBtn.id = 'sep-top-btn';
    topBtn.innerHTML = '&#8593;';
    topBtn.title = 'Back to top';
    document.body.appendChild(topBtn);

    topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // =============================================
    // 3. SCROLL HANDLER (progress + back-to-top + toc spy)
    // =============================================
    // Additional scroll callbacks registered by later sections
    const scrollCallbacks = [];

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = `${progress}%`;
            topBtn.classList.toggle('visible', scrollTop > 600);
            for (const cb of scrollCallbacks) cb(scrollTop);
            ticking = false;
        });
    });


    // =============================================
    // 4. READING TIME ESTIMATE
    // =============================================
    const article = document.getElementById('aueditable') || document.getElementById('article-content');
    if (article) {
        const text = article.innerText || article.textContent || '';
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / 230);

        const badge = document.createElement('div');
        badge.id = 'sep-reading-time';
        badge.textContent = `${words.toLocaleString()} words · ~${minutes} min read`;

        const h1 = article.querySelector('h1') || document.querySelector('.pagetitle');
        const preamble = document.getElementById('preamble');
        const insertTarget = preamble || h1;
        if (insertTarget?.parentNode) {
            insertTarget.parentNode.insertBefore(badge, insertTarget.nextSibling);
        }
    }


    // =============================================
    // 5. FOOTNOTE HOVER PREVIEWS
    // =============================================
    const footnotePopup = document.createElement('div');
    footnotePopup.id = 'sep-footnote-popup';
    document.body.appendChild(footnotePopup);

    let hideFootnoteTimeout = null;

    document.addEventListener('mouseover', e => {
        const link = e.target.closest('a[href^="#note-"]') || e.target.closest('sup a[href^="#"]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href?.startsWith('#')) return;

        const targetEl = document.getElementById(href.slice(1));
        if (!targetEl) return;

        clearTimeout(hideFootnoteTimeout);

        const content = targetEl.innerHTML;
        if (!content || content.length < 5) return;

        footnotePopup.innerHTML = content;

        const rect = link.getBoundingClientRect();
        const popupWidth = 420;
        let left = rect.left + window.scrollX;
        if (left + popupWidth > window.innerWidth - 20) left = window.innerWidth - popupWidth - 20;
        if (left < 10) left = 10;

        footnotePopup.style.left = `${left}px`;
        footnotePopup.style.top = `${rect.top + window.scrollY - 10}px`;
        footnotePopup.classList.add('visible');

        // Adjust upward after render so it appears above
        requestAnimationFrame(() => {
            const popupHeight = footnotePopup.offsetHeight;
            footnotePopup.style.top = `${rect.top + window.scrollY - popupHeight - 8}px`;
        });
    });

    document.addEventListener('mouseout', e => {
        const link = e.target.closest('a[href^="#note-"]') || e.target.closest('sup a[href^="#"]');
        if (!link) return;
        hideFootnoteTimeout = setTimeout(() => footnotePopup.classList.remove('visible'), 200);
    });

    footnotePopup.addEventListener('mouseover', () => clearTimeout(hideFootnoteTimeout));
    footnotePopup.addEventListener('mouseout', () => {
        hideFootnoteTimeout = setTimeout(() => footnotePopup.classList.remove('visible'), 200);
    });


    // =============================================
    // 6. SECTION ANCHOR LINKS (click to copy)
    // =============================================
    // SEP headings use <h2><a name="..."> rather than <h2 id="...">
    const headings = [...document.querySelectorAll(
        '#aueditable h2, #aueditable h3, #article-content h2, #article-content h3'
    )].filter(h => h.id || h.querySelector('a[name]'));

    for (const h of headings) {
        const hId = h.id || h.querySelector('a[name]')?.name || '';
        const anchor = document.createElement('a');
        anchor.className = 'sep-anchor-link';
        anchor.href = `#${hId}`;
        anchor.textContent = '¶';
        anchor.title = 'Copy link to section';
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const url = `${location.origin}${location.pathname}${e.currentTarget.getAttribute('href')}`;
            navigator.clipboard?.writeText(url);
            const orig = e.currentTarget.textContent;
            e.currentTarget.textContent = '✓';
            e.currentTarget.style.color = '#7ba4ff';
            setTimeout(() => {
                e.currentTarget.textContent = orig;
                e.currentTarget.style.color = '';
            }, 1200);
        });
        h.appendChild(anchor);
    }


    // =============================================
    // 7. CITATION LINKING & POPUPS
    // =============================================

    // Step 1: Index the bibliography entries
    const bibEntries = {};

    let bibSection = null;
    for (const h2 of document.querySelectorAll('h2')) {
        const txt = h2.textContent.trim().toLowerCase();
        if (txt === 'bibliography' || txt === 'references' ||
            txt.startsWith('bibliography') || txt.startsWith('references')) {
            bibSection = h2;
            break;
        }
    }

    const bibEls = [];
    if (bibSection) {
        // Collect all elements between bib heading and next h2
        let nxt = bibSection.nextElementSibling;
        while (nxt && nxt.tagName !== 'H2') {
            if (nxt.tagName === 'UL' || nxt.tagName === 'OL') {
                bibEls.push(...nxt.querySelectorAll('li'));
            } else if (nxt.tagName === 'P' || nxt.tagName === 'LI') {
                bibEls.push(nxt);
            } else if (nxt.tagName === 'DL') {
                bibEls.push(...nxt.querySelectorAll('dd, dt'));
            }
            nxt = nxt.nextElementSibling;
        }

        // Parse each bib entry to extract author-year keys
        for (const el of bibEls) {
            const elText = el.textContent || '';

            // Match patterns like "Clark, A., 2008a" or "van Gelder, T., 1995"
            const bibMatch = elText.match(/^([A-Z\u00C0-\u024F][a-z\u00C0-\u024F''\-]+(?:\s+(?:van|de|von|du|le|la|el|al|del|der|den|dos|das|di)\s+[A-Z][a-z''\-]+)?)[^0-9]*?((?:19|20)\d{2}[a-z]?)/);
            if (!bibMatch) continue;

            const authorLast = bibMatch[1].trim();
            const year = bibMatch[2].trim();
            const key = `${authorLast} ${year}`;
            bibEntries[key] = { element: el, html: el.innerHTML, text: elText.trim() };

            // Also store without the letter suffix for fuzzy matching
            const yearBase = year.replace(/[a-z]$/, '');
            if (yearBase !== year) {
                bibEntries[`${authorLast} ${yearBase}`] ??= bibEntries[key];
            }
        }
    }

    // Step 2: Find and linkify citations in the article body
    const articleBody = document.getElementById('aueditable') || document.getElementById('article-content');
    if (articleBody && Object.keys(bibEntries).length > 0) {

        const escRx = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const uniqueAuthors = [...new Set(Object.keys(bibEntries).map(k => k.split(' ')[0]))];
        const authorPattern = uniqueAuthors.map(escRx).join('|');
        // Match: "Clark (2008a)" or "Clark 2008a" or "Clark, 2008a"
        const citeRegex = new RegExp(`(${authorPattern})\\s*(?:\\(\\s*)?((?:19|20)\\d{2}[a-z]?)(?:\\s*\\))?`, 'g');

        const bibElSet = new Set(bibEls);

        function walkTextNodes(root, callback) {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    const p = node.parentElement;
                    if (!p) return NodeFilter.FILTER_REJECT;
                    // Skip if inside a link, heading, script, style, or the bib section itself
                    if (p.closest('a, h1, h2, h3, h4, h5, h6, script, style, #sep-reading-time')) return NodeFilter.FILTER_REJECT;
                    if (bibSection) {
                        let ancestor = node.parentElement;
                        while (ancestor) {
                            if (bibElSet.has(ancestor)) return NodeFilter.FILTER_REJECT;
                            ancestor = ancestor.parentElement;
                        }
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            const nodes = [];
            while (walker.nextNode()) nodes.push(walker.currentNode);
            // Process in reverse to preserve indices
            for (let i = nodes.length - 1; i >= 0; i--) callback(nodes[i]);
        }

        walkTextNodes(articleBody, textNode => {
            const text = textNode.textContent;
            citeRegex.lastIndex = 0;
            const parts = [];
            let lastIdx = 0;
            let match;

            while ((match = citeRegex.exec(text)) !== null) {
                const key = `${match[1]} ${match[2]}`;
                const entry = bibEntries[key] ?? bibEntries[`${match[1]} ${match[2].replace(/[a-z]$/, '')}`];
                if (!entry) continue;

                if (match.index > lastIdx) {
                    parts.push(document.createTextNode(text.slice(lastIdx, match.index)));
                }

                const link = document.createElement('a');
                link.className = 'sep-cite-link';
                link.textContent = match[0];
                link.href = '#';
                link.setAttribute('data-cite-key', key);
                link.addEventListener('click', e => {
                    e.preventDefault();
                    entry.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Flash highlight
                    entry.element.style.transition = 'background-color 0.3s ease';
                    entry.element.style.backgroundColor = 'rgba(123,164,255,0.15)';
                    entry.element.style.borderRadius = '4px';
                    setTimeout(() => { entry.element.style.backgroundColor = ''; }, 2000);
                });

                parts.push(link);
                lastIdx = match.index + match[0].length;
            }

            if (parts.length > 0) {
                if (lastIdx < text.length) parts.push(document.createTextNode(text.slice(lastIdx)));
                const frag = document.createDocumentFragment();
                for (const part of parts) frag.appendChild(part);
                textNode.parentNode.replaceChild(frag, textNode);
            }
        });
    }

    // Citation popup on hover
    const citePopup = document.createElement('div');
    citePopup.id = 'sep-cite-popup';
    document.body.appendChild(citePopup);

    let hideCiteTimeout = null;

    document.addEventListener('mouseover', e => {
        const link = e.target.closest('a.sep-cite-link');
        if (!link) return;

        const key = link.getAttribute('data-cite-key');
        const entry = bibEntries[key] ?? bibEntries[key?.replace(/[a-z]$/, '')];
        if (!entry) return;

        clearTimeout(hideCiteTimeout);
        citePopup.innerHTML = `<div class="sep-cite-label">Bibliography</div>${entry.html}`;

        const rect = link.getBoundingClientRect();
        const popupWidth = 480;
        let left = rect.left + window.scrollX;
        if (left + popupWidth > window.innerWidth - 20) left = window.innerWidth - popupWidth - 20;
        if (left < 10) left = 10;

        citePopup.style.left = `${left}px`;
        citePopup.style.top = `${rect.top + window.scrollY - 10}px`;
        citePopup.classList.add('visible');

        requestAnimationFrame(() => {
            const h = citePopup.offsetHeight;
            const proposedTop = rect.top + window.scrollY - h - 8;
            // If it would go above viewport, show below instead
            citePopup.style.top = proposedTop < window.scrollY + 10
                ? `${rect.bottom + window.scrollY + 8}px`
                : `${proposedTop}px`;
        });
    });

    document.addEventListener('mouseout', e => {
        if (!e.target.closest('a.sep-cite-link')) return;
        hideCiteTimeout = setTimeout(() => citePopup.classList.remove('visible'), 200);
    });

    citePopup.addEventListener('mouseover', () => clearTimeout(hideCiteTimeout));
    citePopup.addEventListener('mouseout', () => {
        hideCiteTimeout = setTimeout(() => citePopup.classList.remove('visible'), 200);
    });


    // =============================================
    // 8. KEYBOARD NAVIGATION
    // =============================================
    const allSections = [...document.querySelectorAll(
        '#aueditable h2, #aueditable h3, #article-content h2, #article-content h3'
    )].filter(h => h.id || h.querySelector('a[name]'));

    const kbHint = document.createElement('div');
    kbHint.id = 'sep-kb-hint';
    kbHint.innerHTML = '<kbd>k</kbd> next &nbsp; <kbd>j</kbd> prev &nbsp; <kbd>h</kbd> top &nbsp; <kbd>l</kbd> bottom';
    document.body.appendChild(kbHint);

    // Show hint briefly on first visit — desktop only
    if (!window.matchMedia('(max-width: 768px)').matches) {
        setTimeout(() => kbHint.classList.add('visible'), 2000);
        setTimeout(() => kbHint.classList.remove('visible'), 7000);
    }

    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        if (e.key === 'k' || e.key === 'j') {
            e.preventDefault();
            const scrollY = window.scrollY + 100;
            let currentIdx = -1;

            for (let i = allSections.length - 1; i >= 0; i--) {
                if (allSections[i].getBoundingClientRect().top + window.scrollY <= scrollY) {
                    currentIdx = i;
                    break;
                }
            }

            const nextIdx = e.key === 'k'
                ? Math.min(currentIdx + 1, allSections.length - 1)
                : Math.max(currentIdx - 1, 0);

            allSections[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (e.key === 'h') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (e.key === 'l') {
            e.preventDefault();
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        }
    });


    // =============================================
    // 9. ENHANCE BIBLIOGRAPHY — collapsible
    // =============================================
    let bibH2 = null;
    for (const h2 of document.querySelectorAll('h2')) {
        const txt = h2.textContent.trim().toLowerCase();
        if (txt === 'bibliography' || txt === 'references') {
            bibH2 = h2;
            break;
        }
    }

    if (bibH2) {
        const toggleBtn = document.createElement('span');
        toggleBtn.textContent = ' [collapse]';
        toggleBtn.style.cssText = 'font-size: 12px; color: #666; cursor: pointer; font-weight: 400; font-family: -apple-system, sans-serif; margin-left: 8px;';
        bibH2.appendChild(toggleBtn);

        const bibSiblings = [];
        let next = bibH2.nextElementSibling;
        while (next && next.tagName !== 'H2') {
            bibSiblings.push(next);
            next = next.nextElementSibling;
        }

        let bibCollapsed = false;
        toggleBtn.addEventListener('click', e => {
            e.stopPropagation();
            bibCollapsed = !bibCollapsed;
            for (const el of bibSiblings) el.style.display = bibCollapsed ? 'none' : '';
            toggleBtn.textContent = bibCollapsed ? ' [expand]' : ' [collapse]';
        });
    }

    // =============================================
    // 10. TOC SCROLL SPY + TOGGLE
    // =============================================
    let mobileTocOpen = false;
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const isMobileViewport = () => window.innerWidth <= 768;
    const toc = document.getElementById('toc');
    let tocOpen = true;
    let openMobileToc = () => {};
    let closeMobileToc = () => {};
    let toggleDesktopToc = () => {};
    let updateTocPosition = () => {};
    if (toc) {
        const tocLinks = [...toc.querySelectorAll('a[href^="#"]')];
        // SEP uses <a name="..."> anchors, not id attributes on headings
        const tocSections = tocLinks
            .map(link => {
                const id = link.getAttribute('href').slice(1);
                const target = document.getElementById(id) ?? document.querySelector(`a[name="${CSS.escape(id)}"]`);
                return { link, target };
            })
            .filter(s => s.target);
        let manualTocSection = null;
        let manualTocActiveUntil = 0;
        const setActiveTocLink = link => {
            for (const { link: tocLink } of tocSections) tocLink.classList.remove('toc-active');
            link?.classList.add('toc-active');
        };
        const getAnchorScrollOffset = () => {
            if (isMobileViewport()) return 72;
            const readerVisible = document.getElementById('sep-reader-bar')?.classList.contains('visible') ?? false;
            return readerVisible ? 72 : 56;
        };

        // Desktop sidebar toggle button (←/→)
        const tocToggleBtn = document.createElement('button');
        tocToggleBtn.id = 'sep-toc-toggle';
        tocToggleBtn.title = 'Hide table of contents';
        tocToggleBtn.textContent = 'hide';
        document.body.appendChild(tocToggleBtn);

        // Mobile hamburger button (☰)
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.id = 'sep-toc-hamburger';
        hamburgerBtn.type = 'button';
        hamburgerBtn.textContent = 'Contents';
        hamburgerBtn.title = 'Show table of contents';
        hamburgerBtn.setAttribute('aria-label', 'Show table of contents');
        hamburgerBtn.setAttribute('aria-controls', 'toc');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.appendChild(hamburgerBtn);

        const tocPanelHeader = document.createElement('div');
        tocPanelHeader.id = 'sep-toc-panel-header';
        const tocPanelTitle = document.createElement('div');
        tocPanelTitle.id = 'sep-toc-panel-title';
        tocPanelTitle.textContent = 'Contents';
        const tocPanelClose = document.createElement('button');
        tocPanelClose.id = 'sep-toc-panel-close';
        tocPanelClose.type = 'button';
        tocPanelClose.textContent = '×';
        tocPanelClose.title = 'Close table of contents';
        tocPanelClose.setAttribute('aria-label', 'Close table of contents');
        tocPanelHeader.append(tocPanelTitle, tocPanelClose);
        toc.prepend(tocPanelHeader);

        // Mobile backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'sep-mobile-backdrop';
        document.body.appendChild(backdrop);

        tocOpen = true;        // desktop: sidebar visible?
        const pageHeader = document.getElementById('header-wrapper');
        const pageArticle = document.getElementById('article');
        const headerWrapper = document.getElementById('header-wrapper');

        // Desktop: update TOC and button positions to track header
        updateTocPosition = () => {
            if (isMobileViewport()) return;
            const headerBottom = headerWrapper ? headerWrapper.getBoundingClientRect().bottom : 0;
            const readerVisible = document.getElementById('sep-reader-bar')?.classList.contains('visible') ?? false;
            const readerBottom = readerVisible ? 48 : 0;
            const top = Math.max(10, headerBottom > 0 ? headerBottom + 10 : 10, readerBottom + 10);
            toc.style.setProperty('top', `${top}px`, 'important');
            toc.style.setProperty('max-height', `calc(100vh - ${top + 10}px)`, 'important');
            tocToggleBtn.style.top = `${top + 14}px`;
            topBtn.style.top = `${top + 44}px`;
        };

        // Mobile: open/close bottom sheet — layout controlled by Stylus @media rules
        // Scroll lock: overflow:hidden for Chrome/Safari; touch-action:none on the backdrop
        // handles Firefox Android (backdrop covers full viewport at z-index below TOC,
        // so the compositor blocks scroll on background touches while TOC stays scrollable).
        openMobileToc = () => {
            if (!isMobileViewport()) return;
            mobileTocOpen = true;
            requestAnimationFrame(() => toc.classList.add('toc-open'));
            backdrop.classList.add('visible');
            hamburgerBtn.classList.add('toc-is-open');
            hamburgerBtn.title = 'Hide table of contents';
            hamburgerBtn.setAttribute('aria-label', 'Hide table of contents');
            hamburgerBtn.setAttribute('aria-expanded', 'true');
            readerBar?.classList.remove('visible');
            fsVisible = false;
            document.body.style.setProperty('overflow', 'hidden', 'important');
            document.documentElement.style.setProperty('overflow', 'hidden', 'important');
            // Fix item 1 clipping: SEP's <ul> has negative margin that pushes first item above toc's top edge
            setTimeout(() => {
                const firstLink = toc.querySelector('a[href^="#"]');
                if (!firstLink) return;
                const tocRect = toc.getBoundingClientRect();
                const linkRect = firstLink.getBoundingClientRect();
                if (linkRect.top < tocRect.top) {
                    const overflow = tocRect.top - linkRect.top;
                    const currentPt = parseFloat(getComputedStyle(toc).paddingTop) || 0;
                    toc.style.setProperty('padding-top', `${currentPt + overflow + 12}px`, 'important');
                }
            }, 350);
        };
        closeMobileToc = () => {
            mobileTocOpen = false;
            toc.classList.remove('toc-open');
            toc.style.removeProperty('padding-top');
            backdrop.classList.remove('visible');
            hamburgerBtn.classList.remove('toc-is-open');
            hamburgerBtn.textContent = 'Contents';
            hamburgerBtn.title = 'Show table of contents';
            hamburgerBtn.setAttribute('aria-label', 'Show table of contents');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            document.body.style.removeProperty('overflow');
            document.documentElement.style.removeProperty('overflow');
        };

        // Enter/exit mobile layout mode
        const enterMobileMode = () => {
            toc.classList.add('toc-mobile');
            toc.classList.remove('toc-open');
            toc.scrollTop = 0;
            toc.style.removeProperty('padding-top');
            // Clear any desktop inline styles — Stylus @media rules take over layout
            toc.style.removeProperty('display');
            toc.style.removeProperty('top');
            toc.style.removeProperty('max-height');
            pageHeader?.style.removeProperty('padding-left');
            pageArticle?.style.removeProperty('margin-left');
            pageArticle?.style.removeProperty('width');
            pageArticle?.style.removeProperty('max-width');
            backdrop.classList.remove('visible');
            mobileTocOpen = false;
            document.body.style.removeProperty('overflow');
            document.documentElement.style.removeProperty('overflow');
            hamburgerBtn.textContent = 'Contents';
            hamburgerBtn.title = 'Show table of contents';
            hamburgerBtn.setAttribute('aria-label', 'Show table of contents');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        };
        const exitMobileMode = () => {
            toc.classList.remove('toc-mobile');
            toc.classList.remove('toc-open');
            backdrop.classList.remove('visible');
            mobileTocOpen = false;
            document.body.style.removeProperty('overflow');
            document.documentElement.style.removeProperty('overflow');
            toc.style.removeProperty('position');
            toc.style.removeProperty('display');
            if (tocOpen) {
                pageHeader?.style.setProperty('padding-left', '260px', 'important');
                pageArticle?.style.setProperty('margin-left', '260px', 'important');
                pageArticle?.style.removeProperty('width');
                pageArticle?.style.removeProperty('max-width');
            } else {
                toc.style.setProperty('display', 'none', 'important');
            }
            updateTocPosition();
        };

        // Desktop toggle click
        toggleDesktopToc = () => {
            const savedY = window.scrollY;
            tocOpen = !tocOpen;
            if (tocOpen) {
                toc.style.removeProperty('display');
                pageHeader?.style.setProperty('padding-left', '260px', 'important');
                pageArticle?.style.setProperty('margin-left', '260px', 'important');
                pageArticle?.style.removeProperty('width');
                pageArticle?.style.removeProperty('max-width');
                pageArticle?.style.removeProperty('padding-left');
                tocToggleBtn.title = 'Hide table of contents';
                tocToggleBtn.textContent = 'hide';
                updateTocPosition();
            } else {
                toc.style.setProperty('display', 'none', 'important');
                pageHeader?.style.removeProperty('padding-left');
                pageArticle?.style.setProperty('margin-left', '0', 'important');
                pageArticle?.style.setProperty('width', '100%', 'important');
                pageArticle?.style.setProperty('max-width', '100%', 'important');
                // Keep enough left padding so buttons don't land on prose
                pageArticle?.style.setProperty('padding-left', '3em', 'important');
                tocToggleBtn.title = 'Show table of contents';
                tocToggleBtn.textContent = 'contents';
            }
            window.scrollTo({ top: savedY, behavior: 'instant' });
        };
        tocToggleBtn.addEventListener('click', toggleDesktopToc);

        // Mobile hamburger click
        hamburgerBtn.addEventListener('click', () => {
            if (mobileTocOpen) closeMobileToc();
            else openMobileToc();
        });

        // Make tapped TOC targets register before scroll spy settles.
        toc.addEventListener('click', e => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            manualTocSection = tocSections.find(section => section.link === link) ?? null;
            manualTocActiveUntil = Date.now() + 1200;
            setActiveTocLink(link);
            if (manualTocSection) {
                e.preventDefault();
                const targetTop = manualTocSection.target.getBoundingClientRect().top + window.scrollY;
                const top = Math.max(0, targetTop - getAnchorScrollOffset());
                window.history.pushState(null, '', link.getAttribute('href'));
                window.scrollTo({ top, behavior: 'smooth' });
            }

            if (isMobileViewport() && mobileTocOpen) closeMobileToc();
        });
        backdrop.addEventListener('click', closeMobileToc);
        tocPanelClose.addEventListener('click', closeMobileToc);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && mobileTocOpen) closeMobileToc();
        });

        // Switch modes on resize
        mobileQuery.addEventListener('change', e => {
            if (e.matches && isMobileViewport()) enterMobileMode();
            else exitMobileMode();
        });

        updateTocPosition();
        scrollCallbacks.push(updateTocPosition);
        window.addEventListener('resize', updateTocPosition);

        if (isMobileViewport()) enterMobileMode();

        if (tocSections.length) {
            const updateToc = scrollY => {
                const spyOffset = isMobileViewport() ? 80 : 200;
                const checkY = scrollY + spyOffset;
                let currentIdx = 0;
                for (let i = tocSections.length - 1; i >= 0; i--) {
                    if (tocSections[i].target.getBoundingClientRect().top + scrollY <= checkY) {
                        currentIdx = i;
                        break;
                    }
                }
                let current = tocSections[currentIdx];
                const manualActive = manualTocSection && Date.now() < manualTocActiveUntil;
                if (manualActive) {
                    current = manualTocSection;
                    currentIdx = tocSections.indexOf(manualTocSection);
                }

                if (current) {
                    setActiveTocLink(current.link);
                    const tr = toc.getBoundingClientRect();
                    const lr = current.link.getBoundingClientRect();
                    if ((!isMobileViewport() || mobileTocOpen) &&
                        (lr.top < tr.top + 10 || lr.bottom > tr.bottom - 10)) {
                        current.link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                }

                // Section progress bar
                const sectionTop = current.target.getBoundingClientRect().top + scrollY;
                const next = tocSections[currentIdx + 1];
                const sectionBottom = next
                    ? next.target.getBoundingClientRect().top + scrollY
                    : document.documentElement.scrollHeight;
                const sectionLen = sectionBottom - sectionTop;
                const sectionPct = sectionLen > 0
                    ? Math.min(100, Math.max(0, (scrollY + spyOffset - sectionTop) / sectionLen * 100))
                    : 0;
                sectionProgressBar.style.width = `${sectionPct}%`;
                sectionTick.style.left = `${sectionPct}%`;
            };

            scrollCallbacks.push(updateToc);
            updateToc(window.scrollY);
        }
    }

    // =============================================
    // 11. MOBILE PADDING ENFORCER (counters SEP's inline style overrides)
    // =============================================
    if (isMobileViewport()) {
        const mobileContainers = [
            document.body,
            document.getElementById('container'),
            document.getElementById('content'),
            document.getElementById('article'),
            document.getElementById('aueditable'),
            document.getElementById('article-content'),
            document.getElementById('preamble'),
            document.getElementById('article-header'),
        ].filter(Boolean);
        const contentEl = document.getElementById('aueditable') || document.getElementById('article-content');
        let padObserver = null;
        const enforceLayout = () => {
            if (padObserver) padObserver.disconnect();
            for (const el of mobileContainers) {
                el.style.setProperty('padding-left', '0', 'important');
                el.style.setProperty('padding-right', '0', 'important');
                el.style.setProperty('margin-left', '0', 'important');
                el.style.setProperty('margin-right', '0', 'important');
                el.style.setProperty('max-width', '100%', 'important');
                el.style.setProperty('width', '100%', 'important');
            }
            if (contentEl) {
                contentEl.style.setProperty('padding-left', '1rem', 'important');
                contentEl.style.setProperty('padding-right', '1rem', 'important');
            }
            requestAnimationFrame(() => {
                padObserver = new MutationObserver(enforceLayout);
                for (const el of mobileContainers) {
                    padObserver.observe(el, { attributes: true, attributeFilter: ['style'] });
                }
            });
        };
        enforceLayout();
    }

    // =============================================
    // 12. READER APP BAR (shows on scroll up)
    // =============================================
    const articleTitleEl = document.querySelector('#aueditable h1, #article-content h1, .pagetitle');
    const originalHeader = document.getElementById('header-wrapper');
    const articlePreamble = document.getElementById('preamble');
    const articleTitle = articleTitleEl
        ?.textContent?.trim()
        || document.title.replace(/\s*\(Stanford.*\)$/, '').trim();

    // Borrow the existing search form's action + param name so it routes correctly
    const existingForm = document.querySelector('#search form');
    const fsAction = existingForm?.action || 'https://plato.stanford.edu/search/searcher.py';
    const fsParamName = existingForm?.querySelector('input[type="search"]')?.name || 'query';

    const readerBar = document.createElement('div');
    readerBar.id = 'sep-reader-bar';

    const readerTitle = document.createElement('div');
    readerTitle.id = 'sep-reader-title';
    readerTitle.textContent = articleTitle;

    const readerTocBtn = document.createElement('button');
    readerTocBtn.id = 'sep-reader-toc-btn';
    readerTocBtn.type = 'button';
    readerTocBtn.textContent = 'Contents';
    readerTocBtn.setAttribute('aria-controls', 'toc');
    readerTocBtn.setAttribute('aria-expanded', 'false');

    const floatingSearch = document.createElement('form');
    floatingSearch.id = 'sep-floating-search';
    floatingSearch.action = fsAction;
    floatingSearch.method = 'get';

    const fsIcon = document.createElement('span');
    fsIcon.className = 'sep-fs-icon';
    fsIcon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

    const fsInput = document.createElement('input');
    fsInput.type = 'search';
    fsInput.name = fsParamName;
    fsInput.placeholder = articleTitle;
    fsInput.autocomplete = 'off';
    fsInput.spellcheck = false;

    floatingSearch.append(fsIcon, fsInput);
    readerBar.append(readerTitle, floatingSearch, readerTocBtn);
    document.body.appendChild(readerBar);

    readerTocBtn.addEventListener('click', () => {
        if (isMobileViewport()) {
            if (mobileTocOpen) closeMobileToc();
            else openMobileToc();
            readerTocBtn.setAttribute('aria-expanded', String(mobileTocOpen));
        } else {
            toggleDesktopToc();
            readerTocBtn.setAttribute('aria-expanded', String(tocOpen));
        }
    });

    let fsLastY = window.scrollY;
    let fsVisible = false;
    let lastManualScrollAt = 0;
    const markManualScroll = () => { lastManualScrollAt = Date.now(); };

    window.addEventListener('wheel', markManualScroll, { passive: true });
    window.addEventListener('touchmove', markManualScroll, { passive: true });
    window.addEventListener('keydown', e => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
            markManualScroll();
        }
    });

    const shouldSuppressReaderBarNearPageChrome = () => {
        const titleRect = articleTitleEl?.getBoundingClientRect();
        const headerRect = originalHeader?.getBoundingClientRect();
        const preambleRect = articlePreamble?.getBoundingClientRect();
        const titleVisible = titleRect && titleRect.bottom > 0 && titleRect.top < window.innerHeight;
        const headerVisible = headerRect && headerRect.bottom > 0 && headerRect.top < window.innerHeight;
        const preambleVisible = preambleRect && preambleRect.bottom > 48 && preambleRect.top < window.innerHeight;
        return Boolean(titleVisible || headerVisible || preambleVisible);
    };

    scrollCallbacks.push(scrollY => {
        const goingUp = scrollY < fsLastY;
        fsLastY = scrollY;
        const manualScroll = Date.now() - lastManualScrollAt < 700;
        const pageChromeVisible = shouldSuppressReaderBarNearPageChrome();
        const canShowReaderBar = manualScroll && goingUp && scrollY > 200 &&
            !pageChromeVisible && (!isMobileViewport() || !mobileTocOpen);
        if (canShowReaderBar) {
            if (!fsVisible) {
                fsVisible = true;
                readerBar.classList.add('visible');
                topBtn.classList.add('reader-hidden');
                updateTocPosition();
            }
        } else if (!goingUp || pageChromeVisible || (isMobileViewport() && mobileTocOpen)) {
            if (fsVisible) {
                fsVisible = false;
                readerBar.classList.remove('visible');
                topBtn.classList.remove('reader-hidden');
                updateTocPosition();
            }
        }
        readerTocBtn.setAttribute('aria-expanded', String(isMobileViewport() ? mobileTocOpen : tocOpen));
    });

})();
