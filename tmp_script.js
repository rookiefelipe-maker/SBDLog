
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}


// ── BUILT-IN EXERCISES ────────────────────────────────────────
const BUILTIN = ['Bench Press','Incline Bench Press','Decline Bench Press','Dumbbell Bench Press','Chest Fly','Cable Fly','Push-Up','Overhead Press','Dumbbell Shoulder Press','Lateral Raise','Front Raise','Rear Delt Fly','Arnold Press','Tricep Dip','Tricep Pushdown','Skull Crusher','Close-Grip Bench Press','Bicep Curl','Hammer Curl','Preacher Curl','Concentration Curl','Barbell Row','Dumbbell Row','Seated Cable Row','Lat Pulldown','Pull-Up','Chin-Up','Deadlift','Romanian Deadlift','Squat','Front Squat','Leg Press','Lunges','Bulgarian Split Squat','Leg Extension','Leg Curl','Hip Thrust','Glute Bridge','Calf Raise','Seated Calf Raise','Ab Crunch','Hanging Leg Raise','Russian Twist','Plank','Cable Crunch','Face Pull','Shrugs',"Farmer's Walk",'Smith Machine Squat','Machine Chest Press'];

// ── STORAGE ──────────────────────────────────────────────────
const LS = {
  get: k => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};

function getData() {
  return {
    oneRMs: LS.get('mx_1rm') || {sq:null,bp:null,dl:null},
    templates: LS.get('mx_tpl') || [],
    sessions: LS.get('mx_sess') || [],
    customEx: LS.get('mx_ex') || [],
  };
}
function save1RMData(d) { LS.set('mx_1rm', d); }
function saveTplData(d) { LS.set('mx_tpl', d); }
function saveSessData(d) { LS.set('mx_sess', d); }
function saveExData(d) { LS.set('mx_ex', d); }

function getAllExercises() {
  const {customEx} = getData();
  return [...BUILTIN, ...customEx.map(e=>e.name)];
}

// ── HAPTIC & AUDIO FEEDBACK (Mobile) ──────────────────────────
// 🔊 Genera un sonido "pop" usando Web Audio API para clicks
function playPopSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Crear oscilador para el sonido pop
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    // Frecuencia que baja rápido (efecto "pop")
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    // Volumen que desaparece
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    // Si Web Audio no está disponible, continúa sin sonido
  }
}

// 📳 Vibración del dispositivo móvil para feedback táctil
function triggerVibration(duration = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

// ⚡ Función combinada: vibración + sonido (llamar en clicks)
function clickFeedback() {
  triggerVibration(10);
  playPopSound();
}

// ── UTILS ─────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0]; }
function fmtDate(iso) {
  const [y,m,d] = iso.split('-');
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${mo[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}
function weekStart(iso) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}
function e1rm(w,r) { return r===1 ? w : Math.round(w*(1+r/30)); }

// ── MODAL HELPERS ─────────────────────────────────────────────
// 📳 Agregar feedback a los modales
function openModal(id) {
  clickFeedback(); // ⚡ Vibración + sonido al abrir modal
  document.getElementById(id).classList.add('open');
  document.querySelector('.scroll').style.overflow = 'hidden';
}
function closeModal(id) {
  clickFeedback(); // ⚡ Vibración + sonido al cerrar modal
  document.getElementById(id).classList.remove('open');
  document.querySelector('.scroll').style.overflow = '';
}
document.querySelectorAll('.moverlay').forEach(o => {
  o.addEventListener('click', e => { 
    if(e.target===o) {
      clickFeedback(); // ⚡ Vibración + sonido al cerrar modal por overlay
      closeModal(o.id);
    }
  });
});

// ── HEADER DATE ───────────────────────────────────────────────
(function(){
  const d = new Date();
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('hdate').textContent = `${days[d.getDay()]} ${mo[d.getMonth()]} ${d.getDate()}`;
})();

// ── TABS ──────────────────────────────────────────────────────
let currentView = 'dash';
// 📳 Agregar feedback a los tabs
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    clickFeedback(); // ⚡ Vibración + sonido al hacer click en tab
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    currentView = t.dataset.v;
    document.getElementById('v-'+currentView).classList.add('active');
    renderView(currentView);
  });
});

// ── SUBNAV ────────────────────────────────────────────────────
// 📳 Agregar feedback a los subtabs
document.querySelectorAll('.subnav').forEach(nav => {
  nav.querySelectorAll('.subtab').forEach(st => {
    st.addEventListener('click', () => {
      clickFeedback(); // ⚡ Vibración + sonido al hacer click en subtab
      nav.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
      st.classList.add('active');
      const sv = st.dataset.sv;
      // hide all subviews within same parent view
      nav.closest('.view').querySelectorAll('.subview').forEach(x=>x.classList.remove('active'));
      document.getElementById('sv-'+sv).classList.add('active');
      renderSubView(sv);
    });
  });
});

function renderSubView(sv) {
  if(sv==='train') renderTrain();
  else if(sv==='tpl') renderTpl();
  else if(sv==='exlib') renderExLib();
  else if(sv==='hist') renderHist();
  else if(sv==='statsview') renderStats();
}

