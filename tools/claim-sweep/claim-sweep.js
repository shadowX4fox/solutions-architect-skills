#!/usr/bin/env node
/**
 * claim-sweep — barre el corpus por el SENTIDO de una afirmación, no por su redacción.
 *
 * Cuando una corrección retira una afirmación que el corpus repite, verificarla con el
 * patrón que uno acaba de escribir sólo demuestra que la edición se aplicó. El corpus
 * enuncia la misma invariante con otras palabras en secciones, principios, descriptores,
 * ADR y kit de entrega, y esas instancias sobreviven.
 *
 *   Etapa 1  CÓDIGO   recall primero, por BLOQUE (párrafo, ítem, fila de tabla con su cabecera)
 *   Etapa 2  JUICIO   agent | typesafe | clef           ← scripts/judge.js, el juez compartido
 *   Etapa 3  CÓDIGO   umbrales, bandas y salida; la política nunca vive en el juez
 *
 * La Etapa 2 no vive aquí: `scripts/judge.js` es el único juez del plugin (tres proveedores, un
 * Noul por bloque, caché por contenido, hoja de trabajo para el motor agent). Este script sólo
 * aporta el recall y la política. Un bloque que el juez no respondió queda SIN DECIDIR: ni
 * instancia ni descarte, y se lista con la hoja de trabajo para responderlo.
 *
 *   bun claim-sweep.js <root> --claim claims/registro-lector-unico.claim.json
 *   bun claim-sweep.js <root> --claim … --engine agent
 *   bun claim-sweep.js <root> --claim … --engine typesafe --verify
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import J from "../../scripts/judge.js";

const { judge, verify: verifyAnswers, engineInForce, JudgeError } = J;
const DEFAULT_DIRS = ["docs", "adr", "handoffs"];   // never compliance-docs: compliance is isolated
const SKIP = /(^|\/)(node_modules|\.git|\.cache|archive|analysis\/archive)(\/|$)/;

// ─── argumentos ──────────────────────────────────────────────────────────────
function args(argv) {
  const o = { root: null, engine: null, hi: null, lo: null, chunk: 25,             // engine: --engine, si no SA_JUDGE, si no agent · hi / lo: la CLI, si no el claim, si no 0.85 / 0.40
              model: "jev-latest", dirs: null, verify: false, strict: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--") && !o.root) { o.root = a; continue; }
    const next = () => argv[++i];
    if (a === "--claim") o.claimPath = next();
    else if (a === "--engine") o.engine = next();
    else if (a === "--hi") o.hi = +next();
    else if (a === "--lo") o.lo = +next();
    else if (a === "--chunk") o.chunk = +next();
    else if (a === "--model") o.model = next();
    else if (a === "--dirs") o.dirs = next().split(",");
    else if (a === "--verify") o.verify = true;
    else if (a === "--strict") o.strict = true;
    else if (a === "--json") o.json = true;
    else if (a === "--answers") o.answers = next();
    else if (a === "--no-cache") o.cache = false;             // vuelve a preguntar aunque el bloque no cambió: mide la deriva entre corridas
  }
  if (!o.root || !o.claimPath) {
    console.error("uso: claim-sweep.js <root> --claim <fichero.claim.json> [--engine agent|typesafe|clef]");
    process.exit(2);
  }
  return o;
}

// ─── Etapa 1 — candidatos por BLOQUE, no por línea ───────────────────────────
// Una afirmación puede repartirse entre la cabecera de una tabla y su celda
// («… | Escritor único | Lector |» + «… | ningún lector externo |»). Un barrido
// por línea no la ve nunca, por bueno que sea el juez de la Etapa 2.
function blocksOf(text) {
  const lines = text.split("\n");
  const out = [];
  let heading = "", i = 0;
  const isSep = (s) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(s) && s.includes("-");

  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,6}\s/.test(line)) { heading = line.replace(/^#+\s*/, "").trim(); i++; continue; }
    if (!line.trim()) { i++; continue; }

    if (line.trim().startsWith("|")) {                       // tabla: cabecera + fila
      const header = line, sep = lines[i + 1];
      if (sep && isSep(sep)) {
        i += 2;
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          out.push({ kind: "table-row", line: i + 1, heading,
                     text: `${header.trim()}\n${lines[i].trim()}`, row: lines[i].trim() });
          i++;
        }
        continue;
      }
    }
    const start = i, buf = [];                               // párrafo o ítem de lista
    const isItem = (s) => /^\s*([-*+]|\d+\.)\s/.test(s);
    buf.push(line); i++;
    while (i < lines.length && lines[i].trim() && !/^#{1,6}\s/.test(lines[i]) &&
           !lines[i].trim().startsWith("|") && !(isItem(lines[i]) && isItem(line))) {
      buf.push(lines[i]); i++;
    }
    out.push({ kind: isItem(line) ? "list-item" : "paragraph", line: start + 1, heading,
               text: buf.join("\n").trim() });
  }
  return out;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP.test(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

const rx = (pats, flags = "i") => new RegExp(pats.join("|"), flags);

function collect(root, claim, dirs) {
  const groups = (Array.isArray(claim.patterns.recall[0])
    ? claim.patterns.recall : [claim.patterns.recall]).map((g) => rx(g));
  const cands = [];
  for (const d of dirs) {
    let files = [];
    try { files = walk(join(root, d)); } catch { continue; }
    for (const f of files) {
      const rel = relative(root, f);
      for (const b of blocksOf(readFileSync(f, "utf8"))) {
        if (!groups.every((g) => g.test(b.text))) continue;
        cands.push({ id: `b${cands.length.toString().padStart(3, "0")}`,
          file: rel, line: b.line, kind: b.kind, heading: b.heading, text: b.text });
      }
    }
  }
  return cands;
}

// ─── Etapa 2 — el juez compartido ────────────────────────────────────────────

/** El claim como spec del juez: un Noul por bloque, criterios del claim, cortes del claim o de la CLI. */
const specOf = (claim, o) => ({ id: claim.id, type: "noul", question: claim.question, criteria: claim.criteria,
  hi: o.hi ?? claim.hi ?? 0.85, lo: o.lo ?? claim.lo ?? 0.4 });

/** Cada bloque candidato como ítem: el estado es lo que el juez lee, nada más. */
const itemsOf = (cands) => cands.map((c) => ({ id: c.id, state: {
  fichero: c.file, linea: c.line, tipo: c.kind, seccion: c.heading || "(sin encabezado)", texto: c.text } }));

/** Vuelca las respuestas del juez sobre los candidatos: p y quién la dio. Sin respuesta, p = null: SIN DECIDIR, nunca «no». */
function apply(cands, res) {
  for (const c of cands) { const a = res.answers[c.id]; c.p = a ? a.p : null; c.by = a ? a.by : "undecided"; }
  return cands;
}

/** Etapa 1 contra los fixtures, sin juez: ¿ve el recall cada positivo? */
function recallCheck(cands, claim) {
  const pos = (claim.fixtures || []).filter((x) => x.label === 1);
  if (!pos.length) { console.error("\nSin fixtures en el claim: no hay nada contra qué medir."); return; }
  console.error(`\n── Etapa 1 contra los ${pos.length} fixtures (el juez aún no respondió) ──`);
  for (const f of pos) {
    const c = cands.find((x) => x.file === f.file && Math.abs(x.line - f.line) <= 3);
    console.error(c ? `   vista  ${f.file}:${f.line}  (${c.id}, sin decidir)` : `   ✗✗ NO LA VIO LA ETAPA 1  ${f.file}:${f.line}  ← arregla patterns.recall`);
  }
}

// ─── Etapa 3 — la política, en el código ─────────────────────────────────────
const band = (p, hi, lo) => (p == null ? "undecided" : p >= hi ? "block" : p >= lo ? "review" : "drop");

/** Los fixtures van por fichero:línea (±3); el juez mide por id, así que se traducen antes. */
function verify(cands, claim, spec) {
  const fx = claim.fixtures || [];
  if (!fx.length) return null;
  const hit = (f) => cands.find((c) => c.file === f.file && Math.abs(c.line - f.line) <= 3);
  const all = fx.map((f) => ({ ...f, id: (hit(f) || {}).id || `unseen:${f.file}:${f.line}` }));
  // un control (label 0) a ±3 líneas de un positivo cae en el mismo bloque: el positivo se queda con el bloque
  const positives = new Set(all.filter((f) => f.label === 1).map((f) => f.id));
  const byId = all.filter((f) => f.label === 1 || !positives.has(f.id));
  const answers = Object.fromEntries(cands.filter((c) => c.p != null).map((c) => [c.id, { type: "noul", p: c.p }]));   // un fixture sin decidir sale como no visto por el juez
  const v = verifyAnswers(spec, byId, answers);
  const at = (f) => cands.find((c) => c.id === f.id);
  const known = new Set(byId.map((f) => f.id));
  return { ...v, fp: v.fp.map((f) => at(f)).filter(Boolean),
    fn: v.fn.map((f) => ({ ...f, p: f.value })), unseen: v.unseen,
    nuevas: cands.filter((c) => c.p != null && c.p >= spec.hi && !known.has(c.id)) };   // por encima del corte y fuera de fixtures: candidatas a entrar en ellos
}

async function main() {
  const o = args(process.argv.slice(2));
  const claim = JSON.parse(readFileSync(o.claimPath, "utf8"));
  const dirs = o.dirs || claim.dirs || DEFAULT_DIRS;
  const spec = specOf(claim, o); o.hi = spec.hi; o.lo = spec.lo;
  try { o.engine = o.engine ?? engineInForce(); } catch (e) { console.error(e.message); process.exit(2); }

  const cands = collect(o.root, claim, dirs);
  console.error(`Etapa 1 — ${cands.length} bloques candidatos en ${dirs.join(", ")}`);
  if (!cands.length) { console.log("Nada que juzgar."); return; }

  const finish = (worksheet) => {
    cands.sort((a, b) => (b.p ?? -1) - (a.p ?? -1));
    const g = { block: [], review: [], drop: [], undecided: [] };
    for (const c of cands) g[band(c.p, o.hi, o.lo)].push(c);
    cands.forEach((c, i) => { c.rank = i + 1; });
    const judgedBy = (cands.find((c) => c.p != null) || {}).by || o.engine;

    if (o.json) { console.log(JSON.stringify({ claim: claim.id, hi: o.hi, lo: o.lo, undecided: g.undecided.map((c) => c.id), worksheet: worksheet || null, cands }, null, 1)); }
    else {
      console.log(`\n${claim.id} · juez: ${judgedBy} · corte ${o.hi} / piso ${o.lo}\n`);
      for (const [k, title] of [["block", "INSTANCIA VIVA"], ["review", "A REVISIÓN"]]) {
        if (!g[k].length) continue;
        console.log(`── ${title} (${g[k].length}) ─────────────`);
        for (const c of g[k]) {
          console.log(`  ${c.p.toFixed(2)}  ${c.file}:${c.line}  [${c.kind}]`);
          console.log(`        ${c.text.replace(/\s+/g, " ").slice(0, 160)}`);
        }
        console.log("");
      }
      if (g.undecided.length) {
        console.log(`── SIN DECIDIR (${g.undecided.length}) — el juez no las respondió: ni instancia ni descarte ─────────────`);
        for (const c of g.undecided) console.log(`  ${c.id}  ${c.file}:${c.line}  [${c.kind}]`);
        console.log(worksheet ? `  Responde la hoja ${worksheet} y vuelve a correr.\n` : "");
      }
      console.log(`${g.drop.length} descartados.`);
    }

    if (o.verify) {
      const v = verify(cands, claim, spec);
      if (!v) console.error("\nSin fixtures en el claim: no hay nada contra qué medir.");
      else {
        console.error(`\n── verificación contra ${v.total} fixtures ──`);
        console.error(`   recuperadas ${v.tp}/${v.total} · falsos positivos ${v.fp.length}`);
        for (const f of v.fn)     console.error(`   ✗ por debajo del corte  ${f.file}:${f.line}  p=${f.p.toFixed(2)}`);
        for (const f of v.unseen) console.error(String(f.id).startsWith("unseen:") ? `   ✗✗ NO LA VIO LA ETAPA 1  ${f.file}:${f.line}  ← arregla patterns.recall, no el juez` : `   ? sin decidir           ${f.file}:${f.line}  ← el juez no la respondió`);
        for (const c of v.fp)     console.error(`   ! falso positivo        ${c.file}:${c.line}  p=${c.p.toFixed(2)}  ← un control marcado como sí`);
        for (const c of v.nuevas) console.error(`   + fuera de fixtures     ${c.file}:${c.line}  p=${c.p.toFixed(2)}  ← léela; si es instancia, añádela`);
      }
    }
    if (o.strict && g.block.length) process.exit(1);
    if (o.strict && g.undecided.length) {
      console.error(`\n--strict: ${g.undecided.length} bloques sin decidir — un portón no se abre sobre lo que el juez no respondió.`);
      process.exit(5);
    }
  };

  const items = itemsOf(cands);
  const common = { root: o.root, model: o.model, chunk: o.chunk, cache: o.cache };
  let res;
  try {
    res = await judge(spec, items, { ...common, engine: o.answers ? "agent" : o.engine, ...(o.answers ? { answers: o.answers } : {}) });
    if (res.pending) {
      console.log(`\nHoja de juicio escrita en:\n  ${res.pending}\n`);
      console.log(`${items.length} bloques SIN DECIDIR hasta que alguien la responda. Pásasela a Claude con la pregunta del claim y vuelve con sus respuestas:`);
      console.log(`  bun ${process.argv[1]} ${o.root} \\`);
      console.log(`    --claim ${o.claimPath} --answers <respuestas.json>`);
      console.log(`\nFormato: {"b000": 1, "b001": 0, …}  — 1 = la afirma, 0 = no.`);
      if (o.verify) recallCheck(cands, claim);
      if (o.strict) { console.error(`\n--strict: ${items.length} bloques sin decidir — un portón no se abre sobre lo que el juez no respondió.`); process.exit(5); }
      return;
    }
    if (res.requests != null) console.error(`Etapa 2 — ${res.model || res.engine}: ${res.requests} peticiones, ${res.cached} respuestas de caché`);
  } catch (e) {
    if (!(e instanceof JudgeError)) throw e;
    console.error(e.message);
    if (e.code === "key") console.error("Consíguela en https://typesafe.ai, o usa --engine agent, que no requiere nada.");
    process.exit(e.code === "key" ? 3 : e.code === "http" || e.code === "network" ? 4 : 5);
  }
  apply(cands, res); finish(res.engine === "agent" ? J.worksheetPath(spec, common) : null);   // agent: la hoja donde se responden los que quedaron sin decidir
}

main();
