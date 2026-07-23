/* ===== nombres para el tooltip (por grupo) ===== */
const NAMES = {
  0:{n:"Generador de Bloques (Stone)", m:"Cobble Gen Galore · el tier básico define la velocidad"},
  1:{n:"Crisol de Porcelana",  m:"Ex Deorum · funde cobble → 250mb de lava"},
  2:{n:"Lava fundida",         m:"dentro del crisol"},
  3:{n:"Magmatic Generator",   m:"Generator Galore · 40 FE/t · tanque interno de lava"},
  4:{n:"Lava (fuente de calor)",m:"debajo del crisol · funde ×3"},
  5:{n:"Plataforma",           m:"cobblestone"},
  6:{n:"Mechanical Hammer",    m:"Ex Deorum · FE + un martillo dentro = doble velocidad"},
  7:{n:"Mechanical Sieve",     m:"Ex Deorum · FE + malla en su slot"},
  8:{n:"Barril (Sophisticated)", m:"con Compacting Upgrade compacta solo"},
  9:{n:"Agua (fuente)",        m:"bloque completo a un lado"},
  10:{n:"Lava (fuente)",       m:"bloque completo al otro lado · agua+lava = cobble"},
  11:{n:"Cajón de roble 1×1",  m:"Functional Storage · ENCIMA: recibe el output"},
  12:{n:"Tubería de Fluidos (Pipez)", m:"lleva la lava del crisol al generador"},
  13:{n:"Tubería de Items (Pipez)",   m:"mueve los items entre máquinas"},
  14:{n:"Tubería de Energía (Pipez)", m:"reparte el FE del generador"}
};

/* ===== texturas sueltas en la página (data-tex) ===== */
document.querySelectorAll("[data-tex]").forEach(el=>{
  const k = el.getAttribute("data-tex");
  if(TEX[k]) el.src = TEX[k];
});

/* ===== recetas 3x3 ===== */
const P="oak_planks", R="stick", C="cobblestone", H="i_stone_hammer", PC="i_clay_ball", _=null;
const RECIPES = {
  barrel: [P,_,P, P,_,P, P,P,P],
  sieve:  [P,_,P, P,P,P, R,_,R],
  crook:  [R,R,_, _,R,_, _,R,_],
  hammer: [_,C,_, _,R,C, R,_,_],
  chammer:[H,H,H, H,H,H, H,H,H],   // 9 martillos = martillo comprimido
  pcrucible:[PC,_,PC, PC,_,PC, PC,PC,PC]  // 7 porcelain clay -> crisol crudo ("s s"/"s s"/"sms")
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
function B(x,y,z, tex, group, o){ o=o||{}; return {x,y,z, from:o.from, to:o.to, tex, group, glow:o.glow, tint:o.tint}; }
/* tubería horizontal entre dos celdas contiguas (a lo largo de X): tubo delgado 6/16 */
function pipeX(x,y,z, tex, group){ return B(x,y,z, tex, group, {from:[0,5,5], to:[16,11,11]}); }

/* texturas por cara */
const T_GEN = {up:"gen_stone_top", side:"gen_stone_side", down:"gen_stone_bottom"};
const T_MAG = {up:"mag_top_on", down:"mag_bottom", south:"mag_front", north:"mag_side", east:"mag_side", west:"mag_side"};
const T_HAM = {up:"mech_hammer_top", down:"mech_hammer_bottom", south:"mech_hammer_front", north:"mech_hammer_side", east:"mech_hammer_side", west:"mech_hammer_side"};
const T_SIE = {up:"mech_sieve_top", side:"mech_sieve_side", down:"mech_sieve_bottom"};
const T_BAR = {up:"barrel_top", down:"barrel_bottom", side:"barrel_side"};
const T_DRW = {south:"fs_oak_front", up:"fs_oak_side", down:"fs_oak_side", north:"fs_oak_side", east:"fs_oak_side", west:"fs_oak_side"};

/* ===== ESCENA 1 — Generador de Bloques: agua | gen | lava, cajón ENCIMA ===== */
const S1 = [
  B(0,0,0,"cobblestone",5), B(1,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5),
  B(0,1,0,"water",9,{tint:"#3d6ecc"}),   // AGUA a un lado
  B(1,1,0,T_GEN,0),                      // GENERADOR en medio
  B(2,1,0,"lava",10,{glow:true}),        // LAVA al otro
  B(1,2,0,T_DRW,11)                      // CAJÓN ENCIMA: el output sale por arriba
];

/* ===== ESCENA 2 — Crisol → tubería de fluidos → Magmatic ===== */
const S2 = [
  B(1,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5),
  B(0,0,0,"lava",4,{glow:true}),                                   // calor DEBAJO del crisol
  B(0,1,0,"porcelain_crucible",1,{from:[1,0,1],to:[15,13,15]}),    // crisol
  B(0,1,0,"lava",2,{from:[2,9,2],to:[14,13,14],glow:true}),        // lava fundida dentro
  pipeX(1,1,0,"pipe_fluid",12),                                    // TUBERÍA de fluidos
  B(2,1,0,T_MAG,3)                                                 // magmatic generator
];

/* ===== ESCENA 3 — Línea pasiva: hammer →items→ sieve →items→ barril, energía detrás ===== */
const S3 = [
  // plataforma 5x2
  B(0,0,0,"cobblestone",5), B(1,0,0,"cobblestone",5), B(2,0,0,"cobblestone",5), B(3,0,0,"cobblestone",5), B(4,0,0,"cobblestone",5),
  B(0,0,1,"cobblestone",5), B(1,0,1,"cobblestone",5), B(2,0,1,"cobblestone",5), B(3,0,1,"cobblestone",5), B(4,0,1,"cobblestone",5),
  // fila de máquinas (z=1, al frente)
  B(0,1,1,T_HAM,6),                                   // mechanical hammer
  pipeX(1,1,1,"pipe_item",13),                        // tubería de items
  B(2,1,1,T_SIE,7,{from:[0,0,0],to:[16,13,16]}),      // mechanical sieve
  pipeX(3,1,1,"pipe_item",13),                        // tubería de items
  B(4,1,1,T_BAR,8),                                   // barril Sophisticated
  // energía por detrás (z=0): generador + tubería de energía tocando ambas máquinas
  B(1,1,0,T_MAG,3),
  pipeX(0,1,0,"pipe_energy",14),
  pipeX(2,1,0,"pipe_energy",14)
];

/* ===== construir escenas ===== */
function boot(){
  buildScene("scene1", S1, {spin:-30, tilt:30, zoom:1.15, unit:34});
  buildScene("scene2", S2, {spin:-32, tilt:33, zoom:1.2, unit:34});
  buildScene("scene3", S3, {spin:-26, tilt:30, zoom:1, unit:30});
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
