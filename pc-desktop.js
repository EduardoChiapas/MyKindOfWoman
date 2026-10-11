/* Gaming computer POV. All UI is isolated inside <gaming-desktop>. */
(() => {
  'use strict';
  const ICONS = {
    fnf: '<img src="assets/props/funkin-icon.png" alt="" aria-hidden="true">',
    files: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#ffb844" d="M5 15a5 5 0 0 1 5-5h17l6 7h21a5 5 0 0 1 5 5v28a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z"/><path fill="#ffdd78" d="M5 25h54v25a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z"/><path stroke="#fff1bb" stroke-width="3" d="M12 31h40"/></svg>',
    notes: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#76d6ff" d="M12 5h39a4 4 0 0 1 4 4v47a4 4 0 0 1-4 4H12Z"/><path fill="#eafaff" d="M12 7h34v50H12Z"/><path stroke="#b9d7e6" stroke-width="2" d="M20 19h18M20 27h18M20 35h18M20 43h12"/><path stroke="#38a6d7" stroke-width="3" d="M8 13h8M8 22h8M8 31h8M8 40h8M8 49h8"/></svg>',
    calculator: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="11" y="4" width="42" height="56" rx="7" fill="#b8cbe5"/><rect x="17" y="10" width="30" height="13" rx="3" fill="#2d4770"/><g fill="#f4f8ff"><rect x="17" y="29" width="7" height="7" rx="2"/><rect x="29" y="29" width="7" height="7" rx="2"/><rect x="17" y="40" width="7" height="7" rx="2"/><rect x="29" y="40" width="7" height="7" rx="2"/><rect x="17" y="51" width="19" height="4" rx="2"/></g><path fill="#73c9ff" d="M41 29h7v7h-7Zm0 11h7v15h-7Z"/></svg>',
    settings: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#aac5e4" d="m26 4 12 0 2 8 6 3 8-2 6 10-6 6v7l6 6-6 10-8-2-6 3-2 8H26l-2-8-6-3-8 2-6-10 6-6v-7l-6-6 6-10 8 2 6-3Z"/><circle cx="32" cy="32" r="13" fill="#436187"/><circle cx="32" cy="32" r="7" fill="#dff5ff"/></svg>',
    power: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 3v9M7.2 5.7a8 8 0 1 0 9.6 0"/></svg>',
    windows: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3h8v8H3Zm10 0h8v8h-8ZM3 13h8v8H3Zm10 0h8v8h-8Z"/></svg>',
  };
  const style = `
    :host{--ice:#6ce8ff;--pink:#ee74db;--muted:#98acc6;--volume:1;position:fixed;inset:0;z-index:1000;display:block;color:#f1f7ff;font:14px 'Segoe UI',system-ui,sans-serif;color-scheme:dark;background:#080b15} :host([hidden]){display:none!important}
    *{box-sizing:border-box}button,input,textarea{font:inherit}button{color:inherit;cursor:pointer}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid #72ddff;outline-offset:3px}button{border:0}button:disabled{opacity:.4;cursor:default}svg{display:block;width:100%;height:100%}.icon-art img,.task-icon img,.small-icon img{display:block;width:100%;height:100%;object-fit:contain}[hidden]{display:none!important}
    .pov{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 55% 47%,#172543 0%,#11172a 39%,#05080f 77%)}
    .pov:before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 62%,#884bb00d 62%,transparent 90%),repeating-linear-gradient(90deg,#ffffff03 0 1px,transparent 1px 100px);pointer-events:none}
    .ambient{position:absolute;left:10%;right:9%;top:35%;height:38%;background:linear-gradient(100deg,#008eff30,#f000cb20);filter:blur(80px);pointer-events:none}
    .exit-room{position:absolute;z-index:5;left:24px;top:22px;display:flex;gap:10px;align-items:center;border:1px solid #e2efff24;background:#101827b3;padding:11px 17px;border-radius:30px;backdrop-filter:blur(10px);font-size:12px;letter-spacing:.03em}.exit-room:hover{background:#1b2a42}.exit-room span{opacity:.5;font-size:10px}
    .pov-label{position:absolute;left:50%;top:27px;transform:translateX(-50%);font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:#8796b5}.status-led{display:inline-block;width:5px;height:5px;border-radius:50%;background:#75edc1;box-shadow:0 0 9px #75edc1;margin-right:9px}
    .desk{position:absolute;left:-10%;right:-10%;height:29%;bottom:-6%;background:linear-gradient(180deg,#26314b 0,#1a2336 14%,#0e1522 60%);transform:perspective(850px) rotateX(37deg);border-top:1px solid #64789560;box-shadow:0 -8px 40px #65a5d015,inset 0 1px 0 #bacbff20}.desk:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(3deg,#ffffff02 0 1px,transparent 1px 4px)}
    .setup{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:min(90vw,1400px,calc(220vh - 420px));display:flex;align-items:flex-end;gap:clamp(12px,2.2vw,36px);padding-bottom:3.5vh}
    .monitor-rig{position:relative;flex:1;min-width:0;padding-bottom:65px}.monitor{position:relative;background:linear-gradient(150deg,#363d4e,#131821 45%,#1f2531);border-radius:15px;padding:12px 12px 28px;box-shadow:0 25px 65px #000a,0 0 50px #77b9ff12,inset 0 1px 1px #c3d4eb60;border:1px solid #03070d}.monitor:before{content:'';position:absolute;top:5px;left:48%;width:25px;height:2px;background:#060910;border-radius:4px}.monitor:after{content:'DETERMINATION';position:absolute;bottom:9px;left:0;right:0;text-align:center;font:7px 'Segoe UI',sans-serif;letter-spacing:.4em;color:#748198}.screen{position:relative;aspect-ratio:16/9;border-radius:4px;overflow:hidden;border:1px solid #050910;background:#111e38;box-shadow:0 0 1px 1px #ffffff0b;isolation:isolate;filter:brightness(var(--brightness,1));touch-action:manipulation}.monitor-led{position:absolute;bottom:11px;right:18px;width:3px;height:3px;border-radius:50%;background:#73ecce;box-shadow:0 0 7px #00ffa8}.stand{position:absolute;height:52px;width:75px;bottom:16px;left:calc(50% - 37px);background:linear-gradient(90deg,#10151f,#3a4356 48%,#171e2b);clip-path:polygon(15% 0,85% 0,100% 100%,0 100%)}.stand-base{position:absolute;height:18px;width:220px;bottom:3px;left:calc(50% - 110px);background:linear-gradient(#465168,#181e2a);border-radius:50%;box-shadow:0 12px 12px #0007;transform:perspective(200px) rotateX(25deg)}
    .tower{position:relative;flex:0 0 18%;height:clamp(220px,32vw,480px);margin-bottom:33px;background:linear-gradient(105deg,#282d3c,#111620 25%,#202634 88%);border-radius:8px 12px 5px 5px;border:1px solid #485166;box-shadow:15px 20px 40px #000b,inset 1px 0 #e2f1ff12;transform:perspective(900px) rotateY(-9deg);padding:14px 13px}.tower:after{content:'';position:absolute;top:0;right:-8px;width:10px;height:100%;background:linear-gradient(90deg,#313a4d,#0e1320);transform:skewY(25deg);border-radius:0 5px 6px 0}.tower-top{display:flex;align-items:center;justify-content:space-between;font-size:7px;letter-spacing:.15em;color:#7a88a0;padding:0 3px 10px}.power-dot{width:11px;height:11px;border:1px solid #96e7ef;border-radius:50%;box-shadow:0 0 8px #91e5ed50;background:#42676b}.usb{width:17px;height:4px;background:#070b11;border:1px solid #424b61}.tower-glass{position:absolute;inset:40px 10px 12px;border:1px solid #69748b25;background:linear-gradient(115deg,#849dc61a 0%,transparent 15% 72%,#91cfff09 74%,transparent 84%),#03081499;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;overflow:hidden}.tower-glass:after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 3px,#060a1220 3px 4px)}.fan{width:76%;aspect-ratio:1;position:relative;border-radius:50%;background:#040711;box-shadow:0 0 24px #00ecf525}.fan:before{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(#65ffe1,#58c5ff,#9674ff,#fc63c7,#ffdf80,#65ffe1);animation:rgb 8s linear infinite;box-shadow:0 0 8px #d1ffff40;mask:radial-gradient(transparent 0 61%,black 62% 73%,transparent 74%)}.fan:nth-child(2):before{animation-delay:-2s}.fan:nth-child(3):before{animation-delay:-4s}.blades{position:absolute;inset:11%;border-radius:50%;background:repeating-conic-gradient(from 20deg,#406179b0 0deg 15deg,#849bc160 16deg 36deg,transparent 40deg 51deg);animation:spin 1.3s linear infinite;box-shadow:inset 0 0 10px #97ecff30}.fan:nth-child(2) .blades{animation-duration:1.5s}.fan:after{content:'';position:absolute;inset:37%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#577889,#131e2a 65%);box-shadow:0 0 8px #000b;border:1px solid #98d5e633}.tower-mark{position:absolute;bottom:17px;left:0;right:0;text-align:center;font-size:8px;letter-spacing:.25em;color:#d5e0ec44}
    .keyboard{position:absolute;bottom:3.5%;left:calc(50% - 210px);width:430px;height:93px;border-radius:12px;background:linear-gradient(#141c2b,#080e18);border:2px solid #2b3b54;transform:perspective(450px) rotateX(28deg) rotateZ(-2deg);box-shadow:0 13px 22px #0009,0 0 14px #ed63ea15;padding:9px 12px;display:grid;grid-template-columns:repeat(16,1fr);gap:3px}.key{border-radius:3px;background:#1b2435;box-shadow:inset 0 -2px 0 #0008,0 1px 1px #6acddd55;border:1px solid #596a8622;height:14px}.key:nth-child(3n){box-shadow:inset 0 -2px 0 #0008,0 1px 1px #eb77e666}.key.space{grid-column:span 7}.mouse{position:absolute;bottom:5%;left:calc(50% + 285px);width:49px;height:72px;border-radius:50% 50% 42% 42%;background:linear-gradient(100deg,#1a2637,#28364a,#121a28);border:1px solid #41536e;transform:rotate(12deg);box-shadow:0 8px 15px #0008}.mouse:after{content:'';position:absolute;top:8px;left:23px;width:3px;height:17px;background:#75e6f5;border-radius:6px;box-shadow:0 0 7px #4bcbdf}.mouse:before{content:'';position:absolute;bottom:12px;left:14px;right:14px;height:3px;background:#dc7fef;box-shadow:0 0 12px #dc7fef}
    .desktop{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 76% 30%,#79578c 0%,transparent 52%),radial-gradient(ellipse at 22% 65%,#266890 0%,transparent 55%),linear-gradient(125deg,#16324e,#233459 40%,#293351 65%,#101e36)}.wallpaper-shape{position:absolute;pointer-events:none;left:24%;top:8%;width:66%;height:82%;border-radius:47% 8% 40% 9%;transform:rotate(-24deg);background:linear-gradient(135deg,#8cdce820,#bddbff07 50%,#c099df40);box-shadow:inset 3px 1px 0 #b7d4ff22,35px 25px 70px #03051d55;filter:blur(.3px)}.wallpaper-shape:after{content:'';position:absolute;inset:12% 14% 7% 20%;border-radius:42% 5% 40% 8%;background:linear-gradient(145deg,#9edff42c,#2a385922);box-shadow:inset 2px 0 #d3eaff36}.desktop-word{position:absolute;right:6%;bottom:17%;text-align:right;color:#dbeaff8c;pointer-events:none}.desktop-word strong{display:block;font-size:clamp(15px,2.3vw,32px);font-weight:300;letter-spacing:.2em}.desktop-word span{display:block;font-size:clamp(8px,.85vw,12px);letter-spacing:.2em;margin-top:8px;color:#bacce366}
    .icons{position:absolute;top:19px;left:17px;display:grid;grid-template-rows:repeat(3,82px);grid-auto-flow:column;gap:5px 10px;z-index:2}.app-icon{width:74px;height:80px;padding:7px 4px;background:transparent;border:1px solid transparent;border-radius:5px;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:10px;text-shadow:0 1px 3px #000;transition:background .15s,border-color .15s,transform .15s}.app-icon:hover{background:#ccedff16;border-color:#e9faff26;transform:translateY(-1px)}.app-icon .icon-art{width:44px;height:44px;filter:drop-shadow(0 3px 3px #0004)}.app-icon.fnf{position:relative}.app-icon.fnf:after{content:'';position:absolute;top:6px;right:11px;width:5px;height:5px;border-radius:50%;background:#6bffd6;box-shadow:0 0 9px #3effc7}.song-progress{position:absolute;top:20px;right:21px;background:#0d193745;border:1px solid #dae8ff1a;border-radius:12px;padding:10px 15px;font-size:10px;color:#c5d5e7;display:flex;align-items:center;gap:8px;z-index:1;backdrop-filter:blur(10px)}.song-progress .dot{width:5px;height:5px;border-radius:50%;background:#99d5ed}.progress-label{white-space:nowrap}
    .taskbar{position:absolute;bottom:0;left:0;right:0;height:38px;background:#0b173bbf;backdrop-filter:blur(24px);border-top:1px solid #a8d2ff24;z-index:40;display:flex;align-items:center;justify-content:center;gap:5px;box-shadow:0 -4px 20px #0001}.task-icon{height:30px;width:32px;background:transparent;border-radius:5px;padding:7px;transition:background .15s}.task-icon:hover,.task-icon.active{background:#d3eaff16}.task-icon.active{box-shadow:inset 0 -2px #86d7fc}.task-icon svg{filter:drop-shadow(0 1px 1px #0003)}.task-icon.start{color:#91d5ff}.tray{position:absolute;right:12px;display:flex;align-items:center;gap:10px;font-size:9px;color:#dbe8ff}.tray-time{text-align:right;line-height:1.4}.tray-volume{font-size:14px;line-height:1}.system-name{position:absolute;left:13px;display:flex;gap:5px;align-items:center;font-size:8px;letter-spacing:.06em;color:#a5bcdb}.system-name b{width:4px;height:4px;background:#81e7c9;border-radius:50%}
    .window-layer{position:absolute;inset:0 0 38px;z-index:10;pointer-events:none}.app-window{position:absolute;width:min(520px,80%);height:min(320px,87%);left:50%;top:48%;transform:translate(-50%,-50%);border-radius:10px;background:#172338ef;border:1px solid #a6bfd544;box-shadow:0 18px 55px #0008;overflow:hidden;display:flex;flex-direction:column;backdrop-filter:blur(24px);pointer-events:auto}.window-header{height:36px;flex:0 0 36px;padding-left:12px;background:#202f46b3;display:flex;align-items:center;justify-content:space-between;cursor:move;user-select:none;touch-action:none;border-bottom:1px solid #a1c2f015}.window-title{display:flex;align-items:center;gap:8px;font-size:11px}.window-title .small-icon{width:16px;height:16px}.window-close{height:35px;width:40px;background:transparent;font-size:20px;line-height:1;color:#c2d1e5}.window-close:hover{background:#db4968;color:#fff}.window-body{flex:1;overflow:auto;min-height:0}.window-footer{padding:7px 14px;border-top:1px solid #bad7ff14;font-size:9px;color:#a7b6cf;flex-shrink:0;display:flex;justify-content:space-between;gap:8px}.notes{width:100%;height:100%;resize:none;border:0;padding:18px;background:#172338;color:#edf7ff;line-height:1.7;font:12px/1.7 'Segoe UI',sans-serif;outline-offset:-3px}.notes::placeholder{color:#8296b5}.files-head{padding:14px 18px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #9dc2ff12}.files-head div:first-child{font-size:12px;font-weight:600}.files-head small{font-size:9px;color:#9bb0ca}.song-list{padding:9px 12px;display:flex;flex-direction:column;gap:5px}.song-card{display:flex;align-items:center;gap:12px;text-align:left;background:#ffffff04;border:1px solid #afcfff16;border-radius:7px;padding:10px 12px;min-height:47px}.song-card:hover{background:#95caff15;border-color:#99d9ef4d}.song-note{height:26px;width:26px;border-radius:6px;background:linear-gradient(140deg,#8146a0,#306d91);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}.song-card.completed .song-note{background:#2f756c}.song-title{font-size:11px;font-weight:600;flex:1}.song-state{font-size:9px;color:#89d6c8}.song-card:not(.completed) .song-state{color:#abc0dc}.play-arrow{font-size:13px;color:#77e0f7}.files-empty{padding:30px 18px;color:#9fb0c8;text-align:center;font-size:12px;line-height:1.6}
    .calculator-window{width:min(265px,72%);height:min(350px,94%)}.calculator-body{padding:12px;display:flex;flex-direction:column;gap:11px}.calc-display{width:100%;height:54px;text-align:right;padding:7px 12px;background:#0d182a;border:1px solid #789ccf33;border-radius:6px;color:#f0f7ff;font-size:24px;font-weight:300}.calc-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.calc-key{min-height:31px;background:#2b3b53;border:1px solid #a4c4ee10;border-radius:5px;font-size:13px}.calc-key:hover{background:#405778}.calc-key.operator{background:#334d6b;color:#9fdfff}.calc-key.equals{background:#86d4ed;color:#112234}.calc-key.clear{color:#f3acc9;background:#50314b}.settings-body{padding:22px 24px}.setting-row{margin-bottom:23px}.setting-title{font-size:12px;display:flex;justify-content:space-between;margin-bottom:11px}.setting-title output{font-size:10px;color:#a9cdeb}.setting-row input[type=range]{width:100%;accent-color:#89dbf0;cursor:pointer}.settings-about{border-top:1px solid #a6c8ff1a;padding-top:17px;color:#98afce;font-size:10px;line-height:1.7}.settings-about strong{color:#d9e7fc;font-weight:500}.quick-panel{position:absolute;bottom:45px;left:50%;transform:translateX(-50%);width:260px;padding:20px;background:#17253bf2;border:1px solid #a0c4ed33;box-shadow:0 10px 40px #0009;border-radius:12px;backdrop-filter:blur(25px);z-index:45}.quick-panel h3{margin:0 0 16px;font-size:13px;font-weight:500}.quick-panel p{font-size:11px;color:#9eb0cc;margin:0 0 17px;line-height:1.6}.quick-apps{display:flex;gap:7px;flex-wrap:wrap}.quick-apps button{background:#b8dfff0a;border:1px solid #a9d0ff16;border-radius:7px;padding:10px 12px;font-size:10px;display:flex;align-items:center;gap:7px}.quick-apps button:hover{background:#b8dfff22}.quick-apps .small-icon{width:19px;height:19px}.quick-power{margin-top:16px;border-top:1px solid #d5eaff15;padding-top:12px}.quick-power button{display:flex;gap:8px;align-items:center;background:transparent;padding:3px 0;color:#b0c6e2;font-size:10px}.quick-power svg{height:16px;width:16px}
    .toast{position:absolute;right:15px;bottom:50px;max-width:265px;padding:12px 16px;background:#152940e8;border:1px solid #92cce34d;border-radius:8px;z-index:60;font-size:11px;color:#d0e7f9;box-shadow:0 8px 22px #0005;animation:toast-in .2s ease-out}.custom-cursor{position:absolute;left:0;top:0;width:24px;height:30px;pointer-events:none;z-index:100;display:none;transform:translate(-2px,-2px);filter:drop-shadow(0 0 5px #8be3ffb0)}.custom-cursor path{fill:#ecfaff;stroke:#365d7b;stroke-width:1.3}.custom-cursor:after{content:'';position:absolute;left:-5px;top:-5px;width:11px;height:11px;border:1px solid #93eaff80;border-radius:50%;animation:cursor-pulse 1.8s ease-out infinite}.custom-cursor.press{transform:translate(-2px,-2px) scale(.86)}.custom-cursor.interactive path{fill:#96f3ff}.screen.cursor-enabled,.screen.cursor-enabled *{cursor:none!important}.screen.cursor-enabled .custom-cursor{display:block}
    .game-host{position:fixed;inset:0;z-index:1100;overflow:hidden;background:#06070c}.game-host>*{width:100%;height:100%}.hint{position:absolute;bottom:18px;right:24px;font-size:9px;color:#7787a4;letter-spacing:.04em;z-index:2}.hint kbd{font:8px 'Segoe UI';border:1px solid #8494b333;padding:2px 5px;border-radius:3px;margin-right:6px}.loading-banner{position:absolute;top:15px;left:50%;transform:translateX(-50%);z-index:90;background:#11213de8;border:1px solid #a8ddff44;border-radius:9px;padding:10px 16px;color:#d6eaff;font-size:11px;box-shadow:0 10px 30px #0007;display:flex;align-items:center;gap:9px;white-space:nowrap}.loading-spinner{height:11px;width:11px;border-radius:50%;border:2px solid #8adfff33;border-top-color:#8adfff;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}@keyframes rgb{to{filter:hue-rotate(360deg)}}@keyframes cursor-pulse{0%{transform:scale(.5);opacity:.7}80%,100%{transform:scale(2.6);opacity:0}}@keyframes toast-in{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
    @media(min-width:1500px){.icons{grid-template-rows:repeat(3,94px);gap:10px 18px}.app-icon{width:87px;height:88px;font-size:12px}.app-icon .icon-art{width:49px;height:49px}.taskbar{height:44px}.window-layer{bottom:44px}.app-window{width:610px;height:365px}.window-title{font-size:13px}.window-header{height:40px;flex-basis:40px}.calculator-window{width:295px;height:375px}.calc-key{min-height:37px}.song-title{font-size:13px}.song-card{padding:12px}.song-state,.window-footer,.tray{font-size:10px}}
    @media(max-width:1050px){.setup{width:96vw;gap:14px}.tower{flex-basis:15%;height:30vw;padding:9px 7px}.tower-glass{inset:29px 6px 10px}.tower-top{font-size:5px;padding-bottom:8px}.power-dot{width:8px;height:8px}.usb{width:11px;height:3px}.monitor{padding:8px 8px 23px;border-radius:9px}.monitor:after{bottom:7px;font-size:5px}.monitor-led{bottom:9px}.icons{grid-template-rows:repeat(3,65px);gap:2px 3px;top:12px;left:9px}.app-icon{width:61px;height:63px;font-size:8px;padding:5px 2px;gap:4px}.app-icon .icon-art{width:34px;height:34px}.song-progress{top:12px;right:12px;font-size:8px;padding:8px 10px}.app-window{width:min(450px,85%);height:88%}.notes{font-size:11px;padding:12px}.settings-body{padding:15px 18px}.setting-row{margin-bottom:13px}.settings-about{padding-top:10px;font-size:9px}.calculator-window{width:235px;max-width:78%;height:95%;top:49%}.calculator-body{padding:8px;gap:6px}.calc-display{height:36px;font-size:19px}.calc-key{min-height:23px;font-size:11px}.calc-keys{gap:4px}.desktop-word{bottom:22%}.taskbar{height:33px}.window-layer{bottom:33px}.task-icon{height:27px;width:29px;padding:6px}.tray{font-size:8px;gap:7px;right:8px}.system-name{font-size:7px;left:8px}.files-head{padding:10px 12px}.files-head div:first-child{font-size:11px}.song-card{padding:7px 10px;min-height:42px;gap:8px}.song-title{font-size:10px}.song-state{font-size:8px}.song-list{padding:7px 9px}.pov-label{font-size:8px}.keyboard{width:330px;height:76px;left:calc(50% - 185px);gap:2px;padding:8px}.key{height:11px}.mouse{left:calc(50% + 200px);height:61px;width:43px}}
    @media(max-width:700px){.pov-label{display:none}.exit-room{top:14px;left:14px;padding:8px 12px;font-size:10px}.exit-room span{display:none}.setup{top:46%;width:97vw;gap:7px;padding-bottom:0}.monitor-rig{padding-bottom:40px}.monitor{padding:5px 5px 16px;border-radius:6px}.monitor:after{font-size:4px;bottom:6px}.monitor-led{right:9px;bottom:7px;width:2px;height:2px}.monitor:before{display:none}.stand{height:26px;bottom:12px;width:50px;left:calc(50% - 25px)}.stand-base{width:135px;left:calc(50% - 67px);height:13px;bottom:4px}.tower{flex-basis:13%;height:32vw;margin-bottom:21px;border-radius:5px;padding:5px}.tower-glass{inset:15px 4px 5px;border-radius:3px}.tower-top{padding:0;font-size:0;height:8px}.power-dot{height:5px;width:5px}.usb{width:8px;height:2px}.tower-mark{display:none}.tower:after{width:5px;right:-4px}.fan{width:83%}.icons{grid-template-rows:repeat(3,46px);top:7px;left:6px;gap:1px}.app-icon{height:45px;width:45px;font-size:6px;gap:2px;padding:3px 1px;border-radius:3px}.app-icon .icon-art{height:25px;width:25px}.app-icon.fnf:after{width:3px;height:3px;top:3px;right:7px}.song-progress{padding:5px 7px;right:7px;top:7px;border-radius:5px;font-size:6px;gap:5px}.song-progress .dot{width:3px;height:3px}.taskbar{height:24px;gap:2px}.task-icon{height:22px;width:24px;padding:5px}.tray{font-size:5.5px;right:5px;gap:5px}.tray-volume{font-size:10px}.system-name{display:none}.window-layer{bottom:24px}.app-window{height:94%;width:84%;border-radius:5px;top:50%}.window-header{height:24px;flex-basis:24px;padding-left:8px}.window-title{font-size:8px;gap:5px}.window-title .small-icon{width:12px;height:12px}.window-close{height:23px;width:30px;font-size:15px}.window-footer{font-size:6px;padding:4px 8px}.notes{font-size:8px;padding:8px;line-height:1.5}.files-head{padding:6px 9px;gap:5px}.files-head div:first-child{font-size:8px}.files-head small{font-size:6px}.song-list{padding:5px 7px;gap:3px}.song-card{padding:5px 7px;min-height:28px;gap:6px;border-radius:4px}.song-note{width:19px;height:19px;font-size:12px;border-radius:4px}.song-title{font-size:8px}.song-state{font-size:6px}.play-arrow{font-size:10px}.files-empty{padding:13px;font-size:9px}.desktop-word{right:6%;bottom:22%}.desktop-word strong{font-size:12px;letter-spacing:.15em}.desktop-word span{font-size:5px;margin-top:5px}.calculator-window{width:160px;height:97%}.calculator-body{padding:5px;gap:4px}.calc-display{height:25px;font-size:14px;padding:3px 6px}.calc-keys{gap:2px}.calc-key{min-height:17px;font-size:8px;border-radius:3px}.settings-body{padding:9px 12px}.setting-row{margin-bottom:8px}.setting-title{font-size:8px;margin-bottom:4px}.setting-title output{font-size:7px}.setting-row input[type=range]{height:10px}.settings-about{font-size:6px;padding-top:6px;line-height:1.4}.quick-panel{bottom:29px;width:190px;border-radius:7px;padding:12px}.quick-panel h3{font-size:10px;margin-bottom:8px}.quick-panel p{font-size:8px;margin-bottom:10px}.quick-apps{gap:4px}.quick-apps button{font-size:7px;padding:6px 8px;gap:5px}.quick-apps .small-icon{width:14px;height:14px}.quick-power{margin-top:10px;padding-top:8px}.quick-power button{font-size:8px}.quick-power svg{height:12px;width:12px}.toast{font-size:8px;bottom:31px;right:8px;max-width:190px;padding:8px 10px;border-radius:5px}.keyboard{width:240px;height:55px;left:calc(50% - 140px);bottom:15%;border-radius:7px;padding:5px 7px;gap:2px}.key{height:7px}.mouse{width:30px;height:43px;left:calc(50% + 122px);bottom:16%}.mouse:after{left:14px;top:5px;height:9px;width:2px}.mouse:before{left:9px;right:9px;bottom:8px;height:2px}.desk{height:33%;bottom:5%}.hint{bottom:15px;right:14px;font-size:8px}.custom-cursor{width:17px;height:23px}.loading-banner{font-size:8px;top:8px;padding:7px 10px;border-radius:5px}.loading-spinner{height:8px;width:8px}}
    @media(max-width:700px) and (orientation:portrait){.setup{top:43%;width:98vw}.screen{aspect-ratio:4/3}.tower{height:40vw}.keyboard{bottom:24%;width:230px;left:calc(50% - 141px)}.mouse{bottom:25%;left:calc(50% + 118px)}.desk{bottom:17%;height:28%}.app-window{height:90%;top:49%;width:88%}.calculator-window{width:160px;max-width:75%}.calc-key{min-height:23px}.icons{grid-template-rows:repeat(3,50px)}.app-icon{height:49px}.taskbar{justify-content:flex-start;padding-left:8px}.desktop-word strong{font-size:10px}.settings-body{padding:13px}.setting-row{margin-bottom:15px}.settings-about{font-size:7px}.notes{font-size:9px}.window-title{font-size:9px}.song-title{font-size:9px}.song-card{min-height:33px}.song-state{font-size:7px}.files-head div:first-child{font-size:9px}.quick-panel{left:45%}}
    @media(max-height:550px) and (min-width:701px){.setup{top:55%;width:min(80vw,960px)}.tower{height:45vh}.keyboard,.mouse{display:none}.monitor-rig{padding-bottom:40px}.stand{height:29px;bottom:11px}.stand-base{bottom:0}.hint{bottom:8px}.pov-label{top:18px}.exit-room{top:11px;left:13px;padding:8px 12px}.screen{max-height:73vh}.desk{height:24%;bottom:-8%}}
    /* Fit all three circular fans to the glass height, including short viewports. */
    .tower-glass{display:grid;grid-template-rows:repeat(3,minmax(0,1fr));gap:8px;padding:8px 0;justify-items:center}.fan{width:auto;height:100%;aspect-ratio:1;flex:0 0 auto}
    @media(max-width:1050px) and (min-width:701px){.setup{width:min(92vw,calc(160vh - 145px))}}
    @media(max-height:550px) and (min-width:701px){.setup{top:55%;width:min(80vw,960px,calc(190vh - 300px))}}
    @media(max-width:700px) and (orientation:landscape){.setup{top:54%;width:min(94vw,calc(175vh - 140px))}.keyboard,.mouse{display:none}.desk{bottom:-8%;height:28%}}
    @media(prefers-reduced-motion:reduce){.blades{animation-duration:8s}.fan:before{animation:none}.custom-cursor:after{animation:none;opacity:.4}.app-icon{transition:none}.toast{animation:none}}
  `;

  class GamingDesktop extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode:'open'});
      this._songs = [];
      this._gameActive = false;
      this._open = false;
      this._windows = new Map();
      this._z = 12;
      this._timers = [];
      this._volume = this._readNumber('pc-room-volume', 1, 0, 1);
      this._brightness = this._readNumber('pc-room-brightness', 1, .5, 1.3);
      this._nowPlaying = '';
      this._render();
      this._onKey = e => {
        if (!this._open || this._gameActive) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); }
      };
    }

    connectedCallback() {
      if (!this._open) this.hidden = true;
      document.addEventListener('keydown', this._onKey, true);
      this._clockTick();
      this._clockInterval = setInterval(() => this._clockTick(), 1000);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this._onKey, true);
      clearInterval(this._clockInterval);
      clearTimeout(this._toastTimer);
      clearTimeout(this._loadingTimer);
      this._timers.forEach(clearTimeout);
    }

    get gameHost() { return this.shadowRoot.querySelector('.game-host'); }
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
      this._open = false;
      this.hidden = true;
      this._emit('pc:close');
    }

    showDesktop() {
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
      this.shadowRoot.querySelector('.pov').hidden = this._gameActive;
      if (this._gameActive) {
        this._open = true;
        this.hidden = false;
        this._setLoading(false);
      }
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
      const appNames = {fnf:'Friday Night Funkin’',files:'Canciones',notes:'Notas',calculator:'Calculadora',settings:'Configuración'};
      const icons = Object.entries(appNames).map(([id, name]) => `<button class="app-icon ${id}" data-app="${id}" title="${name}" aria-label="Abrir ${name}">${this._icon(id)}<span>${id === 'fnf' ? 'FNF · Jugar' : name}</span></button>`).join('');
      const taskIcons = ['fnf','files','notes','settings'].map(id => `<button class="task-icon" data-app="${id}" title="${appNames[id]}" aria-label="Abrir ${appNames[id]}">${ICONS[id]}</button>`).join('');
      this.shadowRoot.innerHTML = `<style>${style}</style>
        <div class="pov">
          <div class="ambient"></div><div class="desk"></div>
          <button class="exit-room" aria-label="Volver a la habitación">← Volver a la habitación <span>ESC</span></button>
          <div class="pov-label"><i class="status-led"></i>Tu rincón para otra partida</div>
          <div class="setup"><div class="monitor-rig"><div class="monitor"><div class="screen">
            <div class="desktop"><div class="wallpaper-shape"></div><div class="desktop-word"><strong>STAY DETERMINED.</strong><span>UN MUNDO DENTRO DE OTRO</span></div>
              <div class="icons">${icons}</div><div class="song-progress"><i class="dot"></i><span class="progress-label">Biblioteca de canciones</span></div>
              <div class="window-layer"></div>
              <div class="quick-panel" hidden><h3>Hola, Frisk.</h3><p>Tu escritorio está listo. Pulsa FNF para abrir el juego original y elegir una canción.</p><div class="quick-apps">${['fnf','files','notes','calculator','settings'].map(id => `<button data-app="${id}"><span class="small-icon">${ICONS[id]}</span>${id === 'fnf' ? 'Jugar FNF' : appNames[id]}</button>`).join('')}</div><div class="quick-power"><button data-power>${ICONS.power} Apagar · volver a la habitación</button></div></div>
              <div class="taskbar"><div class="system-name"><b></b>DETERMINATION OS</div><button class="task-icon start" title="Inicio" aria-label="Abrir Inicio" aria-expanded="false">${ICONS.windows}</button>${taskIcons}<div class="tray"><span class="tray-volume" title="Volumen">♫</span><div class="tray-time"><div class="clock"></div><div class="date"></div></div></div></div>
              <div class="loading-banner" hidden><i class="loading-spinner"></i><span class="loading-label">Abriendo FNF original…</span></div>
            </div>
            <div class="custom-cursor" aria-hidden="true"><svg viewBox="0 0 24 30"><path d="M3 2v22l6-5 5 9 4-2-5-9 8-1Z"/></svg></div>
          </div><i class="monitor-led"></i></div><div class="stand"></div><div class="stand-base"></div></div>
          <div class="tower" aria-label="Torre gamer con tres ventiladores RGB girando"><div class="tower-top"><i class="power-dot"></i><span>DTRM</span><i class="usb"></i></div><div class="tower-glass"><div class="fan"><i class="blades"></i></div><div class="fan"><i class="blades"></i></div><div class="fan"><i class="blades"></i></div></div><span class="tower-mark">DETERMINATION</span></div></div>
          <div class="keyboard" aria-hidden="true">${Array.from({length:57}, (_, i) => `<i class="key${i === 51 ? ' space' : ''}"></i>`).join('')}</div><div class="mouse" aria-hidden="true"></div>
          <div class="hint"><kbd>ESC</kbd>Volver · Pulsa un icono para abrirlo</div>
        </div><div class="game-host" hidden></div>`;
      this.shadowRoot.querySelector('.screen').style.setProperty('--brightness', this._brightness);
      this.shadowRoot.addEventListener('click', e => {
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

    _openApp(id) {
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
      body.innerHTML = `<div class="settings-body"><div class="setting-row"><label class="setting-title" for="pc-volume">Volumen del juego <output>${Math.round(this._volume*100)}%</output></label><input id="pc-volume" aria-label="Volumen del juego" type="range" min="0" max="100" value="${Math.round(this._volume*100)}"></div><div class="setting-row"><label class="setting-title" for="pc-brightness">Brillo del monitor <output>${Math.round(this._brightness*100)}%</output></label><input id="pc-brightness" aria-label="Brillo del monitor" type="range" min="50" max="130" value="${Math.round(this._brightness*100)}"></div><div class="settings-about"><strong>DETERMINATION OS</strong><br>Tu escritorio personal · RGB activado<br><br>FNF abre el motor original con sus menús. Al ganar vuelves a este escritorio.<br>Las notas y los ajustes se guardan en este navegador.</div></div>`;
      const volume = body.querySelector('#pc-volume');
      const brightness = body.querySelector('#pc-brightness');
      volume.addEventListener('input', () => {
        this._volume = Number(volume.value)/100;
        volume.previousElementSibling.querySelector('output').textContent = `${volume.value}%`;
        this._store('pc-room-volume',this._volume);
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
