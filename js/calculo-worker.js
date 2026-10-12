// Corre el motor de la app de tráfico en segundo plano (Web Worker), así la
// página no se congela mientras calcula. Recibe las órdenes ya validadas y
// devuelve, mes por mes, la capacidad, lo contratado y el Plus de cada soporte.
//
// El motor está pensado para una página con pantalla: acá no hay pantalla, así
// que todo lo que toque la pantalla cae en un objeto que no hace nada.
'use strict';
const nada = new Proxy(function () {}, {
  get: (t, k) => k === Symbol.toPrimitive ? () => '' : k === Symbol.iterator ? function* () {} : k === 'length' ? 0 : nada,
  apply: () => nada, construct: () => nada, set: () => true,
});
self.document = nada;
self.window = nada;
self.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
self.alert = () => {};
self.confirm = () => false;
// Nada sale a la red desde acá: el motor solo calcula.
self.fetch = () => Promise.reject(new Error('El cálculo de reportes no usa la red.'));
self.XMLHttpRequest = undefined;

importScripts('../motor/trafico-motor.js');

const segundosA = n => Math.round(n);

// Igual que computeSoporte en la app, pero para un día cualquiera.
function calcularDia(fecha, ordenesJSON) {
  const [y, m, d] = fecha.split('-').map(Number);
  hoy = () => new Date(y, m - 1, d);
  ordenes = JSON.parse(ordenesJSON);
  bloquesPersistentes = {}; bloquesPEPersistentes = {}; bloquesPE = {};
  seedBloquesDesdeOrdenes();
  invalidarCache();
  const out = {};
  SOPORTES_REALES.forEach(sp => {
    const c = computeSoporte(sp.nombre), sup = getSoporte(sp.nombre), H = sup.hsOn, P = sup.progsXHora;
    const fijas = c.activasTrad.filter(o => o.espacioFijo);
    const durMaxF = fijas.length ? Math.max(...fijas.map(o => Number(o.dur) || 0)) : 0;
    const lineas = c.activasTrad.map(o => {
      const r = c.resultado[o.grupoId] || { bloquesIdx: [] };
      const nBl = (r.bloquesIdx || []).length, nPlus = r.plusIdx ? r.plusIdx.size : 0;
      if (o.espacioFijo) { // campaña madre: se cuenta una vez, con el spot más largo, repartida entre sus spots
        const sal = nBl * P / fijas.length;
        return { anun: o.anun, camp: o.camp, tc: o.tipoCliente || 'ESTANDAR', fijo: true, dur: durMaxF, contrSal: sal, plusSal: 0, contrSeg: sal * durMaxF * H, plusSeg: 0 };
      }
      const dur = Number(o.dur) || 0, contr = calcOrden(o, sup).salidaReal, plus = nPlus * P;
      return { anun: o.anun, camp: o.camp, tc: o.tipoCliente || 'ESTANDAR', fijo: false, dur, contrSal: contr, plusSal: plus, contrSeg: contr * dur * H, plusSeg: plus * dur * H };
    });
    const b = c.balance;
    out[sp.nombre] = { capTrad: b.trad.cap * P * H, usadoBloques: b.trad.usado * P * H, capPE: b.pe.cap * P * H, peVend: b.pe.usado * P * H, circuito: c.circuito || null, lineas };
  });
  return out;
}

function tipoDe(sp, circuito) {
  return sp.bloquesXProg === 24 ? 'WTC Ascensores' : sp.bloquesXProg === 33 ? 'Gran formato 60 min'
    : sp.bloquesXProg === 11 ? (circuito ? 'Circuito Deportivo' : 'Deportivo') : sp.hsOn === 15 ? 'Outdoor' : 'WTC Verticales';
}

function calcularMes(mes, ordenesJSON) {
  const [y, m] = mes.split('-').map(Number), nd = new Date(y, m, 0).getDate();
  const dias = [...Array(nd)].map((_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`);
  const porDia = dias.map(d => calcularDia(d, ordenesJSON));
  const soportes = SOPORTES_REALES.map(sp => {
    const n = sp.nombre, D = porDia.map(x => x[n]), camp = new Map();
    D.forEach(x => x.lineas.forEach(l => {
      const k = String(l.anun).trim().toLowerCase() + '|' + String(l.camp || '').trim().toLowerCase() + '|' + l.dur;
      let c = camp.get(k);
      if (!c) { c = { anun: l.anun, camp: l.camp, tc: l.tc, fijo: l.fijo, dur: l.dur, contrSalH: 0, plusSalHMax: 0, dias: 0, contrSeg: 0, plusSeg: 0 }; camp.set(k, c); }
      c.dias++; c.contrSeg += l.contrSeg; c.plusSeg += l.plusSeg; c.plusSalHMax = Math.max(c.plusSalHMax, l.plusSal); c.contrSalH = Math.max(c.contrSalH, l.contrSal);
    }));
    return {
      nombre: n, tipo: tipoDe(sp, D[0].circuito), circuito: D[0].circuito, hsOn: sp.hsOn, progsXHora: sp.progsXHora, bloques: sp.bloquesXProg,
      diario: D.map(x => ({
        capTrad: segundosA(x.capTrad), contr: segundosA(x.lineas.reduce((a, l) => a + l.contrSeg, 0)), plus: segundosA(x.lineas.reduce((a, l) => a + l.plusSeg, 0)),
        usadoBloques: segundosA(x.usadoBloques), capPE: segundosA(x.capPE), peVend: segundosA(x.peVend),
      })),
      campanias: [...camp.values()].map(c => ({ ...c, contrSalH: Math.round(c.contrSalH * 100) / 100, contrSeg: segundosA(c.contrSeg), plusSeg: segundosA(c.plusSeg) }))
        .sort((a, b) => (b.contrSeg + b.plusSeg) - (a.contrSeg + a.plusSeg)),
    };
  });
  return { dias, soportes };
}

self.onmessage = e => {
  const { tipo, ordenes: lista, meses } = e.data || {};
  if (tipo !== 'calcular' || !Array.isArray(lista) || !Array.isArray(meses)) return;
  const json = JSON.stringify(lista);
  try {
    meses.forEach((mes, i) => {
      if (!/^\d{4}-\d{2}$/.test(mes)) return;
      self.postMessage({ tipo: 'mes', mes, datos: calcularMes(mes, json), hechos: i + 1, total: meses.length });
    });
    self.postMessage({ tipo: 'listo' });
  } catch (err) {
    self.postMessage({ tipo: 'error', mensaje: String(err && err.message || err) });
  }
};
