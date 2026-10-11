# Recursos de Lumo

Las tres hojas originales se copiaron sin alterar sus píxeles:

- `emotions-original.png`: Lumo1.png, 16 columnas × 5 filas.
- `portraits-original.png`: lumo2.png, 5 columnas × 3 filas; cabezas originales en blanco y negro.
- `movement-original.png`: lumo3.png, 8 columnas × 8 filas.

Los colores azul y magenta que aparecen sobre negro en algunos inspectores corresponden predominantemente a píxeles con alpha 1/255. Al componer normalmente el PNG sobre el mapa casi no tienen opacidad. No se aplicaron filtros de color, borrado, máscaras ni redibujo al arte original.

`manifest.json` y su equivalente `manifest.js` contienen coordenadas de los cuadros, 19 animaciones y 15 retratos. Los límites se midieron sobre alpha ≥ 96 y se dejaron dos píxeles de margen; esta medición sólo determina el recorte que dibuja Canvas. Las hojas conservan el alpha original. Cada cuadro se centra sobre una misma base de cola en un pequeño lienzo de 18 × 24 píxeles que el mundo dibuja a 2×, sin suavizado.

`generated-alternative.png` fue creado con la herramienta integrada image_gen a partir de Lumo1 y lumo3. Se eligieron únicamente los dos cuadros de comer una galleta, acción ausente en los originales. Las otras animaciones y todos los retratos utilizan el diseño original proporcionado. El prompt exacto se conserva en `GENERATION_PROMPT.txt`. El archivo original generado también sigue conservado en la carpeta de imágenes generadas de Codex.

## Uso

Cargar `assets/lumo/manifest.js` antes de `lumo-actor.js`. `window.LUMO_ASSETS.portraits.emotions[EMOTION]` y `.animations[animation]` devuelven `{id,sheet,rect}` para recortar el retrato correspondiente al dibujarlo. No se deben mostrar las hojas completas dentro del diálogo.

El actor obtiene sólo geometría y contexto del mundo; no contiene diálogo, conocimientos de otros módulos ni claves de IA. `adapter.canStand(x,y,roomId)` recibe el centro de los pies, en coordenadas globales del mapa a 2×. El seguimiento jamás añade colisiones que bloqueen a Mira. La búsqueda de rutas respeta obstáculos y esquinas; los cambios de habitación y las recuperaciones usan una aparición breve sobre un punto seguro.

## Verificación

`tests/lumo-actor.test.cjs` verifica rutas por un hueco real, seguimiento alrededor de muebles, estabilidad a 30/60/120 Hz, cambios de habitación, recuperación, escondidas, sueño y cuadros presentes. `tests/lumo-preview.html` permite inspeccionar el render real de todas las animaciones y retratos en el navegador. Las pruebas sólo cubren HOME.
