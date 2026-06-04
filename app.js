const $ = (id) => document.getElementById(id);
const storeKey = 'docentcat-pwa-v9-curriculum-linked';
const fields = ['stage','subject','level','templateType','topic','taskDescription','duration','groupProfile','language','saProduct','saContext','saMethod','saAssessment','sessionCount','sessionMinutes','sessionFocus','worksheetType','worksheetLevel','activityCount','rubricTask','rubricScale','rubricCriteria','studentWork','improvementGoal','feedbackTone','feedbackDetail','customCurriculum'];
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
    this.querySelector('.downloadHtmlBtn').onclick = () => downloadHtml(`${key}-${dateSlug()}.html`, outputs[key].textContent, key.toUpperCase());
    this.querySelector('.downloadDocBtn').onclick = () => downloadDoc(`${key}-${dateSlug()}.doc`, outputs[key].textContent, key.toUpperCase());
    this.querySelector('.printBtn').onclick = () => printDocument(outputs[key].textContent, key.toUpperCase());
    outputs[key].addEventListener('input', save);
  }
}
customElements.define('output-card', OutputCard);

const get = id => ($(id)?.value || '').trim();
const selectedValues = id => Array.from($(id)?.selectedOptions || []).map(o => o.value);
const clean = s => String(s).replace(/[<>]/g,'');
function lines(items){ return (items || []).map(x=>`- ${x}`).join('\n'); }
function numbered(items){ return (items || []).map((x,i)=>`${i+1}. ${x}`).join('\n'); }
function titleCase(s){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
function currentData(){ return curriculum[get('stage')]?.[get('level')]?.[get('subject')] || {ce:[], ca:[], caByCe:{}, sabers:[]}; }
function ceCodeFromText(text){ const m = String(text||'').match(/CE\s*(\d+)|^(\d+)[\.,]/i); return m ? `CE${m[1] || m[2]}` : ''; }
function caCodeFromText(text){ const m = String(text||'').match(/CA\s*(\d+)\.(\d+)|^(\d+)\.(\d+)/i); return m ? `CE${m[1] || m[3]}` : ''; }
function allCriteria(data){
  if(data.caByCe && Object.keys(data.caByCe).length){ return Object.values(data.caByCe).flat(); }
  return data.ca || [];
}
function criteriaForSelectedCompetencies(data){
  const selected = selectedValues('ceSelect').map(ceCodeFromText).filter(Boolean);
  if(data.caByCe && selected.length){
    const result = selected.flatMap(code => data.caByCe[code] || []);
    return result.length ? result : allCriteria(data);
  }
  return allCriteria(data);
}
function pickedCurriculum(){
  const data = currentData();
  const availableCa = criteriaForSelectedCompetencies(data);
  return {
    ce: selectedValues('ceSelect').length ? selectedValues('ceSelect') : (data.ce || []).slice(0,2),
    ca: selectedValues('caSelect').length ? selectedValues('caSelect') : availableCa.slice(0,3),
    sabers: selectedValues('sabersSelect').length ? selectedValues('sabersSelect') : (data.sabers || []).slice(0,4)
  };
}
function context(){
  const picked = pickedCurriculum();
  return {
    etapa:get('stage'), materia:get('subject') || 'Matèria no indicada', curs:get('level'), tema:get('topic') || 'Tema pendent de concretar',
    descripcio:get('taskDescription') || '', durada:get('duration') || 'Durada no indicada', grup:get('groupProfile') || 'Grup ordinari amb diversitat de ritmes', idioma:get('language'),
    plantilla:get('templateType'), ce:picked.ce, ca:picked.ca, sabers:picked.sabers
  };
}
function commonHeader(c){return `DADES COMUNES DEL MENÚ LATERAL
Etapa: ${c.etapa}
Matèria: ${c.materia}
Curs: ${c.curs}
Tema/repte general: ${c.tema}
Consigna global de generació: ${c.descripcio || 'No indicada'}
Durada global: ${c.durada}
Perfil del grup: ${c.grup}
Plantilla de treball: ${c.plantilla}
Idioma: ${c.idioma}

CURRÍCULUM SELECCIONAT AL MENÚ LATERAL
Competències específiques
${lines(c.ce)}

Criteris d'avaluació
${lines(c.ca)}

Sabers
${lines(c.sabers)}
`; }

function populateSelect(select, values, keep = true){
  const previous = keep ? new Set(selectedValues(select.id)) : new Set();
  select.innerHTML = '';
  values.forEach(v => { const opt = document.createElement('option'); opt.value = v; opt.textContent = v; if(previous.has(v)) opt.selected = true; select.appendChild(opt); });
}
function populateContextSelectors(){
  populateSelect($('level'), Object.keys(curriculum[get('stage')] || {}), true); if(!$('level').value) $('level').selectedIndex = 0;
  const subjects = Object.keys(curriculum[get('stage')]?.[get('level')] || {});
  populateSelect($('subject'), subjects, true); if(!$('subject').value) $('subject').selectedIndex = 0;
  populateSelect($('templateType'), Object.keys(templates), true); if(!$('templateType').value) $('templateType').selectedIndex = 0;
  populateCurriculumLists(false); renderTemplatePreview();
}
function populateCurriculumLists(keep = true){
  const data = currentData();
  populateSelect($('ceSelect'), data.ce || [], keep);
  populateSelect($('caSelect'), criteriaForSelectedCompetencies(data), keep);
  populateSelect($('sabersSelect'), data.sabers || [], keep);
  updateCurriculumHint();
}
function updateCriteriaFromCompetencies(keep = false){
  const data = currentData();
  populateSelect($('caSelect'), criteriaForSelectedCompetencies(data), keep);
  updateCurriculumHint();
}
function updateCurriculumHint(){
  const data = currentData();
  const hint = $('curriculumLinkHint');
  if(!hint) return;
  const selected = selectedValues('ceSelect').map(ceCodeFromText).filter(Boolean);
  if(data.caByCe && selected.length){ hint.textContent = `Criteris filtrats segons ${selected.join(', ')}.`; }
  else if(data.caByCe){ hint.textContent = `Selecciona una o més CE per veure només els CA vinculats. Sense CE seleccionada es mostren tots.`; }
  else { hint.textContent = `Aquesta matèria encara no té vinculació CE → CA carregada.`; }
}
function selectCore(){ ['ceSelect','sabersSelect'].forEach(id => Array.from($(id).options).forEach((opt,i)=> opt.selected = i < (id === 'sabersSelect' ? 4 : 2))); updateCriteriaFromCompetencies(false); Array.from($('caSelect').options).forEach((opt,i)=> opt.selected = i < 4); save(); toast('Selecció suggerida aplicada'); }
function renderTemplatePreview(){
  const root = $('templatePreview'); if(!root) return; root.innerHTML = '';
  Object.entries(templates).forEach(([name, parts]) => { const card = document.createElement('button'); card.className = 'template-card'; card.type = 'button'; card.innerHTML = `<strong>${name}</strong><span>${parts.join(' · ')}</span>`; card.onclick = () => { $('templateType').value = name; renderTemplatePreview(); save(); }; if(get('templateType') === name) card.classList.add('selected'); root.appendChild(card); });
}

function subjectFamily(c){
  const s=(c.materia+' '+c.tema+' '+c.descripcio).toLowerCase();
  if(/matem|funci|equaci|algebra|geometr|probabil|estad/.test(s)) return 'math';
  if(/física|fisica|química|quimica|força|energia|moviment|reacci|mol|àtom|atom/.test(s)) return 'fisquim';
  if(/biologia|geologia|cèl|cel|genèt|genet|ecosistema|roca|terra|relleu/.test(s)) return 'bio';
  if(/tecnologia|digitalitz|program|robot|circuit|disseny|app|pwa|web|dades/.test(s)) return 'tech';
  return 'general';
}
function keywordList(c){
  const txt = `${c.tema} ${c.descripcio} ${c.sabers.join(' ')}`.toLowerCase();
  const words = txt.normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-zA-Z0-9]{4,}/g) || [];
  return [...new Set(words)].filter(w => !['sobre','amb','dels','dins','aquesta','aquest','activitat','exercicis','fitxa','sessio','sessions'].includes(w)).slice(0,8);
}
function requestedCount(c, fallback){
  const m = (c.descripcio || '').match(/(\d+)\s*(exercicis|activitats|problemes|preguntes|tasques)/i);
  return m ? Math.max(1, Math.min(30, Number(m[1]))) : fallback;
}

