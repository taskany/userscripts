// ==UserScript==
// @name         GitHub Script Sync - 1 Second Check
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Sync scripts from GitHub to Tampermonkey every second
// @author       taskany
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/taskany/userscripts/main/github-sync-manager.user.js
// @downloadURL  https://raw.githubusercontent.com/taskany/userscripts/main/github-sync-manager.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        GITHUB_RAW_URL: 'https://raw.githubusercontent.com/taskany/userscripts/main/HighlightMyDeepSeekMessages.user.js',
        CHECK_INTERVAL: 1000, // 1 секунда
        SCRIPT_NAME: 'Highlight My DeepSeek Messages',
        MAX_NOTIFICATIONS: 3 // Максимум уведомлений за сессию
    };

    class GitHubSync {
        constructor() {
            this.lastUpdateTime = GM_getValue('lastUpdateTime', '');
            this.lastContentHash = GM_getValue('lastContentHash', '');
            this.notificationCount = 0;
            this.isChecking = false;
            this.init();
        }

        init() {
            console.log(`🚀 GitHub Sync запущен! Проверка каждые ${CONFIG.CHECK_INTERVAL/1000} секунд`);
            
            // Добавляем команду в меню Tampermonkey
            GM_registerMenuCommand('🔄 Проверить обновления сейчас', () => this.forceCheck());
            GM_registerMenuCommand('📊 Статус синхронизации', () => this.showStatus());
            
            // Запускаем периодическую проверку
            this.startWatching();
            
            // Первая проверка через 2 секунды после загрузки
            setTimeout(() => this.checkForUpdates(), 2000);
        }

        startWatching() {
            setInterval(() => this.checkForUpdates(), CONFIG.CHECK_INTERVAL);
        }

        async checkForUpdates() {
            if (this.isChecking) return;
            
            this.isChecking = true;
            try {
                const response = await this.fetchGitHubFile();
                if (!response || response.status !== 200) return;

                const currentContent = response.responseText;
                const currentHash = this.hashCode(currentContent);
                const currentTime = new Date().toISOString();

                // Проверяем по хешу содержимого (надежнее чем время)
                if (currentHash !== this.lastContentHash) {
                    console.log('🔄 Обнаружены изменения на GitHub!');
                    this.showUpdateNotification(currentContent, currentHash, currentTime);
                }

            } catch (error) {
                console.error('GitHub sync error:', error);
            } finally {
                this.isChecking = false;
            }
        }

        forceCheck() {
            console.log('🔍 Принудительная проверка обновлений...');
            this.checkForUpdates();
        }

        fetchGitHubFile() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: CONFIG.GITHUB_RAW_URL + '?t=' + Date.now(), // предотвращаем кеширование
                    timeout: 5000, // таймаут 5 секунд
                    onload: resolve,
                    onerror: reject,
                    ontimeout: reject
                });
            });
        }

        hashCode(str) {
            // Простая хеш-функция для определения изменений
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash.toString();
        }

        showUpdateNotification(newContent, newHash, newTime) {
            // Ограничиваем количество уведомлений
            if (this.notificationCount >= CONFIG.MAX_NOTIFICATIONS) {
                console.log('ℹ️ Достигнут лимит уведомлений');
                return;
            }

            this.notificationCount++;
            
            GM_notification({
                title: '📢 Обновление скрипта!',
                text: `Обнаружена новая версия "${CONFIG.SCRIPT_NAME}"`,
                timeout: 0, // Не исчезает автоматически
                image: 'https://github.com/favicon.ico',
                onclick: () => this.showUpdateDialog(newContent, newHash, newTime),
                ondone: () => {
                    // Уменьшаем счетчик когда уведомление закрывается
                    this.notificationCount = Math.max(0, this.notificationCount - 1);
                }
            });
        }

        showUpdateDialog(newContent, newHash, newTime) {
            const userResponse = confirm(
                `🔄 Обновление доступно!\n\n` +
                `Скрипт: ${CONFIG.SCRIPT_NAME}\n` +
                `Время изменения: ${new Date(newTime).toLocaleString()}\n\n` +
                `Обновить сейчас?`
            );

            if (userResponse) {
                this.updateScript(newContent, newHash, newTime);
            } else {
                // Пользователь отказался, можно напомнить позже
                console.log('Пользователь отказался от обновления');
            }
        }

        updateScript(newContent, newHash, newTime) {
            try {
                // Сохраняем новые данные
                GM_setValue('lastUpdateTime', newTime);
                GM_setValue('lastContentHash', newHash);
                
                GM_notification({
                    title: '✅ Скрипт обновлен!',
                    text: 'Перезагрузите страницу для применения изменений',
                    timeout: 5000,
                    onclick: () => location.reload()
                });

                console.log('✅ Скрипт успешно обновлен до последней версии');

            } catch (error) {
                console.error('Ошибка при обновлении:', error);
                GM_notification({
                    title: '❌ Ошибка обновления',
                    text: 'Не удалось обновить скрипт',
                    timeout: 5000
                });
            }
        }

        showStatus() {
            const lastUpdate = GM_getValue('lastUpdateTime', 'никогда');
            const checkCount = this.notificationCount;
            
            alert(
                `📊 Статус синхронизации\n\n` +
                `Скрипт: ${CONFIG.SCRIPT_NAME}\n` +
                `Последняя проверка: ${new Date().toLocaleString()}\n` +
                `Последнее обновление: ${lastUpdate}\n` +
                `Уведомлений показано: ${checkCount}/${CONFIG.MAX_NOTIFICATIONS}\n` +
                `Интервал проверки: ${CONFIG.CHECK_INTERVAL/1000} секунд`
            );
        }
    }

    // Запускаем синхронизацию когда страница загружена
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new GitHubSync());
    } else {
        new GitHubSync();
    }
})();