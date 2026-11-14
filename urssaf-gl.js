// Fuis l'URSSAF : petit moteur WebGL (sans librairie). Caméra en perspective, lumière directionnelle douce,
// brouillard couleur de la pièce (effet maquette), maillages « voxel » faits de boîtes.
const VS=`attribute vec3 p;attribute vec3 n;attribute vec3 c;
uniform mat4 vp;uniform mat4 m;uniform vec3 cam;uniform vec3 ld;uniform vec4 tint;
varying vec3 v;varying float fd;
void main(){vec4 w=m*vec4(p,1.);gl_Position=vp*w;vec3 nn=normalize((m*vec4(n,0.)).xyz);
 float l=.66+.36*max(dot(nn,ld),0.)+.06*nn.y;v=mix(c*l,tint.rgb,tint.a);fd=distance(w.xyz,cam);}`;
const FS=`precision mediump float;varying vec3 v;varying float fd;uniform vec3 fogc;uniform vec2 fog;uniform float alpha;
void main(){float f=clamp((fd-fog.x)/(fog.y-fog.x),0.,1.);gl_FragColor=vec4(mix(v,fogc,f*f*(3.-2.*f)),alpha);}`;

export function hex(h){const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}
export const shade=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];

// ---- matrices (colonnes, comme WebGL)
export const M4={
 id:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
 mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o},
 persp(fov,asp,n,f){const t=1/Math.tan(fov/2);return [t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]},
 look(e,t,u=[0,1,0]){let zx=e[0]-t[0],zy=e[1]-t[1],zz=e[2]-t[2];let l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
  let xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx;l=Math.hypot(xx,xy,xz);xx/=l;xy/=l;xz/=l;
  const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  return [xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]},
 // translation, rotation autour de Y (yaw), échelle uniforme
 trs(x,y,z,yaw=0,s=1){const c=Math.cos(yaw)*s,sn=Math.sin(yaw)*s;return [c,0,-sn,0,0,s,0,0,sn,0,c,0,x,y,z,1]},
 rx(a){const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]},
 rz(a){const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]},
 t(x,y,z){return [1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]},
 sc(x,y,z){return [x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1]}
};
export function project(VP,w,h,x,y,z){const X=VP[0]*x+VP[4]*y+VP[8]*z+VP[12],Y=VP[1]*x+VP[5]*y+VP[9]*z+VP[13],W=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];if(W<=.01)return null;return [(X/W+1)/2*w,(1-Y/W)/2*h]}

// ---- constructeur de maillages : boîtes alignées (faces choisies), couleurs par face légèrement variées
export class Builder{constructor(){this.a=new Float32Array(9*6*600);this.n=0}
 grow(k){if((this.n+k)*9<=this.a.length)return;const b=new Float32Array(Math.max(this.a.length*2,(this.n+k)*9*1.5|0));b.set(this.a);this.a=b}
 v(x,y,z,nx,ny,nz,c){const a=this.a,i=this.n*9;a[i]=x;a[i+1]=y;a[i+2]=z;a[i+3]=nx;a[i+4]=ny;a[i+5]=nz;a[i+6]=c[0];a[i+7]=c[1];a[i+8]=c[2];this.n++}
 quad(p0,p1,p2,p3,nrm,c){this.grow(6);const [nx,ny,nz]=nrm;for(const p of [p0,p1,p2,p0,p2,p3])this.v(p[0],p[1],p[2],nx,ny,nz,c)}
 // faces : chaîne contenant t (haut) b (bas) n (z-) s (z+) e (x+) w (x-) ; par défaut toutes sauf le bas
 box(x0,y0,z0,x1,y1,z1,col,faces='tnsew',side=null){const c=typeof col==='string'?hex(col):col,sc=side?(typeof side==='string'?hex(side):side):c;
  if(faces.includes('t'))this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],c);
  if(faces.includes('b'))this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],shade(sc,.8));
  if(faces.includes('s'))this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],sc);
  if(faces.includes('n'))this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],sc);
  if(faces.includes('e'))this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],sc);
  if(faces.includes('w'))this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],sc);
  return this}
 // boîte centrée
 cbox(cx,cy,cz,w,h,d,col,faces,side){return this.box(cx-w/2,cy,cz-d/2,cx+w/2,cy+h,cz+d/2,col,faces,side)}
 // disque « pixel » (colonnes) de rayon r, sur la grille de pas g, entre y0 et y1
 disc(cx,cz,r,y0,y1,g,col,ring=0,side,faces='tnsew'){const n=Math.ceil(r/g);for(let i=-n;i<n;i++)for(let j=-n;j<n;j++){const x=(i+.5)*g,z=(j+.5)*g,d=Math.hypot(x,z);if(d>r||(ring&&d<r-ring))continue;this.box(cx+i*g,y0,cz+j*g,cx+(i+1)*g,y1,cz+(j+1)*g,col,faces,side)}return this}
 // disque vertical (dans le plan XY, épaisseur en z)
 vdisc(cx,cy,r,z0,z1,g,col,side){const n=Math.ceil(r/g);for(let i=-n;i<n;i++)for(let j=-n;j<n;j++){const x=(i+.5)*g,y=(j+.5)*g;if(Math.hypot(x,y)>r)continue;this.box(cx+i*g,cy+j*g,z0,cx+(i+1)*g,cy+(j+1)*g,z1,col,'tbnsew',side)}return this}
 data(){return this.a.subarray(0,this.n*9)}}

