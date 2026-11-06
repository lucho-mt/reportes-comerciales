// Reportes Comerciales · Reimpulso. Generado por herramientas/armar-sitio.js: los cambios se hacen en la plantilla.
'use strict';
(async function iniciar(){
  const caja=document.getElementById('cargando'), texto=document.getElementById('cargandoTexto'), barra=document.getElementById('cargandoBarra');
  let DATOS;
  try {
    DATOS = await rcCargarTodo((t,h,n)=>{ texto.textContent=t+(n>1?` ${h} de ${n}`:''); barra.style.width=(n?Math.round(h/n*100):0)+'%'; });
  } catch (e) {
    texto.textContent='No se pudieron cargar los datos. '+(e&&e.message?e.message:'')+' Probá recargar la página en unos minutos.';
    caja.classList.add('error'); return;
  }
  caja.hidden=true;

const DATA=DATOS.meses;
const _h=DATOS.leido, FOTO=`${_h.getFullYear()}-${String(_h.getMonth()+1).padStart(2,'0')}-${String(_h.getDate()).padStart(2,'0')}`, MES_HOY=FOTO.slice(0,7);
const FOTO_TXT=`${FOTO.slice(8)}/${FOTO.slice(5,7)}/${FOTO.slice(0,4)} a las ${String(_h.getHours()).padStart(2,'0')}:${String(_h.getMinutes()).padStart(2,'0')}`;
const NOM=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
const LISTA_MESES=Object.keys(DATA).sort();
const nomMesL=m=>NOM[+m.slice(5)-1];
const MESES=Object.fromEntries(LISTA_MESES.map(m=>[m,nomMesL(m)[0].toUpperCase()+nomMesL(m).slice(1)+' '+m.slice(0,4)]));
const corto=m=>nomMesL(m).slice(0,3)+(m.slice(0,4)!==LISTA_MESES[0].slice(0,4)?' '+m.slice(2,4):'');
const mesAnterior=m=>{ const i=LISTA_MESES.indexOf(m); return i>0?LISTA_MESES[i-1]:null; };
const sopDe=(m,n)=>DATA[m].soportes.find(s=>s.nombre===n);
// Normaliza el nombre del anunciante para juntar grafías distintas (MCDONALDS / McDonald's, SC Jhonson / Sc Jhonson).
const claveAn=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
let vista='sop', anunSel=null, anunPedido=null, verTodasAn=false, buscaAn='';
try{ const h=location.hash.slice(1); if(['sop','anun','disp','ons'].includes(h)) vista=h; }catch(e){}
const GRUPOS=['Outdoor','WTC Ascensores','WTC Verticales','Circuito Deportivo','Gran Formato deportivo','Gran formato 60 min'];
const tipoDe=s=>s.tipo==='Deportivo'?'Gran Formato deportivo':s.tipo;
const fmt=n=>Math.round(n).toLocaleString('es-UY');
const pct=n=>(isFinite(n)?Math.round(n*100):0)+'%';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
const NOMBRES=DATA[Object.keys(DATA)[0]].soportes.map(s=>s.nombre);
let mes=(()=>{ const ks=Object.keys(DATOS.meses).sort(), i=ks.indexOf(FOTO.slice(0,7)); return i>0?ks[i-1]:ks[0]; })(), simDur=10, verTodas=false, sel=new Set(NOMBRES), foco=null, charts={}, visto={}, intro={dia:true,plus:true,mes:true,anSop:true,anHist:true};
try{ const g=JSON.parse(localStorage.getItem('rc_sel')||'null'); if(Array.isArray(g)&&g.length){ const v=g.filter(n=>NOMBRES.includes(n)); if(v.length) sel=new Set(v); } }catch(e){}
const guardarSel=()=>{ try{localStorage.setItem('rc_sel',JSON.stringify([...sel]));}catch(e){} };

const soportesMes=()=>DATA[mes].soportes;
const elegidos=()=>soportesMes().filter(s=>sel.has(s.nombre));
// Lo que muestran las secciones 2 a 4: el soporte tocado en la tabla, o la suma de los elegidos en el filtro.
const enfocados=()=>foco&&sel.has(foco)?soportesMes().filter(s=>s.nombre===foco):elegidos();
function enfocar(n){ foco=(foco===n)?null:n; renderTabla(); renderDetalle(); }
// contr = lo vendido (puede pasar la capacidad); aire = lo vendido que entra; plus = el Plus que entra (ver plusVisible).
function tot(s){ const r={cap:0,contr:0,plus:0,aire:0,pe:0,capPE:0,diasExc:0};
  s.diario.forEach(d=>{ r.cap+=d.capTrad; r.contr+=d.contr; r.plus+=plusVisible(d); r.aire+=Math.min(d.contr,d.capTrad); r.pe+=d.peVend; r.capPE+=d.capPE; if(d.contr>d.capTrad+1) r.diasExc++; });
  return r; }
function estado(o,diasExc=0){ if(o>1.005) return '<span class="pill exc">Sobrevendido</span>';
  if(diasExc) return `<span class="pill exc" title="El mes da ${pct(o)}, pero ${diasExc} día${diasExc===1?'':'s'} se vendió más de lo que entra">Sobrevendido ${diasExc} día${diasExc===1?'':'s'}</span>`; if(o>=.85) return '<span class="pill alto">Casi lleno</span>'; return '<span class="pill ok">Con lugar</span>'; }
function nombreSel(){ const n=sel.size; if(n===0) return 'ningún soporte elegido'; if(n===NOMBRES.length) return 'Todos los soportes';
  for(const g of GRUPOS){ const m=NOMBRES.filter(x=>tipoDe(soportesMes().find(s=>s.nombre===x))===g); if(m.length===n && m.every(x=>sel.has(x))) return g; }
  return n===1?[...sel][0]:n+' soportes'; }

// ───── Revelado: cada sección se anima la primera vez que entra en pantalla
const io=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ visto[e.target.id]=true; io.unobserve(e.target); revelar(e.target.id); } }),{threshold:.15}):null;
function revelar(id){ if(id==='s1') animarBarras('#tblSop .bar'); if(id==='s2') dibujarDia(); if(id==='s4'){ dibujarPlus(); animarBarras('#plusTipo .bar'); } if(id==='sMes') dibujarMes(); if(id==='sA1') animarBarras('#tblAn .bar'); if(id==='sA2'){ dibujarAnSop(); dibujarAnHist(); } }
['s1','s2','s4','sMes','sA1','sA2'].forEach(id=>{ if(io) io.observe(document.getElementById(id)); else visto[id]=true; });
// Cada barra crece de izquierda a derecha como un solo trazo: primero el azul y, donde termina, sigue el verde (o el rojo).
// Todos los tramos van a la misma velocidad, así no hay saltos. Cada fila arranca un poquito después que la anterior.
function animarBarras(scope){
  const spans=[...document.querySelectorAll(scope+' span[data-w]')];
  if(REDUCE){ spans.forEach(s=>{ s.style.width=s.dataset.w; }); return; }
  const VEL=1300; // ms que tardaría un tramo de 100%
  document.querySelectorAll(scope).forEach((bar,i)=>{ let t=i*70;
    bar.querySelectorAll('span[data-w]').forEach(s=>{ const d=Math.max(80,parseFloat(s.dataset.w)/100*VEL);
      s.style.transition=`width ${d}ms linear ${t}ms`; t+=d; }); });
  document.querySelectorAll(scope).forEach(bar=>{ const ss=[...bar.querySelectorAll('span[data-w]')].filter(s=>parseFloat(s.dataset.w)>0); ss.forEach((s,i)=>s.classList.toggle('fin',i===ss.length-1)); });
  requestAnimationFrame(()=>requestAnimationFrame(()=>spans.forEach(s=>{ s.style.width=s.dataset.w; })));
}

// ───── Filtro de soportes
function armarFiltro(){
  const sops=soportesMes();
  const pop=document.getElementById('pop');
  pop.innerHTML=`<div class="pop-acc"><button type="button" data-acc="todos">Elegir todos</button><button type="button" data-acc="ninguno">Limpiar</button></div>`+
    GRUPOS.map((g,gi)=>{ const ms=sops.filter(s=>tipoDe(s)===g); if(!ms.length) return '';
      return `<div class="grupo"><label class="grupo-h"><input type="checkbox" id="g${gi}" data-grupo="${esc(g)}">${esc(g)} <span style="color:var(--muted);font-weight:400">(${ms.length})</span></label>
        <div class="grupo-items">${ms.map((s,i)=>`<label><input type="checkbox" id="s${gi}_${i}" data-sop="${esc(s.nombre)}">${esc(s.nombre)}</label>`).join('')}</div></div>`; }).join('');
  pop.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>{ sel=b.dataset.acc==='todos'?new Set(NOMBRES):new Set(); aplicarFiltro(); });
  pop.querySelectorAll('[data-sop]').forEach(c=>c.onchange=()=>{ c.checked?sel.add(c.dataset.sop):sel.delete(c.dataset.sop); aplicarFiltro(); });
  pop.querySelectorAll('[data-grupo]').forEach(c=>c.onchange=()=>{ sops.filter(s=>tipoDe(s)===c.dataset.grupo).forEach(s=>c.checked?sel.add(s.nombre):sel.delete(s.nombre)); aplicarFiltro(); });
  sincronizarFiltro();
}
function sincronizarFiltro(){
  const pop=document.getElementById('pop');
  pop.querySelectorAll('[data-sop]').forEach(c=>{ c.checked=sel.has(c.dataset.sop); });
  pop.querySelectorAll('[data-grupo]').forEach(c=>{ const ms=soportesMes().filter(s=>tipoDe(s)===c.dataset.grupo).map(s=>s.nombre);
    const n=ms.filter(x=>sel.has(x)).length; c.checked=n===ms.length; c.indeterminate=n>0&&n<ms.length; });
  document.getElementById('filtroResumen').textContent=sel.size===NOMBRES.length?'Todos ('+NOMBRES.length+')':sel.size===0?'Ninguno':nombreSel();
  const chips=document.getElementById('chips');
  if(sel.size===NOMBRES.length||sel.size===0){ chips.innerHTML=''; return; }
  chips.innerHTML=[...sel].map(n=>`<span class="chip">${esc(n)}<button type="button" data-q="${esc(n)}" aria-label="Quitar ${esc(n)}">×</button></span>`).join('')+
    `<span class="chip" style="padding-right:11px"><button type="button" data-todos style="color:var(--contr);padding:0">Ver todos</button></span>`;
  chips.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ sel.delete(b.dataset.q); if(!sel.size) sel=new Set(NOMBRES); aplicarFiltro(); const otro=document.querySelector('#chips button'); (otro||document.getElementById('filtro').querySelector('summary')).focus(); });
  chips.querySelector('[data-todos]').onclick=()=>{ sel=new Set(NOMBRES); aplicarFiltro(); };
}
function aplicarFiltro(){ if(foco&&!sel.has(foco)) foco=null; guardarSel(); sincronizarFiltro(); renderTodo(); }
document.addEventListener('click',e=>{ const f=document.getElementById('filtro'); if(f.open && !f.contains(e.target)) f.open=false; });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ document.getElementById('filtro').open=false; if(document.getElementById('side').classList.contains('abierta')){ abrirMenu(false); document.getElementById('btnMenu').focus(); } } });

// ───── 1 · Tabla de soportes
function renderTabla(){
  const rows=elegidos().map(s=>({s,t:tot(s)})).sort((a,b)=>b.t.contr/b.t.cap-a.t.contr/a.t.cap);
  const tb=document.querySelector('#tblSop tbody'), tf=document.querySelector('#tblSop tfoot');
  if(!rows.length){ tb.innerHTML='<tr><td colspan="8" class="vacio">No hay soportes elegidos. Usá el filtro de arriba.</td></tr>'; tf.innerHTML=''; return; }
  const ant=mesAnterior(mes); document.getElementById('thDelta').textContent=ant?'vs. '+nomMesL(ant):'vs. mes anterior';
  const delta=(n,oc)=>{ if(!ant) return '<span class="delta eq">—</span>'; const s=n?sopDe(ant,n):null;
    const tA=n?tot(s):elegidos().map(x=>tot(sopDe(ant,x.nombre))).reduce((a,x)=>({cap:a.cap+x.cap,contr:a.contr+x.contr}),{cap:0,contr:0});
    return deltaHTML(oc, tA.cap?tA.contr/tA.cap:0, nomMesL(ant)); };
  // La barra entera es el 100% de la capacidad. Sobrevendido: barra roja completa y cuánto se pasó.
  const barra=(t)=>{ const oc=t.contr/t.cap, W=v=>(Math.max(0,Math.min(v,1))*100).toFixed(2)+'%';
    if(oc>1) return `<div class="bar" title="Contratado ${pct(oc)}: se vendió más de lo que entra"><span class="x" style="left:0" data-w="100%"></span><b class="sobra">+${pct(oc-1)}</b></div>`;
    return `<div class="bar" title="Contratado ${pct(oc)} · con Plus ${pct((t.contr+t.plus)/t.cap)}"><span class="c" style="left:0" data-w="${W(oc)}"></span>${t.plus>0?`<span class="p" style="left:${W(oc)}" data-w="${W(Math.min(t.plus/t.cap,1-oc))}"></span>`:''}</div>`; };
  tb.innerHTML=rows.map(({s,t})=>`<tr tabindex="0" data-n="${esc(s.nombre)}" class="${s.nombre===foco?'sel':''}" title="${s.nombre===foco?'Tocá de nuevo para volver a la suma':'Ver el detalle de este soporte'}"><td><span class="sopname">${esc(s.nombre)}</span><span class="soptipo">${esc(tipoDe(s))} · ${s.hsOn} h encendido</span></td>
      <td class="r num">${fmt(t.cap/60)}</td><td class="r num">${fmt(t.contr/60)}</td><td class="r num">${fmt(t.plus/60)}</td><td class="r num">${pct(t.contr/t.cap)}</td><td class="r">${delta(s.nombre,t.contr/t.cap)}</td><td>${barra(t)}</td><td>${estado(t.contr/t.cap,t.diasExc)}</td></tr>`).join('');
  if(rows.length>1){ const T=rows.reduce((a,{t})=>({cap:a.cap+t.cap,contr:a.contr+t.contr,plus:a.plus+t.plus}),{cap:0,contr:0,plus:0});
    tf.innerHTML=`<tr><td>Total · ${rows.length} soportes</td><td class="r num">${fmt(T.cap/60)}</td><td class="r num">${fmt(T.contr/60)}</td><td class="r num">${fmt(T.plus/60)}</td><td class="r num">${pct(T.contr/T.cap)}</td><td class="r">${delta(null,T.contr/T.cap)}</td><td>${barra(T)}</td><td></td></tr>`;
  } else tf.innerHTML='';
  tb.querySelectorAll('tr[data-n]').forEach(tr=>{ tr.onclick=()=>{ const n=tr.dataset.n; enfocar(n); const f=document.querySelector(`#tblSop tbody tr[data-n="${CSS.escape(n)}"]`); if(f) f.focus({preventScroll:true}); if(foco) document.getElementById('s2').scrollIntoView({behavior:REDUCE?'auto':'smooth'}); };
    tr.onkeydown=e=>{ if(e.key==='Enter') tr.onclick(); }; });
  if(visto.s1) animarBarras('#tblSop .bar');
}

