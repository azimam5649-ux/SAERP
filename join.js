// app.js (부분 발췌)

// ... (중략) ...

$("#signupBtn")?.addEventListener('click', async ()=>{
  const err = $("#signupErr"); 
  err.style.display='none';

  const id       = $("#suId").value.trim();
  const company  = $("#suCompany").value.trim();
  const phone    = $("#suPhone").value.trim();
  const email    = $("#suEmail").value.trim();
  const pw       = $("#suPw").value;
  const pw2      = $("#suPw2").value;

  // ... (중략: 유효성 검사) ...

  try{
    // 🔴 이 부분이 NAS 서버의 백엔드 API를 호출하여 DB에 저장하는 역할입니다.
    const res = await fetch(`${API_BASE}/signup.php`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, company, phone, email, pw }) // 👈 여기에 데이터를 전송합니다.
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