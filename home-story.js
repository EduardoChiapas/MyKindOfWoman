/* HOME-only story engine and compact optional activities. Model text cannot set facts. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeStory=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const PHOTO_IDS=['photo_window','photo_music','photo_lumo'];
  const ANOMALIES=['anomaly_session','anomaly_photo','anomaly_piano','anomaly_message','anomaly_lumo','anomaly_door'];
  const NOTES=[261.626,329.628,293.665,391.995];
  const ROOM_KEYS={entrance:'entrance',livingRoom:'livingroom',hallway:'hallway',friskRoom:'friskroom',torielRoom:'torielroom',kitchen:'kitchen',lumoRoom:'lumoroom',gallery:'gallery',bathroom:'bathroom',readingRoom:'readingroom',gardenHall:'gardenhall',garden:'garden'};
  const PHOTO_TEXT={
    photo_window:{title:'La habitación',text:'Una habitación conocida, con sus libros y sus pequeños rincones. No hay fecha ni personas en la imagen.'},
    photo_music:{title:'Cuatro notas',text:'Una partitura corta: DO · MI · RE · SOL. El papel tiene sitio para más música.'},
    photo_lumo:{title:'Una criatura dibujada',text:'Una capucha doblada y dos ojos blancos. Alguien se tomó muy en serio dibujar a Lumo. Una estrella ocupa la esquina.'}
  };
  const HINTS={anomaly_session:'Vuelve a la computadora después de explorar.',anomaly_photo:'Vuelve a mirar el recuerdo de tu habitación.',
    anomaly_piano:'Vuelve a escuchar las cuatro notas en la sala de lectura y música.',anomaly_message:'Comprueba la computadora una vez más.',
    anomaly_lumo:'Da un paseo con Lumo y vuelve a hablarle.',anomaly_door:'Mira la bajada al sótano junto a las escaleras.'};
  const DOOR_PAGES=[{text:'* Las escaleras descienden hacia la oscuridad.'},{text:'* No puedes bajar.'},{text:'* ...'},
    {text:'* Se escucha algo desde abajo.'},{speaker:'LUMO',text:'Eh...',emotion:'SCARED'},
    {speaker:'LUMO',text:'¿Mira?',emotion:'SCARED'},{speaker:'LUMO',text:'No me gusta mucho esa bajada.',emotion:'SCARED'}];

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
      hint(){return progress.has('home_complete')?'Puedes seguir explorando HOME. No puedes bajar al sótano.':
        !prerequisites()?'Explora, conversa y reúne los tres recuerdos. Las actividades secundarias pueden esperar.':HINTS[progress.nextAnomaly()]||'No puedes bajar al sótano. Acércate con Lumo.';},
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
  }
  function closePanel(){if(!panel)return;panel.remove();panel=null;global.document.body.classList.remove('home-story-open');
    adapter.pause?.(false);adapter.resumeFocus?.();}
  function makePanel(title){closePanel();panel=global.document.createElement('section');panel.className='home-story-panel';
    panel.classList.toggle('home-quiet',getContext().reducedMotion===true);
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
  function activitySound(name){if(global.UndertaleAudio?.effect?.(name,{volume:.28,ui:true})!==true)global.HouseExperience?.play?.('confirm',{ui:true});}
  function activityArt(body,kind,stage=0,variant=''){
    const canvas=global.document.createElement('canvas');canvas.width=96;canvas.height=40;canvas.className='home-activity-art';
    canvas.setAttribute('aria-hidden','true');body.append(canvas);paintActivity(canvas,kind,stage,variant);return canvas;
  }
  function paintActivity(canvas,kind,stage=0,variant=''){
    const brush=canvas.getContext('2d');brush.imageSmoothingEnabled=false;brush.clearRect(0,0,96,40);
    const fill=(color,x,y,w,h)=>{brush.fillStyle=color;brush.fillRect(Math.round(x),Math.round(y),w,h);};
    const paper='#fff0ca',edge='#b88d5b',gold='#ffdb71',purple='#b68af4',mint='#81d2af',cyan='#82d3e8',coral='#f7829d';
    if(kind==='piano'){
      fill('#6c4b72',2,2,92,36);fill(paper,3,3,90,34);fill(edge,5,5,86,1);fill('#fff9df',5,6,86,1);
      for(let y=13;y<=25;y+=4)fill('#c2a78e',9,y,78,1);
      [25,17,21,13].forEach((y,index)=>{const color=index<stage?[coral,gold,cyan,purple][index]:'#53405b';fill(color,17+index*19,y,5,3);fill(color,21+index*19,y-8,1,10);});
      for(let index=0;index<4;index++){fill('#53405b',25+index*12,31,5,3);if(index<stage)fill(mint,26+index*12,32,3,1);}
    }else if(kind==='cooking'){
      fill('#32263d',14,37,68,2);
      if(stage<2){
        fill(edge,20,19,56,3);fill(mint,23,22,50,9);fill('#54a68c',23,28,50,3);fill(mint,27,31,42,3);fill(edge,31,34,34,2);fill(paper,25,23,46,1);
        fill(gold,25,20,46,2);fill(purple,44,4,3,19);fill('#e0c4ff',44,4,1,14);fill(purple,42,19,8,3);
        fill(paper,11,15,7,10);fill(cyan,12,16,5,3);fill(edge,12,14,5,1);
        if(stage===1){fill(edge,73,2,9,11);fill('#e9ae6b',74,5,7,7);fill(paper,74,3,7,2);for(const [x,y]of [[67,12],[64,15],[60,18],[57,19]])fill(gold,x,y,1,1);}
      }else{
        fill('#6d536e',20,3,56,32);fill(purple,22,5,52,6);fill('#dfc9fb',23,5,50,1);fill('#201627',24,14,48,17);fill(gold,30,22,36,6);fill(variant==='crispy'?edge:paper,33,20,30,3);
        if(variant==='extra_cinnamon')for(const x of [35,41,47,53,59])fill(edge,x,20+(x%3),1,1);
        [28,36,44,52,60,68].forEach(x=>fill(x%3?coral:cyan,x,7,2,2));fill(paper,38,34,20,2);
        if(stage===3){fill(cyan,81,21,1,5);fill(cyan,79,23,5,1);fill(gold,12,10,1,3);fill(gold,11,11,3,1);}
      }
      for(let index=0;index<3;index++){fill('#665371',5+index*5,35,3,3);if(index<stage)fill(mint,5+index*5,35,3,3);}
    }else if(kind==='garden'){
      fill('#846044',39,28,19,3);fill('#e5aa74',41,31,15,6);fill('#f5cd90',42,32,13,1);fill(edge,44,37,9,2);
      fill('#70ca8b',48,15,2,14);fill('#70ca8b',43,23,5,2);fill('#70ca8b',50,19,5,2);fill('#b4e59e',44,22,3,1);
      if(stage){fill(gold,44,9,10,7);fill(gold,42,11,14,3);fill(coral,47,10,4,4);fill(paper,48,11,2,2);fill(cyan,64,6,2,5);fill(cyan,68,12,2,4);}
      else{fill(purple,47,12,4,5);fill('#dfc8ff',48,13,2,2);}
      fill('#496b59',29,38,35,1);fill(mint,32,36,3,2);fill(mint,61,35,2,3);
    }
  }
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
  function drawPhoto(canvas,id,changed){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#30203f';ctx.fillRect(0,0,240,168);
    ctx.fillStyle='#f5d69e';ctx.fillRect(8,8,224,152);ctx.fillStyle='#634777';ctx.fillRect(14,14,212,140);
    if(id==='photo_window'){const source=image('assets/rooms/frisk_room.png');if(source?.complete&&source.naturalWidth)ctx.drawImage(source,0,0,source.naturalWidth,source.naturalHeight,52,18,136,134);
      if(changed){ctx.fillStyle='#b4b6cc';ctx.fillRect(90,31,4,3);}}
    if(id==='photo_music'){ctx.fillStyle='#fff0ca';ctx.fillRect(25,28,190,112);ctx.fillStyle='#634777';for(let y=56;y<=88;y+=8)ctx.fillRect(38,y,162,1);
      for(const [index,y] of [80,64,72,56].entries()){ctx.fillRect(55+index*38,y,8,5);ctx.fillRect(61+index*38,y-24,2,26);}
      ctx.font='12px monospace';ctx.fillText('DO  MI  RE  SOL',43,123);}
    if(id==='photo_lumo'){ctx.fillStyle='#fff0ca';ctx.fillRect(31,24,178,120);const frame=global.LUMO_ASSETS?.portraits?.emotions?.NORMAL;
      const source=frame&&image(frame.sheet);if(source?.complete&&source.naturalWidth){const r=frame.rect;ctx.drawImage(source,r.x,r.y,r.width,r.height,80,35,80,80);}
      ctx.fillStyle='#a06be3';ctx.fillRect(177,39,3,11);ctx.fillRect(173,43,11,3);ctx.font='11px monospace';ctx.fillStyle='#484052';ctx.fillText('LUMO',99,130);}}
  function openPhoto(id,direction='forward'){const photo=core.inspectPhoto(id);if(!photo)return;const body=makePanel(photo.title);panel.classList.add('home-album');
    const leaf=global.document.createElement('div');leaf.className=`home-photo-leaf ${direction==='back'?'home-page-back':'home-page-forward'}`;body.append(leaf);
    const canvas=global.document.createElement('canvas');canvas.width=240;canvas.height=168;canvas.className='home-photo';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',photo.title);leaf.append(canvas);
    const redraw=()=>drawPhoto(canvas,id,photo.changed);redraw();for(const source of photoImages.values())if(!source.complete)source.addEventListener('load',redraw,{once:true});
    paragraph(leaf,photo.changed?'La pequeña marca de la esquina parecía estar en otro lugar. Miras de nuevo; la imagen permanece quieta.':photo.text);
    paragraph(leaf,photo.first?'Guardas este recuerdo en el álbum.':'Este recuerdo ya está en tu álbum.');
    const available=PHOTO_IDS.filter(key=>progress.has(key)),index=available.indexOf(id),navigation=global.document.createElement('div');navigation.className='home-album-navigation';body.append(navigation);
    if(index>0)navigation.append(button('PÁGINA ANTERIOR',()=>{activitySound('paper');openPhoto(available[index-1],'back');}));
    if(index>=0&&index<available.length-1)navigation.append(button('PÁGINA SIGUIENTE',()=>{activitySound('paper');openPhoto(available[index+1]);}));
    body.append(button('ÁLBUM',openAlbum));}
  function openPiano(){const anomaly=core.inspectPiano(),body=makePanel('PIANO DE CASA');panel.classList.add('home-minigame','home-piano');
    paragraph(body,anomaly?'Una nota suena apenas más baja de lo esperado. La casa vuelve a guardar silencio.':'Hay cuatro teclas señaladas en una partitura corta.');
    if(anomaly)adapter.audio?.note?.(2,{odd:true,frequency:277.18});
    const score=activityArt(body,'piano',progress.has('home_melody_found')?4:0),played=[];
    const keyboard=global.document.createElement('div');keyboard.className='home-piano-keys';body.append(keyboard);
    ['DO','MI','RE','SOL'].forEach((label,index)=>{
      const key=button(`${index+1} · ${label}`,()=>{
        if(!core.playNote(index))return;played.push(index);if(played.length>4)played.shift();
        let count=0;for(let length=1;length<=played.length;length++)if(played.slice(-length).every((value,at)=>value===at))count=length;
        paintActivity(score,'piano',count);
        key.classList.remove('is-playing');if(!getContext().reducedMotion){void key.offsetWidth;key.classList.add('is-playing');}
        status.textContent=progress.has('home_melody_found')?'Reconoces el patrón de cuatro notas. La partitura lo conserva.':`${label}. La nota queda flotando un momento.`;
        status.classList.toggle('is-complete',progress.has('home_melody_found'));
      });key.addEventListener('animationend',()=>key.classList.remove('is-playing'));keyboard.append(key);
    });
    const status=paragraph(body,'Puedes tocar sin acertar ni perder.');status.className='home-activity-status';status.setAttribute('role','status');
    body.append(button('MIRAR Y GUARDAR LA PARTITURA',()=>openPhoto('photo_music')));
    panel.addEventListener('keydown',event=>{const index=['Digit1','Digit2','Digit3','Digit4'].indexOf(event.code||`Digit${event.key}`);if(index>=0&&!event.repeat){event.preventDefault();keyboard.children[index].click();}});keyboard.children[0]?.focus();}
  function openCooking(){core.resetRecipe();const withLumo=progress.has('lumo_met')&&adapter.canCompanionActions?.()!==false;
    const body=makePanel(withLumo?'COCINAR CON LUMO':'COCINAR EN CASA');panel.classList.add('home-minigame','home-cooking');let step=0;
    const prompts=[[withLumo?'La mezcla espera. Lumo supervisa desde una distancia prudentísima.':'La mezcla espera. Puedes preparar la receta a tu ritmo.',['Mezclar despacio','Mezclar con entusiasmo'],['gentle','enthusiastic']],
      [withLumo?'Ahora, la canela. «Mi medida oficial es: depende del hambre».':'Ahora, la canela. Puedes elegir cuánto añadir.',['Una pizca','Un poco más de canela'],['pinch','extra_cinnamon']],
      [withLumo?'Último paso: el horno. «No pienso convertirme en ingrediente».':'Último paso: el horno. Elige el punto que más te guste.',['Horneado suave','Más crujiente'],['soft','crispy']]];
    function paint(){body.replaceChildren();activityArt(body,'cooking',step,progress.getState().recipe);if(step===3){const recipe=progress.getState().recipe;
      paragraph(body,!withLumo?(recipe==='extra_cinnamon'?'La receta huele intensamente a canela.':recipe==='crispy'?'La superficie quedó crujiente.':'La receta quedó suave.'):
        recipe==='extra_cinnamon'?'La receta huele intensamente a canela. Lumo declara que inventaste el otoño.':recipe==='crispy'?'La superficie cruje. «Por fin comida con efectos de sonido», celebra Lumo.':'La receta quedó suave. Lumo toma una miguita y finge ser un crítico gastronómico.');
      paragraph(body,'Guardas el resultado. Ninguna receta es incorrecta.');return;}
      paragraph(body,`${step+1} / 3 · ${prompts[step][0]}`);prompts[step][1].forEach((label,index)=>body.append(button(label,()=>{
        const result=core.cookStep(prompts[step][2][index]);if(result.accepted){step++;activitySound(step===3?'success':'switch');paint();(body.querySelector('button')||panel.querySelector('.home-story-close'))?.focus();}})));}
    paint();body.querySelector('button')?.focus();}
  function openGarden(){const body=makePanel('CUIDAR LA FLOR');panel.classList.add('home-minigame','home-garden');const watered=progress.has('flower_watered');activityArt(body,'garden',watered?1:0);
    paragraph(body,watered?'La tierra conserva humedad. Los pétalos se han abierto. Basta con acompañar su crecimiento.':'La flor tiene espacio para crecer. Puedes regarla con cuidado.');
    if(!watered)body.append(button('REGAR CON CUIDADO',()=>{if(core.waterFlower())activitySound('water');global.HomeObjectsState?.interact('garden_flower');global.HomeObjectsState?.interact('garden_watering_can');closePanel();adapter.showDialog?.('* Riegas con cuidado.\n* Los pétalos se abren un poquito.\n* Por hoy, es suficiente.');}));
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
    if(progress.has('home_complete')){adapter.showDialog?.('* No puedes bajar al sótano.\n* HOME ha terminado; puedes seguir visitando la casa.');return true;}
    if(core.tryAnomaly('anomaly_door')){actor()?.faceToward?.({x:425,y:223});actor()?.perform?.('scared',2);
      adapter.showDialog?.('* Lumo mira la bajada durante unos segundos.\n* Después vuelve a mirarte, sin una de sus bromas habituales.');return true;}
    if(!core.allAnomalies()){adapter.showDialog?.('* Las escaleras bajan hacia la oscuridad.\n* No puedes entrar durante HOME.');return true;}
    const pages=core.approachDoor();if(pages)beginSequence(pages,()=>{core.finishDoorDialogue();beginEnding();});
    else adapter.showDialog?.('* Un golpe rompe el silencio.\n* Lumo deja de moverse. No puedes bajar.');return true;}
  function interact(object){const context=getContext();if(!started||!object||panel||sequence||ending||context.hidden||context.state!=='PLAYING')return false;
    const room=context.roomId,id=object.id;if(!ROOM_KEYS[room]||room!==core.getState().currentRoom)return false;
    if(room==='entrance'&&id==='entrance_basement_door')return doorInteraction();
    if(id==='home_piano'&&adapter.rooms?.[room]?.interactives?.some(item=>item.id==='home_piano')){openPiano();return true;}
    if(room==='friskRoom'&&id==='frisk_bookshelf'){openPhoto('photo_window');return true;}
    if(room==='hallway'&&id==='hallway_painting'){openPhoto('photo_lumo');return true;}
    if(room==='kitchen'&&['kitchen_counter','kitchen_stove'].includes(id)){openCooking();return true;}
    // Older room-only builds used these probes for the flower activity. The
    // expanded house has a physical garden; examining a different plant cannot
    // water its flower remotely or turn a paper-flower pickup into garden care.
    if(!global.HomeWorld&&(room==='friskRoom'&&['frisk_little_plant','frisk_corner_plant'].includes(id)||room==='hallway'&&id==='hallway_flowers')){openGarden();return true;}
    if(room==='garden'&&['garden_flower','garden_watering_can'].includes(id)){openGarden();return true;}
    if(room==='readingRoom'&&id==='reading_table'&&progress.has('lumo_met')){global.LumoActivities?.start();return true;}
    if(id==='lumo'&&core.tryAnomaly('anomaly_lumo')){actor()?.setEmotion?.('CONFUSED');actor()?.perform?.('confused',3);
      beginSequence([{speaker:'LUMO',emotion:'CONFUSED',text:'¿Yo ya había escuchado esa melodía aquí?... Qué raro. Se me fue la idea.'}],()=>{});return true;}
    return false;}
  function start(){started=true;core.roomChanged(getContext().roomId);journalButton?.classList.add('is-ready');
    if(global.HomeWorld&&getContext().roomId==='friskRoom'&&!progress.getState().interactions.home_wake_seen){
      progress.touch('home_wake_seen');if(adapter.freshStart!==false)adapter.showDialog?.('* Despiertas en tu habitación.\n* La casa está tranquila.\n* Puedes explorar a tu ritmo.');
    }
    if(['waiting','dialogue'].includes(core.getState().finalePhase)){actor()?.cancelTask?.('story');actor()?.setEmotion?.('SCARED');actor()?.setFollowing?.(false);}
    if(core.getState().finalePhase==='fade')beginEnding();
    else if(core.getState().finalePhase==='dialogue')beginSequence(DOOR_PAGES,()=>{core.finishDoorDialogue();beginEnding();});}
  function roomChanged(){if(!started)return;closePanel();core.roomChanged(getContext().roomId);}
  function tick(dt){if(!started)return;const context=getContext();core.tick(dt,context);tickSequence();
    if(ending&&!context.hidden){ending.elapsed+=Math.min(.1,Math.max(0,Number(dt)||0));const t=Math.min(1,ending.elapsed/(context.reducedMotion?.2:1.1));ending.node.style.opacity=String(t);
      if(ending.elapsed>=1.3&&!ending.complete){core.completeHome();ending.complete=true;ending.button.hidden=false;ending.button.focus();}}
  }
  // Furniture belongs to HomeWorld; narrative panels never paint over a room.
  function draw(){return false;}
  return Object.freeze({createCore,mount,start,roomChanged,interact,tick,draw,openJournal,openAlbum,
    renderPhoto(canvas,id){if(!PHOTO_IDS.includes(id))return false;const paint=()=>drawPhoto(canvas,id,progress.has('anomaly_photo')&&id==='photo_window');paint();for(const source of photoImages.values())if(!source.complete)source.addEventListener('load',()=>{if(canvas.isConnected)paint();},{once:true});return true;},
    onPCopen(){return core?.pcNotice()||null;},onRyonmessage(){return core?.onRyonmessage()||false;},
    getState(){return core?{...core.getState(),active:!!panel||!!sequence||!!ending,photos:progress.getState().photos}:null;},
    get active(){return !!panel||!!sequence||!!ending;},get ending(){return !!ending;},PHOTO_IDS,ANOMALIES,NOTES});
});
