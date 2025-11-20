/* ------------------------------
   server_upload.js
   NAS 서버 저장 전용 API 함수 모음
   ------------------------------ */

/* ===== 1) BOM 서버 저장 ===== */
async function saveBOMToServer(file) {

  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch('/saerp/api/upload_bom.php', {
    method: 'POST',
    body: fd
  });

  return await res.json();
}


/* ===== 2) 좌표데이터 서버 저장 ===== */
async function saveCoordToServer(file) {

  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch('/saerp/api/upload_coord.php', {
    method: 'POST',
    body: fd
  });

  return await res.json();
}


/* ===== 3) 결과값 EXCEL 서버 저장 ===== */
async function saveExtractExcelToServer(blob, fileName) {

  const fd = new FormData();
  fd.append('file', blob, fileName);

  const res = await fetch('/saerp/api/save_extract_excel.php', {
    method: 'POST',
    body: fd
  });

  return await res.json();
}


/* ===== 4) 결과값 TXT 서버 저장 ===== */
async function saveExtractTxtToServer(text, fileName) {

  const fd = new FormData();
  fd.append('text', text);
  fd.append('name', fileName);

  const res = await fetch('/saerp/api/save_extract_txt.php', {
    method: 'POST',
    body: fd
  });

  return await res.json();
}