function renderView(v) {
  if(v==='dash') renderDash();
  else if(v==='training') {
    // render whichever subtab is active
    const activeSub = document.querySelector('#v-training .subtab.active');
    renderSubView(activeSub ? activeSub.dataset.sv : 'train');
  }
  else if(v==='stats') {
    const activeSub = document.querySelector('#v-stats .subtab.active');
    renderSubView(activeSub ? activeSub.dataset.sv : 'hist');
  }
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDash() {
  const {oneRMs, sessions} = getData();
  const grid = document.getElementById('onermGrid');
  const lifts = [{k:'sq',n:'Squat'},{k:'bp',n:'Bench'},{k:'dl',n:'Deadlift'}];
  grid.innerHTML = lifts.map(l => {
    const v = oneRMs[l.k];
    return `<div class="onerm-cell" onclick="clickFeedback(); openModal('m1rm')">
      <div class="onerm-label">${l.n}</div>
      ${v ? `<div class="onerm-val">${v}</div><div class="onerm-unit">kg</div>` : `<div class="onerm-empty">—</div>`}
    </div>`;
  }).join('');

  const all = [oneRMs.sq, oneRMs.bp, oneRMs.dl];
  if(all.every(Boolean)) {
    document.getElementById('totalVal').textContent = all.reduce((a,b)=>a+parseFloat(b),0);
    document.getElementById('totalUnit').textContent = 'kg';
  } else {
    document.getElementById('totalVal').textContent = '—';
    document.getElementById('totalUnit').textContent = '';
  }

  const ws = weekStart(todayISO());
  const weekSess = sessions.filter(s => weekStart(s.date) === ws);
  const weekMaxes = {sq:null,bp:null,dl:null};
  const exMap = {sq:['squat'],bp:['bench press'],dl:['deadlift']};
  weekSess.forEach(s => {
    s.exercises.forEach(ex => {
      const name = ex.name.toLowerCase();
      for(const [k,keys] of Object.entries(exMap)) {
        if(keys.some(kw => name.includes(kw))) {
          ex.sets.forEach(set => {
            const w = parseFloat(set.weight);
            if(w > 0 && (!weekMaxes[k] || w > weekMaxes[k])) weekMaxes[k] = w;
          });
        }
      }
    });
  });

  const weekMaxReps={sq:null,bp:null,dl:null};
  weekSess.forEach(s=>{s.exercises.forEach(ex=>{const name=ex.name.toLowerCase();for(const [k,keys] of Object.entries(exMap)){if(keys.some(kw=>name.includes(kw))){ex.sets.forEach(set=>{const r=parseInt(set.reps)||0,w=parseFloat(set.weight)||0;if(r>0&&w>0&&(!weekMaxReps[k]||r>weekMaxReps[k].reps||(r===weekMaxReps[k].reps&&w>weekMaxReps[k].w)))weekMaxReps[k]={reps:r,w};});}}});});
  document.getElementById('weeklyRows').innerHTML=lifts.map(l=>{
    const v=weekMaxes[l.k],mr=weekMaxReps[l.k];
    return `<div class="week-row" style="cursor:pointer;" onclick="clickFeedback(); navToProgress('${l.n}')">
      <div><div class="week-name">${l.n}</div>${mr?`<div style="font-size:12px;color:var(--text3);margin-top:2px;">${mr.reps} reps @ ${mr.w}kg</div>`:''}</div>
      <div class="week-right">${v?`<div class="week-val">${v}</div><div class="week-unit">kg</div>`:`<div class="week-empty">no data</div>`}<div style="color:var(--text3);font-size:11px;margin-left:6px;">›</div></div>
    </div>`;
  }).join('');
}

// ── 1RM MODAL ────────────────────────────────────────────────
function save1RM() {
  const sq = document.getElementById('m1sq').value;
  const bp = document.getElementById('m1bp').value;
  const dl = document.getElementById('m1dl').value;
  save1RMData({
    sq: sq ? parseFloat(sq) : null,
    bp: bp ? parseFloat(bp) : null,
    dl: dl ? parseFloat(dl) : null,
  });
  closeModal('m1rm');
  renderDash();
}
document.getElementById('m1rm').querySelector('.moverlay, .modal');
// pre-fill on open
document.getElementById('onermGrid') && document.getElementById('onermGrid').addEventListener('click', () => {
  const {oneRMs} = getData();
  document.getElementById('m1sq').value = oneRMs.sq||'';
  document.getElementById('m1bp').value = oneRMs.bp||'';
  document.getElementById('m1dl').value = oneRMs.dl||'';
});

// ── EXERCISES LIBRARY ─────────────────────────────────────────
let editingExId = null;

document.getElementById('newExBtn').addEventListener('click', () => {
  clickFeedback(); // 📳 Vibración + sonido al crear nuevo ejercicio
  editingExId = null;
  document.getElementById('mExTitle').textContent = 'New exercise';
  document.getElementById('mExName').value = '';
  document.getElementById('mExCat').value = '';
  openModal('mEx');
});

function saveEx() {
  const name = document.getElementById('mExName').value.trim();
  if(!name) return;
  const cat = document.getElementById('mExCat').value.trim();
  let {customEx} = getData();
  if(editingExId) {
    customEx = customEx.map(e => e.id===editingExId ? {...e, name, cat} : e);
  } else {
    // prevent duplicate names
    const allEx = getAllExercises();
    if(allEx.some(e => e.toLowerCase()===name.toLowerCase())) {
      document.getElementById('mExName').style.borderColor = '#666';
      return;
    }
    customEx.push({id: Date.now().toString(), name, cat});
  }
  saveExData(customEx);
  closeModal('mEx');
  renderExLib();
}

function editEx(id) {
  const {customEx} = getData();
  const ex = customEx.find(e=>e.id===id);
  if(!ex) return;
  editingExId = id;
  document.getElementById('mExTitle').textContent = 'Edit exercise';
  document.getElementById('mExName').value = ex.name;
  document.getElementById('mExCat').value = ex.cat||'';
  openModal('mEx');
}

function deleteEx(id) {
  let {customEx} = getData();
  customEx = customEx.filter(e=>e.id!==id);
  saveExData(customEx);
  renderExLib();
}

function renderExLib() {
  const {customEx} = getData();

  // custom section
  const customLabel = document.getElementById('customExLabel');
  const customList = document.getElementById('customExList');
  if(customEx.length) {
    customLabel.style.display = 'block';
    customList.style.display = 'block';
    customList.innerHTML = customEx.map(e => `
      <div class="exlib-item">
        <div>
          <div class="exlib-name">${e.name}</div>
          ${e.cat ? `<div class="exlib-custom">${e.cat}</div>` : ''}
        </div>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" onclick="clickFeedback(); editEx('${e.id}')">✏️</button>
          <button class="icon-btn" onclick="clickFeedback(); deleteEx('${e.id}')">✕</button>
        </div>
      </div>`).join('');
  } else {
    customLabel.style.display = 'none';
    customList.style.display = 'none';
    customList.innerHTML = '';
  }

  // built-in list
  document.getElementById('builtinExList').innerHTML = BUILTIN.map(e =>
    `<div class="exlib-item"><div class="exlib-name">${e}</div></div>`
  ).join('');
}

// ── TEMPLATES ─────────────────────────────────────────────────
let editingTplId = null;
let tplExCount = 0;

document.getElementById('newTplBtn').addEventListener('click', () => {
  clickFeedback(); // 📳 Vibración + sonido al crear nueva rutina
  editingTplId = null;
  document.getElementById('mTplTitle').textContent = 'New routine';
  document.getElementById('mTplName').value = '';
  document.getElementById('mTplSearch').value = '';
  document.getElementById('mTplCategory') && (document.getElementById('mTplCategory').value = 'all');
  document.getElementById('mTplExList').innerHTML = '';
  tplExCount = 0;
  addTplEx();
  populateTplCategory();
  filterTplExercises();
  openModal('mTpl');
});

function getExerciseCategory(name) {
  const n = name.toLowerCase();
  if(/chest|bench|fly|push/.test(n)) return 'Chest';
  if(/back|row|pull|lat/.test(n)) return 'Back';
  if(/squat|leg|lunge|thrust|curl/.test(n)) return 'Legs';
  if(/tricep|bicep|arm|shoulder|press|dip/.test(n)) return 'Arms';
  if(/ab|core|plank|crunch|twist|deadlift/.test(n)) return 'Core';
  return '';
}

function getAllExerciseInfos() {
  const {customEx} = getData();
  const map = new Map();
  BUILTIN.forEach(name => map.set(name, {name, cat: getExerciseCategory(name)}));
  customEx.forEach(ex => map.set(ex.name, {name: ex.name, cat: (ex.cat||'').trim() || getExerciseCategory(ex.name)}));
  return [...map.values()];
}

function getFilteredExerciseNames() {
  const search = document.getElementById('mTplSearch')?.value.trim().toLowerCase() || '';
  const cat = document.getElementById('mTplCategory')?.value || 'all';
  return getAllExerciseInfos().filter(ex => {
    const bySearch = !search || ex.name.toLowerCase().includes(search) || (ex.cat && ex.cat.toLowerCase().includes(search));
    const byCat = cat === 'all' || !cat ? true : (ex.cat && ex.cat.toLowerCase() === cat.toLowerCase()) || ex.name.toLowerCase().includes(cat.toLowerCase());
    return bySearch && byCat;
  }).sort((a,b) => a.name.localeCompare(b.name)).map(e => e.name);
}

function populateTplCategory() {
  const sel = document.getElementById('mTplCategory');
  if(!sel) return;
  const cats = new Set(['all']);
  getAllExerciseInfos().forEach(ex => {
    if(ex.cat) cats.add(ex.cat);
  });
  sel.innerHTML = '<option value="all">All groups</option>' + [...cats].filter(c=>c!=='all').sort().map(c=>`<option value="${c}">${c}</option>`).join('');
}

function filterTplExercises() {
  const names = getFilteredExerciseNames();
  document.querySelectorAll('.tpl-ex-sel').forEach(sel => {
    const current = sel.value;
    sel.innerHTML = '<option value="">-- select or type below --</option>' + names.map(name=>`<option value="${name}">${name}</option>`).join('') + '<option value="__custom__">✏️ Type manually...</option>';
    if(current && (names.includes(current) || current==='__custom__')) sel.value = current;
  });
}

function buildExOptions(selected='') {
  const all = getFilteredExerciseNames();
  return all.map(e=>`<option value="${e}"${e===selected?' selected':''}>${e}</option>`).join('');
}

function showTplPicker(id) {
  const panel = document.getElementById(`tplPicker${id}`);
  if(!panel) return;
  panel.style.display = 'block';
  renderTplPicker(id);
}

function hideTplPicker(id) {
  const panel = document.getElementById(`tplPicker${id}`);
  if(panel) panel.style.display = 'none';
}

function renderTplPicker(id) {
  const row = document.querySelector(`[data-exid="${id}"]`);
  if(!row) return;
  const searchEl = row.querySelector('.tpl-picker-search');
  const catEl = row.querySelector('.tpl-picker-select');
  const listEl = row.querySelector('.tpl-picker-list');
  if(!searchEl || !catEl || !listEl) return;

  const search = searchEl.value.trim().toLowerCase();
  const cat = catEl.value;

  const all = getAllExerciseInfos();
  const cats = new Set();
  all.forEach(ex => { if(ex.cat) cats.add(ex.cat); });

  catEl.innerHTML = '<option value="all">All groups</option>' + [...cats].sort().map(c=>`<option value="${c}">${c}</option>`).join('');
  catEl.value = cat || 'all';

  const values = all.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search) || (ex.cat && ex.cat.toLowerCase().includes(search));
    const matchCat = cat==='all' || !cat || ex.cat.toLowerCase()===cat.toLowerCase();
    return matchSearch && matchCat;
  }).sort((a,b)=>a.name.localeCompare(b.name));

  listEl.innerHTML = values.map(ex=>`<div class="tpl-picker-item" onclick="clickTplPicker(${id}, '${ex.name.replace(/'/g,"\\'")}')">${ex.name}${ex.cat?` · ${ex.cat}`:''}</div>`).join('');
}

