# Lumo en HOME

Lumo acompaña a Mira por las habitaciones y usa los sprites originales de mundo a color.
Sus retratos de conversación son cabezas originales en blanco y negro, dibujadas desde
assets/lumo/manifest.js/json con escalado sin suavizado. La interfaz conserva la fuente local
y las cajas negras con borde blanco; PC/FNF y sus diálogos siguen separados.

## Uso y actividades

Acércate y examina con Z, toca el sprite o usa el botón Lumo/tecla L. El primer encuentro
inicia el acompañamiento. HABLAR abre un campo libre; ACARICIAR muestra su reacción.
DAR OBJETO aparece cuando hay un regalo en inventario. JUGAR ofrece actividades existentes:
escondidas de tres rondas, memoria de cuatro parejas y escuchar un tarareo de cuatro notas.
Puedes cerrar o dejar una actividad para después, sin penalización.

La cocina ofrece una galleta; el pasillo, una flor de papel; el dormitorio, una cinta.
El escondite permite dibujar una estrellita para regalar. Cada objeto se recoge una vez.
El escondite se abre tras conocer a Lumo, visitar tres habitaciones distintas y compartir
una caricia, regalo o juego. Su dibujo y caja recuerdan experiencias compartidas.
El sótano existente continúa accesible y el clóset del fondo permanece cerrado.

## Archivos y contratos

- lumo-actor.js: seguimiento, rutas sobre suelo, recuperación, emociones y animaciones.
- lumo-mind.js: diálogo local, memoria por IDs, amistad, contexto permitido y cliente de IA.
- lumo-ui.js/css: modal, historial reciente, escritura/audio, retratos, foco y teclado móvil.
- lumo-activities.js/css: juego de parejas.
- lumo-integration.js: interacción, regalos, escondidas, escondite y puente al motor.
- lumo-config.js: configuración pública del endpoint; nunca contiene una clave del proveedor.
- server/: proveedor, reglas HOME y endpoint. Ver server/LUMO_BACKEND.md para instalación.
- assets/lumo/: originales, manifiestos y procedencia.

LumoUI.mount(adapter) enlaza contexto, pausa, audio, actor, mente, regalos y actividades.
open/close/speak/toast/advance controlan su interfaz; isOpen/isPending exponen estado.
La UI emite lumo:frequency, lumo:privacy y lumo:history-cleared.
LumoMind expone init/getState/remember/act/chat/configure/resetHistory.
Los resultados solo contienen texto, emoción/animación permitidas, referencia de recuerdo,
source y narrative_intent:null. El motor controla todas las acciones y progresión.

## Conexión, memoria y pruebas

El backend usa credenciales solo de servidor y un proveedor configurable.
Con frontend estático, se necesita un backend accesible según server/LUMO_BACKEND.md.
“IA conectada” aparece solo tras una respuesta validada del proveedor; el respaldo se llama
“Diálogo local”. La llamada real está pendiente de credenciales y verificación del despliegue.

El historial conversacional es breve y volátil. Solo se guardan recuerdos seleccionados,
eventos e inventario con versiones propias, separados del guardado de PC/FNF.
Borrar chat conserva aventuras y regalos. Los ajustes permiten reducir/apagar comentarios
y controlar la persistencia entre sesiones. No hay presión por un contador de amistad.

Pasaron 36 pruebas automatizadas, sin fallas, además de comprobaciones en navegador de chat,
regalos, memoria, escondite, retratos y PC. La emulación móvil 390×844/390×430 mantuvo el campo
visible sin desbordamiento horizontal. Las pruebas extensas verifican memoria y migraciones
tras 1,800 turnos locales, 2,000 contextos y otras 1,000 conversaciones antes de recarga.
No sustituyen una conversación real de IA ni una prueba de Android físico, todavía pendientes.
Ver verificacion-lumo.json para evidencia y ejecutar, desde esta carpeta:

```powershell
node --test --test-isolation=none tests/lumo-mind.test.cjs tests/lumo-backend.test.cjs tests/lumo-integration.test.cjs tests/lumo-actor.test.cjs
```

Esta integración de Lumo no certifica que el argumento completo de HOME esté terminado.

