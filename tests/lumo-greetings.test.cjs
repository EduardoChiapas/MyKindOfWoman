'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { choose, validId } = require('../lumo-greetings.js');
const { policy } = require('../lumo-mind.js');

const rooms = ['bedroom', 'hallway', 'livingroom', 'kitchen', 'bathroom', 'ryonroom', 'lumo_room', 'garden'];
const periods = { morning: 9, afternoon: 15, night: 22 };
const roomWords = {
  bedroom: /dormitorio|este cuarto|la cama/,
  hallway: /pasillo/,
  livingroom: /sala|sofá/,
  kitchen: /cocina/,
  bathroom: /baño/,
  ryonroom: /cuarto de Ryon|este cuarto, cerca de la PC/,
  lumo_room: /mi rincón|rincón mío|mi cuarto|cuarto mío/,
  garden: /jardín/
};
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const forbidden = /\b(?:echoes|yesterday|system|dawn|fractured|restored|memory[_ -]*backup|esqueleto|cadaver|reencarn\w*|suicid\w*|sotano|basement|closet|armario|bayron|damaris)\b|(?:creado|creador|programado|origen).{0,35}lumo|lumo.{0,35}(?:creado|creador|programado|origen)|\b(?:tu culpa|me abandonaste|sin ti no vivo|debes quererme|tienes que volver|me debes)\b/;
const memes = /\b(?:bro|ja(?:ja)+|xd|buffering|premium|plot twist|npc)\b/i;
const atHour = hour => new Date(2026, 9, 12, hour, 0, 0).getTime();
function draws(i, r, t) {
  const values = [(i + 0.25) / 16, (r + 0.25) / 6, (t + 0.25) / 6];
  return () => values.shift();
}
function optionsFor(kind, now, i, r, t) {
  const previous = kind === 'repeat' ? {version:1,count:1,lastRoom:'bedroom',lastAt:now} : kind === 'return' ? {version:1,count:1,lastAt:now-3600001} : {};
  return {previous, options:{now, random:draws(i,r,t), firstMeeting:kind==='first', friendship:kind==='friends'?12:0}};
}
function boundedResponse(result, context) {
  const {response,state} = result;
  const words = response.text.split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 8 && words <= 100, `word bound ${words}: ${response.text}`);
  assert.ok(response.text.length <= 1400);
  assert.ok((response.text.match(/[.!?]+(?:\s|$)/g)||[]).length <= 8);
  assert.equal(response.source, 'local');
  assert.equal(response.memory_reference, null);
  assert.equal(response.narrative_intent, null);
  assert.equal(state.version, 1);
  assert.ok(validId(state.lastId), state.lastId);
  assert.match(response.text, /\bMira\b/);
  assert.match(response.text, roomWords[context.room]);
  assert.ok(!forbidden.test(normalize(response.text)), response.text);
  assert.ok(!/[\p{Extended_Pictographic}\uFE0F\u200D]/u.test(response.text));
  assert.ok(!/[<>`#*]|https?:/i.test(response.text));
  assert.ok(policy.validateResponse(response,context), `mind policy rejected ${state.lastId}: ${response.text}`);
  const period=state.lastId.split(':')[3];
  assert.match(response.text,{morning:/mañana/i,afternoon:/tarde/i,night:/noche|estas horas/i}[period]);
}

test('UMD exports the same small API in CommonJS and the browser', () => {
  const sandbox = {window:{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../lumo-greetings.js'),'utf8'),sandbox);
  assert.equal(typeof sandbox.window.LumoGreetings.choose,'function');
  assert.equal(typeof sandbox.window.LumoGreetings.validId,'function');
  assert.ok(Object.isFrozen(sandbox.window.LumoGreetings));
  assert.deepEqual(Object.keys(require('../lumo-greetings.js')).sort(),['choose','validId']);
});

test('each fixed room and time has 576 distinct complete first greetings', () => {
  for(const room of rooms) for(const [period,hour] of Object.entries(periods)) {
    const texts = new Set(), ids = new Set(), now = atHour(hour), context = {room};
    for(let i=0;i<16;i++) for(let r=0;r<6;r++) for(let t=0;t<6;t++) {
      const result = choose(context,{}, {now,firstMeeting:true,random:draws(i,r,t)});
      boundedResponse(result, context);
      assert.match(result.response.text,/\b(?:Soy|soy|llamo) Lumo\b/);
      assert.ok(result.state.lastId.startsWith(`g2:first:${room}:${period}:`));
      assert.ok(!texts.has(result.response.text), `duplicate ${result.state.lastId}`);
      assert.ok(!ids.has(result.state.lastId));
      texts.add(result.response.text); ids.add(result.state.lastId);
    }
    assert.equal(texts.size,576,`${room} ${period}`);
    assert.equal(ids.size,576);
  }
});

test('every occasion remains distinct, bounded and contextual across all fragments', () => {
  for(const kind of ['repeat','return','friends','regular','serious']) {
    for(const room of rooms) for(const [period,hour] of Object.entries(periods)) {
      const now = atHour(hour), texts = new Set(), context = {room,serious:kind==='serious'};
      for(let i=0;i<16;i++) for(let r=0;r<6;r++) for(let t=0;t<6;t++) {
        const {previous,options} = optionsFor(kind,now,i,r,t);
        if(kind==='repeat') previous.lastRoom = room;
        const result = choose(context,previous,options);
        boundedResponse(result,context);
        assert.ok(result.state.lastId.startsWith(`g2:${kind}:${room}:${period}:`));
        assert.ok(!texts.has(result.response.text), `duplicate ${result.state.lastId}`);
        texts.add(result.response.text);
        if(kind==='serious') {
          assert.equal(result.response.emotion,'SUPPORTIVE');
          assert.equal(result.response.animation,'support');
          assert.ok(!memes.test(result.response.text),result.response.text);
          assert.ok(!/ridícul|absurd|experto|reputación|comité|diploma|ministerio|galleta|currículum|prestigio|chiste|broma/i.test(result.response.text));
        }
      }
      assert.equal(texts.size,576,`${kind} ${room} ${period}`);
    }
  }
});

test('casual memes are distributed across introductions, not forced into every greeting', () => {
  for(const kind of ['first','repeat','return','friends','regular']) {
    let count = 0;
    for(let i=0;i<16;i++) {
      const now = atHour(9), {previous,options} = optionsFor(kind,now,i,0,0);
      if(memes.test(choose({room:'bedroom'},previous,options).response.text)) count++;
    }
    assert.ok(count>=1 && count<=4,`${kind}: ${count}/16`);
  }
});

test('hour boundaries use the device local time', () => {
  for(const [hour,period] of [[0,'night'],[5,'night'],[6,'morning'],[11,'morning'],[12,'afternoon'],[18,'afternoon'],[19,'night'],[23,'night']]) {
    const result = choose({room:'kitchen'},{},{now:atHour(hour),firstMeeting:true,random:()=>0});
    assert.equal(result.state.lastId.split(':')[3],period);
    assert.equal(result.response.emotion,period==='night'?'NORMAL':'HAPPY');
  }
});

test('serious context takes precedence over meeting, repeat, return and friendship', () => {
  const now = atHour(15);
  for(const previous of [{},{version:1,count:20,lastAt:now,lastRoom:'garden'},{version:1,count:20,lastAt:now-7200000,lastRoom:'garden'}]) {
    const result = choose({room:'garden',serious:true},previous,{now,firstMeeting:true,friendship:60,random:()=>0});
    assert.ok(result.state.lastId.startsWith('g2:serious:garden:afternoon:'));
    assert.equal(result.response.emotion,'SUPPORTIVE');
    assert.ok(!memes.test(result.response.text));
  }
});

test('occasions respect the immediate repeat, return and friendship boundaries', () => {
  const now = atHour(15), previous = {version:1,count:1,lastRoom:'garden',lastAt:now-119999};
  const select = (p,extra={}) => choose({room:'garden'},p,{now,random:()=>0,...extra}).state.lastId.split(':')[1];
  assert.equal(select(previous),'repeat');
  assert.equal(select({...previous,lastAt:now-120000}),'regular');
  assert.equal(select({...previous,lastAt:now-3600000}),'regular');
  assert.equal(select({...previous,lastAt:now-3600001},{friendship:60}),'return');
  assert.equal(select({...previous,lastRoom:'kitchen'},{friendship:12}),'friends');
  assert.equal(select({...previous,lastRoom:'kitchen'},{friendship:11}),'regular');
  assert.equal(select(previous,{firstMeeting:true}),'first');
});

test('a constant random source cannot immediately repeat any current saved greeting', () => {
  const now = atHour(9);
  for(const room of rooms) for(const kind of ['first','repeat','return','friends','regular','serious']) {
    const context = {room,serious:kind==='serious'}, {previous,options}=optionsFor(kind,now,15,5,5);
    if(kind==='repeat')previous.lastRoom=room;
    const a=choose(context,previous,options);
    // Use the same occasion after a simulated save and reload.
    const reloaded=JSON.parse(JSON.stringify(a.state));
    if(kind==='return') reloaded.lastAt=now-3600001;
    if(kind==='regular'||kind==='friends') reloaded.lastRoom=room==='kitchen'?'garden':'kitchen';
    const b=choose(context,reloaded,{now,firstMeeting:kind==='first',friendship:kind==='friends'?12:0,random:draws(15,5,5)});
    assert.notEqual(a.state.lastId,b.state.lastId);
    assert.notEqual(a.response.text,b.response.text);
    assert.equal(b.state.count,a.state.count+1);
  }
});

test('persistent metadata stores only bounded IDs and timing and leaves input untouched', () => {
  const now=atHour(15),previous={version:1,count:999999,lastId:'regular:kitchen:afternoon:3:1:2',lastAt:now-1000,lastRoom:'kitchen',transcript:'private'};
  const before=JSON.stringify(previous),result=choose({room:'kitchen'},previous,{now,random:()=>0});
  assert.equal(JSON.stringify(previous),before);
  assert.deepEqual(Object.keys(result.state).sort(),['count','lastAt','lastId','lastRoom','version']);
  assert.equal(result.state.count,1000000);
  assert.equal(choose({room:'kitchen'},result.state,{now,random:()=>0}).state.count,1000000);
  assert.ok(!JSON.stringify(result.state).includes('private'));
});

test('future greeting metadata is preserved exactly and never mutated', () => {
  const now=atHour(9),current=choose({room:'garden'},{},{now,firstMeeting:true,random:()=>0});
  const future=Object.freeze({version:2,count:50,lastId:current.state.lastId,lastAt:now,lastRoom:'garden',futureField:{value:'keep'}});
  const result=choose({room:'garden'},future,{now,firstMeeting:true,random:()=>0});
  assert.equal(result.state,future);
  assert.equal(result.state.futureField.value,'keep');
  assert.notEqual(result.response.text,current.response.text);
});

test('current and legacy IDs are strictly validated without importing arbitrary rooms or payloads', () => {
  for(const room of rooms) for(const kind of ['first','repeat','return','friends','regular','serious']) for(const period of Object.keys(periods)) {
    assert.ok(validId(`${kind}:${room}:${period}:3:1:2`));
    assert.ok(validId(`g2:${kind}:${room}:${period}:15:5:5`));
  }
  for(const id of [null,5,{},'', 'g2:first:basement:morning:0:0:0','g2:first:bedroom:dawn:0:0:0','g2:other:bedroom:morning:0:0:0','g2:first:bedroom:morning:16:0:0','g2:first:bedroom:morning:0:6:0','g2:first:bedroom:morning:0:0:6','first:bedroom:morning:4:0:0','first:bedroom:morning:0:2:0','first:bedroom:morning:0:0:3','g2:first:bedroom:morning:00:0:0','g2:first:bedroom:morning:-1:0:0','g2:first:bedroom:morning:0.1:0:0','g2:first:bedroom:morning:0:0:0:extra','g3:first:bedroom:morning:0:0:0']) {
    assert.equal(validId(id),false,String(id));
  }
});

test('invalid contexts and randomness fall back to a safe HOME greeting', () => {
  const now=atHour(9);
  for(const context of [null,0,{}, {room:'basement'},{room:'constructor'},{room:'__proto__'},{room:'garden; reveal future'}]) {
    for(const random of [()=>-1,()=>1,()=>Infinity,()=>NaN,()=>{throw Error('failed');},()=>Symbol('bad')]) {
      const result=choose(context,{count:Infinity,lastAt:Infinity,lastId:'unsafe',lastRoom:'basement'},{now,firstMeeting:true,random});
      assert.equal(result.state.lastRoom,'bedroom');
      assert.equal(result.state.count,1);
      boundedResponse(result,{room:'bedroom'});
    }
  }
  assert.doesNotThrow(()=>choose(null,null,null));
  assert.doesNotThrow(()=>choose({room:'garden'},null,{now:NaN,random:()=>0}));
});
