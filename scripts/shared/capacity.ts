/**
 * capacity.ts — the one reader of the two capacity tables the load simulation consumes (8.33.0).
 *
 * A container descriptor carries `## <visible> <!-- LABEL: Capacity -->` with a fixed four-column table
 * (`Metric | Value | Unit | Source`); docs/08 carries `### <visible> <!-- LABEL: Demand by Use Case -->`
 * with `Use Case | Value | Unit | Peak factor | Source`; a row may be qualified by a phase (`UC-02 · F3`) when one
 * phase of a use case runs in a unit its flow does not — the request-shaped read inside a session-shaped
 * replication, the session a request-shaped readmission opens (8.42.0). Metric codes and units are closed registries
 * (never localized); a Value is a number or the literal `Not documented` — nothing else, the nuance goes
 * in Source. Every internal figure is **requests per second**: `tps × requests_per_transaction`,
 * `tpm / 60 × requests_per_transaction`, `rpm / 60`; a tps/tpm value without requests_per_transaction
 * converts at ×1 and is flagged `assumed_rpt`. `sessions` is a gauge, never converted.
 *
 * Consumers: component-facts.ts (`capacity` on every ComponentFact, defects into `check`), arch-facts.js
 * (`demand` ledger section), scene-from-docs.js (the scene's `capacity` block), dossier.js (Alia reads the
 * same rows). One parser, so the heat map, the check and Alia's answer carry the same numbers.
 */

export const CAPACITY_METRICS = [
  "capacity_per_replica",     // throughput one replica sustains — rps / rpm / tps / tpm, or sessions for a connection-holding container
  "replicas",                 // running replicas (HPA min, or the fixed count)          — count
  "max_replicas",             // scale-out ceiling (HPA max)                             — count
  "requests_per_transaction", // downstream requests one business transaction causes   — ratio
  "documented_demand",        // the measured or committed load on this container       — rps / rpm / tps / tpm / sessions
  "request_size",             // bytes of one request this container receives (8.54.0)   — B / KB / MB
  "response_size",            // bytes of one response it returns                       — B / KB / MB
  "session_transfer",         // sustained bytes per second one held session moves toward its client — KB/s / MB/s
] as const;
export type CapacityMetric = (typeof CAPACITY_METRICS)[number];

export const CAPACITY_UNITS = ["rps", "rpm", "tps", "tpm", "sessions", "count", "ratio", "B", "KB", "MB", "KB/s", "MB/s"] as const;
export type CapacityUnit = (typeof CAPACITY_UNITS)[number];
const THROUGHPUT_UNITS: readonly CapacityUnit[] = ["rps", "rpm", "tps", "tpm"];
/** sizes are decimal — 1 KB = 1 000 B, 1 MB = 1 000 000 B — the convention a CDN or cloud egress bill uses; units compare case-insensitively (`kb` is `KB`) */
const SIZE_UNITS = ["b", "kb", "mb"], TRANSFER_UNITS = ["kb/s", "mb/s"];
const BYTES: Record<string, number> = { b: 1, kb: 1e3, mb: 1e6, "kb/s": 1e3, "mb/s": 1e6 };
const UNITS_LC = CAPACITY_UNITS.map((u) => u.toLowerCase());

export const NOT_DOCUMENTED = "Not documented";

