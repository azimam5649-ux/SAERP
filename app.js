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
const store = {
  get current(){return localStorage.getItem('currentUser')},
  set current(id){id?localStorage.setItem('currentUser',id):localStorage.removeItem('currentUser')},
  get auto(){return localStorage.getItem('autoLogin')==='true'},
  set auto(v){localStorage.setItem('autoLogin',v?'true':'false')}
};

/* ==== 로그인/회원가입 (MariaDB 연동) ==== */

const $ = s => document.querySelector(s);
const stackEl = document.querySelector('.stack');

let currentUser = null;   // 메모리에만 현재 로그인 사용자 저장

const view = name => {
  $("#loginCard").style.display  = (name === 'login')  ? '' : 'none';
  $("#signupCard").style.display = (name === 'signup') ? '' : 'none';
  $("#appCard").style.display    = (name === 'app')    ? '' : 'none';
  if (stackEl) {
    if (name === 'app') stackEl.classList.add('wide');
    else stackEl.classList.remove('wide');
  }
};

// 초기 진입: 로그인 화면
(function init(){
  view('login');
})();

// ----- 로그인 -----
async function handleLogin(){
  const id = $("#loginId").value.trim();
  const pw = $("#loginPw").value;
  const err = $("#loginErr");
  err.style.display = 'none';

  if(!id || !pw){
    return showErr(err,"아이디와 비밀번호를 입력하세요.");
  }

  try {
    const res = await fetch('login.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id, pw })
    });
    const data = await res.json();

    if(!data.ok){
      return showErr(err, data.msg || "로그인에 실패했습니다.");
    }

    store.current = data.userid;
    store.auto    = $("#autoLogin").checked;
    enterApp(data.userid);
  } catch (e) {
    console.error(e);
    showErr(err,"서버 통신 오류가 발생했습니다.");
  }
}

$("#loginBtn")?.addEventListener('click',e=>{e.preventDefault();handleLogin()});
$("#loginForm")?.addEventListener('submit',e=>{e.preventDefault();handleLogin()});

$("#logoutBtn")?.addEventListener('click', () => {
  currentUser = null;
  $("#loginId").value = "";
  $("#loginPw").value = "";
  $("#autoLogin").checked = false;
  view('login');
});

// ----- 회원가입 입력 유효성 & 버튼 활성 -----
const req = ["#suId","#suCompany","#suPhone","#suEmail","#suPw","#suPw2"];
function q(sel){ return document.querySelector(sel); }
function valOK(sel){ const el = q(sel); return !!(el && el.value.trim().length > 0); }
function enableIfValid(){
  const filled = req.every(valOK);
  const pwOK   = q('#suPw') && q('#suPw2') && (q('#suPw').value === q('#suPw2').value);
  const agreed = q('#agree') ? q('#agree').checked : false;
  const btn = q('#signupBtn'); 
  if (btn) btn.disabled = !(filled && pwOK && agreed);
}
[...req, '#suPw', '#suPw2', '#agree'].forEach(sel => {
  q(sel)?.addEventListener('input',  enableIfValid);
  q(sel)?.addEventListener('change', enableIfValid);
});

// ----- 회원가입: MariaDB users 테이블에 저장 -----
$("#signupBtn")?.addEventListener('click', async () => {
  const err = $("#signupErr");
  err.style.display = 'none';

  const id       = $("#suId").value.trim();
  const company  = $("#suCompany").value.trim();
  const phone    = $("#suPhone").value.trim();
  const email    = $("#suEmail").value.trim();
  const pw       = $("#suPw").value;
  const pw2      = $("#suPw2").value;

  if(!$("#agree")?.checked){
    return showErr(err,"개인정보 수집·이용에 동의해 주세요.");
  }
  if(pw !== pw2){
    return showErr(err,"비밀번호가 일치하지 않습니다.");
  }

  try {
    const res = await fetch('signup.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id, company, phone, email, pw })
    });
    const data = await res.json();

    if(!data.ok){
      return showErr(err, data.msg || "회원가입에 실패했습니다.");
    }

    alert("회원가입이 완료되었습니다. 이제 로그인해 주세요.");
    view('login');
  } catch (e) {
    console.error(e);
    showErr(err,"서버 통신 오류가 발생했습니다.");
  }
});

function showErr(n, m){
  if (!n) return;
  n.textContent = m;
  n.style.display = 'block';
}

