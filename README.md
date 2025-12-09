# ⚙️ Libertador PRO – Panel Claro (Tooltip y CTRL sobre imágenes)

**Última Actualización:** 08 de diciembre de 2025

![Tampermonkey](https://github.com/wernser412/unlock-web/blob/main/GUI.png?raw=true)

**Libertador PRO** es un userscript avanzado para Tampermonkey que restaura la libertad del usuario en páginas que bloquean la selección de texto, el clic derecho, el guardado de imágenes, atajos del teclado y otras acciones básicas.  
Incluye además un sistema de tooltip inteligente que muestra la URL real de cualquier imagen y permite copiarla instantáneamente con **CTRL**.

---

## ✨ Características Principales

### 📝 **Selección de Texto**
- Quita bloqueos por CSS (user-select: none)
- Permite copiar texto en webs protegidas  
- Habilita selección completa (force select)  
- Permite seleccionar enlaces como Opera (selección azul)

### 🖱 **Clic Derecho y Mouse**
- Elimina el bloqueo del clic derecho  
- Desactiva scripts que impiden arrastrar texto o imágenes

### 🖼 **Imágenes**
- Tooltip que muestra la URL real de la imagen
- Copiar URL REAL con solo pulsar **CTRL**
- Opcional: desbloquear “Guardar imagen como…”
- Opcional: forzar descarga directa
- Anti-overlay para imágenes cubiertas con capas transparentes

### ⌨ **Teclado**
- Desbloquea **todos los atajos** (Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+S, etc.)
- Evita scripts que bloquean teclas o combinaciones

### 🚫 **Anti-Barreras**
- Neutraliza scripts anti-copia, anti-selección, anti-clic
- Bloquea ofuscadores molestos
- Evita focus/blur forzado
- Anula detección de DevTools

### 🐞 **Anti-Debugger**
- Neutraliza `debugger;`
- Evita pausas forzadas
- Rompe loops infinitos

### 🧩 **Iframes**
- Desbloquea contenido dentro de iframes

### 🔗 **Enlaces**
- Quita onclicks que impiden abrir enlaces
- Permite seleccionar texto dentro de enlaces sin abrirlos

### 🧭 **Panel Moderno**
- Organizado por categorías  
- Colores por sección  
- Guardado automático de configuración  
- Icono flotante ⚙ estilo minimalista

---

## 🛠 Instalación

1. Instala la extensión [Tampermonkey](https://www.tampermonkey.net/) en tu navegador.
2. Haz clic en este enlace para instalar el script:  
   👉 **[Descargar Script](https://github.com/wernser412/unlock-web/raw/refs/heads/main/Libertador%20de%20la%20Web.user.js)**


---

## 🧩 Uso

### 🔧 Abrir el Panel
Haz clic en el icono flotante **⚙** ubicado en la esquina inferior derecha.

### 📂 Menús principales
- **Selección de Texto**  
- **Anti-Barreras**  
- **Debugger**  
- **Imágenes**  
- **Iframes**  
- **Enlaces**  
- **Teclado**

### 🖼 Copiar URL real de imágenes
1. Pasa el cursor sobre cualquier imagen  
2. Aparecerá un tooltip con la URL  
3. Presiona **CTRL** para copiar automáticamente  
4. El tooltip parpadeará en verde (confirmación)

Funciona incluso en imágenes protegidas, dentro de iframes, en overlays o con scripts de bloqueo.

---

## 🎛 Configuraciones recomendadas

| Modo | Para qué sirve | Estado |
|------|----------------|--------|
| 🔓 Quitar bloqueo CSS | Selección básica | ON |
| 🖱 Quitar clic derecho | Restaurar menú contextual | ON |
| 🔓 Desbloquear todos los atajos | Copiar, pegar, todo | ON |
| 🖼 Tooltip de imágenes | Ver y copiar URLs reales | ON |
| 🔥 Forzar selección total | Texto imposible de copiar | Solo si hace falta |

---

## 🔧 Compatibilidad

| Navegador | Estado |
|-----------|--------|
| Chrome / Edge / Brave | ✔ 100% |
| Opera GX | ✔ |
| Firefox | ✔ |
| Tor Browser | ⚠ parcialmente |
| Modo incógnito | ✔ (si permites extensiones) |

Compatible con:
- Angular  
- React  
- Vue  
- Webs con Shadow DOM  
- SPA  
- Ofuscadores JS comunes  
- Bloqueos por CSS y JS

---

## 🧠 Notas Técnicas

- Corre en `document-start` para máxima prioridad  
- Anula eventos `keydown`, `keyup`, `contextmenu`, `copy`, `dragstart`, etc.  
- Neutraliza scripts en línea (inline scripts)  
- Respeta accesibilidad y rendimiento  
- Zero data tracking

---

## 📄 Licencia

MIT — Eres libre de modificar, compartir y usar el script donde quieras.

---

## 💬 Autor
**wernser412**  
Mejoras, reportes o ideas: ¡solo pídelas!

