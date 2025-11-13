/* ==== 테마 (CSS 변수 + body 클래스만 토글) ==== */

function applyTheme(theme){
  const body = document.body;
  body.classList.remove('theme-light','theme-dark');

  if(theme === 'light'){
    body.classList.add('theme-light');
  }else{
    body.classList.add('theme-dark');   // 기본 다크
  }

  const btn = document.getElementById('themeToggle');
  if(btn){
    btn.textContent = (theme === 'light') ? '🌙 다크' : '🌞 라이트';
  }
  localStorage.setItem('theme', theme);
}

// 초기 테마 설정 (localStorage → 시스템 설정 순)
(function themeBoot(){
  const saved = localStorage.getItem('theme');
  if(saved === 'light' || saved === 'dark'){
    applyTheme(saved);
  }else{
    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'dark');   // 기본도 다크로
  }
})();

// 버튼 클릭 시 테마 전환
document.getElementById('themeToggle')?.addEventListener('click', ()=>{
  const isLight = document.body.classList.contains('theme-light');
  applyTheme(isLight ? 'dark' : 'light');
});

/* ==== 로그인/회원가입 ==== */
const ADMIN_ID='admin', ADMIN_PW='1234';
const store={
  get users(){return JSON.parse(localStorage.getItem('users')||'{}')},
  set users(v){localStorage.setItem('users',JSON.stringify(v))},
  get current(){return localStorage.getItem('currentUser')},
  set current(id){id?localStorage.setItem('currentUser',id):localStorage.removeItem('currentUser')},
  get auto(){return localStorage.getItem('autoLogin')==='true'},
  set auto(v){localStorage.setItem('autoLogin',v?'true':'false')}
};
const $=s=>document.querySelector(s);
const stackEl = document.querySelector('.stack');

const view=name=>{
  $("#loginCard").style.display=(name==='login')?'':'none';
  $("#signupCard").style.display=(name==='signup')?'':'none';
  $("#appCard").style.display=(name==='app')?'':'none';
  if(stackEl){
    if(name==='app') stackEl.classList.add('wide'); else stackEl.classList.remove('wide');
  }
};

(function init(){
  const id=store.current;
  if(store.auto&&id){
    if(id===ADMIN_ID||store.users[id]){enterApp(id);return}
  }
  view('login');
})();

function handleLogin(){
  const id=$("#loginId").value.trim(), pw=$("#loginPw").value, users=store.users;
  const err=$("#loginErr"); err.style.display='none';
  if(!id||!pw) return showErr(err,"아이디와 비밀번호를 입력하세요.");
  if(id===ADMIN_ID && pw===ADMIN_PW){
    store.current=ADMIN_ID; store.auto=$("#autoLogin").checked; enterApp(ADMIN_ID); return;
  }
  if(!users[id]) return showErr(err,"존재하지 않는 아이디입니다.");
  if(users[id].pw!==pw) return showErr(err,"비밀번호가 올바르지 않습니다.");
  store.current=id; store.auto=$("#autoLogin").checked; enterApp(id);
}
$("#loginBtn")?.addEventListener('click',e=>{e.preventDefault();handleLogin()});
$("#loginForm")?.addEventListener('submit',e=>{e.preventDefault();handleLogin()});

function enterApp(id){
  $("#welcome").textContent=`${id}님 접속됨`;
  view('app');
}

$("#logoutBtn")?.addEventListener('click',()=>{
  store.current=null; store.auto=false;
  $("#loginId").value=$("#loginPw").value=""; $("#autoLogin").checked=false; view('login');
});

// 회원가입 활성화
const req=["#suId","#suCompany","#suPhone","#suEmail","#suPw","#suPw2"];
function q(sel){ return document.querySelector(sel); }
function valOK(sel){ const el=q(sel); return !!(el && el.value.trim().length>0); }
function enableIfValid(){
  const filled = req.every(valOK);
  const pwOK   = q('#suPw') && q('#suPw2') && (q('#suPw').value === q('#suPw2').value);
  const agreed = q('#agree') ? q('#agree').checked : false;
  const btn = q('#signupBtn'); if(btn) btn.disabled = !(filled && pwOK && agreed);
}
[...req, '#suPw', '#suPw2', '#agree'].forEach(sel=>{
  q(sel)?.addEventListener('input', enableIfValid);
  q(sel)?.addEventListener('change', enableIfValid);
});

