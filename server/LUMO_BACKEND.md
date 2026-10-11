# Lumo: conversación de HOME

Servidor local sin dependencias, para Node 22 o posterior. Ejecutar desde `outputs/pc-room`:

```powershell
node server/lumo-server.cjs
```

Abrir `http://127.0.0.1:8787`. Sin configuración el juego funciona con diálogos locales,
identificados mediante `source: "local"`. Para IA, copiar `.env.example` como `.env` solo
en el equipo del creador, definir clave/modelo del proveedor y ejecutar:

```powershell
node --env-file=.env server/lumo-server.cjs
```

La URL base debe ofrecer Chat Completions compatible con OpenAI. Modelo y clave permanecen
en el servidor. No publicar `.env` ni introducir una clave en la interfaz. El puerto es
configurable; el servidor local escucha por defecto en `127.0.0.1`. No sirve `.env`, la carpeta
`server`, claves, registros, archivos ocultos ni fuentes del servidor. Sirve el juego y los
recursos existentes, con soporte de rangos para audio. `servidor.cjs` anterior no es necesario.

## GitHub Pages y servidor separado

GitHub Pages sirve archivos estáticos y no ejecuta este backend ni puede custodiar la clave.
Para conversaciones reales allí hace falta un servidor HTTPS separado. Preparación:

1. Alojar `server/lumo-server.cjs` con sus módulos y `lumo-mind.js` en un hosting de Node,
   con clave/modelo configurados como secretos de ese hosting. Si el hosting requiere escuchar
   en todas las interfaces, definir `LUMO_BIND_HOST=0.0.0.0`; exige también un
   `LUMO_PUBLIC_ORIGIN=https://tu-backend.example` y HTTPS a través del proxy del hosting.
2. Definir `LUMO_ALLOWED_ORIGINS=https://eduardochiapas.github.io`, o el origen exacto de la
   página. Una lista admite comas; nunca usar `*`, rutas de repositorios o credenciales.
3. Editar únicamente el endpoint público en `lumo-config.js`, por ejemplo
   `https://tu-backend.example/api/chat`. Este archivo no acepta claves. Cargarlo antes de
   `lumo-mind.js`. La dirección debe estar definida por el creador antes de jugar; mensajes y
   opciones de la jugadora no pueden introducir otro servidor remoto.

El navegador usa CORS con preflight OPTIONS y POST para los orígenes exactos permitidos.
Las llamadas externas omiten cookies; no se habilita Access-Control-Allow-Credentials.
Los hosts y orígenes no configurados se deniegan. Mantener HTTPS y los límites de gasto del
proveedor en el hosting. La preparación anterior no publica ni crea una cuenta de hosting.
Con `endpoint: null` se usa `/api/chat` del mismo origen: funciona en el servidor local;
en Pages la falta de backend lleva al respaldo local identificado.

## Contrato

`POST /api/chat` recibe `{message, context, history}` como JSON del mismo origen o de un
origen HTTPS expresamente configurado.
Mensaje hasta 800 caracteres; petición hasta 8 KiB; historial hasta 8 entradas, de las cuales
solo 6 pueden entrar al modelo. Respuesta `{text, emotion, animation, memory_reference,
narrative_intent, source}`. `source` es `ai` solamente cuando la respuesta del proveedor
pasa validación; el resto se identifica como `local`. `narrative_intent` siempre es `null`.
Errores del proveedor no se devuelven al navegador. Cerrar la conversación cancela la petición.

El servidor reconstruye en cada petición el perfil inmutable de HOME y un contexto nuevo
formado únicamente por IDs permitidos. Ignora capítulo, identidad, órdenes, biografías,
descripciones y secretos enviados por el cliente. Nunca importa la guía de capítulos futuros.
El sótano está abierto y el clóset del fondo sigue cerrado. El modelo no recibe ninguna
explicación de Ryon, del mundo ni del origen de Lumo. Los eventos del mundo siguen bajo el motor.

Se verifican 8–45 palabras, hasta cuatro oraciones breves, emociones y animaciones permitidas,
recuerdos realmente enviados, ausencia de comandos y términos de revelaciones bloqueadas.
Preguntas reconocidas sobre conocimiento reservado y señales de angustia reciben respuesta local
antes de llamar al proveedor. Los filtros, el contexto limitado y las pruebas son defensas;
no constituyen una garantía perfecta frente a toda formulación o modelo posible.