function clickTplPicker(id, val) {
  const row = document.querySelector(`[data-exid="${id}"]`);
  if(!row) return;
  const select = row.querySelector('.tpl-ex-sel');
  if(select) {
    select.value = val;
    onTplExSelChange(select, id);
  }
  hideTplPicker(id);
}

function addTplEx(val='', isTopSet=false) {
  tplExCount++;
  const id = tplExCount;
  const all = getAllExercises();
  const isCustom = val && !all.includes(val);
  const div = document.createElement('div');
  div.className = 'ex-editor';
  div.dataset.exid = id;
  div.innerHTML = `
    <div class="ex-editor-hdr">
      <div class="reorder-btns" style="margin-right:6px;">
        <button class="reorder-btn" onclick="clickFeedback(); moveTplEx('${id}','up')">▲</button>
        <button class="reorder-btn" onclick="clickFeedback(); moveTplEx('${id}','down')">▼</button>
      </div>
      <div style="flex:1;margin-right:8px;display:flex;flex-direction:column;gap:5px;">
        <div style="position:relative;">
          <select class="fsel tpl-ex-sel" onchange="onTplExSelChange(this,${id})" onclick="showTplPicker(${id})">
            <option value="">-- select or type below --</option>
            ${buildExOptions(val)}
            <option value="__custom__"${isCustom?' selected':''}>✏️ Type manually...</option>
          </select>
          <div class="tpl-picker-panel" id="tplPicker${id}" style="display:none;">
            <input type="text" class="tpl-picker-search" placeholder="Search exercises..." oninput="renderTplPicker(${id})">
            <select class="tpl-picker-select" onchange="renderTplPicker(${id})">
              <option value="all">All groups</option>
            </select>
            <div class="tpl-picker-list" id="tplPickerList${id}"></div>
          </div>
        </div>
        <input type="text" class="finp tpl-ex-manual" placeholder="Exercise name..." style="display:${isCustom?'block':'none'};font-size:13px;padding:9px 12px;" value="${isCustom?val:''}">
        <div class="topset-toggle">
          <label class="toggle-wrap">
            <input type="checkbox" class="tpl-topset-chk"${isTopSet?' checked':''}>
            <span class="toggle-slider"></span>
          </label>
          <span class="topset-label">Top set (e1RM)</span>
        </div>
      </div>
      <button class="icon-btn" onclick="clickFeedback(); removeTplEx(${id})">✕</button>
    </div>`;
  document.getElementById('mTplExList').appendChild(div);
}

function moveTplEx(id, dir) {
  const list = document.getElementById('mTplExList');
  const el = list.querySelector(`[data-exid="${id}"]`);
  if(!el) return;
  if(dir==='up' && el.previousElementSibling) list.insertBefore(el, el.previousElementSibling);
  else if(dir==='down' && el.nextElementSibling) list.insertBefore(el.nextElementSibling, el);
}

function onTplExSelChange(sel, id) {
  const block = document.querySelector(`[data-exid="${id}"]`);
  const manualInp = block ? block.querySelector('.tpl-ex-manual') : null;
  const picker = document.getElementById(`tplPicker${id}`);
  if(picker) picker.style.display = 'none';
  if(!manualInp) return;
  if(sel.value === '__custom__') {
    manualInp.style.display = 'block';
    manualInp.focus();
  } else {
    manualInp.style.display = 'none';
    manualInp.value = '';
  }
}

function removeTplEx(id) {
  const el = document.querySelector(`[data-exid="${id}"]`);
  if(el) el.remove();
}

function saveTpl() {
  const name = document.getElementById('mTplName').value.trim();
  if(!name) return;
  const exercises = [...document.querySelectorAll('.ex-editor')].map(block => {
    const sel = block.querySelector('.tpl-ex-sel');
    const manual = block.querySelector('.tpl-ex-manual');
    const chk = block.querySelector('.tpl-topset-chk');
    let exName = sel && sel.value==='__custom__' ? (manual?manual.value.trim():'') : (sel?sel.value:'');
    if(!exName) return null;
    return {name: exName, topSet: chk?chk.checked:false};
  }).filter(Boolean);
  if(!exercises.length) return;
  let {templates} = getData();
  if(editingTplId) {
    templates = templates.map(t => t.id===editingTplId ? {...t,name,exercises} : t);
  } else {
    templates.push({id: Date.now().toString(), name, exercises});
  }
  saveTplData(templates);
  closeModal('mTpl');
  renderTpl();
}

