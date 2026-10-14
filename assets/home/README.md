# HOME — fuentes del arte vigente

Versión `home-art-library-20261013`. El rediseño se limita a las seis áreas nuevas y conserva las habitaciones originales, personajes, PC/FNF y guardados.

Bitglow: packs LRK v1.1, BA v1.0 y BR v1.1. Once PNG originales, copiados sin cambiar sus bytes, en [bitglow/](bitglow/CREDITS.md), con las licencias originales. El juego compone 24 muebles interiores y la flor con recortes a 1×/2×, sin suavizar, deformar ni recolorear. El lavabo combina tres sprites del autor; bañera/lavabo utilizan sus variantes con agua. Los materiales mantienen fase continua en los pasillos. Las cartas de parejas y el dibujo realmente recogible siguen siendo elementos del juego.

Marie Pepo: dos hojas originales de [Autumn Forest](https://marie-pepo.itch.io/autumn-forest), en [marie-pepo/](marie-pepo/CREDITS.md). Jardín con árbol, roca con musgo, banco, calabazas, señal y setas. Césped y bordes del sendero comparten el fondo del pack; no se superponen bloques de otro tono. Uso en proyectos personales/comerciales con crédito al artista; no reventa de los recursos independientes. No se presenta este juego como un pack de assets.

31 objetos del ala usan fuentes de los artistas. El dibujo de amistad y el pasadizo lateral conservan su arte específico y sus eventos. Posición, interacción, sólidos y profundidad se definen juntos en home-world.js. Las pistas usan los nombres físicos actuales, conservando los IDs anteriores para los guardados.

Los objetos móviles de la zona normal reutilizan sus PNG originales. El refrigerador conserva ambos paneles juntos; un respaldo basado en drawImage permite renderizar sin getImageData, cuya lectura puede ser bloqueada con file://. Duración 480 ms; los demás gestos mantienen su duración. Efectos tranquilos muestra pose final. El retrato del corredor y el libro real de Mira conservan la integración anterior.

Los atlas generados anteriores, furniture-atlas.png y lumo-furniture-atlas.png, son históricos y no se cargan. No se generaron nuevos muebles ni sonidos en esta revisión. Las hojas originales de Lumo, sus retratos B/W y los sonidos previos siguen intactos. 246 pruebas pasan en 28 archivos; los límites de QA constan en LEEME-EXPERIMENTAL.md.
