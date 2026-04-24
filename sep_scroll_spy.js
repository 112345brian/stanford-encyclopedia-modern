// ==UserScript==
// @name         SEP TOC Scroll Spy
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Highlights active section in sidebar TOC on SEP articles
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
    window.addEventListener("load", function () {
        setTimeout(function () {
            var toc = document.getElementById("toc");
            if (!toc) return;
            var tocLinks = toc.querySelectorAll('a[href^="#"]');
            var sections = [];
            for (var i = 0; i < tocLinks.length; i++) {
                var id = tocLinks[i].getAttribute("href").slice(1);
                var t = document.getElementById(id);
                if (t) sections.push({ target: t, link: tocLinks[i] });
            }
            if (!sections.length) return;
            var style = document.createElement("style");
            style.textContent = "#toc a.toc-active{color:#7ba4ff !important;font-weight:600 !important;border-left:2px solid #7ba4ff;padding-left:6px;margin-left:-8px;}";
            document.head.appendChild(style);
            var hw = document.getElementById("header-wrapper");
            var ticking = false;
            function update() {
                var scrollY = window.pageYOffset;
                if (hw) {
                    var desiredTop = Math.max(10, hw.getBoundingClientRect().bottom + 10);
                    toc.style.setProperty("top", desiredTop + "px", "important");
                    toc.style.setProperty("max-height", "calc(100vh - " + (desiredTop + 20) + "px)", "important");
                }
                var checkY = scrollY + 200;
                var current = null;
                for (var j = sections.length - 1; j >= 0; j--) {
                    var r = sections[j].target.getBoundingClientRect();
                    if (r.top + scrollY <= checkY) { current = sections[j]; break; }
                }
                if (!current && sections.length) current = sections[0];
                for (var k = 0; k < tocLinks.length; k++) tocLinks[k].classList.remove("toc-active");
                if (current) {
                    current.link.classList.add("toc-active");
                    var tr = toc.getBoundingClientRect();
                    var lr = current.link.getBoundingClientRect();
                    if (lr.top < tr.top + 10 || lr.bottom > tr.bottom - 10)
                        current.link.scrollIntoView({ block: "nearest", behavior: "smooth" });
                }
                ticking = false;
            }
            window.addEventListener("scroll", function () {
                if (!ticking) { requestAnimationFrame(update); ticking = true; }
            });
            // Run immediately and a few more times to catch layout shifts
            update();
            setTimeout(update, 100);
            setTimeout(update, 500);
            setTimeout(update, 1000);
        }, 1500);
    });
} + ')()';
document.documentElement.appendChild(script);