function renderTpl() {
  const {templates} = getData();
  const list = document.getElementById('tplList');
  list.innerHTML = '';
  if(!templates.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div class="empty-t">No routines yet</div><div class="empty-s">Create your first routine</div></div>`;
    return;
  }
  templates.forEach(t => {
    const div = document.createElement('div');
    div.className = 'tpl-card';
    div.innerHTML = `
      <div class="tpl-header">
        <div>
          <div class="tpl-name">${t.name}</div>
          <div class="tpl-excount">${t.exercises.length} exercises</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" onclick="clickFeedback(); editTpl('${t.id}')">✏️</button>
          <button class="icon-btn" onclick="clickFeedback(); deleteTpl('${t.id}')">✕</button>
        </div>
      </div>
      <div class="tpl-exlist">
        ${t.exercises.map(e=>{const n=typeof e==='object'?e.name:e;const ts=typeof e==='object'&&e.topSet;return `<div class="tpl-ex">· ${n}${ts?'<span class="topset-badge">TOP</span>':''}</div>`;}).join('')}
      </div>`;
    list.appendChild(div);
  });
}

function editTpl(id) {
  const {templates} = getData();
  const t = templates.find(x=>x.id===id);
  if(!t) return;
  editingTplId = id;
  document.getElementById('mTplTitle').textContent = 'Edit routine';
  document.getElementById('mTplName').value = t.name;
  document.getElementById('mTplSearch').value = '';
  document.getElementById('mTplCategory') && (document.getElementById('mTplCategory').value = 'all');
  document.getElementById('mTplExList').innerHTML = '';
  tplExCount = 0;
  t.exercises.forEach(e => { if(typeof e==='object') addTplEx(e.name, e.topSet||false); else addTplEx(e, false); });
  populateTplCategory();
  filterTplExercises();
  openModal('mTpl');
}

function deleteTpl(id) {
  let {templates} = getData();
  templates = templates.filter(t=>t.id!==id);
  saveTplData(templates);
  renderTpl();
}

document.addEventListener('click', e => {
  if(!e.target.closest('.ex-editor')) {
    document.querySelectorAll('.tpl-picker-panel').forEach(p => p.style.display = 'none');
  }
});

// ── TRAIN ─────────────────────────────────────────────────────
let activeSession = null;
let sessSetCount = 0;

function renderTrain() {
  const {templates} = getData();
  const content = document.getElementById('trainContent');
  if(!templates.length) {
    content.innerHTML = `<div class="empty"><div class="empty-icon">🏋️</div><div class="empty-t">No routines</div><div class="empty-s">Create a routine first in the Routines tab</div></div>`;
    return;
  }
  content.innerHTML = `<div class="slabel" style="margin-bottom:8px;">Select today's session</div><div class="train-grid" id="tpickGrid"></div>`;
  const grid = document.getElementById('tpickGrid');
  const {sessions} = getData();
  templates.forEach(t => {
    const past = sessions.filter(s=>s.tplId===t.id).sort((a,b)=>b.date.localeCompare(a.date));
    const last = past[0];
    const card = document.createElement('div');
    card.className = 'tpick';
    
    // Extract exercise names, handle both strings and objects
    const exNames = t.exercises.map(ex => typeof ex === 'object' ? ex.name : ex);
    const displayEx = exNames.slice(0, 4).join(' · ');
    const moreCount = exNames.length > 4 ? ` +${exNames.length - 4}` : '';
    
    card.innerHTML = `
      <div class="tpick-name">${t.name}</div>
      <div class="tpick-exs">${displayEx}${moreCount}</div>
      <div class="tpick-last">${last ? 'Last: '+fmtDate(last.date) : 'No history'}</div>`;
    card.addEventListener('click', () => { clickFeedback(); startSession(t.id); });
    grid.appendChild(card);
  });
}

function startSession(tplId) {
  const {templates, sessions} = getData();
  const tpl = templates.find(t=>t.id===tplId);
  if(!tpl) return;
  const past = sessions.filter(s=>s.tplId===tplId).sort((a,b)=>b.date.localeCompare(a.date));
  const lastSess = past[0];
  activeSession = {
    id: 'draft_'+Date.now(),
    tplId, tplName: tpl.name, date: todayISO(),
    exercises: tpl.exercises.map(exObj => {
      const name = typeof exObj==='object' ? exObj.name : exObj;
      const topSet = typeof exObj==='object' ? (exObj.topSet||false) : false;
      let lastSets = null;
      if(lastSess) {
        const prevEx = lastSess.exercises.find(e=>e.name===name);
        if(prevEx && prevEx.sets.length) lastSets = prevEx.sets;
      }
      return { name, topSet, sets: [], lastSets, superset: null, supersetName: null };
    })
  };
  sessSetCount = 0;
  renderActiveSession();
  openModal('mSess');
}

function renderActiveSession() {
  if(!activeSession) return;
  const content = document.getElementById('mSessContent');
  if(!window._restTimer) window._restTimer = {running:false, remaining:0, default:180, interval:null};
  const rt = window._restTimer;
  const rtDisplay = rt.running ? formatTimer(rt.remaining) : formatTimer(rt.default);

  let html = `
    <button class="btn btn-ghost btn-sm" style="margin-bottom:10px; width:auto;" onclick="clickFeedback(); cancelSession();">← Volver</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <div>
        <div class="sess-tname">${activeSession.tplName}</div>
        <div class="sess-dlabel">${fmtDate(activeSession.date)}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div class="rest-timer-bar" style="margin-bottom:0;padding:8px 10px;gap:6px;">
          <div class="rest-timer-display${rt.running?' running':''}" id="restTimerDisplay" style="cursor:pointer;" onclick="clickFeedback(); openRestTimerModal()">${rtDisplay}</div>
          <button class="rest-timer-btn" onclick="clickFeedback(); toggleRestTimer()" id="restTimerBtn">${rt.running?'Stop':'Rest'}</button>
        </div>
        <button class="btn btn-sm" onclick="clickFeedback(); finishSession()" style="width:auto;">Finish</button>
      </div>
    </div>`;

  activeSession.exercises.forEach((ex, ei) => {
    const lastRef = ex.lastSets ? ex.lastSets.map(s=>`${s.weight}×${s.reps}`).join(', ') : null;
    html += `<div class="ex-block">
      <div class="ex-block-header">
        <div style="display:flex;align-items:center;gap:4px;flex:1;">
          <div class="reorder-btns" style="margin-right:4px;">
            <button class="reorder-btn" onclick="clickFeedback(); moveSessEx(${ei},'up')" ${ei===0?'disabled':''}>▲</button>
            <button class="reorder-btn" onclick="clickFeedback(); moveSessEx(${ei},'down')" ${ei===activeSession.exercises.length-1?'disabled':''}>▼</button>
          </div>
          <div class="ex-block-name">${ex.name}${ex.topSet?'<span class="topset-badge">TOP</span>':''}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="icon-btn" onclick="clickFeedback(); startSupersetSelection(${ei})" title="Create superset">⛓️</button>
          <button class="icon-btn" onclick="clickFeedback(); removeSessExercise(${ei})" title="Delete">✕</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;padding:0 14px 8px;">
        ${lastRef ? `<div class="ex-last-ref">Prev: ${lastRef}</div>` : ''}
        ${ex.superset ? `<div style="font-size:11px;color:#aaa;">Paired with: ${ex.supersetName}</div>` : ''}
      </div>
      <div class="col-labels-d">
        <div class="col-label">RPE</div>
        <div class="col-label">kg</div>
        <div class="col-label">reps</div>
        <div class="col-label">e1RM</div>
        <div class="col-label"></div>
      </div>
      <div class="sets-area" id="sets-ex-${ei}">
        ${ex.sets.map((s,si) => buildSetRow(ei,si,s.weight,s.reps,s.rpe||'')).join('')}
      </div>
      <div style="padding:0 14px 12px;">
        <button class="btn-dashed" onclick="clickFeedback(); addSessSet(${ei},'')">+ Set</button>
      </div>
    </div>`;
  });

  html += `
    <div style="margin-top:12px;margin-bottom:4px;">
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" class="sinp" id="addExManualInp" placeholder="Exercise name..." style="flex:1;font-size:13px;padding:9px 12px;text-align:left;">
        <button class="btn btn-sm btn-ghost" onclick="clickFeedback(); addExManualToSession()" style="white-space:nowrap;">+ Add</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn" style="flex:1;" onclick="clickFeedback(); updateSession()">Update</button>
      <button class="btn btn-ghost" style="flex:1;" onclick="clickFeedback(); finishSession()">Finish</button>
    </div>
    <button class="btn-danger" style="width:100%;margin-top:10px;" onclick="clickFeedback(); cancelSession()">Cancel session</button>`;
  content.innerHTML = html;
}

function buildSetRow(ei, si, weight='', reps='', rpe='') {
  sessSetCount++;
  const ex = activeSession ? activeSession.exercises[ei] : null;
  const isTopSet = ex ? ex.topSet : false;
  const showEst = isTopSet && weight && reps && parseFloat(weight)>0 && parseInt(reps)>0;
  const est = showEst ? e1rm(parseFloat(weight), parseInt(reps))+'kg' : (isTopSet?'—':'');
  const rpeClass = rpe ? `rpe-${rpe}` : '';
  const rpeLabel = rpe==='easy'?'🟢':rpe==='medium'?'🟡':rpe==='hard'?'🔴':`${si+1}`;
  return `<div class="srow-d" data-ei="${ei}" data-si="${si}">
    <button class="sn-rpe ${rpeClass}" onclick="cycleRpe(this,${ei},${si})" title="Tap to rate">${rpeLabel}</button>
    <input type="number" class="sinp w-inp" value="${weight}" placeholder="0" min="0" step="0.5" inputmode="decimal"
      oninput="liveEst(this,${ei},${si})">
    <input type="number" class="sinp r-inp" value="${reps}" placeholder="0" min="1" step="1" inputmode="numeric"
      oninput="liveEst(this,${ei},${si})">
    <div class="sest" id="est-${ei}-${si}">${est}</div>
    <button class="sdel" onclick="clickFeedback(); removeSessSet(${ei},${si})">✕</button>
  </div>`;
}

const RPE_CYCLE = ['','easy','medium','hard'];
function cycleRpe(btn, ei, si) {
  clickFeedback();
  const cur = btn.classList.contains('rpe-easy')?'easy':btn.classList.contains('rpe-medium')?'medium':btn.classList.contains('rpe-hard')?'hard':'';
  const next = RPE_CYCLE[(RPE_CYCLE.indexOf(cur)+1)%RPE_CYCLE.length];
  btn.classList.remove('rpe-easy','rpe-medium','rpe-hard');
  if(next) btn.classList.add(`rpe-${next}`);
  const si_ = parseInt(btn.closest('.srow-d').dataset.si);
  const ei_ = parseInt(btn.closest('.srow-d').dataset.ei);
  const label = next==='easy'?'🟢':next==='medium'?'🟡':next==='hard'?'🔴':`${si_+1}`;
  btn.textContent = label;
  if(activeSession && activeSession.exercises[ei_] && activeSession.exercises[ei_].sets[si_]!==undefined)
    activeSession.exercises[ei_].sets[si_].rpe = next;
}

function moveSessEx(ei, dir) {
  if(!activeSession) return;
  collectSessionFromDOM();
  const exs = activeSession.exercises;
  if(dir==='up' && ei>0) [exs[ei-1],exs[ei]]=[exs[ei],exs[ei-1]];
  else if(dir==='down' && ei<exs.length-1) [exs[ei],exs[ei+1]]=[exs[ei+1],exs[ei]];
  renderActiveSession();
}

function formatTimer(s){const m=Math.floor(s/60);return `${m}:${(s%60).toString().padStart(2,'0')}`;}
function toggleRestTimer(){
  const rt=window._restTimer;
  if(rt.running){clearInterval(rt.interval);rt.running=false;rt.remaining=rt.default;}
  else{rt.remaining=rt.default;rt.running=true;rt.interval=setInterval(()=>{rt.remaining--;const d=document.getElementById('restTimerDisplay'),b=document.getElementById('restTimerBtn');if(d)d.textContent=formatTimer(rt.remaining);if(rt.remaining<=0){clearInterval(rt.interval);rt.running=false;playRestBeeps();if(d){d.textContent=formatTimer(rt.default);d.classList.remove('running');}if(b)b.textContent='Rest';}},1000);}
  const d=document.getElementById('restTimerDisplay'),b=document.getElementById('restTimerBtn');
  if(d){if(rt.running)d.classList.add('running');else{d.classList.remove('running');d.textContent=formatTimer(rt.default);}}
  if(b)b.textContent=rt.running?'Stop':'Rest';
}
function setRestTimerDefault(val){const v=parseInt(val);if(v>=10&&v<=600){window._restTimer.default=v;if(!window._restTimer.running){const d=document.getElementById('restTimerDisplay');if(d)d.textContent=formatTimer(v);}}}
function playRestBeeps(){
  try{const ctx=new(window.AudioContext||window.webkitAudioContext)();[0,0.4,0.8].forEach(offset=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.setValueAtTime(880,ctx.currentTime+offset);gain.gain.setValueAtTime(0.4,ctx.currentTime+offset);gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+offset+0.25);osc.start(ctx.currentTime+offset);osc.stop(ctx.currentTime+offset+0.25);});if(navigator.vibrate)navigator.vibrate([100,100,100,100,200]);}catch(e){}
}

