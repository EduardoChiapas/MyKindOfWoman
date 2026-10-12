# Servidor HOME: Lumo y Ryon

Node 22+ sin dependencias. Desde outputs/pc-room ejecutar:

```powershell
node --env-file=.env server/lumo-server.cjs
```

Crear .env privado a partir de .env.example. Por defecto IA está desactivada y no hay
modelo predeterminado. Configurar AI_ENABLED=true, AI_PROVIDER=gemini, GEMINI_API_KEY y
GEMINI_MODEL con un modelo disponible en el proyecto. Gemini usa REST nativo generateContent,
x-goog-api-key, systemInstruction, historial user/model y JSON con esquema.
GOOGLE_GEMINI_API_KEY es alias. El adaptador openai-compatible usa LUMO_API_KEY,
LUMO_MODEL, LUMO_API_BASE_URL y Chat Completions.

Sin credenciales/modelo/habilitación devuelve source:local y motivo not_configured.
source:ai exige respuesta real del proveedor y validación: 8–45 palabras, emociones/animaciones
enumeradas, referencias conocidas y narrative_intent:null. El modelo no gobierna puertas,
inventario o capítulos. Toda la entrada al sótano está cerrada en HOME.

## Contrato y sesión

| Ruta POST | Cuerpo | Requisito |
|---|---|---|
| /api/session | {} | Origin exacto; emite cookie y token CSRF. |
| /api/session/consent | {consent:true/false} | Cookie y X-CSRF-Token. |
| /api/chat | {requestId,message,context} | Consentimiento; conversación Lumo. |
| /api/ryon/chat | Igual | Ryon independiente. |
| /api/session/clear | {scope:history/personal/all} | Borra solo la sesión propietaria. |

No acepta sessionId, userId, historial ni instrucciones de sesión en el cuerpo.
Sesión/CSRF aleatorios de 256 bits; HttpOnly y TTL absoluto. Producción HTTPS: cookie
__Host-, Secure y SameSite=None; local: SameSite=Strict. Fetch credentials:include.
CORS permite orígenes HTTPS exactos de LUMO_ALLOWED_ORIGINS, sin wildcard; mutaciones
requieren Origin exacto y CSRF. El bootstrap sin cookie emite una sesión nueva.

Cada sesión separa Lumo/Ryon: ocho entradas recientes, 32 recuerdos por IDs/enums, 80
eventos reportados, cooldown y resumen factual cada 12 turnos. El canon HOME se reconstruye
cada petición sin importar biblias privadas ni secretos futuros. Datos del motor local se
etiquetan como reportados; el navegador no es autoridad de progreso contra manipulación.

Límites por defecto: por sesión 4 solicitudes pagadas/min y 40/día; globales 8/min, 120/día
UTC y 4 simultáneas. Una activa por sesión ordena ambos personajes. Cache de 16 IDs/respuestas
evita pagos duplicados; otro cuerpo con igual ID se rechaza. Máximo 100 sesiones y 40 altas/min,
TTL 2 horas, timeout 14 s y 600 tokens configurables. No reintentos pagados automáticos.
Contadores en RAM se reinician con proceso: configurar también cuotas en proveedor.
No es una defensa completa contra bots.

## GitHub Pages y privacidad

Pages aloja frontend, nunca este servidor. Requiere backend HTTPS separado, endpoint público
preconfigurado en lumo-config.js, LUMO_PUBLIC_ORIGIN y LUMO_ALLOWED_ORIGINS. Ninguna clave
en frontend. El proxy debe preservar host/origin y no registrar cuerpos. Cookies de terceros
pueden bloquearse: se usa respaldo local, sin sustituirlas por IDs inventados.

La UI activa automáticamente la conexión al conversar, sin botones de autorización o desconexión. El mecanismo interno de revocación cancela peticiones y borra reciente;
borrar personal conserva eventos/regalos; all destruye sesión. Se envían mensaje actual,
últimos seis mensajes, perfil HOME y hechos relevantes. No se registran textos ni hay panel
para leer chats. Servidor conserva solo RAM hasta TTL/reinicio; navegador puede conservar
hechos seleccionados. Un perfil de navegador comparte guardado: usar perfiles distintos
para personas distintas. Borrar aquí no retira datos ya enviados al proveedor.

Consultar [términos Gemini](https://ai.google.dev/gemini-api/terms) antes de publicar;
no prometer privacidad absoluta ni asumir que el nivel gratuito es privado.

## Verificación

Desde la raíz del proyecto:
```powershell
node --test --test-isolation=none outputs/pc-room/tests/lumo-mind.test.cjs outputs/pc-room/tests/lumo-backend.test.cjs
```

Desde outputs/pc-room:
```powershell
node --env-file=.env server/lumo-check.cjs --live
```

La segunda orden prueba dos mensajes sintéticos privados del creador. No lee chats de
jugadoras ni crea rutas administrativas. Informa estado y contadores agregados.
IA real pendiente sin credenciales; pruebas actuales usan mocks.

Fuentes oficiales verificadas: [generateContent](https://ai.google.dev/api/generate-content),
[JSON estructurado](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).
Modelo/presupuesto dependen del proyecto; truncados se rechazan.
