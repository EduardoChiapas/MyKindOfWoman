'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),source=name=>fs.readFileSync(path.join(root,name),'utf8');
// Reuse real UI/engine adapters; load only fixture definitions, never their tests.
const uiFile=source('tests/lumo-ui-compact.test.cjs');
const uiFixture=vm.runInNewContext(uiFile.slice(0,uiFile.indexOf("\ntest('"))+'\nfixture;',{require,__dirname,console,AbortController,Promise});
const engineFile=source('tests/home-engine.test.cjs');
const engineFixture=vm.runInNewContext(engineFile.slice(0,engineFile.indexOf('\nconst mounted='))+'\nfixture;',{require,__dirname,console,AbortController,Promise});
function memory(){
  const ui=uiFixture(),document=ui.document,proto=Object.getPrototypeOf(document.body),paint=[];
  proto.remove=function(){const list=this.parentNode?.children;if(list)list.splice(list.indexOf(this),1);this.parentNode=null;};
  proto.getContext=function(){return {clearRect(){},fillRect(...values){paint.push(values);},drawImage(){},measureText:()=>({width:0})};};
  const timers=new Map(),sounds=[],completed=[],pauses=[];let next=0;
  const math=Object.create(Math);math.random=()=>.9999; // Stable deal: pairs 0/1, 2/3, 4/5, 6/7.
  const window={UndertaleAudio:{effect(name,options){sounds.push({name,options});return true;}}};
  vm.runInNewContext(source('lumo-activities.js'),{window,document,Math:math,setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)});
  window.LumoActivities.mount({pause:value=>pauses.push(value),resumeFocus(){},complete:(...values)=>completed.push(values),play(){throw Error('Original effect should not overlap with fallback.');}});
  const api=window.LumoActivities,get=selector=>document.querySelector(selector),buttons=()=>get('.lumo-memory-grid').querySelectorAll('button');
  const key=code=>get('.lumo-memory').dispatchEvent({type:'keydown',code,preventDefault(){}});
  function flush(){for(const [id,fn]of [...timers]){timers.delete(id);fn();}}
  return {api,get,buttons,key,flush,timers,sounds,completed,pauses,document,paint};
}
function enter(f,room,spawn){f.c.applyRoomChange({target:room,spawn,facing:'up'});f.c.gameState='PLAYING';f.c.HomeStory.roomChanged();}
function storyClick(f,label){const node=f.document.querySelector('.home-story-panel').querySelectorAll('button').find(item=>item.textContent===label);assert.ok(node,label);node.click();}

