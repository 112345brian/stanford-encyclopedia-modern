# Citation Linker

The citation linker (`sep_modern_companion.js` §7) scans the article body for in-text citations and links them to their bibliography entries, with a hover popup showing the full entry.

## How it works

**Phase 1 — index the bibliography.** The code walks elements between the `<h2>Bibliography</h2>` heading and the next `<h2>`, collecting `<li>`, `<p>`, `<dd>`, and `<dt>` elements. For each entry it runs a regex against the text content to extract the first author's last name and publication year, then stores them in `bibEntries` keyed as `"LastName YYYY"` or `"LastName YYYYa"`.

**Phase 2 — linkify citations in the body.** A `TreeWalker` visits every text node in the article body (skipping links, headings, the bib section itself, and the reading-time badge). For each text node, a global regex built from the indexed author names matches patterns like `Clark (2008a)`, `Clark 2008a`, or `Clark, 2008a`. Matched text is wrapped in `<a class="sep-cite-link">` elements that scroll to and flash the target bibliography entry on click.

## Edge cases

**Co-authors.** The first-author regex only captures the leading surname. After indexing the primary key, a second pass with `/\band\s+([A-Z][a-z'-]+)/g` picks up additional authors from the same entry (e.g. "Chalmers" from "Clark, A. and Chalmers, D., 1998") and stores them as aliases pointing to the same entry object.

**Lettered years.** Entries like "Clark 2008a" also register a base key "Clark 2008" for citations that omit the letter suffix. If two entries share the same base year (e.g. both 2008a and 2008b exist for the same author), the base key is deleted — a bare "Clark 2008" citation stays unlinked rather than resolving to the wrong entry.

**Cross-document footnotes.** Footnote links pointing to a separate `notes.html` page are fetched once per unique URL, parsed with `DOMParser`, and cached as a Promise so only one network request is ever made per notes page. The hover token guard (`footnoteHoverToken`) cancels stale async results if the user moves away before the fetch completes.

**Bib section exclusion.** The `TreeWalker` filter checks every text node's ancestor chain against the set of collected bib elements (`bibElSet`). Processing is done in reverse DOM order so that `replaceChild` calls on earlier siblings don't invalidate references to later ones in the same parent.
