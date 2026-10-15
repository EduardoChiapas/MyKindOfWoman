const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const game=fs.readFileSync(path.join(__dirname,'../fnf-original/Funkin.js'),'utf8');
function method(name,next){
  const start=game.indexOf(','+name+': function('),end=game.indexOf(','+next+': function',start);
  assert(start>0&&end>start,'native preloader method is available');
  return game.slice(start+name.length+3,end).trim();
}
function fixture(){
  const scope={funkin_ui_transition_preload_FunkinPreloader:{FADE_TIME:2.5,ELLIPSIS_TIME:.5,TOTAL_STEPS:11},
    funkin_ui_transition_preload_FunkinPreloaderState:{getProgressLeftText(){return null;}},
    flixel_system_FlxBasePreloader:{prototype:{update(percent){this.lastProgress=percent;}}}};
  const update=vm.runInNewContext('('+method('updateGraphics','updateProgressLeftText')+')',scope);
  const start=vm.runInNewContext('('+method('immediatelyStartGame','renderDisplayFadeOut')+')',scope);
  const preloader={completeTime:0,currentState:'CachingAudio',_loaded:false,progressBarPieces:[{set_alpha(){}}],
    progressRightText:{set_text(){}},updateProgressLeftText(){},renderDisplayFadeOut(elapsed){return elapsed-this.completeTime;},immediatelyStartGame:start};
  return {preloader,update};
}
test('native loading still waits for assets and the original fade',()=>{
  const {preloader,update}=fixture();update.call(preloader,.4,9);
  assert.equal(preloader._loaded,false);assert.equal(preloader.lastProgress,.4);
  preloader.completeTime=10;preloader.currentState='Complete';update.call(preloader,1,11);
  assert.equal(preloader._loaded,false);
});
test('native preloader hands off automatically without entering the touch splash',()=>{
  const {preloader,update}=fixture();preloader.completeTime=10;preloader.currentState='Complete';
  update.call(preloader,1,13);
  assert.equal(preloader._loaded,true);assert.equal(preloader.currentState,'Complete');assert.equal(preloader.lastProgress,1);
});
