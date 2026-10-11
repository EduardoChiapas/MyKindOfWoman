package funkin.mods.dateweek;
import funkin.play.GameOverSubState;
import funkin.play.GameOverSubState.GameOverParams;
import funkin.Paths;
import flixel.FlxSprite;
import flixel.FlxG;
import flixel.util.FlxColor;
// Original author's BOOM frames, explosion sound and camera effect.
class DateGameOver extends GameOverSubState {
  var boom:FlxSprite;
  var exploded:Bool=false;
  var shake:Float=0.03;
  public function new(params:GameOverParams){super(params);}
  override public function create():Void{
    super.create();
    boom=new FlxSprite();boom.frames=Paths.getSparrowAtlas("dateweek/boom");
    boom.scrollFactor.set();boom.animation.addByPrefix("boom","Symbol 79",24,false);
    boom.antialiasing=true;boom.visible=false;add(boom);
  }
  override function update(elapsed:Float):Void{
    super.update(elapsed);
    if(!exploded&&boyfriend!=null&&boyfriend.getCurrentAnimation().startsWith('deathLoop')){
      exploded=true;gameOverMusic?.stop();boom.visible=true;boom.animation.play("boom");
      FlxG.sound.play(Paths.sound("dateweek-explosion"));FlxG.camera.fade(FlxColor.WHITE,2,true);
    }
    if(!isEnding&&shake>0){FlxG.camera.shake(shake,3);shake-=0.048*elapsed;}
  }
}
