/**
 * Institutional catalog sync — classification, apply, and pin contracts.
 *
 * The catalog is amended in place or superseded, never deleted; the local
 * copy is read-only; the pin is the only record of what was synced. These
 * tests fix the classification a Workflow 9 run feeds into impact analysis,
 * so a wrong bucket here becomes a wrong propagation checklist there.
 *
 * @module catalog-diff.test
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import {
  applyCatalog,
  citationChecklist,
  renderChecklist,
  diffCatalog,
  extractSection,
  hasSubstantiveSections,
  parseAdrHeader,
  readPin,
  resolveEditionDir,
  sha256,
  writePin,
  COVERAGE_MAP_FILENAME,
  PIN_FILENAME,
} from "../utils/catalog-diff";

const CLI = resolve(import.meta.dir, "..", "utils", "catalog-diff-cli.ts");

let work: string;
let catalog: string;
let project: string;

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "catalog-diff-test-"));
  catalog = join(work, "catalog");
  project = join(work, "project");
  mkdirSync(catalog, { recursive: true });
  mkdirSync(join(project, "adr"), { recursive: true });
});

afterEach(() => {
  try { rmSync(work, { recursive: true, force: true }); } catch { /* best effort */ }
});

function adr(
  n: number,
  title: string,
  opts: { status?: string; decision?: string; context?: string; related?: string; date?: string } = {},
): string {
  return [
    `# ADR-${String(n).padStart(3, "0")}: ${title}`,
    "",
    `**Status**: ${opts.status ?? "Accepted"}`,
    "**Scope**: Institutional",
    `**Date**: ${opts.date ?? "2025-01-10"}`,
    "**Authors**: Architecture Team",
    `**Related**: ${opts.related ?? "—"}`,
    "",
    "---",
    "",
    "## Context",
    "",
    opts.context ?? "Every service needs a mesh.",
    "",
    "## Decision",
    "",
    opts.decision ?? "Istio is the mandatory mesh.",
    "",
    "## Consequences",
    "",
    "Sidecars everywhere.",
    "",
  ].join("\n");
}

const slug = (n: number, s: string) => `ADR-${String(n).padStart(3, "0")}-${s}.md`;
const inCatalog = (file: string, content: string) => writeFileSync(join(catalog, file), content);
const inProject = (file: string, content: string) => writeFileSync(join(project, "adr", file), content);
const byId = (d: ReturnType<typeof diffCatalog>, id: string) => d.changes.find((c) => c.id === id)!;

// ---------------------------------------------------------------------------

describe("parseAdrHeader", () => {
  test("reads id from the filename, title without the prefix, status and date", () => {
    const h = parseAdrHeader(adr(12, "Istio Mesh"), "ADR-012-istio-mesh.md");
    expect(h.id).toBe("ADR-012");
    expect(h.number).toBe(12);
    expect(h.title).toBe("Istio Mesh");
    expect(h.status).toBe("Accepted");
    expect(h.date).toBe("2025-01-10");
    expect(h.superseded_by).toBeNull();
  });

  test("captures the successor from a Superseded status line, linked or bare", () => {
    const linked = parseAdrHeader(
      adr(12, "Istio Mesh", { status: "Superseded by [ADR-041](ADR-041-linkerd.md)" }),
      "ADR-012-istio-mesh.md",
    );
    expect(linked.status).toBe("Superseded");
    expect(linked.superseded_by).toBe("ADR-041");

    const bare = parseAdrHeader(adr(12, "Istio Mesh", { status: "Superseded by ADR-041" }), "ADR-012-x.md");
    expect(bare.superseded_by).toBe("ADR-041");
  });

  test("captures every predecessor a Related line declares it supersedes", () => {
    const h = parseAdrHeader(
      adr(41, "Linkerd Mesh", { related: "Supersedes [ADR-012](ADR-012-istio-mesh.md), Supersedes ADR-013" }),
      "ADR-041-linkerd.md",
    );
    expect(h.supersedes).toEqual(["ADR-012", "ADR-013"]);
  });

  test("tolerates a metadata table, a BOM and CRLF", () => {
    const content = "﻿# ADR-007: Table Form\r\n\r\n| **Status** | Deprecated |\r\n| **Date** | 2024-03-01 |\r\n";
    const h = parseAdrHeader(content, "ADR-007-table-form.md");
    expect(h.title).toBe("Table Form");
    expect(h.status).toBe("Deprecated");
    expect(h.date).toBe("2024-03-01");
  });
});

