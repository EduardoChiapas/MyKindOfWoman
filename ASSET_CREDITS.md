# Recursos y créditos

## Proyecto y arte

Los fondos, la hoja de sprites, el personaje y las pistas musicales proceden del ZIP aportado por el usuario. Los muebles y el fuego se recortan de esa hoja; su distribución se ajusta a la imagen de referencia. Undertale y sus elementos pertenecen a Toby Fox y a sus respectivos autores. La dedicatoria y las ampliaciones forman parte de este proyecto personal.

## Tipografía

**8bitoperator JVE Regular**, copyright nipcen 2011. Proyecto FontStruct 534034.

- Fuente de descarga: https://www.wfonts.com/font/8bitoperator-jve
- Archivo: https://static.wfonts.com/data/2016/05/02/8bitoperator-jve/8bitoperator_jve.ttf
- Licencia indicada en la fuente: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 — https://creativecommons.org/licenses/by-nc-sa/3.0/

Se recompilaron las tablas internas, límites de glifos y sumas de comprobación del TTF para que el navegador acepte el archivo. Se conservan los 220 glifos, sus contornos, métricas, espaciado y mapa de caracteres. El renderizado del original y del archivo entregado se comprobó idéntico a 32 y 64 píxeles. `font.js` incorpora los mismos bytes que `assets/fonts/8bitoperator_jve.ttf`.

## Efectos de sonido

Muestras de Undertale distribuidas en el repositorio de **Create Your Frisk**:

- `text.wav`: `Assets/Default/Sounds/Voices/uifont.wav`.
- `menu_move.wav`: `Assets/Default/Sounds/menumove.wav`.
- `confirm.wav`: `Assets/Default/Sounds/menuconfirm.wav`.
- Cancelación: reutiliza `menumove.wav`.

Repositorio de procedencia: https://github.com/RhenaudTheLukark/CreateYourFrisk/tree/master/Assets/Default/Sounds

Las muestras se reproducen a su tono original, con volumen controlado por el juego. `sfx-data.js` contiene una copia incorporada de estas muestras para funcionamiento local sin servidor. Los derechos de las muestras originales corresponden a sus autores; la licencia del motor Create Your Frisk no sustituye los derechos de los recursos de Undertale.

## Lumo

Las tres hojas de referencia aportadas por el creador se conservan sin modificaciones en `assets/lumo/`: mundo blanco/lavanda y retratos en blanco y negro. El manifiesto recorta y alinea los cuadros al reproducirlos. Dos cuadros de la animación de comer se generaron a partir de esas referencias; el prompt, procedencia y comprobaciones de las hojas originales están en esa carpeta. El resto utiliza el arte suministrado. El tarareo de cuatro notas es una melodía original de esta implementación.

La habitación opcional vigente de Lumo combina mobiliario propio de píxel nativo con el escritorio original de Bitglow; la reutilización del dormitorio pertenece a una versión anterior. La protagonista se llama Mira en los textos del juego y la app Determination; la fuente histórica de esa app se conserva fuera de los archivos publicados.


## Sprites, coherencia, sonido y minijuegos HOME — 2026-10-12

Mobiliario ampliado de código propio: home-pixel-art.js; personajes derivados en render de sus hojas aportadas, sin reemplazar archivos. Las capas decorativas de home-room-details.js de aquella revisión se retiraron en la corrección del 13 de octubre. Los atlas antiguos quedan históricos y no se cargan. El escondite vigente usa mobiliario propio, no clones del dormitorio.

Nueve efectos originales de Undertale extraídos del catálogo público The Sounds Resource: https://sounds.spriters-resource.com/pc_computer/undertale/asset/399803/ . Archivos, nombres exactos, SHA256 y corroboración de espejo en assets/sfx/home/SOURCES.json/README.md. Se incorporan los mismos bytes al reproductor local; no se incluyen el ZIP completo ni otros recursos del catálogo. Las asociaciones nuevas con muebles/minijuegos son decisiones del proyecto, no afirmación de sus usos originales. Derechos de muestras Undertale corresponden a sus autores; no se presenta la licencia del mirror/motor como licencia de las muestras. Los tonos del piano/tarareo propios y las cuatro muestras anteriores se conservan.

## Arte del ala nueva — registro histórico de 2026-10-12

**Bitglow**, copyright 2025. Pack `pixelinterior_LRK_v1.1` aportado por el creador del juego. Cinco hojas originales sin modificar en `assets/home/bitglow/`, junto a [licencia original](assets/home/bitglow/license.txt) y [créditos del pack](assets/home/bitglow/CREDITS.md). La licencia permite uso personal/comercial y modificación dentro del proyecto; prohíbe reventa y redistribución como archivos independientes u otro pack.

