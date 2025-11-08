// ==UserScript==
// @name         GitHub Script Sync - No Cache
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Force install with cache bypass
// @author       taskany
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_openInTab
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/taskany/userscripts/main/github-sync-manager.user.js
// @downloadURL  https://raw.githubusercontent.com/taskany/userscripts/main/github-sync-manager.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        TARGET_SCRIPT_URL: 'https://raw.githubusercontent.com/taskany/userscripts/main/HighlightMyDeepSeekMessages.user.js',
        CHECK_INTERVAL: 3000, // 3 секунды
        CACHE_BUSTER: true
    };

    class GitHubSync {
        constructor() {
            this.lastContentHash = GM_getValue('lastContentHash', '');
            this.updateDetected = false;
            this.init();
        }

        init() {
            console.log('🚀 GitHub Sync запущен! Обход кэша включен');
            
            GM_registerMenuCommand('🔄 Установить обновление', () => this.installUpdate());
            GM_registerMenuCommand('📊 Статус', () => this.showStatus());
            
            this.startWatching();
        }

        startWatching() {
            setInterval(() => this.checkForUpdates(), CONFIG.CHECK_INTERVAL);
        }

        async checkForUpdates() {
            try {
                const response = await this.fetchGitHubFile();
                if (!response || response.status !== 200) return;

                const currentContent = response.responseText;
                const currentHash = this.hashCode(currentContent);

                if (this.lastContentHash === '') {
                    this.lastContentHash = currentHash;
                    GM_setValue('lastContentHash', currentHash);
                    console.log('✅ Текущий хеш сохранен');
                    return;
                }

                if (currentHash !== this.lastContentHash && !this.updateDetected) {
                    console.log('🔄 Обнаружены изменения! Запускаем установку...');
                    this.updateDetected = true;
                    
                    // Ждем 2 секунды чтобы GitHub обновил кэш
                    setTimeout(() => {
                        this.forceInstallUpdate();
                    }, 2000);
                }

            } catch (error) {
                console.error('GitHub sync error:', error);
            }
        }

        forceInstallUpdate() {
            // Генерируем уникальный URL для обхода кэша
            const cacheBuster = '&t=' + Date.now() + '&nocache=' + Math.random();
            const installUrl = CONFIG.TARGET_SCRIPT_URL + cacheBuster;
            
            // Простое уведомление без лишних сообщений
            GM_notification({
                title: '📥 Обновление доступно',
                text: 'Открываю страницу установки...',
                timeout: 2000
            });

            // Открываем страницу установки
            GM_openInTab(installUrl, { active: true });
            
            // Сбрасываем флаг через 10 секунд
            setTimeout(() => {
                this.updateDetected = false;
            }, 10000);
        }

        installUpdate() {
            console.log('🔧 Ручная установка обновления...');
            const cacheBuster = '?t=' + Date.now() + '&nocache=' + Math.random();
            const installUrl = CONFIG.TARGET_SCRIPT_URL + cacheBuster;
            
            GM_openInTab(installUrl, { active: true });
        }

        fetchGitHubFile() {
            return new Promise((resolve, reject) => {
                // Всегда добавляем параметр для обхода кэша
                const url = CONFIG.TARGET_SCRIPT_URL + '?t=' + Date.now();
                
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: 8000,
                    onload: resolve,
                    onerror: reject
                });
            });
        }

        hashCode(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString();
        }

        showStatus() {
            const status = this.updateDetected ? 'обновление обнаружено' : 'ожидание изменений';
            alert(`Статус синхронизации:\n\n• Состояние: ${status}\n• URL: ${CONFIG.TARGET_SCRIPT_URL}`);
        }
    }

    new GitHubSync();
})();