// ───── Suma de los soportes elegidos
function agregado(){
  const E=enfocados(), D=DATA[mes];
  // aire = lo contratado que entra en cada soporte; exc = lo vendido de más (no entra). Se calcula soporte por soporte.
  const diario=D.dias.map((_,i)=>E.reduce((a,s)=>{ const d=s.diario[i]; a.capTrad+=d.capTrad; a.contr+=d.contr; a.plus+=plusVisible(d); a.aire+=Math.min(d.contr,d.capTrad); a.exc+=Math.max(0,d.contr-d.capTrad); return a; },{capTrad:0,contr:0,plus:0,aire:0,exc:0}));
  const camp=new Map();
  E.forEach(s=>s.campanias.forEach(c=>{ const k=claveAn(c.anun)+'|'+claveAn(c.camp)+'|'+c.dur; let x=camp.get(k);
    if(!x){ x={...c,sops:new Set(),contrSeg:0,plusSeg:0,dias:0,contrSalH:0,plusSalHMax:0}; camp.set(k,x); }
    x.sops.add(s.nombre); x.contrSeg+=c.contrSeg; x.plusSeg+=c.plusSeg; x.dias=Math.max(x.dias,c.dias); x.contrSalH=Math.max(x.contrSalH,c.contrSalH); x.plusSalHMax=Math.max(x.plusSalHMax,c.plusSalHMax); }));
  const t=E.reduce((a,s)=>{ const x=tot(s); a.cap+=x.cap; a.contr+=x.contr; a.plus+=x.plus; a.aire+=x.aire; a.pe+=x.pe; a.capPE+=x.capPE; if(x.contr>x.cap*1.005) a.sopExc++; a.diasExc=Math.max(a.diasExc,x.diasExc); return a; },{cap:0,contr:0,plus:0,aire:0,pe:0,capPE:0,sopExc:0,diasExc:0});
  return {E,diario,t,campanias:[...camp.values()].sort((a,b)=>(b.contrSeg+b.plusSeg)-(a.contrSeg+a.plusSeg))};
}

// En las barras horizontales el cuadro va siempre a la derecha del final de la barra (flecha a la izquierda).
// Si no entra, se corre hacia adentro pero mantiene la flecha a la izquierda.
if(window.Chart) Chart.Tooltip.positioners.alFinal=function(items){
  if(!items.length) return false;
  const area=this.chart.chartArea, w=this.width||170;
  const x=Math.min(Math.max(...items.map(i=>i.element.x)), area.right-w-10);
  return {x, y:items[0].element.y, xAlign:'left', yAlign:'center'};
};
function chartDefaults(){ if(!window.Chart) throw new Error('sin-graficos'); Chart.defaults.locale='es-UY'; Chart.defaults.font.family=css('--f-body'); Chart.defaults.color=css('--muted'); Chart.defaults.borderColor=css('--line'); }
// Aclara un color hex mezclándolo con blanco (Chart.js necesita colores que sepa interpolar; color-mix() lo rompía).
const aclarar=(hex,p)=>{ let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join('');
  const n=parseInt(h,16), m=v=>Math.round(v+(255-v)*p/100); return `rgb(${m(n>>16&255)},${m(n>>8&255)},${m(n&255)})`; };

// Las dos escalas tienen que calzar: el 100% de la derecha cae justo en la línea de capacidad.
// capRef es la capacidad más alta del período; topeMin es lo más alto que tiene que entrar (en las mismas unidades).
function escalasAlineadas(capRef,topeMin){
  if(!capRef) return {y:{},y2:{}};
  const pctMax=Math.max(120,Math.ceil(topeMin/capRef*100/20)*20+0);
  // El tope de la izquierda no es un número redondo: se saca esa marca para que no aparezca un valor raro arriba.
  const sinTopeRaro=ax=>{ const t=ax.ticks; if(t.length>2){ const paso=t[1].value-t[0].value, ult=t[t.length-1].value, ant=t[t.length-2].value; if(ult-ant<paso*.999) t.pop(); } };
  return {y:{min:0,max:capRef*pctMax/100,afterBuildTicks:sinTopeRaro},y2:{min:0,max:pctMax,ticks:{stepSize:20,callback:v=>v+'%'}}};
}

// ───── 2 · Diario
let AG=null;
function dibujarDia(){
  if(!AG||!window.Chart) return; chartDefaults();
  const D=DATA[mes], A=AG; let acC=0,acCap=0;
  const acum=A.diario.map(d=>{ acC+=d.aire+d.plus; acCap+=d.capTrad; return acCap?Math.round(acC/acCap*1000)/10:0; });
  const ds=[
    {type:'bar',label:'Contratado',data:A.diario.map(d=>+(d.aire/60).toFixed(1)),backgroundColor:css('--contr'),hoverBackgroundColor:css('--contr-h'),stack:'a',yAxisID:'y',order:2,borderRadius:2},
    {type:'bar',label:'Plus',data:A.diario.map(d=>+(d.plus/60).toFixed(1)),backgroundColor:css('--plus'),hoverBackgroundColor:css('--plus-hover'),stack:'a',yAxisID:'y',order:2,borderRadius:2},
    {type:'line',label:'Capacidad',data:A.diario.map(d=>+(d.capTrad/60).toFixed(1)),borderColor:css('--limite'),borderWidth:2,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:css('--limite'),stepped:'middle',yAxisID:'y',order:1},
    {type:'line',label:'Acumulado %',data:acum,borderColor:css('--warn'),borderDash:[5,4],borderWidth:2,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:css('--warn'),yAxisID:'y2',order:0},
    {type:'bar',label:'Vendido de más',data:A.diario.map(d=>unSoloSoporte()?+(d.exc/60).toFixed(1):0),backgroundColor:css('--limite'),hoverBackgroundColor:css('--limite'),stack:'a',yAxisID:'y',order:2,borderRadius:2},
  ];
  const labels=D.dias.map(d=>+d.slice(8)), nomMes=(MESES[mes]||'').split(' ')[0].toLowerCase();
  const PASO=45, inicioLineas=labels.length*PASO+350, pasoLinea=35;
  const prevY=ctx=>{ const d=ctx.chart.data.datasets[ctx.datasetIndex]; return ctx.index===0?ctx.chart.scales[d.yAxisID].getPixelForValue(d.data[0]):ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index-1].getProps(['y'],true).y; };
  const trazo=()=>REDUCE?{}:{
    x:{type:'number',easing:'linear',duration:pasoLinea,from:NaN,delay(ctx){ if(ctx.type!=='data'||ctx.xStarted||!intro.dia) return 0; ctx.xStarted=true; return inicioLineas+ctx.index*pasoLinea; }},
    y:{type:'number',easing:'linear',duration:pasoLinea,from:prevY,delay(ctx){ if(ctx.type!=='data'||ctx.yStarted||!intro.dia) return 0; ctx.yStarted=true; return inicioLineas+ctx.index*pasoLinea; }}};
  ds[2].animations=trazo(); ds[3].animations=trazo();
  const capRefD=Math.max(0,...ds[2].data), escD=escalasAlineadas(capRefD,Math.max(0,...A.diario.map(d=>(d.aire+(unSoloSoporte()?d.exc:0)+d.plus)/60),...ds[2].data));
  mostrarLeyendaExc();
  if(charts.dia){ charts.dia.data.labels=labels; charts.dia.data.datasets.forEach((d,i)=>{ d.data=ds[i].data; });
    Object.assign(charts.dia.options.scales.y,escD.y); Object.assign(charts.dia.options.scales.y2,escD.y2); charts.dia.update(); lecturaDia(null); return; }
  charts.dia=new Chart(document.getElementById('chDia'),{
    data:{labels,datasets:ds},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      animation:REDUCE?false:{duration:500,easing:'easeOutCubic',
        delay:ctx=>(ctx.type==='data'&&ctx.mode==='default'&&intro.dia&&ctx.chart.data.datasets[ctx.datasetIndex].type==='bar')?ctx.dataIndex*PASO:0,
        onComplete:()=>{ intro.dia=false; }},
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{stacked:true,grid:{display:false},ticks:{maxRotation:0,autoSkipPadding:8}},
        y:{stacked:true,beginAtZero:true,title:{display:innerWidth>=600,text:'minutos por día'},grid:{color:css('--line')},...escD.y},
        y2:{position:'right',grid:{display:false},...escD.y2}}}
  });
  enlazarLectura(charts.dia,lecturaDia);
}

// ───── 4 · Plus
function dibujarPlus(){
  if(!AG||!window.Chart) return; chartDefaults();
  // Se agrupa sin distinguir mayúsculas (en la planilla hay "SC Jhonson" y "Sc Jhonson").
  const porAn=new Map(); AG.campanias.forEach(c=>{ const k=claveAn(c.anun); const a=porAn.get(k)||{n:c.anun.trim(),c:0,p:0}; a.c+=c.contrSeg; a.p+=c.plusSeg; porAn.set(k,a); });
  const arr=[...porAn.values()].map(a=>[a.n,a]).sort((a,b)=>(b[1].c+b[1].p)-(a[1].c+a[1].p)).slice(0,15);
  document.getElementById('boxPlus').style.height=Math.max(160,arr.length*28+50)+'px';
  const labels=arr.map(a=>a[0]), dc=arr.map(a=>Math.round(a[1].c/60)), dp=arr.map(a=>Math.round(a[1].p/60));
  if(charts.plus){ charts.plus.data.labels=labels; charts.plus.data.datasets[0].data=dc; charts.plus.data.datasets[1].data=dp; charts.plus.update(); return; }
  charts.plus=new Chart(document.getElementById('chPlus'),{type:'bar',
    data:{labels,datasets:[
      {label:'Contratado',data:dc,backgroundColor:css('--contr'),hoverBackgroundColor:css('--contr-h'),stack:'a',borderRadius:2},
      {label:'Plus',data:dp,backgroundColor:css('--plus'),hoverBackgroundColor:css('--plus-hover'),stack:'a',borderRadius:2}]},
    options:{indexAxis:'y',layout:{padding:{left:4}},responsive:true,maintainAspectRatio:false,interaction:{mode:'index',axis:'y',intersect:false},
      animation:REDUCE?false:{duration:700,easing:'easeOutCubic',delay:ctx=>(ctx.type==='data'&&ctx.mode==='default'&&intro.plus)?ctx.dataIndex*70+ctx.datasetIndex*250:0,onComplete:()=>{ intro.plus=false; }},
      plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:11}},
      tooltip:{position:'alFinal',caretPadding:6,padding:10,boxPadding:4,callbacks:{label:c=>` ${c.dataset.label}: ${fmt(c.raw)} min`,footer:it=>{ const ds_=it[0].chart.data.datasets, c=ds_[0].data[it[0].dataIndex], p=ds_[1].data[it[0].dataIndex]; return `Exhibido: ${fmt(c+p)} min`+(c?` · Plus +${pct(p/c)}`:''); }}}},
      scales:{x:{stacked:true,title:{display:true,text:'minutos del mes'},grid:{color:css('--line')}},y:{stacked:true,grid:{display:false},ticks:{callback(v){ const l=this.getLabelForValue(v); return innerWidth<600&&l.length>17?l.slice(0,16).trim()+'…':l; }}}}}});
}

