import { BUILDINGS, VILLAGE_TREES, WORLDS, type Player, type SceneId } from './world';
type Options = { time:number; activity:'idle'|'walking'|'focusing'|'sleeping'; streak:number; interactionId?:string };
const C={ink:'#192c32',grass:'#48604a',path:'#a5916a',pale:'#d9c49a',wood:'#79513d',amber:'#e5b866',teal:'#4e9692',water:'#355d68'};
const hash=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
const palette:Record<string,string>={X:C.ink,H:'#513d37',h:'#80604a',S:'#d7a67e',s:'#ad775e',T:'#397a7d',t:'#61aaa0',B:'#284e56',A:'#d5a35a',L:'#ffe3a0',W:'#eee0b7',E:'#202c32'};
const front=['....HHH.....','...HHhHH....','..HHHHhHH...','..HSSSSSH...','...SESES....','...SSSSS....','....sss.....','...XTTTX....','..XTTtTTX...','..STTtTTSA..','...TTtTT.AL.','...TTTTT.AA.','..XTTTTTX...','...BB.BB....','...XX.XX....'];
const back=front.map((r,i)=>i>=3&&i<=5?'...HHHHH....':r);
const side=['....HHH.....','...HHhHH....','...HHHHHH...','...HSSSS....','...HSESS....','....SSSSS...','....sss.....','....XTTX....','...XTTtTX...','...TTtSSA...','...TTtT.AL..','...TTTT.AA..','...XTTTX....','....BBBB....','....XXXX....'];
function matrix(ctx:CanvasRenderingContext2D,rows:string[],x:number,y:number,scale=3){rows.forEach((r,j)=>[...r].forEach((cell,i)=>{if(palette[cell]){ctx.fillStyle=palette[cell];ctx.fillRect(Math.round(x+i*scale),Math.round(y+j*scale),scale,scale)}}))}
export function renderWorld(ctx:CanvasRenderingContext2D,sceneId:SceneId,player:Player,o:Options){
 const t=o.time/1000;
 const rect=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
 const text=(v:string,x:number,y:number,c=C.pale,size=10)=>{ctx.font=size+'px monospace';ctx.textAlign='center';ctx.fillStyle=C.ink;ctx.fillText(v,x+1,y+1);ctx.fillStyle=c;ctx.fillText(v,x,y)};
 const shadow=(x:number,y:number,w:number)=>{rect(x-w/2+4,y-4,w-8,8,'#213b3666');rect(x-w/2,y-2,w,4,'#213b3666')};
 const candle=(x:number,y:number)=>{rect(x-8,y+8,20,4,C.wood);rect(x,y-8,4,16,C.pale);rect(x-4,y-16,12,8,'#e5b86622');rect(x,y-16-(Math.floor(t*3)%2)*2,4,8,C.amber);rect(x,y-12,4,4,'#fff0c1')};
 const sign=(x:number,y:number,v:string)=>{rect(x-2,y,4,24,C.wood);rect(x-20,y-12,40,20,C.ink);rect(x-18,y-10,36,16,C.wood);text(v,x,y+1,C.pale,8)};
 const tree=(x:number,y:number,seed:number)=>{
  shadow(x,y,64);rect(x-12,y-44,24,44,'#493e32');rect(x-8,y-44,8,40,'#82634a');rect(x+4,y-28,4,28,'#332f2b');
  [[-20,-104,40,16],[-32,-88,64,20],[-40,-68,80,24],[-32,-44,64,12]].forEach(([dx,dy,w,h],i)=>{rect(x+dx,y+dy,w,h,i%2?'#2e5146':'#375c49');rect(x+dx+4,y+dy,w-12,4,'#617650');for(let k=0;k<6;k++)rect(x+dx+4+Math.floor(hash(seed+i*8+k)*(w-12)/4)*4,y+dy+8+k%2*4,8,4,k%2?'#496d4e':'#3f6249')});rect(x-24,y-84,8,4,'#86945e');rect(x+12,y-52,12,4,'#708455');
 };
 const building=(b:typeof BUILDINGS[number])=>{
  const {x,y,width:w,height:h,doorX}=b;shadow(x+w/2,y+h,w+20);rect(x-4,y-4,w+8,h+4,C.ink);rect(x,y,w,h,'#b19a70');
  for(let j=0;j<h;j+=12){rect(x,y+j,w,2,'#8b7859');for(let i=12;i<w-12;i+=32)rect(x+i+(j%24?12:0),y+j,2,12,'#958362')}
  rect(x+4,y,8,h,C.wood);rect(x+w-12,y,8,h,C.wood);rect(x,y+60,w,8,C.wood);
  [x+28,x+w-60].forEach(wx=>{rect(wx-4,y+28,40,44,C.wood);rect(wx,y+32,32,36,'#d9b96c');rect(wx+4,y+36,24,28,'#edce86');rect(wx+12,y+32,4,36,C.wood);rect(wx,y+48,32,4,C.wood);rect(wx-4,y+72,40,8,'#6b7751');rect(wx+4,y+68,4,8,'#dfa292');rect(wx+24,y+68,4,8,'#d7ba78')});
  rect(doorX-20,y+h-60,40,60,'#4b3d36');rect(doorX-16,y+h-56,32,52,'#6b5140');rect(doorX-12,y+h-52,24,12,'#baad7a');rect(doorX-2,y+h-52,4,12,C.wood);rect(doorX+8,y+h-28,4,4,C.amber);rect(doorX-24,y+h,48,8,'#7b8580');
  for(let row=0;row<8;row++){const inset=(7-row)*7,ry=y-76+row*12;rect(x-16+inset,ry,w+32-inset*2,16,C.ink);rect(x-12+inset,ry,w+24-inset*2,12,b.roof);for(let tx=x-8+inset;tx<x+w+8-inset;tx+=24){rect(tx+row%2*4,ry+2,16,2,'#bd94776b');rect(tx+row%2*4+16,ry+4,2,8,'#25303c66')}}
  rect(x+w-44,y-96,24,48,'#7c7163');rect(x+w-48,y-100,32,8,C.ink);for(let j=0;j<3;j++){const phase=(t*8+j*14)%44;rect(x+w-36+Math.sin(t+j)*5,y-108-phase,12+j*4,8,'#b9c7bd28')}rect(x+16,y+80,w-32,16,C.ink);text(b.name,x+w/2,y+92,C.pale,9);
 };
 const character=(x:number,y:number,facing:Player['facing'],npc=false)=>{
  const walking=!npc&&o.activity==='walking',step=walking?Math.floor(player.walkFrame)%2:0,bob=walking?step*2:Math.floor(t*.8)%2;
  shadow(x,y,28);ctx.save();ctx.translate(Math.round(x),Math.round(y-bob));if(facing==='left')ctx.scale(-1,1);matrix(ctx,facing==='up'?back:facing==='left'||facing==='right'?side:front,-18,-45);
  if(walking){rect(-9,-3,6,3,C.ink);rect(3,-3,6,3,C.ink);rect(step?3:-9,0,6,3,'#b79b70')}
  if(npc){rect(-9,-42,21,6,'#8b6575');rect(-12,-36,27,3,C.pale);rect(-9,-21,18,3,'#b18d73')}ctx.restore();
 };
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,960,600);const layers:{y:number;paint:()=>void}[]=[];
 if(sceneId==='village'){
  rect(0,0,960,600,C.grass);for(let i=0;i<1150;i++){const x=Math.floor(hash(i)*240)*4,y=Math.floor(hash(i+1900)*150)*4;rect(x,y,i%5?4:8,4,i%3?'#526b4d':'#3f5744');if(i%7===0)rect(x+4,y-4,4,8,'#617550')}
  const path=(x:number,y:number,w:number,h:number)=>{rect(x-4,y-4,w+8,h+8,'#697252');rect(x,y,w,h,C.path);for(let i=0;i<w*h/500;i++)rect(x+Math.floor(hash(i+x)*(w-8)/4)*4,y+Math.floor(hash(i+y+99)*(h-4)/4)*4,8,4,'#baa57b')};
  path(220,280,48,148);path(220,396,512,48);path(484,244,48,164);path(724,272,48,100);path(408,312,100,124);path(432,428,48,136);
  rect(740,316,64,284,'#96a17b');rect(748,320,48,280,C.water);for(let i=0;i<26;i++)rect(752+((i*12+Math.floor(t*3)*4)%32),324+i*12,12,4,i%2?'#5c8c8d':'#45757c');for(let y=336;y<600;y+=44){rect(736,y,4,16,'#7c925f');rect(800,y+12,4,16,'#7c925f')}
  [724,788].forEach(x=>{rect(x,400,24,56,'#543f35');for(let y=404;y<456;y+=12)rect(x,y,24,8,'#aa8055');rect(x+4,392,4,16,C.wood);rect(x+4,448,4,16,C.wood)});rect(748,416,8,8,'#aa8055');rect(780,428,8,8,'#aa8055');
  rect(584,432,92,48,'#74815b');rect(592,436,76,40,C.water);rect(584,444,92,24,C.water);[604,632,652].forEach((x,i)=>{rect(x,448+i%2*12,16,8,'#85965e');rect(x+8,448+i%2*12,4,4,C.water)});rect(620,438,12,8,'#a8b678');rect(620,434,4,4,C.pale);rect(628,434,4,4,C.pale);rect(620,434,2,2,C.ink);rect(628,434,2,2,C.ink);
  for(let i=0;i<80;i++){const x=140+Math.floor(hash(i+42)*138)*4,y=456+Math.floor(hash(i+142)*22)*4;if(x>576&&x<688)continue;rect(x,y,4,8,'#78915b');rect(x-4,y-4,12,4,i%3?'#d9ad84':'#a69ac2');rect(x,y-4,4,4,'#e8d08e')}
  BUILDINGS.forEach(b=>layers.push({y:b.y+b.height,paint:()=>building(b)}));VILLAGE_TREES.forEach((p,i)=>layers.push({y:p.y,paint:()=>tree(p.x,p.y,i*23)}));
  layers.push({y:380,paint:()=>{shadow(456,380,84);rect(424,344,64,36,'#344e50');rect(420,340,72,12,'#89968a');rect(428,344,56,24,'#395f6a');rect(444,320,24,36,'#6a837e');rect(448,308,16,20,'#9db8a5');rect(452,296,8,16,C.teal);rect(452,300,4,8,'#d3efca');rect(432+Math.floor(t*4)%3*12,356,12,4,'#82aca1')}});
  layers.push({y:352,paint:()=>character(352,352,'down',true)},{y:314,paint:()=>character(600,314,'left',true)});
  layers.push({y:344,paint:()=>{rect(204,328,24,16,'#5c6355');rect(208,316,16,16,'#393c38');const hue=o.streak>=7?'#8cdbd0':'#edba6d',height=o.streak>=30?32:20;rect(208,316-height,16,height,hue);rect(212,308-height,8,height,'#eee1a4');rect(212,300-height+Math.floor(t*4)%2*4,4,8,hue);if(!o.streak)rect(208,304,16,20,'#829b86')}});
  layers.push({y:440,paint:()=>sign(710,420,'CLOSED')},{y:488,paint:()=>sign(672,468,'CHOIR')},{y:388,paint:()=>sign(872,368,'SEALED')});text('GREENVALE',448,484,'#d9c49a99',12);
 }else{
  rect(0,0,960,600,'#14272d');rect(208,72,544,456,'#293a38');rect(224,80,512,64,'#7b6751');for(let x=224;x<736;x+=32){rect(x,84,28,52,'#8d7859');rect(x,136,32,8,'#4e4235')}rect(224,144,512,368,'#7d5943');
  for(let y=144;y<512;y+=24){rect(224,y,512,2,'#4a3d34');for(let x=224;x<736;x+=64){rect(x+(y%48?28:0),y,2,24,'#4a3d34');rect(x+12,y+8,28,2,'#936b4c')}}
  rect(216,144,8,376,C.ink);rect(736,144,8,376,C.ink);rect(224,504,232,16,'#493a32');rect(504,504,232,16,'#493a32');rect(456,500,48,20,'#b59c71');text('OUT',480,516,C.ink,8);
  rect(436,80,88,56,C.ink);rect(440,84,80,48,'#486775');rect(496,88,12,12,'#d8dbb4');rect(500,84,12,12,'#486775');rect(476,84,8,48,'#463f37');rect(440,108,80,4,'#463f37');rect(432,80,8,56,'#a39179');rect(520,80,8,56,'#a39179');rect(440,144,80,80,'#bbd9bf0b');
  rect(380,328,184,112,'#383a40');rect(384,332,176,104,'#8b665c');rect(392,340,160,88,'#b09470');rect(400,348,144,72,'#4d7773');for(let x=400;x<544;x+=16){rect(x,348,8,4,'#b8b58b');rect(x,416,8,4,'#b8b58b');rect(x,324,4,4,'#b09470');rect(x,440,4,4,'#b09470')}rect(456,372,32,24,'#899d81');rect(464,364,16,40,'#899d81');rect(464,376,16,16,'#d3be89');
  rect(240,156,112,32,'#4e3c31');for(let i=0;i<12;i++)rect(248+i*8,156+i%3*4,6,24-i%3*4,['#6b8d87','#b79261','#8e6f7a'][i%3]);rect(240,180,112,8,'#aa8056');
  layers.push({y:254,paint:()=>{shadow(356,254,128);rect(308,240,8,28,'#493b32');rect(396,240,8,28,'#493b32');rect(296,204,120,40,'#493b32');rect(300,200,112,40,'#ac8056');rect(304,204,104,4,'#c69c6b');rect(332,212,44,24,C.ink);rect(336,208,36,24,'#dfd2a7');rect(352,208,4,24,'#baa782');for(let y=212;y<228;y+=8){rect(340,y,8,2,'#968774');rect(360,y,8,2,'#968774')}rect(380,216,8,12,'#385c61');rect(384,200,4,20,'#c6c1a0');candle(312,212);rect(340,268,32,8,'#4e3c31');rect(344,264,24,8,'#a07853');rect(344,276,4,16,'#4e3c31');rect(364,276,4,16,'#4e3c31')}});
  layers.push({y:350,paint:()=>{shadow(644,350,104);rect(596,218,96,132,'#493c36');rect(600,218,88,16,'#ae8c62');rect(604,234,80,108,'#c5baa0');rect(612,238,64,28,'#e5d9b2');rect(616,242,56,16,'#f0e5c5');rect(604,272,80,68,'#456d76');rect(608,276,72,8,'#6b9b9a');for(let y=292;y<336;y+=16)rect(608,y,72,4,'#638b8b');rect(600,336,88,12,'#997450');rect(600,348,8,12,'#4e3c31');rect(680,348,8,12,'#4e3c31');if(o.activity==='sleeping'){matrix(ctx,['.HHHHH.','HSSSSSH','HSESESH','.SSSSS.','..sss..'],632,242,3);text('z',670+Math.floor(t)%2*4,222-Math.floor(t*5)%20,'#c9d8c2',12)}}});
  layers.push({y:192,paint:()=>{rect(660,164,60,28,'#614936');rect(660,156,60,12,'#a77e52');candle(684,156);rect(704,144,8,12,'#456d62');rect(700,140,16,4,'#8f9b64')}});
  layers.push({y:448,paint:()=>{rect(248,388,48,60,'#4c3a30');rect(248,388,48,8,'#af8457');rect(248,436,48,8,'#af8457');rect(256,396,8,32,'#64867c');rect(268,400,8,28,'#a87762');rect(280,396,8,32,'#bea16a');rect(252,380,40,8,'#d3c59a')}});
 }
 if(o.activity!=='sleeping')layers.push({y:player.y,paint:()=>{character(player.x,player.y,o.activity==='focusing'?'up':player.facing);if(o.activity==='focusing'){rect(player.x-6,player.y-8,12,8,'#a07853');if(Math.floor(t*2)%2)rect(player.x+12,player.y-30,4,4,C.pale)}}});
 layers.sort((a,b)=>a.y-b.y).forEach(l=>l.paint());
 if(sceneId==='village')for(let i=0;i<16;i++){const x=40+hash(i+400)*880+Math.sin(t*.2+i)*16,y=70+hash(i+700)*470+Math.cos(t*.4+i)*8;if(i%3)rect(x,y,3,3,Math.sin(t+i)>0?'#e2d68a88':'#b8c68d33');else rect((x+t*5)%940,y,6,3,'#b2a26977')}
 if(o.interactionId){const i=WORLDS[sceneId].interactions.find(v=>v.id===o.interactionId);if(i){const x=i.bounds.x+i.bounds.width/2,y=i.bounds.y-12+Math.floor(t*2)%2*2;rect(x-8,y-12,16,16,C.ink);rect(x-6,y-10,12,12,C.pale);text('E',x,y,C.ink,10)}}ctx.restore();
}