$("#toSignup")?.addEventListener('click', () => view('signup'));
$("#toLogin")?.addEventListener('click',  () => view('login'));

/* 개인정보 동의 모달 */
const consentModal = document.getElementById('consentModal');
document.getElementById('openConsent')?.addEventListener('click', ()=>consentModal.setAttribute('open',''));
document.getElementById('closeConsent')?.addEventListener('click', ()=>consentModal.removeAttribute('open'));
document.getElementById('declineConsent')?.addEventListener('click', ()=>{
  const agree=document.getElementById('agree'); if(agree) agree.checked=false;
  enableIfValid(); consentModal.removeAttribute('open');
});
document.getElementById('acceptConsent')?.addEventListener('click', ()=>{
  const agree=document.getElementById('agree'); if(agree) agree.checked=true;
  enableIfValid(); consentModal.removeAttribute('open');
});
consentModal?.addEventListener('click', e=>{
  if(e.target===consentModal) consentModal.removeAttribute('open');
});

/* ==== 서브메뉴 유지 ==== */
(function keepSubmenuUntilOutsideClick(){
  const menuItem=document.getElementById('menu-automation'); 
  if(!menuItem) return;
  const submenu=menuItem.querySelector('.submenu');

  const open = ()=>menuItem.classList.add('open');
  const close=()=>menuItem.classList.remove('open');

  menuItem.addEventListener('mouseenter', open);
  submenu?.addEventListener('mouseenter', open);

  menuItem.addEventListener('click',(e)=>{open();e.stopPropagation()});
  submenu?.addEventListener('click',e=>e.stopPropagation());

  document.addEventListener('click',e=>{
    if(!menuItem.contains(e.target)) close();
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') close();
  });

  document.addEventListener('touchstart',e=>{
    if(!menuItem.contains(e.target)) close();
  },{capture:true,passive:true});
})();

/* ==== 공통 유틸 ==== */
/** ⛔ 폴더 선택 기능 포기: 항상 null 반환 */
async function pickTargetDirectory(){
  return null;
}

async function ensureSubfolder(parent,name){
  try{
    return await parent.getDirectoryHandle(name,{create:true});
  }
  catch(e){
    return parent;
  }
}

async function saveFileToDirectory(dirHandle,file,subFolder){
  try{
    const fh = await dirHandle.getFileHandle(file.name,{create:true});
    const w = await fh.createWritable();
    await w.write(await file.arrayBuffer());
    await w.close();
    return true;
  }catch(e){
    console.error(e);
    return false;
  }
}

function forceDownload(file,prefix){
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');
  a.href=url;
  a.download=`${prefix?prefix+'-':''}${file.name}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },0);
}

/* ==== BOM 라이브러리 ==== */
const bomLib = {
  _key:'bomLibrary',
  all(){
    return JSON.parse(localStorage.getItem(this._key)||'[]');
  },
  save(list){
    localStorage.setItem(this._key, JSON.stringify(list));
  },
  add(files){
    const list=this.all(); 
    const now=new Date().toISOString();
    for(const f of files){
      list.push({
        id:crypto.randomUUID(),
        name:f.name,
        size:f.size,
        type:f.type,
        savedAt:now,
        updatedAt:null
      });
    }
    this.save(list);
  },
  update(id, file){
    const list=this.all();
    const i=list.findIndex(x=>x.id===id);
    if(i>-1){
      list[i]={
        ...list[i],
        name:file.name,
        size:file.size,
        type:file.type,
        updatedAt:new Date().toISOString()
      };
      this.save(list);
    }
  },
  remove(id){
    const list=this.all().filter(x=>x.id!==id);
    this.save(list);
  }
};
window.bomLib = bomLib;

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

    <div style="margin:8px 0; text-align:right;">
      <button class="btn-mini" id="btnBOMDeleteSelected">선택 삭제</button>
      <button class="btn-mini" id="btnBOMClear">전체 삭제</button>
    </div>

    <div class="table-wrap">
      <table class="table" id="bomTable">
        <thead>
          <tr>
            <th style="width:40px;"><input type="checkbox" id="bomCheckAll"></th>
            <th>파일명</th>
            <th>크기</th>
            <th>등록일</th>
            <th>수정일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `);

  document.getElementById('bomLog').textContent =
    'BOM 등록 양식에 맞춰서 등록 부탁드리겠습니다!';

  document.getElementById('btnBOMReg').addEventListener('click',()=>{
    document.getElementById('pickBOMFiles').value='';
    document.getElementById('pickBOMFiles').click();
  });

  document.getElementById('btnHome').addEventListener('click',()=>{
    setBodyHTML('');
  });

  document.getElementById('btnBOMClear').addEventListener('click', ()=>{
    if(!confirm('BOM 등록 목록을 모두 삭제할까요?')) return;
    bomLib.save([]);
    renderBOMList();
  });

  document.getElementById('btnBOMDeleteSelected').addEventListener('click', ()=>{
    const tbody = document.querySelector('#bomTable tbody');
    const checked = [...tbody.querySelectorAll('.bom-row-check:checked')];
    if(!checked.length){
      alert('삭제할 항목을 선택하세요.');
      return;
    }

    if(!confirm(`${checked.length}개 항목을 삭제할까요?`)) return;

    const ids = checked.map(cb => cb.closest('tr').dataset.id);
    const left = bomLib.all().filter(r => !ids.includes(r.id));
    bomLib.save(left);
    renderBOMList();
  });

  renderBOMList();
}

