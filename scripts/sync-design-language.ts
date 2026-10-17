#!/usr/bin/env bun
/**
 * Bring a drop of the SA Design Language Standard into the plugin — the "When a new version ships" steps
 * of `skills/architecture-docs/references/design-language/README.md` as code.
 *
 *   bun scripts/sync-design-language.ts <standard-dir>            report only: the stamp, the checks, the registry delta
 *   bun scripts/sync-design-language.ts <standard-dir> --write [--target <dir>]   and replace the copy in force (a pack's)
 *   [--target <dir>]                                              another bundle (tests); default the plugin's
 *
 * The bundle is the shipped set and nothing else — the five `llms-*` files of each edition, `bian-registry.json`,
 * `rules-registry.json` (the machine registry `label-check.js` reads) and `bian/` — so the standard's sources,
 * PDFs, figures and build scripts never travel. A drop is refused when a file is missing, when any file carries
 * a stamp other than `llms.txt`'s (a mixed-stamp bundle contradicts its own currency contract) or when
 * `rules-registry.json` names another version. `--write` replaces every shipped file, deletes any other file
 * but the plugin's own `README.md`, and prints what the registries gained and lost — the review list for the
 * plugin's own copies (DIAGRAM-GENERATION-GUIDE.md's registry, examples in the guides) — and every file in the
 * repo still naming the old stamp.
 */
import { existsSync, readFileSync, readdirSync, mkdirSync, copyFileSync, rmSync, statSync, chmodSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const REPO = join(import.meta.dir, "..");
// the copy in force — an institution pack's (scripts/shared/packs.js); the base carries none since 9.2.0, so a drop is written into a
// pack's design-language/ (or wherever --target says)
const BUNDLE: string | null = require("./shared/packs.js").designLanguageDir();
const LLMS = ["llms.txt", "llms-rules.txt", "llms-mermaid.txt", "llms-full.txt", "llms-HOWTO.md"];
const KEEP = new Set(["README.md"]);

export const stampOf = (src: string) => {
  const m = src.match(/\bv(\d+\.\d+)(?![.\d])( \([^)\n]*\))?[^\n]{0,40}?(\d{4}-\d{2}-\d{2})/);
  return m ? `v${m[1]}${m[2] || ""}, ${m[3]}` : null;
};

/** The files a drop ships, relative to its root. */
export function shippedFiles(src: string): string[] {
  const out = [...LLMS, ...LLMS.map((f) => `es/${f}`), "bian-registry.json", "rules-registry.json"];
  if (existsSync(join(src, "bian"))) readdirSync(join(src, "bian")).filter((f) => /\.(md|txt)$/.test(f)).sort().forEach((f) => out.push(`bian/${f}`));
  return out;
}

const tokensOf = (reg: any) => reg ? {
  PROTOCOL: reg.label.protocols, STYLE: reg.label.styles, "Action Type": reg.label.actions.map((a: any) => a.token),
  "data-scope": reg.label.data_scope.map((d: any) => d.keyword), composition: reg.label.composition,
  // the grammar itself, not only its vocabularies: a new slot (RC5's `· Via <name>`) changes the form, the expression and the keys
  "label form": [reg.label.form], "label expression": [reg.label.expression],
  "label slots": Object.keys(reg.label).filter((k) => !["section", "illustrative_unregistered"].includes(k)),
  ...Object.fromEntries(Object.entries(reg.tags || {}).map(([g, v]: [string, any]) => [`tag ${g}`, v.values])),
  checks: (reg.checks || []).map((c: any) => `${c.id} ${c.grade}`),
} : {};