$("#signupBtn")?.addEventListener('click',()=>{
  const err=$("#signupErr"); err.style.display='none';
  const id=$("#suId").value.trim(), users=store.users;
  if(!q('#agree')?.checked) return showErr(err,"개인정보 수집·이용에 동의해 주세요.");
  if(id.toLowerCase()===ADMIN_ID) return showErr(err,"'admin'은 사용할 수 없는 아이디입니다.");
  if(!/^[A-Za-z0-9_\-]{4,20}$/.test(id)) return showErr(err,"아이디는 4~20자 영문/숫자/[-,_]만 허용합니다.");
  if(users[id]) return showErr(err,"이미 사용 중인 아이디입니다.");
  if($("#suPw").value !== $("#suPw2").value) return showErr(err,"비밀번호가 일치하지 않습니다.");
  users[id]={
    id,
    company:$("#suCompany").value.trim(),
    phone:$("#suPhone").value.trim(),
    email:$("#suEmail").value.trim(),
    pw:$("#suPw").value,
    createdAt:new Date().toISOString()
  };
  store.users=users; store.current=id; store.auto=false; enterApp(id);
});

function showErr(n,m){ if(!n) return; n.textContent=m; n.style.display='block'; }
$("#toSignup")?.addEventListener('click',()=>view('signup'));
$("#toLogin")?.addEventListener('click',()=>view('login'));

/* 개인정보 동의 모달 */
const consentModal = document.getElementById('consentModal');
document.getElementById('openConsent')?.addEventListener('click', ()=>consentModal.setAttribute('open',''));
document.getElementById('closeConsent')?.addEventListener('click', ()=>consentModal.removeAttribute('open'));
document.getElementById('declineConsent')?.addEventListener('click', ()=>{
  const agree=document.getElementById('agree'); if(agree) agree.checked=false; enableIfValid(); consentModal.removeAttribute('open');
});
document.getElementById('acceptConsent')?.addEventListener('click', ()=>{
  const agree=document.getElementById('agree'); if(agree) agree.checked=true; enableIfValid(); consentModal.removeAttribute('open');
});
consentModal?.addEventListener('click', e=>{ if(e.target===consentModal) consentModal.removeAttribute('open'); });

/* ==== 서브메뉴 유지 ==== */
(function keepSubmenuUntilOutsideClick(){
  const menuItem=document.getElementById('menu-automation'); if(!menuItem) return;
  const submenu=menuItem.querySelector('.submenu');
  const open=()=>menuItem.classList.add('open');
  const close=()=>menuItem.classList.remove('open');
  menuItem.addEventListener('mouseenter',open); submenu?.addEventListener('mouseenter',open);
  menuItem.addEventListener('click',(e)=>{open();e.stopPropagation()});
  submenu?.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',e=>{ if(!menuItem.contains(e.target)) close(); },true);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
  document.addEventListener('touchstart',e=>{ if(!menuItem.contains(e.target)) close(); },{capture:true,passive:true});
})();

/* ==== 공통 유틸 ==== */
async function pickTargetDirectory(){
  if (!('showDirectoryPicker' in window)) return null;
  try{
    return await window.showDirectoryPicker({id:'smt-save',mode:'readwrite',startIn:'documents'});
  }catch(e){
    return null;
  }
}
async function ensureSubfolder(parent,name){
  try{ return await parent.getDirectoryHandle(name,{create:true}); }
  catch(e){ return parent; }
}
async function saveFileToDirectory(dirHandle,file,subFolder){
  try{
    if(subFolder) dirHandle = await ensureSubfolder(dirHandle, subFolder);
    const fh = await dirHandle.getFileHandle(file.name,{create:true});
    const w = await fh.createWritable(); await w.write(await file.arrayBuffer()); await w.close(); return true;
  }catch(e){
    console.error(e); return false;
  }
}
function forceDownload(file,prefix){
  const url=URL.createObjectURL(file); const a=document.createElement('a');
  a.href=url; a.download=`${prefix?prefix+'-':''}${file.name}`;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{
    document.body.removeChild(a);URL.revokeObjectURL(url);
  },0);
}

