const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../pc-desktop.js'),'utf8');
function fixture({request='success',outsideFullscreen=false}={}){
  let Desktop,requests=0,exits=0,focused=0;
  const labels={},attrs=new Set(),screen={classList:{toggle(name,value){this[name]=value;}}},desktop={};
  const game={iframe:{focus(){focused++;},contentWindow:{focus(){}}}};
  const button={setAttribute(k,v){labels[k]=v;},querySelector(){return {set textContent(v){labels.text=v;}};}};
  const host={hidden:true,firstElementChild:game};
  const document={fullscreenElement:outsideFullscreen?{}:null,async exitFullscreen(){exits++;document.fullscreenElement=null;}};
  vm.runInNewContext(source,{HTMLElement:class{},document,customElements:{get(){return null;},define(name,type){Desktop=type;}}});
  const pc=Object.create(Desktop.prototype);
  Object.assign(pc,{_fullscreenToken:0,_ownsFullscreen:false,_setLoading(){},
    shadowRoot:{querySelector(q){return {'.game-host':host,'.pc-expand':button,'.screen':screen,'.desktop':desktop}[q];}},
    toggleAttribute(k,v){v?attrs.add(k):attrs.delete(k);},removeAttribute(k){attrs.delete(k);},hasAttribute(k){return attrs.has(k);}});
  let finish;
  if(request!=='missing')pc.requestFullscreen=()=>{
    requests++;
    if(request==='denied')return Promise.reject(Error('NotAllowed'));
    if(request==='pending')return new Promise(resolve=>{finish=()=>{document.fullscreenElement=pc;resolve();};});
    document.fullscreenElement=pc;return Promise.resolve();
  };
  return {pc,host,document,labels,desktop,finish:()=>finish(),counts:()=>({requests,exits,focused})};
}
test('FNF visibility does not request fullscreen or hide the PC surroundings',()=>{
  const {pc,host,desktop,counts}=fixture();pc.setGameVisible(true);
  assert.equal(pc.gameActive,true);assert.equal(host.hidden,false);assert.equal(desktop.inert,true);
  assert.equal(counts().requests,0);assert.equal(pc.hasAttribute('screen-expanded'),false);
  pc.setGameVisible(false);assert.equal(host.hidden,true);assert.equal(desktop.inert,false);
});
test('explicit expansion and reduction retain the same game iframe',async()=>{
  const {pc,host,document,labels,counts}=fixture();const original=host.firstElementChild;pc.setGameVisible(true);
  await pc.setExpanded(true);assert.equal(document.fullscreenElement,pc);assert.equal(labels['aria-pressed'],'true');
  await pc.setExpanded(false);assert.equal(document.fullscreenElement,null);assert.equal(labels['aria-pressed'],'false');
  assert.equal(host.firstElementChild,original);assert.equal(pc.gameActive,true);
  assert.equal(counts().requests,1);assert.equal(counts().exits,1);
});
test('denied or unsupported native fullscreen still allows a reversible in-page expansion',async()=>{
  for(const request of ['missing','denied']){
    const {pc,document}=fixture({request});await pc.setExpanded(true);
    assert.equal(pc.hasAttribute('screen-expanded'),true);assert.equal(document.fullscreenElement,null);
    await pc.setExpanded(false);assert.equal(pc.hasAttribute('screen-expanded'),false);
  }
});
test('a cancelled pending fullscreen request cannot leave a hidden PC fullscreen',async()=>{
  const {pc,document,finish}=fixture({request:'pending'});
  const pending=pc.setExpanded(true);await pc.setExpanded(false);finish();await pending;
  assert.equal(document.fullscreenElement,null);assert.equal(pc.hasAttribute('screen-expanded'),false);
});
test('expansion never exits another element fullscreen',async()=>{
  const {pc,document,counts}=fixture({outsideFullscreen:true});const other=document.fullscreenElement;
  await pc.setExpanded(true);await pc.setExpanded(false);
  assert.equal(document.fullscreenElement,other);assert.equal(counts().exits,0);
});
