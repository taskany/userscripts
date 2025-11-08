// ==UserScript==
// @name         GitHub Script Sync - No Spam
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  No tab spam, proper cache control
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
        CHECK_INTERVAL: 5000, // 5 секунд
        COOLDOWN_PERIOD: 30000 // 30 секунд cooldown после обновления
    };

    class GitHubSync {
        constructor() {
            this.lastContentHash = GM_getValue('lastContentHash', '');
            this.lastUpdateTime = GM_getValue('lastUpdateTime', 0);
            this.isCooldown = false;
            this.init();
        }

        init() {
            console.log('🚀 GitHub Sync запущен! Защита от спама вкладками');
            
            GM_registerMenuCommand('🔄 Установить обновление', () => this.installUpdate());
            GM_registerMenuCommand('📊 Статус', () => this.showStatus());
            GM_registerMenuCommand('🔧 Сбросить cooldown', () => this.resetCooldown());
            
            this.startWatching();
        }

        startWatching() {
            setInterval(() => this.checkForUpdates(), CONFIG.CHECK_INTERVAL);
        }

        async checkForUpdates() {
            // Проверяем cooldown период
            if (this.isCooldown) {
                const now = Date.now();
                if (now - this.lastUpdateTime < CONFIG.COOLDOWN_PERIOD) {
                    return;
                } else {
                    this.isCooldown = false;
                }
            }

            try {
                const response = await this.fetchGitHubFile();
                if (!response || response.status !== 200) return;

                const currentContent = response.responseText;
                const currentHash = this.hashCode(currentContent);

                if (this.lastContentHash === '') {
                    this.lastContentHash = currentHash;
                    GM_setValue('lastContentHash', currentHash);
                    console.log('✅ Первоначальный хеш сохранен:', currentHash.substring(0, 10));
                    return;
                }

                if (currentHash !== this.lastContentHash) {
                    console.log('🔄 Обнаружены изменения! Хеш:', currentHash.substring(0, 10));
                    this.handleUpdate(currentHash);
                }

            } catch (error) {
                console.error('GitHub sync error:', error);
            }
        }

        handleUpdate(newHash) {
            // Активируем cooldown период
            this.isCooldown = true;
            this.lastUpdateTime = Date.now();
            GM_setValue('lastUpdateTime', this.lastUpdateTime);
            
            // Обновляем хеш
            this.lastContentHash = newHash;
            GM_setValue('lastContentHash', newHash);

            // Ждем 5 секунд для обновления GitHub CDN
            setTimeout(() => {
                this.openInstallPage();
            }, 5000);
        }

        openInstallPage() {
            // ПРАВИЛЬНЫЙ URL с одним ?
            const installUrl = CONFIG.TARGET_SCRIPT_URL + '?install=' + Date.now();
            
            GM_notification({
                title: '📥 Обновление доступно',
                text: 'Открываю страницу установки...',
                timeout: 3000
            });

            console.log('📁 Открываю страницу установки:', installUrl);
            GM_openInTab(installUrl, { active: true });
        }

        installUpdate() {
            const installUrl = CONFIG.TARGET_SCRIPT_URL + '?install=' + Date.now();
            GM_openInTab(installUrl, { active: true });
        }

        resetCooldown() {
            this.isCooldown = false;
            this.lastUpdateTime = 0;
            GM_notification({
                title: '✅ Cooldown сброшен',
                text: 'Можно проверять обновления',
                timeout: 2000
            });
        }

        fetchGitHubFile() {
            return new Promise((resolve, reject) => {
                const url = CONFIG.TARGET_SCRIPT_URL + '?check=' + Date.now();
                
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: 10000,
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
            const cooldownLeft = this.isCooldown ? 
                Math.max(0, CONFIG.COOLDOWN_PERIOD - (Date.now() - this.lastUpdateTime)) / 1000 : 0;
            
            alert(`Статус синхронизации:\n\n` +
                  `• Cooldown: ${this.isCooldown ? 'активен' : 'не активен'}\n` +
                  `• Осталось cooldown: ${cooldownLeft.toFixed(0)} сек\n` +
                  `• Последнее обновление: ${this.lastUpdateTime ? new Date(this.lastUpdateTime).toLocaleTimeString() : 'никогда'}\n` +
                  `• Хеш: ${this.lastContentHash ? this.lastContentHash.substring(0, 10) + '...' : 'не установлен'}`);
        }
    }

    new GitHubSync();
})();