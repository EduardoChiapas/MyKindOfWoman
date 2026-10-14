'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {KEY:OBJECT_KEY,create:createObjects,VERSION}=require('../home-objects.js');
const root=path.join(__dirname,'..'),source=name=>fs.readFileSync(path.join(root,name),'utf8');
const file=source('tests/home-engine.test.cjs');
const fixture=vm.runInNewContext(file.slice(0,file.indexOf('\nconst mounted='))+'\nfixture;',{require,__dirname,console,AbortController,Promise});
const EFFECTS=new Set(['water','bell','open','close','box','switch','paper','card','cloth','clock','squeak','match','miss','success']);

test('continuing an older bedroom position does not replay waking, while a genuinely new HOME still begins there',()=>{
  const key=require('../home-progress.js').KEY;
  const saved={version:2,events:['pc_found'],visits:['friskRoom','hallway'],position:{room:'friskRoom',x:192,y:181,direction:'down'}};
  const f=fixture({[key]:JSON.stringify(saved)},{keepWake:true});
  assert.equal(f.c.currentRoom,'friskRoom');assert.equal(f.c.gameState,'PLAYING');assert.equal(f.calls.native.length,0);
  assert.equal(f.c.HomeProgress.getState().interactions.home_wake_seen,1);
  const fresh=fixture({},{keepWake:true});assert.equal(fresh.c.gameState,'DIALOG');assert.match(fresh.calls.native[0],/Despiertas/);
});

test('examining a room object clears the ambient comment before the native dialogue is drawn',()=>{
  const f=fixture();f.c.LumoUI.bubble({text:'El jardín está tranquilo.'});
  const toast=f.document.querySelector('.lumo-toast');assert.equal(toast.hidden,false);
  f.c.showDialog('* Observas el mueble.');assert.equal(f.c.gameState,'DIALOG');assert.equal(toast.hidden,true);
  assert.equal(f.calls.native.at(-1),'* Observas el mueble.');
});
function enter(f,room,spawn=[120,120]){f.c.applyRoomChange({target:room,spawn,facing:'up'});f.c.gameState='PLAYING';f.c.HomeStory.roomChanged();}
function inspect(f,room,id,spawn){enter(f,room,spawn);f.c.findInteraction=()=>({id});f.c.checkInteraction();}
function effects(f){const sounds=[];f.c.UndertaleAudio.effect=(name,options)=>{sounds.push({name,options});return EFFECTS.has(name);};return sounds;}
function click(f,label){const node=f.document.querySelector('.home-story-panel')?.querySelectorAll('button').find(item=>item.textContent===label);assert.ok(node,label);node.click();}
function bookFixture(reducedMotion=false){
  const f=fixture(),document=f.document,book=document.getElementById('interactive-book'),content=document.createElement('div');content.className='book-content';book.append(content);
  for(const [tag,text]of [['p','Algunas páginas están en blanco. Otras conservan una flor seca.'],['blockquote','«No hace falta conocer el final para guardar el comienzo».']]){const node=document.createElement(tag);node.textContent=text;content.append(node);}
  const close=document.createElement('button');close.id='btn-close-book';close.textContent='CERRAR';content.append(close);
  const create=document.createElement;document.createElement=tag=>{const node=create(tag);node.classList.remove=(...names)=>names.forEach(name=>node.classList.toggle(name,false));return node;};
  let next=0;const timers=new Map();f.c.setTimeout=fn=>{timers.set(++next,fn);return next;};f.c.clearTimeout=id=>timers.delete(id);
  f.c.HouseExperience.reducedMotion=reducedMotion;const sounds=effects(f);
  vm.runInContext(source('home-book.js'),f.context);assert.equal(f.c.HomeBook.open(),true);book.classList.remove('hidden');
  const get=selector=>book.querySelector(selector),flush=()=>{const first=timers.entries().next().value;if(first){timers.delete(first[0]);first[1]();}};
  return {...f,book,get,timers,sounds,flush,api:f.c.HomeBook};
}

