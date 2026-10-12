/* Runs after the original rooms and companion are installed. */
if(window.HomeObjects){
 window.HomeObjectsState=window.HomeObjects.create({storage:window.localStorage,progress:window.HomeProgress,reducedMotion:()=>HouseExperience.reducedMotion});
 window.HomeWorld.objects=window.HomeObjectsState;
}
window.HomeWorld.install({rooms,R,progress:window.HomeProgress});
window.HomeWorld.getFeet=getPlayerHitbox;
