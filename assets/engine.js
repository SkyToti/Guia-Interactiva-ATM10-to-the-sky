/* ============================================================
   Motor isométrico fiel a Minecraft — Canvas 2D
   · proyección ortográfica
   · ocultación de caras traseras
   · orden por profundidad recalculado cada fotograma
   · cables con núcleo + brazos de conexión reales
   · subpartes montadas en la cara del cable
   · tooltip por color-picking
   ============================================================ */

const ZONES = [
  {id:"core",   name:"Controlador",             c:"var(--fluix)"},
  {id:"blue",   name:"Almacenamiento",          c:"var(--z-blue)"},
  {id:"purple", name:"CPUs de fabricación",     c:"var(--z-purple)"},
  {id:"lime",   name:"Ensambladores",           c:"var(--z-lime)"},
  {id:"orange", name:"Máquinas de otros mods",  c:"var(--z-orange)"}
];

/* grosores reales, en dieciseisavos de bloque */
const CABLE = {
  glass:{c:6/16,  K:"gK_", A:"gA_", label:"Cable de vidrio"},
  smart:{c:8/16,  K:"sK_", A:"sA_", label:"Cable inteligente"},
  dense:{c:12/16, K:"dK_", A:"dA_", label:"Cable denso inteligente"}
};
const COLORNAME = {fluix:"fluix", blue:"azul", purple:"morado", lime:"lima", orange:"naranja", red:"rojo"};

/* subpartes: t = grosor, w = ancho de la cara (fracción de bloque) */
const PART = {
  term:  {t:3/16,  w:14/16, n:"Terminal ME"},
  cterm: {t:3/16,  w:14/16, n:"Terminal de fabricación"},
  pterm: {t:3/16,  w:14/16, n:"Terminal de acceso a patrones"},
  ibus:  {t:5/16,  w:8/16,  n:"Bus de importación ME"},
  ebus:  {t:5/16,  w:8/16,  n:"Bus de exportación ME"},
  sbus:  {t:5/16,  w:8/16,  n:"Bus de almacenamiento ME"},
  ifacep:{t:4/16,  w:14/16, n:"Interfaz (plana)"},
  aplane:{t:1/16,  w:1,     n:"Plano de aniquilación"},
  fplane:{t:1/16,  w:1,     n:"Plano de formación"},
  p2p:   {t:4/16,  w:12/16, n:"Túnel P2P de ME"},
  lemit: {t:5/16,  w:6/16,  n:"Emisor de nivel"},
  eacc:  {t:5/16,  w:12/16, n:"Aceptador de energía"}
};

const NAMES = {
  ctrl_base:"Controlador ME", drivef:"Unidad ME (drive)", assembler:"Ensamblador molecular",
  provider:"Proveedor de patrones", iface:"Interfaz", inscriber:"Inscriptor",
  s1k:"Almacenamiento de fabricación 1k", s4k:"Almacenamiento de fabricación 4k",
  s16k:"Almacenamiento de fabricación 16k", s64k:"Almacenamiento de fabricación 64k",
  s256k:"Almacenamiento de fabricación 256k", accel:"Coprocesador",
  maccel:"MEGA Coprocesador (4 hilos)", mmon:"MEGA Monitor de fabricación",
  monitor:"Monitor de fabricación", unit:"Unidad de fabricación (relleno)",
  gside:"Máquina de otro mod", skysmooth:"Piedra celeste lisa (suelo)"
};

const DIRS = {e:[1,0,0], w:[-1,0,0], u:[0,1,0], d:[0,-1,0], s:[0,0,1], n:[0,0,-1]};

