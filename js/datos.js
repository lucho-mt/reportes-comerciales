// Lectura de la planilla de Tráfico de Pautas y cálculo de los meses.
//
// Seguridad:
// - Solo LEE. Usa fetch() y recibe JSON, que se trata como datos: nunca se
//   ejecuta nada de lo que llega (la app de tráfico usa JSONP, que sí ejecuta lo
//   que manda el servidor; acá no hace falta porque la planilla permite CORS).
// - Cada orden se valida y se limpia: solo pasan los campos conocidos, con el
//   tipo y el formato esperado. Lo demás se descarta.
// - El cálculo corre en un Web Worker con el motor de la app copiado en
//   motor/trafico-motor.js, sin acceso a la red.
'use strict';

const RC_FUENTE = 'https://script.google.com/macros/s/AKfycbwh7vXUAfW2XiuWnvSrbFEG-vRuU6KKzKMjNlQq_dhPvHeKvHhW3-EWQ1QltzKCI1HhYg/exec?accion=listar';
const RC_APP_TRAFICO = 'https://lalofissore.github.io/Reimpulso/trafico-pautas.html';
const RC_PRIMER_MES = '2026-06'; // antes de junio de 2026 la planilla casi no tiene órdenes
const RC_MESES_ADELANTE = 5;     // meses que se muestran después del actual (vista Disponible)

const rcTexto = (v, max = 200) => (typeof v === 'string' || typeof v === 'number') ? String(v).trim().slice(0, max) : '';
const rcNumero = (v, max = 100000) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= max ? n : 0; };
const rcFecha = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) ? v.trim() : '';
const rcBloques = v => Array.isArray(v) ? v.filter(b => typeof b === 'string' && /^[A-Z]{1,2}\d?$/.test(b)).slice(0, 200) : [];

function rcLimpiarOrden(o) {
  if (!o || typeof o !== 'object') return null;
  const soporte = rcTexto(o.soporte, 80);
  if (!soporte) return null;
  return {
    soporte,
    id: rcTexto(o.id, 60),
    anun: rcTexto(o.anun, 120),
    camp: rcTexto(o.camp, 160),
    tipo: rcTexto(o.tipo, 40).toUpperCase(),
    tipoCliente: ['ESTANDAR', 'TOP', 'NUEVO'].includes(rcTexto(o.tipoCliente, 20).toUpperCase()) ? rcTexto(o.tipoCliente, 20).toUpperCase() : 'ESTANDAR',
    grupoId: rcTexto(o.grupoId, 80),
    fi: rcFecha(o.fi),
    ff: rcFecha(o.ff),
    sal: rcNumero(o.sal, 10000),
    dur: rcNumero(o.dur, 600),
    espacioFijo: o.espacioFijo === true,
    bloques: rcBloques(o.bloques),
    bloquesReservados: rcBloques(o.bloquesReservados),
  };
}

async function rcLeerPlanilla() {
  const ctrl = new AbortController();
  const plazo = setTimeout(() => ctrl.abort(), 30000);
  let resp;
  try {
    resp = await fetch(RC_FUENTE, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'La planilla tardó más de 30 segundos en responder.' : 'No se pudo conectar con la planilla.');
  } finally { clearTimeout(plazo); }
  if (!resp.ok) throw new Error('La planilla respondió con un error (' + resp.status + ').');
  const texto = await resp.text();
  if (texto.length > 20000000) throw new Error('La respuesta de la planilla es demasiado grande.');
  let json;
  try { json = JSON.parse(texto); } catch (e) { throw new Error('La planilla no devolvió datos válidos.'); }
  if (!json || json.ok !== true || !Array.isArray(json.ordenes)) throw new Error('La planilla no devolvió la lista de órdenes.');
  if (json.ordenes.length > 50000) throw new Error('La planilla devolvió más órdenes de las esperadas.');
  return json.ordenes.map(rcLimpiarOrden).filter(Boolean);
}

function rcMesesACalcular(hoy) {
  const actual = hoy.getFullYear() * 12 + hoy.getMonth();
  const [y0, m0] = RC_PRIMER_MES.split('-').map(Number);
  const desde = Math.min(y0 * 12 + m0 - 1, actual), hasta = actual + RC_MESES_ADELANTE, meses = [];
  for (let k = desde; k <= hasta; k++) meses.push(`${Math.floor(k / 12)}-${String(k % 12 + 1).padStart(2, '0')}`);
  return meses;
}

// Lee la planilla y calcula todos los meses. avance(texto, hechos, total) informa el progreso.
async function rcCargarTodo(avance) {
  const hoy = new Date();
  avance('Leyendo la planilla de Tráfico de Pautas…', 0, 1);
  const ordenes = await rcLeerPlanilla();
  const meses = rcMesesACalcular(hoy);
  const resultado = { meses: {}, cantidadOrdenes: ordenes.length, leido: hoy };
  await new Promise((ok, mal) => {
    const w = new Worker('js/calculo-worker.js');
    const corte = setTimeout(() => { w.terminate(); mal(new Error('El cálculo tardó demasiado.')); }, 180000);
    w.onmessage = e => {
      const m = e.data || {};
      if (m.tipo === 'mes') { resultado.meses[m.mes] = m.datos; avance('Calculando los meses…', m.hechos, m.total); }
      else if (m.tipo === 'listo') { clearTimeout(corte); w.terminate(); ok(); }
      else if (m.tipo === 'error') { clearTimeout(corte); w.terminate(); mal(new Error('Error en el cálculo: ' + m.mensaje)); }
    };
    w.onerror = e => { clearTimeout(corte); w.terminate(); mal(new Error('No se pudo iniciar el cálculo.')); };
    w.postMessage({ tipo: 'calcular', ordenes, meses });
  });
  return resultado;
}

// Avisa si la app de tráfico cambió desde que se copió su motor (los números
// podrían dejar de coincidir). No bloquea nada: solo informa.
async function rcControlarMotor() {
  try {
    const [v, html] = await Promise.all([
      fetch('motor/version.json', { cache: 'no-store' }).then(r => r.json()),
      fetch(RC_APP_TRAFICO, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(r => r.ok ? r.arrayBuffer() : null),
    ]);
    if (!html || !v || !v.sha256) return null;
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', html))].map(b => b.toString(16).padStart(2, '0')).join('');
    return { cambio: hash !== v.sha256, copiado: v.copiado };
  } catch (e) { return null; }
}
