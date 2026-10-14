'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const engineFixture=fs.readFileSync(path.join(__dirname,'home-engine.test.cjs'),'utf8');
const fixture=vm.runInNewContext(engineFixture.slice(0,engineFixture.indexOf("\ntest('"))+'\nfixture;',{
  require,__dirname,console,AbortController,Promise});
const {KEY,createProgress,LAYOUT_VERSION}=require('../home-progress.js');

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
  torielRoom:[145,112],kitchen:[66,135],gallery:[44,152],bathroom:[120,168],readingRoom:[40,130],
  garden:[192,230],lumoRoom:[96,146]};

test('HOME merges the new wing into eleven named areas with reciprocal doors and safe transition spawns',()=>{
  const f=fixture(),c=f.c;
  assert.equal(Object.keys(c.rooms).filter(id=>id!=='basementHallway').length,11);
  assert.equal(c.rooms.gardenHall,undefined);
  for(const [id,room]of Object.entries(c.rooms))if(id!=='basementHallway')for(const e of room.exits){
    if(e.target==='basementHallway')continue;
    assert.ok(c.rooms[e.target],`${id} destination exists`);
    assert.ok([...c.rooms[e.target].exits,...c.rooms[e.target].interactives].some(back=>back.target===id),`${id} ↔ ${e.target}`);
    c.applyRoomChange(e);assert.ok(c.canOccupy(c.player.x,c.player.y),`${id} → ${e.target}: ${e.spawn}`);
    assert.ok(!c.rooms[e.target].exits.some(exit=>c.rectsOverlap(c.getPlayerHitbox(),exit)),`${id}: no spawn loop`);
  }
  for(const id of Object.keys(SPAWNS)){
    const [x,y]=SPAWNS[id],position={room:id,x:x*2-24,y:y*2-59,direction:'up'};
    const saved=fixture({[KEY]:JSON.stringify({version:2,layoutVersion:LAYOUT_VERSION,position,events:['lumo_met'],visits:[id]}),'fnf-save':'preserved'});
    assert.equal(saved.c.currentRoom,id);assert.equal(saved.values.get('fnf-save'),'preserved');
    assert.ok(saved.c.HomeProgress.getState().visits.includes(id));
  }
});

test('the original corridor keeps its shape and blocked third door; only its far-right exit enters the compact wing',()=>{
  const f=fixture(),c=f.c,room=c.rooms.hallway;
  assert.equal(room.nativeWidth,745);assert.equal(room.nativeHeight,156);
  assert.deepEqual(JSON.parse(JSON.stringify(room.walkable)),[
    {x:0,y:144,width:1490,height:120},{x:306,y:40,width:70,height:128},
    {x:726,y:40,width:70,height:128},{x:1146,y:40,width:70,height:128}]);
  assert.ok(room.solids.some(s=>s.x===574*2&&s.y===20*2&&s.width===33*2&&s.height===39*2));
  assert.ok(room.solids.some(s=>s.x===710*2&&s.y===38*2),'Umbrella remains in its original location.');
  const exits=room.exits.filter(e=>e.target==='gallery');assert.equal(exits.length,1);
  assert.equal(exits[0].dir,'right');assert.equal(exits[0].x,733*2);
  assert.equal(room.exits.some(e=>e.target==='lumoRoom'),false);
  assert.equal(room.interactives.filter(p=>p.id==='hallway_locked_door').length,1);
  assert.equal(room.interactives.some(p=>p.id==='hallway_inner_door'),false);
  assert.equal(c.rooms.gallery.interactives.some(p=>p.target==='lumoRoom'),false);
  assert.equal(c.rooms.readingRoom.interactives.find(p=>p.id==='lumo_hideout_entry').target,'lumoRoom');
});

test('the enlarged bathroom, music room and outdoor courtyard keep native bounds and clear arrival routes',()=>{
  const f=fixture(),c=f.c;
  for(const [id,width,height]of [['bathroom',240,200],['readingRoom',288,224],['garden',384,256]]){
    const room=c.rooms[id];assert.equal(room.nativeWidth,width,id);assert.equal(room.nativeHeight,height,id);
    const points=reachable(f,id,SPAWNS[id]);assert.ok(points.length>1000,id+': an actual connected floor region');
    for(const prop of room.props){
      assert.ok(prop.x>=0&&prop.y>=0&&prop.width>0&&prop.height>0&&prop.x+prop.width<=width&&prop.y+prop.height<=height,prop.id+': visible furniture inside room');
      if(prop.solid)assert.ok(prop.solid.x>=prop.x&&prop.solid.y>=prop.y&&prop.solid.x+prop.solid.width<=prop.x+prop.width&&prop.solid.y+prop.solid.height<=prop.y+prop.height,prop.id+': collision inside visible furniture');
    }
  }
  const {props}=c.rooms.readingRoom,sofa=props.find(p=>p.id==='reading_sofa'),chair=props.find(p=>p.id==='reading_chair'),tv=props.find(p=>p.id==='reading_tv');
  assert.equal(sofa.y,chair.y,'Seats are together on the same row.');assert.ok(sofa.x+sofa.width<chair.x);
  assert.equal(tv.kind,'tvBack');assert.ok(tv.y>sofa.y+sofa.height&&tv.x<chair.x+chair.width&&tv.x+tv.width>sofa.x,'The TV faces the seats and its back faces the viewer.');
});

