// ==UserScript==
// @name         Instant Script Updater
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Instant updates without CDN cache
// @author       taskany
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_URL = 'https://raw.githubusercontent.com/taskany/userscripts/main/HighlightMyDeepSeekMessages.user.js';

    GM_registerMenuCommand('⚡ Мгновенное обновление', () => {
        // Создаем УНИКАЛЬНЫЙ URL который никогда не кэшируется
        const uniqueUrl = SCRIPT_URL + '?instant=' + Date.now() + '&random=' + Math.random() + '&nocache=true';
        
        GM_notification({
            title: '⚡ Мгновенное обновление',
            text: 'Открываю актуальную версию...',
            timeout: 2000
        });

        console.log('🔗 Открываю URL:', uniqueUrl);
        GM_openInTab(uniqueUrl, { active: true });
    });

    console.log('⚡ Instant Updater запущен');
})();