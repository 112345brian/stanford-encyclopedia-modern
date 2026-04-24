// ==UserScript==
// @name         SEP Modern Companion
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Modernizes the Stanford Encyclopedia of Philosophy reading experience
// @author       You
// @match        https://plato.stanford.edu/entries/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stanford.edu
// @grant        none
// @inject-into  content
// @noframes
// @run-at       document-end
// ==/UserScript==

var script = document.createElement('script');
script.textContent = '(' + function () {
    window.addEventListener('load', function () {
        setTimeout(function () {

            // =============================================
            // STYLES
            // =============================================
            var style = document.createElement('style');
            style.textContent = [

                // Reading progress bar
                '#sep-progress {',
                '  position: fixed; top: 0; left: 0; height: 2px; z-index: 9999;',
                '  background: #7ba4ff; width: 0%; transition: width 0.1s linear;',
                '  pointer-events: none;',
                '}',

                // Back to top button
                '#sep-top-btn {',
                '  position: fixed; bottom: 28px; right: 28px; z-index: 9998;',
                '  width: 40px; height: 40px; border-radius: 50%;',
                '  background: #1a1a1a; border: 1px solid #333; color: #888;',
                '  font-size: 18px; cursor: pointer; display: none;',
                '  align-items: center; justify-content: center;',
                '  transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.3);',
                '  font-family: -apple-system, sans-serif; line-height: 1;',
                '}',
                '#sep-top-btn:hover { background: #252525; color: #7ba4ff; border-color: #7ba4ff; }',
                '#sep-top-btn.visible { display: flex; }',

                // Reading time badge
                '#sep-reading-time {',
                '  display: inline-block; font-size: 13px; color: #666;',
                '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
                '  margin-top: 6px; padding: 4px 10px; background: #1a1a1a;',
                '  border-radius: 4px; border: 1px solid #2a2a2a;',
                '}',

                // Footnote popup
                '#sep-footnote-popup {',
                '  position: absolute; z-index: 9999; max-width: 420px;',
                '  background: #1a1a1a; border: 1px solid #333; border-radius: 8px;',
                '  padding: 14px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);',
                '  font-size: 13.5px; line-height: 1.65; color: #c0c0c0;',
                '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
                '  pointer-events: none; opacity: 0; transition: opacity 0.15s ease;',
                '}',
                '#sep-footnote-popup.visible { opacity: 1; pointer-events: auto; }',
                '#sep-footnote-popup a { color: #7ba4ff !important; }',

                // Section anchor links (on hover)
                '.sep-anchor-link {',
                '  opacity: 0; margin-left: 8px; color: #555 !important;',
                '  text-decoration: none !important; font-size: 0.7em;',
                '  transition: opacity 0.15s ease; cursor: pointer;',
                '  font-weight: 400 !important; vertical-align: middle;',
                '}',
                'h2:hover .sep-anchor-link, h3:hover .sep-anchor-link { opacity: 1; }',
                '.sep-anchor-link:hover { color: #7ba4ff !important; }',

                // Smooth scroll globally
                'html { scroll-behavior: smooth; }',

                // Keyboard nav hint
                '#sep-kb-hint {',
                '  position: fixed; bottom: 28px; left: 28px; z-index: 9998;',
                '  font-size: 11px; color: #444; padding: 6px 10px;',
                '  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px;',
                '  font-family: -apple-system, sans-serif; opacity: 0;',
                '  transition: opacity 0.3s ease; pointer-events: none;',
                '}',
                '#sep-kb-hint.visible { opacity: 1; }',
                '#sep-kb-hint kbd {',
                '  display: inline-block; padding: 1px 5px; background: #252525;',
                '  border: 1px solid #333; border-radius: 3px; font-size: 10px;',
                '  font-family: -apple-system, sans-serif; color: #888;',
                '}',

                // Citation links
                'a.sep-cite-link {',
                '  color: #7ba4ff !important; text-decoration: none !important;',
                '  border-bottom: 1px dotted #555; cursor: pointer;',
                '  transition: border-color 0.15s ease;',
                '}',
                'a.sep-cite-link:hover {',
                '  border-bottom-color: #7ba4ff; text-decoration: none !important;',
                '}',

                // Citation popup
                '#sep-cite-popup {',
                '  position: absolute; z-index: 9999; max-width: 480px; min-width: 280px;',
                '  background: #1a1a1a; border: 1px solid #333; border-radius: 8px;',
                '  padding: 14px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);',
                '  font-size: 13.5px; line-height: 1.65; color: #c0c0c0;',
                '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
                '  pointer-events: none; opacity: 0; transition: opacity 0.15s ease;',
                '}',
                '#sep-cite-popup.visible { opacity: 1; pointer-events: auto; }',
                '#sep-cite-popup a { color: #7ba4ff !important; }',
                '#sep-cite-popup .sep-cite-label {',
                '  font-size: 11px; color: #555; text-transform: uppercase;',
                '  letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 600;',
                '}',

            ].join('\n');
            document.head.appendChild(style);


            // =============================================
            // 1. READING PROGRESS BAR
            // =============================================
            var progressBar = document.createElement('div');
            progressBar.id = 'sep-progress';
            document.body.appendChild(progressBar);


            // =============================================
            // 2. BACK TO TOP BUTTON
            // =============================================
            var topBtn = document.createElement('div');
            topBtn.id = 'sep-top-btn';
            topBtn.innerHTML = '&#8593;';
            topBtn.title = 'Back to top';
            document.body.appendChild(topBtn);

            topBtn.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });


            // =============================================
            // 3. SCROLL HANDLER (progress + back-to-top)
            // =============================================
            var ticking = false;
            window.addEventListener('scroll', function () {
                if (ticking) return;
                requestAnimationFrame(function () {
                    var scrollTop = window.pageYOffset;
                    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    progressBar.style.width = progress + '%';

                    if (scrollTop > 600) {
                        topBtn.classList.add('visible');
                    } else {
                        topBtn.classList.remove('visible');
                    }
                    ticking = false;
                });
                ticking = true;
            });


            // =============================================
            // 4. READING TIME ESTIMATE
            // =============================================
            var article = document.getElementById('aueditable') || document.getElementById('article-content');
            if (article) {
                var text = article.innerText || article.textContent || '';
                var words = text.trim().split(/\s+/).length;
                var minutes = Math.ceil(words / 230);

                var badge = document.createElement('div');
                badge.id = 'sep-reading-time';
                badge.textContent = words.toLocaleString() + ' words \u00b7 ~' + minutes + ' min read';

                // Insert after the first h1 or the preamble
                var h1 = article.querySelector('h1') || document.querySelector('.pagetitle');
                var preamble = document.getElementById('preamble');
                var insertTarget = preamble || h1;
                if (insertTarget && insertTarget.parentNode) {
                    insertTarget.parentNode.insertBefore(badge, insertTarget.nextSibling);
                }
            }


            // =============================================
            // 5. FOOTNOTE HOVER PREVIEWS
            // =============================================
            var footnotePopup = document.createElement('div');
            footnotePopup.id = 'sep-footnote-popup';
            document.body.appendChild(footnotePopup);

            var hideFootnoteTimeout = null;

            document.addEventListener('mouseover', function (e) {
                var link = e.target.closest('a[href^="#note-"]') || e.target.closest('sup a[href^="#"]');
                if (!link) return;

                var href = link.getAttribute('href');
                if (!href || href.charAt(0) !== '#') return;

                var targetId = href.slice(1);
                var targetEl = document.getElementById(targetId);
                if (!targetEl) return;

                clearTimeout(hideFootnoteTimeout);

                // Get the footnote content
                var content = targetEl.innerHTML;
                if (!content || content.length < 5) return;

                footnotePopup.innerHTML = content;

                // Position above the link
                var rect = link.getBoundingClientRect();
                var popupWidth = 420;
                var left = rect.left + window.pageXOffset;
                if (left + popupWidth > window.innerWidth - 20) {
                    left = window.innerWidth - popupWidth - 20;
                }
                if (left < 10) left = 10;

                footnotePopup.style.left = left + 'px';
                footnotePopup.style.top = (rect.top + window.pageYOffset - 10) + 'px';
                footnotePopup.classList.add('visible');

                // Adjust upward after render so it appears above
                requestAnimationFrame(function () {
                    var popupHeight = footnotePopup.offsetHeight;
                    footnotePopup.style.top = (rect.top + window.pageYOffset - popupHeight - 8) + 'px';
                });
            });

            document.addEventListener('mouseout', function (e) {
                var link = e.target.closest('a[href^="#note-"]') || e.target.closest('sup a[href^="#"]');
                if (!link) return;

                hideFootnoteTimeout = setTimeout(function () {
                    footnotePopup.classList.remove('visible');
                }, 200);
            });

            // Keep popup alive if mouse enters it
            footnotePopup.addEventListener('mouseover', function () {
                clearTimeout(hideFootnoteTimeout);
            });
            footnotePopup.addEventListener('mouseout', function () {
                hideFootnoteTimeout = setTimeout(function () {
                    footnotePopup.classList.remove('visible');
                }, 200);
            });


            // =============================================
            // 6. SECTION ANCHOR LINKS (click to copy)
            // =============================================
            var headings = document.querySelectorAll('#aueditable h2[id], #aueditable h3[id], #article-content h2[id], #article-content h3[id]');
            for (var i = 0; i < headings.length; i++) {
                var h = headings[i];
                var anchor = document.createElement('a');
                anchor.className = 'sep-anchor-link';
                anchor.href = '#' + h.id;
                anchor.textContent = '\u00b6';
                anchor.title = 'Copy link to section';
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    var url = window.location.origin + window.location.pathname + this.getAttribute('href');
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(url);
                    }
                    // Visual feedback
                    var orig = this.textContent;
                    this.textContent = '\u2713';
                    this.style.color = '#7ba4ff';
                    var self = this;
                    setTimeout(function () { self.textContent = orig; self.style.color = ''; }, 1200);
                });
                h.appendChild(anchor);
            }


            // =============================================
            // 7. CITATION LINKING & POPUPS
            // =============================================

            // Step 1: Index the bibliography entries
            // SEP bib entries are typically <li> or <p> elements inside the bibliography section
            var bibEntries = {}; // keyed by "Author Year" e.g. "Clark 2008a"

            var bibSection = null;
            var allH2s = document.querySelectorAll('h2');
            for (var bh = 0; bh < allH2s.length; bh++) {
                var txt = allH2s[bh].textContent.trim().toLowerCase();
                if (txt === 'bibliography' || txt === 'references' || txt.indexOf('bibliography') === 0 || txt.indexOf('references') === 0) {
                    bibSection = allH2s[bh];
                    break;
                }
            }

            if (bibSection) {
                // Collect all elements between bib heading and next h2
                var bibEls = [];
                var nxt = bibSection.nextElementSibling;
                while (nxt && nxt.tagName !== 'H2') {
                    // Collect <li> inside <ul>/<ol>, or direct <p> elements
                    if (nxt.tagName === 'UL' || nxt.tagName === 'OL') {
                        var items = nxt.querySelectorAll('li');
                        for (var li = 0; li < items.length; li++) bibEls.push(items[li]);
                    } else if (nxt.tagName === 'P' || nxt.tagName === 'LI') {
                        bibEls.push(nxt);
                    } else if (nxt.tagName === 'DL') {
                        var dds = nxt.querySelectorAll('dd, dt');
                        for (var dd = 0; dd < dds.length; dd++) bibEls.push(dds[dd]);
                    }
                    // Also collect from subsection h3 blocks
                    if (nxt.tagName === 'H3') {
                        // skip, keep going
                    }
                    nxt = nxt.nextElementSibling;
                }

                // Parse each bib entry to extract author-year keys
                // Typical patterns: "Clark, A., 2008a, ..." or "Menary, R. (ed.), 2007, ..."
                for (var be = 0; be < bibEls.length; be++) {
                    var el = bibEls[be];
                    var elText = el.textContent || '';

                    // Try to extract: LastName ... Year
                    // Match patterns like "Clark, A., 2008a" or "van Gelder, T., 1995"
                    var bibMatch = elText.match(/^([A-Z\u00C0-\u024F][a-z\u00C0-\u024F''\-]+(?:\s+(?:van|de|von|du|le|la|el|al|del|der|den|dos|das|di)\s+[A-Z][a-z''\-]+)?)[^0-9]*?((?:19|20)\d{2}[a-z]?)/);
                    if (bibMatch) {
                        var authorLast = bibMatch[1].trim();
                        var year = bibMatch[2].trim();
                        var key = authorLast + ' ' + year;
                        bibEntries[key] = {
                            element: el,
                            html: el.innerHTML,
                            text: elText.trim()
                        };

                        // Also store without the letter suffix for fuzzy matching
                        // e.g. "Clark 2008" matches "Clark 2008a"
                        var yearBase = year.replace(/[a-z]$/, '');
                        if (yearBase !== year) {
                            // Don't overwrite if base already exists
                            if (!bibEntries[authorLast + ' ' + yearBase]) {
                                bibEntries[authorLast + ' ' + yearBase] = bibEntries[key];
                            }
                        }
                    }
                }
            }

            // Step 2: Find and linkify citations in the article body
            // Patterns to match:
            //   Author (Year)          -> Clark (2008a)
            //   Author Year            -> Clark 2008a (inside parentheses context)
            //   (Author Year)          -> (Clark 2008a)
            //   (Author Year, Author Year) -> (Menary 2007, Rowlands 2010)

            var articleBody = document.getElementById('aueditable') || document.getElementById('article-content');
            if (articleBody && Object.keys(bibEntries).length > 0) {

                // Build a regex that matches citation patterns
                // We'll walk text nodes and replace matches with links
                var authorNames = Object.keys(bibEntries).map(function (k) { return k.split(' ')[0]; });
                // Deduplicate
                var uniqueAuthors = [];
                var authorSeen = {};
                for (var an = 0; an < authorNames.length; an++) {
                    if (!authorSeen[authorNames[an]]) {
                        uniqueAuthors.push(authorNames[an]);
                        authorSeen[authorNames[an]] = true;
                    }
                }

                // Escape regex special chars in names
                function escRx(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

                // Build pattern: (AuthorName)\s*[\(,]?\s*(Year[a-z]?)
                var authorPattern = uniqueAuthors.map(escRx).join('|');
                // Match: "Clark (2008a)" or "Clark 2008a" or "Clark, 2008a"
                var citeRegex = new RegExp('(' + authorPattern + ')\\s*(?:\\(\\s*)?((?:19|20)\\d{2}[a-z]?)(?:\\s*\\))?', 'g');

                // Walk all text nodes in the article, but NOT inside the bibliography, links, or headings
                function walkTextNodes(root, callback) {
                    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                        acceptNode: function (node) {
                            var p = node.parentElement;
                            if (!p) return NodeFilter.FILTER_REJECT;
                            // Skip if inside a link, heading, script, style, or the bib section itself
                            if (p.closest('a, h1, h2, h3, h4, h5, h6, script, style, #sep-reading-time')) return NodeFilter.FILTER_REJECT;
                            if (bibSection && bibSection.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) {
                                // Check if node is inside bib section
                                var bibNext = bibSection.nextElementSibling;
                                var isInBib = false;
                                var nodeParent = node.parentElement;
                                while (nodeParent) {
                                    if (bibEls && bibEls.indexOf(nodeParent) !== -1) { isInBib = true; break; }
                                    nodeParent = nodeParent.parentElement;
                                }
                                if (isInBib) return NodeFilter.FILTER_REJECT;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    });

                    var nodes = [];
                    while (walker.nextNode()) nodes.push(walker.currentNode);
                    // Process in reverse to preserve indices
                    for (var ni = nodes.length - 1; ni >= 0; ni--) {
                        callback(nodes[ni]);
                    }
                }

                walkTextNodes(articleBody, function (textNode) {
                    var text = textNode.textContent;
                    citeRegex.lastIndex = 0;
                    var match;
                    var parts = [];
                    var lastIdx = 0;

                    while ((match = citeRegex.exec(text)) !== null) {
                        var author = match[1];
                        var year = match[2];
                        var key = author + ' ' + year;

                        // Check if this citation exists in bibliography
                        var entry = bibEntries[key];
                        if (!entry) {
                            // Try without letter suffix
                            var baseKey = author + ' ' + year.replace(/[a-z]$/, '');
                            entry = bibEntries[baseKey];
                        }
                        if (!entry) continue;

                        // We have a match
                        if (match.index > lastIdx) {
                            parts.push(document.createTextNode(text.slice(lastIdx, match.index)));
                        }

                        var link = document.createElement('a');
                        link.className = 'sep-cite-link';
                        link.textContent = match[0];
                        link.href = 'javascript:void(0)';
                        link.setAttribute('data-cite-key', key);

                        // Scroll to bib entry on click
                        (function (ent) {
                            link.addEventListener('click', function (e) {
                                e.preventDefault();
                                ent.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Flash highlight
                                ent.element.style.transition = 'background-color 0.3s ease';
                                ent.element.style.backgroundColor = 'rgba(123,164,255,0.15)';
                                ent.element.style.borderRadius = '4px';
                                setTimeout(function () {
                                    ent.element.style.backgroundColor = '';
                                }, 2000);
                            });
                        })(entry);

                        parts.push(link);
                        lastIdx = match.index + match[0].length;
                    }

                    if (parts.length > 0) {
                        if (lastIdx < text.length) {
                            parts.push(document.createTextNode(text.slice(lastIdx)));
                        }
                        var frag = document.createDocumentFragment();
                        for (var pi = 0; pi < parts.length; pi++) frag.appendChild(parts[pi]);
                        textNode.parentNode.replaceChild(frag, textNode);
                    }
                });
            }

            // Citation popup on hover
            var citePopup = document.createElement('div');
            citePopup.id = 'sep-cite-popup';
            document.body.appendChild(citePopup);

            var hideCiteTimeout = null;

            document.addEventListener('mouseover', function (e) {
                var link = e.target.closest('a.sep-cite-link');
                if (!link) return;

                var key = link.getAttribute('data-cite-key');
                var entry = bibEntries[key];
                if (!entry) {
                    // Try base key
                    var baseKey = key.replace(/[a-z]$/, '');
                    entry = bibEntries[baseKey];
                }
                if (!entry) return;

                clearTimeout(hideCiteTimeout);

                citePopup.innerHTML = '<div class="sep-cite-label">Bibliography</div>' + entry.html;

                var rect = link.getBoundingClientRect();
                var popupWidth = 480;
                var left = rect.left + window.pageXOffset;
                if (left + popupWidth > window.innerWidth - 20) left = window.innerWidth - popupWidth - 20;
                if (left < 10) left = 10;

                citePopup.style.left = left + 'px';
                citePopup.style.top = (rect.top + window.pageYOffset - 10) + 'px';
                citePopup.classList.add('visible');

                requestAnimationFrame(function () {
                    var h = citePopup.offsetHeight;
                    var proposedTop = rect.top + window.pageYOffset - h - 8;
                    // If it would go above viewport, show below instead
                    if (proposedTop < window.pageYOffset + 10) {
                        citePopup.style.top = (rect.bottom + window.pageYOffset + 8) + 'px';
                    } else {
                        citePopup.style.top = proposedTop + 'px';
                    }
                });
            });

            document.addEventListener('mouseout', function (e) {
                var link = e.target.closest('a.sep-cite-link');
                if (!link) return;
                hideCiteTimeout = setTimeout(function () {
                    citePopup.classList.remove('visible');
                }, 200);
            });

            citePopup.addEventListener('mouseover', function () { clearTimeout(hideCiteTimeout); });
            citePopup.addEventListener('mouseout', function () {
                hideCiteTimeout = setTimeout(function () { citePopup.classList.remove('visible'); }, 200);
            });


            // =============================================
            // 8. KEYBOARD NAVIGATION
            // =============================================
            var allSections = [];
            var sectionHeadings = document.querySelectorAll('#aueditable h2[id], #aueditable h3[id], #article-content h2[id], #article-content h3[id]');
            for (var s = 0; s < sectionHeadings.length; s++) {
                allSections.push(sectionHeadings[s]);
            }

            var kbHint = document.createElement('div');
            kbHint.id = 'sep-kb-hint';
            kbHint.innerHTML = '<kbd>j</kbd> next section &nbsp; <kbd>k</kbd> prev section &nbsp; <kbd>t</kbd> top';
            document.body.appendChild(kbHint);

            // Show hint briefly on first visit
            setTimeout(function () { kbHint.classList.add('visible'); }, 2000);
            setTimeout(function () { kbHint.classList.remove('visible'); }, 7000);

            document.addEventListener('keydown', function (e) {
                // Don't intercept when typing in inputs
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

                if (e.key === 'j' || e.key === 'k') {
                    e.preventDefault();
                    var scrollY = window.pageYOffset + 100;
                    var currentIdx = -1;

                    for (var idx = allSections.length - 1; idx >= 0; idx--) {
                        if (allSections[idx].getBoundingClientRect().top + window.pageYOffset <= scrollY) {
                            currentIdx = idx;
                            break;
                        }
                    }

                    var nextIdx;
                    if (e.key === 'j') {
                        nextIdx = Math.min(currentIdx + 1, allSections.length - 1);
                    } else {
                        nextIdx = Math.max(currentIdx - 1, 0);
                    }

                    if (allSections[nextIdx]) {
                        allSections[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }

                if (e.key === 't') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });


            // =============================================
            // 9. ENHANCE BIBLIOGRAPHY — collapsible
            // =============================================
            var bibH2 = null;
            var allH2 = document.querySelectorAll('h2');
            for (var b = 0; b < allH2.length; b++) {
                var hText = allH2[b].textContent.trim().toLowerCase();
                if (hText === 'bibliography' || hText === 'references') {
                    bibH2 = allH2[b];
                    break;
                }
            }

            if (bibH2) {
                var toggleBtn = document.createElement('span');
                toggleBtn.textContent = ' [collapse]';
                toggleBtn.style.cssText = 'font-size: 12px; color: #666; cursor: pointer; font-weight: 400; font-family: -apple-system, sans-serif; margin-left: 8px;';
                bibH2.appendChild(toggleBtn);

                var bibSiblings = [];
                var next = bibH2.nextElementSibling;
                while (next && next.tagName !== 'H2') {
                    bibSiblings.push(next);
                    next = next.nextElementSibling;
                }

                var bibCollapsed = false;
                toggleBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    bibCollapsed = !bibCollapsed;
                    for (var bs = 0; bs < bibSiblings.length; bs++) {
                        bibSiblings[bs].style.display = bibCollapsed ? 'none' : '';
                    }
                    toggleBtn.textContent = bibCollapsed ? ' [expand]' : ' [collapse]';
                });
            }


        }, 1500);
    });

} + ')()';
document.documentElement.appendChild(script);