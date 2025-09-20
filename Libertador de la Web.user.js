// ==UserScript==
// @name         Libertador de la Web
// @namespace    http://tampermonkey.net/
// @version      2025.09.19
// @description  Elimina restricciones comunes, muestra/copia la URL real de imágenes al hover (Ctrl+C) y permite seleccionar texto dentro de enlaces/elementos clicables (Opera-like). Menú Tampermonkey con toggles, incl. notificaciones.
// @author       wernser412
// @icon         https://github.com/wernser412/unlock-web/raw/refs/heads/main/ICONO.svg
// @downloadURL  https://github.com/wernser412/unlock-web/raw/refs/heads/main/Libertador%20de%20la%20Web.user.js
// @license      MIT
// @match        *://*/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';

  // ---------- Defaults ----------
  const defaultSettings = {
    rightClick: false,
    copyPaste: true,
    textSelection: true,
    consoleBypass: false,
    debuggerBypass: false,
    keyboardBypass: false,
    linkBypass: false,
    debugMode: false,
    iframeBypass: false,
    imageUrlTooltip: true,
    selectTextInLinks: false,
    showNotifications: true // 🔔 nuevo toggle
  };

  // ---------- Storage ----------
  let settings = GM_getValue('libertador_web_opciones', null);
  if (!settings) {
    settings = { ...defaultSettings };
    GM_setValue('libertador_web_opciones', settings);
  } else {
    settings = Object.assign({}, defaultSettings, settings);
    GM_setValue('libertador_web_opciones', settings);
  }
  const saveSettings = () => GM_setValue('libertador_web_opciones', settings);

  // ---------- Map names (español) ----------
  const mapName = (key) => ({
    rightClick: "Clic derecho",
    copyPaste: "Copiar / Pegar",
    textSelection: "Selección de texto",
    consoleBypass: "Bloqueo de consola",
    debuggerBypass: "Bloqueo de debugger",
    keyboardBypass: "Atajos de teclado",
    linkBypass: "Bloqueo de enlaces",
    debugMode: "Modo depuración",
    iframeBypass: "Aplicar en iframes",
    imageUrlTooltip: "Mostrar URL de imagen (Ctrl+C para copiar URL)",
    selectTextInLinks: "Seleccionar texto en elementos clicables",
    showNotifications: "Notificaciones"
  }[key] || key);

  // ---------- Tooltip (mostrar URL de imagen) ----------
  function attachImageUrlTooltip(win) {
    try {
      const doc = win.document;
      if (!doc || win.__libertadorTooltipAttached) return;
      win.__libertadorTooltipAttached = true;

      const tip = doc.createElement('div');
      tip.id = 'libertador-image-tooltip';
      Object.assign(tip.style, {
        position: 'fixed',
        zIndex: '2147483646',
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '6px 8px',
        borderRadius: '6px',
        font: '12px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        maxWidth: '60vw',
        wordBreak: 'break-all',
        display: 'none',
        pointerEvents: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,.5)'
      });
      try { doc.documentElement.appendChild(tip); } catch (e) {}

      doc.addEventListener('mousemove', (e) => {
        if (!settings.imageUrlTooltip) {
          tip.style.display = 'none';
          return;
        }
        const url = getImageUrlFrom(e.target, e, win);
        if (url) {
          tip.textContent = url;
          tip.__lastUrl = url;
          tip.style.display = 'block';
          tip.style.left = (e.clientX + 12) + 'px';
          tip.style.top = (e.clientY + 12) + 'px';
        } else {
          tip.style.display = 'none';
        }
      }, true);

      doc.addEventListener('keydown', (e) => {
        if (settings.imageUrlTooltip && tip.style.display === 'block' && e.ctrlKey && e.key.toLowerCase() === 'c') {
          const url = tip.__lastUrl || '';
          if (url) {
            GM_setClipboard(url);
            if (settings.showNotifications) {
              GM_notification({ text: 'URL copiada al portapapeles', title: 'Libertador de la Web', timeout: 1500 });
            }
          }
        }
      }, true);

      win.addEventListener('scroll', () => { tip.style.display = 'none'; }, true);
      win.addEventListener('blur', () => { tip.style.display = 'none'; }, true);
    } catch (e) {
      if (settings.debugMode) console.error('[Libertador] attachImageUrlTooltip error', e);
    }
  }

  // ---------- Toggle Menu ----------
  const menuCommands = {};
  const updateMenuCommand = (key) => {
    if (menuCommands[key]) GM_unregisterMenuCommand(menuCommands[key]);
    menuCommands[key] = GM_registerMenuCommand(
      `${settings[key] ? '✅' : '❌'} ${mapName(key)}`,
      () => toggleSetting(key)
    );
  };

  function toggleSetting(key) {
    settings[key] = !settings[key];
    saveSettings();
    applyToAllFrames();
    if (settings.showNotifications) {
      GM_notification({ text: `${mapName(key)} → ${settings[key] ? 'ACTIVADO' : 'DESACTIVADO'}`, title: 'Libertador de la Web', timeout: 1800 });
    }
    updateMenuCommand(key);
  }

  Object.keys(settings).forEach(updateMenuCommand);

  // ---------- (resto de tu lógica igual, abreviado aquí) ----------
  function getImageUrlFrom(el, event, win = window) {
    if (!el) return '';
    const doc = (win && win.document) ? win.document : document;
    // ... [tu código original de getImageUrlFrom sin cambios]
    return '';
  }

  function applyBypasses(win) {
    // ... [tu código original de applyBypasses sin cambios]
    try { attachImageUrlTooltip(win); } catch (e) {}
  }

  function applyToAllFrames() {
    applyBypasses(window);
    if (settings.iframeBypass) {
      for (let i = 0; i < window.frames.length; i++) {
        try { applyBypasses(window.frames[i]); } catch (e) {}
      }
    }
  }

  // Inicial
  applyToAllFrames();
  const observer = new MutationObserver(() => applyToAllFrames());
  observer.observe(document.documentElement, { childList: true, subtree: true });

})();
