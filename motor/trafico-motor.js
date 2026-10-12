// COPIA del motor de la app "Tráfico de Pautas" (github.com/LaloFissore/Reimpulso).
// Generado por herramientas/actualizar-motor.js el 2026-10-12. NO editar a mano.
// sha256 del trafico-pautas.html original: a5f29471357a790c4439829c0d81dd67123368111b55816f90e906971250cf4a

// ══════════════ CONFIGURACIÓN DE SOPORTES (agregar uno = una línea acá) ══════════════
// Cada soporte define su propia estructura de programación. Los campos que
// hacen a la "forma" del soporte (y que el motor usa para generalizar):
//   bloquesXProg  → cantidad de Grupos Madre (A, B, C...)
//   gruposXCiclo  → cada cuántos grupos empieza un ciclo nuevo (separador visual + alertas)
//   pePorGrupo    → cuántos slots PE tiene cada grupo (2 en outdoor, 1 en WTC)
//   capacidadFija → true: la Pauta tiene siempre los mismos seg, el PE no le cede espacio.
//                   false: la Pauta absorbe los seg que el PE no use (dinámico).
//   unaPautaPorBloque → true: el bloque lo ocupa una sola pauta (WTC Ascensores,
//                   donde el spot ocupa los 15s justos). false: varias pautas
//                   comparten el bloque mientras entren en los segundos.
//                   OJO: es independiente de capacidadFija — MAS BUS tiene
//                   capacidad fija (60s) pero varias pautas por bloque.
const PARAMS_OUTDOOR = { durProgSeg:934, pautaXProgSeg:720, progsXHora:4, bloquesXProg:16,
  gruposXCiclo:4, pePorGrupo:2, capacidadFija:false, unaPautaPorBloque:false,
  capBloque:45,        // seg totales por Grupo Madre
  capPE:12,            // máximo por bloque PE (A1 o A2)
  capTRAD_min:21,      // mínimo bloque Tradicional (cuando los 2 PE están llenos)
  capTRAD_max:45,      // máximo bloque Tradicional (cuando los 2 PE están vacíos)
  pautaXHoraSeg:2880, hsOn:15 };
// WTC Ascensores: 4 ciclos × 6 grupos = 24 Grupos Madre. Cada grupo es una
// partición FIJA de 15s Pauta + 10s PE (el PE no le cede espacio a la Pauta).
// 24×15=360s (6min) tradicional + 24×10=240s (4min) PE = 600s (10min) de pauta.
// Una sola pauta por bloque tradicional (los 15s no se comparten).
const PARAMS_WTC = { durProgSeg:900, pautaXProgSeg:600, progsXHora:4, bloquesXProg:24,
  gruposXCiclo:6, pePorGrupo:1, capacidadFija:true, unaPautaPorBloque:true,
  capBloque:25,        // 15s Pauta + 10s PE
  capPE:10,            // máximo del slot PE del grupo
  capTRAD_min:15, capTRAD_max:15,
  pautaXHoraSeg:2400, hsOn:11 };
// WTC Verticales: 4 ciclos × 4 grupos = 16 Grupos Madre, programación de 15 min.
// Cada grupo es Pauta (35s) + PE (10s) = 45s. El PE es dinámico: si el slot
// queda libre, esos 10s los absorbe la pauta del mismo grupo (35→45s).
// 16×35=560s tradicional + 16×10=160s PE = 720s de pauta por programación.
// Varias pautas pueden compartir un bloque, igual que en MAS BUS.
const PARAMS_WTCVERT = { durProgSeg:900, pautaXProgSeg:720, progsXHora:4, bloquesXProg:16,
  gruposXCiclo:4, pePorGrupo:1, capacidadFija:false, unaPautaPorBloque:false,
  capBloque:45,        // 35s Pauta + 10s PE
  capPE:10,            // máximo del slot PE del grupo
  capTRAD_min:35,      // con el PE ocupado
  capTRAD_max:45,      // con el PE vacío, la pauta absorbe esos 10s
  pautaXHoraSeg:2880, hsOn:11 };
// MAS BUS: 6 ciclos que alternan 5 y 6 bloques (5+6+5+6+5+6 = 33 Grupos Madre).
// Cada grupo es Pauta (50s) + PE (10s) = 60s. El PE es dinámico: si el slot
// contiguo queda libre, esos 10s los absorbe la pauta (50→60s).
// 33×50=1650s tradicional + 33×10=330s PE = 1980s de pauta por programación.
// Programación de 60 min → una sola por hora, así que "salidas contratadas por
// hora" es directamente la cantidad de bloques que ocupa la pauta.
const PARAMS_MASBUS = { durProgSeg:3600, pautaXProgSeg:1980, progsXHora:1, bloquesXProg:33,
  gruposPorCiclo:[5,6,5,6,5,6], gruposXCiclo:5, pePorGrupo:1, capacidadFija:false, unaPautaPorBloque:false,
  capBloque:60,        // 50s Pauta + 10s PE
  capPE:10,            // máximo del slot PE del grupo
  capTRAD_min:50,      // con el PE ocupado
  capTRAD_max:60,      // con el PE vacío, la pauta absorbe esos 10s
  pautaXHoraSeg:1980, hsOn:14 };
// espacioFijoSalHora → salidas/hora que tiene reservadas el cliente de espacio
// fijo (McDonald's) en ese soporte, según el contrato anual. Ese total NO cambia
// con la cantidad de spots: si el cliente manda 1 spot ocupa las salidas enteras,
// si manda 3 se las reparten. 0 = ese soporte no tiene espacio fijo vendido.
// CIRCUITO DEPORTIVO (horizontales): la programación dura 20 min y se repite 3
// veces por hora. Son 2 ciclos — el primero de 5 bloques (A–E) y el segundo de
// 6 (F–K) — o sea 11 Grupos Madre por programación.
// Cada grupo es Pauta (50s) + PE (10s). El PE es dinámico: si el slot queda
// libre, esos 10s los absorbe la pauta del mismo grupo (50→60s).
// 11×50=550s tradicional + 11×10=110s PE = 660s por programación.
// Por hora: 3×550=1650s tradicional + 3×110=330s PE — el mismo total que los
// soportes tipo MAS BUS, solo que cortado distinto.
const PARAMS_DEPORTIVO = { durProgSeg:1200, pautaXProgSeg:660, progsXHora:3, bloquesXProg:11,
  gruposPorCiclo:[5,6], gruposXCiclo:5, pePorGrupo:1, capacidadFija:false, unaPautaPorBloque:false,
  capBloque:60,        // 50s Pauta + 10s PE
  capPE:10,            // máximo del slot PE del grupo
  capTRAD_min:50,      // con el PE ocupado
  capTRAD_max:60,      // con el PE vacío, la pauta absorbe esos 10s
  pautaXHoraSeg:1980, hsOn:12 };
const NOMBRES_TIPO_DEPORTIVO = [
  'Nautico',
  'Aerobic',
  'Flex',
  'Remeros Estandar',
  'Defensor Sporting Estandar',
  'Juventud de las Piedras',
];
// Gran Formato deportivo: misma estructura de bloques que el circuito estándar
// (11 bloques de 60s = 550s de tradicional + 110s de PE, 2 ciclos de 5 y 6, 3
// programaciones por hora).
const NOMBRES_GRAN_FORMATO = [
  'Plaza 7 Gran Formato',
  'Sense Gran Formato Pocitos',
  'Sense Gran Formato Nuevo Centro',
];
const SOPORTES_GRAN_FORMATO = NOMBRES_GRAN_FORMATO.map(n => ({
  nombre:n, nombreCompleto:n, hoja:n, asanaGid:'', espacioFijoSalHora:0,
  ...PARAMS_DEPORTIVO,
  gruposPorCiclo:[...PARAMS_DEPORTIVO.gruposPorCiclo],
}));

const SOPORTES_TIPO_DEPORTIVO = NOMBRES_TIPO_DEPORTIVO.map(n => ({
  nombre:n, nombreCompleto:n, hoja:n, asanaGid:'', espacioFijoSalHora:0,
  ...PARAMS_DEPORTIVO,
  gruposPorCiclo:[...PARAMS_DEPORTIVO.gruposPorCiclo], // copia propia, no se comparte
}));

// Soportes con la MISMA estructura que MAS BUS: 33 Grupos Madre (Pauta 50s + PE
// 10s dinámico), una programación de 60 min por hora, 14 horas ON.
// Todavía sin espacio fijo vendido (espacioFijoSalHora:0). Si alguno pasa a
// tenerlo, alcanza con marcar la pauta como "espacio fijo" al cargarla: la app
// toma las salidas contratadas de esa misma pauta. Agregar otro soporte de este
// tipo = sumar el nombre a esta lista (tiene que coincidir EXACTO con el nombre
// de la pestaña en la Sheet y con PESTANAS en el Apps Script).
const NOMBRES_TIPO_MASBUS = [
  'Outdoor Remeros',
  'Defensor Sporting Gran Formato',
  'Vida Fit Gran Formato',
  'Sense Estandar',
];
const SOPORTES_TIPO_MASBUS = NOMBRES_TIPO_MASBUS.map(n => ({
  nombre:n, nombreCompleto:n, hoja:n, asanaGid:'', espacioFijoSalHora:0,
  ...PARAMS_MASBUS,
  gruposPorCiclo:[...PARAMS_MASBUS.gruposPorCiclo], // copia propia, no se comparte
}));
// ══════════════ CIRCUITOS ══════════════
// En OnSign el Bloque A es UNO SOLO publicado en todos los canales del
// circuito: no hay un "Bloque A de Flex" y otro de Náutico. Una pauta se carga
// una vez en el bloque y queda en todo el circuito; si el cliente compró solo
// algunos canales, el contenido va igual en el bloque general y se le pone una
// etiqueta de canal que impide que se reproduzca en los demás.
// Por eso: el BLOQUE es compartido, pero la CAPACIDAD se cuenta por canal.
// Una pauta de circuito ocupa su duración en los 6 canales; una etiquetada solo
// Flex ocupa solo en Flex. Para ubicarla, el bloque tiene que tener lugar en
// todos los canales donde esa pauta sale — en los otros no importa.
const CIRCUITOS = [
  { nombre:'Deportivo Estandar', etiqueta:'Circuito Deportivo Estándar',
    canales:['Nautico','Aerobic','Flex','Remeros Estandar','Defensor Sporting Estandar','Juventud de las Piedras'] },
];
function circuitoDeCanal(nombre){ return CIRCUITOS.find(c=>c.canales.indexOf(nombre)!==-1) || null; }
function getCircuito(nombre){ return CIRCUITOS.find(c=>c.nombre===nombre) || null; }
// Canal "virtual" que representa el circuito entero. No tiene pestaña en la
// Sheet ni órdenes propias: muestra todo lo que sale en cualquiera de sus
// canales, con la etiqueta de dónde se reproduce cada pauta.
const SOPORTES_CIRCUITO = CIRCUITOS.map(c => ({
  nombre:c.nombre, nombreCompleto:c.etiqueta, hoja:null, asanaGid:'',
  espacioFijoSalHora:0, esCircuito:true, canales:[...c.canales],
  ...PARAMS_DEPORTIVO,
  gruposPorCiclo:[...PARAMS_DEPORTIVO.gruposPorCiclo],
}));

const SOPORTES = [
  { nombre:'Facal',        nombreCompleto:'Outdoor Facal',        hoja:'Facal',        asanaGid:'1207433461701747', espacioFijoSalHora:16, ...PARAMS_OUTDOOR },
  { nombre:'Ramon Anador', nombreCompleto:'Outdoor Ramón Anador', hoja:'Ramon Anador', asanaGid:'1207433461701746', espacioFijoSalHora:16, ...PARAMS_OUTDOOR },
  { nombre:'Reinaldo',     nombreCompleto:'Outdoor Reinaldo',     hoja:'Reinaldo',     asanaGid:'1207433461701749', espacioFijoSalHora:0,  ...PARAMS_OUTDOOR },
  { nombre:'WTC Ascensores', nombreCompleto:'WTC Ascensores',     hoja:'WTC Ascensores', asanaGid:'', espacioFijoSalHora:10, ...PARAMS_WTC },
  // Misma estructura exacta que el de Montevideo: 4 ciclos de 6 Grupos Madre,
  // 24 bloques de 15s de Pauta + 10s de PE, 4 programaciones por hora.
  { nombre:'WTC Ascensores Punta del Este', nombreCompleto:'WTC Ascensores Punta del Este', hoja:'WTC Ascensores Punta del Este', asanaGid:'', espacioFijoSalHora:10, ...PARAMS_WTC },
  { nombre:'WTC Verticales', nombreCompleto:'WTC Verticales',     hoja:'WTC Verticales', asanaGid:'', espacioFijoSalHora:10, ...PARAMS_WTCVERT },
  { nombre:'MAS BUS',      nombreCompleto:'MAS BUS',              hoja:'MAS BUS',      asanaGid:'', espacioFijoSalHora:4,  ...PARAMS_MASBUS },
  ...SOPORTES_CIRCUITO,
  ...SOPORTES_TIPO_DEPORTIVO,
  ...SOPORTES_GRAN_FORMATO,
  ...SOPORTES_TIPO_MASBUS,
];
// Soportes reales (los que tienen pestaña en la Sheet). Los circuitos son una
// vista, no un soporte: no se cuentan ni se les carga nada directamente.
const SOPORTES_REALES = SOPORTES.filter(s=>!s.esCircuito);
// Salidas/hora que tiene reservadas el espacio fijo en un soporte.
// La fuente de verdad es la columna "Salidas contratadas" de las propias pautas
// de espacio fijo (todas guardan el mismo total del contrato), así se puede
// editar desde la app y queda en la Sheet sin tocar el Apps Script. El valor de
// SOPORTES es solo el default para cuando todavía no hay ninguna cargada.
function salidasEspacioFijo(sup, fijas){
  if(fijas && fijas.length){
    const m=Math.max(...fijas.map(o=>Number(o.sal)||0));
    if(m>0) return m;
  }
  return sup.espacioFijoSalHora||0;
}
// Cuántos bloques hay que reservarle: las salidas contratadas divididas por las
// programaciones que entran en una hora.
function bloquesEspacioFijo(sup, fijas){
  const sal=salidasEspacioFijo(sup, fijas);
  if(!sal) return 0;
  return Math.ceil(sal / sup.progsXHora);
}
// Cambia las salidas contratadas del espacio fijo de un soporte. Se escribe en
// todas las pautas fijas de ese soporte para que el número viva en la Sheet.
function setSalidasEspacioFijo(soporte, valor){
  const v=Math.max(0, Math.round(Number(valor)||0));
  if(!v) return;
  const fijas=ordenes.filter(o=>o.soporte===soporte && o.espacioFijo);
  if(!fijas.length) return;
  fijas.forEach(o=>{
    if(o.sal!==v){
      o.sal=v;
      delete bloquesPersistentes[lineId(o)];
      o.bloques=[];
      marcarSync(o.grupoId);
    }
  });
  guardarLocal(); invalidarCache(); renderActiva();
  openEspacioFijoDetail(soporte);
}
// Cambia la duración de TODOS los spots del espacio fijo de un soporte. Solo se
// ofrece desde la fila consolidada cuando los spots comparten una misma
// duración; si difieren, se edita uno por uno en openEspacioFijoDetail().
function setDuracionEspacioFijo(soporte, valor){
  const v=Math.max(0, Math.round(Number(valor)||0));
  if(!v) return;
  const fijas=ordenes.filter(o=>o.soporte===soporte && o.espacioFijo);
  if(!fijas.length) return;
  fijas.forEach(o=>{
    if(o.dur!==v){
      o.dur=v;
      delete bloquesPersistentes[lineId(o)];
      delete bloquesPEPersistentes[lineId(o)];
      o.bloques=[];
      marcarSync(o.grupoId);
    }
  });
  guardarLocal(); invalidarCache(); renderActiva();
}
// Elimina el espacio fijo entero de un soporte (todos sus spots de una vez).
// Se pide una sola confirmación en vez de una por campaña, y solo se borran las
// líneas DE ESE soporte: si el mismo cliente tiene espacio fijo en otro, queda.
function deleteEspacioFijo(soporte){
  const fijas=ordenes.filter(o=>o.soporte===soporte && o.espacioFijo);
  if(!fijas.length) return;
  const nombre=nombreMasComun(fijas);
  const detalle=fijas.map(o=>'  · '+(o.camp||o.anun)).join('\n');
  if(!confirm(`¿Eliminar el espacio fijo de ${nombre} en ${soporte}?\n\nSe quitan ${fijas.length} campaña${fijas.length===1?'':'s'} y se liberan sus bloques:\n${detalle}`)) return;
  fijas.forEach(o=>{
    delete bloquesPersistentes[lineId(o)];
    delete bloquesPEPersistentes[lineId(o)];
    marcarEliminado(o.grupoId, o.soporte);
  });
  ordenes=ordenes.filter(o=>!(o.soporte===soporte && o.espacioFijo));
  guardarLocal(); invalidarCache(); renderActiva();
}
function getSoporte(n){ return SOPORTES.find(s=>s.nombre===n) || SOPORTES[0]; }
// Etiqueta de un bloque a partir de su índice: A, B … Z, AA, AB … Con 26 letras
// no alcanza para soportes grandes (MAS BUS tiene 33 bloques), por eso sigue
// como las columnas de una planilla en vez de cortarse en la Z.
function etiquetaBloque(j){
  let s='', n=j;
  while(n>=0){ s=String.fromCharCode(65+(n%26))+s; n=Math.floor(n/26)-1; }
  return s;
}
// Inversa de etiquetaBloque: "A"→0, "Z"→25, "AA"→26, "AG"→32.
function indiceBloque(cod){
  const s=String(cod||'').trim().toUpperCase();
  if(!/^[A-Z]+$/.test(s)) return -1;
  let n=0;
  for(let i=0;i<s.length;i++) n=n*26+(s.charCodeAt(i)-64);
  return n-1;
}
// Tamaño de cada ciclo. La mayoría de los soportes tiene ciclos iguales
// (gruposXCiclo), pero MAS BUS alterna 5 y 6 bloques, así que también se
// admite una lista explícita en gruposPorCiclo.
function ciclosDeSoporte(sup){
  if(Array.isArray(sup.gruposPorCiclo) && sup.gruposPorCiclo.length) return sup.gruposPorCiclo;
  const n=Math.max(1,Math.floor(sup.bloquesXProg/sup.gruposXCiclo));
  return Array.from({length:n},()=>sup.gruposXCiclo);
}
// Índice del primer bloque de cada ciclo: [0, 5, 11, 16, 22, 27] en MAS BUS.
function iniciosDeCiclo(sup){
  const res=[]; let acc=0;
  ciclosDeSoporte(sup).forEach(t=>{ res.push(acc); acc+=t; });
  return res;
}
// A qué ciclo pertenece el bloque j y en qué posición dentro de ese ciclo.
function cicloDeBloque(sup,j){
  const tam=ciclosDeSoporte(sup); let acc=0;
  for(let c=0;c<tam.length;c++){
    if(j<acc+tam[c]) return { ciclo:c+1, pos:j-acc+1, inicio:acc, fin:acc+tam[c]-1 };
    acc+=tam[c];
  }
  return { ciclo:tam.length, pos:1, inicio:0, fin:Math.max(0,sup.bloquesXProg-1) };
}
// Slot PE ↔ código de texto ("A1","A2","B1"...) — se guarda en la misma columna
// "Bloques asignados" que las pautas tradicionales (que usan solo la letra),
// diferenciado por o.tipo al leer/escribir. El índice de slot depende de
// cuántos PE tiene cada grupo en ese soporte (pePorGrupo).
function slotPEaCodigo(s,pePorGrupo){ return etiquetaBloque(Math.floor(s/pePorGrupo)) + (s%pePorGrupo + 1); }
function codigoASlotPE(cod,pePorGrupo){ const m=String(cod||'').trim().toUpperCase().match(/^([A-Z]+)(\d+)$/); if(!m) return -1; const g=indiceBloque(m[1]); const sub=Number(m[2])-1; if(g<0||sub<0||sub>=pePorGrupo) return -1; return g*pePorGrupo+sub; }
// Un espacio fijo (ej. McDonald's) SIEMPRE hace las salidas/hora que tiene
// contratadas en ese soporte (sup.espacioFijoSalHora), sin importar cuántas
// campañas activas lo estén compartiendo. Nunca se suma el "sal" de cada
// campaña — ese valor es solo referencia interna.
// Hoy la arquitectura solo soporta UN espacio fijo por soporte (siempre los
// mismos 4 bloques ideales A/E/I/M), así que todas las líneas espacioFijo de
// un soporte son el mismo espacio aunque el anunciante esté tipeado distinto
// (ej. "McDonald's" vs "Mc Donalds"). Para la fila y el título mostramos el
// nombre que más se repite dentro del grupo, no el de la primera línea.
function nombreMasComun(lineas){
  const counts={};
  lineas.forEach(l=>{ counts[l.anun]=(counts[l.anun]||0)+1; });
  let mejor=lineas[0].anun, max=0;
  for(const nombre in counts){ if(counts[nombre]>max){ max=counts[nombre]; mejor=nombre; } }
  return mejor;
}

