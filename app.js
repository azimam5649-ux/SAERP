// crypto.randomUUID 폴리필 (구형 브라우저용)
if (!window.crypto) window.crypto = {};
if (typeof window.crypto.randomUUID !== 'function') {
  window.crypto.randomUUID = function () {
    // 간단한 UUID v4 형태
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

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

/* ================================
   🔥 API BASE 주소 자동 설정 (최종버전)
   ================================ */

const HOST = window.location.hostname;
let API_BASE;

if (HOST === '172.30.1.42' || HOST === 'localhost' || HOST === '127.0.0.1') {
    // 내부망
    API_BASE = 'http://172.30.1.42/saerp/api';
} else {
    // ★ 수정할 부분: 뒤에 '/api'를 붙여주세요!
    API_BASE = 'https://saerp.synology.me/api'; 
}
console.log("🔧 API_BASE =", API_BASE);

/* ========= 파일 목록 불러오기 ========= */
async function listBOM() {
    const res = await fetch(`${API_BASE}/list_bom.php`);
    return await res.json();
}


const ADMIN_ID = 'admin', ADMIN_PW = '1234';

const store={
  get users(){return JSON.parse(localStorage.getItem('users')||'{}')},
  set users(v){localStorage.setItem('users',JSON.stringify(v))},
  get current(){return localStorage.getItem('currentUser')},
  set current(id){id?localStorage.setItem('currentUser',id):localStorage.removeItem('currentUser')},
  get auto(){return localStorage.getItem('autoLogin')==='true'},
  set auto(v){localStorage.setItem('autoLogin',v?'true':'false')}
};
const $ = s => document.querySelector(s);
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
  const btn = q('#signupBtn');
  if(btn) btn.disabled = !(filled && pwOK && agreed);
}

[...req, '#suPw', '#suPw2', '#agree'].forEach(sel=>{
  q(sel)?.addEventListener('input', enableIfValid);
  q(sel)?.addEventListener('change', enableIfValid);
});

function showErr(n,m){ if(!n) return; n.textContent=m; n.style.display='block'; }

$("#signupBtn")?.addEventListener('click', async ()=>{
  const err = $("#signupErr"); 
  err.style.display='none';

  const id       = $("#suId").value.trim();
  const company  = $("#suCompany").value.trim();
  const phone    = $("#suPhone").value.trim();
  const email    = $("#suEmail").value.trim();
  const pw       = $("#suPw").value;
  const pw2      = $("#suPw2").value;

  if(!q('#agree')?.checked) return showErr(err,"개인정보 수집·이용에 동의해 주세요.");
  if(id.toLowerCase()===ADMIN_ID) return showErr(err,"'admin'은 사용할 수 없는 아이디입니다.");
  if(!/^[A-Za-z0-9_\-]{4,20}$/.test(id)) return showErr(err,"아이디는 4~20자 영문/숫자/[-,_]만 허용합니다.");
  if(pw !== pw2) return showErr(err,"비밀번호가 일치하지 않습니다.");

  try{
    const res = await fetch(`${API_BASE}/signup.php`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, company, phone, email, pw })
    });

    const data = await res.json();
    if(!res.ok || !data.success){
      return showErr(err, data.message || '회원가입에 실패했습니다.');
    }

    alert('회원가입이 완료되었습니다. 이제 로그인해 주세요.');
    $("#loginId").value = id;
    view('login');

  }catch(e){
    console.error(e);
    showErr(err,"서버와 통신할 수 없습니다.");
  }
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

// (브라우저 폴더 선택은 포기 - 항상 null)
async function pickTargetDirectory(){ return null; }

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

