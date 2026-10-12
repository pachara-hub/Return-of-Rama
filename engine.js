/* RETURN OF RAMA — self-contained WebGL 3D action engine (no framework dependency) */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('gameCanvas'), backdrop = $('backdrop');
const screens = ['home','chapters','heroes','armory','audioScreen','battle','pause','settings','levelup','endScreen'];
const TAU = Math.PI * 2, clamp = (v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a), choose=a=>a[Math.floor(Math.random()*a.length)];
const ART = (window.ROR_ASSETS && ROR_ASSETS.art) || {};
const MUSIC = (window.ROR_ASSETS && ROR_ASSETS.music) || {};
const art = key => ART[key] || ART.forest || '';
let mode='home', selectedStage=0, selectedHero='rama', stageLive=0, soundOn=true, musicOn=true, audioUnlocked=false, heroEntry='home';
let unlocked=1, totalGems=0, bestKills=0, quality='high';
const permanent={health:0,damage:0,speed:0,fortune:0};
try { const save=JSON.parse(localStorage.getItem('ror3d_epic_save')||'{}'); unlocked=save.unlocked||1;totalGems=save.gems||0;bestKills=save.kills||0;selectedHero=save.hero||'rama';Object.assign(permanent,save.upgrades||{}); } catch(e) {}
const persist=()=>{try{localStorage.setItem('ror3d_epic_save',JSON.stringify({unlocked,gems:totalGems,kills:bestKills,hero:selectedHero,upgrades:permanent}));}catch(e){}};

const STAGES = [
 {id:0,name:'Dandaka Wilds',thai:'ป่าทัณฑกะ',subtitle:'The Forest of Demons',eyebrow:'CHAPTER 01 • FOREST OF DESTINY',desc:'A sacred wilderness turns hostile as rakshasa warriors emerge from the ancient groves. Take your first stand beneath the old trees.',enemy:'Rakshasa scouts',diff:'THREAT: I',reward:120,art:'forest',music:'forest',floor:[0.17,0.26,0.19],fog:[0.10,0.17,0.15],accent:[0.35,0.78,0.45]},
 {id:1,name:"Hanuman's Leap",thai:'หนุมานเหินหาว',subtitle:'Across the Ocean',eyebrow:'CHAPTER 02 • THE GREAT LEAP',desc:'The ocean divides courage from destiny. Break through Lanka’s vanguard as the wind god’s blessing carries you across the waves.',enemy:'Lanka sea guard',diff:'THREAT: II',reward:180,art:'ocean',music:'ocean',floor:[0.07,0.23,0.32],fog:[0.08,0.18,0.27],accent:[0.22,0.8,1]},
 {id:2,name:"Rama's Causeway",thai:'สะพานสู่ลงกา',subtitle:'The Bridge of Vanara',eyebrow:'CHAPTER 03 • THE STONE PATH',desc:'Stone by stone, the Vanara army builds a road across the sea. Hold the sacred causeway as the demon host tries to break the line.',enemy:'Causeway raiders',diff:'THREAT: III',reward:240,art:'causeway',music:'causeway',floor:[0.30,0.28,0.21],fog:[0.11,0.17,0.19],accent:[0.9,0.67,0.31]},
 {id:3,name:'Siege of Lanka',thai:'ศึกล้อมกรุงลงกา',subtitle:'The Golden City Burns',eyebrow:'CHAPTER 04 • GATES OF WAR',desc:'Gold towers burn beneath the sunset. Push through the gates of Lanka and face the strongest warriors of the ten-crowned king.',enemy:'Lanka royal guard',diff:'THREAT: IV',reward:320,art:'siege',music:'siege',floor:[0.25,0.12,0.12],fog:[0.2,0.08,0.12],accent:[1,0.31,0.16]},
 {id:4,name:'The Ten-Crowned King',thai:'ทศกัณฐ์ • ศึกชี้ชะตา',subtitle:'The Final Dharma War',eyebrow:'CHAPTER 05 • THE FINAL DUEL',desc:'The palace falls silent as Tosakanth enters the field. All the strength you have gathered will be tested in a final clash of divine power.',enemy:'Tosakanth and elite guards',diff:'THREAT: LEGENDARY',reward:600,art:'final',music:'final',floor:[0.20,0.08,0.12],fog:[0.16,0.05,0.09],accent:[1,0.22,0.12]}
];
const HEROES = {
 rama:{id:'rama',name:'Rama',title:'The Righteous King',thai:'พระราม',sigil:'R',skin:[0.2,0.62,0.74],cloth:[0.09,0.29,0.56],cloth2:[0.76,0.15,0.19],gold:[0.96,0.67,0.2],hp:115,damage:1.0,speed:5.1,style:'Celestial bow • balanced range',bio:'The righteous prince of Ayodhya, master of the celestial bow and guardian of dharma.',portrait:'ramaPortrait',previewArt:'title',skills:['ARROW OF LIGHT','HANUMAN LEAP','DIVINE AURA']},
 sita:{id:'sita',name:'Sita',title:'The Lotus Queen',thai:'นางสีดา',sigil:'S',skin:[0.94,0.68,0.48],cloth:[0.66,0.17,0.33],cloth2:[0.93,0.63,0.47],gold:[1,0.78,0.34],hp:100,damage:1.16,speed:5.2,style:'Lotus magic • precise ranged hits',bio:'A princess whose grace conceals a fearless spirit. Her lotus light weakens the shadows of Lanka.',portrait:'sitaPortrait',previewArt:'forest',skills:['LOTUS ARROW','LOTUS STEP','LOTUS HALO']},
 hanuman:{id:'hanuman',name:'Hanuman',title:'The Brave General',thai:'หนุมาน',sigil:'H',skin:[0.91,0.88,0.78],cloth:[0.76,0.21,0.11],cloth2:[0.95,0.48,0.13],gold:[1,0.72,0.26],hp:145,damage:1.06,speed:5.6,style:'Mace combat • high vitality',bio:'The white Vanara general, blessed with extraordinary strength, speed, and unshakable devotion.',portrait:'hanumanPortrait',previewArt:'ocean',skills:['CELESTIAL MACE','VANARA LEAP','WIND AURA']},
 lakshmana:{id:'lakshmana',name:'Lakshmana',title:'The Loyal Brother',thai:'พระลักษมณ์',sigil:'L',skin:[0.68,0.66,0.45],cloth:[0.12,0.39,0.28],cloth2:[0.78,0.15,0.16],gold:[0.94,0.69,0.25],hp:108,damage:1.12,speed:5.4,style:'Rapid bow • high critical power',bio:'Rama’s devoted brother, a master archer whose speed and precision turn the tide of battle.',portrait:'lakshmanaPortrait',previewArt:'siege',skills:['DOUBLE ARROW','QUICKSTEP','WARDING LIGHT']},
 ravana:{id:'ravana',name:'Tosakanth',title:'The Ten-Crowned King',thai:'ทศกัณฐ์',sigil:'10',skin:[0.18,0.49,0.30],cloth:[0.36,0.06,0.11],cloth2:[0.7,0.11,0.12],gold:[0.97,0.57,0.13],hp:240,damage:1.38,speed:4.2,style:'Boss model • heavy melee',bio:'The fearsome king of Lanka, crowned in gold and shadow. This legend is the final enemy—not a playable warrior.',portrait:'ravanaPortrait',previewArt:'final',skills:['TENFOLD BLADE','DEMON SURGE','KING’S WRATH'],boss:true}
};

// ------- WebGL mini-engine: lit indexed meshes, perspective camera and scene graph matrices -------
const gl = canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
if(!gl){ $('home').innerHTML='<div style="margin:auto;max-width:600px;padding:28px;background:#071726;border:1px solid #dcb466">Your browser could not start WebGL 2. Please enable hardware acceleration or open this game in a recent desktop Chrome/Edge browser.</div>'; throw new Error('WebGL2 unavailable'); }
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);
const VSH=`#version 300 es
in vec3 aPosition; in vec3 aNormal;
uniform mat4 uMVP; uniform mat4 uModel; uniform vec3 uCamera;
out vec3 vNormal; out vec3 vWorld; out float vDistance;
void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vNormal=normalize(mat3(uModel)*aNormal);vDistance=length(uCamera-vWorld);gl_Position=uMVP*vec4(aPosition,1.0);}`;
const FSH=`#version 300 es
precision highp float;
in vec3 vNormal; in vec3 vWorld; in float vDistance;
uniform vec3 uColor; uniform vec3 uEmissive; uniform vec3 uLightDir; uniform vec3 uFogColor; uniform vec3 uCamera; uniform float uAlpha; uniform float uGloss;
out vec4 outColor;
void main(){vec3 N=normalize(vNormal);vec3 L=normalize(uLightDir);vec3 V=normalize(uCamera-vWorld);vec3 H=normalize(L+V);float dif=max(dot(N,L),0.0);float spec=pow(max(dot(N,H),0.0),mix(10.0,80.0,uGloss))*(.1+.5*uGloss);float rim=pow(1.0-max(dot(N,V),0.0),3.0)*.12;vec3 lit=uColor*(.26+.83*dif)+vec3(spec)+uEmissive+uColor*rim;float fog=smoothstep(24.0,63.0,vDistance);lit=mix(lit,uFogColor,fog*.82);outColor=vec4(lit,uAlpha);}`;
function compileShader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
const prog=gl.createProgram();gl.attachShader(prog,compileShader(gl.VERTEX_SHADER,VSH));gl.attachShader(prog,compileShader(gl.FRAGMENT_SHADER,FSH));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
const loc={pos:gl.getAttribLocation(prog,'aPosition'),normal:gl.getAttribLocation(prog,'aNormal'),mvp:gl.getUniformLocation(prog,'uMVP'),model:gl.getUniformLocation(prog,'uModel'),camera:gl.getUniformLocation(prog,'uCamera'),color:gl.getUniformLocation(prog,'uColor'),emissive:gl.getUniformLocation(prog,'uEmissive'),light:gl.getUniformLocation(prog,'uLightDir'),fog:gl.getUniformLocation(prog,'uFogColor'),alpha:gl.getUniformLocation(prog,'uAlpha'),gloss:gl.getUniformLocation(prog,'uGloss')};
function meshData(P,N,I){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(P),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);const n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(N),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,0,0);const ix=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ix);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(I),gl.STATIC_DRAW);gl.bindVertexArray(null);return {vao,count:I.length};}
function makeBox(){let P=[],N=[],I=[],faces=[[[0,-.5,-.5],[0,-.5,.5],[0,.5,.5],[0,.5,-.5]],[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5]]];
 const verts=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]];
 const norms=[[0,0,1],[0,0,-1],[0,1,0],[0,-1,0],[1,0,0],[-1,0,0]];for(let f=0;f<6;f++){const start=P.length/3;for(let k=0;k<4;k++){P.push(...verts[f*4+k]);N.push(...norms[f]);}I.push(start,start+1,start+2,start,start+2,start+3);}return meshData(P,N,I);}