export function createGL(canvas){
 const gl=canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'})||canvas.getContext('experimental-webgl');if(!gl)return null;
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
 const A={p:gl.getAttribLocation(pr,'p'),n:gl.getAttribLocation(pr,'n'),c:gl.getAttribLocation(pr,'c')};
 const U={};for(const k of ['vp','m','cam','ld','tint','fogc','fog','alpha'])U[k]=gl.getUniformLocation(pr,k);
 gl.enableVertexAttribArray(A.p);gl.enableVertexAttribArray(A.n);gl.enableVertexAttribArray(A.c);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
 gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const ld=[.38,.82,.42],l=Math.hypot(...ld);gl.uniform3f(U.ld,ld[0]/l,ld[1]/l,ld[2]/l);
 let bound=null;
 const R={gl,
  mesh(b){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);const d=b.data?b.data():b;gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);bound=null;return {buf,n:d.length/9}},
  free(m){if(m&&m.buf){gl.deleteBuffer(m.buf);m.buf=null}},
  frame(w,h,VP,eye,fogc,fog){gl.viewport(0,0,w,h);gl.clearColor(fogc[0],fogc[1],fogc[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniformMatrix4fv(U.vp,false,VP);gl.uniform3f(U.cam,eye[0],eye[1],eye[2]);gl.uniform3f(U.fogc,fogc[0],fogc[1],fogc[2]);gl.uniform2f(U.fog,fog[0],fog[1]);gl.uniform1f(U.alpha,1);gl.uniform4f(U.tint,0,0,0,0)},
  draw(m,M,tint=null,alpha=1){if(!m||!m.buf||!m.n)return;if(bound!==m.buf){gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,36,0);gl.vertexAttribPointer(A.n,3,gl.FLOAT,false,36,12);gl.vertexAttribPointer(A.c,3,gl.FLOAT,false,36,24);bound=m.buf}
   gl.uniformMatrix4fv(U.m,false,M);if(tint)gl.uniform4f(U.tint,tint[0],tint[1],tint[2],tint[3]);
   if(alpha<1){gl.enable(gl.BLEND);gl.depthMask(false);gl.uniform1f(U.alpha,alpha)}
   gl.drawArrays(gl.TRIANGLES,0,m.n);
   if(alpha<1){gl.disable(gl.BLEND);gl.depthMask(true);gl.uniform1f(U.alpha,1)}if(tint)gl.uniform4f(U.tint,0,0,0,0)},
  lost:()=>gl.isContextLost()};
 return R}