// ───── Detalle (secciones 2 a 5)
function renderDetalle(){
  AG=agregado(); const A=AG, t=A.t, n=A.E.length, D=DATA[mes];
  const titulo=n===0?'sin soportes elegidos':(foco&&sel.has(foco))?foco:nombreSel();
  const nSel=elegidos().length;
  document.getElementById('focobar').innerHTML=(foco&&sel.has(foco))
    ?`<span>Mostrando solo <b>${esc(foco)}</b>.</span>${nSel>1?`<button type="button" class="btn" id="btnSuma">Volver a la suma de los ${nSel} soportes</button>`:''}`
    :(nSel>1?`<span>Mostrando la <b>suma de ${nSel} soportes</b>. Tocá uno en la tabla 1 para verlo solo.</span>`:'');
  const bs=document.getElementById('btnSuma'); if(bs) bs.onclick=()=>enfocar(foco);
  ['t2','t3','t4'].forEach((id,i)=>{ document.getElementById(id).textContent=['Evolución de la ocupación','Anunciantes y minutos exhibidos','Vendido contra exhibido'][i]+' · '+titulo; });
  const s1=n===1?A.E[0]:null, ant=mesAnterior(mes);
  const tA=ant?A.E.map(s=>tot(sopDe(ant,s.nombre))).reduce((a,x)=>({cap:a.cap+x.cap,contr:a.contr+x.contr,plus:a.plus+x.plus,aire:a.aire+x.aire}),{cap:0,contr:0,plus:0,aire:0}):null;
  const vsAnt=(act,prev)=>tA&&tA.cap?'<br>'+deltaHTML(act,prev,nomMesL(ant),'kpi'):'';
  document.getElementById('kpis').innerHTML=n?[
    ['Capacidad del mes',fmt(t.cap/60)+' min',s1?`${s1.bloques} bloques · ${s1.progsXHora} prog/h · ${s1.hsOn} h`:`${n} soportes sumados`],
    ['Contratado',fmt(t.contr/60)+' min','Ocupación vendida '+pct(t.contr/t.cap)+vsAnt(t.contr/t.cap,tA&&tA.contr/tA.cap)],
    ['Plus entregado',fmt(t.plus/60)+' min',t.contr>0?'+'+pct(t.plus/t.contr)+' sobre lo contratado':'—'],
    ['Exhibido total',fmt((t.aire+t.plus)/60)+' min','Ocupación real '+pct((t.aire+t.plus)/t.cap)+(t.contr>t.aire+1?`<br><span style="color:var(--limite)">${fmt((t.contr-t.aire)/60)} min vendidos de más no entran</span>`:'')+vsAnt((t.aire+t.plus)/t.cap,tA&&(tA.aire+tA.plus)/tA.cap)],
    s1?['Días sobrevendidos',String(t.diasExc),'de '+D.dias.length+' días del mes']:['Soportes sobrevendidos',String(t.sopExc),'de '+n+' elegidos'],
  ].map(([l,v,sub])=>`<div class="kpi"><span class="eyebrow">${l}</span><span class="v">${v}</span><span class="s">${sub}</span></div>`).join(''):'';

  if(visto.s2) dibujarDia();
  if(visto.s4) dibujarPlus();
  if(visto.sMes) dibujarMes();
  document.getElementById('tMes').textContent='Cómo viene cada mes · '+titulo;

  // 3 · contenidos
  const varios=n>1, camp=A.campanias, LIM=12, vis=verTodas?camp:camp.slice(0,LIM);
  document.querySelector('#tblCamp thead').innerHTML=`<tr><th>Anunciante · campaña</th><th>Cliente</th>${varios?'<th class="r">Soportes</th>':''}<th class="r">Pieza</th><th class="r">Días</th><th class="r">Salidas/h</th><th class="r">Plus/h</th><th class="r">Min. contratados</th><th class="r">Min. Plus</th><th class="r">Min. exhibidos</th></tr>`;
  const bt=document.getElementById('btnTodas'); bt.hidden=camp.length<=LIM;
  bt.textContent=verTodas?'Ver solo las 12 con más minutos':`Ver las ${camp.length} campañas`;
  bt.onclick=()=>{ verTodas=!verTodas; renderDetalle(); };
  document.querySelector('#tblCamp tbody').innerHTML=vis.length?vis.map(c=>`<tr>
    <td><b>${esc(c.anun)}</b>${c.fijo?'<span class="fijo">espacio fijo</span>':''}<br><span style="color:var(--muted);font-size:12.5px">${esc(c.camp||'—')}</span></td>
    <td><span class="tc ${esc(c.tc)}">${esc(c.tc==='ESTANDAR'?'STD':c.tc)}</span></td>
    ${varios?`<td class="r num" title="${esc([...c.sops].join(', '))}">${c.sops.size}</td>`:''}
    <td class="r num">${c.dur} s</td><td class="r num">${c.dias}</td><td class="r num">${fmt(c.contrSalH)}</td><td class="r num">${c.plusSalHMax?'+'+fmt(c.plusSalHMax):'—'}</td>
    <td class="r num">${fmt(c.contrSeg/60)}</td><td class="r num">${c.plusSeg?fmt(c.plusSeg/60):'—'}</td><td class="r num"><b>${fmt((c.contrSeg+c.plusSeg)/60)}</b></td></tr>`).join('')
    :`<tr><td colspan="10" class="vacio">${n?'No hubo campañas tradicionales al aire este mes.':'No hay soportes elegidos.'}</td></tr>`;
  document.getElementById('notaPE').textContent=(varios?'Con varios soportes, "Salidas/h" y "Plus/h" muestran el máximo en un soporte; pasá el mouse por "Soportes" para ver cuáles. ':'')+
    '"Plus/h" es el máximo de salidas extra por hora que tuvo la campaña en algún día.'+(t.pe>0?` Aparte, Place Exchange ocupó ${fmt(t.pe/60)} de sus ${fmt(t.capPE/60)} min de slots.`:'');

  // 4 · plus por tipo
  const tipos={TOP:{c:0,p:0},ESTANDAR:{c:0,p:0},NUEVO:{c:0,p:0}};
  camp.filter(c=>!c.fijo).forEach(c=>{ const x=tipos[c.tc]||tipos.ESTANDAR; x.c+=c.contrSeg; x.p+=c.plusSeg; });
  const totP=Object.values(tipos).reduce((a,x)=>a+x.p,0);
  document.getElementById('plusTipo').innerHTML=`<div class="eyebrow" style="margin-bottom:10px">Plus por tipo de cliente</div>`+
    Object.entries(tipos).map(([k,x])=>`<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;gap:8px"><span class="tc ${k}">${k==='ESTANDAR'?'Estándar':k==='TOP'?'Top':'Nuevo'}</span><span class="num">${fmt(x.p/60)} min · ${totP?pct(x.p/totP):'0%'}</span></div>
      <div class="bar" style="min-width:0"><span class="p" style="left:0" data-w="${totP?(x.p/totP*100).toFixed(1):0}%"></span></div>
      <span style="font-size:12px;color:var(--muted)">${x.c?'+'+pct(x.p/x.c)+' sobre sus '+fmt(x.c/60)+' min contratados':'Sin campañas de este tipo'}</span></div>`).join('')+
    `<p class="nota">El reparto depende de cuánto sobra por hora: hasta 3 min va todo a Top; de 3 a 5 min, 20/50/30; más de 5 min, 33/33/34.</p>`;
  if(visto.s4) animarBarras('#plusTipo .bar');
  renderSim();
}

// Diferencia en puntos de porcentaje contra el mes anterior.
// Diferencia en puntos contra el mes anterior. "tabla": dos renglones; "kpi": en una línea.
function deltaHTML(act,prev,mAnt,modo='tabla'){ if(prev==null||!isFinite(prev)) return '';
  const a=Math.round(act*100), b=Math.round(prev*100), d=a-b, c=d>0?'up':d<0?'dn':'eq';
  const txt=d===0?'= sin cambio':`${d>0?'▲ +':'▼ −'}${Math.abs(d)} punto${Math.abs(d)===1?'':'s'}`;
  const tip=`Pasó de ${b}% en ${mAnt} a ${a}%`;
  return modo==='kpi'?`<span class="delta ${c}" title="${tip}">${txt}</span> <span style="white-space:nowrap">vs. ${mAnt} (${b}%)</span>`
    :`<span class="delta ${c}" title="${tip}">${txt}</span><span class="delta-prev">${mAnt}: ${b}%</span>`; }

// Gráfico de barras con entrada en cascada: cada barra arranca un poco después que la anterior.
const cascada=(clave,paso)=>REDUCE?false:{duration:600,easing:'easeOutCubic',
  delay:ctx=>(ctx.type==='data'&&ctx.mode==='default'&&intro[clave])?ctx.dataIndex*paso+ctx.datasetIndex*120:0,
  onComplete:()=>{ intro[clave]=false; }};

// ───── Franja de lectura de los gráficos (sustituye al cuadro flotante)
const punto=v=>`<i style="background:var(${v})"></i>`;
function enlazarLectura(chart,pintar){
  const c=chart.canvas; pintar(null);
  if(c.dataset.lectura) return; c.dataset.lectura='1'; // los oyentes se ponen una sola vez por canvas (al cambiar de tema se recrea el gráfico)
  c.addEventListener('mousemove',e=>{ const ch=Chart.getChart(c); if(!ch) return; const els=ch.getElementsAtEventForMode(e,'index',{intersect:false},false); pintar(els.length?els[0].index:null); });
  c.addEventListener('mouseleave',()=>pintar(null));
}
function lecturaDia(i){
  const el=document.getElementById('lecDia'); if(!el||!AG) return;
  const D=DATA[mes], nm=nomMesL(mes);
  const exc=x=>x>0&&unSoloSoporte()?`<span>${punto('--limite')}Vendido de más <span class="v">${fmt(x/60)}</span> min</span>`:'';
  if(i==null){ const t=AG.diario.reduce((a,d)=>({cap:a.cap+d.capTrad,c:a.c+d.aire,x:a.x+d.exc,p:a.p+d.plus}),{cap:0,c:0,x:0,p:0});
    el.classList.remove('activa');
    el.innerHTML=`<span class="t">Todo ${nm}</span><span>${punto('--contr')}Contratado <span class="v">${fmt(t.c/60)}</span> min</span><span>${punto('--plus')}Plus <span class="v">${fmt(t.p/60)}</span> min</span>${exc(t.x)}<span>Capacidad <span class="v">${fmt(t.cap/60)}</span> min</span><span>Al aire <span class="v">${pct((t.c+t.p)/t.cap)}</span></span><span>Libre <span class="v">${fmt((t.cap-t.c-t.p)/60)}</span> min</span>${avisoExc()}<span class="ayuda">Pasá el mouse por un día para ver el detalle.</span>`; return; }
  const d=AG.diario[i], al=d.aire+d.plus, lib=d.capTrad-al;
  let acC=0,acCap=0; for(let k=0;k<=i;k++){ acC+=AG.diario[k].aire+AG.diario[k].plus; acCap+=AG.diario[k].capTrad; }
  el.classList.add('activa');
  el.innerHTML=`<span class="t">${+D.dias[i].slice(8)} de ${nm}</span><span>${punto('--contr')}Contratado <span class="v">${fmt(d.aire/60)}</span> min</span><span>${punto('--plus')}Plus <span class="v">${fmt(d.plus/60)}</span> min</span>${exc(d.exc)}<span>Capacidad <span class="v">${fmt(d.capTrad/60)}</span> min</span><span>Al aire <span class="v">${pct(al/d.capTrad)}</span> del día</span><span>Libre <span class="v">${fmt(lib/60)}</span> min</span><span>${punto('--warn')}Acumulado del mes <span class="v">${acCap?pct(acC/acCap):'—'}</span></span>`;
}
let SERIE_MES=[];
function lecturaMes(i){
  const el=document.getElementById('lecMes'); if(!el||!SERIE_MES.length) return;
  const sel_=i==null; if(i==null) i=LISTA_MESES.indexOf(mes);
  const x=SERIE_MES[i], m=x.m, est=m>MES_HOY?' · cargado hasta hoy':m===MES_HOY?' · en curso':'';
  el.classList.toggle('activa',!sel_);
  el.innerHTML=`<span class="t">${MESES[m]}<span style="font-weight:400;color:var(--muted);font-size:12px">${est}</span></span><span>${punto('--contr')}Contratado <span class="v">${fmt(x.aire/60)}</span> min</span><span>${punto('--plus')}Plus <span class="v">${fmt(x.plus/60)}</span> min</span>${x.exc>0&&unSoloSoporte()?`<span>${punto('--limite')}Vendido de más <span class="v">${fmt(x.exc/60)}</span> min</span>`:''}<span>Capacidad <span class="v">${fmt(x.cap/60)}</span> min</span><span>Libre <span class="v">${fmt((x.cap-x.aire-x.plus)/60)}</span> min</span><span>${punto('--warn')}Vendida <span class="v">${x.cap?pct(x.contr/x.cap):'—'}</span></span><span>Al aire con Plus <span class="v">${x.cap?pct((x.aire+x.plus)/x.cap):'—'}</span></span>${m===mes?avisoExc():''}${sel_?'<span class="ayuda">Pasá el mouse por otro mes para compararlo.</span>':''}`;
}

// ───── 2 · Mes a mes
// El motor a veces da unos segundos más de Plus que la capacidad (cuando el espacio de programática quedó vacío,
// la pauta lo usa). En los gráficos se recorta para que contratado + Plus nunca pase la línea de capacidad.
const plusVisible=d=>Math.max(0,Math.min(d.plus,d.capTrad-Math.min(d.contr,d.capTrad)));
// Lo vendido de más solo se dibuja cuando se ve UN soporte: ahí empieza justo en la línea de capacidad.
// En una suma quedaría apilado sobre el lugar libre de otros soportes y parecería que entra; se avisa en texto.
const unSoloSoporte=()=>AG&&AG.E.length===1;
function avisoExc(){ if(unSoloSoporte()) return '';
  const sv=AG.E.map(s=>({n:s.nombre,x:tot(s)})).filter(o=>o.x.contr>o.x.aire+60);
  return sv.length?`<span style="color:var(--limite)">${sv.map(o=>`${esc(o.n)}: ${fmt((o.x.contr-o.x.aire)/60)} min vendidos de más que no entran`).join(' · ')}. Tocalo en la tabla 1 para verlo solo.</span>`:''; }
