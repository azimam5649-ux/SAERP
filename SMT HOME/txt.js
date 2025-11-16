// txt.js
// 결과값 추출: 선택된 BOM/좌표 기준으로 Top / Bot 텍스트 파일 만들기
// - 순수 .txt 출력
// - Package-Specification 제거
// - 열 정렬(Reference / X / Y / Rot / Side)

(function (global) {

  function alertError(msg) {
    console.error(msg);
    alert(msg);
  }

  // ---------- 공통 유틸 ----------

  // Reference 문자열 정규화
  function normalizeRef(ref) {
    return String(ref == null ? '' : ref)
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  // 파일명에서 Top/Bot 추정
  function inferSideFromName(fileName) {
    if (!fileName) return '';
    const lower = fileName.toLowerCase();
    if (lower.includes('top')) return 'Top';
    if (lower.includes('bot')) return 'Bot';
    return '';
  }

  // coordMap(Object/JSON/Map) → Map 으로 통일
  function normalizeCoordMap(raw, sideFromFile) {
    let m = raw;

    // 문자열이면 JSON 파싱 시도
    if (typeof m === 'string') {
      try {
        m = JSON.parse(m);
      } catch (e) {
        console.warn('coordMap JSON 파싱 실패:', e);
        return new Map();
      }
    }

    // 이미 Map 인 경우
    if (m instanceof Map) {
      const out = new Map();
      for (const [ref, data0] of m.entries()) {
        if (!data0 || typeof data0 !== 'object') continue;
        const data = { ...data0 };
        if (sideFromFile && !data.side) data.side = sideFromFile;
        const norm = normalizeRef(ref);
        if (!norm) continue;
        if (!out.has(norm)) out.set(norm, data);
      }
      return out;
    }

    // 일반 객체인 경우
    if (m && typeof m === 'object') {
      const out = new Map();
      for (const [ref, data0] of Object.entries(m)) {
        if (!data0 || typeof data0 !== 'object') continue;
        const data = { ...data0 };
        if (sideFromFile && !data.side) data.side = sideFromFile;
        const norm = normalizeRef(ref);
        if (!norm) continue;
        if (!out.has(norm)) out.set(norm, data);
      }
      return out;
    }

    return new Map();
  }

  // 여러 coordMap 합치기 (첫 등장 우선)
  function mergeCoordMaps(maps) {
    const merged = new Map();
    for (const m of maps) {
      if (!m) continue;

      if (m instanceof Map) {
        for (const [ref, data] of m.entries()) {
          const norm = normalizeRef(ref);
          if (!norm) continue;
          if (!merged.has(norm)) merged.set(norm, data);
        }
      } else if (m && typeof m === 'object') {
        for (const [ref, data] of Object.entries(m)) {
          const norm = normalizeRef(ref);
          if (!norm) continue;
          if (!merged.has(norm)) merged.set(norm, data);
        }
      }
    }
    return merged;
  }

  // 브라우저 다운로드 트리거
  function triggerDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- 열 정렬 설정 ----------

  // 폭을 너무 넓지 않게 조정 (숫자들이 좀 더 왼쪽으로 오도록)
  const W_REF = 8;   // Reference
  const W_X   = 8;   // X
  const W_Y   = 8;   // Y
  const W_ROT = 5;   // Rot
  const W_SIDE= 4;   // Side

  // 한 줄 포맷팅
  function formatLine(ref, x, y, rot, side) {
    return (
      String(ref).padEnd(W_REF) +
      String(x).padStart(W_X) +
      String(y).padStart(W_Y) +
      String(rot).padStart(W_ROT) +
      ' ' +
      String(side).padEnd(W_SIDE)
    );
  }

  // ---------- 메인 로직: 선택된 BOM/좌표 → Top/Bot txt ----------

  async function runFromSelectedToTxt() {
    if (!global.extractLib || !global.extractLib.all) {
      alertError('extractLib 정보를 찾을 수 없습니다.');
      return;
    }

    const allSelected = global.extractLib.all();

    const bomSelected   = allSelected.filter(x => x.kind === 'BOM');
    const coordSelected = allSelected.filter(x => x.kind === 'COORD');

    if (!bomSelected.length) {
      alertError('선택된 BOM 이 없습니다.\n결과값 추출 화면에서 BOM 을 먼저 선택해 주세요.');
      return;
    }
    if (!coordSelected.length) {
      alertError('선택된 좌표데이터가 없습니다.\n결과값 추출 화면에서 좌표데이터를 먼저 선택해 주세요.');
      return;
    }
    if (bomSelected.length > 1) {
      alert('지금은 BOM 1개 기준으로만 처리합니다.\n여러 개가 선택된 경우 첫 번째 BOM만 사용합니다.');
    }

    const bomMeta = bomSelected[0];

    if (!bomMeta.parsedBOM || !bomMeta.parsedBOM.bomRows) {
      alertError('선택된 BOM에 파싱된 데이터(parsedBOM)가 없습니다.\nBOM 등록 시 smt_extract.js 쪽 파싱 로직을 확인해 주세요.');
      return;
    }

    // 좌표데이터 Map 통합
    const coordMaps = [];
    for (const meta of coordSelected) {
      if (!meta.coordMap) {
        alertError('일부 좌표데이터에 coordMap 정보가 없습니다.\n좌표데이터 등록 시 파싱이 잘 되었는지 확인해 주세요.');
        return;
      }
      const sideFromFile = inferSideFromName(meta.name || '');
      const normalized   = normalizeCoordMap(meta.coordMap, sideFromFile);
      coordMaps.push(normalized);
    }

    const coordMap = mergeCoordMaps(coordMaps);
    const bomParsed = bomMeta.parsedBOM;

    // 헤더 (Package-Specification 제거)
    const header = formatLine('Reference', 'X', 'Y', 'Rot', 'Side');

    const topLines = [header];
    const botLines = [header];

    // BOM 기준으로 레퍼런스 하나씩 순회
    bomParsed.bomRows.forEach(b => {
      b.refs.forEach(ref => {
        const coord = coordMap.get(ref);
        if (!coord) return;  // 좌표 없는 항목은 스킵

        const side = (coord.side || 'Top').toString();

        const line = formatLine(
          ref,
          coord.x ?? '',
          coord.y ?? '',
          coord.rot ?? '',
          side
        );

        if (side.toLowerCase() === 'bot') {
          botLines.push(line);
        } else {
          topLines.push(line);  // side 가 없거나 Top 이면 Top 으로
        }
      });
    });

    if (topLines.length <= 1 && botLines.length <= 1) {
      alertError('Top/Bot 데이터가 없습니다. txt 파일을 만들 수 없습니다.');
      return;
    }

    const baseName = (bomMeta.name || 'SMT_RESULT').replace(/\.[^.]+$/, '');
    const now = new Date();

    const created = [];

    // Top TXT
    if (topLines.length > 1) {
      const txtTop = topLines.join('\r\n');
      const blobTop = new Blob([txtTop], { type: 'text/plain;charset=utf-8' });
      const nameTop = `${baseName}_TOP.txt`;
      triggerDownload(blobTop, nameTop);
      created.push({ kind: 'TXT_TOP', blob: blobTop, name: nameTop });
    }

    // Bot TXT
    if (botLines.length > 1) {
      const txtBot = botLines.join('\r\n');
      const blobBot = new Blob([txtBot], { type: 'text/plain;charset=utf-8' });
      const nameBot = `${baseName}_BOT.txt`;
      triggerDownload(blobBot, nameBot);
      created.push({ kind: 'TXT_BOT', blob: blobBot, name: nameBot });
    }

    // 결과값 리스트(extractLib)에도 등록
    if (created.length && global.extractLib && typeof global.extractLib.save === 'function') {
      const list = global.extractLib.all();
      created.forEach(f => {
        list.push({
          id: f.kind + '_' + now.getTime() + '_' + Math.random().toString(16).slice(2),
          kind: f.kind,                 // TXT_TOP / TXT_BOT
          name: f.name,
          size: f.blob.size,
          type: 'text/plain',
          savedAt: now.toISOString(),
          updatedAt: now.toISOString()
        });
      });
      global.extractLib.save(list);

      if (typeof global.renderExtractSelectedTable === 'function') {
        try { global.renderExtractSelectedTable(); }
        catch (e) { console.warn('RESULT txt 테이블 갱신 중 오류:', e); }
      }
    }

    alert("TXT 파일의 정렬이 맞게 보이려면\n메모장에서 글꼴을 Courier New로 변경해주세요.\n\n메모장 → 서식 → 글꼴 → Courier New");
  }

  // 전역 export
  global.SMTText = {
    runFromSelectedToTxt
  };

})(window);