test('real original-room dispatch changes its own drawers, cabinet, faucet and fridge, with valid original effects and stable PC data',()=>{
  const f=fixture({'fnf-save':'fnf-original','mkw:pc:v1':'desktop-original'}),sounds=effects(f);
  for(const [room,id,spawn,opened,closed]of [['entrance','entrance_console',[260,101],'box','box'],['torielRoom','toriel_wardrobe',[120,105],'open','close'],['kitchen','kitchen_sink',[75,110],'water','close'],['kitchen','kitchen_fridge',[65,110],'open','close']]){
    inspect(f,room,id,spawn);assert.equal(f.c.HomeObjectsState.visual(id).value,true,id);
    const first=sounds.at(-1);assert.equal(first.name,opened,id);
    assert.ok(EFFECTS.has(first.name));f.c.closeInteraction();f.c.checkInteraction();assert.equal(f.c.HomeObjectsState.visual(id).value,false,id);assert.equal(sounds.at(-1).name,closed,id);f.c.closeInteraction();
  }
  assert.equal(f.values.get('fnf-save'),'fnf-original');assert.equal(f.values.get('mkw:pc:v1'),'desktop-original');assert.equal(f.c.HomeProgress.has('home_complete'),false);
});
test('object format one migrates on a real original toggle while preserving the previous wing and excluding injected story keys',()=>{
  const raw=JSON.stringify({version:1,values:{bathroom_sink:true,reading_origami:true,home_complete:true,unlock_basement:'yes'}});
  const f=fixture({[OBJECT_KEY]:raw,'fnf-save':'intact'});assert.equal(VERSION,2);assert.equal(f.c.HomeObjectsState.visual('bathroom_sink').value,true);
  inspect(f,'kitchen','kitchen_fridge',[65,110]);const data=JSON.parse(f.values.get(OBJECT_KEY));
  assert.equal(data.version,2);assert.equal(data.values.bathroom_sink,true);assert.equal(data.values.reading_origami,true);assert.equal(data.values.kitchen_fridge,true);
  assert.equal('home_complete' in data.values,false);assert.equal('unlock_basement' in data.values,false);assert.equal(f.values.get('fnf-save'),'intact');
  const restored=createObjects({storage:f.storage,reducedMotion:true});assert.equal(restored.visual('kitchen_fridge').phase,1);assert.equal(restored.visual('reading_origami').phase,1);
});
test('unknown object formats block actual original-room effects and keep the save byte-for-byte after interaction and reset',()=>{
  for(const version of [3,99]){
    const raw=JSON.stringify({version,values:{kitchen_fridge:true},future:['keep this']}),f=fixture({[OBJECT_KEY]:raw}),sounds=effects(f);
    inspect(f,'kitchen','kitchen_fridge',[65,110]);assert.equal(f.c.HomeObjectsState.readOnly,true);assert.equal(sounds.length,0);
    assert.equal(f.c.HomeObjectsState.reset(),false);assert.equal(f.values.get(OBJECT_KEY),raw);assert.equal(f.c.HomeProgress.canEnter('basementHallway'),false);
  }
});
test('the dresser still awards its ribbon once before decorative drawers, and the art reads the real claim',()=>{
  const f=fixture(),sounds=effects(f);enter(f,'hallway',[170,91]);const feet=f.c.getPlayerHitbox(),actor=f.c.LumoGame.actor;
  actor.cancelTask('test');actor.x=feet.x+feet.width/2-36;actor.y=feet.y+feet.height/2;actor.placed=true;actor.fade=1;actor.fadePhase='in';f.c.LumoGame.open();f.c.LumoUI.close({sound:false});
  inspect(f,'friskRoom','frisk_dresser',[180,110]);
  assert.equal(f.c.LumoGame.hasClaimed('frisk_dresser'),true);assert.equal(f.c.LumoGame.getState().world.inventory.ribbon,1);
  assert.equal(f.c.HomeObjectsState.visual('frisk_dresser').value,true);f.c.closeInteraction();f.c.checkInteraction();
  assert.equal(f.c.LumoGame.getState().world.inventory.ribbon,1);assert.equal(f.c.HomeObjectsState.visual('frisk_dresser').value,false);assert.equal(f.c.LumoGame.hasClaimed('toriel_dresser'),false);
  assert.ok(sounds.every(item=>EFFECTS.has(item.name)));assert.equal(f.c.HomeProgress.has('lumo_met'),true);
});
test('solo cooking uses neutral words and records an actual meal without inventing a shared conversation',()=>{
  const f=fixture();inspect(f,'kitchen','kitchen_counter',[113,111]);const body=f.document.querySelector('.home-story-panel');
  assert.match(body.textContent,/COCINAR EN CASA/);assert.doesNotMatch(body.textContent,/Lumo|LUMO/);
  for(const label of ['Mezclar despacio','Una pizca','Horneado suave'])click(f,label);
  assert.doesNotMatch(body.textContent,/Lumo|LUMO/);assert.equal(f.c.HomeProgress.has('cooked'),true);assert.ok(f.c.LumoMind.getState().events.includes('cooked'));
  assert.equal(f.c.LumoMind.getState().localActions.some(item=>item.id==='cook'),false);
});
test('knowing Lumo does not invent shared cooking when he is currently hidden or unplaced',()=>{
  const f=fixture();f.c.LumoMind.act('meet');f.c.HomeProgress.record('lumo_met');enter(f,'kitchen',[113,111]);
  f.c.LumoGame.actor.placed=false;f.c.HomeStory.interact({id:'kitchen_counter'});
  assert.match(f.document.querySelector('.home-story-panel').textContent,/COCINAR EN CASA/);
  for(const label of ['Mezclar despacio','Una pizca','Horneado suave'])click(f,label);
  assert.equal(f.c.LumoMind.getState().localActions.some(item=>item.id==='cook'),false);assert.equal(f.c.HomeProgress.has('cooked'),true);
});
test('opening garden care makes no watering sound; the actual watering choice plays it exactly once',()=>{
  const f=fixture(),sounds=effects(f);inspect(f,'garden','garden_watering_can',[182,171]);
  assert.equal(sounds.filter(item=>item.name==='water').length,0,'Opening the care panel cannot pretend watering happened.');
  assert.equal(f.c.HomeProgress.has('flower_watered'),false);click(f,'REGAR CON CUIDADO');
  assert.equal(sounds.filter(item=>item.name==='water').length,1);assert.equal(f.c.HomeProgress.has('flower_watered'),true);
});
test('the relocated piano keeps the four-note activity without creating a Lumo hum action or a heard-song memory',()=>{
  const f=fixture();assert.ok(f.c.rooms.readingRoom.interactives.some(item=>item.id==='home_piano'));
  inspect(f,'readingRoom','home_piano',[140,104]);for(const label of ['1 · DO','2 · MI','3 · RE','4 · SOL'])click(f,label);
  const state=f.c.LumoMind.getState();assert.equal(f.c.HomeProgress.has('home_melody_found'),true);assert.equal(state.localActions.some(item=>item.id==='hum'),false);
  assert.equal(state.events.includes('hummed_melody'),false);assert.equal(state.memories.some(item=>item.id==='hummed_melody'),false);
  assert.doesNotMatch(f.document.querySelector('.home-story-panel').textContent,/Lumo tararea/);
});
test('retired decoration layers and the relocated piano leave the original rooms untouched',()=>{
  const f=fixture(),draws=[],ctx={save(){},restore(){},translate(){},scale(){},fillRect:()=>assert.fail('No synthetic patches belong over the original art'),drawImage:(...args)=>draws.push(args)};
  for(const [room,width,height]of [['entrance',320,240],['livingRoom',320,240],['hallway',745,156],['friskRoom',239,234],['torielRoom',227,234],['kitchen',196,163]]){
    f.c.HomeRoomDetails.draw(ctx,room,{x:0,y:0},false,null,{complete:true,naturalWidth:width,naturalHeight:height});
    assert.equal(draws.length,0,room+' retains its original closed appearance');
  }
  assert.equal(f.c.HomeWorld.drawPiano(ctx,{x:0,y:0}),false);assert.equal(f.c.HomeStory.draw(ctx,{x:0,y:0}),false);assert.equal(draws.length,0);
});

