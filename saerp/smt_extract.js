// smt_extract.js
// 결과값 추출 엔진 (서버/파일창 없이, 미리 파싱된 데이터만 사용)

(function (global) {

  function alertError(msg) {
    console.error(msg);
    alert(msg);
  }

  // ---------- 공통: 헤더 행 찾기 ----------
  function findHeaderRow(aoa, headers) {
    for (let r = 0; r < aoa.length; r++) {
      const row = aoa[r];
      const map = {};
      row.forEach((v, c) => {
        if (typeof v === 'string') map[v.trim()] = c;
      });

      let ok = true;
      for (const key in headers) {
        if (!(headers[key] in map)) { ok = false; break; }
      }
      if (ok) {
        const colMap = {};
        for (const key in headers) colMap[key] = map[headers[key]];
        return { headerRow: r, colMap };
      }
    }
    return null;
  }

  // ---------- 공통: Reference 문자열 정규화 ----------
  function normalizeRef(ref) {
    return String(ref == null ? '' : ref)
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  // ---------- 좌표에서 제외할 Ref 판별 ----------
  //  - PCB
  //  - FM1~FM4
  //  - 이름에 ARRAY / ARRAY1 등 포함
  // ---------- 좌표에서 제외할 Ref 판별 ----------
//  - PCB
//  - FM1~FM4
//  - 이름에 ARRAY / ARRAY1 등 포함
//  - UNAME (헤더용, 미삽/좌표결과에 필요 없음)
function isCoordExcludedRef(ref) {
  const r = normalizeRef(ref);
  if (!r) return false;

  if (r === 'PCB') return true;
  if (r === 'UNAME') return true;   // 👈 추가

  const m = /^FM(\d+)/.exec(r);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 4) return true;
  }

  if (r.includes('ARRAY')) return true;

  return false;
}

  // ---------- BOM 파싱 ----------
  function parseBOMWorkbook(wb) {
    const wantHeaders = {
      spec: 'Specification(제품 용량값)',
      pkg:  'Package(제품 사이즈)',
      ref:  'Reference(제품 위치값)'
    };

    let sheet, aoa, headerInfo;
    for (const name of wb.SheetNames) {
      const ws  = wb.Sheets[name];
      const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const info = findHeaderRow(arr, wantHeaders);
      if (info) {
        sheet      = ws;
        aoa        = arr;
        headerInfo = info;
        break;
      }
    }
    if (!sheet || !headerInfo) {
      throw new Error(
        'BOM 시트에서 [Specification(제품 용량값) / Package(제품 사이즈) / Reference(제품 위치값)] 헤더를 찾지 못했습니다.'
      );
    }

    const { headerRow, colMap } = headerInfo;
    const rows = [];
    const summaryBySpec = new Map();
    const allRefsSet = new Set();

    for (let r = headerRow + 1; r < aoa.length; r++) {
      const row    = aoa[r];
      const spec   = String(row[colMap.spec] || '').trim();
      const pkg    = String(row[colMap.pkg]  || '').trim();
      const refStr = String(row[colMap.ref]  || '');

      if (!spec && !pkg && !refStr.trim()) continue;

      // "C17,C18" → ["C17","C18"] → normalizeRef 적용
      const refs = refStr
        .split(',')
        .map(s => normalizeRef(s))
        .filter(Boolean);

      const qty  = refs.length || 0;
      const pkgSpec = (spec && pkg) ? `${pkg}-${spec}` : (pkg || spec || '');

      rows.push({ spec, pkg, refs, pkgSpec, qty });

      if (spec) {
        const prev = summaryBySpec.get(spec) || 0;
        summaryBySpec.set(spec, prev + qty);
      }

      // 전체 Ref 집합에도 정규화된 값으로 추가
      refs.forEach(rf => {
        if (!isCoordExcludedRef(rf)) {
          allRefsSet.add(normalizeRef(rf));
        }
      });
    }

    const summaryList = [...summaryBySpec.entries()]
      .map(([spec, qty]) => ({ spec, qty }));

    return { bomRows: rows, summaryList, allRefsSet };
  }

  // ---------- 파일명에서 Top/Bot 추정 ----------
  function inferSideFromName(fileName) {
    if (!fileName) return '';
    const lower = fileName.toLowerCase();

    if (lower.includes('top')) return 'Top';
    if (lower.includes('bot')) return 'Bot';
    return '';
  }

  // ---------- 좌표 파싱 ----------
  function parseCoordWorkbook(wb, options) {
    const fileName    = options && options.fileName ? options.fileName : '';
    const defaultSide = inferSideFromName(fileName);  // 이 파일이 Top인지 Bot인지

    const requiredHeaders = {
      ref: 'Uname',
      x:   'X 좌표',
      y:   'Y 좌표',
      rot: '회전'
    };

    let sheet, aoa, headerInfo;

    for (const name of wb.SheetNames) {
      const ws  = wb.Sheets[name];
      const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const info = findHeaderRow(arr, requiredHeaders);
      if (info) {
        sheet      = ws;
        aoa        = arr;
        headerInfo = info;
        break;
      }
    }
    if (!sheet || !headerInfo) {
      throw new Error('좌표 시트에서 [Uname / X 좌표 / Y 좌표 / 회전] 헤더를 찾지 못했습니다.');
    }

    const { headerRow, colMap } = headerInfo;
    const coordMap = new Map();

    for (let r = headerRow + 1; r < aoa.length; r++) {
      const row = aoa[r];

      const rawRef = row[colMap.ref];
      const ref    = normalizeRef(rawRef);
      if (!ref) continue;

      const x   = row[colMap.x];
      const y   = row[colMap.y];
      const rot = row[colMap.rot];

      coordMap.set(ref, {
        x,
        y,
        rot,
        side: defaultSide   // 이 파일에서 온 좌표는 전부 Top 또는 Bot
      });
    }

    return coordMap;
  }

  // ---------- 여러 coordMap 합치기 ----------
  function mergeCoordMaps(maps) {
    const merged = new Map();

    for (const m of maps) {
      if (!m) continue;

      if (m instanceof Map) {
        for (const [ref, data] of m.entries()) {
          const normRef = normalizeRef(ref);
          if (!normRef) continue;
          if (!merged.has(normRef)) merged.set(normRef, data);
        }
      } else {
        // Object 타입까지 대비
        for (const [ref, data] of Object.entries(m)) {
          const normRef = normalizeRef(ref);
          if (!normRef) continue;
          if (!merged.has(normRef)) merged.set(normRef, data);
        }
      }
    }

    return merged;
  }

  // ---------- coordMap 안에 데이터가 있는지 체크 ----------
  function hasCoordData(raw) {
    if (!raw) return false;
    if (raw instanceof Map) return raw.size > 0;
    if (typeof raw === 'string') {
      try {
        const obj = JSON.parse(raw);
        return obj && Object.keys(obj).length > 0;
      } catch (e) {
        return false;
      }
    }
    if (typeof raw === 'object') {
      return Object.keys(raw).length > 0;
    }
    return false;
  }

  // ---------- coordMap 정규화 ----------
  function normalizeCoordMap(raw, sideFromFile) {
    let m = raw;

    // JSON 문자열인 경우
    if (typeof m === 'string') {
      try {
        m = JSON.parse(m);
      } catch (e) {
        console.warn('coordMap JSON 파싱 실패:', e);
        return new Map();
      }
    }

    // Map이면 키/side 를 정규화해서 새 Map으로
    if (m instanceof Map) {
      const out = new Map();
      for (const [ref, data] of m.entries()) {
        if (!data || typeof data !== 'object') continue;
        const d = { ...data };
        if (sideFromFile && !d.side) d.side = sideFromFile;
        const normRef = normalizeRef(ref);
        if (!normRef) continue;
        if (!out.has(normRef)) out.set(normRef, d);
      }
      return out;
    }

    // Object면 키/값 보정 후 Map으로 변환
    if (m && typeof m === 'object') {
      const out = new Map();
      for (const [ref, data] of Object.entries(m)) {
        if (!data || typeof data !== 'object') continue;
        const d = { ...data };
        if (sideFromFile && !d.side) d.side = sideFromFile;
        const normRef = normalizeRef(ref);
        if (!normRef) continue;
        if (!out.has(normRef)) out.set(normRef, d);
      }
      return out;
    }

    // 그 외 타입이면 빈 Map
    return new Map();
  }

  // ---------- 결과값 생성 ----------
  async function runFromSelected() {
    try {
      const allSelected = (global.extractLib && global.extractLib.all)
        ? global.extractLib.all()
        : [];

      const bomSelected   = allSelected.filter(x => x.kind === 'BOM');
      const coordSelected = allSelected.filter(x => x.kind === 'COORD');

      if (!bomSelected.length) {
        alertError('결과값 추출: 선택된 BOM이 없습니다.\n먼저 BOM 선택 모달에서 선택해 주세요.');
        return;
      }
      if (!coordSelected.length) {
        alertError('결과값 추출: 선택된 좌표데이터가 없습니다.\n먼저 좌표데이터 선택 모달에서 선택해 주세요.');
        return;
      }
      if (bomSelected.length > 1) {
        alert('현재는 BOM 한 개만 처리합니다.\n여러 개가 선택된 경우 첫 번째 것만 사용합니다.');
      }

      const bomMeta   = bomSelected[0];
      const bomParsed = bomMeta.parsedBOM;

      if (!bomParsed) {
        alertError('선택된 BOM에 파싱된 데이터가 없습니다.\nBOM 등록 시 SMTExtract.parseBOMWorkbook()으로 미리 파싱해서 저장해 주세요.');
        return;
      }

      // ✅ BOM 전체 Ref 집합(Set) 재구성 (제외 대상 빼고)
      const bomAllRefsSet = (() => {
        const set = new Set();

        const raw = bomParsed.allRefsSet;
        if (raw instanceof Set) {
          for (const r of raw) {
            const k = normalizeRef(r);
            if (k && !isCoordExcludedRef(k)) set.add(k);
          }
        } else if (Array.isArray(raw)) {
          raw.forEach(r => {
            const k = normalizeRef(r);
            if (k && !isCoordExcludedRef(k)) set.add(k);
          });
        } else if (raw && typeof raw === 'object') {
          Object.keys(raw).forEach(r => {
            const k = normalizeRef(r);
            if (k && !isCoordExcludedRef(k)) set.add(k);
          });
        }

        if (Array.isArray(bomParsed.bomRows)) {
          bomParsed.bomRows.forEach(b => {
            if (Array.isArray(b.refs)) {
              b.refs.forEach(r => {
                const k = normalizeRef(r);
                if (k && !isCoordExcludedRef(k)) set.add(k);
              });
            }
          });
        }

        return set;
      })();

      // ----- 좌표데이터 정규화 + Top/Bot 인덱스 구성 -----
      const coordMaps  = [];
      const topMap     = new Map();   // Top 좌표만
      const botMap     = new Map();   // Bot 좌표만
      const unknownMap = new Map();   // 면 정보 없는 것들

      // 좌표파일 한 개를 “무조건” 읽어서 Map 으로 만드는 함수
      async function getCoordMapFromMeta(meta) {
        const sideFromFile = inferSideFromName(meta.name || '');

        // 1) coordMap 이 이미 있고, 안 비어 있으면 그대로 사용
        if (hasCoordData(meta.coordMap)) {
          console.log('[기존 coordMap 사용]', meta.name);
          return normalizeCoordMap(meta.coordMap, sideFromFile);
        }

        // 2) blobUrl 이 있으면 항상 우선적으로 엑셀을 다시 읽어서 파싱
        if (meta.blobUrl) {
          try {
            const res = await fetch(meta.blobUrl);
            const buf = await res.arrayBuffer();
            const wb  = XLSX.read(new Uint8Array(buf), { type: 'array' });

            const parsedMap = parseCoordWorkbook(wb, { fileName: meta.name });
            console.log(
              '[좌표 파싱 성공]', meta.name,
              'entries =', parsedMap.size
            );

            // 캐시로 저장 (선택사항)
            meta.coordMap = Object.fromEntries(parsedMap);
            if (global.extractLib && typeof global.extractLib.save === 'function') {
              global.extractLib.save();
            }

            return normalizeCoordMap(parsedMap, sideFromFile);
          } catch (e) {
            console.error('좌표파일 다시 읽기 실패:', meta.name, e);
            alertError('좌표파일을 다시 읽는 중 오류가 발생했습니다: ' + meta.name);
          }
        }

        // 3) blobUrl 이 없거나 실패했는데 coordMap 만 있는 경우(비어있을 수도 있음)
        if (meta.coordMap) {
          console.warn('[blobUrl 없음, 기존 coordMap 시도]', meta.name);
          return normalizeCoordMap(meta.coordMap, sideFromFile);
        }

        // 4) 둘 다 없으면 빈 Map
        alertError('좌표데이터를 읽을 수 없습니다: ' + (meta.name || '알 수 없음'));
        return new Map();
      }

      // 실제로 모든 좌표파일을 읽어서 Top/Bot/Unknown 에 채우기
      for (const meta of coordSelected) {
        const normalized = await getCoordMapFromMeta(meta);

        for (const [ref, data] of normalized.entries()) {
          const key  = normalizeRef(ref);
          if (!key) continue;

          const side = (data && data.side) || inferSideFromName(meta.name || '');
          const obj  = { ...data, side: side || data.side || '' };

          if (side === 'Top') {
            topMap.set(key, obj);
          } else if (side === 'Bot') {
            botMap.set(key, obj);
          } else {
            unknownMap.set(key, obj);
          }
        }

        coordMaps.push(normalized);
      }

      console.log(
        'Top size =', topMap.size,
        'Bot size =', botMap.size,
        'Unknown size =', unknownMap.size
      );

      // 전체 좌표 Map (미삽 추출용)
      const coordMap = mergeCoordMaps(coordMaps);

      console.log('coordMap size =', coordMap.size);
      console.log('coord keys sample =', [...coordMap.keys()].slice(0, 20));

      // ref 기준으로 Top → Bot → Unknown 순서로 좌표 찾기
      function findCoordByPriority(ref) {
        const key = normalizeRef(ref);
        if (topMap.has(key))     return topMap.get(key);
        if (botMap.has(key))     return botMap.get(key);
        if (unknownMap.has(key)) return unknownMap.get(key);
        return null;
      }

      // ----- 결과 시트 데이터 생성 -----
      const resultHeader = [
        'No.',
        'Reference(제품 위치값)',
        '좌표값 X축',
        '좌표값 Y축',
        '좌표값 회전',
        'Package-Specification',
        'Top/Bot'
      ];
      const resultRows = [resultHeader];
      const dataRows   = [];

      let matchCount = 0;
      let missCount  = 0;

      bomParsed.bomRows.forEach(b => {
        b.refs.forEach(ref => {
          // PCB / FM1~4 / ARRAY 계열은 좌표 추출에서 완전히 제외
          if (isCoordExcludedRef(ref)) return;

          const coord = findCoordByPriority(ref);
          if (coord) matchCount++; else missCount++;

          dataRows.push([
            0,            // 일단 0으로 두고, 나중에 정렬 후 다시 번호 매김
            ref,
            coord ? coord.x   : '',
            coord ? coord.y   : '',
            coord ? coord.rot : '',
            b.pkgSpec,
            coord ? coord.side: ''
          ]);
        });
      });

      // Top / Bot / Unknown 순으로 정렬 + 같은 면에서는 Reference 순 정렬
      const sideRank = (side) => {
        if (side === 'Top') return 0;
        if (side === 'Bot') return 1;
        return 2;
      };

      dataRows.sort((a, b) => {
        const rankA = sideRank(a[6]);
        const rankB = sideRank(b[6]);
        if (rankA !== rankB) return rankA - rankB;

        // 같은 면이라면 Reference(열 1) 기준 정렬 (C1, C2, R10 …)
        return String(a[1]).localeCompare(String(b[1]), 'en', { numeric: true });
      });

      // 정렬 후 No. 다시 1부터
      dataRows.forEach((row, idx) => {
        row[0] = idx + 1;
      });

      resultRows.push(...dataRows);

      console.log('좌표 매칭 결과: match =', matchCount, ', miss =', missCount);

      // 제품 목록표 (BOM 전체 기준이므로 그대로 유지)
      const summaryHeader    = ['제품 목록표', '', ''];
      const summarySubHeader = ['Specification(제품 용량값)', '수량', '비고'];
      const summaryRows = [summaryHeader, summarySubHeader];
      bomParsed.summaryList.forEach(item => {
        summaryRows.push([item.spec, item.qty, '']);
      });

      // 미삽 추출 (좌표에는 있는데 BOM에는 없는 것)
      const missHeader = [
        'Reference(제품 위치값)',
        '좌표값 X축',
        '좌표값 Y축',
        '좌표값 회전',
        'Top/Bot'
      ];
      const missRows = [missHeader];

      for (const [ref, coord] of coordMap.entries()) {
        const key = normalizeRef(ref);
        // 제외 대상은 여기서도 빼기
        if (isCoordExcludedRef(key)) continue;

        if (!bomAllRefsSet.has(key)) {
          missRows.push([
            ref,
            coord.x,
            coord.y,
            coord.rot,
            coord.side
          ]);
        }
      }

      // ----- 엑셀 워크북 만들기 -----
      const wbOut = XLSX.utils.book_new();

      // 시트1: 결과값 추출
      const wsResult = XLSX.utils.aoa_to_sheet(resultRows);
      wsResult['!cols'] = [
        { wch: 5  },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 30 },
        { wch: 8  }
      ];
      XLSX.utils.book_append_sheet(wbOut, wsResult, '결과값 추출');

      // 시트2: 제품 목록표
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [
        { wch: 30 },
        { wch: 8  },
        { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(wbOut, wsSummary, '제품 목록표');

      // 시트3: 미삽 추출
      const wsMiss = XLSX.utils.aoa_to_sheet(missRows);
      wsMiss['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 8  }
      ];
      XLSX.utils.book_append_sheet(wbOut, wsMiss, '미삽 추출');

            const baseName = (bomMeta.name || 'SMT_RESULT').replace(/\.[^.]+$/, '');
      const fileName = baseName + '_결과_미삽.xlsx';

      // ----- Blob 생성 + 다운로드 -----
            // ----- Blob 생성 + 다운로드 + RESULT 리스트 등록 -----
      const wbArray = XLSX.write(wbOut, { bookType: 'xlsx', type: 'array' });
      const blob    = new Blob(
        [wbArray],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      // 1) 사용자에게 다운로드
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // 2) 결과값 목록(extractLib)에 RESULT 항목 추가
      if (global.extractLib && typeof global.extractLib.add === 'function') {
        const now = new Date();
        const meta = {
          id: 'RESULT_' + now.getTime(),
          kind: 'RESULT',
          name: fileName,
          size: blob.size,
          savedAt: now.toISOString(),
          updatedAt: now.toISOString(),
          blobUrl: null   // 필요하면 URL.createObjectURL(blob) 써도 됨
        };
        global.extractLib.add(meta);
      }

      // 3) 결과값 추출 화면이 열려 있다면 바로 테이블 갱신
      if (global.renderExtractSelectedTable) {
        try {
          global.renderExtractSelectedTable();
        } catch (e) {
          console.warn('RESULT 테이블 갱신 중 오류:', e);
        }
      }

      alert('결과값 엑셀 파일을 다운로드 했습니다.\n\n파일 이름: ' + fileName);

    } catch (err) {
      console.error(err);
      alertError('결과값 생성 중 오류가 발생했습니다.\n콘솔 로그를 확인해 주세요.\n\n' + err.message);
    }
  }

  // 전역 export
  global.SMTExtract = {
    runFromSelected,
    parseBOMWorkbook,
    parseCoordWorkbook,
  };

})(window);