/* HOME bridge: the world owns progression; model output has no execution path. */
(function (global) {
  'use strict';
  const mind = global.LumoMind;
  const KEY = 'mkw:lumo:world:v1';
  const roomIds = { entrance:'livingroom', livingRoom:'livingroom', hallway:'hallway', friskRoom:'bedroom', torielRoom:'ryonroom', kitchen:'kitchen', basementHallway:'basement', lumoRoom:'lumo_room' };
  const labels = { flower:'Flor de papel', cookie:'Galleta', drawing:'Dibujo', ribbon:'Cinta lavanda' };
  const pickups = { kitchen_stove:'cookie', hallway_flowers:'flower', frisk_dresser:'ribbon' };
  const objects = { kitchen_fridge:'fridge', kitchen_stove:'fridge', toriel_pc:'pc', hallway_flowers:'flower', entrance_flower:'flower', hallway_mirror:'mirror', living_books:'books', living_sofa:'sofa' };
  let world = { version:1, inventory:{}, claimed:[], visits:[], frequency:mind.getState().settings?.commentFrequency || 'normal', hideout:false };
  let unsupportedWorld = false;
  const persistenceEnabled = mind.getState().settings?.persistMemory !== false;
  try {
    const saved = persistenceEnabled ? JSON.parse(localStorage.getItem(KEY) || 'null') : null;
    unsupportedWorld = saved && Number(saved.version) > 1;
    if (saved?.version === 1) {
      for (const id of Object.keys(labels)) world.inventory[id] = Math.max(0, Math.min(1, Number(saved.inventory?.[id]) || 0));
      world.claimed = [...new Set((Array.isArray(saved.claimed) ? saved.claimed : []).filter(id => Object.hasOwn(pickups,id) || id === 'lumo_drawing_pickup'))];
      world.visits = [...new Set((Array.isArray(saved.visits) ? saved.visits : []).filter(id => Object.hasOwn(roomIds,id)))];
      world.frequency = ['off','low','normal'].includes(saved.frequency) ? saved.frequency : 'normal';
      world.hideout = saved.hideout === true;
    }
  } catch { /* A malformed optional save never blocks HOME. */ }
  let started = false, idle = 0, blocked = 0, elapsed = 0, lastComment = -60, lastHum = -90, lastObject = '', pendingObject = null;
  let hide = null, hideNode = null, pcWasOpen = false;
  const clone = value => JSON.parse(JSON.stringify(value));
  function save() {
    if (mind.getState().settings?.persistMemory === false) {
      try { localStorage.removeItem(KEY); } catch {} return;
    }
    if (unsupportedWorld) return; // Never replace a save from a newer game version.
    try { localStorage.setItem(KEY,JSON.stringify(world)); } catch {}
  }
  function met() { const state = mind.getState(); return state.met === true || state.events.includes('lumo_met'); }
  function context() {
    const state = mind.getState();
    return { chapter:'HOME', room:roomIds[currentRoom] || 'livingroom', roomName:rooms[currentRoom].label,
      emotion:state.emotion, friendship:state.friendship, events:state.events, memories:state.memories,
      gifts:state.gifts, activity:hide ? 'hide_seek' : global.LumoActivities.active ? 'memory' : null,
      serious:state.events.includes('home_knocks') };
  }
  function canStand(x,y,roomId = currentRoom) {
    const room = rooms[roomId];
    if (!room) return false;
    const feet = { x:x-4, y:y-3, width:8, height:6 };
    return hitboxInsideWalkable(feet,room) && !room.solids.some(solid => rectsOverlap(feet,solid));
  }
  const actor = new global.LumoActor({ mind, adapter:{ canStand, getContext:() => ({
    roomId:currentRoom, room:rooms[currentRoom], player, feet:getPlayerHitbox(), state:gameState,
    paused:document.hidden || ['DIALOG','BOOK','TRANSITION','LUMO','LUMO_GAME','PC'].includes(gameState),
    reducedMotion:HouseExperience.reducedMotion
  }) }});
  function pause(value) {
    resetMovementInput(); resetJoystick();
    if (value && gameState === 'PLAYING') gameState = 'LUMO';
    else if (!value && ['LUMO','LUMO_GAME'].includes(gameState)) gameState = 'PLAYING';
    document.getElementById('interaction-hint').classList.add('hidden');
  }
  const focus = () => canvas.focus({preventScroll:true});
  function comment(result, force = false) {
    actor.react(result);
    if (force || (world.frequency !== 'off' && elapsed-lastComment >= (world.frequency === 'low' ? 90 : 45))) {
      if (gameState === 'PLAYING' && !document.hidden) { global.LumoUI.toast(result); lastComment = elapsed; }
    }
  }
  function open() {
    if (!started || gameState !== 'PLAYING') return;
    cancelHide();
    if (!met()) {
      const result = mind.act('meet',{},context());
      actor.setFollowing(true); rememberVisit(); actor.react(result); global.LumoUI.speak(result);
    } else global.LumoUI.open();
  }
  function listGifts() { return Object.entries(labels).map(([id,label]) => ({id,label,count:world.inventory[id] || 0})); }
  function giveGift(id) {
    if (!Object.hasOwn(labels,id) || !world.inventory[id]) return false;
    world.inventory[id]--; save(); return true;
  }
  function hasHideout() {
    const state = mind.getState();
    return world.hideout || (met() && world.visits.length >= 3 && state.events.some(id => id === 'pet' || id.startsWith('gift:') || id.startsWith('game:')));
  }
  function rememberVisit() {
    if (!met()) return;
    if (!world.visits.includes(currentRoom)) world.visits.push(currentRoom);
    mind.remember('room',{id:roomIds[currentRoom]}); save();
  }
  global.LumoUI.mount({ mind, actor, getContext:context, pause, play:kind => HouseExperience.play(kind,{ui:true}),
    resumeFocus:focus, listGifts, giveGift,
    listGames:() => [{id:'hide_seek',label:'ESCONDIDAS'},{id:'memory',label:'MEMORIA'},{id:'melody',label:'ESCUCHAR SU TARAREO'}],
    startGame:startActivity, getCommentFrequency:() => world.frequency,
    setCommentFrequency:value => { if (['off','low','normal'].includes(value)) { world.frequency=value; mind.configure({commentFrequency:value}); save(); } }
  });
  global.LumoActivities.mount({
    pause:value => { pause(value); if (value) gameState = 'LUMO_GAME'; }, resumeFocus:focus,
    play:kind => HouseExperience.play(kind,{ui:true}),
    complete:(id,details) => {
      const result = mind.act('game',{game:id,result:'win',...details},context());
      actor.react(result); global.LumoUI.speak(result); save();
    }
  });
  function startActivity(id) {
    if (gameState !== 'PLAYING') return;
    if (id === 'memory') global.LumoActivities.start();
    else if (id === 'hide_seek') startHide();
    else if (id === 'melody') {
      const result = mind.act('hum',{},context());
      global.UndertaleAudio.hum(); lastHum = elapsed; actor.react(result); global.LumoUI.speak(result);
    }
  }
  function hidePlace() {
    const room = rooms[currentRoom], feet = getPlayerHitbox(), center = {x:feet.x+feet.width/2,y:feet.y+feet.height/2};
    const candidates = [];
    for (const floor of room.walkable) {
      const step = Math.max(24,Math.ceil(Math.sqrt(floor.width*floor.height/120)));
      for (let y=floor.y+8;y<floor.y+floor.height-6;y+=step) for(let x=floor.x+8;x<floor.x+floor.width-6;x+=step) {
        const gap=Math.hypot(x-center.x,y-center.y);
        // Stay on camera, accessible floor, outside doors. Lumo remains visible enough to find.
        if (gap>100 && gap<330 && canStand(x,y) && room.walkable.some(r => x>r.x+12 && x<r.x+r.width-12 && y>r.y+12 && y<r.y+r.height-12)
          && !room.exits.some(r => rectsOverlap({x:x-20,y:y-20,width:40,height:40},r))) candidates.push({x,y,roomId:currentRoom});
      }
    }
    return candidates.length ? candidates[Math.floor(Math.random()*candidates.length)] : null;
  }
  function startHide() {
    const point = hidePlace();
    if (!point || !actor.beginHide(point)) {
      global.LumoUI.speak({text:'Aquí no tengo un buen escondite. Probemos en una habitación más amplia; esconderme dentro de una pared sería hacer trampa.',emotion:'PLAYFUL',animation:'mock',source:'local'}); return;
    }
    hide = { round:1, roomId:currentRoom }; hideNode = document.createElement('div');
    hideNode.className='lumo-hide-status'; hideNode.setAttribute('role','status');
    hideNode.innerHTML='<span></span><button type="button">DEJAR PARA LUEGO</button>';
    hideNode.querySelector('button').addEventListener('click',cancelHide); document.body.append(hideNode); updateHideLabel();
    comment({text:'Me escondo por aquí. Encuéntrame y examíname con Z o toca mi sprite. Prometo no convertirme en un mueble. Bueno, intentaré.',emotion:'PLAYFUL',animation:'hide',source:'local'},true);
  }
  function updateHideLabel() { if (hideNode) hideNode.querySelector('span').textContent=`ESCONDIDAS ${hide.round} / 3 · Encuentra a Lumo `; }
  function cancelHide() { if (!hide) return; actor.endHide(); hide=null; hideNode?.remove(); hideNode=null; }
  function findHidden() {
    if (!hide) return false;
    if (hide.round >= 3) {
      cancelHide(); const result=mind.act('game',{game:'hide_seek',result:'win'},context()); actor.react(result); global.LumoUI.speak(result); return true;
    }
    hide.round++; const point=hidePlace();
    if (!point || !actor.beginHide(point)) { cancelHide(); return true; }
    updateHideLabel(); HouseExperience.play('confirm'); return true;
  }
  function pickup(object,id) {
    if (world.claimed.includes(object.id)) return false;
    world.claimed.push(object.id); world.inventory[id]=1; save();
    const text = id==='flower' ? '* Entre las macetas hay una flor de papel suelta.\n* La guardas para Lumo; las flores vivas se quedan aquí.'
      : id==='cookie' ? '* Hay una galleta lista en una servilleta.\n* La guardas para compartirla con Lumo.'
      : '* Encuentras una cinta lavanda de sobra.\n* La guardas para Lumo.';
    showDialog(text); HouseExperience.play('confirm'); return true;
  }
  function interact(object) {
    if (object.id==='lumo') { if (hide) return findHidden(); open(); return true; }
    if (object.id==='hallway_locked_door') {
      if (!hasHideout()) { showDialog('* La puerta está cerrada.\n* En la madera hay una estrella diminuta.'); return true; }
      world.hideout=true; save(); mind.remember('event',{id:'secret_room_found'});
      changeRoom({target:'lumoRoom',spawn:[120,158],facing:'up'}); return true;
    }
    if (currentRoom==='lumoRoom') {
      if (object.id==='lumo_drawing') {
        const result=mind.act('drawing',{},context()); actor.react(result);
        global.LumoUI.speak({ ...result,text:'Hay dos figuras dibujadas. Una parece ser Mira; la otra es Lumo. Debajo dice: MI MEJOR AMIGA.\n\n'+result.text }); return true;
      }
      if (object.id==='lumo_box') {
        const gifts=mind.getState().gifts.map(id=>labels[id]).filter(Boolean);
        showDialog('* Una caja de recuerdos.\n* '+(gifts.length ? 'Lumo guardó: '+gifts.join(', ')+'.' : 'Está lista para guardar aventuras, sin prisa.')); return true;
      }
      if (object.id==='lumo_desk' && !world.claimed.includes('lumo_drawing_pickup')) {
        world.claimed.push('lumo_drawing_pickup'); world.inventory.drawing=1; save();
        showDialog('* Dibujas una estrellita en un papel del escritorio.\n* Puedes regalársela a Lumo.'); return true;
      }
    }
    if (object.id==='basement_closet' && met()) {
      const result=mind.act('object',{object:'closet'},context()); actor.react(result); global.LumoUI.speak(result); return true;
    }
    if (met() && pickups[object.id] && pickup(object,pickups[object.id])) return true;
    return false;
  }
  function observe(object) {
    if (!met()) return;
    const id=objects[object.id]; if (!id) return;
    mind.remember('object',{id}); actor.perform('observe',2);
    if (id==='pc') actor.setEmotion('CURIOUS');
    else if (lastObject!==object.id) { lastObject=object.id; idle=0; pendingObject=id; }
  }
  function tick(dt) {
    if (!started) return;
    actor.update(dt);
    if (gameState==='PC') {
      if (!pcWasOpen && met()) { mind.remember('object',{id:'pc'}); actor.perform('observe',3); }
      pcWasOpen=true; return;
    }
    pcWasOpen=false;
    if (gameState!=='PLAYING' || document.hidden || !met() || hide) return;
    elapsed+=dt; idle=player.isMoving ? 0 : idle+dt;
    const pushing=Object.values(keys).some(Boolean) || joystickData.active;
    blocked=pushing && !player.isMoving ? blocked+dt : 0;
    const state=mind.getState();
    if (state.quietUntil>Date.now() || world.frequency==='off') return;
    const interval=world.frequency==='low' ? 90 : 45;
    if (elapsed-lastComment<interval) return;
    if (pendingObject) { const object=pendingObject; pendingObject=null; comment(mind.act('object',{object},context())); }
    else if (blocked>3) { blocked=0; comment(mind.act('wall',{},context())); }
    else if (idle>35) { idle=0; comment(mind.act('idle',{},context())); }
    else if (elapsed>80 && elapsed-lastHum>180 && world.visits.length>=2 && !state.events.includes('hummed_melody')) {
      lastHum=elapsed; global.UndertaleAudio.hum(); comment(mind.act('hum',{},context()));
    }
  }
  function draw(context2d, view, layer) {
    if (!started) return;
    const feet=getPlayerHitbox(), behind=actor.getState().y<=feet.y+feet.height/2;
    if ((layer==='back')===behind) actor.draw(context2d,view);
  }
  function roomChanged() {
    cancelHide(); actor.onRoomChange({roomId:currentRoom,room:rooms[currentRoom],player,feet:getPlayerHitbox(),state:gameState});
    const first=!world.visits.includes(currentRoom); rememberVisit(); idle=blocked=0;
    if (met() && first) actor.perform(currentRoom==='basementHallway' ? 'scared' : 'observe',2);
  }
  function start() {
    started=true; actor.setFollowing(met()); actor.onRoomChange({roomId:currentRoom,room:rooms[currentRoom],player,feet:getPlayerHitbox(),state:gameState}); rememberVisit();
    if (met()) comment(mind.act('reunion',{},context()),true);
  }
  // An optional side room, using the existing house's pixel furniture and palette.
  rooms.lumoRoom={ label:'El escondite de Lumo',nativeWidth:240,nativeHeight:180,
    walkable:[R(18,47,204,111),R(102,154,36,26)],solids:[R(27,55,37,42),R(159,55,30,38),R(181,109,25,24)],
    exits:[{...R(104,168,32,12),dir:'down',target:'hallway',spawn:[590,83],facing:'down'}],
    interactives:[{...R(27,55,37,42),id:'lumo_bed',text:'* Una cama diminuta.\n* La almohada parece una nube doblada.'},
      {...R(159,55,30,38),id:'lumo_desk',text:'* Un escritorio lleno de dibujos y estrellas.'},
      {...R(84,27,59,30),id:'lumo_drawing'}, {...R(181,109,25,24),id:'lumo_box'}], render:drawHideout };
  function drawHideout(target,view) {
    target.save(); target.translate(Math.round(-view.x),Math.round(-view.y)); target.scale(ROOM_SCALE,ROOM_SCALE); target.imageSmoothingEnabled=false;
    target.fillStyle='#000'; target.fillRect(0,0,240,180);
    target.fillStyle='#7a7db0'; target.fillRect(18,18,204,29); target.fillStyle='#4c5480'; target.fillRect(18,44,204,114);
    target.fillStyle='#666d9c'; for(let y=48;y<158;y+=10) {target.fillRect(18,y,204,1); for(let x=18+(y%20?20:0);x<222;x+=40)target.fillRect(x,y,1,10);}
    target.fillStyle='#454b71'; target.fillRect(102,154,36,26); target.fillStyle='#9294be'; target.fillRect(18,43,204,3);
    const original=roomImages.friskRoom;
    if (original.complete && original.naturalWidth) {
      target.drawImage(original,18,57,64,77,27,51,37,45);
      target.drawImage(original,25,131,35,61,159,45,30,49);
      target.drawImage(original,165,52,54,33,181,103,25,30);
    }
    target.fillStyle='#dddced'; target.fillRect(85,25,59,30); target.fillStyle='#20213c';
    // A deliberately childlike drawing, belonging to Lumo inside the story.
    target.fillRect(96,33,7,8); target.fillRect(96,42,7,8); target.fillRect(108,35,10,9);
    target.fillRect(110,44,6,4); target.fillStyle='#dddced'; target.fillRect(110,38,2,3);target.fillRect(114,38,2,3);
    target.fillStyle='#9c75bf';target.fillRect(96,44,7,2);target.fillStyle='#eebedb';target.fillRect(122,32,2,2);target.fillRect(126,32,2,2);target.fillRect(123,34,4,2);target.fillRect(124,36,2,1);
    target.font='5px Undertale,monospace'; target.fillStyle='#252238';target.fillText('MI MEJOR AMIGA',88,53);
    const gifts=mind.getState().gifts;
    gifts.forEach((id,index)=>{target.fillStyle=id==='flower' ? '#e5abc9' : id==='cookie' ? '#d9b17a' : '#b89de4';target.fillRect(165+index*5,48,3,4);});
    target.restore();
  }
  if (rooms.basementHallway.interactives[0]) {
    rooms.basementHallway.interactives[0].id='basement_closet';
    rooms.basementHallway.interactives[0].text='* El clóset permanece cerrado.\n* Por ahora no puedes abrirlo.';
  }
  document.getElementById('btn-lumo').addEventListener('click',open);
  document.addEventListener('lumo:privacy',event => {
    if (event.detail?.persistMemory === false) {
      try { localStorage.removeItem(KEY); } catch {}
    } else save();
  });
  global.addEventListener('keydown',event=>{
    if (event.target?.closest?.('input,textarea,[contenteditable="true"]')) return;
    if (event.code==='KeyL' && gameState==='PLAYING') {event.preventDefault();open();}
    if (event.code==='Escape' && hide && gameState==='PLAYING') {event.preventDefault();cancelHide();}
  });
  canvas.addEventListener('pointerup',event=>{
    if (gameState!=='PLAYING' || event.button!==0) return;
    const rect=canvas.getBoundingClientRect(), x=(event.clientX-rect.left)*canvas.width/rect.width+camera.x, y=(event.clientY-rect.top)*canvas.height/rect.height+camera.y;
    const a=actor.getState(), feet=getPlayerHitbox();
    if (Math.abs(x-a.x)<25 && y>a.y-52 && y<a.y+4 && (!hide || Math.hypot(a.x-feet.x,a.y-feet.y)<72)) { hide ? findHidden() : open(); }
  });
  document.querySelector('gaming-desktop').addEventListener('fnf-original:win',()=>{
    if (met()) { mind.act('game',{game:'fnf',result:'win'},context()); actor.perform('celebrate',3); }
  });
  global.LumoGame=Object.freeze({start,tick,draw,roomChanged,interact,observe,open,
    getInteraction:(probe,feet)=>actor.getInteraction(probe,feet),
    getState:()=>({chapter:'HOME',world:clone(world),actor:actor.getState(),mind:mind.getState(),activity:hide ? clone(hide) : global.LumoActivities.active ? 'memory' : null}),
    get actor(){return actor;}
  });
})(window);
