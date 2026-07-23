/* ===== nombres para el tooltip (por grupo) ===== */
const NAMES = {
  0:{n:"Generador de Bloques (Stone)", m:"Cobble Gen Galore · el tier básico define la velocidad"},
  1:{n:"Crisol de Porcelana",  m:"Ex Deorum · funde cobble → 250mb de lava"},
  2:{n:"Lava fundida",         m:"dentro del crisol"},
  3:{n:"Magmatic Generator",   m:"Generator Galore · 40 FE/t · tanque interno de lava"},
  4:{n:"Lava (fuente de calor)",m:"debajo del crisol · funde ×3"},
  5:{n:"Plataforma",           m:"cobblestone"},
  6:{n:"Flux Hammer",          m:"Ex Machinis · martilla con FE · saca al inventario de ATRÁS"},
  7:{n:"Flux Sieve",           m:"Ex Machinis · FE + malla · deposita al inventario de DEBAJO"},
  8:{n:"Barril de salida",     m:"Sophisticated · empotrado DEBAJO del Flux Sieve"},
  9:{n:"Agua (fuente)",        m:"bloque completo a un lado"},
  10:{n:"Lava (fuente)",       m:"bloque completo al otro lado · agua+lava = cobble"},
  11:{n:"Cajón de roble 1×1",  m:"Functional Storage · ENCIMA: recibe el output"},
  12:{n:"Tubería de Fluidos (Pipez)", m:"lleva la lava del crisol al generador"},
  14:{n:"Tubería de Energía (Pipez)", m:"reparte el FE del generador al Flux Hammer"},
  15:{n:"Conexión en modo EXTRACT",   m:"se marca con la Llave de Pipez · es la punta que JALA"}
};

/* ===== texturas sueltas en la página (data-tex) ===== */
document.querySelectorAll("[data-tex]").forEach(el=>{
  const k = el.getAttribute("data-tex");
  if(TEX[k]) el.src = TEX[k];
});

/* ===== recetas 3x3 ===== */
const P="oak_planks", R="stick", C="cobblestone", H="i_stone_hammer", PC="i_clay_ball",
      F="flint", G="glass_pane", DH="i_diamond_hammer", IB="iron_block", HP="hopper_item",
      BR="iron_bars", II="iron_ingot", BK="bucket", RS="redstone", _=null;
const RECIPES = {
  barrel: [P,_,P, P,_,P, P,P,P],
  sieve:  [P,_,P, P,P,P, R,_,R],
  crook:  [R,R,_, _,R,_, _,R,_],
  hammer: [_,C,_, _,R,C, R,_,_],
  chammer:[H,H,H, H,H,H, H,H,H],
  pcrucible:[PC,_,PC, PC,_,PC, PC,PC,PC],
  wrench: [_,F,_, _,R,F, R,_,_],           // llave de Pipez: 2 flint + 2 palos
  fpipe:  [II,II,II, BK,RS,BK, II,II,II],  // 16 tuberías de fluidos
  fhammer:[G,G,G, G,DH,G, IB,HP,IB],       // flux hammer
  fsieve: [BR,BR,BR, BR,P,BR, IB,HP,IB]    // flux sieve (P = cualquier tamiz)
};
document.querySelectorAll("[data-recipe]").forEach(grid=>{
  const cells = RECIPES[grid.getAttribute("data-recipe")] || [];
  for(let i=0;i<9;i++){
    const d=document.createElement("div"); d.className="cell";
    const k=cells[i];
    if(k && TEX[k]){ const im=document.createElement("img"); im.src=TEX[k]; im.alt=""; d.appendChild(im); }
    grid.appendChild(d);
  }
});

/* ===== helpers ===== */
function B(x,y,z, tex, group, o){ o=o||{}; return {x,y,z, from:o.from, to:o.to, tex, group, glow:o.glow, tint:o.tint}; }
/* tubo horizontal a lo largo de X (grosor 6/16) */
function pipeX(x,y,z, tex, group){ return B(x,y,z, tex, group, {from:[0,5,5], to:[16,11,11]}); }
/* muñón corto que conecta el tubo hacia -Z (hacia la máquina de enfrente) */
function stubZ(x,y,z, tex, group){ return B(x,y,z, tex, group, {from:[5,5,0], to:[11,11,5]}); }

/* texturas por cara */
const T_GEN = {up:"gen_stone_top", side:"gen_stone_side", down:"gen_stone_bottom"};
const T_MAG = {up:"mag_top_on", down:"mag_bottom", south:"mag_front", north:"mag_side", east:"mag_side", west:"mag_side"};
const T_FXH = {up:"flux_hammer_top", side:"flux_hammer_box", down:"flux_hammer_box"};
const T_FXS = "flux_sieve";
const T_BAR = {up:"barrel_top", down:"barrel_bottom", side:"barrel_side"};
const T_DRW = {south:"fs_oak_front", up:"fs_oak_side", down:"fs_oak_side", north:"fs_oak_side", east:"fs_oak_side", west:"fs_oak_side"};

