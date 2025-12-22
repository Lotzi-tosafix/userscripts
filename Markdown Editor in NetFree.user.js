// ==UserScript==
// @name         Markdown Editor in NetFree
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  עורך טקסט מתקדם לנטפרי
// @author       Assistant
// @match        https://netfree.link/app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=netfree.link
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- הגדרות סגנון (CSS) ---
    const styles = `
        .nf-md-toolbar {
            display: flex;
            gap: 4px;
            padding: 6px;
            background: #f3f3f4;
            border: 1px solid #e7eaec;
            border-bottom: none;
            border-radius: 4px 4px 0 0;
            flex-wrap: wrap;
            direction: rtl;
            align-items: center;
            position: relative;
        }
        .nf-md-btn {
            background: #fff;
            border: 1px solid #ddd;
            cursor: pointer;
            width: 30px;
            height: 30px;
            color: #676a6c;
            border-radius: 3px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            position: relative;
        }
        .nf-md-btn:hover, .nf-md-btn.active {
            background-color: #fff;
            color: #1ab394;
            border-color: #1ab394;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .nf-md-active-textarea {
            border-top: none !important;
            border-top-left-radius: 0 !important;
            border-top-right-radius: 0 !important;
        }
        .nf-dropdown-menu {
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            z-index: 1000;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.175);
            min-width: 160px;
            padding: 5px 0;
            margin-top: 2px;
        }
        .nf-dropdown-menu.show { display: block; }
        .nf-dropdown-item {
            display: block;
            padding: 8px 15px;
            clear: both;
            font-weight: 400;
            line-height: 1.42857143;
            color: #333;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
            text-align: right;
        }
        .nf-dropdown-item:hover { background-color: #f5f5f5; color: #262626; }

        .nf-color-picker-container { position: relative; display: inline-block; }
        input[type="color"] {
            opacity: 0;
            position: absolute;
            left: 0; top: 0; width: 100%; height: 100%;
            cursor: pointer;
        }

        /* סגנון לתצוגה המקדימה החיה */
        #nf-live-preview-container {
            margin-bottom: 15px;
            opacity: 1;
            transition: opacity 0.3s, margin 0.3s;
            border: 1px dashed #1ab394; /* מסגרת עדינה לזיהוי שזו תצוגה מקדימה */
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 5px;
        }
        #nf-live-preview-container.hidden {
            display: none;
            opacity: 0;
            margin: 0;
        }
        .nf-preview-label {
            font-size: 0.8em;
            color: #1ab394;
            font-weight: bold;
        }

        .nf-separator {
            width: 1px; height: 20px; background: #ccc; margin: 0 5px;
        }
    `;

    // הוספת ה-CSS לדף
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // --- מנוע המרת Markdown ל-HTML ---
    function markdownToHtml(text) {
        let html = text
            // בלוק קוד
            .replace(/```([\s\S]*?)```/g, function(match, code) {
                return '<pre>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
            })
            // כותרות
            .replace(/^#{1}\s+(.*)$/gm, '<h1>$1</h1>')
            .replace(/^#{2}\s+(.*)$/gm, '<h2>$1</h2>')
            .replace(/^#{3}\s+(.*)$/gm, '<h3>$1</h3>')
            .replace(/^#{4}\s+(.*)$/gm, '<h4>$1</h4>')
            .replace(/^#{5}\s+(.*)$/gm, '<h5>$1</h5>')
            .replace(/^#{6}\s+(.*)$/gm, '<h6>$1</h6>')

            // קו הפרדה
            .replace(/^\s*\*\*\*\s*$/gm, '<hr>')

            // יישור
            .replace(/\|-(.*?)-\|/g, '<div style="text-align: center;">$1</div>')
            .replace(/\|=(.*?)=\|/g, '<div style="text-align: justify;">$1</div>')
            .replace(/(^|\n)\|-(.*?)(?=\n|$)/g, '<div style="text-align: left; direction: ltr;">$2</div>')
            .replace(/(^|\n)(.*?)-\|(?=\n|$)/g, '<div style="text-align: right;">$2</div>')

            // עיצובים
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`([^`\n]+)`/g, '<code>$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#1ab394">$1</a>')
            .replace(/%\((.*?)\)\[(.*?)\]/g, '<span style="color:$1">$2</span>')
            .replace(/^\*\s+(.*)/gm, '<li>$1</li>')

            // ירידת שורה
            .replace(/\n/g, '<br>');

        // ניקוי
        html = html.replace(/<\/h(\d)><br>/g, '</h$1>');
        html = html.replace(/<\/div><br>/g, '</div>');
        html = html.replace(/<\/pre><br>/g, '</pre>');
        html = html.replace(/<hr><br>/g, '<hr>');

        return html;
    }

    // --- פונקציית הכנסת טקסט ---
    function insertSmart(textarea, prefix, suffix, placeholder) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText = '';
        let newSelectionStart = 0;
        let newSelectionEnd = 0;

        if (selectedText.length === 0) {
            newText = text.substring(0, start) + prefix + placeholder + suffix + text.substring(end);
            newSelectionStart = start + prefix.length;
            newSelectionEnd = newSelectionStart + placeholder.length;
        } else {
            newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
            newSelectionStart = start;
            newSelectionEnd = end + prefix.length + suffix.length;
        }

        textarea.value = newText;
        textarea.focus();
        textarea.setSelectionRange(newSelectionStart, newSelectionEnd);

        // טריגר לעדכון (חשוב גם לתצוגה המקדימה)
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // --- יצירת התצוגה המקדימה ---
    function createLivePreview(textarea, toolbar) {
        // מציאת פרטי משתמש
        let userName = "אני";
        let userAvatar = "https://secure.gravatar.com/avatar/00000000000000000000000000000000?d=mm&f=y"; // ברירת מחדל

        // ניסיון לשליפת שם פרטי מהנאב-בר
        try {
            const nameEl = document.querySelector('a[href="#/user/info"] span');
            if (nameEl) {
                const fullName = nameEl.innerText.trim();
                userName = fullName.split(' ')[0]; // רק שם פרטי
            }
        } catch(e) {}

        // ניסיון לשליפת תמונה משדה הקלט
        // אנו מחפשים את התמונה שנמצאת ליד התיבה הנוכחית
        const inputMessageContainer = textarea.closest('.chat-message');
        if (inputMessageContainer) {
            const avatarImg = inputMessageContainer.querySelector('img.message-avatar');
            if (avatarImg) {
                userAvatar = avatarImg.src;
            }
        }

        // יצירת אלמנט התצוגה (מבוסס על ה-HTML של נטפרי)
        const previewDiv = document.createElement('div');
        previewDiv.id = 'nf-live-preview-container';
        previewDiv.className = 'chat-message left'; // שימוש בקלאסים המקוריים

        // ה-HTML הפנימי זהה להודעה רגילה בנטפרי
        previewDiv.innerHTML = `
            <img class="message-avatar" style="border-radius: 100%; height: 38px; width: 38px;" src="${userAvatar}">
            <div class="message">
                <div class="title" style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 5px;">
                    <strong>${userName}</strong>
                    <div class="post-title-right" style="float: left;"> <!-- בנטפרי הזמן בצד שמאל -->
                        <span class="time-ago" style="font-weight: bold; color: #1ab394;">תצוגה מקדימה</span>
                    </div>
                </div>
                <div class="message-content" style="padding-top: 5px;">
                    <!-- התוכן ייכנס לכאן -->
                </div>
            </div>
        `;

        // הוספת הדיב לפני הקונטיינר של ההודעה הנוכחית
        if (inputMessageContainer && inputMessageContainer.parentNode) {
            inputMessageContainer.parentNode.insertBefore(previewDiv, inputMessageContainer);
        }

        // אלמנט התוכן לעדכון
        const contentDiv = previewDiv.querySelector('.message-content');

        // פונקציית העדכון
        const updatePreview = () => {
            const rawText = textarea.value;
            contentDiv.innerHTML = markdownToHtml(rawText);
        };

        // האזנה לשינויים בתיבה
        textarea.addEventListener('input', updatePreview);
        textarea.addEventListener('keyup', updatePreview);
        textarea.addEventListener('change', updatePreview);

        // עדכון ראשוני
        updatePreview();

        return previewDiv;
    }

    // --- יצירת הסרגל ---
    function createToolbar(textarea) {
        const toolbar = document.createElement('div');
        toolbar.className = 'nf-md-toolbar';
        toolbar.onmousedown = (e) => e.preventDefault();

        const createBtn = (icon, title, onClick) => {
            const btn = document.createElement('button');
            btn.className = 'nf-md-btn';
            btn.type = 'button';
            btn.title = title;
            btn.innerHTML = `<i class="fa ${icon}"></i>`;
            btn.onclick = (e) => {
                e.preventDefault();
                onClick();
            };
            return btn;
        };
        const createSep = () => {
            const div = document.createElement('div');
            div.className = 'nf-separator';
            return div;
        };

        // כפתור הצגה/הסתרה לתצוגה המקדימה
        const previewToggleBtn = document.createElement('button');
        previewToggleBtn.className = 'nf-md-btn';
        previewToggleBtn.title = 'הסתר תצוגה מקדימה';
        previewToggleBtn.innerHTML = `<i class="fa fa-eye-slash"></i>`;
        previewToggleBtn.onclick = (e) => {
            e.preventDefault();
            const previewContainer = document.getElementById('nf-live-preview-container');
            if (previewContainer) {
                const isHidden = previewContainer.classList.contains('hidden');
                if (isHidden) {
                    previewContainer.classList.remove('hidden');
                    previewToggleBtn.innerHTML = `<i class="fa fa-eye-slash"></i>`;
                    previewToggleBtn.title = 'הסתר תצוגה מקדימה';
                } else {
                    previewContainer.classList.add('hidden');
                    previewToggleBtn.innerHTML = `<i class="fa fa-eye"></i>`;
                    previewToggleBtn.title = 'הצג תצוגה מקדימה';
                }
            }
        };
        toolbar.appendChild(previewToggleBtn);

        toolbar.appendChild(createSep());

        // כותרות
        const headingWrapper = document.createElement('div');
        headingWrapper.style.position = 'relative';
        const headingBtn = createBtn('fa-heading', 'כותרת', () => { headingList.classList.toggle('show'); });
        const headingList = document.createElement('div');
        headingList.className = 'nf-dropdown-menu';
        for (let i = 1; i <= 6; i++) {
            const item = document.createElement('div');
            item.className = 'nf-dropdown-item';
            item.innerHTML = `<span style="color:#888; margin-left:5px;">H${i}</span> כותרת ${i}`;
            item.style.fontSize = (20 - i) + 'px';
            item.onclick = () => { insertSmart(textarea, '#'.repeat(i) + ' ', '', `כותרת ${i}`); headingList.classList.remove('show'); };
            headingList.appendChild(item);
        }
        headingWrapper.appendChild(headingBtn);
        headingWrapper.appendChild(headingList);
        toolbar.appendChild(headingWrapper);

        // קו הפרדה
        toolbar.appendChild(createBtn('fa-minus', 'קו הפרדה', () => insertSmart(textarea, '\n***\n', '', '')));
        toolbar.appendChild(createSep());

        // עיצוב
        toolbar.appendChild(createBtn('fa-bold', 'מודגש', () => insertSmart(textarea, '**', '**', 'טקסט מודגש')));
        toolbar.appendChild(createBtn('fa-italic', 'נטוי', () => insertSmart(textarea, '*', '*', 'טקסט נטוי')));
        toolbar.appendChild(createBtn('fa-strikethrough', 'קו חוצה', () => insertSmart(textarea, '~~', '~~', 'קו חוצה')));
        toolbar.appendChild(createSep());

        // רשימות וקישור
        toolbar.appendChild(createBtn('fa-list-ul', 'רשימה', () => insertSmart(textarea, '* ', '', 'פריט רשימה')));
        toolbar.appendChild(createBtn('fa-link', 'קישור', () => insertSmart(textarea, '[', '](http://)', 'טקסט קישור')));
        toolbar.appendChild(createBtn('fa-code', 'בלוק קוד', () => insertSmart(textarea, '\n```\n', '\n```\n', 'קוד')));
        toolbar.appendChild(createSep());

        // יישור
        toolbar.appendChild(createBtn('fa-align-right', 'יישור לימין', () => insertSmart(textarea, '', '-|', 'יישור לימין')));
        toolbar.appendChild(createBtn('fa-align-center', 'מרכוז', () => insertSmart(textarea, '|-', '-|', 'מרכוז')));
        toolbar.appendChild(createBtn('fa-align-left', 'יישור לשמאל', () => insertSmart(textarea, '|-', '', 'יישור לשמאל')));
        toolbar.appendChild(createBtn('fa-align-justify', 'יישור לשני הצדדים', () => insertSmart(textarea, '|=', '=|', 'רגיל')));
        toolbar.appendChild(createSep());

        // צבע
        const colorWrapper = document.createElement('div');
        colorWrapper.className = 'nf-color-picker-container';
        const colorBtn = createBtn('fa-eyedropper', 'צבע טקסט', () => {});
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#000000';
        colorInput.onchange = (e) => { insertSmart(textarea, `%(${e.target.value})[`, ']', 'צבעי טקסט'); };
        colorWrapper.appendChild(colorBtn);
        colorWrapper.appendChild(colorInput);
        toolbar.appendChild(colorWrapper);

        document.addEventListener('click', (e) => {
            if (!headingWrapper.contains(e.target)) headingList.classList.remove('show');
        });

        return toolbar;
    }

    // --- טיפול ב-Ctrl+Enter לשליחה ---
    function setupCtrlEnter(textarea) {
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                // חיפוש כפתור השליחה
                // בדרך כלל הוא נמצא באותו קונטיינר או קרוב, עם הטקסט "שלח"
                // ננסה למצוא אותו בצורה גנרית
                const buttons = document.querySelectorAll('button');
                for (let btn of buttons) {
                    if (btn.innerText.includes('שלח') && !btn.disabled) {
                        console.log('Ctrl+Enter: Clicking send button');
                        btn.click();
                        break;
                    }
                }
            }
        });
    }

    // --- הזרקה לדף ---
    function scanAndInject() {
        const selectors = [
            'textarea[name="content"]',
            'textarea#respons-text',
            'textarea[placeholder="כתוב הודעה"]'
        ];

        selectors.forEach(selector => {
            const textareas = document.querySelectorAll(selector);
            textareas.forEach(textarea => {
                if (textarea.previousElementSibling && textarea.previousElementSibling.classList.contains('nf-md-toolbar')) {
                    return; // כבר קיים
                }

                // 1. יצירת סרגל
                const toolbar = createToolbar(textarea);
                textarea.parentNode.insertBefore(toolbar, textarea);
                textarea.classList.add('nf-md-active-textarea');

                // 2. יצירת תצוגה מקדימה חיה
                createLivePreview(textarea, toolbar);

                // 3. הגדרת Ctrl+Enter
                setupCtrlEnter(textarea);
            });
        });
    }

    const observer = new MutationObserver(() => scanAndInject());
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(scanAndInject, 1000);
})();
