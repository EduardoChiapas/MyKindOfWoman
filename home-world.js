/* HOME architecture. Native pixels, original tiles, shared art/physics placement. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeWorld=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const rect=(x,y,width,height)=>({x,y,width,height});
  const image=src=>{if(!global)return null;const value=new global.Image();value.src=src;return value;};
  const images={wood:image('assets/rooms/living_room.png')};
  // Tight atlas frames preserve transparent margins without stretching cell backgrounds.
  const FRAMES={piano:[65,95,355,329],sofa:[475,136,390,267],bath:[924,85,376,328],
    sink:[1450,72,206,347],toilet:[136,498,200,332],bench:[480,504,384,315],
    can:[952,574,344,225],plant:[1394,475,277,360]};
  const crop=(source,frame)=>({source,frame});
  const art={bookcase:crop('wood',[211,13,63,61]),portrait:crop('entrance',[109,17,101,29]),
    candle:crop('entrance',[222,27,11,23]),flower:crop('hall',[235,35,25,50]),
    desk:crop('bedroom',[25,131,35,61]),bed:crop('bedroom',[18,57,64,77]),
    dresser:crop('bedroom',[165,52,54,33]),mirror:crop('hall',[646,33,52,28]),
    table:{source:'table'},chair:{source:'chair'}};
  for(const [id,frame]of Object.entries(FRAMES))art[id]=crop('atlas',frame);
  const EXTRA_FRAMES={bed:[182,145,292,449],desk:[731,207,430,357],candle:[209,744,203,351],bookcase:[735,696,421,467]};
  for(const [id,frame]of Object.entries(EXTRA_FRAMES))art[id]=crop('extra',frame);
  function prop(id,kind,x,y,width,height,text,footprint){
    return {id,kind,x,y,width,height,text,depthY:y+height,
      solid:footprint||rect(x+2,y+Math.max(0,height-15),Math.max(1,width-4),15)};
  }
  const deco=(id,kind,x,y,width,height,text)=>({...prop(id,kind,x,y,width,height,text),solid:null});
  const exit=(dir,target,spawn,x,y,width,height,facing)=>({...rect(x,y,width,height),dir,target,spawn,facing:facing||dir});
  const COMMON={wall:'#f6e7bd',trim:'#513001',shade:'#c2854e'};
  function definitions(){return {
    gallery:{label:'Pasillo del patio',nativeWidth:240,nativeHeight:201,layout:'compactL',join:{target:'hallway',x:745,y:-45},palette:COMMON,material:'woodFloor',wallMaterial:'wallCream',panel:'panelHoney',
      walkable:[rect(0,120,196,59),rect(144,66,52,113),rect(192,96,48,36),rect(50,100,36,30),rect(150,48,36,28)],
      exits:[exit('left','hallway',[718,108],0,136,14,32),exit('up','bathroom',[120,168],52,104,28,18),
        exit('right','readingRoom',[40,130],226,100,14,28),exit('up','garden',[192,230],154,54,28,18)],
      props:[deco('gallery_picture','map',104,85,32,16,'* Un cuadro de flores sobre la cómoda.\n* Alguien supo elegir un buen lugar para ellas.'),
        deco('gallery_candle_left','wallCandle',29,98,11,23,'* Una vela ilumina la entrada del baño.\n* Es una experta en turnos nocturnos.'),
        deco('gallery_candle_right','smallCandle',209,64,11,23,'* La vela alumbra el camino a la sala de lectura.\n* Nadie le exige que lea.'),
        prop('gallery_plant','mailbox',105,112,48,25,'* Revisas la cómoda del giro.\n* Hay una tarjeta: HOY TAMBIÉN PUEDES DESCANSAR.',rect(106,124,46,12)),
        prop('gallery_umbrella','umbrella',86,101,15,30,'* Una maceta pequeña junto al paso.\n* Sus hojas también parecen disfrutar de la casa.',rect(88,121,11,10))]},
    bathroom:{label:'Baño',nativeWidth:240,nativeHeight:200,palette:COMMON,floor:'tile',material:'sageTile',wallMaterial:'wallCream',rugs:[{frame:'bathMat',x:38,y:108}],
      walkable:[rect(18,72,204,102),rect(102,170,36,30)],
      exits:[exit('down','gallery',[66,138],106,186,28,14)],
      props:[prop('bathroom_tub','bath',26,56,65,32,'* Pruebas el agua de la bañera.\n* Suena más relajante que cualquier tarea pendiente.',rect(27,75,63,13)),
        prop('bathroom_sink','sink',112,24,32,64,'* Abres el grifo.\n* En el espejo sigues siendo Mira, incluso despeinada.',rect(112,73,32,15)),
        prop('bathroom_toilet','toilet',164,52,22,44,'* Inspección terminada.\n* No hay misiones secundarias aquí.',rect(165,76,20,20)),
        deco('bathroom_towel','towel',89,27,16,32,'* Una toalla limpia en su barra.\n* Parece que la doblaron con más paciencia que tú.'),
        prop('bathroom_soap','soap',202,40,16,48,'* Un armario para jabón y toallas junto al inodoro.\n* Todo tiene su lugar.',rect(202,74,16,14)) ]},
    readingRoom:{label:'Sala de lectura y música',nativeWidth:288,nativeHeight:224,palette:COMMON,material:'woodFloor',wallMaterial:'wallCream',panel:'panelHoney',rugs:[{frame:'roundRug',x:108,y:94,scale:2}],
      walkable:[rect(18,74,252,124),rect(0,116,26,32),rect(256,160,32,38)],
      exits:[exit('left','gallery',[210,114],0,118,14,28)],
      props:[prop('reading_books','bookcase',26,38,48,48,'* Abres un libro de plantas.\n* El dibujo de una flor ocupa toda la página.',rect(27,76,46,10)),
        deco('reading_window','blindWindow',212,22,48,30,'* Te asomas a la ventana.\n* Las copas del patio se mueven bajo el cielo claro.'),
        prop('home_piano','piano',94,32,102,70,'* Un piano de madera contra la pared.\n* Puedes consultar su partitura y tocar un rato.',rect(96,82,98,20)),
        prop('reading_sofa','chaise',112,99,48,32,'* Un sofá frente a la televisión.\n* La parte difícil será levantarte después.',rect(113,117,46,14)),
        prop('reading_chair','beanbag',168,99,32,32,'* El sillón está junto al sofá, mirando la misma pantalla.\n* Aquí cabe una tarde entera.',rect(170,118,28,13)),
        prop('reading_table','gameTable',222,112,48,32,'* Una mesa con cartas de parejas.\n* Podrías jugar aquí con Lumo.',rect(223,130,46,14)),
        prop('reading_tv','tvBack',123,153,70,40,'* Enciendes la televisión.\n* Desde los sillones se ve mucho mejor que desde aquí atrás.',rect(124,177,68,16)),
        prop('reading_plant','recordPlayer',88,112,16,47,'* Una lámpara al lado de los asientos.\n* La luz cae justo donde abrirías un libro.',rect(91,151,10,8)),
        deco('reading_origami','origami',218,65,32,16,'* Un pequeño paisaje enmarcado.\n* Cada cosa ha encontrado su rincón.'),
        {...deco('lumo_hideout_entry','alcove',262,162,26,36,'* Una entrada lateral con una cortina lavanda.\n* La estrella del marco parece una firma de Lumo.'),target:'lumoRoom',condition:'lumo_hideout',spawn:[96,146],facing:'up'} ]},
    garden:{label:'Patio al aire libre',nativeWidth:384,nativeHeight:256,palette:COMMON,floor:'outdoor',
      walkable:[rect(12,112,360,132),rect(178,238,28,18)],
      exits:[exit('down','gallery',[168,90],180,242,24,14)],
      props:[prop('garden_workbench','vegetableBed',92,98,64,46,'* Una parcela de calabazas junto al sendero.\n* Aquí las plantas crecen sin apresurarse.',rect(98,126,52,18)),
        prop('garden_flower','gardenFlower',130,161,32,32,'* Una flor en su maceta, bajo el sol.\n* Puedes cuidarla a tu ritmo.',rect(136,183,20,10)),
        {...prop('garden_tree_left','greenTree',14,38,69,151,'* El viento mueve las hojas sobre tu cabeza.\n* Por un momento no hay ninguna prisa.',rect(42,166,16,20)),interaction:rect(35,153,30,34)},
        {...prop('garden_tree_gold','goldTree',300,27,69,151,'* Las hojas doradas dejan pasar un poco de sol.\n* Hacen un ruido muy suave.',rect(328,155,16,20)),interaction:rect(321,142,30,34)},
        prop('garden_tree_right','outdoorRock',286,174,60,46,'* Una roca cubierta de musgo al borde del jardín.\n* Parece un buen lugar para una siesta diminuta.',rect(299,198,34,20)),
        prop('garden_watering_can','outdoorSign',91,162,24,44,'* El letrero señala la flor.\n* Una tarea pequeña: darle agua, sin apuro.',rect(100,195,6,10)),
        prop('garden_bench','outdoorBench',226,192,48,34,'* Un banco al lado del agua.\n* Puedes sentarte a mirar las nubes.',rect(229,214,42,12)),
        prop('garden_pond','pond',214,125,70,48,'* El agua refleja pequeños destellos.\n* Las ondas se quedan aquí, dando vueltas.',rect(224,135,50,28)),
        deco('garden_frog','outdoorMushrooms',67,197,11,22,'* Dos setas bajo el árbol.\n* Parece que ya eligieron dónde quedarse.') ]},
    lumoRoom:{label:'El escondite de Lumo',nativeWidth:192,nativeHeight:176,palette:COMMON,wallMaterial:'wallCream',panel:'panelHoney',material:'woodFloor',rugs:[{frame:'ovalRug',x:72,y:101}],
      walkable:[rect(18,72,156,78),rect(78,146,36,30)],
      exits:[exit('down','readingRoom',[246,182],82,162,28,14,'left')],
      props:[prop('lumo_bed','hammock',25,81,32,56,'* Una camita con una manta lavanda.\n* La almohada parece una nube doblada.',rect(26,102,30,35)),
        prop('lumo_desk','desk',114,112,48,25,'* Un escritorio lleno de dibujos y estrellas.',rect(115,124,46,13)),
        deco('lumo_drawing','drawing',76,26,63,34,'* Dos figuras y una estrella.\n* Debajo dice: MI MEJOR AMIGA.'),
        prop('lumo_box','box',75,101,16,20,'* Una caja de recuerdos junto a la cama.\n* Lumo guarda aquí papeles, estrellas y pequeñas aventuras.',rect(75,110,16,11)),
        deco('lumo_candle','mobile',22,35,47,23,'* Una guirnalda de luces sobre la cama.\n* Lumo tiene un cielo a su medida.') ]}
  };}
  let installed=null,scale=2,worldRooms=null,flowerState=()=>false;
  const nativeToWorld=(r,R)=>R(r.x,r.y,r.width,r.height);
  function install({rooms,R,progress}){
    if(installed)return installed;scale=2;worldRooms=rooms;flowerState=()=>progress?.has('flower_watered');
    const defs=definitions();
    for(const [id,def]of Object.entries(defs)){
      const room={...def,walkable:def.walkable.map(r=>nativeToWorld(r,R)),
        solids:def.props.filter(p=>p.solid).map(p=>nativeToWorld(p.solid,R)),
        exits:def.exits.map(e=>({...e,...nativeToWorld(e,R)})),
        interactives:def.props.map(p=>({...p,...(p.interaction?nativeToWorld(p.interaction,R):R(p.x,p.y,p.width,p.solid?p.height:Math.max(p.height,77-p.y)))})),
        render:(ctx,view)=>drawRoom(ctx,view,id),drawForeground:(ctx,view)=>drawProps(ctx,view,id,true)};
      rooms[id]=room;
    }
    // Keep the original third door and its barrier. The only new connection
    // starts beyond the mirror/umbrella at the original corridor's right edge.
    rooms.hallway.exits=rooms.hallway.exits.filter(e=>e.target!=='gallery'&&e.target!=='lumoRoom');
    rooms.hallway.interactives=rooms.hallway.interactives.filter(p=>p.id!=='hallway_inner_door');
    if(!rooms.hallway.solids.some(r=>r.x===574*2&&r.y===20*2))rooms.hallway.solids.push(R(574,20,33,39));
    if(!rooms.hallway.interactives.some(p=>p.id==='hallway_locked_door'))rooms.hallway.interactives.push({...R(574,21,34,51),id:'hallway_locked_door',text:'* La puerta está cerrada.'});
    rooms.hallway.exits.push({...R(733,94,12,34),dir:'right',target:'gallery',spawn:[44,152],facing:'right'});
    // Original left landing is visibly wooden. Give its plant a real approach.
    rooms.entrance.walkable.push(R(37,75,30,70));
    rooms.torielRoom.label='Habitación de Ryon · PC';
    rooms.friskRoom.label='Habitación de Mira';
    // No event is granted merely by reinstalling the saved piano activity.
    installed=defs;return defs;
  }
  function blit(ctx,kind,x,y,w,h){const a=art[kind],source=a&&images[a.source];
    if(!source?.complete||!source.naturalWidth)return;
    if(a.frame)ctx.drawImage(source,...a.frame,x,y,w,h);else ctx.drawImage(source,x,y,w,h);
  }
  const fill=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  function woodFloor(ctx,x,y,w,h){
    // Repeat the untouched native planks; the tile starts/ends on a board seam.
    const original=images.wood;if(!original?.complete||!original.naturalWidth){fill(ctx,'#f2c078',x,y,w,h);return;}
    const source=original;
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    const startX=18+Math.floor((x-18)/280)*280,startY=74+Math.floor((y-74)/30)*30;
    for(let yy=startY;yy<y+h;yy+=30)for(let xx=startX;xx<x+w;xx+=280)ctx.drawImage(source,20,100,280,30,xx,yy,280,30);
    ctx.restore();
  }
  function rug(ctx,r){fill(ctx,'#5f534b',r.x,r.y,r.width,r.height);fill(ctx,'#c9a481',r.x+1,r.y+1,r.width-2,r.height-2);
    fill(ctx,'#866b73',r.x+3,r.y+3,r.width-6,r.height-6);
    for(let y=r.y+6;y<r.y+r.height-5;y+=6)for(let x=r.x+6;x<r.x+r.width-5;x+=8){fill(ctx,'#b99994',x,y,2,2);}
    fill(ctx,'#e1c098',r.x+4,r.y+4,r.width-8,1);fill(ctx,'#e1c098',r.x+4,r.y+r.height-5,r.width-8,1);}
  function surface(ctx,def,x,y,w,h){
    const material=def.material||'woodFloor';
    if(!global?.HomeInteriorArt?.tile(ctx,material,x,y,w,h,{x:18,y:74}))woodFloor(ctx,x,y,w,h);
  }
  function doors(ctx,def){
    for(const e of def.exits){
      if(e.dir==='up'){surface(ctx,def,e.x-4,50,e.width+8,30);fill(ctx,def.palette.trim,e.x-4,21,e.width+8,39);
        fill(ctx,'#fff1cb',e.x-2,23,e.width+4,35);fill(ctx,'#f3c956',e.x+e.width-5,47,2,2);}
      if(e.dir==='down'){const edge=def.nativeHeight-30;surface(ctx,def,e.x-4,edge,e.width+8,def.nativeHeight-edge);}
      if(['left','right'].includes(e.dir)){surface(ctx,def,e.dir==='left'?0:def.nativeWidth-26,e.y-4,26,e.height+8);
        fill(ctx,def.palette.wall,e.dir==='left'?0:def.nativeWidth-14,e.y-27,14,23);
        fill(ctx,def.palette.trim,e.dir==='left'?14:def.nativeWidth-15,e.y-27,1,23);}
    }
  }
  function base(ctx,def,id){
    if(id==='garden'&&global?.HomeOutdoorArt?.background(ctx,def,{motion:global?.HouseExperience?.reducedMotion!==true,time:(global?.HouseExperience?.elapsedSeconds||0)*1000}))return;
    if(global?.HomeWingStyle?.background(ctx,def,id)){
      for(const mat of def.rugs||[])global?.HomeInteriorArt?.drawFrame(ctx,mat.frame,mat.x,mat.y,mat.scale||1);
      return;
    }
    const w=def.nativeWidth,h=def.nativeHeight,bottom=h-26,p=def.palette;
    if(def.floor==='garden'&&global?.HomeGardenArt?.background(ctx,def))return;
    fill(ctx,'#000',0,0,w,h);fill(ctx,p.wall,18,16,w-36,58);
    global?.HomeInteriorArt?.tile(ctx,def.wallMaterial||'wallCream',18,16,w-36,58,{x:18,y:16});
    if(def.panel)global?.HomeInteriorArt?.tile(ctx,def.panel,18,48,w-36,26,{x:18,y:48});
    fill(ctx,p.trim,18,73,w-36,1);
    surface(ctx,def,18,74,w-36,bottom-74);
    if(def.floor==='garden'){
      fill(ctx,'#66a45d',18,74,w-36,bottom-74);
      for(let y=77;y<bottom;y+=7)for(let x=20;x<w-20;x+=11){fill(ctx,(x+y)%3?'#87ba69':'#4e8a54',x+(y%3),y,2,1);}
      for(let y=86;y<bottom-4;y+=29)for(let x=35;x<w-28;x+=43){
        fill(ctx,'#a4ce6b',x,y,1,3);fill(ctx,'#8fc975',x-1,y+1,3,1);
        if((x+y)%3===0)fill(ctx,'#e9dd91',x,y-1,1,1);
      }
      fill(ctx,'#e2c48d',18,155,225,29);fill(ctx,'#947145',18,154,225,1);
      fill(ctx,'#e2c48d',224,123,19,61);fill(ctx,'#f3d8a8',20,162,219,1);
      for(let x=30;x<231;x+=23){fill(ctx,'#cfae7b',x,173,5,1);fill(ctx,'#f4dcb4',x+7,164,2,1);}
      fill(ctx,'#594c33',45,105,58,31);fill(ctx,'#946841',47,107,54,27);
      for(let yy=111;yy<133;yy+=5)fill(ctx,'#714c36',50,yy,48,1);
      fill(ctx,p.wall,18,16,w-36,58);
      for(let y=22;y<73;y+=12){fill(ctx,'#97b873',18,y,w-36,1);fill(ctx,'#d6e8b3',18,y+1,w-36,1);}
      for(let x=33;x<w-28;x+=26)fill(ctx,'#b0ca8b',x,17,1,55);
    }
    fill(ctx,p.trim,17,16,1,bottom-15);fill(ctx,p.trim,w-18,16,1,bottom-15);
    fill(ctx,p.wall,18,bottom,w-36,4);fill(ctx,p.trim,18,bottom-1,w-36,1);
    if(def.rug)rug(ctx,def.rug);
    for(const mat of def.rugs||[])global?.HomeInteriorArt?.drawFrame(ctx,mat.frame,mat.x,mat.y,mat.scale||1);
    doors(ctx,def);
    for(const a of def.props.filter(p=>p.kind==='alcove')){
      const right=a.x>def.nativeWidth/2,edge=right?def.nativeWidth-26:0;
      surface(ctx,def,edge,a.y-4,26,a.height+8);
      fill(ctx,p.wall,right?def.nativeWidth-14:0,a.y-27,14,23);
      fill(ctx,p.trim,right?def.nativeWidth-15:14,a.y-27,1,23);
    }
  }
  function special(ctx,p){const {x,y,width:w,height:h}=p;
    const state={...global?.HomeWorld?.objects?.visual(p.id),
      motion:global?.HouseExperience?.reducedMotion!==true,time:(global?.HouseExperience?.elapsedSeconds||0)*1000,watered:flowerState(),
      claimed:p.id==='lumo_desk'&&global?.LumoGame?.drawingClaimed===true};
    if(global?.HomeOutdoorArt?.draw(ctx,p,state))return;
    if(global?.HomeRoomFurnishing?.draw(ctx,p,state))return;
    if(global?.HomeWingStyle?.draw(ctx,p,state))return;
    if(global?.HomeInteriorArt?.draw(ctx,p,state))return;
    if(global?.HomeGardenArt?.draw(ctx,p,state))return;
    if(global?.HomePixelArt?.draw(ctx,p,state))return;
    if(p.kind==='seedling'){
      // Original flower head is sampled without the corridor's opaque wall.
      blit(ctx,'plant',x,y+9,w,h-9);
      fill(ctx,'#6a8050',x+16,y+6,1,8);fill(ctx,'#e9cc55',x+12,y+2,8,5);
      fill(ctx,'#f4db6b',x+14,y,4,9);fill(ctx,'#9c6c38',x+15,y+3,2,2);
      if(flowerState()){fill(ctx,'#a9c3ca',x+8,y+h-6,12,1);}return;
    }
    if(p.kind==='window'){
      fill(ctx,'#694a37',x,y,w,h);fill(ctx,'#ede1b6',x+1,y+1,w-2,h-2);fill(ctx,'#9bad9b',x+3,y+3,w-6,h-6);
      fill(ctx,'#d9dcbd',x+4,y+4,w-8,2);fill(ctx,'#ede1b6',x+Math.floor(w/2)-1,y+2,2,h-4);
      fill(ctx,'#ede1b6',x+2,y+Math.floor(h/2),w-4,2);return;
    }
    if(p.kind==='secret'){
      fill(ctx,'#634836',x,y,w,h);fill(ctx,'#ac8663',x+1,y+1,w-2,h-2);fill(ctx,'#dec399',x+2,y+2,w-4,1);
      fill(ctx,'#75593d',x+Math.floor(w/2),y+3,1,h-5);fill(ctx,'#edd39a',x+w-8,y+25,2,2);
      fill(ctx,'#efe0b9',x+14,y+10,5,1);fill(ctx,'#efe0b9',x+16,y+8,1,5);return;
    }
    if(p.kind==='box'){fill(ctx,'#65462e',x,y,w,h);fill(ctx,'#b58b5d',x+1,y+1,w-2,h-2);fill(ctx,'#e2bc89',x+2,y+2,w-4,2);
      fill(ctx,'#775334',x+1,y+7,w-2,2);fill(ctx,'#e3c294',x+11,y+8,3,3);return;}
    if(p.kind==='gardenBench'){fill(ctx,'#59442b',x+4,y+h-11,5,11);fill(ctx,'#59442b',x+w-9,y+h-11,5,11);
      fill(ctx,'#9e774a',x,y+3,w,15);fill(ctx,'#d9b17d',x+1,y+4,w-2,2);fill(ctx,'#654f33',x+1,y+13,w-2,1);return;}
    if(p.kind==='towel'){fill(ctx,'#79634f',x-1,y+1,w+2,2);fill(ctx,'#f5edd9',x+3,y+2,w-6,h-3);fill(ctx,'#bac4b1',x+5,y+h-6,w-10,2);return;}
    if(p.kind==='drawing'){
      fill(ctx,'#866753',x,y,w,h);fill(ctx,'#f3ecd6',x+1,y+1,w-2,h-2);
      fill(ctx,'#514950',x+10,y+9,7,7);fill(ctx,'#967ca7',x+10,y+17,7,7);fill(ctx,'#514950',x+27,y+10,11,10);
      fill(ctx,'#ece5ed',x+29,y+13,2,3);fill(ctx,'#ece5ed',x+34,y+13,2,3);fill(ctx,'#a48ab5',x+29,y+21,7,4);
      fill(ctx,'#d397a8',x+47,y+8,5,1);fill(ctx,'#d397a8',x+49,y+6,1,5);
      ctx.font='5px Undertale,monospace';ctx.fillStyle='#514950';ctx.fillText('MI MEJOR AMIGA',x+3,y+h-4);return;
    }
    blit(ctx,p.kind,x,y,w,h);
    if(p.id==='garden_flower'&&flowerState()){fill(ctx,'#82a4a7',x+7,y+h-5,11,1);}
  }
  function setup(ctx,view){ctx.save();ctx.translate(Math.round(-view.x),Math.round(-view.y));ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;}
  function drawRoom(ctx,view,id){const def=installed?.[id];if(!def)return;setup(ctx,view);base(ctx,def,id);
    for(const p of [...def.props].sort((a,b)=>a.depthY-b.depthY))special(ctx,p);ctx.restore();}
  function drawProps(ctx,view,id,foreground,feet){const def=installed?.[id];if(!def||!foreground)return;
    const playerFeet=feet||global?.HomeWorld?.getFeet?.();if(!playerFeet)return;setup(ctx,view);
    for(const p of [...def.props].sort((a,b)=>a.depthY-b.depthY))if(p.solid&&playerFeet.y+playerFeet.height<=p.depthY*scale)special(ctx,p);
    ctx.restore();}
  function drawPiano(){return false;}
  const alternatives={
    gallery_picture:'* Vuelves a mirar las flores del cuadro.\n* Esas no necesitan agua.',
    gallery_candle_right:'* La vela sigue en su sitio.\n* Su trabajo es iluminar, sin hacer preguntas.',
    gallery_plant:'* Dejas la tarjeta junto a la cómoda.\n* El consejo todavía sirve.',
    gallery_umbrella:'* Las hojas están limpias.\n* La maceta tiene un buen sitio.',
    bathroom_sink:'* Cierras el grifo.\n* La última gota cae en el lavabo.',
    bathroom_toilet:'* Todo sigue limpio y en su sitio.\n* Misterio resuelto.',
    bathroom_towel:'* La toalla sigue lista en su barra.\n* Una victoria doméstica pequeña.',
    reading_books:'* Cierras el libro y lo devuelves a su sitio.\n* La flor sigue entre las páginas.',
    reading_window:'* Vuelves a mirar por la ventana.\n* Nada tiene demasiada prisa ahí afuera.',
    reading_plant:'* La lámpara espera al próximo lector.\n* A veces basta con un poco de luz.',
    reading_tv:'* Apagas la televisión.\n* El rincón de los sillones vuelve a quedar tranquilo.',
    reading_origami:'* El paisaje sigue allí.\n* Sus hojas no tienen demasiada prisa.',
    garden_hall_flower:'* El banco sigue libre junto a la salida.\n* Entrar sin tierra también cuenta como cuidar la casa.'
  };
  function description(object){if(!installed||!object)return null;
    if(global?.HomeWorld?.objects?.readOnly&&Object.values(installed).some(def=>def.props.some(p=>p.id===object.id)))return '* Lo observas con atención.\n* Todo sigue en su sitio.';
    const visual=global?.HomeWorld?.objects?.visual(object.id);
    return visual&&alternatives[object.id]&&!visual.value?alternatives[object.id]:null;
  }
  function feedback(object){if(global?.HomeRoomDetails)return global.HomeRoomDetails.feedback(object);
    if(object?.id==='garden_hall_picture'&&!global?.HomeWorld?.objects?.readOnly)global?.UndertaleAudio?.note(3,{volume:.35});}
  return {definitions,install,assets:[...Object.values(images).filter(Boolean),...(global?.HomeCandleArt?.assets||[]),...(global?.HomeRoomFurnishing?.assets||[]),...(global?.HomeOutdoorArt?.assets||[]),...(global?.HomeWingStyle?.assets||[]),...(global?.HomeInteriorArt?.assets||[])],drawRoom,drawPiano,drawProps,description,feedback,frames:FRAMES,extraFrames:EXTRA_FRAMES,getFeet:null,objects:null};
});