/* ============ ESCENA 1 — Generador de Bloques ============ */
/* orden = orden de construcción (para el modo paso a paso) */
const S1 = [
  // 1) plataforma (6)
  B(0,0,0,"cobblestone",5), B(1,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5),
  // 2) agua
  B(0,1,0,"water",9,{tint:"#3d6ecc"}),
  // 3) generador
  B(1,1,0,T_GEN,0),
  // 4) lava
  B(2,1,0,"lava",10,{glow:true}),
  // 5) cajón encima
  B(1,2,0,T_DRW,11)
];
const S1_STEPS = [
  {n:6, cap:"El piso: cualquier bloque sirve."},
  {n:1, cap:"Un bloque de AGUA completo a un lado."},
  {n:1, cap:"El Generador de Bloques en medio."},
  {n:1, cap:"LAVA al otro lado — ya está generando cobble adentro."},
  {n:1, cap:"El almacenamiento va ENCIMA (fíjate en el hueco de su textura superior): cajón, barril o cofre. Para las variantes con \"modifier\" (piedra, obsidiana…), ese bloque va DEBAJO."}
];

/* ============ ESCENA 2 — Crisol → tubería → Magmatic ============ */
const S2 = [
  // 1) piso + calor (6)
  B(1,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5),
  B(0,0,0,"lava",4,{glow:true}),
  // 2) crisol + su lava (2)
  B(0,1,0,"porcelain_crucible",1,{from:[1,0,1],to:[15,13,15]}),
  B(0,1,0,"lava",2,{from:[2,9,2],to:[14,13,14],glow:true}),
  // 3) magmatic (1)
  B(2,1,0,T_MAG,3),
  // 4) tubería + banda extract (2)
  pipeX(1,1,0,"pipe_fluid",12),
  B(1,1,0,"pipe_energy",15,{from:[0,4,4],to:[3,12,12]})
];
const S2_STEPS = [
  {n:6, cap:"El piso — con la fuente de CALOR (lava) en el hueco donde irá el crisol."},
  {n:2, cap:"El Crisol de porcelana sobre el calor: le echas cobble por arriba (hopper) y lo funde en lava."},
  {n:1, cap:"El Magmatic Generator, a un bloque de distancia. Pegado NO se alimenta: tiene tanque interno."},
  {n:2, cap:"Tubería de Fluidos de Pipez entre ambos. La banda naranja del lado del crisol = conexión en modo EXTRACT — se marca con la Llave (2 flint + 2 palos). Esa punta es la que JALA la lava."}
];

/* ============ ESCENA 3 — Línea Flux: cero tuberías de items ============ */
const S3 = [
  // 1) piso con hueco (7)
  B(0,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5), B(3,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5), B(3,0,1,"cobblestone",5),
  // 2) barril empotrado (1)
  B(1,0,0,T_BAR,8),
  // 3) flux sieve encima del barril (1)
  B(1,1,0,T_FXS,7),
  // 4) flux hammer apuntando al sieve (1)
  B(0,1,0,T_FXH,6),
  // 5) magmatic pegado al sieve (1)
  B(2,1,0,T_MAG,3),
  // 6) energía por atrás: tubo + muñones + banda (5)
  pipeX(0,1,1,"pipe_energy",14), pipeX(1,1,1,"pipe_energy",14), pipeX(2,1,1,"pipe_energy",14),
  stubZ(0,1,1,"pipe_energy",14), stubZ(2,1,1,"pipe_energy",15)
];
const S3_STEPS = [
  {n:7, cap:"El piso — deja un hueco: ahí va la salida."},
  {n:1, cap:"El barril (Sophisticated, con Compacting Upgrade) EMPOTRADO en el hueco."},
  {n:1, cap:"El Flux Sieve va ENCIMA del barril: todo lo que cierne lo deposita al inventario de DEBAJO. Ponle su malla."},
  {n:1, cap:"El Flux Hammer con su salida apuntando al sieve: martilla y escupe la grava DIRECTO adentro. Cero tuberías de items — la entrada de cobble es por arriba (hopper o tubería)."},
  {n:1, cap:"El Magmatic Generator pegado al sieve: le pasa FE por contacto directo."},
  {n:5, cap:"Tubería de Energía de Pipez por atrás para alimentar también al hammer. La banda naranja en el generador = conexión marcada con la Llave para JALAR su energía."}
];

/* ===== construir escenas ===== */
function boot(){
  buildScene("scene1", S1, {spin:-30, tilt:32, zoom:1.15, unit:34, steps:S1_STEPS});
  buildScene("scene2", S2, {spin:-32, tilt:33, zoom:1.2, unit:34, steps:S2_STEPS});
  buildScene("scene3", S3, {spin:-26, tilt:30, zoom:1.05, unit:32, steps:S3_STEPS});
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