const SCRIPT_URL = ''; // vaciado al copiar: el motor no escribe

// Datos reales de la sección Pauta Activada (Asana) — 16 órdenes vigentes hoy.
const DATOS_ASANA = []; // vaciado al copiar

// ══════════════ ESTADO ══════════════
// Cada "línea" = una pauta en un soporte. Las líneas con el mismo grupoId son la misma orden.
let ordenes = [];
let clientesPrioritarios = [];
let bloquesPersistentes = {};   // keyed por lineId — bloques Tradicionales
let bloquesPEPersistentes = {}; // keyed por lineId — slots PE ya asignados; no destructiva
let bloquesPE = {};              // keyed por soporte → array de (bloquesXProg × pePorGrupo) slots
                                 // slot 0=PE_A1, 1=PE_A2, 2=PE_B1... (o A1,B1,C1... si pePorGrupo=1)
function totalSlotsPE(sup){ return sup.bloquesXProg * sup.pePorGrupo; }
function slotsPEdeSoporte(sopNombre){
  const sup=getSoporte(sopNombre);
  return bloquesPE[sopNombre] || new Array(totalSlotsPE(sup)).fill(null);
}
// Capacidad real del bloque Tradicional j.
// - capacidadFija (WTC): siempre los mismos seg, el PE no le cede nada.
// - dinámica (outdoor): 45s menos lo que ocupen sus slots PE (entre 21 y 45).
function capTradReal(j, sopNombre){
  const sup=getSoporte(sopNombre);
  if(sup.capacidadFija) return sup.capTRAD_max;
  const peSlots=slotsPEdeSoporte(sopNombre);
  let usadoPE=0;
  for(let k=0;k<sup.pePorGrupo;k++){
    const slot=peSlots[j*sup.pePorGrupo+k];
    if(slot) usadoPE+=Math.min(slot.dur||0, sup.capPE);
  }
  return sup.capBloque - usadoPE;
}
// Elige n slots PE lo más separados posible entre sí, en vez de amontonarlos en
// los primeros bloques: reparte n posiciones ideales de forma pareja sobre el
// total de slots (con 4 salidas y 4 ciclos → una por ciclo) y para cada una
// toma el slot libre más cercano. Así la pauta programática queda distribuida
// a lo largo de toda la programación, respetando siempre qué slots hay libres.
function slotsPEEspaciados(n, ocupados, totalSlots){
  const elegidos=[];
  for(let k=0;k<n;k++){
    const ideal=Math.round(k*totalSlots/n) % totalSlots;
    let mejor=-1, mejorDist=Infinity;
    for(let s=0;s<totalSlots;s++){
      if(ocupados[s] || elegidos.indexOf(s)!==-1) continue;
      const d=Math.min(Math.abs(s-ideal), totalSlots-Math.abs(s-ideal));
      if(d<mejorDist){ mejorDist=d; mejor=s; }
    }
    if(mejor<0) break; // no quedan slots PE libres
    elegidos.push(mejor);
  }
  return elegidos.sort((a,b)=>a-b);
}
// Segundos de PE ocupados en el grupo j, uno por cada slot PE del grupo.
function segPEenGrupo(j, sopNombre){
  const sup=getSoporte(sopNombre);
  const peSlots=slotsPEdeSoporte(sopNombre);
  const res=[];
  for(let k=0;k<sup.pePorGrupo;k++){
    const slot=peSlots[j*sup.pePorGrupo+k];
    res.push(slot ? Math.min(slot.dur||0, sup.capPE) : 0);
  }
  return res;
}
let vistaActual = 'ordenes';
let soporteSeleccionado = SOPORTES_REALES[0].nombre;
let editandoGrupo = null;
let finOpen = { ord:false, sop:false };

function lineId(o){ return o.grupoId + '__' + o.soporte; }
function nuevoGrupoId(){ return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
// Escapa texto que viene de la Sheet/formulario (anunciante, campaña, id,
// grupoId...) antes de insertarlo en innerHTML o en atributos onclick — sin
// esto, una orden con un nombre malicioso (cargada directo vía el Apps
// Script, sin pasar por el formulario) podría inyectar HTML/JS en la app
// de cualquiera que la vea.
const _escapeMap={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>_escapeMap[c]); }
// Repuebla bloquesPersistentes/bloquesPEPersistentes a partir de o.bloques
// (lo que vino de la columna "Bloques asignados" de la Sheet) para que la
// asignación los respete y no los recalcule. Tradicional guarda letras
// ("A"), PE guarda letra+sub-slot ("A1","A2") — se distingue por o.tipo.
// bloquesPE (la grilla de display) sigue recalculándose siempre fresca a
// partir de bloquesPEPersistentes.
function seedBloquesDesdeOrdenes(){
  bloquesPersistentes={};
  bloquesPEPersistentes={};
  ordenes.forEach(o=>{
    if(!Array.isArray(o.bloques) || !o.bloques.length) return;
    const sup=getSoporte(o.soporte);
    if(o.tipo==='PLACE EXCHANGE'){
      const idx=o.bloques.map(cod=>codigoASlotPE(cod,sup.pePorGrupo)).filter(i=>i>=0 && i<totalSlotsPE(sup));
      if(idx.length) bloquesPEPersistentes[lineId(o)]=idx;
    } else {
      const idx=o.bloques.map(l=>indiceBloque(l)).filter(i=>i>=0 && i<sup.bloquesXProg);
      if(idx.length) bloquesPersistentes[lineId(o)]=idx;
    }
  });
  bloquesPE={};
}

// ══════════════ PERSISTENCIA ══════════════
// localStorage = caché instantánea / respaldo offline de esta computadora.
// La Sheet ("Trafico de pautas Reimpulso") es la fuente de verdad compartida:
// cargarDesdeSheet() la lee al abrir la app, marcarSync()/marcarEliminado()
// empujan ahí cada cambio PUNTUAL (no la lista completa — ver más abajo).
// Si la nube no responde, la app sigue funcionando con la última copia
// local — nunca se rompe por falta de conexión.
function mostrarEstado(msg,tipo){
  const el=document.getElementById('syncStatus');
  const est={ok:'background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0',error:'background:#fee2e2;color:#dc2626;border:1px solid #fca5a5',loading:'background:#f0f4ff;color:#4f46e5;border:1px solid #c7c3ff'};
  el.style.cssText=`position:fixed;bottom:16px;left:20px;font-size:11px;font-weight:500;padding:5px 13px;border-radius:20px;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,.1);opacity:1;${est[tipo]}`;
  el.textContent=msg;
  if(tipo!=='loading') setTimeout(()=>{el.style.opacity='0';},2600);
}
function guardarLocal(){
  try { localStorage.setItem('tdp_ordenes_v1', JSON.stringify(ordenes)); } catch(_){}
  try { localStorage.setItem('tdp_prio_v1', JSON.stringify(clientesPrioritarios)); } catch(_){}
  try { localStorage.setItem('tdp_bloques_v1', JSON.stringify(bloquesPersistentes)); } catch(_){}
  try { localStorage.setItem('tdp_bloquesPE_v1', JSON.stringify(bloquesPE)); } catch(_){}
}
function cargarLocal(){
  try { const o=localStorage.getItem('tdp_ordenes_v1'); if(o) ordenes=JSON.parse(o); } catch(_){}
  try { const p=localStorage.getItem('tdp_prio_v1'); if(p) clientesPrioritarios=JSON.parse(p); } catch(_){}
  try { const b=localStorage.getItem('tdp_bloques_v1'); if(b) bloquesPersistentes=JSON.parse(b); } catch(_){}
  try { const pe=localStorage.getItem('tdp_bloquesPE_v1'); if(pe) bloquesPE=JSON.parse(pe); } catch(_){}
}
// Trae todas las órdenes de las 3 pestañas de la Sheet vía JSONP (sin CORS).
// Devuelve null si la nube no respondió a tiempo o falló — nunca lanza error.
function cargarDesdeSheet(){
  return new Promise((resolve)=>{
    const cb='cb_'+Date.now()+Math.random().toString(36).slice(2,6);
    const sc=document.createElement('script');
    let resuelto=false;
    const terminar=(valor)=>{ if(resuelto) return; resuelto=true; clearTimeout(timer); delete window[cb]; if(sc.parentNode) sc.parentNode.removeChild(sc); resolve(valor); };
    // 25s: con la Sheet ya en cientos de órdenes la lectura tarda ~8s y con 8
    // de límite fallaba de a ratos. Cuando falla la app sigue con la copia
    // local, que es justo lo peligroso: se trabaja sobre datos viejos sin
    // enterarse. Mejor esperar de más que arrancar desactualizado.
    const timer=setTimeout(()=>terminar(null),25000);
    window[cb]=function(data){ terminar(data && data.ok && Array.isArray(data.ordenes) ? data.ordenes : null); };
    sc.onerror=()=>terminar(null);
    sc.src=`${SCRIPT_URL}?accion=listar&callback=${cb}`;
    document.body.appendChild(sc);
  });
}
// ── Sincronización POR FILA ──────────────────────────────────────────
// En vez de reescribir toda la Sheet en cada guardado, cada mutación avisa
// puntualmente qué grupoId cambió (marcarSync) o qué línea grupoId+soporte
// se borró (marcarEliminado). El Apps Script mezcla eso contra la versión
// más reciente de la Sheet — así dos personas guardando casi al mismo
// tiempo pero tocando órdenes distintas no se pisan entre sí.
let _pendGrupos=new Set(), _pendEliminar=[], _syncTimer=null;
function marcarSync(grupoId){ _pendGrupos.add(grupoId); programarFlush(); }
function marcarEliminado(grupoId,soporte){ _pendEliminar.push({grupoId,soporte}); programarFlush(); }
function programarFlush(){ clearTimeout(_syncTimer); _syncTimer=setTimeout(flushSincronizacion,700); }
function flushSincronizacion(){
  const grupos=[..._pendGrupos]; _pendGrupos.clear();
  const eliminar=_pendEliminar; _pendEliminar=[];
  const upsert=ordenes.filter(o=>grupos.includes(o.grupoId));
  if(upsert.length===0 && eliminar.length===0) return;
  mostrarEstado('Guardando en la nube…','loading');
  fetch(SCRIPT_URL,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'}, // evita el preflight CORS que Apps Script no maneja
    body:JSON.stringify({accion:'sincronizarOrden',upsert,eliminar})
  })
    .then(r=>r.json())
    .then(data=>{ if(data && data.ok) mostrarEstado('✓ Guardado en la nube','ok'); else { const det=(data&&data.error)?String(data.error).replace(/^Error:\s*/,''):'Error al guardar en la nube'; mostrarEstado('⚠ '+det,'error'); console.error('[Tráfico] Error al guardar:',det); } })
    .catch(()=>{ mostrarEstado('⚠ Sin conexión — se guardó solo en este navegador','error'); });
}
// Avisa por mail cuando un soporte se pasa del espacio disponible.
// Acá solo se dispara el aviso: quién lo recibe, cada cuánto y si está
// prendido se define en el Apps Script (EMAIL_ALERTAS / HORAS_ENTRE_ALERTAS).
// El Set evita repetir el pedido dentro de la misma sesión del navegador.
let _alertasEnviadas=new Set();
function avisarExcesoCapacidad(nombre, balance){
  if(!balance || !balance.excedido) return;
  if(_alertasEnviadas.has(nombre)) return;
  _alertasEnviadas.add(nombre);
  fetch(SCRIPT_URL,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({accion:'alertaCapacidad',soporte:nombre,balance})
  })
    .then(r=>r.json())
    .then(d=>{ if(d&&d.enviado) console.log('[Tráfico] Aviso de exceso enviado por mail:',nombre); })
    .catch(()=>{ _alertasEnviadas.delete(nombre); }); // si falló, que pueda reintentar
}
// Avisa por mail que una pauta arrancó en bloques distintos a los reservados.
// El Set evita repetir el aviso si se re-renderiza en la misma sesión; el
// Apps Script además deduplica del lado del servidor.
const _cambiosAvisados=new Set();
function avisarCambioBloques(o, reservados, finales){
  const clave=lineId(o);
  if(_cambiosAvisados.has(clave)) return;
  _cambiosAvisados.add(clave);
  fetch(SCRIPT_URL,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({accion:'avisoCambioBloques', cambio:{
      soporte:o.soporte, grupoId:o.grupoId, anun:o.anun, camp:o.camp||'', id:o.id||'',
      fi:o.fi||'', dur:o.dur||0, sal:o.sal||0,
      reservados:reservados, finales:finales }})
  })
    .then(r=>r.json())
    .then(d=>{ if(d&&d.enviado) console.log('[Tráfico] Aviso de cambio de bloques enviado:',o.anun); })
    .catch(()=>{ _cambiosAvisados.delete(clave); });
}
// Trae la última versión de la Sheet y la aplica — para ver cambios de
// otra persona sin recargar la página. No vuelve a empujar a la nube lo
// que la nube misma acaba de mandar (evitaría un ida-y-vuelta inútil).
async function actualizarDesdeNube(){
  mostrarEstado('Actualizando desde la nube…','loading');
  const datosNube=await cargarDesdeSheet();
  if(datosNube===null){ mostrarEstado('⚠ No se pudo conectar a la nube','error'); return; }
  ordenes=datosNube;
  seedBloquesDesdeOrdenes();
  guardarLocal();
  invalidarCache(); renderActiva();
  mostrarEstado('✓ Datos actualizados desde la nube','ok');
}

