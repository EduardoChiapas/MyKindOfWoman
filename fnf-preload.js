/* Fetch files while visiting the house; never start a hidden game/audio context. */
(() => {
  'use strict';
  const root = new URL('fnf-original/', document.currentScript.src);
  let registrationPromise, running = false, gameActive = false;
  let state = {phase:'waiting', bytes:0, totalBytes:0, completed:0, total:0, cachedBytes:0, downloadedBytes:0};
  let doneTimer, publishTimer, enteredHouse = false, indicatorFinished = false;
  const indicator = document.createElement('div');
  indicator.id = 'fnf-download-indicator';
  indicator.hidden = true;
  indicator.setAttribute('role','progressbar');
  indicator.setAttribute('aria-label','Descargando FNF en segundo plano');
  indicator.setAttribute('aria-valuemin','0'); indicator.setAttribute('aria-valuemax','100');
  indicator.innerHTML = `<style>
    #fnf-download-indicator{position:fixed;bottom:max(10px,env(safe-area-inset-bottom));right:max(10px,env(safe-area-inset-right));z-index:1010;width:22px;height:22px;padding:2px;border-radius:50%;background:#080e17a8;color:#b5e7ff;pointer-events:none}
    #fnf-download-indicator[hidden]{display:none!important}#fnf-download-indicator svg{display:block;width:18px;height:18px}
    #fnf-download-indicator .ring{transition:stroke-dashoffset .3s linear}#fnf-download-indicator .done{display:none}
    #fnf-download-indicator[data-ready] {color:#85e9b4}#fnf-download-indicator[data-ready] .arrow{display:none}#fnf-download-indicator[data-ready] .done{display:block}
    @media(prefers-reduced-motion:reduce){#fnf-download-indicator .ring{transition:none}}
  </style><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="#ccefff30" stroke-width="1.4"/><circle class="ring" cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="50.27" stroke-dashoffset="50.27" transform="rotate(-90 10 10)"/><path class="arrow" d="M10 5.5v7m-3-3 3 3 3-3M7 15h6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path class="done" d="m6 10 2.5 2.5 5-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  document.body.append(indicator);
  function updateIndicator() {
    const percent = state.totalBytes ? Math.floor(state.bytes / state.totalBytes * 100) : 0;
    indicator.setAttribute('aria-valuenow',String(percent));
    indicator.setAttribute('aria-label',state.phase === 'ready' ? 'FNF descargado' : 'Descargando FNF en segundo plano');
    indicator.title = state.phase === 'ready' ? 'FNF descargado' : `Descargando FNF en segundo plano · ${percent}%`;
    indicator.querySelector('.ring').style.strokeDashoffset = String(50.27 * (1 - percent / 100));
    if (gameActive || !enteredHouse || !['downloading','ready'].includes(state.phase) || (state.phase === 'ready' && indicatorFinished)) { indicator.hidden = true; return; }
    indicator.hidden = false;
    indicator.toggleAttribute('data-ready',state.phase === 'ready');
    if (state.phase === 'ready' && !doneTimer) doneTimer = setTimeout(() => {indicatorFinished = true; indicator.hidden = true;}, 2500);
  }
  const snapshot = () => ({...state});
  const publish = () => {
    // Avoid hundreds of DOM updates while the player is walking.
    if (publishTimer) return;
    publishTimer = setTimeout(() => {publishTimer = null; updateIndicator(); window.dispatchEvent(new CustomEvent('fnf:preload', {detail:snapshot()}));}, 250);
  };

  async function prepare() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
    if (!registrationPromise) registrationPromise = (async () => {
      try {
        const registration = await navigator.serviceWorker.register(new URL('fnf-cache-worker.js', root), {scope:root.pathname, updateViaCache:'none'});
        const worker = registration.installing || registration.waiting;
        // Await a pending update so the iframe uses the current engine and mods.
        if (!worker) return registration.active ? registration : null;
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

  let enabled=false;
  async function start() {
    if (!enabled || running) return;
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
      // One background download at a time keeps house input/rendering first.
      await work();
      if (!halted) { state.phase = 'ready'; publish(); }
    } catch { state.phase = 'paused'; publish(); }
    finally { running = false; }
  }

  window.FnfPreload = Object.freeze({prepare, start, enable(){enabled=true;enteredHouse=true;start();}, getState:snapshot, setGameActive(value){gameActive=Boolean(value); updateIndicator();}});
  const schedule = () => {
    // Give the first house frames and its audio time to start before fetching FNF.
    setTimeout(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(() => start(), {timeout:2500});
      else start();
    }, 2500);
  };
  const house = document.getElementById('game-container');
  if (house) {
    // Observe the existing entry UI; do not alter rooms or the house game loop.
    const observer = new MutationObserver(() => {
      if (house.style.display !== 'grid') return;
      enteredHouse = true; observer.disconnect();
    });
    if (house.style.display === 'grid') { enteredHouse = true; }
    else observer.observe(house, {attributes:true, attributeFilter:['style']});
  }
  window.addEventListener('online', () => { if (state.phase === 'paused') start(); });
})();
