# ⚙️ Libertador PRO

**Última actualización:** 15 de junio de 2026

![Tampermonkey](https://github.com/wernser412/Libertador-PRO/blob/main/GUI.png?raw=true)

**Libertador PRO** es un userscript modular para Tampermonkey diseñado para restaurar funciones bloqueadas por páginas web: selección de texto, clic derecho, enlaces protegidos, imágenes e iframes.

Su arquitectura está basada en módulos independientes con configuración persistente y un panel moderno con efecto glass.

---

## ✨ Características

### 🔓 Ultra Unlock

* Restaura la selección de texto.
* Elimina bloqueos CSS (`user-select: none`).
* Permite copiar contenido protegido.
* Neutraliza bloqueos comunes de selección y menú contextual.

---

### 🖼 Tooltip Inteligente para Imágenes

Muestra automáticamente:

* URL real de la imagen.
* Imágenes normales (`<img>`).
* Imágenes SVG.
* Fondos CSS (`background-image`).
* Elementos cubiertos por overlays.

Además:

* Cuenta regresiva visual.
* Copia automática de la URL tras 10 segundos.
* Confirmación visual al copiar.

---

### 🔗 Selección de Texto en Enlaces

Permite:

* Seleccionar texto dentro de enlaces sin abrirlos.
* Comportamiento similar a Opera.
* Compatibilidad con:

  * Ctrl + selección
  * Shift + selección
  * Selección extendida

---

### 🖱 Menú Contextual

* Restaura el clic derecho.
* Evita bloqueos por JavaScript.
* Compatible con la mayoría de sitios modernos.

---

### 🧩 Iframes

* Habilita interacción con iframes.
* Restaura eventos del mouse sobre contenido embebido.

---

### ⚙ Panel Moderno

* Diseño minimalista.
* Efecto Glassmorphism.
* Configuración persistente.
* Activación y desactivación por módulos.
* Botón flotante ⚙.

---

## 🛠 Instalación

1. Instala Tampermonkey.
2. Instala el script:

👉 **[Descargar Script](https://github.com/wernser412/Libertador-PRO/raw/refs/heads/main/Libertador%20PRO.user.js)**
---

## 📦 Módulos incluidos

| Módulo        | Estado |
| ------------- | ------ |
| Ultra Unlock  | ✔      |
| Image Tooltip | ✔      |
| Link Select   | ✔      |
| Context Menu  | ✔      |
| Iframe Unlock | ✔      |
| Panel Moderno | ✔      |

---

## 🧠 Notas técnicas

* Ejecuta en `document-start`.
* Arquitectura modular.
* Configuración persistente mediante `GM_setValue`.
* Zero tracking.
* Código abierto.

---

## 📄 Licencia

MIT

---

## 💬 Autor

**wernser412**

Libertad para copiar, seleccionar y explorar la web sin restricciones.
