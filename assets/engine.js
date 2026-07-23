/* ============================================================
   Motor 3D genérico — Guía Interactiva ATM10 Sky
   · Canvas 2D, proyección ortográfica (NO CSS 3D)
   · texturas reales por CARA (up/down/n/s/e/w)
   · sub-cajas con geometría estilo modelo de Minecraft (0..16)
   · brillo emisivo (lava, máquinas encendidas)
   · orden por profundidad recalculado cada fotograma
   · ocultación de caras traseras
   · tooltip por color-picking (nombre en español por bloque)
   Requiere que exista `const TEX = {clave: dataURI}` antes de cargar.
   ============================================================ */

const IMG = {}, SCENES = [];
(function preload(){
  const keys = Object.keys(typeof TEX!=="undefined"?TEX:{});
  let left = keys.length;
  if(!left) return;
  keys.forEach(k=>{
    const im = new Image();
    im.onload = im.onerror = ()=>{ if(--left===0) SCENES.forEach(s=>s.redraw()); };
    im.src = TEX[k];
    IMG[k] = im;
  });
})();

const FACES = [
  {k:"up",    n:[ 0, 1, 0], c:[[-1, 1,-1],[ 1, 1,-1],[-1, 1, 1]], dark:0.00},
  {k:"down",  n:[ 0,-1, 0], c:[[-1,-1, 1],[ 1,-1, 1],[-1,-1,-1]], dark:0.55},
  {k:"south", n:[ 0, 0, 1], c:[[-1, 1, 1],[ 1, 1, 1],[-1,-1, 1]], dark:0.22},
  {k:"north", n:[ 0, 0,-1], c:[[ 1, 1,-1],[-1, 1,-1],[ 1,-1,-1]], dark:0.22},
  {k:"east",  n:[ 1, 0, 0], c:[[ 1, 1, 1],[ 1, 1,-1],[ 1,-1, 1]], dark:0.40},
  {k:"west",  n:[-1, 0, 0], c:[[-1, 1,-1],[-1, 1, 1],[-1,-1,-1]], dark:0.40}
];

function texKey(box, k){
  const t = box.tex;
  if(typeof t === "string") return t;
  if(!t) return null;
  if(t[k]) return t[k];
  if(k==="up"   && t.top)    return t.top;
  if(k==="down" && t.bottom) return t.bottom;
  if((k==="north"||k==="south"||k==="east"||k==="west") && t.side) return t.side;
  return t.all || null;
}

/* convierte cajas lógicas (celda + from/to en 1/16) a cajas de mundo */
function expand(boxes){
  return boxes.map((b,i)=>{
    const f = b.from || [0,0,0], t = b.to || [16,16,16];
    return {
      cx: b.x + (f[0]+t[0])/32 - 0.5,
      cy: b.y + (f[1]+t[1])/32 - 0.5,
      cz: b.z + (f[2]+t[2])/32 - 0.5,
      hx: (t[0]-f[0])/32, hy: (t[1]-f[1])/32, hz: (t[2]-f[2])/32,
      tex: b.tex, glow: b.glow, tint: b.tint, group: (b.group!=null?b.group:i), o:i
    };
  });
}

