'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const product=path.resolve(__dirname,'..');

// Run the existing meaningful actor suite against staging without changing
// either the production actor or its test files.
const baseline=fs.readFileSync(path.join(product,'tests/lumo-actor.test.cjs'),'utf8')

  .replace('const examining = makeWorld();','const examining = makeWorld(); advance(examining, 0.2);');
const suite={require,__dirname:path.join(product,'tests'),console,process};
vm.runInNewContext(baseline+'\nglobalThis.makeTestWorld=makeWorld;globalThis.advanceTest=advance;',suite);
const makeWorld=suite.makeTestWorld,advance=suite.advanceTest;
const feet=(world,x,y)=>{world.context.feet.x=x-10;world.context.feet.y=y-6;};

const call=makeWorld();
const events=[];call.actor.adapter.onActorEvent=event=>events.push(event);
call.actor.x=430;call.actor.y=310;
const distant=call.actor.call();
assert(distant.accepted&&!distant.nearby);
assert.equal(call.actor.getState().calling,true);
assert.equal(call.actor.call().reason,'cooldown','Key/button repeats cannot create overlapping calls.');
assert.equal(call.actor.animation,'idle','Recall changes become visible at the next game frame.');
advance(call,0.16);
assert.equal(call.actor.animation,'surprise','Lumo reacts before rushing toward Mira.');
advance(call,4);
const gap=Math.hypot(call.actor.x-100,call.actor.y-200);
assert(gap>=32&&gap<=65,'Recall stops beside Mira, keeping comfortable space.');
assert(events.some(event=>event.type==='call-arrived'));
assert.equal(call.actor.getState().calling,false);
assert.equal(call.actor.getState().speed,0,'Settling stops residual momentum.');
const nearby=call.actor.call();
assert(nearby.accepted&&nearby.nearby,'A nearby companion reacts without rushing again.');

// At a blocked target A* attempts are bounded to about three per second.
const disconnected=makeWorld((x,y)=>x>=12&&y>=12&&x<=628&&y<=468&&!(x>=240&&x<=300));
disconnected.actor.x=420;disconnected.actor.y=200;
disconnected.actor.call();
const plans=disconnected.actor.diagnostics.plans;
advance(disconnected,1.8);
assert(disconnected.actor.diagnostics.plans-plans<=6,'Unreachable goals do not cause 60 A* plans per second.');
assert(disconnected.actor.diagnostics.failedPlans>0);
advance(disconnected,2.5);
assert(disconnected.actor.diagnostics.recoveries>=1);
assert(Math.hypot(disconnected.actor.x-100,disconnected.actor.y-200)>=32,'Recovery preserves personal space.');

// Calling navigates around a furniture barrier with every segment on floor.
const detour=makeWorld((x,y)=>x>=12&&y>=12&&x<=628&&y<=468&&!(x>=220&&x<=300&&y>=140&&y<=280));
detour.actor.x=420;detour.actor.y=200;
detour.actor.call();advance(detour,6);
assert(Math.hypot(detour.actor.x-100,detour.actor.y-200)<70);
assert.equal(detour.actor.diagnostics.recoveries,0);

// Conversation, book, PC and story transitions hold movement and agenda.
for(const state of ['LUMO','BOOK','PC','TRANSITION','DIALOG','LUMO_GAME']){
  const paused=makeWorld();paused.actor.x=420;paused.actor.y=300;paused.actor.call();
  paused.context.state=state;
  const before=paused.actor.getState();advance(paused,2);
  assert.equal(paused.actor.x,before.x,state+' keeps actor still.');
  assert.equal(paused.actor.y,before.y);
  assert.equal(paused.actor.idleElapsed,before.idleSeconds,state+' does not progress idle agenda.');
  assert.equal(paused.actor.call().reason,'busy');
}
const hiding=makeWorld();hiding.actor.call();
assert(hiding.actor.beginHide({x:400,y:330,roomId:hiding.context.roomId}));
assert.equal(hiding.actor.getState().calling,false,'Explicit hide cancels a stale recall.');
assert.equal(hiding.actor.call().reason,'hiding','Integration must cancel the hide game before a recall.');

// Safe arrivals reject doors and never fall back onto Mira's foot point.
const door=makeWorld();door.context.room.exits=[{x:45,y:155,width:40,height:30}];
door.actor.onRoomChange(door.context);
assert(door.actor.awayFromDoor(door.actor));
assert(Math.hypot(door.actor.x-100,door.actor.y-200)>=32);
const tiny=makeWorld((x,y)=>Math.abs(x-100)<7&&Math.abs(y-200)<7);
assert.equal(tiny.actor.placed,false,'No safe personal space means remain hidden until a place exists.');
assert.equal(tiny.actor.call().reason,'no-safe-spot');

const autonomous=makeWorld();
autonomous.actor.setInterests([{id:'window',roomId:'home-test',kind:'window',x:170,y:220,
  lookAt:{x:170,y:100},duration:3}]);
advance(autonomous,30);
assert.equal(autonomous.actor.task,null,'Phase 7 agenda stays disabled until explicitly enabled.');
autonomous.actor.setAutonomy(true);advance(autonomous,19);
assert.equal(autonomous.actor.task?.kind,'window');
advance(autonomous,2);
assert.equal(autonomous.actor.direction,'up','At an interest point Lumo looks at its subject.');
feet(autonomous,300,220);advance(autonomous,0.2);
assert.equal(autonomous.actor.task,null,'Mira continuing exploration interrupts optional activity.');
autonomous.actor.goTo({x:320,y:220,roomId:'home-test'},{kind:'observe',duration:3});
const override=autonomous.actor.call();
assert(override.accepted&&autonomous.actor.task.kind==='recall','Recall takes priority over silent activity.');
assert.equal(autonomous.actor.goTo({x:320,y:220},{kind:'window'}),false,'Optional tasks cannot interrupt a recall.');

const emotion=makeWorld();
for(const name of ['MOCKING','ANGRY','SHY','ANNOYED','PLAYFUL']) assert.equal(emotion.actor.setEmotion(name),name);
assert.equal(emotion.actor.perform('call'),true);
assert.equal(emotion.actor.perform('arbitrary_command'),false);
assert.equal(emotion.actor.goTo({x:220,y:220},{kind:'arbitrary_command'}),false);
assert.equal(emotion.actor.goTo({x:220,y:220,roomId:'basementHallway'},{kind:'observe'}),false,
  'Actor cannot autonomously move into another chapter room.');
console.log('PASS staging: recall reaction/approach/settle, close recall, throttle, bounded retries, obstacle detour, recovery spacing, UI pauses, hide cancellation, safe doors, opt-in agenda, priority, explicit emotions, whitelist.');