function parseRequestedBundles(c){
  const txt = (c.descripcio || '').toLowerCase();
  const chunks = [];
  const patterns = [
    [/([0-9]+)\s+(?:exercicis?|activitats?)\s+(?:de|d\')\s+([^,.\n;]+)/g, 'exercicis'],
    [/([0-9]+)\s+(problemes?)\s+([^,.\n;]*)/g, 'problemes'],
    [/([0-9]+)\s+(preguntes?)\s+([^,.\n;]*)/g, 'preguntes']
  ];
  for(const [re,type] of patterns){
    let m; while((m = re.exec(txt))){
      chunks.push({count: Math.max(1, Math.min(15, Number(m[1]))), type, focus: (m[2] || m[3] || '').trim()});
    }
  }
  return chunks.slice(0,8);
}
function mathExerciseByFocus(c, focus, index){
  const t = `${focus} ${c.tema} ${c.descripcio}`.toLowerCase();
  const n = index + 1;
  if(/factor|factoritz/.test(t)){
    const a = [1,1,2,1,3][index%5], b = [5,-3,7,-8,2][index%5], d = [6,-10,3,12,-5][index%5];
    return `Factoritza i resol l'equació ${a===1?'':a}x² ${b>=0?'+':'-'} ${Math.abs(b)}x ${d>=0?'+':'-'} ${Math.abs(d)} = 0. Indica arrels, comprovació i error habitual.`;
  }
  if(/f[oó]rmula|general|quadr/.test(t)){
    const A = [1,2,1,3,2][index%5], B = [4,-5,6,-7,3][index%5], C = [-12,2,5,-2,-9][index%5];
    return `Resol amb la fórmula general: ${A}x² ${B>=0?'+':'-'} ${Math.abs(B)}x ${C>=0?'+':'-'} ${Math.abs(C)} = 0. Escriu discriminant, substitució, resultat i interpretació.`;
  }
  if(/v[eè]rtex|vertex|parabol|funci/.test(t)){
    const A=[1,-1,2,-2,0.5][index%5], B=[-4,6,-8,4,-3][index%5], C=[3,-5,1,6,2][index%5];
    return `Estudia la funció f(x) = ${A}x² ${B>=0?'+':'-'} ${Math.abs(B)}x ${C>=0?'+':'-'} ${Math.abs(C)}: vèrtex, eix de simetria, punts de tall i esbós de la gràfica.`;
  }
  if(/context|problema|aplic/.test(t)){
    return `Problema contextualitzat ${n}: en una situació del centre relacionada amb ${c.tema.toLowerCase()}, una magnitud segueix un model quadràtic o lineal. Proposa dades coherents, escriu el model, resol la pregunta i interpreta si la resposta té sentit.`;
  }
  if(/percent|propor|escala/.test(t)){
    return `Resol una situació de proporcionalitat o percentatges vinculada a ${c.tema.toLowerCase()}: dades, operació, resultat, comprovació i frase final.`;
  }
  return null;
}
function scienceExerciseByFocus(c, focus, index){
  const t = `${focus} ${c.tema} ${c.descripcio}`.toLowerCase();
  if(/laboratori|experiment|indag/.test(t)) return `Dissenya una indagació sobre ${c.tema.toLowerCase()}: pregunta investigable, hipòtesi, variables, material, procediment segur, taula de dades i conclusió esperada.`;
  if(/c[aà]lcul|problema|unitat|força|energia|moviment|mol|concentr/.test(t)) return `Problema numèric sobre ${c.tema.toLowerCase()}: identifica dades, magnituds, unitats, fórmula o relació, càlcul i interpretació del resultat.`;
  if(/gr[aà]fic|dades|taula/.test(t)) return `Interpreta una taula o gràfic sobre ${c.tema.toLowerCase()}: tendència, variable dependent/independent, anomalia i conclusió científica.`;
  return null;
}
function technologyExerciseByFocus(c, focus, index){
  const t = `${focus} ${c.tema} ${c.descripcio}`.toLowerCase();
  if(/pseudocodi|algor|program/.test(t)) return `Escriu pseudocodi per a una part de ${c.tema.toLowerCase()}: entrada, procés, sortida, condició, prova amb dades i possible error.`;
  if(/prototip|disseny|projecte/.test(t)) return `Dissenya un prototip relacionat amb ${c.tema.toLowerCase()}: necessitat, requisits, croquis, materials/eines, passos, proves i millora.`;
  if(/app|web|pwa|digital/.test(t)) return `Defineix una funcionalitat digital per a ${c.tema.toLowerCase()}: usuari destinatari, pantalla principal, dades necessàries, interacció i criteris d'usabilitat.`;
  return null;
}
function bundledExercises(c, count){
  const bundles = parseRequestedBundles(c);
  if(!bundles.length) return null;
  const family = subjectFamily(c);
  const list = [];
  let idx = 0;
  bundles.forEach(bundle => {
    list.push(`Bloc: ${bundle.count} ${bundle.type} ${bundle.focus ? 'sobre ' + bundle.focus : ''}`);
    for(let i=0; i<bundle.count; i++){
      let item = null;
      if(family === 'math') item = mathExerciseByFocus(c, bundle.focus, idx);
      if(family === 'fisquim' || family === 'bio') item = scienceExerciseByFocus(c, bundle.focus, idx);
      if(family === 'tech') item = technologyExerciseByFocus(c, bundle.focus, idx);
      if(!item) item = exerciseItemsBasic(c, 1, idx)[0].replace(/^\d+\.\s*/, '');
      idx++;
      list.push(`${idx}. ${item}`);
    }
  });
  return list.slice(0, Math.max(1, count) + bundles.length + 20);
}
function exerciseItemsBasic(c, count, offset=0){
  const family=subjectFamily(c), kws=keywordList(c), tema=c.tema || 'el tema';
  const saber = i => c.sabers[i % Math.max(1,c.sabers.length)] || tema;
  const k = i => kws[i % Math.max(1,kws.length)] || tema.toLowerCase();
  const list=[];
  for(let i=1;i<=count;i++){
    if(family==='math'){
      const a=2+i, b=3*i+1, d=i%3+2;
      const variants = [
        `Resol i comprova: ${a}x + ${b} = ${a*d+b}. Explica cada pas i indica quin error seria més habitual.`,
        `Modelitza una situació real amb una expressió o equació relacionada amb ${k(i)}. Defineix variables, resol i interpreta el resultat.`,
        `Representa en una taula tres valors d'una funció lineal que pugui descriure ${tema}. Escriu l'expressió i interpreta pendent i ordenada a l'origen.`,
        `Problema competencial: una situació del centre genera una quantitat que creix de manera regular. Proposa dades coherents, calcula el patró i justifica la predicció.`
      ];
      list.push(`${i}. ${variants[(i-1)%variants.length]}`);
    } else if(family==='fisquim'){
      const variants = [
        `Analitza el fenomen "${tema}" identificant magnituds, unitats, variables que canvien i variables que es mantenen constants.`,
        `Calcula una situació numèrica senzilla vinculada a ${k(i)}. Escriu dades, fórmula utilitzada, substitució, resultat amb unitats i interpretació.`,
        `Explica a nivell microscòpic o de model científic què passa en ${tema}. Afegeix un dibuix esquemàtic amb llegenda.`,
        `Dissenya una comprovació experimental segura sobre ${saber(i)}: material, procediment, control de variables i taula de resultats.`
      ];
      list.push(`${i}. ${variants[(i-1)%variants.length]}`);
    } else if(family==='bio'){
      const variants = [
        `Construeix un esquema causa-conseqüència sobre ${tema} incorporant almenys quatre conceptes clau: ${kws.slice(0,4).join(', ') || 'conceptes del tema'}.`,
        `Interpreta un cas: descriu què observaries, quina hipòtesi formularies i quina evidència necessitaries per validar-la.`,
        `Compara dos processos o estructures relacionats amb ${saber(i)}. Inclou semblances, diferències i una aplicació al context real.`,
        `Elabora una explicació científica per a alumnat de 1r cicle d'ESO sobre ${k(i)} amb vocabulari rigorós però entenedor.`
      ];
      list.push(`${i}. ${variants[(i-1)%variants.length]}`);
    } else if(family==='tech'){
      const variants = [
        `Defineix un problema tecnològic real relacionat amb ${tema}. Escriu requisits, restriccions i criteris d'èxit del prototip o solució.`,
        `Fes un algorisme en pseudocodi per resoldre una part del repte. Inclou entrada, procés, sortida i una prova amb dades.`,
        `Dissenya una solució: croquis o arquitectura, materials/eines digitals, passos de construcció i comprovacions de seguretat.`,
        `Analitza l'impacte de la solució en sostenibilitat, privacitat, accessibilitat o manteniment. Proposa una millora.`
      ];
      list.push(`${i}. ${variants[(i-1)%variants.length]}`);
    } else {
      const variants = [
        `Explica amb les teves paraules una idea clau de ${saber(i)} i acompanya-la d'un exemple propi.`,
        `Aplica ${tema} a una situació propera al centre o al municipi. Indica dades, decisió i justificació.`,
        `Compara dues respostes possibles al repte i argumenta quina és més adequada.`,
        `Crea una pregunta d'avaluació sobre ${k(i)} i respon-la amb criteris de qualitat.`
      ];
      list.push(`${i}. ${variants[(i-1)%variants.length]}`);
    }
  }
  return list;
}
function exerciseItems(c, count){
  return bundledExercises(c, count) || exerciseItemsBasic(c, count, 0);
}
function solutionGuide(c, count){
  const family=subjectFamily(c);
  if(family==='math') return `Solucionari i criteris de correcció\n- Les equacions han d'incloure aïllament correcte de la incògnita, comprovació substituint el valor i interpretació final.\n- En problemes contextualitzats: variables definides, equació o model, càlcul, unitats i frase resposta.\n- Penalitza menys els errors aritmètics puntuals que no afectin el raonament; marca clarament els errors de modelització.`;
  if(family==='fisquim') return `Solucionari i criteris de correcció\n- Cal identificar dades i magnituds amb unitats, justificar la fórmula o model i interpretar el resultat.\n- En activitats experimentals: hipòtesi, variables, procediment segur, taula de resultats i conclusió coherent amb les dades.\n- Accepta esquemes diferents si representen correctament el model científic.`;
  if(family==='bio') return `Solucionari i criteris de correcció\n- Les respostes han d'establir relacions causa-conseqüència, usar vocabulari científic i aportar evidències o exemples.\n- En comparacions: semblances i diferències rellevants, no només descripcions aïllades.\n- En casos: hipòtesi verificable, dades necessàries i conclusió prudent.`;
  if(family==='tech') return `Solucionari i criteris de correcció\n- La proposta ha de respondre al problema definit, complir requisits i mostrar iteració o millora.\n- En pseudocodi: entrada, procés, sortida i prova de funcionament.\n- En disseny: criteris de seguretat, sostenibilitat, accessibilitat i justificació de decisions.`;
  return `Solucionari i criteris de correcció\n- Valora comprensió, aplicació al context, ús de vocabulari específic, justificació i revisió.\n- Les respostes poden variar; demana evidències i connexió clara amb els criteris d'avaluació.`;
}
function detailedSequence(c, n){
  const phases=['Activació i repte','Modelització o exploració','Taller guiat','Pràctica específica','Aplicació competencial','Revisió amb feedback','Producció final','Presentació','Metacognició'];
  const ex=exerciseItems(c, n).map(x=>x.replace(/^\d+\.\s*/,''));
  let out='';
  for(let i=1;i<=n;i++){
    const phase=phases[Math.min(phases.length-1, Math.floor((i-1)*phases.length/n))];
    const saber=c.sabers[(i-1)%Math.max(1,c.sabers.length)] || c.tema;
    const criteri=c.ca[(i-1)%Math.max(1,c.ca.length)] || 'criteri a concretar';
    out+=`Sessió ${i}. ${phase}\nObjectiu específic: treballar ${saber} dins el repte "${c.tema}".\nActivitat central: ${ex[i-1]}\nEstructura: activació breu, model o exemple docent, producció de l'alumnat, revisió i tancament amb evidència.\nEvidència recollida: resposta escrita, càlcul/model, esquema, prototip, debat o tiquet de sortida.\nAvaluació vinculada: ${criteri}\n\n`;
  }
  return out;
}


function firstOr(items, fallback){ return (items && items.length) ? items[0] : fallback; }
function templateFill(part, c){
  const name = String(part || 'Apartat');
  const low = name.toLowerCase();
  const tema = c.tema || 'el tema';
  const criteri = firstOr(c.ca, "criteri d'avaluació seleccionat o a concretar");
  const saber = firstOr(c.sabers, 'saber seleccionat o a concretar');
  const producte = get('saProduct') || 'producte final aplicat';
  const contextReal = get('saContext') || "context proper de l'alumnat";
  const activitats = exerciseItems(c, 3).map(x=>x.replace(/^\d+\.\s*/, ''));
  if(low.includes('repte inicial') || low.includes('pregunta guia')) return `Com podem aplicar ${tema.toLowerCase()} per donar resposta a una necessitat o situació real vinculada a ${contextReal}?`;
  if(low.includes('context') || low.includes('justific')) return `La proposta parteix de ${contextReal} i connecta amb el perfil del grup: ${c.grup}. Consigna docent: ${c.descripcio || 'cal concretar la consigna detallada al menú lateral'}.`;
  if(low.includes('producte final')) return `${producte}. Ha d'incloure evidències del procés, justificació de decisions, ús de vocabulari específic i revisió final vinculada als criteris d'èxit.`;
  if(low.includes('objectius')) return lines([`Comprendre i aplicar ${tema}.`, `Mobilitzar el saber: ${saber}.`, `Justificar procediments o conclusions amb evidències.`, `Comunicar el procés i el resultat amb rigor.`]);
  if(low.includes('competències')) return lines(c.ce.length ? c.ce : ['Competència específica a concretar']);
  if(low.includes('criteris')) return lines(c.ca.length ? c.ca : [criteri]);
  if(low.includes('sabers')) return lines(c.sabers.length ? c.sabers : [saber]);
  if(low.includes('seqüència') || low.includes('fases')) return detailedSequence(c, Math.min(6, Math.max(3, Number(get('sessionCount')) || 4))).trim();
  if(low.includes('activació')) return `Pregunta inicial: què sabem de ${tema}? Recollida ràpida d'idees prèvies i vocabulari clau.`;
  if(low.includes('modelatge') || low.includes('miniinput')) return `El docent mostra un exemple complet relacionat amb ${tema}, verbalitzant passos, errors freqüents i criteris de qualitat.`;
  if(low.includes('tasca guiada')) return activitats[0] || `Tasca guiada sobre ${tema} amb passos i bastides.`;
  if(low.includes('tasca autònoma') || low.includes('cooperativa')) return activitats[1] || 'Tasca cooperativa amb rols, evidència individual i revisió per parelles.';
  if(low.includes('posada')) return `Posada en comú de dues estratègies diferents. L'alumnat compara procediments i millora una resposta pròpia.`;
  if(low.includes('ticket')) return 'Tiquet de sortida: escriu una idea apresa, una evidència i una pregunta o error que encara cal revisar.';
  if(low.includes('objectiu de la fitxa')) return `Aplicar ${tema.toLowerCase()} amb activitats graduades i evidències vinculades a ${criteri}.`;
  if(low.includes('activitat comuna')) return activitats[0] || `Activitat comuna d'aplicació sobre ${tema}.`;
  if(low.includes('itinerari bàsic')) return `1. Resol una versió guiada amb dades destacades.
2. Completa passos intermedis.
3. Usa banc de paraules, fórmules o esquema de suport.`;
  if(low.includes('itinerari estàndard')) return activitats.slice(0,2).map((a,i)=>`${i+1}. ${a}`).join('\n');
  if(low.includes('repte d')) return activitats[2] || `Repte: crea una situació nova sobre ${tema}, resol-la i explica quin criteri permet observar.`;
  if(low.includes('autoavaluació')) return "Marca de l'1 al 4: he entès la tasca, he justificat la resposta, he usat vocabulari específic i he revisat errors. Escriu una millora concreta.";
  if(low.includes('instrument') || low.includes('avaluació')) return `Instruments: rúbrica analítica, llista de comprovació i tiquet de sortida. Evidències: activitats resoltes, procés, producte final i autoavaluació. Criteri clau: ${criteri}.`;
  if(low.includes('atenció') || low.includes('dua') || low.includes('suports') || low.includes('bastides')) return 'Suports: exemple resolt, passos numerats, vocabulari clau, parelles de suport, opció de resposta visual/oral/escrita i ampliació oberta.';
  if(low.includes('transferència') || low.includes('metacogn')) return `Reflexió final: què he après sobre ${tema}? Quina evidència ho demostra? On ho podria aplicar fora de l'aula? Què milloraria amb una sessió més?`;
  if(low.includes('criteri d')) return criteri;
  if(low.includes('nivell inicial')) return `Resposta incompleta o poc ajustada; necessita guia i encara no relaciona el treball amb ${saber}.`;
  if(low.includes('nivell en procés')) return 'Mostra comprensió parcial, però ha de millorar precisió, justificació o connexió amb el criteri.';
  if(low.includes('nivell assolit')) return 'Compleix el criteri amb una resposta ordenada, evidències suficients i ús adequat del vocabulari.';
  if(low.includes('nivell excel')) return 'Aporta rigor, transferència a un context nou, revisió autònoma i justificació aprofundida.';
  if(low.includes('evidències')) return 'Evidències observables: resposta escrita, càlcul/model/esquema/prototip, justificació oral o escrita, revisió del procés i producte final.';
  if(low.includes('3 evidències')) return `1. Ha identificat una idea clau de ${tema}.
2. Ha intentat aplicar-la a una tasca concreta.
3. Ha produït una evidència revisable.`;
  if(low.includes('2 aspectes')) return `1. Concretar millor la justificació amb dades, exemples o procediment.
2. Revisar vocabulari específic i coherència de la resposta.`;
  if(low.includes('1 proper')) return 'Reescriu una resposta afegint una evidència explícita i una frase final que respongui directament al repte.';
  if(low.includes('classroom')) return 'Bon inici. Ara cal concretar més el procediment i afegir evidències que justifiquin la resposta.';
  if(low.includes('tutoria') || low.includes('família')) return "S'observa progrés en la implicació amb la tasca. Per avançar, convé reforçar l'organització, la justificació de respostes i la revisió final.";
  if(low.includes('pregunta investigable')) return `Quina relació hi ha entre una variable vinculada a ${tema} i el resultat que observem en una situació controlada?`;
  if(low.includes('hipòtesi')) return `Si modifiquem la variable principal, aleshores el resultat canviarà de manera observable perquè està relacionat amb ${saber}.`;
  if(low.includes('variables')) return 'Variable independent: factor que modificarem. Variable dependent: resultat que mesurarem. Variables controlades: condicions constants.';
  if(low.includes('material')) return 'Material orientatiu: full de registre, instrument de mesura, material específic de la pràctica, EPI si cal i eina digital per tractar dades.';
  if(low.includes('procediment')) return `1. Preparar el material.
2. Fer una prova inicial.
3. Recollir dades ordenadament.
4. Repetir o contrastar resultats.
5. Formular conclusió vinculada a les dades.`;
  if(low.includes('dades')) return 'Taula de dades: variable independent, mesura 1, mesura 2, mitjana, observacions i incidències.';
  if(low.includes('conclusions')) return 'La conclusió ha d’indicar si les dades confirmen la hipòtesi, quina evidència és més clara i quines limitacions té el procediment.';
  if(low.includes('seguretat')) return "Normes: seguir instruccions del docent, no manipular material sense permís, usar protecció quan calgui i deixar l'espai net i segur.";
  if(low.includes('matèries implicades')) return `${c.materia} com a matèria principal; possibles connexions amb llengües, matemàtiques, tecnologia, ciències o àmbit social segons el producte final.`;
  if(low.includes('rols')) return 'Rols: coordinació, documentació, control de temps, qualitat/revisió i portaveu. Cada alumne conserva una evidència individual.';
  if(low.includes('difusió')) return 'Difusió: exposició breu, pòster, document compartit, presentació oral o publicació interna del centre, amb cura de privacitat i autoria.';
  if(low.includes('abans de llegir')) return `Activa coneixements previs sobre ${tema}, anticipa vocabulari clau i formula dues preguntes de lectura.`;
  if(low.includes('durant')) return 'Subratlla idees clau, anota dubtes i marca evidències que ajudin a respondre la pregunta guia.';
  if(low.includes('després')) return 'Resumeix la idea principal, respon les preguntes i connecta la lectura amb una activitat aplicada.';
  if(low.includes('vocabulari')) return `Vocabulari clau: ${keywordList(c).slice(0,6).join(', ') || tema}. Defineix cada terme amb una frase pròpia.`;
  if(low.includes('inferencial')) return 'Quina conclusió pots deduir encara que no aparegui literalment al text o a les dades? Justifica-la.';
  if(low.includes('crítica')) return 'Quina limitació, biaix o decisió discutible detectes? Proposa una millora argumentada.';
  if(low.includes('tema controvertit')) return `${tema}: analitzar diferents posicions a partir d'evidències, impactes i criteris de decisió.`;
  if(low.includes('documents')) return 'Documents de partida: una font informativa breu, una dada o gràfic, un cas real i una opinió argumentada per contrastar.';
  if(low.includes('arguments')) return 'Cada equip prepara tres arguments amb evidències i preveu una possible resposta crítica.';
  if(low.includes('contraarguments')) return 'Identifica el punt feble d’un argument contrari i respon amb respecte, dades i criteri.';
  if(low.includes('rúbrica oral')) return 'Criteris: claredat, evidències, escolta activa, respecte dels torns, resposta a contraarguments i conclusió.';
  if(low.includes('conclusió personal')) return "Escriu una conclusió pròpia indicant què pensaves abans, què has après i quina evidència t'ha fet canviar o matisar la posició.";
  return `Proposta emplenada: treballar ${tema.toLowerCase()} a partir de ${saber}, amb una evidència observable i revisió vinculada a ${criteri}.`;
}

const generators = {
  sa(){
    const c=context(), product=get('saProduct')||'producte final aplicat al context proper', real=get('saContext')||'repte vinculat a la vida quotidiana', method=get('saMethod'), assessment=get('saAssessment');
    const n=Math.max(4, Math.min(12, Number((c.durada.match(/\d+/)||[])[0]) || Number(get('sessionCount')) || 6));
    const activities=exerciseItems(c, Math.min(6,n));
    return `${commonHeader(c)}\nSITUACIÓ D'APRENENTATGE\n\nDADES ESPECÍFIQUES DEL MÒDUL SA\nProducte final de la SA: ${product}\nContext real / ODS / necessitat: ${real}\nMetodologia de la SA: ${method}\nTipus d'avaluació de la SA: ${assessment}\n\nTítol\n${titleCase(c.tema)}: investiguem, decidim i comuniquem una proposta\n\nRepte inicial\nCom podem comprendre ${c.tema.toLowerCase()} i elaborar ${product} que doni resposta a ${real}?\n\nConsigna docent incorporada\n${c.descripcio || 'No hi ha consigna detallada. Afegeix-la al menú lateral per generar activitats més concretes.'}\n\nProducte final\n${product}. Ha d'incloure una explicació rigorosa, una evidència del procés i una justificació de les decisions preses.\n\nIntencionalitat i metodologia\nL'alumnat parteix d'un context proper, construeix coneixement amb activitats específiques i el transfereix a un producte final. La proposta utilitza ${method.toLowerCase()} i avaluació ${assessment.toLowerCase()}.\n\nObjectius d'aprenentatge\n${lines([`Comprendre els conceptes essencials de ${c.tema}.`,`Aplicar els sabers seleccionats en tasques concretes i contextualitzades.`,`Justificar procediments, decisions o conclusions amb evidències.`,`Revisar la pròpia producció a partir de criteris d'èxit.`,`Comunicar el resultat final amb claredat, precisió i vocabulari de la matèria.`])}\n\nSeqüència d'activitats\n${activities.map((a,i)=>`${i+1}. ${a.replace(/^\d+\.\s*/,'')}`).join('\n')}\n\nOrganització de sessions\n${detailedSequence(c, Math.min(n,8))}\nAvaluació\n- Evidències: activitats específiques, produccions intermèdies, producte final, reflexió individual i observació docent.\n- Instruments: rúbrica analítica, llista de comprovació, feedback docent i auto/coavaluació.\n- Criteris d'èxit per a l'alumnat:\n${lines(c.ca.length ? c.ca : ['Resposta completa i justificada','Ús de vocabulari específic','Aplicació correcta al context'])}\n\nAtenció a la diversitat\n- Bastides: exemple resolt, vocabulari clau, plantilla de resposta, passos numerats i parelles de suport.\n- Multinivell: tasques imprescindibles, tasques de consolidació i repte d'ampliació.\n- Accessibilitat: opció de lliurar text, esquema, àudio, presentació o prototip.\n\nMetacognició final\nQuè he après? Quina evidència ho demostra? Quin error he corregit? Com milloraria el producte si tingués una sessió més?`;},
  sessions(){
    const c=context(), n=Math.max(1, Math.min(20, Number(get('sessionCount'))||6)), min=get('sessionMinutes')||55, focus=get('sessionFocus');
    return `${commonHeader(c)}\nPLANIFICACIÓ DE SESSIONS\n\nDADES ESPECÍFIQUES DEL MÒDUL SESSIONS\nNombre de sessions: ${n}\nDurada per sessió: ${min} minuts\nEnfocament: ${focus}\n\n${detailedSequence(c,n)}Recomanació docent\nReserva temps real per modelar un exemple, observar dificultats i fer una revisió abans del producte final. Si la consigna del menú lateral és més precisa, les activitats generades també ho seran.`;},
  worksheets(){
    const c=context(), type=get('worksheetType'), level=get('worksheetLevel');
    const count=requestedCount(c, Math.max(3,Math.min(20,Number(get('activityCount'))||8)));
    const acts=exerciseItems(c,count);
    return `${commonHeader(c)}\nFITXA DE TREBALL\n\nDADES ESPECÍFIQUES DEL MÒDUL FITXES\nTipus de fitxa: ${type}\nNivell: ${level}\nNombre d'activitats: ${count}\n\nTítol: ${titleCase(c.tema)}\nTipus: ${type}\nNivell: ${level}\nNom: _______________________   Data: ___________\n\nObjectiu de la fitxa\nAplicar ${c.tema.toLowerCase()} mitjançant activitats concretes, graduades i vinculades als sabers seleccionats.\n\nConsigna de treball\n${c.descripcio || 'Resol les activitats, justifica les respostes i revisa-les amb els criteris d’èxit.'}\n\nAbans de començar\n1. Escriu què creus que ja saps sobre el tema.\n2. Marca dues paraules clau que et semblen importants.\n3. Formula una pregunta que hauràs de poder respondre al final.\n\nActivitats específiques\n${acts.join('\n')}\n\nRepte final\nCrea una mini tasca nova sobre ${c.tema.toLowerCase()} per a un company/a. Ha d'incloure enunciat, dades o context, solució esperada i criteri de correcció.\n\nCriteris d'èxit\n${lines(c.ca.length ? c.ca : ['Resposta completa','Procediment justificat','Ús de vocabulari específic'])}\n\nAdaptació bàsica\n- Fes primer les activitats 1, 2, 3 i una activitat final triada pel docent.\n- Usa una plantilla amb: dades/conceptes, procediment, resposta i comprovació.\n- Dona banc de paraules o fórmules quan calgui.\n\nAmpliació\n- Modifica una activitat perquè tingui més d'una solució possible.\n- Relaciona el resultat amb una situació real del centre, del municipi o de Catalunya.\n\n${solutionGuide(c,count)}`;},
  rubrics(){
    const c=context(), task=get('rubricTask')||'producte o tasca final', scale=get('rubricScale'), count=Math.max(3,Math.min(8,Number(get('rubricCriteria'))||5));
    const criteria = [...c.ca, 'Precisió conceptual i ús de vocabulari específic', 'Justificació del procediment o de les decisions', 'Comunicació del procés i del resultat', 'Autonomia, revisió i millora'].slice(0,count);
    let table=`| Criteri | Inicial | En procés | Assolit | Excel·lent |\n|---|---|---|---|---|\n`;
    criteria.forEach(crit => {table+=`| ${crit} | Evidències incompletes, poc ajustades o sense justificació. | Hi ha encerts, però necessita ajuda o més precisió. | Compleix el criteri amb correcció, ordre i evidències suficients. | Aporta rigor, transferència, revisió i justificació aprofundida. |\n`;});
    return `${commonHeader(c)}\nRÚBRICA D'AVALUACIÓ\n\nDADES ESPECÍFIQUES DEL MÒDUL RÚBRIQUES\nTasca a avaluar: ${task}\nEscala: ${scale}\nNombre de criteris: ${count}\n\n${table}\n\nCom usar-la\n- Comparteix-la abans de començar.\n- Fes una revisió intermèdia amb una evidència concreta.\n- Demana a l'alumnat que indiqui quin criteri ha millorat i com ho sap.\n\nComentari global model\nLa qualificació hauria de combinar el producte final amb evidències del procés. Ajusta els descriptors si la tasca és individual, cooperativa, experimental, digital o de resolució de problemes.`;},
  feedback(){
    const c=context(), work=get('studentWork')||"No s'ha introduït resposta concreta de l'alumne/a.", goal=get('improvementGoal')||'millorar la justificació i la claredat', tone=get('feedbackTone'), detail=get('feedbackDetail');
    return `${commonHeader(c)}\nFEEDBACK PERSONALITZAT\n\nDADES ESPECÍFIQUES DEL MÒDUL FEEDBACK\nTo: ${tone}\nDetall: ${detail}\nObjectiu de millora: ${goal}\n\nEvidència observada\n${work}\n\nRetorn per a l'alumne/a\nHas començat a treballar ${c.tema.toLowerCase()} i ja hi ha una base aprofitable. El pas següent és fer que la resposta sigui més verificable: no n'hi ha prou amb dir la idea, cal mostrar el procediment, la dada, l'exemple o l'evidència que la sosté.\n\nPunt fort\nS'aprecia intent de resposta pròpia i connexió amb el tema.\n\nMillora prioritària\n${goal}. Revisa la producció i afegeix una justificació concreta en cada apartat important.\n\nCriteri de referència\n${c.ca[0] || 'Criteri a concretar pel docent.'}\n\nAcció concreta per millorar\n1. Marca la idea principal.\n2. Afegeix una evidència, càlcul, exemple, esquema o dada.\n3. Escriu una frase final que respongui directament al repte.\n4. Revisa vocabulari específic i coherència.\n\nVersió breu per Classroom\nBon inici. Per millorar, concreta més el procediment i afegeix evidències que justifiquin la resposta.\n\nNota docent\nRevisa aquest retorn abans d'enviar-lo. És una proposta, no una valoració automàtica definitiva.`;},
  templates(){
    const c=context(); const parts = templates[c.plantilla] || [];
    const filled = parts.map(p=>`## ${p}\n${templateFill(p,c)}`).join('\n\n');
    return `${commonHeader(c)}\nPLANTILLA EDITABLE EMPLENADA: ${c.plantilla}\n\nCom usar-la\n- Pots editar directament aquest text dins la caixa de resultat.\n- Els apartats ja no queden en blanc: s'han omplert amb el context, la consigna, els sabers, els criteris i la matèria seleccionats.\n- Revisa-ho abans de copiar, baixar o imprimir.\n\nTítol: ${titleCase(c.tema)}\nCurs i matèria: ${c.curs} · ${c.materia}\nFinalitat: treballar ${c.tema.toLowerCase()} a partir d'una situació propera, mobilitzant els sabers seleccionats i recollint evidències vinculades als criteris d'avaluació.\n\n${filled}`;
  }
};

function markdownishToHtml(text){
  const esc = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines = esc.split(/\n/); let html='', inList=false, inTable=false;
  for(const line of lines){
    if(line.trim().startsWith('|') && line.includes('|')){
      const cells=line.trim().slice(1,-1).split('|').map(x=>x.trim());
      if(cells.every(c=>/^-+$/.test(c.replace(/\s/g,'')))) continue;
      if(!inTable){ html+='<table>'; inTable=true; }
      html+='<tr>'+cells.map(c=>`<td>${c}</td>`).join('')+'</tr>'; continue;
    } else if(inTable){ html+='</table>'; inTable=false; }
    if(/^\s*-\s+/.test(line)){ if(!inList){ html+='<ul>'; inList=true; } html+=`<li>${line.replace(/^\s*-\s+/,'')}</li>`; continue; }
    if(inList){ html+='</ul>'; inList=false; }
    if(!line.trim()){ html+='<br>'; continue; }
    if(/^[A-ZÀ-Ú0-9][A-Za-zÀ-ÿ0-9 '\/·:.-]{1,70}$/.test(line.trim()) && !line.includes(':')) html+=`<h2>${line.trim()}</h2>`;
    else html+=`<p>${line}</p>`;
  }
  if(inList) html+='</ul>'; if(inTable) html+='</table>'; return html;
}
function documentHtml(text,title='DocentCat'){
  return `<!doctype html><html lang="ca"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,Helvetica,sans-serif;line-height:1.45;color:#111827;max-width:900px;margin:0 auto;padding:32px}h1{color:#253b80;border-bottom:3px solid #253b80;padding-bottom:8px}h2{color:#172033;margin-top:22px;border-bottom:1px solid #d9deea;padding-bottom:4px}p{margin:.45rem 0}ul{margin:.35rem 0 .8rem 1.25rem}table{border-collapse:collapse;width:100%;margin:12px 0;font-size:.92rem}td,th{border:1px solid #cfd7e6;padding:8px;vertical-align:top}tr:first-child td{font-weight:bold;background:#eef1ff}.meta{color:#667085;font-size:.9rem;margin-bottom:24px}@media print{body{padding:0;max-width:none}h1{font-size:20pt}h2{font-size:14pt}table{page-break-inside:auto}}</style></head><body><h1>${title}</h1><div class="meta">Generat amb DocentCat · ${new Date().toLocaleDateString('ca-ES')}</div>${markdownishToHtml(text)}</body></html>`;
}
function printDocument(text,title){ const w=window.open('', '_blank'); if(!w){toast('El navegador ha bloquejat la finestra d\'impressió'); return;} w.document.open(); w.document.write(documentHtml(text,title)); w.document.close(); w.focus(); setTimeout(()=>w.print(),300); }
function downloadHtml(filename,text,title){ const blob=new Blob([documentHtml(text,title)],{type:'text/html;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }
function downloadDoc(filename,text,title){ const blob=new Blob([documentHtml(text,title)],{type:'application/msword;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }
function collectState(){ const data={fields:{}, multi:{}, outputs:{}, custom: null}; fields.forEach(f=>{if($(f)) data.fields[f]=$(f).value}); multiFields.forEach(f=>{if($(f)) data.multi[f]=selectedValues(f)}); Object.keys(outputs).forEach(k=>data.outputs[k]=outputs[k].textContent); return data; }
function save(){ const data=collectState(); localStorage.setItem(storeKey,JSON.stringify(data)); updateSummary(); toast('Desat al navegador'); }
function load(){ try{ const data=JSON.parse(localStorage.getItem(storeKey)||'{}'); if(data.fields?.customCurriculum){ try{ curriculum = mergeDeep(curriculum, JSON.parse(data.fields.customCurriculum)); }catch{} } populateContextSelectors(); Object.entries(data.fields||{}).forEach(([k,v])=>{if($(k)) $(k).value=v}); populateContextSelectors(); Object.entries(data.multi||{}).forEach(([k,values])=>{if($(k)){ const set=new Set(values); Array.from($(k).options).forEach(o=>o.selected=set.has(o.value)); }}); queueMicrotask(()=>Object.entries(data.outputs||{}).forEach(([k,v])=>{if(outputs[k]) outputs[k].textContent=v})); }catch{ populateContextSelectors(); } }
function generate(key){ const text = clean(generators[key]()); outputs[key].textContent=text; save(); updateSummary(); }
function copyText(text){ navigator.clipboard?.writeText(text).then(()=>toast('Copiat')); }
function downloadText(filename,text){ const blob=new Blob([text],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }
function dateSlug(){ return new Date().toISOString().slice(0,10); }
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2200); }
function mergeDeep(target, source){ for(const [key,value] of Object.entries(source || {})){ if(value && typeof value === 'object' && !Array.isArray(value)) target[key] = mergeDeep(target[key] || {}, value); else target[key] = value; } return target; }
function importCustomCurriculum(){ try{ const txt = get('customCurriculum'); if(!txt) return toast('No hi ha JSON per importar'); const custom = JSON.parse(txt); curriculum = mergeDeep(curriculum, custom); populateContextSelectors(); save(); toast('Currículum propi importat'); }catch(err){ toast('JSON no vàlid'); } }
function copyCurriculum(){ const c = context(); copyText(`Competències específiques\n${lines(c.ce)}\n\nCriteris d'avaluació\n${lines(c.ca)}\n\nSabers\n${lines(c.sabers)}`); }
for(const btn of document.querySelectorAll('.tab')) btn.onclick=()=>{ document.querySelectorAll('.tab,.module').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $(btn.dataset.tab).classList.add('active'); };
for(const btn of document.querySelectorAll('[data-generate]')) btn.onclick=()=>generate(btn.dataset.generate);
$('saveContextBtn').onclick=save; $('selectCoreBtn').onclick=selectCore; $('copyCurriculumBtn').onclick=copyCurriculum; $('importCurriculumBtn').onclick=importCustomCurriculum;
$('clearBtn').onclick=()=>{ if(confirm('Vols esborrar les dades locals de DocentCat?')){ localStorage.removeItem(storeKey); location.reload();
updateSummary(); }};
$('exportAllBtn').onclick=()=>{ const all=Object.keys(outputs).map(k=>`# ${k.toUpperCase()}\n\n${outputs[k].textContent}`).join('\n\n---\n\n'); downloadHtml(`docentcat-export-${dateSlug()}.html`, all, 'Exportació DocentCat'); };
$('fullPackBtn').onclick=()=>{ ['sa','sessions','worksheets','rubrics','feedback','templates'].forEach(k=>{ if(outputs[k]) outputs[k].textContent = clean(generators[k]()); }); save(); const all=Object.keys(outputs).map(k=>`# ${k.toUpperCase()}\n\n${outputs[k].textContent}`).join('\n\n---\n\n'); downloadHtml(`docentcat-paquet-complet-${dateSlug()}.html`, all, 'Paquet complet DocentCat'); };
fields.forEach(f=>$(f)?.addEventListener('change',()=>{ if(['stage','level','subject'].includes(f)){ populateContextSelectors(); } if(f === 'templateType') renderTemplatePreview(); save(); }));
multiFields.forEach(f=>$(f)?.addEventListener('change',()=>{ if(f === 'ceSelect') updateCriteriaFromCompetencies(false); save(); }));

function updateSummary(){
  if($('summaryStage')) $('summaryStage').textContent = get('stage') || 'ESO';
  if($('summaryLevel')) $('summaryLevel').textContent = get('level') || '—';
  if($('summarySubject')) $('summarySubject').textContent = get('subject') || '—';
  if($('summaryTopic')) $('summaryTopic').textContent = get('topic') || '—';
}
function openModal(id){ const modal=$(id); if(!modal) return; modal.hidden=false; document.body.classList.add('modal-open'); const focusable=modal.querySelector('input,select,textarea,button'); focusable?.focus(); }
function closeModal(modal){ if(!modal) return; modal.hidden=true; document.body.classList.remove('modal-open'); updateSummary(); }
function exportStateJson(){ const blob=new Blob([JSON.stringify(collectState(), null, 2)],{type:'application/json;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`docentcat-projecte-${dateSlug()}.json`; a.click(); URL.revokeObjectURL(a.href); }
function importStateJson(file){ if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); localStorage.setItem(storeKey, JSON.stringify(data)); toast('Projecte JSON importat'); setTimeout(()=>location.reload(),500); }catch{ toast('JSON de projecte no vàlid'); } }; reader.readAsText(file); }
for(const btn of document.querySelectorAll('[data-open-modal]')) btn.addEventListener('click',()=>openModal(btn.dataset.openModal));
for(const btn of document.querySelectorAll('[data-close-modal]')) btn.addEventListener('click',()=>closeModal(btn.closest('.modal')));
for(const modal of document.querySelectorAll('.modal')) modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(modal); });
window.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const open=document.querySelector('.modal:not([hidden])'); if(open) closeModal(open); }});
$('exportAllBtnMirror')?.addEventListener('click',()=>$('exportAllBtn')?.click());
$('fullPackBtnMirror')?.addEventListener('click',()=>$('fullPackBtn')?.click());
$('exportStateBtn')?.addEventListener('click',exportStateJson);
$('importStateFile')?.addEventListener('change',e=>importStateJson(e.target.files?.[0]));

let deferredPrompt; window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; $('installBtn').hidden=false; });
$('installBtn').onclick=async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $('installBtn').hidden=true; }};
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js'); }
load();
updateSummary();
