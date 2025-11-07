// ==UserScript==
// @name         GitHub Userscript Sync
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Автоматическая синхронизация скриптов с GitHub
// @author       taskany
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listScripts
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_download
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
        }

        setupMenu() {
            if (typeof GM_registerMenuCommand === 'function') {
                GM_registerMenuCommand('🔄 Проверить обновления', () => this.manualSync());
                GM_registerMenuCommand('📋 Статус скриптов', () => this.showStatus());
                GM_registerMenuCommand('🔧 Установить вручную', () => this.manualInstall());
            }
        }

        startAutoSync() {
            // Проверка при загрузке
            setTimeout(() => this.checkAllScripts(), 5000);
            
            // Периодическая проверка
            setInterval(() => {
                if (!this.isSyncing) {
                    this.checkAllScripts();
                }
            }, CONFIG.checkInterval);
        }

        async manualSync() {
            if (this.isSyncing) {
                this.showNotification('Синхронизация уже выполняется', 'info');
                return;
            }
            this.showNotification('🔍 Проверяю обновления...', 'info');
            await this.checkAllScripts();
        }

        async checkAllScripts() {
            if (this.isSyncing) return;
            this.isSyncing = true;

            try {
                const installedScripts = GM_listScripts();
                let updatedCount = 0;

                for (const scriptName of this.scriptsList) {
                    try {
                        const needsUpdate = await this.needsUpdate(scriptName, installedScripts);
                        if (needsUpdate) {
                            await this.installScript(scriptName);
                            updatedCount++;
                        }
                    } catch (error) {
                        console.error(`Ошибка для ${scriptName}:`, error);
                    }
                }

                if (updatedCount > 0) {
                    this.showNotification(`✅ Доступно обновлений: ${updatedCount}`, 'success');
                }

            } catch (error) {
                console.error('GitHub Sync: Ошибка синхронизации', error);
            } finally {
                this.isSyncing = false;
            }
        }

        async needsUpdate(scriptName, installedScripts) {
            const installedScript = installedScripts.find(s => s.name === scriptName.replace('.user.js', ''));
            
            if (!installedScript) {
                console.log(`Скрипт ${scriptName} не установлен`);
                return true;
            }

            // Получаем удаленную версию
            const remoteVersion = await this.getRemoteVersion(scriptName);
            const localVersion = installedScript.version;

            console.log(`Версии ${scriptName}: локальная=${localVersion}, удаленная=${remoteVersion}`);

            if (remoteVersion && remoteVersion !== localVersion) {
                console.log(`Обновление нужно для ${scriptName}`);
                return true;
            }

            return false;
        }

        async getRemoteVersion(scriptName) {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: this.baseUrl + scriptName + '?t=' + Date.now(),
                    timeout: 5000,
                    onload: function(response) {
                        if (response.status === 200) {
                            const versionMatch = response.responseText.match(/@version\s+([^\n\r]+)/);
                            resolve(versionMatch ? versionMatch[1].trim() : null);
                        } else {
                            resolve(null);
                        }
                    },
                    onerror: () => resolve(null),
                    ontimeout: () => resolve(null)
                });
            });
        }

        async installScript(scriptName) {
            return new Promise((resolve) => {
                const scriptUrl = this.baseUrl + scriptName;
                console.log(`Установка: ${scriptUrl}`);

                // Метод 1: Открываем в новом окне
                const newWindow = window.open(scriptUrl, '_blank');
                
                if (newWindow) {
                    console.log(`Окно установки открыто для ${scriptName}`);
                    setTimeout(() => {
                        newWindow.close();
                        resolve();
                    }, 3000);
                } else {
                    // Метод 2: Создаем ссылку
                    console.log(`Создаем ссылку для ${scriptName}`);
                    const link = document.createElement('a');
                    link.href = scriptUrl;
                    link.target = '_blank';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                        resolve();
                    }, 1000);
                }
            });
        }

        async manualInstall() {
            let message = '🔧 РУЧНАЯ УСТАНОВКА СКРИПТОВ\n\n';
            message += 'Откройте эти ссылки вручную:\n\n';
            
            this.scriptsList.forEach(scriptName => {
                const url = this.baseUrl + scriptName;
                message += `${scriptName}:\n${url}\n\n`;
            });

            message += 'Инструкция:\n';
            message += '1. Откройте каждую ссылку\n';
            message += '2. Tampermonkey предложит установку\n';
            message += '3. Нажмите "Install" или "Update"';

            alert(message);
        }

        async showStatus() {
            const installedScripts = GM_listScripts();
            let statusMessage = '📋 СТАТУС СКРИПТОВ:\n\n';
            
            for (const scriptName of this.scriptsList) {
                const displayName = scriptName.replace('.user.js', '');
                const installed = installedScripts.find(s => s.name === displayName);
                const isAvailable = await this.checkScriptAvailable(scriptName);
                
                statusMessage += `${isAvailable ? '✅' : '❌'} ${displayName}\n`;
                statusMessage += `   Установлен: ${installed ? '✅' : '❌'}\n`;
                if (installed) {
                    statusMessage += `   Версия: ${installed.version}\n`;
                }
                statusMessage += '\n';
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
            if (typeof GM_notification === 'function') {
                GM_notification({
                    text: message,
                    title: 'GitHub Sync',
                    timeout: 3000,
                    onclick: () => this.showStatus()
                });
            }
        }
    }

    new GitHubSync();
})();
