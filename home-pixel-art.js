/* Editable native-pixel furniture for the HOME wing. No filters or bitmap resampling. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HomePixelArt=factory();
})(typeof window==='object'?window:this,function(){
  'use strict';
  const C={ink:'#483629',wood:'#b28252',light:'#e8c18a',dark:'#836039',paper:'#f6e6b9',
    purple:'#9b85aa',plum:'#71607d',pale:'#d9c4dc',green:'#77955a',leaf:'#a1bb72',
    water:'#8bb7c1',blue:'#c6dde0',gold:'#dec669',rose:'#cc9098',white:'#f4eee0',shade:'#574c42'};
  const clamp=value=>Math.max(0,Math.min(1,Number(value)||0));
  function draw(ctx,p,state={}){
    const {x,y,width:w,height:h}=p,phase=clamp(state.phase),pulse=clamp(state.pulse);
    const sway=Math.round(pulse*2),t=Math.round(phase*7),cx=Math.floor(w/2);
    // Bound every native stroke, including moving lids, leaves and bubbles.
    const r=(color,a,b,c,d)=>{
      const left=Math.max(0,Math.round(a)),top=Math.max(0,Math.round(b));
      const right=Math.min(w,Math.round(a)+Math.round(c)),bottom=Math.min(h,Math.round(b)+Math.round(d));
      if(right<=left||bottom<=top)return;
      ctx.fillStyle=C[color]||color;ctx.fillRect(x+left,y+top,right-left,bottom-top);
    };
    const panel=(a,b,c,d,color='wood')=>{
      r('ink',a,b,c,d);r(color,a+1,b+1,c-2,d-2);r('light',a+2,b+2,c-4,1);
      r('dark',a+c-2,b+3,1,d-4);r('dark',a+2,b+d-2,c-4,1);
    };
    const rounded=(a,b,c,d,color='paper',outline='ink',corner=2)=>{
      r(outline,a+corner,b,c-corner*2,d);r(outline,a,b+corner,c,d-corner*2);
      r(color,a+corner,b+1,c-corner*2,d-2);r(color,a+1,b+corner,c-2,d-corner*2);
    };
    const star=(a,b,color='gold')=>{r(color,a+2,b,1,5);r(color,a,b+2,5,1);};
    const leaf=(a,b,direction=1)=>{
      r('green',a+1,b,5,1);r('green',a,b+1,7,2);r('green',a+2,b+3,4,1);
      r('leaf',a+1,b+1,4,1);r('dark',direction>0?a+5:a+1,b+2,1,2);
    };
    const screw=(a,b)=>{r('ink',a,b,2,2);r('light',a,b,1,1);};
    const flower=(a,b,color='gold')=>{
      r(color,a+2,b,3,2);r(color,a,b+2,7,3);r(color,a+2,b+5,3,2);r('dark',a+3,b+3,1,1);
    };
    switch(p.kind){
    case 'piano':
      panel(0,8,w,43,'dark');panel(2,10,w-4,22);r('dark',5,13,w-10,16);
      r('wood',6,14,w-12,14);r('light',7,15,w-14,1);r('ink',4,34,w-8,15);
      for(let a=6;a<w-6;a+=5){r('white',a,36,4,10);r('paper',a,44,4,2);}
      for(const a of [9,14,24,29,34,44,49,59,64])r('ink',a,36,2,6);
      r('light',3,50,w-6,2);r('ink',5,52,5,h-52);r('wood',6,53,3,h-53);
      r('ink',w-10,52,5,h-52);r('wood',w-9,53,3,h-53);r('gold',cx-6,h-5,3,2);r('gold',cx+3,h-5,3,2);
      r('ink',cx-11,0,22,16);r('white',cx-10,1,20,13);r('shade',cx,1,1,12);
      for(const yy of [4,6,8])r('plum',cx-8,yy,16,1);r('ink',cx-5,5,2,1);r('ink',cx+4,7,2,1);
      r('paper',cx-8,12-Math.round(pulse),16,1);break;
    case 'map':
      panel(0,0,w,h,'dark');r('paper',3,3,w-6,h-6);
      // Kitchen, living room, entrance, original corridor and the connected HOME wing.
      for(const[a,b,c,d]of [[6,7,6,5],[15,7,7,5],[25,7,6,5],[25,15,14,4],[37,7,6,5],[37,21,6,4]]){
        r('dark',a,b,c,d);r('light',a+1,b+1,c-2,d-2);
      }
      r('dark',12,9,3,1);r('dark',22,9,3,1);r('dark',28,12,1,3);r('dark',39,12,1,3);
      r('dark',39,19,1,2);r('dark',31,16,6,1);r('rose',27,8,2,2);star(39,15,'green');
      r('dark',8,22,12,1);r('dark',8,24,8,1);screw(1,1);screw(w-3,h-3);
      if(phase>0){const roll=Math.round(phase*(h-8));r('light',3,3,w-6,roll);r('dark',3,3+roll,w-6,2);r('paper',4,3+roll,w-8,1);}break;
    case 'clock':
      rounded(1,0,w-2,18,'dark');rounded(4,3,w-8,12,'paper');
      r('dark',cx,4,1,1);r('dark',cx,13,1,1);r('dark',5,8,1,1);r('dark',w-6,8,1,1);
      r('ink',cx,6,1,5);r('ink',cx,10,4,1);r('gold',cx,10,1,1);
      panel(3,18,w-6,h-20,'dark');r('ink',5,20,w-10,h-25);r('light',cx+sway,20,1,h-29);
      rounded(cx-3+sway,h-10,7,6,'gold');r('wood',0,h-3,w,2);r('ink',2,h-1,w-4,1);break;
    case 'hooks':
      panel(0,0,w,6);screw(2,2);screw(w-4,2);
      for(const a of [5,15,25]){r('ink',a,5,2,6);r('gold',a+1,6,1,4);r('ink',a,10,5,2);r('light',a+2,10,2,1);}
      r('plum',11,10,9,23-t);r('purple',12,11,7,20-t);r('pale',13,11,1,18-t);
      r('plum',17,13,6,12-t);r('purple',18,14,4,10-t);r('pale',12,24-t,7,2);
      for(let a=12;a<20;a+=2)r('pale',a,30-t,1,3);r('ink',12,33-t,7,1);break;
    case 'mailbox':
      rounded(0,8,w,h-11,'wood');panel(2,7,w-4,6);r('dark',3,14,w-6,1);
      r('ink',5,16,w-10,3);r('light',6,19,w-12,1);r('gold',w-9,22,4,2);
      r('paper',6,23,11,4);r('dark',8,25,7,1);r('dark',5,h-3,3,3);r('dark',w-8,h-3,3,3);
      if(phase>0){const lift=Math.round(phase*10);r('ink',6,15-lift,w-12,11);r('paper',7,16-lift,w-14,9);r('rose',10,19-lift,w-20,1);r('rose',10,21-lift,w-23,1);}break;
    case 'umbrella':
      r('ink',cx,2,2,h-3);r('light',cx,3,1,h-7);r('ink',cx-4,h-4,6,3);r('wood',cx-3,h-3,4,1);
      if(phase>.2){
        r('ink',7,5,w-14,2);r('ink',4,7,w-8,3);r('ink',1,10,w-2,6);
        r('purple',7,6,w-14,3);r('purple',4,9,w-8,5);r('plum',2,12,w-4,3);r('pale',cx-1,6,2,7);
        r('ink',7,10,1,5);r('ink',w-8,10,1,5);r('ink',1,15,6,1);r('ink',9,14,9,1);r('ink',w-7,15,6,1);
      }else{r('ink',cx-3,7,7,h-15);r('purple',cx-2,8,5,h-17);r('pale',cx-1,9,1,h-20);r('plum',cx-2,h-14,5,4);}
      rounded(6,h-9,w-12,9,'dark');r('light',8,h-7,w-16,1);r('wood',9,h-5,w-18,3);break;
    case 'bath':
      r('ink',3,18,w-6,4);r('ink',0,22,w,21);r('ink',2,43,w-4,5);r('ink',5,48,w-10,3);
      r('paper',4,19,w-8,3);r('paper',1,22,w-2,19);r('paper',3,41,w-6,6);r('light',6,47,w-12,2);
      r('blue',5,22,w-10,9);r('water',7,28,w-14,2);r('white',7,23,17,1);r('blue',12,30,11,1);r('light',3,35,1,6);
      rounded(6,49,7,11,'dark','ink',1);rounded(w-13,49,7,11,'dark','ink',1);
      r('ink',w-15,5,4,19);r('light',w-14,6,2,18);r('ink',w-19,4,8,3);r('paper',w-18,5,5,1);r('light',w-19,6,2,5);
      rounded(17+sway,24-sway,11,5,'gold','dark',1);rounded(23+sway,20-sway,5,6,'gold','dark',1);
      r('gold',19+sway,23-sway,6,2);r('ink',26+sway,22-sway,1,1);r('rose',28+sway,24-sway,2,1);r('light',19+sway,26-sway,4,1);break;
    case 'sink':
      panel(4,0,w-8,31,'dark');r('water',7,3,w-14,25);r('blue',9,5,2,21);
      r('blue',11,5,5,1);star(w-13,16,'paper');screw(5,1);screw(w-7,1);
      rounded(0,39,w,10,'paper','ink',2);r('light',4,47,w-8,1);r('ink',7,49,w-14,h-49);
      r('wood',8,50,w-16,h-50);r('dark',cx,51,1,h-52);r('gold',cx-3,54,1,3);r('gold',cx+3,54,1,3);
      r('ink',17,31,3,11);r('paper',18,32,4,2);r('light',18,34,1,7);
      r('rose',7,36,3,2);r('water',w-10,36,3,2);r('ink',6,38,5,1);r('ink',w-11,38,5,1);
      r('dark',10,42,w-20,3);r('blue',11,42,w-22,1);r('ink',cx,44,2,1);
      if(phase>.05){r('water',21,34,1,Math.round(phase*10));r('blue',16,44,10,1);r('blue',15,43,2,1);}break;
    case 'toilet':
      rounded(5,0,w-10,18,'paper');r('light',7,14,w-14,2);r('gold',w-9,5,3,2);
      r('ink',6,19,w-12,3);rounded(2,22,w-4,12,'paper');rounded(6,23,w-12,8,'water','ink',2);
      r('blue',8,24,w-16,2);r('paper',9,34,w-18,h-37);r('light',9,35,2,h-40);rounded(7,h-5,w-14,5,'paper','ink',1);
      if(phase<.6){rounded(4,21-t,w-8,11,'paper','ink',2);r('blue',7,29-t,w-14,1);r('white',7,23-t,w-14,1);}
      else{rounded(7,14-t,w-14,12,'paper','ink',2);r('light',9,16-t,w-18,1);}break;
    case 'towel':
      r('ink',0,2,w,2);r('gold',0,0,2,5);r('gold',w-2,0,2,5);r('light',2,2,w-4,1);
      r('light',5,3,w-10,h-3-t);r('paper',6,3,w-12,h-4-t);r('white',7,4,1,h-10-t);
      r('green',6,h-8-t,w-12,2);r('leaf',7,h-8-t,w-14,1);r('light',10,7,1,6-t);
      r('light',w-10,4,1,10-t);for(let a=7;a<w-7;a+=3)r('paper',a,h-1-t,1,1);break;
    case 'soap':
      rounded(1,h-13,w-2,13,'rose','ink',2);r('pale',3,h-10,1,6);r('paper',5,h-8,w-10,3);
      r('ink',8,h-18,2,5);r('ink',5,h-19,10,2);r('paper',6,h-19,8,1);r('dark',14,h-18,1,2);
      if(pulse>0){rounded(2-sway,3-sway,5,5,'blue','water',1);r('white',3-sway,4-sway,1,1);rounded(13+sway,7-sway,3,3,'blue','water',1);r('white',14+sway,7-sway,1,1);}break;
    case 'bookcase':{
      panel(1,1,w-2,h-2,'dark');panel(0,0,w,4);r('wood',2,4,3,h-7);r('wood',w-5,4,3,h-7);
      const books=[['purple',5,12],['green',4,14],['rose',6,11],['light',5,13],['paper',4,14],['plum',6,12],['gold',4,10]];
      for(let row=0;row<3;row++){
        const b=5+row*18;r('ink',5,b,w-10,15);let a=6;
        for(let k=0;k<books.length;k++){
          const[color,bw,bh]=books[(k+row)%books.length],yy=b+14-bh;
          r('dark',a-1,yy-1,bw+1,bh+1);r(color,a,yy,bw,bh);r('paper',a+1,yy+2,Math.max(1,bw-2),1);
          r('dark',a+bw-1,yy+4,1,bh-4);if(k%3===1)r('light',a+1,yy+bh-3,bw-2,1);a+=bw+2;
        }
        r('wood',4,b+15,w-8,3);r('light',4,b+15,w-8,1);
      }
      if(phase>0){
        const left=4+Math.round(phase*5),right=Math.round(phase*10),hinge=10+left;
        r('ink',9,46,left+right+3,10);r('light',10,54,left+right+1,2);
        r('paper',10,45,left,9);r('white',hinge+1,46,right,8);r('dark',hinge,46,1,9);
        r('light',10,53,left,1);r('light',hinge+1,54,right,1);
        if(left>=8){r('green',14,48,1,5);flower(11,45,'rose');}
        if(right>=5){r('dark',hinge+3,48,right-4,1);r('dark',hinge+3,51,right-4,1);}
        if(phase<1){const page=Math.round(Math.cos(phase*Math.PI)*4);r('paper',hinge+page,44,1,10);r('light',hinge+page-1,44,1,10);}
      }
      r('ink',1,h-3,w-2,3);r('wood',4,h-3,w-8,1);break;}
    case 'blindWindow':
      panel(0,0,w,h,'dark');r('green',3,3,w-6,h-6);r('leaf',5,8,w-10,6);r('gold',8,6,4,3);
      for(const[a,b]of [[9,17],[21,14],[45,18],[56,13]]){r('green',a,b,8,h-b-6);leaf(a,b);}
      r('paper',Math.floor(w/2),2,2,h-4);r('paper',2,h-7,w-4,2);
      r('light',2,2,w-4,4+t*3);for(let b=6;b<6+t*3;b+=3){r('dark',3,b,w-6,1);r('paper',4,b-1,w-8,1);}
      r('ink',w-6,8,1,h-12);r('gold',w-7,h-7,3,3);r('light',0,h-2,w,1);break;
    case 'chaise':
      r('ink',3,11,w-6,4);rounded(0,14,w,23,'plum','ink',2);r('purple',5,12,w-11,17-sway);
      r('pale',7,13,w-15,1);r('plum',6,28-sway,w-12,2);r('ink',5,34,w-10,1);
      rounded(w-21,2,21,31,'purple','ink',2);r('pale',w-17,5,13,1);r('plum',w-18,29,15,2);
      r('plum',w-17,8,1,17);r('pale',w-5,8,1,17);r('dark',w-12,16,2,2);r('pale',w-11,16,1,1);
      rounded(9,18-sway,19,13,'light','dark',2);r('gold',12,21-sway,13,1);r('paper',11,20-sway,1,8);
      r('ink',5,37,5,9);r('wood',6,38,2,7);r('ink',w-10,37,5,9);r('wood',w-9,38,2,7);
      for(let a=13;a<w-24;a+=8)r('pale',a,32,2,1);break;
    case 'beanbag':{
      const top=8+sway;
      r('ink',17,top,w-34,2);r('ink',11,top+2,w-22,3);r('ink',7,top+5,w-14,4);
      r('ink',4,top+9,w-8,7);r('ink',2,top+16,w-4,h-top-25);r('ink',5,h-9,w-10,4);r('ink',11,h-5,w-22,2);
      r('purple',17,top+1,w-34,3);r('purple',12,top+3,w-24,6);r('purple',8,top+7,w-16,8);r('purple',5,top+13,w-10,h-top-23);
      r('plum',3,top+17,3,h-top-27);r('plum',w-9,top+16,6,h-top-26);r('plum',7,h-11,w-14,5);r('purple',12,h-6,w-24,2);
      r('pale',15,top+6,w-30,1);r('pale',11,top+8,4,1);r('plum',cx,top+8,1,5);r('plum',cx-4,top+13,9,1);
      r('pale',8,h-12,2,1);for(let a=14;a<w-12;a+=5)r('pale',a,h-8,2,1);break;}
    case 'gameTable':
      panel(0,3,w,20,'wood');r('ink',3,6,w-6,14);r('plum',4,7,w-8,11);r('purple',5,8,w-10,1);
      r('ink',5,23,5,h-23);r('wood',6,24,2,h-26);r('ink',w-10,23,5,h-23);r('wood',w-9,24,2,h-26);
      for(let a=9,k=0;a<w-10;a+=13,k++){
        r('dark',a,8-sway,9,10);r('paper',a+1,9-sway,7,8);r('light',a+6,15-sway,1,1);
        if(k%3===0)star(a+2,10-sway,'purple');else if(k%3===1)flower(a+2,10-sway,'rose');else{r('green',a+3,11-sway,2,4);r('leaf',a+2,12-sway,4,1);}
      }r('light',1,21,w-2,1);break;
    case 'recordPlayer':{
      rounded(4,0,w-8,27,'dark','ink',1);r('wood',6,2,w-12,23);r('ink',7,5,w-14,16);
      rounded(9,6,17,14,'plum','ink',3);r('purple',12,8,11,1);r('purple',11,10,1,6);r('dark',14,9,7,8);
      r('gold',16,11,3,3);r('ink',17,12,1,1);r('paper',w-12,7,1,11);r('light',w-14,6,4,2);
      r('paper',w-16,17,5,1);r('ink',w-17,17,2,3);r(phase>.2?'green':'rose',8,23,3,1);r('gold',w-12,22,3,2);
      panel(1,28,w-2,8);r('ink',5,36,4,h-36);r('wood',6,37,2,h-38);r('ink',w-9,36,4,h-36);r('wood',w-8,37,2,h-38);
      if(phase>.2){const angle=state.motion?((Number(state.time)||0)/250):0;r('paper',17+Math.cos(angle)*5,12+Math.sin(angle)*3,1,1);}break;}
    case 'origami':
      r('plum',2,h-3,w-4,1);r('purple',5,h-2,w-10,1);
      if(phase>.3){
        r('ink',9,11,11,5);r('white',10,12,9,3);r('blue',12,14,6,1);
        for(const[a,b,c,d]of [[4,3,2,2],[4,5,5,2],[5,7,8,2],[6,9,10,2],[8,11,10,2]]){
          r('ink',a,b,c,d);r('white',a+1,b+1,c-2,1);
        }
        r('ink',18,5,3,9);r('white',19,6,1,7);r('ink',18,2,5,4);r('white',19,3,3,2);
        r('ink',23,3,3,1);r('gold',23,3,2,1);r('ink',2,13,8,2);r('white',3,13,6,1);r('blue',13,11,1,3);r('white',12,10,5,2);
      }else{r('dark',2,7,w-4,9);r('white',3,8,w-6,7);r('blue',4,13,w-8,1);r('rose',cx,8,1,6);r('blue',6,9,1,3);}break;
    case 'glass':
      panel(0,0,w,h,'dark');r('paper',3,3,w-6,h-6);
      for(let a=5,k=0;a<w-6;a+=13,k++){
        r(k%2?'purple':'green',a,6,11,h-13);r(k%2?'pale':'leaf',a+1,7,1,h-16);r('gold',a+3,9,4,5);
        r('ink',a+11,4,1,h-8);r('ink',a+1,17,9,1);r('rose',a+3,22,4,4);r('paper',a+4,23,2,1);
      }
      r('paper',4,h-9,w-8,1);r('light',1,h-2,w-2,1);if(pulse>0){r('paper',5+sway,5,2,h-11);star(w-13,6-sway,'paper');}break;
    case 'bootrack':
      panel(0,h-11,w,8);r('ink',3,h-3,4,3);r('ink',w-7,h-3,4,3);
      for(const a of [3,20]){
        r('ink',a,6,10,h-18);r('purple',a+1,7,8,h-20);r('plum',a+7,8,2,h-22);
        r('ink',a,h-17,14,6);r('plum',a+1,h-16,12,4);r('purple',a+1,h-16,7,1);
        r('paper',a+2,7,5,2);r('ink',a+3,12,4,1);r('gold',a+5,12,1,1);r('ink',a,h-11,14,1);
      }
      if(phase>.4){star(5,13,'paper');star(22,13,'paper');}else{r('dark',4,h-16,2,2);r('dark',23,h-18,2,2);r('dark',8,h-15,3,1);}break;
    case 'windchime':
      r('ink',cx,0,1,7);r('dark',4,7,w-8,2);r('light',6,7,w-12,1);
      for(let a=7;a<w-5;a+=8){r('ink',a,9,1,9+(a%3));r('dark',a+sway,18+(a%3),4,9-(a%3));r('gold',a+1+sway,18+(a%3),2,8-(a%3));r('paper',a+1+sway,19+(a%3),1,4);}
      r('ink',cx+sway,25,1,h-3);rounded(cx-2+sway,h-5,5,4,'plum','ink',1);break;
    case 'pottingBench':
      panel(0,23,w,10);r('ink',3,33,6,h-33);r('wood',4,34,3,h-35);r('ink',w-9,33,6,h-33);r('wood',w-8,34,3,h-35);
      panel(5,h-10,w-10,6);r('dark',8,h-8,9,1);r('dark',w-26,h-8,14,1);
      rounded(5,8,18,14,'wood','ink',2);r('light',7,9,14,2);r('dark',8,19,12,2);
      r('green',13,4,1,7);leaf(6,2);leaf(14,0);r('dark',13,9,2,1);
      r('ink',29,17,19,5);r('paper',30,17,17,4);r('gold',32,18,3,2);r('dark',38,19,7,1);
      r('dark',55,3,2,20);rounded(52,1,8,7,'shade','ink',2);r('light',55,2,1,4);
      r('ink',11,h-14,18,5);r('paper',12,h-13,16,3);r('rose',14,h-12,4,1);
      r('light',35,26,19,1);r('dark',19,29,8,1);if(pulse>0){r('gold',28,12-sway,2,2);r('gold',33,14-sway,1,1);}break;
    case 'flowerbed':{
      panel(0,h-15,w,15,'wood');r('shade',2,h-13,w-4,7);r('dark',4,h-11,3,1);r('dark',21,h-10,4,1);
      r('light',2,h-14,w-4,1);r('dark',4,h-4,2,3);r('dark',w-6,h-4,2,3);
      for(const a of [7,16,25]){r('green',a,h-23-Math.round(phase*6),1,14+Math.round(phase*6));leaf(a-5,h-20);}
      const by=h-27-Math.round(phase*7);flower(13,by,'gold');r('gold',15,by-1,3,1);
      if(phase>.2){flower(3,by+4,'rose');flower(23,by+5,'paper');r('water',4,h-6,w-8,1);}
      if(pulse>.05){r('blue',6,by-4-sway,1,3);r('blue',24,by-2-sway,1,3);}break;}
    case 'trellis':
      for(const a of [3,16,29,42]){r('ink',a,0,2,h);r('wood',a,1,1,h-1);}
      for(const b of [5,20,35,50]){r('dark',0,b,w,3);r('light',1,b,w-2,1);}
      for(const [a,b]of [[3,9],[15,19],[29,31],[40,43]]){r('green',a+sway,b,1,16);leaf(a-3+sway,b);leaf(a+sway,b+9,-1);}
      flower(13+sway,15,'rose');r('leaf',9,54,6,1);break;
    case 'birdbath':
      rounded(0,6,w,9,'paper','ink',2);r('water',4,7,w-8,3);r('blue',6,7,9,1);r('light',4,13,w-8,1);
      r('ink',cx-4,15,8,h-20);r('paper',cx-3,15,6,h-20);r('light',cx+1,16,2,h-21);
      rounded(5,h-6,w-10,6,'paper','ink',2);r('light',8,h-3,w-16,1);
      rounded(w-13,0,9,6,'plum','ink',2);r('plum',w-16,4,5,2);r('paper',w-8,2,1,1);r('gold',w-4,3,3,1);
      r('ink',w-12,6,1,2);r('ink',w-8,6,1,2);r('purple',w-13,3,3,1);
      if(pulse>0){r('blue',7-sway,10,w-14+sway*2,1);r('blue',10+sway,8,w-20,1);}break;
    case 'wateringCan':
      rounded(7,4,w-14,h-4,'green','ink',2);r('leaf',9,6,w-18,1);r('dark',9,h-3,w-18,1);
      r('ink',w-8,5,7,h-8);r('green',w-7,6,5,h-10);r('paper',w-5,8,2,h-14);
      r('ink',1,7,8,4);r('green',2,8,7,2);r('ink',0,4,4,5);r('leaf',1,5,2,3);
      r('dark',11,3,w-22,2);r('water',1,1-sway,1,2);r('water',4,2-sway,1,2);break;
    case 'gardenBench':
      rounded(2,0,w-4,18,'wood','ink',2);for(const b of [4,10]){r('ink',3,b+2,w-6,1);r('light',4,b,w-8,1);}
      panel(0,17,w,7);r('ink',5,24,4,h-24);r('ink',w-9,24,4,h-24);
      screw(5,2);screw(w-7,2);screw(5,12);screw(w-7,12);
      rounded(7,18+sway,17,5,'green','dark',1);r('leaf',9,19+sway,13,1);r('paper',10,21+sway,1,1);r('paper',21,21+sway,1,1);break;
    case 'frog':
      rounded(5,9-sway,w-10,11,'leaf','ink',2);rounded(2,16-sway,w-4,6,'green','ink',1);
      r('leaf',4,17-sway,5,3);r('leaf',w-9,17-sway,5,3);r('leaf',9,15-sway,w-18,4);
      for(const a of [5,w-10]){rounded(a,5-sway,5,6,'green','ink',1);r('paper',a+1,6-sway,3,3);r('ink',a+2,7-sway,1,1);}
      r('gold',w-4,15-sway,4,2);r('ink',w-2,12-sway,1,7);r('ink',8,15-sway,w-16,1);r('paper',cx-2,12-sway,4,1);
      r('dark',6,h-1,3,1);r('dark',w-9,h-1,3,1);break;
    case 'hammock':
      r('ink',1,3,4,h-3);r('wood',2,4,2,h-5);r('ink',w-5,3,4,h-3);r('wood',w-4,4,2,h-5);
      r('light',4,6,w-8,1);r('dark',4,7,1,9+sway);r('dark',w-5,7,1,9+sway);
      r('plum',4,15+sway,w-8,16);r('purple',6,19+sway,w-12,14);r('purple',9,32+sway,w-18,4);
      r('ink',4,15+sway,2,10);r('ink',w-6,15+sway,2,10);r('plum',8,34+sway,w-16,3);r('pale',8,20+sway,w-16,3);
      for(let a=9;a<w-8;a+=5)r('pale',a,29+sway,2,1);
      rounded(9,19+sway,13,8,'paper','light',2);r('white',12,20+sway,7,1);r('dark',0,h-2,6,2);r('dark',w-6,h-2,6,2);break;
    case 'desk':
      panel(0,9,w,15,'wood');r('light',2,11,w-4,1);r('dark',6,21,w-12,1);
      r('ink',4,24,5,h-24);r('wood',5,25,2,h-26);r('ink',w-9,24,5,h-24);r('wood',w-8,25,2,h-26);
      r('ink',9,13,w-20,7);r('paper',10,13,w-22,6);r('light',11,18,w-24,1);
      if(!state.claimed){star(14,13,'rose');r('purple',21,15,3,2);r('green',24,17,2,1);}
      rounded(w-9,4,6,9,'purple','ink',1);r('paper',w-7,1,1,6);r('rose',w-5,2,1,5);
      r('gold',5,13,1,6);r('ink',5,18,1,1);if(pulse>0)star(9,2-sway,'gold');break;
    case 'box':{
      panel(0,7,w,h-7);r('dark',3,10,1,h-12);r('dark',w-4,10,1,h-12);r('light',2,h-3,w-4,1);
      const lift=Math.round(pulse*7);panel(0,2-lift,w,6,'dark');r('light',2,3-lift,w-4,1);
      r('gold',cx-1,9,3,3);r('ink',cx,10,1,1);star(4,h-9,'paper');r('rose',w-8,h-9,3,2);
      if(pulse>.5){r('pale',4,7,w-8,2);r('rose',6,8,3,1);}break;}
    case 'mobile':
      r('ink',cx,0,1,7);r('plum',2,7,w-4,1);r('purple',3,6,w-6,1);
      for(const[a,b]of [[3,15],[cx,22],[w-7,14]]){r('ink',a+2,8,1,b-8);star(a+sway,b,'gold');r('paper',a+2+sway,b+1,1,1);}
      r('pale',cx-1,9,3,2);break;
    case 'drawing':
      panel(0,0,w,h,'dark');r('paper',2,2,w-4,h-4);
      r('light',3,h-3,w-6,1);r('dark',10,7,7,6);r('paper',12,10,3,4);r('rose',10,14,7,5);r('purple',10,19,7,4);
      r('dark',11,23,2,3);r('dark',15,23,2,3);r('rose',8,15,2,4);r('rose',17,15,2,4);
      r('plum',29,9,9,8);r('pale',28,7,4,4);r('pale',35,7,4,4);r('pale',30,11,2,3);r('pale',35,11,2,3);
      r('purple',30,17,7,6);r('plum',32,23,3,2);
      star(47,7-sway,'rose');ctx.font='5px Undertale,monospace';ctx.fillStyle=C.ink;ctx.fillText('MI MEJOR AMIGA',x+3,y+h-4);break;
    case 'alcove':
      // Side-facing opening. No front-facing door or cabinet on the floor.
      r('#000',0,0,w,h);r('ink',w-4,0,4,h);r('dark',w-3,0,2,h);r('light',w-2,1,1,h-2);
      for(let b=6;b<h-3;b+=6){r('dark',0,b,w-4,1);r('wood',0,b+1,w-4,1);}star(w-8,2,'gold');r('paper',w-6,3,1,1);break;
    default:return false;
    }
    return true;
  }
  return Object.freeze({draw,palette:Object.freeze(C)});
});
