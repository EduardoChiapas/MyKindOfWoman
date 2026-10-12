'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const engineFixture=fs.readFileSync(path.join(__dirname,'home-engine.test.cjs'),'utf8');
const fixture=vm.runInNewContext(engineFixture.slice(0,engineFixture.indexOf("\ntest('"))+'\nfixture;',{
  require,__dirname,console,AbortController,Promise});
const {KEY:OBJECT_KEY}=require('../home-objects.js');
const {KEY:PROGRESS_KEY}=require('../home-progress.js');

// Select an actual reachable approach where the engine chooses this object,
// rather than bypassing nearest-object selection or dispatching a fake action.
function approach(f,roomId,objectId){
  const c=f.c,room=c.rooms[roomId];
  assert.equal(c.currentRoom,roomId);
  for(let y=74;y<room.nativeHeight-10;y+=2)for(let x=10;x<room.nativeWidth-10;x+=2){
    c.placePlayerAtFeet(x,y);if(!c.canOccupy(c.player.x,c.player.y))continue;
    for(const facing of ['up','down','left','right']){
      c.facePlayer(facing);if(c.findInteraction()?.id===objectId)return;
    }
  }
  assert.fail(`${roomId}/${objectId}: no safe approach selecting the object`);
}
function enter(f,id){
  const spawn={gallery:[160,209],bathroom:[120,170],readingRoom:[286,139],gardenHall:[26,108],garden:[34,170],lumoRoom:[120,170]}[id];
  f.c.applyRoomChange({target:id,spawn,facing:'up'});
}
function examine(f,room,id){approach(f,room,id);f.c.checkInteraction();}
const paintContext=()=>({fillStyle:'',font:'',save(){},restore(){},translate(){},scale(){},beginPath(){},rect(){},clip(){},fillRect(){},fillText(){},drawImage(){}});

test('changing rooms removes a comment tied to the old room without changing memories or closing a conversation',()=>{
  const f=fixture();f.c.LumoUI.bubble({text:'La luz del jardín está tranquila.'});
  const bubble=f.document.querySelector('.lumo-toast');assert.equal(bubble.hidden,false);
  const before=f.c.LumoMind.getState().events.slice();enter(f,'readingRoom');
  assert.equal(bubble.hidden,true);assert.deepEqual(f.c.LumoMind.getState().events,before);
});

async function meetAndShare(f){
  const c=f.c;c.applyRoomChange({target:'hallway',spawn:[245,105],facing:'up'});
  assert.equal(c.LumoGame.open(),true);assert.equal(c.HomeProgress.has('lumo_met'),true);
  c.LumoUI.close({sound:false});
  enter(f,'readingRoom');enter(f,'garden');enter(f,'gallery');
  c.LumoUI.openActions();
  const pet=f.document.querySelector('#lumo-ui').querySelectorAll('button').find(node=>node.textContent==='ACARICIAR');
  assert.ok(pet);await pet.click();c.LumoUI.close({sound:false});
  assert.ok(c.LumoMind.getState().events.includes('pet'));
}
function openHideout(f){
  const c=f.c,object=c.rooms.gallery.interactives.find(p=>p.id==='hallway_locked_door');
  assert.equal(c.LumoGame.interact(object),true);assert.equal(c.gameState,'TRANSITION');
  c.updateRoomTransition(.5);assert.equal(c.currentRoom,'lumoRoom');assert.equal(c.gameState,'PLAYING');
  assert.ok(c.canOccupy(c.player.x,c.player.y));
  assert.ok(!c.rooms.lumoRoom.exits.some(e=>c.rectsOverlap(c.getPlayerHitbox(),e)));
}

test('the HOME wing has distinct object silhouettes, all painted with native integer pixels without bitmap furniture',()=>{
  const f=fixture(),defs=f.c.HomeWorld.definitions(),props=Object.values(defs).flatMap(room=>room.props);
  assert.equal(new Set(props.map(p=>p.kind)).size,props.length,'Every wing object has its own silhouette.');
  for(const p of props){
    let painted=0;const ctx=paintContext();
    ctx.drawImage=()=>assert.fail(`${p.id}: pixel furniture must not fall back to a scaled bitmap`);
    ctx.fillRect=(x,y,w,h)=>{assert.ok([x,y,w,h].every(Number.isInteger),`${p.id}: native pixel grid`);painted++;};
    assert.equal(f.c.HomePixelArt.draw(ctx,p,{phase:0,pulse:0,time:0,motion:false}),true,p.id);
    assert.ok(painted>0,`${p.id} paints a visible object`);
  }
});

test('real object selection and interaction change wing objects, close/reopen correctly, and persist both states',()=>{
  for(const [room,id]of [['gallery','gallery_umbrella'],['bathroom','bathroom_sink'],['readingRoom','reading_origami'],['gardenHall','garden_hall_flower']]){
    const f=fixture();enter(f,room);const before=f.c.HomeProgress.getState().events.slice();
    examine(f,room,id);assert.equal(f.c.gameState,'DIALOG');
    assert.equal(f.c.HomeObjectsState.visual(id).value,true);assert.equal(f.c.HomeObjectsState.visual(id).phase,1);
    assert.deepEqual(f.c.HomeProgress.getState().events,before,'Furniture does not award narrative events.');
    const firstText=f.calls.native.at(-1);f.c.closeInteraction();assert.equal(f.c.gameState,'PLAYING');
    const restored=fixture(Object.fromEntries(f.values));assert.equal(restored.c.HomeObjectsState.visual(id).value,true);
    examine(restored,room,id);assert.equal(restored.c.HomeObjectsState.visual(id).value,false);
    assert.notEqual(restored.calls.native.at(-1),firstText,'The second description matches the reversed action.');
    restored.c.closeInteraction();const again=fixture(Object.fromEntries(restored.values));
    assert.equal(again.c.HomeObjectsState.visual(id).value,false);
    assert.deepEqual(again.c.HomeProgress.getState().events,before);
  }
});

