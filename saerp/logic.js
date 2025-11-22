// auth.js  (index.html에서만 로드)  ──────────────────────────────
(() => {
  'use strict';

  const ADMIN_ID = 'admin';
  const ADMIN_PW = '1234';

  const store = {
    get users(){ return JSON.parse(localStorage.getItem('users')||'{}'); },
    set users(v){ localStorage.setItem('users', JSON.stringify(v)); },
    get current(){ return localStorage.getItem('currentUser'); },
    set current(id){ id?localStorage.setItem('currentUser', id):localStorage.removeItem('currentUser'); },
    get auto(){ return localStorage.getItem('autoLogin')==='true'; },
    set auto(v){ localStorage.setItem('autoLogin', v?'true':'false'); }
  };

  const $ = (s, p=document) => p.querySelector(s);

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = $('#loginForm');
    if (!loginForm) return; // 다른 페이지에서 로드되면 아무것도 하지 않음

    const idEl = $('#loginId');
    const pwEl = $('#loginPw');
    const err  = $('#loginErr');
    const auto = $('#autoLogin');

    function showErr(msg){
      if (!err) return;
      err.style.display = '';
      err.textContent = msg;
    }

    function enterApp(id){
      localStorage.setItem('currentUser', id);
      window.location.replace('app.html');
    }

    async function doLogin(){
      const id = (idEl?.value || '').trim();
      const pw = pwEl?.value || '';
      err && (err.style.display='none');

      if (!id || !pw) return showErr('아이디와 비밀번호를 입력하세요.');

      if (id === ADMIN_ID && pw === ADMIN_PW){
        store.current = ADMIN_ID;
        store.auto = !!(auto && auto.checked);
        return enterApp(ADMIN_ID);
      }

      const users = store.users;
      if (!users[id])          return showErr('존재하지 않는 아이디입니다.');
      if (users[id].pw !== pw) return showErr('비밀번호가 올바르지 않습니다.');

      store.current = id;
      store.auto = !!(auto && auto.checked);
      enterApp(id);
    }

    loginForm.addEventListener('submit', (e)=>{ e.preventDefault(); doLogin(); });
    $('#loginBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); doLogin(); });
  });
})();