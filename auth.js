document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const signupErr  = document.getElementById('signupErr');
  const agree      = document.getElementById('agree');
  const signupBtn  = document.getElementById('signupBtn');

  // 동의 체크되면 버튼 활성화
  if (agree && signupBtn) {
    agree.addEventListener('change', () => {
      signupBtn.disabled = !agree.checked;
    });
  }

  if (!signupForm) return;

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!agree.checked) {
      alert('개인정보 수집·이용에 동의해 주세요.');
      return;
    }

    const userid  = document.getElementById('suId').value.trim();
    const company = document.getElementById('suCompany').value.trim();
    const phone   = document.getElementById('suPhone').value.trim();
    const email   = document.getElementById('suEmail').value.trim();
    const pw      = document.getElementById('suPw').value;
    const pw2     = document.getElementById('suPw2').value;

    signupErr.style.display = 'none';
    signupErr.textContent   = '';

    if (!userid || !company || !phone || !email || !pw || !pw2) {
      signupErr.style.display = '';
      signupErr.textContent = '모든 필수 항목을 입력해 주세요.';
      return;
    }
    if (pw !== pw2) {
      signupErr.style.display = '';
      signupErr.textContent = '비밀번호가 일치하지 않습니다.';
      return;
    }

    try {
      const res = await fetch('https://my-saerp.synology.me/saerp/api/signup_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, company, phone, email, password: pw }),
        credentials: 'include'   // 나중에 세션 쓸 때 필요
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.msg || '회원가입 실패');
      }

      alert('회원가입이 완료되었습니다. 이제 로그인 해 주세요.');
      // 로그인 화면으로 전환
      document.getElementById('loginCard').style.display  = '';
      document.getElementById('signupCard').style.display = 'none';

    } catch (err) {
      signupErr.style.display = '';
      signupErr.textContent = err.message;
    }
  });
});
