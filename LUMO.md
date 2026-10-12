# Lumo en HOME

Lumo acompaña a Mira con sprites originales a color y retratos originales de cabeza B/W. Fuente local, marco negro/blanco y escalado sin suavizado. Los originales de assets/lumo permanecen intactos.

## Uso

Acércate e interactúa con Z/E o toca su sprite. Lumo saluda naturalmente; solo aparecen retrato, texto y campo automático después de la última página. Tocar texto/Z/E/Enter fuera acelera o avanza; Enter dentro envía una vez. Esc/X fuera o toque exterior cierra/cancela. Sin historial visible, sugeridos, barra, botón ENVIAR, etiquetas, proveedor ni avisos técnicos en conversación.

L y el silbato llaman sin chat. Diario J y opciones H permiten consultar compañía/actividades y privacidad fuera del diálogo. Regalos disponibles según inventario real; escondidas de tres rondas, memoria de cuatro parejas y tarareo. Galleta, flor de papel, cinta y dibujo se recogen una vez y entregar los consume. El escondite se abre tras encuentro, tres cuartos distintos y una experiencia compartida. Sin castigo por ausencias. Todo el acceso al sótano permanece bloqueado durante HOME.

## Contratos de interfaz

LumoUI.mount(adapter) recibe contexto, stage opcional, pausa, audio, actor, mente y actividades. API: open/close/speak/toast/bubble/advance/sendMessage/openSettings/openActions/refresh; isOpen/isPending/aiConnected.

speak(response,{after:'scene'}) reserva texto guionado sin campo y espera un avance final. La respuesta normal abre el campo sola. bubble(response,{anchor:{x,y},duration:3}) muestra reacción local durante tres segundos sin foco/pausa/API. toast ambiental respeta frecuencia.

Eventos de privacidad: lumo:frequency, lumo:privacy, lumo:history-cleared y lumo:personal-memories-cleared. Borrador y solicitud sobreviven al panel externo; cerrar/borrar/revocar cancela pendientes e ignora respuestas tardías.

Archivos: lumo-actor.js, lumo-mind.js, lumo-ui.js/css, lumo-activities.js/css y lumo-integration.js. HomeProgress/HomeStory añaden progreso/actividades. server/ implementa perfiles independientes de Lumo/Ryon, proveedor, sesiones y validación. lumo-config.js solo contiene configuración pública, nunca claves.

## Conexión y privacidad

Backend preparado para Gemini nativo, con adaptador alternativo configurable. IA está deshabilitada por defecto hasta habilitarla y configurar modelo/clave exclusivamente en servidor. Con permiso y configuración, la presentación limpia mantiene Gemini; no cambia preferencias para ocultar información. Sin configuración/permiso o ante fallo, Lumo responde localmente sin warnings técnicos.

Privacidad accesible desde opciones externas: información sobre el proveedor, historial reciente privado y acotado, borrado de mensajes o recuerdos personales separado de aventuras/regalos/partida. Sesiones y perfiles separados. No claves frontend ni panel de lectura de conversaciones. Consultar [servidor](server/LUMO_BACKEND.md) y documentos de privacidad; no afirmar privacidad absoluta ante tratamiento externo.

## Verificación

Mente/backend integrado: 42 pruebas; UI limpia: siete; HomeStory integrado: diez. Puente de llamada/cercanía y actor verificados por sus suites. PC apps registradas con Ryon local y escena HOME en verificación de navegador; estas pruebas no certifican una partida completa.

Android físico, proveedor real con credenciales/modelo y despliegue siguen pendientes. No afirmar IA real a partir de mocks ni HOME terminado por integrar funciones. La raíz actualizará evidencia y resultado final de entrega.