test('the memory game reveals actual pixel faces, ignores repeated cards, and waits for manual confirmation of all four pairs',()=>{
  const f=memory();f.api.start();assert.equal(f.api.active,true);assert.deepEqual(f.pauses,[true]);
  const cards=f.buttons();assert.equal(cards.length,8);assert.equal(cards[0].querySelectorAll('canvas').length,2);assert.ok(f.paint.length>60);
  cards[0].click();cards[0].click();assert.equal(f.get('.lumo-memory-status').textContent,'0 / 4 parejas · 0 intentos');
  for(const [a,b]of [[0,1],[2,3],[4,5],[6,7]]){cards[a].click();cards[b].click();}
  assert.ok(cards.every(card=>card.classList.contains('is-matched')));assert.equal(f.completed.length,0);assert.equal(f.timers.size,0,'A win never auto-closes the game.');
  cards[0].click();f.key('Enter');assert.equal(f.api.active,false);assert.deepEqual(f.pauses,[true,false]);
  assert.equal(f.completed.length,1);assert.equal(f.completed[0][0],'memory');assert.equal(f.completed[0][1].turns,4);
  f.api.cancel();assert.equal(f.completed.length,1);assert.equal(f.sounds.filter(value=>value.name==='success').length,1);
});
test('a mismatch blocks a third card, then restores hidden faces without awarding completion',()=>{
  const f=memory();f.api.start();const cards=f.buttons();cards[0].click();cards[2].click();cards[4].click();
  assert.equal(cards[4].classList.contains('is-visible'),false);assert.equal(cards[0].classList.contains('is-visible'),true);
  f.flush();assert.equal(cards[0].classList.contains('is-visible'),false);assert.equal(cards[2].classList.contains('is-visible'),false);
  assert.match(f.get('.lumo-memory-status').textContent,/1 intentos/);assert.equal(f.completed.length,0);assert.ok(f.sounds.some(value=>value.name==='miss'));
  f.key('Escape');assert.equal(f.completed.length,0);assert.equal(f.api.active,false);
});
test('cancelled flip callbacks cannot change a later deal; keyboard and touch clicks use the same guarded game input',()=>{
  const f=memory();f.api.start();f.buttons()[0].click();f.buttons()[2].click();const delayed=[...f.timers.values()][0];
  f.api.cancel();f.api.start();f.buttons()[4].click();delayed();assert.equal(f.buttons()[4].classList.contains('is-visible'),true);
  f.buttons()[0].focus();f.key('ArrowRight');assert.equal(f.document.activeElement,f.buttons()[1]);
  f.key('ArrowDown');assert.equal(f.document.activeElement,f.buttons()[5]);
  f.key('Escape');assert.equal(f.timers.size,0);assert.equal(f.completed.length,0);
  assert.ok(f.sounds.every(value=>value.options.ui===true),'The effects are allowed while this activity pauses movement.');
});
test('actual piano presses update the score without auto-playing notes and retain the HOME motif',()=>{
  const f=engineFixture();enter(f,'livingRoom',[218,169]);assert.equal(f.c.HomeStory.interact({id:'home_piano'}),true);
  assert.equal(f.document.querySelector('.home-activity-art').width,96);const keys=f.document.querySelector('.home-piano-keys').querySelectorAll('button');
  assert.equal(f.calls.sound.length,0);for(const key of keys)key.click();
  assert.equal(f.c.HomeProgress.has('home_melody_found'),true);assert.equal(f.calls.sound.filter(value=>value==='note').length,4);
  assert.ok(keys.every(key=>!key.classList.contains('is-playing')),'Reduced motion does not leave momentary keys highlighted.');
  assert.equal(f.c.gameState,'HOME_ACTIVITY');storyClick(f,'VOLVER · X / ESC');assert.equal(f.c.gameState,'PLAYING');
});
test('cooking illustrations follow real choices; abandoning a recipe awards nothing and a replay starts clean',()=>{
  const f=engineFixture();enter(f,'kitchen',[113,111]);f.c.HomeStory.interact({id:'kitchen_counter'});storyClick(f,'Mezclar despacio');storyClick(f,'VOLVER · X / ESC');
  assert.equal(f.c.HomeProgress.has('cooked'),false);f.c.HomeStory.interact({id:'kitchen_counter'});
  for(const label of ['Mezclar con entusiasmo','Un poco más de canela','Más crujiente'])storyClick(f,label);
  assert.equal(f.c.HomeProgress.getState().recipe,'extra_cinnamon');assert.equal(f.c.HomeProgress.has('cooked'),true);
  assert.ok(f.document.querySelector('.home-activity-art'));assert.equal(f.c.gameState,'HOME_ACTIVITY');storyClick(f,'VOLVER · X / ESC');assert.equal(f.c.gameState,'PLAYING');
});
test('watering closes the illustrated panel, persists its real growth, and offers no repeat reward on reopening',()=>{
  const f=engineFixture();enter(f,'garden',[182,171]);f.c.HomeStory.interact({id:'garden_flower'});storyClick(f,'REGAR CON CUIDADO');
  assert.equal(f.c.HomeProgress.has('flower_watered'),true);assert.equal(f.document.querySelector('.home-story-panel'),null);assert.equal(f.c.gameState,'DIALOG');
  f.c.closeInteraction();f.c.HomeStory.interact({id:'garden_flower'});
  assert.ok(f.document.querySelector('.home-activity-art'));assert.equal(f.document.querySelector('.home-story-body').querySelectorAll('button').length,0);
  assert.equal(f.c.HomeProgress.canEnter('basementHallway'),false);
});
test('bedroom plants and corridor flowers remain their own objects instead of watering the distant garden',()=>{
  const f=engineFixture();enter(f,'friskRoom',[108,120]);
  for(const id of ['frisk_little_plant','frisk_corner_plant'])assert.equal(f.c.HomeStory.interact({id}),false);
  enter(f,'hallway',[245,105]);assert.equal(f.c.HomeStory.interact({id:'hallway_flowers'}),false);
  assert.equal(f.document.querySelector('.home-story-panel'),null);assert.equal(f.c.HomeProgress.has('flower_watered'),false);
  assert.equal(f.c.gameState,'PLAYING');enter(f,'garden',[182,171]);
  assert.equal(f.c.HomeStory.interact({id:'garden_watering_can'}),true);storyClick(f,'REGAR CON CUIDADO');
  assert.equal(f.c.HomeProgress.has('flower_watered'),true,'Only the actual garden action records care.');
});
test('album page buttons turn only unlocked memories manually, with reverse direction and unchanged narrative gates',()=>{
  const f=engineFixture();f.c.HomeProgress.record('photo_window');f.c.HomeProgress.record('photo_music');enter(f,'friskRoom',[108,120]);
  f.c.HomeStory.interact({id:'frisk_bookshelf'});assert.ok(f.document.querySelector('.home-page-forward'));storyClick(f,'PÁGINA SIGUIENTE');
  assert.ok(f.document.querySelector('.home-page-forward'));assert.equal(f.c.HomeProgress.has('photo_lumo'),false);
  assert.equal(f.document.querySelector('.home-album-navigation').querySelectorAll('button').length,1,'A locked photo cannot be reached through next.');
  storyClick(f,'PÁGINA ANTERIOR');assert.ok(f.document.querySelector('.home-page-back'));assert.equal(f.c.HomeProgress.has('memory_collection'),false);
  assert.equal(f.c.HomeProgress.canEnter('basementHallway'),false);assert.equal(f.c.gameState,'HOME_ACTIVITY');
});
