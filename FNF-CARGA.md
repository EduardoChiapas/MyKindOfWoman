# Descarga anticipada de FNF

Después de entrar en la casa, `fnf-preload.js` espera 2,5 segundos y prepara los archivos de FNF en segundo plano mientras caminas. Antes de entrar no registra el worker ni inicia descargas de FNF. Usa una descarga de fondo a la vez y pide prioridad baja de red. Un círculo de 22 px en la esquina inferior derecha indica el progreso; al completarse muestra una pequeña marca durante 2,5 segundos y desaparece. No intercepta clics ni toques. La PC conserva también el mensaje «Archivos descargados». La preparación no arranca el motor, reproduce audio ni cambia las canciones.

Se descargan aproximadamente 253 MB correspondientes al motor, sus bibliotecas de arranque y menús, Tutorial y los ZIP de The Date Week y Bad Bunny. Los videos y recursos exclusivos de otras semanas quedan fuera de la descarga anticipada. Al abrir FNF, la cola de fondo se pausa para dar prioridad al juego.

Un service worker limitado a `fnf-original/` guarda cada archivo con su revisión. Las siguientes visitas reutilizan los archivos guardados. Una revisión nueva vuelve a descargar solo los archivos que cambiaron; las revisiones anteriores se limpian del caché de FNF. La casa no pasa por ese service worker.

Funciona en GitHub Pages por HTTPS y en localhost. Si el navegador bloquea el almacenamiento o se queda sin espacio, FNF puede seguir usando su carga normal. El navegador puede borrar la caché; por eso la primera descarga podría repetirse. La descarga anticipada reduce la espera de red, pero el motor todavía debe preparar imágenes y audio al abrirse y la fluidez depende del equipo.

Si se cambian el mod, el motor o sus recursos, hay que regenerar los dos archivos `fnf-original/fnf-cache-manifest.*` con `node fnf-original/actualizar-cache.cjs` antes de publicar. El generador incluye las bibliotecas default/shared/songs/tutorial del export original. Si se añade otra biblioteca al catálogo, debe incluirse también en la lista del generador.

Referencias: [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache).
