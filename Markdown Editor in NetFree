// ==UserScript==
// @name         NetFree Advanced Ticket Editor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  עורך טקסט מתקדם לנטפרי
// @author       לאצי&AI
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
 
        .nf-preview-modal {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 80%; max-width: 800px; height: 70vh;
            background: white;
            z-index: 9999;
            box-shadow: 0 0 50px rgba(0,0,0,0.5);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            border: 1px solid #ccc;
        }
        .nf-preview-header {
            padding: 15px;
            border-bottom: 1px solid #eee;
            background: #f9f9f9;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            border-radius: 8px 8px 0 0;
        }
        .nf-preview-content {
            padding: 20px;
            overflow-y: auto;
            flex-grow: 1;
            direction: rtl;
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        /* עיצוב כותרות בתצוגה מקדימה - ללא קו תחתון */
        .nf-preview-content h1, .nf-preview-content h2, .nf-preview-content h3 {
            margin-top: 15px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        /* עיצוב קו מפריד בתצוגה מקדימה */
        .nf-preview-content hr {
            border: 0;
            border-top: 1px solid #ccc;
            margin: 20px 0;
        }
        .nf-preview-content blockquote {
            border-right: 5px solid #eee;
            padding-right: 15px;
            margin-right: 0;
            color: #777;
        }
        .nf-preview-content code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
        .nf-preview-content pre {
            background: #f8f8f8;
            padding: 10px;
            border: 1px solid #e7e7e7;
            border-radius: 3px;
            direction: ltr;
            text-align: left;
            white-space: pre-wrap;
        }
        .nf-preview-close { cursor: pointer; color: #999; font-size: 20px; }
        .nf-preview-close:hover { color: #d9534f; }
        .nf-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 9998;
        }
        .nf-separator {
            width: 1px; height: 20px; background: #ccc; margin: 0 5px;
        }
    `;
 
    // הוספת ה-CSS לדף
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
 
    // --- פונקציות עזר לטקסט ---
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
 
        // עדכון אנגולר
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
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
 
        // 1. כותרות
        const headingWrapper = document.createElement('div');
        headingWrapper.style.position = 'relative';
        const headingBtn = createBtn('fa-heading', 'כותרת', () => {
            headingList.classList.toggle('show');
        });
        const headingList = document.createElement('div');
        headingList.className = 'nf-dropdown-menu';
        for (let i = 1; i <= 6; i++) {
            const item = document.createElement('div');
            item.className = 'nf-dropdown-item';
            item.innerHTML = `<span style="color:#888; margin-left:5px;">H${i}</span> כותרת ${i}`;
            item.style.fontSize = (20 - i) + 'px';
            item.onclick = () => {
                insertSmart(textarea, '#'.repeat(i) + ' ', '', `כותרת ${i}`);
                headingList.classList.remove('show');
            };
            headingList.appendChild(item);
        }
        headingWrapper.appendChild(headingBtn);
        headingWrapper.appendChild(headingList);
        toolbar.appendChild(headingWrapper);
 
        // 2. קו הפרדה ידני (הכפתור החדש)
        toolbar.appendChild(createBtn('fa-minus', 'קו הפרדה', () => insertSmart(textarea, '\n***\n', '', '')));
 
        toolbar.appendChild(createSep());
 
        // 3-5. עיצוב בסיסי
        toolbar.appendChild(createBtn('fa-bold', 'מודגש', () => insertSmart(textarea, '**', '**', 'טקסט מודגש')));
        toolbar.appendChild(createBtn('fa-italic', 'נטוי', () => insertSmart(textarea, '*', '*', 'טקסט נטוי')));
        toolbar.appendChild(createBtn('fa-strikethrough', 'קו חוצה', () => insertSmart(textarea, '~~', '~~', 'קו חוצה')));
 
        toolbar.appendChild(createSep());
 
        // 6-7. רשימה וקישור
        toolbar.appendChild(createBtn('fa-list-ul', 'רשימה', () => insertSmart(textarea, '* ', '', 'פריט רשימה')));
        toolbar.appendChild(createBtn('fa-link', 'קישור', () => insertSmart(textarea, '[', '](http://)', 'טקסט קישור')));
 
        // 8. קוד
        toolbar.appendChild(createBtn('fa-code', 'בלוק קוד', () => insertSmart(textarea, '\n```\n', '\n```\n', 'קוד')));
 
        toolbar.appendChild(createSep());
 
        // 9. יישור
        toolbar.appendChild(createBtn('fa-align-right', 'יישור לימין', () => insertSmart(textarea, '', '-|', 'יישור לימין')));
        toolbar.appendChild(createBtn('fa-align-center', 'מרכוז', () => insertSmart(textarea, '|-', '-|', 'מרכוז')));
        toolbar.appendChild(createBtn('fa-align-left', 'יישור לשמאל', () => insertSmart(textarea, '|-', '', 'יישור לשמאל')));
        toolbar.appendChild(createBtn('fa-align-justify', 'יישור לשני הצדדים', () => insertSmart(textarea, '|=', '=|', 'רגיל')));
 
        toolbar.appendChild(createSep());
 
        // 10. צבע
        const colorWrapper = document.createElement('div');
        colorWrapper.className = 'nf-color-picker-container';
        const colorBtn = createBtn('fa-eyedropper', 'צבע טקסט', () => {});
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#000000';
        colorInput.onchange = (e) => {
            insertSmart(textarea, `%(${e.target.value})[`, ']', 'צבעי טקסט');
        };
        colorWrapper.appendChild(colorBtn);
        colorWrapper.appendChild(colorInput);
        toolbar.appendChild(colorWrapper);
 
        toolbar.appendChild(createSep());
 
        // 11. תצוגה מקדימה
        toolbar.appendChild(createBtn('fa-eye', 'תצוגה מקדימה', () => showPreview(textarea.value)));
 
        document.addEventListener('click', (e) => {
            if (!headingWrapper.contains(e.target)) headingList.classList.remove('show');
        });
 
        return toolbar;
    }
 
    // --- לוגיקת תצוגה מקדימה ---
    function showPreview(text) {
        let html = text
            // קודם כל מטפלים בבלוקים של קוד כדי שהתוכן שלהם לא יפורש
            .replace(/```([\s\S]*?)```/g, function(match, code) {
                return '<pre>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
            })
            // כותרות (נקיות, ללא קו תחתון)
            .replace(/^#{1}\s+(.*)$/gm, '<h1>$1</h1>')
            .replace(/^#{2}\s+(.*)$/gm, '<h2>$1</h2>')
            .replace(/^#{3}\s+(.*)$/gm, '<h3>$1</h3>')
            .replace(/^#{4}\s+(.*)$/gm, '<h4>$1</h4>')
            .replace(/^#{5}\s+(.*)$/gm, '<h5>$1</h5>')
            .replace(/^#{6}\s+(.*)$/gm, '<h6>$1</h6>')
 
            // קו הפרדה (שלוש כוכביות)
            .replace(/^\s*\*\*\*\s*$/gm, '<hr>')
 
            // טיפול ביישור
            .replace(/\|-(.*?)-\|/g, '<div style="text-align: center;">$1</div>')
            .replace(/\|=(.*?)=\|/g, '<div style="text-align: justify;">$1</div>')
            .replace(/(^|\n)\|-(.*?)(?=\n|$)/g, '<div style="text-align: left; direction: ltr;">$2</div>')
            .replace(/(^|\n)(.*?)-\|(?=\n|$)/g, '<div style="text-align: right;">$2</div>')
 
            // עיצובים נוספים
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`([^`\n]+)`/g, '<code>$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#1ab394">$1</a>')
            .replace(/%\((.*?)\)\[(.*?)\]/g, '<span style="color:$1">$2</span>')
            .replace(/^\*\s+(.*)/gm, '<li>$1</li>')
 
            // בסוף: המרת ירידות שורה
            .replace(/\n/g, '<br>');
 
        // ניקוי
        html = html.replace(/<\/h(\d)><br>/g, '</h$1>');
        html = html.replace(/<\/div><br>/g, '</div>');
        html = html.replace(/<\/pre><br>/g, '</pre>');
        html = html.replace(/<hr><br>/g, '<hr>');
 
        // יצירת המודאל
        const overlay = document.createElement('div');
        overlay.className = 'nf-overlay';
 
        const modal = document.createElement('div');
        modal.className = 'nf-preview-modal';
 
        modal.innerHTML = `
            <div class="nf-preview-header">
                <span>תצוגה מקדימה</span>
                <span class="nf-preview-close">&times;</span>
            </div>
            <div class="nf-preview-content">${html}</div>
        `;
 
        const close = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modal);
        };
 
        modal.querySelector('.nf-preview-close').onclick = close;
        overlay.onclick = close;
 
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
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
                    return;
                }
                const toolbar = createToolbar(textarea);
                textarea.parentNode.insertBefore(toolbar, textarea);
                textarea.classList.add('nf-md-active-textarea');
            });
        });
    }
 
    const observer = new MutationObserver(() => scanAndInject());
    observer.observe(document.body, { childList: true, subtree: true });
 
    setTimeout(scanAndInject, 1000);
})();
