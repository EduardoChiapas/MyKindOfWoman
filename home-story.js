/* HOME-only story engine and compact optional activities. Model text cannot set facts. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeStory=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const PHOTO_IDS=['photo_window','photo_music','photo_lumo'];
  const ANOMALIES=['anomaly_session','anomaly_photo','anomaly_piano','anomaly_message','anomaly_lumo','anomaly_door'];
  const NOTES=[261.626,329.628,293.665,391.995];
  const ROOM_KEYS={entrance:'entrance',livingRoom:'livingroom',hallway:'hallway',friskRoom:'friskroom',torielRoom:'torielroom',kitchen:'kitchen',lumoRoom:'lumoroom'};
  const PHOTO_TEXT={
    photo_window:{title:'La habitación',text:'Una habitación conocida, con sus libros y sus pequeños rincones. No hay fecha ni personas en la imagen.'},
    photo_music:{title:'Cuatro notas',text:'Una partitura corta: DO · MI · RE · SOL. El papel tiene sitio para más música.'},
    photo_lumo:{title:'Una criatura dibujada',text:'Una capucha doblada y dos ojos blancos. Alguien se tomó muy en serio dibujar a Lumo. Una estrella ocupa la esquina.'}
  };
  const HINTS={anomaly_session:'Vuelve a la computadora después de explorar.',anomaly_photo:'Vuelve a mirar el recuerdo de tu habitación.',
    anomaly_piano:'Hay una partitura sobre el piano de la sala.',anomaly_message:'Comprueba la computadora una vez más.',
    anomaly_lumo:'Da un paseo con Lumo y vuelve a hablarle.',anomaly_door:'Mira la entrada cerrada junto a las escaleras.'};
  const DOOR_PAGES=[{text:'* La puerta está cerrada.'},{text:'* No recuerdas haberla visto abierta.'},{text:'* ...'},
    {text:'* Se escucha algo al otro lado.'},{speaker:'LUMO',text:'Eh...',emotion:'SCARED'},
    {speaker:'LUMO',text:'¿Mira?',emotion:'SCARED'},{speaker:'LUMO',text:'No me gusta mucho esa puerta.',emotion:'SCARED'}];

  function createCore(progress,emit=()=>{}){
    if(!progress||typeof progress.record!=='function')throw TypeError('HomeStory necesita HomeProgress.');
    const saved=progress.getState(),lastSavedAnomaly=[...ANOMALIES].reverse().find(id=>progress.has(id));
    const savedRoom=lastSavedAnomaly&&Object.entries(ROOM_KEYS).find(([,key])=>saved.interactions?.[`${lastSavedAnomaly}_at_${key}`]);
    let elapsed=0,lastAnomalyAt=0,currentRoom=null,lastAnomalyRoom=savedRoom?.[0]||null,roomsSince=new Set(),spacing=15;
    let recipeSteps=[],recentNotes=[],finalePhase=progress.has('home_complete')?'complete':
      !ANOMALIES.every(id=>progress.has(id))?'idle':progress.has('home_knock_third')?'fade':
      progress.has('home_knock_second')?'dialogue':progress.has('home_knock_first')?'waiting':'idle';
    const emitEvent=(type,data={})=>emit({type,...data});
    const allAnomalies=()=>ANOMALIES.every(id=>progress.has(id));
    function prerequisites(){const s=progress.getState();return progress.has('lumo_met')&&progress.has('pc_found')&&progress.has('ryon_met')&&
      progress.has('memory_collection')&&s.visits.filter(id=>id!=='lumoRoom').length>=5;}
    function roomChanged(room){if(!ROOM_KEYS[room]||!progress.visit(room))return false;
      if(room!==currentRoom){currentRoom=room;if(room!==lastAnomalyRoom)roomsSince.add(room);}return true;}
    function tick(dt,context={}){if(!context.hidden&&(!context.state||context.state==='PLAYING')){
      elapsed+=Math.max(0,Math.min(.1,Number(dt)||0));
      if(currentRoom==='entrance'&&allAnomalies()&&elapsed-lastAnomalyAt+1e-6>=2&&!progress.has('home_knock_first'))firstKnock();}}
    function tryAnomaly(id){
      if(!currentRoom||id!==progress.nextAnomaly()||!prerequisites()||elapsed-lastAnomalyAt+1e-6<spacing||roomsSince.size===0||progress.has('home_complete'))return false;
      if(!progress.recordAnomaly(id))return false;
      progress.touch(`${id}_at_${ROOM_KEYS[currentRoom]}`);
      lastAnomalyAt=elapsed;lastAnomalyRoom=currentRoom;roomsSince.clear();emitEvent('anomaly',{id});return true;
    }
    function inspectPhoto(id){
      if(!PHOTO_IDS.includes(id))return null;
      const seen=progress.has(id);progress.touch(id);if(progress.record(id))emitEvent('photo-collected',{id});
      if(PHOTO_IDS.every(key=>progress.has(key))&&progress.record('memory_collection'))emitEvent('album-complete',{id:'memory_collection'});
      const changed=seen&&id==='photo_window'&&tryAnomaly('anomaly_photo');
      return {...PHOTO_TEXT[id],id,changed:changed||id==='photo_window'&&progress.has('anomaly_photo'),first:!seen};
    }
    function pcNotice(){
      progress.record('pc_found');
      if(tryAnomaly('anomaly_session'))return {id:'anomaly_session',text:'SESIÓN CERRADA. La pantalla parpadea y vuelve a mostrar el escritorio.',source:'local'};
      if(tryAnomaly('anomaly_message'))return {id:'anomaly_message',text:'Sin remitente: «¿Sigues ahí?» No hay dirección ni enlace para responder.',source:'local'};
      return null;
    }
    function playNote(index){if(!Number.isInteger(index)||index<0||index>=NOTES.length)return false;
      if(progress.record('piano_played'))emitEvent('piano',{id:'piano_played'});
      recentNotes.push(index);recentNotes=recentNotes.slice(-4);emitEvent('note',{index,frequency:NOTES[index]});
      if(recentNotes.join(',')==='0,1,2,3'&&progress.record('home_melody_found'))emitEvent('melody-found',{id:'home_melody_found'});return true;}
    function inspectPiano(){progress.touch('home_piano');return tryAnomaly('anomaly_piano');}
    function cookStep(choice){
      const choices=[['gentle','enthusiastic'],['pinch','extra_cinnamon'],['soft','crispy']];
      if(recipeSteps.length>=3||!choices[recipeSteps.length].includes(choice))return {accepted:false};
      recipeSteps.push(choice);if(recipeSteps.length<3)return {accepted:true,step:recipeSteps.length};
      const recipe=recipeSteps[1]==='extra_cinnamon'?'extra_cinnamon':recipeSteps[2]==='crispy'?'crispy':'balanced';
      progress.setRecipe(recipe);emitEvent('cooked',{id:'cooked',recipe});return {accepted:true,done:true,recipe};
    }
    function firstKnock(){if(!allAnomalies()||progress.has('home_complete')||progress.has('home_knock_first'))return false;
      finalePhase='waiting';progress.record('home_knock_first');emitEvent('knock',{id:'home_knock_first',number:1});return true;}
    function approachDoor(){if(!allAnomalies()||progress.has('home_complete'))return null;
      if(!progress.has('home_knock_first')){firstKnock();return null;}
      if(finalePhase==='fade')return null;
      progress.record('investigate_door');if(progress.record('home_knock_second'))emitEvent('knock',{id:'home_knock_second',number:2});
      finalePhase='dialogue';return DOOR_PAGES.map(page=>({...page}));}
    function finishDoorDialogue(){if(finalePhase!=='dialogue'||!allAnomalies()||!progress.has('home_knock_second'))return false;
      if(progress.record('home_knock_third'))emitEvent('knock',{id:'home_knock_third',number:3});finalePhase='fade';emitEvent('ending-call');return true;}
    function completeHome(){if(finalePhase!=='fade'||!progress.has('home_knock_third')||!allAnomalies())return false;
      progress.record('home_complete');finalePhase='complete';emitEvent('home-complete',{id:'home_complete'});return true;}
    return Object.freeze({roomChanged,tick,tryAnomaly,inspectPhoto,pcNotice,playNote,inspectPiano,cookStep,firstKnock,approachDoor,
      finishDoorDialogue,completeHome,allAnomalies,prerequisites,
      onRyonmessage(){progress.record('pc_found');if(progress.record('ryon_met'))emitEvent('ryon',{id:'ryon_met'});return true;},
      resetRecipe(){recipeSteps=[];},waterFlower(){const first=progress.waterFlower();emitEvent('garden',{id:'flower_watered',first});return first;},
      setBriefPacing(enabled){spacing=enabled?8:15;},
      hint(){return progress.has('home_complete')?'Puedes seguir explorando HOME. La puerta permanece cerrada.':
        !prerequisites()?'Explora, conversa y reúne los tres recuerdos. Las actividades secundarias pueden esperar.':HINTS[progress.nextAnomaly()]||'La entrada del sótano sigue cerrada. Acércate con Lumo.';},
      getState(){return {elapsed,currentRoom,lastAnomalyAt,lastAnomalyRoom,spacing,roomsSince:roomsSince.size,finalePhase,
        recipeSteps:recipeSteps.length,melodyFound:progress.has('home_melody_found'),complete:progress.has('home_complete')};}
    });
  }

  let adapter,progress,core,started=false,panel=null,sequence=null,ending=null,photoImages=new Map(),journalButton=null;
  const getContext=()=>adapter?.getContext()||{};
  const actor=()=>adapter?.actor||global?.LumoGame?.actor;
  function image(src){if(!global||!src)return null;if(photoImages.has(src))return photoImages.get(src);
    const result=new global.Image();result.src=src;photoImages.set(src,result);return result;}
  function emit(event){
    if(event.type==='note')adapter.audio?.note?.(event.index,{frequency:event.frequency});
    if(event.type==='knock'){adapter.audio?.knock?.();actor()?.cancelTask?.('story');actor()?.setEmotion?.('SCARED');actor()?.setFollowing?.(false);}
    if(event.type==='ending-call'){adapter.callBuddy?.();if(!adapter.callBuddy)actor()?.call?.({hurry:false});}
    if(event.type==='cooked')actor()?.perform?.('eat',3);
    if(event.type==='garden')actor()?.perform?.('observe',2);
    adapter.onEvent?.(event);
  }
  function mount(value){adapter=value;progress=value.progress||global.HomeProgress;core=createCore(progress,emit);
    if(!global.document)return;
    journalButton=global.document.createElement('button');journalButton.className='home-journal-chip';journalButton.type='button';
    journalButton.textContent='DIARIO · J';journalButton.setAttribute('aria-label','Abrir diario de HOME');journalButton.addEventListener('click',openJournal);
    global.document.body.append(journalButton);
    global.addEventListener('keydown',event=>{
      if(event.target?.closest?.('input,textarea,[contenteditable="true"]'))return;
      if(event.code==='KeyJ'&&!event.repeat&&started&&!sequence&&!ending){event.preventDefault();panel?closePanel():openJournal();}
      if(panel&&['Escape','KeyX'].includes(event.code)){event.preventDefault();closePanel();}
    });
    registerObjects();
  }
  function registerObjects(){
    const room=adapter.rooms?.livingRoom;if(!room||room.interactives.some(item=>item.id==='home_piano'))return;
    const R=adapter.R||((x,y,width,height)=>({x:x*2,y:y*2,width:width*2,height:height*2}));
    room.interactives.push({...R(32,87,74,35),id:'home_piano',label:'Piano y partitura'});
    room.solids.push(R(34,88,70,29));
  }
  function closePanel(){if(!panel)return;panel.remove();panel=null;global.document.body.classList.remove('home-story-open');
    adapter.pause?.(false);adapter.resumeFocus?.();}
  function makePanel(title){closePanel();panel=global.document.createElement('section');panel.className='home-story-panel';
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',title);
    const heading=global.document.createElement('h2');heading.textContent=title;panel.append(heading);
    const body=global.document.createElement('div');body.className='home-story-body';panel.append(body);
    const close=button('VOLVER · X / ESC',closePanel);close.className='home-story-close';panel.append(close);
    panel.addEventListener('keydown',event=>{if(event.code!=='Tab')return;
      const nodes=[...panel.querySelectorAll('button,input,select')].filter(node=>!node.disabled),index=nodes.indexOf(global.document.activeElement);
      if(event.shiftKey&&index<=0){event.preventDefault();nodes.at(-1)?.focus();}else if(!event.shiftKey&&index===nodes.length-1){event.preventDefault();nodes[0]?.focus();}});
    global.document.body.append(panel);global.document.body.classList.add('home-story-open');adapter.pause?.(true);close.focus();return body;}
  function button(label,onClick){const node=global.document.createElement('button');node.type='button';node.textContent=label;node.addEventListener('click',onClick);return node;}
  function paragraph(body,text){const node=global.document.createElement('p');node.textContent=text;body.append(node);return node;}
  function openJournal(){if(!started||!['PLAYING','HOME_STORY','HOME_ACTIVITY'].includes(getContext().state))return;
    const body=makePanel('DIARIO · HOME');const hint=paragraph(body,core.hint());hint.className='home-story-hint';
    for(const kind of ['main','side']){const heading=global.document.createElement('h3');heading.textContent=kind==='main'?'La casa':'A tu ritmo';body.append(heading);
      const list=global.document.createElement('ul');list.className='home-quest-list';
      for(const quest of progress.quests().filter(item=>item.kind===kind)){const item=global.document.createElement('li');item.textContent=(quest.done?'✓ ':'○ ')+quest.label;list.append(item);}body.append(list);}
    body.append(button('VER ÁLBUM',openAlbum));
    if(adapter.openCompanionActions){const available=adapter.canCompanionActions?.()===true;
      const companion=button('COMPAÑÍA · JUEGOS Y RECUERDOS',()=>{closePanel();adapter.openCompanionActions();});companion.disabled=!available;body.append(companion);
      if(!available)paragraph(body,'Llama a Lumo y acércate para compartir una actividad.');}
    const pace=button(core.getState().spacing===8?'RITMO DE PISTAS: BREVE':'RITMO DE PISTAS: TRANQUILO',()=>{core.setBriefPacing(core.getState().spacing!==8);openJournal();});body.append(pace);
    paragraph(body,'El ritmo breve reduce la espera entre cambios. Todavía debes volver a explorar; no salta escenas.');}
  function openAlbum(){const body=makePanel('RECUERDOS DE CASA');paragraph(body,'Tres pequeñas imágenes de la casa.');
    for(const id of PHOTO_IDS){if(progress.has(id))body.append(button(PHOTO_TEXT[id].title,()=>openPhoto(id)));else paragraph(body,'Un espacio por llenar.');}}
  function drawPhoto(canvas,id,changed){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#252234';ctx.fillRect(0,0,240,168);
    ctx.fillStyle='#dfd4af';ctx.fillRect(8,8,224,152);ctx.fillStyle='#444055';ctx.fillRect(14,14,212,140);
    if(id==='photo_window'){const source=image('assets/rooms/frisk_room.png');if(source?.complete&&source.naturalWidth)ctx.drawImage(source,0,0,source.naturalWidth,source.naturalHeight,52,18,136,134);
      if(changed){ctx.fillStyle='#b4b6cc';ctx.fillRect(90,31,4,3);}}
    if(id==='photo_music'){ctx.fillStyle='#eee9cf';ctx.fillRect(25,28,190,112);ctx.fillStyle='#423b50';for(let y=56;y<=88;y+=8)ctx.fillRect(38,y,162,1);
      for(const [index,y] of [80,64,72,56].entries()){ctx.fillRect(55+index*38,y,8,5);ctx.fillRect(61+index*38,y-24,2,26);}
      ctx.font='12px monospace';ctx.fillText('DO  MI  RE  SOL',43,123);}
    if(id==='photo_lumo'){ctx.fillStyle='#e5dfcf';ctx.fillRect(31,24,178,120);const frame=global.LUMO_ASSETS?.portraits?.emotions?.NORMAL;
      const source=frame&&image(frame.sheet);if(source?.complete&&source.naturalWidth){const r=frame.rect;ctx.drawImage(source,r.x,r.y,r.width,r.height,80,35,80,80);}
      ctx.fillStyle='#8065a4';ctx.fillRect(177,39,3,11);ctx.fillRect(173,43,11,3);ctx.font='11px monospace';ctx.fillStyle='#484052';ctx.fillText('LUMO',99,130);}}
  function openPhoto(id){const photo=core.inspectPhoto(id);if(!photo)return;const body=makePanel(photo.title);
    const canvas=global.document.createElement('canvas');canvas.width=240;canvas.height=168;canvas.className='home-photo';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',photo.title);body.append(canvas);
    const redraw=()=>drawPhoto(canvas,id,photo.changed);redraw();for(const source of photoImages.values())if(!source.complete)source.addEventListener('load',redraw,{once:true});
    paragraph(body,photo.changed?'La pequeña marca de la esquina parecía estar en otro lugar. Miras de nuevo; la imagen permanece quieta.':photo.text);
    paragraph(body,photo.first?'Guardas este recuerdo en el álbum.':'Este recuerdo ya está en tu álbum.');body.append(button('ÁLBUM',openAlbum));}
  function openPiano(){const anomaly=core.inspectPiano(),body=makePanel('PIANO DE CASA');paragraph(body,anomaly?'Una nota suena apenas más baja de lo esperado. La casa vuelve a guardar silencio.':'Hay cuatro teclas señaladas en una partitura corta.');
    if(anomaly)adapter.audio?.note?.(2,{odd:true,frequency:277.18});
    const keyboard=global.document.createElement('div');keyboard.className='home-piano-keys';body.append(keyboard);
    ['DO','MI','RE','SOL'].forEach((label,index)=>keyboard.append(button(`${index+1} · ${label}`,()=>{core.playNote(index);status.textContent=progress.has('home_melody_found')?'Reconoces las cuatro notas que Lumo tararea.':'La nota queda flotando un momento.';})));
    const status=paragraph(body,'Puedes tocar sin acertar ni perder.');status.setAttribute('role','status');
    body.append(button('MIRAR Y GUARDAR LA PARTITURA',()=>openPhoto('photo_music')));
    panel.addEventListener('keydown',event=>{const index=['Digit1','Digit2','Digit3','Digit4'].indexOf(event.code);if(index>=0&&!event.repeat){event.preventDefault();keyboard.children[index].click();}});}
  function openCooking(){core.resetRecipe();const body=makePanel('COCINAR CON LUMO');let step=0;
    const prompts=[['La mezcla espera. Lumo supervisa desde una distancia prudentísima.',['Mezclar despacio','Mezclar con entusiasmo'],['gentle','enthusiastic']],
      ['Ahora, la canela. «Mi medida oficial es: depende del hambre».',['Una pizca','Un poco más de canela'],['pinch','extra_cinnamon']],
      ['Último paso: el horno. «No pienso convertirme en ingrediente».',['Horneado suave','Más crujiente'],['soft','crispy']]];
    function paint(){body.replaceChildren();if(step===3){const recipe=progress.getState().recipe;
      paragraph(body,recipe==='extra_cinnamon'?'La receta huele intensamente a canela. Lumo declara que inventaste el otoño.':recipe==='crispy'?'La superficie cruje. «Por fin comida con efectos de sonido», celebra Lumo.':'La receta quedó suave. Lumo toma una miguita y finge ser un crítico gastronómico.');
      paragraph(body,'Guardas el resultado. Ninguna receta es incorrecta.');return;}
      paragraph(body,`${step+1} / 3 · ${prompts[step][0]}`);prompts[step][1].forEach((label,index)=>body.append(button(label,()=>{
        const result=core.cookStep(prompts[step][2][index]);if(result.accepted){step++;paint();body.querySelector('button')?.focus();}})));}
    paint();body.querySelector('button')?.focus();}
  function openGarden(){const body=makePanel('CUIDAR LA FLOR');const watered=progress.has('flower_watered');
    paragraph(body,watered?'La tierra conserva humedad. Basta con acompañar su crecimiento, sin hacer nada más.':'La flor sigue en su maceta. Hay una pequeña regadera cerca.');
    if(!watered)body.append(button('REGAR CON CUIDADO',()=>{core.waterFlower();openGarden();}));
    paragraph(body,'La flor se queda en la casa. Su cuidado se conserva en la partida.');}
  function beginSequence(pages,done){closePanel();sequence={pages,index:0,waiting:false,done};}
  function tickSequence(){if(!sequence)return;if(sequence.waiting){if(adapter.isDialogOpen?.())return;sequence.waiting=false;}
    if(sequence.index>=sequence.pages.length){const done=sequence.done;sequence=null;done?.();return;}
    const page=sequence.pages[sequence.index++];adapter.showDialog?.(page.text,{speaker:page.speaker||null,emotion:page.emotion||null});sequence.waiting=true;}
  function beginEnding(){closePanel();adapter.pause?.(true,{allowLumoMotion:true});adapter.setEnding?.(true);
    ending={elapsed:0,complete:false,node:global.document.createElement('section')};ending.node.className='home-ending';ending.node.setAttribute('role','dialog');ending.node.setAttribute('aria-label','Final de HOME');
    const content=global.document.createElement('div');content.className='home-ending-content';content.innerHTML='<p>CHAPTER 1 COMPLETE</p><h2>HOME</h2><p>CONTINUARÁ...</p>';
    const explore=button('SEGUIR EXPLORANDO HOME',()=>{ending.node.remove();ending=null;adapter.setEnding?.(false);adapter.pause?.(false);actor()?.setEmotion?.('NORMAL');actor()?.setFollowing?.(true);adapter.resumeFocus?.();});
    explore.hidden=true;content.append(explore);ending.node.append(content);global.document.body.append(ending.node);ending.button=explore;}
  function doorInteraction(){progress.touch('entrance_basement_door');
    if(progress.has('home_complete')){adapter.showDialog?.('* La puerta sigue cerrada.\n* HOME ha terminado; puedes seguir visitando la casa.');return true;}
    if(core.tryAnomaly('anomaly_door')){actor()?.faceToward?.({x:425,y:223});actor()?.perform?.('scared',2);
      adapter.showDialog?.('* Lumo mira la puerta durante unos segundos.\n* Después vuelve a mirarte, sin una de sus bromas habituales.');return true;}
    if(!core.allAnomalies()){adapter.showDialog?.('* La puerta del sótano está cerrada.\n* No puedes entrar durante HOME.');return true;}
    const pages=core.approachDoor();if(pages)beginSequence(pages,()=>{core.finishDoorDialogue();beginEnding();});
    else adapter.showDialog?.('* Un golpe rompe el silencio.\n* Lumo deja de moverse. La puerta sigue cerrada.');return true;}
  function interact(object){const context=getContext();if(!started||!object||panel||sequence||ending||context.hidden||context.state!=='PLAYING')return false;
    const room=context.roomId,id=object.id;if(!ROOM_KEYS[room]||room!==core.getState().currentRoom)return false;
    if(room==='entrance'&&id==='entrance_basement_door')return doorInteraction();
    if(room==='livingRoom'&&id==='home_piano'){openPiano();return true;}
    if(room==='friskRoom'&&id==='frisk_bookshelf'){openPhoto('photo_window');return true;}
    if(room==='hallway'&&id==='hallway_painting'){openPhoto('photo_lumo');return true;}
    if(room==='kitchen'&&['kitchen_counter','kitchen_stove'].includes(id)){openCooking();return true;}
    if(room==='friskRoom'&&['frisk_little_plant','frisk_corner_plant'].includes(id)||room==='hallway'&&id==='hallway_flowers'){openGarden();return true;}
    if(id==='lumo'&&core.tryAnomaly('anomaly_lumo')){actor()?.setEmotion?.('CONFUSED');actor()?.perform?.('confused',3);
      beginSequence([{speaker:'LUMO',emotion:'CONFUSED',text:'¿Yo ya había escuchado esa melodía aquí?... Qué raro. Se me fue la idea.'}],()=>{});return true;}
    return false;}
  function start(){started=true;core.roomChanged(getContext().roomId);journalButton?.classList.add('is-ready');
    if(['waiting','dialogue'].includes(core.getState().finalePhase)){actor()?.cancelTask?.('story');actor()?.setEmotion?.('SCARED');actor()?.setFollowing?.(false);}
    if(core.getState().finalePhase==='fade')beginEnding();
    else if(core.getState().finalePhase==='dialogue')beginSequence(DOOR_PAGES,()=>{core.finishDoorDialogue();beginEnding();});}
  function roomChanged(){if(!started)return;closePanel();core.roomChanged(getContext().roomId);}
  function tick(dt){if(!started)return;const context=getContext();core.tick(dt,context);tickSequence();
    if(ending&&!context.hidden){ending.elapsed+=Math.min(.1,Math.max(0,Number(dt)||0));const t=Math.min(1,ending.elapsed/(context.reducedMotion?.2:1.1));ending.node.style.opacity=String(t);
      if(ending.elapsed>=1.3&&!ending.complete){core.completeHome();ending.complete=true;ending.button.hidden=false;ending.button.focus();}}
  }
  function draw(ctx,camera={x:0,y:0}){if(!started)return;const room=getContext().roomId;
    if(room==='entrance'&&progress.barrier?.('entrance')){drawClosedDoor(ctx,camera);return;}
    if(room!=='livingRoom')return;
    ctx.save();ctx.translate(Math.round(68-camera.x),Math.round(176-camera.y));ctx.scale(2,2);ctx.imageSmoothingEnabled=false;
    // No original piano sprite exists. This explicit code-native placeholder
    // uses the room's wood palette; no original map or bitmap is replaced.
    ctx.fillStyle='#3f2d1d';ctx.fillRect(0,0,70,29);ctx.fillStyle='#644826';ctx.fillRect(1,1,68,26);
    ctx.fillStyle='#b88245';ctx.fillRect(2,2,66,12);ctx.fillStyle='#d4a15d';ctx.fillRect(3,2,64,1);
    ctx.fillStyle='#9b6c37';ctx.fillRect(4,6,62,1);ctx.fillRect(6,11,58,1);
    ctx.fillStyle='#49321e';ctx.fillRect(2,25,6,4);ctx.fillRect(62,25,6,4);
    ctx.fillStyle='#352a23';ctx.fillRect(1,15,68,9);ctx.fillStyle='#efddb0';for(let x=4;x<66;x+=6)ctx.fillRect(x,16,5,7);
    ctx.fillStyle='#302529';for(const x of [8,14,26,32,38,50,56])ctx.fillRect(x,15,3,4);ctx.fillStyle='#f1e5b9';ctx.fillRect(27,-5,16,11);
    ctx.fillStyle='#574936';for(let y=-2;y<5;y+=2)ctx.fillRect(29,y,12,1);ctx.restore();}
  function drawClosedDoor(ctx,camera){
    // Code-native overlay exactly on the central HOME barrier; the PNG stays intact.
    ctx.save();ctx.translate(Math.round(410-camera.x),Math.round(190-camera.y));ctx.scale(2,2);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#3c2517';ctx.fillRect(0,0,15,33);ctx.fillStyle='#ce9454';ctx.fillRect(1,1,13,31);
    ctx.fillStyle='#ebbb78';ctx.fillRect(1,1,1,31);ctx.fillRect(1,1,13,1);
    ctx.fillStyle='#79512e';ctx.fillRect(3,4,8,12);ctx.fillRect(3,19,8,10);
    ctx.fillStyle='#b67d43';ctx.fillRect(4,5,6,10);ctx.fillRect(4,20,6,8);
    ctx.fillStyle='#4c301c';ctx.fillRect(2,17,2,2);ctx.fillStyle='#efd080';ctx.fillRect(2,17,1,1);
    ctx.fillStyle='#664025';ctx.fillRect(12,7,2,2);ctx.fillRect(12,24,2,2);
    ctx.restore();}
  return Object.freeze({createCore,mount,start,roomChanged,interact,tick,draw,openJournal,openAlbum,
    renderPhoto(canvas,id){if(!PHOTO_IDS.includes(id))return false;const paint=()=>drawPhoto(canvas,id,progress.has('anomaly_photo')&&id==='photo_window');paint();for(const source of photoImages.values())if(!source.complete)source.addEventListener('load',()=>{if(canvas.isConnected)paint();},{once:true});return true;},
    onPCopen(){return core?.pcNotice()||null;},onRyonmessage(){return core?.onRyonmessage()||false;},
    getState(){return core?{...core.getState(),active:!!panel||!!sequence||!!ending,photos:progress.getState().photos}:null;},
    get active(){return !!panel||!!sequence||!!ending;},get ending(){return !!ending;},PHOTO_IDS,ANOMALIES,NOTES});
});