## Memoria y privacidad

`window.LumoMind` ofrece `init()`, `getState()`, `remember(type, details)`,
`act(action, details, context?)`, `chat(text, context, {signal}?)`, `configure(options)` y
`resetHistory()`. `met` refleja el encuentro guardado. Acciones: `meet`, `pet`, `feed`, `gift`,
`game`, `room`, `object`, `drawing`, `noise`, `comfort`, `compliment`, `quiet`, `wall`,
`reunion`, `hum`, `idle`. La UI y el motor controlan cuándo corresponden.

Datos propios: `mkw:lumo:v2`; migración filtrada de `mkw:lumo:v1`. Memorias tienen esquema 2;
al cargar el esquema 1 se conservan sus IDs permitidos y se reconstruyen los datos nuevos.
Las preferencias se guardan por separado en `mkw:lumo:settings:v1`; desactivar persistencia
borra las dos claves de recuerdos y permanece desactivado al volver a abrir el juego. No toca
los guardados de PC/FNF. Un guardado de una versión futura desconocida no se sobrescribe.
`resetHistory()` borra conversación reciente y preferencias narrativas extraídas del chat;
conserva regalos, dibujos y experiencias del motor.

La ventana de ocho entradas del chat vive solo en memoria. Los recuerdos persistentes son
IDs de experiencias y preferencias inocuas del juego (arañas, bromas sobre la estatura,
color favorito y actividad favorita, con enumeraciones cerradas),
sin transcripciones, nombres reales ni biografía privada. Un resumen factual se reconstruye
cada doce conversaciones, a partir de estos IDs y los eventos validados. Se recuperan recuerdos
por tema y se registran menciones con una pausa de dieciséis turnos para evitar insistencia.
Los ejemplos raros aprobados son locales, se registran una sola vez y tienen puertas de
experiencias, conversaciones y tiempo. El episodio del ramo sigue bloqueado sin confirmación
del creador. Un tarareo desconocido se registra sin explicar su procedencia.

Amistad: acciones y experiencias distintas otorgan afinidad una sola vez; repetir mensajes,
caricias, juegos o regalos no permite acumular puntos infinitos. Etapas provisionales de HOME:
DESCONOCIDOS, COMPANEROS (3), AMIGOS (12), MEJORES_AMIGOS (24); no cambia la progresión principal
ni penaliza pausas o ausencias. La intervención automática configurable es gestionada por el motor.

El proveedor recibe el mensaje actual, contexto compacto y hasta seis entradas recientes cuando
se usa IA. No se guarda un historial en el servidor; la política de retención del proveedor se
debe revisar antes de publicar. El borrado local no elimina datos que el proveedor ya haya recibido.

## Límites y verificación

Por defecto: ocho solicitudes pagadas por minuto, 120 por día UTC, dos simultáneas, once segundos
de espera y 220 tokens de salida. No hay reintentos automáticos. Estos límites son globales
por proceso y se reinician al reiniciar el servidor. Configurar además presupuesto y alertas
del proveedor; los límites de solicitudes no equivalen a un límite monetario persistente.

El formato utiliza `max_completion_tokens`, `store: false`, `stream: false` y modo JSON.
Para proveedores antiguos se permiten `max_tokens` y desactivar modo JSON. Un modelo de
razonamiento puede necesitar ajustar su límite de salida; las respuestas incompletas pasan a local.
Referencia verificada: [Chat Completions, documentación oficial](https://developers.openai.com/api/reference/resources/chat).

Pruebas reproducibles desde la raíz del proyecto (ejecutadas con Node 24.19.0):

```powershell
node --test --test-isolation=none tests/lumo-mind.test.cjs tests/lumo-backend.test.cjs tests/lumo-integration.test.cjs tests/lumo-actor.test.cjs
```

36 pruebas, más los casos del actor agrupados en su archivo, incluyen persistencia/migración/privacidad, 1.800 turnos locales adversos, recuerdos
de preferencias después de otros 1.000 turnos y recarga, reconstrucción de 2.000 contextos
hostiles, configuración HTTPS remota, CORS y referencias con pausas, identidad, canon, validación del proveedor
simulado, límites, claves protegidas, orígenes, cancelación, espera y rangos estáticos.
El proveedor se simula en las pruebas: una conversación real requiere credenciales y un modelo;
no se afirma haberla probado sin ellos.