describe("extractSection", () => {
  test("matches the English heading or the SECTION anchor the es edition writes", () => {
    const es = "# ADR-001: X\n\n## Decisión <!-- SECTION: Decision -->\n\nIstio.\n\n## Consecuencias <!-- SECTION: Consequences -->\n\nSidecars.\n";
    expect(extractSection(es, "Decision").trim()).toBe("Istio.");
    expect(extractSection(es, "Consequences").trim()).toBe("Sidecars.");
    expect(extractSection(adr(1, "X"), "Decision").trim()).toBe("Istio is the mandatory mesh.");
    expect(extractSection(adr(1, "X"), "Nope")).toBe("");
  });

  test("tolerates numbered headings, a deeper level and a trailing anchor — the body keeps its sub-headings", () => {
    const numbered = [
      "# ADR-002: Y", "",
      "## 1. Context", "", "Why.", "", "### 1.1 Problem Statement", "", "Detail.", "",
      "## 2) Decision <!-- SECTION: Decision -->", "", "What.", "",
      "## 3. Consequences", "", "So what.", "",
      "## IV. Alternatives Considered", "", "Other.",
    ].join("\n");
    expect(extractSection(numbered, "Context").trim()).toBe("Why.\n\n### 1.1 Problem Statement\n\nDetail.");
    expect(extractSection(numbered, "Decision").trim()).toBe("What.");
    expect(extractSection(numbered, "Consequences").trim()).toBe("So what.");
    expect(extractSection(numbered, "Alternatives Considered").trim()).toBe("Other.");
    expect(extractSection("# ADR-003: Z\n\n## Decision Drivers\n\nnope\n", "Decision")).toBe("");
    const deeper = "# ADR-003: Z\n\n## Record\n\n### Context\n\nc\n\n### Decision\n\nd\n\n## Next\n\nn\n";
    expect(extractSection(deeper, "Context").trim()).toBe("c");
    expect(extractSection(deeper, "Decision").trim()).toBe("d");
  });

  test("hasSubstantiveSections is true for numbered and anchored files, false when no heading is recognised", () => {
    expect(hasSubstantiveSections(adr(1, "X"))).toBe(true);
    expect(hasSubstantiveSections("# ADR-002: Y\n\n## 1. Context\n\n## 2. Decision\n")).toBe(true);
    expect(hasSubstantiveSections("# ADR-002: Y\n\n## Contexto <!-- SECTION: Context -->\n\nx\n")).toBe(true);
    expect(hasSubstantiveSections("# ADR-002: Y\n\n**Context**\n\nx\n")).toBe(false);
  });

  test("a localized edition without anchors is recognised by its own section names, accent- and case-blind", () => {
    const es = "# ADR-002: Y\n\n## 1. Contexto\n\nc\n\n### Planteamiento del problema\n\np\n\n## 2. Decisión\n\nd\n\n## 4. consecuencias\n\nq\n";
    expect(hasSubstantiveSections(es)).toBe(true);
    expect(extractSection(es, "Context").trim()).toBe("c\n\n### Planteamiento del problema\n\np");
    expect(extractSection(es, "Decision").trim()).toBe("d");
    expect(extractSection(es, "Consequences").trim()).toBe("q");
  });
});

// ---------------------------------------------------------------------------

