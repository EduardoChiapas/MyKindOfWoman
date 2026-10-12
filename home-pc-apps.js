/* Extra HOME apps use the existing computer window system. */
(function(global){
 'use strict';
 const progress=global.HomeProgress, desktop=document.querySelector('gaming-desktop');
 const pictures=[{id:'photo_window',title:'Una habitación para Mira',image:'assets/rooms/frisk_room.png',text:'Un rincón tranquilo, con espacio para hacer nuevas cosas.'},
  {id:'photo_music',title:'Cuatro notas',image:'assets/rooms/living_room.png',text:'Una partitura pequeña. La melodía cabe en cuatro notas.'},
  {id:'photo_lumo',title:'Un dibujo suelto',image:'assets/lumo/emotions-original.png',text:'Lumo dibujó una pequeña aventura. Todavía queda mucho papel.'}];
 function el(tag,text,className){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(className)n.className=className;return n;}
 function button(text,fn){const n=el('button',text);n.type='button';n.addEventListener('click',fn);return n;}
 function source(){return '';}
 function mount(){
  if(!desktop?.registerApp||!progress)return false;
  const style=el('style');style.textContent='.home-pc-body{padding:12px;overflow:auto;display:flex;flex-direction:column;gap:9px;color:#eaf3ff}.home-pc-body p{margin:0;line-height:1.5}.home-pc-body button{border:1px solid #93b6cc;background:#182c48;padding:7px 10px;border-radius:3px}.home-pc-album{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.home-pc-photo{padding:7px;background:#e9e0d1;color:#253247;min-width:0;font-size:11px}.home-pc-photo img{width:100%;height:90px;object-fit:contain;image-rendering:pixelated;background:#000}.home-pc-photo img.lumo-photo{object-fit:none;object-position:0 0}.home-ryon-history{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:7px}.home-ryon-message{padding:7px 10px;background:#263853;border-radius:5px;max-width:92%;white-space:pre-wrap;overflow-wrap:anywhere}.home-ryon-message.mira{background:#3b5369;align-self:flex-end}.home-ryon-form{display:flex;gap:6px;flex-shrink:0}.home-ryon-form input{min-width:0;flex:1;background:#0c192b;border:1px solid #7da3bf;color:#fff;padding:8px}.home-ryon-state{font-size:10px;color:#afc7d9}.home-ryon-options{display:flex;gap:8px;flex-wrap:wrap;font-size:11px}.home-pc-body input[type=checkbox]{accent-color:#90cddc}@media(max-width:600px){.home-pc-body{padding:7px;gap:6px;font-size:10px}.home-pc-photo{padding:4px;font-size:8px}.home-pc-photo img{height:50px}.home-ryon-form input{padding:5px;font-size:12px}.home-ryon-form button{padding:4px}}';desktop.shadowRoot.append(style);
  desktop.registerApp('photos',{title:'Fotos',icon:'files',fill(body){
   const render=()=>{body.replaceChildren(el('p','Tu álbum · recuerdos encontrados en HOME'));const grid=el('div',null,'home-pc-album');
    for(const picture of pictures){const card=el('article',null,'home-pc-photo');if(progress.has(picture.id)){const image=el('canvas');image.width=240;image.height=168;image.style.cssText='width:100%;height:auto;image-rendering:pixelated';image.setAttribute('role','img');image.setAttribute('aria-label',picture.title);global.HomeStory.renderPhoto(image,picture.id);card.append(image,el('p',picture.title),el('p',picture.text));}else card.append(el('p','Por encontrar'),el('p','Todavía hay rincones por mirar.'));grid.append(card);}body.append(grid);};render();return progress.onChange(render);
  }});
  desktop.registerApp('messages',{title:'Mensajes · Ryon',icon:'notes',fill:fillRyon});
  desktop.registerApp('music',{title:'Música',icon:'settings',fill(body){body.append(el('p','Melodías de HOME'),el('p','Una canción pequeña también puede guardar un recuerdo.'),button('Escuchar cuatro notas',()=>global.UndertaleAudio.hum({ui:true,volume:desktop.volume})));return()=>global.UndertaleAudio.stop('hum');}});
  desktop.registerApp('memories',{title:'Recuerdos',icon:'files',fill(body){const render=()=>{body.replaceChildren(el('p','Pequeños documentos de tu aventura'));
   for(const [id,title,text] of [['cooked','Receta con Lumo','Canela, paciencia y un ayudante que confunde una cuchara con una antena.'],['flower_watered','La flor','Le diste agua. Algunas cosas crecen despacio.'],['home_melody_found','Una melodía','Cuatro notas, reconocidas juntos.'],['lumo_drawing_found','Mi mejor amiga','El dibujo de Lumo encontró un lugar en tu memoria.']])if(progress.has(id))body.append(el('strong',title),el('p',text));if(body.children.length===1)body.append(el('p','Estos archivos aparecen conforme compartes aventuras.'));};render();return progress.onChange(render);}});
  desktop.registerApp('trash',{title:'Papelera',icon:'files',fill(body){body.append(el('strong','archivos_final_final_ahora_si.txt'),el('p','Ryon: el nombre del archivo garantiza exactamente cero cosas JAJAJA.'),el('strong','lista_de_bugs.txt'),el('p','1. Lumo cabe detrás del cursor.\n2. Todavía no sabe contar hasta diez.\n3. Esta lista solo tiene tres puntos.'));}});
  return true;
 }
 function fillRyon(body){
  const mind=global.RyonMind;let alive=true,pending=false,controller=null,epoch=0;const recent=[];
  const history=el('div',null,'home-ryon-history');history.setAttribute('role','log');history.setAttribute('aria-live','polite');
  const status=el('p','','home-ryon-state');
  const form=el('form',null,'home-ryon-form'),input=el('input');input.type='text';input.maxLength=400;input.placeholder='Escribe a Ryon…';input.setAttribute('aria-label','Mensaje para Ryon');input.setAttribute('enterkeyhint','send');
  const send=el('button','Enviar');send.type='submit';form.append(input,send);
  body.append(history,status,form);
  function append(who,text){const node=el('div',null,'home-ryon-message'+(who==='Mira'?' mira':''));node.append(el('strong',who+': '),document.createTextNode(text));history.append(node);while(history.children.length>12)history.firstChild.remove();history.scrollTop=history.scrollHeight;recent.push({who,text});while(recent.length>12)recent.shift();}
  append('Ryon','Mira, hola. La PC no se armó sola, pero puedes apropiarte del escritorio JAJAJA. ¿Qué andas tramando?');
  form.addEventListener('submit',async event=>{event.preventDefault();const message=input.value.trim();if(!message||pending)return;pending=true;send.disabled=true;input.value='';append('Mira',message);status.textContent='Ryon está escribiendo…';const token=++epoch;controller=new AbortController();
   try{const context={chapter:'HOME',room:'ryonroom',events:progress.getState().events};
    const response=mind?await mind.chat(message,context,{signal:controller.signal}):{text:'Bro, por aquí todo tranquilo. Cuéntame qué rincón de la casa te dio curiosidad; el escritorio siempre tiene sitio para otra idea.',source:'local'};
    if(!alive||token!==epoch)return;append('Ryon',response.text);status.textContent=source(response);progress.record('ryon_met');global.HomeStory?.onRyonmessage?.(response);
   }catch{if(alive&&token===epoch){append('Ryon','Me quedé pensando, bro JAJAJA. Cuéntame qué estabas haciendo por la casa.');status.textContent='';progress.record('ryon_met');global.HomeStory?.onRyonmessage?.({source:'local'});}}
   finally{if(alive&&token===epoch){pending=false;send.disabled=false;controller=null;input.focus({preventScroll:true});}}
  });
  return()=>{alive=false;epoch++;controller?.abort();};
 }
 global.HomePC=Object.freeze({mount,pictures});mount();
})(window);