function renderBOMList(){
  const tbody = document.querySelector('#bomTable tbody');
  if(!tbody) return;

  const list = bomLib.all();
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const esc = s => 
    s.replace(/[&<>"]/g,
      m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  tbody.innerHTML = list.length
    ? list.map(r=>`
        <tr data-id="${r.id}">
          <td><input type="checkbox" class="bom-row-check"></td>
          <td>${esc(r.name)}</td>
          <td>${fmt(r.size)}</td>
          <td>${r.savedAt ? r.savedAt.replace('T',' ').slice(0,19) : '-'}</td>
          <td>${r.updatedAt ? r.updatedAt.replace('T',' ').slice(0,19) : '-'}</td>
          <td>
            <button class="btn-mini act-edit">수정</button>
            <button class="btn-mini act-del">삭제</button>
          </td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="6" class="muted">저장된 BOM 파일이 없습니다.</td>
      </tr>
    `;

  // 수정
  tbody.querySelectorAll('.act-edit').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      const pick = document.getElementById('pickBOMEdit');

      pick.onchange = e=>{
        const f = e.target.files?.[0];
        if(!f) return;
        bomLib.update(id, f);
        renderBOMList();
        pick.value='';
      };

      pick.value='';
      pick.click();
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

  // 전체 선택
  const checkAll = document.getElementById('bomCheckAll');
  if(checkAll){
    checkAll.checked = false;
    checkAll.addEventListener('change', ()=>{
      tbody.querySelectorAll('.bom-row-check').forEach(cb=>{
        cb.checked = checkAll.checked;
      });
    });
  }
}

function logBom(msg){
  const log=document.getElementById('bomLog');
  if(log) log.innerHTML=msg;
}

/* ==== 좌표데이터 라이브러리 ==== */
const coordLib = {
  _key:'coordLibrary',
  all(){
    return JSON.parse(localStorage.getItem(this._key)||'[]');
  },
  save(list){
    localStorage.setItem(this._key, JSON.stringify(list));
  },
  add(files){
    const list=this.all();
    const now=new Date().toISOString();
    for(const f of files){
      list.push({
        id:crypto.randomUUID(),
        name:f.name,
        size:f.size,
        type:f.type,
        savedAt:now,
        updatedAt:null
      });
    }
    this.save(list);
  },
  update(id, file){
    const list=this.all();
    const i=list.findIndex(x=>x.id===id);
    if(i>-1){
      list[i] = {
        ...list[i],
        name:file.name,
        size:file.size,
        type:file.type,
        updatedAt:new Date().toISOString()
      };
      this.save(list);
    }
  },
  remove(id){
    const list=this.all().filter(x=>x.id!==id);
    this.save(list);
  }
};
window.coordLib = coordLib;

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

    <div style="margin:8px 0; text-align:right;">
      <button class="btn-mini" id="btnCoordDeleteSelected">선택 삭제</button>
      <button class="btn-mini" id="btnCoordClear">전체 삭제</button>
    </div>

    <div class="table-wrap">
      <table class="table" id="coordTable">
        <thead>
          <tr>
            <th style="width:40px;"><input type="checkbox" id="coordCheckAll"></th>
            <th>파일명</th>
            <th>크기</th>
            <th>등록일</th>
            <th>수정일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `);

  document.getElementById('btnCoordReg').addEventListener('click',()=>{
    document.getElementById('pickCoordFiles').value='';
    document.getElementById('pickCoordFiles').click();
  });

  document.getElementById('btnHome2').addEventListener('click',()=>{
    setBodyHTML('');
  });

  // 전체 삭제
  document.getElementById('btnCoordClear').addEventListener('click', ()=>{
    if(!confirm('좌표데이터 등록 목록을 모두 삭제할까요?')) return;
    coordLib.save([]);
    renderCoordList();
  });

  // 선택 삭제
  document.getElementById('btnCoordDeleteSelected').addEventListener('click', ()=>{
    const tbody = document.querySelector('#coordTable tbody');
    const checked = [...tbody.querySelectorAll('.coord-row-check:checked')];

    if(!checked.length){
      alert('삭제할 항목을 선택하세요.');
      return;
    }

    if(!confirm(`${checked.length}개 항목을 삭제할까요?`)) return;

    const ids = checked.map(cb => cb.closest('tr').dataset.id);
    const left = coordLib.all().filter(r => !ids.includes(r.id));
    coordLib.save(left);
    renderCoordList();
  });

  renderCoordList();
}

function renderCoordList(){
  const tbody = document.querySelector('#coordTable tbody');
  if(!tbody) return;

  const list = coordLib.all();
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const esc = s =>
    s.replace(/[&<>"]/g,
      m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  tbody.innerHTML = list.length
    ? list.map(r=>`
        <tr data-id="${r.id}">
          <td><input type="checkbox" class="coord-row-check"></td>
          <td>${esc(r.name)}</td>
          <td>${fmt(r.size)}</td>
          <td>${r.savedAt ? r.savedAt.replace('T',' ').slice(0,19) : '-'}</td>
          <td>${r.updatedAt ? r.updatedAt.replace('T',' ').slice(0,19) : '-'}</td>
          <td>
            <button class="btn-mini act-edit2">수정</button>
            <button class="btn-mini act-del2">삭제</button>
          </td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="6" class="muted">저장된 좌표데이터 파일이 없습니다.</td>
      </tr>
    `;

  tbody.querySelectorAll('.act-edit2').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      const pick = document.getElementById('pickCoordEdit');

      pick.onchange = e=>{
        const f = e.target.files?.[0];
        if(!f) return;
        coordLib.update(id, f);
        renderCoordList();
        pick.value='';
      };

      pick.value='';
      pick.click();
    });
  });

  tbody.querySelectorAll('.act-del2').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      coordLib.remove(id);
      renderCoordList();
    });
  });

  const checkAll = document.getElementById('coordCheckAll');
  if(checkAll){
    checkAll.checked = false;
    checkAll.addEventListener('change', ()=>{
      tbody.querySelectorAll('.coord-row-check').forEach(cb=>{
        cb.checked = checkAll.checked;
      });
    });
  }
}

function logCoord(msg){
  const log=document.getElementById('coordLog');
  if(log) log.innerHTML=msg;
}

/* ==== 결과값 추출 전용 라이브러리 ==== */
const extractLib = {
  _key: 'extractLibrary',

  all(){
    return JSON.parse(localStorage.getItem(this._key) || '[]');
  },

  save(list){
    localStorage.setItem(this._key, JSON.stringify(list));
  },

  clear(){
    this.save([]);
  },

  setFromSelection(type, ids){
    const kind = (type === 'bom') ? 'BOM' : 'COORD';
    const src  = getLibAll(type);

    const current = this.all();
    const others  = current.filter(x => x.kind !== kind);

    const now = new Date().toISOString();
    const selected = src
      .filter(r => ids.includes(r.id))
      .map(r => ({
        ...r,
        kind,
        selectedAt: now
      }));

    this.save([...others, ...selected]);
  },

  remove(id, kind){
    const list = this.all().filter(x => !(x.id === id && x.kind === kind));
    this.save(list);
  },

  add(meta){
    const list = this.all();
    list.push(meta);
    this.save(list);
  }
};
window.extractLib = extractLib;

/* ==== 파일 선택 핸들러 (BOM, Coord) ==== */
document.getElementById('pickBOMFiles')?.addEventListener('change', async e=>{
  const files = Array.from(e.target.files||[]);
  if(!files.length) return;

  logBom(`📄 선택: ${files.map(f=>f.name).slice(0,5).join(', ')}${files.length>5?` 외 ${files.length-5}개`:''}<br>브라우저 다운로드 폴더에 저장합니다…`);

  files.forEach(f=>forceDownload(f,'BOM'));
  logBom(`⬇️ 브라우저 다운로드 폴더(기본 위치)에 저장했습니다.`);

  const list = bomLib.all();
  const now  = new Date().toISOString();

  for (const f of files) {
    try {
      const data = await f.arrayBuffer();
      const wb   = XLSX.read(data, { type: 'array' });

      if (!window.SMTExtract || !SMTExtract.parseBOMWorkbook) {
        alert('SMTExtract.parseBOMWorkbook 함수를 찾을 수 없습니다.');
        break;
      }

      const parsedBOM = SMTExtract.parseBOMWorkbook(wb);

      list.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
        savedAt: now,
        updatedAt: null,
        parsedBOM
      });

    } catch (err) {
      console.error('BOM 파싱 실패:', f.name, err);
      alert('BOM 파싱 중 오류가 발생했습니다.\n파일명: ' + f.name);
    }
  }

  bomLib.save(list);
  renderBOMList();
});

document.getElementById('pickCoordFiles')?.addEventListener('change', async e=>{
  const files = Array.from(e.target.files||[]);
  if(!files.length) return;

  logCoord(`📄 선택: ${files.map(f=>f.name).slice(0,5).join(', ')}${files.length>5?` 외 ${files.length-5}개`:''}<br>브라우저 다운로드 폴더에 저장합니다…`);

  files.forEach(f=>forceDownload(f,'COORD'));
  logCoord(`⬇️ 브라우저 다운로드 폴더(기본 위치)에 저장했습니다.`);

  const list = coordLib.all();
  const now  = new Date().toISOString();

  for (const f of files) {
    try {
      const data = await f.arrayBuffer();
      const wb   = XLSX.read(data, { type: 'array' });

      if (!window.SMTExtract || !SMTExtract.parseCoordWorkbook) {
        alert('SMTExtract.parseCoordWorkbook 함수를 찾을 수 없습니다.');
        break;
      }

      const coordMap = SMTExtract.parseCoordWorkbook(wb, { fileName: f.name });
      const coordObj = Object.fromEntries(coordMap);

      list.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
        savedAt: now,
        updatedAt: null,
        coordMap: coordObj
      });

    } catch (err) {
      console.error('좌표 파싱 실패:', f.name, err);
      alert('좌표 파싱 중 오류가 발생했습니다.\n파일명: ' + f.name);
    }
  }

  coordLib.save(list);
  renderCoordList();
});

/* ==== 뷰 유틸 ==== */
const dashboard=document.getElementById('dashboard');

function clearBodyLog(){
  const fr=$("#fileResult");
  if(fr) fr.innerHTML='';

  const cc=$("#coordsContainer");
  if(cc) cc.innerHTML='';
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

/* ============================================================
   🟩 Part 4 — NAS 저장 기능 추가
   ------------------------------------------------------------
   app.js 맨 아래에 그대로 붙여 넣으면 됨
============================================================ */

/**
 * 📌 1) BOM 저장 — NAS로 업로드
 *     POST /saerp/api/upload_bom.php
 */
async function saveBOMToServer(file){
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/saerp/api/upload_bom.php", {
        method: "POST",
        body: fd
    });

    return await res.json();
}

/**
 * 📌 2) 좌표데이터 저장 — NAS로 업로드
 *     POST /saerp/api/upload_coord.php
 */
async function saveCoordToServer(file){
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/saerp/api/upload_coord.php", {
        method: "POST",
        body: fd
    });

    return await res.json();
}

/**
 * 📌 3) 결과값 엑셀 저장 — NAS로 저장
 *     blob + 파일명 전달
 *     POST /saerp/api/save_extract_excel.php
 */
async function saveExtractExcelToServer(blob, filename){
    const fd = new FormData();
    fd.append("file", blob, filename);

    const res = await fetch("/saerp/api/save_extract_excel.php", {
        method: "POST",
        body: fd
    });

    return await res.json();
}

/**
 * 📌 4) 결과값 TXT 저장 — NAS로 저장
 *     문자열(txt 내용) + 파일명 전달
 *     POST /saerp/api/save_extract_txt.php
 */
async function saveExtractTxtToServer(textData, filename){
    const fd = new FormData();
    const blob = new Blob([textData], { type: "text/plain" });
    fd.append("file", blob, filename);

    const res = await fetch("/saerp/api/save_extract_txt.php", {
        method: "POST",
        body: fd
    });

    return await res.json();
}

/* ============================================================
   🟩 Part 4 끝
============================================================ */