/* Public deployment settings. Never put a provider key or private token here.
   GitHub Pages requires a separate HTTPS backend. After deploying that backend,
   set endpoint to its exact URL, e.g. 'https://your-backend.example/api/chat',
   and allow your Pages origin in its LUMO_ALLOWED_ORIGINS server environment.
   null uses the same-origin /api/chat for the local Node preview. */
window.LUMO_CONFIG = Object.freeze({ endpoint: null });