/* ==== BOM 라이브러리 ==== */
const bomLib = {
  _key:'bomLibrary',
  all(){ return JSON.parse(localStorage.getItem(this._key)||'[]'); },
  save(list){ localStorage.setItem(this._key, JSON.stringify(list)); },
  add(files){
    const list=this.all(); const now=new Date().toISOString();
    for(const f of files){
      list.push({ id:crypto.randomUUID(), name:f.name, size:f.size, type:f.type, savedAt:now, updatedAt:null });
    }
    this.save(list);
  },
  update(id, file){
    const list=this.all(); const i=list.findIndex(x=>x.id===id);
    if(i>-1){
      list[i]={...list[i], name:file.name, size:file.size, type:file.type, updatedAt:new Date().toISOString()};
      this.save(list);
    }
  },
  remove(id){
    const list=this.all().filter(x=>x.id!==id); this.save(list);
  }
};
window.bomLib = bomLib; // 전역 alias

function showBOMDashboard(){
  setBodyHTML(`
    <h2 style="margin:0 0 10px 0">BOM 대시보드</h2>
    <div class="dash">
      <button class="card-btn" id="btnBOMReg">
        <p class="card-title">BOM 등록</p>
        <p class="card-desc">엑셀/CSV 파일을 선택해 저장</p>
      </button>
      <button class="card-btn" id="btnHome">
        <p class="card-title">대시보드</p>
        <p class="card-desc">홈으로 돌아가기</p>
      </button>
    </div>

    <div id="bomLog" class="muted" style="margin-top:12px;"></div>

    <div class="table-wrap">
      <table class="table" id="bomTable">
        <thead><tr><th>파일명</th><th>크기</th><th>등록일</th><th>수정일</th><th>작업</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `);

  document.getElementById('bomLog').textContent = 'BOM 등록 양식에 맞춰서 등록 부탁드리겠습니다!';

  document.getElementById('btnBOMReg').addEventListener('click',()=>{
    document.getElementById('pickBOMFiles').value=''; document.getElementById('pickBOMFiles').click();
  });
  document.getElementById('btnHome').addEventListener('click',()=>{ setBodyHTML(''); });

  renderBOMList();
}

function renderBOMList(){
  const tbody = document.querySelector('#bomTable tbody');
  if(!tbody) return;
  const list = bomLib.all();
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const esc = s => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  tbody.innerHTML = list.map(r=>`
    <tr data-id="${r.id}">
      <td>${esc(r.name)}</td>
      <td>${fmt(r.size)}</td>
      <td>${r.savedAt ? r.savedAt.replace('T',' ').slice(0,19) : '-'}</td>
      <td>${r.updatedAt ? r.updatedAt.replace('T',' ').slice(0,19) : '-'}</td>
      <td>
        <button class="btn-mini act-edit">수정</button>
        <button class="btn-mini act-del">삭제</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="5" class="muted">저장된 BOM 파일이 없습니다.</td></tr>`;

  // 수정
  tbody.querySelectorAll('.act-edit').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      const pick = document.getElementById('pickBOMEdit');
      pick.onchange = e=>{
        const f = e.target.files?.[0]; if(!f) return;
        bomLib.update(id, f);
        renderBOMList();
        logBom(`✏️ 수정 완료: ${f.name}`);
        pick.value='';
      };
      pick.value=''; pick.click();
    });
  });

  // 삭제
  tbody.querySelectorAll('.act-del').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      bomLib.remove(id);
      renderBOMList();
    });
  });
}
function logBom(msg){ const log=document.getElementById('bomLog'); if(log) log.innerHTML=msg; }

/* ==== 좌표데이터 라이브러리 ==== */
const coordLib = {
  _key:'coordLibrary',
  all(){ return JSON.parse(localStorage.getItem(this._key)||'[]'); },
  save(list){ localStorage.setItem(this._key, JSON.stringify(list)); },
  add(files){
    const list=this.all(); const now=new Date().toISOString();
    for(const f of files){
      list.push({ id:crypto.randomUUID(), name:f.name, size:f.size, type:f.type, savedAt:now, updatedAt:null });
    }
    this.save(list);
  },
  update(id, file){
    const list=this.all(); const i=list.findIndex(x=>x.id===id);
    if(i>-1){
      list[i]={...list[i], name:file.name, size:file.size, type:file.type, updatedAt:new Date().toISOString()};
      this.save(list);
    }
  },
  remove(id){
    const list=this.all().filter(x=>x.id!==id); this.save(list);
  }
};
window.coordLib = coordLib; // 전역 alias

