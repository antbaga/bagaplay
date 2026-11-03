// BagaStore : petit moteur 3D WebGL (sans librairie). Caméra orthographique en vue 3/4, quatre angles,
// faces ombrées selon l'angle de vue (style « maquette »), sélection d'une case au doigt.
const VS=`attribute vec3 p;attribute vec3 c;uniform mat4 m;uniform vec4 tint;varying vec3 v;
void main(){gl_Position=m*vec4(p,1.);v=mix(c,tint.rgb,tint.a);}`;
const FS=`precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,1.);}`;

export function createRenderer(canvas){
 const gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true})||canvas.getContext('experimental-webgl');if(!gl)return null;
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
 const aP=gl.getAttribLocation(pr,'p'),aC=gl.getAttribLocation(pr,'c'),uM=gl.getUniformLocation(pr,'m'),uT=gl.getUniformLocation(pr,'tint');
 gl.enableVertexAttribArray(aP);gl.enableVertexAttribArray(aC);gl.enable(gl.DEPTH_TEST);
 const meshes=new Map();
 function upload(name,data,count){let m=meshes.get(name);if(!m){m={buf:gl.createBuffer(),n:0};meshes.set(name,m)}
  gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);gl.bufferData(gl.ARRAY_BUFFER,data.subarray(0,count*6),gl.DYNAMIC_DRAW);m.n=count}
 function draw(name,tint=[0,0,0,0]){const m=meshes.get(name);if(!m||!m.n)return;gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);
  gl.vertexAttribPointer(aP,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(aC,3,gl.FLOAT,false,24,12);gl.uniform4fv(uT,tint);gl.drawArrays(gl.TRIANGLES,0,m.n)}
 function frame(vp,list,bg=[.62,.78,.86]){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(bg[0],bg[1],bg[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(uM,false,vp);for(const [name,tint] of list)draw(name,tint)}
 return {gl,upload,frame,lost:()=>gl.isContextLost()}}

// ---------------------------------------------------------------- caméra
export function camera(){return {tx:30,tz:30,yaw:Math.PI/4,yawTo:Math.PI/4,pitch:.62,zoom:13,w:1,h:1}}
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export function basis(c){const D=60,e=[c.tx+D*Math.sin(c.yaw)*Math.cos(c.pitch),D*Math.sin(c.pitch),c.tz+D*Math.cos(c.yaw)*Math.cos(c.pitch)];
 const f=norm([c.tx-e[0],-e[1],c.tz-e[2]]),s=norm(cross(f,[0,1,0])),u=cross(s,f);return {e,f,s,u}}
export function viewProj(c){const {e,f,s,u}=basis(c),a=c.w/c.h,hh=c.zoom,hw=hh*a,n=1,fa=200;
 const V=[s[0],u[0],-f[0],0,s[1],u[1],-f[1],0,s[2],u[2],-f[2],0,-dot(s,e),-dot(u,e),dot(f,e),1];
 const P=[1/hw,0,0,0,0,1/hh,0,0,0,0,-2/(fa-n),0,0,0,-(fa+n)/(fa-n),1],M=new Float32Array(16);
 for(let col=0;col<4;col++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=P[k*4+r]*V[col*4+k];M[col*4+r]=v}return M}
// point 3D → pixels (CSS) ; null si hors champ
export function project(M,c,x,y,z){const X=M[0]*x+M[4]*y+M[8]*z+M[12],Y=M[1]*x+M[5]*y+M[9]*z+M[13];return [(X+1)/2*c.w,(1-Y)/2*c.h]}
// pixels → point au sol (y = 0)
export function ground(c,px,py){const {e,f,s,u}=basis(c),a=c.w/c.h,nx=(px/c.w*2-1)*c.zoom*a,ny=(1-py/c.h*2)*c.zoom;
 const o=[e[0]+s[0]*nx+u[0]*ny,e[1]+s[1]*nx+u[1]*ny,e[2]+s[2]*nx+u[2]*ny],t=-o[1]/f[1];return [o[0]+f[0]*t,o[2]+f[2]*t]}

// ---------------------------------------------------------------- construction des maillages
// Ombrage plat : la lumière vient d'en haut à gauche de l'écran, quel que soit l'angle de vue.
export class Builder{
 constructor(cap=1<<16){this.d=new Float32Array(cap*6);this.n=0;this.setYaw(Math.PI/4)}
 setYaw(y){const l=[-.55,1,.35],c=Math.cos(y),s=Math.sin(y);this.L=norm([l[0]*c+l[2]*s,l[1],-l[0]*s+l[2]*c])}
 reset(){this.n=0}
 grow(k){if((this.n+k)*6>this.d.length){const d=new Float32Array(Math.max(this.d.length*2,(this.n+k)*6+1024));d.set(this.d);this.d=d}}
 shade(nrm,col){const k=.58+.42*Math.max(0,dot(nrm,this.L))+(nrm[1]>.5?.04:0);return [col[0]*k,col[1]*k,col[2]*k]}
 tri(a,b,c,col){this.grow(3);const d=this.d;let i=this.n*6;for(const p of [a,b,c]){d[i++]=p[0];d[i++]=p[1];d[i++]=p[2];d[i++]=col[0];d[i++]=col[1];d[i++]=col[2]}this.n+=3}
 quad(a,b,c,d,col,nrm){const k=nrm?this.shade(nrm,col):col;this.tri(a,b,c,k);this.tri(a,c,d,k)}
 // pavé aligné sur les axes (sans face du dessous)
 box(x0,y0,z0,x1,y1,z1,col,top=col){if(x1<x0)[x0,x1]=[x1,x0];if(z1<z0)[z0,z1]=[z1,z0];
  this.quad([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],top,[0,1,0]);
  this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],col,[0,0,1]);
  this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],col,[0,0,-1]);
  this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],col,[1,0,0]);
  this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],col,[-1,0,0])}
 // pavé tourné autour de la verticale (personnages)
 obox(cx,cy,cz,hx,hy,hz,ang,col,top=col){const c=Math.cos(ang),s=Math.sin(ang),P=(x,y,z)=>[cx+x*c+z*s,cy+y,cz-x*s+z*c],R=(x,z)=>[x*c+z*s,0,-x*s+z*c];
  const a=P(-hx,hy,-hz),b=P(-hx,hy,hz),cc=P(hx,hy,hz),d=P(hx,hy,-hz),e=P(-hx,-hy,-hz),f=P(-hx,-hy,hz),g=P(hx,-hy,hz),h=P(hx,-hy,-hz);
  this.quad(a,b,cc,d,top,[0,1,0]);this.quad(f,g,cc,b,col,R(0,1));this.quad(h,e,a,d,col,R(0,-1));this.quad(g,h,d,cc,col,R(1,0));this.quad(e,f,b,a,col,R(-1,0))}
 // tuile au sol
 tile(x0,z0,x1,z1,y,col){this.quad([x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0],col)}
}