test('piano relocation frees its former floor and rejects ghost interactions without erasing musical memories',()=>{
  const key=require('../home-progress.js').KEY,events=['lumo_met','piano_played','home_melody_found','photo_music'];
  const f=fixture({[key]:JSON.stringify({version:2,events,photos:['photo_music'],visits:['livingRoom']})});
  enter(f,'livingRoom',[80,115]);assert.ok(!f.c.rooms.livingRoom.interactives.some(item=>item.id==='home_piano'));
  assert.ok(f.c.canOccupy(f.c.player.x,f.c.player.y),'The former piano footprint is walkable');
  assert.equal(f.c.HomeStory.interact({id:'home_piano'}),false);assert.equal(f.document.querySelector('.home-story-panel'),null);
  for(const event of events)assert.equal(f.c.HomeProgress.has(event),true,event);
  assert.ok(f.c.HomeProgress.getState().photos.includes('photo_music'));assert.equal(f.c.HomeProgress.has('home_complete'),false);
});
test('the original book changes content exactly at its hinge midpoint, rejects rapid turns and never advances itself',()=>{
  const f=bookFixture();assert.match(f.get('.home-book-leaf').textContent,/flor seca/);assert.equal(f.timers.size,0);
  assert.equal(f.api.flip(1),true);assert.equal(f.api.flip(1),false);assert.equal(f.api.flip(-1),false);assert.match(f.get('.home-book-leaf').textContent,/flor seca/);
  f.flush();assert.match(f.get('.home-book-leaf').textContent,/guardar el comienzo/);assert.equal(f.api.flip(-1),false);
  f.flush();assert.equal(f.timers.size,0);assert.equal(f.api.flip(1),false);assert.equal(f.api.flip(-1),true);f.flush();f.flush();assert.match(f.get('.home-book-leaf').textContent,/flor seca/);
  assert.equal(f.sounds.filter(item=>item.name==='paper').length,2);assert.equal(f.c.HomeProgress.has('memory_collection'),false);
});
test('closing a book turn cancels pending work; reopening and reduced motion retain manual two-page navigation',()=>{
  const f=bookFixture();f.api.flip(1);assert.equal(f.timers.size,1);f.api.close();assert.equal(f.timers.size,0);f.api.open();assert.match(f.get('.home-book-leaf').textContent,/flor seca/);
  f.c.HouseExperience.reducedMotion=true;assert.equal(f.api.flip(1),true);assert.equal(f.timers.size,0);assert.match(f.get('.home-book-leaf').textContent,/guardar el comienzo/);
  assert.equal(f.api.flip(1),false);assert.equal(f.api.flip(-1),true);assert.match(f.get('.home-book-leaf').textContent,/flor seca/);assert.equal(f.c.HomeProgress.has('home_complete'),false);
});
