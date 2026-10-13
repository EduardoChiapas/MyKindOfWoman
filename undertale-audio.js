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
  // HOME cues use selected original Undertale samples, at their original pitch.
  // Short texture windows keep paper and water from overpowering the dialogue.
  const effects = Object.freeze({
    water: { sample: 'water', volume: .13, duration: .66, cooldown: .18 },
    bell: { sample: 'bell', volume: .12, cooldown: .14 },
    open: { sample: 'open', volume: .2, cooldown: .1 },
    close: { sample: 'close', volume: .16, cooldown: .1 },
    box: { sample: 'box', volume: .13, cooldown: .1 },
    switch: { sample: 'switch', volume: .13, cooldown: .09 },
    lever: { sample: 'lever', volume: .1, cooldown: .1 },
    paper: { sample: 'paper', volume: .07, duration: .17, cooldown: .09 },
    card: { sample: 'paper', volume: .075, duration: .13, cooldown: .065 },
    cloth: { sample: 'paper', volume: .055, duration: .11, cooldown: .12 },
    clock: { sample: 'switch', volume: .07, duration: .085, cooldown: .18 },
    squeak: { sample: 'squeak', volume: .22, cooldown: .09 },
    match: { sample: 'bell', volume: .095, duration: .31, cooldown: .16 },
    miss: { sample: 'menu_move', volume: .18, cooldown: .1 },
    success: { sample: 'confirm', volume: .22, cooldown: .25 }
  });
  const buffers = new Map();
  const lastEffects = new Map();
  const sampleStatus = {};
  const voices = [];
  let context = null;
  let output = null;
  let effectOutput = null, textOutput = null;
  let preparation = null;
  let preparationGeneration = 0;
  let muted = false;
  let paused = false;
  let effectVolume = 1, textVolume = 1;

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
    for (const voice of [...voices]) if (!kind || voice.kind === kind || (kind === 'world' && voice.kind.startsWith('world:'))) stopVoice(voice);
    if (!kind || kind === 'world') lastEffects.clear();
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
    const generation = ++preparationGeneration;
    stop();
    if (output) try { output.disconnect(); } catch { /* Old context. */ }
    if (effectOutput) try { effectOutput.disconnect(); textOutput.disconnect(); } catch { /* Old context. */ }
    context = audioContext;
    buffers.clear();
    for (const name of Object.keys(sampleStatus)) delete sampleStatus[name];
    if (!context) { output = effectOutput = textOutput = null; preparation = null; return Promise.resolve(); }
    output = context.createGain();
    output.gain.value = muted ? 0 : 1;
    output.connect(context.destination);
    effectOutput = context.createGain(); textOutput = context.createGain();
    effectOutput.gain.value = effectVolume; textOutput.gain.value = textVolume;
    effectOutput.connect(output); textOutput.connect(output);
    const data = global.UndertaleSfxData || {};
    const names = [...new Set(['text', 'menu_move', 'confirm', 'cancel', ...Object.values(effects).map(spec => spec.sample)])];
    preparation = Promise.all(names.map(async name => {
      let timer;
      try {
        const buffer = await Promise.race([
          audioContext.decodeAudioData(embeddedBytes(data[name])),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Sample decode timeout')), 1800); })
        ]);
        if (generation !== preparationGeneration || context !== audioContext) return;
        buffers.set(name, buffer);
        sampleStatus[name] = 'original';
      } catch {
        if (generation !== preparationGeneration || context !== audioContext) return;
        buffers.set(name, fallbackBuffer(name));
        sampleStatus[name] = 'fallback';
      } finally { clearTimeout(timer); }
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
    gain.gain.value = (volumes[kind] || 0.3) * unit(options.volume, 1);
    source.connect(gain).connect(kind === 'text' ? textOutput : effectOutput);
    const voice = { source, gain, kind };
    voices.push(voice);
    source.onended = () => removeVoice(voice);
    const delay = Math.min(0.08, Math.max(0, Number(options.delay) || 0));
    try { source.start(context.currentTime + delay); }
    catch { removeVoice(voice); return false; }
    return true;
  }

  function unit(value, fallback = 0) {
    const number = value === undefined ? fallback : Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
  }

  function effect(name, options = {}) {
    const spec = effects[name];
    if (!spec || !context || !output || context.state !== 'running' || muted ||
      (paused && !options.ui) || document.hidden || !effectVolume || !unit(options.volume, 1)) return false;
    const buffer = buffers.get(spec.sample);
    if (!buffer) return false;
    const at = context.currentTime;
    if (at - (lastEffects.get(name) ?? -Infinity) < spec.cooldown) return false;
    lastEffects.set(name, at);
    const kind = 'world:' + name;
    stop(kind);
    while (voices.length >= 8) stopVoice(voices[0]);
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer;
    // No persistent ambience: the only permitted loop is a bounded water gesture.
    source.loop = name === 'water' && options.loop === true;
    const duration = source.loop ? 3 : Math.min(buffer.duration, spec.duration ?? buffer.duration);
    const level = spec.volume * unit(options.volume, 1);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + Math.min(.006, duration / 3));
    gain.gain.setValueAtTime(level, at + Math.max(.006, duration - .025));
    gain.gain.linearRampToValueAtTime(0, at + duration);
    source.connect(gain).connect(effectOutput);
    const voice = { source, gain, kind };
    voices.push(voice); source.onended = () => removeVoice(voice);
    try { if (source.loop) source.start(at); else source.start(at, 0, duration); source.stop(at + duration + .005); }
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

  function hum(options = {}) {
    if (!context || !output || context.state !== 'running' || muted || (paused && !options.ui) || document.hidden) return false;
    stop('hum');
    // Original four-note motif; reused unchanged by later authorized chapters.
    [261.626, 329.628, 293.665, 391.995].forEach((frequency,index) => {
      const source=context.createOscillator(), gain=context.createGain();
      source.type='sine'; source.frequency.value=frequency;
      const at=context.currentTime+index*.3;
      while(voices.length>=8)stopVoice(voices[0]);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035*unit(options.volume,1),at+.045);
      gain.gain.linearRampToValueAtTime(0,at+.26);source.connect(gain).connect(effectOutput);
      const voice={source,gain,kind:'hum'};voices.push(voice);source.onended=()=>removeVoice(voice);
      source.start(at);source.stop(at+.29);
    });
    return true;
  }
  function tone(frequency,kind,duration,options={}){
    if(!context||!output||context.state!=='running'||muted||(paused&&!options.ui)||document.hidden)return false;
    while(voices.length>=8)stopVoice(voices[0]);
    const source=context.createOscillator(), gain=context.createGain(), at=context.currentTime;
    source.type=kind==='knock'?'triangle':'sine';source.frequency.setValueAtTime(frequency,at);
    if(kind==='whistle')source.frequency.linearRampToValueAtTime(1050,at+.12);
    const level=(kind==='knock'?.045:.035)*unit(options.volume,1);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    source.connect(gain).connect(effectOutput);const voice={source,gain,kind};voices.push(voice);source.onended=()=>removeVoice(voice);
    source.start(at);source.stop(at+duration+.015);return true;
  }
  function note(index,options={}){const notes=[261.626,329.628,293.665,391.995];return tone(options.odd?277.183:notes[Math.max(0,Math.min(3,Math.floor(index)))],'piano',.38,options);}
  function whistle(){return tone(740,'whistle',.22);}
  function knock(){return tone(92,'knock',.16);}
  global.UndertaleAudio = Object.freeze({
    prepare, play, effect, hum, note, whistle, knock, stop, setMuted, setPaused,
    setVolumes({effects=effectVolume,text=textVolume}={}){
      effectVolume=unit(effects); textVolume=unit(text);
      if(context && effectOutput){effectOutput.gain.setValueAtTime(effectVolume,context.currentTime);textOutput.gain.setValueAtTime(textVolume,context.currentTime);}
    },
    get activeVoices() { return voices.length; },
    get sampleStatus() { return { ...sampleStatus }; }
  });
  document.addEventListener?.('visibilitychange', () => { if (document.hidden) stop(); });
})(window);
