package funkin.mods.dateweek;
import funkin.ui.MusicBeatState;
import funkin.Paths;
import flixel.*;
/**
 * ...
 * @author bbpanzu
 */
class DateEnding extends MusicBeatState
{

	public function new() 
	{
		super();
		bgColor = 0xFF4D1B30;
	}
	
	override function create() 
	{
		super.create();
		
		
		FlxG.sound.playMusic(Paths.music("dateweek-ending"));
		
		var bg:FlxSprite = new FlxSprite().loadGraphic(Paths.image("dateweek/ending"));
		add(bg);
		
	}
	
	
	override function update(elapsed:Float) 
	{
		super.update(elapsed);
		
		if (controls.ACCEPT){
			FlxG.switchState(() -> new funkin.ui.story.StoryMenuState(null));
		}
		
	}
	
	
	
}