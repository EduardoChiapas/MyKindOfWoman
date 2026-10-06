# Casa de Toriel - proyecto web

Proyecto web estilo Undertale usando la hoja de sprites proporcionada, con habitaciones recortadas, movimiento, cámara, interacciones y colisiones.

## Controles

- **Espacio**: entrar al juego desde la intro.
- **Flechas**: mover a Frisk.
- **Z** o **Enter**: interactuar.
- **X** o **Esc**: cerrar diálogo/libro.
- **F2**: mostrar/ocultar las zonas de colisión.

## Correcciones de esta versión

- Se eliminó el **spawn trap** entre habitaciones:
  - cada cambio de mapa coloca a Frisk en el punto definido;
  - luego lo separa automáticamente unos **14 píxeles nativos** del trigger de salida más cercano;
  - además hay unos fotogramas de gracia para evitar un rebote instantáneo entre habitaciones.
- En el **Corredor**, el cuadro y el espejo son objetos independientes:
  - cuadro: `* Un pequeño paisaje cuelga en la pared.`
  - espejo: `* Eres tú, a pesar de todo sigues siendo tú.`
- Se reajustaron las hitboxes de muebles en:
  - Cocina
  - Habitación de Toriel
  - Habitación de Frisk
- Las **escaleras de la Entrada** ya no son un bloque rectangular completo:
  - el centro negro es caminable;
  - las barandas/bordes son sólidos;
  - solo al llegar al extremo del hueco y pulsar **Z/Enter** aparece el mensaje del sótano.

## Habitaciones incluidas

- `assets/rooms/entrance.png` - entrada con escaleras.
- `assets/rooms/living_room.png` - sala con chimenea y librero.
- `assets/rooms/hallway.png` - corredor largo con cuadro, plantas, puerta y espejo.
- `assets/rooms/frisk_room.png` - habitación azul.
- `assets/rooms/toriel_room.png` - habitación de Toriel.
- `assets/rooms/kitchen.png` - cocina.
- `assets/rooms/stairs.png` - sprite fuente de las escaleras.
- `assets/source/home_and_new_home_sheet.png` - hoja original usada como referencia.

## Depuración de colisiones

Pulsa **F2**:

- verde tenue = área caminable
- rojo = sólido / mueble
- cian = salida / puerta
- azul = objeto interactuable
- amarillo = hitbox de Frisk
- borde blanco = alcance de interacción

## Estructura

```text
/
├─ index.html
├─ style.css
├─ script.js
├─ README.md
└─ assets/
   ├─ player/
   │  └─ frisk.png
   ├─ rooms/
   │  ├─ entrance.png
   │  ├─ living_room.png
   │  ├─ hallway.png
   │  ├─ frisk_room.png
   │  ├─ toriel_room.png
   │  ├─ kitchen.png
   │  └─ stairs.png
   └─ source/
      └─ home_and_new_home_sheet.png
```

## Nota

La tercera puerta visible del corredor continúa cerrada porque la hoja suministrada no incluye otro cuarto de HOME que corresponda claramente a esa puerta.
