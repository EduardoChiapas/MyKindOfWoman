# Lumo en HOME

Lumo acompaña a Mira con sprites originales a color y retratos originales de cabeza B/W. Fuente local, marco negro/blanco y escalado sin suavizado. Los originales de assets/lumo permanecen intactos.

## Uso

Acércate e interactúa con Z/E o toca su sprite. Lumo saluda naturalmente; solo aparecen retrato, texto y campo separado que aparece al confirmar la última página con Enter/toque. Tocar texto/Z/E/Enter fuera acelera o avanza; Enter dentro envía una vez. Esc/X fuera o toque exterior cierra/cancela. Sin historial visible, sugeridos, barra, botón ENVIAR, etiquetas, proveedor ni avisos técnicos en conversación.

L y el silbato llaman sin chat. Diario J y opciones H permiten consultar compañía/actividades y privacidad fuera del diálogo. Regalos disponibles según inventario real; escondidas de tres rondas, memoria de cuatro parejas y tarareo. Galleta, flor de papel, cinta y dibujo se recogen una vez y entregar los consume. El escondite se abre tras encuentro, tres cuartos distintos y una experiencia compartida. Sin castigo por ausencias. Todo el acceso al sótano permanece bloqueado durante HOME.

## Contratos de interfaz

LumoUI.mount(adapter) recibe contexto, stage opcional, pausa, audio, actor, mente y actividades. API: open/close/speak/toast/bubble/advance/sendMessage/openSettings/openActions/refresh; isOpen/isPending/aiConnected.

speak(response,{after:'scene'}) reserva texto guionado sin campo y espera un avance final. La respuesta normal abre el campo sola. bubble(response,{anchor:{x,y},duration:3}) muestra reacción local durante tres segundos sin foco/pausa/API. toast ambiental respeta frecuencia.

Eventos de privacidad: lumo:frequency, lumo:privacy, lumo:history-cleared y lumo:personal-memories-cleared. Borrador y solicitud sobreviven al panel externo; cerrar/borrar/revocar cancela pendientes e ignora respuestas tardías.

Archivos: lumo-actor.js, lumo-mind.js, lumo-ui.js/css, lumo-activities.js/css y lumo-integration.js. HomeProgress/HomeStory añaden progreso/actividades. server/ implementa perfiles independientes de Lumo/Ryon, proveedor, sesiones y validación. lumo-config.js solo contiene configuración pública, nunca claves.

## Conexión y privacidad

Backend preparado para Gemini nativo, con adaptador alternativo configurable. La conexión del juego es automática; el servidor necesita habilitación y modelo/clave, exclusivamente del lado del servidor. Las opciones de borrado y la política de privacidad permanecen fuera del diálogo. Sin configuración o ante fallo, Lumo responde localmente sin avisos técnicos invasivos.

Privacidad accesible desde opciones externas: información sobre el proveedor, historial reciente privado y acotado, borrado de mensajes o recuerdos personales separado de aventuras/regalos/partida. Sesiones y perfiles separados. No claves frontend ni panel de lectura de conversaciones. Consultar [servidor](server/LUMO_BACKEND.md) y documentos de privacidad; no afirmar privacidad absoluta ante tratamiento externo.

## Verificación

Las suites de mente, backend, actor, UI y continuidad HOME verifican contratos de estas funciones. Sus resultados actuales están en el apartado de ampliación local; no certifican una partida completa.

Teléfono físico y despliegue de esta versión siguen pendientes. La integración HTTP real se comprobó en una tarea anterior; las pruebas de esta ampliación usan proveedor simulado. No afirmar IA real a partir de mocks ni HOME terminado por integrar funciones.


Adaptación móvil 2026-10-11: flecha de envío integrada en el campo (44×44), visible en pantallas pequeñas/táctiles; PC conserva Enter y la interfaz sin botón visible. Teclados blandos pueden enviar con key Enter sin code, beforeinput o input no cancelable; composición/Shift+Enter/pegado no envían accidentalmente. El viewport visible limita el cuadro incluso con desplazamiento/teclado. Las respuestas no enfocan automáticamente el campo móvil y al enviar se aparta el teclado para leer.


Diálogo por turnos 2026-10-11: las páginas se mantienen hasta Enter/toque, sin avance automático. Enter completa primero la animación si está escribiéndose; después avanza. Al confirmar la última página se ocultan retrato y diálogo y queda solo el campo negro para escribir. El saludo inicial/reencuentro combina ocasión, habitación y mañana/tarde/noche del dispositivo; evita repetición inmediata por ID persistente. Sin llamada a Gemini para saludar. Lumo responde habitualmente con35–80 palabras, máximo100/1400 caracteres; Ryon mantiene su límite anterior.

## Conversación local ampliada — 2026-10-12

239 temas producen15.296 variantes completas distintas mediante aperturas y cierres compatibles. Son combinaciones contextuales, no15.296 historias independientes. El catálogo compacto pesa63KB. Preguntas sin datos conocidos reciben una evasiva honesta; los chistes respetan el tema. Hay576 saludos posibles por ocasión, habitación y franja horaria, con frases tranquilas en contexto serio.

Con backend externo, el saludo despierta la conexión en segundo plano con un GET de disponibilidad. Durante el primer arranque o tras15min sin tráfico de conversación, Lumo responde localmente al texto escrito. Gemini vuelve en el siguiente mensaje cuando la disponibilidad se confirma; no se supone que esté listo por cumplirse un minuto. Una petición compartida evita duplicados; no hay heartbeat ni aviso técnico.

Los IDs de respuestas y risas se conservan separados del historial libre y se recuperan como datos seguros para continuar la conversación. No se usan como instrucciones ni acciones de juego. Personalidad, recuerdos, privacidad y orden narrativo se mantienen. Al reducir la pantalla, las páginas pendientes se reajustan sin saltar al cuadro de escritura.

146 pruebas pasan en14 archivos, con catálogo/saludos completos, proveedor y reloj simulados. QA de interfaz en escritorio y390×844 con servidor aislado sin credenciales. Publicación y teléfono físico pendientes; estas pruebas no certifican HOME completo.
