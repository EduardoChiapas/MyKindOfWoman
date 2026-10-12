/* Editable native-pixel furniture for the HOME wing. No filters or bitmap resampling. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HomePixelArt=factory();
})(typeof window==='object'?window:this,function(){
  'use strict';
  const C={ink:'#594632',wood:'#b28252',light:'#e8c18a',dark:'#836039',paper:'#f6e6b9',
    purple:'#9b85aa',plum:'#71607d',pale:'#d9c4dc',green:'#77955a',leaf:'#a1bb72',
    water:'#8bb7c1',blue:'#c6dde0',gold:'#dec669',rose:'#cc9098'};
  function draw(ctx,p,state={}){
    const {x,y,width:w,height:h}=p,{phase=0,pulse=0}=state;
    const sway=Math.round(pulse*2),t=Math.round(phase*7);
    const r=(color,a,b,c,d)=>{ctx.fillStyle=C[color]||color;ctx.fillRect(Math.round(x+a),Math.round(y+b),c,d);};
    const panel=(a,b,c,d,color='wood')=>{r('ink',a,b,c,d);r(color,a+1,b+1,c-2,d-2);r('light',a+2,b+2,c-4,1);};
    const star=(a,b,color='gold')=>{r(color,a+2,b,1,5);r(color,a,b+2,5,1);};
    const leaf=(a,b)=>{r('green',a,b,7,3);r('leaf',a+1,b,4,1);};
    switch(p.kind){
    case 'map':
      panel(0,0,w,h,'dark');r('paper',3,3,w-6,h-6);
      r('dark',7,9,12,9);r('dark',23,9,16,9);r('dark',12,22,24,2);r('dark',23,18,2,7);
      r('rose',13,12,3,3);star(29,12,'green');
      if(phase>0){r('light',3,3,w-6,t*3);r('dark',3,3+t*3,w-6,2);}break;
    case 'clock':
      panel(0,0,w,h,'dark');r('gold',3,3,w-6,13);r('paper',5,4,w-10,10);
      r('ink',Math.floor(w/2),6,1,5);r('ink',Math.floor(w/2),10,4,1);
      r('ink',4,19,w-8,h-22);r('light',Math.floor(w/2)+sway,19,1,h-26);
      r('gold',Math.floor(w/2)-2+sway,h-9,5,5);break;
    case 'hooks':
      panel(0,0,w,6);for(const a of [5,15,25]){r('ink',a,5,2,5);r('gold',a,9,4,2);}
      r('plum',12,10,8,23-t);r('purple',13,11,6,20-t);r('pale',13,24-t,6,2);
      for(let a=13;a<19;a+=2)r('pale',a,29-t,1,3);break;
    case 'mailbox':
      panel(0,10,w,h-13,'dark');panel(2,8,w-4,6);r('ink',5,16,w-10,2);
      r('gold',w-8,19,3,2);if(phase>0){r('paper',6,14-t,w-12,t+7);r('rose',10,16-t,w-20,1);}
      r('dark',5,h-3,3,3);r('dark',w-8,h-3,3,3);break;
    case 'umbrella':
      r('ink',12,4,2,h-3);r('wood',13,5,1,h-5);r('ink',9,h-2,5,2);
      if(phase>.2){r('plum',3,8,w-6,7);r('purple',5,5,w-10,6);r('pale',9,4,w-18,3);r('ink',2,15,w-4,1);}
      else{r('plum',10,8,6,h-15);r('purple',11,9,3,h-17);}
      panel(6,h-9,w-12,9,'dark');break;
    case 'bath':
      r('ink',0,19,w,28);r('ink',2,47,w-4,3);r('paper',1,20,w-2,25);r('paper',3,45,w-6,3);r('blue',4,22,w-8,10);
      r('water',5,29,w-10,2);r('light',2,36,w-4,1);r('dark',5,50,5,10);r('dark',w-10,50,5,10);
      r('ink',w-13,5,3,19);r('light',w-16,4,6,2);r('light',w-16,5,2,4);
      r('gold',18+sway,24-sway,9,4);r('gold',23+sway,21-sway,4,4);r('ink',25+sway,22-sway,1,1);r('rose',27+sway,24-sway,2,1);break;
    case 'sink':
      panel(4,0,w-8,31,'dark');r('water',7,3,w-14,25);r('blue',9,5,2,21);
      r('paper',0,39,w,9);r('ink',2,47,w-4,2);r('dark',6,49,w-12,h-49);
      r('light',7,50,w-14,2);r('ink',17,31,3,10);r('paper',18,32,4,2);
      r('rose',7,36,3,2);r('water',w-10,36,3,2);
      if(phase>.05){r('water',21,34,1,Math.round(phase*10));r('blue',17,44,9,1);r('blue',15,43,2,1);}break;
    case 'toilet':
      panel(5,0,w-10,18,'paper');r('gold',w-9,5,3,2);
      r('ink',5,19,w-10,3);r('ink',2,22,w-4,9);r('ink',5,31,w-10,3);
      r('paper',5,20,w-10,12);r('paper',3,23,w-6,7);r('ink',7,23,w-14,6);
      if(phase<.6){r('paper',7,19-t,w-14,11);r('paper',4,22-t,w-8,5);r('blue',7,29-t,w-14,1);}
      r('paper',9,34,w-18,h-35);r('ink',7,h-3,w-14,3);break;
    case 'towel':
      r('ink',0,2,w,2);r('gold',0,0,2,5);r('gold',w-2,0,2,5);
      r('paper',5,3,w-10,h-3-t);r('green',6,h-7-t,w-12,2);r('light',7,4,1,h-12-t);break;
    case 'soap':
      panel(0,h-13,w,13,'rose');r('paper',4,h-8,w-8,3);r('ink',7,h-17,2,5);r('paper',5,h-18,9,2);
      if(pulse>0){r('blue',2-sway,2-sway,3,3);r('paper',3-sway,2-sway,1,1);r('blue',12+sway,6-sway,2,2);}break;
    case 'bookcase':
      panel(0,0,w,h,'dark');for(const b of [5,24,43]){
        r('ink',3,b,w-6,15);let a=5;for(const color of ['purple','green','rose','light','paper','plum']){
          r(color,a,b+3,6,11);r('ink',a+6,b+4,1,10);r('paper',a+1,b+5,4,1);a+=8;}
        r('light',2,b+16,w-4,2);
      }
      if(phase>.2){r('paper',10,44,17,10);r('dark',18,45,1,8);r('rose',12,47,4,1);r('green',21,48,4,1);}break;
    case 'blindWindow':
      panel(0,0,w,h,'dark');r('green',3,3,w-6,h-6);r('leaf',5,8,w-10,6);r('gold',8,6,4,3);
      r('paper',Math.floor(w/2),2,2,h-4);r('paper',2,h-7,w-4,2);
      r('light',2,2,w-4,4+t*3);for(let b=6;b<6+t*3;b+=3)r('dark',3,b,w-6,1);
      r('ink',w-6,8,1,h-12);r('gold',w-7,h-7,3,3);break;
    case 'chaise':
      r('ink',0,12,w,25);r('plum',1,13,w-2,23);r('purple',5,9,w-10,19-sway);
      r('pale',6,10,w-12,2);r('ink',w-20,2,20,28);r('purple',w-19,3,18,24);
      r('pale',w-17,5,14,2);r('light',9,18-sway,17,11);r('gold',10,20-sway,15,1);
      r('ink',5,37,4,8);r('ink',w-9,37,4,8);r('dark',5,44,4,2);r('dark',w-9,44,4,2);break;
    case 'beanbag':
      r('ink',13,10,w-26,4);r('ink',7,14,w-14,h-18);r('ink',3,22,w-6,h-29);
      r('purple',14,11,w-28,4);
      r('plum',8,15,w-16,h-20);r('purple',5,23,w-10,h-31);r('purple',12,15,w-24,16);
      r('pale',15,17+sway,w-30,2);r('ink',12,h-10,w-24,1);r('purple',10,h-8,w-20,3);break;
    case 'gameTable':
      panel(0,3,w,19,'dark');r('plum',3,6,w-6,13);r('ink',5,22,4,h-22);r('ink',w-9,22,4,h-22);
      for(let a=10;a<w-9;a+=13){r('paper',a,8-sway,8,9);star(a+2,10-sway,a%2?'rose':'purple');}
      r('light',1,21,w-2,2);break;
    case 'recordPlayer':
      panel(4,0,w-8,27,'dark');r('ink',7,5,w-14,17);r('plum',10,7,15,12);r('gold',16,11,3,3);
      r('paper',w-12,7,1,11);r('paper',w-16,17,5,1);r('rose',8,23,3,1);
      panel(1,28,w-2,8);r('dark',5,36,3,h-36);r('dark',w-8,36,3,h-36);
      if(phase>.2){const angle=state.motion?state.time/250:0;
        r('green',8,23,3,1);r('paper',17+Math.cos(angle)*5,12+Math.sin(angle)*3,1,1);star(w-5,-5,'plum');}break;
    case 'origami':
      r('plum',1,h-5,w-2,2);
      if(phase>.3){
        r('dark',6,10,14,6);r('#f4eee0',7,11,12,4);
        for(let a=0;a<4;a++){r('dark',2+a*2,3+a*2,10-a*2,3);r('#f4eee0',3+a*2,4+a*2,8-a*2,1);}
        r('dark',w-7,4,3,10);r('#f4eee0',w-6,5,1,8);
        r('dark',w-7,1,5,4);r('#f4eee0',w-6,2,3,2);r('rose',w-2,2,2,1);
        r('blue',9,13,7,1);}
      else{r('dark',1,6,w-2,9);r('#f4eee0',2,7,w-4,7);r('rose',w/2|0,7,1,6);}break;
    case 'glass':
      panel(0,0,w,h,'dark');r('paper',3,3,w-6,h-6);
      for(let a=5;a<w-6;a+=13){r(a%2?'purple':'green',a,6,11,h-13);r('gold',a+3,9,4,5);r('ink',a+11,4,1,h-8);}
      r('paper',4,h-9,w-8,1);if(pulse>0)r('paper',5+sway,5,2,h-11);break;
    case 'bootrack':
      panel(0,h-11,w,8);r('dark',3,h-3,3,3);r('dark',w-6,h-3,3,3);
      for(const a of [3,20]){r('plum',a,6,9,h-18);r('purple',a+1,7,7,h-21);r('plum',a, h-16,13,5);r('paper',a+2,7,5,2);}
      if(phase>.4){r('paper',5,14,5,2);r('paper',22,14,5,2);}else{r('dark',4,h-16,2,2);r('dark',23,h-18,2,2);}break;
    case 'windchime':
      r('ink',w/2|0,0,1,7);r('dark',4,7,w-8,2);for(let a=7;a<w-5;a+=8){
        r('ink',a,9,1,9+(a%3));r('gold',a+sway,18+(a%3),3,9-(a%3));r('paper',a+sway,18+(a%3),1,5);
      }r('plum',(w/2|0)-2+sway,h-4,5,3);break;
    case 'pottingBench':
      panel(0,23,w,10);r('dark',3,33,5,h-33);r('dark',w-8,33,5,h-33);r('wood',5,h-9,w-10,5);
      panel(5,8,18,14,'dark');r('green',10,4,6,6);leaf(6,2);leaf(15,1);
      r('paper',30,17,17,5);r('gold',32,18,3,3);r('dark',55,2,2,22);r('ink',52,1,8,6);
      r('paper',12,h-12,15,4);r('rose',14,h-11,4,2);if(pulse>0)r('light',28,12-sway,5,2);break;
    case 'flowerbed':{
      panel(0,h-15,w,15,'dark');r('#70533a',2,h-13,w-4,8);
      for(const a of [7,16,25]){r('green',a,h-23-Math.round(phase*6),1,14+Math.round(phase*6));leaf(a-5,h-20);}
      const by=h-27-Math.round(phase*7);r('gold',12,by,9,5);r('gold',14,by-2,5,9);r('dark',16,by+1,1,1);
      if(phase>.2){r('rose',3,by+5,7,3);r('rose',5,by+3,3,7);r('paper',6,by+5,1,1);r('water',4,h-6,w-8,1);}
      if(pulse>.05){r('blue',6,by-4-sway,1,3);r('blue',24,by-2-sway,1,3);}break;}
    case 'trellis':
      for(const a of [3,16,29,42])r('dark',a,0,2,h);for(const b of [5,20,35,50])r('light',0,b,w,2);
      for(const [a,b]of [[3,9],[15,19],[29,31],[40,43]]){r('green',a+sway,b,1,16);leaf(a-3+sway,b);leaf(a+sway,b+9);}
      r('rose',14+sway,17,5,4);r('paper',16+sway,18,1,1);break;
    case 'birdbath':
      r('ink',0,6,w,8);r('paper',1,7,w-2,5);r('water',4,7,w-8,2);r('paper',w/2-3|0,14,6,h-17);
      r('ink',5,h-3,w-10,3);r('paper',6,h-2,w-12,1);
      r('plum',w-9,1-sway,6,4);r('paper',w-8,2-sway,1,1);r('gold',w-4,3-sway,3,1);
      if(pulse>0)r('blue',7-sway,9,w-14+sway*2,1);break;
    case 'wateringCan':
      panel(7,4,w-14,h-4,'green');r('leaf',8,5,w-16,2);r('ink',w-7,5,6,h-8);r('paper',w-5,7,2,h-12);
      r('green',1,7,8,3);r('green',0,5,3,4);r('water',1,1-sway,1,2);r('water',4,2-sway,1,2);break;
    case 'gardenBench':
      r('ink',2,0,w-4,18);r('wood',3,1,w-6,16);for(const b of [4,10])r('light',4,b,w-8,1);
      panel(0,17,w,7);r('ink',5,24,4,h-24);r('ink',w-9,24,4,h-24);r('green',7,18+sway,15,3);break;
    case 'frog':
      r('ink',5,8-sway,w-10,11);r('ink',2,16-sway,w-4,6);r('#a1bb72',6,9-sway,w-12,9);r('#a1bb72',3,17-sway,w-6,3);
      for(const a of [5,w-10]){r('green',a,5-sway,5,5);r('paper',a+1,6-sway,3,3);r('ink',a+2,7-sway,1,1);}
      r('gold',w-4,15-sway,4,2);r('ink',w-2,12-sway,1,7);r('ink',8,15-sway,w-16,1);break;
    case 'hammock':
      r('dark',1,3,3,h-3);r('dark',w-4,3,3,h-3);r('light',2,5,w-4,1);
      r('plum',4,16+sway,w-8,17);r('purple',6,19+sway,w-12,17);r('pale',8,20+sway,w-16,4);
      r('paper',9,19+sway,11,8);r('plum',11,37+sway,w-22,2);break;
    case 'desk':
      panel(0,9,w,15,'dark');r('dark',4,24,4,h-24);r('dark',w-8,24,4,h-24);
      r('paper',8,13,w-18,6);if(!state.claimed)star(14,13,'rose');r('purple',w-8,4,5,8);r('paper',w-6,1,1,6);
      if(pulse>0)r('gold',10,5-sway,7,1);break;
    case 'box':
      panel(0,7,w,h-7);panel(0,2-Math.round(pulse*7),w,6,'dark');r('gold',w/2-1|0,9,3,3);
      star(4,h-9,'paper');r('rose',w-8,h-9,3,2);break;
    case 'mobile':
      r('ink',w/2|0,0,1,7);r('plum',2,7,w-4,1);
      for(const [a,b]of [[3,15],[w/2|0,22],[w-7,14]]){r('ink',a+2,8,1,b-8);star(a+sway,b,'gold');}break;
    case 'drawing':
      panel(0,0,w,h,'dark');r('paper',2,2,w-4,h-4);
      r('dark',10,7,7,7);r('rose',10,14,7,5);r('purple',10,19,7,4);
      r('plum',28,8,11,9);r('pale',30,10,2,3);r('pale',35,10,2,3);r('purple',30,17,7,6);
      star(47,7-sway,'rose');ctx.font='5px Undertale,monospace';ctx.fillStyle=C.ink;ctx.fillText('MI MEJOR AMIGA',x+3,y+h-4);break;
    case 'alcove':
      // Side-facing opening. No front-facing door or cabinet on the floor.
      r('#000',0,0,w,h);r('dark',w-3,0,3,h);r('light',w-2,1,1,h-2);
      for(let b=6;b<h-3;b+=6)r('wood',0,b,w-3,1);star(w-7,2,'gold');break;
    default:return false;
    }
    return true;
  }
  return Object.freeze({draw,palette:Object.freeze(C)});
});
