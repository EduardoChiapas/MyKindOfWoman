/* Hosts the compiled original game. No menus, charts, or gameplay are reimplemented here. */
(() => {
  'use strict';
  const ENTRY = 'fnf-original/index.html?v=home-pc-monitor-20261014';

  class FnfOriginalHost extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode:'open'});
      this._iframe = null;
      this._state = 'idle';
      this._volume = 1;
      this._token = 0;
      this._controller = null;
      this._origin = location.origin;
      this._onMessage = event => this._receive(event);
      this._touchPointers = new Map();
      this._menuTouches = new Map();
      this._menuKeyTimers = new Map();
      this._touchOverride = null;
      this._controlsMode = 'menu';
      this._touchMedia = matchMedia('(any-pointer: coarse)');
      this._onTouchMedia = () => this._updateTouchControls();
      this._onVisibility = () => { if (document.hidden) this._releaseTouches(); };
      this._onPageHide = () => this._releaseTouches();
      this._onBlur = () => {
        // Focusing our own game iframe must not cancel a held touch.
        if (document.activeElement !== this._iframe || !document.hasFocus()) this._releaseTouches();
      };
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;position:relative;width:100%;height:100%;min-height:0;background:#000;color:#fff;font:13px 'Segoe UI',system-ui,sans-serif;color-scheme:dark}
        *{box-sizing:border-box}[hidden]{display:none!important}.native-stage{position:absolute;inset:0;background:#000}
        iframe{display:block;position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
        .return{position:absolute;left:max(8px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));z-index:5;min-width:44px;min-height:34px;color:#edf6ff;background:#101620c9;border:1px solid #e5f2ff35;border-radius:7px;padding:6px 9px;font:11px 'Segoe UI',system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 12px #0007;backdrop-filter:blur(9px)}
        .return:hover{background:#293749ed}.return:focus-visible{outline:2px solid #90e1ff;outline-offset:3px}
        .loading{position:absolute;inset:0;z-index:2;background:#080b13;display:flex;align-items:center;justify-content:center;text-align:center;padding:35px;color:#d6e4f5;font-size:13px;line-height:1.7}
        .loading-content{max-width:430px}.loading strong{display:block;font-size:15px;font-weight:500;margin-bottom:5px}.spinner{display:block;margin:0 auto 19px;width:22px;height:22px;border:2px solid #a1dfff25;border-top-color:#a1dfff;border-radius:50%;animation:spin .9s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.spinner{animation:none;border-color:#a1dfff55}}
        @media(max-width:650px){.return{font-size:9px;padding:6px 8px;left:6px;top:6px}.loading{font-size:11px}}
        .touch-controls{position:absolute;inset:0;z-index:3;pointer-events:none;user-select:none;-webkit-user-select:none}
        .touch-zones{position:absolute;inset:0;display:grid;grid-template-columns:repeat(4,1fr);gap:0;pointer-events:auto;touch-action:none}
        .touch-zone{position:relative;background:transparent;touch-action:none;-webkit-tap-highlight-color:transparent}
      </style><div class="native-stage"></div><div class="loading" hidden><div class="loading-content"><i class="spinner" aria-hidden="true"></i><strong>Abriendo Friday Night Funkin’</strong><span class="loading-text">Cargando el juego original…</span></div></div><button class="return" type="button">← Volver al escritorio</button>`;
      this.shadowRoot.querySelector('.return').addEventListener('click', () => this._emit('fnf-original:exit'));
      const controls = document.createElement('div');
      controls.className = 'touch-controls';controls.hidden = true;controls.dataset.mode = 'menu';
      controls.innerHTML = `<div class="touch-zones" aria-hidden="true">${['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'].map(key=>`<div class="touch-zone" data-key="${key}"></div>`).join('')}</div>`;
      this.shadowRoot.append(controls);
      this._touchControls = controls;
      for (const button of controls.querySelectorAll('.touch-zone[data-key]')) {
        button.addEventListener('pointerdown', event => {
          if (event.button !== 0 || controls.hidden) return;
          event.preventDefault();
          this._iframe?.focus({preventScroll:true});
          this._iframe?.contentWindow?.focus();
          try { button.setPointerCapture(event.pointerId); } catch {}
          if (this._controlsMode === 'play') this._holdTouch(event.pointerId, button.dataset.key);
          else {
            const gesture = {x:event.clientX,y:event.clientY,back:this._menuTouches.size > 0};
            if (gesture.back) for (const active of this._menuTouches.values()) active.back = true;
            this._menuTouches.set(event.pointerId,gesture);
          }
        });
        button.addEventListener('pointermove', event => {
          if (!this._touchPointers.has(event.pointerId) || !button.classList.contains('touch-zone')) return;
          const rect = controls.querySelector('.touch-zones').getBoundingClientRect();
          const lane = event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY > rect.bottom ? -1 : Math.floor((event.clientX-rect.left)/rect.width*4);
          this._holdTouch(event.pointerId, ['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'][lane] || null,true);
        });
        for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,event => {
          if (type === 'pointerup') {
            event.preventDefault();
            this._iframe?.focus({preventScroll:true});
            this._iframe?.contentWindow?.focus();
          }
          const gesture = this._menuTouches.get(event.pointerId);
          this._menuTouches.delete(event.pointerId);
          if (gesture && type === 'pointerup') {
            if (gesture.back) { if (!this._menuTouches.size) this._tapMenuKey('Escape'); }
            else this._tapMenuKey(this._menuGestureKey(gesture,event));
          }
          this._holdTouch(event.pointerId,null);
        });
        button.addEventListener('contextmenu', event => event.preventDefault());
      }
    }

    connectedCallback() {
      window.addEventListener('message',this._onMessage);
      window.addEventListener('blur',this._onBlur);
      window.addEventListener('pagehide',this._onPageHide);
      document.addEventListener('visibilitychange',this._onVisibility);
      this._touchMedia.addEventListener('change',this._onTouchMedia);
    }
    disconnectedCallback() {
      window.removeEventListener('message',this._onMessage);
      window.removeEventListener('blur',this._onBlur);
      window.removeEventListener('pagehide',this._onPageHide);
      document.removeEventListener('visibilitychange',this._onVisibility);
      this._touchMedia.removeEventListener('change',this._onTouchMedia);
      this.stop();
    }

    get iframe() { return this._iframe; }
    get mode() { return this._state; }

    getState() {
      return {mode:this._state,original:true,source:ENTRY,iframeAttached:Boolean(this._iframe?.isConnected),volume:this._volume};
    }

    setVolume(value) {
      const volume = Number(value);
      this._volume = Number.isFinite(volume) ? Math.max(0,Math.min(1,volume)) : 1;
      this._sendVolume();
    }

    async start() {
      this.stop();
      const token = ++this._token;
      const loading = this.shadowRoot.querySelector('.loading');
      loading.hidden = false;
      this.shadowRoot.querySelector('.loading-text').textContent = 'Cargando el juego original…';
      this._state = 'loading';
      this._controller = new AbortController();
      try {
        if (!['http:','https:'].includes(location.protocol)) {
          throw new Error('Abre esta web mediante un servidor local para cargar el juego original.');
        }
        const url = new URL(ENTRY, document.baseURI);
        if (url.origin !== location.origin) throw new Error('El juego original debe estar alojado junto a esta web.');
        this._origin = url.origin;
        // Establish the FNF-only cache scope before navigating the real engine.
        // Downloads continue without blocking on the full warmup queue.
        await window.FnfPreload?.prepare();
        if (token !== this._token) return this.getState();
        window.FnfPreload?.setGameActive(true);
        const response = await fetch(url.href,{cache:'no-cache',signal:this._controller.signal});
        if (!response.ok) throw new Error('Falta el juego original compilado en fnf-original/index.html.');
        const html = await response.text();
        if (!/Funkin\.js|lime\.embed/i.test(html)) {
          throw new Error('La carpeta fnf-original todavía no contiene la compilación web original.');
        }
        if (token !== this._token) return this.getState();
        const iframe = document.createElement('iframe');
        iframe.title = 'Friday Night Funkin’ · juego original';
        iframe.allow = 'autoplay; fullscreen; gamepad';
        iframe.allowFullscreen = true;
        iframe.tabIndex = 0;
        iframe.src = url.href;
        this._iframe = iframe;
        iframe.addEventListener('load', () => {
          if (this._iframe !== iframe || token !== this._token) return;
          if (this._state !== 'ready') this._state = 'loaded';
          // The original engine owns its preloader and menus from here onward.
          loading.hidden = true;
          this._sendVolume();
          iframe.focus({preventScroll:true});
        });
        iframe.addEventListener('error', () => {
          if (this._iframe === iframe && token === this._token) this._fail('No se pudo abrir la compilación original de FNF.');
        });
        this.shadowRoot.querySelector('.native-stage').append(iframe);
        return this.getState();
      } catch(error) {
        if (token !== this._token || error.name === 'AbortError') return this.getState();
        const message = error instanceof Error ? error.message : 'No se pudo cargar el juego original.';
        this._fail(message);
        throw error;
      }
    }

    stop() {
      this._releaseTouches();
      ++this._token;
      this._controller?.abort();
      this._controller = null;
      window.FnfPreload?.setGameActive(false);
      // Removing the entire native document tears down its audio context,
      // timers and engine. No hidden game continues playing behind the desk.
      this._iframe?.remove();
      this._iframe = null;
      this._state = 'idle';
      this._controlsMode = 'menu';
      this._updateTouchControls();
      this.shadowRoot.querySelector('.loading').hidden = true;
    }

    _sendVolume() {
      if (!this._iframe?.contentWindow || this._origin === 'null') return;
      this._iframe.contentWindow.postMessage({type:'fnf-original:volume',volume:this._volume},this._origin);
    }

    _receive(event) {
      // Source identity is checked as well as origin: another same-origin
      // frame or a top-level synthetic message cannot grant a victory.
      if (!this._iframe || event.source !== this._iframe.contentWindow || event.origin !== this._origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
      if (data.type === 'fnf-original:ready') {
        this._state = 'ready';
        this._updateTouchControls();
        this.shadowRoot.querySelector('.loading').hidden = true;
        this._sendVolume();
        this._iframe.focus({preventScroll:true});
        this._emit('fnf-original:ready');
      } else if (data.type === 'fnf-original:controls' && ['play','menu'].includes(data.mode)) {
        if (data.mode !== this._controlsMode) this._releaseTouches();
        this._controlsMode = data.mode;
        this._updateTouchControls();
      } else if (data.type === 'fnf-original:win' && typeof data.songId === 'string') {
        let stats = {};
        if (data.stats && typeof data.stats === 'object') {
          try {
            const serialized = JSON.stringify(data.stats);
            if (serialized.length <= 65536) stats = JSON.parse(serialized);
          } catch {}
        }
        this._emit('fnf-original:win',{songId:data.songId,stats});
      } else if (data.type === 'fnf-original:error') {
        this._fail(typeof data.message === 'string' ? data.message.slice(0,500) : 'El motor original no pudo continuar.');
      }
    }

    _fail(message) {
      this._releaseTouches();
      this._state = 'error';
      this._updateTouchControls();
      this._emit('fnf-original:error',{message});
    }

    _emit(name,detail = {}) {
      this.dispatchEvent(new CustomEvent(name,{detail,bubbles:true,composed:true}));
    }

    setTouchControlsEnabled(value = null) {
      this._touchOverride = value === null ? null : Boolean(value);
      this._updateTouchControls();
    }

    _updateTouchControls() {
      const enabled = this._touchOverride ?? this._touchMedia.matches;
      this._touchControls.hidden = !enabled || this._state !== 'ready';
      if (this._touchControls.hidden) this._releaseTouches();
      this._touchControls.dataset.mode = this._controlsMode;
    }

    _menuGestureKey(start,end) {
      const dx = end.clientX-start.x, dy = end.clientY-start.y;
      if (Math.max(Math.abs(dx),Math.abs(dy)) < 28) return 'Enter';
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight') : (dy < 0 ? 'ArrowUp' : 'ArrowDown');
    }

    _tapMenuKey(key) {
      if (this._menuKeyTimers.has(key)) return;
      this._touchKey(key,'keydown');
      // Menu taps must span a native frame; song input is immediate.
      this._menuKeyTimers.set(key,setTimeout(() => {
        this._menuKeyTimers.delete(key);
        this._touchKey(key,'keyup');
      },60));
    }

    _touchKey(key,type) {
      const target = this._iframe?.contentWindow;
      const code = {ArrowLeft:37,ArrowDown:40,ArrowUp:38,ArrowRight:39,Enter:13,Escape:27}[key];
      if (!target || !code) return;
      target.dispatchEvent(new target.KeyboardEvent(type,{key,code:key,keyCode:code,which:code,bubbles:true,cancelable:true}));
    }

    _holdTouch(pointerId,key,tracking = false) {
      const previous = this._touchPointers.get(pointerId);
      if (previous === key) { if (!key && !tracking) this._touchPointers.delete(pointerId); return; }
      this._touchPointers.delete(pointerId);
      if (previous && ![...this._touchPointers.values()].includes(previous)) this._touchKey(previous,'keyup');
      if (key && !this._touchControls.hidden) {
        const held = [...this._touchPointers.values()].includes(key);
        this._touchPointers.set(pointerId,key);
        if (!held) this._touchKey(key,'keydown');
      }
      else if (tracking) this._touchPointers.set(pointerId,null);
    }

    _releaseTouches() {
      this._menuTouches?.clear();
      for (const [key,timer] of this._menuKeyTimers || []) {
        clearTimeout(timer);
        this._touchKey(key,'keyup');
      }
      this._menuKeyTimers?.clear();
      for (const key of new Set(this._touchPointers.values())) this._touchKey(key,'keyup');
      this._touchPointers.clear();
    }
  }

  if (!customElements.get('fnf-original-host')) customElements.define('fnf-original-host',FnfOriginalHost);
})();
