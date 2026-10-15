/* Gaming computer POV. All UI is isolated inside <gaming-desktop>. */
(() => {
  'use strict';
  const ICONS = {
    determination: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="9" fill="#202d43"/><path d="M10 13h10v5h8v-5h10v15h-5v5h-5v5h-8v-5h-5v-5h-5Z" fill="#ff516a"/><path d="M12 15h6v3h-6Z" fill="#ffb2bd"/></svg>',
    fnf: '<img src="assets/props/funkin-icon.png" alt="" aria-hidden="true">',
    files: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#ffb844" d="M5 15a5 5 0 0 1 5-5h17l6 7h21a5 5 0 0 1 5 5v28a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z"/><path fill="#ffdd78" d="M5 25h54v25a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z"/><path stroke="#fff1bb" stroke-width="3" d="M12 31h40"/></svg>',
    notes: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#76d6ff" d="M12 5h39a4 4 0 0 1 4 4v47a4 4 0 0 1-4 4H12Z"/><path fill="#eafaff" d="M12 7h34v50H12Z"/><path stroke="#b9d7e6" stroke-width="2" d="M20 19h18M20 27h18M20 35h18M20 43h12"/><path stroke="#38a6d7" stroke-width="3" d="M8 13h8M8 22h8M8 31h8M8 40h8M8 49h8"/></svg>',
    calculator: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="11" y="4" width="42" height="56" rx="7" fill="#b8cbe5"/><rect x="17" y="10" width="30" height="13" rx="3" fill="#2d4770"/><g fill="#f4f8ff"><rect x="17" y="29" width="7" height="7" rx="2"/><rect x="29" y="29" width="7" height="7" rx="2"/><rect x="17" y="40" width="7" height="7" rx="2"/><rect x="29" y="40" width="7" height="7" rx="2"/><rect x="17" y="51" width="19" height="4" rx="2"/></g><path fill="#73c9ff" d="M41 29h7v7h-7Zm0 11h7v15h-7Z"/></svg>',
    settings: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#aac5e4" d="m26 4 12 0 2 8 6 3 8-2 6 10-6 6v7l6 6-6 10-8-2-6 3-2 8H26l-2-8-6-3-8 2-6-10 6-6v-7l-6-6 6-10 8 2 6-3Z"/><circle cx="32" cy="32" r="13" fill="#436187"/><circle cx="32" cy="32" r="7" fill="#dff5ff"/></svg>',
    power: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 3v9M7.2 5.7a8 8 0 1 0 9.6 0"/></svg>',
    windows: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3h8v8H3Zm10 0h8v8h-8ZM3 13h8v8H3Zm10 0h8v8h-8Z"/></svg>',
  };
  // One shared coordinate system for the seated camera, desk and hardware.
  // The front of the tower is parallel to the monitor; its visible depth goes
  // left toward the same eye point as the keyboard and desktop edges.
  const roomStyle = `
    .pov{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 43% 18%,#c2c0b4,#aaa99e 76%)}
    .pov:after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 43% 49%,transparent 40%,#37372e22);z-index:3}
    .station{position:absolute;left:50%;top:52%;width:min(94vw,calc(182vh - 150px),1540px);aspect-ratio:8/5;transform:translate(-50%,-50%);isolation:isolate}
    .room-backdrop{position:absolute;inset:0;z-index:-1;pointer-events:none}
    .wall-panels{position:absolute;left:calc(50% - 100vw);width:200vw;top:63%;height:100vh;border-top:8px solid #77776a;background:repeating-linear-gradient(0deg,#e3e2d8 0 28px,#b4b4a9 29px 32px,#eeede4 33px 35px);box-shadow:0 -3px 0 #d9d8c9,0 -5px 0 #66675b,inset 0 5px 8px #65675a36}
    .room-floor{position:absolute;left:calc(50% - 100vw);width:200vw;top:100%;height:100vh;background:repeating-linear-gradient(0deg,#d5d4c8 0 31px,#b8b9aa 32px 34px,#e6e5d9 35px 37px);box-shadow:inset 0 14px 28px #4a52432b}
    .wall-picture{position:absolute;border:3px solid #484b43;background:#dcdccb;padding:6px;box-shadow:3px 5px 4px #44463824,inset 0 0 0 2px #f2f0df;transform:none}
    .wall-picture:before{content:'';position:absolute;inset:7px;border:2px solid #92937f;pointer-events:none}
    .wall-picture svg{height:100%;background:#d2d1c1}
    .picture-left{left:-2%;top:0;width:14%;height:29%}
    .picture-center{left:48%;top:-15%;width:12%;height:34%;background:#c4c3b5}
    .picture-center:after{content:'';position:absolute;inset:12px;background:#aaa99b;box-shadow:inset 1px 1px 4px #61635318}
    .picture-right{left:98%;top:1%;width:17%;height:28%;background:#e7e5d7}
    .picture-right:after{content:'';position:absolute;inset:13px;border:1px solid #a6a58f;background:#d0cfbd}
    .desk{position:absolute;z-index:0;left:-14%;top:68%;width:128%;height:30%;clip-path:polygon(13.27% 0,81.27% 0,100% 100%,0 100%);background:linear-gradient(180deg,#888b78,#a3a58f 18%,#989b85 67%,#8f937c);box-shadow:inset 0 3px 0 #c9cbb1}
    .desk:before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(2deg,transparent 0 6px,#414c3210 7px,transparent 8px 15px);opacity:.28}
    .desk:after{content:'';position:absolute;left:19%;right:17%;top:5%;height:49%;background:radial-gradient(ellipse,#39403758,transparent 70%);filter:blur(9px)}
    .desk-apron{position:absolute;z-index:0;left:-14%;top:98%;width:128%;height:5%;background:linear-gradient(#b1b39a 0 9%,#707663 12% 86%,#555b4e 90%);border-top:1px solid #d8d9bd;box-shadow:0 10px 15px #3d423744}
    .setup{position:absolute;left:8%;top:17%;width:84%;height:66%;display:flex;align-items:flex-end;gap:6%;padding:0;transform:none;z-index:1}
    .monitor-rig{position:relative;flex:0 0 74%;min-width:0;padding-bottom:5%;z-index:2}
    .monitor{position:relative;padding:1.2% 1.2% 2.7%;border:1px solid #32362f;border-radius:5px;background:linear-gradient(145deg,#686c5e,#353a34 12%,#2d312c 90%,#555c4d);box-shadow:0 10px 18px #3c413b38,inset 0 1px 0 #b4b6a0,inset 2px 0 0 #83897655}
    .monitor:before{content:'';position:absolute;top:.75%;left:4%;right:4%;height:1px;background:linear-gradient(90deg,transparent,#e1e5cd44,transparent)}
    .monitor:after{content:'';position:absolute;bottom:2.4%;left:47%;width:6%;height:2px;border-radius:1px;background:#b0b49c88}
    .screen{border-radius:1px;aspect-ratio:16/9;max-height:none;box-shadow:0 0 0 2px #141c1b,0 0 16px #93ccde12;container-type:inline-size;container-name:pc-display}
    .monitor-led{position:absolute;right:3%;bottom:3.2%;width:3px;height:3px;border-radius:50%;background:#95dab9;box-shadow:0 0 4px #8fdfb966}
    .stand{position:absolute;left:45%;bottom:2%;width:10%;height:11%;background:linear-gradient(90deg,#41463b,#686f5c 46%,#333b32);clip-path:polygon(22% 0,78% 0,100% 100%,0 100%);z-index:-1}
    .stand-base{position:absolute;bottom:0;left:36%;width:28%;height:4.2%;border-radius:3px;background:linear-gradient(180deg,#8d927d,#666e5c 50%,#464e40 55%);box-shadow:0 5px 5px #363d3855;clip-path:polygon(10% 0,90% 0,100% 80%,97% 100%,3% 100%,0 80%)}
    .tower{position:relative;flex:0 0 20%;height:100%;margin:0;border:2px solid #737563;border-radius:3px;background:linear-gradient(100deg,#464940,#272d29 20% 86%,#444c3c);box-shadow:6px 9px 9px #42473555,inset 0 0 0 2px #222a23;transform:none;z-index:1}
    .tower:before{content:'';position:absolute;left:-21.5%;top:-1.94%;width:121.5%;height:2.1%;clip-path:polygon(0 0,74.27% 0,100% 100%,17.7% 100%);background:linear-gradient(160deg,#7a7c69,#555b4e);box-shadow:inset 0 1px #b5b69b}
    .tower:after{content:'';position:absolute;left:-21.5%;top:-1.94%;width:21.5%;height:101.94%;clip-path:polygon(0 0,100% 1.9%,100% 100%,0 88.3%);background:linear-gradient(90deg,#51584a,#373f35);border-left:1px solid #777d68}
    .tower-top{position:absolute;inset:5% 10% auto;display:flex;align-items:center;justify-content:space-between;height:5%;padding:0}
    .power-dot{display:block;width:7%;aspect-ratio:1;border-radius:50%;background:#a3e1da;border:1px solid #5a8d85;box-shadow:0 0 5px #8cddd575}
    .usb{width:21%;height:24%;border:1px solid #626c5b;background:#171f1a}
    .tower-glass{position:absolute;inset:14% 9% 10%;display:grid;grid-template-rows:repeat(2,minmax(0,1fr));gap:4%;padding:5% 3%;place-items:center;border:1px solid #6b796344;border-radius:2px;background:linear-gradient(112deg,#b1cbb712,transparent 24% 77%,#efffeb09),#16201c;overflow:hidden}
    .tower-glass:after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 3px,#06120e22 3px 4px)}
    .fan{position:relative;width:88%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#1d3436,#091a1a 70%);box-shadow:0 0 12px #62d8e225}
    .fan:before{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 10deg,#77e1ee,#a78ce8,#b29bed,#64dbeb,#77e1ee);mask:radial-gradient(transparent 0 59%,black 60% 70%,transparent 71%);box-shadow:0 0 5px #a9e6eb55}
    .fan:nth-child(2){box-shadow:0 0 12px #ac86dc22}.fan:nth-child(2):before{background:conic-gradient(from 140deg,#ac8be8,#67d7e8,#8ec6f0,#ae84e7,#ac8be8)}
    .blades{position:absolute;inset:14%;border-radius:50%;background:repeating-conic-gradient(from 20deg,#476a6ab3 0deg 16deg,#7ca3a070 17deg 35deg,transparent 39deg 51deg);animation:spin 1.65s linear infinite;box-shadow:inset 0 0 7px #a6d3d033}
    .fan:nth-child(2) .blades{animation-duration:1.85s}
    .fan:after{content:'';position:absolute;inset:38%;border-radius:50%;background:radial-gradient(circle at 35% 25%,#758d83,#263d36 70%);border:1px solid #9cb5a144;box-shadow:0 1px 3px #0008}
    .tower-badge{position:absolute;left:40%;right:40%;bottom:4%;height:1.2%;background:#a5aa90;box-shadow:inset 0 1px #d6dcc1}
    .tower-feet{position:absolute;bottom:-2%;left:10%;right:10%;height:2%;display:flex;justify-content:space-between}.tower-feet i{width:18%;background:#353c30;border-bottom:1px solid #20291e}
    .keyboard{position:absolute;z-index:2;left:18.58%;top:85%;width:41%;height:10%;display:flex;flex-direction:column;gap:3%;padding:.65% .8% .9%;border:1px solid #454d3d;border-radius:4px;background:linear-gradient(#535b48,#8e927a 3%,#454d3e 9% 90%,#323c2d 95%);transform:perspective(700px) rotateX(27deg);transform-origin:center top;box-shadow:0 7px 7px #3d463750,inset 0 1px #ccd0b3}
    .key-row{display:flex;flex:1;gap:.65%;min-height:0}.key{display:flex;align-items:center;justify-content:center;flex:var(--key-width,1);min-width:0;border:1px solid #b2b79c33;border-radius:1px;background:linear-gradient(#7c826e,#676f5b 80%);box-shadow:0 1px 0 #2d3828;color:#e0e0ca;font:clamp(3px,.48vw,7px)/1 'Segoe UI',sans-serif;font-style:normal;white-space:nowrap}
    .key-row:last-child .key{background:linear-gradient(#858a74,#727a63)}
    .exit-room{background:#333b32ed;border-color:#e5e8d03b;color:#f5f5e8;box-shadow:0 2px 8px #3b403326}.exit-room:hover{background:#4c5747}
    .hint{bottom:13px;right:22px;color:#353e2c;font-size:9px}.hint kbd{border-color:#4a55464d;background:#e0e2cf88;color:#293426}
    @media(max-width:700px){.station{width:106vw;top:52%}.wall-panels{border-top-width:5px;background-size:auto 24px}.wall-picture{border-width:2px;padding:3px}.wall-picture:before{inset:4px;border-width:1px}.picture-center:after{inset:7px}.picture-right:after{inset:8px}.tower{border-width:1px}.keyboard{border-radius:2px}.monitor{border-radius:3px}.monitor-led{width:2px;height:2px}.hint{display:none}}
    @media(max-width:700px) and (orientation:portrait){.station{width:112vw;top:48%}.picture-left{top:-12%}.picture-center{top:-27%}.picture-right{top:-10%}}
    @media(max-height:550px) and (orientation:landscape){.station{width:min(94vw,calc(190vh - 96px));top:53%}.hint{display:none}.exit-room{top:10px;left:12px;padding:8px 12px}}
    @container pc-display (max-width:520px){.icons{top:5px;left:5px;height:min(160px,calc(100% - 32px));grid-template-rows:repeat(3,minmax(0,1fr));gap:0 2px}.app-icon{height:100%;width:53px;min-height:0;padding:0 1px;font-size:7px;line-height:1.1;gap:0}.app-icon .icon-art{width:20px;height:20px;flex-shrink:0}.song-progress,.system-name{display:none}.taskbar{height:24px;gap:2px}.task-icon{height:22px;width:24px;padding:5px}.tray{font-size:6px;right:5px;gap:5px}.window-layer{bottom:24px}.fnf-download{bottom:27px!important;font-size:6px!important}.desktop-word strong{font-size:12px}.desktop-word span{font-size:5px}}
    @container pc-display (max-width:250px){.icons{gap:0 1px}.app-icon{width:44px;font-size:6px}.app-icon .icon-art{width:15px;height:15px}.tray{font-size:5px;gap:2px}.taskbar{justify-content:flex-start;padding-left:3px}.task-icon{width:21px}}
    @media(prefers-reduced-motion:reduce){.blades{animation:none}}
  `;
  const style = `
    :host{--ice:#6ce8ff;--pink:#ee74db;--muted:#98acc6;--volume:1;position:fixed;inset:0;z-index:1000;display:block;color:#f1f7ff;font:14px 'Segoe UI',system-ui,sans-serif;color-scheme:dark;background:#080b15} :host([hidden]){display:none!important}
    *{box-sizing:border-box}button,input,textarea{font:inherit}button{color:inherit;cursor:pointer}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid #72ddff;outline-offset:3px}button{border:0}button:disabled{opacity:.4;cursor:default}svg{display:block;width:100%;height:100%}.icon-art img,.task-icon img,.small-icon img{display:block;width:100%;height:100%;object-fit:contain}[hidden]{display:none!important}
    .exit-room{position:absolute;z-index:5;left:24px;top:22px;display:flex;gap:10px;align-items:center;border:1px solid #e2efff24;background:#101827b3;padding:11px 17px;border-radius:30px;backdrop-filter:blur(10px);font-size:12px;letter-spacing:.03em}.exit-room:hover{background:#1b2a42}.exit-room span{opacity:.5;font-size:10px}.screen{position:relative;aspect-ratio:16/9;border-radius:4px;overflow:hidden;border:1px solid #050910;background:#111e38;box-shadow:0 0 1px 1px #ffffff0b;isolation:isolate;filter:brightness(var(--brightness,1));touch-action:manipulation}.power-dot{width:11px;height:11px;border:1px solid #96e7ef;border-radius:50%;box-shadow:0 0 8px #91e5ed50;background:#42676b}.usb{width:17px;height:4px;background:#070b11;border:1px solid #424b61}
    .desktop{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 76% 30%,#79578c 0%,transparent 52%),radial-gradient(ellipse at 22% 65%,#266890 0%,transparent 55%),linear-gradient(125deg,#16324e,#233459 40%,#293351 65%,#101e36)}.wallpaper-shape{position:absolute;pointer-events:none;left:24%;top:8%;width:66%;height:82%;border-radius:47% 8% 40% 9%;transform:rotate(-24deg);background:linear-gradient(135deg,#8cdce820,#bddbff07 50%,#c099df40);box-shadow:inset 3px 1px 0 #b7d4ff22,35px 25px 70px #03051d55;filter:blur(.3px)}.wallpaper-shape:after{content:'';position:absolute;inset:12% 14% 7% 20%;border-radius:42% 5% 40% 8%;background:linear-gradient(145deg,#9edff42c,#2a385922);box-shadow:inset 2px 0 #d3eaff36}.desktop-word{position:absolute;right:6%;bottom:17%;text-align:right;color:#dbeaff8c;pointer-events:none}.desktop-word strong{display:block;font-size:clamp(15px,2.3vw,32px);font-weight:300;letter-spacing:.2em}.desktop-word span{display:block;font-size:clamp(8px,.85vw,12px);letter-spacing:.2em;margin-top:8px;color:#bacce366}
    .icons{position:absolute;top:19px;left:17px;display:grid;grid-template-rows:repeat(3,82px);grid-auto-flow:column;gap:5px 10px;z-index:2}.app-icon{width:74px;height:80px;padding:7px 4px;background:transparent;border:1px solid transparent;border-radius:5px;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:10px;text-shadow:0 1px 3px #000;transition:background .15s,border-color .15s,transform .15s}.app-icon:hover{background:#ccedff16;border-color:#e9faff26;transform:translateY(-1px)}.app-icon .icon-art{width:44px;height:44px;filter:drop-shadow(0 3px 3px #0004)}.app-icon.fnf{position:relative}.app-icon.fnf:after{content:'';position:absolute;top:6px;right:11px;width:5px;height:5px;border-radius:50%;background:#6bffd6;box-shadow:0 0 9px #3effc7}.song-progress{position:absolute;top:20px;right:21px;background:#0d193745;border:1px solid #dae8ff1a;border-radius:12px;padding:10px 15px;font-size:10px;color:#c5d5e7;display:flex;align-items:center;gap:8px;z-index:1;backdrop-filter:blur(10px)}.song-progress .dot{width:5px;height:5px;border-radius:50%;background:#99d5ed}.progress-label{white-space:nowrap}
    .taskbar{position:absolute;bottom:0;left:0;right:0;height:38px;background:#0b173bbf;backdrop-filter:blur(24px);border-top:1px solid #a8d2ff24;z-index:40;display:flex;align-items:center;justify-content:center;gap:5px;box-shadow:0 -4px 20px #0001}.task-icon{height:30px;width:32px;background:transparent;border-radius:5px;padding:7px;transition:background .15s}.task-icon:hover,.task-icon.active{background:#d3eaff16}.task-icon.active{box-shadow:inset 0 -2px #86d7fc}.task-icon svg{filter:drop-shadow(0 1px 1px #0003)}.task-icon.start{color:#91d5ff}.tray{position:absolute;right:12px;display:flex;align-items:center;gap:10px;font-size:9px;color:#dbe8ff}.tray-time{text-align:right;line-height:1.4}.tray-volume{font-size:14px;line-height:1}.system-name{position:absolute;left:13px;display:flex;gap:5px;align-items:center;font-size:8px;letter-spacing:.06em;color:#a5bcdb}.system-name b{width:4px;height:4px;background:#81e7c9;border-radius:50%}
    .window-layer{position:absolute;inset:0 0 38px;z-index:10;pointer-events:none}.app-window{position:absolute;width:min(520px,80%);height:min(320px,87%);left:50%;top:48%;transform:translate(-50%,-50%);border-radius:10px;background:#172338ef;border:1px solid #a6bfd544;box-shadow:0 18px 55px #0008;overflow:hidden;display:flex;flex-direction:column;backdrop-filter:blur(24px);pointer-events:auto}.window-header{height:36px;flex:0 0 36px;padding-left:12px;background:#202f46b3;display:flex;align-items:center;justify-content:space-between;cursor:move;user-select:none;touch-action:none;border-bottom:1px solid #a1c2f015}.window-title{display:flex;align-items:center;gap:8px;font-size:11px}.window-title .small-icon{width:16px;height:16px}.window-close{height:35px;width:40px;background:transparent;font-size:20px;line-height:1;color:#c2d1e5}.window-close:hover{background:#db4968;color:#fff}.window-body{flex:1;overflow:auto;min-height:0}.window-footer{padding:7px 14px;border-top:1px solid #bad7ff14;font-size:9px;color:#a7b6cf;flex-shrink:0;display:flex;justify-content:space-between;gap:8px}.notes{width:100%;height:100%;resize:none;border:0;padding:18px;background:#172338;color:#edf7ff;line-height:1.7;font:12px/1.7 'Segoe UI',sans-serif;outline-offset:-3px}.notes::placeholder{color:#8296b5}.files-head{padding:14px 18px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #9dc2ff12}.files-head div:first-child{font-size:12px;font-weight:600}.files-head small{font-size:9px;color:#9bb0ca}.song-list{padding:9px 12px;display:flex;flex-direction:column;gap:5px}.song-card{display:flex;align-items:center;gap:12px;text-align:left;background:#ffffff04;border:1px solid #afcfff16;border-radius:7px;padding:10px 12px;min-height:47px}.song-card:hover{background:#95caff15;border-color:#99d9ef4d}.song-note{height:26px;width:26px;border-radius:6px;background:linear-gradient(140deg,#8146a0,#306d91);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}.song-card.completed .song-note{background:#2f756c}.song-title{font-size:11px;font-weight:600;flex:1}.song-state{font-size:9px;color:#89d6c8}.song-card:not(.completed) .song-state{color:#abc0dc}.play-arrow{font-size:13px;color:#77e0f7}.files-empty{padding:30px 18px;color:#9fb0c8;text-align:center;font-size:12px;line-height:1.6}
    .calculator-window{width:min(265px,72%);height:min(350px,94%)}.calculator-body{padding:12px;display:flex;flex-direction:column;gap:11px}.calc-display{width:100%;height:54px;text-align:right;padding:7px 12px;background:#0d182a;border:1px solid #789ccf33;border-radius:6px;color:#f0f7ff;font-size:24px;font-weight:300}.calc-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.calc-key{min-height:31px;background:#2b3b53;border:1px solid #a4c4ee10;border-radius:5px;font-size:13px}.calc-key:hover{background:#405778}.calc-key.operator{background:#334d6b;color:#9fdfff}.calc-key.equals{background:#86d4ed;color:#112234}.calc-key.clear{color:#f3acc9;background:#50314b}.settings-body{padding:22px 24px}.setting-row{margin-bottom:23px}.setting-title{font-size:12px;display:flex;justify-content:space-between;margin-bottom:11px}.setting-title output{font-size:10px;color:#a9cdeb}.setting-row input[type=range]{width:100%;accent-color:#89dbf0;cursor:pointer}.settings-about{border-top:1px solid #a6c8ff1a;padding-top:17px;color:#98afce;font-size:10px;line-height:1.7}.settings-about strong{color:#d9e7fc;font-weight:500}.quick-panel{position:absolute;bottom:45px;left:50%;transform:translateX(-50%);width:260px;padding:20px;background:#17253bf2;border:1px solid #a0c4ed33;box-shadow:0 10px 40px #0009;border-radius:12px;backdrop-filter:blur(25px);z-index:45}.quick-panel h3{margin:0 0 16px;font-size:13px;font-weight:500}.quick-panel p{font-size:11px;color:#9eb0cc;margin:0 0 17px;line-height:1.6}.quick-apps{display:flex;gap:7px;flex-wrap:wrap}.quick-apps button{background:#b8dfff0a;border:1px solid #a9d0ff16;border-radius:7px;padding:10px 12px;font-size:10px;display:flex;align-items:center;gap:7px}.quick-apps button:hover{background:#b8dfff22}.quick-apps .small-icon{width:19px;height:19px}.quick-power{margin-top:16px;border-top:1px solid #d5eaff15;padding-top:12px}.quick-power button{display:flex;gap:8px;align-items:center;background:transparent;padding:3px 0;color:#b0c6e2;font-size:10px}.quick-power svg{height:16px;width:16px}
    .toast{position:absolute;right:15px;bottom:50px;max-width:265px;padding:12px 16px;background:#152940e8;border:1px solid #92cce34d;border-radius:8px;z-index:60;font-size:11px;color:#d0e7f9;box-shadow:0 8px 22px #0005;animation:toast-in .2s ease-out}.custom-cursor{position:absolute;left:0;top:0;width:24px;height:30px;pointer-events:none;z-index:100;display:none;transform:translate(-2px,-2px);filter:drop-shadow(0 0 5px #8be3ffb0)}.custom-cursor path{fill:#ecfaff;stroke:#365d7b;stroke-width:1.3}.custom-cursor:after{content:'';position:absolute;left:-5px;top:-5px;width:11px;height:11px;border:1px solid #93eaff80;border-radius:50%;animation:cursor-pulse 1.8s ease-out infinite}.custom-cursor.press{transform:translate(-2px,-2px) scale(.86)}.custom-cursor.interactive path{fill:#96f3ff}.screen.cursor-enabled,.screen.cursor-enabled *{cursor:none!important}.screen.cursor-enabled .custom-cursor{display:block}
    .game-host{position:absolute;inset:0;z-index:70;overflow:hidden;background:#06070c}.game-host>*{width:100%;height:100%}.hint{position:absolute;bottom:18px;right:24px;font-size:9px;color:#7787a4;letter-spacing:.04em;z-index:2}.hint kbd{font:8px 'Segoe UI';border:1px solid #8494b333;padding:2px 5px;border-radius:3px;margin-right:6px}.loading-banner{position:absolute;top:15px;left:50%;transform:translateX(-50%);z-index:90;background:#11213de8;border:1px solid #a8ddff44;border-radius:9px;padding:10px 16px;color:#d6eaff;font-size:11px;box-shadow:0 10px 30px #0007;display:flex;align-items:center;gap:9px;white-space:nowrap}.loading-spinner{height:11px;width:11px;border-radius:50%;border:2px solid #8adfff33;border-top-color:#8adfff;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}@keyframes rgb{to{filter:hue-rotate(360deg)}}@keyframes cursor-pulse{0%{transform:scale(.5);opacity:.7}80%,100%{transform:scale(2.6);opacity:0}}@keyframes toast-in{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
    @media(min-width:1500px){.icons{grid-template-rows:repeat(3,94px);gap:10px 18px}.app-icon{width:87px;height:88px;font-size:12px}.app-icon .icon-art{width:49px;height:49px}.taskbar{height:44px}.window-layer{bottom:44px}.app-window{width:610px;height:365px}.window-title{font-size:13px}.window-header{height:40px;flex-basis:40px}.calculator-window{width:295px;height:375px}.calc-key{min-height:37px}.song-title{font-size:13px}.song-card{padding:12px}.song-state,.window-footer,.tray{font-size:10px}}
    @media(max-width:1050px){.power-dot{width:8px;height:8px}.usb{width:11px;height:3px}.icons{grid-template-rows:repeat(3,65px);gap:2px 3px;top:12px;left:9px}.app-icon{width:61px;height:63px;font-size:8px;padding:5px 2px;gap:4px}.app-icon .icon-art{width:34px;height:34px}.song-progress{top:12px;right:12px;font-size:8px;padding:8px 10px}.app-window{width:min(450px,85%);height:88%}.notes{font-size:11px;padding:12px}.settings-body{padding:15px 18px}.setting-row{margin-bottom:13px}.settings-about{padding-top:10px;font-size:9px}.calculator-window{width:235px;max-width:78%;height:95%;top:49%}.calculator-body{padding:8px;gap:6px}.calc-display{height:36px;font-size:19px}.calc-key{min-height:23px;font-size:11px}.calc-keys{gap:4px}.desktop-word{bottom:22%}.taskbar{height:33px}.window-layer{bottom:33px}.task-icon{height:27px;width:29px;padding:6px}.tray{font-size:8px;gap:7px;right:8px}.system-name{font-size:7px;left:8px}.files-head{padding:10px 12px}.files-head div:first-child{font-size:11px}.song-card{padding:7px 10px;min-height:42px;gap:8px}.song-title{font-size:10px}.song-state{font-size:8px}.song-list{padding:7px 9px}}
    @media(max-width:700px){.exit-room{top:14px;left:14px;padding:8px 12px;font-size:10px}.exit-room span{display:none}.power-dot{height:5px;width:5px}.usb{width:8px;height:2px}.icons{grid-template-rows:repeat(3,46px);top:7px;left:6px;gap:1px}.app-icon{height:45px;width:45px;font-size:6px;gap:2px;padding:3px 1px;border-radius:3px}.app-icon .icon-art{height:25px;width:25px}.app-icon.fnf:after{width:3px;height:3px;top:3px;right:7px}.song-progress{padding:5px 7px;right:7px;top:7px;border-radius:5px;font-size:6px;gap:5px}.song-progress .dot{width:3px;height:3px}.taskbar{height:24px;gap:2px}.task-icon{height:22px;width:24px;padding:5px}.tray{font-size:5.5px;right:5px;gap:5px}.tray-volume{font-size:10px}.system-name{display:none}.window-layer{bottom:24px}.app-window{height:94%;width:84%;border-radius:5px;top:50%}.window-header{height:24px;flex-basis:24px;padding-left:8px}.window-title{font-size:8px;gap:5px}.window-title .small-icon{width:12px;height:12px}.window-close{height:23px;width:30px;font-size:15px}.window-footer{font-size:6px;padding:4px 8px}.notes{font-size:8px;padding:8px;line-height:1.5}.files-head{padding:6px 9px;gap:5px}.files-head div:first-child{font-size:8px}.files-head small{font-size:6px}.song-list{padding:5px 7px;gap:3px}.song-card{padding:5px 7px;min-height:28px;gap:6px;border-radius:4px}.song-note{width:19px;height:19px;font-size:12px;border-radius:4px}.song-title{font-size:8px}.song-state{font-size:6px}.play-arrow{font-size:10px}.files-empty{padding:13px;font-size:9px}.desktop-word{right:6%;bottom:22%}.desktop-word strong{font-size:12px;letter-spacing:.15em}.desktop-word span{font-size:5px;margin-top:5px}.calculator-window{width:160px;height:97%}.calculator-body{padding:5px;gap:4px}.calc-display{height:25px;font-size:14px;padding:3px 6px}.calc-keys{gap:2px}.calc-key{min-height:17px;font-size:8px;border-radius:3px}.settings-body{padding:9px 12px}.setting-row{margin-bottom:8px}.setting-title{font-size:8px;margin-bottom:4px}.setting-title output{font-size:7px}.setting-row input[type=range]{height:10px}.settings-about{font-size:6px;padding-top:6px;line-height:1.4}.quick-panel{bottom:29px;width:190px;border-radius:7px;padding:12px}.quick-panel h3{font-size:10px;margin-bottom:8px}.quick-panel p{font-size:8px;margin-bottom:10px}.quick-apps{gap:4px}.quick-apps button{font-size:7px;padding:6px 8px;gap:5px}.quick-apps .small-icon{width:14px;height:14px}.quick-power{margin-top:10px;padding-top:8px}.quick-power button{font-size:8px}.quick-power svg{height:12px;width:12px}.toast{font-size:8px;bottom:31px;right:8px;max-width:190px;padding:8px 10px;border-radius:5px}.hint{bottom:15px;right:14px;font-size:8px}.custom-cursor{width:17px;height:23px}.loading-banner{font-size:8px;top:8px;padding:7px 10px;border-radius:5px}.loading-spinner{height:8px;width:8px}}
    @media(max-width:700px) and (orientation:portrait){.app-window{height:90%;top:49%;width:88%}.calculator-window{width:160px;max-width:75%}.calc-key{min-height:23px}.icons{grid-template-rows:repeat(3,50px)}.app-icon{height:49px}.taskbar{justify-content:flex-start;padding-left:8px}.desktop-word strong{font-size:10px}.settings-body{padding:13px}.setting-row{margin-bottom:15px}.settings-about{font-size:7px}.notes{font-size:9px}.window-title{font-size:9px}.song-title{font-size:9px}.song-card{min-height:33px}.song-state{font-size:7px}.files-head div:first-child{font-size:9px}.quick-panel{left:45%}}
    @media(max-height:550px) and (min-width:701px){.keyboard,.mouse{display:none}.hint{bottom:8px}.exit-room{top:11px;left:13px;padding:8px 12px}}

    .tower-glass{display:grid;grid-template-rows:repeat(3,minmax(0,1fr));gap:8px;padding:8px 0;justify-items:center}
    @media(max-width:1050px) and (min-width:701px){}
    @media(max-height:550px) and (min-width:701px){}
    @media(max-width:700px) and (orientation:landscape){.keyboard,.mouse{display:none}}
    @media(prefers-reduced-motion:reduce){.custom-cursor:after{animation:none;opacity:.4}.app-icon{transition:none}.toast{animation:none}}
    .html-app{position:absolute;inset:0;z-index:60;background:#000;overflow:hidden;animation:html-app-in .22s ease-out}.html-app-stage{position:absolute;inset:0;overflow:hidden}.html-app iframe{position:absolute;left:50%;top:50%;border:0;background:#000;transform-origin:center}.html-app-return{position:absolute;top:7px;left:7px;z-index:2;padding:6px 9px;border:1px solid #d8eaff44;border-radius:5px;background:#152032db;color:#fff;font-size:clamp(7px,1vw,11px);cursor:pointer}.html-app-return:hover{background:#304664}.screen.html-active,.screen.html-active *{cursor:auto!important}.screen.html-active .custom-cursor{display:none}
    @keyframes html-app-in{from{opacity:0;filter:brightness(.6)}to{opacity:1;filter:brightness(1)}}@media(prefers-reduced-motion:reduce){.html-app{animation:none}}
    ${roomStyle}
    .pc-expand{position:absolute;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:1200;min-height:40px;padding:8px 12px;display:flex;align-items:center;gap:7px;border:1px solid #b9dfff40;border-radius:8px;background:#101827e8;font-size:11px;color:#eef7ff}.pc-expand:hover{background:#293b53}.pc-expand .expand-symbol{font-size:19px;line-height:1}
    .screen.game-active,.screen.game-active *{cursor:auto!important}.screen.game-active .custom-cursor{display:none!important}
    :host([screen-expanded]) .station{inset:0;transform:none;width:100%;height:100%;aspect-ratio:auto}
    :host([screen-expanded]) .pov:after{display:none}
    :host([screen-expanded]) .room-backdrop,:host([screen-expanded]) .desk,:host([screen-expanded]) .desk-apron,:host([screen-expanded]) .keyboard{display:none}
    :host([screen-expanded]) .setup{inset:0;left:0;top:0;transform:none;width:100%;height:100%;padding:0;display:block}
    :host([screen-expanded]) .monitor-rig{width:100%;height:100%;padding:0}
    :host([screen-expanded]) .monitor{height:100%;padding:0;border:0;border-radius:0;box-shadow:none;background:#000}
    :host([screen-expanded]) .screen{width:100%;height:100%;max-height:none;aspect-ratio:auto;border:0;border-radius:0}
    :host([screen-expanded]) .tower,:host([screen-expanded]) .keyboard,:host([screen-expanded]) .mouse,:host([screen-expanded]) .stand,:host([screen-expanded]) .stand-base,:host([screen-expanded]) .monitor-led,:host([screen-expanded]) .monitor:before,:host([screen-expanded]) .monitor:after,:host([screen-expanded]) .pov-label,:host([screen-expanded]) .hint,:host([screen-expanded]) .exit-room{display:none}
    @media(max-width:700px){.pc-expand{min-width:40px;min-height:40px;padding:8px}.pc-expand .expand-label{display:none}}
  `;

  class GamingDesktop extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode:'open'});
      this._songs = [];
      this._gameActive = false;
      this._open = false;
      this._windows = new Map();
      this._apps = new Map(); this._appCleanup = new Map();
      this._z = 12;
      this._timers = [];
      this._volume = this._readNumber('pc-room-volume', 1, 0, 1);
      this._brightness = this._readNumber('pc-room-brightness', 1, .5, 1.3);
      this._nowPlaying = '';
      this._fullscreenToken = 0;
      this._ownsFullscreen = false;
      this._render();
      this._onPreload = () => this._updatePreload();
      this._onFullscreenChange = () => {
        if (this._ownsFullscreen && document.fullscreenElement !== this) {
          this._ownsFullscreen = false;
          ++this._fullscreenToken;
          this.removeAttribute('screen-expanded');
          this._updateExpandControl();
          this._focusApplication();
        }
      };
      this._onKey = e => {
        if (!this._open || this._gameActive) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.hasAttribute('screen-expanded') ? this.setExpanded(false) : this._htmlFrame ? this._closeHtmlApp() : this.close(); }
      };
    }

    connectedCallback() {
      if (!this._open) this.hidden = true;
      document.addEventListener('keydown', this._onKey, true);
      document.addEventListener('fullscreenchange', this._onFullscreenChange);
      window.addEventListener('fnf:preload', this._onPreload);
      this._updatePreload();
      this._clockTick();
      this._clockInterval = setInterval(() => this._clockTick(), 1000);
    }

    disconnectedCallback() {
      this._disposeCustomApps();
      this._closeHtmlApp(false);
      document.removeEventListener('keydown', this._onKey, true);
      document.removeEventListener('fullscreenchange', this._onFullscreenChange);
      this.setExpanded(false);
      window.removeEventListener('fnf:preload', this._onPreload);
      clearInterval(this._clockInterval);
      clearTimeout(this._toastTimer);
      clearTimeout(this._loadingTimer);
      this._timers.forEach(clearTimeout);
    }

    get gameHost() { return this.shadowRoot.querySelector('.game-host'); }

    _updatePreload() {
      const status = this.shadowRoot.querySelector('.fnf-download');
      const state = window.FnfPreload?.getState();
      if (!status || !state) return;
      status.hidden = ['waiting','unavailable'].includes(state.phase);
      const percent = state.totalBytes ? Math.floor(state.bytes / state.totalBytes * 100) : 0;
      status.textContent = state.phase === 'ready' ? 'FNF · Archivos descargados' : state.phase === 'paused' ? 'FNF · La descarga continuará al jugar' : `${state.downloadedBytes ? 'Descargando' : 'Preparando'} FNF · ${percent}%`;
    }
    get volume() { return this._volume; }
    get gameActive() { return this._gameActive; }

    open() {
      this._open = true;
      this.hidden = false;
      this.showDesktop();
      this._clockTick();
      this.shadowRoot.querySelector('.exit-room').focus({preventScroll:true});
    }

    close() {
      if (this._gameActive) return;
      this.setExpanded(false);
      this._disposeCustomApps();
      this._closeHtmlApp(false);
      this._open = false;
      this.hidden = true;
      this._emit('pc:close');
    }

    showDesktop() {
      this._closeHtmlApp(false);
      this.setGameVisible(false);
      this._setLoading(false);
      this._updateProgress();
    }

    setGame(element) {
      if (element && !(element instanceof Element)) throw new TypeError('setGame expects a DOM element.');
      this.gameHost.replaceChildren(...(element ? [element] : []));
      return this.gameHost;
    }

    setGameVisible(visible) {
      this._gameActive = Boolean(visible);
      this.gameHost.hidden = !this._gameActive;
      this.shadowRoot.querySelector('.screen').classList.toggle('game-active',this._gameActive);
      this.shadowRoot.querySelector('.desktop').inert = this._gameActive;
      if (this._gameActive) {
        this._open = true;
        this.hidden = false;
        this._setLoading(false);
      }
    }

    async setExpanded(expanded) {
      const token = ++this._fullscreenToken;
      this.toggleAttribute('screen-expanded',Boolean(expanded));
      this._updateExpandControl();
      if (!expanded) {
        this._ownsFullscreen = false;
        if (document.fullscreenElement === this) {
          try { await document.exitFullscreen(); } catch { /* Keep the in-page view usable. */ }
        }
      } else if (!document.fullscreenElement && typeof this.requestFullscreen === 'function') {
        try {
          await this.requestFullscreen();
          if (token !== this._fullscreenToken) {
            if (document.fullscreenElement === this) await document.exitFullscreen();
          } else this._ownsFullscreen = document.fullscreenElement === this;
        } catch { /* Mobile and restricted frames can still expand within the page. */ }
      }
      if (token === this._fullscreenToken) this._focusApplication();
    }

    _updateExpandControl() {
      const expanded = this.hasAttribute('screen-expanded');
      const button = this.shadowRoot.querySelector('.pc-expand');
      const label = expanded ? 'Reducir pantalla de la PC' : 'Ampliar pantalla de la PC';
      button.setAttribute('aria-pressed',String(expanded));
      button.setAttribute('aria-label',label);
      button.title = label;
      button.querySelector('.expand-label').textContent = expanded ? 'Reducir pantalla' : 'Ampliar pantalla';
    }

    _focusApplication() {
      const frame = this._gameActive ? this.gameHost.firstElementChild?.iframe : this._htmlFrame;
      frame?.focus({preventScroll:true});
      frame?.contentWindow?.focus();
    }

    setSongs(songs) {
      this._songs = (Array.isArray(songs) ? songs : []).map((song, index) => ({
        id: String(song.id ?? index), name: String(song.name ?? song.id ?? 'Canción'), completed: Boolean(song.completed)
      }));
      this._updateProgress();
      const files = this._windows.get('files');
      if (files) this._fillFiles(files.querySelector('.window-body'));
    }

    setNowPlaying(name) {
      this._nowPlaying = String(name || '');
      this.shadowRoot.querySelector('.loading-label').textContent = name ? `Abriendo ${name}…` : 'Abriendo FNF original…';
    }

    notify(message) { this._toast(String(message)); }

    _readNumber(key, fallback, min, max) {
      try { const saved = localStorage.getItem(key); const number = saved === null ? fallback : Number(saved); return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback; }
      catch { return fallback; }
    }

    _store(key, value) { try { localStorage.setItem(key, String(value)); } catch {} }
    _emit(name, detail = {}) { return this.dispatchEvent(new CustomEvent(name, {detail,bubbles:true,composed:true})); }
    _icon(name) { return `<span class="icon-art">${ICONS[name] || ''}</span>`; }

    _render() {
      const appNames = {fnf:'Friday Night Funkin’',determination:'Determination',files:'Canciones',notes:'Notas',calculator:'Calculadora',settings:'Configuración'};
      const keyboardRows = [
        ['Esc','1','2','3','4','5','6','7','8','9','0','−','=', ['⌫',2]],
        [['Tab',1.5],'Q','W','E','R','T','Y','U','I','O','P','[',']',['\\',1.5]],
        [['Caps',1.8],'A','S','D','F','G','H','J','K','L',';',"'",['Enter',2.2]],
        [['Shift',2.3],'Z','X','C','V','B','N','M',',','.','/',['Shift',2.7]],
        [['Ctrl',1.3],['◇',1.2],['Alt',1.2],['',6.1],['Alt',1.2],'Fn','←','↓','→'],
      ];
      const keyboard = keyboardRows.map(row => `<div class="key-row">${row.map(key => `<i class="key" style="--key-width:${Array.isArray(key) ? key[1] : 1}">${Array.isArray(key) ? key[0] : key}</i>`).join('')}</div>`).join('');
      const icons = Object.entries(appNames).map(([id, name]) => `<button class="app-icon ${id}" data-app="${id}" title="${name}" aria-label="Abrir ${name}">${this._icon(id)}<span>${id === 'fnf' ? 'FNF · Jugar' : name}</span></button>`).join('');
      const taskIcons = ['fnf','determination','files','notes','settings'].map(id => `<button class="task-icon" data-app="${id}" title="${appNames[id]}" aria-label="Abrir ${appNames[id]}">${ICONS[id]}</button>`).join('');
      this.shadowRoot.innerHTML = `<style>${style}</style>
        <div class="pov">
          <div class="station">
            <div class="room-backdrop" aria-hidden="true">
              <div class="wall-panels"></div><div class="room-floor"></div>
              <div class="wall-picture picture-left"><svg viewBox="0 0 100 132"><g fill="#a9ad9d"><path d="M22 24h15v-9h13v7h27v27H65V35H51v18H28V42H17V29h5zm10 6v9h10v-9zm27 0v9h10v-9z"/><path d="M38 55h31v16H57v14H31v-9h15V64h-8zm-9 39h14v7H29zm0 11h30v7H29z"/></g></svg></div>
              <div class="wall-picture picture-center"></div><div class="wall-picture picture-right"></div>
            </div>
            <div class="desk" aria-hidden="true"></div><div class="desk-apron" aria-hidden="true"></div>
          <div class="setup"><div class="monitor-rig"><div class="monitor"><div class="screen">
            <div class="desktop"><div class="wallpaper-shape"></div><div class="desktop-word"><strong>STAY DETERMINED.</strong><span>UN MUNDO DENTRO DE OTRO</span></div>
              <div class="icons">${icons}</div><div class="song-progress"><i class="dot"></i><span class="progress-label">Biblioteca de canciones</span></div>
              <div class="fnf-download" role="status" style="position:absolute;left:12px;bottom:48px;color:#c1d6ef;font-size:clamp(7px,1vw,11px);pointer-events:none" hidden></div><div class="window-layer"></div>
              <div class="quick-panel" hidden><h3>Hola, Mira.</h3><p>Tu escritorio está listo. Pulsa una app para abrirla.</p><div class="quick-apps">${['fnf','determination','files','notes','calculator','settings'].map(id => `<button data-app="${id}"><span class="small-icon">${ICONS[id]}</span>${id === 'fnf' ? 'Jugar FNF' : appNames[id]}</button>`).join('')}</div><div class="quick-power"><button data-power>${ICONS.power} Apagar · volver a la habitación</button></div></div>
              <div class="taskbar"><div class="system-name"><b></b>DETERMINATION OS</div><button class="task-icon start" title="Inicio" aria-label="Abrir Inicio" aria-expanded="false">${ICONS.windows}</button>${taskIcons}<div class="tray"><span class="tray-volume" title="Volumen">♫</span><div class="tray-time"><div class="clock"></div><div class="date"></div></div></div></div>
              <div class="loading-banner" hidden><i class="loading-spinner"></i><span class="loading-label">Abriendo FNF original…</span></div>
            </div>
            <section class="html-app" aria-label="Determination · Mira" hidden><div class="html-app-stage"></div><button class="html-app-return" type="button">← Escritorio</button></section>
            <div class="game-host" hidden></div>
            <div class="custom-cursor" aria-hidden="true"><svg viewBox="0 0 24 30"><path d="M3 2v22l6-5 5 9 4-2-5-9 8-1Z"/></svg></div>
          </div><i class="monitor-led"></i></div><div class="stand"></div><div class="stand-base"></div></div>
          <div class="tower" role="img" aria-label="La torre de Ryon, con dos ventiladores cian y violeta"><div class="tower-top"><i class="power-dot"></i><i class="usb"></i></div><div class="tower-glass"><div class="fan"><i class="blades"></i></div><div class="fan"><i class="blades"></i></div></div><span class="tower-badge"></span><span class="tower-feet" aria-hidden="true"><i></i><i></i></span></div></div>
          <div class="keyboard" aria-hidden="true">${keyboard}</div></div>
          <button class="exit-room" aria-label="Volver a la habitación">← Volver a la habitación <span>ESC</span></button>
          <div class="hint"><kbd>ESC</kbd>Volver · Pulsa un icono para abrirlo</div>
        </div><button class="pc-expand" type="button" aria-label="Ampliar pantalla de la PC" aria-pressed="false" title="Ampliar pantalla de la PC"><span class="expand-symbol" aria-hidden="true">⛶</span><span class="expand-label">Ampliar pantalla</span></button>`;
      this.shadowRoot.querySelector('.screen').style.setProperty('--brightness', this._brightness);
      this.shadowRoot.addEventListener('click', e => {
        if (e.target.closest('.pc-expand')) { this.setExpanded(!this.hasAttribute('screen-expanded')); return; }
        if (e.target.closest('.html-app-return')) { this._closeHtmlApp(); return; }
        const app = e.target.closest('[data-app]');
        if (app) {
          this._closeStart();
          if (app.dataset.app === 'fnf') this._launchGame();
          else this._openApp(app.dataset.app);
          return;
        }
        if (e.target.closest('.exit-room,[data-power]')) { this.close(); return; }
        if (e.target.closest('.start')) {
          const panel = this.shadowRoot.querySelector('.quick-panel');
          panel.hidden = !panel.hidden;
          this.shadowRoot.querySelector('.start').setAttribute('aria-expanded', String(!panel.hidden));
          return;
        }
        if (!e.target.closest('.quick-panel')) this._closeStart();
      });
      this._setupCursor();
    }

    _setupCursor() {
      const screen = this.shadowRoot.querySelector('.screen');
      const cursor = this.shadowRoot.querySelector('.custom-cursor');
      screen.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        const rect = screen.getBoundingClientRect();
        screen.classList.add('cursor-enabled');
        cursor.style.left = `${e.clientX - rect.left}px`;
        cursor.style.top = `${e.clientY - rect.top}px`;
        cursor.classList.toggle('interactive', Boolean(e.target.closest('button,input,textarea')));
      });
      screen.addEventListener('pointerleave', () => { screen.classList.remove('cursor-enabled'); cursor.classList.remove('press'); });
      screen.addEventListener('pointerdown', () => cursor.classList.add('press'));
      screen.addEventListener('pointerup', () => cursor.classList.remove('press'));
      screen.addEventListener('pointercancel', () => cursor.classList.remove('press'));
    }

    _clockTick() {
      const now = new Date();
      const clock = this.shadowRoot.querySelector('.clock');
      const date = this.shadowRoot.querySelector('.date');
      if (!clock || !date) return;
      const options = {timeZone:'America/El_Salvador'};
      clock.textContent = now.toLocaleTimeString('es-SV', {...options,hour:'2-digit',minute:'2-digit',hour12:false});
      date.textContent = now.toLocaleDateString('es-SV', {...options,day:'2-digit',month:'2-digit',year:'numeric'});
    }

    _closeStart() {
      this.shadowRoot.querySelector('.quick-panel').hidden = true;
      this.shadowRoot.querySelector('.start').setAttribute('aria-expanded', 'false');
    }

    _updateProgress() {
      const done = this._songs.filter(song => song.completed).length;
      const count = this._songs.length;
      this.shadowRoot.querySelector('.progress-label').textContent = count ? `${done} / ${count} canciones superadas` : 'Biblioteca de canciones';
      this.shadowRoot.querySelector('.app-icon.fnf').title = 'Abrir Friday Night Funkin’ original';
    }

    _launchGame() {
      this._disposeCustomApps();
      if (this._gameActive || !this.shadowRoot.querySelector('.loading-banner').hidden) return;
      this._closeStart();
      this.setNowPlaying('Friday Night Funkin’');
      this._setLoading(true);
      this._emit('pc:launch-game');
      // A failed or unavailable host must not leave the icon permanently locked.
      clearTimeout(this._loadingTimer);
      this._loadingTimer = setTimeout(() => {
        if (!this._gameActive) this._setLoading(false);
      }, 60000);
    }

    _setLoading(loading) {
      this.shadowRoot.querySelector('.loading-banner').hidden = !loading;
      if (!loading) clearTimeout(this._loadingTimer);
    }

    _toast(message) {
      clearTimeout(this._toastTimer);
      this.shadowRoot.querySelector('.toast')?.remove();
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role','status');
      toast.textContent = message;
      this.shadowRoot.querySelector('.desktop').append(toast);
      this._toastTimer = setTimeout(() => toast.remove(), 4500);
    }

    registerApp(id,definition) {
      if(!/^[a-z][a-z-]{1,30}$/.test(id)||!definition||typeof definition.fill!=='function'||this._apps.has(id))return false;
      this._apps.set(id,definition);
      const icon=ICONS[definition.icon]||ICONS.notes;
      for(const [selector,klass] of [['.icons','app-icon'],['.quick-apps','']]) {
        const b=document.createElement('button');b.type='button';b.className=klass;b.dataset.app=id;
        b.setAttribute('aria-label','Abrir '+definition.title);b.title=definition.title;
        const art=document.createElement('span');art.className=klass?'icon-art':'small-icon';art.innerHTML=icon;
        const label=document.createElement('span');label.textContent=definition.title;b.append(art,label);this.shadowRoot.querySelector(selector).append(b);
      }
      return true;
    }
    _disposeCustomApp(id) {
      try{this._appCleanup.get(id)?.();}catch{}
      this._appCleanup.delete(id);this._windows.get(id)?.remove();this._windows.delete(id);
    }
    _disposeCustomApps(){for(const id of this._apps.keys())this._disposeCustomApp(id);}
    _openCustomApp(id){
      const def=this._apps.get(id);if(!def)return false;
      if(this._windows.has(id)){const w=this._windows.get(id);w.style.zIndex=++this._z;w.querySelector('input,button')?.focus({preventScroll:true});return true;}
      const win=document.createElement('section');win.className='app-window home-pc-window';win.setAttribute('role','dialog');win.setAttribute('aria-label',def.title);win.style.zIndex=++this._z;
      const header=document.createElement('header');header.className='window-header';
      const title=document.createElement('span');title.className='window-title';title.textContent=def.title;
      const close=document.createElement('button');close.className='window-close';close.textContent='×';close.setAttribute('aria-label','Cerrar '+def.title);
      header.append(title,close);const body=document.createElement('div');body.className='window-body home-pc-body';win.append(header,body);
      close.addEventListener('click',()=>this._disposeCustomApp(id));win.addEventListener('pointerdown',()=>{win.style.zIndex=++this._z;});this._enableDrag(win);
      this.shadowRoot.querySelector('.window-layer').append(win);this._windows.set(id,win);
      this._appCleanup.set(id,def.fill(body,{desktop:this,window:win})||(()=>{}));win.querySelector('input,button')?.focus({preventScroll:true});return true;
    }
    _openApp(id) {
      if(this._openCustomApp(id))return;
      if (id === 'determination') { this._openHtmlApp(); return; }
      const titles = {notes:'Notas · Guardado automático',calculator:'Calculadora',files:'Biblioteca de canciones',settings:'Configuración'};
      if (!(id in titles)) return;
      if (this._windows.has(id)) {
        const win = this._windows.get(id);
        win.style.zIndex = ++this._z;
        win.querySelector('textarea,input,button')?.focus({preventScroll:true});
        return;
      }
      const win = document.createElement('section');
      win.className = `app-window ${id === 'calculator' ? 'calculator-window' : ''}`;
      win.setAttribute('role','dialog');
      win.setAttribute('aria-label',titles[id]);
      win.style.zIndex = ++this._z;
      win.innerHTML = `<header class="window-header"><span class="window-title"><span class="small-icon">${ICONS[id]}</span>${titles[id]}</span><button class="window-close" title="Cerrar" aria-label="Cerrar ${titles[id]}">×</button></header><div class="window-body"></div>`;
      const body = win.querySelector('.window-body');
      if (id === 'notes') this._fillNotes(win, body);
      if (id === 'calculator') this._fillCalculator(body);
      if (id === 'files') this._fillFiles(body);
      if (id === 'settings') this._fillSettings(body);
      win.querySelector('.window-close').addEventListener('click', () => {
        win.remove(); this._windows.delete(id); this._markTask(id,false);
      });
      win.addEventListener('pointerdown', () => { win.style.zIndex = ++this._z; });
      this._enableDrag(win);
      this.shadowRoot.querySelector('.window-layer').append(win);
      this._windows.set(id, win);
      this._markTask(id,true);
      win.querySelector('textarea,input,button')?.focus({preventScroll:true});
    }

    _markTask(id,active) {
      this.shadowRoot.querySelectorAll(`.task-icon[data-app="${id}"]`).forEach(button => button.classList.toggle('active',active));
    }

    _openHtmlApp() {
      this._disposeCustomApps();
      if (this._htmlFrame) { this._htmlFrame.focus(); return; }
      const overlay=this.shadowRoot.querySelector('.html-app');
      const stage=overlay.querySelector('.html-app-stage');
      const frame=document.createElement('iframe');
      frame.title='Determination · Mira';
      frame.src='apps/determination/index.html';
      frame.setAttribute('sandbox','allow-scripts allow-same-origin');
      frame.allow='autoplay';
      const touch=matchMedia('(pointer: coarse)').matches;
      const width=touch ? 640 : 800, height=touch ? 800 : 600;
      frame.style.width=width+'px';frame.style.height=height+'px';
      this._htmlFrame=frame;overlay.hidden=false;
      this.shadowRoot.querySelector('.screen').classList.add('html-active');
      const resize=()=>{const scale=Math.min(stage.clientWidth/width,stage.clientHeight/height);frame.style.transform=`translate(-50%,-50%) scale(${scale})`;};
      this._htmlResize=new ResizeObserver(resize);this._htmlResize.observe(stage);
      frame.addEventListener('load',()=>{if(this._htmlFrame!==frame)return;this._sendHtmlVolume();frame.focus({preventScroll:true});});
      stage.append(frame);resize();this._markTask('determination',true);
      window.FnfPreload?.setGameActive(true);
    }

    _sendHtmlVolume() {
      this._htmlFrame?.contentWindow?.postMessage({type:'determination:volume',volume:this._volume},location.origin);
    }

    _closeHtmlApp(restoreFocus=true) {
      if (!this._htmlFrame) return;
      // Remove the document so its music, video and timers stop on every exit.
      this._htmlFrame.remove();this._htmlFrame=null;
      this._htmlResize?.disconnect();this._htmlResize=null;
      this.shadowRoot.querySelector('.html-app').hidden=true;
      this.shadowRoot.querySelector('.screen').classList.remove('html-active');
      this._markTask('determination',false);window.FnfPreload?.setGameActive(false);
      if(restoreFocus)this.shadowRoot.querySelector('.app-icon[data-app="determination"]').focus({preventScroll:true});
    }

    _enableDrag(win) {
      const header = win.querySelector('.window-header');
      let dragging = null;
      header.addEventListener('pointerdown', e => {
        if (e.target.closest('button') || e.button !== 0) return;
        const layerRect = this.shadowRoot.querySelector('.window-layer').getBoundingClientRect();
        const rect = win.getBoundingClientRect();
        dragging = {x:e.clientX-rect.left,y:e.clientY-rect.top,width:rect.width,height:rect.height};
        win.style.transform = 'none';
        win.style.left = `${rect.left-layerRect.left}px`;
        win.style.top = `${rect.top-layerRect.top}px`;
        header.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      header.addEventListener('pointermove', e => {
        if (!dragging) return;
        const rect = this.shadowRoot.querySelector('.window-layer').getBoundingClientRect();
        const left = Math.max(0, Math.min(rect.width-dragging.width, e.clientX-rect.left-dragging.x));
        const top = Math.max(0, Math.min(rect.height-25, e.clientY-rect.top-dragging.y));
        win.style.left = `${left}px`; win.style.top = `${top}px`;
      });
      const stop = () => { dragging = null; };
      header.addEventListener('pointerup',stop); header.addEventListener('pointercancel',stop); header.addEventListener('lostpointercapture',stop);
    }

    _fillNotes(win,body) {
      const notes = document.createElement('textarea');
      notes.className = 'notes';
      notes.placeholder = 'Escribe aquí tus pistas, ideas o recuerdos…\n\nTodo se guarda automáticamente en este navegador.';
      notes.setAttribute('aria-label','Tus notas');
      try { notes.value = localStorage.getItem('pc-room-notes') || ''; } catch {}
      body.append(notes);
      const footer = document.createElement('div');
      footer.className = 'window-footer';
      footer.innerHTML = '<span>Guardado en este dispositivo</span><span class="char-count"></span>';
      win.append(footer);
      const update = () => { footer.querySelector('.char-count').textContent = `${notes.value.length} caracteres`; this._store('pc-room-notes',notes.value); };
      notes.addEventListener('input',update);
      update();
    }

    _fillFiles(body) {
      body.replaceChildren();
      const header = document.createElement('div');
      header.className = 'files-head';
      const title = document.createElement('div'); title.textContent = 'Este equipo › FNF › Canciones';
      const hint = document.createElement('small'); hint.textContent = 'Se eligen en el menú original';
      header.append(title,hint); body.append(header);
      const list = document.createElement('div'); list.className = 'song-list';
      if (!this._songs.length) {
        list.className = 'files-empty'; list.textContent = 'La biblioteca aparecerá aquí cuando las canciones estén listas.';
      }
      this._songs.forEach(song => {
        const button = document.createElement('button');
        button.className = `song-card${song.completed ? ' completed' : ''}`;
        button.setAttribute('aria-label',`Abrir el juego original · ${song.name}${song.completed ? ', superada' : ''}`);
        const note = document.createElement('span'); note.className = 'song-note'; note.textContent = song.completed ? '✓' : '♪';
        const title = document.createElement('span'); title.className = 'song-title'; title.textContent = song.name;
        const state = document.createElement('span'); state.className = 'song-state'; state.textContent = song.completed ? 'Superada' : 'Por jugar';
        const arrow = document.createElement('span'); arrow.className = 'play-arrow'; arrow.textContent = '▶';
        button.append(note,title,state,arrow); button.addEventListener('click', () => this._launchGame()); list.append(button);
      });
      body.append(list);
    }

    _fillSettings(body) {
      body.innerHTML = `<div class="settings-body"><div class="setting-row"><label class="setting-title" for="pc-volume">Volumen del juego <output>${Math.round(this._volume*100)}%</output></label><input id="pc-volume" aria-label="Volumen del juego" type="range" min="0" max="100" value="${Math.round(this._volume*100)}"></div><div class="setting-row"><label class="setting-title" for="pc-brightness">Brillo del monitor <output>${Math.round(this._brightness*100)}%</output></label><input id="pc-brightness" aria-label="Brillo del monitor" type="range" min="50" max="130" value="${Math.round(this._brightness*100)}"></div><div class="settings-about"><strong>DETERMINATION OS</strong><br>Tu escritorio personal · RGB activado<br><br>FNF abre el motor original con sus menús. La semana conserva su menú original al terminar.<br>Las notas y los ajustes se guardan en este navegador.</div></div>`;
      const volume = body.querySelector('#pc-volume');
      const brightness = body.querySelector('#pc-brightness');
      volume.addEventListener('input', () => {
        this._volume = Number(volume.value)/100;
        volume.previousElementSibling.querySelector('output').textContent = `${volume.value}%`;
        this._store('pc-room-volume',this._volume);
        this._sendHtmlVolume();
        this._emit('pc:volume',{volume:this._volume});
      });
      brightness.addEventListener('input', () => {
        this._brightness = Number(brightness.value)/100;
        brightness.previousElementSibling.querySelector('output').textContent = `${brightness.value}%`;
        this.shadowRoot.querySelector('.screen').style.setProperty('--brightness',this._brightness);
        this._store('pc-room-brightness',this._brightness);
      });
    }

    _fillCalculator(body) {
      body.classList.add('calculator-body');
      body.innerHTML = '<input class="calc-display" aria-label="Cálculo" inputmode="decimal" value="0" autocomplete="off" spellcheck="false"><div class="calc-keys"></div>';
      const display = body.querySelector('.calc-display');
      const keys = ['C','(',')','⌫','7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+'];
      let resolved = false;
      const compute = () => {
        try {
          const result = GamingDesktop.calculate(display.value);
          display.value = Number(result.toPrecision(12)).toString();
          resolved = true;
        } catch { display.value = 'Error'; resolved = true; }
      };
      const apply = key => {
        if (key === 'C') {display.value='0';resolved=false;return;}
        if (key === '⌫') {display.value=display.value.slice(0,-1)||'0';resolved=false;return;}
        if (key === '=') {compute();return;}
        const value = {'÷':'/','×':'*','−':'-'}[key] || key;
        const operator = /^[+*/-]$/.test(value);
        if (display.value === 'Error' || (resolved && !operator)) display.value = '';
        if (display.value === '0' && !operator && value !== '.') display.value = '';
        display.value += value; resolved=false;
      };
      keys.forEach(key => {
        const button = document.createElement('button');
        button.className = `calc-key${key === '=' ? ' equals' : key === 'C' ? ' clear' : ['÷','×','−','+'].includes(key) ? ' operator' : ''}`;
        button.textContent = key;
        button.setAttribute('aria-label',key === '⌫' ? 'Borrar último carácter' : key === 'C' ? 'Limpiar' : key === '=' ? 'Calcular' : key);
        button.addEventListener('click',()=>apply(key)); body.querySelector('.calc-keys').append(button);
      });
      display.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); compute(); } });
      display.addEventListener('input', () => { display.value = display.value.replace(/[^0-9.+*/%()\-\s]/g,''); resolved=false; });
    }

    static calculate(expression) {
      if (/\d\s+\d/.test(String(expression))) throw new Error('Invalid number spacing');
      const source = String(expression).replace(/\s/g,'');
      const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/%\-]/g) || [];
      if (!source || tokens.join('') !== source) throw new Error('Invalid expression');
      let index = 0;
      const factor = () => {
        const token = tokens[index++];
        if (token === '+') return factor();
        if (token === '-') return -factor();
        if (token === '(') { const value = sum(); if (tokens[index++] !== ')') throw new Error('Missing parenthesis'); return value; }
        if (token === undefined || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('Invalid number');
        return Number(token);
      };
      const product = () => {
        let value = factor();
        while (['*','/','%'].includes(tokens[index])) {
          const op = tokens[index++]; const next = factor();
          if ((op === '/' || op === '%') && next === 0) throw new Error('Division by zero');
          value = op === '*' ? value*next : op === '/' ? value/next : value%next;
        }
        return value;
      };
      const sum = () => {
        let value = product();
        while (['+','-'].includes(tokens[index])) { const op=tokens[index++]; const next=product(); value=op==='+'?value+next:value-next; }
        return value;
      };
      const value = sum();
      if (index !== tokens.length || !Number.isFinite(value)) throw new Error('Invalid result');
      return value;
    }
  }
  if (!customElements.get('gaming-desktop')) customElements.define('gaming-desktop',GamingDesktop);
})();
