/* Source-aware object poses. Closed furniture keeps its original pixels; no decorative overlays. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeRoomDetails=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const item=(id,kind,x,y,width,height,depth)=>({id,kind,x,y,width,height,depth});
  // Only original moving fronts have a visual replacement. Decorative overlays are retired.
  const scenes={entrance:[],livingRoom:[],hallway:[],
    friskRoom:[item('frisk_dresser','drawer',169,64,44,11)],
    torielRoom:[item('toriel_dresser','drawer',26,64,44,11),item('toriel_wardrobe','wardrobe',90,41,23,30)],
    kitchen:[item('kitchen_fridge','fridge',25,39,29,42),item('kitchen_sink','tap',60,47,29,21)]};
  const roles={
    water:['bathroom_sink','bathroom_tub','kitchen_sink','garden_pond'],
    squeak:['reading_sofa','reading_chair','garden_hall_flower','lumo_bed','frisk_bed','toriel_bed','living_chair'],
    paper:['reading_books','lumo_drawing','lumo_desk','living_library','frisk_bookshelf','frisk_desk_book','toriel_desk','frisk_wastebasket','home_piano'],
    cloth:['bathroom_towel','living_table','living_umbrella_stand','hallway_umbrella_stand','hallway_far_umbrella'],
    switch:['reading_plant','garden_hall_picture','lumo_candle','kitchen_stove','kitchen_counter','reading_tv'],
    box:['bathroom_soap','gallery_plant','lumo_box','entrance_console','frisk_dresser','toriel_dresser','toriel_wardrobe','kitchen_fridge'],
    bell:['gallery_candle_left','gallery_candle_right'],
    card:['reading_table']
  };
  let state=null,progress=null;
  const visual=id=>state?.visual(id)||{phase:0,pulse:0,value:false};
  function install(options={}){state=options.objects||global?.HomeObjectsState;progress=options.progress||global?.HomeProgress;}
  function draw(ctx,room,camera={x:0,y:0},foreground=false,feet,source){
    if(foreground||!scenes[room]||!source?.complete||!source.naturalWidth)return;
    ctx.save();ctx.translate(Math.round(-camera.x),Math.round(-camera.y));ctx.scale(2,2);ctx.imageSmoothingEnabled=false;
    global?.HomePictureRender?.draw(ctx,room,source);
    for(const p of scenes[room])global?.HomeObjectRender?.draw(ctx,room,p.id,visual(p.id),source);
    ctx.restore();
  }
  function feedback(object){
    if(!object||state?.readOnly)return false;
    let role=Object.keys(roles).find(role=>roles[role].includes(object.id));if(!role)return false;
    const pose=visual(object.id);if(['box','water'].includes(role)&&pose.phase!==undefined&&['kitchen_sink','bathroom_sink','kitchen_fridge','toriel_wardrobe'].includes(object.id)&&!pose.value)role='close';
    if(['kitchen_fridge','toriel_wardrobe'].includes(object.id)&&pose.value)role='open';
    return global?.UndertaleAudio?.effect?.(role,{volume:role==='bell'?.25:role==='water'?.32:.45})===true;
  }
  const descriptions={
    entrance_console:['* Revisas el mueble de la entrada.\n* Todo sigue bien ordenado.','* El mueble de la entrada conserva sus cosas en su sitio.'],
    living_library:['* Abres el recetario.\n* En el margen dice: UN POQUITO MÁS DE CANELA.','* Cierras el libro y lo devuelves a su lugar.'],
    living_table:['* Acomodas la esquina del mantel.\n* El florero se queda en el centro.','* Extiendes el mantel sobre la mesa.'],
    kitchen_fridge:['* Abres el refrigerador.\n* Leche, ingredientes y comida para compartir.','* Cierras el refrigerador.\n* Aquí dentro se queda el frío.'],
    kitchen_sink:['* Abres el grifo.\n* El agua cae suavemente.','* Cierras el grifo.\n* Los platos siguen en su sitio.'],
    toriel_wardrobe:['* Abres el armario.\n* La ropa está cuidadosamente doblada.','* Cierras el armario con cuidado.'],
    toriel_dresser:['* Abres un cajón.\n* Todo sigue ordenado.','* Cierras el cajón.'],
    frisk_dresser:['* Abres un cajón.\n* Hay espacio para tus cosas.','* Cierras el cajón.\n* El marco de arriba sigue esperando un recuerdo.']
  };
  function description(object){const pair=descriptions[object?.id];if(!pair||state?.readOnly)return null;return pair[visual(object.id).value?0:1];}
  return {install,draw,feedback,description,scenes};
});
