'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const engineFixture=fs.readFileSync(path.join(__dirname,'home-engine.test.cjs'),'utf8');
const fixture=vm.runInNewContext(engineFixture.slice(0,engineFixture.indexOf("\ntest('"))+'\nfixture;',{
  require,__dirname,console,AbortController,Promise});
const {KEY,createProgress}=require('../home-progress.js');

function reachable(f,id,origin){
  const c=f.c,room=c.rooms[id];c.currentRoom=id;
  const valid=(x,y)=>c.canOccupy(x*2-24,y*2-59);
  const first=origin||room.exits[0]?.spawn||[108,120];
  // The caller supplies a point INSIDE this room, never an exit's destination.
  assert.ok(valid(...first),`${id}: spawn ${first} must be clear`);
  const key=(x,y)=>x+','+y,seen=new Set([key(...first)]),queue=[first];
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];for(const [dx,dy]of [[2,0],[-2,0],[0,2],[0,-2]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!seen.has(k)&&valid(nx,ny)){seen.add(k);queue.push([nx,ny]);}
    }
  }
  return queue;
}
const SPAWNS={entrance:[160,206],livingRoom:[287,178],hallway:[20,105],friskRoom:[108,120],
  torielRoom:[145,112],kitchen:[66,135],gallery:[160,209],bathroom:[120,170],readingRoom:[286,139],
  gardenHall:[26,108],garden:[34,170],lumoRoom:[120,170]};

test('HOME expands to twelve named areas with reciprocal doors; all transition spawns and saved new-room positions are safe',()=>{
  const f=fixture(),c=f.c;
  assert.equal(Object.keys(c.rooms).filter(id=>id!=='basementHallway').length,12);
  for(const [id,room]of Object.entries(c.rooms))if(id!=='basementHallway')for(const e of room.exits){
    if(e.target==='basementHallway')continue;
    assert.ok(c.rooms[e.target],`${id} destination exists`);
    assert.ok([...c.rooms[e.target].exits,...c.rooms[e.target].interactives].some(back=>back.target===id),`${id} ↔ ${e.target}`);
    c.applyRoomChange(e);assert.ok(c.canOccupy(c.player.x,c.player.y),`${id} → ${e.target}: ${e.spawn}`);
    assert.ok(!c.rooms[e.target].exits.some(exit=>c.rectsOverlap(c.getPlayerHitbox(),exit)),`${id}: no spawn loop`);
  }
  for(const id of Object.keys(SPAWNS)){
    const [x,y]=SPAWNS[id],position={room:id,x:x*2-24,y:y*2-59,direction:'up'};
    const saved=fixture({[KEY]:JSON.stringify({version:2,position,events:['lumo_met'],visits:[id]}),'fnf-save':'preserved'});
    assert.equal(saved.c.currentRoom,id);assert.equal(saved.values.get('fnf-save'),'preserved');
    assert.ok(saved.c.HomeProgress.getState().visits.includes(id));
  }
});

test('every new room exit and furniture interaction is reachable through real feet collision geometry',()=>{
  const f=fixture(),c=f.c;
  for(const id of Object.keys(SPAWNS)){
    const room=c.rooms[id],points=reachable(f,id,SPAWNS[id]);
    for(const e of room.exits)if(e.target!=='basementHallway')assert.ok(points.some(([x,y])=>c.rectsOverlap({x:x*2-10,y:y*2-6,width:20,height:12},e)),`${id} exit ${e.target} reachable`);
    for(const p of room.interactives){
      assert.ok(points.some(([x,y])=>{
        c.placePlayerAtFeet(x,y);for(const direction of ['up','down','left','right']){c.facePlayer(direction);if(c.rectsOverlap(c.interactionProbe(),p))return true;}return false;
      }),`${id}: ${p.id} can be examined from safe floor`);
    }
  }
});