function makeSphere(lat=14,lon=20){const P=[],N=[],I=[];for(let y=0;y<=lat;y++){const v=y/lat,phi=v*Math.PI;for(let x=0;x<=lon;x++){const u=x/lon,theta=u*TAU;const nx=-Math.cos(theta)*Math.sin(phi),ny=Math.cos(phi),nz=Math.sin(theta)*Math.sin(phi);P.push(nx*.5,ny*.5,nz*.5);N.push(nx,ny,nz);}}for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){const a=y*(lon+1)+x,b=a+lon+1;I.push(a,b,a+1,b,b+1,a+1);}return meshData(P,N,I);}
function makeCylinder(rt=1,rb=1,segs=16){const P=[],N=[],I=[];for(let y=0;y<2;y++){const yy=y-.5,r=y?rt:rb;for(let i=0;i<=segs;i++){const a=i/segs*TAU,x=Math.cos(a),z=Math.sin(a);P.push(x*r,yy,z*r);const n=norm3([x,(rb-rt),z]);N.push(...n);}}for(let i=0;i<segs;i++){const a=i,b=i+1,c=segs+1+i,d=c+1;I.push(a,c,b,b,c,d);}let topStart=P.length/3;P.push(0,.5,0);N.push(0,1,0);let botStart=P.length/3;P.push(0,-.5,0);N.push(0,-1,0);for(let i=0;i<segs;i++){I.push(topStart,segs+1+i+1,segs+1+i);I.push(botStart,i,i+1);}return meshData(P,N,I);}
function norm3(v){const l=Math.hypot(...v)||1;return v.map(n=>n/l);}
function makeTorus(R=1,r=.1,rs=28,ts=8){const P=[],N=[],I=[];for(let i=0;i<=rs;i++){const u=i/rs*TAU;for(let j=0;j<=ts;j++){const v=j/ts*TAU;const nx=Math.cos(u)*Math.cos(v),ny=Math.sin(v),nz=Math.sin(u)*Math.cos(v);P.push((R+r*Math.cos(v))*Math.cos(u),r*Math.sin(v),(R+r*Math.cos(v))*Math.sin(u));N.push(nx,ny,nz);}}for(let i=0;i<rs;i++)for(let j=0;j<ts;j++){const a=i*(ts+1)+j,b=a+ts+1;I.push(a,b,a+1,b,b+1,a+1);}return meshData(P,N,I);}
function makeArcTube(radius=.6,tube=.04,segments=32,radial=7){const P=[],N=[],I=[];for(let i=0;i<=segments;i++){const t=-1.34+(i/segments)*2.68;for(let j=0;j<=radial;j++){const a=j/radial*TAU;const cx=radius*Math.cos(t),cy=radius*Math.sin(t),nx=Math.cos(t)*Math.cos(a),ny=Math.sin(t)*Math.cos(a),nz=Math.sin(a);P.push(cx+tube*nx,cy+tube*ny,tube*nz);N.push(nx,ny,nz);}}for(let i=0;i<segments;i++)for(let j=0;j<radial;j++){const a=i*(radial+1)+j,b=a+radial+1;I.push(a,b,a+1,b,b+1,a+1);}return meshData(P,N,I);}
const M={box:makeBox(),sphere:makeSphere(),cyl:makeCylinder(),cone:makeCylinder(0,1),torus:makeTorus(),ring:makeTorus(1,.022,44,6),ringFX:makeTorus(1,.032,40,6),bow:makeArcTube(),smallSphere:makeSphere(8,12)};
const I4=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
function T(x,y,z){const m=I4();m[12]=x;m[13]=y;m[14]=z;return m;}
function S(x,y,z){const m=I4();m[0]=x;m[5]=y;m[10]=z;return m;}
function RX(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);}
function RY(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);}
function RZ(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);}
function Xf(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){return mul(mul(mul(mul(mul(T(x,y,z),RY(ry)),RX(rx)),RZ(rz)),S(sx,sy,sz)),I4());}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);const o=new Float32Array(16);o[0]=f/aspect;o[5]=f;o[10]=(far+near)*nf;o[11]=-1;o[14]=2*far*near*nf;return o;}
function lookAt(eye,center,up){const f=norm3([center[0]-eye[0],center[1]-eye[1],center[2]-eye[2]]),s=norm3([f[1]*up[2]-f[2]*up[1],f[2]*up[0]-f[0]*up[2],f[0]*up[1]-f[1]*up[0]]),u=[s[1]*f[2]-s[2]*f[1],s[2]*f[0]-s[0]*f[2],s[0]*f[1]-s[1]*f[0]];return new Float32Array([s[0],u[0],-f[0],0,s[1],u[1],-f[1],0,s[2],u[2],-f[2],0,-(s[0]*eye[0]+s[1]*eye[1]+s[2]*eye[2]),-(u[0]*eye[0]+u[1]*eye[1]+u[2]*eye[2]),f[0]*eye[0]+f[1]*eye[1]+f[2]*eye[2],1]);}
function rgb(arr){return arr;}
const staticCalls=[];let calls=[],transparentCalls=[];
function call(mesh,model,color,emissive=[0,0,0],alpha=1,gloss=.5){const obj={mesh,model,color,emissive,alpha,gloss};(alpha<.999?transparentCalls:calls).push(obj);}
function part(parent,mesh,transform,color,emissive=[0,0,0],alpha=1,gloss=.5){call(mesh,mul(parent,transform),color,emissive,alpha,gloss);}
const MAT=(x,y,z,rx,ry,rz,sx,sy,sz)=>Xf(x,y,z,rx,ry,rz,sx,sy,sz);
function groundObj(mesh,x,y,z,sx,sy,sz,color,rot=0,em=[0,0,0],gloss=.4){staticCalls.push({mesh,model:Xf(x,y,z,0,rot,0,sx,sy,sz),color,emissive:em,alpha:1,gloss});}
function cylinderObj(x,y,z,sx,sy,sz,color,rot=0){groundObj(M.cyl,x,y,z,sx,sy,sz,color,rot);}
function buildStageEnvironment(idx){staticCalls.length=0;const st=STAGES[idx],floor=st.floor;groundObj(M.box,0,-.38,0,34,.7,34,floor,0,[0,0,0],.08);groundObj(M.box,0,-.42,0,150,.7,150,floor.map(v=>v*.62),0,[0,0,0],.05);
 // Compact prop helpers for ceremonial banners, flame bowls and guardian figures.
 const banner=(x,z,h,col)=>{cylinderObj(x,h*.5,z,.035,h,.035,[.82,.63,.31]);groundObj(M.cone,x,h+.12,z,.10,.22,.10,[1,.83,.48],0,[.14,.05,.01],.8);groundObj(M.box,x-.25,h-.45,z,.48,.74,.055,col,0,[.06,.015,0],.45);groundObj(M.smallSphere,x-.25,h-.22,z+.04,.075,.075,.04,[1,.76,.31],0,[.12,.04,.005]);};
 const brazier=(x,z)=>{cylinderObj(x,.35,z,.19,.7,.19,[.47,.24,.12]);groundObj(M.cyl,x,.74,z,.30,.10,.30,[.86,.57,.22],0,[.15,.055,.008],.8);groundObj(M.cone,x,1.05,z,.24,.62,.24,[1,.25,.045],0,[.7,.09,.01],.25);groundObj(M.cone,x,1.21,z,.12,.40,.12,[1,.72,.21],0,[1,.38,.035],.15);};
 const guardian=(x,z,sc,col)=>{groundObj(M.box,x,.20,z,.82*sc,.34*sc,.55*sc,[.36,.23,.16]);groundObj(M.cyl,x,.70*sc,z,.27*sc,.78*sc,.27*sc,col);groundObj(M.sphere,x,1.19*sc,z,.36*sc,.40*sc,.32*sc,col,0,[.06,.02,0],.6);groundObj(M.cyl,x,1.47*sc,z,.33*sc,.10*sc,.33*sc,[.91,.65,.28],0,[.13,.04,.004],.85);groundObj(M.cone,x,1.73*sc,z,.29*sc,.45*sc,.29*sc,[.95,.67,.25],0,[.12,.04,.003],.8);groundObj(M.cone,x,2.02*sc,z,.11*sc,.25*sc,.11*sc,[1,.85,.48],0,[.15,.06,.008],.9);};
 // Raised ceremonial slabs, carved border lines and gold inlay circles.
 for(let x=-12;x<=12;x+=3)for(let z=-12;z<=12;z+=3){const tint=((Math.abs(x/3)+Math.abs(z/3))%2===0)?.018:-.012;groundObj(M.box,x,-.015,z,2.87,.055,2.87,floor.map(v=>clamp(v+tint,0,1)),0,[0,0,0],.12);}
 for(let k=-12;k<=12;k+=2){groundObj(M.box,k,.03,-14.1,1.8,.07,.08,[.7,.48,.21],0,[.06,.025,0],.7);groundObj(M.box,k,.03,14.1,1.8,.07,.08,[.7,.48,.21],0,[.06,.025,0],.7);}
 // Pillared Thai-inspired pavilion with tiered chofa-like roofs.
 const pillar=(x,z,h=3.3)=>{cylinderObj(x,h/2-0.05,z,.14,h,.14,[.73,.51,.27]);cylinderObj(x,h*.15,z,.24,.18,.24,[.92,.69,.3]);cylinderObj(x,h*.83,z,.23,.15,.23,[.92,.69,.3]);groundObj(M.cone,x,h+.22,z,.46,.48,.46,[.59,.18,.17],0,[.1,0,0],.5);groundObj(M.cone,x,h+.52,z,.34,.40,.34,[.79,.48,.18],0,[.04,.02,0],.5);groundObj(M.cone,x,h+.81,z,.21,.36,.21,[.87,.68,.33]);groundObj(M.cone,x,h+1.08,z,.08,.3,.08,[.96,.79,.47]);};
 for(const side of [-1,1]){for(let z=-10;z<=10;z+=5){pillar(side*12,z,2.65+(idx>2?.3:0));cylinderObj(side*12,3.5,z,.29,.14,.29,[.88,.63,.25]);} }
 // Gatehouse / royal towers
 const tower=(x,z,h,baseColor=[.55,.25,.16])=>{groundObj(M.box,x,.4,z,2.1,.8,2.1,baseColor);cylinderObj(x,1.4,z,.8,1.3,.8,[.77,.51,.24]);groundObj(M.cone,x,2.35,z,1.65,.8,1.65,[.68,.15,.15]);groundObj(M.cone,x,2.83,z,1.35,.7,1.35,[.84,.39,.13]);groundObj(M.cone,x,3.29,z,.98,.66,.98,[.94,.66,.28]);groundObj(M.cone,x,3.75,z,.62,.72,.62,[.96,.78,.41]);groundObj(M.cone,x,4.27,z,.27,.68,.27,[1,.84,.49]);groundObj(M.cone,x,4.75,z,.07,.45,.07,[1,.9,.65]);};
 tower(-8,-12,5);tower(8,-12,5);
 // stage flora, sea walls, war pyres, and signature silhouettes
 if(idx===0){for(let i=0;i<18;i++){const x=rand(-14,14),z=rand(-12,12);if(Math.abs(x)<4&&Math.abs(z)<4)continue;const h=rand(2.6,4.8);cylinderObj(x,h*.42,z,.20,h*.84,.20,[.28,.18,.1]);groundObj(M.cone,x,h*.84,z,rand(1.1,1.7),h*.82,rand(1.1,1.7),choose([[.09,.27,.17],[.12,.38,.22],[.17,.42,.25],[.2,.31,.18]]),0,[0,.015,0]);groundObj(M.sphere,x-.25,h*.95,z+.15,.75,.72,.75,[.24,.43,.25]);}for(let i=0;i<20;i++){const x=rand(-13,13),z=rand(-13,13);groundObj(M.smallSphere,x,rand(.2,2.2),z,.05,.05,.05,[.55,.95,.61],0,[.1,.55,.22]);}}
 if(idx===1){groundObj(M.box,0,-.12,0,7,.26,30,[.36,.38,.39]);for(let z=-13;z<13;z+=2.2){groundObj(M.box,0,.035,z,6.8,.08,1.9,[.55,.53,.46]);groundObj(M.box,-3.35,.13,z,.15,.22,1.9,[.83,.61,.29]);groundObj(M.box,3.35,.13,z,.15,.22,1.9,[.83,.61,.29]);}for(const side of [-1,1])for(let z=-10;z<=10;z+=5){cylinderObj(side*5,.3,z,.25,.6,.25,[.44,.43,.4]);groundObj(M.cone,side*5,.76,z,.45,.42,.45,[.85,.58,.24]);groundObj(M.sphere,side*5,1.02,z,.19,.19,.19,[.2,.66,.95],0,[0,.2,.7]);}}
 if(idx===2){groundObj(M.box,0,-.18,0,8,.35,31,[.37,.35,.3]);for(let z=-13;z<=13;z+=2){groundObj(M.box,0,.02,z,7.7,.08,1.88,[.62,.56,.43]);groundObj(M.box,-3.9,.13,z,.14,.24,1.8,[.92,.69,.3]);groundObj(M.box,3.9,.13,z,.14,.24,1.8,[.92,.69,.3]);}for(const side of [-1,1])for(let z=-10;z<10;z+=4){cylinderObj(side*5,.8,z,.32,1.6,.32,[.47,.42,.35]);groundObj(M.box,side*5,1.72,z,.9,.15,.9,[.78,.6,.35]);}}
 if(idx>=3){for(const side of [-1,1]){for(let z=-13;z<=13;z+=3.3){groundObj(M.box,side*13,1.3,z,1.1,2.6,2.4,[.38,.16,.15]);groundObj(M.box,side*13,2.75,z,1.7,.25,2.6,[.67,.3,.14]);groundObj(M.cone,side*13,3.5,z,1,.9,1,[.73,.12,.1]);groundObj(M.cone,side*13,4.1,z,.55,.65,.55,[.93,.51,.2]);}}
  for(const side of [-1,1])for(let z=-11;z<=11;z+=5.5){cylinderObj(side*8,.45,z,.3,.9,.3,[.34,.12,.12]);groundObj(M.cone,side*8,1.15,z,.53,.66,.53,[.97,.25,.08],0,[.18,.04,.01]);groundObj(M.sphere,side*8,1.0,z,.32,.4,.32,[1,.26,.04],0,[.6,.08,.01]);}}
 if(idx===4){groundObj(M.ring,0,.08,0,1.9,.3,1.9,[.55,.15,.18],0,[.11,0,0],.8);for(let i=0;i<12;i++){const a=i/12*TAU,x=Math.cos(a)*10,z=Math.sin(a)*10;pillar(x,z,3.2);groundObj(M.sphere,x,3.45,z,.16,.16,.16,[1,.57,.18],0,[.5,.14,.02]);}groundObj(M.box,0,.03,-11,9,.3,1,[.32,.09,.12]);for(let i=0;i<7;i++){const x=-6+i*2;groundObj(M.cone,x,rand(2.5,4.0),-10,.7,2,.7,[.38,.08,.13]);}}
 // Stage storytelling props, kept near the arena edge so combat lanes stay open.
 if(idx===0){
  for(const side of [-1,1])for(let z=-6;z<=10;z+=8){guardian(side*8.6,z,1.12,[.31,.51,.34]);groundObj(M.torus,side*8.6,.11,z,1.0,.12,1.0,[.21,.56,.31],0,[.03,.08,.025],.4);}
 }else if(idx===1){
  for(const side of [-1,1])for(let z=-8;z<=8;z+=8){guardian(side*4.35,z,.9,[.42,.51,.57]);groundObj(M.ring,side*4.85,.20,z,.35,.3,.35,[.24,.72,.95],0,[.06,.28,.6],.8);}
 }else if(idx===2){
  for(const side of [-1,1])for(let z=-8;z<=8;z+=8){guardian(side*4.45,z,.92,[.59,.49,.32]);groundObj(M.box,side*5.05,.25,z,.18,.45,1.4,[.83,.64,.32],0,[.07,.025,.003],.8);}
 }else{
  for(const side of [-1,1]){banner(side*10.7,-7,4.0,idx===4?[.42,.04,.10]:[.62,.10,.07]);banner(side*10.7,1,3.6,idx===4?[.53,.05,.08]:[.78,.17,.07]);brazier(side*7.0,-6);brazier(side*7.0,6);guardian(side*9.5,0,1.1,[.39,.16,.14]);}
  for(let z=-10;z<=10;z+=10)groundObj(M.torus,0,.10,z,2.0,.14,2.0,[.85,.44,.19],0,[.08,.02,.006],.8);
 }
 // ornate arena sigil at center.
 groundObj(M.ring,0,.035,0,5,.22,5,[.84,.58,.24],0,[.06,.025,0],.85);groundObj(M.ring,0,.045,0,3.4,.22,3.4,[.87,.73,.43],0,[.05,.03,0],.7);groundObj(M.ring,0,.05,0,1.7,.22,1.7,[.7,.21,.16],0,[.08,.01,0],.6);
}

