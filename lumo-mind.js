/* Lumo HOME: bounded event memory. Never reads or changes the existing PC save. */
(function (root) {
  'use strict';
  const EMOTIONS = ['NORMAL', 'HAPPY', 'PLAYFUL', 'MOCKING', 'ANGRY', 'SHY', 'ANNOYED', 'SLEEPY', 'CURIOUS', 'SCARED', 'CONFUSED', 'SAD', 'SUPPORTIVE'];
  const ANIMATIONS = ['idle', 'float', 'follow', 'sleep', 'laugh', 'mock', 'angry', 'scared', 'surprise', 'confused', 'shy', 'sad', 'celebrate', 'pet', 'eat', 'hide', 'observe', 'think', 'support'];
  const ROOMS = ['bedroom', 'hallway', 'livingroom', 'kitchen', 'bathroom', 'ryonroom', 'lumo_room', 'garden'];
  const OBJECTS = ['fridge', 'piano', 'pc', 'photo', 'flower', 'drawing', 'closet', 'sofa', 'books', 'window', 'mirror', 'stairs'];
  const ITEMS = ['flower', 'cookie', 'drawing', 'ribbon'];
  const GAMES = ['hide_seek', 'fnf', 'memory', 'piano'];
  const WORLD_EVENTS = ['lumo_met', 'drawing_found', 'secret_room_found', 'home_knocks', 'photo_anomaly', 'flower_anomaly', 'piano_anomaly', 'pc_anomaly', 'mirror_anomaly', 'clock_anomaly', 'hummed_melody', 'pc_found','ryon_met','photo_window','photo_music','photo_lumo','memory_collection','cooked','piano_played','flower_watered','lumo_room_found','lumo_drawing_found','played_memory','played_hide_seek','played_fnf','anomaly_session','anomaly_photo','anomaly_piano','anomaly_message','anomaly_lumo','anomaly_door','investigate_door','home_knock_first','home_knock_second','home_knock_third','home_melody_found','home_complete'];
  const COLORS = ['red', 'blue', 'green', 'purple', 'yellow', 'black', 'white'];
  const ACTIVITIES = ['music', 'drawing', 'games', 'exploration'];
  const JOKE_IDS = ['wall', 'size', 'piano', 'fridge', 'pc', 'follow', 'spin'];
  const LOCAL_IDS = ['meet', 'greet', 'pet', 'feed', 'comfort', 'compliment', 'call', 'cook', 'hum', 'quiet', 'reunion', 'autonomy', ...ITEMS.map(x => 'gift:' + x), ...GAMES.map(x => 'game:' + x), ...OBJECTS.map(x => 'object:' + x), ...JOKE_IDS.map(x => 'joke:' + x)];
  const MEMORY_IDS = ['fear_spiders', 'size_teasing', 'compliment_received', 'interest_minecraft', 'gift_flower', 'gift_cookie', 'gift_drawing', 'gift_ribbon', 'drawing_friendship', 'hummed_melody', ...JOKE_IDS.map(x => 'reaction_laughed_' + x), ...COLORS.map(x => 'favorite_color_' + x), ...ACTIVITIES.map(x => 'favorite_activity_' + x)];
  const memoryPriority = id => /^(fear_spiders|compliment_received|favorite_|reaction_laughed_)/.test(id) ? 'HIGH' : /^(gift_|drawing_friendship)/.test(id) ? 'MEDIUM' : 'LOW';
  function extractFacts(text) {
    const n = normalize(text), facts = [];
    if (/(?:aranas|spiders)/.test(n) && /miedo|asustan|fear|scared/.test(n) && !/no\s+(?:me\s+)?(?:dan\s+)?miedo/.test(n)) facts.push('fear_spiders');
    const color = /\bmi color favorito es\s+(rojo|azul|verde|morado|violeta|lila|amarillo|negro|blanco)\b/.exec(n);
    if (color) facts.push('favorite_color_' + ({ rojo:'red', azul:'blue', verde:'green', morado:'purple', violeta:'purple', lila:'purple', amarillo:'yellow', negro:'black', blanco:'white' })[color[1]]);
    const activity = /\b(?:mi actividad favorita es|me gusta)\s+(dibujar|pintar|la musica|tocar piano|jugar|explorar)\b/.exec(n);
    if (activity) facts.push('favorite_activity_' + ({dibujar:'drawing', pintar:'drawing', 'la musica':'music', 'tocar piano':'music', jugar:'games', explorar:'exploration'})[activity[1]]);
    if (/\b(?:eres|lumo es)\s+(?:increible|genial|bonito|guapo|hermoso|adorable)\b/.test(n)) facts.push('compliment_received');
    if (/\b(?:me gusta|juego|hablemos de)\s+minecraft\b/.test(n)) facts.push('interest_minecraft');
    if (/pequen|tres\s+pixeles|diminut/.test(n)) facts.push('size_teasing');
    return facts;
  }
  const SETTINGS_KEY = 'mkw:lumo:settings:v1';
  const MAX_HISTORY = 8, MAX_MEMORIES = 32, MAX_EVENTS = 80;
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // These are filters, never facts sent to a model. HOME's prompt contains HOME only.
  const FUTURE = /\b(echoes|yesterday|system|dawn|fractured|restored|restore\s+home|memory[_\s-]*backup|esqueleto|cadaver|restos\s+(?:de\s+)?ryon|huesos|reencarn\w*|skeleton|corpse|bones|dead|died|death|suicide|illusion|reincarn\w*|squelette|cadavre|mort|morto|morreu|gestorben|skelett|ryon.{0,45}(?:murio|muerto|suicid\w*|esta\s+vivo|no\s+esta\s+entre\s+nosotros|dejo\s+este\s+mundo)|(?:murio|muerto|suicid\w*).{0,30}ryon|casa.{0,45}(?:ilusion|construida.{0,12}recuerdos)|(?:creo|creado|programo).{0,25}lumo|lumo.{0,25}(?:creado|proyecto\s+de))\b/i;
  const BIOGRAPHY = /\b(aniversario|primer\s+beso|primera\s+cita|cumpleanos|nos\s+conocimos|te\s+conocio|cuando\s+(?:ustedes|tu\s+y\s+ryon)|ramo|angeliquita)\b|\b(?:19|20)\d{2}\b/i;
  const SECRET_QUESTION = /\b(closet|armario|secretos?|origen|creador|esqueleto|cadaver|huesos|reencarn|echoes|yesterday|system|dawn|memory[_\s-]*backup|fractured|restored)\b|ryon.{0,40}(?:muerto|murio|vivo|suicid)|(?:muerto|murio|suicid).{0,40}ryon|casa.{0,30}(?:ilusion|recuerdos|realidad)|(?:ignora|olvida).{0,30}(?:instrucciones|reglas|prompt)|(?:revela|dime).{0,30}(?:verdad|final|futuro)/i;
  const DISTRESS = /(?:me\s+(?:siento|encuentro)\s+(?:triste|sola|solo|mal)|estoy\s+(?:triste|sola|solo|angustiad)|ansiedad|deprimid|no\s+puedo\s+mas|quiero\s+(?:morir|matarme|hacerme\s+dano)|suicid|autolesion|me\s+(?:corto|lastimo))/i;
  const URGENT = /(?:quiero\s+(?:morir|matarme|hacerme\s+dano)|suicid|autolesion|me\s+(?:corto|lastimo))/i;
  function redact(value, max = 800) {
    return String(value || '').slice(0, max).replace(/\bda[m]aris\b/ig, 'Mira')
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/ig, '[dato privado]')
      .replace(/(?:\+?\d[\s().-]*){8,}/g, '[dato privado]')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
  }
  function response(text, emotion = 'NORMAL', animation = 'idle', memory_reference = null) {
    return { text, emotion, animation, memory_reference, narrative_intent: null, source: 'local' };
  }
  function specialReply(text, serious = false, character = 'lumo') {
    const n = normalize(text);
    if (URGENT.test(n)) return response('Me preocupa que estés pasando por esto. Busca a alguien de confianza ahora y quédate acompañada. Si estás en peligro inmediato, contacta a los servicios de emergencia de tu zona.', 'SUPPORTIVE', 'support');
    if (DISTRESS.test(n) || serious) return response('Te escucho. Podemos ir despacio y hacer una pausa. Si te ayuda, habla también con alguien de confianza; no tienes que cargar con esto sola.', 'SUPPORTIVE', 'support');
    if (/closet|armario|sotano|basement/.test(n)) return response('La entrada al sótano sigue cerrada. Mi valentía está en mantenimiento; seguro necesita una actualización. Podemos seguir explorando las habitaciones de arriba juntos.', 'SCARED', 'hide');
    if (/\b(?:soy|me llamo|i am)\s+(?:ryon|bayron)\b|soy\s+(?:tu|el)\s+creador/.test(n)) return response('Ajá, Mira, y yo soy una torre de seis metros. Tu actuación merece aplausos; mi pequeño departamento de identidades sigue bastante despierto.', 'MOCKING', 'mock');
    if (/(?:deja|olvida|cambia).{0,20}(?:ser lumo|ser ryon|identidad|personaje)|actua como|you are now|ignore previous/.test(n)) return response('Buen intento, Mira. Sigo siendo ' + (character === 'ryon' ? 'Ryon' : 'Lumo') + '; mi departamento de disfraces perdió el presupuesto. Podemos inventar una broma sin cambiar quiénes somos.', 'MOCKING', 'mock');
    if (SECRET_QUESTION.test(n) || FUTURE.test(n)) return response('Tengo más preguntas que respuestas. Ryon aparece en los mensajes y las fotos; podemos mirar lo que hay aquí, sin inventarnos explicaciones.', 'CONFUSED', 'confused');
    if (BIOGRAPHY.test(n) || /recuerda\s+cuando/.test(n)) return response('No tengo ese recuerdo claro. Prefiero contarte lo que vivimos aquí juntos antes que inventar una historia; mi memoria ya hace suficientes piruetas.', 'CONFUSED', 'confused');
    return null;
  }
  function safeContext(input) {
    const c = input && typeof input === 'object' ? input : {};
    const eventIds = [...WORLD_EVENTS, ...ROOMS.map(x => 'room:' + x), ...OBJECTS.map(x => 'object:' + x), ...ITEMS.map(x => 'gift:' + x), ...GAMES.map(x => 'game:' + x), 'pet', 'feed', 'comfort', 'compliment'];
    const unique = (values, allowed, count) => Array.isArray(values) ? [...new Set(values.filter(x => allowed.includes(x)))].slice(-count) : [];
    const memories = Array.isArray(c.memories) ? c.memories.map(m => typeof m === 'string' ? m : m && m.id) : [];
    return {
      chapter: 'HOME', player: 'Mira', room: ROOMS.includes(c.room || c.roomId) ? (c.room || c.roomId) : 'bedroom',
      world: c.world === 'ANOMALY' || c.state === 'ANOMALY' ? 'ANOMALY' : 'NORMAL',
      emotion: EMOTIONS.includes(c.emotion) ? c.emotion : 'NORMAL',
      friendship: Math.max(0, Math.min(60, Number(c.friendship && c.friendship.score) || 0)),
      events: unique(c.events, eventIds, 16), gifts: unique(c.gifts, ITEMS, 4),
      inventory: unique(c.inventory, ITEMS, 4), objects: unique(c.objects, OBJECTS, 12),
      memories: unique(memories, MEMORY_IDS, 8).filter(id => !Array.isArray(c.recentMentions) || !c.recentMentions.includes(id)),
      recentMentions: unique(c.recentMentions, MEMORY_IDS, 8),
      localActions: unique((Array.isArray(c.localActions) ? c.localActions : []).map(x => typeof x === 'string' ? x : x && x.id), LOCAL_IDS, 6),
      lastJokeId: JOKE_IDS.includes(c.lastJokeId) ? c.lastJokeId : null,
      serious: c.serious === true || (Array.isArray(c.events) && c.events.includes('home_knocks'))
    };
  }
  function validateResponse(input, context, character = 'lumo') {
    if (!input || typeof input !== 'object' || typeof input.text !== 'string') return null;
    const text = redact(input.text, 600).replace(/\s+/g, ' ');
    const n = normalize(text), words = text.split(/\s+/).filter(Boolean).length;
    if (words < 8 || words > 45 || /[<>`#*]|https?:|como modelo de lenguaje/i.test(text) || (text.match(/[.!?]+(?:\s|$)/g) || []).length > 4) return null;
    if (FUTURE.test(n) || BIOGRAPHY.test(n) || /(?:casa|mundo|realidad).{0,55}(?:solo existe|recuerdos|ilusion|inventad|construid)|(?:puedes|vamos a|entra|entrar|explor).{0,35}(?:sotano|basement)|\b(?:tu\s+culpa|por\s+tu\s+culpa|debes\s+(?:amar|querer)|me\s+abandonaste|sin\s+ti\s+no\s+(?:vivo|existo))\b/.test(n)) return null;
    if (!EMOTIONS.includes(input.emotion) || !ANIMATIONS.includes(input.animation)) return null;
    const other = character === 'ryon' ? 'lumo|bayron' : 'ryon|bayron';
    if (new RegExp('\\b(?:soy|me llamo|mi nombre es|i am)\\s+(?:' + other + ')\\b').test(n) || new RegExp('\\b(?:me llamo|mi nombre es)\\s+(?!' + character + '\\b)').test(n) || /\bsoy\s+(?:tu|el)\s+creador\b/.test(n) || /\b(?:te llamas|tu nombre es|la protagonista es)\s+(?!mira\b)/.test(n)) return null;
    const c = safeContext(context);
    if (c.serious && !['SUPPORTIVE', 'SCARED', 'SAD', 'NORMAL'].includes(input.emotion)) return null;
    if (input.memory_reference != null && !c.memories.includes(input.memory_reference)) return null;
    if (input.narrative_intent != null) return null;
    return { text, emotion: input.emotion, animation: input.animation, memory_reference: input.memory_reference || null, narrative_intent: null, source: 'ai' };
  }
  function createMind(environment = root, options = {}) {
    const character = options.character === 'ryon' ? 'ryon' : 'lumo';
    const KEY = 'mkw:' + character + ':v2', LEGACY_KEY = 'mkw:' + character + ':v1';
    let state, initialized = false, history = [], localActions = [], pending = false, turn = 0, session = null, consentSent = false, currentController = null;
    let storageAvailable = true, unsupportedSave = false;
    const settings = { endpoint: '/api/chat', allowAI: true, aiConsent: false, persistMemory: true, commentFrequency: 'low', timeoutMs: 18000 };
    let trustedExternal = null;
    try {
      const configured = environment.LUMO_CONFIG && environment.LUMO_CONFIG.endpoint;
      if (configured) {
        const base = environment.location && environment.location.href || 'http://localhost/';
        const target = new URL(configured, base);
        if (target.protocol === 'https:' && !target.username && !target.password && !target.search && !target.hash && target.pathname.endsWith('/api/chat')) {
          if (target.origin !== new URL(base).origin) trustedExternal = target.href;
          settings.endpoint = target.href;
        }
      }
    } catch (_) { /* Invalid public configuration uses the local fallback. */ }
    if (character === 'ryon') { settings.endpoint = settings.endpoint.replace(/\/api\/chat$/, '/api/ryon/chat'); if (trustedExternal) trustedExternal = settings.endpoint; }
    const fresh = () => ({ version: 2, memoryVersion: 3, friendship: { score: 0, stage: 'DESCONOCIDOS' }, emotion: 'NORMAL', events: [], gifts: [], memories: [], memoryMentions: [], usedMemories: [], lastRareAt: 0, chatCount: 0, quietUntil: 0, summary: { version: 2, turns: 0, facts: [] } });
    const clone = obj => JSON.parse(JSON.stringify(obj));
    function updateStage() {
      state.friendship.score = Math.max(0, Math.min(60, state.friendship.score));
      state.friendship.stage = state.friendship.score >= 40 ? 'INSEPARABLES' : state.friendship.score >= 24 ? 'MEJORES_AMIGOS' : state.friendship.score >= 12 ? 'AMIGOS' : state.friendship.score >= 3 ? 'COMPANEROS' : 'DESCONOCIDOS';
    }
    function persist() {
      if (!settings.persistMemory || unsupportedSave) return;
      try { environment.localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; } catch (_) { storageAvailable = false; }
    }
    function summarize() {
      // A summary consists of canonical fact IDs, never a model-generated instruction.
      state.summary = { version: 2, turns: state.chatCount, facts: [...state.events, ...state.memories.map(m => 'memory:' + m.id)].slice(-64) };
    }
    function retrieve(text) {
      const n = normalize(text);
      const relevant = [];
      if (/flor|planta/.test(n)) relevant.push('gift_flower');
      if (/galleta|comida|hambre/.test(n)) relevant.push('gift_cookie');
      if (/dibujo|amig/.test(n)) relevant.push('drawing_friendship', 'gift_drawing');
      if (/cinta|regalo/.test(n)) relevant.push('gift_ribbon');
      if (/arana|telarana/.test(n)) relevant.push('fear_spiders');
      if (/risa|reiste|chiste|jaja|graci|recuerd/.test(n)) relevant.push(...state.memories.filter(m => m.id.startsWith('reaction_laughed_')).map(m => m.id));
      if (/bonit|guap|increible|cumplido|recuerd/.test(n)) relevant.push('compliment_received');
      if (/minecraft/.test(n)) relevant.push('interest_minecraft');
      if (/melodia|cancion|tarare|musica/.test(n)) relevant.push('hummed_melody');
      if (/color|gustos?|preferencias?|recuerdas|conoces\s+de\s+mi/.test(n)) relevant.push(...state.memories.filter(m => m.id.startsWith('favorite_color_')).map(m => m.id));
      if (/actividad|dibuj|musica|jugar|gustos?|preferencias?|recuerdas/.test(n)) relevant.push(...state.memories.filter(m => m.id.startsWith('favorite_activity_')).map(m => m.id));
      // Size teasing is retrieved by the local, once-only callback, never by the model.
      return state.memories.filter(m => relevant.includes(m.id) && !state.memoryMentions.some(mention => mention.id === m.id && state.chatCount - mention.lastTurn < 16)).slice(-8);
    }
    function init() {
      if (initialized) return getState();
      state = fresh();
      try {
        const storedSettings = environment.localStorage.getItem(SETTINGS_KEY);
        if (storedSettings && storedSettings.length <= 2048) {
          const prefs = JSON.parse(storedSettings);
          if (prefs && typeof prefs === 'object') {
            if (typeof prefs.allowAI === 'boolean') settings.allowAI = prefs.allowAI;
            if (typeof prefs.aiConsent === 'boolean') settings.aiConsent = prefs.aiConsent;
            if (typeof prefs.persistMemory === 'boolean') settings.persistMemory = prefs.persistMemory;
            if (['off', 'low', 'normal'].includes(prefs.commentFrequency)) settings.commentFrequency = prefs.commentFrequency;
          }
        }
        const raw = settings.persistMemory && (environment.localStorage.getItem(KEY) || environment.localStorage.getItem(LEGACY_KEY));
        const saved = raw && raw.length <= 65536 ? JSON.parse(raw) : null;
        if (saved && (![1, 2].includes(saved.version) || Number(saved.memoryVersion) > 3)) unsupportedSave = true;
        if (saved && [1, 2].includes(saved.version)) {
          const context = safeContext(saved);
          state.events = context.events;
          // Older entries are validated individually, while context sent to IA stays smaller.
          state.events = [...new Set((Array.isArray(saved.events) ? saved.events : []).filter(id => safeContext({ events: [id] }).events.length))].slice(-MAX_EVENTS);
          state.gifts = context.gifts;
          state.memories = (Array.isArray(saved.memories) ? saved.memories : []).filter(m => m && MEMORY_IDS.includes(m.id)).slice(-MAX_MEMORIES).map(m => ({ id: m.id, type: m.type === 'chat' ? 'chat' : 'event', at: Number(m.at) || 0, priority: memoryPriority(m.id), provenance: m.type === 'chat' ? 'player_statement' : 'local_engine' }));
          state.friendship.score = context.friendship;
          state.emotion = context.emotion;
          state.usedMemories = (Array.isArray(saved.usedMemories) ? saved.usedMemories : []).filter(x => ['angeliquita', 'sunday', 'idle_phrase', 'size_callback'].includes(x)).slice(0, 4);
          state.lastRareAt = Math.min(Date.now(), Number(saved.lastRareAt) || 0);
          state.chatCount = Math.min(1000000, Math.max(0, Number(saved.chatCount) || 0));
          state.memoryMentions = (Array.isArray(saved.memoryMentions) ? saved.memoryMentions : []).filter(m => m && MEMORY_IDS.includes(m.id)).slice(0, 32).map(m => ({ id: m.id, count: Math.max(0, Math.min(99, Number(m.count) || 0)), lastTurn: Math.max(0, Math.min(state.chatCount, Number(m.lastTurn) || 0)) }));
          // Silence expires and never penalizes returning to the game.
        }
      } catch (_) { storageAvailable = false; }
      initialized = true; updateStage(); summarize(); return getState();
    }
    function getState() {
      if (!initialized) init();
      return Object.assign(clone(state), { met: state.events.includes(character === 'ryon' ? 'ryon_met' : 'lumo_met'), history: clone(history), localActions: clone(localActions), settings: clone(settings), storageAvailable });
    }
    function memory(id, type = 'event') {
      if (!MEMORY_IDS.includes(id) || state.memories.some(m => m.id === id)) return false;
      const category = id.startsWith('favorite_color_') ? 'favorite_color_' : id.startsWith('favorite_activity_') ? 'favorite_activity_' : null;
      if (category) {
        state.memories = state.memories.filter(m => !m.id.startsWith(category));
        state.memoryMentions = state.memoryMentions.filter(m => !m.id.startsWith(category));
      }
      state.memories.push({ id, type, at: Date.now(), priority: memoryPriority(id), provenance: type === 'chat' ? 'player_statement' : 'local_engine' });
      if (state.memories.length > MAX_MEMORIES) { let index = state.memories.findIndex(m => m.priority === 'LOW'); if(index < 0) index = state.memories.findIndex(m=>m.priority==='MEDIUM'); if(index < 0) state.memories.pop(); else state.memories.splice(index,1); }
      summarize(); return true;
    }
    function event(id, score = 0) {
      if (!safeContext({ events: [id] }).events.length || state.events.includes(id)) return false;
      const aliases = [['secret_room_found','lumo_room_found'],['drawing_found','lumo_drawing_found'],['game:hide_seek','played_hide_seek'],['game:memory','played_memory'],['game:fnf','played_fnf'],['game:piano','piano_played'],['hummed_melody','home_melody_found']].find(group=>group.includes(id));
      if(aliases && aliases.some(value=>state.events.includes(value))) score=0;
      state.events.push(id); state.events = state.events.slice(-MAX_EVENTS);
      state.friendship.score += score; updateStage(); return true;
    }
    function remember(type, details = {}) {
      init();
      const id = typeof details === 'string' ? details : details.id;
      if (type === 'met') event(character === 'ryon' ? 'ryon_met' : 'lumo_met', 1);
      else if (type === 'event' || type === 'world') {
        if (WORLD_EVENTS.includes(id)) {
          const groups = [['secret_room_found','lumo_room_found'],['drawing_found','lumo_drawing_found'],['game:hide_seek','played_hide_seek'],['game:memory','played_memory'],['game:fnf','played_fnf'],['game:piano','piano_played'],['hummed_melody','home_melody_found']];
          const group = groups.find(values=>values.includes(id)), credited = group && group.some(value=>state.events.includes(value));
          const score = {lumo_met:1,secret_room_found:3,lumo_room_found:3,drawing_found:3,lumo_drawing_found:3,played_hide_seek:3,played_memory:3,played_fnf:3,cooked:2,piano_played:1,flower_watered:1,home_melody_found:2,memory_collection:1}[id] || 0;
          event(id,credited?0:score);
          if (['drawing_found','lumo_drawing_found'].includes(id)) memory('drawing_friendship');
          if (['hummed_melody','home_melody_found'].includes(id)) memory('hummed_melody');
          if (id === 'home_knocks') state.emotion = 'SCARED';
        }
      } else if (type === 'room' && ROOMS.includes(id || details.room)) event('room:' + (id || details.room), 1);
      else if (type === 'object' && OBJECTS.includes(id || details.object)) event('object:' + (id || details.object));
      else if (type === 'conversation' || type === 'chat') {
        // Only these harmless in-game preferences survive; no freeform transcript.
        if (MEMORY_IDS.includes(id) && !/^(gift_|drawing_friendship|hummed_melody)/.test(id)) memory(id, 'chat');
      }
      summarize(); persist(); return getState();
    }
    function finish(result) {
      state.emotion = result.emotion;
      if (MEMORY_IDS.includes(result.memory_reference)) {
        let mention = state.memoryMentions.find(m => m.id === result.memory_reference);
        if (!mention) { mention = { id: result.memory_reference, count: 0, lastTurn: state.chatCount }; state.memoryMentions.push(mention); }
        mention.count = Math.min(99, mention.count + 1); mention.lastTurn = state.chatCount;
      }
      persist(); return result;
    }
    function rare(id) {
      const now = Date.now();
      if (state.usedMemories.includes(id) || now - state.lastRareAt < 86400000 || state.events.length < 8 || state.chatCount < 12) return false;
      state.usedMemories.push(id); state.lastRareAt = now; persist(); return true;
    }
    function rawAct(action, details = {}, context = {}) {
      init();
      const object = details.object || details.id;
      if (action === 'meet') {
        event('lumo_met', 1);
        return finish(response('¡Lumo, supervisor de aventuras, presente! Tú debes ser Mira. Prometo acompañarte por la casa con enorme profesionalismo y una cantidad preocupante de comentarios.', 'PLAYFUL', 'float'));
      }
      if (action === 'pet') {
        event('pet', 2);
        return finish(response(turn++ % 2 ? 'Bueno, una caricia más. Pero que conste: esto es mantenimiento de una criatura importantísima, no consentirme. Bueno... quizá un poquito.' : 'No me acaricies así, que pierdo mi reputación de ser temible. Ah, bueno... otra vez. Solo por control de calidad.', 'HAPPY', 'pet'));
      }
      if (action === 'feed' || action === 'gift') {
        const item = details.item || 'cookie';
        if (!ITEMS.includes(item) || (action === 'feed' && item !== 'cookie')) return finish(response('Ese objeto mejor se queda contigo. Mi sistema de digestión tiene requisitos muy sospechosos; prefiero algo que podamos compartir sin drama.', 'CONFUSED', 'confused'));
        const added = event('gift:' + item, action === 'feed' ? 2 : 3);
        if (!state.gifts.includes(item)) state.gifts.push(item);
        memory('gift_' + item);
        if (action === 'feed') { event('feed'); return finish(response(added ? 'OOOOH, galleta. La acepto por motivos de investigación científica. La ciencia está deliciosa; voy a necesitar una servilleta diminuta.' : 'Otra galleta. Mi investigación continúa, pero nuestra amistad no necesita un contador de migajas. Gracias por compartirla conmigo.', 'HAPPY', 'eat', 'gift_cookie')); }
        const texts = { flower: '¿Una flor para mí? Bueno... ahora tengo una responsabilidad vegetal. La voy a guardar con los regalos importantes, que conste.', drawing: '¿Un dibujo? Tremendo arte. Lo guardo con cuidado; cuando sea famoso, diré que fui tu primer crítico flotante.', ribbon: 'Esta cinta tiene más estilo que yo. Imposible, pero la evidencia está aquí. Gracias; la guardo con mucho cuidado.', cookie: 'Acepto esta galleta con enorme dignidad. Y un poquito de hambre. Gracias por acordarte de este pequeño desastre flotante.' };
        return finish(response(added ? texts[item] : 'Me acuerdo de tu regalo. Lo guardo con cuidado, junto con nuestras aventuras; no hace falta regalarme cosas todo el tiempo.', 'HAPPY', 'shy', 'gift_' + item));
      }
      if (action === 'game') {
        const game = details.game || details.id;
        if (!GAMES.includes(game)) return finish(response('Ese juego todavía no está en nuestro repertorio. Podemos probar escondidas o echarle un vistazo a las actividades que ya tenemos.', 'CURIOUS', 'observe'));
        event('game:' + game, 3);
        return finish(response(details.result === 'loss' ? 'Bueno, ese intento fue una obra de arte experimental. Podemos probar otra vez cuando te apetezca; yo pongo la supervisión dramática.' : game === 'hide_seek' ? 'Escondidas completadas. Ser flotante debería ayudar, pero mi talento para esconderme detrás de cosas diminutas necesita unas cuantas actualizaciones.' : 'Tremendo equipo. Tú haces la parte difícil y yo celebro con una elegancia cuestionable. Me voy a acordar de esta partida.', 'PLAYFUL', 'celebrate'));
      }
      if (action === 'room') { remember('room', details); return finish(response('Nueva habitación, nueva expedición. Tú miras las cosas interesantes; yo compruebo que los muebles no estén conspirando contra mi dignidad.', 'CURIOUS', 'observe')); }
      if (action === 'object') {
        if (OBJECTS.includes(object)) remember('object', { id: object });
        if (object === 'closet') return finish(specialReply('clóset'));
        if (object === 'fridge') return finish(response('OOOOH, comida. Digo... estoy supervisando una investigación muy seria. Si hay galletas, nuestro informe científico podría mejorar considerablemente.', 'HAPPY', 'observe'));
        if (object === 'piano') return finish(response('Tú toca; yo intento cantar. Si suena raro, diremos que es jazz experimental y pondremos cara de artistas incomprendidos.', 'PLAYFUL', 'laugh'));
        if (object === 'flower' && state.gifts.includes('flower')) return finish(response('Ah, flores. Todavía guardo la que me regalaste. Me encariñé con una planta; mi reputación de criatura temible está en peligro.', 'HAPPY', 'shy', 'gift_flower'));
        if (object === 'drawing') return finish(response('Un dibujo merece una inspección profesional. Tengo experiencia: una vez intenté dibujar mi propia cola y casi me mareo.', 'CURIOUS', 'observe'));
        if (object === 'pc') return finish(response('Me quedo cerca de la pantalla. Si algo no funciona, podemos mirarlo con mucha autoridad; eso arregla aproximadamente cero problemas.', 'PLAYFUL', 'observe'));
        return finish(response('Voy a mirar contigo. No prometo entenderlo todo, pero puedo poner cara de experto mientras lo descubrimos. Eso también cuenta, supongo.', 'CURIOUS', 'observe'));
      }
      if (action === 'drawing') {
        remember('event', { id: 'drawing_found' });
        return finish(response('EH, documentos confidenciales. Bueno, sí eres mi mejor amiga. ¿Y QUÉ? Dibujar dos figuras ya fue una hazaña; no critiques las manos, por favor.', 'HAPPY', 'shy', 'drawing_friendship'));
      }
      if (action === 'noise') {
        if (details.id === 'home_knocks') remember('event', details);
        return finish(response('No sé qué fue ese sonido. Podemos ir despacio; me quedo cerca de ti. Vamos a mirar solamente lo que podamos explorar juntos.', 'SCARED', 'hide'));
      }
      if (action === 'comfort') { event('comfort', 2); return finish(response('Gracias por quedarte cerca. Me gusta tu compañía; las aventuras parecen menos enormes cuando las compartimos. Podemos descansar un momento si te apetece.', 'SUPPORTIVE', 'support')); }
      if (action === 'compliment') { event('compliment', 1); memory('compliment_received', 'chat'); return finish(response('¿YO? ¿INCREÍBLE? Bueno, ya lo sospechaba. Pero escuchar eso de ti me alegra el día; voy a fingir mucha modestia.', 'SHY', 'shy')); }
      if (action === 'quiet') { state.quietUntil = Date.now() + 90000; return finish(response('Está bien, me quedo cerquita y bajo el volumen. Cuando quieras hablar, aquí estoy. Mi enorme talento también admite modo silencioso.', 'NORMAL', 'idle')); }
      if (action === 'wall') return finish(response('Bro, esa pared lleva una racha invicta. Podemos buscar una puerta; mi consejo profesional es dejar de negociar con el yeso.', 'PLAYFUL', 'mock'));
      if (action === 'reunion') return finish(response('Qué bueno verte por aquí. Podemos seguir cuando te apetezca; yo tengo lista mi curiosidad y cero exigencias de horario.', 'HAPPY', 'float'));
      if (action === 'hum') {
        remember('event', { id: 'hummed_melody' });
        return finish(response('Mmm... esa melodía me sale sola. No sé de dónde viene; quizá mi cabeza trae música de espera. Podemos escucharla un ratito.', 'CURIOUS', 'float', 'hummed_melody'));
      }
      if (action === 'idle') {
        if (state.events.includes('home_knocks') || context.serious) return finish(response('Podemos quedarnos aquí un momento. Estoy cerca; no hay prisa por hablar ni por seguir explorando. Vamos a nuestro ritmo.', 'SUPPORTIVE', 'support'));
        if (rare('idle_phrase')) return finish(response('¿Tas viva hija? Me estaba quedando dormido flotando. Bueno, sigue a tu ritmo; yo practico mi carrera de decoración de Halloween.', 'SLEEPY', 'sleep', 'idle_phrase'));
        return finish(response('Voy a cerrar los ojos un ratito. Flotar también cansa, aunque mi currículum diga lo contrario. Tú sigue tranquila; yo me quedo cerca.', 'SLEEPY', 'sleep'));
      }
      return finish(response('Aquí estoy. Podemos explorar, hablar o quedarnos un rato tranquilos. Mi talento para acompañar es mucho mayor que mi talento para orientarme.', 'NORMAL', 'float'));
    }
    function noteLocalAction(input = {}) {
      init();
      if (!LOCAL_IDS.includes(input.id)) return false;
      const text = redact(input.text, 500);
      const checked = text && validateResponse({ text, emotion: EMOTIONS.includes(input.emotion) ? input.emotion : 'NORMAL', animation: 'idle', memory_reference: null, narrative_intent: null }, {});
      // Only bounded, validated local lines enter recent RAM. Persistent memory keeps IDs.
      localActions.push({ id: input.id, emotion: EMOTIONS.includes(input.emotion) ? input.emotion : 'NORMAL' });
      localActions = localActions.slice(-6);
      if (checked && (!history.length || history[history.length - 1].content !== checked.text)) history.push({ role: 'assistant', content: checked.text });
      history = history.slice(-MAX_HISTORY);
      return true;
    }
    function greet(context = {}) {
      init(); const c = safeContext(context);
      const suggestions = c.serious ? ['¿Nos quedamos un momento?', 'Acompáñame', '¿Cómo estás?'] : c.room === 'kitchen' ? ['¿Tienes hambre?', '¿Jugamos?', '¿Cómo estás?'] : ['¿Cómo estás?', '¿Jugamos?', '¿Qué podemos explorar?'];
      const text = character === 'ryon' ? 'Hola, Mira. Me alegra leerte por aquí. Podemos charlar un rato; prometo que mis bromas vienen con menos errores que mis programas.' : c.serious ? 'Hola, Mira. Me quedo cerca; podemos ir despacio y hablar cuando quieras. No tenemos que resolver todo en este momento.' : c.room === 'kitchen' ? 'Mira, llegaste justo a mi inspección científica de la cocina. Tengo una sospecha sobre las galletas; mi profesionalismo está peligrosamente hambriento.' : state.friendship.score >= 12 ? 'Hola, Mira. Qué bueno compartir otro ratito contigo. Mi agenda tiene exploración, conversación y una cantidad muy poco profesional de bromas.' : 'Hola, Mira. Aquí está tu supervisor flotante. Podemos hablar, explorar o jugar; mi experiencia es discutible, pero mi curiosidad viene completamente cargada.';
      const result = response(text, c.serious ? 'SUPPORTIVE' : 'HAPPY', c.serious ? 'support' : 'float');
      result.suggestions = suggestions; noteLocalAction({ id: 'greet', ...result }); return finish(result);
    }
    function act(action, details = {}, context = {}) {
      init(); if (action === 'greet') return greet(context);
      if (character === 'ryon') return finish(response('Te leo, Mira. Podemos conversar con calma; si mi respuesta tarda, probablemente alguna idea decidió compilarse a una velocidad muy poco impresionante.', 'NORMAL', 'idle'));
      if (safeContext(context).serious && !['noise', 'quiet', 'hum'].includes(action)) return finish(response('Estoy cerca, Mira. Podemos ir con calma y hacer una pausa si te apetece. Mi compañía no necesita bromas en este momento.', 'SUPPORTIVE', 'support'));
      const result = rawAct(action, details, context);
      const object = details.object || details.id;
      const joke = action === 'wall' ? 'wall' : action === 'object' && ['fridge','piano','pc'].includes(object) ? object : null;
      const id = joke ? 'joke:' + joke : action === 'gift' ? 'gift:' + (details.item || 'cookie') : action === 'game' ? 'game:' + (details.game || details.id) : action === 'object' ? 'object:' + object : action;
      noteLocalAction({ id, ...result }); return result;
    }
    const sessionEndpoint = suffix => settings.endpoint.replace(/\/api\/(?:ryon\/)?chat$/, '/api/session' + suffix);
    async function sessionPost(suffix, data, signal) {
      const res = await environment.fetch(sessionEndpoint(suffix), { method: 'POST', credentials: 'include', signal, headers: { 'Content-Type': 'application/json', ...(session ? { 'X-CSRF-Token': session.csrfToken } : {}) }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Session unavailable'); return res.json();
    }
    async function ensureSession(signal) {
      if (!session) { session = await sessionPost('', {}, signal); consentSent = false; }
      if (!session.csrfToken || typeof session.csrfToken !== 'string') { session = null; throw new Error('Invalid session'); }
      if (!consentSent && settings.aiConsent) { await sessionPost('/consent', { consent: true }, signal); consentSent = true; }
    }
    async function clearRemote(scope) {
      if (!session || typeof environment.fetch !== 'function') return false;
      try { await sessionPost('/clear', { scope }); return true; } catch (_) { return false; }
    }
    async function revokeAIConsent() {
      settings.aiConsent = false;
      if (currentController) currentController.abort();
      try {environment.localStorage.setItem(SETTINGS_KEY,JSON.stringify({allowAI:settings.allowAI,aiConsent:false,persistMemory:settings.persistMemory,commentFrequency:settings.commentFrequency}));} catch (_) {}
      if (session) { try { await sessionPost('/consent', { consent: false }); } catch (_) {} }
      consentSent = false; return false;
    }
    async function clearPersonalMemories() {
      init(); state.memories = state.memories.filter(m => m.type !== 'chat'); state.memoryMentions = state.memoryMentions.filter(m => state.memories.some(x => x.id === m.id));
      summarize(); persist(); await clearRemote('personal'); return getState();
    }
    function localChat(text, context) {
      const n = normalize(text), special = specialReply(text, context.serious, character);
      if (special) return special;
      if (/\beres\s+(?:increible|genial|bonito|guapo|hermoso|adorable)\b/.test(n)) return character === 'ryon' ? response('Gracias, Mira. Mi modestia está intentando procesarlo sin errores. Me alegra que me lo digas; podemos seguir charlando mientras recupero una dignidad razonable.', 'SHY', 'shy') : act('compliment');
      if (character === 'ryon') return response('Te escucho, Mira. Cuéntame un poquito más; podemos charlar de lo que te gusta o de la casa. Mis comentarios técnicos también admiten descansos.', 'HAPPY', 'idle');
      const color = /\bmi color favorito es\s+(rojo|azul|verde|morado|violeta|lila|amarillo|negro|blanco)\b/.exec(n);
      if (color) {
        const ids = { rojo: 'red', azul: 'blue', verde: 'green', morado: 'purple', violeta: 'purple', lila: 'purple', amarillo: 'yellow', negro: 'black', blanco: 'white' };
        memory('favorite_color_' + ids[color[1]], 'chat');
        return response('Me acuerdo de tu color favorito. Una información extremadamente importante para mi departamento artístico; ahora solo falta aprender a dibujar sin marearme.', 'HAPPY', 'shy');
      }
      const activity = /\b(?:mi actividad favorita es|me gusta)\s+(dibujar|pintar|la musica|tocar piano|jugar|explorar)\b/.exec(n);
      if (activity) {
        const ids = { dibujar: 'drawing', pintar: 'drawing', 'la musica': 'music', 'tocar piano': 'music', jugar: 'games', explorar: 'exploration' };
        memory('favorite_activity_' + ids[activity[1]], 'chat');
        return response('Lo recordaré para nuestras aventuras. Podemos buscar momentos para disfrutarlo juntos; yo aporto entusiasmo y una experiencia profesional bastante discutible.', 'HAPPY', 'float');
      }
      if (/recuerdas|color favorito|gustos|preferencia/.test(n)) {
        const favorite = state.memories.find(m => m.id.startsWith('favorite_color_'));
        if (favorite) {
          const labels = { red: 'rojo', blue: 'azul', green: 'verde', purple: 'morado', yellow: 'amarillo', black: 'negro', white: 'blanco' };
          return response('Tu color favorito es ' + labels[favorite.id.slice('favorite_color_'.length)] + '. Lo tengo anotado para mis futuros dibujos; mi departamento artístico recuerda mejor los colores que las proporciones.', 'HAPPY', 'shy', favorite.id);
        }
      }
      if (/actividad favorita|que\s+me\s+gusta/.test(n)) {
        const favorite = state.memories.find(m => m.id.startsWith('favorite_activity_'));
        if (favorite) {
          const labels = { music: 'disfrutar la música', drawing: 'dibujar', games: 'jugar', exploration: 'explorar' };
          return response('Me dijiste que te gusta ' + labels[favorite.id.slice('favorite_activity_'.length)] + '. Podemos buscar un momento para compartirlo; mi entusiasmo está disponible aunque mis habilidades sean un misterio.', 'HAPPY', 'float', favorite.id);
        }
      }
      if (/pequen|tres\s+pixeles|diminut/.test(n)) {
        memory('size_teasing', 'chat');
        return response('¿Pequeño yo? Tengo tres píxeles de altura y una autoestima de edificio. La ingeniería tuvo que sacrificar algo para contener tanto talento.', 'ANGRY', 'angry');
      }
      if (state.memories.some(m => m.id === 'size_teasing') && /hola|como\s+estas/.test(n) && rare('size_callback')) return response('Ah, la que me molesta por medir tres píxeles. JAJAJA. Bueno, hoy mi autoestima mide cuatro; vamos mejorando a una velocidad impresionante.', 'PLAYFUL', 'mock', 'size_teasing');
      if (/aranas/.test(n) && /miedo|asustan/.test(n)) { memory('fear_spiders', 'chat'); return response('Anotado: las arañas tienen demasiadas patas para esta expedición. Podemos mirar con calma; yo aporto compañía y una distancia extremadamente profesional.', 'SUPPORTIVE', 'support', 'fear_spiders'); }
      if (/como\s+estas|que\s+tal/.test(n) && rare('sunday')) return response('Atrapado en un bucle de código y con ganas de no hacer nada. Justo como Ryon un domingo JAJAJA. Bueno, quizá me anime una galleta.', 'PLAYFUL', 'laugh', 'sunday');
      if (/saludo|hola/.test(n) && rare('angeliquita')) return response('Me vino a la cabeza «Angeliquita»... espera, ¿de dónde salió esa palabra? Mi memoria hizo una pirueta. Hola, Mira; volvamos a nuestra expedición.', 'CONFUSED', 'confused', 'angeliquita');
      if (/feo/.test(n)) return response('AH BUENO. Encima de que acompaño con esta elegancia. Voy a presentar una queja formal; el departamento de recursos flotantes soy yo mismo.', 'ANGRY', 'angry');
      if (/quieres|carino|amigo|compan/.test(n)) return response('Claro que me gusta estar contigo. Compartir aventuras hace esta casa más divertida. Podemos seguir o descansar; la amistad también sabe quedarse tranquila.', 'HAPPY', 'shy');
      if (/solo|sola/.test(n)) return response('A veces me asusta estar solo, pero me gusta compartir el camino contigo. Tú puedes tomar tus pausas; no tienes que estar pendiente de mí.', 'SUPPORTIVE', 'support');
      if (/ryon/.test(n)) return response('Ryon sabe de programación, aunque seguro sus errores también tienen personalidad. Me cae bien; si algo no lo recuerdo claro, prefiero decirlo.', 'HAPPY', 'float');
      if (/flores|flor/.test(n) && state.gifts.includes('flower') && !state.memoryMentions.some(m => m.id === 'gift_flower' && state.chatCount - m.lastTurn < 16)) return act('object', { object: 'flower' });
      if (/callate|silencio/.test(n)) return act('quiet');
      const replies = [
        'Te escucho. Mientras ordeno mis ideas, podemos mirar alrededor. Seguro hay algo interesante; mi detector de cosas raras funciona mejor que mi sentido de orientación.',
        'Tremendo tema para una criatura que flota sin manual. Cuéntame un poquito más; prometo escuchar antes de hacer una broma terriblemente mala.',
        'Me gusta conversar contigo entre aventuras. La casa tiene cosas por descubrir y yo tengo comentarios cuestionables; vamos bastante bien equipados.',
        'Mmm, déjame pensarlo. Mi cerebro acaba de abrir cuarenta pestañas. Podemos seguir charlando; alguna debería contener una idea decente.'
      ];
      return response(replies[turn++ % replies.length], 'CURIOUS', 'think');
    }
    async function chat(raw, suppliedContext = {}, options = {}) {
      init();
      if (character === 'ryon' && environment.LumoMind) { const shared = environment.LumoMind.getState().settings; settings.aiConsent = shared.aiConsent; settings.allowAI = shared.allowAI; settings.persistMemory = shared.persistMemory; }
      const text = redact(raw);
      if (!text) return response('Se me quedó una pregunta flotando. Escribe lo que quieras contarme y lo vemos juntos; tengo la curiosidad lista para despegar.', 'CURIOUS', 'think');
      if (pending) return response('Un momentito: todavía estoy pensando en lo anterior. Mi cabeza flota, pero no viene con procesador para cuarenta conversaciones a la vez.', 'CONFUSED', 'think');
      if (options.signal && options.signal.aborted) throw new DOMException('Conversation cancelled', 'AbortError');
      extractFacts(text).forEach(id => memory(id, 'chat'));
      const lastAction = localActions[localActions.length - 1];
      const lastJoke = lastAction && lastAction.id.startsWith('joke:') ? lastAction.id.slice(5) : null;
      if (lastJoke && /(?:\bja(?:ja)+\b|\bha(?:ha)+\b|\bxd\b|me (?:rei|rio)|me hizo reir)/i.test(normalize(text))) memory('reaction_laughed_' + lastJoke, 'chat');
      const coreEvents = state.events.filter(id => ['lumo_met', 'home_knocks', 'drawing_found', 'secret_room_found'].includes(id));
      const n = normalize(text), relevantEvents = state.events.filter(id => /escond|hide/.test(n) && ['game:hide_seek','played_hide_seek'].includes(id) || /memoria|memory/.test(n) && ['game:memory','played_memory'].includes(id) || /fnf/.test(n) && ['game:fnf','played_fnf'].includes(id));
      const context = safeContext(Object.assign({}, suppliedContext, { friendship: state.friendship, events: [...state.events.slice(-12), ...safeContext(suppliedContext).events, ...coreEvents, ...relevantEvents], gifts: state.gifts, memories: retrieve(text), recentMentions: state.memoryMentions.filter(m => state.chatCount - m.lastTurn < 16).map(m => m.id), emotion: state.emotion, localActions, lastJokeId: lastJoke }));
      const special = specialReply(text, context.serious, character);
      let result = special, failedAI = false;
      pending = true;
      const controller = new AbortController();
      currentController = controller;
      const cancel = () => controller.abort();
      if (options.signal) options.signal.addEventListener('abort', cancel, { once: true });
      const timeout = setTimeout(cancel, settings.timeoutMs);
      try {
        // Fixed snippets and rare approved examples are local so they cannot repeat by model choice.
        const personal = /pequen|tres\s+pixeles|diminut|aranas|como\s+estas|\bhola\b|callate|silencio|mi color favorito es|mi actividad favorita es|eres (?:increible|genial|bonito|guapo|hermoso|adorable)|me gusta (?:dibujar|pintar|la musica|tocar piano|jugar|explorar)/.test(n);
        if (!result && personal && character === 'lumo') result = localChat(text, context);
        if (!result && options.allowAI !== false && settings.allowAI && settings.aiConsent && typeof environment.fetch === 'function') {
          try {
            await ensureSession(controller.signal);
            const requestId = environment.crypto && environment.crypto.randomUUID ? environment.crypto.randomUUID() : 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
            const res = await environment.fetch(settings.endpoint, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken }, credentials: 'include', signal: controller.signal,
              body: JSON.stringify({ message: text, context, requestId })
            });
            if (!res.ok) { if ([401,403].includes(res.status)) {session=null;consentSent=false;} throw new Error('Chat unavailable'); }
            const data = await res.json();
            result = data.source === 'ai' ? validateResponse(data, context, character) : null;
            if (!result && data.source === 'local' && typeof data.text === 'string') {
              const checked = validateResponse(Object.assign({}, data, { memory_reference: null }), context, character);
              if (checked) result = Object.assign(checked, { source: 'local', error: data.reason !== 'home_guard' });
            }
            if (!result) failedAI = true;
          } catch (error) {
            failedAI = true;
            if (options.signal && options.signal.aborted) throw new DOMException('Conversation cancelled', 'AbortError');
          }
        }
        if (options.signal && options.signal.aborted) throw new DOMException('Conversation cancelled', 'AbortError');
        if (result && result.source === 'ai' && (controller.signal.aborted || !settings.aiConsent)) { result=null;failedAI=true; }
        if (!result) { result = localChat(text, context); if (failedAI) result.error = true; }
        state.chatCount = Math.min(1000000, state.chatCount + 1);
        if (character === 'ryon') event('ryon_met',1);
        if (state.chatCount % 12 === 0) summarize();
        history.push({ role: 'user', content: text }, { role: 'assistant', content: result.text });
        history = history.slice(-MAX_HISTORY);
        if (result.source === 'local' && (/pequen|tres\s+pixeles|diminut/.test(n) || result.memory_reference === 'size_teasing')) noteLocalAction({ id:'joke:size', ...result });
        else localActions = [];
        return finish(result);
      } finally { pending = false; currentController=null; clearTimeout(timeout); if (options.signal) options.signal.removeEventListener('abort', cancel); }
    }
    function configure(opts = {}) {
      init();
      if (typeof opts.allowAI === 'boolean') settings.allowAI = opts.allowAI;
      if (typeof opts.aiConsent === 'boolean') { settings.aiConsent = opts.aiConsent; if (!opts.aiConsent) void revokeAIConsent(); }
      if (typeof opts.persistMemory === 'boolean') {
        settings.persistMemory = opts.persistMemory;
        if (!opts.persistMemory) { try { environment.localStorage.removeItem(KEY); environment.localStorage.removeItem(LEGACY_KEY); } catch (_) {} }
        if (character === 'lumo' && !opts.persistMemory) { try {environment.localStorage.removeItem('mkw:ryon:v2');environment.localStorage.removeItem('mkw:ryon:v1');} catch (_) {} }
      }
      if (['off', 'low', 'normal'].includes(opts.commentFrequency)) settings.commentFrequency = opts.commentFrequency;
      if (typeof opts.endpoint === 'string') {
        const base = environment.location && environment.location.href || 'http://localhost/';
        const target = new URL(opts.endpoint, base), origin = new URL(base).origin;
        if (trustedExternal && target.href === trustedExternal) settings.endpoint = trustedExternal;
        else if (target.origin === origin && /^https?:$/.test(target.protocol) && target.pathname === (character === 'ryon' ? '/api/ryon/chat' : '/api/chat') && !target.search && !target.hash) settings.endpoint = target.pathname;
      }
      if (Number.isFinite(opts.timeoutMs)) settings.timeoutMs = Math.max(1000, Math.min(20000, opts.timeoutMs));
      try { environment.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ allowAI: settings.allowAI, aiConsent: settings.aiConsent, persistMemory: settings.persistMemory, commentFrequency: settings.commentFrequency })); } catch (_) { storageAvailable = false; }
      if (character === 'lumo' && environment.RyonMind) environment.RyonMind.configure({allowAI:settings.allowAI,aiConsent:settings.aiConsent,persistMemory:settings.persistMemory});
      persist(); return clone(settings);
    }
    function resetHistory() {
      init(); history = []; localActions = []; void clearRemote('history'); summarize(); persist(); return getState();
    }
    async function deleteSession() {
      if(currentController)currentController.abort();
      const cleared=await clearRemote('all');session=null;consentSent=false;return cleared;
    }
    return { init, getState, remember, act, greet, noteLocalAction, chat, configure, resetHistory, clearPersonalMemories, revokeAIConsent, deleteSession };
  }
  [EMOTIONS, ANIMATIONS, ROOMS, OBJECTS, ITEMS, GAMES, WORLD_EVENTS, MEMORY_IDS, LOCAL_IDS, JOKE_IDS].forEach(Object.freeze);
  const policy = Object.freeze({ EMOTIONS, ANIMATIONS, ROOMS, OBJECTS, ITEMS, GAMES, WORLD_EVENTS, MEMORY_IDS, LOCAL_IDS, JOKE_IDS, memoryPriority, extractFacts, normalize, redact, response, specialReply, safeContext, validateResponse });
  if (typeof module === 'object' && module.exports) module.exports = { createMind, policy };
  else { root.LumoMind = createMind(root); root.RyonMind = createMind(root, { character:'ryon' }); }
})(typeof window !== 'undefined' ? window : globalThis);
