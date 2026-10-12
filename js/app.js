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
try{ const h=location.hash.slice(1); if(['sop','anun','disp'].includes(h)) vista=h; }catch(e){}
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
function tot(s){ const r={cap:0,contr:0,plus:0,pe:0,capPE:0,diasExc:0};
  s.diario.forEach(d=>{ r.cap+=d.capTrad; r.contr+=d.contr; r.plus+=d.plus; r.pe+=d.peVend; r.capPE+=d.capPE; if(d.contr>d.capTrad+1) r.diasExc++; });
  return r; }
function estado(o){ if(o>1.005) return '<span class="pill exc">Sobrevendido</span>'; if(o>=.85) return '<span class="pill alto">Casi lleno</span>'; return '<span class="pill ok">Con lugar</span>'; }
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
  const maxEsc=Math.max(1.05,...rows.map(r=>Math.max((r.t.contr+r.t.plus)/r.t.cap, r.t.contr/r.t.cap)));
  const ant=mesAnterior(mes); document.getElementById('thDelta').textContent=ant?'vs. '+nomMesL(ant):'vs. mes anterior';
  const delta=(n,oc)=>{ if(!ant) return '<span class="delta eq">—</span>'; const s=n?sopDe(ant,n):null;
    const tA=n?tot(s):elegidos().map(x=>tot(sopDe(ant,x.nombre))).reduce((a,x)=>({cap:a.cap+x.cap,contr:a.contr+x.contr}),{cap:0,contr:0});
    return deltaHTML(oc, tA.cap?tA.contr/tA.cap:0, nomMesL(ant)); };
  const barra=(t)=>{ const oc=t.contr/t.cap, W=v=>(v/maxEsc*100).toFixed(2)+'%', cW=Math.min(oc,1), xW=Math.max(0,oc-1);
    return `<div class="bar" title="Contratado ${pct(oc)} · con Plus ${pct((t.contr+t.plus)/t.cap)}"><span class="c" style="left:0" data-w="${W(cW)}"></span>${xW>0?`<span class="x" style="left:${W(1)}" data-w="${W(xW)}"></span>`:''}${t.plus>0?`<span class="p" style="left:${W(oc)}" data-w="${W(t.plus/t.cap)}"></span>`:''}<span class="cap" style="left:${W(1)}"></span></div>`; };
  tb.innerHTML=rows.map(({s,t})=>`<tr tabindex="0" data-n="${esc(s.nombre)}" class="${s.nombre===foco?'sel':''}" title="${s.nombre===foco?'Tocá de nuevo para volver a la suma':'Ver el detalle de este soporte'}"><td><span class="sopname">${esc(s.nombre)}</span><span class="soptipo">${esc(tipoDe(s))} · ${s.hsOn} h encendido</span></td>
      <td class="r num">${fmt(t.cap/60)}</td><td class="r num">${fmt(t.contr/60)}</td><td class="r num">${fmt(t.plus/60)}</td><td class="r num">${pct(t.contr/t.cap)}</td><td class="r">${delta(s.nombre,t.contr/t.cap)}</td><td>${barra(t)}</td><td>${estado(t.contr/t.cap)}</td></tr>`).join('');
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
  const diario=D.dias.map((_,i)=>E.reduce((a,s)=>{ const d=s.diario[i]; a.capTrad+=d.capTrad; a.contr+=d.contr; a.plus+=d.plus; return a; },{capTrad:0,contr:0,plus:0}));
  const camp=new Map();
  E.forEach(s=>s.campanias.forEach(c=>{ const k=claveAn(c.anun)+'|'+claveAn(c.camp)+'|'+c.dur; let x=camp.get(k);
    if(!x){ x={...c,sops:new Set(),contrSeg:0,plusSeg:0,dias:0,contrSalH:0,plusSalHMax:0}; camp.set(k,x); }
    x.sops.add(s.nombre); x.contrSeg+=c.contrSeg; x.plusSeg+=c.plusSeg; x.dias=Math.max(x.dias,c.dias); x.contrSalH=Math.max(x.contrSalH,c.contrSalH); x.plusSalHMax=Math.max(x.plusSalHMax,c.plusSalHMax); }));
  const t=E.reduce((a,s)=>{ const x=tot(s); a.cap+=x.cap; a.contr+=x.contr; a.plus+=x.plus; a.pe+=x.pe; a.capPE+=x.capPE; if(x.contr>x.cap*1.005) a.sopExc++; a.diasExc=Math.max(a.diasExc,x.diasExc); return a; },{cap:0,contr:0,plus:0,pe:0,capPE:0,sopExc:0,diasExc:0});
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

