// ==UserScript==
// @name         NodeBB Plus
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  Bilingual Integrated tools: Hub Dashboard, Thread Exporter, Smart Sidebar Links & Recent Topics. Smart Duplicate Prevention.
// @author       לאצי&AI
// @match        *://*/*
// @grant        unsafeWindow
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @connect      icons.duckduckgo.com
// @connect      cdn-icons-png.flaticon.com
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================
    // CORE: בדיקה האם האתר הנוכחי הוא NodeBB
    // =================================================================
    function isNodeBB() {
        try {
            return (unsafeWindow.config && unsafeWindow.ajaxify) ||
                   document.querySelector('meta[name="generator"][content="NodeBB"]');
        } catch(e) { return false; }
    }

    if (!isNodeBB()) return;
    console.log("NodeBB Detected - Loading Ultimate Tool v4.7...");

    // =================================================================
    // I18N: מנגנון שפות וזיהוי אוטומטי
    // =================================================================
    function detectLanguage() {
        let lang = document.documentElement.lang || '';
        if (!lang && unsafeWindow.config) {
            lang = unsafeWindow.config.userLang || unsafeWindow.config.defaultLang || '';
        }
        return lang.toLowerCase().startsWith('he') ? 'he' : 'en';
    }

    const currentLang = detectLanguage();
    const isRtl = currentLang === 'he';

    const i18n = {
        he: {
            dashboardTitle: "מרכז הפורומים",
            unreadTopics: "נושאים שלא נקראו (כל האתרים)",
            settings: "הגדרות",
            refresh: "רענן",
            loading: "טוען...",
            manageSites: "ניהול אתרים",
            name: "שם",
            add: "הוסף",
            close: "סגור",
            allRead: "הכל נקרא!",
            noContent: "אין תוכן",
            newForumFound: "זיהיתי פורום חדש!",
            addForumPrompt: "להוסיף את <b>{title}</b> למרכז הפורומים?",
            yes: "כן",
            no: "לא",
            siteAdded: "האתר נוסף! רענן כדי לראות.",
            justNow: "עכשיו",
            minsAgo: " דק'",
            hoursAgo: " שע'",
            daysAgo: " ימים",

            // Exporter
            exportThread: "ייצוא שרשור",
            copyJson: "העתק כ-JSON",
            copyJsonDesc: "מעתיק את כל השרשור ללוח ההדבקות",
            dlJson: "הורד קובץ JSON",
            dlJsonDesc: "שומר את השרשור כקובץ מקומי במחשב",
            gatheringData: "אוסף נתונים, נא להמתין...",
            copiedPosts: "הועתקו {count} פוסטים ללוח!",
            downloadStarted: "הורדת {count} פוסטים החלה!",
            errorPrefix: "שגיאה: ",
            errNoTid: "לא ניתן היה למצוא את מזהה השרשור (TID).",
            errPageInfo: "שגיאה בקבלת מידע על עמודים: ",
            errLoadPage: "שגיאה בטעינת עמוד ",
            copyMarkdown: "העתק תוכן פוסט כ-Markdown",

            // Sidebar
            top: "הכי הרבה הצבעות",
            popular: "פופולארי",
            groups: "קבוצות",
            tags: "תגיות",
            recentTopics: "נושאים אחרונים",

            // Dashboard UI
            defaultSiteName: "מתמחים.טופ",
            fallbackSiteName: "אתר"
        },
        en: {
            dashboardTitle: "Forums Hub",
            unreadTopics: "Unread Topics (All Sites)",
            settings: "Settings",
            refresh: "Refresh",
            loading: "Loading...",
            manageSites: "Manage Sites",
            name: "Name",
            add: "Add",
            close: "Close",
            allRead: "Everything read!",
            noContent: "No content",
            newForumFound: "New forum detected!",
            addForumPrompt: "Add <b>{title}</b> to Forums Hub?",
            yes: "Yes",
            no: "No",
            siteAdded: "Site added! Refresh to see.",
            justNow: "Just now",
            minsAgo: " min",
            hoursAgo: " hr",
            daysAgo: " days",

            // Exporter
            exportThread: "Export Thread",
            copyJson: "Copy as JSON",
            copyJsonDesc: "Copies the entire thread to clipboard",
            dlJson: "Download JSON",
            dlJsonDesc: "Saves the thread as a local file",
            gatheringData: "Gathering data, please wait...",
            copiedPosts: "Copied {count} posts to clipboard!",
            downloadStarted: "Download of {count} posts started!",
            errorPrefix: "Error: ",
            errNoTid: "Could not find Thread ID (TID).",
            errPageInfo: "Error getting pages info: ",
            errLoadPage: "Error loading page ",
            copyMarkdown: "Copy post as Markdown",

            // Sidebar
            top: "Most Votes",
            popular: "Popular",
            groups: "Groups",
            tags: "Tags",
            recentTopics: "Recent Topics",

            // Dashboard UI
            defaultSiteName: "Mitmachim.top",
            fallbackSiteName: "Site"
        }
    };

    function t(key, vars = {}) {
        let text = i18n[currentLang][key] || i18n['en'][key] || key;
        for (const[k, v] of Object.entries(vars)) {
            text = text.replace(`{${k}}`, v);
        }
        return text;
    }

    function esc(str) {
        if (!str) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(str).replace(/[&<>"']/g, m => map[m]);
    }
    function safeStripHTML(html) {
        if (!html) return '';
        try { const doc = new DOMParser().parseFromString(html, 'text/html'); return doc.body.textContent || ''; } catch(e) { return ''; }
    }
    function safeUrl(url) {
        try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch(e) { return ''; }
    }
    function safeFaIcon(icon) {
        return /^[\w-]+$/.test(icon || '') ? icon : 'fa-folder';
    }

    function getBasePath() {
        return (unsafeWindow.config && unsafeWindow.config.relative_path) || '';
    }

    // =================================================================
    // SHARED: פונקציית טולטיפ אוניברסלית לכל כפתורי הסרגל המותאמים
    // =================================================================
    function initNodebbTooltip(element) {
        function init() {
            try {
                new unsafeWindow.bootstrap.Tooltip(element, {
                    placement: isRtl ? 'left' : 'right',
                    container: 'body',
                    trigger: 'manual',
                    popperConfig: { modifiers:[{ name: 'flip', enabled: false }] }
                });

                element.addEventListener('mouseenter', function() {
                    const sidebar = document.querySelector('[component="sidebar/left"]');
                    if (!sidebar || !sidebar.classList.contains('open')) {
                        const tt = unsafeWindow.bootstrap.Tooltip.getInstance(element);
                        if (tt) tt.show();
                    }
                });

                element.addEventListener('mouseleave', function() {
                    const tt = unsafeWindow.bootstrap.Tooltip.getInstance(element);
                    if (tt) tt.hide();
                });

                element.addEventListener('click', function() {
                    const tt = unsafeWindow.bootstrap.Tooltip.getInstance(element);
                    if (tt) tt.hide();
                });
            } catch (e) {}
        }

        if (typeof unsafeWindow.bootstrap !== 'undefined' && typeof unsafeWindow.bootstrap.Tooltip === 'function') {
            init();
        } else {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (typeof unsafeWindow.bootstrap !== 'undefined' && typeof unsafeWindow.bootstrap.Tooltip === 'function') {
                    clearInterval(interval);
                    init();
                } else if (attempts > 15) {
                    clearInterval(interval);
                }
            }, 200);
        }
    }


    // =================================================================
    // MODULE 1: TurndownService (ספרייה להמרת HTML ל-Markdown)
    // =================================================================
    var TurndownService = (function () {
        'use strict';
        function extend (destination) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (source.hasOwnProperty(key)) destination[key] = source[key]; } } return destination }
        function repeat (character, count) { return Array(count + 1).join(character) }
        function trimLeadingNewlines (string) { return string.replace(/^\n*/, '') }
        function trimTrailingNewlines (string) { var indexEnd = string.length; while (indexEnd > 0 && string[indexEnd - 1] === '\n') indexEnd--; return string.substring(0, indexEnd) }
        var blockElements =['ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS', 'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES', 'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL'];
        function isBlock (node) { return is(node, blockElements) }
        var voidElements =['AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT', 'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'];
        function isVoid (node) { return is(node, voidElements) }
        function hasVoid (node) { return has(node, voidElements) }
        var meaningfulWhenBlankElements =['A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT', 'AUDIO', 'VIDEO'];
        function isMeaningfulWhenBlank (node) { return is(node, meaningfulWhenBlankElements) }
        function hasMeaningfulWhenBlank (node) { return has(node, meaningfulWhenBlankElements) }
        function is (node, tagNames) { return tagNames.indexOf(node.nodeName) >= 0 }
        function has (node, tagNames) { return (node.getElementsByTagName && tagNames.some(function (tagName) { return node.getElementsByTagName(tagName).length })) }
        var rules = {};
        rules.paragraph = { filter: 'p', replacement: function (content) { return '\n\n' + content + '\n\n' } };
        rules.lineBreak = { filter: 'br', replacement: function (content, node, options) { return options.br + '\n' } };
        rules.heading = { filter:['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], replacement: function (content, node, options) { var hLevel = Number(node.nodeName.charAt(1)); if (options.headingStyle === 'setext' && hLevel < 3) { var underline = repeat((hLevel === 1 ? '=' : '-'), content.length); return ('\n\n' + content + '\n' + underline + '\n\n') } else { return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n' } } };
        rules.blockquote = { filter: 'blockquote', replacement: function (content) { content = content.replace(/^\n+|\n+$/g, ''); content = content.replace(/^/gm, '> '); return '\n\n' + content + '\n\n' } };
        rules.list = { filter: ['ul', 'ol'], replacement: function (content, node) { var parent = node.parentNode; if (parent.nodeName === 'LI' && parent.lastElementChild === node) { return '\n' + content } else { return '\n\n' + content + '\n\n' } } };
        rules.listItem = { filter: 'li', replacement: function (content, node, options) { content = content.replace(/^\n+/, '').replace(/\n+$/, '\n').replace(/\n/gm, '\n    '); var prefix = options.bulletListMarker + '   '; var parent = node.parentNode; if (parent.nodeName === 'OL') { var start = parent.getAttribute('start'); var index = Array.prototype.indexOf.call(parent.children, node); prefix = (start ? Number(start) + index : index + 1) + '.  '; } return ( prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '') ) } };
        rules.indentedCodeBlock = { filter: function (node, options) { return ( options.codeBlockStyle === 'indented' && node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE' ) }, replacement: function (content, node, options) { return ( '\n\n    ' + node.firstChild.textContent.replace(/\n/g, '\n    ') + '\n\n' ) } };
        rules.fencedCodeBlock = { filter: function (node, options) { return ( options.codeBlockStyle === 'fenced' && node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE' ) }, replacement: function (content, node, options) { var className = node.firstChild.getAttribute('class') || ''; var language = (className.match(/language-(\S+)/) || [null, ''])[1]; var code = node.firstChild.textContent; var fenceChar = options.fence.charAt(0); var fenceSize = 3; var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm'); var match; while ((match = fenceInCodeRegex.exec(code))) { if (match[0].length >= fenceSize) { fenceSize = match[0].length + 1; } } var fence = repeat(fenceChar, fenceSize); return ( '\n\n' + fence + language + '\n' + code.replace(/\n$/, '') + '\n' + fence + '\n\n' ) } };
        rules.horizontalRule = { filter: 'hr', replacement: function (content, node, options) { return '\n\n' + options.hr + '\n\n' } };
        rules.inlineLink = { filter: function (node, options) { return ( options.linkStyle === 'inlined' && node.nodeName === 'A' && node.getAttribute('href') ) }, replacement: function (content, node) { var href = node.getAttribute('href'); if (href) href = href.replace(/([()])/g, '\\$1'); var title = cleanAttribute(node.getAttribute('title')); if (title) title = ' "' + title.replace(/"/g, '\\"') + '"'; return '[' + content + '](' + href + title + ')' } };
        rules.referenceLink = { filter: function (node, options) { return ( options.linkStyle === 'referenced' && node.nodeName === 'A' && node.getAttribute('href') ) }, replacement: function (content, node, options) { var href = node.getAttribute('href'); var title = cleanAttribute(node.getAttribute('title')); if (title) title = ' "' + title + '"'; var replacement; var reference; switch (options.linkReferenceStyle) { case 'collapsed': replacement = '[' + content + '][]'; reference = '[' + content + ']: ' + href + title; break; case 'shortcut': replacement = '[' + content + ']'; reference = '[' + content + ']: ' + href + title; break; default: var id = this.references.length + 1; replacement = '[' + content + '][' + id + ']'; reference = '[' + id + ']: ' + href + title; } this.references.push(reference); return replacement }, references:[], append: function (options) { var references = ''; if (this.references.length) { references = '\n\n' + this.references.join('\n') + '\n\n'; this.references =[]; } return references } };
        rules.emphasis = { filter: ['em', 'i'], replacement: function (content, node, options) { if (!content.trim()) return ''; return options.emDelimiter + content + options.emDelimiter } };
        rules.strong = { filter: ['strong', 'b'], replacement: function (content, node, options) { if (!content.trim()) return ''; return options.strongDelimiter + content + options.strongDelimiter } };
        rules.code = { filter: function (node) { var hasSiblings = node.previousSibling || node.nextSibling; var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings; return node.nodeName === 'CODE' && !isCodeBlock }, replacement: function (content) { if (!content) return ''; content = content.replace(/\r?\n|\r/g, ' '); var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : ''; var delimiter = '`'; var matches = content.match(/`+/gm) ||[]; while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`'; return delimiter + extraSpace + content + extraSpace + delimiter } };
        rules.image = { filter: 'img', replacement: function (content, node) { var alt = cleanAttribute(node.getAttribute('alt')); var src = node.getAttribute('src') || ''; var title = cleanAttribute(node.getAttribute('title')); var titlePart = title ? ' "' + title + '"' : ''; return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : '' } };
        function cleanAttribute (attribute) { return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : '' }
        function Rules (options) { this.options = options; this._keep =[]; this._remove =[]; this.blankRule = { replacement: options.blankReplacement }; this.keepReplacement = options.keepReplacement; this.defaultRule = { replacement: options.defaultReplacement }; this.array =[]; for (var key in options.rules) this.array.push(options.rules[key]); }
        Rules.prototype = { add: function (key, rule) { this.array.unshift(rule); }, keep: function (filter) { this._keep.unshift({ filter: filter, replacement: this.keepReplacement }); }, remove: function (filter) { this._remove.unshift({ filter: filter, replacement: function () { return '' } }); }, forNode: function (node) { if (node.isBlank) return this.blankRule; var rule; if ((rule = findRule(this.array, node, this.options))) return rule; if ((rule = findRule(this._keep, node, this.options))) return rule; if ((rule = findRule(this._remove, node, this.options))) return rule; return this.defaultRule }, forEach: function (fn) { for (var i = 0; i < this.array.length; i++) fn(this.array[i], i); } };
        function findRule (rules, node, options) { for (var i = 0; i < rules.length; i++) { var rule = rules[i]; if (filterValue(rule, node, options)) return rule } return void 0 }
        function filterValue (rule, node, options) { var filter = rule.filter; if (typeof filter === 'string') { if (filter === node.nodeName.toLowerCase()) return true } else if (Array.isArray(filter)) { if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true } else if (typeof filter === 'function') { if (filter.call(rule, node, options)) return true } else { throw new TypeError('`filter` needs to be a string, array, or function') } }
        function collapseWhitespace (options) { var element = options.element; var isBlock = options.isBlock; var isVoid = options.isVoid; var isPre = options.isPre || function (node) { return node.nodeName === 'PRE' }; if (!element.firstChild || isPre(element)) return; var prevText = null; var keepLeadingWs = false; var prev = null; var node = next(prev, element, isPre); while (node !== element) { if (node.nodeType === 3 || node.nodeType === 4) { var text = node.data.replace(/[ \r\n\t]+/g, ' '); if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === ' ') { text = text.substr(1); } if (!text) { node = remove(node); continue } node.data = text; prevText = node; } else if (node.nodeType === 1) { if (isBlock(node) || node.nodeName === 'BR') { if (prevText) { prevText.data = prevText.data.replace(/ $/, ''); } prevText = null; keepLeadingWs = false; } else if (isVoid(node) || isPre(node)) { prevText = null; keepLeadingWs = true; } else if (prevText) { keepLeadingWs = false; } } else { node = remove(node); continue } var nextNode = next(prev, node, isPre); prev = node; node = nextNode; } if (prevText) { prevText.data = prevText.data.replace(/ $/, ''); if (!prevText.data) { remove(prevText); } } }
        function remove (node) { var next = node.nextSibling || node.parentNode; node.parentNode.removeChild(node); return next }
        function next (prev, current, isPre) { if ((prev && prev.parentNode === current) || isPre(current)) { return current.nextSibling || current.parentNode } return current.firstChild || current.nextSibling || current.parentNode }
        var root = (typeof window !== 'undefined' ? window : {});
        function canParseHTMLNatively () { var Parser = root.DOMParser; var canParse = false; try { if (new Parser().parseFromString('', 'text/html')) { canParse = true; } } catch (e) {} return canParse }
        function createHTMLParser () { var Parser = function () {}; { if (shouldUseActiveX()) { Parser.prototype.parseFromString = function (string) { var doc = new window.ActiveXObject('htmlfile'); doc.designMode = 'on'; doc.open(); doc.write(string); doc.close(); return doc }; } else { Parser.prototype.parseFromString = function (string) { var doc = document.implementation.createHTMLDocument(''); doc.open(); doc.write(string); doc.close(); return doc }; } } return Parser }
        function shouldUseActiveX () { var useActiveX = false; try { document.implementation.createHTMLDocument('').open(); } catch (e) { if (root.ActiveXObject) useActiveX = true; } return useActiveX }
        var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
        function RootNode (input, options) { var root; if (typeof input === 'string') { var doc = htmlParser().parseFromString( '<x-turndown id="turndown-root">' + input + '</x-turndown>', 'text/html' ); root = doc.getElementById('turndown-root'); } else { root = input.cloneNode(true); } collapseWhitespace({ element: root, isBlock: isBlock, isVoid: isVoid, isPre: options.preformattedCode ? isPreOrCode : null }); return root }
        var _htmlParser;
        function htmlParser () { _htmlParser = _htmlParser || new HTMLParser(); return _htmlParser }
        function isPreOrCode (node) { return node.nodeName === 'PRE' || node.nodeName === 'CODE' }
        function Node (node, options) { node.isBlock = isBlock(node); node.isCode = node.nodeName === 'CODE' || node.parentNode.isCode; node.isBlank = isBlank(node); node.flankingWhitespace = flankingWhitespace(node, options); return node }
        function isBlank (node) { return ( !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node) ) }
        function flankingWhitespace (node, options) { if (node.isBlock || (options.preformattedCode && node.isCode)) { return { leading: '', trailing: '' } } var edges = edgeWhitespace(node.textContent); if (edges.leadingAscii && isFlankedByWhitespace('left', node, options)) { edges.leading = edges.leadingNonAscii; } if (edges.trailingAscii && isFlankedByWhitespace('right', node, options)) { edges.trailing = edges.trailingNonAscii; } return { leading: edges.leading, trailing: edges.trailing } }
        function edgeWhitespace (string) { var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/); return { leading: m[1], leadingAscii: m[2], leadingNonAscii: m[3], trailing: m[4], trailingNonAscii: m[5], trailingAscii: m[6] } }
        function isFlankedByWhitespace (side, node, options) { var sibling; var regExp; var isFlanked; if (side === 'left') { sibling = node.previousSibling; regExp = / $/; } else { sibling = node.nextSibling; regExp = /^ /; } if (sibling) { if (sibling.nodeType === 3) { isFlanked = regExp.test(sibling.nodeValue); } else if (options.preformattedCode && sibling.nodeName === 'CODE') { isFlanked = false; } else if (sibling.nodeType === 1 && !isBlock(sibling)) { isFlanked = regExp.test(sibling.textContent); } } return isFlanked }
        var reduce = Array.prototype.reduce;
        var escapes = [[/\\/g, '\\\\'],[/\*/g, '\\*'],[/^-/g, '\\-'],[/^\+ /g, '\\+ '],[/^(=+)/g, '\\$1'],[/^(#{1,6}) /g, '\\$1 '],[/`/g, '\\`'],[/^~~~/g, '\\~~~'], [/\[/g, '\\['],[/\]/g, '\\]'],[/^>/g, '\\>'],[/_/g, '\\_'],[/^(\d+)\. /g, '$1\\. '] ];
        function TurndownService (options) { if (!(this instanceof TurndownService)) return new TurndownService(options); var defaults = { rules: rules, headingStyle: 'setext', hr: '* * *', bulletListMarker: '*', codeBlockStyle: 'indented', fence: '```', emDelimiter: '_', strongDelimiter: '**', linkStyle: 'inlined', linkReferenceStyle: 'full', br: '  ', preformattedCode: false, blankReplacement: function (content, node) { return node.isBlock ? '\n\n' : '' }, keepReplacement: function (content, node) { return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML }, defaultReplacement: function (content, node) { return node.isBlock ? '\n\n' + content + '\n\n' : content } }; this.options = extend({}, defaults, options); this.rules = new Rules(this.options); }
        TurndownService.prototype = { turndown: function (input) { if (!canConvert(input)) { throw new TypeError( input + ' is not a string, or an element/document/fragment node.' ) } if (input === '') return ''; var output = process.call(this, new RootNode(input, this.options)); return postProcess.call(this, output) }, use: function (plugin) { if (Array.isArray(plugin)) { for (var i = 0; i < plugin.length; i++) this.use(plugin[i]); } else if (typeof plugin === 'function') { plugin(this); } else { throw new TypeError('plugin must be a Function or an Array of Functions') } return this }, addRule: function (key, rule) { this.rules.add(key, rule); return this }, keep: function (filter) { this.rules.keep(filter); return this }, remove: function (filter) { this.rules.remove(filter); return this }, escape: function (string) { return escapes.reduce(function (accumulator, escape) { return accumulator.replace(escape[0], escape[1]) }, string) } };
        function process (parentNode) { var self = this; return reduce.call(parentNode.childNodes, function (output, node) { node = new Node(node, self.options); var replacement = ''; if (node.nodeType === 3) { replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue); } else if (node.nodeType === 1) { replacement = replacementForNode.call(self, node); } return join(output, replacement) }, '') }
        function postProcess (output) { var self = this; this.rules.forEach(function (rule) { if (typeof rule.append === 'function') { output = join(output, rule.append(self.options)); } }); return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '') }
        function replacementForNode (node) { var rule = this.rules.forNode(node); var content = process.call(this, node); var whitespace = node.flankingWhitespace; if (whitespace.leading || whitespace.trailing) content = content.trim(); return ( whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing ) }
        function join (output, replacement) { var s1 = trimTrailingNewlines(output); var s2 = trimLeadingNewlines(replacement); var nls = Math.max(output.length - s1.length, replacement.length - s2.length); var separator = '\n\n'.substring(0, nls); return s1 + separator + s2 }
        function canConvert (input) { return ( input != null && ( typeof input === 'string' || (input.nodeType && ( input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11 )) ) ) }
        return TurndownService;
    }());

    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
    });

    turndownService.addRule('absoluteImages', {
        filter: 'img',
        replacement: function (content, node) {
            let src = node.getAttribute('src');
            if (src && !src.startsWith('http')) {
                try { src = new URL(src, location.origin).href; } catch (e) {}
            }
            return `![${node.alt || ''}](${src})`;
        }
    });

    turndownService.addRule('cleanBlockquotes', {
        filter: 'blockquote',
        replacement: function (content, node) {
            const cleanedContent = content.replace(/@\S+\s+(כתב\s+ב|wrote\s+in).+:/, '').trim();
            const lines = cleanedContent.split('\n');
            return '\n' + lines.map(line => `> ${line}`).join('\n') + '\n\n';
        }
    });

    turndownService.addRule('userMentions', {
        filter: (node) => node.nodeName === 'A' && node.classList.contains('plugin-mentions-user'),
        replacement: (content) => content
    });

    // =================================================================
    // MODULE 2: Dashboard Logic (מרכז הפורומים)
    // =================================================================
    const dashboardModule = (function() {
        const STORAGE_KEY_SITES = 'nodebb_dashboard_sites_v03';
        const STORAGE_KEY_IGNORED = 'nodebb_dashboard_ignored_v03';
        const DASHBOARD_HASH = '#nodebb-dashboard';
        const DEFAULT_SITES =[{ name: t('defaultSiteName'), url: 'https://mitmachim.top' }];

        function getSites() {
            const stored = GM_getValue(STORAGE_KEY_SITES);
            if (!stored) { saveSites(DEFAULT_SITES); return DEFAULT_SITES; }
            try {
                const parsed = JSON.parse(stored);
                return parsed.filter(s => s && typeof s.name === 'string' && safeUrl(s.url));
            } catch(e) { return DEFAULT_SITES; }
        }
        function saveSites(sites) { GM_setValue(STORAGE_KEY_SITES, JSON.stringify(sites)); }
        function getIgnored() { return JSON.parse(GM_getValue(STORAGE_KEY_IGNORED) || '[]'); }
        function addToIgnored(url) {
            const list = getIgnored();
            if (!list.includes(url)) {
                list.push(url);
                GM_setValue(STORAGE_KEY_IGNORED, JSON.stringify(list));
            }
        }
        function getSiteName() {
            try { if (unsafeWindow.config && unsafeWindow.config.siteTitle) return unsafeWindow.config.siteTitle; } catch(e) {}
            const parts = document.title.split('|');
            if (parts.length > 1) return parts.pop().trim();
            return document.title.trim();
        }
        function fetchUnread(site) {
            return new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: "GET", url: site.url.replace(/\/$/, "") + '/api/unread',
                    headers: { "Content-Type": "application/json" },
                    onload: (res) => {
                        try {
                            const json = JSON.parse(res.responseText);
                            resolve((json.topics ||[]).map(t => ({ ...t, origin: site })));
                        } catch(e) { resolve([]); }
                    },
                    onerror: () => resolve([])
                });
            });
        }
        function timeAgo(d) {
            const diff = (new Date() - new Date(d)) / 1000;
            if(diff<60) return t('justNow');
            if(diff<3600) return Math.floor(diff/60) + t('minsAgo');
            if(diff<86400) return Math.floor(diff/3600) + t('hoursAgo');
            return Math.floor(diff/86400) + t('daysAgo');
        }
        function fixUrl(url, base) { return !url.startsWith('http') ? base + (url.startsWith('/')?'':'/') + url : url; }
        function loadSecureImage(url, img) {
            if(!url) return;
            GM_xmlhttpRequest({
                method: "GET", url: url, responseType: "blob",
                onload: (res) => {
                    if(res.status===200) {
                        const reader = new FileReader();
                        reader.onloadend = () => { img.src = reader.result; };
                        reader.readAsDataURL(res.response);
                    }
                }
            });
        }

        function injectDashboard() {
            const contentDiv = document.getElementById('content');
            if (!contentDiv) { setTimeout(injectDashboard, 100); return; }

            document.title = t('dashboardTitle');

            const marginStart = isRtl ? 'margin-left' : 'margin-right';
            const marginEnd = isRtl ? 'margin-right' : 'margin-left';
            const borderStart = isRtl ? 'border-right' : 'border-left';
            const paddingStart = isRtl ? 'padding-right' : 'padding-left';
            const textAlign = isRtl ? 'right' : 'left';
            const direction = isRtl ? 'rtl' : 'ltr';

            GM_addStyle(`
                #dash-wrapper { font-family: 'Assistant', sans-serif; direction: ${direction}; text-align: ${textAlign}; background: #fff; border-radius:4px; padding: 15px; min-height: 80vh; }
                #dash-wrapper * { box-sizing: border-box; }
                .dash-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px; }
                .dash-h-title { font-size: 1.5rem; font-weight: bold; color: #333; }
                .d-topic { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f0f0f0; transition: background 0.2s; }
                .d-topic:hover { background: #f9f9f9; }
                .d-auth { width: 50px; flex-shrink: 0; text-align: center; position: relative; ${marginStart}: 15px; }
                .d-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; }
                .d-letter { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
                .d-icon { position: absolute; bottom: -2px; left: -2px; width: 18px; height: 18px; background: white; border-radius: 50%; border: 2px solid white; object-fit: contain; }
                .d-main { flex-grow: 1; min-width: 0; }
                .d-link { font-size: 1.1rem; font-weight: 600; color: #333; text-decoration: none; display: block; margin-bottom: 4px; }
                .d-link:hover { color: #007bff; text-decoration: none; }
                .d-meta { font-size: 0.85rem; color: #777; display: flex; gap: 8px; align-items: center; }
                .d-badge { background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 5px; }
                .d-teaser { width: 300px; flex-shrink: 0; ${borderStart}: 1px solid #eee; ${paddingStart}: 15px; ${marginEnd}: 10px; display: flex; flex-direction: column; justify-content: center; }
                @media (max-width: 991px) { .d-teaser { display: none; } }
                .t-meta { font-size: 0.8rem; color: #666; margin-bottom: 2px; display: flex; align-items: center; gap: 5px; }
                .t-txt { font-size: 0.85rem; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .t-avatar { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }
                .d-btn { padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; ${marginStart}: 5px; }
                .bg-blue { background: #007bff; color: white; }
                .bg-gray { background: #eee; color: #333; }
                .d-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10500; display: none; justify-content: center; align-items: center; }
                .d-modal-box { background: white; width: 500px; padding: 20px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: ${textAlign}; direction: ${direction}; }
            `);

            contentDiv.innerHTML = `
                <div id="dash-wrapper">
                    <div class="dash-header">
                        <div class="dash-h-title"><i class="fa fa-layer-group text-primary"></i> ${t('unreadTopics')}</div>
                        <div>
                            <button class="d-btn bg-gray" id="dash-set-btn"><i class="fa fa-cog"></i> ${t('settings')}</button>
                            <button class="d-btn bg-blue" id="dash-ref-btn"><i class="fa fa-sync"></i> ${t('refresh')}</button>
                        </div>
                    </div>
                    <div id="dash-list">
                        <div style="text-align:center; padding:50px;"><i class="fa fa-spinner fa-spin fa-2x"></i><br>${t('loading')}</div>
                    </div>
                </div>
                <div id="dash-settings" class="d-modal">
                    <div class="d-modal-box">
                        <h4>${t('manageSites')}</h4>
                        <div id="dash-sites-ui" style="max-height:250px; overflow-y:auto; margin-bottom:15px; border:1px solid #eee; padding:5px;"></div>
                        <div style="display:flex; gap:5px;">
                            <input id="add-n" placeholder="${t('name')}" style="flex:1; padding:5px;">
                            <input id="add-u" placeholder="URL" style="flex:2; padding:5px; direction:ltr;">
                            <button id="add-b" class="d-btn bg-blue">${t('add')}</button>
                        </div>
                        <div style="margin-top:15px; text-align:${isRtl ? 'left' : 'right'};">
                            <button id="close-s" class="d-btn bg-gray">${t('close')}</button>
                        </div>
                    </div>
                </div>
            `;

            loadDashboardContent();

            document.getElementById('dash-ref-btn').onclick = loadDashboardContent;
            document.getElementById('dash-set-btn').onclick = openSettings;
            document.getElementById('close-s').onclick = () => document.getElementById('dash-settings').style.display = 'none';
            document.getElementById('add-b').onclick = addSiteFromDash;

            window.addEventListener('popstate', () => { if (window.location.hash !== DASHBOARD_HASH) location.reload(); });
        }

        async function loadDashboardContent() {
            const container = document.getElementById('dash-list');
            const sites = getSites();
            container.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fa fa-spinner fa-spin fa-2x"></i></div>';
            const promises = sites.map(s => fetchUnread(s));
            const results = await Promise.all(promises);
            const all =[].concat(...results);
            all.sort((a,b) => new Date(b.lastposttimeISO) - new Date(a.lastposttimeISO));

            if (all.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:50px; color:green;">${t('allRead')}</div>`;
                return;
            }

            container.innerHTML = '';
            all.forEach(tData => {
                const author = tData.user;
                const teaser = tData.teaser;
                const tUser = teaser ? (teaser.user || tData.user) : tData.user;
                const domain = new URL(tData.origin.url).hostname;
                const iconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

                let authHtml = `<div class="d-letter" style="background:${esc(author['icon:bgColor']||'#666')}">${esc(author['icon:text']||'?')}</div>`;
                if (author.picture) {
                    let pic = fixUrl(author.picture, tData.origin.url);
                    authHtml = `<img class="d-avatar orb-fix" data-src="${esc(pic)}">`;
                }

                let tImg = `<div style="width:18px; height:18px; border-radius:50%; background:${esc(tUser['icon:bgColor']||'#666')}; display:inline-block;"></div>`;
                if (tUser.picture) {
                    let pic = fixUrl(tUser.picture, tData.origin.url);
                    tImg = `<img class="t-avatar orb-fix" data-src="${esc(pic)}">`;
                }

                const txt = teaser && teaser.content ? safeStripHTML(teaser.content) : t('noContent');

                const row = document.createElement('div');
                row.className = 'd-topic';
                row.innerHTML = `
                    <div class="d-auth">
                        <a href="${safeUrl(tData.origin.url) || '#'}/user/${esc(author.userslug)}" target="_blank" style="text-decoration:none; display:inline-block; position:relative;">
                            ${authHtml}
                            <img class="d-icon orb-fix" data-src="${iconUrl}" title="${esc(tData.origin.name)}">
                        </a>
                    </div>
                    <div class="d-main">
                        <a href="${safeUrl(tData.origin.url) || '#'}/topic/${esc(tData.slug)}" target="_blank" class="d-link">${esc(tData.title)}</a>
                        <div class="d-meta">
                            <span class="d-badge"><img src="${iconUrl}" style="width:14px; height:14px;" class="orb-fix" data-src="${iconUrl}"> ${esc(tData.origin.name)} <span style="color:#ccc">|</span> <i class="fa ${safeFaIcon(tData.category.icon)}"></i> ${esc(tData.category.name)}</span>
                            <span><i class="fa fa-eye"></i> ${tData.viewcount}</span>
                            <span><i class="fa fa-comment"></i> ${tData.postcount}</span>
                            ${tData.pinned ? '<i class="fa fa-thumbtack text-danger"></i>' : ''}
                            ${tData.locked ? '<i class="fa fa-lock text-warning"></i>' : ''}
                        </div>
                    </div>
                    <div class="d-teaser">
                        <div class="t-meta">${tImg} <b>${esc(tUser.username)}</b> <span>• ${timeAgo(tData.lastposttimeISO)}</span></div>
                        <div class="t-txt" title="${esc(txt)}">${esc(txt)}</div>
                    </div>
                `;
                container.appendChild(row);
            });
            document.querySelectorAll('.orb-fix').forEach(img => loadSecureImage(img.getAttribute('data-src'), img));
        }

        function openSettings() {
            const list = document.getElementById('dash-sites-ui');
            list.innerHTML = '';
            getSites().forEach((s, i) => {
                const div = document.createElement('div');
                div.style.cssText = 'display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #f0f0f0;';
                div.innerHTML = `<div><b>${esc(s.name)}</b><br><small>${esc(s.url)}</small></div>`;
                const btn = document.createElement('button');
                btn.className = 'd-btn bg-gray'; btn.textContent = 'X';
                btn.onclick = function() { const s = getSites(); s.splice(i, 1); saveSites(s); openSettings(); };
                div.appendChild(btn);
                list.appendChild(div);
            });
            document.getElementById('dash-settings').style.display = 'flex';
        }

        function addSiteFromDash() {
            const n = document.getElementById('add-n').value;
            const u = document.getElementById('add-u').value.trim().replace(/\/$/, "");
            if (!u) return;
            const rawUrl = u.startsWith('http') ? u : 'https://' + u;
            const finalUrl = safeUrl(rawUrl);
            if (!finalUrl) return;
            const sites = getSites();
            if(!sites.some(s=>s.url===finalUrl)) {
                sites.push({ name: safeStripHTML(n).trim().slice(0, 150) || t('fallbackSiteName'), url: finalUrl });
                saveSites(sites);
                openSettings();
                document.getElementById('add-n').value=''; document.getElementById('add-u').value='';
            }
        }

        function showDiscoveryPopup(url) {
            if (document.getElementById('nodebb-popup')) return;
            const div = document.createElement('div');
            div.id = 'nodebb-popup';
            div.style.cssText = `position:fixed; bottom:20px; ${isRtl ? 'right' : 'left'}:20px; background:white; padding:15px; border:1px solid #ccc; box-shadow:0 5px 20px rgba(0,0,0,0.2); z-index:999999; direction:${isRtl ? 'rtl' : 'ltr'}; width:280px; border-radius:8px; font-family:sans-serif; text-align:${isRtl ? 'right' : 'left'};`;
            const title = getSiteName();
            div.innerHTML = `
                <div style="font-weight:bold; margin-bottom:10px;">${t('newForumFound')}</div>
                <div style="font-size:13px; margin-bottom:10px;">${t('addForumPrompt', { title: esc(title) })}</div>
                <div style="display:flex; gap:10px;">
                    <button id="p-yes" style="flex:1; background:#28a745; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">${t('yes')}</button>
                    <button id="p-no" style="flex:1; background:#dc3545; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">${t('no')}</button>
                </div>
            `;
            document.body.appendChild(div);
            document.getElementById('p-yes').onclick = () => {
                const sites = getSites();
                sites.push({ name: safeStripHTML(title).trim().slice(0, 150), url: url });
                saveSites(sites);
                div.remove();
                alert(t('siteAdded'));
                location.reload();
            };
            document.getElementById('p-no').onclick = () => { addToIgnored(url); div.remove(); };
        }

        function ensureMenuButton() {
            // אם ה-ID שלנו כבר שם – אין צורך להמשיך
            if (document.getElementById('nbe-link-dashboard')) return;

            const nav = document.querySelector('#main-nav') || document.querySelector('.navbar-nav');
            if (nav) {
                // בדיקת כפילות חכמה: סריקה האם כבר קיים כפתור (מסייד-בר של סקריפט עצמאי) שמפנה לאותו מקום
                if (nav.querySelector('a[href$="#nodebb-dashboard"]')) return;

                const li = document.createElement('li');
                li.id = 'nbe-link-dashboard';
                li.className = 'nav-item mx-2 nbe-custom-link';
                li.setAttribute('title', t('dashboardTitle'));

                li.innerHTML = `
                    <a class="nav-link navigation-link d-flex gap-2 justify-content-between align-items-center" href="${DASHBOARD_HASH}" aria-label="${t('dashboardTitle')}">
                        <span class="d-flex gap-2 align-items-center text-nowrap truncate-open">
                            <span class="position-relative">
                                <i class="fa fa-fw fa-cubes"></i>
                            </span>
                            <span class="nav-text small visible-open fw-semibold text-truncate">${t('dashboardTitle')}</span>
                        </span>
                    </a>
                `;

                const ref = nav.querySelector('a[href="/unread"]');
                if (ref && ref.closest('li')) ref.closest('li').after(li);
                else nav.appendChild(li);

                initNodebbTooltip(li);
            }
        }

        // מוודא שהכפתור דלוק רק כשאנחנו באמת בדשבורד
        function updateActiveState() {
            const li = document.getElementById('nbe-link-dashboard');
            if (!li) return;
            const a = li.querySelector('a');

            if (window.location.hash === DASHBOARD_HASH) {
                if (a) a.classList.add('active');
                li.classList.add('active');
            } else {
                if (a) a.classList.remove('active');
                li.classList.remove('active');
            }
        }

        function init() {
            if (window.location.hash === DASHBOARD_HASH) injectDashboard();
            window.addEventListener('hashchange', () => { if (window.location.hash === DASHBOARD_HASH) location.reload(); });
            const currentUrl = window.location.origin;
            const sites = getSites();
            const isMySite = sites.some(s => s.url === currentUrl);

            if (!isMySite) {
                const ignored = getIgnored();
                if (!ignored.includes(currentUrl) && window.location.hash !== DASHBOARD_HASH) showDiscoveryPopup(currentUrl);
            }
        }

        return { init, ensureMenuButton, updateActiveState, isMySite: () => getSites().some(s => s.url === window.location.origin) };
    })();

    // =================================================================
    // MODULE 3: Exporter Logic (ייצוא והעתקה - תפריט מובנה)
    // =================================================================
    const exporterModule = (function() {

        async function fetchAndProcessThread() {
            let tid, slug, title;
            if (unsafeWindow.ajaxify && unsafeWindow.ajaxify.data) {
                tid = unsafeWindow.ajaxify.data.tid;
                slug = unsafeWindow.ajaxify.data.slug;
                title = unsafeWindow.ajaxify.data.title;
            }
            if (!tid) {
                const match = window.location.pathname.match(/topic\/(\d+)(?:\/([^/]+))?/);
                if (match && match[1]) { tid = match[1]; slug = match[2] || tid; }
                else throw new Error(t('errNoTid'));
            }
            if (!slug) slug = tid;
            if (!title) {
                const titleElement = document.querySelector('span[component="topic/title"]');
                title = titleElement ? titleElement.textContent.trim() : document.title;
            }

            const paginationResponse = await fetch(`${location.origin}/api/topic/pagination/${tid}`);
            if (!paginationResponse.ok) throw new Error(`${t('errPageInfo')}${paginationResponse.statusText}`);
            const paginationData = await paginationResponse.json();
            const pageCount = paginationData.pagination.pageCount;

            const pagePromises = [];
            for (let i = 1; i <= pageCount; i++) {
                pagePromises.push(
                    fetch(`${location.origin}/api/topic/${tid}/${slug}?page=${i}`).then(res => {
                        if (!res.ok) throw new Error(`${t('errLoadPage')}${i}`);
                        return res.json();
                    })
                );
            }

            const allPagesData = await Promise.all(pagePromises);
            const allPosts = allPagesData.flatMap(pageData => pageData.posts);

            const processedPosts = allPosts
                .filter(post => post && !post.deleted)
                .map(post => {
                    const contentMarkdown = turndownService.turndown(post.content || '').trim();
                    return {
                        pid: post.pid,
                        author: post.user ? post.user.username : 'Unknown',
                        content: contentMarkdown,
                        reply_to_pid: post.toPid || null,
                    };
                });

            return { posts: processedPosts, title: title };
        }

        function showStatus(msg, type) {
            const statusLi = document.getElementById('nbe-dropdown-status');
            const statusText = document.getElementById('nbe-status-text');
            if (!statusLi || !statusText) return;

            statusLi.style.display = 'block';
            statusText.textContent = msg;

            let bgClass = 'bg-info';
            if (type === 'success') bgClass = 'bg-success';
            if (type === 'error') bgClass = 'bg-danger';

            statusText.className = `p-2 text-center text-xs fw-bold rounded-1 mt-1 text-white ${bgClass}`;

            if(type === 'success' || type === 'error') {
                setTimeout(() => {
                    statusLi.style.display = 'none';
                }, 3000);
            }
        }

        function injectExportDropdown() {
            if (!location.pathname.includes('/topic/') && !location.href.includes('topic')) return;

            const container = document.querySelector('.sticky-tools .topic-main-buttons > div > div:first-child');
            if (!container || container.querySelector('.nbe-export-wrapper')) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'btn-group bottom-sheet nbe-export-wrapper';

            const btn = document.createElement('button');
            btn.className = 'btn btn-ghost btn-sm ff-secondary d-flex gap-2 align-items-center dropdown-toggle text-truncate';
            btn.setAttribute('data-bs-toggle', 'dropdown');
            btn.setAttribute('aria-expanded', 'false');
            btn.innerHTML = `
                <i class="fa fa-fw fa-download text-primary"></i>
                <span class="d-none d-md-inline fw-semibold text-truncate text-nowrap">${t('exportThread')}</span>
            `;

            const menu = document.createElement('ul');
            menu.className = 'dropdown-menu p-1 text-sm';
            menu.setAttribute('role', 'menu');

            menu.innerHTML = `
                <li>
                    <a class="dropdown-item rounded-1 d-flex align-items-center gap-2 p-2" href="#" id="nbe-action-copy" role="menuitem">
                        <div class="flex-grow-1 d-flex flex-column">
                            <span class="d-flex align-items-center gap-2">
                                <i class="flex-shrink-0 fa fa-fw fa-clipboard text-secondary"></i>
                                <span class="flex-grow-1 fw-semibold">${t('copyJson')}</span>
                            </span>
                            <div class="help-text text-secondary text-xs">${t('copyJsonDesc')}</div>
                        </div>
                    </a>
                </li>
                <li>
                    <a class="dropdown-item rounded-1 d-flex align-items-center gap-2 p-2" href="#" id="nbe-action-dl" role="menuitem">
                        <div class="flex-grow-1 d-flex flex-column">
                            <span class="d-flex align-items-center gap-2">
                                <i class="flex-shrink-0 fa fa-fw fa-file-code-o text-secondary"></i>
                                <span class="flex-grow-1 fw-semibold">${t('dlJson')}</span>
                            </span>
                            <div class="help-text text-secondary text-xs">${t('dlJsonDesc')}</div>
                        </div>
                    </a>
                </li>
                <li id="nbe-dropdown-status" style="display:none;" class="px-2">
                    <div id="nbe-status-text"></div>
                </li>
            `;

            wrapper.appendChild(btn);
            wrapper.appendChild(menu);
            container.appendChild(wrapper);

            const handleAction = async (e, actionType) => {
                e.preventDefault();
                e.stopPropagation();

                const btnCopy = document.getElementById('nbe-action-copy');
                const btnDl = document.getElementById('nbe-action-dl');

                if (btnCopy.classList.contains('disabled')) return;

                showStatus(t('gatheringData'), 'info');
                btnCopy.classList.add('disabled');
                btnDl.classList.add('disabled');
                btnCopy.style.pointerEvents = 'none';
                btnDl.style.pointerEvents = 'none';

                try {
                    const data = await fetchAndProcessThread();
                    const json = JSON.stringify({ title: data.title, posts: data.posts }, null, 2);

                    if (actionType === 'copy') {
                        GM_setClipboard(json);
                        showStatus(t('copiedPosts', { count: data.posts.length }), 'success');
                    } else {
                        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        const safeTitle = data.title.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').trim();
                        a.href = url;
                        a.download = `${safeTitle || 'thread'}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        showStatus(t('downloadStarted', { count: data.posts.length }), 'success');
                    }
                } catch (error) {
                    console.error(error);
                    showStatus(t('errorPrefix') + error.message, 'error');
                } finally {
                    btnCopy.classList.remove('disabled');
                    btnDl.classList.remove('disabled');
                    btnCopy.style.pointerEvents = 'auto';
                    btnDl.style.pointerEvents = 'auto';
                }
            };

            document.getElementById('nbe-action-copy').addEventListener('click', (e) => handleAction(e, 'copy'));
            document.getElementById('nbe-action-dl').addEventListener('click', (e) => handleAction(e, 'dl'));
        }

        function injectPostButtons() {
             if (!location.pathname.includes('/topic/') && !location.href.includes('topic')) return;

            const actionContainers = document.querySelectorAll('[component="post/actions"]:not(.nbe-processed)');
            actionContainers.forEach(container => {
                container.classList.add('nbe-processed');
                const btn = document.createElement('a');
                btn.href = '#';
                btn.className = 'btn btn-ghost btn-sm';
                btn.title = t('copyMarkdown');
                btn.innerHTML = `<i class="fa fa-fw fa-clone text-primary"></i>`;
                btn.onclick = (e) => {
                    e.preventDefault();
                    const postEl = container.closest('[component="post"]');
                    if (!postEl) return;
                    const contentEl = postEl.querySelector('[component="post/content"]');
                    if (!contentEl) return;
                    const md = turndownService.turndown(contentEl.innerHTML);
                    GM_setClipboard(md);
                    const originalIcon = btn.innerHTML;
                    btn.innerHTML = `<i class="fa fa-fw fa-check text-success"></i>`;
                    setTimeout(() => { btn.innerHTML = originalIcon; }, 2000);
                };
                const votes = container.querySelector('.votes');
                if (votes) container.insertBefore(btn, votes);
                else container.appendChild(btn);
            });
        }

        return { injectExportDropdown, injectPostButtons };
    })();

    // =================================================================
    // MODULE 4: Sidebar Links (השלמת קישורים דינמית בסרגל הצד)
    // =================================================================
    const sidebarLinksModule = (function() {
        const LINKS_TO_ADD =[
            { id: 'nbe-link-top', path: '/top', text: t('top'), icon: 'fa-trophy' },
            { id: 'nbe-link-popular', path: '/popular', text: t('popular'), icon: 'fa-fire' },
            { id: 'nbe-link-groups', path: '/groups', text: t('groups'), icon: 'fa-users' },
            { id: 'nbe-link-tags', path: '/tags', text: t('tags'), icon: 'fa-tags' }
        ];

        function createNavItemElement(config) {
            const listItem = document.createElement('li');
            listItem.id = config.id;
            listItem.className = 'nav-item mx-2 nbe-custom-link';
            listItem.setAttribute('title', config.text);

            const fullUrl = getBasePath() + config.path;

            listItem.innerHTML = `
                <a class="nav-link navigation-link d-flex gap-2 justify-content-between align-items-center" href="${fullUrl}" aria-label="${config.text}">
                    <span class="d-flex gap-2 align-items-center text-nowrap truncate-open">
                        <span class="position-relative">
                            <i class="fa fa-fw ${config.icon}"></i>
                        </span>
                        <span class="nav-text small visible-open fw-semibold text-truncate">${config.text}</span>
                    </span>
                </a>
            `;
            return listItem;
        }

        function injectLinks() {
            const mainNav = document.getElementById('main-nav') || document.querySelector('.navbar-nav');
            if (!mainNav) return;

            const existingHrefs = Array.from(mainNav.querySelectorAll('a')).map(a => {
                const href = a.getAttribute('href') || '';
                return href.split('?')[0].replace(/\/$/, '');
            });

            LINKS_TO_ADD.forEach(linkConfig => {
                if (document.getElementById(linkConfig.id)) return;

                const targetRelativePath = (getBasePath() + linkConfig.path).replace(/\/$/, '');

                const alreadyExists = existingHrefs.some(href =>
                    href === targetRelativePath ||
                    href.endsWith(linkConfig.path)
                );

                if (!alreadyExists) {
                    const listItem = createNavItemElement(linkConfig);
                    mainNav.appendChild(listItem);
                    initNodebbTooltip(listItem);
                }
            });
        }

        return { injectLinks };
    })();

    // =================================================================
    // MODULE 5: Recent Topics (נושאים אחרונים)
    // =================================================================
    const recentTopicsModule = (function() {
        function getSearchUrl() {
            return getBasePath() + '/search?in=titles&term=&matchWords=all&by=&categories=&searchChildren=false&hasTags=&replies=&repliesFilter=atleast&timeFilter=newer&timeRange=&sortBy=topic.timestamp&sortDirection=desc&showAs=topics';
        }

        function injectButton() {
            // אם ה-ID שלנו כבר שם – אין צורך להמשיך
            if (document.getElementById('nbe-link-recent-topics')) return;

            const mainNav = document.getElementById('main-nav') || document.querySelector('.navbar-nav');
            if (!mainNav) return;

            // בדיקת כפילות חכמה: סריקה האם כבר קיים כפתור שמפנה לפרמטרים של "נושאים אחרונים" (סקריפט עצמאי)
            if (mainNav.querySelector('a[href*="sortBy=topic.timestamp"]')) return;

            let anchorElement = Array.from(mainNav.querySelectorAll('a')).find(a => {
                const href = a.getAttribute('href');
                return href && (href.endsWith('/recent') || href === '/recent');
            });

            if (!anchorElement) return;

            const li = document.createElement('li');
            li.id = 'nbe-link-recent-topics';
            li.className = 'nav-item mx-2 nbe-custom-link';
            li.setAttribute('title', t('recentTopics'));

            const targetUrl = getSearchUrl();

            li.innerHTML = `
                <a class="nav-link navigation-link d-flex gap-2 justify-content-between align-items-center" href="${targetUrl}" aria-label="${t('recentTopics')}">
                    <span class="d-flex gap-2 align-items-center text-nowrap truncate-open">
                        <span class="position-relative">
                            <i class="fa fa-fw fa-history"></i>
                        </span>
                        <span class="nav-text small visible-open fw-semibold text-truncate">${t('recentTopics')}</span>
                    </span>
                </a>
            `;

            anchorElement.closest('li').insertAdjacentElement('afterend', li);
            initNodebbTooltip(li);

            li.querySelector('a').addEventListener('click', (e) => {
                sessionStorage.setItem('clickedRecentTopics', 'true');
            });
        }

        function updatePage() {
            if (sessionStorage.getItem('clickedRecentTopics') === 'true' && window.location.href.includes('sortBy=topic.timestamp')) {
                document.title = t('recentTopics');

                const titleEl = document.querySelector('.page-title,[component="search/title"]');
                if (titleEl && titleEl.textContent !== t('recentTopics')) {
                    titleEl.textContent = t('recentTopics');
                }

                const selectorsToHide =[
                    '.flex-shrink-0.pe-2.border-end-md.text-sm.mb-3',
                    '.d-flex.flex-wrap.gap-2.align-items-center[component="search/filters"]',
                    '.card.card-header.text-xs.px-2.py-1.fw-semibold.border-0.align-self-start'
                ];

                selectorsToHide.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => {
                        if (el.style.display !== 'none') el.style.display = 'none';
                    });
                });
            } else if (!window.location.href.includes('search')) {
                sessionStorage.removeItem('clickedRecentTopics');
            }
        }

        // מוודא שהכפתור דלוק רק כשאנחנו באמת בנושאים אחרונים
        function updateActiveState() {
            const li = document.getElementById('nbe-link-recent-topics');
            if (!li) return;
            const a = li.querySelector('a');

            if (sessionStorage.getItem('clickedRecentTopics') === 'true' && window.location.search.includes('sortBy=topic.timestamp')) {
                if (a) a.classList.add('active');
                li.classList.add('active');
            } else {
                if (a) a.classList.remove('active');
                li.classList.remove('active');
            }
        }

        return { injectButton, updatePage, updateActiveState };
    })();


    // =================================================================
    // EXECUTION: הרצת המודולים באופן מאוחד ואלגנטי
    // =================================================================

    dashboardModule.init();

    const globalObserver = new MutationObserver(() => {
        if (dashboardModule.isMySite()) {
            dashboardModule.ensureMenuButton();
            dashboardModule.updateActiveState();
        }
        sidebarLinksModule.injectLinks();

        recentTopicsModule.injectButton();
        recentTopicsModule.updatePage();
        recentTopicsModule.updateActiveState();

        exporterModule.injectExportDropdown();
        exporterModule.injectPostButtons();
    });

    globalObserver.observe(document.body, { childList: true, subtree: true });

    if (dashboardModule.isMySite()) {
        dashboardModule.ensureMenuButton();
        dashboardModule.updateActiveState();
    }
    sidebarLinksModule.injectLinks();

    recentTopicsModule.injectButton();
    recentTopicsModule.updatePage();
    recentTopicsModule.updateActiveState();

    exporterModule.injectExportDropdown();
    exporterModule.injectPostButtons();

})();
