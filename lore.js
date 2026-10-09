'use strict';

// Rectángulos en píxeles NATIVOS del PNG. El motor los convierte con R().
// Las zonas de cuadros y velas se prolongan discretamente hasta su zócalo
// para poder examinarlos desde el suelo sin atravesar muebles.
// Objetos elevados sobre camas o encimeras forman parte del texto del mueble.
const HOUSE_LORE = {
  entrance: [
    {
      id: 'entrance_plant', x: 41, y: 18, width: 31, height: 55,
      text: '* Esta planta recibe agua todos los días.\n* La tierra está húmeda. Alguien acaba de cuidarla.'
    },
    {
      id: 'entrance_landscape', x: 109, y: 17, width: 101, height: 43,
      text: '* Un paisaje de colores suaves.\n* Hasta las montañas parecen abrigadas.'
    },
    {
      id: 'entrance_candle', x: 222, y: 28, width: 11, height: 31,
      text: '* Una vela pequeña ilumina la entrada.\n* Parece una manera tranquila de decir: «Bienvenido».'
    },
    {
      id: 'entrance_portrait', x: 237, y: 20, width: 20, height: 38,
      text: '* El marco guarda un retrato muy antiguo.\n* El cristal está limpio. Aquí los recuerdos reciben mucho cuidado.'
    },
    {
      id: 'entrance_console', x: 242, y: 47, width: 40, height: 32,
      text: '* Los cajones guardan manteles cuidadosamente doblados.\n* Siempre parece haber uno más, por si llega alguien.'
    }
  ],

  livingRoom: [
    {
      id: 'living_fireplace', x: 132, y: 39, width: 72, height: 42,
      text: '* El fuego crepita en voz baja.\n* El calor llega hasta tus manos.\n* No tienes ninguna prisa.'
    },
    {
      id: 'living_library', x: 211, y: 13, width: 63, height: 61,
      text: '* Libros sobre monstruos, plantas y recetas caseras.\n* Un recetario tiene anotaciones en los márgenes.\n* «Un poquito más de canela».'
    },
    {
      id: 'living_umbrella_stand', x: 280, y: 29, width: 22, height: 49,
      text: '* Los paraguas están juntos en su sitio.\n* Uno es bastante más pequeño que los demás.'
    },
    {
      id: 'living_table', x: 65, y: 145, width: 92, height: 50,
      text: '* Una mesa de madera con un florero en el centro.\n* Las flores están cuidadas y la madera, limpia.\n* Hay sitio para compartir una comida sin prisa.'
    },
    {
      id: 'living_chair', x: 108, y: 51, width: 47, height: 50,
      text: '* Un sillón junto a la chimenea.\n* El respaldo está gastado de una forma muy cómoda.\n* Es fácil imaginar un cuento que dure toda la tarde.'
    },
    {
      id: 'living_dining_back', x: 99, y: 121, width: 25, height: 23,
      text: '* Una silla de madera al otro lado de la mesa.\n* Desde aquí se ve toda la sala.'
    },
    {
      id: 'living_dining_left', x: 51, y: 151, width: 15, height: 25,
      text: '* Una silla pequeña, bien acercada a la mesa.\n* El asiento está liso de tanto usarlo.'
    },
    {
      id: 'living_dining_right', x: 156, y: 144, width: 17, height: 34,
      text: '* Una silla espera junto a la mesa.\n* Parece un buen lugar para escuchar mientras alguien prepara el té.'
    }
  ],

  hallway: [
    {
      id: 'hallway_first_candle', x: 110, y: 47, width: 11, height: 26,
      text: '* La llama tiembla cuando te acercas.\n* Tal vez también es tímida.'
    },
    {
      id: 'hallway_umbrella_stand', x: 209, y: 40, width: 23, height: 46,
      text: '* Un paraguas tiene el mango torcido.\n* Parece que alguien lo usó para alcanzar una galleta.'
    },
    {
      id: 'hallway_flowers', x: 235, y: 35, width: 25, height: 50,
      text: '* Flores que no saben nada de la superficie.\n* Florecen de todos modos.'
    },
    {
      id: 'hallway_painting', x: 250, y: 26, width: 50, height: 35,
      text: '* Un paisaje marrón, sencillo y lejano.\n* La pintura nunca podrá abrir una ventana, pero lo intenta.'
    },
    {
      id: 'hallway_large_plant', x: 322, y: 35, width: 31, height: 51,
      text: '* Las hojas se inclinan hacia el pasillo.\n* Parece que la planta quiere escuchar quién vuelve a casa.'
    },
    {
      id: 'hallway_middle_candle', x: 435, y: 48, width: 11, height: 26,
      text: '* Una gota de cera se ha quedado a medio camino.\n* Incluso la vela se toma las cosas con calma.'
    },
    {
      id: 'hallway_last_candle', x: 525, y: 48, width: 11, height: 26,
      text: '* Otra vela.\n* Alguien se tomó el tiempo de iluminar incluso este rincón.'
    },
    {
      id: 'hallway_small_plant', x: 544, y: 39, width: 25, height: 45,
      text: '* La maceta está un poco torcida.\n* La planta parece muy satisfecha con su decoración.'
    },
    {
      id: 'hallway_locked_door', x: 574, y: 21, width: 34, height: 51,
      text: '* La puerta no se abre.\n* El cartel ha perdido sus letras.\n* Del otro lado, alguien parece haberse olvidado de hacer ruido.'
    },
    {
      id: 'hallway_mirror_candle', x: 625, y: 47, width: 11, height: 27,
      text: '* Esta vela ilumina el espejo.\n* Su luz hace que tu reflejo parezca un poco más abrigado.'
    },
    {
      id: 'mirror', x: 645, y: 33, width: 55, height: 29,
      text: '* Eres tú, a pesar de todo sigues siendo tú.'
    },
    {
      id: 'hallway_far_umbrella', x: 710, y: 45, width: 23, height: 41,
      text: '* Un paraguas solitario vigila el final del corredor.\n* No parece un buen guardia, pero lleva mucho tiempo aquí.'
    }
  ],

  friskRoom: [
    {
      id: 'frisk_bed', x: 18, y: 57, width: 64, height: 77,
      text: '* Una cama demasiado cómoda para quedarse despierto.\n* Los pequeños marcos de arriba parecen cuidar tus sueños.'
    },
    {
      id: 'frisk_little_plant', x: 83, y: 38, width: 20, height: 51,
      text: '* Una planta pequeña junto a tu cama.\n* Ahora los dos tienen una habitación propia.'
    },
    {
      id: 'frisk_bookshelf', x: 104, y: 29, width: 58, height: 60,
      text: '* Libros escogidos para alguien que todavía no había llegado.\n* Arriba, unas flores amarillas hacen compañía a los cuentos.'
    },
    {
      id: 'frisk_dresser', x: 165, y: 52, width: 54, height: 34,
      text: '* Los cajones están vacíos y el marco de arriba espera un recuerdo.\n* Es una forma muy amable de decir que puedes quedarte.'
    },
    {
      id: 'frisk_desk_book', x: 25, y: 131, width: 35, height: 61,
      text: '* Un libro te espera sobre el escritorio.', action: 'book'
    },
    {
      id: 'frisk_chair', x: 67, y: 143, width: 16, height: 28,
      text: '* Una silla de tu tamaño.\n* No hace falta ponerse de puntillas para pertenecer aquí.'
    },
    {
      id: 'frisk_wastebasket', x: 39, y: 194, width: 14, height: 18,
      text: '* Una papelera vacía.\n* Todavía no has tenido que descartar ninguna idea.'
    },
    {
      id: 'frisk_corner_plant', x: 185, y: 166, width: 36, height: 48,
      text: '* Esta planta ocupa todo un rincón.\n* Sus hojas están limpias y su maceta acaba de regarse.'
    }
  ],

  torielRoom: [
    {
      id: 'toriel_dresser', x: 20, y: 52, width: 54, height: 32,
      text: '* Cada cajón está ordenado con un cuidado casi ceremonial.\n* Una lámpara y un viejo retrato guardan la superficie.'
    },
    {
      id: 'toriel_wardrobe', x: 86, y: 28, width: 31, height: 56,
      text: '* Un armario alto, muy bien cuidado.\n* Las flores de encima se renuevan antes de que puedan marchitarse.'
    },
    {
      id: 'toriel_bed', x: 151, y: 59, width: 64, height: 73,
      text: '* La cama está perfectamente hecha.\n* La colcha es suave y los cuadros están derechos.\n* Todo tiene el cuidado de las cosas queridas.'
    },
    {
      id: 'toriel_wall_drawing', x: 129, y: 24, width: 19, height: 37,
      text: '* Un dibujo pequeño protegido por un marco.\n* Algunas líneas tiemblan.\n* Alguien decidió que eso lo hacía más valioso.'
    },
    {
      id: 'toriel_chair', x: 157, y: 142, width: 18, height: 26,
      text: '* El asiento conserva una ligera hendidura.\n* Aquí se han leído muchos cuentos en voz baja.'
    },
    {
      id: 'toriel_desk', x: 180, y: 141, width: 33, height: 59,
      text: '* Papeles, libros y una taza junto a la lámpara.\n* Una lista termina con: «Comprar otra porción».\n* No hay ningún nombre después.'
    }
  ],

  kitchen: [
    {
      id: 'kitchen_fridge', x: 20, y: 23, width: 39, height: 61,
      text: '* El refrigerador está lleno de comida.\n* Hay más porciones de las que necesita una sola persona.'
    },
    {
      id: 'kitchen_sink', x: 60, y: 47, width: 29, height: 21,
      text: '* El fregadero está impecable.\n* Los platos se secan ordenados, listos para la próxima comida.'
    },
    {
      id: 'kitchen_counter', x: 91, y: 49, width: 54, height: 34,
      text: '* Los cubiertos esperan en cajones bien ordenados.\n* De la pared cuelgan utensilios de todos los tamaños.\n* Ninguno parece diseñado para manos pequeñas.'
    },
    {
      id: 'kitchen_stove', x: 147, y: 42, width: 30, height: 42,
      text: '* El horno todavía conserva un poco de calor.\n* Huele a canela y a algo recién horneado.\n* Es un aroma que invita a quedarse.'
    }
  ]
};
