/* HOME adapters. Only real engine events update story facts. */
(function(global){
 'use strict';
 const progress=global.HomeProgress, mind=global.LumoMind, story=global.HomeStory;
 const initial=progress.getState(),freshStart=!initial.readOnly&&!initial.position&&!initial.events.length&&!initial.visits.length&&!mind.getState().met;
 const focus=()=>canvas.focus({preventScroll:true});
 const near=()=>{if(!mind.getState().met)return false;const a=global.LumoGame.actor.getState(),f=getPlayerHitbox();return a.placed&&!a.hiding&&Math.hypot(a.x-f.x-f.width/2,a.y-f.y-f.height/2)<=64;};
 story.mount({progress,rooms,R,actor:global.LumoGame.actor,
  freshStart,
  getContext:()=>({roomId:currentRoom,state:gameState,hidden:document.hidden,reducedMotion:HouseExperience.reducedMotion}),
  pause(value,options){if(value)global.LumoUI?.dismissAmbient?.();resetMovementInput();resetJoystick();gameState=value?(options?.allowLumoMotion?'HOME_ENDING':'HOME_ACTIVITY'):'PLAYING';},
  showDialog(text,options={}){
   if(options.speaker==='LUMO'){
    const response={text,emotion:options.emotion||'NORMAL',source:'local'};
    global.LumoGame.actor.react(response);global.LumoUI.speak(response,{after:'scene'}).then(()=>global.LumoUI.close({sound:false}));
   }else showDialog(text);
  },
  isDialogOpen:()=>gameState==='DIALOG'||global.LumoUI.isOpen,
  resumeFocus:focus,audio:{note:(index,options)=>UndertaleAudio.note(index,{...options,ui:true}),knock:()=>UndertaleAudio.knock()},
  setEnding:value=>HouseExperience.setEnding(value),
  callBuddy:()=>global.LumoGame.callForStory(),
  canCompanionActions:()=>near()&&['PLAYING','HOME_ACTIVITY'].includes(gameState),
  openCompanionActions:()=>global.LumoUI.openActions(),
  onEvent(event){
   if(event.id&&event.id!=='home_melody_found')mind.remember('event',{id:event.id});
   if(event.type==='knock')mind.remember('event',{id:'home_knocks'});
   if(event.type==='cooked'&&near())mind.noteLocalAction({id:'cook'});
  }
 });
 progress.onChange(id=>{if(id!=='visit'&&id!=='home_melody_found')mind.remember('event',{id});});
 // External options are separate from Lumo's clean dialogue.
 const help=document.querySelector('.help-content');
 const options=document.createElement('div');options.className='home-options';
 const volumes={music:1,effects:1,text:1};
 try{const saved=JSON.parse(localStorage.getItem('mkw:home:audio:v1')||'{}');for(const key of Object.keys(volumes))if(Number.isFinite(saved[key]))volumes[key]=Math.max(0,Math.min(1,saved[key]));}catch{}
 HouseExperience.setVolumes(volumes);
 for(const [id,label] of [['music','Música'],['effects','Efectos'],['text','Voz del texto']]){
  const line=document.createElement('label');line.textContent=label+' ';
  const input=document.createElement('input');input.type='range';input.min='0';input.max='100';input.value=String(volumes[id]*100);input.setAttribute('aria-label',label);
  input.addEventListener('input',()=>{volumes[id]=Number(input.value)/100;HouseExperience.setVolumes(volumes);try{localStorage.setItem('mkw:home:audio:v1',JSON.stringify(volumes));}catch{}});line.append(input);options.append(line);
 }
 const privacy=document.createElement('button');privacy.type='button';privacy.textContent='Privacidad y recuerdos';
 privacy.addEventListener('click',()=>{document.getElementById('btn-close-help').click();global.LumoUI.openSettings();});options.append(privacy);
 const link=document.createElement('a');link.href='PRIVACIDAD.html';link.target='_blank';link.rel='noopener';link.textContent='Política de privacidad';options.append(link);
 help.insertBefore(options,document.getElementById('btn-close-help'));
 const diary=document.querySelector('.home-journal-chip');diary.id='btn-diary';diary.textContent='▤ Diario';diary.style.position='static';document.getElementById('game-tools').append(diary);
 // Preserve all original FNF/PC storage. Starting over affects HOME alone.
 const start=document.getElementById('btn-start');start.firstChild.textContent=progress.hasSave()?'Continuar ':'Entrar en casa ';
 const fresh=document.createElement('button');fresh.type='button';fresh.textContent='Nueva partida';fresh.hidden=!progress.hasSave();
 let newerSave=progress.getState().readOnly===true||global.HomeObjectsState?.readOnly===true;
 try{for(const name of ['lumo','ryon']){const saved=JSON.parse(localStorage.getItem('mkw:'+name+':v2')||'null');if(saved&&(![1,2].includes(saved.version)||Number(saved.memoryVersion)>3))newerSave=true;}}catch{}
 fresh.disabled=newerSave;
 const confirmBox=document.createElement('div');confirmBox.className='home-reset';confirmBox.hidden=true;confirmBox.setAttribute('role','dialog');confirmBox.setAttribute('aria-label','Nueva partida');
 const message=document.createElement('p');message.textContent='¿Empezar HOME otra vez? Se borrarán los recuerdos y aventuras de esta partida.';
 const yes=document.createElement('button');yes.type='button';yes.textContent='Empezar otra vez';
 const no=document.createElement('button');no.type='button';no.textContent='Conservar mi partida';
 let wasInGame=false;
 const openReset=()=>{confirmBox.hidden=false;no.focus();};
 fresh.addEventListener('click',openReset);no.addEventListener('click',()=>{confirmBox.hidden=true;if(wasInGame){wasInGame=false;introContainer.style.display='none';gameContainer.style.display='grid';gameState='PLAYING';focus();}else fresh.focus();});
 confirmBox.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();no.click();}});
 yes.addEventListener('click',async()=>{if(newerSave||global.HomeObjectsState?.reset()===false||!progress.reset())return;yes.disabled=true;await Promise.allSettled([mind.deleteSession(),global.RyonMind.deleteSession()]);try{for(const key of ['mkw:lumo:world:v1','mkw:lumo:v2','mkw:lumo:v1','mkw:ryon:v2','mkw:ryon:v1'])localStorage.removeItem(key);}catch{}location.reload();});
 confirmBox.append(message,yes,no);start.after(fresh,confirmBox);
 const erase=document.createElement('button');erase.type='button';erase.textContent='Empezar HOME de nuevo';erase.disabled=newerSave;erase.addEventListener('click',()=>{wasInGame=true;document.getElementById('btn-close-help').click();introContainer.style.display='flex';gameContainer.style.display='none';gameState='INTRO';openReset();});options.append(erase);
 global.addEventListener('pagehide',()=>checkpoint());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpoint();});
 function checkpoint(){if(gameState==='INTRO')return;progress.checkpoint({room:currentRoom,x:player.x,y:player.y,direction:player.direction});}
 let elapsed=0;
 global.HomeGame=Object.freeze({checkpoint,get isResetPending(){return !confirmBox.hidden;},tick(dt){elapsed+=dt;if(elapsed>=3&&gameState==='PLAYING'){elapsed=0;checkpoint();}}});
})(window);
