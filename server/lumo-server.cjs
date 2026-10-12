/* Local HOME preview and configurable chat backend. Node 22+; no packages. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fallback, policy } = require('./lumo-home.cjs');
const { configFromEnv, complete } = require('./lumo-provider.cjs');
const { createSessions } = require('./lumo-sessions.cjs');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.wasm': 'application/wasm', '.woff2': 'font/woff2' };
function createLumoServer(options = {}) {
  const config = options.config || configFromEnv();
  const root = fs.realpathSync(options.root || path.join(__dirname, '..'));
  let minute = 0, minuteCount = 0, day = 0, dayCount = 0, active = 0, bootstrapMinute = 0, bootstrapCount = 0;
  const totals = {providerRequests:0,providerFailures:0,localResponses:0};
  const now = options.now || Date.now;
  const sessions = createSessions(config, now);
  function send(res, status, body, headers = {}) {
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
    res.end(JSON.stringify(body));
  }
  const server = http.createServer(async (req, res) => {
    const port = server.address().port;
    const hosts = ['127.0.0.1:' + port, 'localhost:' + port];
    if (config.publicOrigin) hosts.push(new URL(config.publicOrigin).host);
    if (!hosts.includes(req.headers.host)) return send(res, 403, { error: 'Host not allowed' });
    let url;
    try { url = new URL(req.url, 'http://127.0.0.1:' + port); } catch (_) { return send(res, 400, { error: 'Invalid URL' }); }
    if (url.pathname === '/api/ready') {
      const origin = req.headers.origin;
      const allowedOrigins = ['http://127.0.0.1:' + port, 'http://localhost:' + port, ...(config.allowedOrigins || []), ...(config.publicOrigin ? [config.publicOrigin] : [])];
      if (origin !== undefined && !allowedOrigins.includes(origin)) return send(res, 403, { error: 'Origin not allowed' });
      if (origin !== undefined) res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      if (req.method !== 'GET') return send(res, 405, { error: 'Use GET' }, { Allow: 'GET' });
      // Readiness is public and read-only: no session, cookie, paid call or private configuration.
      return send(res, 200, { ready: true, providerReady: Boolean(config.enabled && config.apiKey && config.model) });
    }
    if (['/api/chat','/api/ryon/chat','/api/session','/api/session/consent','/api/session/clear'].includes(url.pathname)) {
      const origin = req.headers.origin;
      const localOrigins = ['http://127.0.0.1:' + port, 'http://localhost:' + port];
      const allowedOrigins = [...localOrigins, ...(config.allowedOrigins || []), ...(config.publicOrigin ? [config.publicOrigin] : [])];
      if (!origin || !allowedOrigins.includes(origin)) return send(res, 403, { error: 'Origin not allowed' });
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
      if (req.method === 'OPTIONS') {
        const method = req.headers['access-control-request-method'];
        const headers = (req.headers['access-control-request-headers'] || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
        if (method !== 'POST' || headers.some(x => !['content-type','x-csrf-token'].includes(x))) return send(res, 403, { error: 'Preflight not allowed' });
        res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token', 'Access-Control-Max-Age': '600' }); res.end(); return;
      }
      if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' }, { Allow: 'POST' });
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Use application/json' });
      let body;
      try {
        let size = 0; const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 8192) { send(res, 413, { error: 'Message too large' }); return; }
          chunks.push(chunk);
        }
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch (_) { return send(res, 400, { error: 'Invalid JSON' }); }
      if (!body || typeof body !== 'object' || Array.isArray(body) || body.sessionId != null || body.session != null || body.userId != null || body.history != null) return send(res, 400, {error:'Invalid session data'});
      if (url.pathname === '/api/session') {
        const current = Math.floor(now()/60000); if (bootstrapMinute !== current) {bootstrapMinute=current;bootstrapCount=0;}
        if (!sessions.get(req) && ++bootstrapCount > 40) return send(res,429,{error:'Session limit'},{'Retry-After':'60'});
        const session = sessions.issue(req); if (!session) return send(res,503,{error:'Session capacity'});
        return send(res,200,{csrfToken:session.csrf,expiresIn:Math.max(0,Math.floor((session.expiresAt-now())/1000)),consent:session.consent},{'Set-Cookie':sessions.cookie(session.id)});
      }
      const session = sessions.get(req);
      if (!session) return send(res,401,{error:'Session unavailable; cookies may be blocked'});
      if (!sessions.csrf(req,session)) return send(res,403,{error:'CSRF token not allowed'});
      if (url.pathname === '/api/session/consent') {
        if (typeof body.consent !== 'boolean') return send(res,400,{error:'Invalid consent'});
        session.consent=body.consent; if (!body.consent) sessions.clear(session,'history');
        return send(res,200,{consent:session.consent});
      }
      if (url.pathname === '/api/session/clear') {
        if (!['history','personal','all'].includes(body.scope)) return send(res,400,{error:'Invalid clear scope'});
        sessions.clear(session,body.scope); return send(res,200,{cleared:body.scope},body.scope === 'all' ? {'Set-Cookie':sessions.cookie('',true)} : {});
      }
      if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 800 || typeof body.requestId !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(body.requestId)) return send(res,400,{error:'Invalid dialogue'});
      if (!session.consent) return send(res,403,{error:'AI consent required'});
      const character = url.pathname === '/api/ryon/chat' ? 'ryon' : 'lumo';
      const requestId = character + ':' + body.requestId;
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify({message:body.message,context:body.context})).digest('hex');
      const reservation = sessions.reserve(session,requestId,fingerprint);
      if (reservation.cached) return send(res,reservation.cached.status,reservation.cached.result);
      if (reservation.conflict) return send(res,409,{error:'Request already pending or identifier reused'});
      body = sessions.prepare(session,character,policy.redact(body.message),body.context);
      function local(result,status=200) {sessions.finish(session,character,body,result);sessions.cache(session,requestId,fingerprint,result,status);totals.localResponses++;return send(res,status,result);}
      const special = policy.specialReply(body.message,body.context.serious,character);
      if (special) return local({...special,reason:'home_guard'});
      if (!config.enabled || !config.apiKey || !config.model) return local(fallback(body.message,body.context,'not_configured'));
      const currentMinute = Math.floor(now() / 60000), currentDay = Math.floor(now() / 86400000);
      if (minute !== currentMinute) { minute = currentMinute; minuteCount = 0; }
      if (day !== currentDay) { day = currentDay; dayCount = 0; }
      // Global limits bound the provider budget even when browser/session identity is changed.
      if (minuteCount >= config.maxPerMinute || dayCount >= config.maxPerDay || active >= config.maxConcurrency || !sessions.rate(session)) return send(res, 429, fallback(body.message, body.context, 'rate_limit'), { 'Retry-After': '60' });
      minuteCount++; dayCount++; active++;
      totals.providerRequests++;
      const controller = new AbortController();
      const revision = session.revision; session.active={controller,requestId};
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      const cancel = () => { if (!res.writableEnded) controller.abort(); };
      res.on('close', cancel);
      try {
        const result = await complete(body, config, { signal: controller.signal, fetchImpl: options.fetchImpl || fetch });
        if (controller.signal.aborted || session.revision !== revision) throw new Error('Cancelled');
        sessions.finish(session,character,body,result);sessions.cache(session,requestId,fingerprint,result,200);send(res,200,result);
      } catch (_) {
        totals.providerFailures++;
        const result=fallback(body.message,body.context,controller.signal.aborted ? 'timeout' : 'provider_error');
        if (session.revision === revision) {sessions.cache(session,requestId,fingerprint,result,200);sessions.finish(session,character,body,result);}
        send(res,200,result);
      }
      finally { clearTimeout(timer); res.removeListener('close', cancel); if (session.active && session.active.controller === controller) session.active=null; active--; }
      return;
    }
    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'Unknown endpoint' });
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'Use GET' });
    let decoded, target;
    try {
      decoded = decodeURIComponent(url.pathname);
      const segments = decoded.split(/[\\/]+/);
      if (segments.some(x => x.startsWith('.') || ['server', 'node_modules', 'logs'].includes(x.toLowerCase())) || /\.(?:cjs|env|toml|pem|key|map|md|log|bak)$/i.test(decoded)) return send(res, 404, { error: 'Not found' });
      target = fs.realpathSync(path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded)));
      if (!target.startsWith(root + path.sep)) return send(res, 403, { error: 'Forbidden' });
      const stat = fs.statSync(target);
      if (!stat.isFile()) return send(res, 404, { error: 'Not found' });
      const headers = { 'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
      let start = 0, end = stat.size - 1, status = 200;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size }); res.end(); return; }
        start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(end, Number(match[2])) : end;
        if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size }); res.end(); return; }
        status = 206; headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
      }
      headers['Content-Length'] = status === 206 ? end - start + 1 : stat.size;
      res.writeHead(status, headers);
      if (req.method === 'HEAD' || stat.size === 0) res.end();
      else { const stream = fs.createReadStream(target, { start, end }); stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res); }
    } catch (_) { send(res, 404, { error: 'Not found' }); }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 32;
  server.on('close',()=>sessions.close());
  // Server-side creator diagnostics only; no route exposes conversations or keys.
  server.lumoStats=()=>({...totals,...sessions.stats(),activeRequests:active});
  return server;
}
if (require.main === module) {
  const port = Math.max(1024, Math.min(65535, Number(process.env.LUMO_PORT) || 8787));
  const config = configFromEnv(), server = createLumoServer({ config });
  const bindHost = process.env.LUMO_BIND_HOST === '0.0.0.0' && config.publicOrigin ? '0.0.0.0' : '127.0.0.1';
  server.listen(port, bindHost, () => console.log('HOME + Lumo: http://127.0.0.1:' + port + '\n' + (config.enabled && config.apiKey && config.model ? 'Proveedor configurado; conexión real pendiente de verificar.' : 'Modo local; IA requiere habilitación, modelo y clave de servidor.')));
  server.on('error', error => console.error('No se pudo iniciar el servidor: ' + error.code));
}
module.exports = { createLumoServer };