function mostrarLeyendaExc(){ document.querySelectorAll('.leg-exc').forEach(e=>e.hidden=!unSoloSoporte()); }
function serieMensual(nombres,filtroCamp){
  return LISTA_MESES.map(m=>{ let cap=0,contr=0,plus=0,aire=0,exc=0;
    nombres.forEach(n=>{ const s=sopDe(m,n); if(!s) return;
      if(filtroCamp){ s.campanias.filter(filtroCamp).forEach(c=>{ contr+=c.contrSeg; plus+=c.plusSeg; }); }
      else s.diario.forEach(d=>{ cap+=d.capTrad; contr+=d.contr; plus+=plusVisible(d); aire+=Math.min(d.contr,d.capTrad); exc+=Math.max(0,d.contr-d.capTrad); }); });
    if(filtroCamp) aire=contr;
    return {m,cap,contr,plus,aire,exc}; });
}
function dibujarMes(){
  if(!AG||!window.Chart) return; chartDefaults();
  const S=serieMensual(AG.E.map(s=>s.nombre)), iSel=LISTA_MESES.indexOf(mes); SERIE_MES=S;
  const col=(v,i)=>i===iSel?css(v):aclarar(css(v),(i>LISTA_MESES.indexOf(MES_HOY)?62:45)+(v==='--plus'?10:0));
  const labels=S.map(x=>corto(x.m)), dc=S.map(x=>Math.round(x.aire/60)), dx=S.map(x=>unSoloSoporte()?Math.round(x.exc/60):0), dp=S.map(x=>Math.round(x.plus/60)), dcap=S.map(x=>Math.round(x.cap/60)), docu=S.map(x=>x.cap?Math.round(x.contr/x.cap*100):0);
  const bgC=S.map((_,i)=>col('--contr',i)), bgP=S.map((_,i)=>col('--plus',i)), bgX=S.map((_,i)=>col('--limite',i));
  const escM=escalasAlineadas(Math.max(0,...dcap),Math.max(0,...S.map((x,i)=>x.aire/60+dx[i]+x.plus/60),...dcap)); mostrarLeyendaExc();
  if(charts.mes){ const d=charts.mes.data; d.labels=labels; d.datasets[0].data=dc; d.datasets[0].backgroundColor=bgC; d.datasets[1].data=dp; d.datasets[1].backgroundColor=bgP; d.datasets[2].data=dcap; d.datasets[3].data=docu; d.datasets[4].data=dx; d.datasets[4].backgroundColor=bgX;
    Object.assign(charts.mes.options.scales.y,escM.y); Object.assign(charts.mes.options.scales.y2,escM.y2); charts.mes.update(); lecturaMes(null); return; }
  charts.mes=new Chart(document.getElementById('chMes'),{
    data:{labels,datasets:[
      {type:'bar',label:'Contratado',data:dc,backgroundColor:bgC,hoverBackgroundColor:css('--contr-h'),stack:'a',yAxisID:'y',order:2,borderRadius:3},
      {type:'bar',label:'Plus',data:dp,backgroundColor:bgP,hoverBackgroundColor:css('--plus-hover'),stack:'a',yAxisID:'y',order:2,borderRadius:3},
      {type:'line',label:'Capacidad',data:dcap,borderColor:css('--limite'),borderWidth:2,pointRadius:3,pointBackgroundColor:css('--limite'),yAxisID:'y',order:1},
      {type:'line',label:'Ocupación vendida',data:docu,borderColor:css('--warn'),borderDash:[5,4],borderWidth:2,pointRadius:3,pointBackgroundColor:css('--warn'),yAxisID:'y2',order:0},
      {type:'bar',label:'Vendido de más',data:dx,backgroundColor:bgX,hoverBackgroundColor:css('--limite'),stack:'a',yAxisID:'y',order:2,borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:cascada('mes',110),
      onClick:(e,els)=>{ if(!els.length) return; mes=LISTA_MESES[els[0].index]; document.getElementById('selMes').value=mes; renderTodo(); },
      onHover:(e,els)=>{ e.native.target.style.cursor=els.length?'pointer':'default'; },
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,title:{display:innerWidth>=600,text:'minutos por mes'},grid:{color:css('--line')},...escM.y},
        y2:{position:'right',grid:{display:false},...escM.y2}}}});
  enlazarLectura(charts.mes,lecturaMes);
}

// ───── Vista Anunciantes
function anunciantesDe(m){
  const mapa=new Map();
  DATA[m].soportes.filter(s=>sel.has(s.nombre)).forEach(s=>s.campanias.forEach(c=>{ const k=claveAn(c.anun); if(!k) return;
    let a=mapa.get(k); if(!a){ a={k,nombres:{},tcs:new Set(),sops:new Set(),camps:new Set(),contr:0,plus:0,filas:[]}; mapa.set(k,a); }
    a.nombres[c.anun.trim()]=(a.nombres[c.anun.trim()]||0)+1; a.tcs.add(c.tc); a.sops.add(s.nombre); a.camps.add(claveAn(c.camp)+'|'+c.dur);
    a.contr+=c.contrSeg; a.plus+=c.plusSeg; a.filas.push({sop:s.nombre,...c}); }));
  mapa.forEach(a=>{ a.nombre=Object.entries(a.nombres).sort((x,y)=>y[1]-x[1])[0][0]; });
  return [...mapa.values()].sort((a,b)=>(b.contr+b.plus)-(a.contr+a.plus));
}
let LAN=[];
// Nombre de cada anunciante en todos los meses (para avisar cuando el elegido no salió en el mes).
let _todosAn=null;
function anunciantesDeTodos(){ if(_todosAn) return _todosAn; _todosAn=new Map();
  LISTA_MESES.forEach(m=>DATA[m].soportes.forEach(s=>s.campanias.forEach(c=>{ const k=claveAn(c.anun); if(k&&!_todosAn.has(k)) _todosAn.set(k,c.anun.trim()); }))); return _todosAn; }
function renderAnun(){
  LAN=anunciantesDe(mes);
  document.getElementById('tA1').textContent=`Anunciantes de ${nomMesL(mes)} · ${nombreSel()}`;
  // anunPedido = el que eligió la persona; si ese mes no salió, se avisa y se muestra el primero sin olvidar la elección.
  const pedido=anunPedido&&LAN.find(a=>a.k===anunPedido);
  anunSel=pedido?anunPedido:(LAN[0]?LAN[0].k:null);
  const q=claveAn(buscaAn), filtrados=q?LAN.filter(a=>a.k.includes(q)):LAN, LIM=15, vis=(verTodasAn||q)?filtrados:filtrados.slice(0,LIM);
  document.getElementById('cuentaAn').textContent=`${filtrados.length} anunciante${filtrados.length===1?'':'s'}`;
  const maxP=Math.max(1,...LAN.map(a=>a.contr?a.plus/a.contr:0));
  document.querySelector('#tblAn tbody').innerHTML=vis.length?vis.map(a=>{ const r=a.contr?a.plus/a.contr:0;
    return `<tr tabindex="0" data-k="${esc(a.k)}" class="${a.k===anunSel?'sel':''}" style="cursor:pointer"><td><b>${esc(a.nombre)}</b></td>
    <td>${[...a.tcs].map(tc=>`<span class="tc ${esc(tc)}">${tc==='ESTANDAR'?'STD':esc(tc)}</span>`).join(' ')}</td>
    <td class="r num">${a.sops.size}</td><td class="r num">${a.camps.size}</td><td class="r num">${fmt(a.contr/60)}</td><td class="r num">${a.plus?fmt(a.plus/60):'—'}</td><td class="r num"><b>${fmt((a.contr+a.plus)/60)}</b></td>
    <td><div style="display:flex;align-items:center;gap:8px"><div class="bar" style="min-width:90px;flex:1"><span class="p" style="left:0" data-w="${(r/maxP*100).toFixed(1)}%"></span></div><span class="num" style="min-width:48px;text-align:right">${a.contr?'+'+pct(r):'—'}</span></div></td></tr>`; }).join('')
    :`<tr><td colspan="8" class="vacio">${LAN.length?'Ningún anunciante coincide con la búsqueda.':'No hubo anunciantes al aire en los soportes elegidos.'}</td></tr>`;
  const bt=document.getElementById('btnTodasAn'); bt.hidden=q||filtrados.length<=LIM; bt.textContent=verTodasAn?'Ver solo los 15 primeros':`Ver los ${filtrados.length}`;
  bt.onclick=()=>{ verTodasAn=!verTodasAn; renderAnun(); };
  document.querySelectorAll('#tblAn tbody tr[data-k]').forEach(tr=>{ tr.onclick=()=>{ anunPedido=anunSel=tr.dataset.k; renderAnun(); const f=document.querySelector(`#tblAn tbody tr[data-k="${CSS.escape(anunSel)}"]`); if(f) f.focus({preventScroll:true}); document.getElementById('sA2').scrollIntoView({behavior:REDUCE?'auto':'smooth'}); }; tr.onkeydown=e=>{ if(e.key==='Enter') tr.onclick(); }; });
  if(visto.sA1) animarBarras('#tblAn .bar');
  renderAnunDet();
}
function renderAnunDet(){
  const a=LAN.find(x=>x.k===anunSel);
  document.getElementById('tA2').textContent=a?`${a.nombre} · ${nomMesL(mes)} ${mes.slice(0,4)}`:'Sin anunciantes';
  const nota=document.getElementById('notaAn');
  const perdido=anunPedido&&anunPedido!==anunSel?anunciantesDeTodos().get(anunPedido):null;
  nota.hidden=!perdido; if(perdido) nota.textContent=`${perdido} no salió en ${nomMesL(mes)} en los soportes elegidos. Se muestra el primero del ranking.`;
  if(!a){ document.getElementById('kpisAn').innerHTML=''; document.querySelector('#tblAnDet tbody').innerHTML=''; document.querySelector('#tblAnDet tfoot').innerHTML='';
    ['anSop','anHist'].forEach(k=>{ if(charts[k]){ charts[k].destroy(); delete charts[k]; } }); return; }
  const ant=mesAnterior(mes), aAnt=ant?anunciantesDe(ant).find(x=>x.k===a.k):null;
  document.getElementById('kpisAn').innerHTML=[
    ['Soportes',String(a.sops.size),[...a.sops].slice(0,3).join(', ')+(a.sops.size>3?'…':'')],
    ['Contratado',fmt(a.contr/60)+' min',`${a.camps.size} campaña${a.camps.size===1?'':'s'}`],
    ['Plus regalado',fmt(a.plus/60)+' min',a.contr?'+'+pct(a.plus/a.contr)+' sobre lo contratado':'—'],
    ['Exhibido total',fmt((a.contr+a.plus)/60)+' min',aAnt?`${nomMesL(ant)}: ${fmt((aAnt.contr+aAnt.plus)/60)} min`:(ant?`No salió en ${nomMesL(ant)}`:'')],
  ].map(([l,v,sub])=>`<div class="kpi"><span class="eyebrow">${l}</span><span class="v">${v}</span><span class="s">${esc(sub)}</span></div>`).join('');
  const filas=[...a.filas].sort((x,y)=>x.sop.localeCompare(y.sop)||(y.contrSeg+y.plusSeg)-(x.contrSeg+x.plusSeg));
  document.querySelector('#tblAnDet tbody').innerHTML=filas.map(f=>`<tr><td class="sopname">${esc(f.sop)}</td><td>${esc(f.camp||'—')}${f.fijo?'<span class="fijo">espacio fijo</span>':''}</td>
    <td class="r num">${f.dur} s</td><td class="r num">${f.dias}</td><td class="r num">${fmt(f.contrSalH)}</td><td class="r num">${f.plusSalHMax?'+'+fmt(f.plusSalHMax):'—'}</td>
    <td class="r num">${fmt(f.contrSeg/60)}</td><td class="r num">${f.plusSeg?fmt(f.plusSeg/60):'—'}</td><td class="r num"><b>${fmt((f.contrSeg+f.plusSeg)/60)}</b></td></tr>`).join('');
  document.querySelector('#tblAnDet tfoot').innerHTML=filas.length>1?`<tr><td colspan="6">Total</td><td class="r num">${fmt(a.contr/60)}</td><td class="r num">${fmt(a.plus/60)}</td><td class="r num">${fmt((a.contr+a.plus)/60)}</td></tr>`:'';
  if(visto.sA2){ dibujarAnSop(); dibujarAnHist(); }
}
function dibujarAnSop(){
  const a=LAN.find(x=>x.k===anunSel); if(!a||!window.Chart) return; chartDefaults();
  const por=new Map(); a.filas.forEach(f=>{ const x=por.get(f.sop)||{c:0,p:0}; x.c+=f.contrSeg; x.p+=f.plusSeg; por.set(f.sop,x); });
  const arr=[...por.entries()].sort((x,y)=>(y[1].c+y[1].p)-(x[1].c+x[1].p));
  document.getElementById('boxAnSop').style.height=Math.max(180,arr.length*30+60)+'px';
  const labels=arr.map(x=>x[0]), dc=arr.map(x=>Math.round(x[1].c/60)), dp=arr.map(x=>Math.round(x[1].p/60));
  if(charts.anSop){ const d=charts.anSop.data; d.labels=labels; d.datasets[0].data=dc; d.datasets[1].data=dp; charts.anSop.update(); return; }
  charts.anSop=new Chart(document.getElementById('chAnSop'),{type:'bar',
    data:{labels,datasets:[
      {label:'Contratado',data:dc,backgroundColor:css('--contr'),hoverBackgroundColor:css('--contr-h'),stack:'a',borderRadius:2},
      {label:'Plus',data:dp,backgroundColor:css('--plus'),hoverBackgroundColor:css('--plus-hover'),stack:'a',borderRadius:2}]},
    options:{indexAxis:'y',layout:{padding:{left:4}},responsive:true,maintainAspectRatio:false,interaction:{mode:'index',axis:'y',intersect:false},animation:cascada('anSop',80),
      plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:11}},tooltip:{position:'alFinal',caretPadding:6,padding:10,boxPadding:4,callbacks:{label:c=>` ${c.dataset.label}: ${fmt(c.raw)} min`}}},
      scales:{x:{stacked:true,title:{display:true,text:'minutos del mes'},grid:{color:css('--line')}},y:{stacked:true,grid:{display:false},ticks:{callback(v){ const l=this.getLabelForValue(v); return innerWidth<600&&l.length>17?l.slice(0,16).trim()+'…':l; }}}}}});
}
function dibujarAnHist(){
  const a=LAN.find(x=>x.k===anunSel); if(!a||!window.Chart) return; chartDefaults();
  const S=serieMensual(NOMBRES.filter(n=>sel.has(n)),c=>claveAn(c.anun)===a.k), iSel=LISTA_MESES.indexOf(mes);
  const labels=S.map(x=>corto(x.m)), dc=S.map(x=>Math.round(x.contr/60)), dp=S.map(x=>Math.round(x.plus/60));
  const bgC=S.map((_,i)=>i===iSel?css('--contr'):aclarar(css('--contr'),45)), bgP=S.map((_,i)=>i===iSel?css('--plus'):aclarar(css('--plus'),55));
  if(charts.anHist){ const d=charts.anHist.data; d.labels=labels; d.datasets[0].data=dc; d.datasets[0].backgroundColor=bgC; d.datasets[1].data=dp; d.datasets[1].backgroundColor=bgP; charts.anHist.update(); return; }
  charts.anHist=new Chart(document.getElementById('chAnHist'),{type:'bar',
    data:{labels,datasets:[
      {label:'Contratado',data:dc,backgroundColor:bgC,hoverBackgroundColor:css('--contr-h'),stack:'a',borderRadius:3},
      {label:'Plus',data:dp,backgroundColor:bgP,hoverBackgroundColor:css('--plus-hover'),stack:'a',borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:cascada('anHist',90),
      // Solo se puede ir a un mes en el que el anunciante salió (si no, cambiaría de anunciante sin querer).
      onClick:(e,els,ch)=>{ if(!els.length) return; const i=els[0].index, ds=ch.data.datasets; if(!((+ds[0].data[i]||0)+(+ds[1].data[i]||0))) return; mes=LISTA_MESES[i]; document.getElementById('selMes').value=mes; renderTodo(); },
      onHover:(e,els,ch)=>{ const i=els.length?els[0].index:-1, ds=ch.data.datasets, hay=i>=0&&((+ds[0].data[i]||0)+(+ds[1].data[i]||0))>0; e.native.target.style.cursor=hay?'pointer':'default'; },
      plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:11}},tooltip:{padding:10,boxPadding:4,callbacks:{
        title:it=>MESES[LISTA_MESES[it[0].dataIndex]],label:c=>` ${c.dataset.label}: ${fmt(c.raw)} min`}}},
      scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,title:{display:innerWidth>=600,text:'minutos por mes'},grid:{color:css('--line')}}}}});
}
document.getElementById('buscarAn').addEventListener('input',e=>{ buscaAn=e.target.value; renderAnun(); });

