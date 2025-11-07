// ==UserScript==
// @name         GitHub Userscript Sync
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Автоматическая синхронизация скриптов с GitHub
// @author       taskany
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listScripts
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @connect      cdn.jsdelivr.net
// @connect      raw.githubusercontent.com
// @connect      github.com
// @updateURL    https://cdn.jsdelivr.net/gh/taskany/userscripts@main/GitHub-Userscript-Sync.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/taskany/userscripts@main/GitHub-Userscript-Sync.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        githubUser: 'taskany',
        repoName: 'userscripts',
        branch: 'main',
        scriptsFolder: '',
        checkInterval: 10 * 60 * 1000,
        useCDN: true
    };

    class GitHubSync {
        constructor() {
            this.baseUrl = this.getBaseUrl();
            this.isSyncing = false;
            this.scriptsList = [
                'HighlightMyDeepSeekMessages.user.js',
                'GitHub-Userscript-Sync.user.js'
            ];
            this.init();
        }

        getBaseUrl() {
            if (CONFIG.useCDN) {
                return `https://cdn.jsdelivr.net/gh/${CONFIG.githubUser}/${CONFIG.repoName}@${CONFIG.branch}/`;
            }
            return `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.repoName}/${CONFIG.branch}/`;
        }

        init() {
            console.log('GitHub Sync: Инициализация', this.baseUrl);
            this.setupMenu();
            this.startAutoSync();
            setTimeout(() => this.checkOnStartup(), 3000);
        }

        setupMenu() {
            if (typeof GM_registerMenuCommand === 'function') {
                GM_registerMenuCommand('🔄 Проверить обновления', () => this.manualSync());
                GM_registerMenuCommand('📋 Статус скриптов', () => this.showStatus());
            }
        }

        startAutoSync() {
            setInterval(() => {
                if (!this.isSyncing) {
                    this.checkAllScripts();
                }
            }, CONFIG.checkInterval);
        }

        async manualSync() {
            if (this.isSyncing) return;
            this.showNotification('🔍 Проверяю обновления...', 'info');
            await this.checkAllScripts();
        }

        async checkAllScripts() {
            if (this.isSyncing) return;
            this.isSyncing = true;

            try {
                for (const scriptName of this.scriptsList) {
                    try {
                        const isAvailable = await this.checkScriptAvailable(scriptName);
                        if (isAvailable) {
                            console.log(`Скрипт доступен: ${scriptName}`);
                            // Для установки просто открываем ссылку
                            window.open(this.baseUrl + scriptName, '_blank');
                        }
                    } catch (error) {
                        console.error(`Ошибка для ${scriptName}:`, error);
                    }
                }
            } catch (error) {
                console.error('GitHub Sync: Ошибка синхронизации', error);
            } finally {
                this.isSyncing = false;
            }
        }

        async showStatus() {
            let statusMessage = '📋 СТАТУС СКРИПТОВ:\n\n';
            
            for (const scriptName of this.scriptsList) {
                const isAvailable = await this.checkScriptAvailable(scriptName);
                statusMessage += `${isAvailable ? '✅' : '❌'} ${scriptName}\n`;
            }
            
            alert(statusMessage);
        }

        async checkScriptAvailable(scriptName) {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: this.baseUrl + scriptName,
                    timeout: 5000,
                    onload: (response) => resolve(response.status === 200),
                    onerror: () => resolve(false),
                    ontimeout: () => resolve(false)
                });
            });
        }

        showNotification(message, type = 'info') {
            console.log(`GitHub Sync: ${message}`);
        }
    }

    new GitHubSync();
})();
