// ==UserScript==
// @name         iOSAutoUpdate1
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Частая проверка обновлений на iOS
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('📱 iOS Auto Update started');
    
    // Проверка обновлений каждые 2 минуты
    setInterval(() => {
        if (typeof Tampermonkey !== 'undefined') {
            Tampermonkey.checkForUpdates();
            console.log('🔍 Checking for updates...');
        }
    }, 1000);
    
    // Проверка при загрузке каждой страницы
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (typeof Tampermonkey !== 'undefined') {
                Tampermonkey.checkForUpdates();
                console.log('🔍 Page load update check');
            }
        }, 1000);
    });
    
    // Проверка при возвращении на вкладку (для Safari iOS)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(() => {
                if (typeof Tampermonkey !== 'undefined') {
                    Tampermonkey.checkForUpdates();
                    console.log('🔍 Visibility change update check');
                }
            }, 1000);
        }
    });
})();