function showCoordDashboard(){
  setBodyHTML(`
    <h2 style="margin:0 0 10px 0">좌표데이터 대시보드</h2>
    <div class="dash">
      <button class="card-btn" id="btnCoordReg">
        <p class="card-title">좌표데이터 등록</p>
        <p class="card-desc">엑셀/CSV 파일을 선택해 저장</p>
      </button>
      <button class="card-btn" id="btnHome2">
        <p class="card-title">대시보드</p>
        <p class="card-desc">홈으로 돌아가기</p>
      </button>
    </div>

    <div id="coordLog" class="muted" style="margin-top:10px;"></div>

    <div class="table-wrap">
      <table class="table" id="coordTable">
        <thead><tr><th>파일명</th><th>크기</th><th>등록일</th><th>수정일</th><th>작업</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `);
  document.getElementById('btnCoordReg').addEventListener('click',()=>{
    document.getElementById('pickCoordFiles').value=''; document.getElementById('pickCoordFiles').click();
  });
  document.getElementById('btnHome2').addEventListener('click',()=>{ setBodyHTML(''); });

  renderCoordList();
}

function renderCoordList(){
  const tbody = document.querySelector('#coordTable tbody');
  if(!tbody) return;
  const list = coordLib.all();
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const esc = s => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  tbody.innerHTML = list.map(r=>`
    <tr data-id="${r.id}">
      <td>${esc(r.name)}</td>
      <td>${fmt(r.size)}</td>
      <td>${r.savedAt ? r.savedAt.replace('T',' ').slice(0,19) : '-'}</td>
      <td>${r.updatedAt ? r.updatedAt.replace('T',' ').slice(0,19) : '-'}</td>
      <td>
        <button class="btn-mini act-edit2">수정</button>
        <button class="btn-mini act-del2">삭제</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="5" class="muted">저장된 좌표데이터 파일이 없습니다.</td></tr>`;

  // 수정
  tbody.querySelectorAll('.act-edit2').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      const pick = document.getElementById('pickCoordEdit');
      pick.onchange = e=>{
        const f = e.target.files?.[0]; if(!f) return;
        coordLib.update(id, f);
        renderCoordList();
        pick.value='';
      };
      pick.value=''; pick.click();
    });
  });

  // 삭제
  tbody.querySelectorAll('.act-del2').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      coordLib.remove(id);
      renderCoordList();
    });
  });
}
function logCoord(msg){ const log=document.getElementById('coordLog'); if(log) log.innerHTML=msg; }

/* ==== 파일 선택 핸들러 ==== */
document.getElementById('pickBOMFiles')?.addEventListener('change', async e=>{
  const files = Array.from(e.target.files||[]); if(!files.length) return;
  logBom(`📄 선택: ${files.map(f=>f.name).slice(0,5).join(', ')}${files.length>5?` 외 ${files.length-5}개`:''}<br>저장 폴더를 선택하세요…`);
  let dirHandle = await pickTargetDirectory();
  if(dirHandle){
    let ok=0; for(const f of files){ if(await saveFileToDirectory(dirHandle,f,'BOM')) ok++; }
    logBom(`✅ 저장 완료: ${ok}/${files.length}개 (경로: 선택 폴더/BOM)`);
  }else{
    files.forEach(f=>forceDownload(f,'BOM'));
    logBom(`⬇️ 브라우저 다운로드로 저장했습니다.`);
  }
  bomLib.add(files);
  renderBOMList();
});

document.getElementById('pickCoordFiles')?.addEventListener('change', async e=>{
  const files = Array.from(e.target.files||[]); if(!files.length) return;
  let dirHandle = await pickTargetDirectory();
  if(dirHandle){
    let ok=0; for(const f of files){ if(await saveFileToDirectory(dirHandle,f,'COORDS')) ok++; }
    logCoord(`✅ 저장 완료: ${ok}/${files.length}개 (경로: 선택 폴더/COORDS)`);
  }else{
    files.forEach(f=>forceDownload(f,'COORD'));
    logCoord(`⬇️ 브라우저 다운로드로 저장했습니다.`);
  }
  coordLib.add(files);
  renderCoordList();
});