// ───── Vista Disponible para vender
function renderDisp(){
  const futuros=LISTA_MESES.filter(m=>m>=MES_HOY), dHoy=+FOTO.slice(8);
  const sops=NOMBRES.filter(n=>sel.has(n));
  const celdaDe=(n,m)=>{ const s=sopDe(m,n); let cap=0,contr=0,dias=0;
    s.diario.forEach((d,i)=>{ if(m===MES_HOY && i+1<dHoy) return; cap+=d.capTrad; contr+=d.contr; dias++; });
    return {cap,contr,lib:cap-contr,dias,hs:s.hsOn}; };
  const M=sops.map(n=>({n,c:futuros.map(m=>celdaDe(n,m))}));
  const iProx=futuros.indexOf(LISTA_MESES[LISTA_MESES.indexOf(MES_HOY)+1])>=0?1:0;
  M.sort((a,b)=>b.c[iProx].lib-a.c[iProx].lib);
  const color=o=>o>1.005?`color-mix(in srgb,var(--limite) 40%,var(--surface))`:o>=.85?`color-mix(in srgb,var(--warn) ${Math.round(25+(o-.85)/.15*20)}%,var(--surface))`:`color-mix(in srgb,var(--plus) ${Math.round(30+o/.85*70)}%,var(--surface))`;
  document.querySelector('#tblDisp thead').innerHTML=`<tr><th>Soporte</th>${futuros.map(m=>`<th style="text-align:center">${corto(m)}${m===MES_HOY?` <span style="text-transform:none;letter-spacing:0;font-weight:400">(${dHoy}–${DATA[m].dias.length})</span>`:''}</th>`).join('')}</tr>`;
  let i=0;
  const celda=(x,m,n)=>{ const o=x.cap?x.contr/x.cap:0, salH=x.lib>0?x.lib/(x.dias*x.hs)/10:0;
    return `<td class="cel" ${n?`data-n="${esc(n)}" data-m="${m}"`:''} data-o="${o}" data-c="${x.contr}" data-cap="${x.cap}" data-lib="${x.lib}" data-sal="${salH}" data-dias="${x.dias}" tabindex="0"><div class="celda" style="background:${color(o)};--i:${i++}"><b>${pct(o)}</b><span>${x.lib>=0?fmt(x.lib/60)+' min libres':'−'+fmt(-x.lib/60)+' min'}</span></div></td>`; };
  document.querySelector('#tblDisp tbody').innerHTML=M.length?M.map(r=>`<tr><td><span class="sopname">${esc(r.n)}</span><span class="soptipo">${esc(tipoDe(sopDe(MES_HOY,r.n)))}</span></td>${r.c.map((x,j)=>celda(x,futuros[j],r.n)).join('')}</tr>`).join('')
    :`<tr><td colspan="${futuros.length+1}" class="vacio">No hay soportes elegidos.</td></tr>`;
  const T=futuros.map((m,j)=>M.reduce((a,r)=>({cap:a.cap+r.c[j].cap,contr:a.contr+r.c[j].contr,lib:a.lib+Math.max(0,r.c[j].lib),dias:r.c[j].dias,hs:1}),{cap:0,contr:0,lib:0,dias:1,hs:1}));
  document.querySelector('#tblDisp tfoot').innerHTML=M.length>1?`<tr><td>Total · ${M.length} soportes</td>${T.map(x=>{ const o=x.cap?x.contr/x.cap:0; return `<td class="cel" style="cursor:default"><div class="celda" style="background:${color(o)};--i:${i++}"><b>${pct(o)}</b><span>${fmt(x.lib/60)} min libres</span></div></td>`; }).join('')}</tr>`:'';
  document.querySelectorAll('#tblDisp td.cel[data-n]').forEach(td=>{
    td.onclick=()=>{ ocultarTip(); mes=td.dataset.m; document.getElementById('selMes').value=mes; foco=td.dataset.n; cambiarVista('sop'); };
    td.onkeydown=e=>{ if(e.key==='Enter') td.onclick(); };
    td.onmouseenter=td.onfocus=()=>mostrarTip(td); td.onmouseleave=td.onblur=ocultarTip; });
  // KPIs
  const prox=futuros[iProx], tp=T[iProx]||{cap:0,contr:0,lib:0};
  const llenos=M.filter(r=>r.c[iProx].cap&&r.c[iProx].contr/r.c[iProx].cap>=.85).length;
  const top=M[0];
  const lib3=T.slice(iProx,iProx+3).reduce((a,x)=>a+Math.max(0,x.lib),0);
  document.getElementById('kpisDisp').innerHTML=M.length?[
    [`Vendido en ${nomMesL(prox)}`,pct(tp.cap?tp.contr/tp.cap:0),`${fmt(tp.contr/60)} de ${fmt(tp.cap/60)} min`],
    [`Libre en ${nomMesL(prox)}`,fmt(tp.lib/60)+' min','para vender en los soportes elegidos'],
    ['Libre próximos 3 meses',fmt(lib3/60)+' min',futuros.slice(iProx,iProx+3).map(nomMesL).join(', ')],
    ['Más lugar',top?esc(top.n):'—',top?`${fmt(top.c[iProx].lib/60)} min libres en ${nomMesL(prox)}`:''],
    ['Llenos o casi',String(llenos),`soportes ≥ 85% en ${nomMesL(prox)}`],
  ].map(([l,v,sub])=>`<div class="kpi"><span class="eyebrow">${l}</span><span class="v" style="${String(v).length>12?'font-size:16px;font-family:var(--f-body);font-weight:600':''}">${v}</span><span class="s">${sub}</span></div>`).join(''):'';
}

const tipEl=document.createElement('div'); tipEl.className='tip'; tipEl.hidden=true; document.body.appendChild(tipEl);
function mostrarTip(td){
  const g=k=>+td.dataset[k], m=td.dataset.m, lib=g('lib'), sal=g('sal');
  tipEl.innerHTML=`<b>${esc(td.dataset.n)}</b> · ${MESES[m]}${m===MES_HOY?` (del ${+FOTO.slice(8)} al ${DATA[m].dias.length})`:''}<br>
    <span class="k">Vendido:</span> ${pct(g('o'))} (${fmt(g('c')/60)} de ${fmt(g('cap')/60)} min)<br>
    ${lib>=0?`<span class="k">Libre:</span> ${fmt(lib/60)} min<br><span class="k">Entran ≈</span> <b>${Math.floor(sal)} salidas/h</b> de 10 s<br><span class="k">Es decir ≈</span> ${Math.floor(sal/15)} campaña${Math.floor(sal/15)===1?'':'s'} más de 15 salidas/h`:`<span class="k">Vendido de más:</span> ${fmt(-lib/60)} min`}<br>
    <span class="k">Tocá para ver el detalle</span>`;
  tipEl.hidden=false;
  const r=td.getBoundingClientRect(), arriba=r.top>150;
  tipEl.style.left=Math.min(Math.max(r.left+r.width/2,140),innerWidth-140)+scrollX+'px';
  tipEl.style.top=(arriba?r.top+scrollY:r.bottom+scrollY+tipEl.offsetHeight+16)+'px';
}
function ocultarTip(){ tipEl.hidden=true; }

// ───── Menú lateral: vistas y secciones de la vista abierta (se marca la que estás leyendo)
const SECCIONES={sop:[['s1','Ventas por soporte'],['sMes','Mes a mes'],['s2','Desglose diario'],['s3','Contenidos'],['s4','Plus'],['s5','Simulador']],
  anun:[['sA1','Ranking'],['sA2','Reporte del anunciante']], disp:[['sD','Disponible para vender']], ons:[['sO0','Informe'],['sO1','Ventas por soporte'],['sO2','Desglose diario'],['sO3','Contenidos']]};
const TITULOS={sop:'Soportes',anun:'Anunciantes',disp:'Disponible para vender',ons:'Salido en OnSign'};
const side=document.getElementById('side'), velo=document.getElementById('velo'), btnMenu=document.getElementById('btnMenu');
const esMovil=matchMedia('(max-width:1000px)');
const abrirMenu=a=>{ side.classList.toggle('abierta',a); velo.classList.toggle('abierta',a); btnMenu.setAttribute('aria-expanded',a); side.inert=esMovil.matches&&!a; if(a) (side.querySelector('[aria-current]')||side.querySelector('button')).focus(); };
esMovil.addEventListener('change',()=>abrirMenu(false));
btnMenu.onclick=()=>abrirMenu(!side.classList.contains('abierta')); velo.onclick=()=>abrirMenu(false);
let spy=null;
function armarSecciones(){
  const nav=document.getElementById('sideSec');
  nav.innerHTML=SECCIONES[vista].map(([id,n])=>`<a href="#${id}" data-s="${id}">${n}</a>`).join('');
  nav.querySelectorAll('a').forEach(a=>a.onclick=e=>{ e.preventDefault(); abrirMenu(false); document.getElementById(a.dataset.s).scrollIntoView({behavior:REDUCE?'auto':'smooth'}); });
  if(spy) spy.disconnect();
  if('IntersectionObserver' in window){ spy=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) nav.querySelectorAll('a').forEach(a=>a.classList.toggle('activa',a.dataset.s===e.target.id)); }),{rootMargin:'-25% 0px -65% 0px'});
    SECCIONES[vista].forEach(([id])=>spy.observe(document.getElementById(id))); }
  const pri=nav.querySelector('a'); if(pri) pri.classList.add('activa');
}

