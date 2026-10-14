/* Read-only HOME display helpers. No game events or storage. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomePresentation=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const NAMES={lumo:'Lumo',home_piano:'Piano',mirror:'Espejo',toriel_pc:'PC de Ryon',
    entrance_basement_door:'Bajada al sótano',entrance_plant:'Planta',entrance_landscape:'Paisaje',
    entrance_candle:'Vela',entrance_portrait:'Retrato',entrance_console:'Cajón',
    living_fireplace:'Chimenea',living_library:'Recetario',living_umbrella_stand:'Paraguas',
    living_table:'Mesa',living_chair:'Sillón',living_dining_back:'Silla',living_dining_left:'Silla',living_dining_right:'Silla',
    hallway_first_candle:'Vela',hallway_middle_candle:'Vela',hallway_last_candle:'Vela',hallway_mirror_candle:'Vela',
    hallway_umbrella_stand:'Paraguas',hallway_far_umbrella:'Paraguas',hallway_flowers:'Flores',
    hallway_painting:'Dibujo',hallway_large_plant:'Planta',hallway_small_plant:'Planta',hallway_locked_door:'Puerta cerrada',lumo_hideout_entry:'Escondite',
    frisk_bed:'Cama',frisk_little_plant:'Planta',frisk_corner_plant:'Planta',frisk_bookshelf:'Estantería',
    frisk_dresser:'Cajón',frisk_desk_book:'Libro',frisk_chair:'Silla',frisk_wastebasket:'Papelera',
    toriel_dresser:'Cajón',toriel_wardrobe:'Armario',toriel_bed:'Cama',toriel_wall_drawing:'Dibujo',toriel_chair:'Silla',toriel_desk:'Escritorio',
    kitchen_fridge:'Refrigerador',kitchen_sink:'Grifo',kitchen_counter:'Encimera',kitchen_stove:'Horno',
    gallery_picture:'Cuadro',gallery_candle_left:'Vela',gallery_candle_right:'Vela',gallery_plant:'Cómoda',gallery_umbrella:'Planta',
    bathroom_tub:'Bañera',bathroom_sink:'Lavabo',bathroom_toilet:'Inodoro',bathroom_towel:'Toalla',bathroom_soap:'Armario',
    reading_books:'Libros',reading_window:'Ventana',reading_sofa:'Sofá',reading_chair:'Sillón',reading_table:'Parejas',reading_plant:'Lámpara',reading_origami:'Cuadro',reading_tv:'Televisión',
    garden_hall_window:'Ventana',garden_hall_flower:'Banco',garden_hall_picture:'Lámpara',
    garden_workbench:'Calabazas',garden_flower:'Flor',garden_tree_left:'Árbol',garden_tree_gold:'Árbol dorado',garden_pond:'Estanque',garden_tree_right:'Roca',garden_watering_can:'Letrero',garden_bench:'Banco',garden_frog:'Setas',
    lumo_bed:'Camita',lumo_desk:'Escritorio',lumo_drawing:'Dibujo',lumo_box:'Recuerdos',lumo_candle:'Luces'};
  const KINDS={map:'Mapa',clock:'Reloj',hooks:'Perchero',mailbox:'Buzón',umbrella:'Paraguas',
    bath:'Bañera',sink:'Lavabo',toilet:'Inodoro',towel:'Toalla',soap:'Jabón',books:'Libros',
    sofa:'Sofá',window:'Ventana',plant:'Planta',origami:'Grulla',memoryTable:'Parejas',
    chair:'Sillón',picture:'Cuadro',windchime:'Campanillas',flower:'Flor',can:'Regadera',
    workbench:'Jardinera',bench:'Banco',frog:'Ranita',bird:'Pajarito',bed:'Camita',
    desk:'Escritorio',box:'Caja',drawing:'Dibujo',mobile:'Estrellas',candle:'Vela',
    bookcase:'Libros',blindWindow:'Persiana',chaise:'Diván',beanbag:'Puf',gameTable:'Parejas',
    recordPlayer:'Tocadiscos',glass:'Vidriera',bootrack:'Botas',pottingBench:'Mesa de cultivo',
    flowerbed:'Flor',trellis:'Enredadera',birdbath:'Bebedero',wateringCan:'Regadera',gardenBench:'Banco',hammock:'Camita'};
  function hintLabel(object,coarse=false){
    if(!object)return '';
    const name=NAMES[object.id]||KINDS[object.kind]||'';
    return (coarse?'Examinar':'Z')+(name?' · '+name:' · Examinar');
  }
  function layoutSize(width,height,devicePixelRatio=1){
    if(![width,height].every(v=>Number.isFinite(v)&&v>0))return null;
    const dpr=Number.isFinite(devicePixelRatio)&&devicePixelRatio>0?Math.max(.5,Math.min(4,devicePixelRatio)):1;
    const fit=Math.min(width/320,height/240),desktop=width>=640&&height>=480;
    const scale=desktop?Math.max(1,Math.floor(fit*dpr+.000001))/dpr:fit;
    return {width:320*scale,height:240*scale,integerPixels:desktop,scale};
  }
  function mount(){
    const document=global?.document,stage=document?.getElementById('game-stage');if(!stage)return;
    const fit=()=>{const size=layoutSize(global.innerWidth,global.innerHeight,global.devicePixelRatio);if(!size)return;
      stage.style.setProperty('--home-stage-width',size.width+'px');stage.style.setProperty('--home-stage-height',size.height+'px');};
    fit();global.addEventListener('resize',fit,{passive:true});
  }
  if(global)mount();
  return Object.freeze({hintLabel,layoutSize});
});
