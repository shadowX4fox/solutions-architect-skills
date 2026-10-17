#!/usr/bin/env bun
// Bun CLI for institutional ADR catalog synchronisation
// (architecture-definition-record Workflows 6 and 9).
//
// The skill clones the catalog with git and resolves the edition directory;
// this CLI does the part that must be deterministic — classifying what
// changed, copying files, and writing the pin. It never runs git.
//
// Subcommands:
//   diff <edition_dir> <project_root> [--judge agent|typesafe|clef]   (the cosmetic / amended split, judged; else SA_JUDGE)
//     Print a CatalogDiff as JSON: every institutional ADR classified as
//     unchanged / added / superseded / amended / status_only / cosmetic /
//     removed, renames, local hand-edits against the pin, and the
//     coverage-map delta with the requirement codes it affects.
//
//   apply <edition_dir> <project_root> [--overwrite]
//     Copy the institutional range and COVERAGE_MAP.json into adr/.
//     Without --overwrite existing files are skipped (Workflow 6 bootstrap);
//     with it they are replaced (Workflow 9 sync). Never deletes an ADR
//     except the old filename of a rename. Prints an ApplyResult as JSON.
//
//   pin <project_root> --remote <url> --ref <ref> --edition <en|es> --commit <sha> [--clone-dir <dir>]
//     Hash adr/ADR-0NN-*.md and adr/COVERAGE_MAP.json and write
//     adr/.institutional-catalog.json. Prints the pin as JSON.
//
//   show-pin <project_root>
//     Print the current pin, or `null` when the project was never imported.
//
//   citations <project_root> [--diff <diff.json>] [--ids ADR-011,ADR-045] [--out <file>]
//     The Step 9.6 checklist: every line of ARCHITECTURE.md, docs/ and the project ADRs citing an amended,
//     superseded or status-only ADR (from --diff, default .cache/sa-skills/adr-catalog-sync/diff.json, or --ids),
//     by literal id. Writes Markdown to --out (default .cache/sa-skills/adr-catalog-sync/citations.md); prints counts.
//
// Exit codes:
//   0  success
//   1  `diff` only: the catalog and adr/ differ (any change other than
//      unchanged, or a coverage-map delta) — lets a caller test "is a sync
//      needed" without parsing JSON
//   2  unusable invocation: bad subcommand, missing argument, or a directory
//      that does not exist
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import {
  applyCatalog,
  diffCatalog,
  judgeCosmetic,
  citationChecklist,
  renderChecklist,
  PROPAGATING_KINDS,
  readPin,
  writePin,
  DEFAULT_CLONE_DIR,
} from "./catalog-diff";

const [, , subcommand, ...rest] = process.argv;

function fail(msg: string): never {
  console.error(`catalog-diff-cli: ${msg}`);
  process.exit(2);
}

function requireDir(value: string | undefined, name: string, usage: string): string {
  if (!value) fail(`usage: ${usage}`);
  if (!existsSync(value)) fail(`${name} does not exist: ${value}`);
  return value;
}

/** `--key value` pairs from the tail of argv; bare flags map to `true`. */
function flags(args: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--")) continue;
    const key = args[i].slice(2);
    const next = args[i + 1];
    if (next !== undefined && !next.startsWith("--")) { out[key] = next; i++; }
    else out[key] = true;
  }
  return out;
}

switch (subcommand) {
  case "diff": {
    const usage = "diff <edition_dir> <project_root> [--judge <engine>] [--sa-skills <dir>] [--answers [<file>]]";
    const edition = requireDir(rest[0], "edition_dir", usage);
    const root = requireDir(rest[1], "project_root", usage);
    const diff = diffCatalog(edition, root);
    // the cosmetic / amended split is judged by the engine in force (--judge, else SA_JUDGE, else agent — a worksheet the
    // session answers, applied by a second run with --answers); a pair not yet judged stays cosmetic and is listed as undecided
    const f = flags(rest.slice(2));
    const judgeOpt = typeof f.judge === "string" ? f.judge : undefined;
    const judged = await judgeCosmetic(diff, edition, root, { engine: judgeOpt, saSkills: typeof f["sa-skills"] === "string" ? f["sa-skills"] : undefined, answers: f.answers === undefined ? undefined : f.answers });
    console.log(JSON.stringify({ ...diff, judge: judged }, null, 2));
    const changed =
      diff.changes.some((c) => c.kind !== "unchanged" || c.renamed || c.local_drift) ||
      (diff.coverage.status !== "unchanged" && diff.coverage.status !== "absent");
    process.exit(changed ? 1 : 0);
  }

  case "apply": {
    const usage = "apply <edition_dir> <project_root> [--overwrite]";
    const edition = requireDir(rest[0], "edition_dir", usage);
    const root = requireDir(rest[1], "project_root", usage);
    const f = flags(rest.slice(2));
    const result = applyCatalog(edition, root, { overwrite: f.overwrite === true });
    console.log(JSON.stringify(result, null, 2));
    break;
  }

  case "pin": {
    const usage = "pin <project_root> --remote <url> --ref <ref> --edition <en|es> --commit <sha> [--clone-dir <dir>]";
    const root = requireDir(rest[0], "project_root", usage);
    const f = flags(rest.slice(1));
    for (const key of ["remote", "ref", "edition", "commit"]) {
      if (typeof f[key] !== "string" || !f[key]) fail(`--${key} is required. usage: ${usage}`);
    }
    const pin = writePin(root, {
      remote: f.remote as string,
      ref: f.ref as string,
      edition: f.edition as string,
      commit: f.commit as string,
      clone_dir: typeof f["clone-dir"] === "string" ? (f["clone-dir"] as string) : DEFAULT_CLONE_DIR,
    });
    console.log(JSON.stringify(pin, null, 2));
    break;
  }

  case "show-pin": {
    const root = requireDir(rest[0], "project_root", "show-pin <project_root>");
    console.log(JSON.stringify(readPin(root), null, 2));
    break;
  }

  case "citations": {
    const usage = "citations <project_root> [--diff <diff.json>] [--ids ADR-011,ADR-045] [--out <file>]";
    const root = requireDir(rest[0], "project_root", usage);
    const f = flags(rest.slice(1));
    let ids: string[];
    if (typeof f.ids === "string") ids = f.ids.split(",").map((s) => s.trim()).filter(Boolean);
    else {
      const diffFile = typeof f.diff === "string" ? f.diff : join(root, ".cache", "sa-skills", "adr-catalog-sync", "diff.json");
      if (!existsSync(diffFile)) fail(`no diff at ${diffFile} — save the diff output there, or pass --diff / --ids. usage: ${usage}`);
      const t = readFileSync(diffFile, "utf8");
      const d = JSON.parse(t.slice(t.indexOf("{")));
      ids = d.changes.filter((c: any) => PROPAGATING_KINDS.has(c.kind)).map((c: any) => c.id);
    }
    const cites = citationChecklist(root, ids);
    const out = typeof f.out === "string" ? f.out : join(root, ".cache", "sa-skills", "adr-catalog-sync", "citations.md");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, renderChecklist(cites, ids));
    console.log(JSON.stringify({ out, adrs: ids.length, citing_lines: cites.length, per_adr: Object.fromEntries(ids.map((id) => [id, cites.filter((c) => c.id === id).length])) }));
    break;
  }

  default:
    fail(`unknown subcommand "${subcommand ?? ""}". Expected one of: diff, apply, pin, show-pin, citations.`);
}
