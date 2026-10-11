/* Small presentation improvements around the supplied HTML's own gameplay. */
(() => {
  const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const enter = element => {
    if (!quiet && element) element.animate([{opacity:.45,translate:'0 4px'},{opacity:1,translate:'0 0'}],{duration:180,easing:'ease-out'});
  };
  for (const name of ['renderMain','renderSubMenu','typeDialog']) {
    const original=window[name];
    window[name]=function(...args){const result=original.apply(this,args);enter(document.getElementById('content-area'));return result;};
  }
  const talk=window.showNPCTalk;
  window.showNPCTalk=function(...args){const result=talk.apply(this,args);enter(document.getElementById('npc-talk'));return result;};
  // Keep the encounter and its timing, replacing six harsh flashes with one fade.
  window.startEncounter=function(){
    gameState='TRANSITION';sndSuspense.pause();excMark.style.display='block';
    sndEncounter.play().catch(()=>{});flash.style.display='block';flash.style.opacity='0';
    if (!quiet) flash.animate([{opacity:0},{opacity:.65,offset:.45},{opacity:0}],{duration:450});
    setTimeout(()=>{
      flash.style.display='none';overworld.style.display='none';bgReveal.style.display='none';bgReveal.pause();
      battleScene.style.display='flex';audioBatallaFondo.play().catch(()=>{});renderMain();enter(battleScene);
    },quiet ? 50 : 450);
  };
  const audios=[sndEncounter,sndSelect,sndConfirm,sndDing,audioBatallaFondo,audioBatalla,...textSoundPool];
  const levels=audios.map(audio=>audio.volume);
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='determination:volume')return;
    hostVolume=Math.max(0,Math.min(1,Number(event.data.volume)||0));
    audios.forEach((audio,index)=>{audio.volume=levels[index]*hostVolume;});
  });
  // Prevent arrow/space scrolling while keeping all the original key handlers.
  window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(event.key))event.preventDefault();});
})();
