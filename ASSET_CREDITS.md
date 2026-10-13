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

La habitación opcional de Lumo reutiliza los muebles del dormitorio original. La protagonista se llama Mira en los textos del juego y la app Determination; la fuente histórica de esa app se conserva fuera de los archivos publicados.


## Sprites, coherencia, sonido y minijuegos HOME — 2026-10-12

Mobiliario ampliado de código propio: home-pixel-art.js/home-room-details.js; personajes derivados en render de sus hojas aportadas, sin reemplazar archivos. Los atlas antiguos quedan históricos y no se cargan. El escondite vigente usa mobiliario propio, no clones del dormitorio.

Nueveefectos originales de Undertale extraídos del catálogo públicoTheSoundsResource: https://sounds.spriters-resource.com/pc_computer/undertale/asset/399803/ . Archivos, nombres exactos, SHA256 y corroboración de espejo en assets/sfx/home/SOURCES.json/README.md. Se incorporan los mismos bytes al reproductor local; no se incluyen el ZIP completo ni otros recursos del catálogo. Las asociaciones nuevas con muebles/minijuegos son decisiones del proyecto, no afirmación de sus usos originales. Derechos de muestras Undertale corresponden a sus autores; no se presenta la licencia del mirror/motor como licencia de las muestras. Los tonos del piano/tarareo propios y las cuatro muestras anteriores se conservan.