test('older positions in compacted rooms and the removed garden corridor migrate safely without losing visits or memories',()=>{
  for(const oldRoom of ['gallery','bathroom','readingRoom','garden','lumoRoom','gardenHall']){
    const target=oldRoom==='gardenHall'?'gallery':oldRoom;
    const raw={version:2,position:{room:oldRoom,x:500,y:390,direction:'right'},
      events:['lumo_met','piano_played','photo_music','flower_watered'],visits:['hallway',oldRoom],
      interactions:{reading_books:7},recipe:'extra_cinnamon'};
    const f=fixture({[KEY]:JSON.stringify(raw),'fnf-save':'preserved','mkw:pc:save':'preserved'});
    assert.equal(f.c.currentRoom,target);assert.ok(f.c.canOccupy(f.c.player.x,f.c.player.y));
    assert.deepEqual(JSON.parse(JSON.stringify(f.c.HomeProgress.getState().position)),
      {room:target,x:SPAWNS[target][0]*2-24,y:SPAWNS[target][1]*2-59,direction:'up'});
    const progress=f.c.HomeProgress.getState();
    assert.ok(progress.visits.includes(oldRoom));assert.ok(progress.events.includes('photo_music'));
    assert.ok(progress.events.includes('piano_played'));assert.equal(progress.interactions.reading_books,7);
    assert.equal(progress.recipe,'extra_cinnamon');assert.equal(progress.flower.watered,true);
    assert.equal(f.values.get('fnf-save'),'preserved');assert.equal(f.values.get('mkw:pc:save'),'preserved');
    assert.equal(JSON.parse(f.values.get(KEY)).layoutVersion,LAYOUT_VERSION);
  }
});

test('current-layout saved positions survive; unknown future geometry is read-only and stays byte-identical',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const position={room:'readingRoom',x:180,y:140,direction:'left'};
  values.set(KEY,JSON.stringify({version:2,layoutVersion:LAYOUT_VERSION,position,events:['piano_played'],visits:['readingRoom']}));
  assert.deepEqual(createProgress(storage).getState().position,position);
  const future=JSON.stringify({version:2,layoutVersion:99,position,events:['future'],unknown:{keep:true}});
  values.set(KEY,future);const p=createProgress(storage);assert.equal(p.getState().readOnly,true);
  p.checkpoint({room:'gardenHall',x:500,y:300});p.visit('gallery');p.record('home_complete');
  assert.equal(p.reset(),false);assert.equal(values.get(KEY),future);
});

test('layout-one arrivals migrate into occupiable floor instead of the new courtyard exit trigger',()=>{
  for(const room of ['bathroom','readingRoom','garden']){
    const raw={version:2,layoutVersion:1,position:{room,x:190,y:205,direction:'right'},
      events:['lumo_met','piano_played','photo_music'],visits:[room],interactions:{home_piano:8}};
    const f=fixture({[KEY]:JSON.stringify(raw),'fnf-save':'original','mkw:pc:save':'original'}),c=f.c;
    assert.equal(c.currentRoom,room);assert.ok(c.canOccupy(c.player.x,c.player.y),room);
    assert.deepEqual(JSON.parse(JSON.stringify(c.HomeProgress.getState().position)),
      {room,x:SPAWNS[room][0]*2-24,y:SPAWNS[room][1]*2-59,direction:'up'});
    assert.ok(!c.rooms[room].exits.some(e=>c.rectsOverlap(c.getPlayerHitbox(),e)),room+': migrated save cannot immediately leave');
    assert.equal(f.values.get('fnf-save'),'original');assert.equal(f.values.get('mkw:pc:save'),'original');
    assert.ok(c.HomeProgress.has('photo_music'));assert.equal(c.HomeProgress.getState().interactions.home_piano,8);
  }
});

test('Lumo traverses the L-shaped turn with the real path planner without crossing its walls or furniture',()=>{
  const f=fixture(),c=f.c;c.LumoMind.act('meet');c.HomeProgress.record('lumo_met');
  c.applyRoomChange({target:'gallery',spawn:SPAWNS.gallery,facing:'right'});
  const actor=c.LumoGame.actor;actor.setAutonomy(false);const goal={x:168*2,y:90*2};
  assert.equal(actor.getState().placed,true);assert.ok(actor.canStand(actor.x,actor.y));
  const route=actor.planRoute(goal);assert.ok(route.length>1,'The route must turn inside the L-shaped corridor.');
  let previous={x:actor.x,y:actor.y};for(const point of route){assert.ok(actor.lineClear(previous,point));previous=point;}
  assert.equal(actor.goTo(goal,{id:'compact-wing-route',kind:'observe',duration:.4}),true);
  for(let i=0;i<200&&Math.hypot(actor.x-goal.x,actor.y-goal.y)>=14;i++){
    actor.update(.05);assert.ok(actor.canStand(actor.x,actor.y),'Each movement stays on safe floor.');
  }
  assert.ok(Math.hypot(actor.x-goal.x,actor.y-goal.y)<14,'Lumo reaches the far arm of the new corridor.');
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
      if(['gallery','bathroom','readingRoom','garden','lumoRoom'].includes(id))assert.ok(points.some(([x,y])=>{
        c.placePlayerAtFeet(x,y);for(const direction of ['up','down','left','right']){c.facePlayer(direction);if(c.findInteraction()?.id===p.id)return true;}return false;
      }),`${id}: ${p.id} can win actual nearest-object selection from its connected floor`);
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
  const f=fixture();f.c.applyRoomChange({target:'garden',spawn:SPAWNS.garden,facing:'up'});
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
  const f=fixture();f.c.applyRoomChange({target:'readingRoom',spawn:SPAWNS.readingRoom,facing:'right'});
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
