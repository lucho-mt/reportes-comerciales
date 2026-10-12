// Arma el sitio (index.html + js/app.js) a partir de la plantilla del boceto.
// El boceto trae los datos fijos adentro; el sitio no: los lee de la planilla al abrirse.
//
// Uso: node herramientas/armar-sitio.js   (usa herramientas/plantilla.html)
const fs = require('fs');
const path = require('path');
const tplPath = process.argv[2] || path.join(__dirname, 'plantilla.html');
const raiz = path.join(__dirname, '..');
const tpl = fs.readFileSync(tplPath, 'utf8');

const CHART_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
const CHART_SRI = 'sha384-bs/nf9FbdNouRbMiFcrcZfLXYPKiPaGVGplVbv7dLGECccEXDW+S3zjqSKR5ZEaD';
const CSP = [
  "default-src 'none'",
  "script-src 'self' https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data:",
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com https://lalofissore.github.io",
  "worker-src 'self'",
  "base-uri 'none'", "form-action 'none'", "object-src 'none'", "manifest-src 'none'",
].join('; ');

const finStyle = tpl.indexOf('</style>') + 8;
const iniChart = tpl.indexOf('<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js');
const iniJs = tpl.indexOf('<script>', iniChart) + 8, finJs = tpl.lastIndexOf('</script>');
if (finStyle < 8 || iniChart < 0 || iniJs < 8 || finJs < 0) { console.error('La plantilla no tiene la forma esperada.'); process.exit(1); }

let cabeza = tpl.slice(0, finStyle);
let cuerpo = tpl.slice(finStyle, iniChart);
let js = tpl.slice(iniJs, finJs);

const cambiar = (txt, a, b, nombre) => { if (!txt.includes(a)) { console.error('No se encontró: ' + nombre); process.exit(1); } return txt.replace(a, b); };

// ── Cuerpo: aviso de estado en vivo y pantalla de carga
cuerpo = cuerpo.replace(/<div class="aviso">[\s\S]*?<\/div>/, '<div class="aviso" id="estadoDatos" role="status">Leyendo la planilla…</div>');
cuerpo = cambiar(cuerpo, 'Cálculo hecho con el motor de la app de tráfico, verificado contra la app. Boceto · <span id="fechaFoto2"></span>.',
  'Cálculo hecho con el motor de la app de tráfico. Leído el <span id="fechaFoto2"></span>.', 'pie');
cuerpo = cambiar(cuerpo, '<main class="wrap">', `<div class="cargando" id="cargando" role="status" aria-live="polite">
  <div class="cargando-caja"><b id="cargandoTexto">Leyendo la planilla de Tráfico de Pautas…</b>
  <div class="cargando-barra"><span id="cargandoBarra"></span></div>
  <span class="cargando-nota">Los datos se leen en vivo cada vez que abrís la página.</span></div>
</div>
<main class="wrap">`, 'main');

// ── JS: los datos llegan de la planilla, la fecha es la de hoy
js = cambiar(js, '/*DATA*/\nconst DATA=DATOS.meses;', 'const DATA=DATOS.meses;', 'DATA');
js = cambiar(js, "const FOTO='2026-10-12', MES_HOY=FOTO.slice(0,7);",
  "const _h=DATOS.leido, FOTO=`${_h.getFullYear()}-${String(_h.getMonth()+1).padStart(2,'0')}-${String(_h.getDate()).padStart(2,'0')}`, MES_HOY=FOTO.slice(0,7);\nconst FOTO_TXT=`${FOTO.slice(8)}/${FOTO.slice(5,7)}/${FOTO.slice(0,4)} a las ${String(_h.getHours()).padStart(2,'0')}:${String(_h.getMinutes()).padStart(2,'0')}`;", 'FOTO');
js = cambiar(js, "let mes='2026-09',", "let mes=(()=>{ const ks=Object.keys(DATOS.meses).sort(), i=ks.indexOf(FOTO.slice(0,7)); return i>0?ks[i-1]:ks[0]; })(),", 'mes inicial');
js = cambiar(js, "document.getElementById('fechaFoto').textContent=document.getElementById('fechaFoto2').textContent='12/10/2026';\ndocument.querySelectorAll('.fechaFotoX').forEach(e=>e.textContent='12/10/2026');",
  "document.getElementById('fechaFoto2').textContent=FOTO_TXT;\ndocument.querySelectorAll('.fechaFotoX').forEach(e=>e.textContent=FOTO_TXT);\ndocument.getElementById('estadoDatos').textContent=`Datos de la planilla de Tráfico de Pautas leídos el ${FOTO_TXT} (${DATOS.cantidadOrdenes} órdenes). Los meses que vienen muestran lo cargado hasta hoy. Las órdenes dadas de baja no figuran.`;", 'fechas');

const app = `// Reportes Comerciales · Reimpulso. Generado por herramientas/armar-sitio.js: los cambios se hacen en la plantilla.
'use strict';
(async function iniciar(){
  const caja=document.getElementById('cargando'), texto=document.getElementById('cargandoTexto'), barra=document.getElementById('cargandoBarra');
  let DATOS;
  try {
    DATOS = await rcCargarTodo((t,h,n)=>{ texto.textContent=t+(n>1?\` \${h} de \${n}\`:''); barra.style.width=(n?Math.round(h/n*100):0)+'%'; });
  } catch (e) {
    texto.textContent='No se pudieron cargar los datos. '+(e&&e.message?e.message:'')+' Probá recargar la página en unos minutos.';
    caja.classList.add('error'); return;
  }
  caja.hidden=true;
${js}
  rcControlarMotor().then(r=>{ if(r&&r.cambio){ const p=document.createElement('p'); p.className='aviso-motor';
    p.textContent='La app de tráfico cambió desde que se copió su motor ('+r.copiado+'). Los números pueden no coincidir: hay que actualizar el motor.';
    document.querySelector('.side-foot').prepend(p); } });
})();
`;

// ── Cabeza: documento completo, política de seguridad y estilos de la carga
cabeza = cambiar(cabeza, '<title>', `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="color-scheme" content="light dark">
<title>`, 'title');
cabeza = cambiar(cabeza, '</style>', `.cargando{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:var(--bg);padding:20px}
.cargando[hidden]{display:none}
.cargando-caja{display:flex;flex-direction:column;gap:12px;width:min(420px,100%);font-size:15px}
.cargando-barra{height:6px;border-radius:3px;background:var(--libre);overflow:hidden}
.cargando-barra span{display:block;height:100%;width:0;background:var(--contr);transition:width .3s}
.cargando-nota{font-size:12.5px;color:var(--muted)}
.cargando.error .cargando-barra{display:none}
.aviso-motor{margin:0 0 10px;color:#f6c76b;font-size:11.5px}
</style>`, 'fin style');

const html = `${cabeza}
</head>
<body>
${cuerpo}
<script src="${CHART_SRC}" integrity="${CHART_SRI}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="js/datos.js"></script>
<script src="js/app.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(raiz, 'index.html'), html);
fs.writeFileSync(path.join(raiz, 'js', 'app.js'), app);
// control: que el JS sea válido y que no haya quedado ningún dato embebido
new Function(app);
if (/"anun":|const DATOS\s*=/.test(html + app)) { console.error('Quedaron datos embebidos.'); process.exit(1); }
console.log('Sitio armado:', html.length, 'bytes de HTML,', app.length, 'de JS');
