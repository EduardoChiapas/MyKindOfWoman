# La PC de Toriel · FNF original

La habitación abre un escritorio con monitor, torre y ventiladores RGB. El icono de FNF abre el motor oficial **Friday Night Funkin’ 0.8.6**, compilado para HTML5, con sus menús y gameplay originales. La web aloja esa compilación en un iframe; el ejecutable de Windows no se ejecuta en el navegador y no se usa un emulador.

El mod suministrado es **feat. Bad Bunny 1.0.0**, de **gamerbross**, con sus tres canciones: **Celoso, Palmas y Amarre**. El catálogo se limita al **Tutorial** y a la **semana de Bad Bunny** con esas tres canciones, conservando los menús originales. El juego original controla la selección de canciones, las notas, animaciones, estados y menús.

## Abrirlo

1. Extrae la carpeta completa, incluyendo `fnf-original/` y todos sus recursos.
2. Ejecuta `iniciar.cmd` en Windows o `node servidor.cjs` desde esta carpeta. El lanzador necesita Node.js o el runtime de Codex disponible en este equipo.
3. Abre la dirección que indica el servidor en **Chrome o Edge de escritorio**.
4. Pulsa **Probar la PC de Toriel**, mira hacia la mesa y pulsa **Z / Enter**. También puedes llegar recorriendo la casa.

La compilación original necesita un servidor HTTP/HTTPS. Abrir `index.html` por doble clic con `file://` no carga FNF. La primera carga puede tardar: el motor y sus imágenes, fuentes, música y voces tienen un tamaño considerable. Conserva todos los assets y sus rutas; los audios OGG originales están destinados a los navegadores indicados.

## Usar la PC

Al examinar la mesa aparece la vista cercana de la computadora. El escritorio incluye notas con guardado local, calculadora, catálogo del mod y ajustes de volumen/brillo.

Pulsa **FNF · Jugar** para abrir el juego original a tamaño de la ventana. Se solicita también pantalla completa al navegador. En la pantalla de título, usa **Enter** para continuar. En **Story Mode** puedes elegir Tutorial o la semana de Bad Bunny; en **Freeplay** puedes elegir una canción individual. Las tarjetas de **Canciones** también abren el juego con sus menús; no saltan a un chart ni sustituyen la selección original. El propio juego conserva sus controles y opciones.

Al terminar **Tutorial** o una canción elegida en **Freeplay**, FNF sigue abierto y vuelve al **menú original de semanas**, sin mostrar la animación del porcentaje de resultados. En **Story Mode**, la semana de Bad Bunny mantiene la secuencia **Celoso → Palmas → Amarre** y vuelve al menú de semanas al completarla. Tutorial no cuenta entre las tres canciones completadas del mod. Las victorias del mod se guardan; la entrega de la **tercera llave** queda pendiente para más adelante.

El botón exterior **Volver al escritorio** permite salir manualmente del juego en cualquier momento. Esa salida elimina el iframe para detener el audio y el motor; ganar conserva la sesión de FNF abierta.

Desde el escritorio, **Volver a la habitación / Esc** devuelve los controles a Frisk y reanuda el audio de la casa. Mientras la PC está abierta, la habitación mantiene bloqueados su movimiento y sus atajos.

El progreso se guarda en este navegador mediante `localStorage`, en `toriel.pc.original.bad-bunny.progress.v1`. Las notas y los ajustes también son locales. El progreso del port anterior no se usa como victoria del motor original.

## Integrarlo en otro proyecto

La opción más directa es copiar **toda la carpeta `pc-room/`** al servidor de tu proyecto y abrirla en una página o un iframe. Conserva íntegra `pc-room/fnf-original/`, junto con `assets/` y los scripts del host:

```html
<iframe
  src="/pc-room/index.html"
  title="La PC de Toriel"
  allow="autoplay; fullscreen; gamepad"
  allowfullscreen
  style="width:100%;height:100dvh;border:0">
</iframe>
```

Para llevar solo la PC a otra escena, coloca los componentes y `fnf-original/` junto al HTML de esa escena, conservando sus rutas:

```html
<gaming-desktop hidden></gaming-desktop>
<script src="pc-desktop.js"></script>
<script src="fnf-original-host.js"></script>
<script src="pc-integration.js"></script>
```

`pc-integration.js` está conectado a esta casa. En tu otra escena adapta sus referencias a `gameState`, `gameContainer`, `HouseExperience`, `resetMovementInput()`, `resetJoystick()` y `canvas`, además de los elementos de inicio e interacción. La compilación original debe permanecer en el **mismo origen** que el host.

La API de la integración es:

```js
GamingPC.open();       // Mostrar el escritorio desde la interacción de tu escena.
GamingPC.launchGame(); // Abrir el juego y sus menús originales.
GamingPC.close();      // Cerrar juego/PC y devolver el control a la escena.
GamingPC.getState();   // Consultar active, playing, progress y el estado del host.

window.addEventListener('quest:key-obtained', event => {
  if (event.detail.key === 3) {
    // Punto reservado para la futura integración de la llave.
    // La versión actual no emite este evento al ganar canciones.
  }
});
```

El escritorio emite `pc:launch-game`, `pc:close` y `pc:volume` con `{volume}`. El host `<fnf-original-host>` ofrece `start()`, `stop()`, `setVolume(0..1)` y `getState()`.

El puente del motor original envía `fnf-original:ready`, `fnf-original:win` con `{songId,stats}` y, si corresponde, `fnf-original:error`. El host acepta esos mensajes únicamente desde la ventana exacta del iframe y su mismo origen. Las victorias guardan el progreso sin cerrar FNF ni conceder una llave. `quest:key-obtained` queda reservado para una futura integración y no se emite al ganar ninguna canción. Un flag `key3` de una versión anterior de este guardado se retira al cargar, conservando las victorias. El volumen se envía al motor como `fnf-original:volume`. Si falta la compilación original, se muestra el error y se vuelve al escritorio.

Los autores, procedencias y licencias se detallan en `CREDITOS.md` y `ASSET_CREDITS.md`.
