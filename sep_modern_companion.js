// ==UserScript==
// @name         SEP Modern Companion
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Modernizes the Stanford Encyclopedia of Philosophy reading experience
// @author       You
// @match        https://plato.stanford.edu/entries/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stanford.edu
// @grant        none
// @noframes
// @run-at       document-end
// ==/UserScript==

(() => {

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
            background: rgba(123, 164, 255, 0.38); width: 0%;
            transition: width 0.1s linear; pointer-events: none;
        }

        /* Back to top button */
        #sep-top-btn {
            position: fixed; top: 60px; left: 20px; z-index: 9998;
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

        /* Reading time badge */
        #sep-reading-time {
            display: inline-block; font-size: 13px; color: #666;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin-top: 6px; padding: 4px 10px; background: #1a1a1a;
            border-radius: 4px; border: 1px solid #2a2a2a;
        }

        /* Footnote popup */
        #sep-footnote-popup {
            position: absolute; z-index: 9999; max-width: 420px;
            background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
            padding: 14px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            font-size: 13.5px; line-height: 1.65; color: #c0c0c0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
        }
        #sep-footnote-popup.visible { opacity: 1; pointer-events: auto; }
        #sep-footnote-popup a { color: #7ba4ff !important; }

        /* Section anchor links (on hover) */
        .sep-anchor-link {
            opacity: 0; margin-left: 8px; color: #555 !important;
            text-decoration: none !important; font-size: 0.7em;
            transition: opacity 0.15s ease; cursor: pointer;
            font-weight: 400 !important; vertical-align: middle;
        }
        h2:hover .sep-anchor-link, h3:hover .sep-anchor-link { opacity: 1; }
        .sep-anchor-link:hover { color: #7ba4ff !important; }

        /* Smooth scroll globally */
        html { scroll-behavior: smooth; }

        /* Keyboard nav hint */
        #sep-kb-hint {
            position: fixed; bottom: 28px; left: 28px; z-index: 9998;
            font-size: 11px; color: #444; padding: 6px 10px;
            background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px;
            font-family: -apple-system, sans-serif; opacity: 0;
            transition: opacity 0.3s ease; pointer-events: none;
        }
        #sep-kb-hint.visible { opacity: 1; }
        #sep-kb-hint kbd {
            display: inline-block; padding: 1px 5px; background: #252525;
            border: 1px solid #333; border-radius: 3px; font-size: 10px;
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
            color: #7ba4ff !important; font-weight: 600 !important;
            border-left: 2px solid #7ba4ff; padding-left: 6px; margin-left: -8px;
        }

        /* Mobile TOC: hamburger button */
        #sep-toc-hamburger {
            position: fixed; bottom: 24px; right: 24px; z-index: 1005;
            width: 44px; height: 44px; border-radius: 10px;
            background: #1e1e1e; border: 1px solid #333; color: #aaa;
            font-size: 18px; cursor: pointer;
            display: none; align-items: center; justify-content: center;
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
            transition: color 0.15s ease, border-color 0.15s ease;
        }
        #sep-toc-hamburger:hover { color: #7ba4ff; border-color: #7ba4ff; }

        /* Mobile TOC: dark backdrop */
        #sep-mobile-backdrop {
            position: fixed; inset: 0; z-index: 1003;
            background: rgba(0,0,0,0.6); opacity: 0; pointer-events: none;
            transition: opacity 0.25s ease;
        }
        #sep-mobile-backdrop.visible { opacity: 1; pointer-events: auto; }

        @media (max-width: 768px), (max-width: 1024px) and (hover: none) {
            #sep-toc-hamburger { display: flex !important; }
            #sep-toc-toggle { display: none !important; }
            #sep-top-btn { display: none !important; }

            #toc.toc-mobile {
                top: auto !important; bottom: 0 !important;
                left: 0 !important; right: 0 !important;
                width: 100% !important; max-width: 100% !important;
                max-height: 70vh !important;
                transform: translateY(105%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                border-radius: 16px 16px 0 0 !important;
                z-index: 1004 !important;
                padding: 20px 16px 32px !important;
                display: block !important;
            }
            #toc.toc-mobile.toc-open { transform: translateY(0) !important; }
            #toc.toc-mobile::before {
                content: ''; display: block; width: 36px; height: 4px;
                background: #444; border-radius: 2px; margin: 0 auto 16px;
            }
        }

        /* Floating search bar (appears on scroll-up) */
        #sep-floating-search {
            position: fixed; top: -56px; left: 50%; transform: translateX(-50%);
            z-index: 9990; width: min(560px, calc(100% - 2rem));
            display: flex; align-items: center; gap: 10px;
            background: #1e1e1e; border: 1px solid #333; border-radius: 10px;
            padding: 0 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.5);
            transition: top 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
            opacity: 0; pointer-events: none;
        }
        #sep-floating-search.visible { top: 14px; opacity: 1; pointer-events: auto; }
        #sep-floating-search .sep-fs-icon { color: #555; font-size: 15px; flex-shrink: 0; line-height: 1; }
        #sep-floating-search input[type="search"] {
            flex: 1; background: transparent; border: none; outline: none;
            color: #d6d6d6; font-size: 14.5px; padding: 12px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-appearance: none;
        }
        #sep-floating-search input[type="search"]::placeholder { color: #444; }
        #sep-floating-search input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; }

        /* Citation popup */
        #sep-cite-popup {
            position: absolute; z-index: 9999; max-width: 480px; min-width: 280px;
            background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
            padding: 14px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            font-size: 13.5px; line-height: 1.65; color: #c0c0c0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
        }
        #sep-cite-popup.visible { opacity: 1; pointer-events: auto; }
        #sep-cite-popup a { color: #7ba4ff !important; }
        #sep-cite-popup .sep-cite-label {
            font-size: 11px; color: #555; text-transform: uppercase;
            letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 600;
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
    kbHint.innerHTML = '<kbd>j</kbd> next section &nbsp; <kbd>k</kbd> prev section &nbsp; <kbd>t</kbd> top';
    document.body.appendChild(kbHint);

    // Show hint briefly on first visit
    setTimeout(() => kbHint.classList.add('visible'), 2000);
    setTimeout(() => kbHint.classList.remove('visible'), 7000);

    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        if (e.key === 'j' || e.key === 'k') {
            e.preventDefault();
            const scrollY = window.scrollY + 100;
            let currentIdx = -1;

            for (let i = allSections.length - 1; i >= 0; i--) {
                if (allSections[i].getBoundingClientRect().top + window.scrollY <= scrollY) {
                    currentIdx = i;
                    break;
                }
            }

            const nextIdx = e.key === 'j'
                ? Math.min(currentIdx + 1, allSections.length - 1)
                : Math.max(currentIdx - 1, 0);

            allSections[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (e.key === 't') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const toc = document.getElementById('toc');
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

        // Desktop sidebar toggle button (←/→)
        const tocToggleBtn = document.createElement('button');
        tocToggleBtn.id = 'sep-toc-toggle';
        tocToggleBtn.title = 'Hide table of contents';
        tocToggleBtn.textContent = '←';
        document.body.appendChild(tocToggleBtn);

        // Mobile hamburger button (☰)
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.id = 'sep-toc-hamburger';
        hamburgerBtn.innerHTML = '&#9776;';
        hamburgerBtn.title = 'Show table of contents';
        document.body.appendChild(hamburgerBtn);

        // Mobile backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'sep-mobile-backdrop';
        document.body.appendChild(backdrop);

        let tocOpen = true;        // desktop: sidebar visible?
        let mobileTocOpen = false; // mobile: bottom sheet visible?
        const pageArticle = document.getElementById('article');
        const headerWrapper = document.getElementById('header-wrapper');
        const mobileQuery = window.matchMedia('(max-width: 768px), (max-width: 1024px) and (hover: none)');

        // Desktop: update TOC and button positions to track header
        const updateTocPosition = () => {
            if (mobileQuery.matches) return;
            const headerBottom = headerWrapper ? headerWrapper.getBoundingClientRect().bottom : 0;
            const top = headerBottom > 0 ? Math.max(10, headerBottom + 10) : 10;
            toc.style.setProperty('top', `${top}px`, 'important');
            toc.style.setProperty('max-height', `calc(100vh - ${top + 10}px)`, 'important');
            tocToggleBtn.style.top = `${top + 6}px`;
            topBtn.style.top = `${top + 6 + 22 + 4}px`;
        };

        // Mobile: open/close bottom sheet — use inline styles so they beat any stylesheet
        const openMobileToc = () => {
            mobileTocOpen = true;
            toc.style.setProperty('position', 'fixed', 'important');
            toc.style.setProperty('display', 'block', 'important');
            // Allow display:block to paint before triggering slide-up transition
            requestAnimationFrame(() => toc.classList.add('toc-open'));
            backdrop.classList.add('visible');
            hamburgerBtn.innerHTML = '&#10005;';
            hamburgerBtn.title = 'Hide table of contents';
        };
        const closeMobileToc = () => {
            mobileTocOpen = false;
            toc.classList.remove('toc-open');
            backdrop.classList.remove('visible');
            hamburgerBtn.innerHTML = '&#9776;';
            hamburgerBtn.title = 'Show table of contents';
            // Hide after slide-down animation completes
            setTimeout(() => {
                if (!mobileTocOpen) toc.style.setProperty('display', 'none', 'important');
            }, 350);
        };

        // Enter/exit mobile layout mode
        const enterMobileMode = () => {
            toc.classList.add('toc-mobile');
            // Inline styles override any stylesheet — no cascade conflicts
            toc.style.setProperty('position', 'fixed', 'important');
            toc.style.setProperty('display', 'none', 'important');
            toc.style.removeProperty('top');
            toc.style.removeProperty('max-height');
            toc.classList.remove('toc-open');
            backdrop.classList.remove('visible');
            mobileTocOpen = false;
            hamburgerBtn.innerHTML = '&#9776;';
            hamburgerBtn.title = 'Show table of contents';
            pageArticle?.style.setProperty('margin-left', '0', 'important');
            pageArticle?.style.setProperty('width', '100%', 'important');
            pageArticle?.style.setProperty('max-width', '100%', 'important');
        };
        const exitMobileMode = () => {
            toc.classList.remove('toc-mobile');
            toc.classList.remove('toc-open');
            backdrop.classList.remove('visible');
            mobileTocOpen = false;
            toc.style.removeProperty('position');
            toc.style.removeProperty('display');
            if (tocOpen) {
                pageArticle?.style.setProperty('margin-left', '260px', 'important');
                pageArticle?.style.removeProperty('width');
                pageArticle?.style.removeProperty('max-width');
            } else {
                toc.style.setProperty('display', 'none', 'important');
            }
            updateTocPosition();
        };

        // Desktop toggle click
        tocToggleBtn.addEventListener('click', () => {
            const savedY = window.scrollY;
            tocOpen = !tocOpen;
            if (tocOpen) {
                toc.style.removeProperty('display');
                pageArticle?.style.setProperty('margin-left', '260px', 'important');
                pageArticle?.style.removeProperty('width');
                pageArticle?.style.removeProperty('max-width');
                tocToggleBtn.title = 'Hide table of contents';
                tocToggleBtn.textContent = '←';
                updateTocPosition();
            } else {
                toc.style.setProperty('display', 'none', 'important');
                pageArticle?.style.setProperty('margin-left', '0', 'important');
                pageArticle?.style.setProperty('width', '100%', 'important');
                pageArticle?.style.setProperty('max-width', '100%', 'important');
                tocToggleBtn.title = 'Show table of contents';
                tocToggleBtn.textContent = '→';
            }
            window.scrollTo({ top: savedY, behavior: 'instant' });
        });

        // Mobile hamburger click
        hamburgerBtn.addEventListener('click', () => {
            if (mobileTocOpen) closeMobileToc();
            else openMobileToc();
        });
        backdrop.addEventListener('click', closeMobileToc);

        // Switch modes on resize
        mobileQuery.addEventListener('change', e => {
            if (e.matches) enterMobileMode();
            else exitMobileMode();
        });

        updateTocPosition();
        scrollCallbacks.push(updateTocPosition);
        window.addEventListener('resize', updateTocPosition);

        if (mobileQuery.matches) enterMobileMode();

        if (tocSections.length) {
            const updateToc = scrollY => {
                const checkY = scrollY + 200;
                let currentIdx = 0;
                for (let i = tocSections.length - 1; i >= 0; i--) {
                    if (tocSections[i].target.getBoundingClientRect().top + scrollY <= checkY) {
                        currentIdx = i;
                        break;
                    }
                }
                const current = tocSections[currentIdx];

                for (const { link } of tocSections) link.classList.remove('toc-active');
                if (current) {
                    current.link.classList.add('toc-active');
                    const tr = toc.getBoundingClientRect();
                    const lr = current.link.getBoundingClientRect();
                    if (lr.top < tr.top + 10 || lr.bottom > tr.bottom - 10) {
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
                    ? Math.min(100, Math.max(0, (scrollY + 200 - sectionTop) / sectionLen * 100))
                    : 0;
                sectionProgressBar.style.width = `${sectionPct}%`;
            };

            scrollCallbacks.push(updateToc);
            updateToc(window.scrollY);
        }
    }

    // =============================================
    // 11. FLOATING SEARCH BAR (shows on scroll up)
    // =============================================
    const articleTitle = document.querySelector('#aueditable h1, #article-content h1, .pagetitle')
        ?.textContent?.trim()
        || document.title.replace(/\s*\(Stanford.*\)$/, '').trim();

    // Borrow the existing search form's action + param name so it routes correctly
    const existingForm = document.querySelector('#search form');
    const fsAction = existingForm?.action || 'https://plato.stanford.edu/search/searcher.py';
    const fsParamName = existingForm?.querySelector('input[type="search"]')?.name || 'query';

    const floatingSearch = document.createElement('form');
    floatingSearch.id = 'sep-floating-search';
    floatingSearch.action = fsAction;
    floatingSearch.method = 'get';

    const fsIcon = document.createElement('span');
    fsIcon.className = 'sep-fs-icon';
    fsIcon.textContent = '⌕';

    const fsInput = document.createElement('input');
    fsInput.type = 'search';
    fsInput.name = fsParamName;
    fsInput.placeholder = articleTitle;
    fsInput.autocomplete = 'off';
    fsInput.spellcheck = false;

    floatingSearch.append(fsIcon, fsInput);
    document.body.appendChild(floatingSearch);

    let fsLastY = window.scrollY;
    let fsVisible = false;

    scrollCallbacks.push(scrollY => {
        const goingUp = scrollY < fsLastY;
        fsLastY = scrollY;
        if (goingUp && scrollY > 200) {
            if (!fsVisible) { fsVisible = true; floatingSearch.classList.add('visible'); }
        } else if (!goingUp) {
            if (fsVisible) { fsVisible = false; floatingSearch.classList.remove('visible'); }
        }
    });

})();
