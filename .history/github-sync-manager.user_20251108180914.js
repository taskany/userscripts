// ==UserScript==
// @name         Smart Script Updater
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Smart updater with CDN cache awareness
// @author       taskany
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_notification
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_URL = 'https://raw.githubusercontent.com/taskany/userscripts/main/HighlightMyDeepSeekMessages.user.js';
    let currentVersion = '';

    // Получаем текущую версию при загрузке
    fetchVersion().then(version => {
        currentVersion = version;
        console.log('✅ Текущая версия на GitHub:', currentVersion);
    });

    GM_registerMenuCommand('🔄 Умное обновление', () => smartUpdate());
    GM_registerMenuCommand('🚀 Принудительное обновление', () => forceUpdate());

    async function smartUpdate() {
        GM_notification({
            title: '🔍 Проверяем обновления...',
            text: 'Ожидаем обновление GitHub CDN',
            timeout: 3000
        });

        const newVersion = await fetchVersion();
        
        if (!newVersion) {
            alert('Не удалось проверить версию');
            return;
        }

        console.log('🔄 GitHub версия:', newVersion, 'Текущая:', currentVersion);

        if (newVersion !== currentVersion) {
            // Версия обновилась - открываем установку
            openInstallPage();
            currentVersion = newVersion;
        } else {
            // Версия старая - предлагаем подождать
            const wait = confirm(
                `Версия на GitHub еще не обновилась!\n\n` +
                `Текущая: ${currentVersion}\n` +
                `GitHub CDN может задерживать обновления до 5 минут.\n\n` +
                `Хотите открыть страницу установки сейчас?`
            );
            
            if (wait) {
                openInstallPage();
            }
        }
    }

    function forceUpdate() {
        // Всегда открываем страницу установки
        openInstallPage();
        
        GM_notification({
            title: '🚀 Принудительное обновление',
            text: 'Открываю страницу установки',
            timeout: 2000
        });
    }

    function openInstallPage() {
        const url = SCRIPT_URL + '?force=' + Date.now();
        GM_openInTab(url, { active: true });
    }

    async function fetchVersion() {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: SCRIPT_URL + '?v=' + Date.now(),
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        const versionMatch = response.responseText.match(/@version\s+([\d.]+)/);
                        resolve(versionMatch ? versionMatch[1] : null);
                    } else {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        });
    }

    console.log('🤖 Smart Updater запущен');
})();