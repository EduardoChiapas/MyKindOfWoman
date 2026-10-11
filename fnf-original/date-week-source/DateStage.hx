package funkin.mods.dateweek;
// Adapted from bbpanzu/CW_Date, pinned commit in date-week-provenance.json.
// Original scene coordinates, animation frames, beat events and character cameos.
import flixel.FlxG;
import flixel.FlxSprite;
import flixel.group.FlxSpriteGroup;
import flixel.tweens.FlxTween;
import flixel.tweens.FlxEase;
import flixel.util.FlxColor;
import flixel.graphics.frames.FlxAtlasFrames;
import animate.FlxAnimateFrames;
import funkin.Paths;
import funkin.Conductor;
import funkin.play.PlayState;
import funkin.play.PlayStatePlaylist;
import funkin.play.stage.Stage;
import funkin.play.GameOverSubState;
import funkin.modding.events.ScriptEvent;

class DateStage extends Stage {
  var dateSong:String;
  var defaultCamZoom:Float=1;
  var layer:Int=0;
  var film:FlxSprite;
  var title:FlxSprite;
  var characters_walking:FlxSprite;
  var characters_walking2:FlxSprite;
  var sky_heartbass:FlxSprite;
  var farris_wheel:FlxSprite;
  var farris_seat:FlxSpriteGroup;
  var plane:FlxSprite;
  var backboppers:FlxSprite;
  var frontboppers:FlxSprite;
  var table:FlxSprite;
  var updictionary:FlxSprite;
  var heartsThings:FlxSpriteGroup;
  public var dancing(default,null):Bool=false;
  var bfy:Float=-5.75;
  var gfy:Float=-5;
  var curBeat:Int=0;
  var moveNOWWW:Bool=true;
  var stopSTOPITSTOPITNOW:Int=270;
  var charswhohavewalked:Array<String>=[];
  var charswhohavewalked2:Array<String>=[];
  var introEnds:Float=0;
  var introFinished:Bool=false;
  var playerTurn:Bool=false;
  var storyDifficulty(get,never):Int;
  var isStoryMode(get,never):Bool;
  function get_storyDifficulty():Int{return PlayState.instance.currentDifficulty=='easy'?0:PlayState.instance.currentDifficulty=='hard'?2:1;}
  function get_isStoryMode():Bool{return PlayStatePlaylist.isStoryMode;}
  var chars:Array<String>=["daliaayanna", "sarvruv", "koukapi","selsunday","macybob","tabifunsize","solnik","garcanchor","susyukichi","eddsworld","silly","jadssmokey","cvalkolsan","violetruria","bobbosip","jojo","dionnekaya"];
  var chars2:Array<String>=["hexabigail","mikutricky", "nenedarnell" ,"pompomstatic","lnosans","unified","starlight","weedbud","natecre","kermojordo"];
  public function new(id:String){super(id);dateSong=id.substr(5);}
  function addDate(sprite:FlxSprite):FlxSprite{sprite.zIndex=layer++;return add(sprite);}
  function dateAtlas(path:String):FlxAtlasFrames{
    if(path=='dateweek/characters_walking'){
      return cast FlxAnimateFrames.combineAtlas([Paths.getSparrowAtlas("dateweek/characters_walking-0"),Paths.getSparrowAtlas("dateweek/characters_walking-1")]);
    }
    return Paths.getSparrowAtlas(path);
  }
  override public function onCreate(event:ScriptEvent):Void{
    super.onCreate(event);
    layer=0;dancing=false;introFinished=false;moveNOWWW=true;
    heartsThings=new FlxSpriteGroup();farris_seat=new FlxSpriteGroup();
    updictionary=new FlxSprite(1380,171);film=new FlxSprite();title=new FlxSprite();

					
					defaultCamZoom = 1;
					
						switch (dateSong){
							case  "perfume":
							defaultCamZoom = 1;
								
								var citycolor:FlxSprite = new FlxSprite( -125, -150.75);
								citycolor.loadGraphic(Paths.image("dateweek/citycolor"));
								citycolor.scrollFactor.set(0,0.9);
								citycolor.active = false;
								
								
								var cityfarbg:FlxSprite = new FlxSprite(525, 132.3);
								cityfarbg.loadGraphic(Paths.image("dateweek/cityfarbg"));
								cityfarbg.scrollFactor.set(0.2,0.4);
								cityfarbg.active = false;
								cityfarbg.antialiasing = true;
								
								
								var citybg:FlxSprite = new FlxSprite( -182.8, -77.75);
								citybg.loadGraphic(Paths.image("dateweek/citybg"));
								citybg.scrollFactor.set(0.4,0.4);
								citybg.active = false;
								citybg.antialiasing = true;
								
								
								characters_walking2 = new FlxSprite( 22.15, 60.05);
								characters_walking2.frames = dateAtlas("dateweek/characters_walking2");
								characters_walking2.scrollFactor.set(0.85,0.85);
								characters_walking2.active = true;
								characters_walking2.antialiasing = true;
								
								for(i in 0...chars2.length){
									characters_walking2.animation.addByIndices(chars2[i], "characters_walking_bg", [0+i*12, 1+i*12, 2+i*12, 3+i*12, 4+i*12, 5+i*12, 6+i*12, 7+i*12, 8+i*12, 9+i*12, 10+i*12, 11+i*12], "", 24, true);
								}
								
								
								characters_walking2.animation.play(chars2[FlxG.random.int(0,chars2.length-1)]);
								initBGChars();
								
								var blackshit:FlxSprite = new FlxSprite(0, -1174.35).makeGraphic(1280,400,FlxColor.BLACK);
								blackshit.active = false;
								blackshit.scrollFactor.set(0,1);
								
								var wallbg:FlxSprite = new FlxSprite(-208.05,-774.35).loadGraphic(Paths.image("dateweek/wallbg"));
								wallbg.active = false;
								wallbg.antialiasing = true;
								addDate(citycolor);
								addDate(cityfarbg);
								addDate(citybg);
								if(true)addDate(characters_walking2);
								if(true)addDate(characters_walking);
								addDate(heartsThings);
								addDate(wallbg);
							
							case "whitroll":
								defaultCamZoom = 1;
								var sky_bg:FlxSprite = new FlxSprite(-21,-236);
								sky_bg.loadGraphic(Paths.image("dateweek/sky_bg"));
								sky_bg.scrollFactor.set(0.1,0.1);
								sky_bg.active = false;
								
								var skyscrapers:FlxSprite = new FlxSprite(-122,68);
								skyscrapers.loadGraphic(Paths.image("dateweek/skyscrapers"));
								skyscrapers.scrollFactor.set(0.3,0.3);
								skyscrapers.active = false;
								
								var balc:FlxSprite = new FlxSprite(-248,305);
								balc.loadGraphic(Paths.image("dateweek/balc"));
								balc.scrollFactor.set(0.9,0.9);
								balc.active = false;
								
								addDate(sky_bg);
								addDate(skyscrapers);
								addDate(heartsThings);
								addDate(balc);
							
							case "heartbass":
								defaultCamZoom = 1.4;
								updictionary.frames = dateAtlas("dateweek/updicksucker");
								updictionary.animation.addByPrefix("updiploma", "updimitri", 24, false);
								updictionary.scrollFactor.set(0.8, 0.8);
								updictionary.antialiasing = true;
								sky_heartbass = new FlxSprite(-12,-10);
								sky_heartbass.frames = dateAtlas("dateweek/sky_heartbass");
								sky_heartbass.animation.addByPrefix("boom", "sky_heartbass", 24, false );
								sky_heartbass.animation.play("boom");
								sky_heartbass.antialiasing = true;
								sky_heartbass.scrollFactor.set(0.1,0.1);
								
								var bg_hb:FlxSprite = new FlxSprite(-185.5,220);
								bg_hb.loadGraphic(Paths.image("dateweek/bg_hb"));
								bg_hb.scrollFactor.set(0.2, 0.2);
								bg_hb.active = false;
								bg_hb.antialiasing = true;
								
								plane = new FlxSprite(1600,96.3);
								plane.loadGraphic(Paths.image("dateweek/plane"));
								plane.scrollFactor.set(0.2, 0.2);
								plane.active = false;
								plane.antialiasing = true;
								
								var midg:FlxSprite = new FlxSprite(-20.5,120.1);
								midg.loadGraphic(Paths.image("dateweek/midg"));
								midg.scrollFactor.set(0.5,0.5);
								midg.active = false;
								midg.antialiasing = true;
								
								farris_wheel = new FlxSprite(6.75,-66.4);
								farris_wheel.frames = dateAtlas("dateweek/farris_wheel");
								farris_wheel.animation.addByIndices("thing1", "farris_wheel",[0],"", 0, false );
								farris_wheel.animation.addByIndices("thing2", "farris_wheel",[1],"", 0, false );
								farris_wheel.animation.addByIndices("thing3", "farris_wheel",[2],"", 0, false );
								farris_wheel.animation.addByIndices("thing4", "farris_wheel",[3],"", 0, false );
								farris_wheel.animation.play("thing1");
								farris_wheel.antialiasing = true;
								farris_wheel.scrollFactor.set(0.6, 0.6);
								
									farris_seat.scrollFactor.set(0.6, 0.6);
								for (i in 0...24){
									var fs = new FlxSprite(225.85,371.1);
									fs.loadGraphic(Paths.image("dateweek/farris_seat"));
									fs.active = false;
									fs.antialiasing = true;
									farris_seat.add(fs);
								}
								var fair_gate:FlxSprite = new FlxSprite(-335.3,-444.8);
								fair_gate.loadGraphic(Paths.image("dateweek/fair_gate"));
								fair_gate.scrollFactor.set(0.95, 0.95);
								fair_gate.antialiasing = true;
								
								var chairs:FlxSprite = new FlxSprite(286.25, 351.15);
								var l = "";
								if (storyDifficulty == 0) l = " copy";
								chairs.loadGraphic(Paths.image("dateweek/chairs"+l));
								chairs.antialiasing = true;
								
								backboppers = new FlxSprite( 41.45, -169.45);
								backboppers.loadGraphic(Paths.image("dateweek/backboppers"));
								backboppers.scrollFactor.set(0.9, 0.9);
								backboppers.antialiasing = true;
								
								frontboppers = new FlxSprite( -54.65, -59.55);
								frontboppers.loadGraphic(Paths.image("dateweek/frontboppers"));
								frontboppers.scrollFactor.set(0.93, 0.93);
								frontboppers.antialiasing = true;
								
								
								table = new FlxSprite(409,475.25);
								table.loadGraphic(Paths.image("dateweek/table"));
								table.active = false;
								table.visible = false;
								table.antialiasing = true;
								
								
								initBGChars();
								
								
								
								addDate(sky_heartbass);
								addDate(bg_hb);
								addDate(midg);
								addDate(plane);
								addDate(farris_wheel);
								addDate(farris_seat);
								addDate(updictionary);
								
								if(true)addDate(characters_walking);
								characters_walking.y = -10;
								
								
								addDate(backboppers);
								addDate(frontboppers);
								
								addDate(heartsThings);
								addDate(fair_gate);
								addDate(chairs);
								addDate(table);
								
								
								backboppers.y = frontboppers.y = 624;
								backboppers.visible = false;
								frontboppers.y = frontboppers.y = 624;
								frontboppers.visible = false;
							
						}
						
								film.frames = dateAtlas("dateweek/film");
								film.animation.addByPrefix("idle", "film", 24);
								film.antialiasing = true;
								film.screenCenter();
								film.animation.play("idle");
								film.scrollFactor.set();
								title.frames = dateAtlas("dateweek/title");
								title.animation.addByIndices("whitroll", "title", [0,1],"", 12);
								title.animation.addByIndices("perfume", "title", [2,3],"", 12);
								title.animation.addByIndices("heartbass", "title", [4,5],"", 12);
								title.antialiasing = true;
								title.screenCenter();
								title.animation.play(dateSong);
								title.scrollFactor.set();
								if (!isStoryMode){
									film.alpha = 0;
									title.alpha = 0;
								}
								addDate(film);
								addDate(title);
				
    layer=501;
var shade:FlxSprite = new FlxSprite(-451.05,-560.15).loadGraphic(Paths.image("dateweek/shade"));
					shade.scrollFactor.set();
					shade.active = false;
					shade.blend = "multiply";
					
					
					var light:FlxSprite = new FlxSprite(155.05,-282.9).loadGraphic(Paths.image("dateweek/light"));
					light.active = false;
					light.antialiasing = true;
					light.blend = "add";
					light.alpha = 0.53;
					
					
					var deco:FlxSprite = new FlxSprite(-176.95,-28).loadGraphic(Paths.image("dateweek/deco"));
					deco.scrollFactor.set(1.5,1.5);
					deco.active = false;
					deco.antialiasing = true;
					
					addDate(shade);
					addDate(light);
					addDate(deco);
    // The film/title were screen overlays in the author's original PlayState.
    remove(film);remove(title);
    film.zIndex=10000;title.zIndex=10001;
    film.cameras=[PlayState.instance.camHUD];title.cameras=film.cameras;
    PlayState.instance.add(film);PlayState.instance.add(title);
    refresh();
  }
  public function initBGChars():Void{
		
								characters_walking = new FlxSprite( 820, -60);
								characters_walking.frames = dateAtlas("dateweek/characters_walking");
								characters_walking.scrollFactor.set(0.9,0.9);
								characters_walking.active = true;
								characters_walking.antialiasing = true;
								
								
								for(i in 0...chars.length){
									characters_walking.animation.addByIndices(chars[i], "characters_walking", [0+i*12, 1+i*12, 2+i*12, 3+i*12, 4+i*12, 5+i*12, 6+i*12, 7+i*12, 8+i*12, 9+i*12, 10+i*12, 11+i*12], "", 24, true);
								}
								characters_walking.animation.addByIndices("dionnekaya", "characters_walking", [192,193,194,195,196,197,198,199,200,201,202,203], "", 24, true);
								
								characters_walking.animation.play(chars[FlxG.random.int(0, chars.length-1)]);
								
	}
  override public function onCountdownStart(event:CountdownScriptEvent):Void{
    event.cancel();
    var state=PlayState.instance;
    var bf=getBoyfriend();var dad=getDad();
    bf.setPosition(409,-5.75);bf.originalPosition.set(bf.x,bf.y);bf.resetCameraFocusPoint();
    dad.setPosition(84.05,-5);dad.originalPosition.set(dad.x,dad.y);dad.resetCameraFocusPoint();
    // Reuse the author's animated health icons and original explosion frames.
    var icons=[state.iconP1,state.iconP2];
    for(i in 0...icons.length){
      var icon=icons[i];var first=i==0?5:0;
      icon.frames=Paths.getSparrowAtlas('dateweek/cw_icon');icon.flipX=false;
      icon.animation.addByIndices('idle','cw_icon',[first],'',0,false);
      var boomFrames=[first+1,first+2,first+3,first+4];
      for(j in 0...37)boomFrames.push(first+4);
      icon.animation.addByIndices('winning','cw_icon',boomFrames,'',12,false);
      icon.animation.addByIndices('losing','cw_icon',boomFrames,'',12,false);
      icon.animation.play('idle',true);icon.snapToTargetSize();
    }
    GameOverSubState.musicSuffix='-dateweek';
    defaultCamZoom=dateSong=='heartbass'?1.4:1;state.currentCameraZoom=defaultCamZoom;
    film.alpha=title.alpha=isStoryMode?1:0;
    introEnds=isStoryMode?Conductor.instance.beatLengthMs*5-500:0;
    introFinished=!isStoryMode;
    state.isInCutscene=false;state.isInCountdown=true;state.camHUD.visible=true;
    Conductor.instance.update(state.startTimestamp-(isStoryMode?500:0));
    if(isStoryMode){state.cameraFollowPoint.setPosition(dad.getMidpoint().x+100,-900);state.camGame.focusOn(state.cameraFollowPoint.getPosition());}
    else{state.cameraFollowPoint.setPosition(dad.cameraFocusPoint.x,dad.cameraFocusPoint.y);state.camGame.focusOn(state.cameraFollowPoint.getPosition());}
  }
  override public function onStepHit(event:SongTimeScriptEvent):Void{
    curBeat=event.beat;
    if(curBeat<0)return;
switch(dateSong){
				case "perfume":
					
					
					if (curBeat > 135){
						getBoyfriend().idleSuffix = "-alt";
						if(true)heartsThings.add(new HeartThingy(FlxG.random.int(0, 1280),500,FlxG.random.float(0.8, 1.2)));
					}
				case "whitroll":
						
					if (curBeat > 135){
						getBoyfriend().idleSuffix = "-alt";
						if(true)heartsThings.add(new HeartThingy(FlxG.random.int(0, 1280),700,FlxG.random.float(1.3, 1.5)));
					}
				case "heartbass":
					if (curBeat > 200 && curBeat < 205 || curBeat > 232 && curBeat < 235 || curBeat > 360 && curBeat < 420 ){
						
						if (!dancing)getBoyfriend().idleSuffix = "-alt";
						if(true && curBeat < 360)heartsThings.add(new HeartThingy(FlxG.random.int(0, 1280),650,FlxG.random.float(1.8,2.4)));
					}
					
			}
  }
  override public function onSongEvent(event:funkin.modding.events.ScriptEvent.SongEventScriptEvent):Void{
    if(event.eventData.eventKind=='FocusCamera')playerTurn=event.eventData.getInt('char')==0;
  }
  override public function onBeatHit(event:SongTimeScriptEvent):Void{
    curBeat=event.beat;
    if(curBeat<0)return;
if (dateSong == "heartbass"){
			if(true)sky_heartbass.animation.play("boom", true);
			if(true)farris_wheel.animation.play("thing" + FlxG.random.int(1, 4));
			if (curBeat == 302){
				if (true){
					updictionary.x = 1280;
					updictionary.animation.play("updiploma");
					FlxTween.tween(updictionary, {x: -80}, 12); 
					
					FlxTween.tween(this, {defaultCamZoom:1}, 6);
				}
			}
		}
if (dateSong == 'heartbass')
		{
			if(curBeat >= 9 && curBeat < 437 && true){
				
				PlayState.instance.camGame.zoom += 0.03;
				PlayState.instance.camHUD.zoom += 0.05;
			}
			
			dancing = curBeat >= 360;
				
			if (curBeat == 359){
				frontboppers.visible = true;
				backboppers.visible = true;
				if (true) defaultCamZoom += 0.2;
				if(true)FlxTween.tween(backboppers, {y:-149.45}, 0.3, {ease:FlxEase.quartIn});
				if(true)FlxTween.tween(frontboppers, {y:-39.55}, 0.3, {ease:FlxEase.quartIn});
			}
			if (dancing){
				
				table.visible = true;
				if (true){
				getBoyfriend().y += 20;
				getDad().y += 20;
				backboppers.y += 30;
				frontboppers.y += 30;
				
					defaultCamZoom = 0.9;
					FlxTween.tween(getBoyfriend(), {y:bfy}, (Conductor.instance.stepLengthMs * 3 / 1000), {ease:FlxEase.circInOut});
					FlxTween.tween(getDad(), {y:gfy}, (Conductor.instance.stepLengthMs * 3 / 1000), {ease:FlxEase.circInOut});
					FlxTween.tween(backboppers, {y:-149.45}, (Conductor.instance.stepLengthMs * 3 / 1000), {ease:FlxEase.circOut});
					FlxTween.tween(frontboppers, {y: -39.55}, (Conductor.instance.stepLengthMs * 3 / 1000), {ease:FlxEase.quartInOut});
					heartsThings.add(new HeartThingy(FlxG.random.int(0, 1280), 650, FlxG.random.float(1.8, 2.4)));
				}
			}else{
				bfy = getBoyfriend().y;
				gfy = getDad().y;
			}
			
		}
		
    if(dancing){getBoyfriend().danceEvery=0;getDad().danceEvery=0;}
    PlayState.instance.currentCameraZoom=defaultCamZoom;
  }
  override public function onUpdate(event:UpdateScriptEvent):Void{
    curBeat=Std.int(Conductor.instance.currentBeat);
    if(getBoyfriend()==null||getDad()==null)return;
if ((dateSong == "perfume" || dateSong == "heartbass") && true && characters_walking.animation != null && characters_walking.animation.curAnim != null){
					
					if (characters_walking.animation.curAnim.name == "selsunday" || characters_walking.animation.curAnim.name == "jojo" ){
						if(moveNOWWW)characters_walking.x += 8 * event.elapsed * 60;
						if (characters_walking.x > 1434.4){
							if (characters_walking.animation.curAnim.name == characters_walking.animation.curAnim.name && charswhohavewalked.contains(characters_walking.animation.curAnim.name)){
								characters_walking.animation.play(chars[FlxG.random.int(0, chars.length - 1)]);
								if (curBeat > stopSTOPITSTOPITNOW) moveNOWWW = false;
							
								}else{
									charswhohavewalked.push(characters_walking.animation.curAnim.name);
								}
						}
					}else if(chars.lastIndexOf(characters_walking.animation.curAnim.name) % 2 == 0){
						if(moveNOWWW)characters_walking.x -= 2 * event.elapsed * 60;
						if (characters_walking.x < -900){
							if (characters_walking.animation.curAnim.name == characters_walking.animation.curAnim.name  && charswhohavewalked.contains(characters_walking.animation.curAnim.name)){
								characters_walking.animation.play(chars[FlxG.random.int(0, chars.length - 1)]);
								if (curBeat > stopSTOPITSTOPITNOW) moveNOWWW = false;
							
								}else{
									if(!charswhohavewalked.contains(characters_walking.animation.curAnim.name))charswhohavewalked.push(characters_walking.animation.curAnim.name);
								}
						}
					}else {
						if(moveNOWWW)characters_walking.x += 2 * event.elapsed * 60;
						if (characters_walking.x > 1434.4){
							if (characters_walking.animation.curAnim.name == characters_walking.animation.curAnim.name  && charswhohavewalked.contains(characters_walking.animation.curAnim.name)){
								characters_walking.animation.play(chars[FlxG.random.int(0, chars.length-1)]);
								if (curBeat > stopSTOPITSTOPITNOW) moveNOWWW = false;
								
								}else{
									if(!charswhohavewalked.contains(characters_walking.animation.curAnim.name))charswhohavewalked.push(characters_walking.animation.curAnim.name);
								}
						}
					}
					
					
					if(dateSong == "perfume"){
						if(chars2.lastIndexOf(characters_walking2.animation.curAnim.name) % 2 == 0){
							characters_walking2.x -= 2.1 * event.elapsed * 60;
							if (characters_walking2.x < -1000 && characters_walking2.animation != null && characters_walking2.animation.curAnim != null){
								if (characters_walking2.animation.curAnim.name == characters_walking2.animation.curAnim.name && charswhohavewalked2.contains(characters_walking2.animation.curAnim.name)){
									characters_walking2.animation.play(chars2[FlxG.random.int(0, chars2.length-1)]);
									
								}else{
									if(!charswhohavewalked2.contains(characters_walking2.animation.curAnim.name))charswhohavewalked2.push(characters_walking2.animation.curAnim.name);
								}
							}
						}else{
							characters_walking2.x += 2.1 * event.elapsed * 60;
							if (characters_walking2.x > 1634.4 && characters_walking2.animation != null && characters_walking2.animation.curAnim != null){
								if (characters_walking2.animation.curAnim.name == characters_walking2.animation.curAnim.name && charswhohavewalked2.contains(characters_walking2.animation.curAnim.name)){
									
									characters_walking2.animation.play(chars2[FlxG.random.int(0, chars2.length-1)]);
									
								}else{
									if(!charswhohavewalked2.contains(characters_walking2.animation.curAnim.name))charswhohavewalked2.push(characters_walking2.animation.curAnim.name);
								}
							}
						}
					}
				}
				
				if (charswhohavewalked.length >= chars.length) charswhohavewalked = [];
				if (charswhohavewalked2.length >= chars2.length) charswhohavewalked2 = [];
				if (dateSong == "heartbass" && farris_wheel != null){
					if(true)farris_wheel.angle += 15 * event.elapsed;
					plane.x -= 60 * event.elapsed;
					for (i in 0...24){
						var fss = farris_seat.members[i];
						var _angle = (farris_wheel.angle + (i/24)*360) * (Math.PI/180); 
						var rotatedX = Math.cos(_angle) * (350 - 227) - Math.sin(_angle) * (350-153.85) + 227;
						var rotatedY = Math.sin(_angle) * (350 - 227) + Math.cos(_angle) * (350 - 153.85) + 153.85;
					
						fss.setPosition(rotatedX-15, rotatedY);
					}
					if (plane.x < -610) plane.x = 1800;
				}
    PlayState.instance.currentCameraZoom=defaultCamZoom;
    if(!introFinished&&Conductor.instance.songPosition>=introEnds){
      introFinished=true;film.animation.stop();film.active=false;title.active=false;
      var duration=Conductor.instance.beatLengthMs/1000;
      FlxTween.tween(film,{alpha:0},duration,{ease:FlxEase.cubeInOut});
      FlxTween.tween(title,{alpha:0},duration,{ease:FlxEase.cubeInOut});
    }
    if(!introFinished){PlayState.instance.cameraFollowPoint.y=-900;}
    else if(dancing){PlayState.instance.cameraFollowPoint.y=getBoyfriend().getMidpoint().y-200;}
    else if(dateSong!='heartbass'&&!dancing&&playerTurn){PlayState.instance.cameraFollowPoint.x=640;}
  }
  override public function onDestroy(event:ScriptEvent):Void{
    FlxTween.cancelTweensOf(this);FlxTween.cancelTweensOf(film);FlxTween.cancelTweensOf(title);
    PlayState.instance?.remove(film);PlayState.instance?.remove(title);
    film?.destroy();title?.destroy();super.onDestroy(event);
  }
}
