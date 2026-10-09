'use strict';

// Local WAVs are also embedded in sfx-data.js so opening index.html directly
// does not depend on fetch(), a server, or an internet connection.
(function createUndertaleAudio(global) {
  const samples = Object.freeze({
    text: 'text', move: 'menu_move', confirm: 'confirm', cancel: 'cancel',
    page: 'confirm', book: 'confirm', toggle: 'confirm', room: null
  });
  const volumes = Object.freeze({ text: 0.26, move: 0.3, confirm: 0.36, cancel: 0.32,
    page: 0.32, book: 0.32, toggle: 0.28, room: 0.3 });
  const buffers = new Map();
  const sampleStatus = {};
  const voices = [];
  let context = null;
  let output = null;
  let preparation = null;
  let muted = false;
  let paused = false;

  function removeVoice(voice) {
    const index = voices.indexOf(voice);
    if (index !== -1) voices.splice(index, 1);
    try { voice.source.disconnect(); voice.gain.disconnect(); } catch { /* Already disconnected. */ }
  }

  function stopVoice(voice) {
    try { voice.source.stop(); } catch { /* It may already have ended. */ }
    removeVoice(voice);
  }

  function stop(kind) {
    for (const voice of [...voices]) if (!kind || voice.kind === kind) stopVoice(voice);
  }

  function embeddedBytes(entry) {
    const encoded = typeof entry === 'string' ? entry : entry && (entry.base64 || entry.data || entry.dataUri);
    if (!encoded) throw new Error('Missing embedded WAV');
    const base64 = encoded.includes(',') ? encoded.slice(encoded.indexOf(',') + 1) : encoded;
    const binary = global.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes.buffer;
  }

  function fallbackBuffer(name) {
    // Used only when an original sample cannot be decoded. A short pulse keeps
    // the interface usable in that case; normal playback always uses the WAV.
    const duration = name === 'text' ? 0.024 : name === 'menu_move' ? 0.035 : 0.065;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      const seconds = index / context.sampleRate;
      const progress = seconds / duration;
      const base = name === 'text' ? 920 : name === 'cancel' ? 620 : name === 'menu_move' ? 1100 : 780;
      const pitch = base * (name === 'confirm' ? 1 + progress * 0.6 : name === 'cancel' ? 1 - progress * 0.35 : 1);
      const pulse = Math.sin(seconds * pitch * Math.PI * 2) >= 0 ? 1 : -1;
      channel[index] = pulse * Math.min(1, seconds / 0.002) * Math.pow(1 - progress, 2) * 0.22;
    }
    return buffer;
  }

  function prepare(audioContext) {
    if (context === audioContext && preparation) return preparation;
    stop();
    if (output) try { output.disconnect(); } catch { /* Old context. */ }
    context = audioContext;
    buffers.clear();
    if (!context) return Promise.resolve();
    output = context.createGain();
    output.gain.value = muted ? 0 : 1;
    output.connect(context.destination);
    const data = global.UndertaleSfxData || {};
    preparation = Promise.all(['text', 'menu_move', 'confirm', 'cancel'].map(async name => {
      try {
        const buffer = await context.decodeAudioData(embeddedBytes(data[name]));
        buffers.set(name, buffer);
        sampleStatus[name] = 'original';
      } catch {
        buffers.set(name, fallbackBuffer(name));
        sampleStatus[name] = 'fallback';
      }
    })).then(() => undefined);
    return preparation;
  }

  function play(kind = 'confirm', options = {}) {
    if (!context || !output || context.state !== 'running' || muted || (paused && !options.ui) || document.hidden) return false;
    const name = Object.prototype.hasOwnProperty.call(samples, kind) ? samples[kind] : 'confirm';
    const buffer = buffers.get(name);
    if (!name || !buffer) return false;
    // Keep typing clear, cap overlapping effects, and discard stale scheduled
    // sources as soon as a page is completed, muted, hidden, or paused.
    const matching = voices.filter(voice => voice.kind === kind);
    const limit = kind === 'text' ? 4 : 2;
    while (matching.length >= limit) stopVoice(matching.shift());
    while (voices.length >= 8) stopVoice(voices[0]);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volumes[kind] || 0.3;
    source.connect(gain).connect(output);
    const voice = { source, gain, kind };
    voices.push(voice);
    source.onended = () => removeVoice(voice);
    const delay = Math.min(0.08, Math.max(0, Number(options.delay) || 0));
    try { source.start(context.currentTime + delay); }
    catch { removeVoice(voice); return false; }
    return true;
  }

  function syncOutput() {
    if (output && context) output.gain.setValueAtTime(muted ? 0 : 1, context.currentTime);
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (muted) stop();
    syncOutput();
  }

  function setPaused(value) {
    const next = Boolean(value);
    if (next === paused) return;
    paused = next;
    if (paused) stop();
    syncOutput();
  }

  global.UndertaleAudio = Object.freeze({
    prepare, play, stop, setMuted, setPaused,
    get activeVoices() { return voices.length; },
    get sampleStatus() { return { ...sampleStatus }; }
  });
})(window);