// ───── 2 · Diario
let AG=null;
function dibujarDia(){
  if(!AG||!window.Chart) return; chartDefaults();
  const D=DATA[mes], A=AG; let acC=0,acCap=0;
  const acum=A.diario.map(d=>{ acC+=d.contr+d.plus; acCap+=d.capTrad; return acCap?Math.round(acC/acCap*100):0; });
  const ds=[
    {type:'bar',label:'Contratado',data:A.diario.map(d=>+(d.contr/60).toFixed(1)),backgroundColor:css('--contr'),hoverBackgroundColor:css('--contr-h'),stack:'a',yAxisID:'y',order:2,borderRadius:2},
    {type:'bar',label:'Plus',data:A.diario.map(d=>+(d.plus/60).toFixed(1)),backgroundColor:css('--plus'),hoverBackgroundColor:css('--plus-hover'),stack:'a',yAxisID:'y',order:2,borderRadius:2},
    {type:'line',label:'Capacidad',data:A.diario.map(d=>+(d.capTrad/60).toFixed(1)),borderColor:css('--limite'),borderWidth:2,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:css('--limite'),stepped:'middle',yAxisID:'y',order:1},
    {type:'line',label:'Acumulado %',data:acum,borderColor:css('--warn'),borderDash:[5,4],borderWidth:2,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:css('--warn'),yAxisID:'y2',order:0},
  ];
  const labels=D.dias.map(d=>+d.slice(8)), nomMes=(MESES[mes]||'').split(' ')[0].toLowerCase();
  const PASO=45, inicioLineas=labels.length*PASO+350, pasoLinea=35;
  const prevY=ctx=>{ const d=ctx.chart.data.datasets[ctx.datasetIndex]; return ctx.index===0?ctx.chart.scales[d.yAxisID].getPixelForValue(d.data[0]):ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index-1].getProps(['y'],true).y; };
  const trazo=()=>REDUCE?{}:{
    x:{type:'number',easing:'linear',duration:pasoLinea,from:NaN,delay(ctx){ if(ctx.type!=='data'||ctx.xStarted||!intro.dia) return 0; ctx.xStarted=true; return inicioLineas+ctx.index*pasoLinea; }},
    y:{type:'number',easing:'linear',duration:pasoLinea,from:prevY,delay(ctx){ if(ctx.type!=='data'||ctx.yStarted||!intro.dia) return 0; ctx.yStarted=true; return inicioLineas+ctx.index*pasoLinea; }}};
  ds[2].animations=trazo(); ds[3].animations=trazo();
  if(charts.dia){ charts.dia.data.labels=labels; charts.dia.data.datasets.forEach((d,i)=>{ d.data=ds[i].data; }); charts.dia.update(); lecturaDia(null); return; }
  charts.dia=new Chart(document.getElementById('chDia'),{
    data:{labels,datasets:ds},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      animation:REDUCE?false:{duration:500,easing:'easeOutCubic',
        delay:ctx=>(ctx.type==='data'&&ctx.mode==='default'&&intro.dia&&ctx.chart.data.datasets[ctx.datasetIndex].type==='bar')?ctx.dataIndex*PASO:0,
        onComplete:()=>{ intro.dia=false; }},
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{stacked:true,grid:{display:false},ticks:{maxRotation:0,autoSkipPadding:8}},
        y:{stacked:true,beginAtZero:true,title:{display:innerWidth>=600,text:'minutos por día'},grid:{color:css('--line')}},
        y2:{position:'right',beginAtZero:true,suggestedMax:120,grid:{display:false},ticks:{callback:v=>v+'%'}}}}
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
  const tA=ant?A.E.map(s=>tot(sopDe(ant,s.nombre))).reduce((a,x)=>({cap:a.cap+x.cap,contr:a.contr+x.contr,plus:a.plus+x.plus}),{cap:0,contr:0,plus:0}):null;
  const vsAnt=(act,prev)=>tA&&tA.cap?'<br>'+deltaHTML(act,prev,nomMesL(ant),'kpi'):'';
  document.getElementById('kpis').innerHTML=n?[
    ['Capacidad del mes',fmt(t.cap/60)+' min',s1?`${s1.bloques} bloques · ${s1.progsXHora} prog/h · ${s1.hsOn} h`:`${n} soportes sumados`],
    ['Contratado',fmt(t.contr/60)+' min','Ocupación vendida '+pct(t.contr/t.cap)+vsAnt(t.contr/t.cap,tA&&tA.contr/tA.cap)],
    ['Plus entregado',fmt(t.plus/60)+' min',t.contr>0?'+'+pct(t.plus/t.contr)+' sobre lo contratado':'—'],
    ['Exhibido total',fmt((t.contr+t.plus)/60)+' min','Ocupación real '+pct((t.contr+t.plus)/t.cap)+vsAnt((t.contr+t.plus)/t.cap,tA&&(tA.contr+tA.plus)/tA.cap)],
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
  if(i==null){ const t=AG.diario.reduce((a,d)=>({cap:a.cap+d.capTrad,c:a.c+d.contr,p:a.p+d.plus}),{cap:0,c:0,p:0});
    el.classList.remove('activa');
    el.innerHTML=`<span class="t">Todo ${nm}</span><span>${punto('--contr')}Contratado <span class="v">${fmt(t.c/60)}</span> min</span><span>${punto('--plus')}Plus <span class="v">${fmt(t.p/60)}</span> min</span><span>${punto('--limite')}Capacidad <span class="v">${fmt(t.cap/60)}</span> min</span><span>Ocupación real <span class="v">${pct((t.c+t.p)/t.cap)}</span></span><span class="ayuda">Pasá el mouse por un día para ver el detalle.</span>`; return; }
  const d=AG.diario[i], al=d.contr+d.plus, lib=d.capTrad-al;
  let acC=0,acCap=0; for(let k=0;k<=i;k++){ acC+=AG.diario[k].contr+AG.diario[k].plus; acCap+=AG.diario[k].capTrad; }
  el.classList.add('activa');
  el.innerHTML=`<span class="t">${+D.dias[i].slice(8)} de ${nm}</span><span>${punto('--contr')}Contratado <span class="v">${fmt(d.contr/60)}</span> min</span><span>${punto('--plus')}Plus <span class="v">${fmt(d.plus/60)}</span> min</span><span>${punto('--limite')}Capacidad <span class="v">${fmt(d.capTrad/60)}</span> min</span><span>Al aire <span class="v">${pct(al/d.capTrad)}</span> del día</span><span>${lib>=0?`Libre <span class="v">${fmt(lib/60)}</span> min`:`Vendido de más <span class="v">${fmt(-lib/60)}</span> min`}</span><span>${punto('--warn')}Acumulado real del mes <span class="v">${acCap?pct(acC/acCap):'—'}</span></span>`;
}
let SERIE_MES=[];
function lecturaMes(i){
  const el=document.getElementById('lecMes'); if(!el||!SERIE_MES.length) return;
  const sel_=i==null; if(i==null) i=LISTA_MESES.indexOf(mes);
  const x=SERIE_MES[i], m=x.m, est=m>MES_HOY?' · cargado hasta hoy':m===MES_HOY?' · en curso':'';
  el.classList.toggle('activa',!sel_);
  el.innerHTML=`<span class="t">${MESES[m]}<span style="font-weight:400;color:var(--muted);font-size:12px">${est}</span></span><span>${punto('--contr')}Contratado <span class="v">${fmt(x.contr/60)}</span> min</span><span>${punto('--plus')}Plus <span class="v">${fmt(x.plus/60)}</span> min</span><span>${punto('--limite')}Capacidad <span class="v">${fmt(x.cap/60)}</span> min</span><span>${punto('--warn')}Vendida <span class="v">${x.cap?pct(x.contr/x.cap):'—'}</span></span><span>Real con Plus <span class="v">${x.cap?pct((x.contr+x.plus)/x.cap):'—'}</span></span>${sel_?'<span class="ayuda">Pasá el mouse por otro mes para compararlo.</span>':''}`;
}

