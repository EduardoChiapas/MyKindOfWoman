/* HOME architecture. Native pixels, original tiles, shared art/physics placement. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeWorld=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const rect=(x,y,width,height)=>({x,y,width,height});
  const image=src=>{if(!global)return null;const value=new global.Image();value.src=src;return value;};
  const images={wood:image('assets/rooms/living_room.png'),hall:image('assets/rooms/hallway.png'),
    bedroom:image('assets/rooms/frisk_room.png'),kitchen:image('assets/rooms/kitchen.png'),
    entrance:image('assets/rooms/entrance.png'),table:image('assets/props/living_table.png'),
    chair:image('assets/props/reading_chair.png'),atlas:image('assets/home/furniture-atlas.png'),extra:image('assets/home/lumo-furniture-atlas.png')};
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
  const COMMON={wall:'#f6e7bd',trim:'#956239',shade:'#d8bd8f'};
  function definitions(){return {
    gallery:{label:'Corredor interior',nativeWidth:320,nativeHeight:240,palette:COMMON,
      walkable:[rect(18,72,284,142),rect(142,48,36,32),rect(142,210,36,30),rect(0,120,26,42),rect(294,120,26,42)],
      exits:[exit('down','hallway',[590,91],146,226,28,14),exit('up','bathroom',[120,170],146,58,28,18),
        exit('left','readingRoom',[286,139],0,124,14,34),exit('right','gardenHall',[26,108],306,124,14,34)],
      props:[deco('gallery_picture','portrait',43,30,50,29,'* Un paisaje tranquilo.\n* Este corredor une los rincones de la casa.'),
        deco('gallery_candle_left','candle',114,34,11,23,'* Una vela ilumina el camino de vuelta.'),
        deco('gallery_candle_right','candle',196,34,11,23,'* Cera tibia, en su pequeño soporte.'),
        prop('gallery_plant','plant',237,50,32,42,'* Las hojas apenas rozan la pared.\n* El centro del corredor queda libre.'),
        {...prop('hallway_locked_door','secret',48,153,34,45,'* En la puerta pequeña hay una estrella diminuta.',rect(48,175,34,23)),target:'lumoRoom',condition:'lumo_hideout'}],
      rug:rect(106,99,108,66)},
    bathroom:{label:'Baño',nativeWidth:240,nativeHeight:200,palette:{...COMMON,wall:'#d7dfce'},floor:'tile',
      walkable:[rect(18,72,204,102),rect(102,170,36,30)],
      exits:[exit('down','gallery',[160,88],106,186,28,14)],
      props:[prop('bathroom_tub','bath',25,64,79,69,'* El agua está quieta.\n* Una toalla doblada espera cerca.',rect(27,99,75,31)),
        prop('bathroom_sink','sink',128,27,37,62,'* El espejo está limpio.\n* Eres Mira, incluso con el pelo despeinado.',rect(129,73,35,15)),
        prop('bathroom_toilet','toilet',181,59,30,50,'* Todo está en su sitio.\n* Lumo ha decidido esperar prudentemente junto a la puerta.',rect(182,88,28,20)),
        deco('bathroom_towel','towel',72,30,31,22,'* Una toalla suave, perfectamente doblada.') ]},
    readingRoom:{label:'Sala de lectura',nativeWidth:320,nativeHeight:240,palette:COMMON,
      walkable:[rect(18,74,284,140),rect(294,120,26,42)],
      exits:[exit('right','gallery',[34,141],306,124,14,34)],
      props:[prop('reading_books','bookcase',30,25,63,61,'* Cuentos, recetas y libros de plantas.\n* Puedes escoger uno sin pedir permiso.',rect(32,73,59,13)),
        deco('reading_window','window',135,25,71,40,'* La luz entra suavemente.\n* Se ven las hojas del jardín.'),
        prop('reading_sofa','sofa',126,72,78,53,'* Dos cojines cómodos.\n* Hay sitio para ti y para una criatura diminuta.',rect(128,101,74,23)),
        prop('reading_chair','chair',47,134,47,50,'* Un sillón apartado del paso.\n* Aquí una tarde puede durar todo un libro.',rect(51,162,39,21)),
        prop('reading_table','table',131,155,74,40,'* Una mesa para jugar a las parejas o compartir una historia.',rect(132,173,72,20)),
        prop('reading_plant','plant',252,169,31,40,'* Una planta recibe la última franja de luz del día.')],
      rug:rect(112,119,108,87)},
    gardenHall:{label:'Pasillo del jardín',nativeWidth:320,nativeHeight:156,palette:COMMON,
      walkable:[rect(0,76,320,56)],
      exits:[exit('left','gallery',[285,141],0,81,14,51),exit('right','garden',[34,170],306,81,14,51)],
      props:[deco('garden_hall_window','window',112,26,82,39,'* Tras el vidrio, el jardín sigue tranquilo.'),
        prop('garden_hall_flower','plant',235,44,31,40,'* Otra planta, cuidada con paciencia.'),
        deco('garden_hall_picture','portrait',35,30,50,29,'* Una pequeña pintura de hojas y luz.')],rug:rect(80,87,150,32)},
    garden:{label:'Jardín de casa',nativeWidth:320,nativeHeight:240,palette:COMMON,floor:'garden',
      walkable:[rect(18,82,284,136),rect(0,150,26,42)],
      exits:[exit('left','gardenHall',[285,108],0,154,14,34)],
      props:[prop('garden_workbench','bench',206,68,75,61,'* Macetas, semillas y una palita.\n* Todo lo necesario para cuidar algo pequeño.',rect(209,105,69,23)),
        prop('garden_flower','seedling',57,84,33,45,'* Una flor en su maceta.\n* La regadera está cerca; puedes cuidarla a tu ritmo.'),
        prop('garden_tree_left','plant',29,34,45,58,'* Hojas verdes sobre la pared del jardín.'),
        prop('garden_tree_right','plant',260,159,34,44,'* Esta planta disfruta de su propio rincón.'),
        deco('garden_watering_can','can',145,143,32,21,'* Una regadera ligera.\n* No es necesario regar dos veces para demostrar cariño.'),
        prop('garden_bench','gardenBench',81,177,65,29,'* Un banco bajo, mirando las flores.\n* También puedes descansar aquí.',rect(84,193,59,12))]},
    lumoRoom:{label:'El escondite de Lumo',nativeWidth:240,nativeHeight:200,palette:{...COMMON,wall:'#ddd4ed'},
      walkable:[rect(18,72,204,102),rect(102,170,36,30)],
      exits:[exit('down','gallery',[66,208],106,186,28,14)],
      props:[prop('lumo_bed','bed',29,76,39,60,'* Una cama diminuta.\n* La almohada parece una nube doblada.',rect(30,105,37,30)),
        prop('lumo_desk','desk',155,85,47,39,'* Un escritorio lleno de dibujos y estrellas.',rect(156,111,45,13)),
        deco('lumo_drawing','drawing',84,29,63,34,'* Dos figuras y una estrella.\n* Debajo dice: MI MEJOR AMIGA.'),
        prop('lumo_box','box',181,143,25,23,'* Una caja para guardar aventuras, sin prisa.',rect(181,150,25,16)),
        deco('lumo_candle','candle',43,32,11,23,'* Una luz pequeña para una habitación pequeña.')],rug:rect(82,102,68,50)}
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
        interactives:def.props.map(p=>({...p,...R(p.x,p.y,p.width,p.solid?p.height:Math.max(p.height,77-p.y))})),
        render:(ctx,view)=>drawRoom(ctx,view,id),drawForeground:(ctx,view)=>drawProps(ctx,view,id,true)};
      rooms[id]=room;
    }
    // The third original doorway now leads to the new wing. Its old ID is
    // retained at the secret door in gallery so saved gifts/hideout survive.
    rooms.hallway.solids=rooms.hallway.solids.filter(r=>!(r.x===574*2&&r.y===20*2));
    rooms.hallway.interactives=rooms.hallway.interactives.filter(p=>p.id!=='hallway_locked_door');
    rooms.hallway.exits.push({...R(576,63,28,13),dir:'up',target:'gallery',spawn:[160,209],facing:'up'});
    rooms.hallway.interactives.push({...R(576,20,28,51),id:'hallway_inner_door',text:'* El corredor interior lleva al baño, la sala de lectura y el jardín.'});
    // Original left landing is visibly wooden. Give its plant a real approach.
    rooms.entrance.walkable.push(R(37,75,30,70));
    rooms.torielRoom.label='Habitación de Ryon · PC';
    rooms.friskRoom.label='Habitación de Mira';
    // Keep the existing activity ID and location, replace only provisional art.
    rooms.livingRoom.interactives.push({...R(32,78,74,69),id:'home_piano',label:'Piano y partitura'});
    rooms.livingRoom.solids.push(R(34,111,70,33));
    installed=defs;return defs;
  }
  function blit(ctx,kind,x,y,w,h){const a=art[kind],source=a&&images[a.source];
    if(!source?.complete||!source.naturalWidth)return;
    if(a.frame)ctx.drawImage(source,...a.frame,x,y,w,h);else ctx.drawImage(source,x,y,w,h);
  }
  const fill=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  function woodFloor(ctx,x,y,w,h){
    // Repeat the untouched native planks; the tile starts/ends on a board seam.
    const source=images.wood;if(!source?.complete||!source.naturalWidth){fill(ctx,'#e6b678',x,y,w,h);return;}
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    const startX=18+Math.floor((x-18)/280)*280,startY=74+Math.floor((y-74)/30)*30;
    for(let yy=startY;yy<y+h;yy+=30)for(let xx=startX;xx<x+w;xx+=280)ctx.drawImage(source,20,100,280,30,xx,yy,280,30);
    ctx.restore();
  }
  function rug(ctx,r){fill(ctx,'#5f534b',r.x,r.y,r.width,r.height);fill(ctx,'#c9a481',r.x+1,r.y+1,r.width-2,r.height-2);
    fill(ctx,'#866b73',r.x+3,r.y+3,r.width-6,r.height-6);
    for(let y=r.y+6;y<r.y+r.height-5;y+=6)for(let x=r.x+6;x<r.x+r.width-5;x+=8){fill(ctx,'#b99994',x,y,2,2);}
    fill(ctx,'#e1c098',r.x+4,r.y+4,r.width-8,1);fill(ctx,'#e1c098',r.x+4,r.y+r.height-5,r.width-8,1);}
  function doors(ctx,def){
    for(const e of def.exits){
      if(e.dir==='up'){woodFloor(ctx,e.x-4,50,e.width+8,30);fill(ctx,'#785134',e.x-4,21,e.width+8,39);
        fill(ctx,'#efe1b8',e.x-2,23,e.width+4,35);fill(ctx,'#cbb188',e.x+e.width-5,47,2,2);}
      if(e.dir==='down'){const edge=def.nativeHeight===200?170:210;woodFloor(ctx,e.x-4,edge,e.width+8,def.nativeHeight-edge);}
      if(['left','right'].includes(e.dir)){woodFloor(ctx,e.dir==='left'?0:def.nativeWidth-26,e.y-4,26,e.height+8);
        fill(ctx,def.palette.wall,e.dir==='left'?0:def.nativeWidth-14,e.y-27,14,23);
        fill(ctx,'#956239',e.dir==='left'?14:def.nativeWidth-15,e.y-27,1,23);}
    }
    // Short rooms need the bottom doorway drawn from their actual floor edge.
    if(def.nativeHeight===200)woodFloor(ctx,102,174,36,26);
  }
  function base(ctx,def,id){
    const w=def.nativeWidth,h=def.nativeHeight,bottom=h===156?132:h===200?174:214,p=def.palette;
    fill(ctx,'#000',0,0,w,h);fill(ctx,p.wall,18,16,w-36,58);
    fill(ctx,p.shade,18,66,w-36,7);fill(ctx,p.trim,18,73,w-36,1);
    woodFloor(ctx,18,74,w-36,bottom-74);
    if(def.floor==='tile'){
      fill(ctx,'#e8e3ce',18,74,w-36,bottom-74);
      for(let y=74;y<bottom;y+=12)for(let x=18;x<w-18;x+=12){fill(ctx,((x-18)/12+(y-74)/12)%2?'#c6d1bb':'#eee8d4',x,y,11,11);}
    }
    if(def.floor==='garden'){
      fill(ctx,'#6e8851',18,74,w-36,bottom-74);
      for(let y=77;y<bottom;y+=7)for(let x=20;x<w-20;x+=11){fill(ctx,(x+y)%3?'#80985e':'#617c47',x+(y%3),y,2,1);}
      fill(ctx,'#c5b092',18,155,225,29);fill(ctx,'#8c7a60',18,154,225,1);
      fill(ctx,'#c5b092',224,123,19,61);fill(ctx,'#dbc6a4',20,162,219,1);
      fill(ctx,'#514c32',45,105,58,31);fill(ctx,'#866447',47,107,54,27);
      for(let yy=111;yy<133;yy+=5)fill(ctx,'#654c37',50,yy,48,1);
      fill(ctx,'#aba985',18,16,w-36,58);for(let y=22;y<73;y+=12){fill(ctx,'#88896e',18,y,w-36,1);}
    }
    fill(ctx,p.trim,17,16,1,bottom-15);fill(ctx,p.trim,w-18,16,1,bottom-15);
    fill(ctx,p.wall,18,bottom,w-36,4);fill(ctx,p.trim,18,bottom-1,w-36,1);
    if(def.rug)rug(ctx,def.rug);doors(ctx,def);
  }
  function special(ctx,p){const {x,y,width:w,height:h}=p;
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
  function drawPiano(ctx,view,foreground=false,feet){if(!installed)return;const p=prop('home_piano','piano',32,78,74,69,'');
    if(foreground&&(!feet||feet.y+feet.height>p.depthY*scale))return;setup(ctx,view);special(ctx,p);ctx.restore();}
  return {definitions,install,assets:Object.values(images).filter(Boolean),drawPiano,drawProps,frames:FRAMES,extraFrames:EXTRA_FRAMES,getFeet:null};
});
