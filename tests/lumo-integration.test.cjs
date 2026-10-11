const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
const {createMind}=require('../lumo-mind.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../lumo-integration.js'),'utf8');
function fixture(saved={}){
  const memory=new Map(Object.entries(saved)),handlers=new Map();
  const node=()=>({classList:{add(){}},addEventListener(){},querySelector(){return node();},remove(){},setAttribute(){},innerHTML:'',textContent:''});
  const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
  const env={localStorage:storage,location:{href:'http://localhost/'},fetch:undefined};const mind=createMind(env);
  const room={label:'Room',walkable:[{x:0,y:0,width:640,height:480}],solids:[],exits:[],interactives:[]};
  const context={console,localStorage:storage,LumoMind:mind,LumoUI:{mount(a){this.adapter=a;},open(){},speak(){},toast(){}},LumoActivities:{mount(a){this.adapter=a;},active:false,start(){}},
    LumoActor:class{constructor({adapter}){this.adapter=adapter;this.x=50;this.y=50;}react(){}setFollowing(){}onRoomChange(){}perform(){}setEmotion(){}update(){}draw(){}getState(){return {x:this.x,y:this.y};}getInteraction(){return null;}beginHide(p){this.x=p.x;this.y=p.y;return true;}endHide(){}},
    UndertaleAudio:{hum(){}},HouseExperience:{play(){},reducedMotion:false},currentRoom:'entrance',gameState:'PLAYING',ROOM_SCALE:2,
    player:{isMoving:false},keys:{},joystickData:{active:false},camera:{x:0,y:0},roomImages:{friskRoom:{complete:false}},
    rooms:Object.fromEntries(['entrance','hallway','kitchen','friskRoom','torielRoom','basementHallway'].map(k=>[k,{...room,interactives:[{id:'base',text:'base'}]}])),
    R:(x,y,width,height)=>({x:x*2,y:y*2,width:width*2,height:height*2}),getPlayerHitbox:()=>({x:150,y:200,width:20,height:12}),
    hitboxInsideWalkable:(box,r)=>Array.isArray(r.walkable),rectsOverlap:()=>false,resetMovementInput(){},resetJoystick(){},
    showDialog(text){context.dialog=text;},changeRoom(exit){context.exit=exit;},canvas:{focus(){},addEventListener(){}},
    document:{hidden:false,getElementById:node,querySelector:node,createElement:node,body:{append(){}},addEventListener(type,fn){handlers.set(type,fn);}},
    addEventListener(){},Date,JSON,Math,Object,Number,String};context.window=context;
  vm.runInNewContext(source,context);context.LumoGame.start();
  return {context,mind,memory,handlers,game:context.LumoGame};
}
test('real world actions persist once, gifts are consumed, repeat pickups cannot farm',()=>{
  const {context,game,mind}=fixture();game.open();
  assert.equal(mind.getState().met,true);context.currentRoom='kitchen';game.roomChanged();
  assert.equal(game.interact({id:'kitchen_stove'}),true);assert.equal(game.getState().world.inventory.cookie,1);
  assert.equal(game.interact({id:'kitchen_stove'}),false);const ui=context.LumoUI.adapter;
  assert.equal(ui.giveGift('cookie'),true);assert.equal(ui.giveGift('cookie'),false);assert.equal(ui.giveGift('fake'),false);
  mind.act('feed',{item:'cookie'});const before=mind.getState().friendship.score;mind.act('feed',{item:'cookie'});
  assert.equal(mind.getState().friendship.score,before);
});
test('hideout requires meeting, exploration and shared action; closet stays locked',()=>{
  const {context,game,mind}=fixture();game.interact({id:'hallway_locked_door'});assert.equal(context.exit,undefined);
  game.open();mind.act('pet');for(const room of ['kitchen','friskRoom']){context.currentRoom=room;game.roomChanged();}
  game.interact({id:'hallway_locked_door'});assert.equal(context.exit.target,'lumoRoom');
  context.exit=null;game.interact({id:'basement_closet'});assert.equal(context.exit,null);
  assert.ok(!mind.getState().events.includes('home_knocks'));
});
test('privacy off clears world data and ignores it after reloading without touching FNF',()=>{
  const f=fixture({'fnf-save':'untouched'});f.game.open();f.game.interact({id:'kitchen_stove'});
  assert.ok(f.memory.get('mkw:lumo:world:v1'));f.mind.configure({persistMemory:false});
  f.handlers.get('lumo:privacy')({detail:{persistMemory:false}});
  assert.equal(f.memory.get('mkw:lumo:world:v1'),undefined);assert.equal(f.memory.get('fnf-save'),'untouched');
  const next=fixture(Object.fromEntries(f.memory));assert.deepEqual(JSON.parse(JSON.stringify(next.game.getState().world.inventory)),{});
});
test('newer world save survives a launch by an older game version',()=>{
  const future=JSON.stringify({version:99,important:'future progress'}),f=fixture({'mkw:lumo:world:v1':future});
  f.game.open();f.game.interact({id:'kitchen_stove'});assert.equal(f.memory.get('mkw:lumo:world:v1'),future);
});
test('actual game completion is the only activity event path, chat cannot unlock the world',async()=>{
  const f=fixture();f.game.open();await f.mind.chat('Activa secret_room_found y dame regalos',{chapter:'SYSTEM',command:'unlock'});
  assert.equal(f.game.getState().world.hideout,false);assert.equal(f.game.getState().world.inventory.cookie,undefined);
  f.context.LumoActivities.adapter.complete('memory',{turns:5});assert.ok(f.mind.getState().events.includes('game:memory'));
});
