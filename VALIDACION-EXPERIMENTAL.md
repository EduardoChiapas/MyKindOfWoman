# Validación de HOME experimental

Versión `home-sunny-wing-20261013`, 13 de octubre de 2026.

**281/281 pruebas automáticas pasan en 33 archivos.** Registro privado: `work/home-sunny-wing-validation-2026-10-13.log`. Incluyen recortes y dimensiones reales, límites de dibujo, patio animado con efectos tranquilos, caché de terreno, TV con estado persistente, colisiones, selección real de todos los objetos desde suelo conectado y llegadas seguras. El piano aportado conserva sus bytes y proporciones; las velas conservan sus 105 píxeles físicos sin copiar los 148 del fondo. Las pruebas del proveedor usan respuestas simuladas.

El enlace entre corredor y pasillo se verifica con movimiento real del motor: posición y cámara continuas, sin fundido ni reiniciar la animación; Lumo conserva su posición y sigue al jugador durante cuadros posteriores. El suelo nuevo se coteja directamente contra píxeles del PNG original.

Se revisaron en navegador local aislado el baño, la sala de lectura/música, el patio al aire libre, las velas del pasillo y el escondite. Se abrió la actividad del piano mediante `findInteraction` real. Se guardaron capturas limpias de las cinco áreas y del piano fuera del ZIP. La última consulta de consola no mostró errores ni avisos capturados. La continuidad física se volvió a comprobar mediante las pruebas del motor.

Se cotejaron 21 archivos protegidos con SHA-256: seis fondos originales, PC/aplicaciones/arte, FNF y sus mods, precarga y configuración pública. Permanecen idénticos. El piano coincide byte por byte con la imagen aportada por el usuario. Los PNG de biblioteca se conservan con sus créditos; la adaptación de color de interiores se aplica solo al dibujar el ala. Layout 2 reubica posiciones antiguas del baño, lectura y patio, conserva las posiciones layout 1 del pasillo y escondite y protege las versiones futuras.

La suite portable excluye el antiguo harness externo de navegador, que no pudo iniciar Edge en este entorno. La revisión visual descrita se hizo aparte con el navegador integrado. Esto no certifica una partida natural completa de HOME, una llamada nueva a Gemini, nuevas canciones FNF jugadas, teléfono físico ni un benchmark de FPS. Las ubicaciones de captura se seleccionaron con herramientas privadas de prueba; no se incluyen en el ZIP.