/* --- convierte los bloques lógicos en cajas dibujables --- */
function expand(blocks){
  const occ = new Map();      // solo cables y bloques cuentan para conectar
  const parts = new Map();    // celda -> caras con subparte
  blocks.forEach(b=>{
    if(b.k==="cable" || b.k==="block") occ.set(b.x+","+b.y+","+b.z, b);
    if(b.k==="part"){
      const k=b.x+","+b.y+","+b.z;
      if(!parts.has(k)) parts.set(k,[]);
      parts.get(k).push(b.face||"s");
    }
  });

  const boxes=[];
  blocks.forEach((b,i)=>{
    if(b.k==="slab"){
      // el suelo va JUSTO debajo de la capa de bloques, sin atravesarla
      boxes.push({x:b.x, y:b.y-0.58, z:b.z, sx:1, sy:0.16, sz:1, t:b.t, o:i});
    }
    else if(b.k==="block"){
      boxes.push({x:b.x, y:b.y, z:b.z, sx:1, sy:1, sz:1, t:b.t, o:i, lights:b.lights});
    }
    else if(b.k==="gap"){   // hueco obligatorio entre CPUs
      boxes.push({x:b.x, y:b.y, z:b.z, sx:1, sy:1, sz:1, t:null, gap:true, o:i});
    }
    else if(b.k==="cable"){
      const cfg = CABLE[b.type||"smart"], c = cfg.c, col = b.color||"fluix";
      boxes.push({x:b.x, y:b.y, z:b.z, sx:c, sy:c, sz:c, t:cfg.K+col, o:i});
      const mine = parts.get(b.x+","+b.y+","+b.z) || [];
      for(const [face,d] of Object.entries(DIRS)){
        let link = mine.includes(face);
        if(!link){
          const nb = occ.get((b.x+d[0])+","+(b.y+d[1])+","+(b.z+d[2]));
          if(nb){
            if(nb.k==="block") link = true;
            else { // cable con cable: mismo color, o alguno fluix
              const c2 = nb.color||"fluix";
              link = (c2===col || c2==="fluix" || col==="fluix");
            }
          }
        }
        if(!link) continue;
        const L=(1-c)/2, off=(1+c)/4;
        boxes.push({
          x:b.x+d[0]*off, y:b.y+d[1]*off, z:b.z+d[2]*off,
          sx:d[0]?L:c, sy:d[1]?L:c, sz:d[2]?L:c,
          t:cfg.A+col, o:i
        });
      }
    }
    else if(b.k==="part"){
      const cfg = PART[b.t] || {t:4/16, w:12/16};
      const d = DIRS[b.face||"s"];
      const off = 0.5 - cfg.t/2;
      boxes.push({
        x:b.x+d[0]*off, y:b.y+d[1]*off, z:b.z+d[2]*off,
        sx:d[0]?cfg.t:cfg.w, sy:d[1]?cfg.t:cfg.w, sz:d[2]?cfg.t:cfg.w,
        t:b.t, o:i
      });
    }
  });
  return boxes;
}

function labelOf(b){
  if(b.name) return b.name;
  if(b.k==="cable"){
    const cfg=CABLE[b.type||"smart"];
    return cfg.label+" "+(COLORNAME[b.color||"fluix"]);
  }
  if(b.k==="part") return (PART[b.t]||{}).n || b.t;
  return NAMES[b.t] || b.t;
}

