// ==UserScript==
// @name         ⚙ Libertador PRO CORE
// @namespace    libertador
// @version      1.0
// @description  Core con módulos externos
// @match        *://*/*
// @run-at       document-start

// @grant GM_getValue
// @grant GM_setValue
// @grant GM_xmlhttpRequest

// ==/UserScript==

(function () {

  if (window.__LIB_RUNNING__) return;
  window.__LIB_RUNNING__ = true;

  const Core = window.__LIB__ = {

    modules: {},

    register(name, mod) {

      this.modules[name] = {

        name,

        desc: mod.desc || "",

        enabled: false,

        enable: mod.enable

      };

      console.log("REGISTERED:", name);

      if (window.__LIB_RENDER__) {

        window.__LIB_RENDER__();

      }

    }

  };

  /**************************************************
   * CARGADOR DE JS EXTERNOS
   **************************************************/

  function loadScript(url) {

    const s = document.createElement("script");

    s.src = url;

    s.onload = () => {

      console.log("LOADED:", url);

    };

    s.onerror = () => {

      console.error("ERROR:", url);

    };

    document.head.appendChild(s);

  }

  /**************************************************
   * UI
   **************************************************/

  let panel;

  function createUI() {

    if (document.getElementById("lib_fab")) return;

    const fab = document.createElement("div");

    panel = document.createElement("div");

    fab.id = "lib_fab";

    panel.id = "lib_panel";

    fab.textContent = "⚙";

    const style = document.createElement("style");

    style.textContent = `

      #lib_fab,
      #lib_panel,
      #lib_panel *{

        font-family:Arial,sans-serif !important;

        font-size:14px !important;

      }

    `;

    document.documentElement.appendChild(style);

    fab.style.cssText = `

      position:fixed;

      right:18px;

      bottom:18px;

      width:56px;

      height:56px;

      border-radius:50%;

      background:#00ff99;

      display:flex;

      justify-content:center;

      align-items:center;

      cursor:pointer;

      z-index:2147483647;

      font-size:24px !important;

    `;

    panel.style.cssText = `

      position:fixed;

      right:18px;

      bottom:85px;

      width:320px;

      height:420px;

      background:#111;

      color:white;

      padding:10px;

      border-radius:12px;

      overflow:auto;

      display:none;

      z-index:2147483647;

    `;

    document.body.appendChild(fab);

    document.body.appendChild(panel);

    fab.onclick = () => {

      panel.style.display =

        panel.style.display === "block"

          ? "none"

          : "block";

      render();

    };

  }

  /**************************************************
   * ACTIVATE
   **************************************************/

  function activate(name) {

    const m = Core.modules[name];

    if (!m || m.enabled) return;

    m.enable?.();

    m.enabled = true;

    console.log("ENABLED:", name);

  }

  /**************************************************
   * RENDER
   **************************************************/

  function render() {

    if (!panel) return;

    panel.innerHTML = "";

    const mods = Object.values(Core.modules);

    if (!mods.length) {

      panel.innerHTML = "NO MODULES";

      return;

    }

    for (const m of mods) {

      const row = document.createElement("div");

      row.style.cssText = `

        display:flex;

        justify-content:space-between;

        align-items:center;

        padding:8px;

        margin:6px 0;

        background:rgba(255,255,255,.08);

        border-radius:8px;

      `;

      const left = document.createElement("div");

      left.innerHTML = `

        <div>${m.name}</div>

        <div style="opacity:.7;font-size:11px">

          ${m.desc}

        </div>

      `;

      const cb = document.createElement("input");

      cb.type = "checkbox";

      cb.checked = m.enabled;

      cb.onchange = () => {

        if (cb.checked) {

          activate(m.name);

        }

      };

      row.appendChild(left);

      row.appendChild(cb);

      panel.appendChild(row);

    }

  }

  window.__LIB_RENDER__ = render;

  /**************************************************
   * BOOT
   **************************************************/

  const wait = setInterval(() => {

    if (!document.body) return;

    clearInterval(wait);

    createUI();

    /*
      AGREGA AQUÍ TUS MÓDULOS EXTERNOS
    */

    loadScript("https://raw.githubusercontent.com/wernser412/unlock-web/main/Youtube_speed.js");

  }, 200);

})();