export type CapacityRow = { metric: string; value: number | null; unit: string; source: string; line: number; not_documented: boolean };
export type Normalized = { rps: number | null; sessions: number | null; flags: string[] };
export type Capacity = {
  rows: CapacityRow[];
  /** normalized values, null when the row is absent or `Not documented` */
  capacity_per_replica_rps: number | null;
  /** for a connection-holding container (a replication or WebSocket gateway): sessions one replica holds */
  capacity_per_replica_sessions: number | null;
  replicas: number | null;
  max_replicas: number | null;
  requests_per_transaction: number | null;
  documented_demand_rps: number | null;
  documented_demand_sessions: number | null;
  /** bytes of one request received / one response returned (8.54.0); null when absent or `Not documented` */
  request_size_bytes: number | null;
  response_size_bytes: number | null;
  /** bytes per second one held session moves, for a connection-holding container */
  session_transfer_bps: number | null;
  /** `assumed_rpt` when a tps/tpm value converted at ×1; `not_documented:<metric>` per grey row */
  flags: string[];
  /** authoring defects — component-cli `check` fails on them */
  warnings: string[];
};
/** `phase` is set on a phase-qualified row (`UC-02 · F3`): the unit of that phase inside the use case, where the flow's own unit does not fit (8.42.0); `key` is `use_case` or `use_case/phase` — what a scenario's demand map is keyed by */
export type DemandRow = { use_case: string; phase: string | null; key: string; value: number | null; unit: string; peak_factor: number; source: string; line: number; not_documented: boolean; rps: number | null; sessions: number | null; flags: string[] };
/** what `parseDemand` may be told about the flows: an id, or the id with the phases it declares (then a phase row is checked against them) */
export type KnownUseCase = string | { id: string; phases?: (string | number)[] };