describe("diffCatalog — classification", () => {
  test("identical files are unchanged; whitespace-only edits are cosmetic", () => {
    inCatalog(slug(1, "a"), adr(1, "A"));
    inProject(slug(1, "a"), adr(1, "A"));
    inCatalog(slug(2, "b"), adr(2, "B") + "\n\n\n");
    inProject(slug(2, "b"), adr(2, "B"));
    const d = diffCatalog(catalog, project);
    expect(byId(d, "ADR-001").kind).toBe("unchanged");
    expect(byId(d, "ADR-002").kind).toBe("cosmetic");
    expect(d.summary.unchanged).toBe(1);
    expect(d.summary.cosmetic).toBe(1);
  });

  test("a Decision change is amended and names the section", () => {
    inCatalog(slug(3, "c"), adr(3, "C", { decision: "Linkerd is the mandatory mesh." }));
    inProject(slug(3, "c"), adr(3, "C"));
    const ch = byId(diffCatalog(catalog, project), "ADR-003");
    expect(ch.kind).toBe("amended");
    expect(ch.changed_sections).toEqual(["Decision"]);
  });

  test("a Decision change is amended even when the catalog numbers its headings and the local copy does not", () => {
    const numbered = (decision: string) => adr(4, "Mesh")
      .replace("## Context", "## 1. Context")
      .replace("## Decision", "## 2. Decision")
      .replace("## Consequences", "## 3. Consequences")
      .replace("Istio is the mandatory mesh.", decision);
    inCatalog(slug(4, "mesh"), numbered("Linkerd is the mandatory mesh."));
    inProject(slug(4, "mesh"), adr(4, "Mesh"));
    inCatalog(slug(5, "same"), numbered("Istio is the mandatory mesh.").replace("Every service", "Each service"));
    inProject(slug(5, "same"), adr(5, "same").replace("Every service", "Each service"));
    const d = diffCatalog(catalog, project);
    expect(byId(d, "ADR-004").kind).toBe("amended");
    expect(byId(d, "ADR-004").changed_sections).toEqual(["Decision"]);
    expect(byId(d, "ADR-005").kind).toBe("cosmetic");
    expect(d.warnings.filter((w) => /no Context/.test(w))).toEqual([]);
  });

  test("a pair whose sections cannot be read is amended, never cosmetic, and warned", () => {
    const flat = adr(6, "Flat").replace(/^## (Context|Decision|Consequences)$/gm, "**$1**");
    inCatalog(slug(6, "flat"), flat.replace("Istio", "Linkerd"));
    inProject(slug(6, "flat"), flat);
    const d = diffCatalog(catalog, project);
    expect(byId(d, "ADR-006")).toMatchObject({ kind: "amended", changed_sections: ["(unreadable)"] });
    expect(d.warnings.some((w) => w.startsWith("ADR-006: no Context / Decision / Consequences heading recognised"))).toBe(true);
  });

  test("a Status-line-only change is status_only", () => {
    inCatalog(slug(4, "d"), adr(4, "D", { status: "Deprecated" }));
    inProject(slug(4, "d"), adr(4, "D"));
    expect(byId(diffCatalog(catalog, project), "ADR-004").kind).toBe("status_only");
  });

  test("supersede wins over an accompanying content edit and carries the successor", () => {
    inCatalog(slug(5, "e"), adr(5, "E", { status: "Superseded by [ADR-050](ADR-050-f.md)", decision: "Retired." }));
    inProject(slug(5, "e"), adr(5, "E"));
    inCatalog(slug(50, "f"), adr(50, "F", { related: "Supersedes [ADR-005](ADR-005-e.md)" }));
    const d = diffCatalog(catalog, project);
    const old = byId(d, "ADR-005");
    expect(old.kind).toBe("superseded");
    expect(old.superseded_by).toBe("ADR-050");
    const fresh = byId(d, "ADR-050");
    expect(fresh.kind).toBe("added");
    expect(fresh.supersedes).toEqual(["ADR-005"]);
  });

  test("a catalog-side deletion is removed — reported, never applied", () => {
    inProject(slug(6, "g"), adr(6, "G"));
    const d = diffCatalog(catalog, project);
    expect(byId(d, "ADR-006").kind).toBe("removed");
    const r = applyCatalog(catalog, project, { overwrite: true });
    expect(r.left_in_place).toEqual([slug(6, "g")]);
    expect(existsSync(join(project, "adr", slug(6, "g")))).toBe(true);
  });

  test("a slug change with identical content is a rename, reported as cosmetic", () => {
    inCatalog(slug(7, "new-slug"), adr(7, "H"));
    inProject(slug(7, "old-slug"), adr(7, "H"));
    const ch = byId(diffCatalog(catalog, project), "ADR-007");
    expect(ch.renamed).toBe(true);
    expect(ch.kind).toBe("cosmetic");
    expect(ch.catalog_file).toBe(slug(7, "new-slug"));
    expect(ch.local_file).toBe(slug(7, "old-slug"));
  });

  test("project ADRs (101+) and non-ADR files are invisible to the diff", () => {
    inProject("ADR-101-project.md", adr(101, "Project decision"));
    inProject("README.md", "# index");
    inCatalog("README.md", "# foreign index");
    inCatalog("ADR-150-other-project.md", adr(150, "Someone else's"));
    const d = diffCatalog(catalog, project);
    expect(d.changes).toEqual([]);
  });

  test("local_drift flags an imported file hand-edited after the pin was written", () => {
    inCatalog(slug(8, "i"), adr(8, "I"));
    inProject(slug(8, "i"), adr(8, "I"));
    writePin(project, { remote: "r", ref: "main", edition: "en", commit: "abc" });
    inProject(slug(8, "i"), adr(8, "I", { decision: "Locally forked." }));
    const ch = byId(diffCatalog(catalog, project), "ADR-008");
    expect(ch.local_drift).toBe(true);
    expect(ch.kind).toBe("amended");
  });
});

describe("diffCatalog — coverage map", () => {
  const entry = (adrId: string, codes: string[], ratified: boolean, claim = "c") => ({
    adr: adrId, claim, predicate: "p", breaks_when: [], satisfies: codes.map((code) => ({ code, strength: "full" })),
    ...(ratified ? { ratified_by: "AGB", ratified_on: "2025-02-01" } : {}),
  });
  const writeMap = (dir: string, entries: unknown[]) =>
    writeFileSync(join(dir, COVERAGE_MAP_FILENAME), JSON.stringify({ schema_version: "1", entries }));

  test("absent on both sides is absent; only the catalog side is added", () => {
    expect(diffCatalog(catalog, project).coverage.status).toBe("absent");
    writeMap(catalog, [entry("ADR-001", ["LAS2"], true)]);
    const c = diffCatalog(catalog, project).coverage;
    expect(c.status).toBe("added");
    expect(c.affected_codes).toEqual(["LAS2"]);
  });

  test("ratification flips and substance edits are effective; proposal-only edits are not", () => {
    writeMap(join(project, "adr"), [
      entry("ADR-001", ["LAS2"], false),
      entry("ADR-002", ["LASRE01"], true),
      entry("ADR-003", ["LAI05"], false, "old claim"),
      entry("ADR-004", ["LACN001"], true),
    ]);
    writeMap(catalog, [
      entry("ADR-001", ["LAS2"], true),                 // ratified
      entry("ADR-002", ["LASRE01"], false),             // unratified
      entry("ADR-003", ["LAI05"], false, "new claim"),  // edited, still a proposal
      entry("ADR-004", ["LACN001", "LACN002"], true),   // edited while ratified
    ]);
    const c = diffCatalog(catalog, project).coverage;
    expect(c.status).toBe("changed");
    const by = Object.fromEntries(c.entries.map((e) => [e.adr, e]));
    expect(by["ADR-001"].change).toBe("ratified");
    expect(by["ADR-002"].change).toBe("unratified");
    expect(by["ADR-003"].change).toBe("edited");
    expect(by["ADR-003"].effective).toBe(false);
    expect(by["ADR-004"].change).toBe("edited");
    expect(c.affected_codes).toEqual(["LACN001", "LACN002", "LAS2", "LASRE01"]);
  });
});

// ---------------------------------------------------------------------------

describe("applyCatalog", () => {
  test("bootstrap (no overwrite) writes new files, skips existing, copies the map once", () => {
    inCatalog(slug(1, "a"), adr(1, "A", { decision: "catalog version" }));
    inCatalog(slug(2, "b"), adr(2, "B"));
    writeFileSync(join(catalog, COVERAGE_MAP_FILENAME), '{"entries":[]}');
    inProject(slug(1, "a"), adr(1, "A", { decision: "local version" }));

    const r = applyCatalog(catalog, project, { overwrite: false });
    expect(r.written).toEqual([slug(2, "b")]);
    expect(r.skipped_existing).toEqual([slug(1, "a")]);
    expect(r.coverage_map_written).toBe(true);
    expect(readFileSync(join(project, "adr", slug(1, "a")), "utf-8")).toContain("local version");
  });

  test("sync (overwrite) replaces changed files and completes a rename", () => {
    inCatalog(slug(1, "a"), adr(1, "A", { decision: "catalog version" }));
    inCatalog(slug(7, "new-slug"), adr(7, "H"));
    inProject(slug(1, "a"), adr(1, "A", { decision: "local version" }));
    inProject(slug(7, "old-slug"), adr(7, "H"));

    const r = applyCatalog(catalog, project, { overwrite: true });
    expect(r.written.sort()).toEqual([slug(1, "a"), slug(7, "new-slug")]);
    expect(r.renamed_from).toEqual([slug(7, "old-slug")]);
    expect(existsSync(join(project, "adr", slug(7, "old-slug")))).toBe(false);
    expect(readFileSync(join(project, "adr", slug(1, "a")), "utf-8")).toContain("catalog version");
  });
});

describe("pin", () => {
  test("writePin hashes the institutional range and the map; readPin round-trips", () => {
    inProject(slug(1, "a"), adr(1, "A"));
    inProject("ADR-101-project.md", adr(101, "P"));
    writeFileSync(join(project, "adr", COVERAGE_MAP_FILENAME), '{"entries":[]}');

    const pin = writePin(project, { remote: "https://git/x.git", ref: "main", edition: "es", commit: "deadbeef" });
    expect(Object.keys(pin.files)).toEqual([slug(1, "a")]);
    expect(pin.files[slug(1, "a")]).toBe(sha256(adr(1, "A")));
    expect(pin.coverage_map).toBe(sha256('{"entries":[]}'));
    expect(pin.synced_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(existsSync(join(project, "adr", PIN_FILENAME))).toBe(true);
    expect(readPin(project)).toEqual(pin);
  });

  test("readPin is null when absent or unreadable", () => {
    expect(readPin(project)).toBeNull();
    writeFileSync(join(project, "adr", PIN_FILENAME), "{not json");
    expect(readPin(project)).toBeNull();
  });
});

describe("resolveEditionDir", () => {
  test("en is the root; es is the subdirectory when present, else the root", () => {
    expect(resolveEditionDir(catalog, "en")).toBe(catalog);
    expect(resolveEditionDir(catalog, "es")).toBe(catalog);
    mkdirSync(join(catalog, "es"));
    expect(resolveEditionDir(catalog, "es")).toBe(join(catalog, "es"));
  });
});

// ---------------------------------------------------------------------------

describe("catalog-diff-cli exit codes", () => {
  async function run(...args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    const proc = Bun.spawn(["bun", CLI, ...args], { stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    return { code: await proc.exited, stdout, stderr };
  }

  test("diff exits 0 when in sync and 1 when anything differs", async () => {
    inCatalog(slug(1, "a"), adr(1, "A"));
    inProject(slug(1, "a"), adr(1, "A"));
    expect((await run("diff", catalog, project)).code).toBe(0);
    inCatalog(slug(2, "b"), adr(2, "B"));
    const r = await run("diff", catalog, project);
    expect(r.code).toBe(1);
    expect(JSON.parse(r.stdout).summary.added).toBe(1);
  });

  test("pin requires its four fields and show-pin echoes the result", async () => {
    expect((await run("pin", project, "--remote", "r")).code).toBe(2);
    const w = await run("pin", project, "--remote", "r", "--ref", "main", "--edition", "en", "--commit", "abc");
    expect(w.code).toBe(0);
    const s = await run("show-pin", project);
    expect(JSON.parse(s.stdout).commit).toBe("abc");
  });

  test("bad subcommand and missing directory exit 2", async () => {
    expect((await run("nope")).code).toBe(2);
    expect((await run("diff", join(work, "missing"), project)).code).toBe(2);
  });
});

// the judge is sa-skills' — here in the repo (plugins/sa-records inside it), or an install named by SA_SKILLS_DIR
const JUDGE_AVAILABLE = existsSync(join(__dirname, "..", "..", "..", "..", "..", "scripts", "judge.js"))
  || !!(process.env.SA_SKILLS_DIR && existsSync(join(process.env.SA_SKILLS_DIR, "scripts", "judge.js")));

// a readable pair whose substantive change sits in a section the classifier does not count — cosmetic by code, the judge's to promote
const withNotes = (n: number, title: string, notes: string) => adr(n, title) + "\n## Implementation Notes\n\n" + notes + "\n";

describe("judgeCosmetic — a substantive change outside the counted sections, judged", () => {
  test("without the judge the cosmetic pairs stay cosmetic, listed as not judged (undecided), and the result says why", async () => {
    const { judgeCosmetic } = require("../utils/catalog-diff.ts");
    const r = await judgeCosmetic({ changes: [], summary: {} } as any, "/nonexistent", "/nonexistent", { saSkills: "/nonexistent" });
    if (JUDGE_AVAILABLE) expect(r.engine).not.toBe("none"); else expect(r).toMatchObject({ engine: "none", asked: 0, promoted: [], undecided: [] });
  });
  test.skipIf(!JUDGE_AVAILABLE)("a substantive edit outside the counted sections is promoted from cosmetic to amended; unanswered, it stays cosmetic and is reported undecided", async () => {
    const { judgeCosmetic } = require("../utils/catalog-diff.ts");
    inCatalog(slug(7, "flat"), withNotes(7, "Flat", "Linkerd runs the data plane."));
    inProject(slug(7, "flat"), withNotes(7, "Flat", "Istio runs the data plane."));
    const d = diffCatalog(catalog, project);
    expect(byId(d, "ADR-007").kind).toBe("cosmetic");
    const h = await judgeCosmetic(d, catalog, project, { engine: "agent", cache: false });
    expect(h.asked).toBe(1); expect(h.promoted).toEqual([]); expect(h.undecided).toEqual(["ADR-007"]); expect(h.note).toContain("not judged (undecided)");
    expect(byId(d, "ADR-007")).toMatchObject({ kind: "cosmetic", judged: { by: "undecided" } });
    const seen: any[] = [];
    const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); seen.push(b); const answers: any = {}; for (const id of Object.keys(b.questions)) answers[id] = { type: "noul", noul: 0.91 }; return { ok: true, json: async () => ({ model: "jev-test", answers }) }; };
    const j = await judgeCosmetic(d, catalog, project, { engine: "typesafe", apiKey: "k", fetch, cache: false });
    expect(seen[0].state.items.a0.removed.join(" ")).toContain("Istio"); expect(seen[0].state.items.a0.added.join(" ")).toContain("Linkerd");   // only the changed lines travel
    expect(j.promoted).toEqual(["ADR-007 (jev-test 0.91)"]);
    expect(byId(d, "ADR-007")).toMatchObject({ kind: "amended", changed_sections: ["(judged)"], judged: { p: 0.91, by: "jev-test" } });
    expect(d.summary.amended).toBe(1); expect(d.summary.cosmetic).toBe(0);
  });
  test.skipIf(!JUDGE_AVAILABLE)("the agent judge — the default engine: a worksheet first, the session's answers applied with answers: true", async () => {
    const { judgeCosmetic } = require("../utils/catalog-diff.ts");
    inCatalog(slug(8, "agent"), withNotes(8, "Agent", "Linkerd runs the data plane."));
    inProject(slug(8, "agent"), withNotes(8, "Agent", "Istio runs the data plane."));
    const d = diffCatalog(catalog, project);
    expect(byId(d, "ADR-008").kind).toBe("cosmetic");
    const first = await judgeCosmetic(d, catalog, project, { engine: "agent", cache: false });
    expect(first.note).toContain("agent worksheet at"); expect(first.note).toContain("--answers");
    expect(byId(d, "ADR-008").kind).toBe("cosmetic");                                             // nothing applied yet
    const worksheet = readFileSync(first.note!.match(/worksheet at (\S+)/)![1], "utf8");
    const answersFile = first.note!.match(/answers to (\S+)\)/)![1];
    const hash = worksheet.match(/"worksheet": "([^"]+)"/)![1];
    writeFileSync(answersFile, JSON.stringify({ worksheet: hash, answers: { a0: 1 } }));             // the session: yes, it changes the decision
    const second = await judgeCosmetic(d, catalog, project, { engine: "agent", answers: true, cache: false });
    expect(second.promoted).toEqual(["ADR-008 (agent 1.00)"]);
    expect(byId(d, "ADR-008")).toMatchObject({ kind: "amended", changed_sections: ["(judged)"] });
  });
});

