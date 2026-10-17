#!/usr/bin/env bun
/**
 * check-generic.ts — the plugin stays generic: nothing a reference project names may enter it.
 *
 *   bun scripts/check-generic.ts [--update-baseline] [--list] [--json]
 *
 * The skills create architectures — any architecture. A consumer project is where a defect is observed; the fix is a rule
 * that holds for every project, and its tests and examples are synthetic. On 2026-10-01 a check shipped with a word list
 * of one bank's domain (cliente, cuenta, saldo) and was reverted the same day; by then 48 names of the reference project
 * sat in 32 files of the plugin, in comments, fixtures and examples. A name is the part of that drift code can see.
 *
 * Reference projects: one path per line in `.sa-reference-projects` at the repository root (untracked — it names the
 * maintainer's own projects), plus `SA_REFERENCE_PROJECTS` (paths separated by `:`). From each one the facts ledger gives
 * the names only that project has: every component's canonical name, slug and internal name, every system's name, and
 * the project folder's name — kept when at least 10 characters long with a space or a hyphen, and not a technology the
 * project's components declare (a product name is everyone's). No project configured: skipped, exit 0 (CI, a contributor).
 *
 * Scanned: tracked files under scripts/, skills/, agents/, plugins/, hooks/, tools/ and commands/ — code, instructions,
 * templates, tests, examples. Not scanned: changelogs, README, CLAUDE.md and docs/ (history may say where a rule was
 * measured), the vendored standards, and this check's own baseline.
 *
 * The baseline (`scripts/generic-baseline.json`) holds a hash per (file, name) already present when the check was
 * introduced — hashes, so the baseline itself names no project. A hit outside it fails the check: rename the fixture,
 * rewrite the comment as the general case ("another component's name", not that component's). `--update-baseline` is for
 * removing entries that no longer hit; adding one is a decision to keep a project's name in the plugin — say why in the
 * commit.
 */
import { execSync } from "child_process";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { basename, join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");
const BASELINE = join(ROOT, "scripts", "generic-baseline.json");
const SCAN = /^(scripts|skills|agents|plugins|hooks|tools|commands)\//;
const TEXT = /\.(md|js|ts|tsx|json|sh|txt|ya?ml|html)$/;
const SKIP = /(^|\/)CHANGELOG[^/]*\.md$|\/references\/design-language\/|\/bian-v14\/|node_modules|^scripts\/generic-baseline\.json$/;

export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const hashOf = (file: string, term: string) => createHash("sha256").update(`${file}\0${fold(term)}`).digest("hex").slice(0, 16);

export function referenceProjects(root = ROOT, env = process.env.SA_REFERENCE_PROJECTS): string[] {
  const file = join(root, ".sa-reference-projects");
  const lines = existsSync(file) ? readFileSync(file, "utf-8").replace(/\r\n?/g, "\n").split("\n") : [];
  return [...new Set([...lines, ...(env ? env.split(":") : [])].map((l) => l.trim()).filter((l) => l && !l.startsWith("#")))].filter((p) => existsSync(join(p, "ARCHITECTURE.md")));
}

/** The names only this project has. */
export function termsOf(project: string, facts?: any): string[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const f = facts ?? require(join(ROOT, "scripts", "shared", "arch-facts.js")).collect(project);
  const tech = new Set<string>((f.components ?? []).flatMap((c: any) => c.technology ?? []).map((t: string) => fold(String(t))));
  const raw: string[] = [...(f.components ?? []).flatMap((c: any) => [c.name, c.slug, c.internal_name]), ...(f.systems ?? []).map((s: any) => s.name), basename(resolve(project))].filter(Boolean).map(String);
  return [...new Set(raw)].filter((t) => t.length >= 10 && /[ -]/.test(t) && !tech.has(fold(t)));
}

export type Hit = { file: string; term: string; line: number; hash: string };
export function scan(files: { path: string; text: string }[], terms: string[]): Hit[] {
  const hits: Hit[] = []; const folded = terms.map((t) => [t, fold(t)] as const);
  for (const f of files) {
    const text = fold(f.text);
    for (const [term, key] of folded) { const at = text.indexOf(key); if (at >= 0) hits.push({ file: f.path, term, line: text.slice(0, at).split("\n").length, hash: hashOf(f.path, term) }); }
  }
  return hits;
}

export function check(opts: { root?: string; projects?: string[]; terms?: string[]; files?: { path: string; text: string }[]; baseline?: string[] } = {}) {
  const root = opts.root ?? ROOT;
  const projects = opts.projects ?? referenceProjects(root);
  if (!projects.length) return { status: "SKIPPED" as const, projects: 0, terms: 0, files: 0, hits: [] as Hit[], fresh: [] as Hit[], gone: [] as string[] };
  const terms = opts.terms ?? [...new Set(projects.flatMap((p) => termsOf(p)))];
  const files = opts.files ?? execSync("git ls-files", { cwd: root, encoding: "utf-8" }).split("\n").filter((p) => SCAN.test(p) && TEXT.test(p) && !SKIP.test(p) && existsSync(join(root, p))).map((p) => ({ path: p, text: readFileSync(join(root, p), "utf-8") }));
  const baseline = new Set(opts.baseline ?? (existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf-8")).hashes : []));
  const hits = scan(files, terms);
  const seen = new Set(hits.map((h) => h.hash));
  const fresh = hits.filter((h) => !baseline.has(h.hash));
  return { status: fresh.length ? ("FAIL" as const) : ("PASS" as const), projects: projects.length, terms: terms.length, files: files.length, hits, fresh, gone: [...baseline].filter((h) => !seen.has(h as string)) as string[] };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const r = check();
  if (args.includes("--update-baseline") && r.status !== "SKIPPED") {
    writeFileSync(BASELINE, JSON.stringify({ note: "check-generic.ts — a hash per (file, reference-project name) present before the check; never names a project. Entries only leave.", hashes: [...new Set(r.hits.map((h) => h.hash))].sort() }, null, 1) + "\n");
    console.log(`✓ generic baseline: ${new Set(r.hits.map((h) => h.hash)).size} entr(ies) written`);
    process.exit(0);
  }
  if (args.includes("--json")) console.log(JSON.stringify(r, null, 1));
  else if (r.status === "SKIPPED") console.log("– generic: skipped — no reference project (.sa-reference-projects or SA_REFERENCE_PROJECTS)");
  else {
    if (args.includes("--list")) r.hits.forEach((h) => console.log(`  ${h.file}:${h.line}  ${h.term}`));
    r.fresh.forEach((h) => console.error(`✗ ${h.file}:${h.line}: names \`${h.term}\` — a reference project's name. State the general case, or use a synthetic fixture.`));
    console.log(`${r.fresh.length ? "✗" : "✓"} generic: ${r.terms} name(s) of ${r.projects} reference project(s) over ${r.files} file(s) — ${r.fresh.length} new, ${r.hits.length - r.fresh.length} in the baseline${r.gone.length ? `, ${r.gone.length} baseline entr(ies) gone (--update-baseline)` : ""}`);
  }
  process.exit(r.status === "FAIL" ? 1 : 0);
}
