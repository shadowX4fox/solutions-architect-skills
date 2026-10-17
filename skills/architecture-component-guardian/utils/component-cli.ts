#!/usr/bin/env bun
// Bun CLI for the architecture-component-guardian skill.
//
// The single sanctioned reader of the component tuple (canonical name, C4
// type, technology, slug). Skills call this instead of re-parsing
// `docs/components/**/*.md` or `docs/components/README.md` by hand.
//
// Subcommands:
//   list <project_root>
//     Print a JSON array of ComponentFact — one entry per file under
//     docs/components/ (L1 descriptors and L2 containers), each carrying
//     `warnings[]` for its own internal inconsistencies.
//
//   index <project_root>
//     Print the 5-column index table body the guardian writes into
//     docs/components/README.md, grouped by system. Computation only —
//     this command never writes.
//
//   check <project_root>
//     Validate component files against the index — the required fields, the
//     `**Description:**` contract (the canonical name first, 120 characters at
//     most), the header, the Capacity table — then the index drift. Exit 0
//     clean, 1 on any finding, 2 when the project surface is unreadable.
//
// Exit codes:
//   0  success (including a project with no docs/components directory — see below)
//   1  `check` only: one or more findings
//   2  unusable invocation: bad subcommand, missing argument, or a project_root
//      that does not exist
//
// A project with no `docs/components/` directory is NOT an error. `listComponents`
// documents fail-open ("returns an empty array when the directory is absent —
// callers fail open rather than aborting"), and this CLI used to contradict that
// by exiting 2, so a caller following the documented contract got an error code
// instead of an empty list.
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { diffIndex, listComponents, renderIndex, renderReadme } from "./component-facts";

const [, , subcommand, ...rest] = process.argv;

function fail(msg: string): never {
  console.error(`component-cli: ${msg}`);
  process.exit(2);
}

function requireRoot(root: string | undefined, usage: string): string {
  if (!root) fail(`usage: ${usage}`);
  if (!existsSync(root)) fail(`project_root does not exist: ${root}`);
  return root;
}

/** True when the project has no component surface at all. */
function hasComponentsDir(root: string): boolean {
  return existsSync(resolve(root, "docs", "components"));
}

switch (subcommand) {
  case "list": {
    const root = requireRoot(rest[0], "list <project_root>");
    console.log(JSON.stringify(hasComponentsDir(root) ? listComponents(root) : [], null, 2));
    break;
  }

  case "index": {
    const root = requireRoot(rest[0], "index <project_root>");
    console.log(hasComponentsDir(root) ? renderIndex(root) : "");
    break;
  }

  case "readme": {
    // 8.90.0 — the whole docs/components/README.md by code; `--write` writes it, else it prints it
    const root = requireRoot(rest[0], "readme <project_root> [--lang en|es] [--write]");
    if (!hasComponentsDir(root)) { console.log(""); break; }
    const li = rest.indexOf("--lang");
    let lang = li >= 0 ? rest[li + 1] : undefined;
    if (!lang) {
      for (const f of ["ARCHITECTURE.md", ".cache/sa-skills/collect.json"]) {
        try { const t = readFileSync(resolve(root, f), "utf8"); const m = t.match(/DOC_LANGUAGE:\s*(en|es)/) || t.match(/"doc_language":\s*"(en|es)"/); if (m) { lang = m[1]; break; } } catch { /* next */ }
      }
    }
    const text = renderReadme(root, lang === "es" ? "es" : "en");
    if (rest.includes("--write")) { writeFileSync(resolve(root, "docs", "components", "README.md"), text); console.error(`Wrote docs/components/README.md (${lang || "en"})`); }
    else console.log(text);
    break;
  }

  case "check": {
    const root = requireRoot(rest[0], "check <project_root>");
    if (!hasComponentsDir(root)) {
      console.log("no docs/components directory — nothing to check");
      break;
    }

    const facts = listComponents(root);
    const diff = diffIndex(root);

    // Two distinct classes, reported separately: `sync` rebuilds the index and
    // fixes drift, but it cannot fix a defect inside a component file. Lumping
    // them together made the "run sync" advice wrong half the time.
    const authoringDefects: string[] = [];
    const indexDrift: string[] = [];

    for (const fact of facts) {
      for (const w of fact.warnings) authoringDefects.push(`${fact.path}: ${w}`);
    }
    for (const path of diff.missing_rows) {
      indexDrift.push(`docs/components/README.md: missing row for ${path}`);
    }
    for (const row of diff.orphan_rows) {
      indexDrift.push(`docs/components/README.md: orphan row points at ${row} (no such file)`);
    }
    for (const row of diff.stale_rows) {
      indexDrift.push(
        `docs/components/README.md: stale ${row.column} for ${row.path} — index has "${row.index_value}", file has "${row.file_value}"`,
      );
    }

    if (authoringDefects.length > 0) {
      console.error(`Component file defects (${authoringDefects.length}) — fix in the component file:`);
      for (const line of authoringDefects) console.error(`  ${line}`);
    }
    if (indexDrift.length > 0) {
      console.error(`Index drift (${indexDrift.length}) — run the guardian \`sync\` action to rebuild:`);
      for (const line of indexDrift) console.error(`  ${line}`);
    }

    const findings = authoringDefects.length + indexDrift.length;
    if (findings > 0) {
      console.error(
        `${findings} finding(s): ${authoringDefects.length} component file defect(s), ` +
        `${indexDrift.length} index drift.`,
      );
      process.exit(1);
    }
    console.log(`clean — ${facts.length} component file(s), index in sync`);
    break;
  }

  default:
    fail(`unknown subcommand "${subcommand ?? ""}". Expected one of: list, index, readme, check.`);
}
