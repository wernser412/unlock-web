// ==UserScript==
// @name         Libertador de la Web
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Elimina restricciones comunes, muestra/copia la URL real de imágenes al hover y permite seleccionar texto dentro de enlaces/elementos clicables (comportamiento tipo Opera). Menú Tampermonkey para toggles.
// @author       wernser412
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0Ij48cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDE3YzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnptNi05aC0xVjZjMC0yLjc2LTIuMjQtNS01LTVTNyAzLjI0IDcgNmgxLjljMC0xLjcxIDEuMzktMy4xIDMuMS0zLjEgMS43MSAwIDMuMSAxLjM5IDMuMSAzLjF2Mkg2Yy0xLjEgMC0yIC45LTIgMnYxMGMwIDEuMS45IDIgMiAyaDEyYzEuMSAwIDItLjkgMi0yVjEwYzAtMS4xLS45LTItMi0yem0wIDEySDZWMTBoMTJ2MTB6Ii8+PC9zdmc+
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
    selectTextInLinks: false // toggle integrado (Opera-like)
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
    imageUrlTooltip: "Mostrar URL de imagen (hover)",
    selectTextInLinks: "Seleccionar texto en elementos clicables" // integrado
  }[key] || key);

  // ---------- Opera-like "select text inside link" logic (per-window) ----------
  function attachOperaSelectToWindow(win) {
    try {
      if (win.__libertadorOperaAttached) return;
      win.__libertadorOperaAttached = true;
      const doc = win.document;
      if (!doc) return;

      // inject style for the .select-text-inside-a-link class (per document)
      if (!doc.getElementById('libertador-select-inside-link-style')) {
        try {
          const s = doc.createElement('style');
          s.id = 'libertador-select-inside-link-style';
          s.textContent = `
            .select-text-inside-a-link {
              -moz-user-select: text !important;
              -webkit-user-select: text !important;
              user-select: text !important;
            }
          `;
          (doc.head || doc.documentElement).appendChild(s);
        } catch (e) { /* ignore */ }
      }

      // movement tracker for this doc
      function createMovementTracker(localDoc) {
        const moves = [[0, 0], [0, 0], [0, 0]];
        let index = 0;
        localDoc.addEventListener("mousemove", e => {
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
      }

      const tracker = createMovementTracker(doc);
      const selection = win.getSelection ? win.getSelection() : null;

      // local state
      let STATE = "WAITING"; // WAITING -> STARTING -> STARTED -> ENDING -> WAITING
      let preState;
      let mousemoves = 0;
      let linkTarget = null;
      const initPos = [0, 0];
      let selectType = null;

      // helpers using this doc
      function caretPositionFromPoint(x, y) {
        if (doc.caretPositionFromPoint) {
          return doc.caretPositionFromPoint(x, y);
        }
        if (doc.caretRangeFromPoint) {
          const r = doc.caretRangeFromPoint(x, y);
          return {
            offsetNode: r.startContainer,
            offset: r.startOffset
          };
        }
        // fallback: approximate with document
        return { offsetNode: doc.body, offset: 0 };
      }

      function getInitPos() {
        return caretPositionFromPoint(initPos[0] - win.scrollX, initPos[1] - win.scrollY);
      }

      function inSelect(caretPos, sel) {
        try {
          if (!sel) return false;
          for (let i = 0; i < sel.rangeCount; i++) {
            const range = sel.getRangeAt(i);
            if (range.isPointInRange(caretPos.offsetNode, caretPos.offset)) return true;
          }
        } catch (e) {}
        return false;
      }

      function findLinkTarget(target) {
        while (target && target.nodeName !== "A" && target.nodeName !== "a") {
          target = target.parentNode;
        }
        return target;
      }

      function shouldStart(e) {
        const delta = tracker ? tracker() : [Math.abs(e.pageX - initPos[0]), Math.abs(e.pageY - initPos[1])];
        return delta[0] >= delta[1];
      }

      function startWaiting() {
        try { if (linkTarget) linkTarget.classList.remove("select-text-inside-a-link"); } catch (e) {}
        STATE = "WAITING";
        linkTarget = null;
      }

      function startSelecting(e) {
        try {
          // shouldStart check
          if (!shouldStart(e)) {
            startWaiting();
            return;
          }
          if (e.type === "dragstart") e.preventDefault();

          if (!selection) { startWaiting(); return; }

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
        } catch (err) {
          if (settings.debugMode) console.error('[Libertador] startSelecting error', err);
        }
      }

      // event handlers attached to doc (capture = true)
      function onMouseDown(e) {
        if (STATE !== "WAITING") return;
        // only left button, and ignore alt
        if (e.altKey || e.button !== 0) return;
        if (/img/i.test(e.target && e.target.nodeName)) return;
        const target = findLinkTarget(e.target);
        if (!target || !target.href) return;
        selectType = e.ctrlKey ? "add" : e.shiftKey ? "extend" : "new";
        initPos[0] = e.pageX;
        initPos[1] = e.pageY;
        if (selectType === "new") {
          if (!selection.isCollapsed && inSelect(getInitPos(), selection)) {
            return;
          }
        }
        mousemoves = 0;
        STATE = "STARTING";
        linkTarget = target;
        try { linkTarget.classList.add("select-text-inside-a-link"); } catch (e) {}
      }

      function onMouseMove(e) {
        if (STATE === "STARTING") {
          mousemoves++;
          if (mousemoves >= 3) {
            startSelecting(e);
          }
        }
        if (STATE === "STARTED") {
          try {
            const caretPos = caretPositionFromPoint(e.pageX - win.scrollX, e.pageY - win.scrollY);
            if (selection && caretPos) {
              // selection.extend might throw in some browsers if not allowed; guard
              if (typeof selection.extend === 'function') {
                selection.extend(caretPos.offsetNode, caretPos.offset);
              } else {
                // fallback: create range to extend
                const r = doc.createRange();
                r.setStart(caretPos.offsetNode, caretPos.offset);
                selection.addRange(r);
              }
            }
          } catch (err) {
            if (settings.debugMode) console.error('[Libertador] extend selection error', err);
          }
        }
      }

      function onMouseUp(e) {
        if (STATE !== "WAITING") {
          preState = STATE;
          STATE = "ENDING";
          // delay uninit to cancel click event
          setTimeout(startWaiting, 0);
        }
      }

      function onClick(e) {
        if (STATE === "ENDING") {
          if (preState === "STARTED") {
            const clickedTarget = findLinkTarget(e.target);
            if (clickedTarget === linkTarget) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          }
          startWaiting();
        }
      }

      function onDragStart(e) {
        if (STATE === "STARTED") {
          e.preventDefault();
          return;
        }
        if (STATE === "STARTING") {
          startSelecting(e);
        }
      }

      // attach listeners (capture true)
      doc.addEventListener('mousedown', onMouseDown, true);
      doc.addEventListener('mousemove', onMouseMove, true);
      doc.addEventListener('mouseup', onMouseUp, true);
      doc.addEventListener('click', onClick, true);
      doc.addEventListener('dragstart', onDragStart, true);

      // add a DOMContentLoaded style if needed (mirror original behavior)
      try {
        if (!doc.contentType || !doc.contentType.endsWith("/xml")) {
          // per-document injection already done above; also adding a tiny rule for Firefox user-select
          // some GM environments supply GM_addStyle that injects into top document only; we keep per-doc style above.
        }
      } catch (e) {}

      // Save references so we can remove later if needed (not strictly necessary)
      win.__libertadorOperaHandlers = {
        onMouseDown, onMouseMove, onMouseUp, onClick, onDragStart
      };

      if (settings.debugMode) console.log('[Libertador] Opera-like select attached to', win.location && win.location.href);
    } catch (e) {
      if (settings.debugMode) console.error('[Libertador] attachOperaSelectToWindow error', e);
    }
  }

  // ---------- getImageUrlFrom (versión robusta) ----------
  function getImageUrlFrom(el, event, win = window) {
    if (!el) return '';
    const doc = (win && win.document) ? win.document : document;

    function getUrlFromNode(node) {
      if (!node || node.nodeType !== 1) return '';

      const tag = node.nodeName.toLowerCase();

      // <img>
      if (tag === 'img') {
        const src = node.currentSrc || node.getAttribute('src') || node.src;
        if (src) return src;
        const dataSrc = node.getAttribute('data-src') || node.getAttribute('data-srcset') || node.getAttribute('data-original');
        if (dataSrc) return dataSrc;
      }

      // SVG <image>
      if (node.namespaceURI === 'http://www.w3.org/2000/svg' && tag === 'image') {
        const href1 = node.getAttribute('href');
        const href2 = node.getAttribute('xlink:href');
        let href3 = null;
        try { href3 = node.getAttributeNS ? node.getAttributeNS('http://www.w3.org/1999/xlink', 'href') : null; } catch (e) { href3 = null; }
        const url = href1 || href2 || href3;
        if (url) return url;
      }

      // background-image CSS
      try {
        const cs = win.getComputedStyle(node);
        const bg = cs && cs.backgroundImage;
        if (bg && bg !== 'none') {
          const m = bg.match(/url\((?:'|")?(.+?)(?:'|")?\)/);
          if (m && m[1]) return m[1];
        }
      } catch (e) { /* ignore */ }

      // atributos sospechosos
      try {
        if (node.attributes && node.attributes.length) {
          for (let i = 0; i < node.attributes.length; i++) {
            const a = node.attributes[i];
            if (!a || !a.name || !a.value) continue;
            const n = a.name.toLowerCase();
            const val = a.value;
            if (!val) continue;
            if (n.includes('src') || n.includes('image') || n.includes('href')) {
              if (val.startsWith('http') || val.startsWith('//') || val.match(/\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/i)) return val;
            }
          }
        }
      } catch (e) { /* ignore */ }

      return '';
    }

    // revisar elementos bajo el cursor
    if (event && typeof doc.elementsFromPoint === 'function') {
      try {
        const elems = doc.elementsFromPoint(event.clientX, event.clientY) || [];
        for (let i = 0; i < elems.length; i++) {
          const node = elems[i];
          let url = getUrlFromNode(node);
          if (url) return url;

          // buscar descendientes dentro
          try {
            if (node.querySelector) {
              const img = node.querySelector('img');
              if (img) {
                url = getUrlFromNode(img);
                if (url) return url;
              }
              const svgImg = node.querySelector('svg image') || node.querySelector('image');
              if (svgImg) {
                url = getUrlFromNode(svgImg);
                if (url) return url;
              }
              const bgEl = node.querySelector('[style*="background-image"], [style*="background"]');
              if (bgEl) {
                url = getUrlFromNode(bgEl);
                if (url) return url;
              }
            }
          } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }
    }

    return '';
  }

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
            GM_notification({ text: 'URL copiada al portapapeles', title: 'Libertador de la Web', timeout: 1500 });
          }
        }
      }, true);

      win.addEventListener('scroll', () => { tip.style.display = 'none'; }, true);
      win.addEventListener('blur', () => { tip.style.display = 'none'; }, true);
    } catch (e) {
      if (settings.debugMode) console.error('[Libertador] attachImageUrlTooltip error', e);
    }
  }

  // ---------- Bypasses ----------
  function applyBypasses(win) {
    try {
      if (!win.__libertadorInit) win.__libertadorInit = {};

      if (settings.rightClick && !win.__libertadorInit.ctx) {
        win.addEventListener('contextmenu', e => e.stopImmediatePropagation(), { capture: true });
        win.__libertadorInit.ctx = true;
      }

      if (settings.textSelection) {
        if (!win.document.getElementById('libertador-style')) {
          const style = win.document.createElement('style');
          style.id = 'libertador-style';
          style.textContent = `* { user-select: text !important; }`;
          try { win.document.head.appendChild(style); } catch {}
        }
      }

      if (settings.selectTextInLinks) {
        // attach Opera-like select behavior to this window/document
        try { attachOperaSelectToWindow(win); } catch (e) { if (settings.debugMode) console.error(e); }
      }

      if (!win.__libertadorInit.tooltip) {
        attachImageUrlTooltip(win);
        win.__libertadorInit.tooltip = true;
      }
    } catch (e) {
      if (settings.debugMode) console.error('[Libertador] applyBypasses error', e);
    }
  }

  function applyToAllFrames() {
    applyBypasses(window);
    if (settings.iframeBypass) {
      for (let i = 0; i < window.frames.length; i++) {
        try { applyBypasses(window.frames[i]); } catch (e) { /* ignore cross-origin */ }
      }
    }
  }

  // ---------- Menú ----------
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
    GM_notification({ text: `${mapName(key)} → ${settings[key] ? 'ACTIVADO' : 'DESACTIVADO'}`, title: 'Libertador de la Web', timeout: 1800 });
    updateMenuCommand(key);
  }

  Object.keys(settings).forEach(updateMenuCommand);

  // Inicial
  applyToAllFrames();
  const observer = new MutationObserver(() => applyToAllFrames());
  observer.observe(document.documentElement, { childList: true, subtree: true });

})();