// ------- Characters are real 3D mesh assemblies; motion is animated at each joint. -------
function fighterDraw(f,t,hero=false,boss=false){const cfg=hero?HEROES[f.type]||HEROES.rama:(boss?HEROES.ravana:null);const skin=cfg?cfg.skin:(f.skin||[.37,.49,.27]),cloth=cfg?cfg.cloth:(f.cloth||[.37,.1,.13]),cloth2=cfg?cfg.cloth2:(f.cloth2||[.68,.16,.13]),gold=cfg?cfg.gold:(f.gold||[.91,.57,.19]);const sc=(f.scale||1)*(boss?1.3:hero?1.25:1.12);const run=hero?Math.min(1,Math.hypot(input.x,input.z)):Math.min(1,Math.hypot(f.vx||0,f.vz||0));const swing=Math.sin(t*8+(f.seed||0))*0.42*run, bob=Math.abs(Math.sin(t*8+(f.seed||0)))*.06*run;const root=Xf(f.x,bob,f.z,0,f.angle||0,0,sc,sc,sc);const add=(mesh,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0,em=[0,0,0],gloss=.55)=>part(root,mesh,MAT(x,y,z,rx,ry,rz,sx,sy,sz),color,em,1,gloss);
 if(!hero){
  // Low-cost but dimensional rakshasa rig: armour silhouette, animated limbs, horned chada and steel weapon.
  add(M.cyl,0,.76,0,.39,.43,.31,cloth,0,0,0,[.02,0,0],.35);add(M.sphere,0,1.24,0,.48,.54,.32,cloth,0,0,0,[.02,0,0],.45);add(M.box,0,1.23,.21,.52,.40,.15,gold,0,0,0,[.09,.035,0],.8);add(M.sphere,0,1.27,.294,.19,.20,.065,cloth2,0,0,0,[.06,.01,0],.65);add(M.smallSphere,0,1.28,.355,.045,.052,.022,[1,.22,.08],0,0,0,[.6,.035,0],.25);for(let side of [-1,1]){add(M.cone,side*.17,1.34,.32,.07,.17,.06,gold,0,0,side*-.3,[.11,.03,0],.75);add(M.torus,side*.43,1.46,.015,.18,.03,.17,gold,0,0,0,[.08,.025,0],.75);}add(M.cyl,0,.93,0,.44,.10,.34,gold,0,0,0,[.10,.035,0],.85);
  for(const side of [-1,1]){add(M.sphere,side*.43,1.46,0,.26,.20,.29,gold,0,0,side*-.2,[.09,.025,0],.75);add(M.cyl,side*.20,.48,0,.16,.88,.16,cloth2,swing*side,0,0);add(M.cyl,side*.47,1.14,0,.145,.60,.145,skin,swing*side,0,side*-.12);add(M.sphere,side*.47,1.48,0,.17,.16,.18,gold,0,0,side*-.15,[.1,.03,0],.75);}
  add(M.cyl,0,1.72,0,.13,.24,.13,skin);add(M.sphere,0,2.02,0,.31,.34,.27,skin,0,0,0,[.04,.012,0],.48);add(M.sphere,-.12,2.07,.22,.05,.045,.025,[1,.06,.025],0,0,0,[.55,.015,.005],.2);add(M.sphere,.12,2.07,.22,.05,.045,.025,[1,.06,.025],0,0,0,[.55,.015,.005],.2);add(M.cone,-.115,1.91,.255,.045,.10,.035,[.94,.82,.65],Math.PI,0,.12,[.04,.025,.01],.65);add(M.cone,.115,1.91,.255,.045,.10,.035,[.94,.82,.65],Math.PI,0,-.12,[.04,.025,.01],.65);add(M.box,0,2.145,.238,.30,.045,.035,[.18,.06,.045],0,0,0,[.035,.005,0],.35);add(M.cyl,0,2.30,0,.28,.09,.28,gold,0,0,0,[.12,.04,0],.85);add(M.cone,0,2.54,0,.25,.48,.25,gold,0,0,0,[.12,.03,0],.8);
  for(const side of [-1,1]){add(M.cone,side*.25,2.45,-.02,.12,.35,.12,[.25,.08,.055],0,0,side*-.28,[.06,0,0],.4);}
  add(M.cyl,.67,.75,.02,.055,1.14,.055,[.27,.13,.11],0,0,0,[.12,.01,0],.75);add(M.sphere,.67,1.38,.02,.22,.24,.22,gold,0,0,0,[.13,.035,0],.8);
  if(boss){
   // Nine secondary heads around the central face: a readable ten-headed Tosakanth silhouette.
   const heads=[[-.76,2.10,-.08,.125],[-.54,2.19,-.10,.14],[-.29,2.26,-.13,.145],[0,2.29,-.15,.145],[.29,2.26,-.13,.145],[.54,2.19,-.10,.14],[.76,2.10,-.08,.125],[-.43,1.86,-.19,.12],[.43,1.86,-.19,.12]];
   for(const [hx,hy,hz,r] of heads){
    add(M.sphere,hx,hy,hz,r*1.05,r*1.16,r,skin,0,0,0,[.055,.01,0],.48);
    add(M.cyl,hx,hy+r*1.05,hz,r*1.08,r*.36,r*1.08,gold,0,0,0,[.12,.045,.005],.9);
    add(M.cone,hx,hy+r*1.67,hz,r*.83,r*1.35,r*.83,gold,0,0,0,[.14,.035,0],.88);
    add(M.cone,hx,hy+r*2.52,hz,r*.42,r*.76,r*.42,[1,.82,.43],0,0,0,[.25,.12,.025],.92);
    add(M.smallSphere,hx,hy+.015,hz+r*.86,.022,.024,.012,[1,.07,.025],0,0,0,[.55,.01,0],.2);
   }
  }
  return;
 }
 // cloth silhouette, waist sash and layered chest armour
 add(M.cyl,0,.78,0,.39,.42,.30,cloth,0,0,0,[.01,0,0],.3);add(M.sphere,0,1.23,0,.43,.54,.29,cloth,0,0,0,[.015,.01,.01],.55);add(M.box,0,1.22,.205,.48,.43,.12,gold,0,0,0,[.1,.045,.01],.86);add(M.box,0,.94,.255,.42,.10,.11,cloth2,0,0,0,[.06,.01,.01],.55);add(M.sphere,0,1.02,.31,.08,.11,.06,[1,.84,.39],0,0,0,[.3,.13,.025],.9);add(M.cyl,0,.93,0,.43,.095,.34,gold,0,0,0,[.10,.06,.015],.88);
 // sash over chest and ceremonial shoulder guards
 add(M.box,-.11,1.25,.278,.12,.62,.09,cloth2,0,0,-.45,[.07,.01,.01],.55);add(M.box,.11,1.24,.283,.07,.56,.085,gold,0,0,.40,[.12,.065,.01],.9);
 for(const side of [-1,1]){add(M.sphere,side*.43,1.47,0,.25,.20,.29,gold,0,0,side*-.22,[.11,.05,.008],.8);add(M.sphere,side*.46,1.48,.04,.17,.12,.23,cloth2,0,0,side*-.25,[.06,.01,.01],.6);add(M.sphere,side*.27,1.04,.02,.20,.13,.20,cloth2,0,0,0,[.02,0,0],.35);}
 // segmented legs, anklets and gold greaves
 for(const side of [-1,1]){const legRoot=mul(root,MAT(side*.19,.78,0,swing*side,0,0,1,1,1));part(legRoot,M.cyl,MAT(0,-.20,0,0,0,0,.19,.50,.19),cloth, [0,0,0],1,.35);part(legRoot,M.cyl,MAT(0,-.42,.012,0,0,0,.18,.12,.18),gold,[.08,.04,0],1,.85);const calf=mul(legRoot,MAT(0,-.44,0,-swing*side*.45,0,0,1,1,1));part(calf,M.cyl,MAT(0,-.17,0,0,0,0,.145,.42,.145),cloth2,[.02,0,0],1,.4);part(calf,M.cyl,MAT(0,-.18,.09,0,0,0,.155,.25,.075),gold,[.1,.05,.01],1,.85);part(calf,M.box,MAT(0,-.39,.075,0,0,0,.32,.12,.42),[.22,.15,.13],[0,0,0],1,.25);part(legRoot,M.box,MAT(0,-.19,.13,0,0,side*.04,.205,.26,.075),gold,[.07,.035,0],1,.84);part(legRoot,M.smallSphere,MAT(0,-.19,.176,0,0,0,.035,.055,.018),[1,.79,.32],[.12,.05,.005],1,.8);part(calf,M.torus,MAT(0,-.11,0,0,0,0,.148,.148,.148),gold,[.10,.04,.005],1,.88);}
 // arm joints with bracers, wrist cuffs and hands
 for(const side of [-1,1]){const armRoot=mul(root,MAT(side*.47,1.43,0,swing*(side===1?1:-1)+(hero?.06:0),0,side*-.15,1,1,1));part(armRoot,M.cyl,MAT(0,-.20,0,0,0,0,.17,.43,.17),skin);part(armRoot,M.sphere,MAT(0,-.03,0,0,0,0,.205,.20,.205),gold,[.10,.04,0]);part(armRoot,M.torus,MAT(0,-.33,0,0,0,0,.165,.165,.165),gold,[.1,.04,0],1,.9);part(armRoot,M.cyl,MAT(0,-.42,.01,0,0,0,.135,.12,.14),gold,[.10,.045,0],1,.8);part(armRoot,M.torus,MAT(0,-.48,0,0,0,0,.14,.14,.14),[1,.79,.36],[.12,.05,.005],1,.9);part(armRoot,M.cyl,MAT(0,-.59,0,0,0,0,.125,.31,.125),cloth2);part(armRoot,M.box,MAT(0,-.60,.105,0,0,0,.21,.24,.065),gold,[.05,.02,0],1,.8);part(armRoot,M.smallSphere,MAT(0,-.60,.151,0,0,0,.035,.06,.023),[1,.78,.28],[.18,.07,.01],1,.8);part(armRoot,M.torus,MAT(0,-.72,0,0,0,0,.12,.12,.12),gold,[.1,.04,0],1,.85);part(armRoot,M.sphere,MAT(0,-.78,.03,0,0,0,.11,.12,.115),skin);}
 // neck and expressive head
 add(M.cyl,0,1.72,0,.13,.24,.13,skin);add(M.sphere,0,2.02,0,.285,.34,.255,skin,0,0,0,[.035,.018,.01],.45);add(M.sphere,-.112,2.065,.209,.051,.06,.025,[.96,.88,.70],0,0,0,[.1,.06,.03],.35);add(M.sphere,.112,2.065,.209,.051,.06,.025,[.96,.88,.70],0,0,0,[.1,.06,.03],.35);add(M.sphere,-.112,2.065,.231,.024,.035,.018,[.06,.08,.1]);add(M.sphere,.112,2.065,.231,.024,.035,.018,[.06,.08,.1]);add(M.sphere,0,1.98,.25,.055,.055,.06,skin);
 // hair, crown base, tiered gold chada, pointed crest and gems
 add(M.sphere,0,2.24,-.03,.30,.18,.27,cloth===HEROES.ravana?.2:cloth2,0,0,0,[.015,0,0],.3);add(M.cyl,0,2.30,0,.275,.09,.275,gold,0,0,0,[.10,.05,.01],.9);add(M.cone,0,2.49,0,.255,.38,.255,gold,0,0,0,[.13,.06,.01],.9);add(M.cone,0,2.72,-.01,.165,.28,.165,gold,0,0,0,[.16,.07,.012],.9);add(M.cone,0,2.91,-.01,.08,.20,.08,[1,.85,.47],0,0,0,[.28,.13,.025],.95);add(M.sphere,0,2.49,.235,.06,.08,.04,[.25,.85,.98],0,0,0,[.06,.25,.38],.8);
 // shoulder cape and back plate
 add(M.box,0,1.36,-.22,.8,.49,.12,cloth,0,0,0,[.015,0,0],.25);add(M.box,0,1.16,-.235,.70,.10,.13,cloth2,0,0,0,[.04,0,0],.5);
 // Gold shoulder chains, silk robe panels and a forehead tilak evoke Thai Khon regalia.
 // Layered Khon regalia: enamel breastplate, jewel settings, filigree and waist ornaments.
 add(M.sphere,0,1.30,.292,.245,.30,.075,gold,0,0,0,[.16,.07,.012],.96);
 add(M.sphere,0,1.31,.358,.125,.19,.034,cloth2,0,0,0,[.08,.012,.008],.7);
 add(M.smallSphere,0,1.33,.395,.052,.065,.025,hero?(f.type==='sita'?[.98,.43,.7]:[.3,.86,1]):[1,.25,.12],0,0,0,[.48,.2,.07],.3);
 add(M.torus,0,1.23,.35,.18,.035,.045,gold,Math.PI/2,0,0,[.10,.045,.008],.92);
 for(let row=0;row<3;row++)for(const side of [-1,1]){
  add(M.sphere,side*(.17-row*.018),1.40-row*.105,.324,.075,.042,.026,row===1?cloth2:gold,0,0,side*.12,[.08,.025,.004],.8);
  add(M.smallSphere,side*(.17-row*.018),1.40-row*.105,.354,.022,.022,.012,[1,.81,.37],0,0,0,[.24,.12,.02],.7);
 }
 for(const side of [-1,1]){
  add(M.cone,side*.48,1.56,-.015,.16,.29,.16,gold,0,0,side*-.42,[.13,.045,.006],.85);
  add(M.torus,side*.46,1.48,.015,.19,.035,.17,gold,0,0,0,[.11,.045,.008],.88);
  add(M.smallSphere,side*.46,1.48,.224,.045,.045,.03,cloth2,0,0,0,[.23,.08,.01],.65);
 }
 // Crest finials and gemstone studs break up the simple cone crown silhouette.
 add(M.torus,0,2.39,0,.275,.026,.275,[1,.83,.43],0,0,0,[.12,.045,.005],.96);
 add(M.torus,0,2.61,0,.205,.022,.205,[1,.76,.31],0,0,0,[.1,.035,.003],.92);
 for(let i=0;i<8;i++){
  const a=i/8*TAU,px=Math.cos(a)*.205,pz=Math.sin(a)*.205;
  add(M.cone,px,2.56,pz,.045,.18,.045,gold,0,-a,Math.cos(a)*.35,[.12,.035,.004],.9);
  add(M.smallSphere,px*1.06,2.47,pz*1.06,.025,.032,.025,i%2?[.24,.82,1]:[1,.29,.23],0,0,0,[.24,.08,.02],.45);
 }
 // Gilded belt plate, hanging silk tabs and repeating waist gems.
 add(M.box,0,.91,.292,.25,.13,.075,gold,0,0,0,[.12,.055,.006],.92);
 add(M.smallSphere,0,.91,.342,.052,.058,.024,[1,.79,.33],0,0,0,[.32,.13,.02],.7);
 for(let i=0;i<5;i++){
  const x=(i-2)*.115;
  add(M.box,x,.59,.238,.075,.46,.055,i%2?cloth2:cloth,0,0,(i-2)*-.035,[.025,.005,0],.45);
  add(M.smallSphere,x,.35,.274,.025,.04,.022,gold,0,0,0,[.09,.035,.002],.8);
 }
 add(M.box,-.18,.66,.19,.19,.43,.08,cloth2,0,0,-.12,[.015,0,0],.32);add(M.box,.18,.66,.19,.19,.43,.08,cloth2,0,0,.12,[.015,0,0],.32);add(M.sphere,0,1.43,.315,.07,.07,.04,[1,.84,.42],0,0,0,[.2,.09,.015],.92);add(M.sphere,0,2.155,.245,.027,.075,.02,[.92,.12,.13],0,0,0,[.35,.025,.015],.75);
 for(const side of [-1,1]){add(M.box,side*.115,2.13,.235,.085,.025,.024,[.23,.12,.08],0,0,side*-.08);add(M.torus,side*.28,1.99,.015,.075,.075,.035,gold,Math.PI/2,0,0,[.12,.05,.01],.78);}
 if(hero){
  if(f.type==='hanuman'){// Vanara muzzle, cheek fur, white crest and divine mace
   add(M.bow,-.27,.67,-.43,.78,1.05,.82,[.94,.90,.80],0,0,Math.sin(t*1.8)*.17,[.02,.012,.004],.32);
   add(M.sphere,0,1.99,.24,.17,.13,.16,[.95,.89,.77]);add(M.sphere,0,1.93,.30,.07,.05,.035,[.22,.12,.06]);add(M.sphere,0,2.26,-.02,.16,.18,.17,[.95,.92,.82]);for(let side of [-1,1]){add(M.sphere,side*.18,2.16,.14,.095,.13,.10,[.94,.88,.75],0,0,side*.35);add(M.cone,side*.22,2.12,.23,.055,.16,.055,[.97,.91,.8],0,0,side*-.38);add(M.smallSphere,side*.10,2.03,.348,.024,.027,.015,[.08,.06,.045],0,0,0,[.09,.035,.01],.3);}part(root,M.bow,MAT(.28,.68,-.40,-Math.PI/2,0,.35,.34,.62,.34),[.91,.88,.78],[.015,.01,0],1,.35);
   add(M.cyl,.67,.78,.02,.055,1.2,.055,[.7,.38,.12],0,0,0,[.05,.02,0],.7);add(M.torus,.67,1.23,.02,.13,.035,.13,gold,0,0,0,[.12,.04,.005],.9);add(M.sphere,.67,1.43,.02,.22,.25,.22,gold,0,0,0,[.2,.07,.01],.9);add(M.torus,.67,1.43,.02,.22,.035,.22,gold,0,0,0,[.14,.055,.008],.92);for(let i=0;i<8;i++){const a=i/8*TAU;add(M.cone,.67+Math.cos(a)*.19,1.43+Math.sin(a)*.19,.02,.045,.16,.045,gold,0,-a,Math.cos(a)*.55,[.15,.05,.005],.9);}add(M.cone,.67,1.62,.02,.17,.25,.17,[1,.76,.29],0,0,0,[.18,.07,0],.8);
  }else if(f.type==='rama'||f.type==='lakshmana'){// Bow and string, carried at the left of the body
   const broot=mul(root,MAT(-.63,1.28,.04,0,0,-.12,1,1,1));part(broot,M.bow,MAT(0,0,0,0,0,0,.61,.86,.48),gold,[.18,.08,.01],1,.95);part(broot,M.cyl,MAT(0,0,0,0,0,0,.018,1.18,.018),[.76,.83,.75],[.1,.1,.1],1,.6);part(broot,M.smallSphere,MAT(0,.62,0,0,0,0,.09,.09,.09),[.94,.77,.39],[.2,.08,0]);for(let i=0;i<5;i++){const yy=-.43+i*.21;add(M.smallSphere,-.63,1.28+yy,.17,.035,.035,.022,i%2?cloth2:[1,.82,.35],0,0,0,[.12,.045,.005],.82);}
  }else if(f.type==='sita'){
    add(M.sphere,0,2.28,-.045,.32,.16,.29,[.13,.075,.055],0,0,0,[.012,.004,0],.3);
    add(M.sphere,-.235,2.13,-.025,.105,.30,.12,[.12,.065,.05],0,0,-.08);
    add(M.sphere,.235,2.13,-.025,.105,.30,.12,[.12,.065,.05],0,0,.08);
    add(M.box,-.29,.92,-.05,.12,.88,.13,[.15,.07,.07],0,0,-.16);
    add(M.box,.29,.92,-.05,.12,.88,.13,[.15,.07,.07],0,0,.16);
    add(M.box,0,1.19,.29,.15,.54,.08,[.97,.64,.69],0,0,-.22,[.06,.02,.025],.58);
    add(M.box,.11,.92,.29,.10,.43,.075,[1,.79,.52],0,0,.22,[.1,.04,.012],.82);
    add(M.sphere,0,2.28,.02,.32,.12,.30,cloth2,0,0,0,[.045,.01,.02],.55);
    add(M.torus,0,2.32,.015,.29,.025,.29,gold,0,0,0,[.12,.05,.008],.9);
    add(M.sphere,0,2.47,0,.30,.06,.27,gold,0,0,0,[.1,.05,.01],.85);
    for(let i=-2;i<=2;i++){add(M.smallSphere,i*.095,2.46,.248,.027,.035,.018,i%2?[1,.44,.68]:[.34,.83,1],0,0,0,[.25,.1,.025],.55);}
    add(M.torus,0,1.12,.32,.15,.06,.08,[1,.7,.34],0,0,0,[.15,.04,.01]);
    add(M.sphere,0,.73,.29,.12,.15,.05,[1,.56,.69],0,0,0,[.12,.035,.025],.55);
    for(let i=0;i<5;i++){const a=i/5*TAU;add(M.smallSphere,Math.cos(a)*.16,1.00+Math.sin(a)*.08,.32,.035,.045,.022,[1,.75,.37],0,0,0,[.2,.08,.01],.8);}
   }
 }else{
  // Rakshasa: wide pauldrons, horned crest, crimson eye glow, claw tips and weapon.
  add(M.sphere,0,1.99,.22,.29,.28,.15,skin,0,0,0,[.08,.015,0],.45);add(M.sphere,-.12,2.08,.34,.045,.035,.025,[1,.06,.025],0,0,0,[.45,.01,0]);add(M.sphere,.12,2.08,.34,.045,.035,.025,[1,.06,.025],0,0,0,[.45,.01,0]);
  for(const side of [-1,1]){add(M.cone,side*.21,2.54,-.01,.12,.33,.12,[.24,.09,.07],0,0,side*-.3,[.09,0,0]);add(M.sphere,side*.47,1.48,-.02,.27,.20,.32,gold,0,0,side*-.2,[.11,.035,0],.8);}
  add(M.cyl,.68,.77,.02,.04,1.18,.04,[.25,.11,.10]);add(M.sphere,.68,1.43,.02,.18,.23,.18,[.46,.16,.11],0,0,0,[.1,0,0],.7);
 }
 if(boss){ // Multiple small crowned heads establish the ten-headed Ravana/Tosakanth silhouette.
  for(let i=0;i<4;i++){const side=i<2?-1:1,layer=i%2;add(M.sphere,side*(.25+layer*.30),2.12-layer*.045,-.035,.18,.22,.18,skin);add(M.sphere,side*(.25+layer*.30),2.30-layer*.045,-.035,.19,.07,.19,gold);add(M.cone,side*(.25+layer*.30),2.43-layer*.045,-.035,.13,.23,.13,gold,0,0,0,[.1,.04,0]);}
 }
}