function openRestTimerModal() {
  const rt = window._restTimer;
  const minutes = Math.floor(rt.default / 60);
  document.getElementById('restTimerMinutesInp').value = minutes;
  openModal('mRestTimer');
}

function saveRestTimerEdit() {
  const minutesInp = document.getElementById('restTimerMinutesInp');
  const minutes = parseInt(minutesInp.value);
  
  if(!minutes || minutes < 1 || minutes > 10) {
    alert('Enter a value between 1 and 10 minutes');
    return;
  }
  
  const seconds = minutes * 60;
  window._restTimer.default = seconds;
  
  // Update display
  const d = document.getElementById('restTimerDisplay');
  if(d && !window._restTimer.running) {
    d.textContent = formatTimer(seconds);
  }
  
  closeModal('mRestTimer');
}

function liveEst(inp, ei, si) {
  const row = inp.closest('.srow-d');
  const w = parseFloat(row.querySelector('.w-inp').value);
  const r = parseInt(row.querySelector('.r-inp').value);
  const el = document.getElementById(`est-${ei}-${si}`);
  const isTopSet = activeSession && activeSession.exercises[ei] && activeSession.exercises[ei].topSet;
  if(el){if(isTopSet) el.textContent=(w>0&&r>0)?e1rm(w,r)+'kg':'—'; else el.textContent='';}
}

function addSessSet(ei, defaultWeight='') {
  if(!activeSession) return;
  const ex = activeSession.exercises[ei];
  const si = ex.sets.length;
  const w = defaultWeight || ex.goalWeight || '';
  ex.sets.push({weight: w, reps:''});
  const area = document.getElementById(`sets-ex-${ei}`);
  if(area) area.insertAdjacentHTML('beforeend', buildSetRow(ei, si, w, '', ''));
}

function removeSessSet(ei, si) {
  if(!activeSession) return;
  // collect current DOM values before splicing
  collectSessionFromDOM();
  activeSession.exercises[ei].sets.splice(si, 1);
  renderActiveSession();
}

function collectSessionFromDOM() {
  if(!activeSession) return;
  activeSession.exercises.forEach((ex, ei) => {
    const rows = document.querySelectorAll(`.srow-d[data-ei="${ei}"]`);
    ex.sets = [...rows].map(row => {
      const btn = row.querySelector('.sn-rpe');
      const rpe = btn&&btn.classList.contains('rpe-easy')?'easy':btn&&btn.classList.contains('rpe-medium')?'medium':btn&&btn.classList.contains('rpe-hard')?'hard':'';
      return {weight:row.querySelector('.w-inp').value,reps:row.querySelector('.r-inp').value,rpe};
    });
  });
}

