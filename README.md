# Para Damaris · Un lugar al que volver

Una versión pulida de tu proyecto de la casa de Toriel. Extrae **todo el ZIP** y abre **index.html** en Chrome, Edge o Firefox. No requiere instalación, compilación, conexión ni cuentas. La música comienza al entrar en la casa. También funciona con cualquier servidor estático.

## Qué se ha mejorado

- Vista de 640 × 480, con los fondos nativos a escala 2 y píxeles nítidos.
- Caminar a velocidad constante, diagonales normalizadas, parada inmediata y animación ligada a la distancia recorrida. Se aceptan flechas y WASD.
- Colisiones de los pies con subpasos y ajuste preciso contra paredes: no se atraviesan barandales ni muebles. Cámara estable con una pequeña zona de seguimiento.
- Fundidos cortos al cruzar puertas, con colocación segura y protección contra volver inmediatamente por la misma salida.
- Fuego animado, sillón, mesa, florero y tarta extraídos de la hoja de sprites que ya incluía el proyecto. Profundidad correcta al caminar detrás de los muebles y luces discretas en velas y lámparas.
- Textos más acogedores; las siete descripciones provisionales del sótano se han completado. Se conservan el espejo, el libro y la dedicatoria a Damaris.
- Texto progresivo, páginas de hasta tres líneas, pequeño sonido de lectura, botón de continuación y anuncio accesible por página.
- Música con entrada y cambios de volumen suaves entre casa y sótano; crepitar tenue cerca de la chimenea; control de silencio.
- Ayuda con pausa, pantalla completa, controles táctiles y modo de efectos tranquilos. La preferencia de silencio y efectos se recuerda si el navegador permite almacenamiento local.
- Todos los recursos necesarios son locales; ya no se depende de Google Fonts.

## Controles

| Acción | Teclas |
| --- | --- |
| Entrar | Espacio, Enter, Z o botón de inicio |
| Caminar | Flechas / WASD / joystick táctil |
| Examinar | Z / Enter |
| Completar texto y avanzar | Z / Enter / Espacio / botón del diálogo |
| Cerrar diálogo o libro | X / Esc |
| Ayuda y pausa | H |
| Audio | M |
| Pantalla completa | F |
| Ver colisiones para depuración | F2 |

Puedes tomarte todo el tiempo que quieras; no hay temporizador. Al perder el foco se liberan los controles y, al ocultar la pestaña, el audio se pausa. El modo «Efectos tranquilos» detiene las pequeñas variaciones de fuego y luz y presenta el texto completo.

## Fidelidad y personalización

Se ha acercado la presentación y el tacto al RPG original conservando tu proyecto. **No es una réplica exacta de Undertale**: se mantiene el sprite de Frisk que traía el ZIP, el laberinto personalizado del sótano, los textos para Damaris y las pistas de audio proporcionadas. No se han sustituido por recursos descargados ni por supuestos assets oficiales.

## Archivos

- `script.js`: habitaciones, colisiones, caminar, cámara, espejo y transiciones.
- `ambience.js`: muebles, fuego y luces locales; comparte sus datos de colisión con el motor.
- `experience.js`: diálogos, sonido, ayuda, preferencias y carga inicial.
- `lore.js`: objetos de la casa; coordenadas nativas del fondo.
- `basement.js`: geometría, renderizado y objetos del laberinto.
- `index.html` / `style.css`: interfaz adaptable sin dependencias externas.
- `assets/props/`: nuevos recortes transparentes de la hoja incluida. La hoja original permanece intacta.

## Validación realizada

Verificación automatizada de las siete habitaciones, doce puntos de llegada, doce transiciones completas y 57 objetos examinables. El recorrido busca posiciones válidas con las colisiones reales a pasos de dos píxeles de mundo en la casa y diez en el sótano. Se comprueban también movimiento a 30, 60 y 144 Hz, diagonales, paredes finas, parada, pérdida de foco, paginación, pausa, cambio gradual de música y silencio.

Revisión visual en navegador de inicio, entrada, sala con muebles, diálogo y ayuda; sin errores de consola en esas comprobaciones. Los scripts de prueba y el servidor de desarrollo no forman parte del juego entregado.

Los fondos, el personaje y las pistas proceden del ZIP suministrado. Los elementos de Undertale pertenecen a sus respectivos autores; la dedicatoria y las ampliaciones son parte de este proyecto personal.
