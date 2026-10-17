// sim-export.js — the scenarios of the load simulation as one Excel workbook (8.56.0).
//
// The scenarios live in the viewer — the project's from the overrides file, the architect's in the browser —
// and so does the physical carrier the node transit is folded over, so the export is built in the page:
// this module is pure (no DOM, no I/O) and the viewer hands it the model, the scenarios and a `run` that
// returns each scenario's result and transit. An .xlsx is a ZIP of XML parts; a ZIP whose entries are
// stored, not deflated, needs no library — a CRC-32 and three record shapes — so the viewer stays
// dependency-free. Cells are inline strings and numbers (no shared-string table), one bold style for
// headings, a frozen first row where a sheet is one table.
//
// Sheets: a summary (one row per scenario), the documented inputs (demand, capacity, metered nodes and
// prices), a comparison of ρ, load and bytes per container across scenarios, then one sheet per
// scenario — demand as run, assumptions, instances, findings, node transit, latency. Column headers are
// in the document's language; ids, units and status words never localize.
//
// One implementation for two readers: the viewer (inlined by render.js as window.SimExport) and the tests.
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.SimExport = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- ZIP, stored entries
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const enc = (s) => new TextEncoder().encode(s);
  const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1, DOS_TIME = 0;   // a fixed stamp: the workbook is reproducible for the same inputs

  /** files: [{ name, data: string | Uint8Array }] → the ZIP bytes (method 0, UTF-8 names) */
  function zip(files) {
    const parts = [], central = []; let offset = 0;
    files.forEach((f) => {
      const name = enc(f.name), data = typeof f.data === 'string' ? enc(f.data) : f.data, crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, DOS_TIME, true); lh.setUint16(12, DOS_DATE, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true); cd.setUint16(12, DOS_TIME, true); cd.setUint16(14, DOS_DATE, true);
      cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true); cd.setUint16(30, 0, true); cd.setUint16(32, 0, true); cd.setUint16(34, 0, true); cd.setUint16(36, 0, true); cd.setUint32(38, 0, true); cd.setUint32(42, offset, true);
      central.push(new Uint8Array(cd.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true); eocd.setUint16(4, 0, true); eocd.setUint16(6, 0, true); eocd.setUint16(8, files.length, true); eocd.setUint16(10, files.length, true); eocd.setUint32(12, cdSize, true); eocd.setUint32(16, offset, true); eocd.setUint16(20, 0, true);
    const all = parts.concat(central, [new Uint8Array(eocd.buffer)]);
    const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0)); let o = 0; all.forEach((p) => { out.set(p, o); o += p.length; });
    return out;
  }

  // ---------------------------------------------------------------- XLSX
  // the control characters XML forbids, as an escaped string: a regex literal with \u0000 is emitted by Bun's transpiler as a real NUL byte, which truncates the module
  const CONTROL = new RegExp('[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]', 'g');
  const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(CONTROL, '');
  const colName = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  /** a sheet name Excel accepts: no []:*?/\, at most 31 characters, unique in the workbook */
  function sheetName(name, taken) {
    let base = String(name || 'Sheet').replace(/[\[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31).trim() || 'Sheet';
    let out = base, k = 2;
    while (taken.has(out.toLowerCase())) { const suf = ' (' + k++ + ')'; out = base.slice(0, 31 - suf.length).trim() + suf; }
    taken.add(out.toLowerCase());
    return out;
  }
  const autoWidths = (rows, n) => { const w = new Array(n).fill(8); rows.forEach((r) => r.forEach((c, i) => { if (c && typeof c === 'object' && c.fmt === 'wrap') return; const v = c && typeof c === 'object' && 'v' in c ? c.v : c; const len = v == null ? 0 : typeof v === 'number' ? Math.min(12, String(Math.round(v * 100) / 100).length + 1) : String(v).length + 1; w[i] = Math.max(w[i], Math.min(44, len)); })); return w; };   // capped: a sheet stacks blocks with different columns, and one long cell must not widen a whole column
  /** rows: cells are numbers, strings, booleans, null, or { v, bold } */
  function sheetXml(sheet) {
    const rows = sheet.rows || []; let maxCols = 0;
    const body = rows.map((r, ri) => {
      maxCols = Math.max(maxCols, r.length);
      const cells = r.map((c, ci) => {
        const v = c && typeof c === 'object' && 'v' in c ? c.v : c, sx = c && typeof c === 'object' ? (c.bold ? 1 : STYLE_OF[c.fmt] || 0) : 0, st = sx ? ' s="' + sx + '"' : '';
        if (v == null || v === '') return '';
        const ref = colName(ci) + (ri + 1);
        if (typeof v === 'number') return Number.isFinite(v) ? '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>' : '<c r="' + ref + '" t="inlineStr"' + st + '><is><t>' + (v > 0 ? '∞' : v < 0 ? '-∞' : 'NaN') + '</t></is></c>';
        if (typeof v === 'boolean') return '<c r="' + ref + '" t="b"' + st + '><v>' + (v ? 1 : 0) + '</v></c>';
        return '<c r="' + ref + '" t="inlineStr"' + st + '><is><t xml:space="preserve">' + xml(v) + '</t></is></c>';
      }).join('');
      const ht = sheet.heights && sheet.heights[ri] ? ' ht="' + sheet.heights[ri] + '" customHeight="1"' : '';   // a merged paragraph never auto-fits: its height is stated
      return cells ? '<row r="' + (ri + 1) + '"' + ht + '>' + cells + '</row>' : '';
    }).join('');
    const widths = sheet.widths || autoWidths(rows, maxCols);
    const cols = widths.length ? '<cols>' + widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' : '';
    const view = sheet.freeze ? '<sheetView workbookViewId="0"><pane ySplit="' + sheet.freeze + '" topLeftCell="A' + (sheet.freeze + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView>' : '<sheetView workbookViewId="0"/>';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews>' + view + '</sheetViews>' + cols + '<sheetData>' + body + '</sheetData>' + (sheet.merges && sheet.merges.length ? '<mergeCells count="' + sheet.merges.length + '">' + sheet.merges.map(([ri, a, b]) => '<mergeCell ref="' + colName(a) + (ri + 1) + ':' + colName(b) + (ri + 1) + '"/>').join('') + '</mergeCells>' : '') + '</worksheet>';
  }
  // cell styles by index: 1 bold · 2 two decimals · 3 thousands · 4 percent · 5 one decimal · 6 wrapped paragraph — a cell { v, fmt } picks one
  // 7–12 paint a cell like the stage — ok green · warn amber · crit red · pending violet · info blue · down grey; 13–15 a percent painted the same way
  const STYLE_OF = { n2: 2, int: 3, pct: 4, n1: 5, wrap: 6, ok: 7, warn: 8, crit: 9, pending: 10, info: 11, down: 12, pctok: 13, pctwarn: 14, pctcrit: 15 };
  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC6EFCE"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFEB9C"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFC7CE"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE4DFEC"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDDEBF7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="16"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="5" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="6" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="7" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="9" fontId="0" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/><xf numFmtId="9" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/><xf numFmtId="9" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  /** sheets: [{ name, rows, widths?, freeze? }] → the .xlsx bytes */
  function workbook(sheets) {
    const taken = new Set(); const named = sheets.map((s) => Object.assign({}, s, { name: sheetName(s.name, taken) }));
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + named.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + named.map((s, i) => '<sheet name="' + xml(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + named.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (named.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: STYLES },
    ].concat(named.map((s, i) => ({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s) })));
    return zip(files);
  }

  // ---------------------------------------------------------------- the workbook of a simulation, written for a reader
  // Not the model's fields: what happened, in the document's language — a reading per scenario (a paragraph and the
  // findings as sentences), a summary with counts and money, a comparison across scenarios, the documented data, and
  // one detail sheet per scenario with human labels, utilization as a percentage, traffic in MB/s, sizes in KB.
  const L = {
    en: {
      reading: 'Reading', summary: 'Summary', compare: 'Comparison', inputs: 'Documented data',
      src: { project: 'a scenario of the project (overrides file)', browser: 'a scenario saved in this browser', base: 'the documented base, no assumption', current: 'the scenario on the stage, not saved' },
      status: { ok: 'Comfortable', warn: 'At limit', crit: 'Saturated', grey: 'Capacity pending', idle: 'No load', down: 'Down' },
      all: 'all', yes: 'yes', no: 'no', rps: 'rps', sessions: 'sessions', notDocumented: 'Not documented', phase: 'phase', none: '—',
      cState: 'Overall state', cEntering: 'Load entering the system', level: { cut: 'Critical', crit: 'Critical', warn: 'Warning', grey: 'Pending', info: 'Information' }, hLevel: 'Level', hReceives: 'Receives', hSends: 'Sends', hTrafficIn: 'Traffic in', hTrafficOut: 'Traffic out', pendingShort: 'pending', hGlance: 'At a glance', gWhat: 'What to look at', gFigure: 'Figure', gState: 'State', gState0: 'Overall state', gEntering: 'Load entering the system', gTop: 'Most loaded container', gBreaks: 'First to break as the load grows', gNoBreak: 'nothing sized breaks', gEdge: 'Traffic through {node}', gEdgePending: 'no figure yet — {n} receiver(s) on its chain state no size', gPending: 'Containers not yet sized', gPendingN: '{n} receive load and are not evaluated',
      cScenario: 'Scenario', cWhat: 'What it is', cScale: 'Scale', cMetrics: 'Metrics shown', cSaturated: 'Saturated', cAtLimit: 'At limit', cPending: 'Capacity pending', cInterrupted: 'Interrupted', cBreaks: 'Breaks first', cBreakAt: 'At scale', cGb: 'Metered traffic (GB / month)', cCost: 'Metered cost / month', cNote: 'Note',
      nScale: 'Scenario "{name}" at ×{s} of the documented demand, threshold {t}.', nNone: 'No sized container is over the threshold.', nSat: '{n} saturated: {list}.', nLim: '{n} at limit: {list}.', nGrey: '{n} receive load and are not sized: {list}.', nCut: 'Interrupted at {list}.', nBreak: 'The first to break as the load grows is {c}, at ×{b}.', nMet: 'Traffic-billed: {list}.', nBytesPending: '{n} receiver(s) state no size, so the traffic figures are a floor.',
      fChoke: '{c} is saturated (utilization {rho}): it receives {load} with {rep} replica(s).', fLimit: '{c} is at limit (utilization {rho}, threshold {t}): it receives {load} with {rep} replica(s).', aNeed: '{n} replicas would bring it to {after}.', aLimit: 'It would need {n} replicas, above its maximum of {m}.', fGrey: '{c} receives {load} and is not evaluated: its Capacity table lacks {missing}.', aGrey: 'Add the row to its descriptor, or assume a figure in the scenario.', fMismatch: '{c} is sized in {g} and receives only {r}.', aMismatch: 'A row in {g} closes it.', fCut: '{c} is down on every instance: {ucs} are not served beyond it.', aCut: 'Bring an instance back or route the use cases elsewhere.', fDemandGap: '{uc} has no demand row{p}: it loads nothing.', aDemandGap: 'Add its row to docs/08 § Demand by Use Case.', fBytesPending: 'No request or response size on {list}: the traffic on the paths they load is unknown, never zero.', aBytesPending: 'Add request_size and response_size to each Capacity table.', fMetered: '{node} sends {v}, about {gb} GB a month at ×{s}.', fMeteredPending: '{node} has no traffic figure yet: {n} receiver(s) on its chain state no request or response size ({list}).', aMeteredPending: 'Add request_size and response_size to those Capacity tables, or assume them in the scenario.', aCost: 'At {p} {cur}/GB that is about {c} {cur} a month ({src}; an assumption, not documentation).', aPending: '{n} receiver(s) on its chain state no size, so this is a floor: {list}.',
      hDemand: 'Demand', hUseCase: 'Use case', hDemandNow: 'Demand in this scenario', hDocumented: 'Documented', hPeak: 'Peak factor', hSource: 'Source', hChanged: 'Changed here', hActive: 'Active',
      hAssumptions: 'Assumptions of this scenario', hContainer: 'Container', hDownOn: 'Down on',
      hInstances: 'Instances', hRuns: 'Runs on', hStatus: 'Status', hUtil: 'Utilization', hIn: 'Receives (rps)', hOut: 'Sends (rps)', hSess: 'Sessions held', hBytesIn: 'Traffic in (MB/s)', hBytesOut: 'Traffic out (MB/s)', hCapacity: 'Capacity', hBreakAt: 'Breaks at scale',
      hFindings: 'Findings', hWhatHappens: 'What happens', hWhere: 'Where', hFigure: 'Figure', hWhatToDo: 'What to do',
      hTransit: 'Traffic through the infrastructure', hNode: 'Node', hTrIn: 'Enters (MB/s)', hTrOut: 'Leaves (MB/s)', hBilled: 'Billed by the provider', hGb: 'GB / month', hCost: 'Cost / month', hPendingOn: 'Sizes pending on',
      hLatency: 'Latency', hTarget: 'Target', hWorst: 'Most loaded phase', hFactor: 'Stretch factor', hSaturated: 'Saturates',
      hCapTable: 'Capacity of every container', hCapPer: 'Capacity per replica', hReplicas: 'Replicas (min–max)', hReq: 'Request (KB)', hResp: 'Response (KB)', hSesTr: 'Per session (KB/s)', hMetered: 'Traffic-billed nodes', hDirection: 'Counts', hPrice: 'Price per GB',
      dirOut: 'what leaves it', dirIn: 'what enters it', dirBoth: 'both ways',
      cmpRho: 'Utilization per scenario (worst instance)', cmpLoad: 'Requests per second per scenario', cmpSess: 'Sessions per scenario', cmpBytes: 'Traffic out per scenario (MB/s)',
      fields: { capacityPerReplica: 'Capacity per replica (rps)', capacityPerReplicaSessions: 'Capacity per replica (sessions)', replicas: 'Replicas', maxReplicas: 'Max replicas', requestSize: 'Request size (KB)', responseSize: 'Response size (KB)', sessionTransfer: 'Transfer per session (KB/s)' },
      missing: { capacity_per_replica: 'capacity per replica', 'capacity_per_replica (sessions)': 'capacity per replica (sessions)', replicas: 'replicas', request_size: 'request size', response_size: 'response size' },
    },
    es: {
      reading: 'Lectura', summary: 'Resumen', compare: 'Comparación', inputs: 'Datos documentados',
      src: { project: 'un escenario del proyecto (archivo de overrides)', browser: 'un escenario guardado en este navegador', base: 'la base documentada, sin supuestos', current: 'el escenario en pantalla, sin guardar' },
      status: { ok: 'Holgado', warn: 'Al límite', crit: 'Saturado', grey: 'Pendiente de dimensionar', idle: 'Sin carga', down: 'Caída' },
      all: 'todas', yes: 'sí', no: 'no', rps: 'rps', sessions: 'sesiones', notDocumented: 'No documentado', phase: 'fase', none: '—',
      cState: 'Estado general', cEntering: 'Carga que entra al sistema', level: { cut: 'Crítico', crit: 'Crítico', warn: 'Aviso', grey: 'Pendiente', info: 'Información' }, hLevel: 'Nivel', hReceives: 'Recibe', hSends: 'Envía', hTrafficIn: 'Tráfico que entra', hTrafficOut: 'Tráfico que sale', pendingShort: 'pendiente', hGlance: 'De un vistazo', gWhat: 'Qué mirar', gFigure: 'Cifra', gState: 'Estado', gState0: 'Estado general', gEntering: 'Carga que entra al sistema', gTop: 'Contenedor más cargado', gBreaks: 'El primero en romper si la carga crece', gNoBreak: 'nada dimensionado rompe', gEdge: 'Tráfico por {node}', gEdgePending: 'sin cifra todavía — {n} receptor(es) de su cadena no declaran tamaño', gPending: 'Contenedores sin dimensionar', gPendingN: '{n} reciben carga y no se evalúan',
      cScenario: 'Escenario', cWhat: 'Qué es', cScale: 'Escala', cMetrics: 'Métricas mostradas', cSaturated: 'Saturados', cAtLimit: 'Al límite', cPending: 'Pendientes de dimensionar', cInterrupted: 'Interrumpidos', cBreaks: 'Rompe primero', cBreakAt: 'A escala', cGb: 'Tráfico facturado (GB / mes)', cCost: 'Costo facturado / mes', cNote: 'Nota',
      nScale: 'Escenario «{name}» a ×{s} de la demanda documentada, umbral {t}.', nNone: 'Ningún contenedor dimensionado supera el umbral.', nSat: '{n} saturado(s): {list}.', nLim: '{n} al límite: {list}.', nGrey: '{n} reciben carga sin estar dimensionados: {list}.', nCut: 'Interrumpido en {list}.', nBreak: 'El primero en romper cuando la carga crece es {c}, a ×{b}.', nMet: 'Facturado por tráfico: {list}.', nBytesPending: '{n} receptor(es) no declaran tamaño, así que las cifras de tráfico son un piso.',
      fChoke: '{c} está saturado (utilización {rho}): recibe {load} con {rep} réplica(s).', fLimit: '{c} está al límite (utilización {rho}, umbral {t}): recibe {load} con {rep} réplica(s).', aNeed: '{n} réplicas lo llevarían a {after}.', aLimit: 'Necesitaría {n} réplicas, por encima de su máximo de {m}.', fGrey: '{c} recibe {load} y no se evalúa: a su tabla de Capacidad le falta {missing}.', aGrey: 'Agrega la fila a su descriptor, o supón una cifra en el escenario.', fMismatch: '{c} está dimensionado en {g} y solo recibe {r}.', aMismatch: 'Una fila en {g} lo cierra.', fCut: '{c} está caído en todas sus instancias: {ucs} no se sirven más allá.', aCut: 'Levanta una instancia o enruta los casos de uso por otro lado.', fDemandGap: '{uc} no tiene fila de demanda{p}: no carga nada.', aDemandGap: 'Agrega su fila en docs/08 § Demanda por caso de uso.', fBytesPending: 'Sin tamaño de petición ni de respuesta en {list}: el tráfico de los trayectos que cargan es desconocido, nunca cero.', aBytesPending: 'Agrega request_size y response_size a cada tabla de Capacidad.', fMetered: '{node} envía {v}, unos {gb} GB al mes a ×{s}.', fMeteredPending: '{node} todavía no tiene cifra de tráfico: {n} receptor(es) de su cadena no declaran tamaño de petición ni de respuesta ({list}).', aMeteredPending: 'Agrega request_size y response_size a esas tablas de Capacidad, o supónlos en el escenario.', aCost: 'A {p} {cur}/GB son unos {c} {cur} al mes ({src}; un supuesto, no documentación).', aPending: '{n} receptor(es) de su cadena no declaran tamaño, así que es un piso: {list}.',
      hDemand: 'Demanda', hUseCase: 'Caso de uso', hDemandNow: 'Demanda en este escenario', hDocumented: 'Documentada', hPeak: 'Factor pico', hSource: 'Fuente', hChanged: 'Cambiada aquí', hActive: 'Activo',
      hAssumptions: 'Supuestos de este escenario', hContainer: 'Contenedor', hDownOn: 'Caída en',
      hInstances: 'Instancias', hRuns: 'Corre en', hStatus: 'Estado', hUtil: 'Utilización', hIn: 'Recibe (rps)', hOut: 'Envía (rps)', hSess: 'Sesiones sostenidas', hBytesIn: 'Tráfico que entra (MB/s)', hBytesOut: 'Tráfico que sale (MB/s)', hCapacity: 'Capacidad', hBreakAt: 'Rompe a escala',
      hFindings: 'Hallazgos', hWhatHappens: 'Qué pasa', hWhere: 'Dónde', hFigure: 'Cifra', hWhatToDo: 'Qué hacer',
      hTransit: 'Tráfico por la infraestructura', hNode: 'Nodo', hTrIn: 'Entra (MB/s)', hTrOut: 'Sale (MB/s)', hBilled: 'Lo factura el proveedor', hGb: 'GB / mes', hCost: 'Costo / mes', hPendingOn: 'Tamaños pendientes en',
      hLatency: 'Latencia', hTarget: 'Objetivo', hWorst: 'Fase más cargada', hFactor: 'Factor de estiramiento', hSaturated: 'Se satura',
      hCapTable: 'Capacidad de cada contenedor', hCapPer: 'Capacidad por réplica', hReplicas: 'Réplicas (mín–máx)', hReq: 'Petición (KB)', hResp: 'Respuesta (KB)', hSesTr: 'Por sesión (KB/s)', hMetered: 'Nodos facturados por tráfico', hDirection: 'Cuenta', hPrice: 'Precio por GB',
      dirOut: 'lo que sale', dirIn: 'lo que entra', dirBoth: 'ambos sentidos',
      cmpRho: 'Utilización por escenario (peor instancia)', cmpLoad: 'Peticiones por segundo por escenario', cmpSess: 'Sesiones por escenario', cmpBytes: 'Tráfico de salida por escenario (MB/s)',
      fields: { capacityPerReplica: 'Capacidad por réplica (rps)', capacityPerReplicaSessions: 'Capacidad por réplica (sesiones)', replicas: 'Réplicas', maxReplicas: 'Réplicas máximas', requestSize: 'Tamaño de petición (KB)', responseSize: 'Tamaño de respuesta (KB)', sessionTransfer: 'Transferencia por sesión (KB/s)' },
      missing: { capacity_per_replica: 'capacidad por réplica', 'capacity_per_replica (sessions)': 'capacidad por réplica (sesiones)', replicas: 'réplicas', request_size: 'tamaño de petición', response_size: 'tamaño de respuesta' },
    },
  };
  const H = (cells) => cells.map((c) => ({ v: c, bold: true }));
  const cell = (v, fmt) => (v == null ? null : { v, fmt });
  const pct = (rho) => cell(rho, 'pct'), n2 = (x) => cell(x == null ? null : Math.round(x * 100) / 100, 'n2'), int = (x) => cell(x == null ? null : Math.round(x), 'int'), wrap = (s) => ({ v: s, fmt: 'wrap' });
  const lit = (v, status) => (v == null ? null : { v, fmt: status });   // a cell painted like the stage: ok · warn · crit · pending · info · down
  const mb = (b) => (b == null ? null : b / 1e6), kb = (b) => (b == null ? null : b / 1e3);
  const fill = (s, m) => String(s).replace(/\{(\w+)\}/g, (_, k) => (m[k] == null ? '' : String(m[k])));
  const RANK = { down: 5, crit: 4, warn: 3, grey: 2, ok: 1, idle: 0 };
  const SEV_LIT = { cut: 'crit', crit: 'crit', warn: 'warn', grey: 'pending', info: 'info' };

  /**
   * ctx: { lang, project, version, date, model, scenarios: [{ name, scenario, source: 'project'|'browser'|'base'|'current', note }],
   *        run: (scenario) => { result, transit } }   — `run` is the viewer's: SIM.run plus SIM.transit over its carrier (transit may be null)
   * → sheets for workbook()
   */
  function compose(ctx) {
    const lang = ctx.lang === 'es' ? 'es' : 'en', T = L[lang], m = ctx.model;
    const name = (c) => (m.names && m.names[c]) || c, nodeName = (n) => (m.nodeNames && m.nodeNames[n]) || n;
    const num = (x, d) => (x == null ? T.none : new Intl.NumberFormat(lang === 'es' ? 'es-EC' : 'en-US', { maximumFractionDigits: d != null ? d : Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2 }).format(x));
    const bps = (b) => { b = b || 0; return b >= 1e5 ? num(b / 1e6) + ' MB/s' : b >= 100 ? num(b / 1e3) + ' KB/s' : num(b, 0) + ' B/s'; };
    const pctTxt = (rho) => (rho == null ? T.none : num(rho * 100, 0) + ' %');
    const unitTxt = (u) => (u === 'sessions' ? T.sessions : T.rps);
    const loadTxt = (v, u) => (v == null ? T.none : num(v, u === 'sessions' ? 0 : undefined) + ' ' + unitTxt(u));
    const rateTxt = (r, s) => [r ? loadTxt(r, 'rps') : '', s ? loadTxt(s, 'sessions') : ''].filter(Boolean).join(' · ') || T.none;   // what an instance receives or sends, both units in words
    const list = (xs, n) => (xs.length > (n || 4) ? xs.slice(0, n || 4).join(', ') + '…' : xs.join(', '));
    const ucCell = (id, p) => (p ? id + ' · F' + p : id);
    const month = lang === 'es' ? 'mes' : 'month';
    const runs = ctx.scenarios.map((s) => Object.assign({}, s, ctx.run(s.scenario)));
    const meteredOf = (R) => R.findings.filter((f) => f.kind === 'metered-transit' && (f.bytesPerSec > 0 || !(f.pending && f.pending.length)));   // a node with no sized hop on its chain has no figure, not a zero
    const what = (r) => T.src[r.source] || r.source;
    const worstStatus = (R) => R.instances.filter((i) => !i.virtual).reduce((w, i) => (RANK[i.down ? 'down' : i.status] > RANK[w] ? (i.down ? 'down' : i.status) : w), 'idle');
    const statusLit = (st) => (st === 'grey' ? 'pending' : st === 'idle' ? null : st);
    const statusCell = (st) => lit(T.status[st] || st, statusLit(st));
    // a finding as a sentence — what happens, where, the figure, what to do
    const sentence = (f, R) => {
      const where = f.nodes && f.nodes.length ? [...new Set(f.nodes)].map(nodeName).join(', ') : f.node ? nodeName(f.node) : null;
      const rep = f.replicas != null ? f.replicas + (f.instances > 1 ? ' × ' + f.instances : '') : T.none;
      if (f.kind === 'chokepoint' || f.kind === 'at-limit') return { what: fill(f.kind === 'chokepoint' ? T.fChoke : T.fLimit, { c: name(f.container), rho: pctTxt(f.rho), t: num(R.threshold, 2), load: loadTxt(f.load, f.unit), rep }), where, figure: pctTxt(f.rho), action: f.scaleLimit ? fill(T.aLimit, { n: f.needed, m: f.max }) : fill(T.aNeed, { n: f.needed, after: pctTxt(f.rhoAfter) }) };
      if (f.kind === 'not-documented') return { what: fill(T.fGrey, { c: name(f.container), load: rateTxt(f.lambda, f.sessions), missing: (f.missing || []).map((k) => T.missing[k] || k).join(' + ') }), where, figure: null, action: T.aGrey };
      if (f.kind === 'unit-mismatch') return { what: fill(T.fMismatch, { c: name(f.container), g: unitTxt(f.gauge), r: loadTxt(f.load, f.received) }), where, figure: null, action: fill(T.aMismatch, { g: unitTxt(f.gauge) }) };
      if (f.kind === 'interrupted') return { what: fill(T.fCut, { c: name(f.container), ucs: (f.useCases || []).join(', ') }), where, figure: null, action: T.aCut };
      if (f.kind === 'demand-gap') return { what: fill(T.fDemandGap, { uc: f.useCase, p: f.phase ? ' (' + T.phase + ' ' + f.phase + ')' : '' }), where: null, figure: null, action: T.aDemandGap };
      if (f.kind === 'bytes-pending') return { what: fill(T.fBytesPending, { list: (f.containers || []).map(name).join(', ') }), where: null, figure: null, action: T.aBytesPending };
      if (f.kind === 'metered-transit' && !f.bytesPerSec && f.pending && f.pending.length) return { what: fill(T.fMeteredPending, { node: nodeName(f.node), n: f.pending.length, list: f.pending.map(name).join(', ') }), where: null, figure: null, action: T.aMeteredPending };   // nothing sized on its chain: a zero would read as a bill of nothing
      if (f.kind === 'metered-transit') { const price = (m.pricing || {})[f.node] || {}; return { what: fill(T.fMetered, { node: nodeName(f.node), v: bps(f.bytesPerSec), gb: num(f.gbMonth, 0), s: num(f.scale, 2) }), where: null, figure: num(f.gbMonth, 0) + ' GB/' + month, action: [f.cost != null ? fill(T.aCost, { p: num(price.perGB, 3), cur: f.currency || '', c: num(f.cost, 0), src: f.priceSource || '' }) : '', f.pending && f.pending.length ? fill(T.aPending, { n: f.pending.length, list: f.pending.map(name).join(', ') }) : ''].filter(Boolean).join(' ') || null }; }
      return { what: f.kind, where, figure: null, action: null };
    };
    const level = (f) => lit(T.level[f.severity] || f.severity, SEV_LIT[f.severity] || null);
    // the paragraph a reader gets first
    const narration = (r) => {
      const R = r.result, F = R.findings, parts = [fill(T.nScale, { name: r.name, s: num(R.scenario.scale, 2), t: num(R.threshold, 2) })];
      const sat = F.filter((f) => f.kind === 'chokepoint'), lim = F.filter((f) => f.kind === 'at-limit'), grey = F.filter((f) => f.kind === 'not-documented'), cuts = F.filter((f) => f.kind === 'interrupted');
      if (cuts.length) parts.push(fill(T.nCut, { list: list(cuts.map((f) => name(f.container))) }));
      if (sat.length) parts.push(fill(T.nSat, { n: sat.length, list: list(sat.map((f) => name(f.container) + ' (' + pctTxt(f.rho) + ')')) }));
      if (lim.length) parts.push(fill(T.nLim, { n: lim.length, list: list(lim.map((f) => name(f.container) + ' (' + pctTxt(f.rho) + ')')) }));
      if (!sat.length && !lim.length) parts.push(T.nNone);
      if (grey.length) parts.push(fill(T.nGrey, { n: grey.length, list: list(grey.map((f) => name(f.container))) }));
      const b = R.breakpoints[0]; if (b) parts.push(fill(T.nBreak, { c: name(b.container), b: num(b.breakAt, b.breakAt < 10 ? 2 : 0) }));
      const met = meteredOf(R); if (met.length) parts.push(fill(T.nMet, { list: met.map((f) => nodeName(f.node) + ' ' + bps(f.bytesPerSec) + ' ≈ ' + num(f.gbMonth, 0) + ' GB/' + month + (f.cost != null ? ' ≈ ' + num(f.cost, 0) + ' ' + (f.currency || '') : '')).join('; ') }));
      const bp = F.find((f) => f.kind === 'bytes-pending'); if (bp) parts.push(fill(T.nBytesPending, { n: bp.containers.length }));
      return parts.join(' ');
    };
    const title = [ctx.project, ctx.version ? 'v' + ctx.version : null, ctx.date].filter(Boolean).join(' · ');
    const costTxt = (R) => { const met = meteredOf(R).filter((f) => f.cost != null); if (!met.length) return null; const cur = [...new Set(met.map((f) => f.currency).filter(Boolean))].join('/'); return num(met.reduce((s, f) => s + f.cost, 0), 0) + (cur ? ' ' + cur : ''); };
    const entering = (R) => { let rps = 0, ses = 0; R.useCases.filter((u) => u.active && u.value != null).forEach((u) => { if (u.unit === 'sessions') ses += u.value; else rps += u.value; }); return rateTxt(rps, ses); };
    // 1. the reading
    const reading = [[{ v: title, bold: true }], []];
    runs.forEach((r) => { reading.push([{ v: r.name, bold: true }], [wrap(what(r) + (r.note ? '. ' + r.note : ''))], [wrap(narration(r))]); r.result.findings.forEach((f) => { const s = sentence(f, r.result); reading.push([wrap('• ' + s.what + (s.action ? ' ' + s.action : ''))]); }); reading.push([]); });
    // 2. the summary — the overall state first, painted
    const summary = [[{ v: title, bold: true }], [], H([T.cScenario, T.cState, T.cWhat, T.cScale, T.cEntering, T.cSaturated, T.cAtLimit, T.cPending, T.cInterrupted, T.cBreaks, T.cBreakAt, T.cGb, T.cCost, T.cMetrics, T.cNote])];
    runs.forEach((r) => { const R = r.result, b = R.breakpoints[0], met = meteredOf(R);
      summary.push([r.name, statusCell(worstStatus(R)), what(r), n2(R.scenario.scale), entering(R), int(R.summary.chokepoints), int(R.summary.atLimit), int(R.summary.grey), int(R.summary.interrupted), b ? name(b.container) : null, b ? n2(b.breakAt) : null, met.length ? int(met.reduce((s, f) => s + f.gbMonth, 0)) : null, costTxt(R), Array.isArray(r.scenario.metrics) && r.scenario.metrics.length ? r.scenario.metrics.join(', ') : T.all, r.note || null]); });
    // 3. the comparison — containers × scenarios
    const cols = runs.map((r) => r.name);
    const worst = (R, c, f) => { const xs = R.instances.filter((i) => i.container === c && !i.down); return xs.length ? f(xs) : null; };
    const block = (label, f, wrapCell) => { const rows = [[{ v: label, bold: true }], H([T.hContainer].concat(cols))]; (m.containers || []).forEach((c) => { const vals = runs.map((r) => worst(r.result, c, f)); if (vals.some((v) => v != null && v !== 0)) rows.push([name(c)].concat(vals.map(wrapCell))); }); return rows; };
    const rhoCell = (v) => (v == null ? null : lit(v, v >= 1 ? 'crit' : v >= 0.7 ? 'warn' : 'ok'));
    const compare = [].concat(
      block(T.cmpRho, (xs) => { const v = xs.reduce((mx, i) => Math.max(mx, i.rho == null ? -1 : i.rho), -1); return v < 0 ? null : v; }, (v) => (v == null ? null : Object.assign(pct(v), { fmt: v >= 1 ? 'pctcrit' : v >= 0.7 ? 'pctwarn' : 'pctok' }))), [[]],
      block(T.cmpLoad, (xs) => xs.reduce((s, i) => s + i.lambda, 0), n2), [[]],
      block(T.cmpSess, (xs) => xs.reduce((s, i) => s + i.sessions, 0), int), [[]],
      block(T.cmpBytes, (xs) => mb(xs.reduce((s, i) => s + (i.bytesOut || 0), 0)), n2));
    void rhoCell;
    // 4. the documented data
    const inputs = [[{ v: T.hDemand, bold: true }], H([T.hUseCase, T.hDocumented, T.hPeak, T.hSource])];
    const dem = Object.values(m.demand || {}).map((d) => [d, null]).concat(Object.entries(m.phaseDemand || {}).flatMap(([, ph]) => Object.entries(ph).map(([p, d]) => [d, p])));
    dem.forEach(([d, p]) => inputs.push([ucCell(d.useCase, p), d.sessions != null ? loadTxt(d.sessions, 'sessions') : d.rps != null ? loadTxt(d.rps, 'rps') : T.notDocumented, d.peakFactor == null ? null : n2(d.peakFactor), d.source || null]));
    inputs.push([], [{ v: T.hCapTable, bold: true }], H([T.hContainer, T.hRuns, T.hCapPer, T.hReplicas, T.hReq, T.hResp, T.hSesTr, T.hSource]));
    (m.containers || []).forEach((c) => { const k = m.capacity[c] || {}; const per = k.capacityPerReplica != null ? loadTxt(k.capacityPerReplica, 'rps') : k.capacityPerReplicaSessions != null ? loadTxt(k.capacityPerReplicaSessions, 'sessions') : T.notDocumented; const reps = k.replicas == null && k.maxReplicas == null ? T.notDocumented : (k.replicas == null ? '?' : k.replicas) + (k.maxReplicas != null ? '–' + k.maxReplicas : '');
      const runsOn = (k.nodes && k.nodes.length ? k.nodes : [...new Set((m.instances || []).filter((i) => i.container === c && !i.virtual && i.node).map((i) => i.node))]).map(nodeName).join(', ') || null;   // from the capacity row, else from where its instances sit
      inputs.push([name(c), runsOn, per, reps, n2(kb(k.requestSize)), n2(kb(k.responseSize)), n2(kb(k.sessionTransfer)), k.source || null]); });
    const metered = Object.entries(m.metered || {});
    if (metered.length) { inputs.push([], [{ v: T.hMetered, bold: true }], H([T.hNode, T.hDirection, T.hPrice, T.hSource])); metered.forEach(([id, mt]) => { const p = (m.pricing || {})[id] || {}; inputs.push([nodeName(id), mt.direction === 'in' ? T.dirIn : mt.direction === 'both' ? T.dirBoth : T.dirOut, p.perGB != null ? num(p.perGB, 3) + ' ' + (p.currency || '') + '/GB' : null, [mt.source, p.source].filter(Boolean).join(' · ') || null]); }); }
    // 5. one sheet per scenario — the paragraphs span the table, a glance block before any table
    const W = [38, 24, 22, 13, 24, 24, 20, 20, 26, 14];   // the sheet's column widths, fixed so a paragraph merged across them gets the height it needs
    const perScenario = runs.map((r) => {
      const R = r.result, sc = R.scenario, rows = [[{ v: r.name, bold: true }, what(r)]], merges = [], heights = {};
      const para = (text) => { const ri = rows.length; rows.push([wrap(text)]); merges.push([ri, 0, W.length - 1]); heights[ri] = Math.max(1, Math.ceil(String(text).length / (W.reduce((a, b) => a + b, 0) * 1.05))) * 15 + 6; };
      para(narration(r)); if (r.note) para(r.note);
      // at a glance
      const st = worstStatus(R), top = R.instances.filter((i) => !i.virtual && !i.down && i.rho != null).sort((a, b) => b.rho - a.rho)[0], b = R.breakpoints[0], met = meteredOf(R), metPending = R.findings.filter((f) => f.kind === 'metered-transit' && !meteredOf(R).includes(f));
      rows.push([], [{ v: T.hGlance, bold: true }], H([T.gWhat, T.gFigure, T.gState]));
      rows.push([T.gState0, T.status[st] || st, statusCell(st)]);
      rows.push([T.gEntering, entering(R), null]);
      if (top) rows.push([T.gTop, name(top.container) + ' · ' + pctTxt(top.rho), statusCell(top.status)]);
      rows.push([T.gBreaks, b ? name(b.container) + ' · ×' + num(b.breakAt, b.breakAt < 10 ? 2 : 0) : T.gNoBreak, null]);
      met.forEach((f) => rows.push([fill(T.gEdge, { node: nodeName(f.node) }), bps(f.bytesPerSec) + ' ≈ ' + num(f.gbMonth, 0) + ' GB/' + month + (f.cost != null ? ' ≈ ' + num(f.cost, 0) + ' ' + (f.currency || '') + '/' + month : ''), lit(T.level.info, 'info')]));
      metPending.forEach((f) => rows.push([fill(T.gEdge, { node: nodeName(f.node) }), fill(T.gEdgePending, { n: f.pending.length }), lit(T.status.grey, 'pending')]));
      if (R.summary.grey) rows.push([T.gPending, fill(T.gPendingN, { n: R.summary.grey }), lit(T.status.grey, 'pending')]);
      // demand
      rows.push([], [{ v: T.hDemand, bold: true }], H([T.hUseCase, T.hDemandNow, T.hDocumented, T.hChanged, T.hActive]));
      R.useCases.forEach((u) => { rows.push([u.id, u.value == null ? T.none : loadTxt(u.value, u.unit), u.documented ? loadTxt(u.base, u.unit) : T.notDocumented, u.overridden ? T.yes : T.no, u.active ? T.yes : T.no]); Object.entries(u.phaseLoad || {}).forEach(([p, pl]) => rows.push([ucCell(u.id, p), pl.value == null ? T.none : loadTxt(pl.value, pl.unit), pl.documented ? loadTxt(pl.base, pl.unit) : T.notDocumented, pl.overridden ? T.yes : T.no, u.active ? T.yes : T.no])); });
      // assumptions — one row per container, one column per figure the scenario assumes somewhere (only those), the nodes it is down on last
      // (8.61.2: it was one row per container × field, a "what was assumed" column and a bare value — 35 rows to read seven containers)
      const ovs = sc.overrides || {}, down = {};
      (sc.down || []).forEach((d) => { const i = R.instances.find((x) => x.id === d); const c = i ? i.container : d; (down[c] = down[c] || []).push(i && i.node ? nodeName(i.node) : d); });
      const cols = Object.keys(T.fields).filter((f) => Object.values(ovs).some((o) => o && o[f] != null)), containers = [...new Set(Object.keys(ovs).filter((c) => cols.some((f) => ovs[c][f] != null)).concat(Object.keys(down)))];
      if (containers.length) {
        rows.push([], [{ v: T.hAssumptions, bold: true }], H([T.hContainer].concat(cols.map((f) => T.fields[f]), Object.keys(down).length ? [T.hDownOn] : [])));
        containers.forEach((c) => { const o = ovs[c] || {}; rows.push([name(c)].concat(cols.map((f) => (o[f] == null ? null : /Size|Transfer/.test(f) ? n2(kb(o[f])) : n2(o[f]))), Object.keys(down).length ? [down[c] ? down[c].join(', ') : null] : [])); });
      }
      // instances — words and units, the state painted
      rows.push([], [{ v: T.hInstances, bold: true }], H([T.hContainer, T.hRuns, T.hStatus, T.hUtil, T.hReceives, T.hSends, T.hTrafficIn, T.hTrafficOut, T.hCapacity, T.hBreakAt]));
      R.instances.filter((i) => !i.virtual).forEach((i) => { const k = i.cap || {}; const per = i.gauge === 'sessions' ? k.capacityPerReplicaSessions : k.capacityPerReplica; const capTxt = per == null ? T.notDocumented : (k.replicas != null ? k.replicas + ' × ' : '') + loadTxt(per, i.gauge === 'sessions' ? 'sessions' : 'rps');
        rows.push([name(i.container), nodeName(i.node), statusCell(i.down ? 'down' : i.status), i.down ? null : pct(i.rho), i.down ? null : rateTxt(i.lambda, i.sessions), i.down ? null : rateTxt(i.out, i.outSessions), i.down || !(i.bytesIn || i.bytesPending) ? null : i.bytesIn ? bps(i.bytesIn) : T.pendingShort, i.down || !(i.bytesOut || i.bytesPending) ? null : i.bytesOut ? bps(i.bytesOut) : T.pendingShort, capTxt, i.down || i.breakAt == null || i.breakAt === Infinity ? null : '×' + num(i.breakAt, i.breakAt < 10 ? 2 : 0)]); });
      // findings — level painted, then the sentence
      rows.push([], [{ v: T.hFindings, bold: true }], H([T.hLevel, T.hWhatHappens, T.hWhere, T.hFigure, T.hWhatToDo]));
      R.findings.forEach((f) => { const s = sentence(f, R); rows.push([level(f), wrap(s.what), s.where, s.figure, s.action ? wrap(s.action) : null]); });
      if (r.transit && Object.keys(r.transit.nodes).length) {
        rows.push([], [{ v: T.hTransit, bold: true }], H([T.hNode, T.hTrIn, T.hTrOut, T.hBilled, T.hGb, T.hCost, T.hPendingOn]));
        Object.entries(r.transit.nodes).forEach(([id, t]) => { const f = r.transit.findings.find((x) => x.node === id); rows.push([nodeName(id), t.in ? bps(t.in) : t.pending.length ? T.pendingShort : null, t.out ? bps(t.out) : t.pending.length ? T.pendingShort : null, t.metered ? (t.metered.direction === 'in' ? T.dirIn : t.metered.direction === 'both' ? T.dirBoth : T.dirOut) : T.no, f && f.bytesPerSec ? int(f.gbMonth) : null, f && f.cost != null && f.bytesPerSec ? num(f.cost, 0) + ' ' + (f.currency || '') : null, (t.pending || []).map(name).join(', ') || null]); });
      }
      rows.push([], [{ v: T.hLatency, bold: true }], H([T.hUseCase, T.hTarget, T.hWorst, T.hUtil, T.hFactor, T.hSaturated]));
      R.latency.forEach((l) => { const ph = l.worst && m.phases[l.worst.phase]; rows.push([l.useCase, l.target || null, l.worst ? (ph && ph.name ? l.worst.phase + ' · ' + ph.name : l.worst.phase) : null, l.worst ? pct(l.worst.worstRho) : null, l.worst ? (l.worst.factor === Infinity ? '∞' : n2(l.worst.factor)) : null, l.saturated ? T.yes : T.no]); });
      return { name: r.name, rows, widths: W, merges, heights };
    });
    const sheets = [{ name: T.reading, rows: reading, widths: [120] }, { name: T.summary, rows: summary, freeze: 3 }, { name: T.compare, rows: compare }, { name: T.inputs, rows: inputs }].concat(perScenario);
    sheets.forEach((s) => s.rows.forEach((r) => r.forEach((c, i) => { if (c === undefined) r[i] = null; })));   // an absent figure is an empty cell, whatever the finding carries
    return sheets;
  }

  /** the file name: <project slug>-simulation-<date>.xlsx */
  const fileName = (project, date, lang) => (String(project || 'architecture').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'architecture') + (lang === 'es' ? '-simulacion-' : '-simulation-') + date + '.xlsx';

  return { zip, crc32, workbook, sheetXml, sheetName, colName, compose, fileName };
});