// ───── 2 · Mes a mes
function serieMensual(nombres,filtroCamp){
  return LISTA_MESES.map(m=>{ let cap=0,contr=0,plus=0;
    nombres.forEach(n=>{ const s=sopDe(m,n); if(!s) return;
      if(filtroCamp){ s.campanias.filter(filtroCamp).forEach(c=>{ contr+=c.contrSeg; plus+=c.plusSeg; }); }
      else s.diario.forEach(d=>{ cap+=d.capTrad; contr+=d.contr; plus+=d.plus; }); });
    return {m,cap,contr,plus}; });
}
function dibujarMes(){
  if(!AG||!window.Chart) return; chartDefaults();
  const S=serieMensual(AG.E.map(s=>s.nombre)), iSel=LISTA_MESES.indexOf(mes); SERIE_MES=S;
  const col=(v,i)=>i===iSel?css(v):aclarar(css(v),(i>LISTA_MESES.indexOf(MES_HOY)?62:45)+(v==='--plus'?10:0));
  const labels=S.map(x=>corto(x.m)), dc=S.map(x=>Math.round(x.contr/60)), dp=S.map(x=>Math.round(x.plus/60)), dcap=S.map(x=>Math.round(x.cap/60)), docu=S.map(x=>x.cap?Math.round(x.contr/x.cap*100):0);
  const bgC=S.map((_,i)=>col('--contr',i)), bgP=S.map((_,i)=>col('--plus',i));
  if(charts.mes){ const d=charts.mes.data; d.labels=labels; d.datasets[0].data=dc; d.datasets[0].backgroundColor=bgC; d.datasets[1].data=dp; d.datasets[1].backgroundColor=bgP; d.datasets[2].data=dcap; d.datasets[3].data=docu; charts.mes.update(); lecturaMes(null); return; }
  charts.mes=new Chart(document.getElementById('chMes'),{
    data:{labels,datasets:[
      {type:'bar',label:'Contratado',data:dc,backgroundColor:bgC,hoverBackgroundColor:css('--contr-h'),stack:'a',yAxisID:'y',order:2,borderRadius:3},
      {type:'bar',label:'Plus',data:dp,backgroundColor:bgP,hoverBackgroundColor:css('--plus-hover'),stack:'a',yAxisID:'y',order:2,borderRadius:3},
      {type:'line',label:'Capacidad',data:dcap,borderColor:css('--limite'),borderWidth:2,pointRadius:3,pointBackgroundColor:css('--limite'),yAxisID:'y',order:1},
      {type:'line',label:'Ocupación vendida',data:docu,borderColor:css('--warn'),borderDash:[5,4],borderWidth:2,pointRadius:3,pointBackgroundColor:css('--warn'),yAxisID:'y2',order:0}]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},animation:cascada('mes',110),
      onClick:(e,els)=>{ if(!els.length) return; mes=LISTA_MESES[els[0].index]; document.getElementById('selMes').value=mes; renderTodo(); },
      onHover:(e,els)=>{ e.native.target.style.cursor=els.length?'pointer':'default'; },
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,title:{display:innerWidth>=600,text:'minutos por mes'},grid:{color:css('--line')}},
        y2:{position:'right',beginAtZero:true,suggestedMax:120,grid:{display:false},ticks:{callback:v=>v+'%'}}}}});
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
  anun:[['sA1','Ranking'],['sA2','Reporte del anunciante']], disp:[['sD','Disponible para vender']]};