export function plan(src: string, target: string = BUNDLE || "") {
  const problems: string[] = [];
  const files = shippedFiles(src);
  files.filter((f) => !existsSync(join(src, f))).forEach((f) => problems.push(`missing: ${f}`));
  if (!files.some((f) => f.startsWith("bian/"))) problems.push("missing: bian/ (the BIAN corpus the registries index)");
  const index = existsSync(join(src, "llms.txt")) ? readFileSync(join(src, "llms.txt"), "utf8") : "";
  const stamp = stampOf(index);
  if (!stamp) problems.push("llms.txt carries no version stamp");
  for (const f of [...LLMS, ...LLMS.map((x) => `es/${x}`)]) {
    if (!existsSync(join(src, f))) continue;
    const s = stampOf(readFileSync(join(src, f), "utf8"));
    if (stamp && s !== stamp) problems.push(`${f}: stamp ${s ?? "none"}, llms.txt says ${stamp}`);
  }
  let reg: any = null;
  if (existsSync(join(src, "rules-registry.json"))) {
    try { reg = JSON.parse(readFileSync(join(src, "rules-registry.json"), "utf8")); } catch (e) { problems.push(`rules-registry.json: ${(e as Error).message}`); }
    if (reg && stamp && `${reg.version}, ${reg.built}` !== stamp) problems.push(`rules-registry.json: ${reg.version}, ${reg.built}, llms.txt says ${stamp} — run the standard's _registry.ts`);
  }
  const oldReg = existsSync(join(target, "rules-registry.json")) ? JSON.parse(readFileSync(join(target, "rules-registry.json"), "utf8")) : null;
  const oldStamp = existsSync(join(target, "llms.txt")) ? stampOf(readFileSync(join(target, "llms.txt"), "utf8")) : null;
  const before = tokensOf(oldReg) as Record<string, string[]>, after = tokensOf(reg) as Record<string, string[]>;
  const delta = Object.keys({ ...before, ...after }).map((k) => ({
    registry: k,
    added: (after[k] || []).filter((t) => !(before[k] || []).includes(t)),
    removed: (before[k] || []).filter((t) => !(after[k] || []).includes(t)),
  })).filter((d) => d.added.length || d.removed.length);
  const stale = existsSync(target) ? listAll(target).filter((f) => !KEEP.has(f) && !files.includes(f)) : [];
  return { stamp, oldStamp, files, problems, delta, firstRegistry: !oldReg, stale };
}

function listAll(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? listAll(p, base) : [relative(base, p)]; });
}

export function write(src: string, p: ReturnType<typeof plan>, target: string = BUNDLE || "") {
  p.stale.forEach((f) => rmSync(join(target, f)));
  p.files.forEach((f) => { mkdirSync(dirname(join(target, f)), { recursive: true }); copyFileSync(join(src, f), join(target, f)); chmodSync(join(target, f), 0o644); });   // a drop's 0700 / 0755 modes never reach the repo
}

/** Files in the repo, outside the bundle and the history, that still name the old stamp. */
function stampMentions(oldStamp: string | null): string[] {
  if (!oldStamp) return [];
  const [ver, date] = [oldStamp.split(",")[0].split(" ")[0], oldStamp.split(", ").pop()!];
  const r = Bun.spawnSync(["rg", "-l", "-F", "-e", `${ver} `, "-e", date, REPO, "-g", "!**/references/design-language/llms*", "-g", "!**/references/design-language/es/**",
    "-g", "!**/references/design-language/bian/**", "-g", "!CHANGELOG.md", "-g", "!node_modules"], { stdout: "pipe" });
  return r.stdout.toString().split("\n").filter(Boolean).map((f) => relative(REPO, f)).filter((f) => readFileSync(join(REPO, f), "utf8").includes(ver) && readFileSync(join(REPO, f), "utf8").includes(date));
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const src = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--target");
  if (!src) { console.error("Usage: bun scripts/sync-design-language.ts <standard-dir> [--write] [--target <dir>]"); process.exit(2); }
  const target = opt("--target") || BUNDLE;
  if (!target) { console.error("No design language in force: install the institution pack, or pass --target <the pack's design-language folder>"); process.exit(2); }
  const p = plan(src, target);
  console.log(`Design Language Standard drop: ${p.stamp ?? "unstamped"} (bundled: ${p.oldStamp ?? "none"}) — ${p.files.length} shipped files`);
  if (p.problems.length) { console.log(`REFUSED — ${p.problems.length} problem(s):`); p.problems.forEach((x) => console.log(`  - ${x}`)); process.exit(1); }
  if (p.firstRegistry) console.log("Registries: the bundle had no rules-registry.json — no delta to show; review the plugin's copies against the new one.");
  else if (!p.delta.length) console.log("Registries: unchanged.");
  else { console.log("Registries — review the plugin's own copies of each (DIAGRAM-GENERATION-GUIDE.md § Connection Naming Rule, guide examples):"); p.delta.forEach((d) => console.log(`  ${d.registry}: ${d.added.length ? "+ " + d.added.join(" ") : ""}${d.added.length && d.removed.length ? "  " : ""}${d.removed.length ? "− " + d.removed.join(" ") : ""}`)); }
  if (p.stale.length) console.log(`Not shipped, ${args.includes("--write") ? "deleted" : "to delete"}: ${p.stale.join(", ")}`);
  if (!args.includes("--write")) { console.log("Report only — re-run with --write to replace the bundle."); process.exit(0); }
  write(src, p, target);
  console.log(`Wrote ${p.files.length} files to ${relative(process.cwd(), target) || "."}.`);
  const mentions = target === BUNDLE ? stampMentions(p.oldStamp) : [];
  if (mentions.length) { console.log(`Still naming ${p.oldStamp} — update the stamp there:`); mentions.forEach((f) => console.log(`  ${f}`)); }
  console.log("Then: bun run check, and the acceptance test of llms-HOWTO.md §5 (Bonus 2 first).");
}
