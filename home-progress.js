/* Story facts belong to this engine, never to model responses. */
(function(root,factory){
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.HomeProgress=factory().createProgress(root.localStorage);
})(typeof window==='object'?window:this,function(){
  'use strict';
  const KEY='mkw:home:progress:v1';
  const SCHEMA_VERSION=2;
  const ROOM_IDS=['entrance','livingRoom','hallway','friskRoom','torielRoom','kitchen','lumoRoom','gallery','bathroom','readingRoom','gardenHall','garden'];
  const EVENTS=new Set(['lumo_met','pc_found','ryon_met','photo_window','photo_music','photo_lumo','memory_collection',
    'cooked','piano_played','flower_watered','lumo_room_found','lumo_drawing_found','played_memory','played_hide_seek','played_fnf',
    'anomaly_session','anomaly_photo','anomaly_piano','anomaly_message','anomaly_lumo','anomaly_door','investigate_door','home_complete',
    'home_knock_first','home_knock_second','home_knock_third','home_melody_found']);
  const ANOMALIES=['anomaly_session','anomaly_photo','anomaly_piano','anomaly_message','anomaly_lumo','anomaly_door'];
  const PHOTOS=['photo_window','photo_music','photo_lumo'];
  function createProgress(storage,build={chapter:'HOME'}){
    const listeners=new Set(); let readOnly=false;
    let state={version:SCHEMA_VERSION,chapter:build.chapter==='ECHOES'?'ECHOES':'HOME',basementUnlocked:false,events:[],visits:[],photos:[],interactions:{},position:null,recipe:null,flower:{watered:false},updatedAt:0};
    try{
      const raw=JSON.parse(storage?.getItem(KEY)||'null');
      if(raw && Number(raw.version)>SCHEMA_VERSION) readOnly=true;
      if(raw && [1,SCHEMA_VERSION].includes(raw.version)){
        state.events=[...new Set((Array.isArray(raw.events)?raw.events:[]).filter(id=>EVENTS.has(id)))];
        state.visits=[...new Set((Array.isArray(raw.visits)?raw.visits:[]).filter(id=>ROOM_IDS.includes(id)))];
        state.photos=PHOTOS.filter(id=>state.events.includes(id));
        if(build.chapter==='ECHOES') state.basementUnlocked=raw.basementUnlocked===true;
        if(raw.position && ROOM_IDS.includes(raw.position.room) && Number.isFinite(raw.position.x) && Number.isFinite(raw.position.y))
          state.position={room:raw.position.room,x:raw.position.x,y:raw.position.y,direction:['up','down','left','right'].includes(raw.position.direction)?raw.position.direction:'down'};
        for(const [id,count] of Object.entries(raw.interactions||{}).slice(0,100)) if(/^[a-z_]{2,50}$/.test(id)) state.interactions[id]=Math.min(999,Math.max(0,Number(count)||0));
        state.recipe=['balanced','extra_cinnamon','crispy'].includes(raw.recipe)?raw.recipe:null;
        state.flower.watered=state.events.includes('flower_watered');
      }
    }catch{} // Invalid optional data cannot strand the player.
    const clone=()=>JSON.parse(JSON.stringify({...state,readOnly}));
    function save(){if(readOnly)return;state.updatedAt=Date.now();try{storage?.setItem(KEY,JSON.stringify(state));}catch{}}
    function emit(id){save();for(const fn of listeners)fn(id,clone());}
    function record(id){if(!EVENTS.has(id)||state.events.includes(id))return false;state.events.push(id);if(PHOTOS.includes(id))state.photos.push(id);emit(id);return true;}
    const has=id=>state.events.includes(id);
    function canEnter(room){return room!=='basementHallway'||(state.chapter==='ECHOES'&&state.basementUnlocked===true);}
    function barrier(room){return room==='entrance'&&!canEnter('basementHallway')?{x:410,y:190,width:30,height:66}:null;}
    function visit(room){if(!ROOM_IDS.includes(room))return false;if(!state.visits.includes(room)){state.visits.push(room);emit('visit');}return true;}
    function touch(id){if(!/^[a-z_]{2,50}$/.test(id))return 0;state.interactions[id]=Math.min(999,(state.interactions[id]||0)+1);save();return state.interactions[id];}
    function checkpoint(position){if(!position||!ROOM_IDS.includes(position.room)||!Number.isFinite(position.x)||!Number.isFinite(position.y))return false;state.position={room:position.room,x:position.x,y:position.y,direction:position.direction};save();return true;}
    function nextAnomaly(){return ANOMALIES.find(id=>!has(id))||null;}
    function recordAnomaly(id){if(id!==nextAnomaly()||!has('memory_collection')||!has('ryon_met'))return false;return record(id);}
    function quests(){
      const all=ANOMALIES.every(has);
      return [
        {id:'meet',label:'Conocer a Lumo',done:has('lumo_met'),kind:'main'},
        {id:'explore',label:'Explorar la casa',done:state.visits.filter(id=>id!=='lumoRoom').length>=5,kind:'main'},
        {id:'pc',label:'Descubrir la computadora',done:has('pc_found'),kind:'main'},
        {id:'ryon',label:'Conversar con Ryon',done:has('ryon_met'),kind:'main'},
        {id:'photos',label:'Guardar tres recuerdos en el álbum',done:has('memory_collection'),kind:'main'},
        ...(has('memory_collection')?[{id:'changes',label:'Volver a mirar los rincones conocidos',done:all,kind:'main'}]:[]),
        ...(all?[{id:'door',label:'Investigar la entrada cerrada',done:has('investigate_door'),kind:'main'},{id:'ending',label:'Escuchar junto a Lumo',done:has('home_complete'),kind:'main'}]:[]),
        ...[['cooked','Preparar una receta con Lumo'],['piano_played','Tocar el piano'],['flower_watered','Cuidar la flor'],['lumo_room_found','Encontrar el escondite de Lumo'],['lumo_drawing_found','Mirar su dibujo'],['played_memory','Jugar a las parejas'],['played_hide_seek','Jugar a las escondidas'],['played_fnf','Completar un desafío de la PC']].map(([id,label])=>({id,label,done:has(id),kind:'side'}))
      ];
    }
    return Object.freeze({getState:clone,has,record,canEnter,barrier,visit,touch,checkpoint,nextAnomaly,recordAnomaly,quests,
      setRecipe(value){if(!['balanced','extra_cinnamon','crispy'].includes(value))return false;state.recipe=value;const first=record('cooked');if(!first)save();return true;},
      waterFlower(){state.flower.watered=true;return record('flower_watered');},
      hasSave:()=>Boolean(state.position||state.events.length||state.visits.length),
      reset(){if(readOnly)return false;try{storage?.removeItem(KEY);}catch{}return true;},
      onChange(fn){listeners.add(fn);return()=>listeners.delete(fn);}
    });
  }
  return {createProgress,KEY,ANOMALIES,PHOTOS,SCHEMA_VERSION};
});
