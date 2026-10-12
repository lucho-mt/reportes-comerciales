// Copia el motor de cálculo de la app "Tráfico de Pautas" a motor/trafico-motor.js.
//
// Los reportes calculan con el MISMO código que la app (salidas, Plus, circuito,
// espacio fijo), así los números coinciden. Se usa una copia fija y no el archivo
// en vivo de la app para que nadie pueda cambiar lo que corre en los reportes sin
// pasar por acá.
//
// Uso (con Node):
//   curl -sL https://lalofissore.github.io/Reimpulso/trafico-pautas.html -o /tmp/trafico-pautas.html
//   node herramientas/actualizar-motor.js /tmp/trafico-pautas.html
//
// Después: revisar el diff de motor/trafico-motor.js, probar la página y publicar.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const origen = process.argv[2];
if (!origen) { console.error('Falta la ruta a trafico-pautas.html'); process.exit(1); }
const html = fs.readFileSync(origen, 'utf8');

const ini = html.indexOf('<script>'), fin = html.lastIndexOf('</script>');
if (ini < 0 || fin < 0) { console.error('No se encontró el <script> de la app.'); process.exit(1); }
let codigo = html.slice(ini + 8, fin);

// Se saca el arranque de la app (lee la Sheet, dibuja la pantalla). Los reportes
// cargan los datos por su cuenta.
const arranque = codigo.lastIndexOf('(async()=>{');
if (arranque < 0) { console.error('No se encontró el arranque "(async()=>{" de la app.'); process.exit(1); }
codigo = codigo.slice(0, arranque);

// Funciones que tienen que existir para que el cálculo funcione. Si la app las
// renombra, mejor enterarse acá que con números raros en los reportes.
const necesarias = ['computeSoporte', 'calcOrden', 'seedBloquesDesdeOrdenes', 'invalidarCache', 'getSoporte', 'hoy',
  'flushSincronizacion', 'programarFlush', 'avisarCambioBloques', 'avisarExcesoCapacidad'];
const faltan = necesarias.filter(n => !new RegExp('function\\s+' + n + '\\s*\\(').test(codigo));
if (faltan.length) { console.error('La app cambió: faltan las funciones ' + faltan.join(', ')); process.exit(1); }
if (!/SOPORTES_REALES/.test(codigo)) { console.error('La app cambió: falta SOPORTES_REALES'); process.exit(1); }

// Fuera de la copia: (1) DATOS_ASANA, una lista de respaldo con órdenes reales de
// clientes que este proyecto no necesita y que no debe quedar publicada; (2) la
// dirección del Apps Script, así esta copia no tiene a dónde escribir aunque quisiera.
const antes = codigo.length;
codigo = codigo.replace(/const DATOS_ASANA\s*=\s*\[[\s\S]*?\];\n/, 'const DATOS_ASANA = []; // vaciado al copiar\n');
if (codigo.length === antes) { console.error('No se encontró DATOS_ASANA para vaciarlo.'); process.exit(1); }
codigo = codigo.replace(/const SCRIPT_URL\s*=\s*'[^']*';/, "const SCRIPT_URL = ''; // vaciado al copiar: el motor no escribe");
if (/script\.google\.com/.test(codigo)) { console.error('Quedó una dirección de Apps Script en la copia.'); process.exit(1); }

const sha = crypto.createHash('sha256').update(html).digest('hex');
const fecha = new Date().toISOString().slice(0, 10);
const cabecera = `// COPIA del motor de la app "Tráfico de Pautas" (github.com/LaloFissore/Reimpulso).
// Generado por herramientas/actualizar-motor.js el ${fecha}. NO editar a mano.
// sha256 del trafico-pautas.html original: ${sha}
`;
// Al final se anulan TODAS las funciones que escriben en la planilla o mandan
// mails. Los reportes solo leen: aunque algo del motor intente sincronizar, no sale nada.
const pie = `
;// ── Agregado al copiar: este motor nunca escribe ni manda nada ──
flushSincronizacion=function(){}; programarFlush=function(){}; marcarSync=function(){}; marcarEliminado=function(){};
avisarCambioBloques=function(){}; avisarExcesoCapacidad=function(){};
`;
const raiz = path.join(__dirname, '..');
fs.writeFileSync(path.join(raiz, 'motor', 'trafico-motor.js'), cabecera + codigo + pie);
fs.writeFileSync(path.join(raiz, 'motor', 'version.json'), JSON.stringify({
  fuente: 'https://lalofissore.github.io/Reimpulso/trafico-pautas.html', sha256: sha, copiado: fecha
}, null, 2) + '\n');
console.log('Motor copiado. sha256', sha);