// Scene/background data, effects, enemy AI and combat state.
let player=null,enemies=[],projectiles=[],fx=[],floaters=[],input={x:0,z:0},touchInput={x:0,z:0},keys={},lastTime=0,elapsed=0,spawnClock=0,waveSpawnRemaining=0,wave=1,kills=0,xp=0,level=1,xpNeed=6,gems=0,attackClock=0,invuln=0,gamePaused=false,bossEnemy=null,frameCount=0,fpsClock=0,currentFps=60;
let skillCD=[0,0,0],alertTime=0,stageKills=0,stageReward=0,waveBossSpawned=false;
function setBackdrop(key){backdrop.style.backgroundImage=`url("${art(key)}")`;backdrop.style.backgroundPosition='center';}
function switchScreen(id){screens.forEach(s=>$(s).classList.toggle('active',s===id));mode=id; if(id==='home'||id==='armory'||id==='audioScreen'||id==='settings')setBackdrop('title'); if(id==='chapters')setBackdrop(STAGES[selectedStage].art); if(id==='heroes')setBackdrop('title'); if(id==='audioScreen')refreshAudioUI(); if(id==='armory')updateArmory();}
function showToast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.classList.remove('show'),1900);}
function alertWave(title,sub){const el=$('waveAlert');el.innerHTML=`${title}<br><small style="font:500 11px Kanit;letter-spacing:.3em">${sub}</small>`;el.classList.add('show');alertTime=2.1;}

// Music uses the six original local MP3 compositions; effects stay on a separate synthesized bus.
let musicAudio=new Audio(), musicKey='',musicVolume=.55,sfxVolume=.7,audioCtx=null;
musicAudio.loop=true;musicAudio.preload='auto';
function setMusic(key){if(!musicOn||!MUSIC[key])return;if(musicKey===key&&!musicAudio.paused)return;musicKey=key;musicAudio.src=MUSIC[key];musicAudio.volume=musicVolume;const p=musicAudio.play();if(p&&p.catch)p.catch(()=>{});}
function resumeAudio(){audioUnlocked=true;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();if(musicOn&&musicKey)setMusic(musicKey);}catch(e){} }
function tone(freq,dur,type='sine',vol=.05,slide=1){if(!soundOn||sfxVolume<=0)return;try{resumeAudio();const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(Math.max(35,freq*slide),now+dur);g.gain.setValueAtTime(Math.max(.0001,vol*sfxVolume),now);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+dur+.02);}catch(e){}}
function sfx(type){if(!soundOn)return;const cues={hit:()=>{tone(155,.12,'triangle',.12,.46);tone(520,.055,'sine',.05,.7)},arrow:()=>{tone(720,.09,'sawtooth',.04,.38);tone(1150,.11,'sine',.04,.55)},leap:()=>{tone(110,.32,'sawtooth',.10,3.4);tone(420,.22,'triangle',.06,.45)},aura:()=>{tone(230,.35,'sine',.12,2.8);tone(740,.23,'triangle',.06,.38)},level:()=>{tone(540,.16,'sine',.06,1.4);setTimeout(()=>tone(810,.25,'sine',.08,1.3),100)},boss:()=>{tone(90,.8,'sawtooth',.11,.45);tone(65,.7,'triangle',.08,.55)},victory:()=>{tone(440,.22,'sine',.06,1.25);setTimeout(()=>tone(660,.25,'sine',.06,1.3),120);setTimeout(()=>tone(880,.45,'sine',.07,1.05),250)},click:()=>tone(560,.04,'sine',.025,.8)};if(cues[type])cues[type]();}
function toggleMusic(){const prior=musicKey;musicOn=!musicOn;$('musicToggle').style.color=musicOn?'#ffe5aa':'#718295';if(musicOn){resumeAudio();musicKey='';setMusic(mode==='battle'?STAGES[stageLive].music:(mode==='audioScreen'&&prior?prior:'menu'));}else musicAudio.pause();refreshAudioUI();}
function toggleSfx(){soundOn=!soundOn;$('sfxToggle').style.color=soundOn?'#ffe5aa':'#718295';if(soundOn)sfx('click');refreshAudioUI();}

const ARMORY=[
 {id:'health',icon:'♥',name:'Amrita Vitality',desc:'A blessing of unbroken life. Increase your maximum health before every chapter.',effect:'+12 starting HP per level',base:65,max:10},
 {id:'damage',icon:'✦',name:'Celestial Edge',desc:'Sharpen the divine weapons carried by the champions of Ayodhya.',effect:'+6% damage per level',base:85,max:10},
 {id:'speed',icon:'➹',name:'Wind of Hanuman',desc:'A Vanara blessing that makes every dodge and reposition faster.',effect:'+4% movement speed per level',base:70,max:10},
 {id:'fortune',icon:'◈',name:'Treasury of Lanka',desc:'Recover more gems from defeated enemies to fund future upgrades.',effect:'+10% gem rewards per level',base:95,max:10}
];
function updateArmory(){const host=$('armoryCards');if(!host)return;$('armoryGems').textContent=Math.floor(totalGems);host.innerHTML='';let purchases=0;for(const item of ARMORY){const lv=permanent[item.id]||0;purchases+=lv;const cost=Math.round(item.base*(1+lv*.75));const card=document.createElement('article');card.className='shopCard';card.innerHTML=`<div class="shopIcon">${item.icon}</div><div class="shopLevel">PERMANENT BLESSING • LV ${lv}/${item.max}</div><h3>${item.name}</h3><p>${item.desc}</p><div class="shopEffect">${item.effect}</div><button class="goldbtn" ${lv>=item.max||totalGems<cost?'disabled':''}>${lv>=item.max?'MAXIMUM LEVEL':`UPGRADE • ${cost} GEMS`}</button>`;card.querySelector('button').addEventListener('click',()=>{const current=permanent[item.id]||0;const price=Math.round(item.base*(1+current*.75));if(current>=item.max||totalGems<price){sfx('click');return;}totalGems-=price;permanent[item.id]=current+1;persist();sfx('level');updateArmory();});host.appendChild(card);}$('armoryTotal').textContent=`${purchases} PURCHASES • ALL CHAPTERS`; }
function buildAudioBrowser(){const host=$('trackList');if(!host)return;host.innerHTML='';for(const st of STAGES){const b=document.createElement('button');b.className='trackButton'+(musicKey===st.music?' active':'');b.innerHTML=`<span class="trackThumb" style="background-image:url('${art(st.art)}')"></span><span style="min-width:0"><span class="trackTitle">0${st.id+1} • ${st.name}</span><span class="trackSub">${st.subtitle.toUpperCase()} • ORIGINAL THEME</span></span><span style="margin-left:auto;color:#e2bd72">▶</span>`;b.addEventListener('click',()=>{resumeAudio();if(!musicOn){musicOn=true;musicAudio.volume=musicVolume;}musicKey='';setBackdrop(st.art);setMusic(st.music);refreshAudioUI();});host.appendChild(b);}}
function refreshAudioUI(){const mt=$('audioMusicToggle'),st=$('audioSfxToggle');if(mt)mt.textContent=musicOn?'♫ MUSIC ON':'♫ MUSIC OFF';if(st)st.textContent=soundOn?'◖)) SFX ON':'◖)) SFX OFF';const ml=$('audioMusicVolume'),sl=$('audioSfxVolume');if(ml)ml.value=musicVolume;if(sl)sl.value=sfxVolume;const wave=$('mainWaveform');if(wave&&!wave.dataset.built){wave.innerHTML=Array.from({length:38},(_,i)=>`<i style="--h:${18+((i*29+i*i*7)%79)}%;--d:${(i%9)*-.07}s"></i>`).join('');wave.dataset.built='1';}buildAudioBrowser();}

