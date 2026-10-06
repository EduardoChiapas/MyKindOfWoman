FONDOS DE HABITACIONES
======================

El proyecto funciona aunque esta carpeta no tenga imágenes: script.js dibuja
fondos provisionales para poder probar movimiento, puertas y colisiones.

Cuando tengas los fondos de las habitaciones que tienes permiso de usar,
ponlos aquí con estos nombres exactos:

- entrance.png
- living_room.png
- hallway.png
- frisk_room.png
- toriel_room.png
- kitchen.png
- basement.png

Recomendación: exportarlos a 800x600 PNG para que coincidan exactamente con
las coordenadas de colisión actuales.

Para ajustar colisiones:
1. Abre el juego.
2. Presiona F2.
3. Rojo = colisión sólida.
4. Verde = puerta/transición.
5. Azul = objeto interactuable.
6. Amarillo = hitbox real del personaje.

Después edita los rectángulos dentro de la constante `rooms` en script.js.
