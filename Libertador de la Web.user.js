// ==UserScript==
// @name         Libertador de la Web
// @namespace    http://tampermonkey.net/
// @version      2025.09.19
// @description  Elimina restricciones comunes, muestra/copia la URL real de imágenes al hover (Ctrl+C para copiar URL) y permite seleccionar texto dentro de enlaces/elementos clicables (Opera-like). Menú Tampermonkey con toggles, incl. notificaciones.
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

  // ---------- Opera-like "select text inside link" ----------
  function attachOperaSelectToWindow(win) {
    try {
      if (win.__libertadorOperaAttached) return;
      win.__libertadorOperaAttached = true;
      const doc = win.document;
      if (!doc) return;

      if (!doc.getElementById('libertador-select-inside-link-style')) {
        const s = doc.createElement('style');
        s.id = 'libertador-select-inside-link-style';
        s.textContent = `.select-text-inside-a-link {
          -moz-user-select: text !important;
          -webkit-user-select: text !important;
          user-select: text !important;
        }`;
        (doc.head || doc.documentElement).appendChild(s);
      }

      const tracker = (() => {
        const moves = [[0, 0], [0, 0], [0, 0]];
        let index = 0;
        doc.addEventListener("mousemove", e => {
          moves[index][0] = e.pageX;
          moves[index][1] = e.pageY;
          index = (index + 1) % 3;
        }, true);
        return () => {
          const output = [];
          for (let i = 0; i < 2; i++) {
            output.push(
              Math.abs(moves[index][i] - moves[(index + 1) % 3][i]) +
              Math.abs(moves[(index + 1) % 3][i] - moves[(index + 2) % 3][i])
            );
          }
          return output;
        };
      })();

      const selection = win.getSelection ? win.getSelection() : null;
      let STATE = "WAITING";
      let preState;
      let mousemoves = 0;
      let linkTarget = null;
      const initPos = [0, 0];
      let selectType = null;

      function caretPositionFromPoint(x, y) {
        if (doc.caretPositionFromPoint) return doc.caretPositionFromPoint(x, y);
        if (doc.caretRangeFromPoint) {
          const r = doc.caretRangeFromPoint(x, y);
          return { offsetNode: r.startContainer, offset: r.startOffset };
        }
        return { offsetNode: doc.body, offset: 0 };
      }
      function getInitPos() { return caretPositionFromPoint(initPos[0] - win.scrollX, initPos[1] - win.scrollY); }
      function inSelect(caretPos, sel) {
        try {
          if (!sel) return false;
          for (let i = 0; i < sel.rangeCount; i++) {
            const range = sel.getRangeAt(i);
            if (range.isPointInRange(caretPos.offsetNode, caretPos.offset)) return true;
          }
        } catch {}
        return false;
      }
      function findLinkTarget(target) {
        while (target && target.nodeName !== "A") target = target.parentNode;
        return target;
      }
      function shouldStart(e) {
        const delta = tracker();
        return delta[0] >= delta[1];
      }
      function startWaiting() {
        try { if (linkTarget) linkTarget.classList.remove("select-text-inside-a-link"); } catch {}
        STATE = "WAITING";
        linkTarget = null;
      }
      function startSelecting(e) {
        if (!shouldStart(e)) return startWaiting();
        if (e.type === "dragstart") e.preventDefault();
        if (!selection) return startWaiting();
        if (selectType === "new") {
          const pos = getInitPos();
          selection.collapse(pos.offsetNode, pos.offset);
        } else if (selectType === "add") {
          const range = new Range();
          const pos = getInitPos();
          range.setStart(pos.offsetNode, pos.offset);
          selection.addRange(range);
        }
        STATE = "STARTED";
      }
      function onMouseDown(e) {
        if (STATE !== "WAITING") return;
        if (e.altKey || e.button !== 0) return;
        if (/img/i.test(e.target.nodeName)) return;
        const target = findLinkTarget(e.target);
        if (!target || !target.href) return;
        selectType = e.ctrlKey ? "add" : e.shiftKey ? "extend" : "new";
        initPos[0] = e.pageX; initPos[1] = e.pageY;
        if (selectType === "new") {
          if (!selection.isCollapsed && inSelect(getInitPos(), selection)) return;
        }
        mousemoves = 0;
        STATE = "STARTING";
        linkTarget = target;
        linkTarget.classList.add("select-text-inside-a-link");
      }
      function onMouseMove(e) {
        if (STATE === "STARTING") { if (++mousemoves >= 3) startSelecting(e); }
        if (STATE === "STARTED") {
          try {
            const caretPos = caretPositionFromPoint(e.pageX - win.scrollX, e.pageY - win.scrollY);
            if (selection && caretPos && typeof selection.extend === 'function') {
              selection.extend(caretPos.offsetNode, caretPos.offset);
            }
          } catch (err) { if (settings.debugMode) console.error('[Libertador] extend error', err); }
        }
      }
      function onMouseUp() {
        if (STATE !== "WAITING") {
          preState = STATE;
          STATE = "ENDING";
          setTimeout(startWaiting, 0);
        }
      }
      function onClick(e) {
        if (STATE === "ENDING" && preState === "STARTED" && findLinkTarget(e.target) === linkTarget) {
          e.preventDefault(); e.stopImmediatePropagation();
        }
        startWaiting();
      }
      function onDragStart(e) {
        if (STATE === "STARTED") { e.preventDefault(); return; }
        if (STATE === "STARTING") startSelecting(e);
      }

      doc.addEventListener('mousedown', onMouseDown, true);
      doc.addEventListener('mousemove', onMouseMove, true);
      doc.addEventListener('mouseup', onMouseUp, true);
      doc.addEventListener('click', onClick, true);
      doc.addEventListener('dragstart', onDragStart, true);

    } catch (e) { if (settings.debugMode) console.error('[Libertador] Opera-like error', e); }
  }

  // ---------- getImageUrlFrom ----------
  function getImageUrlFrom(el, event, win = window) {
    if (!el) return '';
    const doc = (win && win.document) ? win.document : document;
    function getUrlFromNode(node) {
      if (!node || node.nodeType !== 1) return '';
      const tag = node.nodeName.toLowerCase();
      if (tag === 'img') return node.currentSrc || node.getAttribute('src') || node.src || '';
      if (node.namespaceURI === 'http://www.w3.org/2000/svg' && tag === 'image') {
        return node.getAttribute('href') || node.getAttribute('xlink:href') || '';
      }
      const cs = win.getComputedStyle(node);
      if (cs && cs.backgroundImage && cs.backgroundImage !== 'none') {
        const m = cs.backgroundImage.match(/url\((?:'|")?(.+?)(?:'|")?\)/);
        if (m && m[1]) return m[1];
      }
      return '';
    }
    if (event && typeof doc.elementsFromPoint === 'function') {
      const elems = doc.elementsFromPoint(event.clientX, event.clientY) || [];
      for (let node of elems) {
        let url = getUrlFromNode(node);
        if (url) return url;
      }
    }
    return '';
  }

  // ---------- Tooltip ----------
  function attachImageUrlTooltip(win) {
    try {
      const doc = win.document;
      if (!doc || win.__libertadorTooltipAttached) return;
      win.__libertadorTooltipAttached = true;

      const tip = doc.createElement('div');
      Object.assign(tip.style, {
        position: 'fixed', zIndex: '2147483646',
        background: 'rgba(0,0,0,0.85)', color: '#fff',
        padding: '6px 8px', borderRadius: '6px',
        font: '12px/1.3 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        maxWidth: '60vw', wordBreak: 'break-all',
        display: 'none', pointerEvents: 'none'
      });
      doc.documentElement.appendChild(tip);

      doc.addEventListener('mousemove', (e) => {
        if (!settings.imageUrlTooltip) { tip.style.display = 'none'; return; }
        const url = getImageUrlFrom(e.target, e, win);
        if (url) { tip.textContent = url; tip.__lastUrl = url; tip.style.display = 'block'; tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY + 12) + 'px'; }
        else tip.style.display = 'none';
      }, true);

      doc.addEventListener('keydown', (e) => {
        if (settings.imageUrlTooltip && tip.style.display === 'block' && e.ctrlKey && e.key.toLowerCase() === 'c') {
          const url = tip.__lastUrl || '';
          if (url) {
            GM_setClipboard(url);
            if (settings.showNotifications) GM_notification({ text: 'URL copiada al portapapeles', title: 'Libertador de la Web', timeout: 1500 });
          }
        }
      }, true);
    } catch (e) { if (settings.debugMode) console.error('[Libertador] tooltip error', e); }
  }

  // ---------- Bypasses ----------
  function applyBypasses(win) {
    try {
      if (settings.rightClick) win.addEventListener('contextmenu', e => e.stopImmediatePropagation(), { capture: true });
      if (settings.textSelection && !win.document.getElementById('libertador-style')) {
        const style = win.document.createElement('style'); style.id = 'libertador-style'; style.textContent = `* { user-select: text !important; }`;
        win.document.head.appendChild(style);
      }
      if (settings.selectTextInLinks) attachOperaSelectToWindow(win);
      attachImageUrlTooltip(win);
    } catch (e) { if (settings.debugMode) console.error('[Libertador] bypass error', e); }
  }
  function applyToAllFrames() {
    applyBypasses(window);
    if (settings.iframeBypass) {
      for (let i = 0; i < window.frames.length; i++) { try { applyBypasses(window.frames[i]); } catch {} }
    }
  }

  // ---------- Menú ----------
  const menuCommands = {};
  const updateMenuCommand = (key) => {
    if (menuCommands[key]) GM_unregisterMenuCommand(menuCommands[key]);
    menuCommands[key] = GM_registerMenuCommand(`${settings[key] ? '✅' : '❌'} ${mapName(key)}`, () => toggleSetting(key));
  };
  function toggleSetting(key) {
    settings[key] = !settings[key];
    saveSettings();
    applyToAllFrames();
    if (settings.showNotifications) GM_notification({ text: `${mapName(key)} → ${settings[key] ? 'ACTIVADO' : 'DESACTIVADO'}`, title: 'Libertador de la Web', timeout: 1800 });
    updateMenuCommand(key);
  }
  Object.keys(settings).forEach(updateMenuCommand);

  // Inicial
  applyToAllFrames();
  const observer = new MutationObserver(() => applyToAllFrames());
  observer.observe(document.documentElement, { childList: true, subtree: true });

})();
