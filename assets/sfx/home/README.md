# Efectos de HOME

Se consultó el catálogo de Undertale alojado por The Sounds Resource (MilesTheCreator,
12 de marzo de 2016) y se extrajeron nueve muestras de su archivo ZIP público.
`SOURCES.json` registra la dirección exacta, el nombre dentro del archivo y el SHA-256
de cada muestra. Siete WAV también coinciden con el espejo documentado, fijado a una
revisión concreta; los dos OGG entregados conservan el contenedor del catálogo.
El juego incluye únicamente las nueve muestras elegidas, sin el archivo ZIP completo.

Los archivos conservan sus bytes. `sfx-data.js` incorpora exactamente esos mismos
bytes para que la reproducción no dependa de peticiones de red, ni de un servidor
al abrir el HTML. Un control de volumen y una ventana corta de reproducción suavizan
papel, tela, cartas y agua; no cambian el tono. Las asociaciones de las muestras con
los objetos de HOME pertenecen a este proyecto: no representan sus usos originales
en Undertale.

| Muestra | Uso HOME |
| --- | --- |
| snd_bell.wav | Campanilla, móvil de viento, pareja encontrada |
| snd_dimbox.wav | Abrir la caja de objetos |
| snd_lightswitch.wav | Interruptor y golpe corto del reloj |
| snd_splash.wav | Riego o gesto del grifo |
| snd_switchpull_n.wav | Palanca o pequeña pieza móvil |
| snd_tearcard.wav | Textura breve de papel, cartas y tela |
| snd_squeak.wav | Un pitido breve del juguete |
| mus_dooropen.ogg | Apertura de mueble |
| mus_doorclose.ogg | Cierre de mueble |

Catálogo: https://sounds.spriters-resource.com/pc_computer/undertale/asset/399803/

Biblioteca previa de texto y menú: https://github.com/RhenaudTheLukark/CreateYourFrisk/tree/master/Assets/Default/Sounds

Los controles de texto/menú siguen usando los WAV anteriores de Create Your Frisk.
Tarareo de Lumo, piano, silbato y golpes anteriores conservan su comportamiento.
La alternativa sintetizada solo se utiliza si una muestra no se puede decodificar;
el estado interno `sampleStatus` la identifica como `fallback`, sin mensajes al jugador.

Las muestras pertenecen a Toby Fox y a sus respectivos autores. Su disponibilidad
en un catálogo o espejo no demuestra una licencia de publicación. Las fuentes,
sumas SHA-256, tamaños y nombres originales están en `SOURCES.json`.