// ───── Cambio de vista
function cambiarVista(v){
  vista=v; try{ history.replaceState(null,'','#'+v); }catch(e){}
  document.querySelectorAll('#sideNav button').forEach(b=>{ if(b.dataset.v===v) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  document.getElementById('tituloVista').textContent=TITULOS[v]; abrirMenu(false);
  document.getElementById('vSop').hidden=v!=='sop'; document.getElementById('vAnun').hidden=v!=='anun'; document.getElementById('vDisp').hidden=v!=='disp'; document.getElementById('vOns').hidden=v!=='ons';
  document.getElementById('ctlMes').hidden=v==='disp'||v==='ons'; document.getElementById('ctlDia').hidden=v!=='ons'||!ONS;
  ocultarTip(); renderTodo(); armarSecciones(); window.scrollTo({top:0,behavior:'auto'});
}
document.querySelectorAll('#sideNav button').forEach(b=>b.onclick=()=>cambiarVista(b.dataset.v));

// ───── 6 · Simulador
function renderSim(){
  document.getElementById('simD').textContent=simDur;
  const rows=elegidos().map(s=>{ const t=tot(s);
    // Mismas salidas, otra duración: los segundos de cada campaña se escalan por simDur/dur. El espacio fijo queda igual.
    const sim=s.campanias.reduce((a,c)=>a+(c.fijo||!c.dur?c.contrSeg:c.contrSeg/c.dur*simDur),0);
    return {n:s.nombre,cap:t.cap,contr:t.contr,sim}; }).sort((a,b)=>b.contr/b.cap-a.contr/a.cap);
  const fila=(n,cap,contr,sim,cls='')=>{ const d=Math.round(sim/cap*100)-Math.round(contr/cap*100), lib=(contr-sim)/60;
    return `<tr class="${cls}"><td class="sopname">${esc(n)}</td><td class="r num">${pct(contr/cap)}</td><td class="r num"><b>${pct(sim/cap)}</b></td>
    <td class="r num ${d>0?'delta-up':d<0?'delta-dn':''}">${d>0?'+':d<0?'−':''}${Math.abs(d)} punto${Math.abs(d)===1?'':'s'}</td><td class="r num">${lib>=0?fmt(lib):'−'+fmt(-lib)}</td></tr>`; };
  document.querySelector('#tblSim tbody').innerHTML=rows.length?rows.map(r=>fila(r.n,r.cap,r.contr,r.sim)).join(''):'<tr><td colspan="5" class="vacio">No hay soportes elegidos.</td></tr>';
  const T=rows.reduce((a,r)=>({cap:a.cap+r.cap,contr:a.contr+r.contr,sim:a.sim+r.sim}),{cap:0,contr:0,sim:0});
  document.querySelector('#tblSim tfoot').innerHTML=rows.length>1?fila('Total · '+rows.length+' soportes',T.cap,T.contr,T.sim):'';
}
document.querySelectorAll('#segDur button').forEach(b=>b.onclick=()=>{ simDur=+b.dataset.d;
  document.querySelectorAll('#segDur button').forEach(x=>x.setAttribute('aria-pressed',x===b)); renderSim(); });

// ───── Salido en OnSign: se arrastra un informe de OnSign y se compara con la planilla.
// El archivo se lee en esta compu (nunca sale del navegador) y se descarta al cerrar la página.
// Qué pantallas de OnSign forman cada soporte de la planilla (por el nombre del player).
const ONS_PANTALLAS={
  'Facal':/^LED\$FACAL/i, 'Ramon Anador':/^LED\$OUTDOOR\$RAMON\$ANADOR/i, 'Reinaldo':/^LED\$OUTDOOR\$REINALDO/i,
  'WTC Ascensores':/^WTC\$(TORRE\d|FZ\d)\$(QBIC\$)?ASCENSOR/i, 'WTC Ascensores Punta del Este':/^WTC\$FZ\$PUNTADELESTE\$ASCENSOR/i,
  'WTC Verticales':/^WTC\$.*(TOTEM|PANTALLA)/i, 'MAS BUS':/^\d+_CO(ETC|ME)_/i,
  'Nautico':/^NAUTICO\$(?!.*VERTICAL)/i, 'Aerobic':/^AEROBIC\$/i, 'Flex':/^CLUBFLEX\$/i, 'Remeros Estandar':/^CLUBREMEROS\$(?!.*VERTICAL)/i,
  'Defensor Sporting Estandar':/^CLUBDEFENSOR\$/i, 'Juventud de las Piedras':/^JUVENTUDDELASPIEDRAS\$/i,
  'Plaza 7 Gran Formato':/^LED\$PLAZADEDEPORTES7/i, 'Sense Gran Formato Pocitos':/^LED\$SENSE\$POCITOS/i, 'Sense Gran Formato Nuevo Centro':/^LED\$SENSE\$NUEVOCENTRO/i,
  'Outdoor Remeros':/^LED\$CLUB\$REMEROS/i, 'Defensor Sporting Gran Formato':/^LED\$CLUB\$DEFENSOR/i, 'Vida Fit Gran Formato':/VIDA.?FIT/i,
  // Punta Carretas Shopping: por el nombre de las pantallas, falta confirmarlo con tráfico.
  'Punta Carretas Led Ascensor':/^LED\$PCS\$ASCENSOR/i, 'Punta Carretas Balconera Zara':/^LED\$PCS\$BALCON\$ZARA/i,
  'Punta Carretas Balconera Plaza de Comida':/^LED\$PCS\$BALCON\$PLAZADECOMIDA/i, 'Punta Carretas Parking':/^LED\$PCS\$PARKING/i,
  'Punta Carretas Columnas 360':/^(LED\$PCS\$COLUMNA360|PUNTASHOPPING\$LED360)/i, 'Punta Carretas Columnas Verticales':/^LED\$PCS\$COLUMNA\$/i,
};
// Soportes que no se comparan, con el motivo.
const ONS_FUERA={'Sense Estandar':'Tráfico pidió no tomarlo: todavía no se publicó su estructura en OnSign.'};
const ONS_GENERICAS=new Set(['INSTITUCIONAL','LAS','LOS','DEL','THE','CLUB','FUNDACION','TIENDA','NUEVO','ENERGIA','INDUSTRIA','MINERIA']);
const ONS_ALIAS={MINISTERIODEINDUSTRIAENERGIAYMINERIA:['MINISTERIO'],CREDITEL:['CREDIRTEL']};
const claveOns=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
// Palabras con las que se busca al anunciante dentro del nombre de la pieza.
function palabrasOns(anun){
  const junto=claveOns(anun);
  const w=[...String(anun).split(/[\s,.]+/).map(claveOns),...(ONS_ALIAS[junto]||[])].filter(x=>x.length>=3&&!ONS_GENERICAS.has(x));
  return [...new Set([junto,...w])].filter(Boolean);
}
// CSV con comillas (los nombres de piezas pueden tener comas).
function leerCSV(txt){
  const filas=[]; let fila=[], campo='', q=false;
  for(let i=0;i<txt.length;i++){ const c=txt[i];
    if(q){ if(c==='"'){ if(txt[i+1]==='"'){ campo+='"'; i++; } else q=false; } else campo+=c; }
    else if(c==='"') q=true; else if(c===','){ fila.push(campo); campo=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&txt[i+1]==='\n') i++; fila.push(campo); filas.push(fila); fila=[]; campo=''; }
    else campo+=c; }
  if(campo||fila.length){ fila.push(campo); filas.push(fila); }
  return filas;
}
// Informe en HTML (el formato que OnSign baja por defecto): una tabla por día con el título "1 de noviembre de 2026".
function leerInformeOnsHTML(txt){
  const MES={enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
  const ent=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCharCode(parseInt(n,16)))
    .replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();
  const dias=new Map();
  txt.split('<table').slice(1).forEach(tb=>{
    const m=/<th[^>]*colspan[^>]*>\s*(\d{1,2}) de ([a-zé]+) de (\d{4})\s*<\/th>/i.exec(tb.slice(0,800));
    if(!m||!MES[m[2].toLowerCase()]) return; // la tabla final ("Players en este informe") no tiene fecha
    const d=`${m[3]}-${String(MES[m[2].toLowerCase()]).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    if(!dias.has(d)) dias.set(d,new Map()); const P=dias.get(d);
    const re=/<tr>\s*<td>\d+<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>(\d+)<\/td>/g;
    let r; while((r=re.exec(tb))){ const c=ent(r[1]), pl=ent(r[2]), n=+r[3];
      if(!P.has(pl)) P.set(pl,new Map()); const C=P.get(pl); C.set(c,(C.get(c)||0)+n); }
  });
  return dias;
}
// Acepta el "Resumen Diario por Player" (una fila por pieza, pantalla y día) y las "Reproducciones individuales" (una fila por salida).
function leerInformeOns(txt){
  if(/^\s*<(!doctype|html)/i.test(txt)){ const dias=leerInformeOnsHTML(txt);
    if(!dias.size) throw new Error('No parece un informe de Reproducción de OnSign (no se encontraron tablas por día).');
    dias.forEach(P=>P.forEach(C=>[...C.keys()].forEach(c=>{ if(c.endsWith('.mp4')&&C.has(c.slice(0,-4))) C.delete(c); })));
    return dias; }
  const f=leerCSV(txt.replace(/^﻿/,'')); if(f.length<2) throw new Error('El archivo está vacío.');
  const h=f[0].map(x=>x.trim()), col=n=>h.indexOf(n);
  const iCont=col('Nombre del contenido'), iPlay=col('Nombre del player');
  const iDia=col('Día'), iN=col('N.º reproducido'), iFH=col('Fecha/Hora');
  if(iCont<0||iPlay<0||(iDia<0&&iFH<0)) throw new Error('No parece un informe de Reproducción de OnSign (faltan las columnas de contenido, player o día).');
  const dias=new Map();
  for(let k=1;k<f.length;k++){ const r=f[k]; if(r.length<h.length) continue;
    let d;
    if(iDia>=0){ const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(r[iDia].trim()); if(!m) continue; d=`${m[3]}-${m[2]}-${m[1]}`; }
    else { d=r[iFH].trim().slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue; }
    const n=iN>=0?Number(r[iN])||0:1;
    if(!dias.has(d)) dias.set(d,new Map()); const P=dias.get(d), pl=r[iPlay].trim();
    if(!P.has(pl)) P.set(pl,new Map()); const C=P.get(pl), c=r[iCont].trim();
    C.set(c,(C.get(c)||0)+n); }
  // Una campaña aparece dos veces: como "Campaña" y como su .mp4. Se cuenta una sola.
  dias.forEach(P=>P.forEach(C=>[...C.keys()].forEach(c=>{ if(c.endsWith('.mp4')&&C.has(c.slice(0,-4))) C.delete(c); })));
  if(!dias.size) throw new Error('No se encontraron días en el archivo.');
  return dias;
}
// Qué parte del nombre de una pieza dice el anunciante. Hay tres formas de nombrar en OnSign:
// "007806_OUTDOOR_FACAL_P_FUNDACION_HERRERA-10" (pauta = "_P_"), la nueva "0354-OUTDOOR_FACAL-PT-X-STIENDA-Y-CIBERLUNES-Z-…"
// (pauta = "-PT-", anunciante después de "-X-", campaña después de "-Y-") y piezas sin código ("tigo_uy_paquetigos…").
// tipo: 'P' pauta reconocida; 'S' sin código (solo cuenta si coincide con un anunciante vendido); null institucional u otra cosa.
function piezaOns(c){
  let i=c.indexOf('_P_'); if(i>=0){ const cola=c.slice(i+3); return {tipo:'P',cola,anun:cola.replace(/^((V|VERTICAL|ASCENSORES|HORIZONTAL)_)+/,'').split('_')[0]}; }
  if(/-PT-/.test(c)){ const m=/-X-(.*?)(?:-Y-|$)/.exec(c), cola=m?c.slice(c.indexOf('-X-')+3):c.slice(c.indexOf('-PT-')+4); return {tipo:'P',cola,anun:m?m[1].replace(/_/g,' '):cola.split(/[-_]/)[0]}; }
  if(/^\d{3,}[_-]/.test(c)||/_[A-Z]{1,2}_/.test(c)) return {tipo:null};
  return {tipo:'S',cola:c,anun:''};
}
let ONS=null, onsDia=null, onsSop=null, onsNombre='', onsIncompletos=new Set();
// Un día con muchas menos salidas que el mejor día del informe quedó cortado (el informe se bajó a mitad del día).
// Segundos que dice el nombre de la pieza al final ("…_ALLBODYDEO-10", "…_15s", "…-15.mp4"); 0 si no dice.
const medianaOns=v=>{ const s=[...v].sort((a,b)=>a-b), m=s.length>>1; return s.length?(s.length%2?s[m]:(s[m-1]+s[m])/2):0; };
function durNombre(c){ const m=/[-_](\d{1,2})s?(?:\.mp4)?$/i.exec(c); const n=m?+m[1]:0; return n>=4&&n<=60?n:0; }
function diasIncompletos(dias){
  const tot=new Map([...dias].map(([d,P])=>[d,[...P.values()].reduce((a,C)=>a+[...C.values()].reduce((x,y)=>x+y,0),0)]));
  const max=Math.max(...tot.values());
  return new Set([...tot].filter(([,v])=>v<max*0.8).map(([d])=>d));
}
const hsOnDe=(n,d)=>{ const m=d.slice(0,7), s=(DATA[m]||DATA[LISTA_MESES[LISTA_MESES.length-1]]).soportes.find(x=>x.nombre===n); return s?s.hsOn:0; };
// Compara un soporte en un día: lo vendido (planilla) contra lo salido (OnSign).
function compararOns(n,d){
  const P=ONS.get(d)||new Map(), re=ONS_PANTALLAS[n];
  const pantallas=re?[...P.keys()].filter(p=>re.test(p)):[];
  const hs=hsOnDe(n,d);
  const ords=(DATOS.ordenes||[]).filter(o=>o.soporte===n&&o.tipo==='TRADICIONAL'&&o.fi&&o.fi<=d&&(!o.ff||o.ff>=d)&&!(o.ff&&o.ff<o.fi));
  // Por anunciante. El espacio fijo es una sola campaña madre: se toma la de más salidas, no la suma de sus spots.
  const an=new Map();
  ords.forEach(o=>{ const k=claveAn(o.anun); let a=an.get(k);
    if(!a){ a={anun:o.anun,nombres:new Set(),camps:new Set(),sal:0,fijo:0,segH:0,fijoDur:0,durs:new Set()}; an.set(k,a); }
    if(o.dur) a.durs.add(o.dur);
    a.nombres.add(o.anun); if(o.camp&&!/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4} /.test(o.camp)) a.camps.add(o.camp); // a veces la planilla trae una fecha como campaña
    if(o.espacioFijo){ a.fijo=Math.max(a.fijo,o.sal); a.fijoDur=Math.max(a.fijoDur,o.dur||0); } else { a.sal+=o.sal; a.segH+=o.sal*(o.dur||0); } });
  const piezas=new Map();
  const info=new Map();
  if(pantallas.length) pantallas.forEach(p=>P.get(p).forEach((v,c)=>{ if(!info.has(c)) info.set(c,piezaOns(c)); if(!info.get(c).tipo) return; piezas.set(c,(piezas.get(c)||0)+v/pantallas.length); }));
  const usadas=new Set();
  const filas=[...an.values()].map(a=>{
    const ws=[...new Set([...a.nombres].flatMap(palabrasOns))];
    // Duración de cada pieza: la de la planilla; si el anunciante tiene varias, la que dice el nombre de la pieza (si coincide) o la más larga.
    const durs=[...a.durs], durDe=c=>{ if(durs.length===1) return durs[0]; const dn=durNombre(c); return durs.includes(dn)?dn:(durs.length?Math.max(...durs):dn||10); };
    let real=0, realSeg=0; piezas.forEach((v,c)=>{ const cola=claveOns(info.get(c).cola); if(ws.some(w=>cola.includes(w))){ real+=v; realSeg+=v*durDe(c); usadas.add(c); } });
    const vend=(a.sal+a.fijo)*hs, vendSeg=(a.segH+a.fijo*a.fijoDur)*hs, r=vend?real/vend:0;
    const est=!pantallas.length?'':real<0.5?'no':r<0.8?'menos':'ok';
    return {k:claveAn(a.anun),anun:a.anun,camps:[...a.camps],durs,salH:a.sal+a.fijo,vend,real,vendSeg,realSeg,r,est};
  }).sort((x,y)=>({no:0,menos:1,ok:2,'':3}[x.est]-{no:0,menos:1,ok:2,'':3}[y.est])||y.vend-x.vend);
  const extra=new Map(), extraSeg=new Map();
  piezas.forEach((v,c)=>{ const x=info.get(c); if(usadas.has(c)||x.tipo!=='P') return; extra.set(x.anun,(extra.get(x.anun)||0)+v); extraSeg.set(x.anun,(extraSeg.get(x.anun)||0)+v*(durNombre(c)||10)); });
  // Total de salidas del soporte en el día contra su mejor día del informe: si da mucho menos, la pantalla estuvo apagada o cortada parte del día.
  const totDia=dd=>{ const Q=ONS.get(dd); return Q?pantallas.reduce((a,p)=>a+(Q.has(p)?[...Q.get(p).values()].reduce((x,y)=>x+y,0):0),0):0; };
  // Se compara con un día típico (la mediana de los días completos), así los fines de semana con menos movimiento no saltan.
  const hoyTot=totDia(d), tipico=ONS.size>1?medianaOns([...ONS.keys()].filter(x=>!onsIncompletos.has(x)).map(totDia)):0;
  const apagada=pantallas.length&&ONS.size>1&&!onsIncompletos.has(d)&&tipico>0&&hoyTot<tipico*0.5?hoyTot/tipico:0;
  const ex=[...extra.entries()].filter(e=>e[1]>=0.5).sort((x,y)=>y[1]-x[1]);
  return {pantallas:pantallas.length,hs,apagada,filas,extra:ex,extraSeg:ex.reduce((s,[k])=>s+extraSeg.get(k),0),extraSegDe:Object.fromEntries(ex.map(([k])=>[k,extraSeg.get(k)]))};
}
// Los días que se miran: uno elegido arriba o todos los completos del informe.
const diasOns=()=>onsDia==='todos'?[...ONS.keys()].sort().filter(d=>!onsIncompletos.has(d)):[onsDia];
const diaDe=(n,d)=>{ const M=DATA[d.slice(0,7)], s=M&&M.soportes.find(x=>x.nombre===n); return s?s.diario[+d.slice(8)-1]:null; };
const fmtCorto=d=>`${+d.slice(8)}/${+d.slice(5,7)}`;
// Un soporte en los días elegidos: lo planificado (motor, como en Soportes) y lo salido (OnSign).
function resumenOns(n){
  const dias=diasOns(), s0=DATA[dias[0].slice(0,7)]&&DATA[dias[0].slice(0,7)].soportes.find(x=>x.nombre===n), r={n,tipo:s0?tipoDe(s0):'',cap:0,contr:0,real:0,extra:0,pantallas:0,hs:hsOnDe(n,dias[0]),apagados:[],diario:[],an:new Map(),ex:new Map()};
  dias.forEach(d=>{ const p=diaDe(n,d)||{capTrad:0,contr:0}, c=compararOns(n,d);
    const real=c.filas.reduce((a,f)=>a+f.realSeg,0);
    r.cap+=p.capTrad; r.contr+=p.contr; r.real+=real; r.extra+=c.extraSeg; r.pantallas=Math.max(r.pantallas,c.pantallas);
    if(c.apagada) r.apagados.push([d,c.apagada]);
    r.diario.push({d,cap:p.capTrad,contr:p.contr,aire:Math.min(p.contr,p.capTrad),exc:Math.max(0,p.contr-p.capTrad),real,extra:c.extraSeg,pant:c.pantallas});
    c.filas.forEach(f=>{ let a=r.an.get(f.k); if(!a){ a={...f,camps:new Set(f.camps),durs:new Set(f.durs),vend:0,real:0,vendSeg:0,realSeg:0,dias:0,salH:0,sops:new Set()}; r.an.set(f.k,a); }
      f.camps.forEach(x=>a.camps.add(x)); f.durs.forEach(x=>a.durs.add(x)); a.vend+=f.vend; a.real+=f.real; a.vendSeg+=f.vendSeg; a.realSeg+=f.realSeg; a.dias++; a.salH=Math.max(a.salH,f.salH); a.sops.add(n); });
    c.extra.forEach(([k,v])=>{ const e=r.ex.get(k)||{v:0,seg:0}; e.v+=v; e.seg+=c.extraSegDe[k]; r.ex.set(k,e); }); });
  r.comparado=r.pantallas>0;
  return r;
}
const estadoAn=a=>!a.vend?'':a.real<0.5?'no':a.real/a.vend<0.8?'menos':'ok';
const ESTADOS={ok:['Cumple','ok'],menos:['De menos','alto'],no:['No salió','exc']};
const fmtDia=d=>{ const f=new Date(d+'T12:00:00'); return f.toLocaleDateString('es-UY',{weekday:'long',day:'numeric',month:'numeric'}); };
const fmtDiaM=d=>{ const s=fmtDia(d); return s[0].toUpperCase()+s.slice(1); };
let RONS=[], onsVerTodos=false;
const _top=document.querySelector('header.top');
const medirTop=()=>{ if(_top) document.documentElement.style.setProperty('--alto-top',(getComputedStyle(_top).position==='sticky'?_top.offsetHeight:0)+'px'); };
// Los títulos quedan fijos solo si la tabla entra entera en su recuadro (si no, la página se correría para el costado).
const ajustarPegado=()=>document.querySelectorAll('.tbl-scroll.pegado').forEach(c=>{ c.classList.remove('fija'); const tb=c.querySelector('table'); if(tb&&c.clientWidth&&tb.scrollWidth<=c.clientWidth+2) c.classList.add('fija'); });
if('ResizeObserver' in window){ const ro=new ResizeObserver(()=>requestAnimationFrame(ajustarPegado)); document.querySelectorAll('.tbl-scroll.pegado').forEach(c=>ro.observe(c.parentElement)); }
medirTop(); addEventListener('resize',()=>{ medirTop(); ajustarPegado(); });
function renderOns(){
  ['sO1','sO2','sO3'].forEach(id=>document.getElementById(id).hidden=!ONS);
  document.getElementById('ctlDia').hidden=vista!=='ons'||!ONS;
  if(!ONS) return;
  const dias=diasOns();
  document.getElementById('onsPer').textContent=(dias.length>1?`Del ${fmtCorto(dias[0])} al ${fmtCorto(dias[dias.length-1])} (${dias.length} días).`:`${fmtDiaM(dias[0])}${onsIncompletos.has(dias[0])?' (día incompleto en el informe: las salidas dan de menos)':''}.`);
  RONS=NOMBRES.filter(n=>sel.has(n)&&!ONS_FUERA[n]).map(resumenOns).filter(r=>r.cap||r.comparado).sort((a,b)=>(b.cap?b.contr/b.cap:0)-(a.cap?a.contr/a.cap:0));
  if(onsSop&&!RONS.some(r=>r.n===onsSop)) onsSop=null;
  // 1 · tabla
  const W=v=>(Math.max(0,Math.min(v,1))*100).toFixed(2)+'%';
  // Una sola barra, como en Soportes: lo que salió en OnSign sobre la capacidad. Si pasa del 100%, roja entera y cuánto se pasó.
  const barras=r=>{ if(!r.comparado) return '';
    const ore=r.cap?r.real/r.cap:0, oex=r.cap?r.extra/r.cap:0, oc=ore+oex;
    if(oc>1) return `<div class="bar"><span class="x" style="left:0;width:100%"></span><b class="sobra">+${pct(oc-1)}</b></div>`;
    return `<div class="bar"><span class="r" style="left:0;width:${W(ore)}"></span><span class="so" style="left:${W(ore)};width:${W(oex)}"></span></div>`; };
  // Estado en una sola etiqueta, como en Soportes; el detalle va en el globo y en la sección 3.
  const cuenta=r=>{ if(!r.comparado) return '<span class="soptipo" style="display:inline">Sin pantallas en el informe</span>';
    const a=[...r.an.values()], c=e=>a.filter(x=>estadoAn(x)===e).length, no=c('no'), menos=c('menos');
    const tip=`${c('ok')} de ${a.length} anunciantes cumplen${menos?` · ${menos} de menos`:''}${no?` · ${no} no salió`:''}${r.ex.size?` · ${r.ex.size} sin orden`:''}`;
    if(no) return `<span class="pill exc" title="${tip}">${no} no salió</span>`;
    if(menos) return `<span class="pill alto" title="${tip}">${menos} de menos</span>`;
    return `<span class="pill ok" title="${tip}">Todos cumplen</span>`; };
  const fila=(r,cls,nombre,sub)=>{ const ocV=r.cap?r.contr/r.cap:0, ocR=r.cap?(r.real+r.extra)/r.cap:0;
    return `<tr ${cls}><td>${nombre}${sub}</td><td class="r num">${fmt(r.cap/60)}</td><td class="r num">${fmt(r.contr/60)}</td><td class="r num">${r.comparado?fmt((r.real+r.extra)/60):'—'}</td>
      <td class="r num">${pct(ocV)}</td><td class="r num">${r.comparado?`<b>${pct(ocR)}</b>`:'—'}</td><td>${barras(r)}</td><td>${cuenta(r)}</td></tr>`; };
  const tb=document.querySelector('#tblOns tbody'), tf=document.querySelector('#tblOns tfoot');
  tb.innerHTML=RONS.length?RONS.map(r=>fila(r,`tabindex="0" data-n="${esc(r.n)}" class="${r.n===onsSop?'sel':''}" style="cursor:pointer"`,`<span class="sopname">${esc(r.n)}</span>`,
      r.apagados.length?`<span class="ons-alerta">${r.apagados.map(([d,x])=>`${fmtCorto(d)}: salió ${pct(x)} de un día típico, ¿estuvo apagada?`).join(' · ')}</span>`:`<span class="soptipo">${esc(r.tipo)} · ${r.hs} h encendido${r.comparado?` · ${r.pantallas} pantalla${r.pantallas===1?'':'s'}`:''}</span>`)).join('')
    :'<tr><td colspan="8" class="vacio">Ningún soporte elegido tiene órdenes ni pantallas en estos días.</td></tr>';
  const C=RONS.filter(r=>r.comparado);
  if(C.length>1){ const T=C.reduce((a,r)=>{ a.cap+=r.cap; a.contr+=r.contr; a.real+=r.real; a.extra+=r.extra; r.an.forEach((v,k)=>a.an.set(r.n+k,v)); r.ex.forEach((v,k)=>a.ex.set(r.n+k,v)); return a; },{cap:0,contr:0,real:0,extra:0,comparado:true,an:new Map(),ex:new Map()});
    tf.innerHTML=fila(T,'',`Total · ${C.length} soportes con pantallas en el informe`,''); } else tf.innerHTML='';
  tb.querySelectorAll('tr[data-n]').forEach(tr=>{ tr.onclick=()=>{ onsSop=onsSop===tr.dataset.n?null:tr.dataset.n; renderOns(); if(onsSop) document.getElementById('sO2').scrollIntoView({behavior:REDUCE?'auto':'smooth'}); }; tr.onkeydown=e=>{ if(e.key==='Enter') tr.onclick(); }; });
  renderOnsDetalle(); ajustarPegado();
}
// Lo que muestran las secciones 2 y 3: el soporte tocado o la suma de los que tienen pantallas en el informe.
function onsEnfocados(){ const C=RONS.filter(r=>r.comparado); return onsSop?C.filter(r=>r.n===onsSop):C; }
const LEY_ESTADOS=`<div class="ons-leyenda"><span><span class="pill ok">Cumple</span>salió al menos el 80% de lo vendido</span><span><span class="pill alto">De menos</span>salió, pero menos del 80% de lo vendido</span><span><span class="pill exc">No salió</span>vendido, pero ninguna vez</span><span><span class="pill neutro">Sin orden</span>salió en la pantalla y no está vendido en la planilla</span>      </div>`;
function renderOnsDetalle(){
  const E=onsEnfocados(), varios=E.length>1, titulo=onsSop||(varios?`suma de ${E.length} soportes`:E.length?E[0].n:'sin soportes');
  document.getElementById('onsT2').textContent='Vendido y salido por día · '+titulo;
  document.getElementById('onsT3').textContent='Anunciantes: vendido contra salido · '+titulo;
  const nC=RONS.filter(r=>r.comparado).length;
  document.getElementById('onsFoco').innerHTML=onsSop?`<span>Mostrando solo <b>${esc(onsSop)}</b>.</span>${nC>1?`<button type="button" class="btn" id="onsSuma">Volver a la suma de los ${nC} soportes</button>`:''}`
    :(nC>1?`<span>Mostrando la <b>suma de ${nC} soportes</b> con pantallas en el informe. Tocá uno en la tabla 1 para verlo solo.</span>`:'');
  const bs=document.getElementById('onsSuma'); if(bs) bs.onclick=()=>{ onsSop=null; renderOns(); };
  // KPIs, como en Soportes
  const T=E.reduce((a,r)=>({cap:a.cap+r.cap,contr:a.contr+r.contr,real:a.real+r.real,extra:a.extra+r.extra}),{cap:0,contr:0,real:0,extra:0});
  const kpi=(l,v,s)=>`<div class="kpi"><span class="eyebrow">${l}</span><span class="v">${v}</span><span class="s">${s}</span></div>`;
  const apag=E.flatMap(r=>r.apagados);
  document.getElementById('onsKpis').innerHTML=E.length?[
    kpi('Capacidad',fmt(T.cap/60)+' min',`${diasOns().length} día${diasOns().length===1?'':'s'}${varios?` · ${E.length} soportes`:''}`),
    kpi('Contratado',fmt(T.contr/60)+' min','Ocupación vendida '+pct(T.cap?T.contr/T.cap:0)),
    kpi('Salió con orden',fmt(T.real/60)+' min',T.contr?pct(T.real/T.contr)+' de lo contratado':'—'),
    kpi('Salió sin orden',fmt(T.extra/60)+' min','avisos que no están en la planilla'),
    kpi('Ocupación en OnSign',pct(T.cap?(T.real+T.extra)/T.cap:0),apag.length?`<span style="color:var(--limite)">${apag.length} día${apag.length===1?'':'s'} con pantalla apagada parte del día</span>`:'todo lo que salió ÷ capacidad'),
  ].join(''):'';
  dibujarOnsDia();
  // 3 · contenidos
  const an=new Map(), ex=new Map();
  E.forEach(r=>{ r.an.forEach((a,k)=>{ const x=an.get(k); if(!x){ an.set(k,{...a,camps:new Set(a.camps),durs:new Set(a.durs),sops:new Set(a.sops)}); return; }
      a.camps.forEach(c=>x.camps.add(c)); a.durs.forEach(c=>x.durs.add(c)); a.sops.forEach(c=>x.sops.add(c)); x.vend+=a.vend; x.real+=a.real; x.vendSeg+=a.vendSeg; x.realSeg+=a.realSeg; x.dias=Math.max(x.dias,a.dias); x.salH=Math.max(x.salH,a.salH); });
    r.ex.forEach((e,k)=>{ const y=ex.get(k)||{v:0,seg:0,sops:new Set()}; y.v+=e.v; y.seg+=e.seg; y.sops.add(r.n); ex.set(k,y); }); });
  const nd=diasOns().length, orden={no:0,menos:1,ok:2,'':3};
  const L=[...an.values()].sort((a,b)=>orden[estadoAn(a)]-orden[estadoAn(b)]||b.vendSeg-a.vendSeg), LIM=15, vis=onsVerTodos?L:L.slice(0,LIM);
  document.querySelector('#tblOnsDet thead').innerHTML=`<tr class="ley"><td colspan="${varios?8:7}">${LEY_ESTADOS}</td></tr><tr><th>Anunciante · campaña</th>${varios?'<th class="r">Soportes</th>':''}<th class="r">Pieza</th><th class="r">Salidas por día vendidas</th><th class="r">Salidas por día en OnSign</th><th class="r">Min. contratados</th><th class="r">Min. salidos</th><th>Salió de lo vendido</th></tr>`;
  document.querySelector('#tblOnsDet tbody').innerHTML=vis.length?vis.map(a=>{ const e=estadoAn(a);
    return `<tr><td><b>${esc(a.anun)}</b><br><span style="color:var(--muted);font-size:12.5px">${esc([...a.camps].join(' · ')||'—')}</span></td>${varios?`<td class="r num" title="${esc([...a.sops].join(', '))}">${a.sops.size}</td>`:''}
      <td class="r num">${[...a.durs].sort((x,y)=>x-y).join(' / ')||'—'} s</td><td class="r num">${fmt(a.vend/a.dias)}</td><td class="r num">${fmt(a.real/a.dias)}</td>
      <td class="r num">${fmt(a.vendSeg/60)}</td><td class="r num"><b>${fmt(a.realSeg/60)}</b></td><td style="white-space:nowrap">${e?`<span class="pill ${ESTADOS[e][1]}">${ESTADOS[e][0]} · ${a.vend?pct(a.real/a.vend):'—'}</span>`:''}</td></tr>`; }).join('')
    :`<tr><td colspan="8" class="vacio">No hay órdenes activas en estos días.</td></tr>`;
  const bt=document.getElementById('onsTodas'); bt.hidden=L.length<=LIM; bt.textContent=onsVerTodos?`Ver solo los ${LIM} primeros`:`Ver los ${L.length} anunciantes`; bt.onclick=()=>{ onsVerTodos=!onsVerTodos; renderOnsDetalle(); };
  const X=[...ex.entries()].sort((a,b)=>b[1].seg-a[1].seg);
  document.getElementById('onsExtra').innerHTML=X.length?`<p><b style="color:var(--ink)">Sin orden:</b> salieron en estas pantallas y no tienen orden en la planilla para ese soporte (minutos en ${nd===1?'el día':`los ${nd} días`}).</p>${X.map(([k,y])=>`<span class="pill neutro" title="${esc([...y.sops].join(', '))}">${esc(k)} · ${fmt(y.seg/60)} min</span>`).join('')}`:'';
  const ej=L.find(a=>estadoAn(a)==='ok'&&a.camps.size===1&&a.durs.size===1&&a.real/a.vend<1.5)||L.find(a=>estadoAn(a)==='ok');
  const dur=ej?[...ej.durs][0]:0, hs=ej&&ej.salH?Math.round(ej.vend/ej.dias/ej.salH*10)/10:0;
  document.getElementById('onsComoDet').innerHTML=`
    <span><b>Salidas por día vendidas</b> y <b>Min. contratados</b> salen de la planilla, igual que en Soportes.${ej?` Ejemplo: ${esc(ej.anun)} tiene ${fmt(ej.salH)} salidas por hora; con ${String(hs).replace('.',',')} horas por día son <b>${fmt(ej.vend/ej.dias)}</b> por día.`:''}</span>
    <span><b>Salidas por día en OnSign</b>: las veces por día que salieron sus piezas${varios?' (sumando los soportes)':''}, en promedio por pantalla. <b>Min. salidos</b> = esas veces × la duración de la pieza.${ej?` ${esc(ej.anun)} salió <b>${fmt(ej.real/ej.dias)}</b> veces por día${dur?` de ${dur} segundos`:''}, el ${pct(ej.real/ej.vend)} de lo vendido: cumple.`:''}</span>
    <span>Pasar del 100% es normal: el Plus y las horas de más que está prendida la pantalla suman salidas.</span>
    <span>Las piezas se reconocen por el nombre del anunciante dentro del nombre de la pieza. Si en OnSign figura con otro nombre, puede aparecer como "No salió" y a la vez como "Sin orden".</span>`;
}
function dibujarOnsDia(){
  if(!window.Chart) return; chartDefaults();
  const E=onsEnfocados(), dias=diasOns();
  const D=dias.map((d,i)=>E.reduce((a,r)=>{ const x=r.diario[i]||{}; a.cap+=x.cap||0; a.contr+=x.contr||0; a.aire+=x.aire||0; a.exc+=x.exc||0; a.real+=x.real||0; a.extra+=x.extra||0; return a; },{d,cap:0,contr:0,aire:0,exc:0,real:0,extra:0}));
  const m=v=>+(v/60).toFixed(1);
  const ds=[
    // Como en Soportes: azul lo contratado que entra; rojo, arriba de la capacidad, lo vendido de más (solo con un soporte: en la suma no se ve).
    {type:'bar',label:'Contratado',data:D.map(x=>m(E.length===1?x.aire:x.contr)),backgroundColor:css('--contr'),stack:'v',order:2,borderRadius:2},
    {type:'bar',label:'Vendido de más',data:D.map(x=>E.length===1?m(x.exc):0),backgroundColor:css('--limite'),stack:'v',order:2,borderRadius:2},
    {type:'bar',label:'Salió en OnSign',data:D.map(x=>m(x.real)),backgroundColor:css('--real'),stack:'o',order:2,borderRadius:2},
    {type:'bar',label:'Sin orden',data:D.map(x=>m(x.extra)),backgroundColor:css('--sinorden'),stack:'o',order:2,borderRadius:2},
    {type:'line',label:'Capacidad',data:D.map(x=>m(x.cap)),borderColor:css('--limite'),borderWidth:2,pointRadius:0,stepped:'middle',order:1},
  ];
  const labels=dias.map(fmtCorto);
  const capRef=Math.max(0,...ds[4].data), tope=Math.max(capRef,...D.map(x=>m(Math.max(x.contr,x.real+x.extra))));
  const opts={responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:REDUCE?false:{duration:400},
    plugins:{legend:{display:false},tooltip:{enabled:false}},
    scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,max:tope?Math.ceil(tope*1.1):undefined,title:{display:innerWidth>=600,text:'minutos por día'},grid:{color:css('--line')}}}};
  if(charts.ons){ charts.ons.data.labels=labels; charts.ons.data.datasets.forEach((x,i)=>x.data=ds[i].data); charts.ons.options.scales.y.max=opts.scales.y.max; charts.ons.update(); }
  else { charts.ons=new Chart(document.getElementById('chOns'),{data:{labels,datasets:ds},options:opts}); enlazarLectura(charts.ons,lecturaOns); }
  ONS_DIA=D; lecturaOns(null);
}
let ONS_DIA=[];
function lecturaOns(i){
  const el=document.getElementById('lecOns'); if(!el||!ONS_DIA.length) return;
  const x=i==null?ONS_DIA.reduce((a,d)=>({cap:a.cap+d.cap,contr:a.contr+d.contr,real:a.real+d.real,extra:a.extra+d.extra}),{cap:0,contr:0,real:0,extra:0}):ONS_DIA[i];
  el.classList.toggle('activa',i!=null);
  el.innerHTML=`<span class="t">${i==null?(ONS_DIA.length>1?'Todos los días':fmtDiaM(ONS_DIA[0].d)):fmtDiaM(ONS_DIA[i].d)}</span><span>${punto('--contr')}Contratado <span class="v">${fmt(x.contr/60)}</span> min</span><span>${punto('--real')}Salió con orden <span class="v">${fmt(x.real/60)}</span> min</span><span>${punto('--sinorden')}Sin orden <span class="v">${fmt(x.extra/60)}</span> min</span><span>Capacidad <span class="v">${fmt(x.cap/60)}</span> min</span><span>Salió <span class="v">${x.contr?pct(x.real/x.contr):'—'}</span> de lo contratado</span>${i==null?'<span class="ayuda">Pasá el mouse por un día para ver el detalle.</span>':''}`;
}
function cargarOns(file){
  const tit=document.getElementById('onsTitulo'), sub=document.getElementById('onsSub');
  if(!file) return;
  if(file.size>300e6){ tit.textContent='El archivo es demasiado grande.'; return; }
  tit.textContent='Leyendo '+file.name+'…'; sub.textContent='';
  file.text().then(txt=>{
    ONS=leerInformeOns(txt); onsNombre=file.name;
    const dias=[...ONS.keys()].sort(); onsIncompletos=dias.length>1?diasIncompletos(ONS):new Set();
    const completos=dias.filter(d=>!onsIncompletos.has(d)); onsDia=completos.length>1?'todos':(completos.length?completos:dias).slice(-1)[0]; onsSop=null;
    document.getElementById('onsDia').innerHTML=(completos.length>1?`<option value="todos" selected>Todos (${fmtCorto(completos[0])} al ${fmtCorto(completos[completos.length-1])})</option>`:'')+dias.map(d=>`<option value="${d}" ${d===onsDia?'selected':''}>${fmtDiaM(d)}${onsIncompletos.has(d)?' · incompleto':''}</option>`).join('');
    tit.textContent='Informe cargado: '+file.name;
    sub.textContent=`${dias.length===1?'1 día':dias.length+' días'}: ${fmtDia(dias[0])}${dias.length>1?' al '+fmtDia(dias[dias.length-1]):''}. Arriba podés elegir un solo día.${onsIncompletos.size?' Los marcados "incompleto" quedaron cortados (el informe se bajó a mitad del día).':''}`;
    document.getElementById('onsBtn').textContent='Cambiar informe';
    renderOns(); armarSecciones();
  }).catch(e=>{ ONS=null; tit.textContent='No se pudo leer el archivo.'; sub.textContent=e&&e.message||''; renderOns(); });
}
(()=>{ const z=document.getElementById('onsSoltar'), inp=document.getElementById('onsArchivo');
  inp.onchange=()=>{ cargarOns(inp.files[0]); inp.value=''; };
  z.ondragover=e=>{ e.preventDefault(); z.classList.add('encima'); }; z.ondragleave=()=>z.classList.remove('encima');
  z.ondrop=e=>{ e.preventDefault(); z.classList.remove('encima'); cargarOns(e.dataTransfer.files[0]); };
  document.getElementById('onsDia').onchange=e=>{ onsDia=e.target.value; renderOns(); };
})();

function renderTodo(){ if(vista==='sop'){ renderTabla(); renderDetalle(); } else if(vista==='anun') renderAnun(); else if(vista==='ons') renderOns(); else renderDisp(); ajustarPegado(); }
const sm=document.getElementById('selMes');
sm.innerHTML=LISTA_MESES.map(k=>`<option value="${k}" ${k===mes?'selected':''}>${MESES[k]}${k>MES_HOY?' · cargado hasta hoy':k===MES_HOY?' · en curso':''}</option>`).join('');
sm.onchange=()=>{ mes=sm.value; renderTodo(); };
document.getElementById('fechaFoto2').textContent=FOTO_TXT;
document.querySelectorAll('.fechaFotoX').forEach(e=>e.textContent=FOTO_TXT);
document.getElementById('estadoDatos').textContent=`Datos de la planilla de Tráfico de Pautas leídos el ${FOTO_TXT} (${DATOS.cantidadOrdenes} órdenes). Los meses que vienen muestran lo cargado hasta hoy. Las órdenes dadas de baja no figuran.`;
armarFiltro(); cambiarVista(vista);
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ if(Object.keys(charts).length) retema(); });
// Cambio de tema: se redibujan los gráficos con los colores nuevos.
const retema=()=>{ Object.values(charts).forEach(c=>c.destroy()); charts={}; Object.keys(intro).forEach(k=>intro[k]=false); if(visto.s2) dibujarDia(); if(visto.s4) dibujarPlus(); if(visto.sMes) dibujarMes(); if(visto.sA2){ dibujarAnSop(); dibujarAnHist(); } if(vista==='ons'&&ONS) dibujarOnsDia(); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',retema);
new MutationObserver(retema).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

  rcControlarMotor().then(r=>{ if(r&&r.cambio){ const p=document.createElement('p'); p.className='aviso-motor';
    p.textContent='La app de tráfico cambió desde que se copió su motor ('+r.copiado+'). Los números pueden no coincidir: hay que actualizar el motor.';
    document.querySelector('.side-foot').prepend(p); } });
})();
