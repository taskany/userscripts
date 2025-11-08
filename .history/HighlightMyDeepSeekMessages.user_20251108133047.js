// ==UserScript==
// @name         Highlight My DeepSeek Messages1111111111111
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlight my messages in DeepSeek chat
// @author       taskany
// @match        https://chat.deepseek.com/*
// @match        https://*.deepseek.com/*
// @grant        none
// @updateURL    https://cdn.jsdelivr.net/gh/taskany/userscripts@main/HighlightMyDeepSeekMessages.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/taskany/userscripts@main/HighlightMyDeepSeekMessages.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Стиль для ваших сообщений
    const myMessageStyle = {
        backgroundColor: '#9f9f9f', // светло-серый
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        padding: '12px 16px',
        margin: '8px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    };

    function highlightMyMessages() {
        // Ищем все элементы с классом fbb737a4 (ваши сообщения)
        const myMessages = document.querySelectorAll('.fbb737a4');

        myMessages.forEach(message => {
            // Применяем стили
            Object.assign(message.style, myMessageStyle);

            // Помечаем как обработанное
            if (!message.hasAttribute('data-my-message-highlighted')) {
                message.setAttribute('data-my-message-highlighted', 'true');
            }
        });
    }

    // Функция для наблюдения за изменениями DOM
    function observeChanges() {
        const observer = new MutationObserver(function(mutations) {
            let shouldUpdate = false;

            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate) {
                setTimeout(highlightMyMessages, 100);
            }
        });

        // Начинаем наблюдение за всем документом
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Запускаем когда страница загружена
    function init() {
        // Первоначальное применение стилей
        setTimeout(highlightMyMessages, 1000);

        // Запускаем наблюдение за изменениями
        observeChanges();

        // Также обновляем при изменении URL (для SPA)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(highlightMyMessages, 1000);
            }
        }).observe(document, { subtree: true, childList: true });
    }

    // Ждем полной загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Периодическая проверка на всякий случай
    setInterval(highlightMyMessages, 2000);

    console.log('DeepSeek Message Highlighter activated - targeting .fbb737a4');
})();