const TITULOS={sop:'Soportes',anun:'Anunciantes',disp:'Disponible para vender'};
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
  document.getElementById('vSop').hidden=v!=='sop'; document.getElementById('vAnun').hidden=v!=='anun'; document.getElementById('vDisp').hidden=v!=='disp';
  document.getElementById('ctlMes').hidden=v==='disp';
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

function renderTodo(){ if(vista==='sop'){ renderTabla(); renderDetalle(); } else if(vista==='anun') renderAnun(); else renderDisp(); }
const sm=document.getElementById('selMes');
sm.innerHTML=LISTA_MESES.map(k=>`<option value="${k}" ${k===mes?'selected':''}>${MESES[k]}${k>MES_HOY?' · cargado hasta hoy':k===MES_HOY?' · en curso':''}</option>`).join('');
sm.onchange=()=>{ mes=sm.value; renderTodo(); };
document.getElementById('fechaFoto2').textContent=FOTO_TXT;
document.querySelectorAll('.fechaFotoX').forEach(e=>e.textContent=FOTO_TXT);
document.getElementById('estadoDatos').textContent=`Datos de la planilla de Tráfico de Pautas leídos el ${FOTO_TXT} (${DATOS.cantidadOrdenes} órdenes). Los meses que vienen muestran lo cargado hasta hoy. Las órdenes dadas de baja no figuran.`;
armarFiltro(); cambiarVista(vista);
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ if(Object.keys(charts).length) retema(); });
// Cambio de tema: se redibujan los gráficos con los colores nuevos.
const retema=()=>{ Object.values(charts).forEach(c=>c.destroy()); charts={}; Object.keys(intro).forEach(k=>intro[k]=false); if(visto.s2) dibujarDia(); if(visto.s4) dibujarPlus(); if(visto.sMes) dibujarMes(); if(visto.sA2){ dibujarAnSop(); dibujarAnHist(); } };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',retema);
new MutationObserver(retema).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

  rcControlarMotor().then(r=>{ if(r&&r.cambio){ const p=document.createElement('p'); p.className='aviso-motor';
    p.textContent='La app de tráfico cambió desde que se copió su motor ('+r.copiado+'). Los números pueden no coincidir: hay que actualizar el motor.';
    document.querySelector('.side-foot').prepend(p); } });
})();
