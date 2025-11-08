// ==UserScript==
// @name         GitHub Script Sync - Fixed URL
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Fixed URL format for GitHub
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
        CHECK_INTERVAL: 3000
    };

    class GitHubSync {
        constructor() {
            this.lastContentHash = GM_getValue('lastContentHash', '');
            this.updateDetected = false;
            this.init();
        }

        init() {
            console.log('🚀 GitHub Sync запущен! Исправленный URL формат');
            
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
                    return;
                }

                if (currentHash !== this.lastContentHash && !this.updateDetected) {
                    console.log('🔄 Обнаружены изменения!');
                    this.updateDetected = true;
                    
                    // Ждем 3 секунды чтобы GitHub обновил кэш
                    setTimeout(() => {
                        this.forceInstallUpdate();
                    }, 3000);
                }

            } catch (error) {
                console.error('GitHub sync error:', error);
            }
        }

        forceInstallUpdate() {
            // ПРАВИЛЬНЫЙ формат URL с одним ?
            const installUrl = CONFIG.TARGET_SCRIPT_URL + '?t=' + Date.now();
            
            GM_notification({
                title: '📥 Обновление доступно',
                text: 'Открываю страницу установки...',
                timeout: 2000
            });

            GM_openInTab(installUrl, { active: true });
            
            setTimeout(() => {
                this.updateDetected = false;
            }, 10000);
        }

        installUpdate() {
            // ПРАВИЛЬНЫЙ формат URL для ручной установки
            const installUrl = CONFIG.TARGET_SCRIPT_URL + '?install=' + Date.now();
            GM_openInTab(installUrl, { active: true });
        }

        fetchGitHubFile() {
            return new Promise((resolve, reject) => {
                // ПРАВИЛЬНЫЙ формат URL для проверки
                const url = CONFIG.TARGET_SCRIPT_URL + '?check=' + Date.now();
                
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
            alert(`Статус синхронизации:\n\nURL: ${CONFIG.TARGET_SCRIPT_URL}`);
        }
    }

    new GitHubSync();
})();