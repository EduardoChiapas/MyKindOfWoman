/* Editable native-pixel furniture for the HOME wing. No filters or bitmap resampling. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HomePixelArt=factory();
})(typeof window==='object'?window:this,function(){
  'use strict';
  const C={ink:'#392c34',wood:'#c58a49',light:'#f6c96d',dark:'#865338',paper:'#fff0bd',
    purple:'#a986d9',plum:'#685083',pale:'#e3cef3',green:'#62a554',leaf:'#a4ce6b',
    water:'#63b9c5',blue:'#c1ebf0',gold:'#f3c956',rose:'#e88c98',white:'#fff9e8',shade:'#66523e',
    ceramic:'#efefdf',ceramicShadow:'#b8bcab',steel:'#829593',steelLight:'#cbd9cf',
    glass:'#82b8b5',deepWater:'#477f80',soil:'#65533f',clay:'#b57e59',plantShade:'#426b44'};
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
    const gardenLeaf=(a,b)=>{
      r('plantShade',a+1,b,4,1);r('plantShade',a,b+1,6,2);r('plantShade',a+1,b+3,4,1);
      r('green',a+1,b+1,4,2);r('leaf',a+1,b+1,3,1);
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
      panel(0,0,w,h,'dark');r('ceramic',3,3,w-6,h-6);
      // The linked rectangles read as a floor plan, with one coloured location dot.
      for(const[a,b,c,d]of [[7,7,8,7],[19,7,9,7],[33,7,9,7],[20,18,22,6]]){
        r('steel',a,b,c,d);r('paper',a+1,b+1,c-2,d-2);
      }
      r('steel',15,10,4,2);r('steel',28,10,5,2);r('steel',23,14,2,4);r('steel',37,14,2,4);
      r('rose',22,9,3,3);r('plantShade',36,20,4,2);r('steel',7,20,8,1);r('steel',7,22,5,1);
      screw(1,1);screw(w-3,h-3);
      if(phase>0){const roll=Math.round(phase*(h-8));r('paper',3,3,w-6,roll);r('dark',3,3+roll,w-6,3);r('white',4,3+roll,w-8,1);r('wood',3,5+roll,w-6,1);}break;
    case 'clock':
      rounded(1,0,w-2,20,'wood','ink',3);rounded(4,3,w-8,14,'ceramic','dark',3);
      r('dark',cx,4,1,2);r('dark',cx,14,1,2);r('dark',5,9,2,1);r('dark',w-7,9,2,1);
      r('ink',cx,7,1,5);r('ink',cx,10,4,1);r('gold',cx,10,1,1);r('light',3,2,w-6,1);
      panel(3,19,w-6,h-21,'dark');r('ink',5,21,w-10,h-27);
      r('gold',cx+sway,21,1,h-30);rounded(cx-3+sway,h-11,7,7,'gold','ink',2);r('paper',cx-1+sway,h-9,1,2);
      r('ink',0,h-4,w,3);r('wood',1,h-3,w-2,1);r('ink',2,h-1,w-4,1);break;
    case 'hooks':
      panel(0,0,w,6);screw(2,2);screw(w-4,2);
      for(const a of [5,15,25]){r('ink',a,5,2,6);r('steelLight',a+1,6,1,4);r('ink',a,10,5,2);r('steel',a+2,10,2,1);}
      r('ink',11,10,10,23-t);r('purple',12,11,8,20-t);r('pale',13,11,2,17-t);r('plum',19,12,1,17-t);
      r('ink',18,13,6,13-t);r('purple',19,14,4,10-t);r('pale',20,15,1,8-t);
      r('plum',12,23-t,8,1);r('pale',12,25-t,8,2);for(let a=12;a<20;a+=2)r('purple',a,32-t,1,2);break;
    case 'mailbox':
      rounded(1,8,w-2,h-11,'wood','ink',2);r('dark',w-6,11,4,h-17);panel(0,5,w,6,'wood');
      r('ink',5,14,w-10,3);r('light',6,17,w-12,1);r('gold',w-9,23,3,2);
      // An envelope emblem distinguishes the mailbox from a drawer or flower pot.
      r('ink',7,21,13,7);r('ceramic',8,22,11,5);
      for(const [a,b]of [[8,22],[10,23],[12,24],[14,23],[16,22]])r('steel',a,b,2,1);
      r('ink',5,h-3,3,3);r('ink',w-8,h-3,3,3);
      if(phase>0){const lift=Math.round(phase*10);r('ink',6,14-lift,w-12,12);r('ceramic',7,15-lift,w-14,10);r('steel',9,17-lift,w-18,1);r('rose',10,20-lift,w-20,1);r('steel',10,23-lift,w-23,1);}break;
    case 'umbrella':
      r('ink',cx,1,2,h-3);r('steelLight',cx,2,1,h-7);r('ink',cx-4,h-6,6,4);r('wood',cx-3,h-5,4,2);
      if(phase>.2){
        r('ink',cx-2,4,5,2);r('ink',7,6,w-14,3);r('ink',4,9,w-8,3);r('ink',1,12,w-2,5);
        r('purple',cx-1,5,3,3);r('purple',8,7,w-16,3);r('purple',5,10,w-10,3);r('purple',2,13,w-4,3);
        r('pale',cx,6,1,9);r('plum',6,12,2,4);r('plum',w-8,12,2,4);
        r('ink',1,16,7,2);r('ink',10,15,7,2);r('ink',w-8,16,7,2);
      }else{
        r('ink',cx-1,6,3,3);r('ink',cx-3,9,7,h-18);r('purple',cx-2,10,5,h-20);
        r('pale',cx-1,11,1,h-23);r('plum',cx-2,h-16,5,3);r('dark',cx-3,h-15,7,2);
      }
      rounded(5,h-7,w-10,7,'clay','ink',2);r('soil',7,h-7,w-14,2);r('light',7,h-4,w-14,1);break;
    case 'bath':
      // Rounded porcelain body, separate water surface and two cast-iron feet.
      r('ink',2,29,w-4,14);r('ink',5,43,w-10,7);r('ink',10,50,w-20,7);
      r('ceramic',3,30,w-6,12);r('ceramic',6,41,w-12,8);r('ceramic',11,49,w-22,6);
      r('ceramicShadow',6,43,3,6);r('ceramicShadow',10,50,w-20,5);
      r('white',8,34,w-16,2);r('white',9,36,1,6);r('ceramicShadow',w-8,32,2,11);
      r('ink',12,57,6,7);r('steel',13,58,3,4);r('ink',9,63,10,3);r('steel',10,64,7,1);
      r('ink',w-18,57,6,7);r('steel',w-17,58,3,4);r('ink',w-19,63,10,3);r('steel',w-17,64,7,1);
      rounded(0,17,w,18,'ceramic','ink',4);rounded(4,20,w-8,11,'water','deepWater',3);
      r('blue',8,21,w-17,2);r('blue',7,24,19,1);r('deepWater',8,29,w-16,1);r('white',7,18,w-14,1);
      // The back tap has an unmistakable bent spout and separate hot/cold knobs.
      r('ink',w-16,4,4,17);r('steel',w-15,5,2,16);r('steelLight',w-15,5,1,15);
      r('ink',w-24,3,11,4);r('steel',w-23,4,8,2);r('ink',w-24,6,3,5);r('steelLight',w-23,6,1,4);
      r('ink',w-20,12,12,3);r('rose',w-19,13,3,1);r('water',w-12,13,3,1);
      // Small rubber duck: head, beak and lifted tail read at native size.
      rounded(22+sway,24-sway,12,6,'gold','dark',2);rounded(28+sway,19-sway,6,7,'gold','dark',1);
      r('gold',21+sway,23-sway,4,3);r('ink',32+sway,21-sway,1,1);r('clay',34+sway,23-sway,3,2);
      r('paper',25+sway,26-sway,5,1);break;
    case 'sink':
      rounded(4,0,w-8,30,'steel','ink',1);r('glass',6,2,w-12,26);
      r('blue',8,4,2,18);r('blue',10,3,11,2);r('blue',w-13,19,5,1);r('blue',w-11,17,3,1);
      r('deepWater',6,26,w-12,1);r('steelLight',5,1,w-10,1);
      panel(5,47,w-10,h-47,'wood');r('dark',cx,49,1,h-51);
      r('steelLight',cx-4,53,2,2);r('steelLight',cx+3,53,2,2);r('ink',7,h-2,3,2);r('ink',w-10,h-2,3,2);
      rounded(0,37,w,12,'ceramic','ink',2);rounded(6,39,w-12,7,'ceramicShadow','steel',2);
      r('ceramic',9,40,w-18,3);r('ink',cx,43,2,1);r('white',3,38,w-6,1);r('ceramicShadow',4,47,w-8,1);
      r('ink',cx-2,30,4,10);r('steel',cx-1,31,2,8);r('ink',cx-1,30,7,3);r('steelLight',cx,31,5,1);
      r('ink',cx+4,32,2,3);r('steel',cx+4,32,1,2);
      r('rose',5,35,4,2);r('water',w-9,35,4,2);r('ink',4,37,6,1);r('ink',w-10,37,6,1);
      if(phase>.05){r('water',cx+4,35,1,Math.round(phase*8));r('blue',cx+2,42,5,1);}break;
    case 'toilet':
      rounded(5,0,w-10,19,'ceramic','ink',2);r('white',7,2,w-14,2);r('ceramicShadow',7,15,w-14,2);
      r('ink',5,4,w-10,1);r('steel',w-10,8,4,2);r('steelLight',w-9,8,2,1);
      r('ink',8,18,w-16,7);r('ceramic',9,19,w-18,6);
      rounded(2,23,w-4,14,'ceramic','ink',3);rounded(5,25,w-10,9,'water','steel',2);
      r('blue',8,27,w-16,2);r('deepWater',8,31,w-16,1);
      r('ink',7,36,w-14,8);r('ceramic',8,36,w-16,7);r('ceramicShadow',w-12,36,3,7);
      rounded(5,h-7,w-10,7,'ceramic','ink',2);r('ceramicShadow',8,h-3,w-16,1);
      if(phase<.6){rounded(3,22-t,w-6,11,'ceramic','ink',3);r('white',7,24-t,w-14,1);r('ceramicShadow',6,30-t,w-12,1);}
      else{rounded(6,15-t,w-12,16,'ceramic','ink',3);r('white',9,17-t,w-18,1);r('ceramicShadow',9,27-t,w-18,1);}break;
    case 'towel':
      rounded(0,0,4,6,'steel','ink',1);rounded(w-4,0,4,6,'steel','ink',1);
      r('ink',3,2,w-6,3);r('steelLight',3,3,w-6,1);
      r('ink',5,3,w-10,h-3-t);r('ceramic',6,3,w-12,h-4-t);r('white',7,4,2,h-10-t);
      r('ceramicShadow',10,4,1,h-8-t);r('ceramicShadow',w-9,4,2,h-7-t);
      r('water',6,h-8-t,w-12,3);r('blue',7,h-8-t,w-14,1);
      r('ceramicShadow',6,h-3-t,w-12,1);for(let a=7;a<w-7;a+=3)r('ceramic',a,h-1-t,1,1);break;
    case 'soap':
      rounded(4,h-15,w-8,15,'rose','ink',2);r('pale',6,h-12,2,8);r('plum',w-7,h-11,2,8);
      rounded(7,h-10,w-14,5,'ceramic','plum',1);r('water',9,h-9,3,2);
      r('ink',8,h-20,5,6);r('steel',9,h-19,3,5);r('ink',5,h-21,12,3);r('steelLight',6,h-20,10,1);
      r('ink',5,h-19,2,3);r('steel',6,h-19,1,2);
      if(pulse>0){rounded(1-sway,3-sway,5,5,'blue','water',1);r('white',2-sway,4-sway,1,1);rounded(14+sway,7-sway,4,4,'blue','water',1);r('white',15+sway,8-sway,1,1);}break;
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
      for(let a=13;a<w-24;a+=8)r('pale',a,32,2,1);
      r('plum',32,19,1,6);r('pale',34,19,1,1);r('plum',48,19,1,6);r('pale',50,19,1,1);break;
    case 'beanbag':{
      const top=7+sway;
      // A low fabric bag with a sunken seat and soft curved sides.
      r('ink',16,top,w-32,2);r('ink',10,top+2,w-20,4);r('ink',6,top+6,w-12,7);
      r('ink',3,top+13,w-6,11);r('ink',2,top+24,w-4,h-top-32);r('ink',5,h-9,w-10,5);r('ink',12,h-4,w-24,2);
      r('purple',17,top+1,w-34,3);r('purple',11,top+3,w-22,5);r('purple',7,top+7,w-14,8);
      r('purple',4,top+15,w-8,h-top-26);r('purple',6,h-10,w-12,5);r('purple',13,h-5,w-26,2);
      r('pale',13,top+6,14,2);r('pale',9,top+9,5,1);r('plum',w-12,top+9,4,7);
      r('plum',w-9,top+16,5,h-top-27);r('plum',9,h-11,w-18,5);
      r('plum',15,top+11,w-30,2);r('plum',12,top+13,w-24,2);r('plum',15,top+15,w-30,2);
      r('purple',15,top+13,w-30,1);r('pale',9,top+21,1,7);r('plum',w-12,top+23,1,6);
      r('pale',12,h-9,w-27,1);break;}
    case 'gameTable':
      panel(0,3,w,20,'wood');r('ink',3,6,w-6,14);r('plum',4,7,w-8,11);r('purple',5,8,w-10,1);
      r('ink',5,23,5,h-23);r('wood',6,24,2,h-26);r('ink',w-10,23,5,h-23);r('wood',w-9,24,2,h-26);
      for(let a=9,k=0;a<w-10;a+=13,k++){
        r('dark',a,8-sway,9,10);r('paper',a+1,9-sway,7,8);r('light',a+6,15-sway,1,1);
        if(k%3===0)star(a+2,10-sway,'purple');else if(k%3===1)flower(a+2,10-sway,'rose');else{r('green',a+3,11-sway,2,4);r('leaf',a+2,12-sway,4,1);}
      }r('light',1,21,w-2,1);break;
    case 'recordPlayer':{
      // Lifted dust cover, black vinyl disc, tone arm and a wooden cabinet below.
      panel(2,0,w-4,8,'dark');r('steel',4,2,w-8,3);r('steelLight',5,2,w-10,1);
      rounded(0,8,w,22,'wood','ink',1);r('dark',2,10,w-4,17);r('light',2,9,w-4,1);
      rounded(4,11,18,15,'ink','ink',4);r('steel',8,12,8,1);r('plum',5,16,1,5);r('steel',8,24,8,1);
      rounded(10,15,6,6,'rose','ink',2);r('paper',12,17,2,1);r('ink',12,18,1,1);
      r('ink',w-9,11,5,4);r('steel',w-8,12,3,2);r('steelLight',w-7,14,1,8);
      r('steelLight',w-12,21,6,1);r('ink',w-13,21,3,3);r('steel',w-12,22,1,1);
      r(phase>.2?'leaf':'rose',4,27,2,1);r('gold',w-8,26,3,2);
      panel(1,30,w-2,10,'wood');r('dark',4,33,w-8,1);r('dark',4,36,w-8,1);r('light',cx-2,33,4,1);
      r('ink',5,40,4,h-40);r('wood',6,41,2,h-42);r('ink',w-9,40,4,h-40);r('wood',w-8,41,2,h-42);
      if(phase>.2){const angle=state.motion?((Number(state.time)||0)/250):0;r('steelLight',13+Math.cos(angle)*6,18+Math.sin(angle)*4,1,1);}break;}
    case 'origami':
      r('plum',4,h-2,w-8,1);
      if(phase>.3){
        // The crane has two pointed wings, a folded body and a long bent neck.
        for(let b=3;b<14;b++){
          const left=3+Math.floor((b-3)/2),right=4+b-3;
          r('ink',left,b,right-left+1,1);r('white',left+1,b,right-left-1,1);
        }
        r('ink',9,12,12,5);r('ceramic',10,13,10,3);r('blue',11,15,8,1);
        r('ink',16,7,3,8);r('white',17,8,1,6);r('ink',17,4,4,5);r('white',18,5,2,3);
        r('ink',19,3,4,3);r('ceramic',20,4,2,1);r('ink',23,4,3,1);
        r('ink',3,15,7,2);r('white',4,15,5,1);r('blue',13,12,1,3);
      }else{
        r('ink',2,7,w-4,11);r('ceramic',3,8,w-6,9);r('white',4,9,w-8,1);r('blue',4,15,w-8,1);
        r('steel',cx,9,1,6);r('steel',cx-3,12,7,1);
      }break;
    case 'glass':
      panel(0,0,w,h,'dark');r('ceramic',3,3,w-6,h-6);
      // Three stained-glass panes with lead borders and one clear diamond each.
      for(let k=0;k<3;k++){
        const a=5+k*24,col=k===1?'pale':'blue';
        r('ink',a,4,23,h-8);r(col,a+1,5,21,h-10);
        r(k===1?'purple':'glass',a+1,21,21,h-27);r('steel',a+1,20,21,1);
        r('steel',a+10,8,3,18);r('steel',a+6,12,11,10);r('steel',a+3,15,17,4);
        r(k===1?'rose':'leaf',a+10,9,3,16);r(k===1?'rose':'leaf',a+7,13,9,8);r(k===1?'rose':'leaf',a+4,16,15,2);
        r('paper',a+11,12,1,7);r('white',a+3,7,5,1);r('white',a+2,8,2,5);
      }
      r('light',1,h-2,w-2,1);if(pulse>0){r('white',7+sway,6,1,8);star(w-12,7-sway,'white');}break;
    case 'bootrack':
      panel(0,h-10,w,7);r('ink',3,h-3,4,3);r('ink',w-7,h-3,4,3);
      for(const a of [3,20]){
        r('ink',a,3,10,h-15);r('purple',a+1,4,8,h-17);r('plum',a+7,6,2,h-19);r('pale',a+2,6,1,h-20);
        r('ink',a,3,10,3);r('plum',a+1,4,8,1);r('pale',a+1,5,8,1);
        r('ink',a,h-17,12,3);r('ink',a,h-15,14,5);r('purple',a+1,h-16,10,2);r('purple',a+1,h-14,12,3);
        r('pale',a+8,h-15,3,1);r('plum',a+1,h-12,12,1);r('ink',a,h-11,14,1);
      }
      if(phase>.4){star(5,12,'paper');star(22,12,'paper');}else{r('soil',4,h-14,2,2);r('soil',24,h-15,2,2);}break;
    case 'windchime':
      r('ink',cx,0,1,6);rounded(4,6,w-8,4,'wood','ink',1);r('light',6,7,w-12,1);
      for(const[a,bottom]of [[7,25],[15,29],[23,24]]){
        r('plum',a+1,10,1,7);r('ink',a+sway,17,4,bottom-17);r('steel',a+1+sway,18,2,bottom-19);
        r('steelLight',a+1+sway,18,1,bottom-20);r('dark',a+1+sway,bottom-2,2,1);
      }
      r('ink',cx+sway,10,1,h-15);r('ink',cx+sway,29,1,4);rounded(cx-3+sway,h-6,7,6,'wood','ink',2);r('light',cx-1+sway,h-4,1,2);break;
    case 'pottingBench':
      // Work surface, visible apron and lower shelf form a real potting table.
      panel(0,23,w,10);r('light',2,24,w-4,2);r('dark',2,30,w-4,2);
      r('ink',3,33,6,h-33);r('wood',4,34,3,h-35);r('dark',7,34,1,h-35);
      r('ink',w-9,33,6,h-33);r('wood',w-8,34,3,h-35);r('dark',w-5,34,1,h-35);
      panel(6,h-10,w-12,6);r('light',7,h-9,w-14,1);
      // Pot on the top shelf: tapered clay, dark soil and two separate leaves.
      r('ink',8,12,18,4);r('clay',9,13,16,2);r('soil',11,12,12,1);
      r('ink',9,16,16,7);r('clay',10,16,14,5);r('dark',20,16,4,5);r('ink',11,21,12,2);r('clay',12,21,10,1);
      r('plantShade',16,4,2,10);r('green',16,4,1,9);gardenLeaf(8,4);gardenLeaf(17,0);gardenLeaf(18,7);
      // Seed envelope and a recognisable hand trowel, kept apart on the surface.
      rounded(35,12,12,11,'paper','ink',1);r('dark',37,14,8,1);r('green',40,17,2,4);gardenLeaf(39,17);
      r('ink',61,1,5,11);r('wood',62,2,3,9);r('light',62,2,1,8);
      r('ink',62,12,3,5);r('steelLight',63,12,1,5);rounded(59,16,9,6,'steel','ink',2);r('steelLight',61,17,3,2);
      // Two stored empty pots have open rims, rather than anonymous little marks.
      for(const a of [15,43]){
        r('ink',a,h-24,12,3);r('clay',a+1,h-23,10,1);r('soil',a+2,h-24,8,1);
        r('ink',a+1,h-21,10,10);r('clay',a+2,h-21,8,8);r('dark',a+7,h-21,2,8);
        r('ink',a+2,h-12,8,2);r('clay',a+3,h-12,6,1);
      }
      if(pulse>.05){star(29,10-sway,'paper');}break;
    case 'flowerbed':{
      const by=h-30-Math.round(phase*7);
      panel(0,h-15,w,15,'clay');r('soil',2,h-13,w-4,4);r('ink',1,h-9,w-2,1);
      r('wood',2,h-8,w-4,6);r('light',2,h-8,w-4,1);r('dark',3,h-3,w-6,1);
      r('dark',5,h-7,1,4);r('dark',w-6,h-7,1,4);
      r('plantShade',15,by+5,2,h-16-by);r('green',15,by+6,1,h-16-by);gardenLeaf(9,h-24);gardenLeaf(17,h-21);
      flower(12,by,'gold');r('clay',14,by+2,3,3);r('paper',14,by,3,1);
      // One flower in the dry state; the saved watering state adds the companions.
      if(phase>.2){
        r('plantShade',6,by+12,1,h-23-by);r('plantShade',25,by+13,1,h-24-by);
        gardenLeaf(1,h-22);gardenLeaf(25,h-21);flower(3,by+6,'rose');flower(22,by+7,'ceramic');
      }
      if(pulse>.05){r('water',5,by-3-sway,1,3);r('blue',25,by-1-sway,1,3);}break;}
    case 'trellis':
      // Outer uprights support crossed laths; the vine follows a separate stem.
      for(const a of [2,w-5]){r('ink',a,0,3,h);r('wood',a+1,1,1,h-1);}
      for(let b=4;b<h-8;b+=14){r('dark',4,b,w-8,2);r('wood',5,b,w-10,1);}
      for(let b=6;b<h-12;b+=3){r('dark',10,b,1,3);r('dark',w-12,b,1,3);}
      for(const [a,b]of [[8,5],[15,17],[24,28],[33,41]]){
        r('plantShade',a+sway,b+3,2,14);gardenLeaf(a-4+sway,b);gardenLeaf(a+1+sway,b+8);
      }
      r('plantShade',9+sway,18,8,2);r('plantShade',16+sway,31,10,2);r('plantShade',25+sway,44,10,2);
      r('plantShade',34+sway,52,2,10);
      flower(13+sway,14,'rose');flower(29+sway,41,'paper');
      gardenLeaf(30+sway,57);break;
    case 'birdbath':
      rounded(1,8,w-2,10,'ceramic','ink',3);r('ceramicShadow',5,15,w-10,2);
      rounded(4,9,w-8,5,'water','deepWater',2);r('blue',7,10,10,1);r('white',5,8,w-10,1);
      r('ink',cx-5,18,10,3);r('ceramicShadow',cx-4,19,8,2);
      r('ink',cx-3,21,6,h-27);r('ceramic',cx-2,21,4,h-27);r('ceramicShadow',cx+1,21,1,h-27);
      rounded(5,h-7,w-10,7,'ceramic','ink',2);r('ceramicShadow',7,h-3,w-14,2);r('white',9,h-6,w-18,1);
      // Perched bird has a head, wing, beak and two feet.
      rounded(w-16,3,10,6,'plum','ink',2);rounded(w-10,0,6,6,'purple','ink',1);
      r('plum',w-19,5,4,2);r('pale',w-14,5,3,1);r('white',w-7,2,1,1);r('gold',w-4,3,3,1);
      r('ink',w-13,8,1,2);r('ink',w-9,8,1,2);
      if(pulse>0){r('blue',8-sway,12,w-16+sway*2,1);r('blue',12+sway,10,w-24,1);}break;
    case 'wateringCan':
      // Transparent handle and rising spout stay clear of the can's shaded body.
      // Paint only the loop edge: its centre must reveal the room beneath it.
      r('ink',w-9,4,6,2);r('green',w-8,5,4,1);r('ink',w-9,15,6,2);r('green',w-8,15,4,1);
      r('ink',w-11,6,2,9);r('ink',w-3,6,2,9);r('green',w-10,7,1,7);r('green',w-3,7,1,7);
      rounded(10,5,15,h-5,'green','ink',2);r('leaf',12,6,10,2);r('plantShade',20,9,3,h-11);r('plantShade',12,h-3,10,1);
      r('ink',6,8,6,4);r('green',7,9,5,2);r('ink',4,5,4,5);r('green',5,6,2,3);
      r('ink',1,3,6,3);r('steel',2,4,4,1);r('ink',1,2,2,3);r('steelLight',2,3,1,1);
      r('ink',14,3,7,3);r('plantShade',15,4,5,1);r('leaf',13,10,1,6);
      if(pulse>.05){r('water',1,0,1,2);r('water',4,1-sway,1,2);}break;
    case 'gardenBench':
      r('ink',5,1,3,21);r('dark',6,2,1,18);r('ink',w-8,1,3,21);r('dark',w-7,2,1,18);
      for(const b of [0,7]){panel(2,b,w-4,6,'wood');r('light',4,b+1,w-8,1);}
      panel(1,16,w-2,8);r('light',2,17,w-4,2);r('dark',2,22,w-4,1);
      r('ink',4,24,5,h-24);r('steel',5,24,2,h-25);r('ink',w-9,24,5,h-24);r('steel',w-8,24,2,h-25);
      r('ink',0,11,3,11);r('dark',1,12,1,9);r('ink',w-3,11,3,11);r('dark',w-2,12,1,9);
      r('ink',0,10,10,3);r('wood',1,11,8,1);r('ink',w-10,10,10,3);r('wood',w-9,11,8,1);
      rounded(12,15+sway,18,6,'green','plantShade',2);r('leaf',15,16+sway,12,1);r('plantShade',15,19+sway,12,1);break;
    case 'frog':
      rounded(5,7-sway,w-10,12,'green','ink',3);r('leaf',8,9-sway,w-16,4);r('plantShade',8,17-sway,w-16,1);
      for(const a of [5,w-11]){rounded(a,3-sway,6,7,'green','ink',2);r('ceramic',a+1,5-sway,4,3);r('ink',a+3,6-sway,1,2);}
      rounded(1,13-sway,8,7,'green','ink',2);rounded(w-9,13-sway,8,7,'green','ink',2);
      r('leaf',3,14-sway,3,2);r('leaf',w-7,14-sway,3,2);
      r('ink',3,19-sway,7,2);r('green',4,19-sway,5,1);r('ink',w-10,19-sway,7,2);r('green',w-9,19-sway,5,1);
      r('ink',9,13-sway,w-18,1);r('ceramic',cx-2,10-sway,4,1);
      r('ink',w-2,10-sway,1,5);r('gold',w-4,12-sway,4,1);break;
    case 'hammock':
      // Tall wooden posts carry ropes and a curved cloth cradle, never a flat panel.
      r('ink',1,4,4,h-4);r('wood',2,5,2,h-7);r('light',2,5,1,h-8);
      r('ink',w-5,4,4,h-4);r('wood',w-4,5,2,h-7);r('light',w-4,5,1,h-8);
      r('ink',1,3,4,4);r('ink',w-5,3,4,4);r('wood',2,4,2,2);r('wood',w-4,4,2,2);
      for(let b=9;b<20+sway;b+=3){r('dark',4+Math.floor((b-9)/3),b,2,3);r('dark',w-6-Math.floor((b-9)/3),b,2,3);}
      r('ink',8,19+sway,w-16,6);r('pale',9,20+sway,w-18,4);
      r('ink',6,23+sway,w-12,9);r('purple',7,24+sway,w-14,7);
      r('ink',8,32+sway,w-16,7);r('purple',9,31+sway,w-18,6);
      r('ink',12,39+sway,w-24,4);r('plum',10,35+sway,w-20,3);r('purple',13,38+sway,w-26,4);
      r('pale',8,25+sway,w-16,2);r('pale',10,29+sway,2,5);r('plum',w-13,27+sway,3,7);
      rounded(11,20+sway,14,7,'ceramic','plum',2);r('white',14,21+sway,8,1);
      r('rose',24,30+sway,3,3);r('pale',25,31+sway,1,1);
      r('ink',0,h-3,7,3);r('wood',1,h-2,5,1);r('ink',w-7,h-3,7,3);r('wood',w-6,h-2,5,1);break;
    case 'desk':
      panel(0,9,w,15,'wood');r('light',2,11,w-4,1);r('dark',6,21,w-12,1);
      r('ink',4,24,5,h-24);r('wood',5,25,2,h-26);r('ink',w-9,24,5,h-24);r('wood',w-8,25,2,h-26);
      r('ink',9,13,w-20,7);r('paper',10,13,w-22,6);r('light',11,18,w-24,1);
      if(!state.claimed){star(14,13,'rose');r('purple',21,15,3,2);r('green',24,17,2,1);}
      rounded(w-9,4,6,9,'purple','ink',1);r('paper',w-7,1,1,6);r('rose',w-5,2,1,5);
      r('gold',5,13,1,6);r('ink',5,18,1,1);if(pulse>0)star(9,2-sway,'gold');break;
    case 'box':{
      // A small keepsake chest: lid, front, side and single brass clasp.
      const lift=Math.round(pulse*5);
      panel(1,7,w-2,h-7,'wood');r('dark',w-7,9,5,h-11);r('light',2,9,1,h-12);
      r('dark',4,12,w-11,1);r('dark',4,h-5,w-11,1);r('wood',4,13,w-11,h-19);
      if(pulse>.5){r('ink',3,5,w-7,4);r('pale',5,6,w-12,2);r('rose',9,7,4,1);}
      panel(0,2-lift,w,6,'wood');r('light',2,3-lift,w-4,1);r('dark',w-6,4-lift,4,3);
      r('ink',cx-2,8,5,5);r('gold',cx-1,9,3,3);r('ink',cx,11,1,1);
      r('ink',3,h-2,3,2);r('ink',w-6,h-2,3,2);break;}
    case 'mobile':
      r('ink',cx,0,1,6);r('ink',3,6,w-6,3);r('purple',4,7,w-8,1);r('pale',cx-2,5,5,1);
      for(const[a,b]of [[2,15],[cx-3,25],[w-9,14]]){
        r('plum',a+3,9,1,b-9);r('ink',a+3+sway,b,1,8);r('ink',a+sway,b+3,7,2);
        r('gold',a+3+sway,b+1,1,6);r('gold',a+1+sway,b+3,5,2);
        r('gold',a+2+sway,b+2,3,4);r('paper',a+3+sway,b+2,1,2);
      }break;
    case 'drawing':
      panel(0,0,w,h,'dark');r('ceramic',2,2,w-4,h-4);r('white',3,3,w-6,1);
      // Mira and Lumo are deliberately childlike, but both faces have clear shapes.
      r('dark',11,5,9,2);r('dark',9,7,13,7);r('paper',11,9,9,6);
      r('dark',10,8,3,3);r('dark',19,8,2,3);r('ink',13,11,1,1);r('ink',17,11,1,1);
      r('purple',11,15,9,6);r('pale',11,17,9,2);r('paper',9,16,2,4);r('paper',20,16,2,4);
      r('plum',12,21,3,4);r('plum',17,21,3,4);r('dark',11,25,4,1);r('dark',17,25,4,1);
      r('plum',31,8,12,10);r('pale',31,5,4,5);r('pale',39,5,4,5);r('pale',30,9,14,5);
      r('ink',32,11,10,6);r('ceramic',34,12,2,3);r('ceramic',38,12,2,3);
      r('purple',33,18,8,5);r('plum',34,23,6,2);r('purple',35,25,3,2);
      star(49,6-sway,'rose');r('rose',47,19,1,2);r('rose',48,20,1,2);r('rose',49,19,1,2);
      ctx.font='5px Undertale,monospace';ctx.fillStyle=C.ink;ctx.fillText('MI MEJOR AMIGA',x+3,y+h-4);break;
    case 'alcove':
      // Side-facing opening. No front-facing door or cabinet on the floor.
      r('#000',0,0,w,h);r('ink',w-4,0,4,h);r('dark',w-3,0,2,h);r('wood',w-2,1,1,h-2);
      r('dark',0,h-8,w-4,1);r('wood',0,h-7,w-4,1);r('dark',0,h-2,w-4,1);
      star(w-8,2,'gold');r('paper',w-6,3,1,1);break;
    default:return false;
    }
    return true;
  }
  return Object.freeze({draw,palette:Object.freeze(C)});
});