function forceDownload(file, prefix){
  const url = URL.createObjectURL(file);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = `${prefix ? prefix + '-' : ''}${file.name}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },0);
}

// 👇 반드시 함수 밖에 따로 선언해줘야 함
async function saveBlobWithPicker(blob, suggestedName){
  // 브라우저가 지원하지 않으면 기존 다운로드 fallback
  if (!window.showSaveFilePicker) {
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = suggestedName || 'result.dat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('이 브라우저는 저장 경로 선택 기능을 지원하지 않아 기본 다운로드로 저장했습니다.');
    return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggestedName || 'result.xlsx',
      types: [{
        description: 'Excel 파일',
        accept: {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        }
      }]
    });

    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('saveBlobWithPicker 오류:', e);
      alert('파일 저장 중 오류가 발생했습니다.');
    }
  }
}

/* ==== BOM 라이브러리 (브라우저 메타 저장) ==== */
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

/* ==== 결과값 추출 전용 라이브러리 (BOM/좌표와 분리) ==== */
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

// ==== NAS 목록 재로딩 (좌표) ====
// - 서버(list_coord.php)에서 받아온 메타데이터와
//   브라우저에 저장된 좌표 목록을 name 기준으로 병합해서
//   coordMap 은 절대 지우지 않는다.
async function reloadCoordFromServer() {
  try {
    // const res = await fetch(`${API_API}/list_coord.php`, { cache: 'no-store' }); // 기존
    const res  = await fetch(`${API_API}/list_files.php?type=coord`, { cache: 'no-store' }); // 👈 수정
    const data = await res.json();

    if (!res.ok || !data.success) {
      console.warn('좌표 목록 로드 실패:', data.message || res.statusText);
      return;
    }

    if (Array.isArray(data.files)) {
      // 1) 현재 브라우저에 저장된 좌표 목록 (coordMap 포함)
      const current = coordLib.all();              // [{ id, name, coordMap, ... }]
      const byName  = new Map(current.map(x => [x.name, x]));
      const merged  = [];

      // 2) 서버에서 온 파일 리스트와 병합
      for (const srv of data.files) {
        const existing = byName.get(srv.name);

        if (existing) {
          // 기존 coordMap 등은 유지, 메타 정보만 갱신
          merged.push({
            ...existing,
            ...srv,          // size, savedAt 등만 최신값으로 덮어씀
          });
          byName.delete(srv.name);
        } else {
          // 브라우저엔 없고 서버에만 있는 새 파일
          merged.push(srv);
        }
      }

      // 3) 서버에는 없고 브라우저에만 남은 항목도 보존
      for (const rest of byName.values()) {
        merged.push(rest);
      }

      coordLib.save(merged);
      renderCoordList?.();
    }
  } catch (e) {
    console.error('좌표 목록 로딩 오류:', e);
  }
}

/* ==== 파일 선택 핸들러 (브라우저에서 업로드할 때) ==== */

// BOM 파일 선택
// ==== BOM 파일 선택 (브라우저에서 업로드할 때) ====
document.getElementById('pickBOMFiles')?.addEventListener('change', async e=>{
  const files = Array.from(e.target.files||[]); 
  if(!files.length) return;

  logBom(`📄 선택: ${files.map(f=>f.name).slice(0,5).join(', ')}${files.length>5?` 외 ${files.length-5}개`:''}<br>NAS로 업로드합니다…`);

  // 1) NAS로 업로드
  for (const f of files){
    const fd = new FormData();
    fd.append('bomFile', f, f.name);   // ← 여기 이름이 php 와 동일해야 함

    try{
      const res  = await fetch(`${API_BASE}/upload_bom.php`, {
        method: 'POST',
        body  : fd
      });
      const data = await res.json().catch(()=>null);

      if (!res.ok || !data || !data.success){
        logBom(`❌ NAS 업로드 실패: ${f.name} (${data?.message || res.statusText})`);
      }else{
        logBom(`✅ NAS 업로드 성공: ${f.name}`);
      }
    }catch(err){
      console.error('BOM 업로드 오류:', err);
      logBom(`❌ NAS 업로드 중 오류 발생: ${f.name}`);
    }
  }

  // 2) 브라우저 측 파싱 + localStorage 저장 (기존 기능 유지)
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

  // NAS 목록도 다시 읽어오기 (선택사항이지만 있으면 더 좋음)
  await reloadBOMFromServer();
});

// ==== 좌표데이터 파일 선택 (브라우저에서 업로드할 때) ====
document.getElementById('pickCoordFiles')?.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const log = window.logCoord || window.logBom || console.log;
  log(`📄 선택된 좌표파일: ${files.map(f => f.name).join(', ')}<br>NAS로 업로드 + 파싱합니다…`);

  // 1) NAS로 업로드
  for (const file of files) {
    const fd = new FormData();
    fd.append('coordFile', file, file.name);

    try {
      const res  = await fetch(`${API_BASE}/upload_coord.php`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.success) {
        log(`❌ NAS 업로드 실패: ${file.name} (${data?.message || res.statusText})`);
      } else {
        log(`✅ NAS 업로드 성공: ${file.name}`);
      }
    } catch (err) {
      console.error('좌표 업로드 오류:', err);
      log(`❌ NAS 업로드 중 오류 발생: ${file.name}`);
    }
  }

  // 2) 브라우저 측 파싱 + localStorage 저장
  const list = coordLib.all();
  const now  = new Date().toISOString();

  for (const file of files) {
    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array' });

      if (!window.SMTExtract || typeof SMTExtract.parseCoordWorkbook !== 'function') {
        alert(
          '좌표 파싱 함수 SMTExtract.parseCoordWorkbook 을 찾을 수 없습니다.\n' +
          'smt_extract.js 가 app.js 보다 먼저 로드되어 있는지 확인해 주세요.'
        );
        break;
      }

      const coordMap = SMTExtract.parseCoordWorkbook(wb, { fileName: file.name });
      if (!coordMap) throw new Error('파싱 결과가 없습니다.');

      const plain = coordMap instanceof Map ? Object.fromEntries(coordMap) : coordMap;

      list.push({
        id        : crypto.randomUUID(),
        name      : file.name,
        size      : file.size,
        type      : file.type,
        savedAt   : now,
        updatedAt : null,
        coordMap  : plain,
      });
    } catch (err) {
      console.error('좌표 파싱 실패:', file.name, err);
      alert(
        '좌표 파싱 중 오류가 발생했습니다.\n파일명: ' + file.name + '\n\n' +
        '자세한 내용은 개발자 도구 콘솔(F12) → Console 탭을 확인해 주세요.'
      );
    }
  }

  coordLib.save(list);
  renderCoordList?.();
  await reloadCoordFromServer();
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

/* ==== BOM 대시보드 ==== */
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

  document.getElementById('bomLog').textContent = 'BOM 등록 양식에 맞춰서 등록 부탁드리겠습니다!';

  document.getElementById('btnBOMReg').addEventListener('click',()=>{
    document.getElementById('pickBOMFiles').value='';
    document.getElementById('pickBOMFiles').click();
  });
  document.getElementById('btnHome').addEventListener('click',()=>{ setBodyHTML(''); });

  document.getElementById('btnBOMClear').addEventListener('click', ()=>{
    if(!confirm('BOM 등록 목록을 모두 삭제할까요?\n(좌표데이터 / 결과값 추출에는 영향을 주지 않습니다)')) return;
    bomLib.save([]);
    renderBOMList();
  });

  document.getElementById('btnBOMDeleteSelected').addEventListener('click', ()=>{
    const tbody = document.querySelector('#bomTable tbody');
    const checked = [...tbody.querySelectorAll('.bom-row-check:checked')];
    if(!checked.length){
      alert('삭제할 BOM 항목을 선택하세요.');
      return;
    }
    if(!confirm(`${checked.length}개 BOM 파일을 삭제할까요?\n(이 메뉴에 등록된 BOM만 삭제됩니다)`)) return;

    const ids = checked.map(cb => cb.closest('tr').dataset.id);
    const left = bomLib.all().filter(r => !ids.includes(r.id));
    bomLib.save(left);
    renderBOMList();
  });

  // 1차: 브라우저에 저장된 목록으로 먼저 렌더링
  renderBOMList();
  // 2차: NAS 기준 최신 목록을 다시 불러와서 덮어쓰기
  reloadBOMFromServer().then(renderBOMList);
}

function renderBOMList(){
  const tbody = document.querySelector('#bomTable tbody');
  if(!tbody) return;
  const list = bomLib.all();
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const esc = s => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  tbody.innerHTML = list.length ? list.map(r=>`
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
  `).join('') : `
    <tr>
      <td colspan="6" class="muted">저장된 BOM 파일이 없습니다.</td>
    </tr>
  `;

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

  tbody.querySelectorAll('.act-del').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      bomLib.remove(id);
      renderBOMList();
    });
  });

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

function logBom(msg){ const log=document.getElementById('bomLog'); if(log) log.innerHTML=msg; }

/* ==== 좌표데이터 대시보드 ==== */
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
  document.getElementById('btnHome2').addEventListener('click',()=>{ setBodyHTML(''); });

  document.getElementById('btnCoordClear').addEventListener('click', ()=>{
    if(!confirm('좌표데이터 등록 목록을 모두 삭제할까요?\n(BOM / 결과값 추출에는 영향을 주지 않습니다)')) return;
    coordLib.save([]);
    renderCoordList();
  });

  document.getElementById('btnCoordDeleteSelected').addEventListener('click', ()=>{
    const tbody = document.querySelector('#coordTable tbody');
    const checked = [...tbody.querySelectorAll('.coord-row-check:checked')];
    if(!checked.length){
      alert('삭제할 좌표데이터 항목을 선택하세요.');
      return;
    }
    if(!confirm(`${checked.length}개 좌표데이터 파일을 삭제할까요?\n(이 메뉴에 등록된 좌표데이터만 삭제됩니다)`)) return;

    const ids = checked.map(cb => cb.closest('tr').dataset.id);
    const left = coordLib.all().filter(r => !ids.includes(r.id));
    coordLib.save(left);
    renderCoordList();
  });

  renderCoordList();
  reloadCoordFromServer().then(renderCoordList);
}

function renderCoordList(){
  const tbody = document.querySelector('#coordTable tbody');
  if(!tbody) return;
  const list = coordLib.all();
  const fmt = n => (n/1024).toFixed(1)+' KB';
  const esc = s => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  tbody.innerHTML = list.length ? list.map(r=>`
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
  `).join('') : `
    <tr>
      <td colspan="6" class="muted">저장된 좌표데이터 파일이 없습니다.</td>
    </tr>
  `;

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

function logCoord(msg){ const log=document.getElementById('coordLog'); if(log) log.innerHTML=msg; }

/* ==== 결과값 추출 상태 ==== */
const EXTRACT_KEY = 'extractSelection';
const extractState = (()=>{ 
  try{ return JSON.parse(localStorage.getItem(EXTRACT_KEY)||'{}'); }
  catch{ return {}; }
})();
if(!extractState.bomIds) extractState.bomIds = [];
if(!extractState.coordIds) extractState.coordIds = [];
function saveExtractState(){ localStorage.setItem(EXTRACT_KEY, JSON.stringify(extractState)); }

/* ==== 결과값 추출 대시보드 ==== */
function showExtractDashboard(){
  const all = extractLib.all();
  const bomCnt   = all.filter(x => x.kind === 'BOM').length;
  const coordCnt = all.filter(x => x.kind === 'COORD').length;

  setBodyHTML(`
    <h2 style="margin:0 0 10px 0">결과값 추출</h2>
    <div class="dash">
      </button>
      </button>
      <button class="card-btn" id="btnExtractView">
        <p class="card-title">결과값 출력 하기</p>
        <p class="card-desc">선택한 BOM / 좌표로 결과를 출력</p>
      </button>
      <button class="card-btn" id="btnExtractTxt">
        <p class="card-title">메모장 으로 출력 하기</p>
        <p class="card-desc">결과값을 .txt로 저장</p>
      </button>
      <button class="card-btn" id="btnHome3">
        <p class="card-title">대시보드</p>
        <p class="card-desc">홈으로 돌아가기</p>
      </button>
    </div>

    <!-- 선택 설명 2줄 -->
    <p class="muted" style="margin-top:8px;">
      먼저 BOM과 좌표데이터를 선택한 뒤, <strong>결과값 출력 하기</strong>를 눌러 주세요.<br>
      선택 내용은 오른쪽 테이블에 저장되며 NAS에 있는 파일 기준으로 결과를 생성합니다.
    </p>

    <div style="margin:8px 0; text-align:right;">
      <button class="btn-mini" id="btnExtractDeleteSelected">선택 삭제</button>
      <button class="btn-mini" id="btnExtractClear">전체 삭제</button>
    </div>

    <div class="table-wrap" style="margin-top:12px">
      <table class="table" id="extractTable">
        <thead>
          <tr>
            <th style="width:40px;"><input type="checkbox" id="extractCheckAll"></th>
            <th>구분</th>
            <th>파일명</th>
            <th>크기</th>
            <th>등록/수정일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `);

  renderExtractSelectedTable();

  document.getElementById('btnPickBOM')?.addEventListener('click', ()=> openSelectModal('bom'));
  document.getElementById('btnPickCoord')?.addEventListener('click', ()=> openSelectModal('coord'));
  document.getElementById('btnHome3')?.addEventListener('click', ()=> setBodyHTML(''));

  // TXT 출력
  document.getElementById('btnExtractTxt')?.addEventListener('click', () => {
    if (!window.SMTText || typeof window.SMTText.runFromSelectedToTxt !== 'function') {
      alert('SMTText.runFromSelectedToTxt 함수가 없습니다.\n(콘솔 로그를 캡처해서 보여 주세요)');
      return;
    }
    window.SMTText.runFromSelectedToTxt();
  });

  document.getElementById('btnExtractClear')?.addEventListener('click', ()=>{
    if(!confirm('결과값 추출 목록을 모두 삭제할까요?\n(BOM / 좌표데이터 등록 목록에는 영향을 주지 않습니다)')) return;
    extractLib.clear();
    renderExtractSelectedTable();
  });

  document.getElementById('btnExtractDeleteSelected')?.addEventListener('click', ()=>{
    const tbody = document.querySelector('#extractTable tbody');
    const checked = [...tbody.querySelectorAll('.extract-row-check:checked')];
    if(!checked.length){
      alert('삭제할 결과값 항목을 선택하세요.');
      return;
    }
    if(!confirm(`${checked.length}개 결과값 항목을 삭제할까요?\n(결과값 추출 목록에서만 삭제됩니다)`)) return;

    const targets = checked.map(cb => cb.closest('tr'))
                           .map(tr => ({ id: tr.dataset.id, kind: tr.dataset.kind }));
    targets.forEach(({id, kind})=> extractLib.remove(id, kind));
    renderExtractSelectedTable();
  });

  document.getElementById('btnExtractView')?.addEventListener('click', runExtractWizard);
}

function renderExtractSelectedTable(){
  const tbody = document.querySelector('#extractTable tbody'); 
  if(!tbody) return;

  const rows = extractLib.all();

  const fmtSize = n => (n/1024).toFixed(1)+' KB';
  const fmtDate = r => r.updatedAt ? r.updatedAt.replace('T',' ').slice(0,19)
                                   : (r.savedAt? r.savedAt.replace('T',' ').slice(0,19) : '-');
  const esc = s => String(s).replace(/[&<>"]/g, m => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]
  ));

  tbody.innerHTML = rows.length ? rows.map(r=>`
    <tr data-id="${r.id}" data-kind="${r.kind}">
      <td><input type="checkbox" class="extract-row-check"></td>
      <td>${r.kind}</td>
      <td>${esc(r.name)}</td>
      <td>${fmtSize(r.size)}</td>
      <td>${fmtDate(r)}</td>
      <td>
        <button class="btn-mini act-Storage-ex">저장</button>
        <button class="btn-mini act-edit-ex">수정</button>
        <button class="btn-mini act-del-ex">삭제</button>
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="6" class="muted">
        선택된 항목이 없습니다. 상단에서 선택해 주세요.
      </td>
    </tr>
  `;

  const checkAll = document.getElementById('extractCheckAll');
  if(checkAll){
    checkAll.checked = false;
    checkAll.onclick = ()=>{
      tbody.querySelectorAll('.extract-row-check').forEach(cb=>{
        cb.checked = checkAll.checked;
      });
    };
  }

  // 저장 버튼 → 간단 엑셀 요약 다운로드
  tbody.querySelectorAll('.act-Storage-ex').forEach(btn => {
  // 👇 async 로 바꿔줘야 await 사용 가능
  btn.addEventListener('click', async () => {
    const tr   = btn.closest('tr');
    const id   = tr.dataset.id;
    const kind = tr.dataset.kind;

    const all = extractLib.all();
    const fileInfo = all.find(x => x.id === id && x.kind === kind);

    if(!fileInfo){
      alert("파일 정보를 찾을 수 없습니다.");
      return;
    }

    if(typeof XLSX === 'undefined'){
      alert('엑셀 라이브러리를 불러오지 못했습니다.\nHTML에 XLSX 스크립트가 포함되어 있는지 확인해 주세요.');
      return;
    }

    const header = ['구분','파일명','크기(KB)','등록/수정일'];
    const row = [
      fileInfo.kind,
      fileInfo.name,
      (fileInfo.size/1024).toFixed(1),
      // 기존 fmtDate 함수 그대로 사용
      (fileInfo.updatedAt ? fileInfo.updatedAt.replace('T',' ').slice(0,19)
                          : (fileInfo.savedAt ? fileInfo.savedAt.replace('T',' ').slice(0,19) : '-'))
    ];
    const aoa = [header, row];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RESULT');

    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    const blob  = new Blob([wbout], {type:'application/octet-stream'});
    const baseName      = (fileInfo.name || '결과').replace(/\.[^.]+$/, '');
    const suggestedName = `${baseName}_정보.xlsx`;

    // ✅ 1순위: showSaveFilePicker 지원되면 “경로 선택 창” 띄우기
    if (window.showSaveFilePicker) {
      await saveBlobWithPicker(blob, suggestedName);
    } else {
      // ✅ 2순위: 지원 안 하면 기존처럼 다운로드로 fallback
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href      = url;
      a.download  = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('이 브라우저는 경로 선택 기능을 지원하지 않아 기본 다운로드로 저장했습니다.');
    }
  });
});

  // 수정 버튼: BOM/좌표 선택 모달 열기
  tbody.querySelectorAll('.act-edit-ex').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tr   = btn.closest('tr');
      const kind = tr.dataset.kind;
      if(kind === 'BOM'){
        openSelectModal('bom');
      }else if(kind === 'COORD'){
        openSelectModal('coord');
      }
    });
  });

  tbody.querySelectorAll('.act-del-ex').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tr   = btn.closest('tr');
      const id   = tr.dataset.id;
      const kind = tr.dataset.kind;

      if(!confirm('해당 결과값 항목을 삭제할까요?')) return;

      extractLib.remove(id, kind);
      renderExtractSelectedTable();
    });
  });
}

/* === 선택 모달 관련 === */
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

// NAS 기반 목록을 사용하도록 수정된 openSelectModal
function openSelectModal(type){
  currentSelectType = type;
  selectTitle.textContent = (type==='bom') ? 'BOM 선택' : '좌표데이터 선택';

  // 모달 열기 전에 NAS에서 해당 목록 최신화
  (async () => {
    try{
      if(type === 'bom') await reloadBOMFromServer();
      else await reloadCoordFromServer();
    }catch(e){
      console.warn('선택 모달 로딩 중 NAS 갱신 오류:', e);
    }

    const raw = getLibAll(type);
    const kind = (type === 'bom') ? 'BOM' : 'COORD';

    const selectedIds = extractLib.all()
      .filter(x => x.kind === kind)
      .map(x => x.id);

    checkboxCache = new Map(raw.map(r=>[r.id, selectedIds.includes(r.id)]));

    renderSelectTable(raw);

    selectModal.setAttribute('open','');
    selectModal.style.display='flex';
  })();
}
window.openSelectModal = openSelectModal;

function closeSelectModal(){ 
  selectModal.removeAttribute('open'); 
  selectModal.style.display='none'; 
}

selectClose?.addEventListener('click', closeSelectModal);
selectCancel?.addEventListener('click', closeSelectModal);
selectModal?.addEventListener('click', e=>{ if(e.target===selectModal) closeSelectModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && selectModal.hasAttribute('open')) closeSelectModal(); });

selectApply?.addEventListener('click', ()=>{
  const ids = [...checkboxCache.entries()].filter(([id,v])=>v).map(([id])=>id);

  if(currentSelectType==='bom') extractState.bomIds = ids;
  else if(currentSelectType==='coord') extractState.coordIds = ids;
  saveExtractState();

  if(currentSelectType === 'bom' || currentSelectType === 'coord'){
    extractLib.setFromSelection(currentSelectType, ids);
  }

  closeSelectModal();
  showExtractDashboard();
});

btnSelectAll?.addEventListener('click', ()=>{
  currentRows.forEach(r=>checkboxCache.set(r.id, true));
  syncCheckboxesFromCache(); updateSelectCount();
});
btnSelectNone?.addEventListener('click', ()=>{
  currentRows.forEach(r=>checkboxCache.set(r.id, false));
  syncCheckboxesFromCache(); updateSelectCount();
});
selectSearch?.addEventListener('input', ()=>{
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
  const esc = s => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

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

// 선택 모달에서 "확인/취소/바깥 클릭" 중 하나가 일어날 때까지 기다리는 헬퍼
function waitSelectModalOnce(){
  return new Promise(resolve => {
    const onConfirm = () => cleanup(true);
    const onCancel  = () => cleanup(false);
    const onBackdrop = (e) => {
      if(e.target === selectModal) cleanup(false);
    };

    function cleanup(result){
      selectApply.removeEventListener('click', onConfirm);
      selectCancel.removeEventListener('click', onCancel);
      selectClose.removeEventListener('click', onCancel);
      selectModal.removeEventListener('click', onBackdrop);
      resolve(result);
    }

    selectApply.addEventListener('click', onConfirm);
    selectCancel.addEventListener('click', onCancel);
    selectClose.addEventListener('click', onCancel);
    selectModal.addEventListener('click', onBackdrop);
  });
}

// 선택된 BOM(결과값 추출 테이블 기준) 중 parsedBOM 이 없는 것만 NAS에서 다시 읽어서 파싱
async function ensureParsedBOMForSelected() {
  const all      = extractLib.all();              // RESULT 화면에 보이는 전체 목록
  const bomItems = all.filter(r => r.kind === 'BOM');

  for (const item of bomItems) {
    // 이미 parsedBOM 이 있으면 스킵
    if (item.parsedBOM) continue;

    try {
      // NAS -> PHP 를 통해 BOM 파일 읽기
      //  \\SAVE\SAERP List\SAERP BOM List  를  get_bom.php 가 내부에서 열어주는 구조
const res = await fetch(
  `${API_BASE}/get_bom.php?name=` + encodeURIComponent(item.name),
  { cache: 'no-store' }
);

      if (!res.ok) {
        console.warn('BOM 파일 로드 실패:', item.name, res.status, res.statusText);
        continue;
      }

      const buf = await res.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array' });

      if (window.SMTExtract && typeof SMTExtract.parseBOMWorkbook === 'function') {
        item.parsedBOM = SMTExtract.parseBOMWorkbook(wb);
        console.log('[ensureParsedBOMForSelected] parsedBOM 저장:', item.name);
      } else {
        console.warn('SMTExtract.parseBOMWorkbook 을 찾을 수 없습니다.');
      }
    } catch (e) {
      console.error('BOM 파싱 중 오류:', item.name, e);
    }
  }

  // 수정된 내용 저장 (SMTExtract.runFromSelected 가 여기서 읽어감)
  extractLib.save(all);
}

/* 👉 결과값 출력 하기 전체 흐름 (BOM 모달 → 좌표 모달 → SMTExtract.runFromSelected) */
async function runExtractWizard(){
  // smt_extract.js 가 로드되었는지 확인
  if (!window.SMTExtract || typeof window.SMTExtract.runFromSelected !== 'function') {
    alert('결과값 생성 엔진(smt_extract.js)이 로드되지 않았습니다.');
    return;
  }

  // 1단계: BOM 선택 모달
  openSelectModal('bom');
  const bomOk = await waitSelectModalOnce();
  if (!bomOk) return;

  // 2단계: 좌표 선택 모달
  openSelectModal('coord');
  const coordOk = await waitSelectModalOnce();
  if (!coordOk) return;

  // 3단계: 선택된 내용은 extractLib 에 저장되어 있음
  const rows = extractLib.all();
  const bomIds   = rows.filter(r => r.kind === 'BOM').map(r => r.id);
  const coordIds = rows.filter(r => r.kind === 'COORD').map(r => r.id);

  if (!bomIds.length) {
    alert('결과값 추출: 선택된 BOM이 없습니다.\n먼저 BOM을 선택해 주세요.');
    return;
  }
  if (!coordIds.length) {
    alert('결과값 추출: 선택된 좌표데이터가 없습니다.\n먼저 좌표데이터를 선택해 주세요.');
    return;
  }

  // 4단계: NAS 에서 BOM 엑셀을 다시 읽어서 parsedBOM 채우기
  await ensureParsedBOMForSelected();

  // 5단계: 실제 결과값 생성 (smt_extract.js 에서 extractLib 를 읽어서 처리)
  try{
    await window.SMTExtract.runFromSelected();
  }catch(e){
    console.error(e);
    alert('엑셀 결과 파일을 만드는 중 오류가 발생했습니다.\n콘솔을 확인해 주세요.');
  }
}


/* ==== 메뉴 연결 ==== */
document.addEventListener('DOMContentLoaded', ()=>{
  const mnBom    = document.getElementById('mn-bom');
  const mnCoords = document.getElementById('mn-coords');
  const mnExtract= document.getElementById('mn-extract');

  if (mnBom) {
    mnBom.addEventListener('click', (e) => {
      e.preventDefault();
      showBOMDashboard();
    });
  }

  if (mnCoords) {
    mnCoords.addEventListener('click', (e) => {
      e.preventDefault();
      showCoordDashboard();
    });
  }

  if (mnExtract) {
    mnExtract.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof showExtractDashboard === 'function') {
        showExtractDashboard();
      } else {
        setBodyHTML('<h2>결과값 추출 화면은 아직 준비 중입니다.</h2>');
      }
    });
  }
});

async function saveResultAsExcelToNAS(fileName, excelBlob){
  const buffer = await excelBlob.arrayBuffer();
  const bytes  = new Uint8Array(buffer);
  let binary   = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const res = await fetch(`${API_BASE}/save_extract_excel.php`, {
    method : 'POST',
    headers: { 'Content-Type':'application/json' },
    body   : JSON.stringify({ filename: fileName, content: base64 })
  });

  const data = await res.json().catch(()=>null);

  return res.ok && data?.success;
}

async function saveResultAsTxtToNAS(fileName, textContent){
  const res = await fetch(`${API_BASE}/save_extract_txt.php`, {
    method : 'POST',
    headers: { 'Content-Type':'application/json' },
    body   : JSON.stringify({ filename: fileName, content: textContent })
  });

  const data = await res.json().catch(()=>null);

  return res.ok && data?.success;
}

document.getElementById('btnExportExcel')?.addEventListener('click', async ()=>{

  // ⚠️ 이 부분은 네가 화면에서 만든 workbook 으로 교체해야 함
  const wb    = SMTExtract.buildResultWorkbook(currentResultData);
  const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' });
  const blob  = new Blob([wbout], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const fileName = `결과값_${Date.now()}.xlsx`;
  const ok = await saveResultAsExcelToNAS(fileName, blob);

  if (ok) alert("NAS 저장 완료");
  else    alert("NAS 저장 실패");
});

document.getElementById('btnExportTxt')?.addEventListener('click', async ()=>{

  // ⚠️ 이 부분은 네가 현재 화면에서 출력하는 내용으로 채워야 함
  const text = currentResultText;

  const fileName = `결과값_${Date.now()}.txt`;
  const ok = await saveResultAsTxtToNAS(fileName, text);

  if (ok) alert("TXT 저장 완료");
  else    alert("TXT 저장 실패");
});
