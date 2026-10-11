/* Fetch files while visiting the house; never start a hidden game/audio context. */
(() => {
  'use strict';
  const root = new URL('fnf-original/', document.currentScript.src);
  let registrationPromise, running = false, gameActive = false;
  let state = {phase:'waiting', bytes:0, totalBytes:0, completed:0, total:0, cachedBytes:0, downloadedBytes:0};
  const snapshot = () => ({...state});
  const publish = () => window.dispatchEvent(new CustomEvent('fnf:preload', {detail:snapshot()}));

  async function prepare() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
    if (!registrationPromise) registrationPromise = (async () => {
      try {
        const registration = await navigator.serviceWorker.register(new URL('fnf-cache-worker.js', root), {scope:root.pathname, updateViaCache:'none'});
        if (registration.active) return registration;
        const worker = registration.installing || registration.waiting;
        if (!worker) return null;
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('activation timeout')), 15000);
          const check = () => {
            if (worker.state === 'activated') { clearTimeout(timeout); resolve(); }
            else if (worker.state === 'redundant') { clearTimeout(timeout); reject(new Error('activation failed')); }
          };
          worker.addEventListener('statechange', check); check();
        });
        return registration;
      } catch { return null; }
    })();
    return registrationPromise;
  }

  function download(worker, path) {
    return new Promise(resolve => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); resolve({ok:false}); }, 600000);
      channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); resolve(event.data); };
      worker.postMessage({type:'fnf:cache', path}, [channel.port2]);
    });
  }

  async function start() {
    if (running) return;
    running = true;
    const registration = await prepare();
    if (!registration?.active) { state.phase = 'unavailable'; publish(); running = false; return; }
    try {
      const response = await fetch(new URL('fnf-cache-manifest.json', root), {cache:'no-cache'});
      if (!response.ok) throw new Error('manifest unavailable');
      const manifest = await response.json();
      state = {phase:'downloading', bytes:0, totalBytes:manifest.totalBytes, completed:0, total:manifest.warm.length, cachedBytes:0, downloadedBytes:0}; publish();
      let next = 0, halted = false;
      const work = async () => {
        while (!halted && next < manifest.warm.length) {
          // Once playing, foreground engine requests have all available bandwidth.
          if (gameActive) { await new Promise(resolve => setTimeout(resolve, 1000)); continue; }
          const path = manifest.warm[next++];
          const result = await download(registration.active, path);
          if (!result.ok || !result.stored) { halted = true; state.phase = 'paused'; publish(); break; }
          state.bytes += result.bytes;
          state[result.source === 'cache' ? 'cachedBytes' : 'downloadedBytes'] += result.bytes;
          state.completed++; publish();
        }
      };
      await Promise.all([work(),work(),work()]);
      if (!halted) { state.phase = 'ready'; publish(); }
    } catch { state.phase = 'paused'; publish(); }
    finally { running = false; }
  }

  window.FnfPreload = Object.freeze({prepare, start, getState:snapshot, setGameActive(value){gameActive=Boolean(value);}});
  const schedule = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => start(), {timeout:2500});
    else setTimeout(() => start(), 1500);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, {once:true});
  window.addEventListener('online', () => { if (state.phase === 'paused') start(); });
})();
