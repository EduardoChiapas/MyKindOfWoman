'use strict';

// Interface and sound stay independent of the collision / movement engine.
// All assets are local. Preferences are optional when file:// blocks storage.
(function createExperience(global) {
  const byId = id => document.getElementById(id);
  const storage = {
    get(key) { try { return localStorage.getItem('toriel.' + key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem('toriel.' + key, String(value)); } catch { /* Optional. */ } }
  };
  const media = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let reducedMotion = storage.get('quiet') === null ? media.matches : storage.get('quiet') === 'true';
  let muted = storage.get('muted') === 'true';
  let ready = false;
  let started = false;
  let tracks = [];
  let room = 'entrance';
  let roomSeconds = 0;
  let elapsed = 0;
  let soundContext = null;
  let fireGain = null;
  let helpPreviousState = null;
  let hiddenPaused = false;
  let lastTick = 0;
  const dialogue = { pages: [], index: 0, shown: 0, time: 0 };

  function syncAudioButton() {
    const button = byId('btn-audio');
    button.innerHTML = (muted ? '×' : '♪') + ' <span>Audio</span>';
    button.setAttribute('aria-label', muted ? 'Activar audio' : 'Silenciar audio');
    button.setAttribute('aria-pressed', String(!muted));
  }

  function sound(frequency = 420, duration = 0.025, volume = 0.008) {
    if (!soundContext || soundContext.state !== 'running' || muted || document.hidden) return;
    const oscillator = soundContext.createOscillator();
    const gain = soundContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    const now = soundContext.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(soundContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  function initializeSound() {
    try {
      const AudioContextClass = global.AudioContext || global.webkitAudioContext;
      if (!AudioContextClass) return;
      soundContext = new AudioContextClass();
      // A quiet filtered texture near the fireplace, with no downloaded SFX.
      const buffer = soundContext.createBuffer(1, soundContext.sampleRate * 2, soundContext.sampleRate);
      const data = buffer.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i += 1) {
        brown = (brown + (Math.random() * 2 - 1) * 0.025) / 1.025;
        data[i] = brown;
      }
      const fire = soundContext.createBufferSource();
      const filter = soundContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 620;
      fireGain = soundContext.createGain();
      fireGain.gain.value = 0;
      fire.buffer = buffer;
      fire.loop = true;
      fire.connect(filter).connect(fireGain).connect(soundContext.destination);
      fire.start();
      soundContext.resume().catch(() => {});
    } catch { soundContext = null; fireGain = null; }
  }

  function playTracks() {
    for (const track of tracks) {
      try {
        const promise = track.play();
        if (promise && promise.catch) promise.catch(() => {});
      } catch { /* Browsers without audio still allow exploring. */ }
    }
  }

  function startAudio() {
    if (started) return;
    started = true;
    initializeSound();
    for (const track of tracks) track.volume = 0;
    playTracks();
  }

  function setRoom(roomId) {
    room = roomId;
    roomSeconds = 0;
    byId('hud').classList.add('visible');
  }

  function wrapText(text, width = 44) {
    const lines = [];
    for (const paragraph of String(text).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (line && line.length + word.length + 1 > width) {
          lines.push(line);
          line = '  ' + word;
        } else line += (line ? ' ' : '') + word;
      }
      if (line) lines.push(line);
    }
    const pages = [];
    for (let index = 0; index < lines.length; index += 3) pages.push(lines.slice(index, index + 3).join('\n'));
    return pages.length ? pages : ['* ...'];
  }

  function renderDialogue() {
    const page = dialogue.pages[dialogue.index] || '';
    byId('dialog-text').textContent = page.slice(0, dialogue.shown);
    byId('dialog-progress').textContent = dialogue.pages.length > 1
      ? (dialogue.index + 1) + ' / ' + dialogue.pages.length : '';
    const complete = dialogue.shown >= page.length;
    byId('dialog-next').textContent = complete
      ? (dialogue.index === dialogue.pages.length - 1 ? 'Z / Enter · Cerrar ▾' : 'Z / Enter · Seguir ▾')
      : 'Z / Enter · Leer';
  }

  function beginPage() {
    dialogue.shown = reducedMotion ? dialogue.pages[dialogue.index].length : 1;
    dialogue.time = 0;
    byId('dialog-accessible').textContent = dialogue.pages[dialogue.index];
    renderDialogue();
  }

  function openDialog(text) {
    dialogue.pages = wrapText(text);
    dialogue.index = 0;
    const screenY = player.y - camera.y;
    // Keep the character visible while examining low furniture.
    byId('dialog-box').classList.toggle('top', screenY > VIEW_H * 0.53);
    byId('dialog-box').classList.remove('hidden');
    byId('interaction-hint').classList.add('hidden');
    beginPage();
  }

  function advanceDialog() {
    const page = dialogue.pages[dialogue.index] || '';
    if (dialogue.shown < page.length) {
      dialogue.shown = page.length;
      renderDialogue();
      return false;
    }
    if (dialogue.index + 1 < dialogue.pages.length) {
      dialogue.index += 1;
      beginPage();
      sound(500, 0.045, 0.014);
      return false;
    }
    return true;
  }

  function toggleHelp() {
    if (!started || gameState === 'TRANSITION') return;
    if (helpPreviousState !== null) {
      gameState = helpPreviousState;
      helpPreviousState = null;
      byId('help-panel').classList.add('hidden');
      resetMovementInput();
      canvas.focus({ preventScroll: true });
      return;
    }
    helpPreviousState = gameState;
    gameState = 'PAUSED';
    resetMovementInput();
    resetJoystick();
    byId('help-panel').classList.remove('hidden');
    byId('interaction-hint').classList.add('hidden');
    byId('btn-close-help').focus({ preventScroll: true });
  }

  function tick(deltaSeconds) {
    if (!started) return;
    const dt = Math.min(0.05, Math.max(0, deltaSeconds));
    if (document.hidden) return;
    if (gameState !== 'PAUSED') elapsed += dt;
    roomSeconds += dt;
    byId('hud').classList.toggle('visible', roomSeconds < 2.8 && gameState === 'PLAYING');
    const damping = 1 - Math.exp(-dt * 4);
    const lowerVolume = gameState === 'PAUSED' ? 0.45 : gameState === 'DIALOG' || gameState === 'BOOK' ? 0.8 : 1;
    const target = muted ? [0, 0] : room === 'basementHallway' ? [0, 0.38 * lowerVolume] : [0.48 * lowerVolume, 0];
    tracks.forEach((track, index) => { track.volume += (target[index] - track.volume) * damping; });
    if (fireGain && soundContext) {
      let gain = 0;
      if (!muted && room === 'livingRoom' && gameState !== 'PAUSED') {
        const feet = getPlayerHitbox();
        const distance = Math.hypot(feet.x + feet.width / 2 - 336, feet.y + feet.height / 2 - 130);
        gain = Math.max(0, 1 - distance / 400) * 0.07;
      }
      fireGain.gain.setTargetAtTime(gain, soundContext.currentTime, 0.2);
    }
    if (gameState === 'DIALOG') {
      const page = dialogue.pages[dialogue.index] || '';
      dialogue.time += dt;
      let count = 0;
      while (dialogue.shown < page.length && count < 20) {
        const previous = page[dialogue.shown - 1];
        const delay = /[.!?]/.test(previous) ? 0.15 : /[,;:]/.test(previous) ? 0.08 : 0.025;
        if (dialogue.time < delay) break;
        dialogue.time -= delay;
        dialogue.shown += 1;
        count += 1;
      }
      if (count) {
        renderDialogue();
        if (elapsed - lastTick > 0.065 && /[\p{L}\p{N}]/u.test(page[dialogue.shown - 1])) {
          sound(340 + (dialogue.shown % 4) * 22);
          lastTick = elapsed;
        }
      }
    }
    const canExamine = gameState === 'PLAYING' && !player.isMoving && Boolean(findInteraction());
    byId('interaction-hint').classList.toggle('hidden', !canExamine);
  }

  function boot(images, audioTracks) {
    tracks = audioTracks;
    tracks.forEach(track => { track.volume = 0; });
    const startButton = byId('btn-start');
    const status = byId('loading-status');
    startButton.disabled = true;
    status.textContent = 'Preparando tu rincón de casa…';
    Promise.all(images.map(image => new Promise((resolve, reject) => {
      if (image.complete) { image.naturalWidth ? resolve() : reject(); return; }
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
    }))).then(() => {
      ready = true;
      startButton.disabled = false;
      status.textContent = 'Espacio / Enter para comenzar';
    }).catch(() => { status.textContent = 'Faltan imágenes. Extrae todo el ZIP y vuelve a abrir index.html.'; });
    startButton.addEventListener('click', () => startGame());
    byId('dialog-next').addEventListener('click', () => advanceInteraction());
    byId('btn-close-book').addEventListener('click', () => closeInteraction());
    byId('btn-help').addEventListener('click', toggleHelp);
    byId('btn-close-help').addEventListener('click', toggleHelp);
    byId('btn-audio').addEventListener('click', toggleMute);
    byId('reduced-motion').checked = reducedMotion;
    byId('reduced-motion').addEventListener('change', event => {
      reducedMotion = event.target.checked;
      storage.set('quiet', reducedMotion);
    });
    syncAudioButton();
    global.addEventListener('keydown', event => {
      if (event.repeat || !started) return;
      if (event.code === 'KeyM') { event.preventDefault(); toggleMute(); }
      if (event.code === 'KeyF') { event.preventDefault(); isFullscreenActive() ? exitFullscreen() : enterFullscreen(); }
      if (event.code === 'KeyH' || (event.code === 'Escape' && helpPreviousState !== null)) {
        event.preventDefault(); toggleHelp();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!started) return;
      if (document.hidden) {
        hiddenPaused = true;
        tracks.forEach(track => track.pause());
        if (soundContext) soundContext.suspend().catch(() => {});
      } else if (hiddenPaused) {
        hiddenPaused = false;
        playTracks();
        if (soundContext) soundContext.resume().catch(() => {});
      }
    });
  }

  function toggleMute() {
    muted = !muted;
    storage.set('muted', muted);
    syncAudioButton();
    if (muted) {
      tracks.forEach(track => { track.volume = 0; });
      if (fireGain && soundContext) fireGain.gain.setTargetAtTime(0, soundContext.currentTime, 0.03);
    } else {
      playTracks();
      if (soundContext) soundContext.resume().catch(() => {});
    }
  }

  global.HouseExperience = Object.freeze({
    boot, tick, startAudio, setRoom, openDialog, advanceDialog, sound,
    canStart: () => ready,
    get elapsedSeconds() { return elapsed; },
    get reducedMotion() { return reducedMotion; }
  });
})(window);