/* ==== 뷰 유틸 ==== */
const dashboard=document.getElementById('dashboard');
function clearBodyLog(){
  const fr=$("#fileResult"); if(fr) fr.innerHTML='';
  const cc=$("#coordsContainer"); if(cc) cc.innerHTML='';
}
function setBodyHTML(html){
  const body=$("#appBody");
  clearBodyLog();
  dashboard.innerHTML=html||'';
  body.scrollTo({top:0,behavior:'smooth'});
}

/* ==== 결과값 추출 ==== */
const EXTRACT_KEY = 'extractSelection';
const extractState = (()=>{
  try{ return JSON.parse(localStorage.getItem(EXTRACT_KEY)||'{}'); }
  catch{ return {}; }
})();
if(!extractState.bomIds) extractState.bomIds = [];
if(!extractState.coordIds) extractState.coordIds = [];
function saveExtractState(){ localStorage.setItem(EXTRACT_KEY, JSON.stringify(extractState)); }

function showExtractDashboard(){
  const bomCnt = (extractState.bomIds||[]).length;
  const coordCnt = (extractState.coordIds||[]).length;

  setBodyHTML(`
    <h2 style="margin:0 0 10px 0">결과값 추출</h2>
    <div class="dash">
      <button class="card-btn" id="btnPickBOM">
        <p class="card-title">BOM 선택</p>
        <p class="card-desc">등록된 BOM 중에서 선택 (${bomCnt}개 선택됨)</p>
      </button>
      <button class="card-btn" id="btnPickCoord">
        <p class="card-title">좌표데이터 선택</p>
        <p class="card-desc">등록된 좌표데이터 중에서 선택 (${coordCnt}개 선택됨)</p>
      </button>
      <button class="card-btn" id="btnHome3">
        <p class="card-title">대시보드</p>
        <p class="card-desc">홈으로 돌아가기</p>
      </button>
    </div>

    <div class="table-wrap" style="margin-top:12px">
      <table class="table" id="extractTable">
        <thead><tr><th>구분</th><th>파일명</th><th>크기</th><th>등록/수정일</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `);

  renderExtractSelectedTable();

  document.getElementById('btnPickBOM')?.addEventListener('click', ()=> openSelectModal('bom'));
  document.getElementById('btnPickCoord')?.addEventListener('click', ()=> openSelectModal('coord'));
  document.getElementById('btnHome3')?.addEventListener('click', ()=> setBodyHTML(''));
}

function renderExtractSelectedTable(){
  const tbody = document.querySelector('#extractTable tbody'); if(!tbody) return;
  const listB = (window.bomLib.all()||[]).filter(r=>extractState.bomIds.includes(r.id)).map(x=>({type:'BOM',...x}));
  const listC = (window.coordLib.all()||[]).filter(r=>extractState.coordIds.includes(r.id)).map(x=>({type:'COORD',...x}));
  const rows = [...listB, ...listC];
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const dt = r => r.updatedAt ? r.updatedAt.replace('T',' ').slice(0,19)
                              : (r.savedAt? r.savedAt.replace('T',' ').slice(0,19) : '-');
  const esc = s => String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  tbody.innerHTML = rows.length ? rows.map(r=>`
    <tr>
      <td>${r.type}</td>
      <td>${esc(r.name)}</td>
      <td>${fmt(r.size)}</td>
      <td>${dt(r)}</td>
    </tr>
  `).join('') : `<tr><td colspan="4" class="muted">선택된 항목이 없습니다. 상단에서 선택해 주세요.</td></tr>`;
}

/* === 선택 모달 === */
const selectModal=document.getElementById('selectModal');
const selectTitle=document.getElementById('selectTitle');
const selectSearch=document.getElementById('selectSearch');
const selectClose=document.getElementById('selectClose');
const selectCancel=document.getElementById('selectCancel');
const selectApply=document.getElementById('selectApply');
const selectEmpty=document.getElementById('selectEmpty');
const selectTools=document.getElementById('selectTools');
const selectCount=document.getElementById('selectCount');
const btnSelectAll=document.getElementById('btnSelectAll');
const btnSelectNone=document.getElementById('btnSelectNone');
const selectTable=document.getElementById('selectTable');

