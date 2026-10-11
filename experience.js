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
  let externalScreen = false;
  let tracks = [];
  let room = 'entrance';
  let roomSeconds = 0;
  let elapsed = 0;
  let soundContext = null;
  let fireGain = null;
  let helpPreviousState = null;
  let hiddenPaused = false;
  let lastMenuTarget = null;
  let lastMenuTime = -Infinity;
  const dialogue = { pages: [], index: 0, shown: 0, time: 0 };

  function syncAudioButton() {
    const button = byId('btn-audio');
    button.innerHTML = (muted ? '[OFF]' : '[ON]') + ' <span>Audio</span>';
    button.setAttribute('aria-label', muted ? 'Activar audio' : 'Silenciar audio');
    button.setAttribute('aria-pressed', String(!muted));
  }

  function play(kind, options) {
    if (!started || externalScreen || !global.UndertaleAudio) return false;
    return global.UndertaleAudio.play(kind, options);
  }

  function stopSound(kind) {
    if (global.UndertaleAudio) global.UndertaleAudio.stop(kind);
  }

  function initializeSound() {
    try {
      const AudioContextClass = global.AudioContext || global.webkitAudioContext;
      if (!AudioContextClass) return;
      soundContext = new AudioContextClass();
      const samplesReady = global.UndertaleAudio ? global.UndertaleAudio.prepare(soundContext) : Promise.resolve();
      if (global.UndertaleAudio) {
        global.UndertaleAudio.setMuted(muted);
        global.UndertaleAudio.setPaused(document.hidden || gameState === 'PAUSED');
      }
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
      Promise.all([samplesReady, soundContext.resume()]).then(() => play('confirm')).catch(() => {});
    } catch { soundContext = null; fireGain = null; }
  }

  function playTracks() {
    if (externalScreen) return;
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

  function setExternalScreen(active) {
    externalScreen = Boolean(active);
    if (global.UndertaleAudio) global.UndertaleAudio.setPaused(externalScreen || document.hidden);
    if (externalScreen) {
      stopSound();
      tracks.forEach(track => { track.pause(); track.volume = 0; });
      if (fireGain && soundContext) fireGain.gain.setTargetAtTime(0, soundContext.currentTime, .02);
    } else if (started && !document.hidden) {
      playTracks();
      if (soundContext) soundContext.resume().catch(() => {});
    }
  }

  function setRoom(roomId) {
    stopSound('text');
    room = roomId;
    roomSeconds = 0;
    byId('hud').classList.add('visible');
    play('room');
  }

  function wrapText(text) {
    // Measure the loaded font inside the visible box. A character count cannot
    // predict the available line width when the stage changes size.
    let fits = line => Array.from(line).length <= 32;
    if (typeof global.getComputedStyle === 'function') {
      const box = byId('dialog-box');
      const textNode = byId('dialog-text');
      const style = global.getComputedStyle(textNode);
      const boxStyle = global.getComputedStyle(box);
      const measurement = document.createElement('canvas').getContext('2d');
      const numeric = value => Number.parseFloat(value) || 0;
      const padding = numeric(boxStyle.paddingLeft) + numeric(boxStyle.paddingRight);
      const border = numeric(boxStyle.borderLeftWidth) + numeric(boxStyle.borderRightWidth);
      const stageWidth = byId('game-stage').getBoundingClientRect().width;
      const available = textNode.clientWidth || (box.clientWidth ? box.clientWidth - padding
        : stageWidth * 0.92 - padding - border);
      if (measurement && available > 0) {
        measurement.font = `${style.fontWeight || '400'} ${style.fontSize || '32px'} ${style.fontFamily || 'Undertale, monospace'}`;
        const spacing = numeric(style.letterSpacing);
        fits = line => measurement.measureText(line).width + Math.max(0, Array.from(line).length - 1) * spacing <= available - 1;
      }
    }
    const lines = [];
    for (const paragraph of String(text).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (line && !fits(line + ' ' + word)) {
          lines.push(line);
          line = '  ' + word;
        } else line += (line ? ' ' : '') + word;
        // Preserve continuation indentation even for an unusually long token.
        while (!fits(line)) {
          const prefix = line.startsWith('  ') ? '  ' : '';
          const remaining = Array.from(line.slice(prefix.length));
          let count = 1;
          while (count < remaining.length && fits(prefix + remaining.slice(0, count + 1).join(''))) count += 1;
          lines.push(prefix + remaining.slice(0, count).join(''));
          line = '  ' + remaining.slice(count).join('');
          if (!remaining.slice(count).length) { line = ''; break; }
        }
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
      ? (dialogue.index === dialogue.pages.length - 1 ? 'Z / Enter - Cerrar v' : 'Z / Enter - Seguir v')
      : 'Z / Enter - Leer';
  }

  function beginPage() {
    stopSound('text');
    const page = dialogue.pages[dialogue.index] || '';
    dialogue.shown = reducedMotion ? page.length : page.startsWith('*') ? 1 : 0;
    dialogue.time = 0;
    byId('dialog-accessible').textContent = dialogue.pages[dialogue.index];
    renderDialogue();
  }

  function openDialog(text) {
    byId('dialog-box').classList.remove('hidden');
    dialogue.pages = wrapText(text);
    dialogue.index = 0;
    const screenY = player.y - camera.y;
    // Keep the character visible while examining low furniture.
    byId('dialog-box').classList.toggle('top', screenY > VIEW_H * 0.53);
    byId('interaction-hint').classList.add('hidden');
    beginPage();
    play('confirm');
  }

  function advanceDialog() {
    const page = dialogue.pages[dialogue.index] || '';
    if (dialogue.shown < page.length) {
      stopSound('text');
      dialogue.shown = page.length;
      dialogue.time = 0;
      renderDialogue();
      play('confirm');
      return false;
    }
    if (dialogue.index + 1 < dialogue.pages.length) {
      dialogue.index += 1;
      beginPage();
      play('page');
      return false;
    }
    return true;
  }

  function closeDialog(reason = 'cancel') {
    stopSound('text');
    dialogue.time = 0;
    play(reason);
  }

  function toggleHelp() {
    if (!started || gameState === 'TRANSITION') return;
    if (helpPreviousState !== null) {
      gameState = helpPreviousState;
      helpPreviousState = null;
      byId('help-panel').classList.add('hidden');
      if (global.UndertaleAudio) global.UndertaleAudio.setPaused(false);
      play('cancel');
      resetMovementInput();
      canvas.focus({ preventScroll: true });
      return;
    }
    helpPreviousState = gameState;
    gameState = 'PAUSED';
    if (global.UndertaleAudio) global.UndertaleAudio.setPaused(true);
    resetMovementInput();
    resetJoystick();
    byId('help-panel').classList.remove('hidden');
    byId('interaction-hint').classList.add('hidden');
    byId('btn-close-help').focus({ preventScroll: true });
    play('confirm', { ui: true });
  }

  function tick(deltaSeconds) {
    if (!started || externalScreen) return;
    const dt = Math.min(0.05, Math.max(0, deltaSeconds));
    if (document.hidden) return;
    if (global.UndertaleAudio) global.UndertaleAudio.setPaused(gameState === 'PAUSED');
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
      const carriedTime = dialogue.time;
      dialogue.time += dt;
      let count = 0;
      let consumedTime = 0;
      while (dialogue.shown < page.length && count < 20) {
        const previous = page[dialogue.shown - 1];
        const delay = /[.!?]/.test(previous) ? 0.15 : /[,;:]/.test(previous) ? 0.08 : 0.025;
        if (dialogue.time < delay) break;
        dialogue.time -= delay;
        consumedTime += delay;
        dialogue.shown += 1;
        count += 1;
        const letter = page[dialogue.shown - 1];
        if (/[\p{L}\p{N}]/u.test(letter)) {
          play('text', { delay: Math.max(0, consumedTime - carriedTime) });
        }
      }
      if (count) {
        renderDialogue();
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
    status.textContent = 'Preparando tu rincón de casa...';
    const imagesReady = images.map(image => new Promise((resolve, reject) => {
      if (image.complete) { image.naturalWidth ? resolve() : reject(); return; }
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
    }));
    const fontsReady = (global.UndertaleFontReady || (document.fonts
      ? Promise.resolve(typeof document.fonts.load === 'function' ? document.fonts.load('32px "Undertale"') : undefined)
        .then(() => document.fonts.ready)
      : Promise.resolve())).catch(error => {
          console.warn('No se pudo cargar la fuente Undertale:', error);
          const failure = new Error('FONT_LOAD_FAILED');
          failure.fontLoadFailed = true;
          throw failure;
        });
    Promise.all([...imagesReady, fontsReady]).then(() => {
      ready = true;
      startButton.disabled = false;
      status.textContent = 'Espacio / Enter para comenzar';
    }).catch(error => {
      status.textContent = error && error.fontLoadFailed
        ? 'No se pudo cargar la fuente. Extrae todo el ZIP y vuelve a abrir index.html.'
        : 'Faltan imágenes. Extrae todo el ZIP y vuelve a abrir index.html.';
    });
    startButton.addEventListener('click', () => startGame());
    byId('dialog-next').addEventListener('click', () => advanceInteraction());
    byId('btn-close-book').addEventListener('click', () => closeInteraction());
    byId('btn-help').addEventListener('click', toggleHelp);
    byId('btn-close-help').addEventListener('click', toggleHelp);
    byId('btn-audio').addEventListener('click', toggleMute);
    for (const button of document.querySelectorAll('button')) {
      const menuMove = () => {
        const now = performance.now() / 1000;
        if (lastMenuTarget === button && now - lastMenuTime < 0.1) return;
        lastMenuTarget = button;
        lastMenuTime = now;
        play('move', { ui: true });
      };
      button.addEventListener('pointerenter', menuMove);
      button.addEventListener('focus', menuMove);
    }
    byId('reduced-motion').checked = reducedMotion;
    byId('reduced-motion').addEventListener('change', event => {
      reducedMotion = event.target.checked;
      storage.set('quiet', reducedMotion);
      play('toggle', { ui: true });
    });
    syncAudioButton();
    global.addEventListener('keydown', event => {
      if (event.repeat || !started || externalScreen) return;
      if (event.code === 'KeyM') { event.preventDefault(); toggleMute(); }
      if (event.code === 'KeyF') {
        event.preventDefault();
        play('toggle', { ui: true });
        isFullscreenActive() ? exitFullscreen() : enterFullscreen();
      }
      if (event.code === 'KeyH' || (event.code === 'Escape' && helpPreviousState !== null)) {
        event.preventDefault(); toggleHelp();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!started) return;
      if (document.hidden) {
        hiddenPaused = true;
        stopSound();
        if (global.UndertaleAudio) global.UndertaleAudio.setPaused(true);
        tracks.forEach(track => track.pause());
        if (soundContext) soundContext.suspend().catch(() => {});
      } else if (hiddenPaused) {
        hiddenPaused = false;
        if (global.UndertaleAudio) global.UndertaleAudio.setPaused(externalScreen || gameState === 'PAUSED');
        playTracks();
        if (soundContext) soundContext.resume().catch(() => {});
      }
    });
  }

  function toggleMute() {
    muted = !muted;
    storage.set('muted', muted);
    syncAudioButton();
    if (global.UndertaleAudio) global.UndertaleAudio.setMuted(muted);
    if (muted) {
      tracks.forEach(track => { track.volume = 0; });
      if (fireGain && soundContext) fireGain.gain.setTargetAtTime(0, soundContext.currentTime, 0.03);
    } else {
      playTracks();
      if (soundContext) soundContext.resume().catch(() => {});
      play('toggle', { ui: true });
    }
  }

  global.HouseExperience = Object.freeze({
    boot, tick, startAudio, setRoom, setExternalScreen, openDialog, advanceDialog, closeDialog, wrapText, play,
    sound: play,
    canStart: () => ready,
    get elapsedSeconds() { return elapsed; },
    get reducedMotion() { return reducedMotion; }
  });
})(window);