describe("citationChecklist — every line citing a changed decision, by literal id", () => {
  test("ARCHITECTURE.md, docs/ and project ADRs are read; the changelog and institutional ADRs are not; ADR-0110 is not ADR-011", () => {
    mkdirSync(join(project, "docs", "components"), { recursive: true });
    writeFileSync(join(project, "ARCHITECTURE.md"), "# Order Desk\n\nGateway per ADR-011.\n");
    writeFileSync(join(project, "docs", "08-scale.md"), "intro\n- El propio ADR-011 nombra ese modo de fallo.\n- ADR-0110 is another record.\n");
    writeFileSync(join(project, "docs", "components", "hub.md"), "| Firewall | ADR-045 |\n");
    writeFileSync(join(project, "docs", "CHANGELOG.md"), "- ADR-011 synced\n");
    writeFileSync(join(project, "adr", "ADR-101-local.md"), "Follows ADR-011.\n");
    writeFileSync(join(project, "adr", "ADR-012-mesh.md"), "Cites ADR-011.\n");
    const c = citationChecklist(project, ["ADR-011", "ADR-045"]);
    expect(c.map((x) => `${x.id} ${x.file}:${x.line}`).sort()).toEqual([
      "ADR-011 ARCHITECTURE.md:3", "ADR-011 adr/ADR-101-local.md:1", "ADR-011 docs/08-scale.md:2", "ADR-045 docs/components/hub.md:1"]);
    const md = renderChecklist(c, ["ADR-011", "ADR-045", "ADR-099"]);
    expect(md).toContain("## ADR-011 — 3 citing line(s)");
    expect(md).toContain("- [ ] `docs/08-scale.md:2` —");
    expect(md).toContain("## ADR-099 — 0 citing line(s)\n\n- none");
  });
});
