// ==UserScript==
// @name         TM Sync Manager
// @namespace    https://github.com/taskany/userscripts
// @version      1.0
// @description  Sync Tampermonkey scripts from GitHub
// @author       taskany
// @match        https://github.com/taskany/userscripts*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @connect      raw.githubusercontent.com
// @connect      github.com
// @updateURL    https://raw.githubusercontent.com/taskany/userscripts/main/TM_Sync_Manager.user.js
// @downloadURL  https://raw.githubusercontent.com/taskany/userscripts/main/TM_Sync_Manager.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    class TMSyncManager {
        constructor() {
            this.config = {
                repoOwner: 'taskany',
                repoName: 'userscripts',
                branch: 'main',
                scripts: [
                    {
                        filename: 'HighlightMyDeepSeekMessages.user.js',
                        name: 'Highlight My DeepSeek Messages'
                    }
                    // Добавьте другие скрипты здесь по мере необходимости
                ]
            };
            this.init();
        }
        
        init() {
            // Регистрируем команду в меню Tampermonkey
            GM_registerMenuCommand('🔄 Sync All Scripts', () => this.syncAllScripts());
            GM_registerMenuCommand('📝 Check for Updates', () => this.checkUpdates());
            
            console.log('TM Sync Manager initialized');
        }
        
        async syncAllScripts() {
            const results = [];
            
            for (const script of this.config.scripts) {
                try {
                    const result = await this.syncSingleScript(script);
                    results.push(result);
                } catch (error) {
                    results.push({
                        script: script.name,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            this.showResults(results);
            return results;
        }
        
        async syncSingleScript(scriptConfig) {
            const remoteUrl = this.getRawUrl(scriptConfig.filename);
            const localKey = `script_${scriptConfig.filename}`;
            
            try {
                // Получаем контент с GitHub
                const remoteContent = await this.fetchRemoteContent(remoteUrl);
                
                if (!remoteContent) {
                    throw new Error('Empty content received');
                }
                
                // Проверяем версию
                const remoteVersion = this.extractVersion(remoteContent);
                const localVersion = GM_getValue(`${localKey}_version`, '0.0.0');
                
                if (remoteVersion !== localVersion) {
                    // Сохраняем новый контент
                    GM_setValue(`${localKey}_content`, remoteContent);
                    GM_setValue(`${localKey}_version`, remoteVersion);
                    GM_setValue(`${localKey}_lastUpdate`, new Date().toISOString());
                    
                    return {
                        script: scriptConfig.name,
                        success: true,
                        updated: true,
                        version: remoteVersion,
                        message: `Updated to v${remoteVersion}`
                    };
                } else {
                    return {
                        script: scriptConfig.name,
                        success: true,
                        updated: false,
                        version: remoteVersion,
                        message: 'Already up to date'
                    };
                }
                
            } catch (error) {
                console.error(`Sync failed for ${scriptConfig.name}:`, error);
                throw error;
            }
        }
        
        async checkUpdates() {
            const updates = [];
            
            for (const script of this.config.scripts) {
                try {
                    const remoteUrl = this.getRawUrl(script.filename);
                    const remoteContent = await this.fetchRemoteContent(remoteUrl);
                    const remoteVersion = this.extractVersion(remoteContent);
                    const localKey = `script_${script.filename}`;
                    const localVersion = GM_getValue(`${localKey}_version`, '0.0.0');
                    
                    if (remoteVersion !== localVersion) {
                        updates.push({
                            script: script.name,
                            current: localVersion,
                            available: remoteVersion,
                            updateAvailable: true
                        });
                    } else {
                        updates.push({
                            script: script.name,
                            current: localVersion,
                            available: remoteVersion,
                            updateAvailable: false
                        });
                    }
                } catch (error) {
                    updates.push({
                        script: script.name,
                        error: error.message,
                        updateAvailable: false
                    });
                }
            }
            
            this.showUpdateCheckResults(updates);
            return updates;
        }
        
        getRawUrl(filename) {
            return `https://raw.githubusercontent.com/${this.config.repoOwner}/${this.config.repoName}/${this.config.branch}/${filename}`;
        }
        
        fetchRemoteContent(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: function(response) {
                        if (response.status === 200) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                        }
                    },
                    onerror: function(error) {
                        reject(new Error(`Network error: ${error}`));
                    },
                    timeout: 15000
                });
            });
        }
        
        extractVersion(content) {
            // Ищем версию в мета-блоке
            const versionMatch = content.match(/@version\s+([^\s\r\n]+)/);
            return versionMatch ? versionMatch[1] : '0.0.0';
        }
        
        showResults(results) {
            const updated = results.filter(r => r.updated).length;
            const total = results.length;
            
            let message = `Sync completed!\n\n`;
            results.forEach(result => {
                const status = result.success ? 
                    (result.updated ? '✅ Updated' : 'ℹ️ Up to date') : 
                    '❌ Failed';
                message += `${result.script}: ${status}\n`;
                if (result.message) {
                    message += `  ${result.message}\n`;
                }
            });
            
            GM_notification({
                text: message,
                title: `TM Sync - ${updated}/${total} updated`,
                timeout: 5000
            });
            
            console.log('Sync results:', results);
        }
        
        showUpdateCheckResults(updates) {
            const availableUpdates = updates.filter(u => u.updateAvailable && !u.error);
            
            let message = `Update check completed!\n\n`;
            updates.forEach(update => {
                if (update.error) {
                    message += `${update.script}: ❌ Error - ${update.error}\n`;
                } else if (update.updateAvailable) {
                    message += `${update.script}: 🔄 Update available (${update.current} → ${update.available})\n`;
                } else {
                    message += `${update.script}: ✅ Up to date (v${update.current})\n`;
                }
            });
            
            GM_notification({
                text: message,
                title: `TM Sync - ${availableUpdates.length} update(s) available`,
                timeout: 5000
            });
        }
    }
    
    // Инициализация при загрузке
    new TMSyncManager();
})();
