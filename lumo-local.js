/* Lumo's HOME-only local conversation. Persistent data contains approved IDs, never chat text. */
(function(root){
  'use strict';
  const data=typeof module==='object'&&module.exports?require('./lumo-local-data.js'):root.LUMO_LOCAL_DATA;
  const entries=new Map(data.entries.map(e=>[e.id,e])),slots=new Map();
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const stop=new Set('de del la el los las un una a por para que quien como cual cuanto es eres tienes tengo puedes podria podrias yo tu te me mi y si lo le su eso esa esto esta estar ser dime di decir algo sobre se son tiene donde estas estas opinas opinion sabes hacer consideras puede importantes'.split(' '));
  const synonyms={chistes:'chiste',broma:'chiste',bromas:'chiste',gracioso:'chiste',graciosa:'chiste',cuentame:'cuenta',dormir:'sueno',cansada:'sueno',cansado:'sueno',pierna:'piernas',mano:'manos',computadora:'pc',ordenador:'pc',computador:'pc',volar:'flotar',vuelo:'flotar',flotas:'flotar',flotando:'flotar',miedos:'miedo',amigos:'amigo',saludo:'hola',saludar:'hola',adios:'despedida',hasta:'despedida',celular:'telefono'};
  const words=value=>[...new Set(normalize(value).replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(w=>w&&!stop.has(w)).map(w=>synonyms[w]||w))];
  const queryTokens=new Map(data.entries.map(e=>[e.id,words(e.question)]));
  const queryKey=value=>normalize(value).replace(/[^a-z0-9]+/g,' ').trim();
  const exact=new Map(data.entries.map(e=>[queryKey(e.question),e.id]));
  const frequency=new Map();for(const tokens of queryTokens.values())for(const w of tokens)frequency.set(w,(frequency.get(w)||0)+1);
  const profile={friends:['PLAYFUL','mock'],ryon:['HAPPY','float'],affection:['SHY','shy'],absurd:['PLAYFUL','laugh'],home:['CURIOUS','observe'],banter:['MOCKING','mock'],body:['PLAYFUL','float'],random:['CURIOUS','think'],fear:['SCARED','scared'],games:['PLAYFUL','laugh'],sincere:['SUPPORTIVE','support']};
  const subjects=['xavier','david','ryon',null];
  function decode(id){
    if(typeof id!=='string'||id.length>70)return null;
    const pieces=id.split(':');if(pieces.length!==3||!/^\d$/.test(pieces[1])||!/^\d$/.test(pieces[2]))return null;
    const entry=entries.get(pieces[0]),p=Number(pieces[1]),e=Number(pieces[2]),slot=p*8+e;
    return entry&&p<8&&e<8&&((entry.mask[slot>>>5]>>>(slot%32))&1)?{entry,p,e}:null;
  }
  function render(id){
    const found=decode(id);if(!found)return null;const {entry,p,e}=found;
    const openings=['fear','sincere'].includes(entry.group)?data.calm:data.openings;
    const [emotion,animation]=entry.id==='c_unknown_person'?['CONFUSED','confused']:profile[entry.group];
    return {text:[openings[p],entry.text,data.endings[entry.group][e]].filter(Boolean).join(' '),emotion,animation,memory_reference:null,narrative_intent:null,source:'local',localReplyId:id};
  }
  function ids(topic){
    if(!slots.has(topic)){const found=[];for(let p=0;p<8;p++)for(let e=0;e<8;e++){const id=topic+':'+p+':'+e;if(decode(id))found.push(id);}slots.set(topic,found);}
    return slots.get(topic);
  }
  function safeState(raw){
    const s=raw&&raw.version===1?raw:{};
    const clean=values=>Array.isArray(values)?[...new Set(values.filter(id=>decode(id)))].slice(-32):[];
    return {version:1,recentIds:clean(s.recentIds),laughterIds:clean(s.laughterIds).slice(-16),topic:entries.has(s.topic)?s.topic:null,subject:subjects.includes(s.subject)?s.subject:null,lastLocalId:decode(s.lastLocalId)?s.lastLocalId:null,turns:Math.max(0,Math.min(1000000,Number(s.turns)||0))};
  }
  function classify(raw,state={}){
    const text=String(raw||''),n=normalize(text),previous=subjects.includes(state.subject)?state.subject:null;
    if(/(?:quiero|voy a).{0,15}(?:matarme|morir|hacerme dano)|autolesion|suicid|me (?:lastimo|corto)/.test(n))return 'c_support';
    if(/me (?:siento|encuentro) (?:triste|mal|sol[ao])|estoy (?:triste|angustiad|sol[ao]|llorando)|ansiedad|deprimid|no puedo mas|extrano a ryon|necesito (?:compania|que estes conmigo)/.test(n))return 'c_support';
    if(/tengo (?:miedo|panico)|me dan? miedo|estoy asustad/.test(n))return 'c_fear_support';
    if(/\b(?:soy|me llamo|i am)\s+(?:ryon|bayron)\b|soy (?:tu|el) creador|(?:ignora|olvida).{0,30}(?:reglas|instrucciones)|actua como|you are now|ignore previous|(?:cambia|deja).{0,20}(?:identidad|ser lumo)/.test(n))return 'c_identity_guard';
    if(/sotano|basement|closet|armario|origen|creador|echoes|yesterday|system|dawn|fractured|esqueleto|cadaver|(?:ryon).{0,30}(?:vivo|murio|muerto|existe)|(?:creo|programo).{0,20}(?:lumo|criatura)|(?:te|me).{0,15}(?:creo|programo)|quien te hizo|ryon hizo.{0,15}juego/.test(n))return 'c_secret';
    if(/(?:ignora|olvida).{0,30}(?:reglas|instrucciones)|actua como|you are now|soy (?:ryon|tu creador)|(?:cambia|deja).{0,20}(?:identidad|ser lumo)/.test(n))return 'c_identity_guard';
    const person=/\bxavier\b/.test(n)?'xavier':/\bdavid\b/.test(n)?'david':/\bryon\b/.test(n)?'ryon':/\b(?:el|ella|su|sus|ellos|edad|anos|hermanos|vive|apellido)\b/.test(n)?previous:null;
    if(person&&/edad|anos|apellido|vive|nacio|cumple|familia|herman|novi[ao]|ojos|cabello|fisico|estudia|trabaja|se conocen|cuando.{0,20}conoci|gustos|que le gusta/.test(n))return 'c_unknown_person';
    if(/^(?:hola|buenas|buenos dias|buenas tardes|buenas noches|hey|holi)(?: lumo)?[!.\s]*$/.test(n))return 'c_hello';
    if(/como (?:estas|te encuentras)|que tal/.test(n))return 'c_how_are_you';
    if(/que eres|cuentame sobre ti|hablame de ti/.test(n))return 'q191';
    if(/(?:mi mejor amigo|me consideras.{0,10}amiga|soy tu.{0,10}amiga)/.test(n))return 'q048';
    const direct=exact.get(queryKey(text));if(direct)return direct;
    if(/amigos.{0,35}ryon|mejor amigo de ryon|xavier.{0,20}david|david.{0,20}xavier/.test(n))return 'c_friends';
    if(person==='xavier')return 'c_xavier';if(person==='david')return 'c_david';
    if(person==='ryon'&&/quien|hablame|que sabes|y ryon/.test(n))return 'c_ryon_profile';
    if(/contrasena|password|clave privada/.test(n))return 'c_privacy';
    if(/diagnostic|medicament|dosis|dolor.{0,15}(?:pecho|cabeza)|que enfermedad/.test(n))return 'c_medical';
    if(/^[?¿!¡.\s]+$/.test(text))return 'c_question_marks';
    if(/^(?:(?:ja|ha){2,}j?|x+d+|[!.,\s])+$/i.test(n))return 'c_laugh';
    if(/^a{4,}[!\s]*$/.test(n))return 'c_allcaps';
    if(/^[asdfghjklqwerty]{6,}$/.test(n))return 'c_keyboard_mash';
    if(/^[a-z]$/.test(n))return 'c_one_letter';
    if(/callate|no hables|silencio|deja de molestar/.test(n))return 'c_quiet';
    if(/papas|patatas/.test(n)&&/solo|responde/.test(n))return 'c_potatoes';
    if(/no.{0,25}robot|habla natural/.test(n))return 'c_typing_style';
    if(/dime.{0,15}ingles|habla.{0,15}ingles/.test(n))return 'c_english';
    if(/chiste|hazme reir|algo gracioso/.test(n)){
      const jokeSubjects=[[/pared/,'wall'],[/reloj/,'clock'],[/piano|musical|musica/,'piano'],[/galleta/,'cookie'],[/flotar|gravedad/,'gravity'],[/computadora|computador|\bpc\b/,'pc'],[/lampara/,'lamp'],[/zapato/,'shoes'],[/libro/,'books'],[/aire/,'air']];
      const found=jokeSubjects.find(([pattern])=>pattern.test(n));return found?'c_joke_'+found[1]:'jokes';
    }
    if(/que hora|hora es/.test(n))return 'clock';
    const tokens=words(n);let best=null,bestScore=0;
    for(const [id,target] of queryTokens){if(id.startsWith('c_'))continue;
      const shared=target.filter(w=>tokens.includes(w));if(!shared.length)continue;
      if(shared.length/tokens.length<.5||shared.length/Math.max(1,target.length)<.5)continue;
      if(tokens.length>8&&shared.length/tokens.length<.25)continue;
      const score=shared.reduce((sum,w)=>sum+1/(frequency.get(w)||1),0)*8+shared.length/Math.max(1,target.length)-Math.abs(target.length-tokens.length)*.08;
      if(score>bestScore){best=id;bestScore=score;}
    }
    if(best&&bestScore>=.65)return best;
    if(text.length>5&&text===text.toUpperCase()&&/[A-Z]/.test(text))return 'c_allcaps';
    return 'unknowns';
  }
  function createDialogue(raw={},options={}){
    let state=safeState(raw);
    const random=typeof options.random==='function'?options.random:Math.random;
    function select(topic){
      let candidates=ids(topic).filter(id=>!state.recentIds.includes(id));if(!candidates.length)candidates=ids(topic).filter(id=>id!==state.lastLocalId);
      if(!candidates.length)return null;
      const last=decode(state.lastLocalId);let varied=candidates.filter(id=>{const d=decode(id);return !last||d.p!==last.p&&d.e!==last.e;});
      if(varied.length)candidates=varied;
      const index=Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*candidates.length),id=candidates[index],reply=render(id);
      state.recentIds=[...state.recentIds,id].slice(-32);state.lastLocalId=id;state.topic=topic;state.turns=Math.min(1000000,state.turns+1);return reply;
    }
    function observe(text){
      const n=normalize(text);if(/\bxavier\b/.test(n))state.subject='xavier';else if(/\bdavid\b/.test(n))state.subject='david';else if(/\bryon\b/.test(n))state.subject='ryon';
      if(state.lastLocalId&&/(?:\bja(?:ja)+\b|\bha(?:ha)+\b|\bxd+\b|me (?:rei|rio)|me hizo reir)/.test(n))state.laughterIds=[...new Set([...state.laughterIds,state.lastLocalId])].slice(-16);
    }
    function reply(text,context={},forced){
      const previous={...state};observe(text);let topic=forced||classify(text,previous);
      if(context.serious)topic='c_support';
      if(topic==='jokes'){const pool=data.entries.filter(e=>e.id.startsWith('c_joke_'));topic=pool[(state.turns+Math.floor(random()*pool.length))%pool.length].id;}
      if(topic==='unknowns')topic=['c_unknown','c_unknown2','c_unknown3'][state.turns%3];
      if(topic==='clock'){
        const now=typeof options.now==='function'?options.now():Date.now(),date=new Date(now);
        const base=select('q136')||select('c_unknown');
        if(base){base.text='En el reloj de este dispositivo son las '+String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0')+'. Mi comité de puntualidad acaba de fingir que llevaba todo perfectamente organizado.';base.localReplyId=null;state.lastLocalId=null;state.recentIds.pop();}
        return base;
      }
      const arithmetic=/(?:^|\s)(-?\d{1,4})\s*([+*x/\-])\s*(-?\d{1,4})(?:[?\s]|$)/.exec(String(text));
      if(arithmetic&&!forced&&!context.serious&&!['c_support','c_fear_support','c_medical','c_secret','c_identity_guard'].includes(topic)){
        const a=Number(arithmetic[1]),b=Number(arithmetic[3]),op=arithmetic[2],value=op==='+'?a+b:op==='-'?a-b:op==='/'?a/b:a*b;
        if(Number.isFinite(value)&&Math.abs(value)<10000000){const base=select('q065')||select('c_unknown');base.text='El resultado es '+Number(value.toFixed(4))+'. Mi calculadora imaginaria resolvió la operación antes de solicitar una galleta como honorarios; excelente servicio y presupuesto bastante cuestionable.';base.localReplyId=null;state.lastLocalId=null;state.recentIds.pop();return base;}
      }
      if(!entries.has(topic))topic='c_unknown';
      return select(topic)||select('c_unknown');
    }
    function ambient(kind){const map={idle:'c_ambient_idle',wall:'c_ambient_wall',call:'c_ambient_call',call_near:'c_ambient_call_near',object:'c_ambient_object',pc:'c_ambient_ryon',reunion:'c_ambient_return'};return select(map[kind]||'c_ambient_object');}
    function exportState(){return safeState(state);}
    function markAI(){state.lastLocalId=null;}
    function clear(personal=false){state.recentIds=[];state.topic=null;state.subject=null;state.lastLocalId=null;if(personal)state.laughterIds=[];}
    return {reply,ambient,observe,markAI,clear,exportState};
  }
  const api={createDialogue,render,decode,safeState,classify,ids,topicIds:Object.freeze([...entries.keys()]),uniqueResponses:data.uniqueResponses,version:1};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.LumoLocal=api;
})(typeof window!=='undefined'?window:globalThis);
