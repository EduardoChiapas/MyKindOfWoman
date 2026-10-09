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