function buildScene(id, boxes, opt){
  opt = opt || {};
  const stage = document.getElementById(id);
  if(!stage) return null;
  const bx = expand(boxes);

  const cv = document.createElement("canvas");
  cv.style.display = "block";
  stage.appendChild(cv);
  const ctx = cv.getContext("2d");
  const pick = document.createElement("canvas");
  const pctx = pick.getContext("2d", {willReadFrequently:true});
  const tip = document.createElement("div");
  tip.className = "tip";
  stage.appendChild(tip);

  const st = {yaw: opt.spin ?? -34, pitch: opt.tilt ?? 30, zoom: opt.zoom ?? 1};

  const cxs=bx.map(b=>b.cx), cys=bx.map(b=>b.cy), czs=bx.map(b=>b.cz);
  const ctr = {
    x:(Math.min(...cxs)+Math.max(...cxs))/2,
    y:(Math.min(...cys)+Math.max(...cys))/2,
    z:(Math.min(...czs)+Math.max(...czs))/2
  };

  let DPR=1, CW=0, CH=0, pickDirty=true, raf=0;

  function resize(){
    const r = stage.getBoundingClientRect();
    if(!r.width || !r.height) return;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    CW = Math.round(r.width); CH = Math.round(r.height);
    cv.width = CW*DPR; cv.height = CH*DPR;
    cv.style.width = CW+"px"; cv.style.height = CH+"px";
    pick.width = CW; pick.height = CH;
    pickDirty = true; redraw();
  }
  function cam(scale){
    const yaw=st.yaw*Math.PI/180, pit=st.pitch*Math.PI/180;
    return {cy:Math.cos(yaw), sy:Math.sin(yaw), cp:Math.cos(pit), sp:Math.sin(pit), S:(opt.unit??30)*st.zoom*scale};
  }
  function paint(c2, scale, ox, oy, pickMode){
    const {cy,sy,cp,sp,S} = cam(scale);
    c2.setTransform(1,0,0,1,0,0);
    if(pickMode){ c2.fillStyle="#000"; c2.fillRect(0,0,pick.width,pick.height); }
    else c2.clearRect(0,0,cv.width,cv.height);
    c2.imageSmoothingEnabled = false;

    const P=(x,y,z)=>{ const X=x*cy+z*sy, Z=-x*sy+z*cy; return {x:ox+X*S, y:oy-(y*cp-Z*sp)*S}; };
    const facing = n => n[1]*sp + (-n[0]*sy + n[2]*cy)*cp;
    const vis = FACES.filter(f=>facing(f.n) > 1e-6);

    const order = bx.map(b=>{
      const X=b.cx-ctr.x, Y=b.cy-ctr.y, Z=b.cz-ctr.z;
      return {b, d: Y*sp + (-X*sy + Z*cy)*cp};
    }).sort((a,b)=>a.d-b.d);

    for(const it of order){
      const b = it.b;
      const X=b.cx-ctr.x, Y=b.cy-ctr.y, Z=b.cz-ctr.z;
      const idc = pickMode ? idColor(b.group+1) : null;
      for(const f of vis){
        const p = f.c.map(c=>P(X+c[0]*b.hx, Y+c[1]*b.hy, Z+c[2]*b.hz));
        if(pickMode){ flat(c2, p[0],p[1],p[2], idc); continue; }
        const img = IMG[texKey(b,f.k)];
        if(!img || !img.complete || !img.naturalWidth) continue;
        quad(c2, img, p[0],p[1],p[2], b.glow?0:f.dark, b.tint);
      }
    }
    c2.setTransform(1,0,0,1,0,0);
  }
  function quad(c2, img, P0,P1,P3, dark, tint){
    const iw=img.naturalWidth, ih=img.naturalHeight;
    if(!iw||!ih) return;
    const sh = ih>iw ? iw : ih;                 // texturas animadas: solo el 1er cuadro
    c2.setTransform((P1.x-P0.x)/iw,(P1.y-P0.y)/iw,(P3.x-P0.x)/sh,(P3.y-P0.y)/sh,P0.x,P0.y);
    c2.globalAlpha = 1;
    c2.drawImage(img, 0,0,iw,sh, -0.5,-0.5, iw+1, sh+1);
    if(tint){ // teñir texturas en escala de grises (agua) con multiply
      c2.globalCompositeOperation = "multiply";
      c2.fillStyle = tint; c2.fillRect(-0.5,-0.5,iw+1,sh+1);
      c2.globalCompositeOperation = "source-over";
    }
    if(dark>0){ c2.globalAlpha = dark; c2.fillStyle = "#000"; c2.fillRect(-0.5,-0.5,iw+1,sh+1); c2.globalAlpha=1; }
  }
  function flat(c2, P0,P1,P3, color){
    const P2={x:P1.x+P3.x-P0.x, y:P1.y+P3.y-P0.y};
    c2.setTransform(1,0,0,1,0,0);
    c2.globalAlpha=1; c2.fillStyle=color;
    c2.beginPath(); c2.moveTo(P0.x,P0.y); c2.lineTo(P1.x,P1.y); c2.lineTo(P2.x,P2.y); c2.lineTo(P3.x,P3.y); c2.closePath(); c2.fill();
    c2.lineWidth=1.2; c2.strokeStyle=color; c2.stroke();
  }
  const idColor = n => "rgb("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+")";

  function redraw(){
    if(raf) return;
    raf = requestAnimationFrame(()=>{ raf=0; if(!cv.width) return; paint(ctx, DPR, cv.width/2, cv.height/2, false); pickDirty=true; });
  }
  function ensurePick(){ if(!pickDirty || !pick.width) return; paint(pctx, 1, pick.width/2, pick.height/2, true); pickDirty=false; }

  /* ---- tooltip ---- */
  let hoverId=-1;
  stage.addEventListener("pointermove", e=>{
    if(drag){ tip.classList.remove("on"); return; }
    const r = stage.getBoundingClientRect();
    const px=Math.round(e.clientX-r.left), py=Math.round(e.clientY-r.top);
    if(px<0||py<0||px>=pick.width||py>=pick.height){ tip.classList.remove("on"); return; }
    ensurePick();
    const d = pctx.getImageData(px,py,1,1).data;
    const g = ((d[0]<<16)|(d[1]<<8)|d[2]) - 1;
    const name = NAMES[g];
    if(g<0 || name==null){ hoverId=-1; tip.classList.remove("on"); return; }
    if(g!==hoverId){ hoverId=g; tip.innerHTML = "<b>"+name.n+"</b>"+(name.m?"<i>"+name.m+"</i>":""); }
    tip.style.left = Math.min(px+14, r.width-tip.offsetWidth-6)+"px";
    tip.style.top  = Math.max(6, py-10)+"px";
    tip.classList.add("on");
  });
  stage.addEventListener("pointerleave", ()=>{ tip.classList.remove("on"); hoverId=-1; });

  /* ---- controles ---- */
  const bar = document.querySelector('.ctrls[data-for="'+id+'"]');
  if(bar) bar.addEventListener("click", e=>{
    const b=e.target.closest("button"); if(!b) return;
    const a=b.dataset.act;
    if(a==="left")  st.yaw -= 45;
    if(a==="right") st.yaw += 45;
    if(a==="zin")   st.zoom = Math.min(3.2, st.zoom*1.18);
    if(a==="zout")  st.zoom = Math.max(0.4, st.zoom/1.18);
    if(a==="top"){  st.pitch = 74; st.yaw = -45; }
    if(a==="reset"){st.yaw = opt.spin ?? -34; st.pitch = opt.tilt ?? 30; st.zoom = opt.zoom ?? 1;}
    redraw();
  });

  let drag=null;
  stage.addEventListener("pointerdown", e=>{
    drag={x:e.clientX,y:e.clientY,yaw:st.yaw,pitch:st.pitch};
    stage.setPointerCapture(e.pointerId); stage.classList.add("drag"); tip.classList.remove("on");
  });
  stage.addEventListener("pointermove", e=>{
    if(!drag) return;
    st.yaw = drag.yaw + (e.clientX-drag.x)*0.55;
    st.pitch = Math.max(-85, Math.min(85, drag.pitch-(e.clientY-drag.y)*0.4));
    redraw();
  });
  const stop=()=>{ drag=null; stage.classList.remove("drag"); };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  if(window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  else window.addEventListener("resize", resize);
  resize();

  const api = {redraw};
  SCENES.push(api);
  return api;
}
