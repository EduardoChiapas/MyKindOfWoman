'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createProgress,KEY}=require('../home-progress.js');
const Story=require('../home-story.js');

function memoryStorage(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
function setup(storage=memoryStorage()){
  const progress=createProgress(storage),events=[],core=Story.createCore(progress,event=>events.push(event));
  return {storage,progress,core,events};
}
function wait(core,seconds,state='PLAYING',hidden=false){for(let i=0;i<Math.round(seconds*10);i++)core.tick(.1,{state,hidden});}
function prepare(s){s.progress.record('lumo_met');s.core.onRyonmessage();
  for(const room of ['entrance','livingRoom','hallway','friskRoom','kitchen'])s.core.roomChanged(room);
  for(const id of Story.PHOTO_IDS)s.core.inspectPhoto(id);
}
function finishAnomalies(s){prepare(s);let index=0;
  for(const id of Story.ANOMALIES){wait(s.core,15);s.core.roomChanged(index++%2?'livingRoom':'friskRoom');assert.equal(s.core.tryAnomaly(id),true,id);}
}

test('HOME gates the six anomalies behind actual exploration, meeting, PC/Ryon and the three main photos',()=>{
  const s=setup();s.core.roomChanged('friskRoom');wait(s.core,30);
  assert.equal(s.core.pcNotice(),null);assert.equal(s.progress.has('pc_found'),true);
  assert.equal(s.progress.has('anomaly_session'),false);
  assert.equal(s.core.tryAnomaly('anomaly_door'),false);
  assert.equal(s.core.inspectPhoto('secret_family_biography'),null);
  prepare(s);
  assert.equal(s.core.prerequisites(),true);
  assert.equal(s.progress.has('memory_collection'),true);
  assert.equal(s.progress.has('lumo_room_found'),false,'Optional hideout cannot gate the album.');
  assert.equal(s.progress.has('cooked'),false,'Cooking is optional.');
  assert.equal(s.progress.has('piano_played'),false,'Saving the sheet does not force a performance.');
  assert.equal(s.core.tryAnomaly('anomaly_message'),false);
  assert.equal(s.core.pcNotice().id,'anomaly_session');
});

test('each actual anomaly reinteraction requires elapsed play time and a different room visit',()=>{
  const s=setup();prepare(s);wait(s.core,14.9);assert.equal(s.core.pcNotice(),null);
  wait(s.core,.1);assert.equal(s.core.pcNotice().id,'anomaly_session');
  assert.equal(s.core.inspectPhoto('photo_window').changed,false);
  const elapsedBeforePause=s.core.getState().elapsed;
  wait(s.core,60,'PC');wait(s.core,60,'DIALOG');wait(s.core,60,'PLAYING',true);
  assert.equal(s.core.getState().elapsed,elapsedBeforePause);
  s.core.roomChanged('friskRoom');wait(s.core,14.9);assert.equal(s.core.inspectPhoto('photo_window').changed,false);
  wait(s.core,.1);assert.equal(s.core.inspectPhoto('photo_window').changed,true);
  wait(s.core,15);assert.equal(s.core.inspectPiano(),false,'Waiting in the same room cannot trigger the next event.');
  s.core.roomChanged('livingRoom');assert.equal(s.core.inspectPiano(),true);
  wait(s.core,15);s.core.roomChanged('friskRoom');assert.equal(s.core.pcNotice().id,'anomaly_message');
  wait(s.core,15);s.core.roomChanged('hallway');assert.equal(s.core.tryAnomaly('anomaly_lumo'),true);
  wait(s.core,15);s.core.roomChanged('entrance');assert.equal(s.core.tryAnomaly('anomaly_door'),true);
  assert.equal(s.core.allAnomalies(),true);
  assert.deepEqual(s.events.filter(event=>event.type==='anomaly').map(event=>event.id),Story.ANOMALIES);
  assert.equal(s.core.tryAnomaly('anomaly_door'),false,'Anomaly facts cannot repeat.');
});

test('reload preserves the last anomaly room and restarts a bounded quiet interval',()=>{
  const s=setup();prepare(s);wait(s.core,15);s.core.roomChanged('friskRoom');assert.equal(s.core.pcNotice().id,'anomaly_session');
  const reloaded=setup(s.storage);reloaded.core.roomChanged('friskRoom');wait(reloaded.core,20);
  assert.equal(reloaded.core.inspectPhoto('photo_window').changed,false,'Reload alone is not a room visit.');
  reloaded.core.roomChanged('hallway');reloaded.core.roomChanged('friskRoom');assert.equal(reloaded.core.inspectPhoto('photo_window').changed,true);
  assert.equal(reloaded.events.filter(event=>event.id==='anomaly_session').length,0);
});

test('brief pacing is eight active seconds with the same gates and no global skip',()=>{
  const s=setup();prepare(s);s.core.setBriefPacing(true);wait(s.core,7.9);assert.equal(s.core.pcNotice(),null);
  wait(s.core,.1);assert.equal(s.core.pcNotice().id,'anomaly_session');
  s.core.roomChanged('friskRoom');assert.equal(s.core.inspectPhoto('photo_window').changed,false);
  wait(s.core,8);assert.equal(s.core.inspectPhoto('photo_window').changed,true);
  s.core.setBriefPacing(false);assert.equal(s.core.getState().spacing,15);
});

test('piano accepts four discrete notes, records the HOME motif and rejects unknown input',()=>{
  const s=setup();assert.equal(s.core.playNote(-1),false);assert.equal(s.core.playNote('1'),false);
  assert.equal(s.core.playNote(4),false);assert.equal(s.events.length,0);
  for(const index of [2,0,1,2])s.core.playNote(index);assert.equal(s.progress.has('home_melody_found'),false);
  s.core.playNote(3);assert.equal(s.progress.has('home_melody_found'),true);
  assert.equal(s.progress.has('piano_played'),true);
  assert.deepEqual(s.events.filter(event=>event.type==='note').slice(-4).map(event=>event.frequency),Story.NOTES);
  assert.equal(setup(s.storage).progress.has('home_melody_found'),true);
});

test('three cooking choices produce optional saved variants and replay can change a saved recipe',()=>{
  const s=setup();assert.deepEqual(s.core.cookStep('crispy'),{accepted:false});
  assert.equal(s.core.cookStep('gentle').step,1);assert.equal(s.core.cookStep('pinch').step,2);
  assert.equal(s.core.cookStep('soft').recipe,'balanced');assert.equal(s.progress.has('cooked'),true);
  assert.equal(s.core.cookStep('soft').accepted,false);
  s.core.resetRecipe();for(const choice of ['enthusiastic','extra_cinnamon','crispy'])s.core.cookStep(choice);
  assert.equal(setup(s.storage).progress.getState().recipe,'extra_cinnamon');
  s.core.resetRecipe();for(const choice of ['gentle','pinch','crispy'])s.core.cookStep(choice);
  assert.equal(setup(s.storage).progress.getState().recipe,'crispy');
  assert.equal(s.core.prerequisites(),false,'An optional meal cannot skip the main story.');
});

test('garden care remains local, persists and has no recurring maintenance requirement',()=>{
  const s=setup();assert.equal(s.core.waterFlower(),true);assert.equal(s.core.waterFlower(),false);
  const reloaded=setup(s.storage);assert.equal(reloaded.progress.getState().flower.watered,true);
  wait(reloaded.core,1000);assert.equal(reloaded.progress.getState().flower.watered,true);
});

test('the three knocks are saved exactly once, resume the finale and keep all of HOME closed',()=>{
  const s=setup();assert.equal(s.core.firstKnock(),false);assert.equal(s.core.finishDoorDialogue(),false);finishAnomalies(s);
  s.core.roomChanged('entrance');wait(s.core,30,'HOME_ACTIVITY');assert.equal(s.progress.has('home_knock_first'),false);
  wait(s.core,1.9);assert.equal(s.progress.has('home_knock_first'),false);
  wait(s.core,.1);assert.equal(s.progress.has('home_knock_first'),true);
  assert.equal(s.core.firstKnock(),false);assert.equal(s.core.getState().finalePhase,'waiting');
  const waiting=setup(s.storage);waiting.core.roomChanged('entrance');
  assert.equal(waiting.core.getState().finalePhase,'waiting');
  const pages=waiting.core.approachDoor();assert.equal(pages.length,7);
  assert.deepEqual(pages.slice(4).map(page=>page.speaker),['LUMO','LUMO','LUMO']);
  assert.equal(waiting.progress.has('investigate_door'),true);
  const speaking=setup(s.storage);assert.equal(speaking.core.getState().finalePhase,'dialogue');
  assert.equal(speaking.core.finishDoorDialogue(),true);assert.equal(speaking.core.finishDoorDialogue(),false);
  const fading=setup(s.storage);assert.equal(fading.core.getState().finalePhase,'fade');
  assert.equal(fading.core.completeHome(),true);assert.equal(fading.core.completeHome(),false);
  const complete=setup(s.storage);assert.equal(complete.core.getState().finalePhase,'complete');
  assert.equal(complete.core.approachDoor(),null);assert.equal(complete.core.firstKnock(),false);
  assert.equal(complete.progress.getState().chapter,'HOME');assert.equal(complete.progress.getState().basementUnlocked,false);
  assert.equal(complete.progress.canEnter('basementHallway'),false);assert.ok(complete.progress.barrier('entrance'));
  assert.equal(complete.core.roomChanged('basementHallway'),false,'An event cannot create a prohibited room visit.');
  assert.equal(complete.progress.getState().visits.includes('basementHallway'),false);
  assert.deepEqual([...s.events,...waiting.events,...speaking.events,...fading.events].filter(event=>event.type==='knock').map(event=>event.number),[1,2,3]);
  assert.match(complete.core.hint(),/seguir explorando HOME/);
});

test('corrupt progression cannot complete HOME by injecting only knock flags',()=>{
  const s=setup();for(const id of ['home_knock_first','home_knock_second','home_knock_third'])s.progress.record(id);
  const reloaded=setup(s.storage);assert.equal(reloaded.core.getState().finalePhase,'idle');assert.equal(reloaded.core.completeHome(),false);
  assert.equal(reloaded.progress.has('home_complete'),false);
  assert.equal(reloaded.progress.canEnter('basementHallway'),false);
});

test('story hooks reject a wrong room and run all core narrative without browser or network APIs',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../home-story.js'),'utf8');
  assert.doesNotMatch(source,/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/);
  const s=setup();const sandbox={window:{HomeProgress:s.progress,Image:function(){},document:null}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);const api=sandbox.window.HomeStory;
  let context={roomId:'friskRoom',state:'PLAYING'};
  api.mount({progress:s.progress,getContext:()=>context});api.start();
  assert.equal(api.interact({id:'entrance_basement_door'}),false);
  assert.equal(api.interact({id:'home_piano'}),false);
  context={roomId:'basementHallway',state:'PLAYING'};api.roomChanged();assert.equal(api.interact({id:'lumo'}),false);
  context={roomId:'friskRoom',state:'PC'};api.roomChanged();assert.equal(api.interact({id:'frisk_bookshelf'}),false);
  assert.equal(JSON.parse(s.storage.getItem(KEY)).chapter,'HOME');
});
