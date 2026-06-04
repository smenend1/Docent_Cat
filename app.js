const $ = (id) => document.getElementById(id);
const storeKey = 'docentcat-pwa-v2-curriculum';
const fields = ['stage','subject','level','templateType','topic','duration','groupProfile','language','saProduct','saContext','saMethod','saAssessment','sessionCount','sessionMinutes','sessionFocus','worksheetType','worksheetLevel','activityCount','rubricTask','rubricScale','rubricCriteria','studentWork','improvementGoal','feedbackTone','feedbackDetail','customCurriculum'];
const multiFields = ['ceSelect','caSelect','sabersSelect'];
const outputs = {};
let curriculum = mergeDeep({}, window.DOCENTCAT_CURRICULUM || {});
const templates = window.DOCENTCAT_TEMPLATES || {};

class OutputCard extends HTMLElement {
  connectedCallback(){
    const tpl = document.getElementById('outputTemplate');
    this.appendChild(tpl.content.cloneNode(true));
    const key = this.dataset.output;
    outputs[key] = this.querySelector('.outputText');
    this.querySelector('.copyBtn').onclick = () => copyText(outputs[key].textContent);
    this.querySelector('.downloadBtn').onclick = () => downloadText(`${key}-${dateSlug()}.txt`, outputs[key].textContent);
    this.querySelector('.printBtn').onclick = () => printProfessional(key);
  }
}
customElements.define('output-card', OutputCard);