function finishSession() {
  if(!activeSession) return;
  collectSessionFromDOM();
  activeSession.exercises.forEach(ex => {
    ex.sets = ex.sets.filter(s => parseFloat(s.weight)>0 && parseInt(s.reps)>0);
  });
  const hasData = activeSession.exercises.some(ex => ex.sets.length > 0);
  if(!hasData) { cancelSession(); return; }
  let {sessions} = getData();
  sessions.push({
    id: Date.now().toString(),
    date: activeSession.date,
    tplId: activeSession.tplId,
    tplName: activeSession.tplName,
    exercises: activeSession.exercises.map(ex => ({name: ex.name, topSet: ex.topSet||false, sets: ex.sets}))
  });
  saveSessData(sessions);
  
  // Clear draft session
  let drafts = LS.get('mx_draft_sess') || {};
  if(activeSession.id) delete drafts[activeSession.id];
  LS.set('mx_draft_sess', drafts);
  
  activeSession = null;
  closeModal('mSess');
  renderDash();
  renderHist();
  renderStats();
}

function updateSession() {
  if(!activeSession) return;
  collectSessionFromDOM();
  
  // Validate that session has at least one exercise
  const hasExercises = activeSession.exercises.length > 0;
  if(!hasExercises) {
    alert('Add at least one exercise before updating.');
    return;
  }
  
  // Update the template/routine with new exercises
  let {templates} = getData();
  const tplIndex = templates.findIndex(t => t.id === activeSession.tplId);
  if(tplIndex >= 0) {
    // Get current exercise names from session
    const sessionExNames = activeSession.exercises.map(ex => ex.name);
    
    // Update template exercises to match session
    templates[tplIndex].exercises = activeSession.exercises.map(ex => ({
      name: ex.name,
      topSet: ex.topSet || false
    }));
    saveTplData(templates);
  }
  
  // Save as draft session
  let drafts = LS.get('mx_draft_sess') || {};
  drafts[activeSession.id] = {
    tplId: activeSession.tplId,
    tplName: activeSession.tplName,
    date: activeSession.date,
    exercises: activeSession.exercises.map(ex => ({name: ex.name, topSet: ex.topSet||false, sets: ex.sets}))
  };
  LS.set('mx_draft_sess', drafts);
  
  // Show confirmation
  const content = document.getElementById('mSessContent');
  if(content) {
    const updateBtn = [...content.querySelectorAll('button')].find(b => b.textContent === 'Update');
    if(updateBtn) {
      const originalText = updateBtn.textContent;
      updateBtn.textContent = 'Saved ✓';
      setTimeout(() => { updateBtn.textContent = originalText; }, 1500);
    }
  }
}

function addExManualToSession() {
  if(!activeSession) return;
  const inp = document.getElementById('addExManualInp');
  const name = inp ? inp.value.trim() : '';
  if(!name) return;
  
  // Auto-save to customEx if doesn't exist
  const allEx = getAllExercises();
  if(!allEx.includes(name)) {
    let {customEx} = getData();
    customEx.push({id: Date.now().toString(), name, cat: ''});
    saveExData(customEx);
  }
  
  collectSessionFromDOM();
  activeSession.exercises.push({name, sets:[], lastSets:null, superset: null, supersetName: null});
  renderActiveSession();
  inp.value = '';
  // scroll to bottom of modal
  const body = document.getElementById('mSessBody');
  if(body) body.scrollTop = body.scrollHeight;
}

function cancelSession() {
  activeSession = null;
  closeModal('mSess');
}

function removeSessExercise(ei) {
  if(!activeSession || !activeSession.exercises[ei]) return;
  const exName = activeSession.exercises[ei].name;
  collectSessionFromDOM();
  
  // Remove from session
  activeSession.exercises.splice(ei, 1);
  
  // Remove from customEx if it's a custom exercise
  let {customEx} = getData();
  const customIndex = customEx.findIndex(e => e.name === exName);
  if(customIndex >= 0) {
    customEx.splice(customIndex, 1);
    saveExData(customEx);
  }
  
  renderActiveSession();
}

let supersetSelectionMode = null;
function startSupersetSelection(targetEi) {
  if(!activeSession) return;
  supersetSelectionMode = targetEi;
  const targetEx = activeSession.exercises[targetEi];
  const options = activeSession.exercises
    .filter((ex, i) => i !== targetEi)
    .map((ex, i) => `<button class="btn btn-ghost" style="width:100%;margin:4px 0;" onclick="clickFeedback(); setSupersetPair(${targetEi},${activeSession.exercises.indexOf(ex)})">${ex.name}</button>`)
    .join('');
  
  if(!options) {
    alert('No other exercises available for superset');
    supersetSelectionMode = null;
    return;
  }
  
  // Create a simple dialog/modal
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg2);border:1px solid var(--bg3);border-radius:12px;padding:20px;z-index:300;max-width:90%;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
  modal.innerHTML = `
    <div style="color:var(--text1);font-weight:600;margin-bottom:12px;">Pair with:</div>
    ${options}
    <button class="btn btn-ghost" style="width:100%;margin-top:8px;" onclick="clickFeedback(); this.closest('div').remove(); supersetSelectionMode = null;">Cancel</button>
  `;
  document.body.appendChild(modal);
}

function setSupersetPair(ei1, ei2) {
  if(!activeSession) return;
  // Remove existing modal
  document.querySelectorAll('div[style*="position:fixed"]').forEach(el => {
    if(el.textContent.includes('Pair with:')) el.remove();
  });
  
  const ex1 = activeSession.exercises[ei1];
  const ex2 = activeSession.exercises[ei2];
  
  // Set the pairing
  ex1.superset = ei2;
  ex1.supersetName = ex2.name;
  ex2.superset = ei1;
  ex2.supersetName = ex1.name;
  
  supersetSelectionMode = null;
  renderActiveSession();
}

