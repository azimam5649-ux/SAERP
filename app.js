// app.js  (app.html에서만 로드)  ────────────────────────────────
(() => {
  'use strict';

  const $  = (s, p=document) => p.querySelector(s);

  // ── 세션 가드 ────────────────────────────────────────────────
  const store = {
    get current(){ return localStorage.getItem('currentUser'); },
    set current(id){ id?localStorage.setItem('currentUser', id):localStorage.removeItem('currentUser'); },
    set auto(v){ localStorage.setItem('autoLogin', v?'true':'false'); }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const uid = store.current;
    if (!uid){ location.replace('index.html'); return; }
    $('#welcome') && ($('#welcome').textContent = `접속되었습니다. 환영합니다, ${uid}님`);
  });

  // ── 로그아웃 ─────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#logoutBtn')) return;
    store.current = null; store.auto = false;
    location.replace('index.html');
  });

  // ── 선택 창 열기 유틸 ─────────────────────────────────────────
  function openFilePicker({ accept, multiple=false }={}) {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept)   input.accept = accept;
      if (multiple) input.multiple = true;
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const files = input.files?.length ? input.files : null;
        resolve(files);
        document.body.removeChild(input);
      });
      input.click();
    });
  }

  function openFolderPicker() {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      // 브라우저(Chromium 계열)에서 폴더 선택
      input.webkitdirectory = true;
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const files = input.files?.length ? input.files : null;
        resolve(files);
        document.body.removeChild(input);
      });
      input.click();
    });
  }

  // ── 하위메뉴 클릭: 폴더/파일 선택 ────────────────────────────
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('#mn-coords, #mn-bom');
    if (!a) return;
    e.preventDefault();

    const out = $('#fileResult');
    if (a.id === 'mn-coords') {
      // 좌표데이터: "폴더 선택" 창
      const files = await openFolderPicker();
      if (!files) return;
      const names = Array.from(files).map(f => f.webkitRelativePath || f.name);
      out && (out.innerHTML =
        `<b>📁 선택한 폴더</b><br>${names.slice(0,10).join('<br>')}`
        + (names.length>10? `<br>...(${names.length}개 파일)` : '')
      );
      // TODO: 여기서 엑셀/CSV만 필터링해 파싱 로직 연결
    }

    if (a.id === 'mn-bom') {
      // BOM: 파일 선택 창
      const files = await openFilePicker({ accept: '.xlsx,.xls,.csv', multiple: false });
      if (!files) return;
      const f = files[0];
      out && (out.innerHTML = `📄 <b>BOM 파일 선택됨</b><br>• ${f.name}`);
      // TODO: BOM 파싱 로직
    }
  });

})();

