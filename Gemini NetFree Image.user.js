// ==UserScript==
// @name         Gemini NetFree Image
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  מונע הורדת תמונות חסומות מג'מיני בנטפרי, מפענח שרתי הפניה, משחרר את ה-UI של ג'מיני ומוסיף כפתורי הורדה מעוצבים
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

    // --- 1. חלק א': יירוט ההורדה בג'מיני ---
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

                // ניקוי ושחרור ה-UI של ג'מיני מקיפאון (בלי ריענון דף)
                setTimeout(() => {
                    // 1. סגירת חלונית ההתראה של ההורדה
                    const closeBtn = document.querySelector('gem-icon-button[data-test-id="close-button"] button');
                    if (closeBtn) closeBtn.click();

                    // 2. שחרור חסימת כפתורי ההורדה שנותרו קפואים
                    const downloadButtons = document.querySelectorAll('gem-icon-button[data-test-id="download-generated-image-button"]');
                    downloadButtons.forEach(btnHost => {
                        btnHost.classList.remove('gem-button-disabled');
                        const innerBtn = btnHost.querySelector('button');
                        if (innerBtn) {
                            innerBtn.removeAttribute('disabled');
                            innerBtn.classList.remove('mat-mdc-button-disabled');
                        }
                    });
                }, 1500); // ממתינים מעט כדי לאפשר לג'מיני לסיים להציג את האלמנטים לפני שננקה אותם

                // מניעת המשך ההורדה האוטומטית של קובץ תמונת החסימה למחשב
                return new Promise(() => {});
            }

            return originalFetch.apply(this, args);
        };
    }

    // --- 2. חלק ב': הזרקת כפתורי הורדה והעתקה בדף התמונה המלאה ---
    if (hostname.includes('lh3.google')) {
        window.addEventListener('DOMContentLoaded', () => {
            // וידוא שאנו נמצאים בדף המציג תמונה בלבד
            const img = document.querySelector('img');
            if (!img) return;

            injectControlButtons(img.src);
        });
    }

    function injectControlButtons(imgUrl) {
        // יצירת אלמנט סגנון מודרני ומינימליסטי
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
            /* עיצוב הטולטיפ שמופיע בריחוף */
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
                direction: rtl;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .netfree-btn:hover::after {
                opacity: 1;
                transform: translateX(-50%) scale(1);
            }
        `;
        document.head.appendChild(style);

        // יצירת תיבת הבקרה
        const container = document.createElement('div');
        container.className = 'netfree-img-controls';

        // כפתור העתקה
        const copyBtn = document.createElement('button');
        copyBtn.className = 'netfree-btn';
        copyBtn.setAttribute('data-tooltip', 'העתקת תמונה');
        copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;

        // כפתור הורדה
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'netfree-btn';
        downloadBtn.setAttribute('data-tooltip', 'הורדת תמונה');
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        `;

        // לוגיקת העתקת קובץ התמונה ללוח (Clipboard)
        copyBtn.addEventListener('click', async () => {
            try {
                copyBtn.setAttribute('data-tooltip', 'מעתיק...');
                const response = await fetch(imgUrl);
                const blob = await response.blob();

                // שימוש ב-Clipboard API להעתקת קובץ התמונה עצמו (ולא רק הקישור)
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);

                copyBtn.setAttribute('data-tooltip', 'הועתק בהצלחה!');
                setTimeout(() => copyBtn.setAttribute('data-tooltip', 'העתקת תמונה'), 2000);
            } catch (err) {
                console.warn('CORS or Clipboard restrictions. Copying URL instead.', err);
                navigator.clipboard.writeText(imgUrl);
                copyBtn.setAttribute('data-tooltip', 'הקישור הועתק!');
                setTimeout(() => copyBtn.setAttribute('data-tooltip', 'העתקת תמונה'), 2000);
            }
        });

        // לוגיקת הורדת קובץ התמונה
        downloadBtn.addEventListener('click', async () => {
            try {
                downloadBtn.setAttribute('data-tooltip', 'מוריד...');
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

                downloadBtn.setAttribute('data-tooltip', 'הורדה הושלמה!');
                setTimeout(() => downloadBtn.setAttribute('data-tooltip', 'הורדת תמונה'), 2000);
            } catch (err) {
                console.error('Download failed', err);
                // גיבוי למקרה שהורדת ה-Blob נכשלה
                window.location.href = imgUrl.replace('=s0', '=s0-d');
            }
        });

        container.appendChild(copyBtn);
        container.appendChild(downloadBtn);
        document.body.appendChild(container);
    }
})();
