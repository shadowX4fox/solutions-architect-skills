/**
 * lifecycle.js — the state derived from the baseline (tag or archive), the change list and its recommended bump, the
 * release in each channel (files, direct, PR to a remote), the tag recovery, and the gates run once over a project.
 * The project is synthetic (Order Desk / Hub API) and lives in a temporary git repository.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const L = require("../scripts/lifecycle.js");
const SCRIPT = join(__dirname, "..", "scripts", "lifecycle.js");

// Outside the plugin's repository, and git told not to look above it: a fixture inside a working tree is part of that
// repository, and a release there commits, tags and pushes for real.
const TMP = join(tmpdir(), `sa-lifecycle-test-${process.pid}`);
process.env.GIT_CEILING_DIRECTORIES = TMP;
const ROOT = join(TMP, "project");
const w = (rel: string, body: string) => { mkdirSync(join(ROOT, rel, ".."), { recursive: true }); writeFileSync(join(ROOT, rel), body, "utf-8"); };
const r = (rel: string) => readFileSync(join(ROOT, rel), "utf-8");
const git = (...a: string[]) => { const x = spawnSync("git", ["-C", ROOT, ...a], { encoding: "utf8" }); return x.stdout.trim(); };
const header = (self: string) => `<!-- EXPLORER_HEADER\nkey_concepts: orders\ntechnologies: React\ncomponent_self: ${self}\ncomponent_type: web-application\nscope: One line.\nrelated_adrs: ADR-101\n-->`;
const container = (name: string, self: string, tech: string) => `# ${name}\n\n${header(self)}\n\n**Type:** Web Application\n**Technology:** [${tech}]\n**Description:** ${name} does one thing.\n**C4 Level:** Container (L2)\n\n**Component Version:** 1.0.0\n**Architecture Version:** 1.0.0\n**Last Updated:** 2026-09-01\n\n## Purpose\n\nDoes one thing.\n`;
const integrations = (rows: string) => `# Integrations\n\n| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n${rows}`;

function project() {
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- ARCHITECTURE_STATUS: Draft -->\n<!-- ARCHITECTURE_RELEASED: -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk — Architecture\n\n**Version**: 1.0.0\n**Status**: Draft\n**Released**: —\n**Architect**: Platform Team\n**Supersedes**: —\n`);
  w("docs/01-system-overview.md", `# System Overview\n\nText.\n`);
  w("docs/05-integration-points.md", integrations("| I-01 | `Web App` | `Hub API` | HTTPS/JSON | Request-response | Partner |\n"));
  w("docs/components/order-desk.md", `# Order Desk\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-web-app.md", container("Web App", "web-app", "React"));
  w("adr/ADR-101-keep.md", `# ADR-101: Keep the desk\n\n**Status**: Accepted\n**Scope**: Project\n`);
  w("docs/CHANGELOG.md", `# Architecture Changelog\n\nFormat based on Keep a Changelog.\n\n## [1.0.0] - 2026-09-01 (Draft)\n\n### Added\n- Section files and one component.\n`);
}
function repo() {
  spawnSync("git", ["init", "-q", "-b", "main", ROOT]);
  git("config", "user.email", "t@example.com"); git("config", "user.name", "T"); git("config", "commit.gpgsign", "false"); git("config", "tag.gpgsign", "false");
  git("add", "-A"); git("commit", "-q", "-m", "create");
}
const release = (opts: any = {}) => { const p = L.plan(ROOT, { skipGates: true, today: "2026-10-10" }); expect(p.ok).toBe(true); return L.apply(ROOT, Object.assign({ today: "2026-10-10", noPush: false }, opts)); };

beforeEach(() => { rmSync(TMP, { recursive: true, force: true }); mkdirSync(ROOT, { recursive: true }); project(); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("lifecycle — git, direct", () => {
  test("draft → first release keeps 1.0.0, turns the Draft entry into the release, tags HEAD", () => {
    repo();
    expect(L.status(ROOT).state).toBe("draft");
    const a = release({ direct: true });
    expect(a).toMatchObject({ ok: true, version: "1.0.0", first: true, channel: "direct", components: 0 });
    expect(a.tag).toMatchObject({ name: "architecture-v1.0.0", tag: true, pushed: false });
    expect(r("ARCHITECTURE.md")).toContain("<!-- ARCHITECTURE_STATUS: Released -->");
    expect(r("ARCHITECTURE.md")).toContain("**Released**: 2026-10-10");
    const log = r("docs/CHANGELOG.md");
    expect(log).toMatch(/## \[Unreleased\]\n\n## \[1\.0\.0\] - 2026-10-10\n\n### Added\n- Section files and one component\./);
    expect(log).not.toContain("(Draft)");
    expect(git("status", "--porcelain", "--", "ARCHITECTURE.md", "docs", "adr")).toBe("");
    expect(L.status(ROOT).state).toBe("released");
  });

  test("a change since the tag is listed with its bump; an added container is MINOR, a retired integration MAJOR", () => {
    repo(); release({ direct: true });
    w("docs/components/order-desk/02-order-api.md", container("Order API", "order-api", "Java"));
    let s = L.status(ROOT);
    expect(s.state).toBe("changed");
    expect(s.recommended).toBe("minor");
    expect(s.changes.map((c: any) => c.text)).toContain("Container: Order API (`order-api`)");
    w("docs/05-integration-points.md", integrations("| ~~I-01~~ | ~~`Web App`~~ | ~~`Hub API`~~ | — | — | **Retired** |\n"));
    s = L.status(ROOT);
    expect(s.recommended).toBe("major");
    expect(s.changes.find((c: any) => c.section === "Removed").text).toBe("Integration: I-01 — Web App → Hub API (retired)");
  });

  test("the release writes the change list and the hand-written [Unreleased] lines, bumps every component, commits only the architecture", () => {
    repo(); release({ direct: true });
    w("docs/components/order-desk/01-web-app.md", container("Web App", "web-app", "Vue"));
    w("docs/CHANGELOG.md", r("docs/CHANGELOG.md").replace("## [Unreleased]\n", "## [Unreleased]\n\n### Changed\n- The web app moves to Vue for the design system.\n"));
    w("notes.txt", "not architecture\n");
    const a = release({ direct: true });
    expect(a).toMatchObject({ ok: true, version: "1.1.0", bump: "minor", from: "1.0.0", components: 1 });
    const log = r("docs/CHANGELOG.md");
    expect(log).toMatch(/## \[1\.1\.0\] - 2026-10-10\n\n### Changed\n- The web app moves to Vue for the design system\.\n- Container: Web App — technology: React → Vue/);
    expect(log).toMatch(/## \[Unreleased\]\n\n## \[1\.1\.0\]/);
    expect(r("docs/components/order-desk/01-web-app.md")).toContain("**Architecture Version:** 1.1.0");
    expect(r("ARCHITECTURE.md")).toContain("**Supersedes**: v1.0.0");
    expect(git("status", "--porcelain").split("\n").filter((l) => !l.includes(".cache/"))).toEqual(["?? notes.txt"]);
    expect(git("tag", "-l", "architecture-v*")).toBe("architecture-v1.0.0\narchitecture-v1.1.0");
  });

  test("a plan the architecture moved past is refused; nothing changed means no release", () => {
    repo(); release({ direct: true });
    expect(L.plan(ROOT, { skipGates: true }).reason).toMatch(/nothing changed since v1\.0\.0/);
    w("docs/01-system-overview.md", "# System Overview\n\nOther text.\n");
    expect(L.plan(ROOT, { skipGates: true }).recommended).toBe("patch");
    w("docs/01-system-overview.md", "# System Overview\n\nThird text.\n");
    expect(L.apply(ROOT, { direct: true }).reason).toMatch(/changed after the plan/);
  });

  test("a blocking gate refuses the release unless waived, and the waiver is written into the entry", () => {
    repo(); release({ direct: true });
    w("docs/01-system-overview.md", "# System Overview\n\nOther text.\n");
    L.plan(ROOT, { skipGates: true });
    const planFile = join(ROOT, ".cache/sa-skills/lifecycle/plan.json");
    const p = JSON.parse(readFileSync(planFile, "utf-8")); p.gates = [{ id: "prose", status: "fail", summary: "2 BLOCKING" }]; writeFileSync(planFile, JSON.stringify(p));
    expect(L.apply(ROOT, { direct: true }).reason).toMatch(/blocked by prose/);
    const a = L.apply(ROOT, { direct: true, today: "2026-10-10", waive: ["prose:legacy wording, restyle planned"] });
    expect(a.ok).toBe(true);
    expect(r("docs/CHANGELOG.md")).toContain("> Release gate waived — prose: legacy wording, restyle planned");
  });

  test("a missing tag on a Released document is recovered at HEAD", () => {
    repo(); release({ direct: true });
    git("tag", "-d", "architecture-v1.0.0");
    expect(L.status(ROOT).state).toBe("untagged");
    const x = L.recover(ROOT, { noPush: true });
    expect(x).toMatchObject({ ok: true, action: "tag", tag: true });
    expect(git("tag", "-l", "architecture-v*")).toBe("architecture-v1.0.0");
  });
});

describe("lifecycle — PR to a remote", () => {
  test("branch, commit, tag, both pushed; the base branch is kept for the PR", () => {
    repo(); release({ direct: true });
    const remote = join(TMP, "remote.git"); spawnSync("git", ["init", "-q", "--bare", remote]);
    git("remote", "add", "origin", remote); git("push", "-q", "origin", "main");
    w("adr/ADR-102-hub.md", `# ADR-102: Use the hub\n\n**Status**: Accepted\n**Scope**: Project\n`);
    const a = release();
    expect(a).toMatchObject({ ok: true, version: "1.1.0", channel: "pr", base: "main", branch: { name: "release/architecture-v1.1.0", pushed: true } });
    expect(a.tag).toMatchObject({ tag: true, pushed: true });
    expect(git("rev-parse", "--abbrev-ref", "HEAD")).toBe("release/architecture-v1.1.0");
    expect(spawnSync("git", ["-C", remote, "tag", "-l"], { encoding: "utf8" }).stdout.trim()).toBe("architecture-v1.1.0");
  });
});

describe("lifecycle — git is required, the tag is the baseline", () => {
  test("a release needs git: status says no-git, plan refuses, nothing is written", () => {
    expect(L.status(ROOT).state).toBe("no-git");
    const before = r("ARCHITECTURE.md");
    expect(L.plan(ROOT, { skipGates: true })).toMatchObject({ ok: false, reason: expect.stringMatching(/no-git/) });
    expect(r("ARCHITECTURE.md")).toBe(before);
    expect(existsSync(join(ROOT, "archive"))).toBe(false);
  });

  test("a superseded ADR since the tag is a MINOR change", () => {
    repo(); release({ direct: true });
    w("adr/ADR-101-keep.md", `# ADR-101: Keep the desk\n\n**Status**: Superseded by ADR-102\n**Scope**: Project\n`);
    expect(L.status(ROOT)).toMatchObject({ state: "changed", baseline: { kind: "tag", ref: "architecture-v1.0.0" }, recommended: "minor" });
  });

  test("deprecate writes the status and the note, no release", () => {
    expect(L.deprecate(ROOT, { by: "superseded by Order Desk 2" }).ok).toBe(true);
    expect(r("ARCHITECTURE.md")).toMatch(/\*\*Status\*\*: Deprecated\n\*\*Deprecation Note\*\*: superseded by Order Desk 2/);
    expect(L.status(ROOT).state).toBe("deprecated");
  });
});

describe("lifecycle — downstream and gates", () => {
  test("artifacts older than the release are stale; compliance is never read", () => {
    repo(); release({ direct: true });
    w("PRODUCT_OWNER_SPEC.md", "<!-- ARCHITECTURE_SYNC: 0.9.0 (2026-08-01) -->\n# Spec\n");
    w("TRACEABILITY_REPORT.md", "**Architecture Version**: 1.0.0\n");
    w("compliance-docs/COMPLIANCE_MANIFEST.md", "**Architecture Version**: 0.1.0\n");
    const d = L.downstream(ROOT, "1.0.0", "2026-10-10");
    expect(d.map((x: any) => [x.artifact, x.stale])).toEqual([["PO Spec", true], ["Traceability report", false]]);
  });

  test("check runs every gate once and names the blocking ones (CLI)", () => {
    const x = spawnSync("bun", [SCRIPT, "check", ROOT, "--no-render", "--json"], { encoding: "utf8", timeout: 120000 });
    const g = JSON.parse(x.stdout);
    expect(g.map((y: any) => y.id)).toEqual(expect.arrayContaining(["prose", "headers", "components", "integrations", "budgets", "adr-index"]));
    expect(g.every((y: any) => ["pass", "fail", "warn"].includes(y.status))).toBe(true);
    expect(x.status).toBe(g.some((y: any) => y.status === "fail") ? 1 : 0);
  }, 120000);
});

describe("lifecycle — delivery increments", () => {
  const flows = `# Data Flow\n\n## Phase Catalog\n\n| # | Phase | On critical path? | Owner | Failure mode |\n|---|---|---|---|---|\n| 1 | Take order | Yes | Web App → Order API | Retry |\n| 2 | Settle | Yes | Order API → Hub API | Queue |\n\n### Phase 1 — Take order\n\n**Hops**: Web App → Order API\n\n### Phase 2 — Settle\n\n**Hops**: Order API → Hub API\n\n## Flow Inventory\n\n| Flow | Trigger | Use Case | Latency Target |\n|---|---|---|---|\n| 1. Place order | Click | UC-01 | 1 s |\n| 2. Settle order | Batch | UC-02 | 5 s |\n\n### Flow 1 — Place order\n\n**Phases**: 1\n\n### Flow 2 — Settle order\n\n**Phases**: 1, 2\n`;
  const table = (rows: string) => `# System Overview\n\nText.\n\n### Delivery Increments <!-- LABEL: Delivery Increments -->\n\n| Increment | Use Cases | Target |\n|---|---|---|\n${rows}`;
  const piece = () => {
    w("docs/04-data-flow-patterns.md", flows);
    w("docs/components/order-desk/02-order-api.md", container("Order API", "order-api", "Java"));
    w("docs/components/order-desk/03-hub-api.md", container("Hub API", "hub-api", "Go"));
    w("docs/05-integration-points.md", integrations("| I-01 | `Web App` | `Order API` | HTTPS/JSON | Request-response | Internal |\n| I-02 | `Order API` | `Hub API` | HTTPS/JSON | Request-response | Internal |\n"));
    w("docs/01-system-overview.md", table("| 1 | UC-01 | 2026-12 |\n| 2 | UC-02 | 2027-03 |\n"));
  };
  const S = require("../../../scripts/shared/increments.js");
  const { collect } = require("../../../scripts/shared/arch-facts.js");

  test("each increment's slice is derived: use cases → flows → phases → components, cumulative, with what is new", () => {
    piece();
    const r = S.slices(collect(ROOT));
    expect(r.increments.map((x: any) => x.id)).toEqual(["1", "2"]);
    expect(r.increments[0]).toMatchObject({ flows: ["1"], containers: ["order-api", "web-app"], integrations: ["I-01"], gaps: [] });
    expect(r.increments[1]).toMatchObject({ flows: ["2"], containers: ["hub-api", "order-api", "web-app"], integrations: ["I-01", "I-02"] });
    expect(r.increments[1].new).toEqual({ containers: ["hub-api"], integrations: ["I-02"] });
    expect(r.unassigned).toEqual({ use_cases: [], containers: [] });
  });

  test("a use case no flow serves is a gap; --slugs prints the handoff's --components", () => {
    piece();
    w("docs/01-system-overview.md", table("| 1 | UC-01, UC-07 | 2026-12 |\n"));
    const r = S.slices(collect(ROOT));
    expect(r.increments[0].gaps.map((g: any) => g.rule)).toEqual(["use-case-no-flow"]);
    expect(r.unassigned.use_cases).toEqual(["UC-02"]);
    expect(r.unassigned.containers).toEqual(["hub-api"]);
    const x = spawnSync("bun", [join(__dirname, "..", "..", "..", "scripts", "shared", "increments.js"), ROOT, "--increment", "1", "--slugs"], { encoding: "utf8" });
    expect(x.stdout.trim()).toBe("order-api,web-app");
  });

  test("plan --increment gates the piece and writes its scope into the entry; status says which release carried it", () => {
    piece(); repo(); release({ direct: true });
    w("docs/components/order-desk/03-hub-api.md", container("Hub API", "hub-api", "Rust"));
    const p = L.plan(ROOT, { increment: "2", today: "2026-10-10", noRender: true });
    const g = p.gates.find((x: any) => x.id === "increment");
    expect(g.status).toBe("pass");
    expect(p.increment).toMatchObject({ id: "2", new_containers: ["hub-api"] });
    const entry = readFileSync(join(ROOT, ".cache/sa-skills/lifecycle/entry.md"), "utf8");
    expect(entry.split("\n")[0]).toBe("**Delivery scope**: increment 2 — UC-02 · 3 containers (1 new) · 2 integrations (1 new) <!-- DELIVERY_INCREMENT: 2 -->");
    expect(L.plan(ROOT, { increment: "9", skipGates: false, noRender: true }).gates.find((x: any) => x.id === "increment").status).toBe("fail");
    L.plan(ROOT, { increment: "2", skipGates: true, today: "2026-10-10" });
    L.apply(ROOT, { today: "2026-10-10", direct: true, bump: "minor" });
    const s = L.status(ROOT);
    expect(s.increments.list.map((x: any) => [x.id, x.released_in])).toEqual([["1", null], ["2", "1.1.0"]]);
  });

  const transition = (tdr = "TDR-001") => {
    piece();
    w("docs/04-data-flow-patterns.md", flows.replace("| 2. Settle order | Batch | UC-02 | 5 s |\n", "| 2. Settle order | Batch | UC-02 | 5 s |\n| 3. Reconcile | Batch | UC-03 | 1 h |\n") + "\n### Flow 3 — Reconcile\n\n**Phases**: 2\n");
    w("docs/components/order-desk/04-batch-bridge.md", container("Batch Bridge", "batch-bridge", "Python").replace("**Last Updated:** 2026-09-01", `**Last Updated:** 2026-09-01\n**Delivery Increments:** 1–2 · ${tdr}`));
    w("docs/05-integration-points.md", "# Integrations\n\n| # | From | To | Protocol | Pattern | Boundary | Increments |\n|---|---|---|---|---|---|---|\n| I-01 | `Web App` | `Order API` | HTTPS/JSON | Request-response | Internal | |\n| I-02 | `Order API` | `Hub API` | HTTPS/JSON | Request-response | Internal | |\n| I-03 | `Order API` | `Batch Bridge` | SFTP/CSV | Batch | Internal | 1–2 · TDR-001 |\n");
    w("tdr/TDR-001-batch-bridge.md", "---\nstatus: Planned\n---\n# TDR-001: Batch bridge until the Hub API settles online\n");
    w("docs/01-system-overview.md", table("| 1 | UC-01 | 2026-12 |\n| 2 | UC-02 | 2027-03 |\n| 3 | UC-03 | 2027-06 |\n"));
  };

  test("a temporary element is in the slice inside its window, retired after it, and blocks the next increment until it is retired", () => {
    transition();
    let sl = S.slices(collect(ROOT));
    expect(sl.temporary_gaps).toEqual([]);
    expect(sl.increments[0].containers).toContain("batch-bridge");
    expect(sl.increments[0].integrations).toEqual(["I-01", "I-03"]);
    expect(sl.increments[0].temporary.map((t: any) => [t.key, t.until, t.tdr])).toEqual([["batch-bridge", "2", "TDR-001"], ["I-03", "2", "TDR-001"]]);
    expect(sl.increments[2].containers).not.toContain("batch-bridge");
    expect(sl.increments[2].retired).toEqual({ containers: ["batch-bridge"], integrations: ["I-03"] });
    expect(sl.increments[2].gaps.filter((g: any) => g.rule === "retire-pending").length).toBe(2);
    expect(sl.unassigned.containers).toEqual([]);
    // the release of increment 3 retires them: row struck, descriptor removed — the TDR still open is a warning
    rmSync(join(ROOT, "docs/components/order-desk/04-batch-bridge.md"));
    w("docs/05-integration-points.md", r("docs/05-integration-points.md").replace("| I-03 | `Order API` | `Batch Bridge` | SFTP/CSV | Batch | Internal |", "| ~~I-03~~ | ~~`Order API`~~ | ~~`Batch Bridge`~~ | — | — | **Retired** |"));
    sl = S.slices(collect(ROOT));
    expect(sl.increments[2].gaps.map((g: any) => [g.rule, g.severity || "error"])).toEqual([["tdr-open", "warning"]]);
  });

  test("a temporary element without its TDR blocks the increment gate; its window moved is MINOR", () => {
    transition("TDR-009");
    const g = L.gates(ROOT, collect(ROOT), { increment: "1" }).find((x: any) => x.id === "increment");
    expect(g.status).toBe("fail");
    expect(g.summary).toContain("Batch Bridge cites TDR-009, which is not in tdr/");
    transition(); repo(); release({ direct: true });
    w("docs/05-integration-points.md", r("docs/05-integration-points.md").replace("| 1–2 · TDR-001 |", "| 1–3 · TDR-001 |"));
    expect(L.status(ROOT).changes.map((c: any) => [c.bump, c.text])).toContainEqual(["minor", "Integration: I-03 — delivery window: 1–2 · TDR-001 → 1–3 · TDR-001"]);
  });

  test("a gate blocks an increment only on findings inside it: a later increment's broken descriptor is set aside", () => {
    piece();
    w("docs/components/order-desk/03-hub-api.md", container("Hub API", "hub-api", "Go").replace(/\*\*Description:\*\*[^\n]*\n/, ""));
    const comp = (inc: string) => L.gates(ROOT, collect(ROOT), { increment: inc }).find((x: any) => x.id === "components");
    // the fixture's own descriptors carry defects in every increment; the later container's two are set aside for increment 1 only
    const one = comp("1");
    expect(one.status).toBe("fail");
    expect(one.outside).toBe(2);
    expect(one.summary).toMatch(/\(2 outside it, not blocking\)/);
    expect(one.summary).not.toContain("03-hub-api.md");
    expect(comp("2").outside).toBeUndefined();
    expect(L.gates(ROOT, collect(ROOT), {}).find((x: any) => x.id === "components").outside).toBeUndefined();
  });

  test("a finding is placed by its component file, its docs/05 row, the docs/04 heading above it, or its flow", () => {
    piece();
    const facts = collect(ROOT), s1 = S.slices(facts).increments[0];
    const at = (file: string, re: RegExp) => readFileSync(join(ROOT, file), "utf8").split("\n").findIndex((l) => re.test(l)) + 1;
    const inOne = L.scopeOf(ROOT, facts, s1);
    expect(inOne({ file: "docs/components/order-desk/01-web-app.md" })).toBe(true);
    expect(inOne({ file: "docs/components/order-desk/03-hub-api.md" })).toBe(false);
    expect(inOne({ file: "docs/05-integration-points.md", line: at("docs/05-integration-points.md", /^\| I-01/) })).toBe(true);
    expect(inOne({ file: "docs/05-integration-points.md", line: at("docs/05-integration-points.md", /^\| I-02/) })).toBe(false);
    expect(inOne({ file: "docs/04-data-flow-patterns.md", line: at("docs/04-data-flow-patterns.md", /^### Phase 2/) + 2 })).toBe(false);
    expect(inOne({ file: "docs/04-data-flow-patterns.md", line: at("docs/04-data-flow-patterns.md", /^### Flow 1/) + 2 })).toBe(true);
    expect(inOne({ flow: "2" })).toBe(false);
    expect(inOne({ file: "docs/02-architecture-principles.md", line: 3 })).toBe(true);
  });

  test("an increment added is MINOR, its target moved is PATCH", () => {
    piece(); w("docs/01-system-overview.md", table("| 1 | UC-01 | 2026-12 |\n")); repo(); release({ direct: true });
    w("docs/01-system-overview.md", table("| 1 | UC-01 | 2027-01 |\n| 2 | UC-02 | 2027-03 |\n"));
    const s = L.status(ROOT);
    expect(s.changes.filter((c: any) => /Delivery increment/.test(c.text)).map((c: any) => [c.bump, c.text])).toEqual([
      ["patch", "Delivery increment 1 — target: 2026-12 → 2027-01"],
      ["minor", "Delivery increment 2: UC-02"],
    ]);
  });
});