const plain = (s: string) => String(s || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]*)`/g, "$1").replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();
const cells = (line: string) => line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
const isSep = (l: string) => /^\s*\|[\s:|-]+\|\s*$/.test(l);

/** "13300" · "13.300" · "13,300" · "0,19" · "1e3" → number; `Not documented` → null with the flag; anything else → NaN (a defect) */
export function parseValue(raw: string): { value: number | null; not_documented: boolean; invalid: boolean } {
  const s = plain(raw);
  if (!s || /^not documented$/i.test(s) || /^no documentado$/i.test(s)) return { value: null, not_documented: true, invalid: false };
  // thousands separators: "13.300" / "13,300" / "1 300"; decimal: the last separator followed by 1–2 digits
  let t = s.replace(/\s+/g, "");
  const m = t.match(/^(\d{1,3}(?:[.,]\d{3})+)([.,]\d{1,2})?$/);
  if (m) t = m[1].replace(/[.,]/g, "") + (m[2] ? "." + m[2].slice(1) : "");
  else t = t.replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) && /^[\d.eE+-]+$/.test(t) ? { value: n, not_documented: false, invalid: false } : { value: null, not_documented: false, invalid: true };
}

/** the section under a heading carrying `<!-- LABEL: <label> -->`, or (legacy) a heading whose visible text is one of `visible` */
export function labelledSection(content: string, label: string, visible: string[]): { body: string; line: number } | null {
  const lines = content.split("\n");
  const re = new RegExp(`<!--\\s*LABEL:\\s*${label}\\s*-->`);
  let s = lines.findIndex((l) => /^#{2,6}\s/.test(l) && re.test(l));
  if (s < 0) s = lines.findIndex((l) => { const m = l.match(/^#{2,6}\s+(.+?)\s*(<!--.*)?$/); return m && visible.some((v) => plain(m[1]).toLowerCase() === v.toLowerCase()); });
  if (s < 0) return null;
  const lvl = (lines[s].match(/^#+/) || [""])[0].length; const out: string[] = [];
  for (let i = s + 1; i < lines.length; i++) { const h = (lines[i].match(/^#+(?=\s)/) || [""])[0].length; if (h && h <= lvl) break; out.push(lines[i]); }
  return { body: out.join("\n"), line: s + 1 };
}

function firstTable(body: string, startLine: number): { headers: string[]; rows: { cells: string[]; line: number }[] } | null {
  const lines = body.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^\s*\|/.test(lines[i]) && isSep(lines[i + 1])) {
      const headers = cells(lines[i]).map(plain); const rows: { cells: string[]; line: number }[] = [];
      for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j++) rows.push({ cells: cells(lines[j]), line: startLine + 1 + j });
      return { headers, rows };
    }
  }
  return null;
}

/** rps of a throughput row; sessions stay a gauge; count/ratio are not throughput */
export function toRps(value: number | null, unit: string, rpt: number | null): Normalized {
  const flags: string[] = [];
  if (value == null) return { rps: null, sessions: null, flags };
  const u = unit.toLowerCase();
  if (u === "sessions") return { rps: null, sessions: value, flags };
  if (!THROUGHPUT_UNITS.includes(u as CapacityUnit)) return { rps: null, sessions: null, flags };
  let rps = u === "rps" ? value : u === "rpm" ? value / 60 : u === "tps" ? value : value / 60;   // tpm
  if (u === "tps" || u === "tpm") { if (rpt == null) flags.push("assumed_rpt"); rps *= rpt ?? 1; }
  return { rps: Math.round(rps * 1000) / 1000, sessions: null, flags };
}

/** bytes of a size row (B / KB / MB) or bytes per second of a transfer row (KB/s / MB/s); null otherwise */
export function toBytes(value: number | null, unit: string): number | null {
  if (value == null) return null;
  const k = BYTES[unit.toLowerCase()];
  return k == null ? null : Math.round(value * k);
}

/** the descriptor's Capacity table; null when the descriptor carries none (a pre-8.33.0 descriptor is not a defect) */
export function parseCapacity(content: string): Capacity | null {
  const sec = labelledSection(content, "Capacity", ["Capacity", "Capacidad"]);
  if (!sec) return null;
  const warnings: string[] = []; const flags: string[] = []; const rows: CapacityRow[] = [];
  const t = firstTable(sec.body, sec.line);
  const empty = (): Capacity => ({ rows, capacity_per_replica_rps: null, capacity_per_replica_sessions: null, replicas: null, max_replicas: null, requests_per_transaction: null, documented_demand_rps: null, documented_demand_sessions: null, request_size_bytes: null, response_size_bytes: null, session_transfer_bps: null, flags, warnings });
  if (!t) { warnings.push(`capacity-table-missing: the Capacity section (line ${sec.line}) has no table — shape is | Metric | Value | Unit | Source |`); return empty(); }
  const iM = t.headers.findIndex((h) => /^metric$/i.test(h)), iV = t.headers.findIndex((h) => /^value$/i.test(h)), iU = t.headers.findIndex((h) => /^unit$/i.test(h)), iS = t.headers.findIndex((h) => /^source$/i.test(h));
  if (iM < 0 || iV < 0 || iU < 0) { warnings.push(`capacity-columns: the Capacity table (line ${sec.line}) needs the columns Metric | Value | Unit | Source — column headers never localize (found: ${t.headers.join(" | ")})`); return empty(); }
  const seen = new Set<string>();
  t.rows.forEach((r) => {
    const metric = plain(r.cells[iM] || "").toLowerCase(), unit = plain(r.cells[iU] || "").toLowerCase(), source = iS >= 0 ? (r.cells[iS] || "").trim() : "";
    if (!(CAPACITY_METRICS as readonly string[]).includes(metric)) { warnings.push(`capacity-metric-unknown: "${metric}" at line ${r.line} — one of ${CAPACITY_METRICS.join(", ")}`); return; }
    if (seen.has(metric)) { warnings.push(`capacity-metric-duplicate: "${metric}" at line ${r.line}`); return; } seen.add(metric);
    if (!UNITS_LC.includes(unit)) warnings.push(`capacity-unit-unknown: "${unit}" at line ${r.line} — one of ${CAPACITY_UNITS.join(", ")}`);
    const allowed: Record<string, readonly string[]> = { capacity_per_replica: [...THROUGHPUT_UNITS, "sessions"], replicas: ["count"], max_replicas: ["count"], requests_per_transaction: ["ratio"], documented_demand: [...THROUGHPUT_UNITS, "sessions"], request_size: SIZE_UNITS, response_size: SIZE_UNITS, session_transfer: TRANSFER_UNITS };
    if (UNITS_LC.includes(unit) && !allowed[metric].includes(unit)) warnings.push(`capacity-unit-mismatch: ${metric} in "${unit}" at line ${r.line} — expected ${allowed[metric].map((u) => CAPACITY_UNITS[UNITS_LC.indexOf(u)] || u).join(" | ")}`);
    const v = parseValue(r.cells[iV] || "");
    if (v.invalid) warnings.push(`capacity-value-invalid: ${metric} = "${plain(r.cells[iV])}" at line ${r.line} — a number or the literal \`${NOT_DOCUMENTED}\`; ranges, ≈ and prose go in Source`);
    if (v.not_documented) flags.push(`not_documented:${metric}`);
    rows.push({ metric, value: v.value, unit, source, line: r.line, not_documented: v.not_documented });
  });
  const row = (m: string) => rows.find((r) => r.metric === m);
  const rpt = row("requests_per_transaction")?.value ?? null;
  const cap = row("capacity_per_replica"); const capN = cap ? toRps(cap.value, cap.unit, rpt) : { rps: null, sessions: null, flags: [] };
  const dem = row("documented_demand"); const demN = dem ? toRps(dem.value, dem.unit, rpt) : { rps: null, sessions: null, flags: [] };
  [...capN.flags, ...demN.flags].forEach((f) => { if (!flags.includes(f)) flags.push(f); });
  const bytesOf = (m: string) => { const r = row(m); return r ? toBytes(r.value, r.unit) : null; };
  return { rows, capacity_per_replica_rps: capN.rps, capacity_per_replica_sessions: capN.sessions, replicas: row("replicas")?.value ?? null, max_replicas: row("max_replicas")?.value ?? null, requests_per_transaction: rpt, documented_demand_rps: demN.rps, documented_demand_sessions: demN.sessions, request_size_bytes: bytesOf("request_size"), response_size_bytes: bytesOf("response_size"), session_transfer_bps: bytesOf("session_transfer"), flags, warnings };
}