test('unknown future furniture data stays byte-identical during real interactions and protects new-game reset',()=>{
  const future=JSON.stringify({version:99,values:{gallery_umbrella:true},future:'keep'});
  const f=fixture({[OBJECT_KEY]:future});enter(f,'gallery');const before=f.c.HomeProgress.getState().events.slice();
  examine(f,'gallery','gallery_umbrella');f.c.closeInteraction();
  assert.equal(f.c.HomeObjectsState.readOnly,true);assert.equal(f.values.get(OBJECT_KEY),future);
  assert.equal(f.c.HomeObjectsState.visual('gallery_umbrella').value,false);
  assert.deepEqual(f.c.HomeProgress.getState().events,before);
  assert.equal(f.c.HomeObjectsState.reset(),false);assert.equal(f.values.get(OBJECT_KEY),future);
  const reset=f.document.body.querySelectorAll('button').find(node=>node.textContent==='Empezar HOME de nuevo');
  assert.ok(reset);assert.equal(reset.disabled,true);
});

test('the side alcove respects real friendship prerequisites and its entrance/return never spawn inside an exit or wall',async()=>{
  const f=fixture(),c=f.c;enter(f,'gallery');const secret=c.rooms.gallery.interactives.find(p=>p.id==='hallway_locked_door');
  assert.equal(c.LumoGame.interact(secret),true);assert.equal(c.gameState,'DIALOG');assert.equal(c.currentRoom,'gallery');
  assert.equal(c.HomeProgress.has('lumo_room_found'),false);c.closeInteraction();
  c.applyRoomChange({target:'hallway',spawn:[245,105],facing:'up'});assert.equal(c.LumoGame.open(),true);c.LumoUI.close({sound:false});
  enter(f,'readingRoom');enter(f,'garden');enter(f,'gallery');
  assert.equal(c.LumoGame.interact(secret),true);assert.equal(c.gameState,'DIALOG');
  assert.equal(c.HomeProgress.has('lumo_room_found'),false,'Visits alone cannot open the hideout.');c.closeInteraction();
  c.LumoUI.openActions();const pet=f.document.querySelector('#lumo-ui').querySelectorAll('button').find(node=>node.textContent==='ACARICIAR');
  assert.ok(pet);await pet.click();c.LumoUI.close({sound:false});openHideout(f);
  assert.equal(c.HomeProgress.has('lumo_room_found'),true);
  const back=c.rooms.lumoRoom.exits.find(e=>e.target==='gallery');c.applyRoomChange(back);
  assert.equal(c.currentRoom,'gallery');assert.ok(c.canOccupy(c.player.x,c.player.y));
  assert.ok(!c.rooms.gallery.exits.some(e=>c.rectsOverlap(c.getPlayerHitbox(),e)));
  assert.equal(c.HomeProgress.canEnter('basementHallway'),false);
});

test('the real desk pickup changes its painted paper state once and survives reload without duplicating the drawing',async()=>{
  const f=fixture();await meetAndShare(f);openHideout(f);assert.equal(f.c.LumoGame.drawingClaimed,false);
  examine(f,'lumoRoom','lumo_desk');assert.equal(f.c.LumoGame.drawingClaimed,true);
  assert.equal(f.c.LumoGame.getState().world.inventory.drawing,1);f.c.closeInteraction();
  const original=f.c.HomePixelArt,painted=[];
  f.c.HomePixelArt={...original,draw(ctx,p,state){painted.push({id:p.id,claimed:state.claimed});return original.draw(ctx,p,state);}};
  f.c.rooms.lumoRoom.render(paintContext(),{x:0,y:0});
  assert.equal(painted.find(p=>p.id==='lumo_desk').claimed,true);
  const restored=fixture(Object.fromEntries(f.values));assert.equal(restored.c.LumoGame.drawingClaimed,true);
  examine(restored,'lumoRoom','lumo_desk');assert.equal(restored.c.LumoGame.getState().world.inventory.drawing,1);
  assert.equal(restored.c.HomeProgress.has('home_complete'),false);
});

test('the basement keeps its original open stairs while its HOME collision and chapter gate remain closed after completion',()=>{
  const f=fixture(),c=f.c;c.applyRoomChange({target:'entrance',spawn:[160,206],facing:'up'});
  const ctx=paintContext(),paint=[];ctx.fillRect=(...args)=>paint.push(args);ctx.drawImage=(...args)=>paint.push(args);
  c.HomeStory.draw(ctx,{x:0,y:0});assert.equal(paint.length,0,'No extra front-facing door covers the original stair image.');
  c.placePlayerAtFeet(210,120);assert.equal(c.canOccupy(c.player.x,c.player.y),false,'The HOME barrier still blocks the stair landing.');
  assert.equal(c.changeRoom({target:'basementHallway'}),false);
  c.HomeProgress.record('home_complete');assert.equal(c.applyRoomChange({target:'basementHallway',spawn:[100,100]}),false);
  assert.equal(c.HomeProgress.getState().chapter,'HOME');assert.ok(c.HomeProgress.barrier('entrance'));
  assert.equal(f.calls.network,0);assert.equal(f.values.has(PROGRESS_KEY),true);
});