const get = id => ($(id)?.value || '').trim();
const selectedValues = id => Array.from($(id)?.selectedOptions || []).map(o => o.value);
const clean = s => String(s).replace(/[<>]/g,'');
function lines(items){ return (items || []).map(x=>`- ${x}`).join('\n'); }
function numbered(items){ return (items || []).map((x,i)=>`${i+1}. ${x}`).join('\n'); }
function titleCase(s){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
function currentData(){ return curriculum[get('stage')]?.[get('level')]?.[get('subject')] || {ce:[], ca:[], sabers:[]}; }
function pickedCurriculum(){
  const data = currentData();
  return {
    ce: selectedValues('ceSelect').length ? selectedValues('ceSelect') : data.ce.slice(0,2),
    ca: selectedValues('caSelect').length ? selectedValues('caSelect') : data.ca.slice(0,3),
    sabers: selectedValues('sabersSelect').length ? selectedValues('sabersSelect') : data.sabers.slice(0,3)
  };
}
function context(){
  const picked = pickedCurriculum();
  return {
    etapa:get('stage'), materia:get('subject') || 'Matèria no indicada', curs:get('level'), tema:get('topic') || 'Tema pendent de concretar',
    durada:get('duration') || 'Durada no indicada', grup:get('groupProfile') || 'Grup ordinari amb diversitat de ritmes', idioma:get('language'),
    plantilla:get('templateType'), ce:picked.ce, ca:picked.ca, sabers:picked.sabers
  };
}
function commonHeader(c){return `Context\nEtapa: ${c.etapa}\nMatèria: ${c.materia}\nCurs: ${c.curs}\nTema/repte: ${c.tema}\nDurada: ${c.durada}\nPerfil del grup: ${c.grup}\nPlantilla: ${c.plantilla}\nIdioma: ${c.idioma}\n\nCompetències específiques seleccionades\n${lines(c.ce)}\n\nCriteris d'avaluació seleccionats\n${lines(c.ca)}\n\nSabers seleccionats\n${lines(c.sabers)}\n`;}

function populateSelect(select, values, keep = true){
  const previous = keep ? new Set(selectedValues(select.id)) : new Set();
  select.innerHTML = '';
  values.forEach(v => {
    const opt = document.createElement('option'); opt.value = v; opt.textContent = v;
    if(previous.has(v)) opt.selected = true;
    select.appendChild(opt);
  });
}
function populateContextSelectors(){
  populateSelect($('level'), Object.keys(curriculum[get('stage')] || {}), true);
  if(!$('level').value) $('level').selectedIndex = 0;
  const subjects = Object.keys(curriculum[get('stage')]?.[get('level')] || {});
  populateSelect($('subject'), subjects, true);
  if(!$('subject').value) $('subject').selectedIndex = 0;
  populateSelect($('templateType'), Object.keys(templates), true);
  if(!$('templateType').value) $('templateType').selectedIndex = 0;
  populateCurriculumLists(false);
  renderTemplatePreview();
}
function populateCurriculumLists(keep = true){
  const data = currentData();
  populateSelect($('ceSelect'), data.ce || [], keep);
  populateSelect($('caSelect'), data.ca || [], keep);
  populateSelect($('sabersSelect'), data.sabers || [], keep);
}
function selectCore(){
  ['ceSelect','caSelect','sabersSelect'].forEach(id => Array.from($(id).options).forEach((opt,i)=> opt.selected = i < (id === 'sabersSelect' ? 3 : 2)));
  save();
  toast('Selecció suggerida aplicada');
}
function renderTemplatePreview(){
  const root = $('templatePreview'); if(!root) return;
  root.innerHTML = '';
  Object.entries(templates).forEach(([name, parts]) => {
    const card = document.createElement('button');
    card.className = 'template-card';
    card.type = 'button';
    card.innerHTML = `<strong>${name}</strong><span>${parts.join(' · ')}</span>`;
    card.onclick = () => { $('templateType').value = name; renderTemplatePreview(); save(); };
    if(get('templateType') === name) card.classList.add('selected');
    root.appendChild(card);
  });
}

const generators = {
  sa(){
    const c=context(), product=get('saProduct')||'producte final aplicat al context proper', real=get('saContext')||'repte vinculat a la vida quotidiana', method=get('saMethod'), assessment=get('saAssessment');
    return `${commonHeader(c)}\nSITUACIÓ D'APRENENTATGE\nTítol: ${titleCase(c.tema)}: del problema real a una proposta d'acció\n\nRepte inicial\nCom podem comprendre ${c.tema.toLowerCase()} i elaborar ${product} que ajudi a donar resposta a ${real}?\n\nIntencionalitat\nL'alumnat parteix d'una situació propera, analitza informació, construeix coneixement i el transfereix a un producte final comunicable. La proposta combina ${method.toLowerCase()} amb avaluació ${assessment.toLowerCase()}.\n\nObjectius d'aprenentatge\n${lines([`Identificar les idees clau relacionades amb ${c.tema}.`,`Aplicar els sabers seleccionats a una situació real o versemblant.`,`Argumentar decisions amb evidències, dades o exemples.`,`Treballar cooperativament assumint rols i responsabilitats.`,`Comunicar el producte final amb claredat i rigor.`])}\n\nConnexió curricular\nCompetències específiques:\n${lines(c.ce)}\n\nCriteris d'avaluació que guien les evidències:\n${lines(c.ca)}\n\nSabers que es mobilitzen:\n${lines(c.sabers)}\n\nSeqüència resumida\n1. Activació: pregunta inicial, coneixements previs i formulació d'hipòtesis.\n2. Construcció: fonts, explicacions breus, pràctica guiada i activitats cooperatives.\n3. Aplicació: elaboració progressiva de ${product}.\n4. Revisió: coavaluació amb llista de comprovació i millora del producte.\n5. Transferència: presentació, debat i reflexió individual.\n\nAvaluació\n- Evidències: diari de treball, activitats parcials, producte final i exposició/reflexió.\n- Instruments: rúbrica, observació docent, autoavaluació i coavaluació.\n- Criteris visibles per a l'alumnat: comprensió del repte, ús correcte dels sabers, qualitat de l'argumentació, cooperació i comunicació.\n\nAtenció a la diversitat\n- Opcions de resposta: text, esquema, àudio, infografia o presentació.\n- Bastides: vocabulari clau, exemples resolts, plantilla de planificació i parelles de suport.\n- Ampliació: comparació de casos, dades addicionals o proposta d'acció més complexa.\n\nMetacognició final\nQuè he après? Quina evidència ho demostra? Què milloraria si repetís el producte?`;},
  sessions(){
    const c=context(), n=Math.max(1, Math.min(20, Number(get('sessionCount'))||6)), min=get('sessionMinutes')||55, focus=get('sessionFocus');
    const phases=['Activació i diagnosi','Exploració guiada','Construcció de sabers','Pràctica cooperativa','Aplicació al repte','Revisió i feedback','Producció final','Presentació i transferència','Avaluació i metacognició'];
    let out=`${commonHeader(c)}\nPLANIFICACIÓ DE SESSIONS\nEnfocament: ${focus}\nDurada per sessió: ${min} minuts\n\n`;
    for(let i=1;i<=n;i++){
      const phase=phases[Math.min(phases.length-1, Math.floor((i-1)*phases.length/n))];
      const saber=c.sabers[(i-1)%Math.max(1,c.sabers.length)] || c.tema;
      const criteri=c.ca[(i-1)%Math.max(1,c.ca.length)] || 'Criteri a concretar';
      out+=`Sessió ${i}. ${phase}\nObjectiu: avançar en ${c.tema.toLowerCase()} mobilitzant: ${saber}\nEstructura: 5' inici + ${Math.max(20,Number(min)-20)}' activitat principal + 10' tancament.\nActivitats: pregunta guia, treball individual o cooperatiu, posada en comú i evidència breu d'aprenentatge.\nMaterial: pissarra, dossier o dispositiu, plantilla de treball i criteris visibles.\nAvaluació: ${criteri}\n\n`;
    }
    return out + `Recomanació: reserva una sessió intermèdia per reorientar segons evidències i una part final per millorar el producte abans de qualificar.`;},
  worksheets(){
    const c=context(), type=get('worksheetType'), level=get('worksheetLevel'), count=Math.max(3,Math.min(20,Number(get('activityCount'))||8));
    let acts=[]; for(let i=1;i<=count;i++){ const saber=c.sabers[(i-1)%Math.max(1,c.sabers.length)] || c.tema; acts.push(`${i}. Activitat ${i}: resol una tasca de ${type.toLowerCase()} sobre "${saber}". Inclou justificació breu i una evidència del procés.`)}
    return `${commonHeader(c)}\nFITXA DE TREBALL\nTipus: ${type}\nNivell: ${level}\n\nNom: _______________________   Data: ___________\n\nObjectiu de la fitxa\nComprendre i aplicar els conceptes principals de ${c.tema.toLowerCase()} en activitats progressives.\n\nAbans de començar\nEscriu tres idees que ja coneixes sobre el tema i una pregunta que voldries resoldre.\n\nActivitats\n${acts.join('\n')}\n\nCriteris d'èxit\n${lines(c.ca)}\n\nAdaptació bàsica\n- Redueix el nombre d'activitats obligatòries a les imparells.\n- Dona banc de paraules, exemple inicial i passos numerats.\n\nAmpliació\n- Crea una activitat nova que connecti ${c.tema.toLowerCase()} amb una situació real de Catalunya o del teu entorn.\n\nSolucionari orientatiu\nLes respostes han de mostrar comprensió, ús de vocabulari específic, justificació i connexió amb el repte. El docent pot completar solucions concretes segons els sabers treballats.`;},
  rubrics(){
    const c=context(), task=get('rubricTask')||'producte o tasca final', scale=get('rubricScale'), count=Math.max(3,Math.min(8,Number(get('rubricCriteria'))||5));
    const criteria = [...c.ca, 'Comunicació del procés i del resultat', 'Autonomia i revisió', 'Treball cooperatiu'].slice(0,count);
    let table=`| Criteri | Inicial | En procés | Assolit | Excel·lent |\n|---|---|---|---|---|\n`;
    criteria.forEach(crit => {table+=`| ${crit} | Mostra dificultats importants o evidències incompletes. | Avança amb ajuda i presenta alguns encerts. | Compleix el criteri amb correcció i evidències suficients. | Va més enllà, justifica amb rigor i transfereix l'aprenentatge. |\n`;});
    return `${commonHeader(c)}\nRÚBRICA D'AVALUACIÓ\nTasca: ${task}\nEscala: ${scale}\n\n${table}\n\nÚs recomanat\n- Comparteix la rúbrica abans de començar la tasca.\n- Fes una coavaluació intermèdia abans de la versió final.\n- Afegeix una fila de compromís: “Què milloraré abans de lliurar?”.\n\nComentari global model\nEl resultat mostra el grau d'assoliment dels aprenentatges vinculats a ${c.tema.toLowerCase()}. La qualificació final hauria de combinar aquesta rúbrica amb les evidències del procés.`;},
  feedback(){
    const c=context(), work=get('studentWork')||"No s'ha introduït resposta concreta de l'alumne/a.", goal=get('improvementGoal')||'millorar la justificació i la claredat', tone=get('feedbackTone'), detail=get('feedbackDetail');
    return `${commonHeader(c)}\nFEEDBACK PERSONALITZAT\nTo: ${tone}\nDetall: ${detail}\n\nEvidència observada\n${work}\n\nComentari per a l'alumne/a\nHas fet un pas positiu perquè es veu que has intentat treballar ${c.tema.toLowerCase()} i donar una resposta pròpia. El punt fort principal és que ja hi ha una base sobre la qual pots millorar.\n\nPer avançar\nAra cal centrar-se en ${goal}. Revisa la resposta i comprova que cada idea important estigui explicada amb un exemple, una dada o una justificació.\n\nCriteri de referència\n${c.ca[0] || 'Criteri a concretar pel docent.'}\n\nProper pas concret\n1. Subratlla la idea principal.\n2. Afegeix una evidència que la recolzi.\n3. Escriu una frase final que connecti la resposta amb el repte o la pregunta inicial.\n\nVersió breu per Classroom\nBon inici. Per millorar, afegeix més justificació i revisa que cada idea estigui connectada amb una evidència concreta.\n\nNota docent\nAquest retorn és una proposta. Cal revisar-lo abans d'enviar-lo i ajustar-lo al coneixement real de l'alumne/a.`;},
  templates(){
    const c=context();
    const parts = templates[c.plantilla] || [];
    return `${commonHeader(c)}\nPLANTILLA: ${c.plantilla}\n\nEstructura recomanada\n${numbered(parts)}\n\nText base editable\nTítol: ${titleCase(c.tema)}\nCurs i matèria: ${c.curs} · ${c.materia}\nFinalitat: treballar ${c.tema.toLowerCase()} a partir d'una situació propera, mobilitzant els sabers seleccionats i recollint evidències vinculades als criteris d'avaluació.\n\nApartats per completar\n${parts.map(p=>`## ${p}\n[Escriu aquí el contingut de l'apartat.]`).join('\n\n')}`;
  }
};


// Impressio professional aillada: no toca els estils de pantalla de l'app.
function dcEscapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function dcModuleTitle(key){
  return ({sa:'Situació d\'aprenentatge',sessions:'Planificació de sessions',worksheets:'Fitxa de treball',rubrics:'Rúbrica',feedback:'Feedback',templates:'Plantilla'})[key] || 'Document docent';
}
function dcPrintCss(){
  return `:root{--print-primary:#253B80;--print-secondary:#5067D9;--print-light:#EEF2FF;--print-soft:#F7F8FC;--print-border:#D9DEEA;--print-ink:#172033;--print-muted:#667085}*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--print-ink);font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45}.print-wrap{max-width:1120px;margin:0 auto;padding:18mm}.cover{background:linear-gradient(135deg,var(--print-primary),#17224d);color:#fff;border-radius:20px;padding:26px 30px;margin-bottom:18px;break-inside:avoid}.eyebrow{text-transform:uppercase;letter-spacing:.09em;font-weight:700;font-size:9pt;opacity:.86;margin:0 0 6px}h1{font-size:26pt;line-height:1.12;margin:0 0 10px;font-weight:800}h2{font-size:16pt;color:var(--print-primary);margin:18px 0 9px;padding-bottom:5px;border-bottom:2px solid var(--print-light);break-after:avoid}h3{font-size:12.5pt;color:#26335A;margin:14px 0 6px;break-after:avoid}p{margin:5px 0}ul{margin:6px 0 10px 20px;padding:0}li{margin:3px 0}.meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.pill{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:5px 9px;font-size:9pt;font-weight:700}.card{background:#fff;border:1px solid var(--print-border);border-radius:16px;padding:15px 18px;margin:12px 0;break-inside:avoid}.page-break{break-before:page}table{width:100%;border-collapse:separate;border-spacing:0;margin:10px 0 14px;font-size:9.2pt;border:1px solid var(--print-border);border-radius:10px;overflow:hidden;break-inside:auto}tr{break-inside:avoid}th,td{border-right:1px solid var(--print-border);border-bottom:1px solid var(--print-border);padding:7px 8px;vertical-align:top}th:last-child,td:last-child{border-right:0}tr:last-child td{border-bottom:0}th{background:var(--print-primary);color:#fff;text-align:left;font-weight:800}tr:nth-child(even) td{background:var(--print-soft)}.footer{display:flex;justify-content:space-between;gap:10px;margin-top:20px;color:var(--print-muted);font-size:9pt;border-top:1px solid var(--print-border);padding-top:8px}@page{margin:12mm;size:auto}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.print-wrap{max-width:none;padding:0}.card{box-shadow:none}}@media screen{body{background:#eef1f7}.print-wrap{padding:20px}.card{box-shadow:0 10px 30px rgba(23,32,51,.06)}}`;
}
function dcIsTitle(line){
  const t=line.trim();
  if(!t) return false;
  if(/^Sessió\s+\d+\./i.test(t)) return true;
  return /^(DADES|CURRÍCULUM|SITUACIÓ|PLANIFICACIÓ|FITXA|RÚBRICA|FEEDBACK|PLANTILLA|Títol|Repte inicial|Producte final|Intencionalitat|Objectius d'aprenentatge|Seqüència|Organització|Avaluació|Atenció|Metacognició|Activitats|Criteris|Adaptació|Ampliació|Solucionari|Competències|Sabers|Context)/i.test(t);
}
function dcParseTable(lines,start){
  let rows=[],i=start;
  while(i<lines.length && /^\s*\|/.test(lines[i])){rows.push(lines[i]);i++;}
  if(rows.length<2) return null;
  const parsed=rows.filter(r=>!/^[\s|:-]+$/.test(r)).map(r=>r.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));
  if(!parsed.length) return null;
  const head=parsed[0], body=parsed.slice(1);
  return {next:i, html:`<table><thead><tr>${head.map(c=>`<th>${dcEscapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${dcEscapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`};
}
function dcRenderPrintText(text){
  const lines=String(text||'').replace(/\r\n/g,'\n').split('\n');
  let html='', para=[], list=[];
  const fp=()=>{if(para.length){html+=`<p>${dcEscapeHtml(para.join(' '))}</p>`;para=[];}};
  const fl=()=>{if(list.length){html+=`<ul>${list.map(x=>`<li>${dcEscapeHtml(x)}</li>`).join('')}</ul>`;list=[];}};
  for(let i=0;i<lines.length;i++){
    const raw=lines[i], line=raw.trim();
    if(!line){fp();fl();continue;}
    const table=/^\s*\|/.test(raw)?dcParseTable(lines,i):null;
    if(table){fp();fl();html+=table.html;i=table.next-1;continue;}
    if(/^[-•]\s+/.test(line)){fp();list.push(line.replace(/^[-•]\s+/,''));continue;}
    if(/^\d+\.\s+/.test(line) && line.length>18){fp();list.push(line.replace(/^\d+\.\s+/,''));continue;}
    if(dcIsTitle(line)){fp();fl();const tag=/^Sessió\s+\d+\./i.test(line)?'h3':'h2';html+=`<${tag}>${dcEscapeHtml(line)}</${tag}>`;continue;}
    if(/^[A-Za-zÀ-ÿ0-9 ·/’'().-]+:\s+/.test(line) && line.length<190){fp();fl();const idx=line.indexOf(':');html+=`<p><strong>${dcEscapeHtml(line.slice(0,idx+1))}</strong> ${dcEscapeHtml(line.slice(idx+1).trim())}</p>`;continue;}
    para.push(line);
  }
  fp();fl();
  return html || '<p>Encara no hi ha contingut generat.</p>';
}
function dcBuildPrintPage(title, docs){
  const c=context();
  const today=new Date().toLocaleDateString('ca-ES');
  const meta=[c.etapa,c.curs,c.materia,c.durada].filter(Boolean);
  const sections=docs.map((d,i)=>`<section class="card ${i?'page-break':''}"><h2>${dcEscapeHtml(d.title)}</h2>${dcRenderPrintText(d.text)}</section>`).join('');
  return `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${dcEscapeHtml(title)}</title><style>${dcPrintCss()}</style></head><body><main class="print-wrap"><section class="cover"><p class="eyebrow">DocentCat · Document docent</p><h1>${dcEscapeHtml(title)}</h1><p>${dcEscapeHtml(c.tema)}</p><div class="meta">${meta.map(x=>`<span class="pill">${dcEscapeHtml(x)}</span>`).join('')}<span class="pill">${dcEscapeHtml(today)}</span></div></section>${sections}<footer class="footer"><span>Generat amb DocentCat</span><span>${dcEscapeHtml([c.etapa,c.curs,c.materia].filter(Boolean).join(' · '))}</span></footer></main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));<\/script></body></html>`;
}
function printProfessional(key){
  try{
    const text=outputs[key]?.textContent||'';
    const w=window.open('','_blank');
    if(!w){toast('El navegador ha bloquejat la finestra d\'impressió');return;}
    w.document.open();
    w.document.write(dcBuildPrintPage(`${dcModuleTitle(key)} · ${context().tema}`,[{title:dcModuleTitle(key),text}]));
    w.document.close();
  }catch(err){ console.error(err); window.print(); }
}
function printProject(){
  try{
    const docs=Object.keys(outputs).filter(k=>outputs[k]?.textContent && !/Encara no hi ha contingut generat/i.test(outputs[k].textContent)).map(k=>({title:dcModuleTitle(k),text:outputs[k].textContent}));
    if(!docs.length){toast('No hi ha documents generats per imprimir');return;}
    const w=window.open('','_blank');
    if(!w){toast('El navegador ha bloquejat la finestra d\'impressió');return;}
    w.document.open();w.document.write(dcBuildPrintPage(`Projecte docent complet · ${context().tema}`,docs));w.document.close();
  }catch(err){ console.error(err); window.print(); }
}
function addPrintProjectButton(){
  const actions=document.querySelector('.header-actions');
  if(!actions || document.getElementById('printProjectBtn')) return;
  const btn=document.createElement('button');
  btn.id='printProjectBtn';
  btn.className='ghost';
  btn.textContent='Imprimeix projecte';
  btn.onclick=printProject;
  const exportBtn=document.getElementById('exportAllBtn');
  actions.insertBefore(btn, exportBtn || actions.firstChild);
}

function save(){
  const data={fields:{}, multi:{}, outputs:{}, custom: null};
  fields.forEach(f=>{if($(f)) data.fields[f]=$(f).value});
  multiFields.forEach(f=>{if($(f)) data.multi[f]=selectedValues(f)});
  Object.keys(outputs).forEach(k=>data.outputs[k]=outputs[k].textContent);
  localStorage.setItem(storeKey,JSON.stringify(data));
  toast('Desat al navegador');
}
function load(){
  try{
    const data=JSON.parse(localStorage.getItem(storeKey)||'{}');
    if(data.fields?.customCurriculum){ try{ curriculum = mergeDeep(curriculum, JSON.parse(data.fields.customCurriculum)); }catch{} }
    populateContextSelectors();
    Object.entries(data.fields||{}).forEach(([k,v])=>{if($(k)) $(k).value=v});
    populateContextSelectors();
    Object.entries(data.multi||{}).forEach(([k,values])=>{if($(k)){ const set=new Set(values); Array.from($(k).options).forEach(o=>o.selected=set.has(o.value)); }});
    queueMicrotask(()=>Object.entries(data.outputs||{}).forEach(([k,v])=>{if(outputs[k]) outputs[k].textContent=v}));
  }catch{ populateContextSelectors(); }
}
function generate(key){ const text = clean(generators[key]()); outputs[key].textContent=text; save(); }
function copyText(text){ navigator.clipboard?.writeText(text).then(()=>toast('Copiat')); }
function downloadText(filename,text){ const blob=new Blob([text],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }
function dateSlug(){ return new Date().toISOString().slice(0,10); }
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2200); }
function mergeDeep(target, source){
  for(const [key,value] of Object.entries(source || {})){
    if(value && typeof value === 'object' && !Array.isArray(value)) target[key] = mergeDeep(target[key] || {}, value);
    else target[key] = value;
  }
  return target;
}
function importCustomCurriculum(){
  try{
    const txt = get('customCurriculum');
    if(!txt) return toast('No hi ha JSON per importar');
    const custom = JSON.parse(txt);
    curriculum = mergeDeep(curriculum, custom);
    populateContextSelectors();
    save();
    toast('Currículum propi importat');
  }catch(err){ toast('JSON no vàlid'); }
}
function copyCurriculum(){
  const c = context();
  copyText(`Competències específiques\n${lines(c.ce)}\n\nCriteris d'avaluació\n${lines(c.ca)}\n\nSabers\n${lines(c.sabers)}`);
}

for(const btn of document.querySelectorAll('.tab')) btn.onclick=()=>{ document.querySelectorAll('.tab,.module').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $(btn.dataset.tab).classList.add('active'); };
for(const btn of document.querySelectorAll('[data-generate]')) btn.onclick=()=>generate(btn.dataset.generate);
$('saveContextBtn').onclick=save;
$('selectCoreBtn').onclick=selectCore;
$('copyCurriculumBtn').onclick=copyCurriculum;
$('importCurriculumBtn').onclick=importCustomCurriculum;
$('clearBtn').onclick=()=>{ if(confirm('Vols esborrar les dades locals de DocentCat?')){ localStorage.removeItem(storeKey); location.reload(); }};
$('exportAllBtn').onclick=()=>{ const all=Object.keys(outputs).map(k=>`# ${k.toUpperCase()}\n\n${outputs[k].textContent}`).join('\n\n---\n\n'); downloadText(`docentcat-export-${dateSlug()}.txt`, all); };
addPrintProjectButton();
fields.forEach(f=>$(f)?.addEventListener('change',()=>{ if(['stage','level','subject'].includes(f)){ populateContextSelectors(); } if(f === 'templateType') renderTemplatePreview(); save(); }));
multiFields.forEach(f=>$(f)?.addEventListener('change', save));

let deferredPrompt; window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; $('installBtn').hidden=false; });
$('installBtn').onclick=async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $('installBtn').hidden=true; }};
// Service worker desactivat temporalment per evitar caches antics o pantalla en blanc.
if('serviceWorker' in navigator){ navigator.serviceWorker.getRegistrations?.().then(regs=>regs.forEach(r=>r.unregister())).catch(()=>{}); }
if(window.caches){ caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>{}); }
load();
