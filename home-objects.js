/* Small object gestures are presentation state, never story instructions. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HomeObjects=factory();
})(typeof window==='object'?window:this,function(){
  'use strict';
  const KEY='mkw:home:objects:v1',VERSION=2,DURATION=250,PULSE_DURATION=360;
  const TOGGLES=new Set(['gallery_picture','gallery_candle_right','gallery_plant',
    'bathroom_sink','bathroom_toilet','bathroom_towel','reading_books','reading_window',
    'reading_plant','garden_hall_flower','gallery_umbrella','reading_origami',
    'entrance_console','living_library','living_umbrella_stand','living_table','hallway_umbrella_stand',
    'frisk_dresser','toriel_dresser','toriel_wardrobe','kitchen_fridge','kitchen_sink']);
  const PULSES=new Set(['gallery_candle_left','bathroom_tub','reading_sofa','reading_chair',
    'garden_hall_window','garden_hall_picture','garden_tree_left','garden_tree_right','garden_bench',
    'garden_flower','garden_watering_can','garden_workbench','reading_table',
    'lumo_bed','lumo_candle','lumo_box','lumo_desk','lumo_drawing','bathroom_soap','garden_frog',
    'entrance_plant','entrance_landscape','entrance_candle','entrance_portrait','living_fireplace',
    'living_chair','living_dining_back','living_dining_left','living_dining_right','hallway_first_candle',
    'hallway_flowers','hallway_painting','hallway_large_plant','hallway_middle_candle','hallway_last_candle',
    'hallway_small_plant','hallway_mirror_candle','mirror','hallway_far_umbrella','frisk_bed',
    'frisk_little_plant','frisk_bookshelf','frisk_desk_book','frisk_chair','frisk_wastebasket','frisk_corner_plant',
    'toriel_bed','toriel_wall_drawing','toriel_chair','toriel_desk','kitchen_counter','kitchen_stove','home_piano']);
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ease=value=>value*value*(3-2*value);
  function create(options={}){
    const storage=options.storage,progress=options.progress;
    const clock=typeof options.now==='function'?options.now:()=>globalThis.performance?.now?.()??Date.now();
    const reduced=()=>typeof options.reducedMotion==='function'?options.reducedMotion()===true:options.reducedMotion===true;
    let readOnly=false,values=Object.create(null);
    const transitions=new Map(),pulses=new Map();
    const watered=()=>progress?.has?.('flower_watered')===true;
    let flowerValue=watered();
    try{
      const raw=JSON.parse(storage?.getItem(KEY)||'null');
      if(raw&&Number(raw.version)>VERSION)readOnly=true;
      if([1,VERSION].includes(raw?.version)&&raw.values&&typeof raw.values==='object')
        for(const id of TOGGLES)if(typeof raw.values[id]==='boolean')values[id]=raw.values[id];
    }catch{} // A bad optional save cannot interrupt exploration.
    if(progress?.getState?.().readOnly===true)readOnly=true;
    function save(){
      if(readOnly)return;
      try{storage?.setItem(KEY,JSON.stringify({version:VERSION,values}));}catch{}
    }
    function phase(id,value,time){
      if(reduced()){transitions.delete(id);return value?1:0;}
      const transition=transitions.get(id);
      if(!transition)return value?1:0;
      const unit=clamp((time-transition.start)/DURATION);
      const result=transition.from+(transition.to-transition.from)*ease(unit);
      if(unit===1)transitions.delete(id);
      return result;
    }
    function visual(id){
      const time=clock();
      if(id==='garden_flower'){
        const next=watered();
        if(next!==flowerValue){
          const from=phase(id,flowerValue,time);flowerValue=next;
          if(!reduced())transitions.set(id,{from,to:next?1:0,start:time});
        }
      }
      const value=id==='garden_flower'?flowerValue:values[id]===true;
      let pulse=0;
      if(pulses.has(id)){
        const unit=clamp((time-pulses.get(id))/PULSE_DURATION);
        if(reduced()||unit===1)pulses.delete(id);
        else pulse=Math.sin(Math.PI*unit);
      }
      return {value,phase:phase(id,value,time),pulse};
    }
    function interact(object){
      const id=typeof object==='string'?object:object?.id;
      if(readOnly||(!TOGGLES.has(id)&&!PULSES.has(id)))return false;
      const time=clock();
      if(TOGGLES.has(id)){
        const from=phase(id,values[id]===true,time),next=values[id]!==true;
        values[id]=next;
        if(!reduced())transitions.set(id,{from,to:next?1:0,start:time});
        else transitions.delete(id);
        save();
      }else if(!reduced())pulses.set(id,time);
      return true;
    }
    function reset(){
      if(readOnly)return false;
      try{storage?.removeItem(KEY);}catch{return false;}
      values=Object.create(null);transitions.clear();pulses.clear();flowerValue=watered();
      return true;
    }
    return Object.freeze({interact,visual,reset,get readOnly(){return readOnly;}});
  }
  return Object.freeze({create,KEY,VERSION});
});