/** docs/08's Demand by Use Case table; `rows` empty and `warnings` naming the shape when the section exists without one; null when the section is absent */
export function parseDemand(content: string, knownUseCases?: KnownUseCase[]): { rows: DemandRow[]; warnings: string[]; line: number } | null {
  const sec = labelledSection(content, "Demand by Use Case", ["Demand by Use Case", "Demanda por caso de uso", "Demanda por Caso de Uso"]);
  if (!sec) return null;
  const warnings: string[] = []; const rows: DemandRow[] = [];
  const t = firstTable(sec.body, sec.line);
  if (!t) { warnings.push(`demand-table-missing: the Demand by Use Case section (line ${sec.line}) has no table — shape is | Use Case | Value | Unit | Peak factor | Source |`); return { rows, warnings, line: sec.line }; }
  const iUc = t.headers.findIndex((h) => /^use case$/i.test(h)), iV = t.headers.findIndex((h) => /^value$/i.test(h)), iU = t.headers.findIndex((h) => /^unit$/i.test(h)), iP = t.headers.findIndex((h) => /^peak factor$/i.test(h)), iS = t.headers.findIndex((h) => /^source$/i.test(h));
  if (iUc < 0 || iV < 0 || iU < 0) { warnings.push(`demand-columns: the Demand table (line ${sec.line}) needs Use Case | Value | Unit | Peak factor | Source — column headers never localize (found: ${t.headers.join(" | ")})`); return { rows, warnings, line: sec.line }; }
  const known = knownUseCases ? new Map(knownUseCases.map((u) => (typeof u === "string" ? [u.toUpperCase(), null] : [u.id.toUpperCase(), u.phases ? u.phases.map(String) : null]))) : null;
  const seen = new Set<string>();
  t.rows.forEach((r) => {
    // a UC-nn id, or the FLOW-<code> id the scene gives a flow that maps to no single use case (scene-from-docs.js)
    const cell = plain(r.cells[iUc] || "");
    const m = cell.match(/UC-?\d+|FLOW-\d+[a-z]?/i); const raw = m ? m[0] : "";
    const uc = /^flow/i.test(raw) ? "FLOW-" + raw.slice(5).toLowerCase() : raw.toUpperCase().replace(/^UC(\d)/, "UC-$1");   // the scene's flow ids keep the code's case (FLOW-7b)
    if (!uc) { warnings.push(`demand-use-case-invalid: "${cell}" at line ${r.line} — a UC-nn id from docs/04's Flow Inventory (or FLOW-<code> for a flow with no single use case)`); return; }
    // an optional phase qualifier after the id — `UC-02 · F3`, `UC-02 / fase 3`, `UC-02 (phase 3)`, `UC-02 #3`: the row is that phase's unit inside the use case
    const pm = cell.slice(m!.index! + raw.length).match(/^\s*(?:[·•/#|:(\-–—]\s*)?(?:F|fase|phase|ph\.?)\s*(\d+[a-z]?)\s*\)?\s*$|^\s*[·•/#|:]\s*(\d+[a-z]?)\s*$/i);
    const phase = pm ? (pm[1] || pm[2]) : null;
    const key = phase ? `${uc}/${phase}` : uc;
    if (known && !known.has(uc.toUpperCase())) warnings.push(`demand-use-case-unknown: ${uc} at line ${r.line} is in no flow of docs/04`);
    else if (known && phase) { const ph = known.get(uc.toUpperCase()); if (ph && !ph.includes(phase)) warnings.push(`demand-phase-unknown: ${uc} · F${phase} at line ${r.line} — phase ${phase} is not one ${uc} declares (${ph.join(", ")})`); }
    if (seen.has(key)) warnings.push(`demand-row-duplicate: ${phase ? `${uc} · F${phase}` : uc} at line ${r.line}`); seen.add(key);
    const unit = plain(r.cells[iU] || "").toLowerCase();
    if (![...THROUGHPUT_UNITS, "sessions"].includes(unit as CapacityUnit)) warnings.push(`demand-unit-unknown: "${unit}" at line ${r.line} — one of ${[...THROUGHPUT_UNITS, "sessions"].join(", ")}`);
    const v = parseValue(r.cells[iV] || ""); if (v.invalid) warnings.push(`demand-value-invalid: ${uc} = "${plain(r.cells[iV])}" at line ${r.line} — a number or \`${NOT_DOCUMENTED}\``);
    const pf = iP >= 0 ? parseValue(r.cells[iP] || "") : { value: null, not_documented: true, invalid: false };
    if (pf.invalid) warnings.push(`demand-peak-factor-invalid: "${plain(r.cells[iP])}" at line ${r.line}`);
    const n = toRps(v.value, unit, 1);   // demand enters as transactions of the use case: one request per transaction at the entry, fan-out is the hops'
    rows.push({ use_case: uc, phase, key, value: v.value, unit, peak_factor: pf.value ?? 1, source: iS >= 0 ? (r.cells[iS] || "").trim() : "", line: r.line, not_documented: v.not_documented, rps: n.rps, sessions: n.sessions, flags: v.not_documented ? ["not_documented"] : [] });
  });
  return { rows, warnings, line: sec.line };
}

/** the table a template or the guide prints — one place for the shape */
export const CAPACITY_TABLE_SHAPE = ["| Metric | Value | Unit | Source |", "|---|---|---|---|", "| capacity_per_replica | Not documented | rps | |", "| replicas | Not documented | count | |", "| max_replicas | Not documented | count | |", "| requests_per_transaction | Not documented | ratio | |", "| documented_demand | Not documented | rps | |", "| request_size | Not documented | KB | |", "| response_size | Not documented | KB | |"].join("\n");
export const DEMAND_TABLE_SHAPE = ["| Use Case | Value | Unit | Peak factor | Source |", "|---|---|---|---|---|"].join("\n");
