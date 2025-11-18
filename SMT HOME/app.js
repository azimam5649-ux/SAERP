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
    const res = await fetch('signup.php', {   // 위치에 따라 './api/signup.php' 이런 식으로 변경 가능
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, company, phone, email, pw })
    });

    const data = await res.json();
    if(!res.ok || !data.success){
      return showErr(err, data.message || '회원가입에 실패했습니다.');
    }

    alert('회원가입이 완료되었습니다. 이제 로그인해 주세요.');
    // 회원가입 후 자동 로그인 대신 로그인 화면으로 돌리기
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
/** ⛔ 폴더 선택 기능 포기: 항상 null 반환 → 무조건 브라우저 다운로드만 사용 */
async function pickTargetDirectory(){
  return null;
}

// (안 쓰이지만 남겨둠)
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

    <!-- ✅ BOM 선택 삭제 / 전체 삭제 버튼 영역 -->
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
    document.getElementById('pickBOMFiles').value=''; document.getElementById('pickBOMFiles').click();
  });
  document.getElementById('btnHome').addEventListener('click',()=>{ setBodyHTML(''); });

  // ✅ BOM 전체 삭제 (BOM만)
  document.getElementById('btnBOMClear').addEventListener('click', ()=>{
    if(!confirm('BOM 등록 목록을 모두 삭제할까요?\n(좌표데이터 / 결과값 추출에는 영향을 주지 않습니다)')) return;
    bomLib.save([]);  // BOM만 싹 비움
    renderBOMList();
  });

  // ✅ BOM 선택 삭제
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

  renderBOMList();
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

  // 단일 삭제 버튼 (기존 동작 유지)
  tbody.querySelectorAll('.act-del').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      bomLib.remove(id);
      renderBOMList();
    });
  });

  // ✅ BOM 전체 선택 체크박스
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

    <!-- ✅ 좌표데이터 선택 삭제 / 전체 삭제 -->
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
    document.getElementById('pickCoordFiles').value=''; document.getElementById('pickCoordFiles').click();
  });
  document.getElementById('btnHome2').addEventListener('click',()=>{ setBodyHTML(''); });

  // ✅ 좌표 전체 삭제 (coordLib만)
  document.getElementById('btnCoordClear').addEventListener('click', ()=>{
    if(!confirm('좌표데이터 등록 목록을 모두 삭제할까요?\n(BOM / 결과값 추출에는 영향을 주지 않습니다)')) return;
    coordLib.save([]);
    renderCoordList();
  });

  // ✅ 좌표 선택 삭제
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

  // 단일 삭제
  tbody.querySelectorAll('.act-del2').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.closest('tr').dataset.id;
      coordLib.remove(id);
      renderCoordList();
    });
  });

  // ✅ 좌표 전체 선택 체크박스
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

/* ==== 결과값 추출 전용 라이브러리 (BOM/좌표와 분리) ==== */
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

  // 🔹 txt.js 에서 호출할 추가 메서드
  add(meta){
    const list = this.all();
    list.push(meta);
    this.save(list);
  }
};
window.extractLib = extractLib;

