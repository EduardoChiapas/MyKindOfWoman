# Casa de Toriel — escalera en U y sótano morado

Descomprime todo el ZIP y abre toriel_house_project/index.html. No requiere instalación, compilación ni servicios externos. También funciona en un servidor estático.

## Controles

- Espacio o toque en «Para Damaris»: iniciar el juego y el BGM.
- Flechas o joystick móvil: caminar. Zona muerta del joystick: 15 %.
- Z / Enter: examinar el objeto frente al personaje.
- X / Esc: cerrar diálogo o libro.
- F2: mostrar colisiones, salidas y hitboxes interactivas.

## Correcciones integradas

La Entrada utiliza exactamente tres sólidos de barandal, con un grosor de dos píxeles nativos. La boca de acceso por el lado derecho queda libre. El suelo de los muebles se excluye de walkable en lugar de añadir otros sólidos.

STAIR_WALKABLE describe una U invertida: descansillo izquierdo, peldaños superiores y rama derecha hasta una llegada profunda pequeña. La superficie central negra queda fuera de walkable. El trigger R(199, 96, 16, 9) ocupa sólo negro puro y se activa cuando el centro de los pies entra en él. La llegada mide 16 píxeles nativos de ancho frente a los 10 de la hitbox. Para bajar, acércate por el lado derecho, camina hacia los peldaños superiores y avanza hacia el fondo. El retorno del sótano aparece en el descansillo izquierdo, con una ruta libre de regreso a la casa.

El laberinto conserva sus cruces, circuito, desviaciones, callejones, puerta final y dimensiones de 3000 × 2500 unidades de mundo. Su renderizador usa suelo morado #5a456b y variantes próximas, con muros #2d2236. La penumbra es rgba(20, 15, 35, 0.6). La casa conserva rgba(15, 15, 30, 0.2). El halo del jugador mantiene radio 440 y las 14 lámparas conservan sus luces.

El espejo utiliza una máscara con clip. Dentro se pinta primero rgba(180, 190, 200, 0.6) y después el clon del jugador con alpha 0.5 y posición player.y - 30. Se intercambian las filas UP/DOWN sin invertir el canvas. El marco y el texto original se conservan.

Hay siete hitboxes invisibles nuevas en los remates de los callejones: forgotten-1 a forgotten-7. Sus textos «* [Espacio para objeto olvidado N]» pueden editarse en el arreglo interactives de basement.js. No añaden colisiones. Se conservan las otras interacciones de la casa y el sótano: 55 en total.

El MP3 completo está incluido en assets/audio/undertale.mp3. Se inicia en el gesto de Espacio o toque de la introducción y continúa en bucle durante cambios de habitación y diálogos.

## Archivos y coordenadas

- script.js: movimiento, colisiones, datos de Entrada, espejo, iluminación y BGM.
- basement.js: geometría, paleta, renderizado e interacciones del laberinto.
- lore.js: interacciones de la casa.
- index.html / style.css: interfaz y controles.
- assets/: imágenes y audio completos.

R() convierte píxeles nativos a mundo con escala 2. La hitbox completa de los pies mide 20 × 12 unidades y usa offsets (14, 53). La cobertura se comprueba contra la unión completa de walkable y los movimientos se subdividen para evitar atravesar obstáculos finos. La cámara sigue ambos ejes del mapa.

## Verificación

Pasaron 24 suites de lógica, incluyendo 949 posiciones de descenso, siete columnas de acceso hasta el trigger, ida y regreso, hueco central, obstáculos, todos los spawns, los 885 cuadrados conectados del laberinto, sus empalmes, las 55 interacciones, joystick y animación. La comprobación sobre el PNG confirma que el trigger ocupa 144 píxeles negros y que el interior negro central no se incluye en los peldaños.

En navegador se confirmó el descenso al sótano, el reflejo de pie sobre el cristal gris celeste y la arquitectura morada visible. La capa de luz conserva el mapa y restaura source-over. El BGM inicia tras Espacio y continúa en los cambios de habitación. No hubo errores de consola. Los controles privados de prueba no forman parte del proyecto entregado.
