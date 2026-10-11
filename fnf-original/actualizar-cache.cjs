const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=__dirname;
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const files={};
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const name=path.join(dir,entry.name);
  if(entry.isDirectory())scan(name);
  else {const rel=path.relative(root,name).replaceAll('\\','/');
    if(/^fnf-cache-/.test(rel)||/\.(md|patch|cjs)$/i.test(rel)||rel==='ftbb-html5-shader-time.json')continue;
    const bytes=fs.readFileSync(name);files[rel]=[hash(bytes),bytes.length];
  }
}}
scan(root);
function assetPaths(name){
  const serialized=JSON.parse(fs.readFileSync(path.join(root,'manifest',name+'.json'),'utf8')).assets;
  const paths=new Set(),pattern=/y(\d+):/g; let match;
  while((match=pattern.exec(serialized))){
    const value=decodeURIComponent(serialized.slice(pattern.lastIndex,pattern.lastIndex+Number(match[1])));
    pattern.lastIndex+=Number(match[1]);
    if(/^(assets|flixel)\//.test(value)){assert(files[value],'Missing asset: '+value);paths.add(value);}
  }
  return [...paths];
}
// Libraries actually used by the original preloader, menus and this catalog.
// Do not warm videos or other week-specific libraries simply because they exist.
const warm=[...new Set(['Funkin.js','mods/ftbb.zip','index.html','favicon.png',
  ...fs.readdirSync(path.join(root,'manifest')).map(name=>'manifest/'+name),
  ...assetPaths('default'),...assetPaths('shared'),...assetPaths('songs'),...assetPaths('tutorial')])];
assert(warm.every(p=>files[p]));
assert(!warm.some(p=>p.startsWith('assets/videos/')));
const version=hash(Buffer.from(JSON.stringify(files)));
const totalBytes=warm.reduce((sum,p)=>sum+files[p][1],0);
const manifest={version,totalBytes,warm,files};
fs.writeFileSync(path.join(root,'fnf-cache-manifest.js'),'self.FNF_CACHE_MANIFEST='+JSON.stringify(manifest)+';\n');
fs.writeFileSync(path.join(root,'fnf-cache-manifest.json'),JSON.stringify({version,totalBytes,warm})+'\n');
fs.writeFileSync(path.join(root,'fnf-cache-audit.json'),JSON.stringify({version,warmFiles:warm.length,totalBytes,engineSha256:files['Funkin.js'][0],modSha256:files['mods/ftbb.zip'][0],allFiles:Object.keys(files).length,excludedVideos:true},null,2));
console.log(JSON.stringify({warmFiles:warm.length,totalBytes,version}));
