/**
 * tdr-check.js — the TDR status contract as code. A fixture that passes clean (the skill's own example plus
 * records in every status, one in Spanish), then one rule at a time, then the arrows.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, checkRecord, move, pending, STATUSES } = require("../scripts/tdr-check.js");
const SCRIPT = join(__dirname, "..", "scripts", "tdr-check.js");
const EXAMPLE = join(__dirname, "..", "examples", "TDR-001-centralized-log-aggregation.md");
const TMP = join(__dirname, ".temp-tdr-check");

const record = (n: number, status: string, o: { fm?: string; tech?: string; history?: string[]; driver?: string; body?: string; es?: boolean } = {}) => {
  const es = !!o.es;
  return [
    "---", `status: ${o.fm ?? status}`, ...(status === "Planned" && o.fm !== "no-target" ? ["target-date: 2026-12-01"] : []), `driver: ${o.driver ?? "Process"}`, "---", "",
    `# TDR-00${n}: A debt`, "",
    es ? "## Estado <!-- SECTION: Status -->" : "## Status", "", `\`${o.body ?? status}\``, "",
    es ? "**Iniciativa**: Order Desk (architecture v1.2.0)" : "**Initiative**: Order Desk (architecture v1.2.0)",
    `**Driver**: ${o.driver ?? "Process"} — weak instrumentation`, "",
    es ? "## Descripción" : "## Description", "", "The cache has one node.", "",
    es ? "## Impacto" : "## Impact", "", "A node loss stops the flow.", "",
    es ? "## Posibles Soluciones" : "## Possible Solutions", "", "- Option A: replicate.", "",
    es ? "## Responsable" : "## Owner", "", `- **${es ? "Técnico" : "Technical"}**: ${o.tech ?? "Platform team (lead: M. Salazar)"}`, "- **Business (P&L)**: Digital Commerce", "",
    es ? "## Historial" : "## History", "", ...(o.history ?? ["- 2026-05-13: Created. Status: `Open`."]), "",
  ].join("\n");
};
const index = (rows: [string, string][]) => ["# TDRs", "", "| ID | Title | Status | Driver | Owner |", "|---|---|---|---|---|", ...rows.map(([id, st]) => `| ${id} | A debt | ${st} | Process | team |`), ""].join("\n");

const w = (root: string, rel: string, body: string) => { mkdirSync(join(root, "tdr"), { recursive: true }); writeFileSync(join(root, rel), body); };
let root: string;
beforeAll(() => {
  root = join(TMP, "clean"); rmSync(TMP, { recursive: true, force: true });
  w(root, "tdr/TDR-001-centralized-log-aggregation.md", readFileSync(EXAMPLE, "utf8"));
  w(root, "tdr/TDR-002-planned.md", record(2, "Planned"));
  w(root, "tdr/TDR-003-resolved.md", record(3, "Resolved", { history: ["- 2026-05-13: Created. Status: `Open`.", "- 2026-06-01: `Open` → `In Progress`.", "- 2026-07-01: `In Progress` → `Resolved` — PR #77 merged."] }));
  w(root, "tdr/TDR-004-wont-fix.md", record(4, "Won't Fix", { history: ["- 2026-05-13: Created. Status: `Open`.", "- 2026-08-01: `Open` → `Won't Fix` — investment decision by the CTO on 2026-07-30, board card BANCA ROTA."], es: true }));
  w(root, "tdr/README.md", index([["TDR-001", "In Progress"], ["TDR-002", "Planned"], ["TDR-003", "Resolved"], ["TDR-004", "Won't Fix"]]));
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const rules = (src: string) => checkRecord("tdr/TDR-009-x.md", src).findings.map((f: any) => f.rule);

describe("a clean corpus", () => {
  test("the example and one record per status pass; the Spanish structure reads, and is reported", () => {
    const r = check(root);
    expect(r.records.map((x: any) => x.status)).toEqual(["In Progress", "Planned", "Resolved", "Won't Fix"]);
    expect(r.findings.every((f: any) => f.rule === "structure-localized" && f.level === "WARNING" && f.file === "tdr/TDR-004-wont-fix.md")).toBe(true);
    expect(r.findings.length).toBe(8);
    expect(r.blocking).toBe(0);
  });
  test("the CLI exits 0 and says so", () => {
    const run = Bun.spawnSync(["bun", SCRIPT, root]);
    expect(run.exitCode).toBe(0);
    expect(run.stdout.toString()).toContain("4 record(s) — 0 blocking");
  });
});

describe("one rule at a time", () => {
  test("status outside the five", () => expect(rules(record(9, "Open", { body: "Pending", fm: "Pending" }))).toEqual(["status-invalid", "status-invalid"]));
  test("a retired board tag names its destination", () => {
    const f = checkRecord("tdr/x.md", record(9, "Open", { body: "Ya esta, en local", fm: "Ya esta, en local" })).findings;
    expect(f.map((x: any) => x.rule)).toEqual(["status-retired-tag", "status-retired-tag"]);
    expect(f[0].message).toContain("`In Progress`");
  });
  test("a Jira spelling in the file", () => expect(rules(record(9, "Open", { body: "PAGADA", fm: "Resolved", history: ["- 2026-07-01: `Resolved` — PR #1."] }))).toEqual(["status-jira-spelling"]));
  test("frontmatter and body disagree; the key is missing", () => {
    expect(rules(record(9, "Open", { fm: "In Progress" }))).toEqual(["status-mismatch"]);
    expect(rules(record(9, "Open").replace(/^status: Open\n/m, ""))).toEqual(["status-key-missing"]);
  });
  test("Planned without target-date", () => expect(rules(record(9, "Planned", { fm: "no-target" }).replace("no-target", "Planned"))).toEqual(["planned-target-date"]));
  test("In Progress without a named owner", () => expect(rules(record(9, "In Progress", { tech: "TBD" }))).toEqual(["in-progress-owner"]));
  test("Resolved without a note, then without a link", () => {
    expect(rules(record(9, "Resolved"))).toEqual(["resolved-history"]);
    expect(rules(record(9, "Resolved", { history: ["- 2026-07-01: `Resolved`, verified in staging."] }))).toEqual(["resolved-link"]);
  });
  test("Won't Fix without the decision", () => expect(rules(record(9, "Won't Fix"))).toEqual(["wont-fix-decision"]));
  test("driver outside the four, or not the key's word", () => {
    expect(rules(record(9, "Open", { driver: "Budget" }))).toEqual(["driver-invalid"]);
    expect(rules(record(9, "Open").replace(/^driver: Process$/m, "driver: Talent"))).toEqual(["driver-mismatch"]);
  });
  test("initiative missing; sections out of order", () => {
    expect(rules(record(9, "Open").replace(/^\*\*Initiative\*\*.*\n/m, ""))).toEqual(["initiative-missing"]);
    const src = record(9, "Open").replace("## Impact\n\nA node loss stops the flow.\n\n## Description\n\nThe cache has one node.", "x");
    const swapped = record(9, "Open").replace("## Description\n\nThe cache has one node.\n\n## Impact\n\nA node loss stops the flow.", "## Impact\n\nA node loss stops the flow.\n\n## Description\n\nThe cache has one node.");
    expect(src).toBeTruthy();
    expect(rules(swapped)).toEqual(["section-order"]);
  });
});

describe("the index", () => {
  test("a missing row and a drifted status block; an orphan warns", () => {
    const r2 = join(TMP, "index");
    w(r2, "tdr/TDR-001-a.md", record(1, "Open"));
    w(r2, "tdr/TDR-002-b.md", record(2, "In Progress"));
    w(r2, "tdr/README.md", index([["TDR-002", "Open"], ["TDR-007", "Open"]]));
    const r = check(r2);
    expect(r.findings.map((f: any) => f.rule)).toEqual(["index-row-missing", "index-drift", "index-row-orphan"]);
    expect(r.blocking).toBe(2);
    expect(r.warnings).toBe(1);
  });

  test("a linked id in the index is the same row (8.92.8)", () => {
    const r3 = join(TMP, "index-linked");
    w(r3, "tdr/TDR-001-a.md", record(1, "Open"));
    w(r3, "tdr/README.md", index([["[TDR-001](TDR-001-a.md)", "Open"]]));
    expect(check(r3).findings.map((f: any) => f.rule)).toEqual([]);
  });
});

describe("the arrows", () => {
  test("the four moves are allowed", () => {
    expect(move("Open", "In Progress").ok).toBe(true);
    expect(move("Planned", "In Progress").ok).toBe(true);
    expect(move("In Progress", "Resolved").ok).toBe(true);
    expect(move("Open", "Won't Fix").ok).toBe(true);
    expect(move("Planned", "Open").ok).toBe(true);
  });
  test("never straight to Resolved; the refusal names the arrow", () => {
    const m = move("Open", "Resolved");
    expect(m.ok).toBe(false);
    expect(m.reason).toContain("Open ──► In Progress ──► Resolved");
    expect(move("Planned", "Won't Fix").reason).toContain("Planned ──► Open ──► Won't Fix");
    expect(move("In Progress", "Won't Fix").reason).toContain("no arrow");
    expect(move("Resolved", "Open").reason).toContain("terminal");
  });
  test("a retired tag or a Jira spelling resolves before the move", () => {
    expect(move("Ya esta, en local", "PAGADA")).toMatchObject({ ok: true, from: "In Progress", to: "Resolved" });
  });
  test("the CLI refuses with exit 1 and allows with exit 0", () => {
    const no = Bun.spawnSync(["bun", SCRIPT, root, "--move", "TDR-002", "Resolved"]);
    expect(no.exitCode).toBe(1);
    expect(no.stdout.toString()).toContain("Planned ──► In Progress ──► Resolved");
    const yes = Bun.spawnSync(["bun", SCRIPT, root, "--move", "tdr-001", "Resolved"]);
    expect(yes.exitCode).toBe(0);
    expect(yes.stdout.toString()).toContain("In Progress ──► Resolved — allowed");
  });
  test("STATUSES is the closed set", () => expect(STATUSES).toEqual(["Open", "Planned", "In Progress", "Resolved", "Won't Fix"]));
});

describe("size", () => {
  test("a section over its budget and a History note over one line are WARNINGs, BLOCKING once the project is stamped", () => {
    const root = join(TMP, "size");
    rmSync(root, { recursive: true, force: true });
    const long = Array.from({ length: 260 }, (_, k) => `w${k}`).join(" ");
    w(root, "tdr/TDR-001-x.md", record(1, "Open", { history: ["- 2026-09-01: " + Array.from({ length: 40 }, () => "word").join(" ")] }).replace("The cache has one node.", long));
    w(root, "tdr/README.md", index([["TDR-001", "Open"]]));
    const r = check(root);
    const size = r.findings.filter((f: any) => /^tdr-(section|log-entry)-length$/.test(f.rule));
    expect(size.map((f: any) => f.rule).sort()).toEqual(["tdr-log-entry-length", "tdr-section-length"]);
    expect(size.every((f: any) => f.level === "WARNING")).toBe(true);
    writeFileSync(join(root, "ARCHITECTURE.md"), "# X\n<!-- PROSE_STYLE: v1 -->\n");
    expect(check(root).findings.filter((f: any) => /-length$/.test(f.rule)).every((f: any) => f.level === "BLOCKING")).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("structure stays English", () => {
  test("an English record in Spanish prose is clean", () => {
    expect(rules(record(9, "Open").replace("The cache has one node.", "La caché tiene un solo nodo."))).toEqual([]);
  });
  test("each localized heading and label names its English form", () => {
    const f = checkRecord("tdr/TDR-009-x.md", record(9, "Open", { es: true })).findings;
    const msg = f.map((x: any) => x.message).join("\n");
    ["## Status", "## Description", "## Impact", "## Possible Solutions", "## Owner", "## History", "**Initiative**", "**Technical**"].forEach((en) => expect(msg).toContain("`" + en + "`"));
    expect(f.every((x: any) => x.rule === "structure-localized" && x.level === "WARNING")).toBe(true);
  });
  test("an anchor comment on an English heading is reported", () => {
    const f = checkRecord("tdr/TDR-009-x.md", record(9, "Open").replace("## Impact", "## Impact <!-- SECTION: Impact -->")).findings;
    expect(f.map((x: any) => [x.rule, x.message])).toEqual([["structure-localized", "`## Impact <!-- SECTION: Impact -->` — records carry no anchor comment: drop it"]]);
  });
  test("a translated Driver is read and reported, not missing", () => {
    const r = rules(record(9, "Open").replace("**Driver**:", "**Impulsor**:"));
    expect(r).toEqual(["structure-localized"]);
  });
  test("the Capability table: header and level names", () => {
    const cap = ["## Capacidad", "", "| Nivel | Nombre | Código / id BIAN |", "|---|---|---|", "| Área de Negocio | Customers | `CUS` |", "| Dominio de Servicio | Customer Offer | `SD-1` |", "", "## Owner"].join("\n");
    const f = checkRecord("tdr/TDR-009-x.md", record(9, "Open").replace("## Owner", cap)).findings;
    expect(f.map((x: any) => x.line).length).toBe(4);
    expect(f.map((x: any) => x.message).join(" ")).toContain("`Área de Negocio` → `Business Area`");
  });
  test("BLOCKING once PROSE_STYLE: v1 is stamped", () => {
    const root = join(TMP, "stamped-es"); rmSync(root, { recursive: true, force: true });
    w(root, "tdr/TDR-001-x.md", record(1, "Open", { es: true }));
    w(root, "tdr/README.md", index([["TDR-001", "Open"]]));
    expect(check(root).blocking).toBe(0);
    writeFileSync(join(root, "ARCHITECTURE.md"), "# X\n<!-- PROSE_STYLE: v1 -->\n");
    expect(check(root).findings.filter((f: any) => f.rule === "structure-localized").every((f: any) => f.level === "BLOCKING")).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("pending — the TDRs the documents owe (8.92.7)", () => {
  const root = join(__dirname, ".temp-tdr-pending");
  const put = (rel: string, body: string) => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body); };
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  test("an id cited with no record is pending with its lines; a record on disk is not; a promise without an id is listed", () => {
    rmSync(root, { recursive: true, force: true });
    put("docs/02-architecture-principles.md", "# P\n\n<!-- EXPLORER_HEADER\nrelated_tdrs: TDR-009\n-->\n\n- El waiver está pendiente (TDR-001).\n- Ver TDR-002.\n- Formato `TDR-NNN`.\n");
    put("adr/ADR-106-x.md", "# ADR-106\n\n- El waiver pendiente se registra como TDR.\n");
    put("tdr/TDR-002-y.md", "# TDR-002: y\n");
    const p = pending(root);
    expect(p.pending.map((x: { id: string }) => x.id)).toEqual(["TDR-001"]);
    expect(p.pending[0].cites[0]).toMatchObject({ file: "docs/02-architecture-principles.md", line: 7 });
    expect(p.unnumbered.map((c: { file: string }) => c.file)).toEqual(["adr/ADR-106-x.md"]);
    expect(p.next).toBe("TDR-003");
  });

  test("a promise that names an id on disk is not unnumbered (8.92.8)", () => {
    put("adr/ADR-108-z.md", "# ADR-108\n\nEl waiver está pendiente y se registra en TDR-002.\n");
    expect(pending(root).unnumbered.map((c: { file: string }) => c.file)).not.toContain("adr/ADR-108-z.md");
  });
});
