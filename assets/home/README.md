# HOME — mobiliario complementario

Creado el 12 de octubre de 2026 con la herramienta integrada `image_gen.imagegen`.
Los PNG originales de la casa, Mira y Lumo se conservan intactos. Los dos atlas
nuevos tienen transparencia y se dibujan con nearest-neighbor sobre una rejilla
nativa, con marcos recortados solo durante el render. No se reemplazaron los
recursos ni el motor de FNF.

- `furniture-atlas.png`: piano, sofá, bañera, lavabo/espejo, inodoro, mesa de
  jardinería, regadera y planta. 1774 × 887; 810.916 bytes.
- `lumo-furniture-atlas.png`: cama lavanda, escritorio, aplique de vela y librero.
  1254 × 1254; 493.998 bytes.
- Marcos, escala, posición, área física e interacción: `home-world.js`.
- Pisos: piezas originales de living_room.png con origen compartido, periodo
  vertical de 30 píxeles; continuidad a través de los umbrales. Alfombras,
  ventanas, banco, maceta/flor, puerta pequeña y dibujo son piezas nativas de
  canvas con paleta limitada, editables desde código.

Referencias usadas: `assets/source/home_and_new_home_sheet.png` y, para el
segundo atlas, `assets/home/furniture-atlas.png`. Los atlas complementan el
estilo; no son sprites oficiales de Undertale. No se editaron las referencias.

Prompts completos y parámetros conservados en GENERATION_PROMPTS.md.


## Pulido del ala nueva y accesos — 2026-10-12

La revisión vigente usa home-pixel-art.js para los33 objetos distintos del ala nueva, con contornos y píxeles enteros editables. Se retiró su uso de los muebles bitmap escalados y recursos clonados. El piano de la sala original conserva furniture-atlas.png; lumo-furniture-atlas.png ya no se carga. Ambos PNG y sus prompts se conservan como fuentes históricas. No se han editado imágenes originales de Undertale, Mira, Lumo o FNF en esta revisión. Estados visuales e interpolación separados en home-objects.js; posiciones y colisión en home-world.js. Es arte propio inspirado en la paleta existente, sin afirmar procedencia oficial.


## Sprites, coherencia, sonido y minijuegos HOME — 2026-10-12

La revisión actual usa34 sprites nativos en home-pixel-art.js (33ala más piano). Ningún atlas de mobiliario se carga ya; archivos/prompts se conservan como fuentes históricas. home-room-details.js añade42capas de detalle sobre las seis habitaciones originales sin editar sus PNG; home-character-render.js estabiliza los16recortes de Mira, LumoActor mantiene escala por hoja/cola alineada. Todo se pinta en rejilla y las transiciones respetan reducción de movimiento. No se usó nueva generación de imágenes ni se reemplazó el arte de FNF.