function buildChapterCards(){const grid=$('chapterCards');grid.innerHTML='';for(const st of STAGES){const b=document.createElement('button');b.className='chapterCard'+(st.id===selectedStage?' selected':'')+(st.id+1>unlocked?' locked':'');b.style.setProperty('--art',`url("${art(st.art)}")`);b.innerHTML=`<span class="cIndex">0${st.id+1} / CHAPTER</span>${st.id+1>unlocked?'<span class="lockTag">🔒 LOCKED</span>':''}<span class="cName">${st.name.toUpperCase()}</span><span class="cSub">${st.subtitle}</span><span class="stars">${'✦'.repeat(Math.max(1,5-st.id))}${'·'.repeat(st.id)}</span>`;b.addEventListener('click',()=>{if(st.id+1>unlocked){showToast('Clear the previous chapter to unlock this one.');sfx('click');return;}selectedStage=st.id;updateChapterInfo();buildChapterCards();setBackdrop(st.art);sfx('click');});grid.appendChild(b);}
 const mini=$('homeMini');mini.innerHTML='';for(const st of STAGES){const d=document.createElement('div');d.className='miniTile'+(st.id===selectedStage?' selected':'');d.style.backgroundImage=`url("${art(st.art)}")`;mini.appendChild(d);}}
function updateChapterInfo(){const st=STAGES[selectedStage];$('chapterNum').textContent=st.eyebrow;$('chapterTitle').innerHTML=st.name.toUpperCase().replace(' ','<br>');$('chapterThai').textContent=st.thai;$('chapterDesc').textContent=st.desc;$('chapterDiff').textContent=st.diff;$('chapterEnemies').textContent=st.enemy.toUpperCase();$('chapterReward').textContent=`REWARD · ${st.reward} GEMS`;$('chapterUnlocked').textContent=st.id+1<=unlocked?'UNLOCKED':'LOCKED';$('chapterStart').textContent=st.id+1>unlocked?'CHAPTER LOCKED':'ENTER CHAPTER →';$('chapterStart').disabled=st.id+1>unlocked;$('chapterStart').style.opacity=st.id+1>unlocked?'.5':'1';buildChapterCards();}
function updateHeroCards(){const host=$('heroCards');host.innerHTML='';for(const h of Object.values(HEROES)){const card=document.createElement('button');card.className='heroCard'+(selectedHero===h.id?' selected':'')+(h.boss?' boss':'');card.innerHTML=`<div class="avatar" style="--portrait:url('${art(h.portrait)}')"></div><h3>${h.name.toUpperCase()}</h3><div class="ht">${h.title}</div><div class="bio">${h.boss?'FINAL ENEMY':h.style.split('•')[0]}</div>`;card.addEventListener('click',()=>{if(h.boss){showToast('Tosakanth is the final chapter boss.');sfx('click');return;}selectedHero=h.id;updateHeroInfo();updateHeroCards();sfx('click');});host.appendChild(card);}updateHeroInfo();}
function updateHeroInfo(){const h=HEROES[selectedHero]||HEROES.rama;$('heroName').textContent=h.name.toUpperCase();$('heroBio').textContent=h.bio;$('previewHeroName').textContent=h.name.toUpperCase();$('previewHeroDesc').textContent=h.title.toUpperCase();$('heroStats').textContent=h.style;$('heroPreview').style.setProperty('--art',`url("${art(h.previewArt||h.portrait)}")`);$('hudIcon').textContent=h.sigil;}
function enterChapters(){selectedStage=clamp(selectedStage,0,unlocked-1);updateChapterInfo();switchScreen('chapters');sfx('click');}
function enterHeroes(origin='home'){heroEntry=origin;updateHeroCards();switchScreen('heroes');sfx('click');}
function startBattle(){resumeAudio();stageLive=selectedStage;const h=HEROES[selectedHero]||HEROES.rama;const maxHp=h.hp+(permanent.health||0)*12;player={x:0,z:3,angle:Math.atan2(9,13.8),health:maxHp,maxHealth:maxHp,damage:h.damage*(1+(permanent.damage||0)*.06),speed:h.speed*(1+(permanent.speed||0)*.04),type:selectedHero,level:1,xp:0,invuln:0};enemies=[];projectiles=[];fx=[];floaters=[];wave=1;kills=0;stageKills=0;level=1;xp=0;xpNeed=6;gems=0;stageReward=STAGES[stageLive].reward;attackClock=.65;invuln=0;skillCD=[0,0,0];bossEnemy=null;elapsed=0;spawnClock=0;waveSpawnRemaining=0;spawnWave();buildStageEnvironment(stageLive);setBackdrop(STAGES[stageLive].art);$('hudChapter').textContent=STAGES[stageLive].name.toUpperCase();$('hudStage').textContent=String(stageLive+1).padStart(2,'0');$('hudHeroName').textContent=h.name.toUpperCase()+' • LV 1';$('skillName0').textContent=h.skills[0];$('skillName1').textContent=h.skills[1];$('skillName2').textContent=h.skills[2];$('worldBanner').textContent=STAGES[stageLive].enemy.toUpperCase()+' APPROACH';$('bossbar').classList.remove('show');updateHUD();switchScreen('battle');setMusic(STAGES[stageLive].music);sfx('click');alertWave('WAVE 01',STAGES[stageLive].subtitle.toUpperCase());}
function spawnWave(){waveSpawnRemaining=(wave%5===0?1:4+Math.min(5,Math.floor(wave/2)));waveBossSpawned=false;spawnClock=.5;if(wave%5===0){waveSpawnRemaining+=Math.min(5,Math.floor(wave/2));}else if(stageLive===4&&wave>=8){waveSpawnRemaining+=2;}if(wave===20){waveSpawnRemaining=Math.max(1,waveSpawnRemaining);}$('hudWave').textContent=wave;alertWave('WAVE '+String(wave).padStart(2,'0'),wave%5===0?'ELITE FORCES ENTER THE FIELD':'THE BATTLE CONTINUES');}
function spawnEnemy(forceBoss=false){const a=rand(0,TAU),r=rand(9,13);const isBoss=!!forceBoss||(!waveBossSpawned&&wave%5===0);if(isBoss)waveBossSpawned=true;const type=choose(['rakshasa','rakshasa','rakshasa','guard']);const hp=(11+wave*2.0+stageLive*3)*(isBoss?5.8:1);const e={x:(player?.x||0)+Math.cos(a)*r,z:(player?.z||0)+Math.sin(a)*r,angle:Math.atan2(-(Math.cos(a)),-(Math.sin(a))),health:hp,maxHealth:hp,speed:(isBoss?1.05:rand(1.05,1.55))+wave*.025,damage:isBoss?18:6+stageLive+Math.floor(wave/3),type:isBoss?'ravana':type,scale:isBoss?1.55:rand(.86,1.08),boss:isBoss,skin:isBoss?[.17,.45,.28]:choose([[.3,.42,.2],[.46,.23,.13],[.62,.38,.19],[.25,.34,.28]]),cloth:isBoss?[.3,.04,.1]:[.42,.08,.12],cloth2:[.7,.13,.12],gold:[.91,.54,.16],attack:rand(.3,1.1),seed:Math.random()*8,vx:0,vz:0,hitFlash:0};enemies.push(e);if(isBoss){bossEnemy=e;$('bossbar').classList.add('show');$('bossName').textContent='TOSAKANTH • THE TEN-CROWNED KING';$('bossBar').style.width='100%';$('worldBanner').textContent='THE KING OF LANKA ENTERS THE BATTLE';sfx('boss');alertWave('TOSAKANTH','THE TEN-CROWNED KING');}}
function updateHUD(){$('healthBar').style.width=(player?player.health/player.maxHealth*100:100)+'%';$('xpBar').style.width=(player?player.xp/xpNeed*100:0)+'%';$('hudHeroName').textContent=(HEROES[selectedHero].name.toUpperCase())+' • LV '+level;$('hudKills').textContent=kills;$('hudGems').textContent=Math.floor(gems+totalGems);if(bossEnemy){$('bossBar').style.width=clamp(bossEnemy.health/bossEnemy.maxHealth*100,0,100)+'%';}}
function spawnProjectile(fromX,fromZ,target,color,damage,type='arrow'){let dx=target.x-fromX,dz=target.z-fromZ,len=Math.hypot(dx,dz)||1;projectiles.push({x:fromX,z:fromZ,y:1.22,dx:dx/len,dz:dz/len,target,speed:type==='bolt'?17:15,damage,color,life:2.1,r:type==='bolt'?.15:.055,type,hit:false});}
function nearestEnemy(range=15){let best=null,bd=range;for(const e of enemies){const d=Math.hypot(e.x-player.x,e.z-player.z);if(d<bd){best=e;bd=d;}}return best;}
function autoAttack(dt){attackClock-=dt;if(attackClock<=0){const target=nearestEnemy(15);if(target){player.angle=Math.atan2(target.x-player.x,target.z-player.z);const type=selectedHero==='sita'?'lotus':'arrow';spawnProjectile(player.x,player.z,target,selectedHero==='sita'?[1,.49,.82]:[.43,.84,1],player.damage*(selectedHero==='lakshmana'?13:10),type);sfx('arrow');attackClock=selectedHero==='lakshmana'?.75:1.05;}else attackClock=.35;}}
function useSkill(n){
 if(mode!=='battle'||!player||skillCD[n]>0)return;
 resumeAudio();
 const h=HEROES[selectedHero]||HEROES.rama,ox=player.x,oz=player.z;
 if(n===0){
  const e=nearestEnemy(18),tx=e?e.x:ox+Math.sin(player.angle)*10,tz=e?e.z:oz+Math.cos(player.angle)*10;
  if(e){spawnProjectile(ox,oz,e,h.gold.map(c=>Math.min(1,c+.1)),player.damage*32,'bolt');sfx('arrow');}
  else{for(let i=0;i<9;i++)spawnBurst(ox,oz,choose([h.gold,[.48,.83,1]]),.4,rand(1.8,3.5));sfx('arrow');}
  RXskill(0,ox,oz,tx,tz);
  skillCD[0]=3.2;
 }
 if(n===1){
  const dirx=Math.sin(player.angle),dirz=Math.cos(player.angle);
  player.x=clamp(player.x+dirx*4.4,-13,13);player.z=clamp(player.z+dirz*4.4,-13,13);
  addRing(player.x,player.z,[.40,.87,1],.4,4.5,.5);
  for(const e of enemies){const d=Math.hypot(e.x-player.x,e.z-player.z);if(d<4.2)damageEnemy(e,player.damage*26*(1-d/7));}
  for(let i=0;i<26;i++)spawnBurst(player.x,player.z,choose([[.35,.86,1],[1,.74,.28],[.86,.96,1]]),.28,rand(1.2,5));
  RXskill(1,ox,oz,player.x,player.z);
  sfx('leap');skillCD[1]=7.2;
 }
 if(n===2){
  addRing(player.x,player.z,h.gold,.1,6.6,1);
  for(const e of enemies){const d=Math.hypot(e.x-player.x,e.z-player.z);if(d<6.5){damageEnemy(e,player.damage*22*(1-d/9));const k=2.6/(d||1);e.x+=(e.x-player.x)*k;e.z+=(e.z-player.z)*k;}}
  for(let i=0;i<44;i++)spawnBurst(player.x,player.z,choose([h.gold,[.9,.3,.16],[.53,.87,1]]),.32,rand(1.8,5.4));
  RXskill(2,ox,oz,player.x,player.z);
  sfx('aura');skillCD[2]=13.0;
 }
 updateSkillHud();
}
function spawnBurst(x,z,color,scale=1,speed=2){const a=rand(0,TAU),v=rand(speed*.4,speed);fx.push({x:x+rand(-.25,.25),z:z+rand(-.25,.25),y:rand(.2,1.7),vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:rand(.1,2.2),life:rand(.32,.85),maxLife:.85,size:rand(.045,.12)*scale,color,kind:'spark'});}
function addRing(x,z,color,r0,rmax,life){fx.push({x,z,y:.08,vx:0,vz:0,vy:0,life,maxLife:life,size:r0,maxSize:rmax,color,kind:'ring'});}
function damageEnemy(e,damage){if(!e||e.health<=0)return;e.health-=damage;e.hitFlash=.11;floaters.push({x:e.x,y:2.5*(e.scale||1),z:e.z,text:Math.round(damage),life:.8,color:'#ffda82'});for(let i=0;i<4;i++)spawnBurst(e.x,e.z,e.boss?[1,.23,.12]:[1,.59,.28],.5,rand(1,3));sfx('hit');if(e.health<=0){kills++;stageKills++;xp+=1;gems+=Math.round((e.boss?70:(rand(3,9)|0))*(1+(permanent.fortune||0)*.1));if(e.boss){bossEnemy=null;$('bossbar').classList.remove('show');gems+=50;alertWave('THE KING FALLS','THE LIGHT OF DHARMA PREVAILS');}if(Math.random()<.11){player.health=Math.min(player.maxHealth,player.health+8);floaters.push({x:e.x,y:1.1,z:e.z,text:'+8 HP',life:1,color:'#85f7c1'});}enemies=enemies.filter(x=>x!==e);if(xp>=xpNeed)levelUp();updateHUD();}}
function levelUp(){xp-=xpNeed;level++;xpNeed=Math.round(xpNeed*1.35);player.maxHealth+=5;player.health=Math.min(player.maxHealth,player.health+18);player.damage*=1.075;player.speed*=1.02;$('hudHeroName').textContent=HEROES[selectedHero].name.toUpperCase()+' • LV '+level;showUpgradeChoices();sfx('level');}
const UPGRADES=[{icon:'✦',name:'Celestial Edge',desc:'+18% damage on every attack.',apply:()=>player.damage*=1.18},{icon:'♥',name:'Amrita Blessing',desc:'Restore 35% of your maximum health.',apply:()=>player.health=Math.min(player.maxHealth,player.health+player.maxHealth*.35)},{icon:'➹',name:'Swift Arrows',desc:'Attack 22% faster.',apply:()=>attackClock=Math.max(0,attackClock-.5)},{icon:'◈',name:'Vanara Vitality',desc:'+24 maximum health and +12 health now.',apply:()=>{player.maxHealth+=24;player.health=Math.min(player.maxHealth,player.health+12)}},{icon:'❂',name:'Divine Momentum',desc:'Skills recharge 18% faster for this run.',apply:()=>skillCD=skillCD.map(v=>Math.max(0,v-2))},{icon:'✺',name:'Golden Fortune',desc:'Gain 45 gems for the armory.',apply:()=>gems+=45}];
function showUpgradeChoices(){mode='levelup';const host=$('upgradeChoices');host.innerHTML='';for(const u of [...UPGRADES].sort(()=>Math.random()-.5).slice(0,3)){const b=document.createElement('button');b.className='upgrade';b.innerHTML=`<span class="upIcon">${u.icon}</span><b>${u.name}</b><small>${u.desc}</small>`;b.addEventListener('click',()=>{u.apply();switchScreen('battle');updateHUD();alertWave('ASCENSION','A DIVINE GIFT EMPOWERS YOU');sfx('level');});host.appendChild(b);}switchScreen('levelup');}
function updateSkillHud(){document.querySelectorAll('.skill[data-skill]').forEach(b=>{const n=+b.dataset.skill,cd=skillCD[n]||0;b.classList.toggle('cooling',cd>0);b.querySelector('.cooldown').textContent=Math.ceil(cd);});}
function spawnWaveCheck(){if(waveSpawnRemaining>0){spawnClock-=dt; if(spawnClock<=0&&enemies.length<14){spawnEnemy(wave%5===0&&enemies.length===0);waveSpawnRemaining--;spawnClock=Math.max(.44,1.15-wave*.035);}}else if(enemies.length===0){if(wave<20){wave++;spawnWave();}else finishStage();}}
function finishStage(){mode='endScreen';const win=true;bestKills=Math.max(bestKills,kills);totalGems+=gems+stageReward;if(stageLive+2>unlocked)unlocked=Math.min(STAGES.length,stageLive+2);persist();$('endEyebrow').textContent='CHAPTER '+String(stageLive+1).padStart(2,'0')+' • COMPLETE';$('endTitle').textContent='VICTORY';$('endDesc').textContent=`${HEROES[selectedHero].name} has broken the enemy line at ${STAGES[stageLive].name}. The legend continues.`;$('endKills').textContent=kills+' FOES DEFEATED';$('endReward').textContent='+'+(gems+stageReward)+' GEMS';$('endNext').textContent=stageLive<STAGES.length-1?'NEXT CHAPTER →':'RETURN TO LEGEND';$('endNext').style.display='';$('endHome').textContent='MAIN MENU';switchScreen('endScreen');setMusic('menu');sfx('victory');}
function finishDefeat(){bestKills=Math.max(bestKills,kills);totalGems+=gems;persist();$('endEyebrow').textContent='YOUR LEGEND IS NOT OVER';$('endTitle').textContent='FALLEN IN BATTLE';$('endDesc').textContent=`You defeated ${kills} foes. Recover your strength and return to ${STAGES[stageLive].name}.`; $('endKills').textContent=kills+' FOES DEFEATED';$('endReward').textContent='+'+gems+' GEMS';$('endNext').textContent='RETRY CHAPTER';$('endNext').style.display='';switchScreen('endScreen');setMusic('menu');}
function updateEnemies(dt){for(const e of [...enemies]){const dx=player.x-e.x,dz=player.z-e.z,d=Math.hypot(dx,dz)||.001;const sx=dx/d,sz=dz/d;e.angle=Math.atan2(sx,sz);if(d>1.55){e.vx=sx*e.speed;e.vz=sz*e.speed;e.x+=e.vx*dt;e.z+=e.vz*dt;}else{e.vx=0;e.vz=0;e.attack-=dt;if(e.attack<=0){e.attack=e.boss?.85:1.2;if(e.boss){camShake=Math.max(camShake,.62);addRing(e.x,e.z,[1,.12,.065],.18,4.8,.58);addRing(e.x,e.z,[1,.62,.18],.08,2.9,.42);for(let i=0;i<9;i++){const a=i/9*TAU;fx.push({x:e.x+Math.cos(a)*2.1,z:e.z+Math.sin(a)*2.1,y:.08,life:.52,maxLife:.52,size:.12,maxSize:1.0,color:i%2?[1,.18,.07]:[1,.67,.2],kind:'ring'});}for(let i=0;i<12;i++)spawnBurst(e.x,e.z,choose([[1,.18,.06],[1,.55,.16],[.42,.13,.09]]),.52,rand(1.5,4.2));}if(invuln<=0){const dodge=Math.random()<(selectedHero==='lakshmana'?.18:.08);if(!dodge){player.health-=e.damage;invuln=.6;addRing(player.x,player.z,[.95,.18,.12],.1,1.5,.28);sfx('hit');if(player.health<=0){player.health=0;updateHUD();finishDefeat();return;}}else showToast('DODGE!');}}}e.hitFlash=Math.max(0,e.hitFlash-dt);}}
function updateProjectiles(dt){for(const p of [...projectiles]){if(p.target&&enemies.includes(p.target)&&p.target.health>0){const tx=p.target.x-p.x,tz=p.target.z-p.z,tl=Math.hypot(tx,tz)||1;const ndx=tx/tl,ndz=tz/tl;p.dx+= (ndx-p.dx)*.17;p.dz+=(ndz-p.dz)*.17;const nl=Math.hypot(p.dx,p.dz)||1;p.dx/=nl;p.dz/=nl;}p.x+=p.dx*p.speed*dt;p.z+=p.dz*p.speed*dt;p.y+=Math.sin((p.life||0)*9)*.04;p.life-=dt;if(Math.random()<.20)spawnBurst(p.x,p.z,p.color,.4,rand(.3,1.1));let hit=null;for(const e of enemies){if(Math.hypot(e.x-p.x,e.z-p.z)<(e.boss?1.15:.68)){hit=e;break;}}if(hit){damageEnemy(hit,p.damage);p.hit=true;p.life=-1;}if(p.life<=0)projectiles=projectiles.filter(x=>x!==p);}}
function updateFX(dt){fx=fx.filter(p=>p.life>0);for(const p of fx){p.life-=dt;if(p.kind==='spark'){p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;p.vy-=3.8*dt;} }floaters=floaters.filter(f=>f.life>0);for(const f of floaters){f.life-=dt;f.y+=dt*1.15;}}
let dt=0;
function updateBattle(delta){if(mode!=='battle'||!player)return;elapsed+=delta;dt=delta;invuln=Math.max(0,invuln-delta);skillCD=skillCD.map(v=>Math.max(0,v-delta));updateSkillHud();
 let ax=input.x,az=input.z; if(ax||az){const len=Math.hypot(ax,az)||1;ax/=len;az/=len;player.x=clamp(player.x+ax*player.speed*delta,-13,13);player.z=clamp(player.z+az*player.speed*delta,-13,13);player.angle=Math.atan2(ax,az);}autoAttack(delta);spawnWaveCheck();updateEnemies(delta);if(mode!=='battle')return;updateProjectiles(delta);updateFX(delta);updateHUD();if(alertTime>0){alertTime-=delta;if(alertTime<=0)$('waveAlert').classList.remove('show');}}

