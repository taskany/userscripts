// ==UserScript==
// @name         GitHub Script Sync - Force Install
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Force install updated scripts from GitHub
// @author       taskany
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_download
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/taskany/userscripts/main/github-sync-manager.user.js
// @downloadURL  https://raw.githubusercontent.com/taskany/userscripts/main/github-sync-manager.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        TARGET_SCRIPT_URL: 'https://raw.githubusercontent.com/taskany/userscripts/main/HighlightMyDeepSeekMessages.user.js',
        CHECK_INTERVAL: 2000, // 2 секунды
        INSTALL_DELAY: 1000
    };

    class GitHubSync {
        constructor() {
            this.lastContentHash = GM_getValue('lastContentHash', '');
            this.updateDetected = false;
            this.init();
        }

        init() {
            console.log('🚀 GitHub Sync запущен! Принудительная установка обновлений');
            
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

                // Первая проверка
                if (this.lastContentHash === '') {
                    this.lastContentHash = currentHash;
                    GM_setValue('lastContentHash', currentHash);
                    console.log('✅ Текущий хеш сохранен');
                    return;
                }

                // Обнаружены изменения
                if (currentHash !== this.lastContentHash && !this.updateDetected) {
                    console.log('🔄 Обнаружены изменения! Запускаем установку...');
                    this.updateDetected = true;
                    this.forceInstallUpdate(currentContent, currentHash);
                }

            } catch (error) {
                console.error('GitHub sync error:', error);
            }
        }

        forceInstallUpdate(newContent, newHash) {
            // Сохраняем новый хеш сразу
            this.lastContentHash = newHash;
            GM_setValue('lastContentHash', newHash);

            // Показываем уведомление
            GM_notification({
                title: '📥 Обновление обнаружено!',
                text: 'Открываю страницу установки...',
                timeout: 4000
            });

            // Открываем страницу установки
            setTimeout(() => {
                this.openInstallPage();
            }, CONFIG.INSTALL_DELAY);
        }

        openInstallPage() {
            // Открываем прямую ссылку на скрипт
            const installUrl = CONFIG.TARGET_SCRIPT_URL + '?install=' + Date.now();
            GM_openInTab(installUrl, { active: true });
            
            // Дополнительное уведомление с инструкцией
            setTimeout(() => {
                const userResponse = confirm(
                    'ОБНОВЛЕНИЕ СКРИПТА!\n\n' +
                    '1. На открывшейся вкладке нажмите "Install"\n' +
                    '2. Подтвердите замену существующего скрипта\n' +
                    '3. Перезагрузите страницу\n\n' +
                    'Нажмите ОК чтобы продолжить или Отмена чтобы пропустить.'
                );
                
                if (userResponse) {
                    // Показываем напоминание о перезагрузке
                    setTimeout(() => {
                        alert('Не забудьте перезагрузить страницу после установки!');
                    }, 2000);
                }
            }, 1500);
        }

        installUpdate() {
            console.log('🔧 Ручная установка обновления...');
            this.openInstallPage();
        }

        fetchGitHubFile() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: CONFIG.TARGET_SCRIPT_URL + '?t=' + Date.now(),
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
            alert(`Статус синхронизации:\n\n• Состояние: ${status}\n• Хеш: ${this.lastContentHash ? 'сохранен' : 'не установлен'}\n• URL: ${CONFIG.TARGET_SCRIPT_URL}`);
        }
    }

    new GitHubSync();
})();