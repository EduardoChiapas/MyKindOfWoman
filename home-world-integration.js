/* Runs after the original rooms and companion are installed. */
if(window.HomeObjects){
 window.HomeObjectsState=window.HomeObjects.create({storage:window.localStorage,progress:window.HomeProgress,reducedMotion:()=>HouseExperience.reducedMotion});
 window.HomeWorld.objects=window.HomeObjectsState;
}
window.HomeWorld.install({rooms,R,progress:window.HomeProgress});
window.HomeWorld.getFeet=getPlayerHitbox;
window.HomeRoomDetails?.install({objects:window.HomeObjectsState,progress:window.HomeProgress});
window.HomeBook?.install();

// The two corridor IDs share one physical space. Local coordinates and saves
// keep their old room IDs; drawing, collision and the camera use this join.
(function(global){
 const join=rooms.gallery?.join;
 if(!join||join.target!=='hallway')return;
 const offsets={hallway:{x:0,y:0},gallery:{x:join.x*ROOM_SCALE,y:join.y*ROOM_SCALE}};
 const ids=['hallway','gallery'];
 for(const id of ids){
  const room=rooms[id],origin=offsets[id];
  const transformed=key=>ids.flatMap(other=>{
   const delta={x:offsets[other].x-origin.x,y:offsets[other].y-origin.y};
   return rooms[other][key].map(r=>({...r,x:r.x+delta.x,y:r.y+delta.y}));
  });
  // Keep each original room's own walkable and solids byte-equivalent.
  room.continuousWalkable=transformed('walkable');
  room.continuousSolids=transformed('solids');
  const seam=room.exits.find(e=>ids.includes(e.target)&&e.target!==id);
  if(seam)seam.seamless=true;
 }
 const origin=id=>offsets[id]||null;
 const delta=(from,to)=>origin(from)&&origin(to)?{x:origin(from).x-origin(to).x,y:origin(from).y-origin(to).y}:null;
 function atSeam(id,exit,feet){
  if(!exit.seamless||!origin(id)||!origin(exit.target))return false;
  const center=feet.x+feet.width/2;
  return id==='hallway'?center>=offsets.gallery.x:center<0;
 }
 function cameraRegion(id){
  const o=origin(id);if(!o)return null;
  // The original vertical framing is shared. The new upper bend fits above
  // it inside the same viewport; crossing never changes its vertical center.
  return {id:'home-corridors',x:o.x,y:o.y,width:offsets.gallery.x+rooms.gallery.nativeWidth*ROOM_SCALE,
    height:rooms.hallway.nativeHeight*ROOM_SCALE};
 }
 function layers(id,view){
  const current=origin(id);if(!current)return null;
  return ids.map(other=>({id:other,view:{x:view.x+current.x-offsets[other].x,y:view.y+current.y-offsets[other].y}}))
   .filter(layer=>{const room=rooms[layer.id];return layer.view.x<room.nativeWidth*ROOM_SCALE&&layer.view.y<room.nativeHeight*ROOM_SCALE&&
    layer.view.x+VIEW_W>0&&layer.view.y+VIEW_H>0;});
 }
 function preserveCompanion(shift,change){
  const actor=global.LumoGame?.actor;
  const old=actor?.getState?.();
  const trail=actor?.trail?.map(p=>({x:p.x+shift.x,y:p.y+shift.y}));
  change();
  if(!old?.placed||!actor?.canStand(old.x+shift.x,old.y+shift.y))return;
  actor.x=old.x+shift.x;actor.y=old.y+shift.y;actor.placed=true;
  actor.fade=old.fade;actor.fadePhase='in';actor.moving=old.moving;
  if(trail?.length)actor.trail=trail;
 }
 function foreground(ctx,id,view,feet){
  const current=origin(id);if(!current)return;
  for(const layer of layers(id,view)||[])if(layer.id==='gallery'){
   const shift=delta(id,layer.id),localFeet={...feet,x:feet.x+shift.x,y:feet.y+shift.y};
   global.HomeWorld.drawProps(ctx,layer.view,'gallery',true,localFeet);
  }
 }
 global.HomeContinuousWing=Object.freeze({origin,delta,atSeam,cameraRegion,layers,preserveCompanion,foreground});
})(window);