// ══════════════ FECHAS ══════════════
function hoy(){ const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function parseFecha(s){ if(!s) return null; const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function diasRestantes(ff){ const f=parseFecha(ff); if(!f) return null; return Math.round((f-hoy())/86400000); }
// Días que faltan para que la pauta empiece (negativo = ya empezó).
function diasParaEmpezar(fi){ const f=parseFecha(fi); if(!f) return null; return Math.round((f-hoy())/86400000); }
// ¿Ya salió al aire? Sin fecha de inicio se asume que sí.
function yaComenzo(o){ const d=diasParaEmpezar(o.fi); return d===null || d<=0; }
// ¿Todavía no venció?
function noVencida(o){ if(!o.ff || o.ff==='') return true; const d=diasRestantes(o.ff); return d===null || d>=0; }
// VIGENTE = está al aire HOY: ya empezó y todavía no venció. Es la única que
// ocupa bloques y cuenta para la capacidad. Antes solo se miraba la fecha de
// fin, así que una pauta cargada hoy para empezar el mes que viene ya se comía
// el espacio desde el día de la carga.
function estaVigente(o){ return yaComenzo(o) && noVencida(o); }
// PROGRAMADA = cargada pero todavía no empezó. Se ve en la app, no ocupa nada.
function estaProgramada(o){ return !yaComenzo(o) && noVencida(o); }
function estaFinalizada(o){ return !noVencida(o); }
// ¿Estaría al aire en una fecha cualquiera? (versión de estaVigente que no
// asume "hoy" — se usa para simular cómo va a estar el soporte más adelante.)
function vigenteEn(o, f){
  const fi=parseFecha(o.fi), ff=parseFecha(o.ff);
  if(fi && fi.getTime()>f.getTime()) return false;
  if(ff && ff.getTime()<f.getTime()) return false;
  return true;
}
// ── BLOQUES PREVISTOS DE UNA PAUTA PROGRAMADA ───────────────────────
// La persona de tráfico necesita saber en qué bloque va a caer una pauta que
// arranca más adelante, para dejarla ya cargada en el CMS. Pero mirar la grilla
// de HOY daría un bloque equivocado: entre hoy y el día de arranque se vencen
// otras pautas y liberan lugar.
// Por eso se simula el soporte EN LA FECHA DE ARRANQUE — con las pautas que van
// a seguir vivas ese día — y de ahí sale el bloque.
// Es una simulación pura: no toca la grilla de hoy, no guarda nada en la Sheet
// y no cuenta para la capacidad. Por eso se trabaja sobre copias de las órdenes
// y se restaura lo persistido al terminar.
let _cachePrevisto={};
function preverBloques(nombreSoporte, fechaISO){
  const clave=nombreSoporte+'|'+fechaISO;
  if(_cachePrevisto[clave]) return _cachePrevisto[clave];
  const sup=getSoporte(nombreSoporte);
  const f=parseFecha(fechaISO);
  if(!f) return (_cachePrevisto[clave]={});
  // En un circuito se simula por CAMPAÑA (con su etiqueta de canales), igual
  // que en el cálculo normal: el bloque es compartido.
  let clones;
  if(sup.esCircuito){
    const m=new Map();
    sup.canales.forEach(cn=>{
      ordenes.filter(o=>String(o.soporte).trim()===cn && o.tipo!=='PLACE EXCHANGE' && vigenteEn(o,f)).forEach(o=>{
        let L=m.get(o.grupoId);
        if(!L){ L={...o, soporte:sup.nombre, canales:[], bloques:[...(o.bloques||[])]}; m.set(o.grupoId,L); }
        L.canales.push(cn);
        if((Number(o.dur)||0)>(Number(L.dur)||0)) L.dur=o.dur;
        if((Number(o.sal)||0)>(Number(L.sal)||0)) L.sal=o.sal;
      });
    });
    clones=[...m.values()];
  } else {
    clones=ordenes.filter(o=>String(o.soporte).trim()===String(nombreSoporte).trim()
                          && o.tipo!=='PLACE EXCHANGE' && vigenteEn(o,f))
                  .map(o=>({...o, bloques:[...(o.bloques||[])]}));
  }
  const snapPers=JSON.stringify(bloquesPersistentes);
  const snapPE=JSON.stringify(bloquesPEPersistentes);
  let res={};
  try{
    const aj=calcSalidasAjustadas(clones,sup);
    res=asignarBloques(clones,aj,sup,nombreSoporte).resultado;
  }catch(e){
    console.error('[Tráfico] No se pudo prever bloques de '+nombreSoporte,e); res={};
  }finally{
    bloquesPersistentes=JSON.parse(snapPers);
    bloquesPEPersistentes=JSON.parse(snapPE);
  }
  return (_cachePrevisto[clave]=res);
}
// Etiqueta "faltan N días para que arranque"
function badgeInicio(fi){
  const d=diasParaEmpezar(fi);
  if(d===null || d<=0) return '';
  return `<span class="dias-badge prog" title="Empieza el ${fmtDate(fi)}">en ${d}d</span>`;
}
function fmtDate(s){ if(!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—'; const [y,m,d]=s.split('-'); return `${d}/${m}/${y.slice(2)}`; }
function fmt2(n){ return (n.toFixed(3).replace(/\.?0+$/,''))||'0'; }
function badgeDias(ff){ const d=diasRestantes(ff); if(d===null) return ''; if(d<=0) return `<span class="dias-badge hoy">${d===0?'Hoy':'Vencida'}</span>`; if(d<=3) return `<span class="dias-badge urgente">${d}d</span>`; if(d<=7) return `<span class="dias-badge pronto">${d}d</span>`; return `<span class="dias-badge ok">${d}d</span>`; }

// ══════════════ CÁLCULO BASE ══════════════
function calcOrden(o,sup){
  const sal=o.sal||0, dur=o.dur||0;
  const vecesExactas=sal/sup.progsXHora;
  const dec=vecesExactas-Math.floor(vecesExactas);
  const vecesPub=dec===0?Math.floor(vecesExactas):Math.ceil(vecesExactas);
  const salidaReal=vecesPub*sup.progsXHora;
  const segReales=salidaReal*dur;
  return { vecesExactas, vecesPub, salidaReal, segReales, diff:salidaReal-sal };
}

// ══════════════ AJUSTE A 720 SEG ══════════════
// Los clientes de Espacio Fijo (ej. McDonald's) tienen su cantidad de salidas
// pactada de antemano (ej. 16/hora): nunca se les quita por exceso de 720 seg
// — su salida real ajustada siempre es la salida contratada, sin excepción.
// ══════════════ PLUS (reparto del espacio ocioso) ══════════════
// Cuando un soporte no llega a llenar su espacio de pauta tradicional, lo que
// sobra se reparte como salidas EXTRA entre los clientes activos. Las salidas
// contratadas nunca se tocan: el Plus se suma arriba.
// La proporción depende de cuánto espacio ocioso haya POR HORA:
//   hasta 3 min (≤180s) → 100% Top
//   de 3 a 5 min        → 20% Estándar · 50% Nuevo · 30% Top
//   de 5 en adelante    → 33% Estándar · 33% Nuevo · 34% Top
// El espacio fijo y la programática quedan afuera: el fijo tiene su contrato
// cerrado y los slots PE los vende Place Exchange aparte.
const PLUS_BANDAS = [
  { hastaSeg:180,      ESTANDAR:0,    NUEVO:0,    TOP:1    },
  { hastaSeg:300,      ESTANDAR:0.20, NUEVO:0.50, TOP:0.30 },
  { hastaSeg:Infinity, ESTANDAR:0.33, NUEVO:0.33, TOP:0.34 },
];
function bandaPlus(libreHoraSeg){
  return PLUS_BANDAS.find(b=>libreHoraSeg<=b.hastaSeg) || PLUS_BANDAS[PLUS_BANDAS.length-1];
}
// Reparto efectivo según qué tipos de cliente hay activos en el soporte.
// Si falta un tipo y el Top está presente, el Top absorbe su porción.
// Si no hay Top, se reparte mitad y mitad entre Estándar y Nuevo.
// Si queda un solo tipo, se lleva todo.
function repartoPlus(banda, hay){
  const r={ESTANDAR:0,NUEVO:0,TOP:0};
  const presentes=['ESTANDAR','NUEVO','TOP'].filter(t=>hay[t]);
  if(!presentes.length) return r;
  if(presentes.length===1){ r[presentes[0]]=1; return r; }
  if(hay.TOP){
    let absorbe=0;
    ['ESTANDAR','NUEVO'].forEach(t=>{ if(hay[t]) r[t]=banda[t]; else absorbe+=banda[t]; });
    r.TOP=banda.TOP+absorbe;
  } else {
    r.ESTANDAR=0.5; r.NUEVO=0.5;
  }
  return r;
}
// Reparte el espacio ocioso en BLOQUES enteros (un bloque más = progsXHora
// salidas más, y cuesta la duración del spot). Devuelve los segundos que
// quedaron sin repartir — 0 cuando la programación quedó completa.
function aplicarPlus(res, sup, totalProg){
  const nombre=sup.nombre, N=sup.bloquesXProg;
  // Capacidad tradicional REAL de la programación: la de cada bloque ya con lo
  // que le saca la programática de su grupo.
  let capProg=0;
  for(let j=0;j<N;j++) capProg+=capTradReal(j,nombre);
  let restante=capProg-totalProg;
  if(restante<=0) return 0;

  const cand=res.filter(r=>!r.espacioFijo && r.tipo!=='PLACE EXCHANGE' && (Number(r.dur)||0)>0);
  if(!cand.length) return restante;

  const hay={ESTANDAR:false,NUEVO:false,TOP:false};
  cand.forEach(r=>{ hay[r.tipoCliente||'ESTANDAR']=true; });
  const banda=bandaPlus(restante*sup.progsXHora);  // las bandas se miden por HORA
  const pct=repartoPlus(banda,hay);

  // Segundos que le tocan a cada orden: su tipo se lleva pct del ocioso y,
  // dentro del tipo, se reparte proporcional a lo que cada uno contrató.
  const ideal=new Map(), libre=restante;
  ['ESTANDAR','NUEVO','TOP'].forEach(t=>{
    const delTipo=cand.filter(r=>(r.tipoCliente||'ESTANDAR')===t);
    if(!delTipo.length) return;
    if(!pct[t]){ delTipo.forEach(r=>ideal.set(r,0)); return; }
    const segTipo=libre*pct[t];
    const totalSal=delTipo.reduce((a,r)=>a+(Number(r.sal)||0),0);
    delTipo.forEach(r=>{
      const parte = totalSal>0 ? (Number(r.sal)||0)/totalSal : 1/delTipo.length;
      ideal.set(r, segTipo*parte);
    });
  });

  // Tope mecánico: una orden no puede ocupar más bloques de los que existen,
  // porque cada salida extra necesita un bloque distinto.
  const extra=new Map(), tope=new Map();
  cand.forEach(r=>{
    extra.set(r,0);
    tope.set(r, Math.max(0, N-Math.ceil(r.salidaRealAjustada/sup.progsXHora)));
  });
  const cabe=(r)=>extra.get(r)<tope.get(r) && r.dur<=restante;
  const dar=(r)=>{ extra.set(r,extra.get(r)+1); restante-=r.dur; };

  // Primero, los bloques enteros que entran en la porción ideal de cada uno…
  cand.forEach(r=>{
    const n=Math.floor((ideal.get(r)||0)/r.dur);
    for(let k=0;k<n && cabe(r);k++) dar(r);
  });
  // …y el sobrante se le va dando de a un bloque al que quedó MÁS LEJOS de su
  // porción ideal, hasta que no entre ninguno más. Así no queda espacio ocioso.
  for(;;){
    let mejor=null, mayorFalta=0;
    cand.forEach(r=>{
      if(!cabe(r)) return;
      const falta=(ideal.get(r)||0)-extra.get(r)*r.dur;
      if(mejor===null || falta>mayorFalta){ mejor=r; mayorFalta=falta; }
    });
    if(!mejor) break;
    dar(mejor);
  }

  cand.forEach(r=>{
    const n=extra.get(r);
    if(!n) return;
    r.plusBloques=n;
    r.plusSalidas=n*sup.progsXHora;
    r.salidaRealAjustada+=r.plusSalidas;
    r.segAjustados=r.salidaRealAjustada*r.dur;
  });
  return restante;
}

function calcSalidasAjustadas(lineas,sup){
  const fijas=lineas.filter(o=>o.espacioFijo).sort((a,b)=>String(a.grupoId).localeCompare(String(b.grupoId)));
  const nFijos=bloquesEspacioFijo(sup,fijas);
  let res=lineas.map(o=>{
    const c=calcOrden(o,sup);
    if(o.espacioFijo && nFijos>0){
      // El espacio fijo es UNA campaña madre: los spots rotan dentro de los
      // mismos bloques, así que el espacio se cuenta una sola vez. Se reparte
      // en partes iguales entre los spots para que la SUMA dé exactamente el
      // espacio reservado (y no el total multiplicado por cantidad de spots).
      const durMax=Math.max(...fijas.map(f=>Number(f.dur)||0));
      const parte=1/fijas.length;
      return {...o, salidaRealAjustada:nFijos*sup.progsXHora*parte, segAjustados:nFijos*durMax*parte, ajuste:0};
    }
    return {...o, salidaRealAjustada:c.salidaReal, segAjustados:c.segReales, ajuste:0};
  });
  // NO se recorta a nadie por exceso. Un soporte sobrevendido "no se toca":
  // el excedente se arregla dando de baja órdenes, no bajándole las salidas a
  // los clientes por cuenta propia. Antes el recorte dejaba órdenes en 0
  // salidas reales mientras la grilla les seguía mostrando sus 4 bloques y sus
  // 160 seg — números que se contradecían entre sí.
  const totalProg=res.reduce((s,r)=>s+(r.salidaRealAjustada*r.dur/sup.progsXHora),0);
  // Con el espacio ya ajustado hacia abajo, si todavía sobra lugar se reparte
  // como Plus para que la programación quede completa.
  res.forEach(r=>{ r.plusBloques=0; r.plusSalidas=0; });
  aplicarPlus(res, sup, totalProg);
  return res;
}

// ══════════════ ASIGNACIÓN DE BLOQUES (no destructiva, por soporte) ══════════════
// `reservado` = segundos que cada bloque tiene COMPROMETIDOS por pautas
// programadas (que todavía no salieron al aire). No son capacidad ocupada —
// no entran en entra() ni en los totales de hoy — pero sí pesan al elegir
// bloque, para que las pautas que se carguen en el medio prefieran otros y la
// reserva siga en pie el día que la programada arranque.
function asignarBloques(lineas,ajustadas,sup,nombre,reservado){
  const N=sup.bloquesXProg;
  if(!reservado || reservado.length!==N) reservado=new Array(N).fill(0);
  // El bloque es compartido por todo el circuito, pero los segundos se cuentan
  // POR CANAL: una pauta etiquetada solo para un canal no le come espacio a los
  // demás. Por eso `usado` es una matriz canal × bloque. En un soporte suelto
  // hay un solo "canal" y se comporta igual que antes.
  const canales = sup.esCircuito ? sup.canales : [nombre];
  const iCanal = {}; canales.forEach((c,i)=>{ iCanal[c]=i; });
  const usado = canales.map(()=>new Array(N).fill(0));
  const ocupadoM = canales.map(()=>new Array(N).fill(false));
  // Índices de los canales donde sale esta pauta (su "etiqueta").
  const canalesDe = (o)=>{
    if(!sup.esCircuito) return [0];
    const cs=(o.canales && o.canales.length) ? o.canales : canales;
    return cs.map(c=>iCanal[c]).filter(i=>i!==undefined);
  };
  // Carga del bloque para ESTA pauta: la del canal más cargado entre los suyos,
  // que es el que la limita. Más el espacio comprometido por programadas.
  const carga=(j,o)=>{
    let m=0; for(const c of canalesDe(o)) if(usado[c][j]>m) m=usado[c][j];
    return m+reservado[j];
  };
  const resultado={};
  // unaPautaPorBloque (WTC): el bloque tradicional no se comparte entre pautas,
  // así que además de los segundos hay que llevar cuenta de cuáles ya están tomados.
  const unaPorBloque=!!sup.unaPautaPorBloque;
  const ocupadoPara=(j,o)=>canalesDe(o).some(c=>ocupadoM[c][j]);
  const marcarOcupado=(j,o)=>{ canalesDe(o).forEach(c=>{ ocupadoM[c][j]=true; }); };
  const nuevosAsignados=new Set(); // grupoIds a los que recién se les calculó bloque en esta pasada — hay que guardarlos en la Sheet

  // ══════ ESPACIO FIJO (McDonald's) ══════
  // Funciona como una CAMPAÑA MADRE: el contrato reserva siempre la misma
  // cantidad de bloques en el soporte (salidas contratadas / progsXHora) y
  // TODOS los spots del cliente viven adentro de esos mismos bloques — el CMS
  // los va alternando entre sí. O sea que los spots NO se reparten los bloques:
  // los comparten. Sumar un spot no agrega espacio ni se lo quita a los otros,
  // solo entra a la rotación.
  // Por eso el espacio ocupado se cuenta UNA vez (bloques × la duración más
  // larga, que es lo que tiene que entrar en el bloque), no una vez por spot.
  // El conjunto de bloques es estable: sale de posiciones repartidas parejo y
  // se elige antes que nada, así que da igual en cualquier computadora.
  const todasFijas = lineas.filter(o=>o.espacioFijo).sort((a,b)=>String(a.grupoId).localeCompare(String(b.grupoId)));
  const nFijos = bloquesEspacioFijo(sup, todasFijas);
  const fijas = nFijos>0 ? todasFijas : [];
  if(fijas.length){
    const reservados=[];
    for(let k=0;k<nFijos && reservados.length<N;k++){
      const ideal=Math.round(k*N/nFijos)%N;
      let mejor=-1,md=Infinity;
      for(let j=0;j<N;j++){
        if(reservados.indexOf(j)!==-1) continue;
        const d=Math.min(Math.abs(j-ideal),N-Math.abs(j-ideal));
        if(d<md){ md=d; mejor=j; }
      }
      if(mejor>=0) reservados.push(mejor);
    }
    reservados.sort((a,b)=>a-b);
    // El bloque tiene que poder alojar al spot más largo de la rotación.
    const durMax=Math.max(...fijas.map(o=>Number(o.dur)||0));
    const cFijos=canalesDe(fijas[0]);
    reservados.forEach(j=>{ cFijos.forEach(c=>{ usado[c][j]+=durMax; ocupadoM[c][j]=true; }); });
    const etiquetas=reservados.map(j=>etiquetaBloque(j));
    // Todos los spots muestran los mismos bloques, porque rotan en todos.
    fijas.forEach(o=>{
      resultado[o.grupoId]={bloques:etiquetas,bloquesIdx:reservados,reducido:false,sobreLimite:false};
      bloquesPersistentes[lineId(o)]=reservados;
      // Solo se marca para guardar si de verdad cambió, así no escribe en la
      // Sheet cada vez que alguien abre el soporte.
      if(etiquetas.join(',')!==(o.bloques||[]).join(',')){ o.bloques=etiquetas; nuevosAsignados.add(o.grupoId); }
    });
  }

  // Qué anunciantes ocupan cada bloque. Sirve para no dejar al mismo anunciante
  // en bloques pegados: sin esto la asignación solo miraba la carga en segundos
  // y podía darle a una misma pauta dos bloques contiguos (ej. F y G).
  // El espacio fijo no cuenta: sus bloques consecutivos son esperables.
  const anunEnBloque=Array.from({length:N},()=>new Set());
  const marcarAnun=(j,o)=>{ if(!o.espacioFijo && j>=0 && j<N) anunEnBloque[j].add(o.anun); };
  // ¿Poner esta pauta en el bloque j la deja pegada a otra del mismo anunciante?
  // Solo cuenta dentro del mismo ciclo, igual que la alerta que se muestra abajo.
  const quedaPegado=(j,o)=>{
    if(o.espacioFijo) return false;
    const ci=cicloDeBloque(sup,j);
    for(const v of [j-1,j+1]){
      if(v<ci.inicio || v>ci.fin) continue;
      if(anunEnBloque[v] && anunEnBloque[v].has(o.anun)) return true;
    }
    return false;
  };

  const yaFija=(o)=>!!resultado[o.grupoId] && fijas.indexOf(o)!==-1;
  // Cuántos bloques le corresponden a la orden, ya contando el Plus.
  const objetivo=(o)=>{
    const aj=ajustadas.find(a=>a.grupoId===o.grupoId)||{salidaRealAjustada:calcOrden(o,sup).salidaReal};
    // Piso: lo que la orden tiene contratado. Si el soporte está sobrevendido
    // no se le sacan bloques a lo ya vendido — ese exceso se arregla dando de
    // baja órdenes, no recortándolas por su cuenta.
    const contratado=Math.ceil(calcOrden(o,sup).salidaReal/sup.progsXHora);
    return Math.min(N, Math.max(contratado, Math.ceil(aj.salidaRealAjustada/sup.progsXHora)));
  };
  // Los bloques ya guardados se respetan (asignación no destructiva), pero
  // recortados al objetivo: cuando el Plus baja porque entró una pauta nueva,
  // los bloques extra se sueltan. Los que falten se agregan más abajo, así el
  // Plus también recibe bloques de verdad y el espacio queda completo.
  const previos={};
  lineas.forEach(o=>{
    if(yaFija(o)) return;
    const p=(bloquesPersistentes[lineId(o)]||[]).filter(j=>j>=0 && j<N);
    if(!p.length) return;
    // Se sueltan los bloques guardados que dejan al anunciante pegado a sí
    // mismo: son asignaciones viejas, de antes de que la app evitara esto.
    // El bloque suelto se vuelve a repartir abajo, ya con la regla puesta.
    const keep=[];
    for(const j of p.slice(0, objetivo(o))){
      if(quedaPegado(j,o)) continue;
      keep.push(j);
      canalesDe(o).forEach(c=>{ usado[c][j]+=o.dur; ocupadoM[c][j]=true; });
      marcarAnun(j,o);
    }
    previos[o.grupoId]=keep;
  });
  const esPrio=(o)=>clientesPrioritarios.some(p=>o.anun.toLowerCase().includes(p.toLowerCase())||(o.id||'').toLowerCase().includes(p.toLowerCase()));
  const sinAsig=lineas.filter(o=>!yaFija(o)).map(o=>{
    const ya=previos[o.grupoId]||[];
    const n=objetivo(o);
    return {o, n, ya, faltan:Math.max(0,n-ya.length), prio:esPrio(o)||o.espacioFijo};
  }).sort((a,b)=>b.prio-a.prio||b.faltan-a.faltan||b.n-a.n||b.o.dur-a.o.dur);
  // ¿El bloque j puede recibir esta pauta? (capacidad en seg + regla de exclusividad)
  // Entra si hay lugar en TODOS los canales donde esa pauta sale.
  const entra=(j,o)=>{
    if(unaPorBloque && ocupadoPara(j,o)) return false;
    const cap=capTradReal(j,nombre);
    return canalesDe(o).every(c=>usado[c][j]+o.dur<=cap);
  };
  const tomar=(j,o)=>{ canalesDe(o).forEach(c=>{ usado[c][j]+=o.dur; }); marcarOcupado(j,o); marcarAnun(j,o); };
  // Bloques que le corresponden por lo CONTRATADO, sin el Plus. Sirve para
  // informar cuántos bloques terminaron siendo de Plus. Quedar pegado NO frena
  // al Plus: cuando hay que llenar el espacio, llegar al 100% tiene prioridad.
  // La preferencia por no pegarse sigue actuando en la elección del bloque, así
  // que mientras haya lugar de sobra igual quedan separados.
  // Se calcula sobre lo CONTRATADO, no sobre el ajuste: en un soporte
  // sobrevendido el ajuste puede dejar una orden en 0 salidas, y sus bloques
  // seguirían siendo contratados — no Plus. Confundirlos hacía que se trataran
  // como Plus y se cortaran a la mitad.
  const bloquesBase=(o)=>Math.min(N, Math.ceil(calcOrden(o,sup).salidaReal/sup.progsXHora));
  // Se reparte en DOS pasadas: primero los bloques CONTRATADOS de todas las
  // órdenes, y recién después los del Plus. Si fuera en una sola, el Plus de la
  // primera orden se quedaría con lugar que le hace falta a lo contratado de
  // otra, y esa segunda orden terminaría metida en un bloque sin espacio.
  const estado=new Map();
  sinAsig.forEach(({o,n,ya})=>{
    if(n<=0){ resultado[o.grupoId]={bloques:[],bloquesIdx:[],reducido:false,sobreLimite:false}; bloquesPersistentes[lineId(o)]=[]; if((o.bloques||[]).length){ o.bloques=[]; nuevosAsignados.add(o.grupoId); } return; }
    estado.set(o,{asign:[...ya], red:false, sob:false, n, nBase:Math.min(n,bloquesBase(o))});
  });
  // ── Pasada 1: lo contratado. ── Pasada 2: el Plus. ──
  [1,2].forEach(fase=>{
  sinAsig.forEach(({o})=>{
    const st=estado.get(o); if(!st) return;
    const asign=st.asign;
    const hasta=fase===1?st.nBase:st.n;
    {
      // Pauta tradicional normal: siempre el bloque con menos carga acumulada
      // que tenga espacio libre — así la ocupación queda pareja entre todos los
      // bloques en vez de amontonarse en los primeros.
      // Desempate: entre bloques igual de cargados gana el más cercano a su
      // posición "ideal", repartiendo las n salidas de forma pareja a lo largo
      // de toda la programación (con 6 salidas en 6 ciclos → una por ciclo).
      // Sin esto, en un soporte vacío todos los bloques pesan igual y siempre
      // ganaría el índice más bajo, amontonando la pauta al principio.
      for(let k=asign.length;k<hasta;k++){
        const esPlus=fase===2;
        const ideal=Math.round(k*N/st.n)%N;
        const distIdeal=(j)=>Math.min(Math.abs(j-ideal),N-Math.abs(j-ideal));
        // Orden de preferencia: primero no quedar pegado a otra pauta del mismo
        // anunciante, después el bloque menos cargado, y recién ahí el más
        // cercano a su posición ideal. Es blando: si TODOS los bloques con lugar
        // dejan pegados, igual se elige uno (y la alerta de abajo lo avisa).
        let mejor=-1,mejorPeg=2,mejorUsado=Infinity,mejorDist=Infinity;
        for(let j=0;j<N;j++){
          if(asign.includes(j)) continue;
          if(!entra(j,o)) continue;
          const pg=quedaPegado(j,o)?1:0;
          const d=distIdeal(j), cg=carga(j,o);
          if(pg<mejorPeg || (pg===mejorPeg && (cg<mejorUsado || (cg===mejorUsado && d<mejorDist)))){
            mejorPeg=pg; mejorUsado=cg; mejorDist=d; mejor=j;
          }
        }
        // El Plus solo entra donde hay lugar de verdad: si ningún bloque puede
        // recibirlo, se corta ahí. Un soporte solo puede pasarse de capacidad
        // por órdenes cargadas de más, nunca por el Plus. (Quedar pegado sí se
        // permite cuando es la única forma de llenar el espacio.)
        if(esPlus && mejor<0) break;
        if(mejor>=0){ tomar(mejor,o); asign.push(mejor); }
        else {
          // No hay bloque con lugar: se mete igual en el menos cargado y se avisa.
          let mu=-1,muPeg=2,muUsado=Infinity,muDist=Infinity;
          for(let j=0;j<N;j++){
            if(asign.includes(j)) continue;
            const pg=quedaPegado(j,o)?1:0;
            const d=distIdeal(j), cg=carga(j,o);
            if(pg<muPeg || (pg===muPeg && (cg<muUsado || (cg===muUsado && d<muDist)))){
              muPeg=pg; muUsado=cg; muDist=d; mu=j;
            }
          }
          if(mu>=0){ tomar(mu,o); asign.push(mu); st.sob=true; st.red=true; }
        }
      }
    }
  });
  });

  sinAsig.forEach(({o})=>{
    const st=estado.get(o); if(!st) return;
    const asign=st.asign, red=st.red, sob=st.sob;
    asign.sort((a,b)=>a-b);
    // Los que exceden lo contratado son los del Plus. Se toma la cola de la
    // lista ordenada porque es la que se suelta primero cuando el Plus baja.
    const plusIdx=new Set(asign.slice(Math.min(st.nBase, asign.length)));
    resultado[o.grupoId]={bloques:asign.map(j=>etiquetaBloque(j)),bloquesIdx:asign,reducido:red,sobreLimite:sob,plusIdx:plusIdx};
    bloquesPersistentes[lineId(o)]=asign;
    const aj=ajustadas.find(a=>a.grupoId===o.grupoId);
    if(aj && (aj.plusSalidas||0)>0){
      const dadosDePlus=Math.max(0, asign.length-bloquesBase(o));
      const plusReal=dadosDePlus*sup.progsXHora;
      if(plusReal!==aj.plusSalidas){
        aj.salidaRealAjustada+=plusReal-aj.plusSalidas;
        aj.plusSalidas=plusReal; aj.plusBloques=dadosDePlus;
        aj.segAjustados=aj.salidaRealAjustada*o.dur;
      }
    }
    // Solo se marca para guardar si de verdad cambió: el Plus se recalcula en
    // cada render y sin esto escribiría en la Sheet a cada rato sin necesidad.
    const etiquetas=asign.map(j=>etiquetaBloque(j));
    if(etiquetas.join(',')!==(o.bloques||[]).join(',')){
      o.bloques=etiquetas; // queda en la orden misma para poder guardarlo en la Sheet
      nuevosAsignados.add(o.grupoId);
    }
  });
  const alertas=[], pegadosPorPlus=new Set();
  const tamCiclos=ciclosDeSoporte(sup), inicios=iniciosDeCiclo(sup);
  tamCiclos.forEach((tam,c)=>{
    const bl=Array.from({length:tam},(_,i)=>inicios[c]+i).filter(j=>j<N);
    for(let b=0;b<bl.length-1;b++){
      const a=bl[b],d=bl[b+1];
      const enA=lineas.filter(o=>resultado[o.grupoId]?.bloquesIdx?.includes(a));
      const enB=lineas.filter(o=>resultado[o.grupoId]?.bloquesIdx?.includes(d));
      enA.forEach(oA=>{ // No alertar si es espacio fijo (bloques consecutivos son esperables)
        if(oA.espacioFijo) return;
        const oB=enB.find(x=>!x.espacioFijo && x.anun===oA.anun);
        if(!oB) return;
        // Si alguna de las dos pautas recibió Plus, el pegado es consecuencia de
        // llenar el espacio y está autorizado: sin esos bloques de más habría
        // entrado repartida. No es un problema a corregir, así que se junta
        // aparte para avisarlo una sola vez por anunciante.
        // (Mirar el bloque puntual no alcanzaba: cuando una pauta termina
        // ocupando TODOS los bloques, cuáles son "los contratados" es arbitrario
        // y salían marcados como problema sin serlo.)
        const conPlus=(o)=>{ const r=resultado[o.grupoId]; return !!(r && r.plusIdx && r.plusIdx.size); };
        if(conPlus(oA) || conPlus(oB)){ pegadosPorPlus.add(oA.anun); return; }
        alertas.push(`⚠ ${oA.anun} en bloques consecutivos ${etiquetaBloque(a)}-${etiquetaBloque(d)} (ciclo ${c+1})`);
      });
    }
  });
  pegadosPorPlus.forEach(an=>{
    // Bloques DISTINTOS que ocupa el anunciante: si tiene varias órdenes pueden
    // compartir bloque, así que sumar por orden daría más que los que existen.
    const suyos=new Set();
    lineas.filter(o=>o.anun===an).forEach(o=>((resultado[o.grupoId]||{bloquesIdx:[]}).bloquesIdx||[]).forEach(j=>suyos.add(j)));
    alertas.push(`ℹ ${an} sale en bloques seguidos: con el Plus ocupa ${suyos.size} de ${N} bloques para llenar el espacio ocioso`);
  });
  return { resultado, usado, alertas, nuevosAsignados };
}

// ══════════════ COMPUTE POR SOPORTE (cacheado) ══════════════
let _cache={};
function invalidarCache(){ _cache={}; _cachePrevisto={}; }
// Arma las "lineas de circuito": una por CAMPAÑA (no una por canal). Cada una
// trae la lista de canales donde sale — eso es la etiqueta de OnSign. Las filas
// reales quedan colgadas en _filas para poder devolverles los bloques después.
function lineasDeCircuito(sup){
  const porGrupo=new Map();
  sup.canales.forEach(cn=>{
    ordenes.filter(o=>String(o.soporte).trim()===cn && estaVigente(o)).forEach(o=>{
      let L=porGrupo.get(o.grupoId);
      if(!L){ L={...o, soporte:sup.nombre, canales:[], _filas:[]}; porGrupo.set(o.grupoId,L); }
      L.canales.push(cn); L._filas.push(o);
      // La campaña es UNA unidad comercial. Si algún canal quedó con otra
      // duración o salidas, manda la mayor: el bloque tiene que poder alojarla.
      if((Number(o.dur)||0)>(Number(L.dur)||0)) L.dur=o.dur;
      if((Number(o.sal)||0)>(Number(L.sal)||0)) L.sal=o.sal;
    });
  });
  // La clave del circuito se siembra con los bloques que ya tuviera cualquiera
  // de sus filas, así no se reasigna de cero lo que ya estaba resuelto.
  porGrupo.forEach(L=>{
    const k=lineId(L);
    if(!(bloquesPersistentes[k]||[]).length){
      const f=L._filas.find(x=>(bloquesPersistentes[lineId(x)]||[]).length);
      if(f) bloquesPersistentes[k]=bloquesPersistentes[lineId(f)].slice();
    }
  });
  return [...porGrupo.values()];
}
// Devuelve a cada fila real los bloques que le tocaron a su campaña. Todas las
// filas de una campaña quedan con las MISMAS letras: el bloque es compartido.
function propagarBloquesCircuito(lineasCirc, resultado){
  lineasCirc.forEach(L=>{
    const r=resultado[L.grupoId]; if(!r) return;
    const idx=(r.bloquesIdx||[]).slice(), et=(r.bloques||[]).slice();
    let cambio=false;
    L._filas.forEach(f=>{
      bloquesPersistentes[lineId(f)]=idx.slice();
      if(et.join(',')!==(f.bloques||[]).join(',')){ f.bloques=et.slice(); cambio=true; }
    });
    if(cambio) marcarSync(L.grupoId);
  });
}

function computeSoporte(nombre){
  if(_cache[nombre]) return _cache[nombre];
  // Un canal de circuito no se calcula solo: se calcula el circuito entero una
  // vez y de ahí sale la vista de cada canal.
  const circCanal=circuitoDeCanal(nombre);
  if(circCanal){ computeSoporte(circCanal.nombre); return _cache[nombre]; }
  const sup=getSoporte(nombre);
  const activas = sup.esCircuito
    ? lineasDeCircuito(sup)
    : ordenes.filter(o=>String(o.soporte).trim()===String(nombre).trim() && estaVigente(o));
  // Separar PE, Espacio Fijo y Tradicional normal
  const activasPE    = activas.filter(o=>o.tipo==='PLACE EXCHANGE');
  const activasFijo  = activas.filter(o=>o.tipo!=='PLACE EXCHANGE' && o.espacioFijo);
  const activasTrad  = activas.filter(o=>o.tipo!=='PLACE EXCHANGE' && !o.espacioFijo);
  // Los de espacio fijo se asignan primero y sus bloques nunca se tocan
  // PE: cada campaña ocupa tantos slots como salidas contratadas le
  // correspondan — misma fórmula que una pauta tradicional (sal/4, mismo
  // redondeo). Una campaña por slot, nunca dos. No destructiva: lo ya
  // asignado en bloquesPEPersistentes se respeta, solo se reparten slots
  // nuevos a las campañas que no tengan.
  const SLOTS_PE=totalSlotsPE(sup);
  bloquesPE[nombre]=new Array(SLOTS_PE).fill(null);
  const activasPEAsignadas=activasPE.filter(o=>{ const p=bloquesPEPersistentes[lineId(o)]; return p&&p.length; });
  const activasPESinAsignar=activasPE.filter(o=>{ const p=bloquesPEPersistentes[lineId(o)]; return !(p&&p.length); });
  activasPEAsignadas.forEach(o=>{
    bloquesPEPersistentes[lineId(o)].forEach(s=>{ if(s>=0&&s<SLOTS_PE&&!bloquesPE[nombre][s]) bloquesPE[nombre][s]={grupoId:o.grupoId,anun:o.anun,camp:o.camp,dur:o.dur}; });
  });
  const nuevosAsignadosPE=new Set(); // grupoIds PE recién asignados en esta pasada — hay que guardarlos en la Sheet
  const pendientesPE=activasPESinAsignar.map(o=>({o,n:calcOrden(o,sup).vecesPub})).sort((a,b)=>b.n-a.n||b.o.dur-a.o.dur);
  pendientesPE.forEach(({o,n})=>{
    if(n<=0) return;
    const slots=slotsPEEspaciados(n, bloquesPE[nombre], SLOTS_PE);
    slots.forEach(s=>{ bloquesPE[nombre][s]={grupoId:o.grupoId,anun:o.anun,camp:o.camp,dur:o.dur}; });
    bloquesPEPersistentes[lineId(o)]=slots;
    o.bloques=slots.map(s=>slotPEaCodigo(s,sup.pePorGrupo)); // ej. ["A1","A2","B1"] — misma columna que las tradicionales
    nuevosAsignadosPE.add(o.grupoId);
  });
  nuevosAsignadosPE.forEach(gid=>marcarSync(gid));
  // Todos los tradicionales juntos — fijo entra primero por su prioridad en el sort
  // de asignarBloques (o.espacioFijo = true tiene prioridad máxima)
  // ── RESERVA DE BLOQUES DE LAS PAUTAS PROGRAMADAS ──────────────────
  // Una pauta que arranca más adelante recibe su bloque apenas se carga y queda
  // guardado en la Sheet, para que la persona de tráfico la pueda dejar lista en
  // el CMS y el bloque no se le mueva. El bloque sale de simular el soporte el
  // día de arranque (preverBloques), no de la grilla de hoy.
  // Sus segundos NO cuentan para la capacidad de hoy: solo hacen que las pautas
  // que entren en el medio prefieran otros bloques, así la reserva aguanta.
  const programadas = sup.esCircuito
    ? (function(){ const m=new Map();
        sup.canales.forEach(cn=>ordenes.filter(o=>String(o.soporte).trim()===cn
          && o.tipo!=='PLACE EXCHANGE' && estaProgramada(o)).forEach(o=>{
            let L=m.get(o.grupoId);
            if(!L){ L={...o, soporte:sup.nombre, canales:[], _filas:[]}; m.set(o.grupoId,L); }
            L.canales.push(cn); L._filas.push(o);
          }));
        return [...m.values()]; })()
    : ordenes.filter(o=>String(o.soporte).trim()===String(nombre).trim()
                     && o.tipo!=='PLACE EXCHANGE' && estaProgramada(o));
  const reservado=new Array(sup.bloquesXProg).fill(0);
  programadas.forEach(o=>{
    let idx=bloquesPersistentes[lineId(o)];
    if(!(idx && idx.length)){
      const prev=preverBloques(nombre,o.fi)[o.grupoId];
      // Se reservan SOLO los bloques que le tocan por lo contratado. Los del
      // Plus no se pueden reservar: son "lo que sobre ese día", y cuánto sobra
      // depende de lo que se cargue hasta entonces. Se los asigna el día que
      // arranca, arriba de los reservados.
      idx=(prev && prev.bloquesIdx)
        ? prev.bloquesIdx.filter(j=>!(prev.plusIdx && prev.plusIdx.has(j)))
        : [];
      if(idx.length){
        bloquesPersistentes[lineId(o)]=idx;
        const etiquetas=idx.map(j=>etiquetaBloque(j));
        // La reserva original se guarda APARTE (columna N). Cuando la pauta
        // arranque, la app va a pisar `bloques` con lo que realmente le tocó;
        // sin esta copia no habría contra qué comparar para avisar del cambio.
        const txt=etiquetas.join(',');
        if(txt!==(o.bloques||[]).join(',') || txt!==(o.bloquesReservados||[]).join(',')){
          o.bloques=etiquetas; o.bloquesReservados=etiquetas.slice(); marcarSync(o.grupoId);
        }
      }
    }
    (idx||[]).forEach(j=>{ if(j>=0 && j<sup.bloquesXProg) reservado[j]+=(Number(o.dur)||0); });
  });

  const todasTrad=[...activasFijo,...activasTrad];
  const ajustadas=calcSalidasAjustadas(todasTrad,sup);
  const { resultado, usado, alertas, nuevosAsignados }=asignarBloques(todasTrad,ajustadas,sup,nombre,reservado);
  // Los bloques recién calculados (no venían de la Sheet) se guardan en la nube
  // para que no se recalculen distinto en otra computadora u otra sesión.
  nuevosAsignados.forEach(gid=>marcarSync(gid));
  // ── Control de la reserva al activarse ────────────────────────────
  // Una pauta que estaba programada llega a su día de arranque y recibe sus
  // bloques definitivos. Si no coinciden con los que tenía reservados, se avisa
  // por mail: quien la cargó en el CMS por adelantado tiene que corregirla.
  // Se evalúa una sola vez — después la reserva se limpia.
  todasTrad.forEach(o=>{
    const reserva=o.bloquesReservados;
    if(!reserva || !reserva.length) return;
    if(!estaVigente(o)) return;   // todavía programada: la reserva sigue en pie
    const finales=((resultado[o.grupoId]||{}).bloques)||[];
    // Solo se avisa cuando se PIERDE un bloque reservado: eso obliga a corregir
    // lo que ya esté cargado en el CMS. Que además le caiga algún bloque extra
    // del Plus no es un problema —cambia todos los días— y no genera mail.
    const perdidos=reserva.filter(b=>finales.indexOf(b)===-1);
    if(perdidos.length) avisarCambioBloques(o, reserva, finales);
    o.bloquesReservados=[];       // ya se controló
    marcarSync(o.grupoId);
  });
  // usadoPE: seg reales de PE en cada grupo (array de pePorGrupo valores por grupo)
  const usadoPE=Array.from({length:sup.bloquesXProg},(_,j)=>segPEenGrupo(j,nombre));

  if(sup.esCircuito) propagarBloquesCircuito(todasTrad.filter(o=>o._filas), resultado);

  // `usado` viene como matriz canal × bloque. La vista del circuito muestra el
  // canal MÁS cargado de cada bloque: es el que limita lo que todavía se puede
  // vender a todo el circuito.
  const N=sup.bloquesXProg;
  const usadoVista = sup.esCircuito
    ? Array.from({length:N},(_,j)=>Math.max(...usado.map(f=>f[j])))
    : usado[0];
  const balance=balanceSegundos(sup,nombre,usadoVista,usadoPE);
  const r={ sup, activas, activasTrad:todasTrad, activasPE, activasFijo, ajustadas, resultado,
            usado:usadoVista, usadoPE, alertas, balance, programadas, reservado,
            esCircuito:!!sup.esCircuito, usadoPorCanal:usado };
  _cache[nombre]=r;

  // Vistas por canal: mismos bloques y mismo reparto, pero solo las pautas que
  // salen en ese canal y los segundos que de verdad ocupa ahí.
  if(sup.esCircuito){
    sup.canales.forEach((cn,ci)=>{
      const supC=getSoporte(cn);
      const activasC=ordenes.filter(o=>String(o.soporte).trim()===cn && estaVigente(o));
      const tradC=activasC.filter(o=>o.tipo!=='PLACE EXCHANGE' && !o.espacioFijo);
      const fijoC=activasC.filter(o=>o.tipo!=='PLACE EXCHANGE' && o.espacioFijo);
      const peC  =activasC.filter(o=>o.tipo==='PLACE EXCHANGE');
      const usadoC=usado[ci];
      bloquesPE[cn]=bloquesPE[nombre];           // los slots PE también son del circuito
      const usadoPEC=Array.from({length:N},(_,j)=>segPEenGrupo(j,cn));
      _cache[cn]={ sup:supC, activas:activasC, activasTrad:[...fijoC,...tradC], activasPE:peC,
                   activasFijo:fijoC, ajustadas, resultado, usado:usadoC, usadoPE:usadoPEC,
                   alertas, balance:balanceSegundos(supC,cn,usadoC,usadoPEC),
                   programadas:programadas.filter(L=>(L.canales||[]).indexOf(cn)!==-1),
                   reservado, esCircuito:false, circuito:nombre };
    });
  }
  return r;
}

// Cuántos segundos de pauta quedan libres (o de más) en una programación,
// separado por tipo. En los soportes dinámicos la capacidad tradicional no es
// un número fijo: depende de cuánto ocupe el PE de cada grupo, por eso se suma
// bloque por bloque con capTradReal en vez de usar una constante.
function balanceSegundos(sup,nombre,usado,usadoPE){
  const capTrad=Array.from({length:sup.bloquesXProg},(_,j)=>capTradReal(j,nombre)).reduce((a,b)=>a+b,0);
  const usoTrad=usado.reduce((a,b)=>a+b,0);
  const capPE=totalSlotsPE(sup)*sup.capPE;
  const usoPE=usadoPE.reduce((acc,arr)=>acc+arr.reduce((a,b)=>a+b,0),0);
  const slotsPEOcupados=(bloquesPE[nombre]||[]).filter(Boolean).length;
  return {
    trad:{ cap:capTrad, usado:usoTrad, libre:capTrad-usoTrad },
    pe:{ cap:capPE, usado:usoPE, libre:capPE-usoPE, slotsOcupados:slotsPEOcupados, slotsTotal:totalSlotsPE(sup) },
    excedido:(capTrad-usoTrad)<0 || (capPE-usoPE)<0
  };
}

// ══════════════ HELPERS UI ══════════════
function tipoBadge(t){ if(t==='TRADICIONAL') return '<span class="badge badge-trad">Tradicional</span>'; if(t==='PROGRAMATICA') return '<span class="badge badge-prog">Programática</span>'; if(t==='PLACE EXCHANGE') return '<span class="badge badge-px">Place Exchange</span>'; return ''; }
function tcBadge(tc){ if(tc==='TOP') return '<span class="badge-top">TOP</span>'; if(tc==='NUEVO') return '<span class="badge-new">NUEVO</span>'; return '<span class="badge-std">STD</span>'; }
function esPrioCli(o){ return clientesPrioritarios.some(p=>o.anun.toLowerCase().includes(p.toLowerCase())||(o.id||'').toLowerCase().includes(p.toLowerCase())); }

// ══════════════ GRUPOS ══════════════
function getGrupos(){ const m={}; ordenes.forEach(o=>{ (m[o.grupoId]=m[o.grupoId]||[]).push(o); }); return Object.entries(m).map(([grupoId,lineas])=>({grupoId,lineas})); }
function valorComun(lineas,campo){ const v=[...new Set(lineas.map(l=>l[campo]))]; return v.length===1?v[0]:null; }
function grupoVigente(g){ return g.lineas.some(estaVigente); }
function grupoProgramado(g){ return !grupoVigente(g) && g.lineas.some(estaProgramada); }
function grupoFinalizado(g){ return !grupoVigente(g) && !grupoProgramado(g); }

// ══════════════ NAV ══════════════
document.querySelectorAll('.view-nav button').forEach(b=>b.addEventListener('click',()=>cambiarVista(b.dataset.view)));
function cambiarVista(v){
  vistaActual=v;
  document.querySelectorAll('.view-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  document.getElementById('viewOrdenes').style.display=v==='ordenes'?'block':'none';
  document.getElementById('viewSoporte').style.display=v==='soporte'?'block':'none';
  document.getElementById('viewBuscar').style.display=v==='buscar'?'block':'none';
  if(v==='soporte') document.getElementById('sopSelect').value=soporteSeleccionado;
  invalidarCache();
  renderActiva();
}
function renderActiva(){
  invalidarCache();
  updateHeader();
  if(vistaActual==='ordenes') renderOrdenes();
  else if(vistaActual==='soporte') renderSoporte();
  else renderBuscar();
}
function updateHeader(){
  const grupos=getGrupos();
  const activos=grupos.filter(grupoVigente).length;
  const programados=grupos.filter(grupoProgramado).length;
  document.getElementById('navCountOrd').textContent=activos?`(${activos})`:'';
  // Los parámetros de programación son por soporte, así que el header global
  // solo muestra lo que es transversal (cantidad de soportes y de órdenes).
  document.getElementById('headerMeta').innerHTML=`<b>${SOPORTES_REALES.length}</b> soportes · <b>${activos}</b> órdenes activas`
    + (programados?` · <b>${programados}</b> programada${programados===1?'':'s'}`:'');
}

// ══════════════ VISTA ÓRDENES ══════════════
let filtroOrd='todos';
document.querySelectorAll('[data-ford]').forEach(b=>b.addEventListener('click',()=>{ filtroOrd=b.dataset.ford; document.querySelectorAll('[data-ford]').forEach(x=>x.classList.toggle('active',x===b)); renderOrdenes(); }));
document.getElementById('searchOrd').addEventListener('input',renderOrdenes);

function renderOrdenes(){
  const q=document.getElementById('searchOrd').value.trim().toLowerCase();
  const grupos=getGrupos();
  const activos=grupos.filter(grupoVigente);
  const programados=grupos.filter(grupoProgramado);
  const finalizados=grupos.filter(grupoFinalizado);
  const body=document.getElementById('ordBody'); body.innerHTML='';
  const matchTexto=(l)=>{ if(filtroOrd!=='todos' && l.tipo!==filtroOrd) return false; if(q){ const h=(l.anun+' '+(l.camp||'')+' '+(l.id||'')).toLowerCase(); if(!q.split(' ').every(w=>h.includes(w))) return false; } return true; };

  // Espacio fijo: se consolida en UNA fila por soporte + anunciante (no por
  // campaña). Cada campaña nueva que se carga tiene su propio grupoId, pero
  // todas comparten el mismo espacio físico — el desglose por campaña se ve
  // al hacer click en la fila (openEspacioFijoDetail).
  const activosNormales=activos.filter(g=>!g.lineas.some(l=>l.espacioFijo));
  const activosFijos=activos.filter(g=>g.lineas.some(l=>l.espacioFijo));
  const visiblesNormales=activosNormales.filter(g=>matchTexto(g.lineas[0]));
  // Las programadas van en la misma tabla, marcadas y después de las activas:
  // hay que poder verlas y editarlas, pero no ocupan espacio todavía.
  const visiblesProgramadas=programados.filter(g=>matchTexto(g.lineas[0]));

  const fijasPorSoporte={};
  activosFijos.forEach(g=>{ g.lineas.filter(l=>l.espacioFijo && estaVigente(l)).forEach(l=>{ (fijasPorSoporte[l.soporte]=fijasPorSoporte[l.soporte]||[]).push(l); }); });
  const gruposFijosVisibles=Object.values(fijasPorSoporte).filter(grupo=>grupo.some(matchTexto));

  if(visiblesNormales.length===0 && gruposFijosVisibles.length===0 && visiblesProgramadas.length===0){ body.innerHTML='<tr class="empty-row"><td colspan="9">No hay órdenes que coincidan. Tocá “+ Nueva orden” para cargar la primera.</td></tr>'; }

  gruposFijosVisibles.forEach(grupo=>{ body.appendChild(filaEspacioFijoOrdenes(grupo)); });

  [...visiblesNormales, ...visiblesProgramadas].forEach(g=>{
    const l=g.lineas[0];
    const sops=g.lineas.map(x=>x.soporte);
    const ffComun=valorComun(g.lineas,'ff'), salComun=valorComun(g.lineas,'sal'), durComun=valorComun(g.lineas,'dur');
    const fiComun=valorComun(g.lineas,'fi');
    const tr=document.createElement('tr');
    const gid=escapeHtml(g.grupoId);
    const prog=grupoProgramado(g);
    if(prog) tr.className='prog-row';
    tr.innerHTML=`
      <td><div class="anun-name">${escapeHtml(l.anun)}${esPrioCli(l)?'<span class="badge badge-prio">★</span>':''}${prog?'<span class="badge badge-prog">Programada</span>':''}</div>${l.camp?`<div class="anun-camp">${escapeHtml(l.camp)}</div>`:''}<div class="anun-id">${escapeHtml(l.id)||'—'}</div></td>
      <td><select class="cell-tc-select" onchange="updateGrupo('${gid}','tipoCliente',this.value)">
        <option value="ESTANDAR" ${valorComun(g.lineas,'tipoCliente')==='ESTANDAR'?'selected':''}>STD</option>
        <option value="TOP"      ${valorComun(g.lineas,'tipoCliente')==='TOP'?'selected':''}>TOP</option>
        <option value="NUEVO"    ${valorComun(g.lineas,'tipoCliente')==='NUEVO'?'selected':''}>NUEVO</option>
      </select></td>
      <td>${tipoBadge(l.tipo)}</td>
      <td><div class="sop-chips">${sops.map(s=>`<span class="sop-chip">${escapeHtml(s)}</span>`).join('')}</div></td>
      <td><span class="date-range">${fiComun!==null?fmtDate(fiComun):'varios'}</span>${prog&&fiComun!==null?badgeInicio(fiComun):(ffComun!==null?badgeDias(ffComun):'')}</td>
      <td><input class="cell-input date-input ${ffComun===null?'mixed':''}" type="date" value="${escapeHtml(ffComun)}" onchange="updateGrupo('${gid}','ff',this.value)" title="${ffComun===null?'Varía por soporte':''}"></td>
      <td><input class="cell-input ${salComun===null?'mixed':''}" type="number" min="0.5" step="0.5" value="${salComun!==null?salComun:''}" placeholder="${salComun===null?'varios':''}" onchange="updateGrupo('${gid}','sal',+this.value)"></td>
      <td><input class="cell-input ${durComun===null?'mixed':''}" type="number" min="1" max="120" value="${durComun!==null?durComun:''}" placeholder="${durComun===null?'varios':''}" onchange="updateGrupo('${gid}','dur',+this.value)"></td>
      <td style="white-space:nowrap"><button class="btn-icon" onclick="openOrden('${gid}')" title="Editar / soportes">✎</button><button class="btn-icon del" onclick="deleteGrupo('${gid}')" title="Eliminar orden completa">✕</button></td>`;
    body.appendChild(tr);
  });

  // finalizadas
  const fb=document.getElementById('ordFinBody'); fb.innerHTML='';
  document.getElementById('ordFinCount').textContent=`(${finalizados.length})`;
  finalizados.forEach(g=>{
    const l=g.lineas[0]; const fiC=valorComun(g.lineas,'fi'), ffC=valorComun(g.lineas,'ff'); const salC=valorComun(g.lineas,'sal'), durC=valorComun(g.lineas,'dur');
    const tr=document.createElement('tr'); tr.className='fin-row';
    const gid=escapeHtml(g.grupoId);
    tr.innerHTML=`
      <td><div class="anun-name" style="color:var(--fin-text)"><span class="fin-checkmark">✓</span>${escapeHtml(l.anun)}${l.camp?' — '+escapeHtml(l.camp):''}</div><div class="anun-id">${escapeHtml(l.id)||'—'}</div></td>
      <td>${tcBadge(l.tipoCliente)}</td><td>${tipoBadge(l.tipo)}</td>
      <td><div class="sop-chips">${g.lineas.map(x=>`<span class="sop-chip">${escapeHtml(x.soporte)}</span>`).join('')}</div></td>
      <td><span class="date-range">${fiC!==null?fmtDate(fiC):'varios'}</span></td>
      <td><input class="cell-input date-input" type="date" value="${escapeHtml(ffC)}" onchange="updateGrupo('${gid}','ff',this.value)" title="Extender fecha fin para reactivar"></td>
      <td><input class="cell-input" type="number" min="0.5" step="0.5" value="${salC!==null?salC:''}" placeholder="${salC===null?'varios':''}" onchange="updateGrupo('${gid}','sal',+this.value)"></td>
      <td><input class="cell-input" type="number" min="1" max="120" value="${durC!==null?durC:''}" placeholder="${durC===null?'varios':''}" onchange="updateGrupo('${gid}','dur',+this.value)"></td>
      <td><button class="btn-icon del" onclick="deleteGrupo('${gid}')">✕</button></td>`;
    fb.appendChild(tr);
  });
}

// Celdas de salidas y duración de la fila consolidada de espacio fijo. Antes
// eran texto plano: la fila era la única de la tabla que no se podía editar ni
// borrar, y había que adivinar que el ojito abría un panel editable.
// Las salidas son un solo número (el del contrato). La duración solo se puede
// editar acá si todos los spots comparten la misma; si difieren, el valor vive
// en cada campaña y se edita en el detalle.
function celdaSalEspacioFijo(sop, salFijas){
  return `<td><input class="cell-input" type="number" min="1" max="999" value="${salFijas}"
    title="Salidas por hora del contrato. Cambiarlo reasigna los bloques reservados."
    onchange="setSalidasEspacioFijo('${sop}', this.value)"></td>`;
}
function celdaDurEspacioFijo(sop, durs){
  if(durs.size===1){
    return `<td><input class="cell-input" type="number" min="1" max="120" value="${[...durs][0]}"
      title="Duración del spot. Se aplica a todas las campañas de este espacio fijo."
      onchange="setDuracionEspacioFijo('${sop}', this.value)"></td>`;
  }
  return `<td><button class="btn-varios" onclick="openEspacioFijoDetail('${sop}')"
    title="Las campañas tienen duraciones distintas: se editan una por una">varios ✎</button></td>`;
}
function accionesEspacioFijo(sop){
  return `<td style="white-space:nowrap"><button class="btn-icon" onclick="openEspacioFijoDetail('${sop}')" title="Ver y editar las campañas de este espacio fijo">✎</button><button class="btn-icon del" onclick="deleteEspacioFijo('${sop}')" title="Eliminar el espacio fijo completo de este soporte">✕</button></td>`;
}

// Fila única y clickeable para un anunciante de Espacio Fijo en un soporte
// dado (ej. McDonald's en Facal), consolidando todas sus campañas activas —
// aunque cada campaña sea un grupoId/orden distinta. El click abre
// openEspacioFijoDetail() con el desglose por campaña y bloques.
function filaEspacioFijoOrdenes(grupo){
  const primero=grupo[0];
  const nombre=nombreMasComun(grupo);
  const durs=new Set(), tcs=new Set();
  grupo.forEach(l=>{ durs.add(l.dur); tcs.add(l.tipoCliente||'ESTANDAR'); });
  const tcUnico=tcs.size===1?[...tcs][0]:null;
  const tr=document.createElement('tr'); tr.className='espfijo-row';
  const sop=escapeHtml(primero.soporte);
  const salFijas=salidasEspacioFijo(getSoporte(primero.soporte), grupo);
  tr.innerHTML=`
    <td><div class="anun-name" style="cursor:pointer" onclick="openEspacioFijoDetail('${sop}')" title="Ver y editar las campañas que usan este espacio fijo">📌 ${escapeHtml(nombre)}<span class="badge" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-size:9px">Espacio fijo</span></div><div class="anun-camp">${grupo.length} campaña${grupo.length===1?'':'s'} activa${grupo.length===1?'':'s'} en este espacio</div></td>
    <td>${tcUnico?tcBadge(tcUnico):'<span class="badge-std">VARIOS</span>'}</td>
    <td>${tipoBadge('TRADICIONAL')}</td>
    <td><div class="sop-chips"><span class="sop-chip">${sop}</span></div></td>
    <td><span class="date-range">Permanente</span></td>
    <td><span class="cell-muted" style="font-size:11px">Sin vencimiento</span></td>
    ${celdaSalEspacioFijo(sop, salFijas)}
    ${celdaDurEspacioFijo(sop, durs)}
    ${accionesEspacioFijo(sop)}`;
  return tr;
}

function updateGrupo(grupoId,campo,val){
  ordenes.forEach(o=>{ if(o.grupoId===grupoId){ if(campo==='ff'||campo==='fi') o[campo]=val; else if(!isNaN(val)&&val>0) o[campo]=val; if(campo==='sal'||campo==='dur'||campo==='fi'||campo==='ff'){ delete bloquesPersistentes[lineId(o)]; delete bloquesPEPersistentes[lineId(o)]; o.bloques=[]; } } });
  guardarLocal(); marcarSync(grupoId); renderActiva();
}
function deleteGrupo(grupoId){
  const g=ordenes.find(o=>o.grupoId===grupoId);
  if(!confirm(`¿Eliminar la orden "${g?g.anun:''}" de todos sus soportes?`)) return;
  const soportes=ordenes.filter(o=>o.grupoId===grupoId).map(o=>o.soporte);
  ordenes.filter(o=>o.grupoId===grupoId).forEach(o=>delete bloquesPersistentes[lineId(o)]);
  ordenes=ordenes.filter(o=>o.grupoId!==grupoId);
  guardarLocal(); soportes.forEach(s=>marcarEliminado(grupoId,s)); renderActiva();
}

// ══════════════ VISTA POR SOPORTE ══════════════
let sBloqueSel=-1, sUsado=new Array(16).fill(0), sResultado={}, sActivas=[], sActivasTrad=[], sActivasPE=[], sUsadoPE=[];
function initSopSelect(){ const sel=document.getElementById('sopSelect');
  sel.innerHTML=SOPORTES.map(s=>`<option value="${escapeHtml(s.nombre)}">${s.esCircuito?'◆ '+escapeHtml(s.nombreCompleto):escapeHtml(s.nombre)}</option>`).join('');
  sel.value=soporteSeleccionado; }
function onSopChange(){ soporteSeleccionado=document.getElementById('sopSelect').value.trim(); sBloqueSel=-1; document.getElementById('sBloqueDetail').classList.remove('open'); invalidarCache(); renderSoporte(); }
document.getElementById('searchSop').addEventListener('input',renderSoporte);

// Pinta los dos cuadros de arriba: verde si sobran segundos, rojo si el soporte
// está pasado del tope. Muestra el total por programación y el equivalente por
// hora, que es la unidad con la que se contrata.
function pintarBalance(bal, sup){
  // Soportes sin programática (MAS BUS) no muestran el cuadro de PE.
  const hayPE=sup.pePorGrupo>0;
  document.getElementById('sBalPECard').style.display=hayPE?'':'none';
  const filas=[
    {card:'sBalTradCard', val:'sBalTradValor', est:'sBalTradEstado', sub:'sBalTradSub', d:bal.trad,
     detalle:`${bal.trad.usado} usados de ${bal.trad.cap} seg/prog`},
    {card:'sBalPECard', val:'sBalPEValor', est:'sBalPEEstado', sub:'sBalPESub', d:bal.pe,
     detalle:`${bal.pe.usado} usados de ${bal.pe.cap} seg/prog · ${bal.pe.slotsOcupados}/${bal.pe.slotsTotal} slots`}
  ];
  filas.forEach(f=>{
    const pasado=f.d.libre<0;
    const seg=Math.abs(Math.round(f.d.libre));
    document.getElementById(f.card).className='balance-card '+(pasado?'over':'ok');
    document.getElementById(f.val).textContent=(pasado?'−':'+')+seg+' seg';
    document.getElementById(f.est).textContent=pasado
      ? `⚠ Pasado por ${seg} seg/prog (${seg*sup.progsXHora} seg/hora)`
      : `Disponible · ${seg*sup.progsXHora} seg/hora`;
    document.getElementById(f.sub).textContent=f.detalle;
  });
}

function renderSoporte(){
  const comp=computeSoporte(soporteSeleccionado);
  const { sup, activas, ajustadas, resultado, usado, alertas }=comp;
  const activasTrad=comp.activasTrad||activas.filter(o=>o.tipo!=='PLACE EXCHANGE');
  const activasPE=comp.activasPE||activas.filter(o=>o.tipo==='PLACE EXCHANGE');
  const usadoPE=comp.usadoPE||Array.from({length:sup.bloquesXProg},(_,j)=>segPEenGrupo(j,soporteSeleccionado));
  sUsado=usado; sResultado=resultado; sActivas=activas; sActivasTrad=activasTrad; sActivasPE=activasPE; sUsadoPE=usadoPE;
  const totalProg=ajustadas.reduce((s,r)=>s+r.salidaRealAjustada*r.dur/sup.progsXHora,0);
  const libres=Math.max(0,sup.pautaXProgSeg-totalProg);
  const pct=(totalProg/sup.pautaXProgSeg)*100;
  const reducidos=Object.values(resultado).filter(r=>r.reducido).length;
  // Se compara contra la capacidad real de cada bloque tradicional (que en los
  // soportes dinámicos varía según cuánto ocupe el PE de ese grupo).
  const sobre=usado.filter((u,j)=>u>capTradReal(j,soporteSeleccionado)).length;

  const _circ=sup.esCircuito?null:circuitoDeCanal(soporteSeleccionado);
  document.getElementById('sopNota').innerHTML = sup.esCircuito
    ? `Los bloques son comunes a los ${sup.canales.length} canales del circuito. La ocupación que se muestra es la del canal más cargado de cada bloque — es lo que limita lo que se puede vender a todo el circuito.`
    : (_circ ? `Bloques compartidos con <b>${escapeHtml(_circ.etiqueta)}</b>. Acá se ve solo lo que sale al aire en ${escapeHtml(soporteSeleccionado)}.` : '');
  document.getElementById('sopNota').style.display=(sup.esCircuito||_circ)?'':'none';
  document.getElementById('sopMeta').innerHTML=`Prog: <b>${sup.durProgSeg} seg</b> · Pauta: <b>${sup.pautaXProgSeg} seg</b> · <b>${sup.progsXHora}</b> progs/hora · <b>${sup.bloquesXProg}×${sup.capBloque}</b> · ON: <b>${sup.hsOn} hs</b>`;
  const bal=comp.balance||balanceSegundos(sup,soporteSeleccionado,usado,usadoPE);
  pintarBalance(bal, sup);
  avisarExcesoCapacidad(soporteSeleccionado, bal);
  document.getElementById('sStatOcupados').textContent=Math.round(totalProg); document.getElementById('sStatOcupados').className='stat-value '+(totalProg>sup.pautaXProgSeg?'red':'accent');
  document.getElementById('sStatOcupadosSub').textContent=`de ${sup.pautaXProgSeg} seg`;
  document.getElementById('sStatLibres').textContent=Math.round(libres); document.getElementById('sStatLibres').className='stat-value '+(libres<30?'amber':'green');
  document.getElementById('sStatOrdenes').textContent=activas.length;
  document.getElementById('sStatReducidos').textContent=reducidos; document.getElementById('sStatReducidos').className='stat-value '+(reducidos>0?'amber':'green');
  document.getElementById('sStatSobre').textContent=sobre; document.getElementById('sStatSobre').className='stat-value '+(sobre>0?'red':'green');
  // La capacidad real de cada bloque varía con lo que ocupe su PE, así que el
  // rótulo no puede decir un número fijo.
  document.getElementById('sStatSobreSub').textContent='superan su capacidad';
  document.getElementById('sCapLabel').textContent=`Capacidad de pauta por programación (${sup.bloquesXProg} bloques × ${sup.capBloque} seg = ${sup.pautaXProgSeg} seg)`;
  // Rótulo de ciclos: "A–D ciclo 1 · E–H ciclo 2 · …" derivado de la forma del soporte
  const _inicios=iniciosDeCiclo(sup), _tams=ciclosDeSoporte(sup);
  const ciclosTxt=_tams.map((tam,c)=>{
    const ini=_inicios[c], fin=Math.min(ini+tam-1, sup.bloquesXProg-1);
    return `${etiquetaBloque(ini)}–${etiquetaBloque(fin)} ciclo ${c+1}`;
  }).join(' · ');
  document.getElementById('sGruposLabel').textContent=`Grupos Madre de Pauta — ${ciclosTxt}`;
  // Leyenda de colores: el chip de PE se esconde en soportes que no venden programática.
  const _hayPE=sup.pePorGrupo>0;
  document.getElementById('sLeyendaPEChip').style.display=_hayPE?'inline-block':'none';
  document.getElementById('sLeyendaPE').textContent=_hayPE?((sup.pePorGrupo===1?'PE':'PE1/PE2')+` (máx ${sup.capPE}s)`):'';
  const _exclusivo=sup.unaPautaPorBloque?', 1 pauta por bloque':'';
  // Chip verde del Plus: solo tiene sentido mostrarlo si este soporte repartió
  // espacio ocioso (en uno sobrevendido no hay Plus y el chip sobraría).
  const _plusRepartido=(comp.ajustadas||[]).reduce((a,x)=>a+(x.plusSalidas||0),0);
  document.getElementById('sLeyendaPlusChip').style.display=_plusRepartido?'inline-block':'none';
  document.getElementById('sLeyendaPlus').textContent=_plusRepartido?'Bloque de Plus (espacio ocioso)':'';
  document.getElementById('sLeyendaTrad').textContent=sup.capacidadFija
    ? `Tradicional (${sup.capTRAD_max}s fijos${_exclusivo})`
    : `Tradicional (${sup.capTRAD_min}–${sup.capTRAD_max}s dinámico${_exclusivo})`;
  const barColor=pct>100?'var(--red)':pct>85?'var(--amber)':'var(--accent)';
  document.getElementById('sCapBar').style.width=Math.min(pct,100)+'%'; document.getElementById('sCapBar').style.background=barColor;
  document.getElementById('sCapPct').textContent=pct.toFixed(1)+'%'; document.getElementById('sCapPct').style.color=pct>100?'var(--red)':pct>85?'var(--amber)':'var(--text)';

  renderBloquesGrid(usado, usadoPE);
  if(sBloqueSel>=0 && usado[sBloqueSel]>0) openBloqueDet(sBloqueSel);

  const q=document.getElementById('searchSop').value.trim().toLowerCase();
  const body=document.getElementById('sopBody'); body.innerHTML='';
  const matchQ=texto=>!q||q.split(' ').every(w=>texto.toLowerCase().includes(w));

  // Los clientes de Espacio Fijo (ej. McDonald's) se muestran como UNA sola fila
  // en este soporte, aunque tengan varias campañas activas compartiendo el
  // mismo espacio y aunque el anunciante esté tipeado distinto entre campañas
  // — el desglose por campaña (y sus bloques) se ve al hacer click en la fila,
  // ver openEspacioFijoDetail().
  const noFijas=activas.filter(o=>!o.espacioFijo);
  const fijas=activas.filter(o=>o.espacioFijo);

  const visiblesNormales=noFijas.filter(o=>matchQ(o.anun+' '+(o.camp||'')+' '+(o.id||'')));
  const gruposFijosVisibles=fijas.length && matchQ(fijas.map(o=>o.anun+' '+(o.camp||'')+' '+(o.id||'')).join(' ')) ? [fijas] : [];

  if(visiblesNormales.length===0 && gruposFijosVisibles.length===0){ const totalEnSoporte=ordenes.filter(o=>o.soporte===soporteSeleccionado).length; body.innerHTML=`<tr class="empty-row"><td colspan="14">No hay pautas activas en este soporte. (Total en array: ${totalEnSoporte} líneas, vigentes: ${activas.length})</td></tr>`; }

  gruposFijosVisibles.forEach(grupo=>{ body.appendChild(filaEspacioFijo(grupo,resultado)); });

  visiblesNormales.forEach(o=>{
    const c=calcOrden(o,sup);
    const aj=o.tipo==='PLACE EXCHANGE'?{salidaRealAjustada:c.salidaReal,segAjustados:c.segReales,ajuste:0}:ajustadas.find(a=>a.grupoId===o.grupoId)||{salidaRealAjustada:c.salidaReal,segAjustados:c.segReales,ajuste:0};
    const r=o.tipo==='PLACE EXCHANGE'?{bloques:[],reducido:false,sobreLimite:false}:resultado[o.grupoId]||{bloques:[],reducido:false,sobreLimite:false};
    const diffClass=c.diff===0?'diff-zero':c.diff>0?'diff-pos':'diff-neg'; const diffLabel=c.diff>=0?`+${c.diff}`:`${c.diff}`;
    let blocksHTML='';
    if(o.tipo==='PLACE EXCHANGE'){
      // PE: mostrar en qué slots PE está asignado
      const peSl=slotsPEdeSoporte(soporteSeleccionado);
      const peSlots=[];
      for(let s=0;s<peSl.length;s++){
        if(peSl[s]&&peSl[s].grupoId===o.grupoId) peSlots.push('PE '+slotPEaCodigo(s,sup.pePorGrupo));
      }
      blocksHTML = peSlots.length>0
        ? peSlots.map(s=>`<span class="bl-tag" style="background:var(--pe-light);color:var(--pe-text);border-color:var(--pe-brd)">${s}</span>`).join('')
        : '<span style="color:var(--muted);font-size:11px">— sin slot PE libre</span>';
    } else if(r.bloques.length===0){ blocksHTML='<span style="color:var(--muted);font-size:11px">— sin asignar</span>'; }
    else {
      const cls=r.sobreLimite?'over':r.reducido?'reduced':'';
      // Verde = bloque que le tocó por el Plus (espacio ocioso), no por lo
      // contratado. Mismo color que el badge "+N plus" de la columna de salidas.
      blocksHTML=r.bloques.map((b,i)=>{
        const esPlus=r.plusIdx && r.plusIdx.has(r.bloquesIdx[i]);
        return `<span class="bl-tag ${cls}${esPlus?' plus':''}"${esPlus?' title="Bloque de Plus — del espacio ocioso del soporte"':''}>${b}</span>`;
      }).join('');
      if(r.sobreLimite) blocksHTML+=`<span class="bl-note danger">⚠ Bloque sobre límite</span>`;
      else if(r.reducido) blocksHTML+=`<span class="bl-note">↓ Ajustado al espacio</span>`;
    }
    let ajLabel=''; if(aj.ajuste<0) ajLabel=`<span style="font-size:10px;color:var(--amber)" title="Reducido por exceso de ${sup.pautaXProgSeg} seg/programación">${aj.ajuste}</span>`;
    // Plus: salidas extra que le tocaron del espacio ocioso. Se muestra aparte
    // de las contratadas para que se vea de dónde sale la diferencia.
    if(aj.plusSalidas>0) ajLabel+=`<span class="plus-badge" title="Plus: ${aj.plusBloques} bloque${aj.plusBloques===1?'':'s'} extra del espacio ocioso (${o.tipoCliente||'ESTANDAR'})">+${aj.plusSalidas} plus</span>`;
    const tr=document.createElement('tr');
    const gid=escapeHtml(o.grupoId), sop=escapeHtml(o.soporte);
    tr.innerHTML=`
      <td><div class="anun-name">${escapeHtml(o.anun)}${esPrioCli(o)?'<span class="badge badge-prio">★</span>':''}</div>${o.camp?`<div class="anun-camp">${escapeHtml(o.camp)}</div>`:''}${etiquetaCanales(o,sup)}<div class="anun-id">${escapeHtml(o.id)||'—'}</div></td>
      <td><select class="cell-tc-select" onchange="updateLinea('${gid}','${sop}','tipoCliente',this.value)">
        <option value="ESTANDAR" ${(o.tipoCliente||'ESTANDAR')==='ESTANDAR'?'selected':''}>STD</option>
        <option value="TOP"      ${o.tipoCliente==='TOP'?'selected':''}>TOP</option>
        <option value="NUEVO"    ${o.tipoCliente==='NUEVO'?'selected':''}>NUEVO</option>
      </select></td>
      <td>${tipoBadge(o.tipo)}</td>
      <td><span class="date-range">${fmtDate(o.fi)}</span>${badgeDias(o.ff)}</td>
      <td><input class="cell-input date-input" type="date" value="${escapeHtml(o.ff)}" onchange="updateLinea('${gid}','${sop}','ff',this.value)"></td>
      <td><input class="cell-input" type="number" min="0.5" step="0.5" value="${o.sal}" onchange="updateLinea('${gid}','${sop}','sal',+this.value)"></td>
      <td><input class="cell-input" type="number" min="1" max="120" value="${o.dur}" onchange="updateLinea('${gid}','${sop}','dur',+this.value)"></td>
      <td><span class="mono cell-muted">${fmt2(c.vecesExactas)}</span></td>
      <td><span class="mono">${c.vecesPub}</span></td>
      <td class="col-key-first"><span class="mono">${aj.salidaRealAjustada}</span>${ajLabel}</td>
      <td class="col-key-last"><div class="bloques-cell">${blocksHTML}</div></td>
      <td><span class="mono ${aj.segAjustados>sup.pautaXHoraSeg?'seg-over':''}">${aj.segAjustados||c.segReales}</span></td>
      <td><span class="diff-badge ${diffClass}">${diffLabel}</span></td>
      <td><button class="btn-icon del" onclick="deleteLinea('${gid}','${sop}')" title="Quitar de este soporte">✕</button></td>`;
    body.appendChild(tr);
  });

  // programadas del soporte: cargadas pero que todavía no salieron al aire.
  // No entran en ningún cálculo de capacidad ni tienen bloques asignados; se
  // listan para saber qué va a entrar y cuándo.
  const progS=ordenes.filter(o=>o.soporte===soporteSeleccionado && estaProgramada(o))
                     .sort((a,b)=>String(a.fi).localeCompare(String(b.fi)));
  const pb=document.getElementById('sopProgBody'); pb.innerHTML='';
  document.getElementById('sopProgCount').textContent=`(${progS.length})`;
  document.getElementById('sopProgSection').style.display=progS.length?'':'none';
  progS.forEach(o=>{
    const c=calcOrden(o,sup); const tr=document.createElement('tr'); tr.className='prog-row';
    const gid=escapeHtml(o.grupoId), sop=escapeHtml(o.soporte);
    // Bloques donde va a caer el día que arranque (simulación a esa fecha).
    // Bloques ya RESERVADOS para esta pauta (guardados en la Sheet al cargarla).
    // El día que arranque entra justo acá.
    const idx=bloquesPersistentes[lineId(o)]||[];
    const prevHTML = idx.length
      ? idx.map(j=>`<span class="bl-tag previsto" title="Reservado desde que se cargó la orden. Se mantiene salvo que cambien sus fechas, salidas o duración.">${etiquetaBloque(j)}</span>`).join('')
        + `<span class="bl-note" style="color:#4338ca">reservado · entra el ${fmtDate(o.fi)}</span>`
      : '<span style="color:var(--muted);font-size:11px">— no entra con la ocupación prevista</span>';
    tr.innerHTML=`<td><div class="anun-name">${escapeHtml(o.anun)}${o.camp?' — '+escapeHtml(o.camp):''}<span class="badge badge-prog">Programada</span></div><div class="anun-id">${escapeHtml(o.id)||'—'}</div></td>
      <td>${tcBadge(o.tipoCliente)}</td>
      <td><input class="cell-input date-input" type="date" value="${escapeHtml(o.fi)}" onchange="updateLinea('${gid}','${sop}','fi',this.value)" title="Día en que empieza a ocupar espacio">${badgeInicio(o.fi)}</td>
      <td><input class="cell-input date-input" type="date" value="${escapeHtml(o.ff)}" onchange="updateLinea('${gid}','${sop}','ff',this.value)"></td>
      <td><input class="cell-input" type="number" min="0.5" step="0.5" value="${o.sal}" onchange="updateLinea('${gid}','${sop}','sal',+this.value)"></td>
      <td><input class="cell-input" type="number" min="1" max="120" value="${o.dur}" onchange="updateLinea('${gid}','${sop}','dur',+this.value)"></td>
      <td><span class="mono cell-muted">${c.salidaReal}</span></td>
      <td>${prevHTML}</td>
      <td><button class="btn-icon del" onclick="deleteLinea('${gid}','${sop}')" title="Quitar de este soporte">✕</button></td>`;
    pb.appendChild(tr);
  });

  // finalizadas del soporte
  const finS=ordenes.filter(o=>o.soporte===soporteSeleccionado && estaFinalizada(o));
  const fb=document.getElementById('sopFinBody'); fb.innerHTML=''; document.getElementById('sopFinCount').textContent=`(${finS.length})`;
  finS.forEach(o=>{ const c=calcOrden(o,sup); const tr=document.createElement('tr'); tr.className='fin-row'; const gid=escapeHtml(o.grupoId), sop=escapeHtml(o.soporte); tr.innerHTML=`<td><div class="anun-name" style="color:var(--fin-text)"><span class="fin-checkmark">✓</span>${escapeHtml(o.anun)}${o.camp?' — '+escapeHtml(o.camp):''}</div><div class="anun-id">${escapeHtml(o.id)||'—'}</div></td>
      <td><select class="cell-tc-select" onchange="updateLinea('${gid}','${sop}','tipoCliente',this.value)"><option value="ESTANDAR" ${(o.tipoCliente||'ESTANDAR')==='ESTANDAR'?'selected':''}>STD</option><option value="TOP" ${o.tipoCliente==='TOP'?'selected':''}>TOP</option><option value="NUEVO" ${o.tipoCliente==='NUEVO'?'selected':''}>NUEVO</option></select></td>
      <td><span class="date-range">${fmtDate(o.fi)}</span></td>
      <td><input class="cell-input date-input" type="date" value="${escapeHtml(o.ff)}" onchange="updateLinea('${gid}','${sop}','ff',this.value)" title="Extender para reactivar"></td>
      <td><input class="cell-input" type="number" min="0.5" step="0.5" value="${o.sal}" onchange="updateLinea('${gid}','${sop}','sal',+this.value)"></td>
      <td><input class="cell-input" type="number" min="1" max="120" value="${o.dur}" onchange="updateLinea('${gid}','${sop}','dur',+this.value)"></td>
      <td><span class="mono">${c.salidaReal}</span></td><td><span class="mono">${c.segReales}</span></td>
      <td><button class="btn-icon del" onclick="deleteLinea('${gid}','${sop}')">✕</button></td>`; fb.appendChild(tr); });

  // Panel de alertas integrado
  const aiPanel=document.getElementById('alertsIntegrated');
  const aiList=document.getElementById('alertsIntegratedList');
  const aiHeader=document.getElementById('alertsIntegratedHeader');
  aiList.innerHTML='';
  const todasAlertas=[];
  let hayCap=false;
  if(pct>100){ todasAlertas.push({msg:`Pauta supera ${sup.pautaXProgSeg} seg por ${Math.round(totalProg-sup.pautaXProgSeg)} seg — se ajustaron salidas automáticamente`,danger:true}); hayCap=true; }
  if(sobre>0){ todasAlertas.push({msg:`${sobre} bloque${sobre>1?'s':''} superan los ${sup.capBloque} seg — revisar asignación manual`,danger:true}); }
  alertas.forEach(m=>todasAlertas.push({msg:m.replace('⚠ ',''),danger:false}));
  if(todasAlertas.length===0){ aiPanel.classList.remove('visible','cap-only'); }
  else {
    aiPanel.classList.add('visible');
    aiPanel.classList.toggle('cap-only',hayCap && todasAlertas.length===1);
    aiHeader.textContent=`⚠ ${todasAlertas.length} alerta${todasAlertas.length>1?'s':''} en ${sup.nombre}`;
    aiList.innerHTML=todasAlertas.map(a=>`<div class="alert-row${a.danger?' danger':''}"><span class="alert-icon">${a.danger?'🔴':'🟡'}</span><span class="alert-msg">${escapeHtml(a.msg)}</span></div>`).join('');
  }
}

// Fila única y clickeable para un anunciante de Espacio Fijo (ej. McDonald's),
// consolidando todas sus campañas activas en este soporte. El click abre
// openEspacioFijoDetail() con el desglose por campaña y bloques.
function filaEspacioFijo(grupo,resultado){
  const primero=grupo[0];
  const nombre=nombreMasComun(grupo);
  const durs=new Set(), tcs=new Set(), bloquesSet=new Set();
  grupo.forEach(o=>{
    durs.add(o.dur); tcs.add(o.tipoCliente||'ESTANDAR');
    const r=resultado[o.grupoId]; if(r&&r.bloques) r.bloques.forEach(b=>bloquesSet.add(b));
  });
  const tcUnico=tcs.size===1?[...tcs][0]:null;
  const bloquesOrdenados=[...bloquesSet].sort((a,b)=>indiceBloque(a)-indiceBloque(b));
  const tr=document.createElement('tr'); tr.className='espfijo-row';
  const sop=escapeHtml(primero.soporte);
  const salFijas=salidasEspacioFijo(getSoporte(primero.soporte), grupo);
  tr.innerHTML=`
    <td><div class="anun-name" style="cursor:pointer" onclick="openEspacioFijoDetail('${sop}')" title="Ver y editar las campañas que usan este espacio fijo">📌 ${escapeHtml(nombre)}<span class="badge" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-size:9px">Espacio fijo</span></div><div class="anun-camp">${grupo.length} campaña${grupo.length===1?'':'s'} activa${grupo.length===1?'':'s'} en este espacio</div></td>
    <td>${tcUnico?tcBadge(tcUnico):'<span class="badge-std">VARIOS</span>'}</td>
    <td>${tipoBadge('TRADICIONAL')}</td>
    <td><span class="date-range">Permanente</span></td>
    <td><span class="cell-muted" style="font-size:11px">Sin vencimiento</span></td>
    ${celdaSalEspacioFijo(sop, salFijas)}
    ${celdaDurEspacioFijo(sop, durs)}
    <td><span class="mono cell-muted">—</span></td>
    <td><span class="mono cell-muted">—</span></td>
    <td class="col-key-first"><span class="mono" style="font-weight:600">${salFijas}</span></td>
    <td class="col-key-last"><div class="bloques-cell">${bloquesOrdenados.length?bloquesOrdenados.map(b=>`<span class="bl-tag">${b}</span>`).join(''):'<span style="color:var(--muted);font-size:11px">— sin asignar</span>'}</div></td>
    <td><span class="mono cell-muted">—</span></td>
    <td><span class="mono cell-muted">—</span></td>
    ${accionesEspacioFijo(sop)}`;
  return tr;
}

// Etiqueta de canales (la "restricción" de OnSign). Solo se muestra en la vista
// del circuito y solo cuando la pauta NO sale en todos: si sale en todos, el
// dato no aporta y ensucia la tabla.
function etiquetaCanales(o, sup){
  if(!sup || !sup.esCircuito) return '';
  const cs=o.canales||[];
  if(!cs.length || cs.length===sup.canales.length) return '';
  return `<div class="canales-tag" title="Esta pauta solo se reproduce en estos canales. En los demás ocupa el bloque pero no sale al aire.">`
    + cs.map(c=>`<span class="canal-chip">${escapeHtml(c)}</span>`).join('') + `</div>`;
}

function renderBloquesGrid(usado, usadoPE){
  const sup=getSoporte(soporteSeleccionado);
  const grid=document.getElementById('sBloquesGrid'); grid.innerHTML='';
  usadoPE = usadoPE || Array.from({length:sup.bloquesXProg},(_,j)=>segPEenGrupo(j,soporteSeleccionado));

  // Un sub-bloque PE (morado). En soportes con pePorGrupo=1 el sufijo igual
  // se muestra ("PE A1") para que coincida con lo que se guarda en la Sheet.
  const crearSubPE=(l,sub,seg)=>{
    const el=document.createElement('div');
    el.className='sub-bloque sub-pe'+(seg>0?' sub-pe-activo':'')+(seg>sup.capPE?' sub-sobre':'');
    const pct=Math.min(100,(seg/sup.capPE)*100);
    el.innerHTML=`<div class="sub-label">PE ${l}${sub}</div><div class="sub-seg">${seg||0}s</div><div class="sub-bar"><div class="sub-bar-fill" style="width:${pct}%"></div></div>`;
    return el;
  };

  const _iniciosGrid=iniciosDeCiclo(sup);
  Array.from({length:sup.bloquesXProg},(_,j)=>etiquetaBloque(j)).forEach((l,j)=>{
    if(j>0 && _iniciosGrid.indexOf(j)!==-1){
      const sep=document.createElement('div'); sep.className='bloque-ciclo-sep'; grid.appendChild(sep);
    }

    const pes=usadoPE[j]||new Array(sup.pePorGrupo).fill(0);
    const segPEtotal=pes.reduce((a,b)=>a+b,0);
    const capTrad=capTradReal(j, soporteSeleccionado);
    const tradUsado=usado[j];
    const totalGrupo=segPEtotal+tradUsado;
    const sobreGrupo=totalGrupo>sup.capBloque;

    // Wrapper del Grupo Madre
    const wrap=document.createElement('div');
    wrap.className='grupo-madre'+(sBloqueSel===j?' gm-selected':'');
    wrap.title=`Grupo Madre ${l} — PE:${segPEtotal}s + Pauta:${tradUsado}s = ${totalGrupo}/${sup.capBloque}s`;

    // Letra del grupo
    const lbl=document.createElement('div');
    lbl.className='gm-label'; lbl.textContent=l; wrap.appendChild(lbl);

    // PE que van ARRIBA de la pauta: el primero; en soportes sin PE (MAS BUS) no va ninguno.
    if(sup.pePorGrupo>0) wrap.appendChild(crearSubPE(l,1,pes[0]||0));

    // Sub-bloque Tradicional
    const tradEl=document.createElement('div');
    const tradPct=Math.min(100,(tradUsado/capTrad)*100);
    // Ver si hay spots de espacio fijo en este grupo para pintarlo diferente
    const hayFijoEnGrupo = sActivasTrad && sActivasTrad.some(o=>o.espacioFijo && (sResultado[o.grupoId]||{bloquesIdx:[]}).bloquesIdx.includes(j));
    const tradCls=tradUsado===0?'sub-trad-empty':tradUsado>capTrad?'sub-trad-sobre':hayFijoEnGrupo?'sub-trad-fijo':tradPct>85?'sub-trad-warn':'sub-trad-ok';
    tradEl.className=`sub-bloque sub-trad ${tradCls}`;
    tradEl.innerHTML=`<div class="sub-label">PAUTA ${l}</div><div class="sub-seg">${tradUsado||0}/${capTrad}s</div><div class="sub-bar"><div class="sub-bar-fill" style="width:${tradPct}%"></div></div>`;
    if(tradUsado>0||segPEtotal>0) tradEl.addEventListener('click',()=>toggleBloqueDet(j));
    wrap.appendChild(tradEl);

    // PE restantes, debajo de la pauta (en outdoor es el PE2)
    for(let k=1;k<sup.pePorGrupo;k++) wrap.appendChild(crearSubPE(l,k+1,pes[k]||0));

    // Indicador de sobrecarga del grupo
    if(sobreGrupo){
      const ov=document.createElement('div'); ov.className='gm-over'; ov.textContent='⚠';
      ov.title=`Grupo Madre ${l} supera ${sup.capBloque} seg (${totalGrupo}s)`; wrap.appendChild(ov);
    }
    grid.appendChild(wrap);
  });
}
function toggleBloqueDet(j){ if(sBloqueSel===j){ closeBloqueDet(); return; } sBloqueSel=j; openBloqueDet(j); renderBloquesGrid(sUsado, sUsadoPE); }
function closeBloqueDet(){ sBloqueSel=-1; document.getElementById('sBloqueDetail').classList.remove('open'); renderBloquesGrid(sUsado, sUsadoPE); }
function openBloqueDet(j){
  const sup=getSoporte(soporteSeleccionado);
  const _ubic=cicloDeBloque(sup,j);
  // La capacidad real del bloque baja cuando su PE está ocupado, así que el
  // encabezado no puede comparar contra capBloque a secas.
  const capReal=capTradReal(j, soporteSeleccionado);
  const letra=etiquetaBloque(j), cic=_ubic.ciclo, pos=_ubic.pos, total=sUsado[j], libre=capReal-total;
  document.getElementById('sBloqueDetailLetra').textContent=`Bloque ${letra} — Ciclo ${cic}, posición ${pos} · ${total}/${capReal} seg`;
  const cap=document.getElementById('sBloqueDetailCap'); cap.textContent=total>capReal?`⚠ ${total-capReal} seg sobre límite`:`${libre} seg libres`; cap.className='bloque-detail-cap '+(total>capReal?'over':total>capReal*0.8?'warn':'ok');
  const spots=sActivas.filter(o=>sResultado[o.grupoId]?.bloquesIdx?.includes(j) && o.tipo!=='PLACE EXCHANGE');
  const peSlotsActuales = slotsPEdeSoporte(soporteSeleccionado);
  const pesInfo = Array.from({length:sup.pePorGrupo},(_,k)=>peSlotsActuales[j*sup.pePorGrupo+k]);
  const capTrad = capTradReal(j, soporteSeleccionado);
  const list=document.getElementById('sBloqueDetailList');
  // En capacidad dinámica, un PE vacío le cede sus segundos a la pauta.
  const textoVacioPE = sup.capacidadFija ? '— vacío' : `— vacío (la Pauta absorbe ${sup.capPE}s extra)`;
  const filaPE=(info,sub)=>`<div class="bloque-detail-row" style="border-left:3px solid var(--pe-color)">
    <div><div class="bd-anun" style="color:var(--pe-text)">PE ${letra}${sub} — Place Exchange</div>
    <div class="bd-id">${info?escapeHtml(info.anun)+' · '+info.dur+'s':textoVacioPE}</div></div>
    <span class="bd-dur" style="color:var(--pe-text)">${info?Math.min(info.dur,sup.capPE):0}/${sup.capPE}s</span></div>`;
  let rows='';
  rows += filaPE(pesInfo[0],1);
  // Filas Tradicional
  if(spots.length===0){ rows+=`<div class="bloque-detail-row"><div class="bd-anun" style="color:var(--muted)">Tradicional — vacío</div><span class="bd-dur">0/${capTrad}s</span></div>`; }
  else {
    // El espacio fijo es UNA campaña madre: sus spots rotan dentro del mismo
    // bloque, así que ocupa los segundos del spot más largo, UNA sola vez.
    // Listarlos por separado hacía parecer que McDonald's se comía el bloque
    // (4 campañas × 10s = 40s) cuando en realidad ocupa 10s.
    const fijos=spots.filter(o=>o.espacioFijo);
    const normales=spots.filter(o=>!o.espacioFijo);
    const filaTrad=(labelAnun,labelId,seg,esFijo)=>{
      const pct=Math.round((seg/capTrad)*100);
      const col=esFijo?'var(--amber)':'var(--accent)';
      return `<div class="bloque-detail-row" style="border-left:3px solid ${col}"><div><div class="bd-anun">${labelAnun}</div><div class="bd-id">${labelId}</div></div><div style="display:flex;align-items:center;gap:6px"><div style="width:70px;height:5px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${col}"></div></div><span class="bd-dur">${seg}s</span></div></div>`;
    };
    if(fijos.length){
      const durMax=Math.max(...fijos.map(o=>Number(o.dur)||0));
      const nombreFijo=nombreMasComun(fijos);
      const detalle=fijos.length===1
        ? (fijos[0].camp||'sin nombre de campaña')
        : `${fijos.length} campañas rotando: ${fijos.map(o=>escapeHtml(o.camp||o.anun)).join(' · ')}`;
      rows+=filaTrad(
        `📌 Pauta ${escapeHtml(nombreFijo)}`,
        `Espacio fijo · ocupa ${durMax}s (el spot más largo) · cap trad: ${capTrad}s<br>${detalle}`,
        durMax, true);
    }
    const _supDet=getSoporte(soporteSeleccionado);
    normales.forEach(o=>{
      // En la vista del circuito se aclara en qué canales sale cada pauta.
      const cs=o.canales||[];
      const restringida=_supDet.esCircuito && cs.length && cs.length<_supDet.canales.length;
      const etiqueta=restringida
        ? ' · <span style="color:#c2410c">solo ' + cs.map(escapeHtml).join(', ') + '</span>'
        : '';
      rows+=filaTrad(
        escapeHtml(o.anun)+(o.camp?' — '+escapeHtml(o.camp):''),
        escapeHtml(o.id||'—')+' · '+o.dur+'s · cap trad: '+capTrad+'s'+etiqueta,
        o.dur, false);
    });
  }
  // PE restantes (en outdoor, el PE2 va debajo de la pauta)
  for(let k=1;k<sup.pePorGrupo;k++) rows += filaPE(pesInfo[k],k+1);
  // Total del grupo
  const segPE=pesInfo.reduce((s,info)=>s+(info?Math.min(info.dur,sup.capPE):0),0);
  const totalGM=segPE+total;
  rows+=`<div class="bloque-detail-row" style="background:var(--surface);font-weight:600"><div style="color:var(--muted);font-size:11px">Total Grupo Madre ${letra}</div><span class="bd-dur" style="color:${totalGM>sup.capBloque?'var(--red)':totalGM>sup.capBloque*0.9?'var(--amber)':'var(--text)'}">${totalGM}/${sup.capBloque}s</span></div>`;
  list.innerHTML = rows || '<div class="bloque-detail-empty">No hay datos.</div>';
  document.getElementById('sBloqueDetail').classList.add('open');
}

function updateLinea(grupoId,soporte,campo,val){
  // Si el "soporte" es un circuito no hay una fila que le corresponda: el cambio
  // vale para la campaña entera, en todos sus canales.
  if(getCircuito(soporte)) return updateGrupo(grupoId,campo,val);
  const o=ordenes.find(x=>x.grupoId===grupoId && x.soporte===soporte); if(!o) return;
  if(campo==='ff'||campo==='fi') o[campo]=val; else if(!isNaN(val)&&val>0) o[campo]=val;
  // Cambiar las fechas puede sacar la pauta del aire (o meterla), así que sus
  // bloques se recalculan igual que si cambiara salidas o duración.
  if(campo==='sal'||campo==='dur'||campo==='fi'||campo==='ff'){ delete bloquesPersistentes[lineId(o)]; delete bloquesPEPersistentes[lineId(o)]; o.bloques=[]; }
  guardarLocal(); marcarSync(grupoId); renderActiva();
}
function deleteLinea(grupoId,soporte){
  if(getCircuito(soporte)) return deleteGrupo(grupoId);
  const o=ordenes.find(x=>x.grupoId===grupoId && x.soporte===soporte); if(!o) return;
  if(!confirm(`¿Quitar "${o.anun}" del soporte ${soporte}?`)) return;
  delete bloquesPersistentes[lineId(o)];
  ordenes=ordenes.filter(x=>!(x.grupoId===grupoId && x.soporte===soporte));
  guardarLocal(); marcarEliminado(grupoId,soporte); renderActiva();
}

// ══════════════ VISTA BUSCAR ══════════════
document.getElementById('searchGlobal').addEventListener('input',renderBuscar);
function renderBuscar(){
  const q=document.getElementById('searchGlobal').value.trim().toLowerCase();
  const cont=document.getElementById('buscarResults');
  if(!q){ cont.innerHTML='<div class="buscar-empty">Escribí un anunciante o campaña para ver dónde está exhibida.</div>'; return; }
  const grupos=getGrupos().filter(g=>{ const l=g.lineas[0]; const h=(l.anun+' '+(l.camp||'')+' '+(l.id||'')).toLowerCase(); return q.split(' ').every(w=>h.includes(w)); });
  if(grupos.length===0){ cont.innerHTML='<div class="buscar-empty">No se encontró ninguna pauta con ese nombre.</div>'; return; }
  const computeCache={};
  cont.innerHTML=grupos.map(g=>{
    const l=g.lineas[0];
    const filas=g.lineas.map(o=>{
      if(!computeCache[o.soporte]) computeCache[o.soporte]=computeSoporte(o.soporte);
      const cmp=computeCache[o.soporte]; const sup=cmp.sup;
      const vig=estaVigente(o);
      const r=vig?(cmp.resultado[o.grupoId]||{bloques:[]}):{bloques:[]};
      const aj=vig?(cmp.ajustadas.find(a=>a.grupoId===o.grupoId)||{salidaRealAjustada:calcOrden(o,sup).salidaReal}):{salidaRealAjustada:0};
      const blocks=vig&&r.bloques.length?r.bloques.map(b=>`<span class="bl-tag">${b}</span>`).join(''):'<span style="color:var(--muted);font-size:11px">— sin asignar</span>';
      // Una pauta que todavía no empezó no es lo mismo que una vencida.
      const etiqueta=vig?'':(estaProgramada(o)?`<span class="buscar-sop-finbadge" style="background:#eef2ff;color:#4338ca">empieza ${fmtDate(o.fi)}</span>`:'<span class="buscar-sop-finbadge">finalizada</span>');
      return `<div class="buscar-sop-row ${vig?'':'buscar-sop-fin'}"><div class="buscar-sop-name">${escapeHtml(o.soporte)}${etiqueta}</div><div class="buscar-sop-blocks">${blocks}</div><div class="buscar-sop-stats">${vig?aj.salidaRealAjustada+' sal · '+o.dur+' seg':'—'}</div></div>`;
    }).join('');
    return `<div class="buscar-result"><div class="buscar-result-head"><div class="buscar-result-anun">${escapeHtml(l.anun)}</div>${l.camp?`<div class="buscar-result-camp">${escapeHtml(l.camp)}</div>`:''}<div class="buscar-result-meta">${tcBadge(l.tipoCliente)}${tipoBadge(l.tipo)}</div></div>${filas}</div>`;
  }).join('');
}

// ══════════════ MODAL ORDEN ══════════════
function renderSoportesCheck(seleccionados){
  // El nombre completo solo se muestra cuando aporta algo (ej. Facal → Outdoor
  // Facal). En la mayoría de los soportes es igual al nombre y repetirlo entre
  // paréntesis solo ensucia la lista.
  // Los canales de un circuito van agrupados debajo de un atajo que los marca a
  // todos de una: así se carga "va por todo el circuito" en un solo click, que
  // es como se comercializa. Destildando alguno queda la excepción segmentada.
  let html='';
  const yaPuesto=new Set();
  SOPORTES_REALES.forEach(s=>{
    const circ=circuitoDeCanal(s.nombre);
    if(circ && !yaPuesto.has(circ.nombre)){
      yaPuesto.add(circ.nombre);
      const todos=circ.canales.every(c=>seleccionados.includes(c));
      const algunos=!todos && circ.canales.some(c=>seleccionados.includes(c));
      html+=`<label class="soporte-check-circuito" title="Marca de una los ${circ.canales.length} canales del circuito. Si el cliente compró solo algunos, destildá los que no van.">
        <input type="checkbox" data-circuito="${escapeHtml(circ.nombre)}" ${todos?'checked':''} ${algunos?'data-parcial="1"':''} onchange="toggleCircuitoCheck(this)">
        ◆ ${escapeHtml(circ.etiqueta)} <span class="circ-count">${circ.canales.length} canales</span></label>`;
    }
    const extra = s.nombreCompleto && s.nombreCompleto!==s.nombre
      ? ` <span style="color:var(--muted2);font-size:11px">(${escapeHtml(s.nombreCompleto)})</span>` : '';
    html+=`<label class="soporte-check-item${circ?' es-de-circuito':''}"><input type="checkbox" data-canal="1" value="${escapeHtml(s.nombre)}" ${seleccionados.includes(s.nombre)?'checked':''} onchange="syncCircuitoChecks()">${escapeHtml(s.nombre)}${extra}</label>`;
  });
  document.getElementById('fSoportes').innerHTML=html;
  syncCircuitoChecks();
}
// Marcar el circuito marca sus canales; desmarcarlo los desmarca.
function toggleCircuitoCheck(input){
  const circ=getCircuito(input.dataset.circuito); if(!circ) return;
  document.querySelectorAll('#fSoportes input[data-canal]').forEach(c=>{
    if(circ.canales.indexOf(c.value)!==-1) c.checked=input.checked;
  });
  syncCircuitoChecks();
}
// Deja el check del circuito en su estado real: marcado si están todos, en
// "a medias" (indeterminate) si hay algunos, vacío si ninguno.
function syncCircuitoChecks(){
  document.querySelectorAll('#fSoportes input[data-circuito]').forEach(ci=>{
    const circ=getCircuito(ci.dataset.circuito); if(!circ) return;
    const marcados=circ.canales.filter(cn=>{
      const el=document.querySelector(`#fSoportes input[data-canal][value="${CSS.escape(cn)}"]`);
      return el && el.checked;
    }).length;
    ci.checked = marcados===circ.canales.length;
    ci.indeterminate = marcados>0 && marcados<circ.canales.length;
  });
}
function openOrden(grupoId){
  editandoGrupo=grupoId||null;
  if(grupoId){
    const lineas=ordenes.filter(o=>o.grupoId===grupoId); const l=lineas[0];
    document.getElementById('modalOrdenTitle').textContent='Editar orden';
    document.getElementById('btnSaveOrden').textContent='Guardar cambios';
    document.getElementById('fAnun').value=l.anun; document.getElementById('fCamp').value=l.camp||'';
    document.getElementById('fTipoCliente').value=l.tipoCliente||'ESTANDAR'; document.getElementById('fTipo').value=l.tipo||'TRADICIONAL';
    document.getElementById('fId').value=l.id&&l.id!=='—'?l.id:'';
    document.getElementById('fFechaI').value=valorComun(lineas,'fi')||l.fi||''; document.getElementById('fFechaF').value=valorComun(lineas,'ff')||'';
    document.getElementById('fEspacioFijo').checked=l.espacioFijo||false;
    const sc=valorComun(lineas,'sal'); const dc=valorComun(lineas,'dur');
    document.getElementById('fSal').value=sc!==null?sc:''; document.getElementById('fDur').value=dc!==null?dc:'';
    renderSoportesCheck(lineas.map(o=>o.soporte));
  } else {
    document.getElementById('modalOrdenTitle').textContent='Nueva orden de contratación';
    document.getElementById('btnSaveOrden').textContent='Agregar orden';
    ['fAnun','fCamp','fId','fSal','fDur','fFechaF'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('fEspacioFijo').checked=false;
    document.getElementById('fFechaI').value=hoy().toISOString().split('T')[0];
    document.getElementById('fTipoCliente').value='ESTANDAR'; document.getElementById('fTipo').value='TRADICIONAL';
    renderSoportesCheck([SOPORTES_REALES[0].nombre]);
  }
  document.getElementById('modalOrden').classList.add('open');
}
function closeOrden(){ document.getElementById('modalOrden').classList.remove('open'); editandoGrupo=null; }
function saveOrden(){
  const anun=document.getElementById('fAnun').value.trim();
  const sal=+document.getElementById('fSal').value, dur=+document.getElementById('fDur').value;
  const fi=document.getElementById('fFechaI').value, ff=document.getElementById('fFechaF').value;
  const sops=[...document.querySelectorAll('#fSoportes input[data-canal]:checked')].map(c=>c.value);
  if(!anun||!sal||!dur){ alert('Completá anunciante, salidas y duración.'); return; }
  if(sops.length===0){ alert('Seleccioná al menos un soporte.'); return; }
  if(fi&&ff&&parseFecha(fi)>parseFecha(ff)){ alert('La fecha de inicio no puede ser posterior a la de fin.'); return; }
  const base={ anun, camp:document.getElementById('fCamp').value.trim(), tipoCliente:document.getElementById('fTipoCliente').value, tipo:document.getElementById('fTipo').value, id:document.getElementById('fId').value.trim()||'—', fi, ff, sal, dur, espacioFijo:document.getElementById('fEspacioFijo').checked };
  let gid, eliminados=[];

  if(editandoGrupo){
    gid=editandoGrupo; const existentes=ordenes.filter(o=>o.grupoId===gid).map(o=>o.soporte);
    // quitar soportes deseleccionados
    eliminados=existentes.filter(s=>!sops.includes(s));
    ordenes.filter(o=>o.grupoId===gid && !sops.includes(o.soporte)).forEach(o=>delete bloquesPersistentes[lineId(o)]);
    ordenes=ordenes.filter(o=>!(o.grupoId===gid && !sops.includes(o.soporte)));
    // actualizar/crear
    sops.forEach(s=>{
      let o=ordenes.find(x=>x.grupoId===gid && x.soporte===s);
      if(o){ const cambioCalc=(o.sal!==sal||o.dur!==dur); Object.assign(o,base); if(cambioCalc){ delete bloquesPersistentes[lineId(o)]; delete bloquesPEPersistentes[lineId(o)]; o.bloques=[]; } }
      else { ordenes.push({ grupoId:gid, soporte:s, ...base }); }
    });
  } else {
    gid=nuevoGrupoId();
    sops.forEach(s=>ordenes.push({ grupoId:gid, soporte:s, ...base }));
  }
  closeOrden();
  guardarLocal(); marcarSync(gid); eliminados.forEach(s=>marcarEliminado(gid,s));
  renderActiva();
}
document.getElementById('modalOrden').addEventListener('click',function(e){ if(e.target===this) closeOrden(); });

// ══════════════ CONFIG PRIORITARIOS ══════════════
function openConfig(){ renderPrioList(); document.getElementById('modalConfig').classList.add('open'); }
function closeConfig(){ document.getElementById('modalConfig').classList.remove('open'); }
function renderPrioList(){ const l=document.getElementById('prioList'); if(clientesPrioritarios.length===0){ l.innerHTML='<div class="prio-empty">No hay clientes prioritarios.</div>'; return; } l.innerHTML=clientesPrioritarios.map((p,i)=>`<div class="prio-item"><div>${escapeHtml(p)}</div><button onclick="removePrio(${i})">✕</button></div>`).join(''); }
function addPrio(){ const inp=document.getElementById('prioInput'), v=inp.value.trim(); if(!v) return; if(!clientesPrioritarios.includes(v)){ clientesPrioritarios.push(v); guardarLocal(); renderPrioList(); } inp.value=''; }
function removePrio(i){ clientesPrioritarios.splice(i,1); guardarLocal(); renderPrioList(); }
document.getElementById('modalConfig').addEventListener('click',function(e){ if(e.target===this) closeConfig(); });

// ══════════════ ESPACIO FIJO — DETALLE DE CAMPAÑAS ══════════════
// Un mismo espacio fijo (ej. McDonald's) puede tener varias campañas activas
// a la vez (Big Mac, Tasty, Cuarto de libra...) compartiendo el mismo espacio
// base. Se agrupa por SOPORTE (hoy solo hay un espacio fijo por soporte), no
// por anunciante, para que no importe si alguna campaña quedó tipeada
// distinto (ej. "McDonald's" vs "Mc Donalds"). Este panel muestra todas las
// vigentes en el soporte y en qué bloques quedó cada una.
function openEspacioFijoDetail(soporte){
  const comp=computeSoporte(soporte);
  const sup=comp.sup;
  const grupo=comp.activas.filter(o=>o.espacioFijo);
  const nombre=grupo.length?nombreMasComun(grupo):'Espacio fijo';
  const salFijas=salidasEspacioFijo(sup, grupo);
  const nBloques=bloquesEspacioFijo(sup, grupo);
  // Los spots rotan dentro de los mismos bloques (lo alterna el CMS), así que
  // todos salen en todos los bloques reservados. Lo que se reparte es cuántas
  // veces sale cada uno: las salidas del contrato divididas entre los spots.
  const salPorSpot=()=>grupo.length ? salFijas/grupo.length : 0;
  const fmtSal=(v)=>Number.isInteger(v)?String(v):v.toFixed(1).replace('.0','');
  document.getElementById('efTitle').textContent=`📌 ${nombre} — Espacio fijo en ${soporte}`;
  // Las salidas contratadas se editan acá: si el cliente amplía el contrato,
  // se cambia el número y la app reserva más bloques sola.
  document.getElementById('efMeta').innerHTML=
    `<label style="display:inline-flex;align-items:center;gap:6px">Salidas contratadas:
       <input class="cell-input" type="number" min="1" max="999" value="${salFijas}" style="width:64px;font-weight:600"
              title="Salidas por hora que tiene reservadas este cliente en ${escapeHtml(soporte)}"
              onchange="setSalidasEspacioFijo('${escapeHtml(soporte)}', this.value)"> sal/hora
     </label>
     <span style="color:var(--muted)"> · ${nBloques} bloque${nBloques===1?'':'s'} reservado${nBloques===1?'':'s'} · ${grupo.length} spot${grupo.length===1?'':'s'} rotando dentro de esos bloques. Sumar spots no cambia el espacio: se alternan entre sí.</span>`;
  const list=document.getElementById('efList'); list.innerHTML='';
  if(grupo.length===0){ list.innerHTML='<div class="bloque-detail-empty">No hay campañas activas en este espacio.</div>'; }
  else {
    const ordenados=[...grupo].sort((a,b)=>String(a.grupoId).localeCompare(String(b.grupoId)));
    ordenados.forEach((o)=>{
      const r=comp.resultado[o.grupoId]||{bloques:[]};
      const row=document.createElement('div'); row.className='bloque-detail-row';
      const tituloCamp=escapeHtml(o.camp)||'(sin nombre de campaña)';
      const nombreDistinto=o.anun.toLowerCase()!==nombre.toLowerCase();
      const gid=escapeHtml(o.grupoId), sop=escapeHtml(o.soporte);
      row.innerHTML=`<div><div class="bd-anun">${tituloCamp}${nombreDistinto?` <span style="color:var(--amber);font-weight:500">(cargada como "${escapeHtml(o.anun)}")</span>`:''}</div>
        <div class="bd-id">≈ ${fmtSal(salPorSpot())} sal/hora en la rotación${o.id&&o.id!=='—'?' · '+escapeHtml(o.id):''}</div></div>
        <div style="display:flex;align-items:center;gap:10px">
          <label style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px">Dur.
            <input class="cell-input" type="number" min="1" max="120" value="${o.dur}" style="width:58px"
                   onchange="updateLinea('${gid}','${sop}','dur',+this.value); openEspacioFijoDetail('${sop}')">s</label>
          <div class="bloques-cell">${r.bloques.length?r.bloques.map(b=>`<span class="bl-tag">${b}</span>`).join(''):'<span style="color:var(--muted);font-size:11px">— sin asignar</span>'}</div>
          <button class="btn-icon del" title="Quitar este spot del espacio fijo"
                  onclick="deleteLinea('${gid}','${sop}'); closeEspacioFijoDetail();">✕</button>
        </div>`;
      list.appendChild(row);
    });
  }
  document.getElementById('modalEspacioFijo').classList.add('open');
}
function closeEspacioFijoDetail(){ document.getElementById('modalEspacioFijo').classList.remove('open'); }
document.getElementById('modalEspacioFijo').addEventListener('click',function(e){ if(e.target===this) closeEspacioFijoDetail(); });

// ══════════════ FINALIZADAS TOGGLE ══════════════
function toggleFin(which){
  finOpen[which]=!finOpen[which];
  const ids={ord:['ordFinWrap','ordFinChevron'], sop:['sopFinWrap','sopFinChevron'], prog:['sopProgWrap','sopProgChevron']};
  const [wrap,chev]=ids[which]||ids.sop;
  document.getElementById(wrap).classList.toggle('open',finOpen[which]);
  document.getElementById(chev).classList.toggle('open',finOpen[which]);
}

// ══════════════ INIT ══════════════
// DATOS_ASANA queda solo como red de contención: si la Sheet no responde en
// el primer arranque Y tampoco hay nada en localStorage, se siembra con esto
// para no mostrar la app vacía. No hay ningún botón que lo dispare a mano.

;// ── Agregado al copiar: este motor nunca escribe ni manda nada ──
flushSincronizacion=function(){}; programarFlush=function(){}; marcarSync=function(){}; marcarEliminado=function(){};
avisarCambioBloques=function(){}; avisarExcesoCapacidad=function(){};
