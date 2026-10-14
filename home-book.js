/* The existing book's two passages, read manually with a hinged pixel-paper leaf. */
(function(global){
 'use strict';let mounted=false,current=0,busy=false,timers=[],book,leaf,previous,next,counter;
 const quiet=()=>global.HouseExperience?.reducedMotion===true;
 const clear=()=>{for(const timer of timers)clearTimeout(timer);timers=[];busy=false;leaf?.classList.remove('turn-away','turn-back','turn-in','turn-in-back');};
 function paint(){
  leaf.replaceChildren();const art=document.createElement('canvas');art.width=96;art.height=48;art.className='home-book-art';art.setAttribute('aria-hidden','true');
  const c=art.getContext('2d');c.imageSmoothingEnabled=false;
  const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  r('#714b99',14,4,68,41);r('#c19bee',15,3,66,40);r('#fff0ca',17,5,62,36);r('#bf996e',47,5,1,36);
  r('#94717e',20,9,22,1);r('#94717e',52,9,23,1);r('#d4b38e',20,13,18,1);r('#d4b38e',21,17,20,1);
  r('#79bb83',61,21,1,14);r('#79bb83',57,28,5,2);r('#e4b26d',57,17,9,4);r('#e4b26d',60,14,3,10);
  r('#fff3ac',58,17,6,1);r('#99673d',61,18,1,1);r('#f294b0',24,36,8,2);r('#ffd3df',24,36,2,1);
  r('#82d3e8',21,25,1,4);r('#82d3e8',20,26,3,1);
  leaf.append(art);const p=document.createElement(current?'blockquote':'p');
  p.textContent=current?'«No hace falta conocer el final para guardar el comienzo».':'Algunas páginas están en blanco. Otras conservan una flor seca.';
  leaf.append(p);counter.textContent=(current+1)+' / 2';previous.disabled=current===0||busy;next.disabled=current===1||busy;
 }
 function flip(direction){
  const target=current+direction;if(busy||target<0||target>1)return false;
  global.UndertaleAudio?.effect?.('paper',{volume:.35,ui:true});
  if(quiet()){current=target;paint();return true;}
  busy=true;previous.disabled=next.disabled=true;
  leaf.classList.add(direction>0?'turn-away':'turn-back');
  timers.push(setTimeout(()=>{
   if(book.classList.contains('hidden')){clear();return;}
   current=target;paint();leaf.classList.remove('turn-away','turn-back');leaf.classList.add(direction>0?'turn-in':'turn-in-back');
   timers.push(setTimeout(()=>{clear();paint();},110));
  },110));return true;
 }
 function install(){
  if(mounted)return;book=document.getElementById('interactive-book');const content=book?.querySelector('.book-content'),close=document.getElementById('btn-close-book');
  if(!content||!close)return;mounted=true;book.classList.add('home-book');
  for(const p of [...content.querySelectorAll('p,blockquote')])if(!p.classList.contains('eyebrow'))p.remove();
  leaf=document.createElement('div');leaf.className='home-book-leaf';content.insertBefore(leaf,close);
  const nav=document.createElement('nav');nav.className='home-book-nav';nav.setAttribute('aria-label','Páginas del libro');
  previous=document.createElement('button');previous.type='button';previous.textContent='←';previous.setAttribute('aria-label','Página anterior');
  next=document.createElement('button');next.type='button';next.textContent='→';next.setAttribute('aria-label','Página siguiente');
  counter=document.createElement('span');counter.setAttribute('aria-live','polite');nav.append(previous,counter,next);content.insertBefore(nav,close);
  previous.addEventListener('click',()=>flip(-1));next.addEventListener('click',()=>flip(1));close.addEventListener('click',clear);
  book.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();event.stopPropagation();flip(event.code==='ArrowRight'?1:-1);}if(['Escape','KeyX'].includes(event.code))clear();});
  paint();
 }
 global.HomeBook=Object.freeze({install,open(){install();if(!mounted)return false;clear();current=0;paint();return true;},close:clear,flip});
})(window);