// ------- 3D render pass -------
let DPR=1,W=innerWidth,H=innerHeight,proj=perspective(Math.PI/3,W/H,.1,100),view=I4(),vp=I4(),camPos=[0,10,16],heroPreviewClock=0;
/* ===== RENDER ENHANCEMENTS (v2): PCF shadows, MSAA HDR, bloom, ACES, arena-to-backdrop fade, 3D skill FX ===== */
const ENX={on:true,ok:false,sh:false,pp:false,ST:2048};let camShake=0;
const RXV=`#version 300 es
in vec3 aPosition; in vec3 aNormal;
uniform mat4 uMVP; uniform mat4 uModel; uniform mat4 uLightVP; uniform vec3 uCamera;
out vec3 vNormal; out vec3 vWorld; out float vDistance; out vec4 vLS;
void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vNormal=normalize(mat3(uModel)*aNormal);vDistance=length(uCamera-vWorld);vLS=uLightVP*vec4(w.xyz+vNormal*0.05,1.0);gl_Position=uMVP*vec4(aPosition,1.0);}`;
const RXF=`#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vNormal; in vec3 vWorld; in float vDistance; in vec4 vLS;
uniform vec3 uColor; uniform vec3 uEmissive; uniform vec3 uLightDir; uniform vec3 uFogColor; uniform vec3 uCamera; uniform vec3 uAccent;
uniform float uAlpha; uniform float uGloss;
uniform sampler2DShadow uShadow;
out vec4 outColor;
float shadowAt(float ndl){
 if(vLS.w<0.0001) return 1.0;
 vec3 p=vLS.xyz/vLS.w*0.5+0.5;
 if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0) return 1.0;
 float b=0.0012+0.0035*(1.0-clamp(ndl,0.0,1.0));
 float s=0.0; float ts=1.0/2048.0;
 for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){s+=texture(uShadow,vec3(p.xy+vec2(float(i),float(j))*ts*1.3,p.z-b));}}
 return s/9.0;
}
void main(){
 vec3 N=normalize(vNormal); vec3 L=normalize(uLightDir); vec3 V=normalize(uCamera-vWorld); vec3 H=normalize(L+V);
 float ndl=dot(N,L); float wrap=clamp((ndl+0.3)/1.3,0.0,1.0); float sh=shadowAt(ndl);
 vec3 col=uColor;
 if(N.y>0.85&&vWorld.y<0.6){vec2 q=floor(vWorld.xz*5.0);float n=fract(sin(dot(q,vec2(12.9898,78.233)))*43758.5453);col*=0.9+0.2*n;}
 float ao=mix(0.55,1.0,smoothstep(0.0,1.4,vWorld.y));
 vec3 sky=uFogColor*1.0+vec3(0.10,0.13,0.2); vec3 gnd=uFogColor*0.35+vec3(0.07,0.05,0.04);
 vec3 amb=mix(gnd,sky,N.y*0.5+0.5)*ao;
 vec3 key=vec3(1.0,0.84,0.62)*1.55;
 vec3 diff=col*(amb+key*wrap*sh);
 float spec=pow(max(dot(N,H),0.0),mix(14.0,180.0,uGloss))*(0.1+1.4*uGloss)*sh;
 vec3 R=reflect(-V,N); vec3 env=mix(gnd,sky*1.6+vec3(0.35,0.22,0.08),clamp(R.y*0.6+0.5,0.0,1.0));
 float fr=pow(1.0-max(dot(N,V),0.0),3.0);
 vec3 metal=col*env*uGloss*0.9+env*fr*uGloss*0.4;
 float rim=pow(1.0-max(dot(N,V),0.0),2.2)*0.55;
 vec3 lit=diff+key*spec*0.5+metal*ao+uAccent*rim*(0.4+0.6*ao)*0.5+uEmissive*2.4;
 if(uAlpha<0.999){lit=uEmissive*3.2+col*0.55;}
 float fog=smoothstep(22.0,58.0,vDistance); lit=mix(lit,uFogColor*0.9,fog*0.8);
 float edge=1.0-smoothstep(20.0,40.0,length(vWorld.xz));
 if(uAlpha>0.999&&uCamera.y>5.5){float nf=smoothstep(3.2,6.8,vDistance);if(nf<fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453))discard;}
 if(uAlpha<0.999){outColor=vec4(lit,uAlpha);}else{outColor=vec4(lit*edge,edge);}
}`;
const RXQ=`#version 300 es
out vec2 vUV;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUV=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
const RXB=`#version 300 es
precision highp float;in vec2 vUV;uniform sampler2D uTex;out vec4 o;
void main(){vec3 c=texture(uTex,vUV).rgb;float l=max(c.r,max(c.g,c.b));o=vec4(c*smoothstep(0.72,1.7,l),1.0);}`;
const RXG=`#version 300 es
precision highp float;in vec2 vUV;uniform sampler2D uTex;uniform vec2 uDir;out vec4 o;
void main(){vec3 s=texture(uTex,vUV).rgb*0.227027027;s+=(texture(uTex,vUV+uDir*1.3846153846).rgb+texture(uTex,vUV-uDir*1.3846153846).rgb)*0.3162162162;s+=(texture(uTex,vUV+uDir*3.2307692308).rgb+texture(uTex,vUV-uDir*3.2307692308).rgb)*0.0702702703;o=vec4(s,1.0);}`;
const RXC=`#version 300 es
precision highp float;in vec2 vUV;uniform sampler2D uTex;out vec4 o;void main(){o=texture(uTex,vUV);}`;
const RXK=`#version 300 es
precision highp float;in vec2 vUV;uniform sampler2D uScene;uniform sampler2D uBloom;uniform sampler2D uBloom2;out vec4 o;
vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
void main(){vec4 s=texture(uScene,vUV);vec3 b=texture(uBloom,vUV).rgb*0.62+texture(uBloom2,vUV).rgb*1.05;
 vec3 c=aces((s.rgb+b)*0.92);c=pow(c,vec3(1.1))*vec3(1.05,1.0,0.93);float l=dot(c,vec3(0.299,0.587,0.114));c=mix(vec3(l),c,1.2);
 float vg=1.0-0.4*pow(length((vUV-0.5)*vec2(1.1,1.25))*1.25,2.4);c*=vg;
 float a=max(s.a,max(c.r,max(c.g,c.b)));o=vec4(c,clamp(a,0.0,1.0));}`;
const RXZ=`#version 300 es
in vec3 aPosition;uniform mat4 uLightMVP;void main(){gl_Position=uLightMVP*vec4(aPosition,1.0);}`;
const RXY=`#version 300 es
precision mediump float;out vec4 o;void main(){o=vec4(1.0);}`;
function RXprog(vs,fs,bind){const p=gl.createProgram();gl.attachShader(p,compileShader(gl.VERTEX_SHADER,vs));gl.attachShader(p,compileShader(gl.FRAGMENT_SHADER,fs));if(bind){gl.bindAttribLocation(p,loc.pos,'aPosition');if(bind>1)gl.bindAttribLocation(p,loc.normal,'aNormal')}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return {p,u:n=>gl.getUniformLocation(p,n)};}
function RXinit(){
 try{ENX.st=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,ENX.st);gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,ENX.ST,ENX.ST);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE],[gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL]])gl.texParameteri(gl.TEXTURE_2D,k,v);
  ENX.sf=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,ENX.sf);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,ENX.st,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  ENX.sh=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const z=RXprog(RXZ,RXY,1);ENX.ps=z.p;ENX.pm=z.u('uLightMVP');
 }catch(e){ENX.sh=false;console.warn('ENX shadow',e)}
 try{const o=RXprog(RXV,RXF,2),L=o.u;Object.assign(loc,{mvp:L('uMVP'),model:L('uModel'),camera:L('uCamera'),color:L('uColor'),emissive:L('uEmissive'),light:L('uLightDir'),fog:L('uFogColor'),alpha:L('uAlpha'),gloss:L('uGloss'),accent:L('uAccent'),lvp:L('uLightVP'),shadow:L('uShadow')});ENX.p=o.p;ENX.ok=true}catch(e){ENX.ok=false;console.warn('ENX main shader',e)}
 try{if(!gl.getExtension('EXT_color_buffer_float'))throw new Error('no float RT');ENX.vao=gl.createVertexArray();const mk=(f,s)=>{const q=RXprog(RXQ,f,0);gl.useProgram(q.p);for(const n of s)gl.uniform1i(q.u(n[0]),n[1]);return {p:q.p,dir:q.u('uDir')}};
  ENX.bright=mk(RXB,[['uTex',0]]);ENX.blur=mk(RXG,[['uTex',0]]);ENX.copy=mk(RXC,[['uTex',0]]);ENX.comp=mk(RXK,[['uScene',0],['uBloom',1],['uBloom2',2]]);ENX.pp=true;
 }catch(e){ENX.pp=false;console.warn('ENX post',e)}
 window.addEventListener('keydown',e=>{if(e.key==='b'||e.key==='B')ENX.on=!ENX.on});
 if(/[?&]post=0/.test(location.search))ENX.on=false;
}
function RXsize(){if(!ENX.pp)return;try{const w=canvas.width,h=canvas.height,hw=Math.max(2,w>>1),hh=Math.max(2,h>>1),qw=Math.max(2,hw>>1),qh=Math.max(2,hh>>1);
 for(const k of ['sc','a','b','c','d'])if(ENX[k]){gl.deleteTexture(ENX[k].t);gl.deleteFramebuffer(ENX[k].f)}
 const mk=(w,h)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return {t,f,w,h}};
 ENX.sc=mk(w,h);ENX.a=mk(hw,hh);ENX.b=mk(hw,hh);ENX.c=mk(qw,qh);ENX.d=mk(qw,qh);
 if(ENX.msf){gl.deleteFramebuffer(ENX.msf);gl.deleteRenderbuffer(ENX.mc);gl.deleteRenderbuffer(ENX.md);ENX.msf=null}
 if(ENX.dr){gl.deleteRenderbuffer(ENX.dr);ENX.dr=null}
 try{const sm=gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES),n=Math.min(4,sm&&sm.length?sm[0]:0);if(n>1){ENX.mc=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,ENX.mc);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,n,gl.RGBA16F,w,h);ENX.md=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,ENX.md);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,n,gl.DEPTH_COMPONENT24,w,h);ENX.msf=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,ENX.msf);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,ENX.mc);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,ENX.md);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)ENX.msf=null}}catch(e){ENX.msf=null}
 if(!ENX.msf){ENX.dr=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,ENX.dr);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,ENX.sc.f);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,ENX.dr)}
 gl.bindFramebuffer(gl.FRAMEBUFFER,ENX.sc.f);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('scene RT incomplete');gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }catch(e){ENX.pp=false;console.warn('ENX size',e);gl.bindFramebuffer(gl.FRAMEBUFFER,null)}}
function RXshadow(){const L=[.46,.82,.36],n=Math.hypot(...L),lv=lookAt(L.map(v=>v/n*34),[0,0,0],[0,1,0]),o=new Float32Array(16);o[0]=1/21;o[5]=1/21;o[10]=-2/79;o[14]=-81/79;o[15]=1;ENX.lvp=mul(o,lv);
 gl.depthMask(true);gl.bindFramebuffer(gl.FRAMEBUFFER,ENX.sf);gl.viewport(0,0,ENX.ST,ENX.ST);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(ENX.ps);gl.colorMask(false,false,false,false);gl.cullFace(gl.FRONT);
 for(const c of calls){const m=c.mesh;if(m===M.ring||m===M.ringFX||m===M.smallSphere||(m===M.box&&(c.model[5]<.45||c.model[0]>20)))continue;gl.uniformMatrix4fv(ENX.pm,false,mul(ENX.lvp,c.model));gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0)}
 gl.colorMask(true,true,true,true);gl.cullFace(gl.BACK)}
function RXpost(){if(ENX.msf){gl.bindFramebuffer(gl.READ_FRAMEBUFFER,ENX.msf);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,ENX.sc.f);gl.blitFramebuffer(0,0,ENX.sc.w,ENX.sc.h,0,0,ENX.sc.w,ENX.sc.h,gl.COLOR_BUFFER_BIT,gl.NEAREST)}
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.bindVertexArray(ENX.vao);
 const pass=(g,dst,src,u)=>{gl.bindFramebuffer(gl.FRAMEBUFFER,dst?dst.f:null);gl.viewport(0,0,dst?dst.w:canvas.width,dst?dst.h:canvas.height);gl.useProgram(g.p);src.forEach((t,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t)});gl.activeTexture(gl.TEXTURE0);if(u)u(g);gl.drawArrays(gl.TRIANGLES,0,3)};
 const H=(t,d)=>g=>gl.uniform2f(g.dir,1/t.w,0),V=(t,d)=>g=>gl.uniform2f(g.dir,0,1/t.h);
 pass(ENX.bright,ENX.a,[ENX.sc.t]);pass(ENX.blur,ENX.b,[ENX.a.t],H(ENX.a));pass(ENX.blur,ENX.a,[ENX.b.t],V(ENX.a));pass(ENX.copy,ENX.c,[ENX.a.t]);
 pass(ENX.blur,ENX.d,[ENX.c.t],H(ENX.c));pass(ENX.blur,ENX.c,[ENX.d.t],V(ENX.c));pass(ENX.blur,ENX.d,[ENX.c.t],H(ENX.c));pass(ENX.blur,ENX.c,[ENX.d.t],V(ENX.c));
 pass(ENX.comp,null,[ENX.sc.t,ENX.a.t,ENX.c.t]);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.bindVertexArray(null)}
function RXdraw(){const st=STAGES[mode==='battle'?stageLive:selectedStage],post=ENX.pp&&ENX.on&&quality!=='low'&&ENX.sc,sh=ENX.sh&&ENX.ok&&quality!=='low';
 gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);if(sh)RXshadow();
 gl.bindFramebuffer(gl.FRAMEBUFFER,post?(ENX.msf||ENX.sc.f):null);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.useProgram(ENX.ok?ENX.p:prog);gl.uniform3fv(loc.camera,camPos);gl.uniform3fv(loc.light,[.46,.82,.36]);gl.uniform3fv(loc.fog,st.fog);
 if(ENX.ok){gl.uniform3fv(loc.accent,st.accent);gl.uniformMatrix4fv(loc.lvp,false,sh?ENX.lvp:new Float32Array(16));gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,ENX.st);gl.uniform1i(loc.shadow,1);gl.activeTexture(gl.TEXTURE0)}
 for(const c of calls)renderCall(c);
 if(transparentCalls.length){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);for(const c of transparentCalls)renderCall(c);gl.depthMask(true);gl.disable(gl.BLEND)}
 if(post)RXpost()}
function RXfx(){for(const p of fx){const k=clamp(p.life/p.maxLife,0,1),c=p.color,u=1-k;
 if(p.kind==='spark'){const s=p.size*k;call(M.smallSphere,Xf(p.x,p.y,p.z,0,0,0,s,s,s),c,c.map(v=>v*1.8),.9,.1)}
 else if(p.kind==='glow'){const s=p.size*(.35+.65*k);call(M.sphere,Xf(p.x,p.y,p.z,0,0,0,s,s,s),c,c.map(v=>v*2.2),.55*k+.05,.2)}
 else if(p.kind==='pillar'){const h=p.maxSize*Math.min(1,u*5),w=p.size*(1-u*.5);call(M.cyl,Xf(p.x,h/2,p.z,0,0,0,w*.8,h,w*.8),c,c.map(v=>v*.9),.2*k,.1);call(M.cyl,Xf(p.x,h/2,p.z,0,0,0,w*.28,h,w*.28),[1,1,1],[1.1,1.0,.8],.3*k,.1)}
 else if(p.kind==='beam'){const dx=p.tx-p.x,dz=p.tz-p.z,len=Math.hypot(dx,dz),a=Math.atan2(dx,dz),mx=(p.x+p.tx)*.5,mz=(p.z+p.tz)*.5,w=p.size*(.45+.55*k);if(len>.03){call(M.cyl,Xf(mx,p.y,mz,Math.PI/2,a,0,w*.56,len,w*.56),[1,1,1],[1.9,1.7,1.25],.72*k+.08,.85);call(M.cyl,Xf(mx,p.y,mz,Math.PI/2,a,0,w*1.8,len*1.04,w*1.8),c,c.map(v=>v*2.6),.22*k+.035,.2)}}
 else if(p.kind==='petal'){const s=p.size*(.35+.65*k),a=p.angle||0;call(M.sphere,Xf(p.x,p.y,p.z,p.rx||0,a,p.rz||.45,s*1.65,s*.48,s*.55),c,c.map(v=>v*1.5),.78*k+.04,.6)}
 else{const r=p.size+(p.maxSize-p.size)*u,y=p.y||.07;call(M.ringFX,Xf(p.x,y,p.z,0,0,0,r,1,r),c,c.map(v=>v*2.2),.85*k,.4);call(M.ringFX,Xf(p.x,y+.02,p.z,0,0,0,r*.84,.7,r*.84),[1,1,1],[1.3,1.2,1],.5*k,.3)}
}}
function RXproj(){for(const p of projectiles){const a=Math.atan2(p.dx,p.dz),c=p.color,b=p.type==='bolt',len=b?2.8:.95,w=p.r*(b?1.15:1.3),sx=Math.sin(a),sz=Math.cos(a),bx=p.x-sx*len*.45,bz=p.z-sz*len*.45;
 call(M.cyl,Xf(bx,p.y,bz,Math.PI/2,a,0,w*.55,len,w*.55),[1,1,1],[2.6,2.4,1.9],1,.9);call(M.cyl,Xf(bx,p.y,bz,Math.PI/2,a,0,w*1.9,len*1.1,w*1.9),c,c.map(v=>v*2.4),.3,.2);call(M.sphere,Xf(p.x,p.y,p.z,0,0,0,w*3.6,w*3.6,w*3.6),c,c.map(v=>v*3),.4,.2);
 if(b)for(let i=1;i<7;i++){const q=w*(6.2-i*.7);call(M.ringFX,Xf(p.x-sx*i*.5,p.y,p.z-sz*i*.5,Math.PI/2,a,0,q,1,q),c,c.map(v=>v*2.5),.55*(1-i/7),.3)}}}
function RXhero(t){const id=selectedHero,palette={rama:{core:[1,.72,.24],edge:[.28,.76,1]},sita:{core:[1,.42,.68],edge:[.58,.83,1]},hanuman:{core:[1,.68,.24],edge:[.31,.86,1]},lakshmana:{core:[.28,1,.62],edge:[.3,.53,1]},ravana:{core:[1,.2,.1],edge:[.74,.04,.13]}};const p=palette[id]||palette.rama,g=p.core,edge=p.edge,x=player.x,z=player.z;call(M.ringFX,Xf(x,.075,z,0,t*.7,0,1.25,1,1.25),g,g.map(v=>v*1.8),.8,.4);call(M.ringFX,Xf(x,.08,z,0,-t*1.1,0,.9,1,.9),edge,edge.map(v=>v*1.7),.48,.3);call(M.ringFX,Xf(x,1.62,z,Math.PI/2,t*.32,0,.86,1,.86),edge,edge.map(v=>v*.65),.25,.22);call(M.ringFX,Xf(x,1.62,z,Math.PI/2,-t*.43,0,.66,1,.66),g,g.map(v=>v*.8),.18,.3);call(M.sphere,Xf(x,1.3,z,0,0,0,1.5,1.8,1.5),g,g.map(v=>v*.4),.05,.1)}
function RXboss(e,t){call(M.ringFX,Xf(e.x,.07,e.z,0,t,0,2.4,1,2.4),[1,.25,.1],[3,.5,.15],.7,.4);call(M.ringFX,Xf(e.x,.09,e.z,0,-t*1.3,0,1.7,1,1.7),[1,.7,.3],[2.5,1.4,.4],.5,.3)}
function RXskill(n,ox,oz,tx=player?.x??ox,tz=player?.z??oz){
 const type=selectedHero||'rama';
 const palette={
  rama:{core:[1,.72,.24],edge:[.34,.78,1],spark:[1,.96,.72]},
  sita:{core:[1,.34,.69],edge:[.76,.92,1],spark:[.97,.75,1]},
  hanuman:{core:[1,.72,.31],edge:[.34,.86,1],spark:[1,.96,.73]},
  lakshmana:{core:[.28,1,.63],edge:[.28,.58,1],spark:[1,.79,.34]},
  ravana:{core:[1,.22,.12],edge:[.78,.04,.14],spark:[1,.62,.2]}
 }[type]||{core:[1,.72,.24],edge:[.34,.78,1],spark:[1,.96,.72]};
 const g=palette.core,edge=palette.edge,spark=palette.spark,px=player.x,pz=player.z;
 camShake=[.45,.9,1.25][n]||.4;
 const add=o=>fx.push(Object.assign({vx:0,vz:0,vy:0,y:.08},o));
 const petalRing=(x,z,r,count=10,life=.55)=>{for(let i=0;i<count;i++){const a=i/count*TAU;add({kind:'petal',x:x+Math.cos(a)*r,z:z+Math.sin(a)*r,y:.38+Math.sin(a*2)*.08,angle:-a,life:life,maxLife:life,size:.16,color:i%2?g:spark});}};
 if(n===0){
  add({kind:'beam',x:ox,z:oz,y:1.25,tx,tz,life:.27,maxLife:.27,size:type==='lakshmana'?.105:.145,color:g});
  add({kind:'beam',x:ox,z:oz,y:1.29,tx,tz,life:.18,maxLife:.18,size:.038,color:[1,1,1]});
  if(type==='lakshmana')add({kind:'beam',x:ox+.13,z:oz-.08,y:1.17,tx:tx+.13,tz:tz-.08,life:.22,maxLife:.22,size:.055,color:edge});
  add({kind:'ring',x:tx,z:tz,y:.08,life:.38,maxLife:.38,size:.12,maxSize:1.7,color:spark});
  for(let i=0;i<14;i++){const a=i/14*TAU;add({kind:'spark',x:tx,z:tz,y:1.15+Math.sin(a)*.12,vx:Math.cos(a)*rand(1.2,3.2),vz:Math.sin(a)*rand(1.2,3.2),vy:rand(.3,1.7),life:rand(.25,.48),maxLife:.48,size:rand(.045,.095),color:i%3?edge:spark});}
  if(type==='sita')petalRing(tx,tz,.72,9,.52);
  if(type==='hanuman'){add({kind:'ring',x:ox,z:oz,y:.08,life:.28,maxLife:.28,size:.16,maxSize:1.25,color:edge});}
 }
 else if(n===1){
  for(let i=0;i<30;i++){const k=i/29;add({kind:'glow',x:ox+(px-ox)*k,z:oz+(pz-oz)*k,y:1+Math.sin(k*Math.PI)*1.45,life:.3+k*.48,maxLife:.78,size:.4*(1-k*.45),color:i%3?edge:spark});}
  add({kind:'pillar',x:px,z:pz,y:0,life:.62,maxLife:.62,size:type==='hanuman'?1.35:.82,maxSize:type==='hanuman'?6.6:4.5,color:edge});
  add({kind:'ring',x:ox,z:oz,y:.08,life:.42,maxLife:.42,size:.25,maxSize:2.7,color:spark});
  add({kind:'ring',x:px,z:pz,y:.08,life:.48,maxLife:.48,size:.18,maxSize:type==='hanuman'?5.3:3.7,color:g});
  if(type==='sita')petalRing(px,pz,1.0,12,.6);
  for(let i=0;i<16;i++){const k=i/16*TAU;add({kind:'spark',x:px,z:pz,y:.18,vx:Math.cos(k)*rand(1.8,4.2),vz:Math.sin(k)*rand(1.8,4.2),vy:rand(.4,1.7),life:rand(.28,.55),maxLife:.55,size:rand(.045,.085),color:i%2?edge:spark});}
 }
 else{
  for(let i=0;i<4;i++)add({kind:'ring',x:px,z:pz,y:.075+i*.025,life:.65+i*.12,maxLife:.65+i*.12,size:.12+i*.08,maxSize:3.8+i*1.45,color:i%2?edge:g});
  const count=type==='sita'?12:14;
  for(let i=0;i<count;i++){const a=i/count*TAU,r=type==='hanuman'?3.9:3.25;add({kind:'pillar',x:px+Math.cos(a)*r,z:pz+Math.sin(a)*r,y:0,life:.78,maxLife:.78,size:type==='hanuman'?.38:.25,maxSize:type==='hanuman'?5.8:4.6,color:i%2?edge:g});}
  for(let i=0;i<28;i++){const a=i/28*TAU,v=rand(2.2,5.5);add({kind:'spark',x:px,z:pz,y:.22,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:rand(.5,2.3),life:rand(.28,.62),maxLife:.62,size:rand(.045,.1),color:i%3?g:spark});}
  if(type==='sita')petalRing(px,pz,1.25,16,.72);
  else if(type==='hanuman'){petalRing(px,pz,1.05,8,.45);add({kind:'ring',x:px,z:pz,y:1.0,life:.6,maxLife:.6,size:.7,maxSize:2.2,color:spark});}
  else if(type==='rama'){for(let i=0;i<3;i++)add({kind:'beam',x:px-2.4,z:pz-i*.2,y:1.1+i*.16,tx:px+2.4,tz:pz+i*.2,life:.24+i*.04,maxLife:.28,size:.05,color:i===1?spark:g});}
  else if(type==='lakshmana'){for(let i=0;i<2;i++)add({kind:'beam',x:px-2.6,z:pz+(i?-.45:.45),y:1.1,tx:px+2.6,tz:pz+(i?-.45:.45),life:.25,maxLife:.25,size:.05,color:edge});}
 }
}
RXinit();
function resize(){DPR=Math.min(quality==='low'?1:quality==='medium'?1.5:2,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';gl.viewport(0,0,canvas.width,canvas.height);RXsize();proj=perspective(Math.PI/3.15,canvas.width/canvas.height,.1,100);}
window.addEventListener('resize',resize);resize();
function renderCall(c){const mvp=mul(vp,c.model);gl.uniformMatrix4fv(loc.mvp,false,mvp);gl.uniformMatrix4fv(loc.model,false,c.model);gl.uniform3fv(loc.color,c.color);gl.uniform3fv(loc.emissive,c.emissive||[0,0,0]);gl.uniform1f(loc.alpha,c.alpha??1);gl.uniform1f(loc.gloss,c.gloss??.5);gl.bindVertexArray(c.mesh.vao);gl.drawElements(gl.TRIANGLES,c.mesh.count,gl.UNSIGNED_SHORT,0);}
function addCharacterPreview(type,t){const f={x:2.45,z:1,angle:0,type,scale:1.0,seed:0};fighterDraw(f,t,true,false);}
function renderScene(now){calls=(mode==='battle'||mode==='pause'||mode==='levelup'||mode==='endScreen')?staticCalls.slice():[];transparentCalls=[];const t=now*.001;
 if(mode==='battle'||mode==='pause'||mode==='levelup'||mode==='endScreen'){
  if(player){call(M.sphere,Xf(player.x,.026,player.z,0,0,0,1.25,.05,.72),[.035,.04,.045],[0,0,0],1,.05);fighterDraw({...player,seed:0},t,true,false);RXhero(t);for(const e of enemies){call(M.sphere,Xf(e.x,.026,e.z,0,0,0,(e.boss?1.8:1.05)*(e.scale||1),.05,(e.boss?1.0:.62)*(e.scale||1)),[.035,.025,.03],[0,0,0],1,.05);fighterDraw(e,t,false,e.boss);if(e.boss)RXboss(e,t);if(e.hitFlash>0)call(M.sphere,Xf(e.x,2,e.z,0,0,0,.95,.95,.95),[1,.22,.09],[.35,.02,.01],.18,.2);}RXproj();
   RXfx();
   for(const f of floaters){/* world damage numbers have a lightweight spark marker; readable counts remain in HUD */call(M.smallSphere,Xf(f.x,f.y,f.z,0,0,0,.08,.08,.08),f.color==='#ffda82'?[1,.68,.18]:[.3,1,.7],[.2,.1,0],.85,.2);}
  }
  const tg0=[player?.x||0,.4,player?.z||0];if(!ENX.ct)ENX.ct=tg0.slice();for(let i=0;i<3;i++)ENX.ct[i]+=(tg0[i]-ENX.ct[i])*.14;const sk=camShake;camShake*=.88;const target=[ENX.ct[0],1.0,ENX.ct[2]];const bossZoom=bossEnemy?.health>0?.88:1.0;camPos=[target[0]+6.3*bossZoom+Math.sin(t*.13)*.32+(Math.random()-.5)*sk,7.6*bossZoom+(Math.random()-.5)*sk*.6,target[2]+9.6*bossZoom+Math.cos(t*.11)*.22+(Math.random()-.5)*sk];view=lookAt(camPos,target,[0,1,0]);
 }else{
  heroPreviewClock+=.016;if(mode==='heroes'){const h=HEROES[selectedHero]||HEROES.rama;addCharacterPreview(h.id,t);}camPos=[3.6+Math.sin(t*.20)*.28,3.3+Math.sin(t*.31)*.06,9.2+Math.cos(t*.17)*.24];view=lookAt(camPos,[-1.9,1.55,0],[0,1,0]);
 }
 if(mode==='battle'||mode==='pause'||mode==='levelup'||mode==='endScreen'){
  const stage=stageLive,dust=stage===0?[.28,.86,.44]:stage===1?[.22,.74,1]:stage===2?[1,.75,.32]:stage===3?[1,.28,.11]:[1,.24,.25];
  const warm=stage>=3?[1,.53,.18]:stage===2?[.96,.78,.42]:[.58,.82,1];
  for(let i=0;i<22;i++){
   const phase=t*(.22+(i%4)*.035)+i*2.399;
   const px=Math.sin(phase*1.13+i*.17)*(5.4+(i%4)*2.1);
   const pz=-9+((i*1.73+t*(.25+(i%3)*.08))%18);
   const py=.45+(Math.sin(t*.58+i*1.91)+1)*.82,size=.035+(i%3)*.012,c=i%4===0?warm:dust;
   call(M.smallSphere,Xf(px,py,pz,0,0,0,size,size,size),c,c.map(v=>v*1.65),.28,.15);
  }
 }
 vp=mul(proj,view);RXdraw();
}

// ------- User input -------
function goHome(){switchScreen('home');setBackdrop('title');setMusic('menu');buildChapterCards();updateArmory();}
$('newJourney').onclick=()=>{resumeAudio();sfx('click');enterChapters();};$('chapterOpen').onclick=()=>enterChapters();$('heroesOpen').onclick=()=>enterHeroes('home');$('armoryOpen').onclick=()=>{updateArmory();switchScreen('armory');sfx('click');};$('scoreOpen').onclick=()=>{resumeAudio();buildAudioBrowser();refreshAudioUI();switchScreen('audioScreen');sfx('click');};$('playMenuTheme').onclick=()=>{resumeAudio();musicKey='';setBackdrop('title');setMusic('menu');refreshAudioUI();sfx('click');};$('audioMusicToggle').onclick=toggleMusic;$('audioSfxToggle').onclick=toggleSfx;$('audioMusicVolume').oninput=e=>{musicVolume=+e.target.value;musicAudio.volume=musicVolume;};$('audioSfxVolume').oninput=e=>{sfxVolume=+e.target.value;};document.querySelectorAll('[data-audio-sfx]').forEach(b=>b.addEventListener('click',()=>{resumeAudio();sfx(b.dataset.audioSfx);}));$('chapterBack').onclick=goHome;$('chapterOpen').setAttribute('aria-label','Select chapters');$('chapterStart').onclick=()=>{if(selectedStage+1<=unlocked){enterHeroes('selectedChapter');}};$('heroesOpen').onclick=()=>enterHeroes('home');$('heroConfirm').onclick=()=>{persist();if(heroEntry==='selectedChapter')startBattle();else enterChapters();};$('heroGoChapter').onclick=()=>{persist();enterChapters();};
document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',goHome));$('chapterCards').addEventListener('click',()=>{});$('heroConfirm').addEventListener('click',()=>sfx('click'));$('chapterBack').addEventListener('click',()=>sfx('click'));

$('musicToggle').onclick=toggleMusic;$('sfxToggle').onclick=toggleSfx;$('settingsOpen').onclick=()=>{switchScreen('settings');$('musicVolume').value=musicVolume;$('sfxVolume').value=sfxVolume;};$('settingsClose').onclick=()=>{switchScreen('home');setBackdrop('title');setMusic('menu');};$('musicVolume').oninput=e=>{musicVolume=+e.target.value;musicAudio.volume=musicVolume;};$('sfxVolume').oninput=e=>{sfxVolume=+e.target.value;};$('quality').onchange=e=>{quality=e.target.value;resize();};$('pauseOpen').onclick=()=>{switchScreen('pause');musicAudio.volume=musicVolume*.7;};$('resume').onclick=()=>{switchScreen('battle');musicAudio.volume=musicVolume;};$('quitBattle').onclick=()=>{goHome();persist();};$('endHome').onclick=()=>{goHome();};$('endNext').onclick=()=>{if(stageLive<STAGES.length-1&&unlocked>=stageLive+2){selectedStage=stageLive+1;startBattle();}else if(stageLive===STAGES.length-1){goHome();}else{startBattle();}};
document.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>useSkill(+b.dataset.skill)));
document.querySelectorAll('[data-move]').forEach(b=>{const start=e=>{e.preventDefault();const m=b.dataset.move;if(m==='up')touchInput.z=-1;if(m==='down')touchInput.z=1;if(m==='left')touchInput.x=-1;if(m==='right')touchInput.x=1;b.setPointerCapture?.(e.pointerId);};const end=e=>{const m=b.dataset.move;if(m==='up'&&touchInput.z<0||m==='down'&&touchInput.z>0)touchInput.z=0;if(m==='left'&&touchInput.x<0||m==='right'&&touchInput.x>0)touchInput.x=0;};b.addEventListener('pointerdown',start);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end);});
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'||k==='p'){if(mode==='battle')switchScreen('pause');else if(mode==='pause'){switchScreen('battle');}else if(mode==='settings')goHome();}if(mode==='battle'){if(k==='q'||k==='1')useSkill(0);if(k==='e'||k==='2')useSkill(1);if(k==='r'||k==='3')useSkill(2);}});window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});window.addEventListener('blur',()=>{keys={};input={x:0,z:0};touchInput={x:0,z:0};});

// A tiny 3D menu stage lives behind the chapter and warrior screens; battle builds a new environment.
function buildMenuEnvironment(){staticCalls.length=0;groundObj(M.box,0,-.8,0,40,1,40,[.08,.12,.16]);for(let side of [-1,1])for(let z=-7;z<=8;z+=3){groundObj(M.box,side*5,1,z,.45,2.5,.45,[.53,.33,.18]);groundObj(M.cone,side*5,2.5,z,.95,.75,.95,[.76,.42,.16]);groundObj(M.cone,side*5,3.0,z,.63,.7,.63,[.9,.64,.28]);groundObj(M.cone,side*5,3.55,z,.27,.65,.27,[.96,.8,.46]);}groundObj(M.torus,0,.05,0,3.6,.04,3.6,[.79,.49,.18],Math.PI/2,[.05,.02,0]);}
buildMenuEnvironment();
function frame(now){const delta=Math.min(.045,(now-(lastTime||now))/1000);lastTime=now;if(mode==='battle'){input.x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+touchInput.x;input.z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+touchInput.z;updateBattle(delta);}else if(mode==='pause'||mode==='levelup'||mode==='endScreen'){/* let ambience and hit particles pause with combat */}else{input.x=0;input.z=0;}renderScene(now);requestAnimationFrame(frame);}
// This query flag is used by browser smoke tests, not needed for normal play.
if(new URLSearchParams(location.search).get('battle')==='1'){switchScreen('battle');selectedStage=Math.min(4,+(new URLSearchParams(location.search).get('stage')||0));selectedHero=new URLSearchParams(location.search).get('hero')||selectedHero;startBattle();}else{setBackdrop('title');switchScreen('home');buildChapterCards();updateArmory();refreshAudioUI();setMusic('menu');}
{const _us=useSkill;useSkill=function(n){const ok=mode==='battle'&&player&&!(skillCD[n]>0),ox=player?player.x:0,oz=player?player.z:0;_us(n);if(ok&&skillCD[n]>0)RXskill(n,ox,oz)};const _up=updateProjectiles;updateProjectiles=function(dt){for(const p of projectiles){if(p.type==='bolt'||Math.random()<.35)fx.push({kind:'glow',x:p.x,z:p.z,y:p.y,vx:0,vz:0,vy:0,life:.35,maxLife:.35,size:p.type==='bolt'?.3:.14,color:p.color})}_up(dt)};const _de=damageEnemy;damageEnemy=function(en,d){camShake=Math.max(camShake,.07);_de(en,d)}}
requestAnimationFrame(frame);
})();