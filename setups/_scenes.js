/* ===== nombres para el tooltip (por grupo) ===== */
const NAMES = {
  0:{n:"Generador de Bloques", m:"Cobble Gen Galore · produce cobble solo"},
  1:{n:"Crisol de Porcelana",  m:"Ex Deorum · funde el cobble en lava"},
  2:{n:"Lava fundida",         m:"250 mb por cada cobble"},
  3:{n:"Magmatic Generator",   m:"Generator Galore · quema lava → RF"},
  4:{n:"Lava (fuente de calor)",m:"calienta el crisol · ×3"},
  5:{n:"Plataforma",           m:"cobblestone"},
  6:{n:"Martillo Mecánico",    m:"Ex Machinis Deorum · tritura con RF"},
  7:{n:"Tamiz Mecánico",       m:"Ex Machinis Deorum · cierne con RF"},
  8:{n:"Barril de salida",     m:"Sophisticated Storage · imán + apilado"}
};

/* ===== texturas sueltas en la página (data-tex) ===== */
document.querySelectorAll("[data-tex]").forEach(el=>{
  const k = el.getAttribute("data-tex");
  if(TEX[k]) el.src = TEX[k];
});

/* ===== recetas 3x3 ===== */
const P="oak_planks", R="stick", C="cobblestone", _=null;
const RECIPES = {
  barrel: [P,_,P, P,_,P, P,P,P],   // s s / s s / sms  (m = slab de roble)
  sieve:  [P,_,P, P,P,P, R,_,R],   // O O / O_O / I I
  crook:  [R,R,_, _,R,_, _,R,_],   // xx / _x / _x
  hammer: [_,C,_, _,R,C, R,_,_]    //  m  / _sm / s
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

/* ===== helper de caja ===== */
function B(x,y,z, tex, group, o){ o=o||{}; return {x,y,z, from:o.from, to:o.to, tex, group, glow:o.glow}; }

/* texturas por cara de cada máquina */
const T_GEN = {up:"gen_stone_top", side:"gen_stone_side", down:"gen_stone_bottom"};
const T_MAG = {up:"mag_top_on", down:"mag_bottom", south:"mag_front", north:"mag_side", east:"mag_side", west:"mag_side"};
const T_HAM = {up:"mech_hammer_top", down:"mech_hammer_bottom", south:"mech_hammer_front", north:"mech_hammer_side", east:"mech_hammer_side", west:"mech_hammer_side"};
const T_SIE = {up:"mech_sieve_top", side:"mech_sieve_side", down:"mech_sieve_bottom"};
const T_BAR = {up:"barrel_top", down:"barrel_bottom", side:"barrel_side"};

/* ===== ESCENA 1 — El motor infinito de poder ===== */
const S1 = [
  // plataforma
  B(0,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5),
  // fuente de calor bajo el crisol
  B(1,0,0,"lava",4,{glow:true}),
  // máquinas
  B(0,1,0,T_GEN,0),
  // crisol (cuerpo + lava dentro, bien visible desde arriba)
  B(1,1,0,"porcelain_crucible",1,{from:[1,0,1],to:[15,13,15]}),
  B(1,1,0,"lava",2,{from:[2,9,2],to:[14,13,14],glow:true}),
  // generador magmático
  B(2,1,0,T_MAG,3)
];

/* ===== ESCENA 2 — Hazlo pasivo ===== */
const S2 = [
  B(0,0,0,"cobblestone",5), B(1,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5),
  B(0,1,0,T_HAM,6),                                  // martillo mecánico
  B(1,1,0,T_SIE,7,{from:[0,0,0],to:[16,13,16]}),     // tamiz mecánico (más bajo)
  B(1,1,1,T_BAR,8),                                  // barril de salida
  B(2,1,0,T_MAG,3)                                   // magmatic generator
];

/* ===== construir escenas cuando el DOM esté listo ===== */
function boot(){
  buildScene("scene1", S1, {spin:-32, tilt:33, zoom:1.2, unit:34});
  buildScene("scene2", S2, {spin:-32, tilt:33, zoom:1.15, unit:34});
  // reveal on scroll
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