test('new wing and optional hideout cannot unlock the basement; future progress remains byte-identical',()=>{
  const value=JSON.stringify({version:99,position:{room:'garden'},private:'future'}),memory=new Map([[KEY,value]]);
  const p=createProgress({getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)});
  for(const id of Object.keys(SPAWNS)){p.visit(id);p.checkpoint({room:id,x:100,y:100});}
  assert.equal(memory.get(KEY),value);assert.equal(p.canEnter('basementHallway'),false);
  const f=fixture();for(const id of Object.keys(SPAWNS))f.c.HomeProgress.visit(id);
  f.c.HomeProgress.record('home_complete');assert.equal(f.c.changeRoom({target:'basementHallway'}),false);
});

test('the garden shares the persistent optional flower activity and exposes correct context without awarding story flags',()=>{
  const f=fixture();f.c.applyRoomChange({target:'garden',spawn:[34,170],facing:'right'});
  assert.equal(f.c.HomeStory.getState().currentRoom,'garden');
  assert.equal(f.c.HomeStory.interact({id:'garden_flower'}),true);
  const button=f.document.querySelector('.home-story-panel').querySelectorAll('button').find(node=>node.textContent==='REGAR CON CUIDADO');
  assert.ok(button);button.click();assert.equal(f.c.HomeProgress.has('flower_watered'),true);
  assert.ok(f.c.LumoMind.getState().events.includes('flower_watered'));
  assert.equal(f.c.HomeProgress.has('anomaly_session'),false);
});

test('a fresh HOME wakes in Mira bedroom once; Lumo can only be discovered in the original corridor before meeting',()=>{
  const f=fixture({}, {keepWake:true});assert.equal(f.c.currentRoom,'friskRoom');assert.equal(f.c.gameState,'DIALOG');
  assert.match(f.calls.native[0],/Despiertas en tu habitación/);assert.equal(f.c.LumoGame.open(),undefined);
  f.c.closeInteraction();assert.equal(f.c.LumoGame.call(),false);assert.equal(f.c.LumoGame.getInteraction({},{}),null);
  assert.equal(f.c.HomeProgress.has('lumo_met'),false);
  f.c.applyRoomChange({target:'hallway',spawn:[245,105],facing:'up'});
  assert.equal(f.c.LumoGame.actor.getState().x,498);assert.equal(f.c.LumoGame.open(),true);
  assert.equal(f.c.HomeProgress.has('lumo_met'),true);assert.equal(f.calls.network,0);
  const next=fixture(Object.fromEntries(f.values),{keepWake:true});assert.notEqual(next.c.gameState,'DIALOG');
});

test('reading table starts the existing pair game only after meeting the companion',()=>{
  const f=fixture();f.c.applyRoomChange({target:'readingRoom',spawn:[246,163],facing:'left'});
  assert.equal(f.c.HomeStory.interact({id:'reading_table'}),false);assert.equal(f.c.LumoActivities.active,false);
  f.c.LumoMind.act('meet');f.c.HomeProgress.record('lumo_met');
  assert.equal(f.c.HomeStory.interact({id:'reading_table'}),true);assert.equal(f.c.LumoActivities.active,true);
  assert.equal(f.c.HomeProgress.has('played_memory'),false,'Opening the game never awards a completed activity.');
});

test('version one HOME migrates to schema two without losing milestones; unknown later versions stay intact',()=>{
  const values=new Map([[KEY,JSON.stringify({version:1,events:['lumo_met','pc_found','cooked','flower_watered'],
    visits:['friskRoom','torielRoom'],interactions:{frisk_bed:4},recipe:'extra_cinnamon',position:{room:'torielRoom',x:266,y:165,direction:'up'}})]]);
  const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const p=createProgress(storage);p.visit('garden');const data=JSON.parse(values.get(KEY));
  assert.equal(data.version,2);assert.equal(data.recipe,'extra_cinnamon');assert.equal(data.interactions.frisk_bed,4);
  assert.equal(data.position.room,'torielRoom');assert.deepEqual(data.events,['lumo_met','pc_found','cooked','flower_watered']);
  assert.deepEqual(createProgress(storage).getState().visits,['friskRoom','torielRoom','garden']);
  const future=JSON.stringify({version:3,rooms:['later'],events:['future']});values.set(KEY,future);
  const next=createProgress(storage);next.visit('garden');next.record('home_complete');next.reset();
  assert.equal(values.get(KEY),future);assert.equal(next.getState().readOnly,true);
});