`home-interior-art.js` usa recortes nativos del pack para biblioteca, diván, mesa de parejas, ventana y escritorio, además de pisos y paneles. Sin estirar, suavizar, recolorear ni mezclar píxeles vecinos. Las hojas fuente permanecen intactas. Los otros 28 tipos del ala siguen siendo arte de código propio refinado, inspirado en la estética Undertale. La capa adicional de libros de la biblioteca se retiró el 13 de octubre para conservar el recorte original.

La revisión se centra en las áreas nuevas. Las habitaciones originales recuperan sus colores anteriores a la recoloración experimental; `home-palette.js` se retiró. No se añadieron imágenes generadas ni muestras de sonido en esta corrección. Los atlas y prompts anteriores se conservan como fuentes históricas y ya no se cargan. FNF y las hojas originales de personajes siguen intactos.

## Interacciones con arte original — 2026-10-13

`home-natural-20261013` sustituye los adornos artificiales de las habitaciones normales por movimientos de sus objetos existentes. `home-object-render.js` toma frentes, tiradores y colores de los PNG originales del refrigerador, cajones y armario; el agua queda dentro del grifo real. `home-picture-render.js` coloca el retrato NORMAL de la hoja original de Lumo en el cuadro del corredor con una máscara que conserva marco, bordes y flores. El libro de Mira utiliza su objeto original. No se editaron los PNG ni se generaron imágenes o sonidos nuevos.

El piano se retiró de la sala; su código, melodía y recuerdos guardados se conservan para una futura ubicación. Esta revisión registra 233 pruebas en 26 archivos; no acredita una partida completa ni nuevas pruebas reales de Gemini, FNF o teléfono físico. La entrega continúa siendo un ZIP experimental.


## Rediseño del ala — base de 2026-10-13

Bitglow: recursos originales de los packs LRK v1.1, [BA v1.0](https://bitglow.itch.io/pixelinterior-bathroom) y [BR v1.1](https://bitglow.itch.io/pixelinterior-bedroom). Once hojas intactas, licencias originales y créditos en assets/home/bitglow/. Marie Pepo: dos hojas originales de [Autumn Forest](https://marie-pepo.itch.io/autumn-forest), con atribución y términos de uso documentados en assets/home/marie-pepo/CREDITS.md. Los packs BA/BR/Autumn se obtuvieron desde los controles gratuitos del autor. No se incorporó Puny World: se examinó como candidato y quedó fuera del producto.

31 objetos del ala nueva usan recortes nativos de estas fuentes. Dibujo de amistad y pasadizo conservan arte propio específico. Los otros 28 objetos de bloques descritos en la revisión histórica anterior ya no son el mobiliario visible de esta versión. Se conserva el origen de los PNG de habitaciones normales, personajes y FNF; no se presenta el arte nuevo como oficial de Undertale. Entrega exclusivamente como juego en ZIP experimental, sin publicación.

## Revisión vigente — patio soleado y piano aportado — 2026-10-13

`home-sunny-wing-20261013` conserva las fuentes anteriores y añade `assets/home/piano-waterfall.png`, imagen facilitada por el creador del juego, de 1253×946 RGBA. Se copia sin recodificar; el render utiliza el recorte (24,67,1111,761) a 102×70 sin suavizado. No se afirma autoría propia ni una licencia no aportada. Su procedencia, límites de atribución y SHA-256 se registran en [créditos de HOME](assets/home/CREDITS.md).

`home-outdoor-art.js` combina los terrenos, senderos con bordes, árboles y objetos de Autumn Forest de Marie Pepo con cielo, sol, colinas, nubes, aves, valla y estanque dibujados por código del proyecto. Copas, nubes, aves y agua animadas respetan Efectos tranquilos. `home-room-furnishing.js` dibuja por código la parte trasera de la televisión; los asientos continúan usando las fuentes de Bitglow. La ventana de lectura corresponde al exterior luminoso. Los PNG originales de los artistas, habitaciones y personajes conservan sus bytes.

`home-candle-art.js` conserva los 105 píxeles de la silueta de la vela original mediante tiras de `drawImage`, excluyendo los 148 píxeles del fondo de pared de su recorte. No necesita leer el canvas y conserva el contorno aun con lectura denegada. Este recurso deriva de la entrada original, no de una imagen nueva generada.
