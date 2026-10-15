const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

const engineDirectory=path.join(__dirname,'../fnf-original');
const source=fs.readFileSync(path.join(engineDirectory,'Funkin.js'),'utf8');
const attractStart=source.indexOf('funkin_ui_title_AttractState.prototype =');
const attractEnd=source.indexOf('var funkin_ui_title_TitleState =',attractStart);
assert.ok(attractStart>=0&&attractEnd>attractStart,'compiled AttractState must be present');
const attractSource=source.slice(attractStart,attractEnd);

function assignment(name){
  const match=source.match(new RegExp('^funkin_ui_title_AttractState\\.'+name+' = [^\\n]+;$','m'));
  assert.ok(match,'compiled AttractState.'+name+' assignment must be present');
  return match[0];
}

function nativeMethod(name,context){
  const match=attractSource.match(new RegExp('\\n\\t,'+name+': (function\\([^)]*\\) \\{[\\s\\S]*?\\n\\t\\})'));
  assert.ok(match,'compiled AttractState.'+name+' method must be present');
  return vm.runInContext('('+match[1]+')',context,{timeout:1000});
}

function fixture(extra={}){
  const context=vm.createContext({
    funkin_ui_title_AttractState:{},
    funkin_Paths:{
      // The native videos library resolves to a library-qualified asset path.
      videos(key){return 'videos:assets/videos/videos/'+key+'.mp4';},
      stripLibrary(assetPath){
        const separator=assetPath.indexOf(':');
        return separator<0?assetPath:assetPath.slice(separator+1);
      }
    },
    ...extra
  });
  vm.runInContext(assignment('VIDEO_PATHS')+'\n'+assignment('nextVideoToPlay'),context,{timeout:1000});
  return context;
}

test('native attract rotation keeps selecting the Boyfriend video across repeated visits',()=>{
  const context=fixture(),getVideoPath=nativeMethod('getVideoPath',context);
  for(let visit=0;visit<9;visit++){
    const assetPath=getVideoPath();
    assert.equal(assetPath,'assets/videos/videos/boyfriendEverywhere.mp4','visit '+(visit+1));
    assert.equal(context.funkin_ui_title_AttractState.nextVideoToPlay,0,'rotation must wrap after every visit');
    assert.ok(fs.existsSync(path.join(engineDirectory,assetPath)),'selected video must exist in the shipped assets');
  }
});

test('native attract playback still disposes its video and returns to the title when it finishes',()=>{
  const removed=[],added=[];
  let destroyed=0;
  class Video{
    constructor(assetPath){this.assetPath=assetPath;}
    destroy(){destroyed++;}
  }
  class TitleState{}
  const game={_state:{startOutro(callback){callback();}},_nextState:null};
  const context=fixture({
    funkin_graphics_video_FlxVideo:Video,
    funkin_ui_title_TitleState:TitleState,
    flixel_util_typeLimit_NextState:{fromMaker:factory=>factory()},
    flixel_FlxG:{game},
    $bind:(owner,method)=>method.bind(owner)
  });
  const state={add(video){added.push(video);},remove(video){removed.push(video);}};
  state.onAttractEnd=nativeMethod('onAttractEnd',context);
  const playVideo=nativeMethod('playVideoHTML5',context);
  const assetPath=nativeMethod('getVideoPath',context)();
  playVideo.call(state,assetPath);
  const video=state.vid;
  assert.equal(video.assetPath,'assets/videos/videos/boyfriendEverywhere.mp4');
  assert.equal(added[0],video);
  assert.equal(typeof video.finishCallback,'function');
  video.finishCallback();
  assert.equal(removed[0],video);
  assert.equal(destroyed,1);
  assert.equal(state.vid,null);
  assert.ok(game._nextState instanceof TitleState);
});
