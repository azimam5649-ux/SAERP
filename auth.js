// auth.js - 로그인/회원가입 + 화면 전환

(() => {
  'use strict';

  // ★ NAS API 기본 URL (DDNS + 경로 맞게 수정)
  const API_BASE = 'https://my-saerp.synology.me/saerp/api';
  // 예: https://my-saerp.synology.me/saerp/api

  // 관리자 테스트 계정 (DB와 무관)
  const ADMIN_ID = 'admin';
  const ADMIN_PW = '1234';

  // 브라우저 저장소
  const store = {
    get current() { return localStorage.getItem('currentUser'); },
    set current(v) { v ? localStorage.setItem('currentUser', v) : localStorage.removeItem('currentUser'); },
    get auto() { return localStorage.getItem('autoLogin') === 'true'; },
    set auto(v) { localStorage.setItem('autoLogin', v ? 'true' : 'false'); }
  };

  const $  = (sel, p = document) => p.querySelector(sel);

  function showView(which) {
    const login  = $('#loginCard');
    const signup = $('#signupCard');
    const app    = $('#appCard');

    if (!login || !signup || !app) return;

    login.style.display  = (which === 'login')  ? '' : 'none';
    signup.style.display = (which === 'signup') ? '' : 'none';
    app.style.display    = (which === 'app')    ? '' : 'none';
  }

  function setWelcome(id) {
    const span = $('#welcome');
    if (span) span.textContent = id ? `${id} 님 환영합니다.` : '';
  }

  function enterApp(id) {
    store.current = id;
    setWelcome(id);
    showView('app');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm   = $('#loginForm');
    const signupForm  = $('#signupForm');
    const loginErr    = $('#loginErr');
    const signupErr   = $('#signupErr');
    const toSignupBtn = $('#toSignup');
    const toLoginBtn  = $('#toLogin');
    const autoChk     = $('#autoLogin');
    const logoutBtn   = $('#logoutBtn');
    const agree       = $('#agree');
    const signupBtn   = $('#signupBtn');

    const idEl = $('#loginId');
    const pwEl = $('#loginPw');

    function showLoginErr(msg) {
      if (!loginErr) return;
      loginErr.style.display = '';
      loginErr.textContent   = msg;
    }
    function hideLoginErr() {
      if (!loginErr) return;
      loginErr.style.display = 'none';
      loginErr.textContent   = '';
    }

    function showSignupErr(msg) {
      if (!signupErr) return;
      signupErr.style.display = '';
      signupErr.textContent   = msg;
    }
    function hideSignupErr() {
      if (!signupErr) return;
      signupErr.style.display = 'none';
      signupErr.textContent   = '';
    }

    // ---- 화면 전환 버튼 ----
    if (toSignupBtn) {
      toSignupBtn.addEventListener('click', () => {
        showView('signup');
      });
    }
    if (toLoginBtn) {
      toLoginBtn.addEventListener('click', () => {
        showView('login');
      });
    }

    // 자동로그인 상태라면 바로 앱으로
    if (store.auto && store.current) {
      enterApp(store.current);
    } else {
      showView('login');
    }

    // 개인정보 동의 체크 시 버튼 활성/비활성
    if (agree && signupBtn) {
      agree.addEventListener('change', () => {
        signupBtn.disabled = !agree.checked;
      });
    }

    // ---- 로그아웃 ----
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        store.current = null;
        store.auto    = false;
        localStorage.removeItem('token');
        setWelcome('');
        showView('login');
      });
    }

    // ---- 로그인 처리 ----
    async function doLogin() {
      const id = (idEl?.value || '').trim();
      const pw = pwEl?.value || '';
      hideLoginErr();

      if (!id || !pw) {
        return showLoginErr('아이디와 비밀번호를 입력하세요.');
      }

      // 1) 관리자 테스트 계정 (DB와 무관)
      if (id === ADMIN_ID && pw === ADMIN_PW) {
        store.current = ADMIN_ID;
        store.auto    = !!(autoChk && autoChk.checked);
        return enterApp(ADMIN_ID);
      }

      // 2) 일반 회원 - NAS에 로그인 요청
      try {
        const fd = new FormData();
        fd.append('userid', id);
        fd.append('password', pw);

        const res = await fetch(`${API_BASE}/login.php`, {
          method: 'POST',
          body: fd,
          credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          return showLoginErr(data.msg || '로그인에 실패했습니다.');
        }

        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        store.current = id;
        store.auto    = !!(autoChk && autoChk.checked);
        enterApp(id);
      } catch (err) {
        console.error(err);
        showLoginErr('서버 통신 중 오류가 발생했습니다.');
      }
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        doLogin();
      });
      $('#loginBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        doLogin();
      });
    }

    // ---- 회원가입 처리 ----
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideSignupErr();

        const userid  = $('#suId')?.value.trim() || '';
        const company = $('#suCompany')?.value.trim() || '';
        const phone   = $('#suPhone')?.value.trim() || '';
        const email   = $('#suEmail')?.value.trim() || '';
        const pw      = $('#suPw')?.value || '';
        const pw2     = $('#suPw2')?.value || '';

        if (!userid || !company || !phone || !email || !pw || !pw2) {
          return showSignupErr('모든 필수 항목을 입력해 주세요.');
        }
        if (pw !== pw2) {
          return showSignupErr('비밀번호가 일치하지 않습니다.');
        }
        if (!agree?.checked) {
          return showSignupErr('개인정보 수집·이용에 동의해 주세요.');
        }

        try {
          const fd = new FormData();
          fd.append('userid', userid);
          fd.append('company', company);
          fd.append('phone',   phone);
          fd.append('email',   email);
          fd.append('password', pw);

          const res = await fetch(`${API_BASE}/signup.php`, {
            method: 'POST',
            body: fd,
            credentials: 'include'
          });

          const data = await res.json();

          if (!res.ok || !data.ok) {
            throw new Error(data.msg || '회원가입 실패');
          }

          alert('회원가입이 완료되었습니다. 이제 로그인 해 주세요.');
          showView('login');

        } catch (err) {
          console.error(err);
          showSignupErr(err.message);
        }
      });
    }
  });
})();
