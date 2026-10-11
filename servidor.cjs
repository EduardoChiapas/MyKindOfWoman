/* Local HOME server; optional model credentials stay outside browser files. */
const {createLumoServer}=require('./server/lumo-server.cjs');
const server=createLumoServer();
const port=Number(process.env.PORT)||8787;
server.listen(port,'127.0.0.1',()=>console.log('\nAbre en tu navegador: http://127.0.0.1:'+server.address().port+'\n\nCtrl+C para cerrar el servidor.'));