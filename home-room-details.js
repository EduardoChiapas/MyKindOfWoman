/* Native detail layers over the intact HOME art. They never move furniture or set story facts. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeRoomDetails=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const item=(id,kind,x,y,width,height,depth)=>({id,kind,x,y,width,height,depth});
  const scenes={
    entrance:[item('entrance_landscape','mountains',112,20,94,22),item('entrance_portrait','portrait',239,22,16,20),
      item('entrance_console','drawer',244,57,36,13),item('entrance_plant','leaf',51,30,14,19),item('entrance_candle','spark',225,27,5,8)],
    livingRoom:[item('living_library','book',225,48,21,17),item('living_umbrella_stand','umbrella',285,34,12,28),
      item('living_table','cloth',91,179,40,10,193),item('living_chair','cushion',117,70,29,15,100),
      item('living_dining_left','seat',53,156,10,9,176),item('living_dining_back','seat',102,128,18,7,144),
      item('living_dining_right','seat',158,151,12,9,178),item('living_fireplace','ember',160,58,17,13)],
    hallway:[item('hallway_painting','hoodDrawing',253,29,44,27),item('hallway_umbrella_stand','umbrella',216,45,10,29),
      item('hallway_far_umbrella','umbrella',708,52,9,25),item('hallway_flowers','paperFlower',241,74,12,10),
      item('hallway_large_plant','leaf',347,50,16,25),item('hallway_small_plant','leaf',609,56,12,18),
      item('mirror','glint',651,39,38,16),item('hallway_first_candle','spark',113,33,5,8),
      item('hallway_middle_candle','spark',438,32,5,8),item('hallway_last_candle','spark',528,33,5,8),item('hallway_mirror_candle','spark',628,31,5,8)],
    friskRoom:[item('frisk_bed','pillow',32,66,34,12),item('frisk_dresser','drawer',169,67,46,10),
      item('frisk_bookshelf','book',112,61,23,17),item('frisk_little_plant','leaf',87,46,11,16),
      item('frisk_corner_plant','leaf',196,180,15,21),item('frisk_desk_book','openBook',31,136,20,19),
      item('frisk_chair','seat',71,153,8,8),item('frisk_wastebasket','paper',43,198,7,8)],
    torielRoom:[item('toriel_dresser','drawer',24,68,46,9),item('toriel_wardrobe','wardrobe',89,50,25,27),
      item('toriel_bed','pillow',32,95,38,13),item('toriel_wall_drawing','littleFlower',132,28,12,14),
      item('toriel_chair','seat',161,150,10,9),item('toriel_desk','book',182,145,24,19)],
    kitchen:[item('kitchen_fridge','fridge',24,28,30,48),item('kitchen_sink','tap',64,48,20,16),
      item('kitchen_counter','cutlery',103,59,28,15),item('kitchen_stove','oven',151,60,22,18)]
  };
  const roles={
    water:['bathroom_sink','bathroom_soap','kitchen_sink'],
    squeak:['bathroom_tub','reading_sofa','reading_chair','garden_frog','lumo_bed','frisk_bed','toriel_bed','living_chair'],
    paper:['gallery_picture','reading_books','reading_origami','lumo_drawing','lumo_desk','living_library','frisk_bookshelf','frisk_desk_book','toriel_desk','frisk_wastebasket','home_piano'],
    cloth:['gallery_candle_right','bathroom_towel','garden_hall_flower','living_table','living_umbrella_stand','hallway_umbrella_stand','hallway_far_umbrella'],
    switch:['reading_window','reading_plant','bathroom_toilet','gallery_umbrella','kitchen_stove','kitchen_counter'],
    box:['gallery_plant','lumo_box','entrance_console','frisk_dresser','toriel_dresser','toriel_wardrobe','kitchen_fridge'],
    bell:['garden_hall_picture','lumo_candle','garden_hall_window','gallery_candle_left'],
    card:['reading_table']
  };
  let state=null,progress=null;
  const visual=id=>state?.visual(id)||{phase:0,pulse:0,value:false};
  function install(options={}){state=options.objects||global?.HomeObjectsState;progress=options.progress||global?.HomeProgress;}
  function paint(ctx,p,v){
    const {x,y,width:w,height:h}=p,t=Math.round(v.phase*6),b=Math.round(v.pulse*2);
    const r=(c,a,d,ww,hh)=>{const l=Math.max(0,Math.round(a)),top=Math.max(0,Math.round(d));
      const right=Math.min(w,Math.round(a+ww)),bottom=Math.min(h,Math.round(d+hh));
      if(right>l&&bottom>top){ctx.fillStyle=c;ctx.fillRect(x+l,y+top,right-l,bottom-top);}};
    const cold=p.id.startsWith('toriel_'),dark=cold?'#555248':'#4a3728',wood=cold?'#aaa89b':'#aa8054',light=cold?'#e0ddcb':'#e3c594',paper='#f4eee0',purple='#9781a4';
    switch(p.kind){
    case 'mountains':
      r('#e9d2a1',0,0,w,h);r('#d7b483',0,h-5,w,5);r('#c2a079',4,9,24,8);r('#c2a079',11,5,10,5);
      r('#a3896c',32,8,35,11);r('#a3896c',42,3,13,8);r('#b49977',67,12,26,7);
      r('#f6e2ad',77,2,5,5);r('#e3c594',2,h-3,w-4,1);if(b)r('#f6e2ad',79,2-b,1,3);break;
    case 'portrait':
      r('#d7c49d',0,0,w,h);r('#75634e',4,5,8,8);r('#877059',2,13,12,6);r('#a99778',5,7,6,5);
      r('#67563f',4,5,8,2);if(b)r(paper,1,1,1,h-2);break;
    case 'hoodDrawing':
      r('#d8bd90',0,0,w,h);r(paper,13,4,15,10);r(purple,15,14,11,6);
      r('#544854',15,8,11,7);r(paper,17,10,2,3);r(paper,22,10,2,3);
      r('#b78d98',33,5-b,1,5);r('#b78d98',31,7-b,5,1);r('#aa8054',2,h-3,w-4,1);break;
    case 'littleFlower':
      r('#d8d2b4',0,0,w,h);r('#6e7854',5,6,1,8);r('#6e7854',6,10,4,2);
      r('#c9ac68',2,3-b,7,3);r('#c9ac68',4,1-b,3,7);r(dark,5,4-b,1,1);break;
    case 'drawer':
      if(v.phase>0){r(dark,0,0,w,4+t);r('#79634e',2,2,w-4,2+t);r(wood,0,3+t,w,3);r(light,1,3+t,w-2,1);r(dark,w/2-3,5+t,6,1);
        if(p.id==='frisk_dresser'&&!global?.LumoGame?.hasClaimed?.(p.id)){r(purple,7,2,9,2);r(purple,7,4,2,2);}}
      else{r(light,2,1,w-4,1);r('#8e7760',2,h-2,w-4,1);}break;
    case 'wardrobe':
      if(v.phase>0){r(dark,0,0,w,h);r('#8b7963',2,2,w-4,h-4);r(paper,8,5,10,2);r('#bcb5aa',7,7,12,14);
        const edge=Math.max(1,w-1-Math.round(v.phase*(w-3)));r('#aaa390',0,0,edge,h);r('#e0d6bc',0,0,1,h);}
      else{r('#e1dac8',2,1,1,h-2);r('#867e6e',w-3,3,1,h-5);}break;
    case 'fridge':
      if(v.phase>0){r('#403e35',0,0,w,h);r('#656b57',2,2,w-4,h-4);for(const yy of [15,31])r('#d7dbb7',2,yy,w-4,2);
        r('#ebe5cf',5,3,6,10);r('#bcd0c8',6,2,4,2);r('#c59a6c',15,8,8,6);r('#a07d54',15,23,6,6);r('#d5c9ab',5,21,7,8);
        const edge=Math.max(1,w-Math.round(v.phase*(w-2)));r('#bfc4b0',0,0,edge,h);r('#f1efd8',0,0,1,h);}
      else r('#e8ecd0',2,2,1,h-4);break;
    case 'tap':
      if(v.phase>.05){r('#80aab5',8,4,1,Math.round(v.phase*10));r('#bcd9d8',4,13,10,1);r('#bcd9d8',3,12,2,1);}
      r('#cfcac0',6,1,7,1);break;
    case 'book':
    case 'openBook':{
      const open=p.kind==='openBook'?1:v.phase;
      if(open>0){const page=Math.max(1,Math.round((w-3)*open/2)),middle=Math.floor(w/2);
        r(dark,middle-page-1,2,page*2+2,h-3);r(paper,middle-page,3,page,h-5);r('#dfd6bc',middle,3,page,h-5);
        r('#776654',middle,3,1,h-5);r('#ae9d86',middle-page+2,6,page-4,1);r('#ae9d86',middle+2,8,page-4,1);
        if(p.id==='frisk_desk_book')r('#9b87af',middle+page-4,h-6,2,3);}
      else{r(purple,3,h-5,w-6,3);r(paper,4,h-4,w-8,1);}break;}
    case 'cloth':
      r('#c6a8aa',2,0,w-4,5);r('#eee0c7',2,1,w-4,1);for(let a=4;a<w-4;a+=4)r('#866b73',a,3+t/2,1,3);
      if(v.phase>.2)r('#eee0c7',w-10,2,7,5);break;
    case 'cushion':
    case 'pillow':
      if(b){r('#c3b4bd',2,2+b,w-4,h-3-b);r('#f5e7cc',3,3+b,w-6,1);}
      r('#a6988d',3,h-3,w-6,1);r('#f0e3c7',3,2+b,2,2);r('#a6988d',w-5,h-5,1,1);break;
    case 'seat':r('#dbc494',1,3+b,w-2,1);r('#877151',w-2,3,1,h-4);break;
    case 'umbrella':r(p.id==='living_umbrella_stand'?'#b98e69':'#a09eb5',3+b,3,3,h-7);r(light,3,2,3,1);if(v.phase>.3)r(dark,1,h-6,w-2,2);break;
    case 'leaf':
      if(b){r('#a3a26a',2+b,2,4,2);r('#6f7e49',5+b,4,1,h-8);}else r('#c5b971',3,3,1,2);break;
    case 'spark':
    case 'ember':
      if(b){r('#f6c673',1+b,2-b,1,2);r('#f4e2ae',w-2,5-b,1,1);}break;
    case 'glint':if(b){r('#ede9ce',1+b,1,1,h-2);r('#d0d9d3',2+b,1,7,1);}break;
    case 'paper':if(b){r(paper,1,2-b,w-2,4);r('#a0a08f',2,4-b,w-4,1);}break;
    case 'paperFlower':
      if(!global?.LumoGame?.hasClaimed?.(p.id)){r('#bda5ce',2,2,6,3);r('#d8c4db',4,0,2,6);r('#71607d',4,5,1,4);}
      break;
    case 'cutlery':r('#c0beb3',3,2-b,1,h-4);r('#ece7d8',2,1-b,3,3);r('#7c7163',10,2,1,h-5);break;
    case 'oven':
      if(progress?.has('cooked')){r('#624e32',2,2,w-4,h-4);r('#c8a364',4,5,5,4);r('#c8a364',w-9,5,5,4);r('#edd0a3',5,5,2,1);}
      if(b)r('#d9a763',2,h-4-b,w-4,1);break;
    }
  }
  function draw(ctx,room,camera={x:0,y:0},foreground=false,feet){
    if(!scenes[room])return;ctx.save();ctx.translate(Math.round(-camera.x),Math.round(-camera.y));ctx.scale(2,2);ctx.imageSmoothingEnabled=false;
    for(const p of scenes[room])if(!foreground||p.depth&&feet&&feet.y+feet.height<=p.depth*2)paint(ctx,p,visual(p.id));ctx.restore();
  }
  function feedback(object){
    if(!object||state?.readOnly)return false;
    let role=Object.keys(roles).find(role=>roles[role].includes(object.id));if(!role)return false;
    const pose=visual(object.id);if(['box','water'].includes(role)&&pose.phase!==undefined&&['kitchen_sink','bathroom_sink','kitchen_fridge','toriel_wardrobe'].includes(object.id)&&!pose.value)role='close';
    if(['kitchen_fridge','toriel_wardrobe'].includes(object.id)&&pose.value)role='open';
    return global?.UndertaleAudio?.effect?.(role,{volume:role==='bell'?.25:role==='water'?.32:.45})===true;
  }
  const descriptions={
    entrance_console:['* Abres el cajón.\n* Los manteles siguen bien doblados.','* Cierras el cajón con cuidado.'],
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
