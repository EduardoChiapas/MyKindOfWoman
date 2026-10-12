/* HOME greetings: fixed, reviewed fragments; no provider, events or save access. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LumoGreetings = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const ROOMS = ['bedroom', 'hallway', 'livingroom', 'kitchen', 'bathroom', 'ryonroom', 'lumo_room', 'garden'];
  const KINDS = ['first', 'repeat', 'return', 'friends', 'regular', 'serious'];
  const PERIODS = ['morning', 'afternoon', 'night'];
  // Fragment order and indices are part of saved IDs: append or introduce a new prefix,
  // rather than reordering these banks when adding future dialogue.
  const INTRODUCTIONS = {
    first: [
      'Hola, Mira. Soy Lumo; flotar es mi especialidad y parecer profesional todavía está en pruebas.',
      '¡Mira! Soy Lumo, supervisor de aventuras pequeñas. La entrevista duró cero segundos y me contraté.',
      'Mucho gusto, Mira. Me llamo Lumo; vengo con curiosidad, comentarios y una dignidad bastante portátil.',
      'Hola, Mira. Soy Lumo, experto en acompañar y sospechar que una idea mala puede ser divertidísima.',
      'Eh, Mira. Soy Lumo; sí, floto. El aterrizaje elegante se vende por separado, aparentemente.',
      'Hola, Mira. Soy Lumo; mi presentación formal iba a ser épica, pero olvidé contratar una orquesta.',
      '¡Buenas, Mira! Me llamo Lumo y mi currículum dice criatura increíble, escrito con mi propia letra.',
      'Mira, hola. Soy Lumo; traigo un talento enorme para opinar y uno moderado para tener razón.',
      'Hola, Mira. Me llamo Lumo; puedes hablar conmigo sin cita previa ni entrevista con recursos flotantes.',
      'Bro, hola, Mira. Soy Lumo; estoy intentando causar una primera impresión que sobreviva a mi segunda frase.',
      'Hola, Mira. Soy Lumo; pequeño formato, grandes comentarios. Mi modestia está buscando dónde estacionarse.',
      'Mucho gusto, Mira. Soy Lumo; mi plan es acompañarte y llamar investigación a curiosear con mucha seriedad.',
      '¡Hola, Mira! Me llamo Lumo. Ensayé una entrada triunfal y terminé saludando, tremendo giro de guion.',
      'Hola, Mira. Soy Lumo; puedes considerarme compañía con comentarios opcionales y cero manual de instrucciones.',
      'Eh, Mira, soy Lumo. Mi saludo elegante acaba de hacer buffering; este es el saludo de emergencia.',
      'Hola, Mira. Me llamo Lumo; intenté ponerme misterioso, pero me dio risa. JAJAJA, vamos bien.'
    ],
    repeat: [
      'Aquí sigo, Mira. Mi departamento de conversación renovó su contrato por puro entusiasmo.',
      'Eh, Mira. ¿Otra idea? Mis dos neuronas imaginarias están apartando una mesa para debatirla.',
      'Mira, te escucho. Acabo de poner cara de experto; ahora falta que llegue la experiencia.',
      '¿Qué se te ocurrió, Mira? Tengo curiosidad y una confianza que no pasó control de calidad.',
      'Hola otra vez, Mira. Mi discurso anterior todavía está buscando el premio que se inventó.',
      'Aquí estoy, Mira. La siguiente ocurrencia puede entrar; mis pensamientos no respetan las filas.',
      'Mira, seguimos. Estoy preparado para escuchar y asentir con una solemnidad completamente innecesaria.',
      'Eh, Mira. La conversación tiene segunda temporada y mi presupuesto sigue siendo puro aire.',
      'Mira, dime. Mis comentarios salieron a estirar las piernas, expresión curiosa en mi caso.',
      'Otra charla, Mira. Perfecto; mi club de ideas raras acaba de declarar jornada de puertas abiertas.',
      'Bro, Mira, aquí sigo. Mi concentración hizo una pirueta y creo que ya aterrizó.',
      'Mira, puedes contarme. Estoy practicando escuchar sin convertir cada frase en una conferencia flotante.',
      'Eh, Mira. Actualización pequeña: sigo siendo yo y mis ocurrencias siguen sin supervisor responsable.',
      'Mira, te escucho otra vez. Tengo cara de saber algo; esperemos que esa estrategia funcione.',
      'Aquí sigo, Mira. JAJAJA, casi me preparo una despedida para una conversación que sigue abierta.',
      'Mira, dime lo que te apetezca. Mi curiosidad acaba de anunciar que tiene cuerda para rato.'
    ],
    return: [
      'Hola de nuevo, Mira. Qué gusto verte; mi comité de bienvenida consiste en mí haciendo esta cara.',
      '¡Mira, buenas! Podemos charlar otro ratito; mis ideas siguen teniendo tamaños muy poco regulados.',
      'Eh, Mira, qué gusto encontrarnos. Traigo compañía y una broma que todavía está buscando empleo.',
      'Hola, Mira. Volvemos a coincidir y mi solemnidad acaba de pedir permiso para irse a descansar.',
      'Mira, bienvenida. Mi saludo de lujo es igual que el normal, pero lo digo con mucha convicción.',
      'Qué bueno verte, Mira. Podemos retomar lo que te apetezca; mi brújula conversacional acepta sugerencias.',
      'Hola de nuevo, Mira. Tengo curiosidad lista y una reputación de experto sostenida con optimismo.',
      '¡Eh, Mira! Aquí estoy para compartir un rato; las ceremonias pueden quedarse de vacaciones.',
      'Mira, qué gusto. Mis ocurrencias organizaron una bienvenida y ninguna quiso encargarse del discurso.',
      'Hola, Mira. Podemos conversar con calma; mi gran entrada fue flotar unos centímetros con autoridad.',
      'Bro, Mira, buenas. Otra oportunidad para que mi cara de profesional engañe absolutamente a nadie.',
      'Qué gusto coincidir, Mira. Mi versión elegante de hola se convirtió en esto durante el ensayo.',
      'Hola de nuevo, Mira. Me alegra tu compañía; mis comentarios vienen sin horario obligatorio.',
      'Mira, bienvenida otra vez. Tengo una idea brillante, aunque quizá solo sea el reflejo de otra idea.',
      '¡Hola, Mira! Mi saludo hizo buffering, pero la alegría de verte cargó sin problema.',
      'Buenas de nuevo, Mira. JAJAJA, quise saludar con misterio y terminé con cara de pregunta.'
    ],
    friends: [
      'Mira, qué gusto verte. Compartir ratitos contigo mejora mi día y empeora mi falsa fama de temible.',
      '¡Hola, Mira! Mi compañera de expediciones tiene acceso preferente a escuchar mis ideas de dudosa calidad.',
      'Eh, Mira. Me gusta charlar contigo; hasta mis ocurrencias están intentando comportarse un poquito.',
      'Mira, bienvenida. Mi gran prestigio flotante tiene espacio para una charla y alguna tontería compartida.',
      'Hola, Mira. Qué gusto coincidir; prometo escuchar antes de fundar otro ministerio absurdo.',
      'Mira, buenas. Nuestra siguiente idea puede ser pequeña; yo puedo aportarle una presentación desproporcionada.',
      '¡Eh, Mira! Tu compañía me alegra y mi modestia está haciendo un esfuerzo heroico por disimularlo.',
      'Hola, Mira. Aquí tienes a tu compañero flotante, con curiosidad encendida y solemnidad en mantenimiento.',
      'Mira, me alegra verte. Podemos conversar; mi club de aventuras ya tiene un nombre demasiado largo.',
      'Qué gusto, Mira. Mi talento para acompañarte funciona incluso cuando mis chistes necesitan reiniciarse.',
      'Bro, Mira, hola. Estoy ensayando ser una criatura impresionante y ya me distraje saludándote.',
      'Eh, Mira. Me gusta compartir estas pausas contigo; mis discursos épicos pueden tomarse el día libre.',
      'Hola, Mira. Llegó mi momento de actuar natural, así que por supuesto lo estoy anunciando.',
      'Mira, qué bueno encontrarnos. Mis ideas están reunidas y ninguna se quiere sentar en la silla responsable.',
      '¡Buenas, Mira! Esto merece una bienvenida elegante; el comité votó por decir hola y seguir tranquilos.',
      'Hola, Mira. JAJAJA, mi cara de criatura seria duró muchísimo: casi hasta que te vi.'
    ],
    regular: [
      'Hola, Mira. Tu comentarista flotante tiene curiosidad lista y un prestigio que conviene no investigar mucho.',
      'Eh, Mira. Podemos charlar un rato; mis ideas están haciendo fila, más o menos.',
      '¡Mira, buenas! Traigo compañía y una confianza sospechosamente superior a mis conocimientos de orientación.',
      'Hola, Mira. Estoy listo para escuchar; mi discurso de experto puede esperar a que consiga un tema.',
      'Mira, qué gusto. Mi agenda dice conversar, escrito sobre varias citas imaginarias conmigo mismo.',
      'Eh, Mira. Podemos pensar una aventura o una tontería; ambas admiten mi supervisión innecesaria.',
      'Hola, Mira. Hoy mi curiosidad está funcionando y mi sentido común negocia las condiciones.',
      '¡Buenas, Mira! Mi gran idea de momento es saludarte; empezamos con un éxito manejable.',
      'Mira, te escucho. Acabo de poner cara de conversación importante y me quedó cara de curiosidad.',
      'Hola, Mira. Mis ocurrencias quieren opinar, pero primero podemos ver qué te apetece a ti.',
      'Bro, Mira, buenas. Mi talento está calentando motores y el motor es una expresión, afortunadamente.',
      'Eh, Mira. Me alegra compartir un rato; mi protocolo de solemnidad se fue a buscar una galleta.',
      'Hola, Mira. Puedes contarme lo que te apetezca; mi curiosidad no pide un formulario de entrada.',
      'Mira, bienvenida. Tengo una teoría excelente sobre cómo empezar una charla: diciendo hola.',
      '¡Hola, Mira! Mi saludo premium trae exactamente esto, pero con una cantidad irresponsable de entusiasmo.',
      'Eh, Mira. JAJAJA, intenté saludar como una criatura enigmática y me salió voz de vecino.'
    ],
    serious: [
      'Hola, Mira. Estoy cerca; podemos hablar a tu ritmo o compartir un momento de silencio.',
      'Mira, te escucho. Puedes contarme lo que te apetezca, sin tener que explicarlo todo ahora.',
      'Aquí estoy, Mira. Podemos hacer una pausa tranquila y dejar que la conversación vaya despacio.',
      'Hola, Mira. Me quedo cerca; si prefieres descansar en silencio, también podemos hacerlo.',
      'Mira, podemos ir con calma. Te acompaño sin esperar una respuesta ni pedirte que estés de cierto modo.',
      'Hola, Mira. Hay espacio para lo que sientes y para una conversación sin ninguna prisa.',
      'Mira, estoy aquí para escucharte. Podemos hablar de una cosa pequeña o quedarnos tranquilos.',
      'Aquí estoy, Mira. No hace falta encontrar las palabras enseguida; podemos tomarnos un momento.',
      'Hola, Mira. Puedes elegir cuánto contar y cuánto silencio compartir; me quedo cerca.',
      'Mira, te acompaño. Si te apetece hablar, escucho; si prefieres una pausa, también está bien.',
      'Hola, Mira. Podemos quedarnos un ratito tranquilos, sin intentar resolver todo en una sola charla.',
      'Mira, podemos empezar despacio. No hace falta que tengas preparada una explicación de cómo te sientes.',
      'Aquí estoy contigo, Mira. La conversación puede ser breve, y una pausa también tiene su espacio.',
      'Hola, Mira. Te escucho con calma; podemos dejar para después lo que hoy resulte difícil decir.',
      'Mira, me quedo cerca. Puedes hablar, cambiar de tema o descansar; seguimos a tu ritmo.',
      'Hola, Mira. Podemos compartir este momento sin exigencias y dar espacio a lo que necesites expresar.'
    ]
  };
  const ROOM_LINES = {
    bedroom: [
      'Este dormitorio tiene una almohada con más autoridad que yo; la respeto, pero cuestiono su programa de siestas.',
      'En este cuarto puedo supervisar el descanso con una seriedad completamente ridícula; la cama aporta casi todo el trabajo.',
      'Aquí el dormitorio invita a bajar el ritmo; mi aportación científica es sospechar que las almohadas siempre ganan.',
      'En este cuarto mi plan de conquista consiste en no estorbar y mirar la cama como un experto.',
      'Este dormitorio parece perfecto para una charla tranquila; mi dignidad puede sentarse junto a la cama, imaginariamente.',
      'Aquí estoy negociando con las almohadas del dormitorio; ellas ofrecen comodidad y yo comentarios, bastante mala oferta la mía.'
    ],
    hallway: [
      'Este pasillo tiene varios destinos y yo una brújula basada en señalar con muchísimo entusiasmo.',
      'Aquí en el pasillo podemos pensar adónde ir; mi consejo profesional es no pedirle indicaciones a la pared.',
      'En este pasillo mi carrera de guía está teniendo un momento importante: todavía no he elegido dirección.',
      'Este pasillo es perfecto para decidir una pequeña expedición; yo aporto cara de conocer el recorrido.',
      'Aquí el pasillo parece una reunión de puertas; mi propuesta de presidirla recibió cero respuestas.',
      'En este pasillo tengo una teoría de orientación excelente: elegir un destino antes de anunciar que ya llegamos.'
    ],
    livingroom: [
      'Este sofá de la sala tiene pinta de ganar cualquier debate sobre descansar; voy a estudiar sus argumentos.',
      'Aquí en la sala puedo acompañarte mientras mi carrera de supervisor del sofá alcanza niveles absurdos.',
      'En esta sala una pausa parece un plan buenísimo; mi comité de entusiasmo ya aprobó quedarse cómodos.',
      'La sala invita a charlar sin ceremonia; el sofá puede aportar su impresionante experiencia en estar quieto.',
      'Aquí estoy inspeccionando la sala con cara de experto; el sofá parece mucho más cualificado para el puesto.',
      'En esta sala podríamos fundar un club de ideas pequeñas; el sofá sería nuestro director de comodidad.'
    ],
    kitchen: [
      'Esta cocina activa mi curiosidad científica; si hay galletas, mi estudio quizá necesite supervisión independiente.',
      'Aquí en la cocina puedo comentar recetas con autoridad, aunque una cuchara probablemente tenga más experiencia.',
      'En esta cocina el refrigerador tiene un trabajo serio y yo una investigación sobre posibles meriendas.',
      'La cocina invita a inventar un plan rico; mi aportación sería opinar sin confundirme con el chef.',
      'Aquí estoy mirando la cocina como experto gastronómico; todavía estoy decidiendo si ese título cabe en mi currículum.',
      'En esta cocina mi cara de crítico exige respeto; mi teoría principal es que una galleta sería una gran noticia.'
    ],
    bathroom: [
      'Este espejo del baño parece tranquilo; yo estoy practicando mirarlo sin convertirlo en una entrevista de trabajo.',
      'Aquí en el baño el espejo recibe mi mejor cara de criatura importante; por ahora no ha emitido comentarios.',
      'En este baño mi reflejo tiene una expresión rarísima; sospecho que está copiando a alguien de talento discutible.',
      'El baño tiene espejo y yo curiosidad; podemos charlar mientras abandono mi carrera de posar con solemnidad.',
      'Aquí estoy inspeccionando el baño con dignidad; el espejo aporta una segunda opinión idéntica a la primera.',
      'En este baño el espejo tiene ventajas para debatir conmigo: conoce todas mis caras de falso experto.'
    ],
    ryonroom: [
      'En el cuarto de Ryon esa PC invita a curiosear; puedo acompañarte sin vender mis opiniones como soporte técnico.',
      'Aquí en el cuarto de Ryon miro la PC con autoridad; mi primer consejo experto sería encontrar el botón correcto.',
      'En el cuarto de Ryon la PC parece una buena excusa para investigar; yo aporto curiosidad y cero garantía técnica.',
      'Aquí la PC del cuarto de Ryon tiene más teclas que yo ideas ordenadas; la competencia está difícil.',
      'En el cuarto de Ryon puedo supervisar la curiosidad por la PC; mi diploma de informática sería una servilleta imaginaria.',
      'Aquí en el cuarto de Ryon podemos charlar o mirar la PC; mi cara de técnico viene sin certificado.'
    ],
    lumo_room: [
      'Este rincón mío tiene espacio para conversar y para una cantidad bastante sospechosa de ocurrencias.',
      'Aquí en mi cuarto las visitas son bienvenidas; el protocolo oficial consiste en ponerse a gusto.',
      'En mi rincón puedo ejercer de anfitrión importante; mi gran ceremonia es hacer sitio para una charla.',
      'Este cuarto mío admite ideas pequeñas y discursos enormes; podemos elegir la opción que dé menos sueño.',
      'Aquí en mi rincón la comodidad tiene permiso para mandar; mi departamento de ceremonias se quedó sin trabajo.',
      'En mi cuarto mi prestigio de anfitrión está en juego; de momento he conseguido señalar que estamos aquí.'
    ],
    garden: [
      'Estas flores del jardín tienen muchísimo estilo; yo estoy practicando observarlas sin dar una conferencia a cada hoja.',
      'Aquí en el jardín podemos mirar las plantas; mi consejo de experto es dejar que ellas sepan ser plantas.',
      'En este jardín las flores hacen casi toda la decoración; yo aporto una cara de estar ayudando.',
      'El jardín invita a una pausa bonita; mi candidatura a supervisor de hojas sigue sin respuestas.',
      'Aquí estoy mirando las flores del jardín con admiración; mi talento para florecer todavía necesita investigación.',
      'En este jardín podemos conversar tranquilamente; las flores ponen el estilo y yo comentarios de presupuesto reducido.'
    ]
  };
  const TIME_LINES = {
    morning: [
      'Esta mañana mis ideas todavía están despertando; alguna intentó pedir cinco minutos más.',
      'La mañana promete, aunque mi entusiasmo está calentando antes de hacer cualquier cosa épica.',
      'Vamos con calma esta mañana; mi cerebro imaginario acaba de encontrar el botón de inicio.',
      'Esta mañana tengo energía para un plan pequeño y para anunciarlo como si fuera enorme.',
      'A estas horas de la mañana mi seriedad bosteza; mis ocurrencias aparentemente madrugaron.',
      'La mañana trae posibilidades; mi plan maestro de momento es no confundirlas todas a la vez.'
    ],
    afternoon: [
      'Esta tarde cabe una aventura pequeña o una charla; ambas tienen mi aprobación completamente innecesaria.',
      'La tarde está perfecta para una idea tranquila, aunque mi narrador interior quiera poner música épica.',
      'Podemos ir a nuestro ritmo esta tarde; mi enorme agenda imaginaria sobrevivirá al descanso.',
      'Esta tarde mis ideas están haciendo sobremesa; alguna sigue contando un chiste que nadie pidió.',
      'A estas horas de la tarde puedo parecer muy ocupado; en realidad estoy decidiendo qué comentar.',
      'La tarde admite planes sencillos; mi departamento de exageraciones se ofrece a ponerles un título.'
    ],
    night: [
      'A estas horas podemos conversar con calma; mi discurso épico ya se puso pijama imaginaria.',
      'La noche invita a bajar el ritmo; incluso mis ocurrencias están buscando un sitio cómodo.',
      'Esta noche podemos elegir una charla tranquila; mi entusiasmo sabe hablar bajito, aunque le cueste presumirlo.',
      'A estas horas mi talento admite modo descanso; las aventuras también pueden esperar tranquilamente.',
      'Esta noche una pausa me parece un plan excelente; mi comité de siestas votó con unanimidad.',
      'La noche tiene su propio ritmo; puedo acompañarte sin presentar cada idea como un evento mundial.'
    ]
  };
  const CALM_ROOMS = {
    bedroom: [
      'Podemos quedarnos aquí en el dormitorio un momento y conversar con calma.',
      'En este cuarto podemos hacer una pausa antes de pensar en cualquier otra cosa.',
      'El dormitorio puede ser nuestro lugar para una charla breve y tranquila.',
      'Aquí, junto a la cama, podemos tomarnos un momento sin necesidad de seguir explorando.',
      'Podemos conversar aquí en el dormitorio o simplemente compartir esta pausa.',
      'En este cuarto hay espacio para quedarnos tranquilos y elegir después qué hacer.'
    ],
    hallway: [
      'Podemos hacer una pausa aquí en el pasillo sin elegir todavía nuestro siguiente destino.',
      'En este pasillo podemos conversar con calma antes de movernos a otro cuarto.',
      'Aquí en el pasillo me quedo cerca mientras nos tomamos un momento tranquilo.',
      'Podemos quedarnos un poco en el pasillo y decidir después adónde ir.',
      'Este pasillo puede ser un lugar para detenernos y hablar a tu ritmo.',
      'Aquí en el pasillo podemos compartir una pausa sin seguir explorando por ahora.'
    ],
    livingroom: [
      'Podemos quedarnos aquí en la sala y compartir una pausa tranquila.',
      'En esta sala podemos conversar junto al sofá, sin ninguna prisa.',
      'Aquí en la sala hay espacio para descansar un momento antes de seguir.',
      'La sala puede ser nuestro lugar para una charla breve o un poco de silencio.',
      'Podemos tomarnos una pausa en la sala y elegir después qué hacer.',
      'Aquí, cerca del sofá, podemos quedarnos tranquilos y conversar si te apetece.'
    ],
    kitchen: [
      'Podemos detenernos aquí en la cocina y hablar con calma.',
      'En esta cocina podemos compartir una pausa sin preparar ninguna actividad.',
      'Aquí en la cocina me quedo cerca mientras nos tomamos un momento tranquilo.',
      'Podemos conversar un rato en la cocina y decidir después si queremos seguir.',
      'Esta cocina puede ser un lugar para una charla sencilla, a tu ritmo.',
      'Aquí en la cocina podemos hacer una pausa y dejar los planes para después.'
    ],
    bathroom: [
      'Podemos conversar aquí en el baño un momento o salir cuando te apetezca.',
      'En este baño podemos hacer una pausa breve antes de decidir adónde ir.',
      'Aquí en el baño me quedo cerca; podemos tomar un momento con calma.',
      'Podemos detenernos en el baño y elegir después un lugar para descansar.',
      'Aquí, cerca del espejo del baño, podemos conversar a tu ritmo.',
      'En este baño podemos compartir una pausa breve sin apresurar la conversación.'
    ],
    ryonroom: [
      'Podemos quedarnos en el cuarto de Ryon un momento sin usar la PC.',
      'Aquí en el cuarto de Ryon podemos conversar con calma y dejar la PC para después.',
      'En este cuarto, cerca de la PC, podemos compartir una pausa tranquila.',
      'Podemos detenernos aquí en el cuarto de Ryon antes de pensar en otra actividad.',
      'Aquí junto a la PC del cuarto de Ryon podemos charlar a tu ritmo.',
      'En el cuarto de Ryon podemos hacer una pausa y decidir después qué queremos mirar.'
    ],
    lumo_room: [
      'Podemos quedarnos aquí en mi rincón y compartir un rato tranquilo.',
      'En mi cuarto podemos conversar con calma o simplemente descansar un momento.',
      'Aquí en mi rincón puedes tomarte una pausa antes de elegir otra actividad.',
      'Podemos compartir un poco de silencio en mi cuarto si te apetece.',
      'Este rincón mío puede ser un lugar para una charla sencilla, a tu ritmo.',
      'Aquí en mi cuarto me quedo cerca mientras nos tomamos un momento sin prisa.'
    ],
    garden: [
      'Podemos quedarnos en el jardín y mirar las flores mientras compartimos esta pausa.',
      'Aquí en el jardín podemos conversar con calma, cerca de las plantas.',
      'En este jardín podemos tomarnos un momento sin pensar en otra actividad.',
      'Podemos hacer una pausa junto a las flores del jardín y hablar si te apetece.',
      'Este jardín puede ser nuestro lugar para una charla tranquila o un poco de silencio.',
      'Aquí entre las plantas del jardín podemos quedarnos un rato y seguir a tu ritmo.'
    ]
  };
  const CALM_TIMES = {
    morning: [
      'Esta mañana podemos empezar despacio, sin tener que preparar un plan.',
      'La mañana nos permite tomarnos este momento antes de seguir con otras cosas.',
      'A estas horas de la mañana está bien elegir una conversación tranquila.',
      'Podemos dejar que esta mañana avance a nuestro ritmo, con espacio para descansar.',
      'Esta mañana una pausa también puede ser parte de nuestro día.',
      'Si te apetece, podemos compartir un rato tranquilo durante esta mañana.'
    ],
    afternoon: [
      'Esta tarde podemos tomarnos una pausa y dejar los planes para después.',
      'La tarde también tiene espacio para descansar y conversar sin prisa.',
      'A estas horas de la tarde podemos elegir ir despacio.',
      'Podemos compartir una charla tranquila esta tarde, tan breve como te apetezca.',
      'Esta tarde está bien dedicar un momento a simplemente quedarnos aquí.',
      'Si te apetece, podemos dejar que esta tarde siga a nuestro ritmo.'
    ],
    night: [
      'Esta noche podemos bajar el ritmo y compartir un momento tranquilo.',
      'La noche también permite una charla breve o una pausa en silencio.',
      'A estas horas está bien descansar y dejar cualquier plan para después.',
      'Podemos conversar con calma esta noche, sin necesidad de alargar la charla.',
      'Esta noche podemos tomarnos nuestro tiempo para elegir qué nos apetece.',
      'Si prefieres descansar a estas horas, me parece bien compartir esta pausa.'
    ]
  };
  function validId(id) {
    if (typeof id !== 'string' || id.length > 100) return false;
    const parts = id.split(':'), modern = parts[0] === 'g2';
    if (modern) parts.shift();
    if (parts.length !== 6 || !KINDS.includes(parts[0]) || !ROOMS.includes(parts[1]) || !PERIODS.includes(parts[2])) return false;
    const maxima = modern ? [15, 5, 5] : [3, 1, 2];
    return parts.slice(3).every((value, i) => /^(?:0|[1-9]\d?)$/.test(value) && Number(value) <= maxima[i]);
  }
  function bounded(value, maximum) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.floor(value))) : 0;
  }
  function choose(context = {}, previous = {}, options = {}) {
    const c = context && typeof context === 'object' ? context : {};
    const p = previous && typeof previous === 'object' ? previous : {};
    const o = options && typeof options === 'object' ? options : {};
    const room = ROOMS.includes(c.room) ? c.room : 'bedroom';
    const now = typeof o.now === 'number' && Number.isFinite(o.now) && o.now >= 0 && o.now <= 8640000000000000 ? o.now : Date.now();
    const hour = new Date(now).getHours();
    const period = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 19 ? 'afternoon' : 'night';
    const count = bounded(p.count, 1000000), lastAt = Math.min(now, bounded(p.lastAt, 8640000000000000));
    const lastId = validId(p.lastId) ? p.lastId : null;
    const kind = c.serious === true ? 'serious' : o.firstMeeting === true ? 'first' : count && p.lastRoom === room && now - lastAt < 120000 ? 'repeat' : count && now - lastAt > 3600000 ? 'return' : bounded(o.friendship, 60) >= 12 ? 'friends' : 'regular';
    const random = typeof o.random === 'function' ? o.random : Math.random;
    const pick = size => {
      let value;
      try { value = Number(random()); } catch (_) { value = 0; }
      return Math.floor((Number.isFinite(value) ? Math.max(0, Math.min(0.9999999999999999, value)) : 0) * size);
    };
    let i = pick(INTRODUCTIONS[kind].length);
    const r = pick(6), t = pick(6);
    const id = () => ['g2', kind, room, period, i, r, t].join(':');
    if (id() === lastId) i = (i + 1) % INTRODUCTIONS[kind].length;
    const calm = kind === 'serious';
    const text = [INTRODUCTIONS[kind][i], (calm ? CALM_ROOMS : ROOM_LINES)[room][r], (calm ? CALM_TIMES : TIME_LINES)[period][t]].join(' ');
    // A later version belongs to that version's reader; never replace or mutate it.
    const future = typeof p.version === 'number' && p.version > 1;
    const state = future ? p : { version: 1, count: Math.min(1000000, count + 1), lastId: id(), lastAt: now, lastRoom: room };
    return {
      response: { text, emotion: calm ? 'SUPPORTIVE' : period === 'night' ? 'NORMAL' : 'HAPPY', animation: calm ? 'support' : 'float', memory_reference: null, narrative_intent: null, source: 'local' },
      state
    };
  }
  return Object.freeze({ choose, validId });
});
