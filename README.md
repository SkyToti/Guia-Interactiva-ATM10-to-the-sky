# 🌟 Guía Interactiva — All the Mods 10: To the Sky

Una guía de **progresión** para el modpack *All the Mods 10 — To the Sky* (ATM10 Sky),
pensada de una forma que el libro de misiones no cubre: **cómo se COMBINAN los mods**
entre sí en setups concretos, desde el arranque en el vacío hasta la **ATM Star**.

No es un speedrun ni un wiki de recetas sueltas. Es el camino que seguiría alguien que
ya se pasó el pack muchas veces: qué construir primero, con qué bloques de qué mods se
combina, y los **trucos de experto** que convierten un proceso manual y largo en algo
automático desde el principio.

> **El mapa maestro es interactivo y visual.** Cada setup se explica con escenas 3D
> rotables (estilo la guía oficial de AE2), con tooltip por bloque para replicarlo
> tal cual en el juego.

---

## 🔗 Ver la guía

- **Mapa maestro (HUB):** [`index.html`](./index.html) — el mapa completo de la progresión.
- **Versión publicada (GitHub Pages):** _se activa al hacer el primer deploy_ →
  `https://skytoti.github.io/Guia-Interactiva-ATM10-to-the-sky/`

Cada nodo del mapa es un **setup**. Conforme se van construyendo sus guías 3D, el nodo
pasa de *Próximamente* a *Disponible* y queda enlazado a su página dentro de `setups/`.

---

## 🗺️ Estructura de la progresión

El mapa está dividido en **6 actos**, y el color de cada acto **es** la progresión de
materiales del pack (cobre → energía → fluix → allthemodium → unobtainium → ATM Star):

| Acto | Tema | Ejemplos de setups |
|------|------|--------------------|
| **I — Arranque en el vacío** | Skyblock sobre Ex Deorum | Motor infinito de poder (crisol → lava → Magmatic Generator), tamiz/martillo automáticos |
| **II — Automatización y magia útil** | Los secretos de experto | Create para doblar minerales, Ars Nouveau Drygmy (loot sin matar), Occultism (mina pasiva) |
| **III — Procesamiento y cerebro digital** | El corazón del pack | Mekanism ×3, Functional Storage, AE2, autofabricación, logística |
| **IV — Poder industrial y metales ATM** | Escalar de verdad | Fisión Mekanism, minería ATM, cadena ×5, drones de PneumaticCraft |
| **V — Alta tecnología** | Cúspides de poder | Modern Industrialization, fusión, Draconic, abejas ATM |
| **VI — El gran final** | La ATM Star | Reunir y automatizar el crafteo de la Star |

---

## 📁 Estructura del repositorio

```
.
├── index.html          # El HUB — mapa maestro interactivo (fuente única de verdad)
├── assets/
│   ├── engine.js        # Motor de render 3D (Canvas 2D, proyección ortográfica)
│   └── textures/         # Texturas reales de los mods, en base64, por setup
├── setups/              # Una página 3D por setup (se van agregando)
└── README.md
```

### Cómo funciona el render 3D
`assets/engine.js` es un motor en **Canvas 2D** con proyección ortográfica, ocultación
de caras traseras y ordenamiento por profundidad recalculado cada fotograma (no usa
CSS 3D, que se rompe al rotar). Cada bloque lleva su textura real extraída del `.jar`
del mod y un nombre en español para el tooltip.

---

## 🛠️ Estado del proyecto

- [x] **HUB / mapa maestro** — 6 actos, 36 setups mapeados.
- [ ] **Setups 3D** — se construyen de a uno por sesión, con calma y bien explicados.
  - Siguiente: *Procesado de minerales Mekanism (hasta ×3)*.

---

## 📌 Sobre esta guía

Proyecto personal de progresión, hecho para el server de ATM10 Sky de **SkyToti**.
Las páginas son HTML autocontenido: funcionan abriéndolas directamente en el navegador,
sin instalar nada.

Hecho en español (latino). 🇲🇽
