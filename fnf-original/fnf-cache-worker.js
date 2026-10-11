/* Download/cache only. The original FNF engine runs exclusively in its visible iframe. */
'use strict';
importScripts('./fnf-cache-manifest.js');
const manifest = self.FNF_CACHE_MANIFEST;
const root = new URL('./', self.location.href);
const cacheName = 'fnf-files-v1-' + encodeURIComponent(root.pathname);
const inFlight = new Map();
const warmFiles = new Set(manifest.warm);
const keyFor = path => new Request(new URL(path + '?__fnf_revision=' + manifest.files[path][0], root));

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Keep unchanged files across releases; remove only obsolete revisions of
  // this game's cache, never the site's storage or another application's cache.
  try {
    const cache = await caches.open(cacheName);
    const current = new Set(Object.keys(manifest.files).map(path => keyFor(path).url));
    await Promise.all((await cache.keys()).filter(key => !current.has(key.url)).map(key => cache.delete(key)));
  } catch { /* Storage unavailable: normal network loading remains possible. */ }
  await self.clients.claim();
})()));

async function acquire(path) {
  if (inFlight.has(path)) return inFlight.get(path);
  const task = (async () => {
    const key = keyFor(path);
    let cache;
    try {
      cache = await caches.open(cacheName);
      const saved = await cache.match(key);
      if (saved) return {response:saved, stored:true, source:'cache'};
    } catch { /* Storage restrictions must never stop the original game. */ }
    const url = new URL(path, root);
    url.searchParams.set('fnf_revision', manifest.files[path][0]);
    const response = await fetch(url, {cache:'no-cache'});
    if (!response.ok) throw new Error('No se pudo descargar ' + path + ' (' + response.status + ')');
    let stored = false;
    if (cache) {
      try { await cache.put(key, response.clone()); stored = true; }
      catch { /* Full storage: deliver the network response and pause warmup. */ }
    }
    return {response, stored, source:'network'};
  })();
  inFlight.set(path, task);
  try { return await task; }
  finally { if (inFlight.get(path) === task) inFlight.delete(path); }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.headers.has('range') || url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return;
  const path = decodeURIComponent(url.pathname.slice(root.pathname.length));
  if (!Object.hasOwn(manifest.files, path)) return;
  event.respondWith(acquire(path).then(result => result.response.clone()).catch(() => fetch(event.request)));
});

self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port || event.data?.type !== 'fnf:cache') return;
  const path = event.data.path;
  if (!warmFiles.has(path)) { port.postMessage({ok:false}); return; }
  event.waitUntil(acquire(path).then(result => {
    port.postMessage({ok:true, stored:result.stored, source:result.source, bytes:manifest.files[path][1]});
  }).catch(error => port.postMessage({ok:false, message:String(error.message)})));
});