// ── HISTORY ───────────────────────────────────────────────────
function renderHist() {
  const {sessions} = getData();
  const list = document.getElementById('histList');
  list.innerHTML = '';
  if(!sessions.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📖</div><div class="empty-t">No history</div><div class="empty-s">Completed sessions will appear here</div></div>`;
    return;
  }
  [...sessions].sort((a,b)=>b.date.localeCompare(a.date)).forEach(s => {
    const totalSets = s.exercises.reduce((a,e)=>a+e.sets.length,0);
    const card = document.createElement('div');
    card.className = 'hist-card';
    card.innerHTML = `
      <div class="hist-hdr" onclick="clickFeedback(); this.closest('.hist-card').classList.toggle('open')">
        <div>
          <div class="hist-tag">${s.tplName||'Session'}</div>
          <div class="hist-date">${fmtDate(s.date)}</div>
        </div>
        <div class="hist-right">
          <div class="hist-sum">${totalSets} sets</div>
          <div class="hchev">▼</div>
        </div>
      </div>
      <div class="hist-body">
        ${s.exercises.map(ex=>`
          <div class="hex">
            <div class="hex-name">${ex.name}</div>
            <table class="htbl">
              <tr><th>Set</th><th>Weight</th><th>Reps</th>${ex.topSet?'<th>e1RM</th>':''}<th>RPE</th></tr>
              ${ex.sets.map((st,i)=>{const rpeEmoji=st.rpe==='easy'?'🟢':st.rpe==='medium'?'🟡':st.rpe==='hard'?'🔴':'';return `<tr><td>${i+1}</td><td>${st.weight} kg</td><td>${st.reps}</td>${ex.topSet?`<td class="e1">${e1rm(parseFloat(st.weight),parseInt(st.reps))} kg</td>`:''}<td>${rpeEmoji}</td></tr>`;}).join('')}
            </table>
          </div>`).join('')}
        <button class="btn-danger" onclick="clickFeedback(); deleteSess('${s.id}')">Delete session</button>
      </div>`;
    list.appendChild(card);
  });
}

function deleteSess(id) {
  let {sessions} = getData();
  sessions = sessions.filter(s=>s.id!==id);
  saveSessData(sessions);
  renderHist();
  renderDash();
  renderStats();
}

function navToStats(subview) {
  // activate Stats tab
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  const statsTab = document.querySelector('.tab[data-v="stats"]');
  statsTab.classList.add('active');
  currentView = 'stats';
  document.getElementById('v-stats').classList.add('active');
  // activate correct subtab
  document.querySelectorAll('#v-stats .subtab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('#v-stats .subview').forEach(x=>x.classList.remove('active'));
  const target = document.querySelector(`#v-stats .subtab[data-sv="${subview}"]`);
  if(target) target.classList.add('active');
  document.getElementById('sv-'+subview).classList.add('active');
  renderStats();
}

function navToProgress(exName) {
  navToStats('statsview');
  // after render, set the select to this exercise
  setTimeout(() => {
    const sel = document.getElementById('exProgSel');
    if(sel && exName) {
      // find closest match
      const opts = [...sel.options].map(o=>o.value);
      const match = opts.find(o=>o.toLowerCase().includes(exName.toLowerCase()));
      if(match) { sel.value = match; drawProgressChart(getData().sessions, match); }
    }
  }, 50);
}

// ── STATS ─────────────────────────────────────────────────────
const SBD_KEYS = {
  'Squat':    s => s.exercises.filter(e=>e.name.toLowerCase().includes('squat') && !e.name.toLowerCase().includes('front') && !e.name.toLowerCase().includes('hack')),
  'Bench Press': s => s.exercises.filter(e=>e.name.toLowerCase().includes('bench') && !e.name.toLowerCase().includes('incline') && !e.name.toLowerCase().includes('close')),
  'Deadlift': s => s.exercises.filter(e=>e.name.toLowerCase().includes('deadlift') && !e.name.toLowerCase().includes('romanian') && !e.name.toLowerCase().includes('rdl') && !e.name.toLowerCase().includes('deficit')),
};

function getMaxWeight(exercises) {
  let max = 0;
  exercises.forEach(ex => ex.sets.forEach(s => { const w = parseFloat(s.weight)||0; if(w>max) max=w; }));
  return max || null;
}

function getPRs(sessions) {
  const prs = {Squat:null, 'Bench Press':null, Deadlift:null};
  sessions.forEach(s => {
    for(const [lift, getter] of Object.entries(SBD_KEYS)) {
      const exs = getter(s);
      const max = getMaxWeight(exs);
      if(max && (!prs[lift] || max > prs[lift].w)) prs[lift] = {w:max, date:s.date};
    }
  });
  return prs;
}

function getWeekRepsPRs(sessions) {
  const ws=weekStart(todayISO());
  const prs={Squat:null,'Bench Press':null,Deadlift:null};
  sessions.filter(s=>weekStart(s.date)===ws).forEach(s=>{
    for(const [lift,getter] of Object.entries(SBD_KEYS)){
      getter(s).forEach(ex=>{
        ex.sets.forEach(st=>{
          const r=parseInt(st.reps)||0,w=parseFloat(st.weight)||0;
          if(r>0&&w>0&&(!prs[lift]||r>prs[lift].reps||(r===prs[lift].reps&&w>prs[lift].w)))
            prs[lift]={reps:r,w,date:s.date};
        });
      });
    }
  });
  return prs;
}

function renderStats() {
  const {sessions} = getData();
  renderStreak(sessions);
  renderFreq(sessions);

  // ── PR Table
  const prs=getPRs(sessions);
  const prEl=document.getElementById('prTable');
  const lifts=['Squat','Bench Press','Deadlift'];
  if(!lifts.some(l=>prs[l])){prEl.innerHTML=`<div class="pr-empty">No data yet</div>`;}
  else{prEl.innerHTML=lifts.map(l=>{const pr=prs[l];return `<div class="pr-row"><div class="pr-lift">${l}</div><div class="pr-right">${pr?`<div class="pr-val">${pr.w} <span style="font-size:13px;color:var(--text3)">kg</span></div><div class="pr-date">${fmtDate(pr.date)}</div>`:`<div class="pr-date">no data</div>`}</div></div>`;}).join('');}
  const weekRepsPRs=getWeekRepsPRs(sessions);
  const prRepsEl=document.getElementById('prRepsTable');
  if(prRepsEl){if(!lifts.some(l=>weekRepsPRs[l])){prRepsEl.innerHTML=`<div class="pr-empty">No data yet</div>`;}else{prRepsEl.innerHTML=lifts.map(l=>{const pr=weekRepsPRs[l];return `<div class="pr-row"><div class="pr-lift">${l}</div><div class="pr-right">${pr?`<div style="display:flex;align-items:baseline;gap:4px;"><span style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--text2)">${pr.reps}</span><span style="font-size:12px;color:var(--text3)">reps @ ${pr.w}kg</span></div><div style="font-size:11px;color:var(--text3)">${fmtDate(pr.date)}</div>`:`<div style="font-size:12px;color:var(--text3)">no data</div>`}</div></div>`;}).join('');}}

  // ── SBD Total chart (over time — per session, sum of best S+B+D)
  drawTotalChart(sessions);

  // ── Progress chart (by exercise)
  const sel = document.getElementById('exProgSel');
  const allEx = [...new Set(sessions.flatMap(s=>s.exercises.map(e=>e.name)))].sort();
  const prev = sel.value;
  sel.innerHTML = allEx.length ? allEx.map(e=>`<option>${e}</option>`).join('') : '<option>No data</option>';
  if(prev && allEx.includes(prev)) sel.value = prev;
  drawProgressChart(sessions, sel.value);
  sel.onchange = () => drawProgressChart(sessions, sel.value);

  // ── Week comparison
  renderWeekCompare(sessions);
}

function drawTotalChart(sessions) {
  const wrap = document.getElementById('chartTotalWrap');
  if(!wrap) return;
  // For each session that has at least one SBD lift, compute best S+B+D available
  const byDate = {};
  sessions.forEach(s => {
    const vals = {};
    for(const [lift, getter] of Object.entries(SBD_KEYS)) {
      const max = getMaxWeight(getter(s));
      if(max) vals[lift] = max;
    }
    if(Object.keys(vals).length === 0) return;
    if(!byDate[s.date]) byDate[s.date] = {};
    for(const [k,v] of Object.entries(vals)) {
      if(!byDate[s.date][k] || v > byDate[s.date][k]) byDate[s.date][k] = v;
    }
  });
  // Only plot dates where all 3 are known
  const points = Object.entries(byDate)
    .filter(([,v]) => v['Squat'] && v['Bench Press'] && v['Deadlift'])
    .map(([date,v]) => ({date, total: v['Squat']+v['Bench Press']+v['Deadlift']}))
    .sort((a,b)=>a.date.localeCompare(b.date));

  if(points.length < 2) { wrap.innerHTML='<div class="chart-empty">Need sessions with S+B+D to show total</div>'; return; }
  drawLineChart(wrap, points.map(p=>p.total), points.map(p=>p.date), '#cc2222');
}

function drawProgressChart(sessions, exName) {
  const wrap = document.getElementById('chartWrap');
  if(!wrap) return;
  wrap.innerHTML = '';
  if(!exName || !sessions.length) { wrap.innerHTML='<div class="chart-empty">No data</div>'; return; }
  const points = [];
  sessions.forEach(s => {
    s.exercises.filter(e=>e.name===exName).forEach(ex => {
      const maxW = Math.max(...ex.sets.map(st=>parseFloat(st.weight)||0));
      if(maxW>0) points.push({date:s.date, w:maxW});
    });
  });
  if(points.length < 2) { wrap.innerHTML='<div class="chart-empty">Not enough data</div>'; return; }
  const sorted = points.sort((a,b)=>a.date.localeCompare(b.date));
  drawLineChart(wrap, sorted.map(p=>p.w), sorted.map(p=>p.date), '#888');
}

function drawLineChart(wrap, values, labels, color) {
  wrap.innerHTML = '';
  const W = wrap.clientWidth||320, H = 120, padL=34, padR=12, padT=14, padB=20;
  const minV = Math.min(...values), maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const n = values.length;
  const xs = i => padL + (i/(n-1)) * (W-padL-padR);
  const ys = v => padT + (1-(v-minV)/range) * (H-padT-padB);
  const pts = values.map((v,i)=>`${xs(i)},${ys(v)}`).join(' ');
  const fill = `${xs(0)},${H-padB} `+values.map((v,i)=>`${xs(i)},${ys(v)}`).join(' ')+` ${xs(n-1)},${H-padB}`;
  // axis labels
  const yLabels = [minV, Math.round((minV+maxV)/2), maxV];
  const yLabelsSvg = yLabels.map(v=>`<text x="${padL-4}" y="${ys(v)+4}" text-anchor="end" fill="#555" font-size="9" font-family="DM Sans">${v}</text>`).join('');
  // x labels: first and last date
  const xLabelsSvg = [0, n-1].map(i=>`<text x="${xs(i)}" y="${H-4}" text-anchor="${i===0?'start':'end'}" fill="#555" font-size="9" font-family="DM Sans">${labels[i].slice(5)}</text>`).join('');
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="lg${color.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#2a2a2a" stroke-width="1"/>
    ${yLabelsSvg}
    ${xLabelsSvg}
    <polygon points="${fill}" fill="url(#lg${color.replace('#','')})"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${xs(n-1)}" cy="${ys(values[n-1])}" r="3.5" fill="${color}"/>
    <text x="${xs(n-1)+6}" y="${ys(values[n-1])+4}" fill="#ccc" font-size="10" font-family="DM Sans">${values[n-1]}kg</text>
  </svg>`;
}

function renderWeekCompare(sessions) {
  const el = document.getElementById('weekCompare');
  if(!el) return;
  const thisWS = weekStart(todayISO());
  const prevDate = new Date(thisWS+'T12:00:00');
  prevDate.setDate(prevDate.getDate()-7);
  const prevWS = prevDate.toISOString().split('T')[0];

  const getWeekMax = (ws) => {
    const result = {};
    sessions.filter(s=>weekStart(s.date)===ws).forEach(s=>{
      for(const [lift, getter] of Object.entries(SBD_KEYS)) {
        const max = getMaxWeight(getter(s));
        if(max && (!result[lift]||max>result[lift])) result[lift]=max;
      }
    });
    return result;
  };

  const thisW = getWeekMax(thisWS);
  const prevW = getWeekMax(prevWS);
  const lifts = ['Squat','Bench Press','Deadlift'];
  const hasData = lifts.some(l=>thisW[l]||prevW[l]);

  if(!hasData) { el.innerHTML=`<div class="pr-empty">No data yet</div>`; return; }

  el.innerHTML = lifts.map(l => {
    const t = thisW[l], p = prevW[l];
    let delta = '', deltaClass = 'same';
    if(t && p) { const d = t-p; delta = (d>0?'+':'')+d+'kg'; deltaClass = d>0?'up':d<0?'down':'same'; }
    return `<div class="wc-row">
      <div class="wc-lift">${l}</div>
      <div class="wc-vals">
        <div class="wc-last">${p?p+'kg':'—'}</div>
        <div style="color:var(--text3);font-size:11px;">→</div>
        <div class="wc-this">${t?t:'—'}<span style="font-size:11px;color:var(--text3)">${t?' kg':''}</span></div>
        ${delta?`<div class="wc-delta ${deltaClass}">${delta}</div>`:''}
      </div>
    </div>`;
  }).join('');
}


// ── SETTINGS: EXPORT / IMPORT / RESET ────────────────────────
function exportData() {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maxout-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if(data.oneRMs) save1RMData(data.oneRMs);
      if(data.templates) saveTplData(data.templates);
      if(data.sessions) saveSessData(data.sessions);
      if(data.customEx) saveExData(data.customEx);
      if(data.goals) LS.set('mx_goals', data.goals);
      closeModal('mSettings');
      renderAll();
      alert('Data imported successfully.');
    } catch(err) {
      alert('Invalid file. Could not import.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function resetData() {
  const inp = document.getElementById('resetConfirmInp');
  if(!inp || inp.value.trim() !== 'DELETE') {
    inp.style.borderColor = '#cc4444';
    return;
  }
  ['mx_1rm','mx_tpl','mx_sess','mx_ex','mx_goals'].forEach(k => localStorage.removeItem(k));
  closeModal('mSettings');
  inp.value = '';
  renderAll();
}

function renderAll() {
  renderDash();
  renderTpl();
  renderExLib();
  renderHist();
  renderStats();
}

// ── STATS: STREAK + HEATMAP ───────────────────────────────────
function renderStreak(sessions) {
  const dates = [...new Set(sessions.map(s=>s.date))].sort((a,b)=>b.localeCompare(a));
  const dayMs = 86400000;
  let streak = 0;
  let d = new Date(todayISO()+'T12:00:00');
  for(let i=0; i<365; i++) {
    const iso = d.toISOString().split('T')[0];
    if(dates.includes(iso)) { streak++; d.setTime(d.getTime()-dayMs); }
    else if(i===0) { d.setTime(d.getTime()-dayMs); }
    else break;
  }
  let best=0, temp=0, last=null;
  dates.slice().reverse().forEach(iso => {
    if(!last) temp=1;
    else { const diff=(new Date(iso+'T12:00:00')-new Date(last+'T12:00:00'))/dayMs; temp=diff===1?temp+1:1; }
    if(temp>best) best=temp;
    last=iso;
  });
  const sn = document.getElementById('streakNum');
  const sb = document.getElementById('streakBest');
  if(sn) sn.textContent = streak;
  if(sb) sb.textContent = best > streak ? `Best: ${best} days` : '';
}

function renderFreq(sessions) {
  const grid = document.getElementById('freqGrid');
  if(!grid) return;
  grid.innerHTML = '';
  const dayMs = 86400000;
  const trained = new Set(sessions.map(s=>s.date));
  const today = new Date(todayISO()+'T12:00:00');
  for(let i=55; i>=0; i--) {
    const dd = new Date(today.getTime()-i*dayMs);
    const iso = dd.toISOString().split('T')[0];
    const el = document.createElement('div');
    el.className='fday'+(trained.has(iso)?' on':'')+(iso===todayISO()?' today':'');
    grid.appendChild(el);
  }
}

// ── INIT ──────────────────────────────────────────────────────
renderDash();
renderTpl();
renderExLib();
renderHist();
renderStats();
