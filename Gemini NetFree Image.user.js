// ==UserScript==
// @name         Gemini NetFree Image
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  מונע הורדת תמונות חסומות בנטפרי, מוסיף תמיכה דו-לשונית (עברית/אנגלית) וכפתורי הורדה מעוצבים
// @author       לאצי&AI
// @match        https://gemini.google.com/*
// @match        https://lh3.googleusercontent.com/*
// @match        https://lh3.google.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const hostname = window.location.hostname;
    const isHebrew = navigator.language.startsWith('he');

    // --- 1. חלק א': יירוט ההורדה בג'מיני ושינוי ההודעה הקופצת ---
    if (hostname.includes('gemini.google.com')) {
        const originalFetch = window.fetch;

        window.fetch = async function(...args) {
            const request = args[0];
            const url = typeof request === 'string' ? request : (request instanceof Request ? request.url : '');

            // זיהוי בקשת ההורדה של התמונה
            if (url && (url.includes('lh3.google.com') || url.includes('lh3.googleusercontent.com')) && url.match(/=s0-d(-I)?/)) {
                console.log('NetFree Script: Intercepted image download request:', url);

                try {
                    // ביצוע הבקשה המקורית לקבלת תוכן ההפניה
                    const response = await originalFetch.apply(this, args);
                    const text = await response.text();

                    if (text && text.startsWith('http')) {
                        const finalViewUrl = text.replace(/=s0-d(-I)?/, '=s0');
                        window.open(finalViewUrl, '_blank');
                    } else {
                        const directViewUrl = url.replace(/=s0-d(-I)?/, '=s0');
                        window.open(directViewUrl, '_blank');
                    }
                } catch (e) {
                    console.error('NetFree Script: Error processing URL', e);
                }

                // הפעלת תצפיתן (Observer) שיתפוס את הודעת השגיאה ויעצב אותה מחדש
                overrideNextSnackbar();

                // דחיית ההבטחה (משחרר את כפתור ההורדה ומפעיל את הודעת השגיאה שתכף נשנה)
                return Promise.reject(new Error('NetFree Script: Aborting fetch to trigger Gemini UI reset.'));
            }

            return originalFetch.apply(this, args);
        };
    }

    function overrideNextSnackbar() {
        const successMsg = isHebrew ? 'התמונה המקורית נפתחה בכרטיסייה חדשה.' : 'Original image opened in a new tab.';

        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // אם זה אלמנט HTML
                        const label = node.classList.contains('mat-mdc-snack-bar-label') ? node : node.querySelector('.mat-mdc-snack-bar-label');

                        // מחפשים את ההודעה הרלוונטית
                        if (label && label.textContent && (label.textContent.includes('בעיה') || label.textContent.includes('error') || label.textContent.includes('problem'))) {

                            // 1. שינוי הטקסט
                            label.textContent = successMsg;

                            // 2. תיקון העיצוב (החזרת ה"נפח" והפונט של גוגל)
                            label.style.fontFamily = '"Google Sans", "Segoe UI", system-ui, sans-serif';
                            label.style.fontSize = '14px';
                            label.style.lineHeight = '20px';
                            label.style.fontWeight = '400';
                            label.style.padding = '14px 16px';

                            // תיקון הקונטיינר העוטף אם קיים, כדי שהגובה יהיה תקין
                            const container = label.closest('.container') || label.parentElement;
                            if (container) {
                                container.style.minHeight = '48px';
                                container.style.display = 'flex';
                                container.style.alignItems = 'center';
                            }

                            observer.disconnect(); // עוצרים את התצפיתן
                            return;
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        // כיבוי בטיחותי אחרי 5 שניות
        setTimeout(() => observer.disconnect(), 5000);
    }

    // --- 2. חלק ב': טיפול בשרשראות הפניה והזרקת כפתורי ההורדה ---
    if (hostname.includes('lh3.google')) {
        const initImagePage = () => {
            // טיפול בשרשרת ההפניות של גוגל (טקסט במקום תמונה)
            if (document.contentType === 'text/plain') {
                const textContent = document.body.innerText.trim();
                if (textContent.startsWith('http://') || textContent.startsWith('https://')) {
                    const nextHopUrl = textContent.replace(/=s0-d(-I)?/, '=s0');
                    window.location.replace(nextHopUrl);
                    return;
                }
            }

            // חיפוש אגרסיבי של התמונה להזרקת הכפתורים בדפדפן כרום
            const checkImgInterval = setInterval(() => {
                // אם הכפתורים כבר קיימים, מפסיקים לחפש
                if (document.querySelector('.netfree-img-controls')) {
                    clearInterval(checkImgInterval);
                    return;
                }

                const img = document.querySelector('img');
                if (img && img.src && document.body) {
                    clearInterval(checkImgInterval);
                    injectControlButtons(img.src);
                }
            }, 50);

            // הפסקת החיפוש אחרי 5 שניות (מונע ריצה אינסופית במקרה של שגיאה)
            setTimeout(() => clearInterval(checkImgInterval), 5000);
        };

        // הפעלה בטוחה בהתאם למצב טעינת ה-DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initImagePage);
        } else {
            initImagePage();
        }
    }

    function injectControlButtons(imgUrl) {
        const i18n = {
            copyDefault: isHebrew ? 'העתקת תמונה' : 'Copy Image',
            copying: isHebrew ? 'מעתיק...' : 'Copying...',
            copySuccess: isHebrew ? 'הועתק בהצלחה!' : 'Copied successfully!',
            copyFallback: isHebrew ? 'הקישור הועתק!' : 'URL copied!',
            downloadDefault: isHebrew ? 'הורדת תמונה' : 'Download Image',
            downloading: isHebrew ? 'מוריד...' : 'Downloading...',
            downloadSuccess: isHebrew ? 'הורדה הושלמה!' : 'Download complete!'
        };

        const style = document.createElement('style');
        style.textContent = `
            .netfree-img-controls {
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 12px;
                z-index: 999999;
                background: rgba(15, 15, 15, 0.65);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                padding: 8px;
                border-radius: 50px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                font-family: system-ui, -apple-system, sans-serif;
            }
            .netfree-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background: transparent;
                color: #f5f5f7;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
                transition: background 0.2s ease, transform 0.1s ease;
            }
            .netfree-btn:hover {
                background: rgba(255, 255, 255, 0.12);
            }
            .netfree-btn:active {
                transform: scale(0.95);
            }
            .netfree-btn::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: -36px;
                left: 50%;
                transform: translateX(-50%) scale(0.85);
                background: rgba(10, 10, 10, 0.9);
                color: #fff;
                padding: 5px 10px;
                border-radius: 6px;
                font-size: 11px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.15s ease, transform 0.15s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
                direction: ${isHebrew ? 'rtl' : 'ltr'};
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .netfree-btn:hover::after {
                opacity: 1;
                transform: translateX(-50%) scale(1);
            }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.className = 'netfree-img-controls';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'netfree-btn';
        copyBtn.setAttribute('data-tooltip', i18n.copyDefault);
        copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'netfree-btn';
        downloadBtn.setAttribute('data-tooltip', i18n.downloadDefault);
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        `;

        copyBtn.addEventListener('click', async () => {
            try {
                copyBtn.setAttribute('data-tooltip', i18n.copying);
                const response = await fetch(imgUrl);
                const blob = await response.blob();

                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);

                copyBtn.setAttribute('data-tooltip', i18n.copySuccess);
                setTimeout(() => copyBtn.setAttribute('data-tooltip', i18n.copyDefault), 2000);
            } catch (err) {
                console.warn('CORS or Clipboard restrictions. Copying URL instead.', err);
                navigator.clipboard.writeText(imgUrl);
                copyBtn.setAttribute('data-tooltip', i18n.copyFallback);
                setTimeout(() => copyBtn.setAttribute('data-tooltip', i18n.copyDefault), 2000);
            }
        });

        downloadBtn.addEventListener('click', async () => {
            try {
                downloadBtn.setAttribute('data-tooltip', i18n.downloading);
                const response = await fetch(imgUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = 'gemini-image.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);

                downloadBtn.setAttribute('data-tooltip', i18n.downloadSuccess);
                setTimeout(() => downloadBtn.setAttribute('data-tooltip', i18n.downloadDefault), 2000);
            } catch (err) {
                console.error('Download failed', err);
                window.location.href = imgUrl.replace('=s0', '=s0-d');
            }
        });

        container.appendChild(copyBtn);
        container.appendChild(downloadBtn);
        document.body.appendChild(container);
    }
})();
