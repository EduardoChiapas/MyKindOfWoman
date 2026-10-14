# HOME experimental · publicación 14 de octubre de 2026

Versión `home-pc-monitor-20261014`. Incluye toda la casa integrada, PC, apps,
Lumo y FNF original compilado con Tutorial → The Date Week → Bad Bunny.
El laboratorio aislado y los paquetes de Argon son entregas distintas.

FNF abre dentro del monitor. El botón superior derecho amplía la pantalla de
la PC sin reiniciar el juego; si el navegador impide pantalla completa nativa,
la ampliación funciona dentro de la página. Volver al escritorio cierra FNF.

La biblioteca de la PC contiene Whitroll, Perfume, Heartbass, Celoso, Palmas y
Amarre. Las canciones se eligen en el menú original; esta lista no lo reemplaza.
Se conservan los guardados anteriores y no se concede llave al ganar.

Precarga a los 2,5 segundos de entrar en casa, sin bloquear el movimiento.
Pausa descargas de fondo durante FNF. Revisión explícita del service worker y
rutas de entrada versionadas para evitar reutilizar una compilación anterior.
No borrar almacenamiento del navegador: ahí están los avances de la jugadora.

Para GitHub Pages, index.html, assets y fnf-original van en la raíz publicada.
Conservar .nojekyll y los dos ZIP internos de fnf-original/mods: el motor carga
esos ZIP directamente. No extraerlos, borrarlos ni subir el ZIP experimental
como si fuera el sitio. Publicar mediante Git/GitHub Desktop.

Esta copia trae la dirección pública existente del backend de Lumo. Las claves
se mantienen en el entorno privado del servidor. Nunca subir .env ni planning,
work, paquetes de Argon o documentos completos de lore. El sótano sigue cerrado
durante HOME y la cronología no cambia.

Verificación: 286 pruebas portables del proyecto, más comprobaciones de caché,
precarga, puente original y progreso de ambas weeks. Navegador: FNF real con
Whitroll dentro del monitor, ampliar/reducir y volver a escritorio/habitación.
No se repitieron canciones completas ni se probó un teléfono físico, Gemini
real o un recorrido narrativo completo de HOME. Pantalla completa nativa se
cubre por pruebas de ciclo de vida; el navegador de revisión usó el respaldo
de ampliación dentro de la página.
