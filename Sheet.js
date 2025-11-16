function centerAllCells(ws) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddr];
      if (!cell || typeof cell !== 'object') continue;

      cell.s = cell.s || {};
      cell.s.alignment = { horizontal: "center", vertical: "center" };
    }
  }
}

// 시트 만든 뒤에 호출
centerAllCells(wsResult);
centerAllCells(wsSummary);
centerAllCells(wsMiss);
