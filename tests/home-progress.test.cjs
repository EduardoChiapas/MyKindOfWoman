const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createProgress,KEY,ANOMALIES}=require('../home-progress.js');
function storage(data={}){const m=new Map(Object.entries(data));return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),m};}
test('HOME blocks the entire basement even with a forged old unlock or completed chapter',()=>{
 const s=storage({[KEY]:JSON.stringify({version:1,chapter:'ECHOES',basementUnlocked:true,events:['home_complete'],position:{room:'basementHallway',x:100,y:100}})}),p=createProgress(s);
 assert.equal(p.canEnter('basementHallway'),false);assert.equal(p.getState().position,null);assert.equal(p.getState().chapter,'HOME');
 assert.ok(p.barrier('entrance'));assert.equal(p.barrier('hallway'),null);assert.equal(p.canEnter('kitchen'),true);
});
test('real engine collision and both transition paths reject the closed entrance',()=>{
 const p=createProgress(storage()),source=fs.readFileSync(path.join(__dirname,'../script.js'),'utf8');
 const c={window:{HomeProgress:p},ROOM_SCALE:2,R:(x,y,width,height)=>({x:x*2,y:y*2,width:width*2,height:height*2}),roomImages:{},houseInteractives:()=>[],
  BasementMaze:{nativeWidth:100,nativeHeight:100,walkable:[],solids:[],exits:[],interactives:[],draw(){}},currentRoom:'entrance',
  player:{x:0,y:0},PLAYER_HITBOX:{offsetX:14,offsetY:53,width:20,height:12},roomTransition:{phase:'idle'},gameState:'PLAYING'};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('const rooms = {'),source.indexOf('// Keep visual props')),c);
 vm.runInContext(source.slice(source.indexOf('function rectsOverlap('),source.indexOf('function placePlayerAtFeet(')),c);
 vm.runInContext(source.slice(source.indexOf('function changeRoom('),source.indexOf('function updateRoomTransition(')),c);
 // Gate spans the original exit; sweep its area with the actual foot collision function.
 for(let x=410;x<440;x+=2)for(let y=211;y<244;y+=2)assert.equal(c.canOccupy(x-14,y-53),false);
 assert.equal(c.changeRoom({target:'basementHallway'}),false);assert.equal(c.roomTransition.phase,'idle');
 assert.equal(c.applyRoomChange({target:'basementHallway',spawn:[100,100]}),false);assert.equal(c.currentRoom,'entrance');
 assert.equal(c.canOccupy(160*2-24,206*2-59),true);
});
test('story anomalies require confirmed prerequisites and advance once in order',()=>{
 const p=createProgress(storage());assert.equal(p.recordAnomaly(ANOMALIES[0]),false);p.record('ryon_met');p.record('memory_collection');
 assert.equal(p.recordAnomaly(ANOMALIES[1]),false);for(const id of ANOMALIES){assert.equal(p.recordAnomaly(id),true);assert.equal(p.recordAnomaly(id),false);}
 assert.equal(p.nextAnomaly(),null);assert.equal(p.record('unlock_basement'),false);
});
test('critical game facts persist while unknown newer saves remain intact',()=>{
 const s=storage(),p=createProgress(s);p.record('lumo_met');p.visit('kitchen');p.checkpoint({room:'kitchen',x:100,y:190,direction:'up'});
 assert.equal(createProgress(s).has('lumo_met'),true);assert.equal(createProgress(s).getState().position.room,'kitchen');
 const raw=JSON.stringify({version:99,important:'future'}),s2=storage({[KEY]:raw}),p2=createProgress(s2);p2.record('pc_found');p2.reset();assert.equal(s2.getItem(KEY),raw);
});