const IMG = {}, SCENES = [];
(function preload(){
  const keys = Object.keys(TEX);
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
  {n:[ 0, 1, 0], c:[[-1, 1,-1],[ 1, 1,-1],[-1, 1, 1]], dark:0.00},
  {n:[ 0,-1, 0], c:[[-1,-1, 1],[ 1,-1, 1],[-1,-1,-1]], dark:0.55},
  {n:[ 0, 0, 1], c:[[-1, 1, 1],[ 1, 1, 1],[-1,-1, 1]], dark:0.22},
  {n:[ 0, 0,-1], c:[[ 1, 1,-1],[-1, 1,-1],[ 1,-1,-1]], dark:0.22},
  {n:[ 1, 0, 0], c:[[ 1, 1, 1],[ 1, 1,-1],[ 1,-1, 1]], dark:0.40},
  {n:[-1, 0, 0], c:[[-1, 1,-1],[-1, 1, 1],[-1,-1,-1]], dark:0.40}
];

function buildScene(id, blocks, opt){
  opt = opt || {};
  const stage = document.getElementById(id);
  if(!stage) return null;

  const boxes = expand(blocks);

  const cv = document.createElement("canvas");
  cv.style.display = "block";
  stage.appendChild(cv);
  const ctx = cv.getContext("2d");

  // canvas oculto para identificar el bloque bajo el cursor
  const pick = document.createElement("canvas");
  const pctx = pick.getContext("2d", {willReadFrequently:true});

  const tip = document.createElement("div");
  tip.className = "tip";
  stage.appendChild(tip);

  const st = {yaw: opt.spin ?? -32, pitch: opt.tilt ?? 32, zoom: opt.zoom ?? 1, zone:null};

  const xs=boxes.map(b=>b.x), ys=boxes.map(b=>b.y), zs=boxes.map(b=>b.z);
  const ctr = {
    x:(Math.min(...xs)+Math.max(...xs))/2,
    y:(Math.min(...ys)+Math.max(...ys))/2,
    z:(Math.min(...zs)+Math.max(...zs))/2
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
    pickDirty = true;
    redraw();
  }

  function cam(scale){
    const yaw=st.yaw*Math.PI/180, pit=st.pitch*Math.PI/180;
    const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pit), sp=Math.sin(pit);
    return {cy,sy,cp,sp,S:28*st.zoom*scale};
  }

  function paint(c2, scale, ox, oy, pickMode){
    const {cy,sy,cp,sp,S} = cam(scale);
    c2.setTransform(1,0,0,1,0,0);
    if(pickMode){ c2.fillStyle="#000"; c2.fillRect(0,0,pick.width,pick.height); }
    else c2.clearRect(0,0,cv.width,cv.height);
    c2.imageSmoothingEnabled = false;

    const P=(x,y,z)=>{
      const X=x*cy+z*sy, Z=-x*sy+z*cy;
      return {x:ox+X*S, y:oy-(y*cp-Z*sp)*S};
    };
    const facing = n => n[1]*sp + (-n[0]*sy + n[2]*cy)*cp;
    const vis = FACES.filter(f=>facing(f.n) > 1e-6);

    const order = boxes.map(b=>{
      const X=b.x-ctr.x, Y=b.y-ctr.y, Z=b.z-ctr.z;
      return {b, d: Y*sp + (-X*sy + Z*cy)*cp};
    }).sort((a,b)=>a.d-b.d);

    for(const it of order){
      const b = it.b;
      const img = IMG[b.t];
      if(!b.gap && !pickMode && (!img || !img.complete || !img.naturalWidth)) continue;

      const alpha = (st.zone && blocks[b.o].zone !== st.zone) ? 0.06 : 1;
      if(pickMode && alpha < 1) continue;

      const hx=b.sx/2, hy=b.sy/2, hz=b.sz/2;
      const X=b.x-ctr.x, Y=b.y-ctr.y, Z=b.z-ctr.z;
      const idc = pickMode ? idColor(b.o+1) : null;

      for(const f of vis){
        const p = f.c.map(c=>P(X+c[0]*hx, Y+c[1]*hy, Z+c[2]*hz));
        if(pickMode) flat(c2, p[0],p[1],p[2], idc);
        else if(b.gap) gapFace(c2, p[0],p[1],p[2]);
        else{
          quad(c2, img, p[0],p[1],p[2], f.dark, alpha);
          if(b.lights && IMG[b.lights] && IMG[b.lights].complete)
            quad(c2, IMG[b.lights], p[0],p[1],p[2], 0, alpha);
        }
      }
    }
    c2.setTransform(1,0,0,1,0,0);
    c2.globalAlpha = 1;
  }

  function quad(c2, img, P0,P1,P3, dark, alpha){
    const iw=img.naturalWidth, ih=img.naturalHeight;
    if(!iw||!ih) return;
    const sh = ih>iw ? iw : ih;          // texturas animadas: solo el primer cuadro
    c2.setTransform((P1.x-P0.x)/iw,(P1.y-P0.y)/iw,(P3.x-P0.x)/sh,(P3.y-P0.y)/sh,P0.x,P0.y);
    c2.globalAlpha = alpha;
    c2.drawImage(img, 0,0,iw,sh, -0.5,-0.5, iw+1, sh+1);
    if(dark>0){
      c2.globalAlpha = alpha*dark;
      c2.fillStyle = "#000";
      c2.fillRect(-0.5,-0.5,iw+1,sh+1);
    }
  }

  // hueco de separación: caja translúcida con borde punteado
  function gapFace(c2, P0,P1,P3){
    const P2={x:P1.x+P3.x-P0.x, y:P1.y+P3.y-P0.y};
    c2.setTransform(1,0,0,1,0,0);
    c2.beginPath();
    c2.moveTo(P0.x,P0.y); c2.lineTo(P1.x,P1.y); c2.lineTo(P2.x,P2.y); c2.lineTo(P3.x,P3.y);
    c2.closePath();
    c2.globalAlpha=.12; c2.fillStyle="#6FB9CE"; c2.fill();
    c2.globalAlpha=.5;  c2.strokeStyle="#6FB9CE";
    c2.lineWidth=Math.max(1,DPR); c2.setLineDash([4*DPR,4*DPR]);
    c2.stroke(); c2.setLineDash([]); c2.globalAlpha=1;
  }

  function flat(c2, P0,P1,P3, color){
    const P2={x:P1.x+P3.x-P0.x, y:P1.y+P3.y-P0.y};
    c2.setTransform(1,0,0,1,0,0);
    c2.globalAlpha=1; c2.fillStyle=color;
    c2.beginPath();
    c2.moveTo(P0.x,P0.y); c2.lineTo(P1.x,P1.y); c2.lineTo(P2.x,P2.y); c2.lineTo(P3.x,P3.y);
    c2.closePath(); c2.fill();
    // engrosar un poco para que no queden huecos sin id entre caras
    c2.lineWidth=1.2; c2.strokeStyle=color; c2.stroke();
  }

  const idColor = n => "rgb("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+")";

  function redraw(){
    if(raf) return;
    raf = requestAnimationFrame(()=>{
      raf = 0;
      if(!cv.width) return;
      paint(ctx, DPR, cv.width/2, cv.height/2, false);
      pickDirty = true;
    });
  }
  function ensurePick(){
    if(!pickDirty || !pick.width) return;
    paint(pctx, 1, pick.width/2, pick.height/2, true);
    pickDirty = false;
  }

  /* ---- tooltip ---- */
  let hoverId = -1;
  stage.addEventListener("pointermove", e=>{
    if(drag) { tip.classList.remove("on"); return; }
    const r = stage.getBoundingClientRect();
    const px = Math.round(e.clientX-r.left), py = Math.round(e.clientY-r.top);
    if(px<0||py<0||px>=pick.width||py>=pick.height){ tip.classList.remove("on"); return; }
    ensurePick();
    const d = pctx.getImageData(px,py,1,1).data;
    const idx = ((d[0]<<16)|(d[1]<<8)|d[2]) - 1;
    if(idx < 0 || idx >= blocks.length){ hoverId=-1; tip.classList.remove("on"); return; }
    if(idx !== hoverId){
      hoverId = idx;
      const b = blocks[idx];
      const extra = b.k==="part" ? "subparte montada en el cable"
                  : b.k==="cable" ? "núcleo + brazos de conexión"
                  : b.k==="slab"  ? "suelo decorativo" : "bloque completo";
      tip.innerHTML = "<b>"+labelOf(b)+"</b><i>"+extra+"</i>";
    }
    tip.style.left = Math.min(px+14, r.width-tip.offsetWidth-6)+"px";
    tip.style.top  = Math.max(6, py-10)+"px";
    tip.classList.add("on");
  });
  stage.addEventListener("pointerleave", ()=>{ tip.classList.remove("on"); hoverId=-1; });

  /* ---- controles ---- */
  const bar = document.querySelector('.ctrls[data-for="'+id+'"]');
  if(bar) bar.addEventListener("click", e=>{
    const b = e.target.closest("button"); if(!b) return;
    const a = b.dataset.act;
    if(a==="left")  st.yaw -= 45;
    if(a==="right") st.yaw += 45;
    if(a==="zin")   st.zoom = Math.min(3, st.zoom*1.18);
    if(a==="zout")  st.zoom = Math.max(0.3, st.zoom/1.18);
    if(a==="top"){  st.pitch = 78; st.yaw = -45; }
    if(a==="reset"){st.yaw = opt.spin ?? -32; st.pitch = opt.tilt ?? 32; st.zoom = opt.zoom ?? 1;}
    redraw();
  });

  let drag=null;
  stage.addEventListener("pointerdown", e=>{
    drag={x:e.clientX,y:e.clientY,yaw:st.yaw,pitch:st.pitch};
    stage.setPointerCapture(e.pointerId); stage.classList.add("drag");
    tip.classList.remove("on");
  });
  stage.addEventListener("pointermove", e=>{
    if(!drag) return;
    st.yaw   = drag.yaw + (e.clientX-drag.x)*0.55;
    st.pitch = Math.max(-85, Math.min(85, drag.pitch-(e.clientY-drag.y)*0.4));
    redraw();
  });
  const stop = ()=>{ drag=null; stage.classList.remove("drag"); };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  if(window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  else window.addEventListener("resize", resize);
  resize();

  const api = {redraw, setZone(z){ st.zone=z; redraw(); }};
  SCENES.push(api);
  return api;
}
