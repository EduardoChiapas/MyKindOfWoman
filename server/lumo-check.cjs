'use strict';
// Private creator CLI: synthetic conversations owned by this process only.
const {configFromEnv}=require('./lumo-provider.cjs');
const {createLumoServer}=require('./lumo-server.cjs');
async function run() {
  const config=configFromEnv();
  if (!process.argv.includes('--live') || !config.enabled || !config.apiKey || !config.model) {
    console.log('Prueba real pendiente: --live, AI_ENABLED=true, clave y modelo requeridos.');process.exitCode=2;return;
  }
  const server=createLumoServer({config});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try {
    const initial=await fetch(base+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:'{}'});
    const cookie=initial.headers.get('set-cookie').split(';')[0],payload=await initial.json();
    const headers={'Content-Type':'application/json',Origin:base,Cookie:cookie,'X-CSRF-Token':payload.csrfToken};
    await fetch(base+'/api/session/consent',{method:'POST',headers,body:JSON.stringify({consent:true})});
    for(const character of ['lumo','ryon']) {
      const route=character==='lumo'?'/api/chat':'/api/ryon/chat';
      const result=await fetch(base+route,{method:'POST',headers,body:JSON.stringify({message:'Cuéntame algo sobre mirar la casa juntos',requestId:'creator-test-'+character,context:{room:'livingroom'}})});
      const data=await result.json();console.log(character+': '+(data.source==='ai'?'IA validada':'diálogo local · '+(data.reason||'error')));
      if(data.source!=='ai') process.exitCode=1;
    }
    console.log(JSON.stringify(server.lumoStats()));
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
run().catch(()=>{console.error('No se pudo completar la prueba; revisar configuración del servidor.');process.exitCode=1;});