function getLibAll(type){ return type==='bom' ? window.bomLib.all() : window.coordLib.all(); }

let currentSelectType=null, currentRows=[], checkboxCache=new Map();

function openSelectModal(type){
  currentSelectType = type;
  selectTitle.textContent = (type==='bom') ? 'BOM 선택' : '좌표데이터 선택';

  const raw = getLibAll(type);
  const selectedIds = (type==='bom') ? (extractState.bomIds||[]) : (extractState.coordIds||[]);
  checkboxCache = new Map(raw.map(r=>[r.id, selectedIds.includes(r.id)]));

  renderSelectTable(raw);

  selectModal.setAttribute('open','');
  selectModal.style.display='flex';
}
function closeSelectModal(){ selectModal.removeAttribute('open'); selectModal.style.display='none'; }
window.openSelectModal = openSelectModal; // 메뉴 핸들러에서 호출

selectClose.addEventListener('click', closeSelectModal);
selectCancel.addEventListener('click', closeSelectModal);
selectModal.addEventListener('click', e=>{ if(e.target===selectModal) closeSelectModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && selectModal.hasAttribute('open')) closeSelectModal(); });

selectApply.addEventListener('click', ()=>{
  const ids = [...checkboxCache.entries()].filter(([id,v])=>v).map(([id])=>id);
  if(currentSelectType==='bom') extractState.bomIds = ids;
  else extractState.coordIds = ids;
  saveExtractState();
  closeSelectModal();
  showExtractDashboard();
});

btnSelectAll.addEventListener('click', ()=>{
  currentRows.forEach(r=>checkboxCache.set(r.id, true));
  syncCheckboxesFromCache(); updateSelectCount();
});
btnSelectNone.addEventListener('click', ()=>{
  currentRows.forEach(r=>checkboxCache.set(r.id, false));
  syncCheckboxesFromCache(); updateSelectCount();
});
selectSearch.addEventListener('input', ()=>{
  const term = (selectSearch.value||'').trim().toLowerCase();
  const src = getLibAll(currentSelectType);
  const filtered = term ? src.filter(r=> (r.name||'').toLowerCase().includes(term) ) : src;
  renderSelectTable(filtered);
});

function renderSelectTable(list){
  currentRows = list.slice();
  const tbody = selectTable.querySelector('tbody');
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const dt = r => r.updatedAt ? r.updatedAt.replace('T',' ').slice(0,19)
                              : (r.savedAt? r.savedAt.replace('T',' ').slice(0,19) : '-');
  const esc = s => String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  selectEmpty.style.display = list.length? 'none':'block';
  selectTools.style.display = list.length? 'flex':'none';

  tbody.innerHTML = list.map(r=>{
    const checked = !!checkboxCache.get(r.id);
    return `
      <tr data-id="${r.id}">
        <td><input type="checkbox" class="selRow" ${checked?'checked':''}></td>
        <td>${esc(r.name)}</td>
        <td>${fmt(r.size)}</td>
        <td>${dt(r)}</td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.selRow').forEach((cb, idx)=>{
    const id = list[idx].id;
    cb.addEventListener('change', ()=>{
      checkboxCache.set(id, cb.checked); updateSelectCount();
    });
  });

  updateSelectCount();
}
function syncCheckboxesFromCache(){
  const trs = [...selectTable.querySelectorAll('tbody tr')];
  trs.forEach(tr=>{
    const id = tr.getAttribute('data-id');
    const cb = tr.querySelector('.selRow');
    if(cb && checkboxCache.has(id)) cb.checked = !!checkboxCache.get(id);
  });
}
function updateSelectCount(){
  const total = currentRows.length;
  const checked = [...checkboxCache.entries()].filter(([id,v])=> v && currentRows.find(r=>r.id===id)).length;
  selectCount.textContent = `${checked}/${total}개 선택`;
}

/* 메뉴 연결 */
document.getElementById('mn-bom')?.addEventListener('click',e=>{e.preventDefault();showBOMDashboard()});
document.getElementById('mn-coords')?.addEventListener('click',e=>{e.preventDefault();showCoordDashboard()});
document.getElementById('mn-extract')?.addEventListener('click',e=>{e.preventDefault();showExtractDashboard()});
