// ==UserScript==
// @name         ⚙ Libertador PRO
// @namespace    http://tampermonkey.net/
// @version      2026.06.15
// @description  Framework modular + Ultra Unlock + Tooltip + módulos completos
// @author       wernser412
// @icon         https://github.com/wernser412/unlock-web/raw/refs/heads/main/ICONO.svg
// @downloadURL  https://github.com/wernser412/unlock-web/raw/refs/heads/main/Libertador%20PRO.user.js
// @match        *://*/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  /************************************************************
   * 🧠 CORE
   ************************************************************/
  const Core = {
    settings: GM_getValue("libertador_v36", {}) || {},
    modules: {},

    save() {
      GM_setValue("libertador_v36", this.settings);
    },

    get(k) {
      return this.settings[k];
    },

    set(k, v) {
      this.settings[k] = v;
      this.save();

      const m = this.modules[k];
      if (m) toggle(k, v);
    }
  };

  function register(name, mod) {
    Core.modules[name] = mod;
  }

  function toggle(name, enabled) {
    const m = Core.modules[name];
    if (!m) return;

    if (enabled && !m.active) {
      m.enable?.();
      m.active = true;
    } else if (!enabled && m.active) {
      m.disable?.();
      m.active = false;
    }
  }

  /************************************************************
   * 📋 CLIPBOARD FIX
   ************************************************************/
  function copyToClipboard(text) {
    try {
      if (typeof GM_setClipboard !== "undefined") {
        GM_setClipboard(text, "text");
        return true;
      }

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }

      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();

      return true;

    } catch (e) {
      return false;
    }
  }

  /************************************************************
   * 🎨 UI LIMPIO (SIN BUSCADOR)
   ************************************************************/
  function createUI() {

    GM_addStyle(`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

      #fab {
        position: fixed;
        right: 18px;
        bottom: 18px;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: linear-gradient(135deg,#00ff99,#00aaff);
        z-index: 999999;
        cursor: pointer;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size: 22px;
      }

      #panel {
        position: fixed;
        right: 18px;
        bottom: 80px;
        width: 380px;
        height: 560px;
        border-radius: 18px;
        background: rgba(20,20,25,0.75);
        backdrop-filter: blur(18px);
        border: 1px solid rgba(255,255,255,0.08);
        z-index: 999998;
        font-family: Inter, sans-serif;
        color: white;
        display: none;
        overflow: hidden;
      }

      #header {
        padding: 14px;
        font-weight: 600;
        background: linear-gradient(90deg,#00ff99,#00aaff);
        color: black;
      }

      #modules {
        padding: 10px;
        overflow-y:auto;
        height: 480px;
      }

      .row {
        display:flex;
        justify-content: space-between;
        align-items:center;
        padding: 10px;
        margin: 6px 0;
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
        font-size: 13px;
      }
    `);

    const fab = document.createElement("div");
    fab.id = "fab";
    fab.textContent = "⚙";

    const panel = document.createElement("div");
    panel.id = "panel";

    panel.innerHTML = `
      <div id="header">⚙ Libertador PRO v3.6 ULTRA FULL</div>
      <div id="modules"></div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    fab.onclick = () => {
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    };

    const container = panel.querySelector("#modules");

    function render() {
      container.innerHTML = "";

      Object.keys(Core.modules).forEach(name => {

        const row = document.createElement("div");
        row.className = "row";

        const checked = Core.get(name);

        row.innerHTML = `
          <span>${name}</span>
          <input type="checkbox" ${checked ? "checked" : ""}>
        `;

        const cb = row.querySelector("input");

        cb.onchange = () => {
          Core.set(name, cb.checked);
          toggle(name, cb.checked);
        };

        container.appendChild(row);
      });
    }

    render();
  }

  /************************************************************
   * 🔓 ULTRA UNLOCK ENGINE
   ************************************************************/
  register("ultraUnlock", {
    enable() {

      GM_addStyle(`
        * {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
      `);

      ["copy","cut","paste","contextmenu","selectstart","mousedown","mouseup"]
        .forEach(ev => {
          document.addEventListener(ev, e => {
            e.stopImmediatePropagation();
          }, true);
        });

    }
  });

  /************************************************************
   * 🖼 IMAGE TOOLTIP + AUTO COPY
   ************************************************************/
register("imageTooltip", {
  enable() {

    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "fixed",
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      padding: "6px 8px",
      borderRadius: "8px",
      fontSize: "12px",
      zIndex: 2147483646,
      display: "none",
      pointerEvents: "none",
      maxWidth: "60vw",
      wordBreak: "break-all",
      transition: "0.12s"
    });

    document.body.appendChild(tip);

    let lastUrl = "";
    let timer = null;
    let countdown = 10;
    let copied = false;

    // ---------------------------
    // 📌 COPY SAFE
    // ---------------------------
    function copyToClipboard(text) {
      try {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text);
        } else if (typeof GM_setClipboard !== "undefined") {
          GM_setClipboard(text, "text");
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
      } catch (e) {}
    }

    // ---------------------------
    // 🧠 IMAGE DETECTOR ROBUSTO
    // ---------------------------
    function getImageUrlFrom(el, e) {
      if (!el) return "";

      function extract(node) {
        if (!node || node.nodeType !== 1) return "";

        const tag = node.nodeName.toLowerCase();

        // IMG normal
        if (tag === "img") {
          return node.currentSrc || node.src || node.getAttribute("src") || "";
        }

        // SVG images (avatars modernos)
        if (node.namespaceURI === "http://www.w3.org/2000/svg" && tag === "image") {
          return node.getAttribute("href") ||
                 node.getAttribute("xlink:href") || "";
        }

        // CSS background images (cards, perfiles, etc.)
        const cs = getComputedStyle(node);
        if (cs?.backgroundImage && cs.backgroundImage !== "none") {
          const m = cs.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
          if (m) return m[1];
        }

        return "";
      }

      const stack = document.elementsFromPoint(e.clientX, e.clientY) || [];

      for (const node of stack) {
        const url = extract(node);
        if (url) return url;
      }

      return extract(el);
    }

    // ---------------------------
    // ⏱ TIMER + AUTO COPY
    // ---------------------------
    function startTimer(url) {

      clearInterval(timer);
      countdown = 10;
      copied = false;

      timer = setInterval(() => {

        if (!url || url !== lastUrl) {
          clearInterval(timer);
          return;
        }

        tip.innerHTML = `⏱ ${countdown}s<br>${url}`;

        countdown--;

        if (countdown < 0 && !copied) {
          copied = true;
          clearInterval(timer);

          copyToClipboard(url);

          tip.innerHTML = `✅ COPIADO<br>${url}`;
          tip.style.background = "#00ff99";
          tip.style.color = "#000";

          setTimeout(() => {
            tip.style.background = "rgba(0,0,0,0.85)";
            tip.style.color = "#fff";
          }, 500);
        }

      }, 1000);
    }

    // ---------------------------
    // 🖱 MAIN LOOP
    // ---------------------------
    document.addEventListener("mousemove", e => {

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const url = getImageUrlFrom(el, e);

      if (url) {

        if (url !== lastUrl) {
          lastUrl = url;
          startTimer(url);
        }

        tip.style.display = "block";
        tip.style.left = (e.clientX + 12) + "px";
        tip.style.top = (e.clientY + 12) + "px";

      } else {

        lastUrl = "";
        clearInterval(timer);
        tip.style.display = "none";

      }

    }, true);

  }
});

  /************************************************************
   * 🔗 LINK SELECT (RESTORED)
   ************************************************************/
register("linkSelect", {
  enable() {

    const selection = window.getSelection();

    let state = "WAITING";
    let linkTarget = null;
    let initPos = [0, 0];
    let selectType = "new";
    let mousemoves = 0;

    // 📌 tracker ligero (como el original)
    const moves = [[0,0],[0,0],[0,0]];
    let index = 0;

    document.addEventListener("mousemove", e => {
      moves[index][0] = e.pageX;
      moves[index][1] = e.pageY;
      index = (index + 1) % 3;
    }, true);

    function tracker() {
      const out = [];
      for (let i = 0; i < 2; i++) {
        out.push(
          Math.abs(moves[index][i] - moves[(index+1)%3][i]) +
          Math.abs(moves[(index+1)%3][i] - moves[(index+2)%3][i])
        );
      }
      return out;
    }

    function findLink(el) {
      while (el && el.nodeName !== "A") el = el.parentNode;
      return el;
    }

    function caretFromPoint(x, y) {
      if (document.caretPositionFromPoint) {
        return document.caretPositionFromPoint(x, y);
      }
      const r = document.caretRangeFromPoint(x, y);
      return {
        offsetNode: r.startContainer,
        offset: r.startOffset
      };
    }

    function getInitPos() {
      return caretFromPoint(
        initPos[0] - window.scrollX,
        initPos[1] - window.scrollY
      );
    }

    function shouldStart(e) {
      const delta = tracker();
      return delta[0] >= delta[1];
    }

    function startWaiting() {
      if (linkTarget) linkTarget.classList.remove("select-text-inside-a-link");
      state = "WAITING";
      linkTarget = null;
    }

    function startSelecting(e) {
      const pos = getInitPos();

      if (selectType === "new") {
        selection.collapse(pos.offsetNode, pos.offset);
      } else if (selectType === "add") {
        const range = new Range();
        range.setStart(pos.offsetNode, pos.offset);
        selection.addRange(range);
      }

      state = "STARTED";
    }

    document.addEventListener("mousedown", e => {

      if (state !== "WAITING") return;
      if (e.button !== 0 || e.altKey) return;

      const link = findLink(e.target);
      if (!link || !link.href) return;

      selectType =
        e.ctrlKey ? "add" :
        e.shiftKey ? "extend" :
        "new";

      initPos = [e.pageX, e.pageY];
      mousemoves = 0;

      state = "STARTING";
      linkTarget = link;

      link.classList.add("select-text-inside-a-link");

    }, true);

    document.addEventListener("mousemove", e => {

      if (state === "STARTING") {
        mousemoves++;
        if (mousemoves >= 3) startSelecting(e);
      }

      if (state === "STARTED") {
        const caret = caretFromPoint(
          e.pageX - window.scrollX,
          e.pageY - window.scrollY
        );

        try {
          selection.extend(caret.offsetNode, caret.offset);
        } catch {}
      }

    }, true);

    document.addEventListener("mouseup", () => {
      if (state !== "WAITING") {
        state = "ENDING";
        setTimeout(startWaiting, 0);
      }
    }, true);

    document.addEventListener("click", e => {
      if (state === "ENDING" && linkTarget) {
        const clicked = findLink(e.target);
        if (clicked === linkTarget) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        startWaiting();
      }
    }, true);

    document.addEventListener("dragstart", e => {
      if (state === "STARTED") {
        e.preventDefault();
      } else if (state === "STARTING") {
        startSelecting(e);
      }
    }, true);

    GM_addStyle(`
      .select-text-inside-a-link {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
      }
    `);

  }
});

  /************************************************************
   * 🖱 CONTEXT MENU
   ************************************************************/
  register("contextMenu", {
    enable() {
      document.addEventListener("contextmenu", e => e.stopPropagation(), true);
    }
  });

  /************************************************************
   * 🧩 IFRAMES
   ************************************************************/
  register("iframeUnlock", {
    enable() {
      document.querySelectorAll("iframe").forEach(f => {
        f.style.pointerEvents = "auto";
      });
    }
  });

  /************************************************************
   * 🚀 INIT
   ************************************************************/
  function init() {
    Object.keys(Core.modules).forEach(k => {
      if (Core.get(k)) toggle(k, true);
    });

    createUI();
  }

  const wait = setInterval(() => {
    if (!document.body) return;
    clearInterval(wait);
    init();
  }, 50);

  GM_registerMenuCommand("Abrir panel", () => {
    alert("Libertador PRO v3.6 activo ⚙");
  });

})();
