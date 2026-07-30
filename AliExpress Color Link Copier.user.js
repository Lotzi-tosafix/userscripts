// ==UserScript==
// @name         AliExpress Color Link Copier
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a button to copy the direct link to the specific selected color/variation on AliExpress. Bilingual (Hebrew/English).
// @author       לאצי@AI
// @match        *://*.aliexpress.com/item/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // משתנה גלובלי לשמירת ה-SKU האחרון שנבחר מתוך האזנה לרשת
    window.__ae_intercepted_sku_id = null;

    // האזנה לבקשות רשת (XHR) כדי לתפוס את ה-skuId בזמן אמת (כשלוחצים על צבע)
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        try {
            if (body && typeof body === 'string') {
                const match = body.match(/selectedSkuIds(?:%22%3A%22|":")(\d+)/);
                if (match && match[1]) {
                    window.__ae_intercepted_sku_id = match[1];
                }
            }
        } catch(e) {}
        return originalSend.apply(this, arguments);
    };

    // זיהוי שפת הדפדפן
    const isHebrew = (navigator.language || navigator.userLanguage).startsWith('he');

    // אייקונים מודרניים ב-SVG
    const svgCopy = `<svg style="width: 14px; height: 14px; margin-inline-end: 6px; fill: currentColor;" viewBox="0 0 24 24"><path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const svgSuccess = `<svg style="width: 14px; height: 14px; margin-inline-end: 6px; fill: currentColor;" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;

    const lang = isHebrew ? {
        btnText: `${svgCopy} העתק קישור לצבע`,
        success: `${svgSuccess} הועתק בהצלחה!`,
        error: 'אנא בחר/י צבע תחילה או לחץ/י עליו שוב',
        fallback: 'הדפדפן חסם העתקה, אנא העתק מכאן:'
    } : {
        btnText: `${svgCopy} Copy Color Link`,
        success: `${svgSuccess} Copied!`,
        error: 'Please select a color first, or click it again.',
        fallback: 'Copy link from here:'
    };

    function getSkuId() {
        // 1. בדיקה אם תפסנו לחיצה הרגע מפעולת המשתמש
        if (window.__ae_intercepted_sku_id) {
            return window.__ae_intercepted_sku_id;
        }

        // 2. בדיקה מתוך כתובת האתר (לפעמים עליאקספרס טוענים את זה כ-skuId או כ-sku_id)
        const urlParams = new URLSearchParams(window.location.search);
        const skuFromUrl = urlParams.get('skuId') || urlParams.get('sku_id');
        if (skuFromUrl) return skuFromUrl;

        const pdpExtF = urlParams.get('pdp_ext_f');
        if (pdpExtF) {
            try {
                const parsed = JSON.parse(pdpExtF);
                if (parsed.sku_id) return parsed.sku_id;
            } catch(e) {}
        }

        // 3. חילוץ מתוך ה-HTML והמשתנים הגלובליים של עליאקספרס בעת טעינה ראשונית
        try {
            const selectedEls = document.querySelectorAll('div[class*="sku-item--selected"][data-sku-col]');
            if (selectedEls.length > 0) {
                 // המרה של המזהה (עליאקספרס משתמשת בקו מפריד באלמנט ובנקודתיים בדאטה: "14-173" -> "14:173")
                 const selectedProps = Array.from(selectedEls).map(el => el.getAttribute('data-sku-col').replace(/-/g, ':'));

                 // משיכת טבלת ה-SKUs מהזיכרון של עליאקספרס
                 let skuList = null;
                 if (typeof unsafeWindow !== 'undefined' && unsafeWindow.runParams && unsafeWindow.runParams.data) {
                     skuList = unsafeWindow.runParams.data.skuModule?.skuPriceList;
                 }

                 // אם המידע לא ב-unsafeWindow, נסרוק את ה-HTML כמפלט אחרון
                 if (!skuList) {
                     const match = document.documentElement.innerHTML.match(/"skuPriceList":(\[\{.+?\}\])/);
                     if (match && match[1]) {
                         skuList = JSON.parse(match[1]);
                     }
                 }

                 // חיפוש ה-SKU הספציפי שמתאים בדיוק לתכונות הצבע/מידה המסומנות כרגע
                 if (skuList && Array.isArray(skuList)) {
                     for (let item of skuList) {
                         if (!item.skuPropIds) continue;
                         const propsArray = item.skuPropIds.split(',');
                         const isExactMatch = selectedProps.every(p => propsArray.includes(p)) && propsArray.length === selectedProps.length;
                         if (isExactMatch) return item.skuId;
                     }
                 }
            }
        } catch(e) {
            console.error("AE Copier Error:", e);
        }

        return null;
    }

    function injectButton() {
        if (document.getElementById('ae-clean-link-btn')) return;

        const titleDiv = document.querySelector('div[class*="sku-item--title"]');
        if (!titleDiv) return;

        const btn = document.createElement('button');
        btn.id = 'ae-clean-link-btn';
        btn.innerHTML = lang.btnText;

        btn.style.cssText = `
            margin-inline-start: 12px;
            padding: 4px 10px;
            background: #ff4747;
            color: #fff;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
        `;

        btn.onmouseenter = () => btn.style.background = '#e02e2e';
        btn.onmouseleave = () => btn.style.background = '#ff4747';

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const skuId = getSkuId();
            if (!skuId) {
                alert(lang.error);
                return;
            }

            const itemIdMatch = window.location.pathname.match(/item\/(\d+)\.html/);
            if (!itemIdMatch) return;
            const itemId = itemIdMatch[1];

            const cleanUrl = `https://www.aliexpress.com/item/${itemId}.html?pdp_ext_f=%7B%22sku_id%22%3A%22${skuId}%22%7D`;

            navigator.clipboard.writeText(cleanUrl).then(() => {
                const originalText = lang.btnText;
                btn.innerHTML = lang.success;
                btn.style.background = '#009966'; // צבע ירוק להצלחה

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '#ff4747';
                }, 2000);
            }).catch(() => {
                prompt(lang.fallback, cleanUrl);
            });
        };

        titleDiv.appendChild(btn);
    }

    const observer = new MutationObserver(() => injectButton());

    window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
        injectButton();
    });

})();
