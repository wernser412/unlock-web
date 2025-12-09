// ==UserScript==
// @name         ⚙ Libertador PRO
// @namespace    http://tampermonkey.net/
// @version      2025.12.08
// @description  Menús claros, selección de texto, tooltip que cambia de color y copia URL con CTRL sobre imagen, desbloqueo total de atajos
// @author       wernser412
// @match        *://*/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// ==/UserScript==

(function(){
  'use strict';

  const defaultSettings = {
    panelOpen:true, cssUnlock:true, contextMenuUnlock:true, mouseUnlock:true, linkSelect:true,
    forceSelect:false, protectErase:false, antiCopy:false, antiScripts:false, antiObfuscator:false,
    antiFocusTrap:false, antiDevtoolsDetect:false, neutralDebugger:false, antiPause:false, antiLoop:false,
    imageTooltip:true, imageCopy:true, imageSaveUnlock:false, imageForceDownload:false, imageAntiOverlay:false,
    iframeBypass:true, linkBypass:false,
    unlockShortcuts:false
  };

  let settings = GM_getValue("libertador_pro_panel",null);
  if(!settings){
    settings = structuredClone(defaultSettings);
    GM_setValue("libertador_pro_panel",settings);
  }
  const save=()=>GM_setValue("libertador_pro_panel",settings);

  // ---------------- Funciones básicas ----------------
  function applyCSSUnlock(){if(settings.cssUnlock)GM_addStyle(`*{user-select:text!important;-webkit-user-select:text!important}`);}
  function unlockContextMenu(){if(!settings.contextMenuUnlock)return;window.addEventListener("contextmenu",e=>e.stopImmediatePropagation(),true);}
  function unlockMouse(){if(!settings.mouseUnlock)return;["mousedown","mouseup","selectstart"].forEach(ev=>window.addEventListener(ev,e=>e.stopImmediatePropagation(),true));}
  function linkSelect(){ enableLinkSelection(); }
  function protectSelectionErase(){if(!settings.protectErase)return;document.addEventListener("selectionchange",e=>{if(settings.forceSelect)e.stopImmediatePropagation();},true);}
  function blockCopy(){if(!settings.antiCopy)return;document.addEventListener("copy",e=>e.stopImmediatePropagation(),true);}
  function antiScripts(){if(!settings.antiScripts)return;document.querySelectorAll("script").forEach(s=>{if(/copy|select|context/i.test(s.innerText))s.remove();});}
  function antiObfuscator(){if(!settings.antiObfuscator)return;Object.keys(window).forEach(k=>{if(/_[a-zA-Z0-9]{4,}/.test(k))try{delete window[k]}catch{}});}
  function antiFocusTrap(){if(!settings.antiFocusTrap)return;["blur","focus"].forEach(ev=>window.addEventListener(ev,e=>e.stopImmediatePropagation(),true));}
  function antiDevtoolsDetect(){if(!settings.antiDevtoolsDetect)return;setInterval(()=>{window.onresize=null;window.onblur=null;},500);}
  function neutralDebugger(){if(!settings.neutralDebugger)return;setInterval(()=>{debugger;},600);}
  function antiPause(){if(!settings.antiPause)return;const f=window.Function;window.Function=function(){return function(){};};setTimeout(()=>window.Function=f,5000);}
  function antiLoop(){if(!settings.antiLoop)return;setInterval(()=>{},1000);}
  function iframeBypass(){if(!settings.iframeBypass)return;document.querySelectorAll("iframe").forEach(f=>{try{f.style.pointerEvents="auto";}catch{}});}
  function linkBypass(){if(!settings.linkBypass)return;document.querySelectorAll("a").forEach(a=>{a.removeAttribute("onclick");a.style.pointerEvents="auto";});}

  // ---------------- Tooltip unificado ----------------
  function getImageUrlFrom(el, event, win=window){
    if(!el) return '';
    const doc = (win && win.document) ? win.document : document;
    function getUrlFromNode(node){
      if(!node || node.nodeType!==1) return '';
      const tag=node.nodeName.toLowerCase();
      if(tag==='img') return node.currentSrc||node.getAttribute('src')||node.src||'';
      if(node.namespaceURI==='http://www.w3.org/2000/svg' && tag==='image')
        return node.getAttribute('href')||node.getAttribute('xlink:href')||'';
      const cs=win.getComputedStyle(node);
      if(cs && cs.backgroundImage && cs.backgroundImage!=='none'){
        const m=cs.backgroundImage.match(/url\((?:'|")?(.+?)(?:'|")?\)/);
        if(m && m[1]) return m[1];
      }
      return '';
    }
    if(event && typeof doc.elementsFromPoint==='function'){
      const elems=doc.elementsFromPoint(event.clientX,event.clientY)||[];
      for(let node of elems){
        let url=getUrlFromNode(node);
        if(url) return url;
      }
    }
    return '';
  }

function imageEngine(){
    if(!settings.imageTooltip || !document.body) return;
    if(window.__libertadorTooltipAttached) return;
    window.__libertadorTooltipAttached=true;

    const tip=document.createElement("div");
    Object.assign(tip.style,{
      position:"fixed", background:"rgba(0,0,0,0.85)", color:"#fff", padding:"6px 8px",
      borderRadius:"8px", fontSize:"12px", zIndex:2147483646, display:"none", pointerEvents:"none",
      transition:"0.12s", maxWidth:"60vw", wordBreak:"break-all"
    });
    document.body.appendChild(tip);

    let lastUrl='';

    document.addEventListener("mousemove", e=>{
      const url=getImageUrlFrom(e.target,e);
      if(url){
        lastUrl=url;
        tip.textContent=url;
        tip.style.display="block";
        tip.style.left=(e.clientX+12)+"px";
        tip.style.top=(e.clientY+12)+"px";
        tip.style.background="rgba(0,0,0,0.85)";
      } else {
        lastUrl = '';
        tip.style.display="none";
      }
    }, true);

    let ctrlPressed = false;

    function copyLastUrlAndFlash(){
        if(!lastUrl) return;
        try{
            if(navigator.clipboard && navigator.clipboard.writeText){
                navigator.clipboard.writeText(lastUrl).catch(()=>{ GM_setClipboard(lastUrl); });
            } else {
                GM_setClipboard(lastUrl);
            }
        }catch(err){
            try{ GM_setClipboard(lastUrl); }catch(e){}
        }
        tip.style.transition = "none";
        tip.style.background = "#0f0";
        setTimeout(()=>{ tip.style.transition = "0.12s"; tip.style.background = "rgba(0,0,0,0.85)"; }, 220);
    }

    document.addEventListener("keydown", e => {
        if(e.key === "Control" || e.metaKey){
            if(!ctrlPressed){
                ctrlPressed = true;
                if(settings.imageTooltip && lastUrl) copyLastUrlAndFlash();
            }
        }
    }, true);

    document.addEventListener("keyup", e => {
        if(e.key === "Control" || e.key === "Meta") ctrlPressed = false;
    }, true);

    window.addEventListener("blur", ()=>{ ctrlPressed = false; }, true);

    document.addEventListener("copy", e => {
        if (!settings.imageTooltip || !lastUrl) return;
        const sel = window.getSelection().toString();
        if(sel) return;
        try{
            e.preventDefault();
            e.stopImmediatePropagation();
            if(e.clipboardData) e.clipboardData.setData("text/plain", lastUrl);
            else GM_setClipboard(lastUrl);
            tip.style.transition="none";
            tip.style.background="#0f0";
            setTimeout(()=>{ tip.style.transition="0.12s"; tip.style.background="rgba(0,0,0,0.85)"; },220);
        }catch(err){}
    }, true);

    if(settings.imageAntiOverlay) GM_addStyle(`#libertador_panel img{pointer-events:auto!important}`);
}


  // ---------------- DESBLOQUEAR TODOS LOS ATAJOS ----------------
  function unlockShortcuts(){
    if(!settings.unlockShortcuts) return;

    // Permitir selección
    GM_addStyle(`*{user-select:text!important;-webkit-user-select:text!important}`);

    // Impedir bloqueos de atajos
    window.addEventListener("keydown", e=>{
      // Evita que scripts bloqueen keys
      e.stopImmediatePropagation();
      e.cancelBubble = true;
    }, true);

    window.addEventListener("keyup", e=>{
      e.stopImmediatePropagation();
    }, true);

    window.addEventListener("keypress", e=>{
      e.stopImmediatePropagation();
    }, true);
  }

  // ---------------- Aplicar todo ----------------
  function applyAll(){
    applyCSSUnlock();
    unlockContextMenu();
    unlockMouse();
    linkSelect();
    protectSelectionErase();
    blockCopy();
    antiScripts();
    antiObfuscator();
    antiFocusTrap();
    antiDevtoolsDetect();
    neutralDebugger();
    antiPause();
    antiLoop();
    imageEngine();
    iframeBypass();
    linkBypass();
    unlockShortcuts();   // ← NUEVO
  }

  // ---------------- Panel ----------------
  let panel,gear;
  function createPanel(){
    gear=document.createElement("div");
    gear.textContent="⚙";
    Object.assign(gear.style,{
      width:"50px",height:"50px",display:"flex",justifyContent:"center",alignItems:"center",
      lineHeight:"50px",boxSizing:"border-box",borderRadius:"50%",position:"fixed",
      right:"14px",bottom:"14px",fontSize:"26px",cursor:"pointer",
      background:"#0a0a0a",color:"#0f0",padding:"12px",zIndex:999999,boxShadow:"0 0 14px #0f0"
    });

    panel=document.createElement("div");
    panel.id="libertador_panel";
    Object.assign(panel.style,{
      position:"fixed",right:"14px",bottom:"80px",width:"370px",background:"#0b0b0b",color:"#0f0",
      border:"1px solid #0f0",borderRadius:"14px",padding:"14px",zIndex:999998,
      fontFamily:"monospace",fontSize:"13px",maxHeight:"80vh",overflowY:"auto",display:"block"
    });

    panel.innerHTML=`
<b>⚙ Libertador PRO</b><hr>

<details id="menu_texto" open><summary>📄 Selección de Texto (básico)</summary>
<label><input type="checkbox" id="cssUnlock"> 🔓 Quitar bloqueo por CSS</label><br>
<label><input type="checkbox" id="contextMenuUnlock"> 🖱 Quitar menú contextual</label><br>
<label><input type="checkbox" id="mouseUnlock"> 🖱 Quitar bloqueo mouse</label><br>
<label><input type="checkbox" id="linkSelect"> 🔗 Permitir selección enlaces</label>
<hr>
<b>🔥 Forzar Selección (avanzada)</b><br>
<label><input type="checkbox" id="forceSelect"> Forzar selección total</label><br>
<label><input type="checkbox" id="protectErase"> 🛡 Proteger contra borrado</label><br>
<label><input type="checkbox" id="antiCopy"> 🚫 Bloquear anti-copia</label>
</details>

<details id="menu_anti" open><summary>🚫 Anti-Barreras (avanzada)</summary>
<label><input type="checkbox" id="antiScripts"> Bloquear scripts anti-copia</label><br>
<label><input type="checkbox" id="antiObfuscator"> Neutralizar ofuscadores</label><br>
<label><input type="checkbox" id="antiFocusTrap"> Bloquear blur/focus</label><br>
<label><input type="checkbox" id="antiDevtoolsDetect"> Evitar detección DevTools</label>
</details>

<details id="menu_debugger" open><summary>🐞 Bloqueo de Debugger</summary>
<label><input type="checkbox" id="neutralDebugger"> Neutralizar debugger</label><br>
<label><input type="checkbox" id="antiPause"> Evitar pausas forzadas</label><br>
<label><input type="checkbox" id="antiLoop"> Romper bucles</label>
</details>

<details id="menu_imagenes" open><summary>🖼 Mostrar URL real y copiar con CTRL</summary>
<label><input type="checkbox" id="imageTooltip"> Activar tooltip</label><br>
<label><input type="checkbox" id="imageSaveUnlock"> Quitar protección de guardar</label><br>
<label><input type="checkbox" id="imageForceDownload"> Forzar descarga directa</label><br>
<label><input type="checkbox" id="imageAntiOverlay"> Bloquear overlays</label>
</details>

<details id="menu_iframe" open><summary>🧩 Iframes</summary>
<label><input type="checkbox" id="iframeBypass"> Desbloquear iframes</label>
</details>

<details id="menu_enlaces" open><summary>🔗 Enlaces</summary>
<label><input type="checkbox" id="linkBypass"> Quitar bloqueos de enlaces</label>
</details>

<details id="menu_teclado" open><summary>⌨ Teclado</summary>
<label><input type="checkbox" id="unlockShortcuts"> 🔓 Desbloquear todos los atajos</label><br>
</details>
`;

    panel.querySelectorAll("hr").forEach(hr=>{hr.style.border="1px solid #0f0";hr.style.backgroundColor="#0f0";});
    panel.querySelectorAll("input[type='checkbox']").forEach(cb=>{cb.style.accentColor="#007BFF";});
    document.body.appendChild(gear);document.body.appendChild(panel);

    panel.querySelectorAll("input").forEach(input=>{
      input.checked=settings[input.id];
      input.onchange=()=>{settings[input.id]=input.checked;save();applyAll();};
    });
    gear.onclick=()=>{settings.panelOpen=!settings.panelOpen;panel.style.display=settings.panelOpen?"block":"none";save();};

    const menus = [
      {id:"menu_texto", menuColor:"#00FF7F", subColor:"#66FFAA"},
      {id:"menu_anti", menuColor:"#FFD700", subColor:"#FFEA7F"},
      {id:"menu_debugger", menuColor:"#FF8C00", subColor:"#FFB366"},
      {id:"menu_imagenes", menuColor:"#1E90FF", subColor:"#63B8FF"},
      {id:"menu_iframe", menuColor:"#800080", subColor:"#B266B2"},
      {id:"menu_enlaces", menuColor:"#00CED1", subColor:"#66E0E5"},
      {id:"menu_teclado", menuColor:"#FF69B4", subColor:"#FF9AC0"}
    ];
    GM_addStyle(`summary { list-style: none !important; cursor: pointer; display: block; position: relative; padding-left: 18px; } summary::marker { content: none; }`);
    menus.forEach(menu=>{
      const sum=document.querySelector(`#${menu.id} summary`);
      if(sum){
        sum.style.color = menu.menuColor;
        GM_addStyle(`#${menu.id} summary::before { content: "▶"; position: absolute; left: 0; top: 50%; transform: translateY(-50%); color: ${menu.menuColor}; font-size: 12px; }
#${menu.id}[open] summary::before { content: "▼"; }`);
        document.querySelectorAll(`#${menu.id} label,#${menu.id} b`).forEach(e=>{e.style.color=menu.subColor;});
      }
    });
  }

  // ---------------- Selección enlaces estilo Opera ----------------
  function enableLinkSelection(){
    if(!settings.linkSelect) return;
    GM_addStyle(`a, a * { user-select: text !important; -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; pointer-events: auto !important; }`);
    let selection = window.getSelection();
    document.addEventListener("mousedown", e=>{
      const link = e.target.closest("a");
      if(link && settings.linkSelect){
        e.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(link);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, true);
    document.addEventListener("dragstart", e=>{if(e.target.closest("a") && settings.linkSelect) e.preventDefault();}, true);
  }

  // ---------------- Inicializar ----------------
  const waitBody=setInterval(()=>{
    if(document.body){
      clearInterval(waitBody);
      createPanel();
      applyAll();
    }
  },50);

  GM_registerMenuCommand("Abrir panel de configuración",()=>{
      if(panel) panel.style.display="block";
      settings.panelOpen=true;
      save();
  });

})();