/* ==== 파일 선택 핸들러 ==== */
document.getElementById('pickBOMFiles')?.addEventListener('change', async e=>{
  const files = Array.from(e.target.files||[]); if(!files.length) return;
  logBom(`📄 선택: ${files.map(f=>f.name).slice(0,5).join(', ')}${files.length>5?` 외 ${files.length-5}개`:''}<br>브라우저 다운로드 폴더에 저장합니다…`);

  // 👉 폴더 선택 포기: 무조건 브라우저 다운로드
  files.forEach(f=>forceDownload(f,'BOM'));
  logBom(`⬇️ 브라우저 다운로드 폴더(기본 위치)에 저장했습니다.`);

  // 🔴 BOM 파싱 + 라이브러리에 parsedBOM까지 저장
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
        parsedBOM: parsedBOM,   // Set 포함이지만 지금은 그대로 저장
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
  const files = Array.from(e.target.files||[]); if(!files.length) return;
  logCoord(`📄 선택: ${files.map(f=>f.name).slice(0,5).join(', ')}${files.length>5?` 외 ${files.length-5}개`:''}<br>브라우저 다운로드 폴더에 저장합니다…`);

  // 👉 폴더 선택 포기: 무조건 브라우저 다운로드
  files.forEach(f=>forceDownload(f,'COORD'));
  logCoord(`⬇️ 브라우저 다운로드 폴더(기본 위치)에 저장했습니다.`);

  // 🔴 좌표 파싱 + coordLib 에 coordMap 포함해서 저장 (Map → Object 변환!!)
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

      // 1) Map으로 파싱
      const coordMap = SMTExtract.parseCoordWorkbook(wb, { fileName: f.name });

      // 2) localStorage에 저장 가능하도록 순수 객체로 변환
      const coordObj = Object.fromEntries(coordMap);

      // 3) coordMap 대신 coordObj 저장
      list.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
        savedAt: now,
        updatedAt: null,
        coordMap: coordObj,   // ★ 여기 중요 ★
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
  const all = extractLib.all();
  const bomCnt   = all.filter(x => x.kind === 'BOM').length;
  const coordCnt = all.filter(x => x.kind === 'COORD').length;

  setBodyHTML(`
    <h2 style="margin:0 0 10px 0">결과값 추출</h2>
    <div class="dash">
      <button class="card-btn" id="btnPickBOM">
        <p class="card-title">BOM 선택</p>
        <p class="card-desc">등록된 BOM 중에서 선택 (${bomCnt}개 저장됨)</p>
      </button>
      <button class="card-btn" id="btnPickCoord">
        <p class="card-title">좌표데이터 선택</p>
        <p class="card-desc">등록된 좌표데이터 중에서 선택 (${coordCnt}개 저장됨)</p>
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

    <!-- ✅ 결과값 선택 삭제 / 전체 삭제 -->
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

  // 🔹 메모장으로 출력하기 (Top/Bot txt 생성)
  document.getElementById('btnExtractTxt')?.addEventListener('click', () => {
  console.log('[app.js] btnExtractTxt click, SMTText =', window.SMTText);

  if (!window.SMTText || typeof window.SMTText.runFromSelectedToTxt !== 'function') {
    alert('SMTText.runFromSelectedToTxt 함수가 없습니다.\n(콘솔 로그를 캡처해서 보여 주세요)');
    return;
  }

  window.SMTText.runFromSelectedToTxt();
});

  // ✅ 결과값 전체 삭제 (extractLib만)
  document.getElementById('btnExtractClear')?.addEventListener('click', ()=>{
    if(!confirm('결과값 추출 목록을 모두 삭제할까요?\n(BOM / 좌표데이터 등록 목록에는 영향을 주지 않습니다)')) return;
    extractLib.clear();
    renderExtractSelectedTable();
  });

  // ✅ 결과값 선택 삭제
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

// 아래 세 줄은 초기 로드시에는 엘리먼트가 없어서 아무 일도 안 일어남 (기능 영향 X)
renderExtractSelectedTable?.();
document.getElementById('btnPickBOM')?.addEventListener('click', ()=> openSelectModal('bom'));
document.getElementById('btnPickCoord')?.addEventListener('click', ()=> openSelectModal('coord'));
document.getElementById('btnHome3')?.addEventListener('click', ()=> setBodyHTML(''));

function renderExtractSelectedTable(){
  const tbody = document.querySelector('#extractTable tbody'); 
  if(!tbody) return;

  const rows = extractLib.all();  // 결과값 전용 저장소

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

  // ✅ 전체 선택 체크박스
  const checkAll = document.getElementById('extractCheckAll');
  if(checkAll){
    checkAll.checked = false;
    checkAll.onclick = ()=>{
      tbody.querySelectorAll('.extract-row-check').forEach(cb=>{
        cb.checked = checkAll.checked;
      });
    };
  }

  // ✅ 저장 버튼: 해당 행 정보로 엑셀(.xlsx) 생성 → 다운로드
  tbody.querySelectorAll('.act-Storage-ex').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr   = btn.closest('tr');
      const id   = tr.dataset.id;
      const kind = tr.dataset.kind;

      const all = extractLib.all();
      const fileInfo = all.find(x => x.id === id && x.kind === kind);

      if(!fileInfo){
        alert("파일 정보를 찾을 수 없습니다.");
        return;
      }

      // XLSX 로드 확인
      if(typeof XLSX === 'undefined'){
        alert('엑셀 라이브러리를 불러오지 못했습니다.\nHTML에 XLSX 스크립트가 포함되어 있는지 확인해 주세요.');
        return;
      }

      // 엑셀 데이터 구성 (간단 요약)
      const header = ['구분','파일명','크기(KB)','등록/수정일'];
      const row = [
        fileInfo.kind,
        fileInfo.name,
        (fileInfo.size/1024).toFixed(1),
        fmtDate(fileInfo)
      ];
      const aoa = [header, row];

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RESULT');

      const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
      const blob = new Blob([wbout], {type:'application/octet-stream'});
      const url  = URL.createObjectURL(blob);

      const a = document.createElement('a');
      const baseName = (fileInfo.name || '결과').replace(/\.[^.]+$/, '');
      a.href = url;
      a.download = `${baseName}_정보.xlsx`;
      a.click();

      URL.revokeObjectURL(url);
    });
  });

  // ✅ 수정 버튼: BOM/좌표 선택 모달 열기
  tbody.querySelectorAll('.act-edit-ex').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tr   = btn.closest('tr');
      const kind = tr.dataset.kind;   // 'BOM' 또는 'COORD'
      if(kind === 'BOM'){
        openSelectModal('bom');
      }else if(kind === 'COORD'){
        openSelectModal('coord');
      }
    });
  });

  // ✅ 단일 삭제 버튼
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
  const kind = (type === 'bom') ? 'BOM' : 'COORD';

  // ✅ 이미 결과값 추출에 저장된 항목을 기준으로 체크 상태 결정
  const selectedIds = extractLib.all()
    .filter(x => x.kind === kind)
    .map(x => x.id);

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

  // 기존 상태도 유지 (기능 삭제 X)
  if(currentSelectType==='bom') extractState.bomIds = ids;
  else if(currentSelectType==='coord') extractState.coordIds = ids;
  saveExtractState();

  // ✅ 선택된 내용으로 결과값 전용 라이브러리 갱신
  if(currentSelectType === 'bom' || currentSelectType === 'coord'){
    extractLib.setFromSelection(currentSelectType, ids);
  }

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

/* 메뉴 연결 */
document.getElementById('mn-bom')?.addEventListener('click',e=>{e.preventDefault();showBOMDashboard()});
document.getElementById('mn-coords')?.addEventListener('click',e=>{e.preventDefault();showCoordDashboard()});
document.getElementById('mn-extract')?.addEventListener('click',e=>{e.preventDefault();showExtractDashboard()});

// 👉 선택 모달에서 "확인" / "취소" / 바깥 클릭 중 하나가 일어날 때까지 기다리는 헬퍼
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

// 👉 결과값 출력 하기 버튼을 눌렀을 때 전체 흐름
async function runExtractWizard(){
  if (!window.SMTExtract || !window.SMTExtract.runFromSelected) {
    alert('결과값 생성 엔진(smt_extract.js)이 로드되지 않았습니다.');
    return;
  }

  // 1단계: BOM 선택 모달
  openSelectModal('bom');
  const bomOk = await waitSelectModalOnce();
  if(!bomOk) return;

  // 2단계: 좌표데이터 선택 모달
  openSelectModal('coord');
  const coordOk = await waitSelectModalOnce();
  if(!coordOk) return;

  // 3단계: 선택된 BOM/좌표 기준으로 결과 엑셀 생성
  try{
    await window.SMTExtract.runFromSelected();
  }catch(e){
    console.error(e);
    alert('엑셀 결과 파일을 만드는 중 오류가 발생했습니다.\n콘솔을 확인해 주세요.');
  }
}