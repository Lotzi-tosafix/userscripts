// ==UserScript==
// @name         GitHub Friendly Downloads
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  הופך את דף ההורדות של GitHub לידידותי, נקי וברור – בעברית מלאה!
// @author       לאצי@ai
// @match        https://github.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- הגדרות עיצוב (CSS) ---
    const STYLES = `
        /* --- 1. הגדרות ברירת מחדל (בהיר) --- */
        /* מוגדרות ישירות על הקונטיינר למניעת התנגשויות */
        .gfd-container {
            --gfd-bg: #ffffff;
            --gfd-border: #d0d7de;
            --gfd-text-main: #24292f;
            --gfd-text-muted: #57606a;
            --gfd-primary: #0969da;
            --gfd-success: #2da44e;
            --gfd-success-hover: #2c974b;
            --gfd-bg-subtle: #f6f8fa;
            --gfd-shadow: 0 3px 6px rgba(140, 149, 159, 0.15);
            --gfd-radius: 6px;
        }

        /* --- 2. תיקון: תמיכה במצב כהה של המערכת (System Preference) --- */
        /* זה יחול אוטומטית אם המחשב/דפדפן מוגדר לכהה */
        @media (prefers-color-scheme: dark) {
            .gfd-container {
                --gfd-bg: #0d1117;
                --gfd-border: #30363d;
                --gfd-text-main: #c9d1d9;
                --gfd-text-muted: #8b949e;
                --gfd-primary: #58a6ff;
                --gfd-success: #238636;
                --gfd-success-hover: #2ea043;
                --gfd-bg-subtle: #161b22;
            }

            /* צבעי תגיות במצב כהה של מערכת */
            .gfd-tag.type-install { background: rgba(46,160,67,0.15); color: #3fb950; }
            .gfd-tag.type-portable { background: rgba(56,139,253,0.15); color: #58a6ff; }
            .gfd-tag.type-arch { background: #161b22; color: #8b949e; border-color: #30363d; }
            .gfd-tag.type-cli { background: #c9d1d9; color: #0d1117; }
            .gfd-tag.type-gui { background: rgba(111,66,193,0.4); color: #d2a8ff; }

            .gfd-note-box {
                background: rgba(187,128,9,0.15);
                border-color: rgba(187,128,9,0.4);
                color: #c9d1d9;
            }
        }

        /* --- 3. תמיכה במצב כהה ידני של GitHub (אם המשתמש לחץ על כפתור באתר) --- */
        /* זה מבטיח שאם שינית ידנית באתר לכהה, זה יעבוד גם אם המערכת בהירה */
        [data-color-mode="dark"] .gfd-container,
        [data-dark-theme="dark"] .gfd-container {
            --gfd-bg: #0d1117;
            --gfd-border: #30363d;
            --gfd-text-main: #c9d1d9;
            --gfd-text-muted: #8b949e;
            --gfd-primary: #58a6ff;
            --gfd-success: #238636;
            --gfd-success-hover: #2ea043;
            --gfd-bg-subtle: #161b22;
        }

        /* עדכון תגיות למצב כהה ידני */
        [data-color-mode="dark"] .gfd-tag.type-install, [data-dark-theme="dark"] .gfd-tag.type-install { background: rgba(46,160,67,0.15); color: #3fb950; }
        [data-color-mode="dark"] .gfd-tag.type-portable, [data-dark-theme="dark"] .gfd-tag.type-portable { background: rgba(56,139,253,0.15); color: #58a6ff; }
        [data-color-mode="dark"] .gfd-tag.type-arch, [data-dark-theme="dark"] .gfd-tag.type-arch { background: #161b22; color: #8b949e; border-color: #30363d; }
        [data-color-mode="dark"] .gfd-tag.type-cli, [data-dark-theme="dark"] .gfd-tag.type-cli { background: #c9d1d9; color: #0d1117; }
        [data-color-mode="dark"] .gfd-tag.type-gui, [data-dark-theme="dark"] .gfd-tag.type-gui { background: rgba(111,66,193,0.4); color: #d2a8ff; }
        [data-color-mode="dark"] .gfd-note-box, [data-dark-theme="dark"] .gfd-note-box { background: rgba(187,128,9,0.15); border-color: rgba(187,128,9,0.4); color: #c9d1d9; }

        /* --- שאר העיצוב (מבנה) --- */
        .gfd-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            direction: rtl;
            text-align: right;
            background: var(--gfd-bg);
            border: 1px solid var(--gfd-border);
            border-radius: var(--gfd-radius);
            margin-bottom: 24px;
            overflow: hidden;
            box-shadow: var(--gfd-shadow);
            clear: both;
        }

        .gfd-header {
            background: var(--gfd-bg-subtle);
            padding: 16px;
            border-bottom: 1px solid var(--gfd-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .gfd-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--gfd-text-main);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .gfd-restore-btn {
            font-size: 12px;
            color: var(--gfd-primary);
            cursor: pointer;
            text-decoration: none;
            background: none;
            border: none;
        }
        .gfd-restore-btn:hover { text-decoration: underline; }

        .gfd-content {
            padding: 20px;
        }

        .gfd-section {
            margin-bottom: 24px;
        }
        .gfd-section:last-child { margin-bottom: 0; }

        .gfd-section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--gfd-text-muted);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid var(--gfd-border);
            padding-bottom: 6px;
        }

        .gfd-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
        }

        .gfd-card {
            display: flex;
            flex-direction: column;
            background: var(--gfd-bg);
            border: 1px solid var(--gfd-border);
            border-radius: var(--gfd-radius);
            padding: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
        }

        .gfd-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--gfd-shadow);
            border-color: var(--gfd-primary);
        }

        .gfd-card-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
        }

        .gfd-icon-box {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--gfd-bg-subtle);
            border-radius: 8px;
            color: var(--gfd-text-main);
        }

        .gfd-file-info {
            flex-grow: 1;
            min-width: 0;
        }

        .gfd-filename {
            font-size: 13px;
            font-weight: 600;
            color: var(--gfd-text-main);
            word-break: break-all;
            line-height: 1.4;
            margin-bottom: 6px;
        }

        .gfd-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }

        .gfd-tag {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 500;
            display: inline-block;
        }

        /* ברירת מחדל לתגיות (בהיר) */
        .gfd-tag.type-install { background: #dafbe1; color: #1a7f37; }
        .gfd-tag.type-portable { background: #ddf4ff; color: #0969da; }
        .gfd-tag.type-arch { background: #f6f8fa; color: #57606a; border: 1px solid #d0d7de; }
        .gfd-tag.type-cli { background: #333; color: #fff; }
        .gfd-tag.type-gui { background: #6f42c1; color: #fff; }

        .gfd-meta {
            font-size: 11px;
            color: var(--gfd-text-muted);
            margin-top: auto;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .gfd-download-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 6px 12px;
            background-color: var(--gfd-success);
            color: #fff !important;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
            transition: background-color 0.2s;
            margin-top: 10px;
            text-align: center;
            cursor: pointer;
        }

        .gfd-download-btn:hover {
            background-color: var(--gfd-success-hover);
            text-decoration: none;
        }

        .gfd-download-btn svg {
            fill: currentColor;
        }

        .gfd-original-hidden {
            display: none !important;
        }

        .gfd-note-box {
            background: #fff8c5;
            color: #57606a;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 20px;
            border: 1px solid #d3c893;
        }

        .gfd-load-more-btn {
            display: block;
            width: 100%;
            padding: 12px;
            text-align: center;
            background: var(--gfd-bg-subtle);
            color: var(--gfd-primary);
            font-weight: 600;
            border-top: 1px solid var(--gfd-border);
            cursor: pointer;
            border: none;
            font-size: 14px;
        }
        .gfd-load-more-btn:hover {
            background: var(--gfd-border);
        }

        .gfd-reopen-btn {
            display: block;
            margin: 10px auto;
            padding: 8px 16px;
            background-color: var(--gfd-bg-subtle);
            color: var(--gfd-primary);
            border: 1px solid var(--gfd-border);
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            width: fit-content;
        }
        .gfd-reopen-btn:hover {
            background-color: var(--gfd-border);
            text-decoration: none;
        }
    `;

    // --- אייקונים (SVG) ---
    const ICONS = {
        windows: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20l-9-2V6l9-2z"/><path d="M11 20l-9-2V6l9-2z"/></svg>`,
        android: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="5" x2="19" y2="2"></line><line x1="7.5" y1="5" x2="5" y2="2"></line><rect x="4" y="5" width="16" height="15" rx="2"></rect><line x1="9" y1="12" x2="9" y2="12.01"></line><line x1="15" y1="12" x2="15" y2="12.01"></line></svg>`,
        apple: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 1.44S9.57 5 7.5 5A4.32 4.32 0 0 0 3 9.78c0 4.22 3 12.22 6 12.22 1.25 0 2.5-1.06 4-1.06Z"></path><path d="M10 5a4 4 0 0 1 4-3.8 4 4 0 0 1-4 3.8Z"></path></svg>`,
        linux: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        file: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
        download: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
        zip: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
        code: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
    };

    // --- לוגיקה לזיהוי קבצים ---
    function parseFileInfo(filename) {
        const lower = filename.toLowerCase();
        let info = {
            os: 'other',
            type: 'file',
            arch: '',
            interface: '',
            labelInterface: '',
            isJunk: false,
            labelOS: 'קבצים נוספים',
            labelType: 'קובץ'
        };

        // 1. סינון זבל טכני
        if (lower.endsWith('.asc') || lower.endsWith('.sig') || lower.endsWith('.sha256') || lower.endsWith('.md5') || lower.endsWith('.blockmap') || lower.endsWith('.pdb') || lower.includes('pdbs-')) {
            info.isJunk = true;
            return info;
        }

        // 2. זיהוי מערכת הפעלה
        // -- Windows --
        if (lower.includes('win') || lower.endsWith('.exe') || lower.endsWith('.msi') || lower.endsWith('.msix') || lower.endsWith('.msixbundle') || lower.includes('mingit')) {
            info.os = 'windows'; info.labelOS = 'Windows';
        }
        // -- Android --
        else if (lower.includes('android') || lower.endsWith('.apk')) {
            info.os = 'android'; info.labelOS = 'Android';
        }
        // -- macOS --
        else if (lower.includes('mac') || lower.includes('darwin') || lower.includes('osx') || lower.endsWith('.dmg') || lower.endsWith('.pkg')) {
            info.os = 'mac'; info.labelOS = 'macOS';
        }
        // -- Linux --
        else if (lower.includes('linux') || lower.endsWith('.deb') || lower.endsWith('.rpm') || lower.endsWith('.appimage') || lower.endsWith('.tar.bz2') || lower.endsWith('.tbz2')) {
            info.os = 'linux'; info.labelOS = 'Linux';
        }

        // 3. זיהוי סוג ממשק (CLI / GUI)
        if (lower.includes('cli') || lower.includes('headless') || lower.includes('server') || lower.includes('terminal')) {
            info.interface = 'CLI';
            info.labelInterface = 'שורת פקודה';
        } else if (lower.includes('gui') || lower.includes('desktop') || lower.includes('client') || lower.includes('app')) {
            info.interface = 'GUI';
            info.labelInterface = 'ממשק גרפי';
        }

        // 4. זיהוי סוג קובץ
        // התקנה
        if (lower.endsWith('.exe') || lower.endsWith('.msi') || lower.endsWith('.msix') || lower.endsWith('.msixbundle') || lower.includes('setup') || lower.includes('installer') || lower.endsWith('.deb') || lower.endsWith('.rpm') || lower.endsWith('.apk') || lower.endsWith('.dmg') || lower.endsWith('.pkg')) {
            info.type = 'installer';
            info.labelType = 'התקנה (מומלץ)';
            if (!info.interface) {
                info.interface = 'GUI';
                info.labelInterface = 'ממשק גרפי';
            }
        }
        // נייד
        else if (lower.includes('portable') || lower.endsWith('.zip') || lower.endsWith('.7z') || lower.endsWith('.tar.gz')) {
            info.type = 'portable';
            info.labelType = 'גרסה ניידת';
        }
        // סקריפטים
        else if (lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.py')) {
            info.type = 'script';
            info.labelType = lower.endsWith('.py') ? 'Python' : 'סקריפט';
            info.interface = 'CLI';
            info.labelInterface = 'שורת פקודה';
            if (info.os === 'other' && !lower.endsWith('.py')) {
                info.os = 'linux'; info.labelOS = 'Linux';
            }
        }
        // קוד מקור
        else if (filename.includes('Source code')) {
            info.type = 'source';
            info.labelType = 'קוד מקור';
        }

        // 5. זיהוי ארכיטקטורה
        if (lower.includes('x64') || lower.includes('x86_64') || lower.includes('amd64') || lower.includes('64bit')) {
            info.arch = '64-bit';
        } else if (lower.includes('x86') || lower.includes('32bit') || (lower.includes('win32') && !lower.includes('win32-x64'))) {
            info.arch = '32-bit';
        } else if (lower.includes('arm64') || lower.includes('aarch64')) {
            info.arch = 'ARM64';
        } else if (lower.includes('arm') || lower.includes('armeabi')) {
            info.arch = 'ARM';
        } else if (lower.includes('universal')) {
            info.arch = 'Universal';
        }

        return info;
    }

    function getIconForOS(os, type) {
        if (type === 'source') return ICONS.code;
        if (type === 'script') return ICONS.code;
        if (type === 'portable' && os !== 'android') return ICONS.zip;
        if (os === 'windows') return ICONS.windows;
        if (os === 'android') return ICONS.android;
        if (os === 'mac') return ICONS.apple;
        if (os === 'linux') return ICONS.linux;
        return ICONS.file;
    }

    function cleanSizeText(text) {
        if (!text) return '';
        const match = text.match(/(\d+(\.\d+)?\s*(MB|KB|GB|Bytes))/i);
        return match ? match[0] : '';
    }

    function createCard(fileData) {
        const { name, size, href, parsed } = fileData;

        let tagsHtml = '';
        // תגית CLI/GUI בעברית
        if (parsed.interface === 'CLI') tagsHtml += `<span class="gfd-tag type-cli">${parsed.labelInterface}</span>`;
        if (parsed.interface === 'GUI') tagsHtml += `<span class="gfd-tag type-gui">${parsed.labelInterface}</span>`;

        if (parsed.type === 'installer') tagsHtml += `<span class="gfd-tag type-install">התקנה</span>`;
        if (parsed.type === 'portable') tagsHtml += `<span class="gfd-tag type-portable">נייד</span>`;
        if (parsed.type === 'script') tagsHtml += `<span class="gfd-tag type-arch" style="border-color: #a371f7; color: #a371f7;">${parsed.labelType}</span>`;

        if (parsed.arch) tagsHtml += `<span class="gfd-tag type-arch">${parsed.arch}</span>`;

        const iconSvg = getIconForOS(parsed.os, parsed.type);

        const card = document.createElement('div');
        card.className = 'gfd-card';
        card.innerHTML = `
            <div class="gfd-card-header">
                <div class="gfd-icon-box">${iconSvg}</div>
                <div class="gfd-file-info">
                    <div class="gfd-filename" title="${name}">${name}</div>
                    <div class="gfd-tags">${tagsHtml}</div>
                </div>
            </div>
            <div class="gfd-meta">
                <span>${size}</span>
                <span>${parsed.os === 'other' ? '' : parsed.labelOS}</span>
            </div>
            <a href="${href}" class="gfd-download-btn" rel="nofollow">
                ${ICONS.download} הורד
            </a>
        `;
        return card;
    }

    // --- זיהוי מערכת ההפעלה של המשתמש ---
    function detectUserOS() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) return 'android';
        if (ua.includes('win')) return 'windows';
        if (ua.includes('mac') || ua.includes('iphone') || ua.includes('ipad')) return 'mac';
        if (ua.includes('linux')) return 'linux';
        return 'windows'; // ברירת מחדל אם לא זוהה
    }

    function renderFriendlyUI(assetsContainer) {
        // --- וידוא הזרקת CSS ---
        if (!document.getElementById('gfd-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'gfd-styles';
            styleEl.textContent = STYLES;
            document.head.appendChild(styleEl);
        }

        const nativeTruncateBtn = assetsContainer.querySelector('.js-release-asset-untruncate-btn');

        let container = assetsContainer.parentElement.querySelector('.gfd-container');
        let content;

        if (container) {
            content = container.querySelector('.gfd-content');
            content.innerHTML = '';
        } else {
            container = document.createElement('div');
            container.className = 'gfd-container';

            const header = document.createElement('div');
            header.className = 'gfd-header';
            header.innerHTML = `
                <div class="gfd-title">${ICONS.download} קבצים להורדה</div>
                <button class="gfd-restore-btn">הצג רשימה מקורית</button>
            `;

            content = document.createElement('div');
            content.className = 'gfd-content';

            container.appendChild(header);
            container.appendChild(content);

            assetsContainer.classList.add('gfd-original-hidden');
            assetsContainer.parentElement.insertBefore(container, assetsContainer);

            // --- לוגיקת המעבר בין התצוגות ---
            const restoreBtn = container.querySelector('.gfd-restore-btn');

            restoreBtn.addEventListener('click', () => {
                container.style.display = 'none';
                assetsContainer.classList.remove('gfd-original-hidden');

                if (!assetsContainer.querySelector('.gfd-reopen-btn')) {
                    const reopenBtn = document.createElement('button');
                    reopenBtn.className = 'gfd-reopen-btn';
                    reopenBtn.textContent = 'חזור לתצוגה המעוצבת';
                    reopenBtn.type = 'button';

                    reopenBtn.addEventListener('click', () => {
                        assetsContainer.classList.add('gfd-original-hidden');
                        container.style.display = 'block';
                    });
                    assetsContainer.prepend(reopenBtn);
                }
            });
        }

        const downloadLinks = assetsContainer.querySelectorAll('a[href*="/releases/download/"], a[href*="/archive/"]');
        const files = [];

        downloadLinks.forEach(link => {
            const row = link.closest('li') || link.closest('.Box-row') || link.parentElement;
            if (!row) return;

            if (row.hasAttribute('hidden')) return;

            const nameSpan = link.querySelector('span') || link;
            const name = nameSpan.textContent.trim();
            const href = link.href;
            const size = cleanSizeText(row.textContent);

            files.push({ name, href, size, parsed: parseFileInfo(name) });
        });

        // יצירת קבוצות כולל קבוצה נפרדת לקוד מקור
        const grouped = { windows: [], android: [], mac: [], linux: [], other: [], source: [] };

        files.forEach(f => {
            if (f.parsed.isJunk) return;

            if (f.parsed.type === 'source') {
                grouped.source.push(f);
            } else if (grouped[f.parsed.os]) {
                grouped[f.parsed.os].push(f);
            } else {
                grouped.other.push(f);
            }
        });

        let displayOrder = [
            { key: 'windows', title: 'Windows', icon: ICONS.windows },
            { key: 'android', title: 'Android', icon: ICONS.android },
            { key: 'mac', title: 'macOS', icon: ICONS.apple },
            { key: 'linux', title: 'Linux', icon: ICONS.linux },
            { key: 'other', title: 'קבצים נוספים', icon: ICONS.file },
            { key: 'source', title: 'קוד מקור', icon: ICONS.code } // הפרדה לקוד מקור
        ];

        // מיון חכם
        const userOS = detectUserOS();
        displayOrder.sort((a, b) => {
            // קוד מקור תמיד בסוף
            if (a.key === 'source') return 1;
            if (b.key === 'source') return -1;

            // המערכת שלי ראשונה
            if (a.key === userOS) return -1;
            if (b.key === userOS) return 1;
            return 0;
        });

        displayOrder.forEach(cat => {
            if (grouped[cat.key].length > 0) {
                const section = document.createElement('div');
                section.className = 'gfd-section';
                section.innerHTML = `<div class="gfd-section-title">${cat.icon} ${cat.title}</div>`;

                const grid = document.createElement('div');
                grid.className = 'gfd-grid';
                grouped[cat.key].forEach(file => grid.appendChild(createCard(file)));

                section.appendChild(grid);
                content.appendChild(section);
            }
        });

        // כפתור הצג עוד
        if (nativeTruncateBtn && !nativeTruncateBtn.closest('[hidden]')) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'gfd-load-more-btn';
            loadMoreBtn.textContent = 'הצג את כל הקבצים';

            loadMoreBtn.onclick = () => {
                loadMoreBtn.textContent = 'טוען קבצים נוספים...';
                loadMoreBtn.style.cursor = 'wait';
                nativeTruncateBtn.click();
            };

            container.appendChild(loadMoreBtn);
        }
    }

    function init() {
        const run = () => {
            try {
                const assetsContainers = document.querySelectorAll('.Box.Box--condensed.mt-3, .Box-body > .d-flex > ul, [data-test-selector="release-assets"]');

                assetsContainers.forEach(container => {
                    if (container.querySelector('a[href*="/releases/download/"], a[href*="/archive/"]') && !container.classList.contains('gfd-processed')) {
                        container.classList.add('gfd-processed');
                        renderFriendlyUI(container);
                    }
                });
            } catch (e) {
                console.error("GFD Script Error:", e);
            }
        };

        run();

        const observer = new MutationObserver((mutations) => {
            let shouldRun = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    shouldRun = true;
                    break;
                }
            }
            if (shouldRun) run();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
