/**
 * export-index.js — the sa-index/1 bundle: chunks cut by the documents' own structure with stable ids, the ledger, and a
 * build pack only from a handoff kit that holds (this version, kit-check clean); the channel from git; the bundle check.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, cpSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exportIndex, checkBundle, diffBundles, renderChanges } = require("../scripts/export-index.js");

const BASE = mkdtempSync(join(tmpdir(), "sa-index-"));
const P = join(BASE, "order-desk");
const w = (p: string, s: string) => { mkdirSync(dirname(join(P, p)), { recursive: true }); writeFileSync(join(P, p), s); };
const hdr = (self: string, type: string, adrs = "ADR-101") => `<!-- EXPLORER_HEADER\nkey_concepts: orders\ntechnologies: Java\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: s\nrelated_adrs: ${adrs}\n-->`;
const docHdr = (comps: string) => `<!-- EXPLORER_HEADER\nkey_concepts: orders\ntechnologies: Java\ncomponents: ${comps}\nscope: s\nrelated_adrs: ADR-101\n-->`;
const clean = () => [];
const KIT = "<!-- managed by sa-skills:architecture-dev-handoff -->\n<!-- TEMPLATE_VERSION: 4.3.0 -->";   // the markers kit-check.js requires of every kit part

function fixture(version = "1.3.0") {
  rmSync(P, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: ${version} -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- ARCHITECTURE_RELEASED: 2026-10-01 -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk — Architecture\n\n**Version**: ${version}\n\n## Navigation\n\nOrder Desk takes orders from shops and books them on the ledger.\n`);
  w("docs/01-system-overview.md", `# 1. System Overview\n\n${docHdr("web-app, hub-api")}\n\n## 1. Executive Summary <!-- SECTION: Executive Summary -->\n\nOrder Desk books shop orders.\n\n### Problem Statement <!-- LABEL: Problem Statement -->\n\nShops phone orders in.\n\n### Solution <!-- LABEL: Solution -->\n\nA web app over one API.\n\n\`\`\`mermaid\nflowchart TB\n  A --> B\n\`\`\`\n\nAfter the diagram.\n`);
  w("docs/02-architecture-principles.md", `# 3. Architecture Principles\n\n${docHdr("hub-api")}\n\n## 3. Principles <!-- SECTION: Architecture Principles -->\n\n### 3.1 Idempotent writes <!-- PRINCIPLE: Idempotency -->\n\n**Description:** Every write carries a key.\n\n#### Trade-offs\n\n- retries cost a lookup\n\n### 3.2 Notes\n\nfirst\n\n### 3.2 Notes\n\nsecond\n`);
  w("docs/04-data-flow-patterns.md", `# 6. Data Flow\n\n${docHdr("web-app, hub-api, ledger-store")}\n\n## Phase Catalog <!-- LABEL: Phase Catalog -->\n\n| # | Phase | On critical path? | Owner | Failure mode |\n|---|---|---|---|---|\n| 1 | Accept order | Yes | Web App → Hub API | reject |\n| 2 | Book order | Yes | Hub API → Ledger Store | retry |\n\n#### Phase 1 — Accept order\n\n**Hops**: Web App → Hub API\n**Latency budget (p95)**: 120 ms\n\n#### Phase 2 — Book order\n\n**Hops**: Hub API → Ledger Store\n**Latency budget (p95)**: 80 ms\n\n## Flow Inventory <!-- LABEL: Flow Inventory -->\n\n| Flow | Trigger | Use Case | Latency Target |\n|---|---|---|---|\n| 1. Place order | shop submits | UC-01 | 300 ms |\n\n### Flow 1 — Place order\n\n**Phases**: 1, 2\n**Governed by**: ADR-101\n`);
  w("docs/05-integration-points.md", `# 7. Integration Points\n\n${docHdr("web-app, hub-api, ledger-store")}\n\n## Inventory <!-- SECTION: Integration Points -->\n\n| ID | From | To | Protocol | Pattern |\n|---|---|---|---|---|\n| I-01 | Web App | Hub API | HTTPS/JSON | sync |\n| I-02 | Hub API | Ledger Store | PGWIRE | sync |\n\n### I-01 Web App to Hub API\n\nOrders arrive as JSON with an idempotency key.\n`);
  w("docs/components/README.md", `# Components\n\n| # | Component | File | Type | Technology |\n|---|---|---|---|---|\n`);
  w("docs/components/desk.md", `# Desk\n\n${hdr("desk", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/desk/01-web-app.md", `# Web App\n\n${hdr("web-app", "web-application")}\n\n**Type:** Web Application\n**Technology:** [React]\n\nThe shop-facing app.\n`);
  w("docs/components/desk/02-hub-api.md", `# Hub API\n\n${hdr("hub-api", "api-service")}\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n**Internal Name:** od-hub-api\n**Component Version:** 1.1.0\n\nTakes orders, books them.\n`);
  w("docs/components/desk/03-ledger-store.md", `# Ledger Store\n\n${hdr("ledger-store", "database")}\n\n**Type:** Database\n**Technology:** [PostgreSQL]\n`);
  w("adr/ADR-101-idempotency-keys.md", `# ADR-101: Idempotency keys on every write\n\n**Status**: Accepted\n**Scope**: Project\n\n## Context\n\nShops retry.\n\n## Decision\n\nA key per write.\n`);
  w("tdr/TDR-001-manual-ledger-fix.md", `---\nstatus: Open\n---\n# TDR-001: Manual ledger fix\n\n## Description\n\nA script fixes ledger rows by hand.\n`);
  w("compliance-docs/CC-001.md", "# Contract\n\nZEBRA-COMPLIANCE-TOKEN\n");
  // the handoff kit: Hub API packed, Web App covered at an older version
  w("handoffs/SYSTEM_RUNTIME_VIEW.md", `# System Runtime View\n\n${KIT}\n\n## Flows <!-- SECTION: Flows -->\n\nflows.\n`);
  w("handoffs/CROSS_CUTTING_STANDARDS.md", `# Cross-Cutting Standards\n\n${KIT}\n\n## Errors <!-- SECTION: Error semantics -->\n\nerrors.\n`);
  w("handoffs/interfaces/web-app→hub-api.md", `# Interface Contract: Web App → Hub API\n\n${KIT}\n\nPOST /orders.\n`);
  w("handoffs/interfaces/hub-api→ledger-store.md", `# Interface Contract: Hub API → Ledger Store\n\n${KIT}\n\n[NOT DOCUMENTED — pool size]\n`);
  w("handoffs/components/02-hub-api.md", `# Hub API\n\n${KIT}\n\n## Acceptance <!-- SECTION: Acceptance -->\n\nan order books once.\n`);
  w("handoffs/components/01-web-app.md", `# Web App\n\n${KIT}\n`);
  w("handoffs/assets/02-hub-api/openapi.yaml", "openapi: 3.1.0\ninfo:\n  title: Hub API\n  version: 1.1.0\npaths: {}\n");
  w("handoffs/assets/02-hub-api/ddl.sql", "CREATE TABLE orders (id uuid primary key);\n");
  w("handoffs/assets/02-hub-api/c4-descriptor.md", "# Hub API\n");
  w("handoffs/assets/02-hub-api/security.md", `# Hub API — Security Obligations\n\n<!-- managed by sa-skills:architecture-dev-handoff — rendered by security-obligations.js from the architecture docs and the security analyses; fix a value there and re-run, never here -->\n\n## Inbound — who may call <!-- SECTION: Inbound -->\n\n| Integration | Caller | Protocol | Authentication | Source |\n|---|---|---|---|---|\n| I-01 | Web App | REST | mTLS through the mesh | STRIDE TB-01 |\n\nAny other caller is rejected.\n\n## Decisions in force <!-- SECTION: Decisions in Force -->\n\n- [ADR-012](../../../adr/ADR-012-service-mesh.md) — Service mesh\n`);
  w("handoffs/components/01-web-app.md".replace("components/01-web-app.md", "assets/01-web-app/security.md"), "# Web App — Security Obligations\n\n<!-- managed by sa-skills:architecture-dev-handoff — rendered by security-obligations.js -->\n");
  w("adr/ADR-012-service-mesh.md", `# ADR-012: Service mesh\n\n**Status**: Accepted\n**Scope**: Institutional\n\n## Decision\n\nmTLS between pods.\n`);
  const e = (file: string, v: string) => ({ payload_hash: "sha256:x", template_version: "4.3.0", schema_version: "4", architecture_version: v, cut_sheet_file: file, assets: ["openapi", "ddl", "c4-descriptor"], doc_language: "en", generated: "2026-10-01T10:00:00Z" });
  w("handoffs/.manifest.json", JSON.stringify({ version: "4", generator: "sa-skills:architecture-dev-handoff", generator_version: "8.143.5",
    run: { ekonte_hash: "sha256:a", ekonte_template_version: "4.3.0", settei_hash: "sha256:a", settei_template_version: "4.3.0", schema_version: "4", architecture_version: version, generated: "2026-10-01T10:00:00Z" },
    seams: { "web-app→hub-api": { payload_hash: "sha256:b", template_version: "4.3.0", schema_version: "4", seam_file: "interfaces/web-app→hub-api.md", related_adrs: ["ADR-101"], generated: "2026-10-01T10:00:00Z" },
      "hub-api→ledger-store": { payload_hash: "sha256:c", template_version: "4.3.0", schema_version: "4", seam_file: "interfaces/hub-api→ledger-store.md", related_adrs: [], generated: "2026-10-01T10:00:00Z" } },
    cut_sheets: { "hub-api": e("components/02-hub-api.md", version), "web-app": e("components/01-web-app.md", "1.2.0") } }));
}
const chunks = (out: string) => readFileSync(join(out, "chunks.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

beforeEach(() => fixture());
afterAll(() => rmSync(BASE, { recursive: true, force: true }));

describe("export-index — chunks", () => {
  test("one chunk per unit, a context line first, comments out, a Mermaid block named, metadata from the ledger", () => {
    const { out, manifest } = exportIndex(P, { kitCheck: clean });
    expect(out).toBe(join(P, ".cache", "sa-skills", "index", "draft"));   // no git: a draft
    expect(manifest).toMatchObject({ schema: "sa-index/1", channel: "draft", git: null, project: { key: "order-desk", name: "Order Desk" }, architecture: { version: "1.3.0", language: "en" } });
    const cs = chunks(out);
    const kinds = new Set(cs.map((c) => c.meta.kind));
    for (const k of ["overview", "section", "principle", "flow", "phase", "integration", "component", "adr", "tdr"]) expect(kinds).toContain(k);
    const sol = cs.find((c) => c.meta.title === "Solution")!;
    expect(sol.text.split("\n")[0]).toBe("Order Desk › 1. System Overview › 1. Executive Summary › Solution");
    expect(sol.meta.anchor).toBe("1. System Overview › Executive Summary › Solution");   // the id path reads the anchors
    expect(sol.text).toContain("[Mermaid diagram — docs/01-system-overview.md:");
    expect(sol.text).not.toContain("flowchart"); expect(sol.text).not.toContain("<!--"); expect(sol.text).toContain("After the diagram.");
    expect(sol.meta).toMatchObject({ project: "order-desk", architecture_version: "1.3.0", channel: "draft", doc_language: "en", file: "docs/01-system-overview.md", components: ["web-app", "hub-api"], adrs: ["ADR-101"] });
    const pr = cs.find((c) => c.meta.kind === "principle")!;
    expect(pr.meta.principle).toBe("Idempotency"); expect(pr.text).toContain("retries cost a lookup");   // the H4 stays inside its principle
    const flow = cs.find((c) => c.meta.kind === "flow")!;
    expect(flow.meta).toMatchObject({ flow: "1", use_cases: ["UC-01"], phases: ["1", "2"], latency_target: "300 ms", adrs: ["ADR-101"] });
    expect(flow.meta.components.sort()).toEqual(["hub-api", "ledger-store", "web-app"]);
    expect(cs.find((c) => c.meta.kind === "phase" && c.meta.phase === "2")!.meta).toMatchObject({ latency_budget: "80 ms", components: ["hub-api", "ledger-store"] });
    const i1 = cs.filter((c) => c.meta.integration === "I-01"); expect(i1).toHaveLength(1);   // the block carries the row; no second chunk
    expect(i1[0].text).toContain("I-01 · Web App → Hub API · HTTPS/JSON · sync"); expect(i1[0].text).toContain("idempotency key");
    expect(cs.find((c) => c.meta.integration === "I-02")!.meta).toMatchObject({ kind: "integration", components: ["hub-api", "ledger-store"], protocol: "PGWIRE" });
    const hub = cs.find((c) => c.meta.kind === "component" && c.meta.component === "hub-api")!;
    expect(hub.text).toContain("Hub API — Container, API Service, Spring Boot (od-hub-api)");
    expect(hub.meta).toMatchObject({ level: "L2", internal_name: "od-hub-api", components: ["hub-api"] });
    expect(cs.find((c) => c.meta.kind === "adr" && c.meta.adr === "ADR-101")!.meta).toMatchObject({ adr: "ADR-101", status: "Accepted", adrs: ["ADR-101"] });
    expect(cs.find((c) => c.meta.kind === "tdr")!.meta).toMatchObject({ tdr: "TDR-001", status: "Open" });
    const notes = cs.filter((c) => c.meta.title === "3.2 Notes"); expect(notes).toHaveLength(2); expect(notes[0].id).not.toBe(notes[1].id);
  });

  test("a section over the cap is cut in parts, and a long table by rows with its header in every part", () => {
    const rows = Array.from({ length: 900 }, (_, i) => `| R-${i} | ${"value ".repeat(8)}|`).join("\n");
    w("docs/08-scalability.md", `# 10. Scalability\n\n${docHdr("hub-api")}\n\n## Limits <!-- SECTION: Scalability -->\n\n| Id | Limit |\n|---|---|\n${rows}\n`);
    const cs = chunks(exportIndex(P, { kitCheck: clean }).out).filter((c) => c.meta.file === "docs/08-scalability.md");
    expect(cs.length).toBeGreaterThan(1);
    cs.forEach((c, k) => { expect(c.text.length).toBeLessThan(24000 + 200); expect(c.meta.part).toBe(`${k + 1}/${cs.length}`); expect(c.text).toContain("| Id | Limit |\n|---|---|"); });
    expect(new Set(cs.map((c) => c.id)).size).toBe(cs.length);
  });

  test("compliance is never read, the ledger carries no absolute path, and the bundle passes its own check", () => {
    const { out } = exportIndex(P, { kitCheck: clean });
    expect(readFileSync(join(out, "chunks.jsonl"), "utf8")).not.toContain("ZEBRA-COMPLIANCE-TOKEN");
    const ledger = JSON.parse(readFileSync(join(out, "ledger.json"), "utf8"));
    expect(ledger.project_root).toBeUndefined(); expect(ledger.components.length).toBeGreaterThan(0);
    expect(checkBundle(out)).toMatchObject({ status: "PASS", findings: [] });
  });

  test("ids hold across versions and runs; only an edited chunk changes its hash", () => {
    const a = chunks(exportIndex(P, { kitCheck: clean }).out);
    fixture("1.4.0"); w("docs/04-data-flow-patterns.md", readFileSync(join(P, "docs/04-data-flow-patterns.md"), "utf8").replace("**Latency budget (p95)**: 80 ms", "**Latency budget (p95)**: 90 ms"));
    const b = chunks(exportIndex(P, { kitCheck: clean }).out);
    expect(b.map((c) => c.id).sort()).toEqual(a.map((c) => c.id).sort());
    const changed = b.filter((c) => a.find((x) => x.id === c.id)!.content_hash !== c.content_hash).map((c) => c.meta.title);
    expect(changed).toEqual(["Order Desk — Architecture", "Phase 2 — Book order"]);   // the overview states its version
    expect(b[0].meta.architecture_version).toBe("1.4.0");
  });
});

describe("export-index — build packs", () => {
  test("a kit that holds packs the component: parts byte for byte, the plan in order, interfaces both ways, ADRs, open questions", () => {
    const { out, manifest } = exportIndex(P, { kitCheck: clean });
    expect(manifest.buildpacks).toEqual([{ component: "hub-api", path: "buildpacks/hub-api/pack.json", parts: 12, open_questions: 1 }]);
    expect(manifest.skipped).toEqual(expect.arrayContaining([{ component: "web-app", reason: "kit-version 1.2.0" }, { component: "ledger-store", reason: "not in the kit" }]));
    const pack = JSON.parse(readFileSync(join(out, "buildpacks/hub-api/pack.json"), "utf8"));
    expect(pack.component).toMatchObject({ slug: "hub-api", name: "Hub API", internal_name: "od-hub-api", technology: ["Spring Boot"], component_version: "1.1.0" });
    expect(pack.plan.map((s: any) => [s.step, s.id, s.parts])).toEqual([
      [1, "spec", ["spec", "asset:c4-descriptor.md"]], [2, "security", ["security"]], [3, "contracts", ["asset:openapi.yaml"]], [4, "data", ["asset:ddl.sql"]],
      [5, "interfaces", ["interface:hub-api→ledger-store", "interface:web-app→hub-api"]], [6, "standards", ["cross-cutting-standards", "adr:ADR-012", "adr:ADR-101"]],
      [7, "flows", ["runtime-view"]], [8, "acceptance", ["spec"]]]);
    expect(pack.interfaces.map((i: any) => [i.key, i.direction])).toEqual([["hub-api→ledger-store", "outbound"], ["web-app→hub-api", "inbound"]]);
    expect(pack.flows).toEqual([{ code: "1", name: "Place order", use_cases: ["UC-01"], latency_target: "300 ms", governed_by: ["ADR-101"],
      phases: [{ n: "1", name: "Accept order", hops: "Web App → Hub API", latency_budget: "120 ms" }, { n: "2", name: "Book order", hops: "Hub API → Ledger Store", latency_budget: "80 ms" }] }]);
    expect(pack.adrs).toEqual(["ADR-012", "ADR-101"]);   // the institutional ADR the security obligations name joins the governing ones
    expect(pack.open_questions).toEqual([{ part: "interface:hub-api→ledger-store", line: 6, text: "[NOT DOCUMENTED — pool size]" }]);
    expect(readFileSync(join(out, "buildpacks/hub-api/assets/openapi.yaml"))).toEqual(readFileSync(join(P, "handoffs/assets/02-hub-api/openapi.yaml")));
  });

  test("BUILD.md: the template filled from the pack — binding, plan with every part, interfaces, budgets, open questions, no placeholder left", () => {
    const { out } = exportIndex(P, { kitCheck: clean, server: "https://mcp.example/api/mcp" });
    const pack = JSON.parse(readFileSync(join(out, "buildpacks/hub-api/pack.json"), "utf8"));
    expect(pack.instructions).toBe("BUILD.md"); expect(pack.parts[0]).toMatchObject({ id: "instructions", path: "BUILD.md" });
    const md = readFileSync(join(out, "buildpacks/hub-api/BUILD.md"), "utf8");
    expect(md).not.toMatch(/\{\{\w+\}\}/);
    expect(md).toStartWith("# Build Hub API\n\nYou are building **Hub API** (`od-hub-api`) — API Service, Spring Boot — as specified by the architecture **Order Desk**, version **1.3.0**.");
    expect(md).toContain('"server": "https://mcp.example/api/mcp",\n  "project": "order-desk",\n  "component": "hub-api",\n  "architecture_version": "1.3.0",\n  "pack_revision": "<pack_revision from get_build_pack>"');
    expect(md).toContain('from_revision: "<the pack_revision in this file>"'); expect(md).toContain("8. **Record the version and the revision.**");
    expect(md).toContain('get_build_part(project: "order-desk", component: "hub-api", part: "<part id>")');
    for (const id of ["spec", "security", "asset:openapi.yaml", "asset:ddl.sql", "interface:hub-api→ledger-store", "cross-cutting-standards", "adr:ADR-101", "runtime-view"]) expect(md).toContain("`" + id + "`");
    expect(md).toContain("### 2. Enforce the security obligations first: who may call, how each interface authenticates, the threats to mitigate\n\n- `security` — Security Obligations (`security.md`)");
    expect(md).toContain("## Security\n\nWho may call this component and how each interface authenticates (the `security` part; its threats and tests follow there):\n\n| Integration | Caller | Protocol | Authentication | Source |\n|---|---|---|---|---|\n| I-01 | Web App | REST | mTLS through the mesh | STRIDE TB-01 |\n\nAny other caller is rejected.\n\n## Interfaces");
    expect(md).toContain("4. **Security is never a gap to work around.**");
    // the assets kept verbatim in the service repository, so an update is a native git diff before any code moves
    expect(md).toContain("Keep each one, byte for byte, at `architecture/<file>` in the repository");
    expect(md).toContain("its `sha256` must equal the part's");
    expect(md).toContain("`download_url`"); expect(md).toContain('"<download_url>?pack_revision=<pack_revision>"'); expect(md).toContain("a 409 means the pack was revised since"); expect(md).toContain("a 404 just after a release means the server instance that answered has not loaded it yet"); expect(md).toContain("for up to a minute — a 404 that stays is a missing part: report it");
    expect(md).toContain("Overwrite the copies under `architecture/` with the new assets first (delete the ones it removes) and commit them alone — `architecture: contracts <new version> (pack_revision <new revision>)`");
    expect(md).toContain("- [ ] every asset is committed under `architecture/`, its `sha256` equal to the part's");
    expect(md).toContain("### 3. Implement the API and message contracts exactly as written\n\n- `asset:openapi.yaml` — openapi.yaml (`assets/openapi.yaml`)");
    expect(md).toContain("| outbound | Hub API → Ledger Store | `interface:hub-api→ledger-store` |");
    expect(md).toContain("- `interface:hub-api→ledger-store` — Interface Contract: Hub API → Ledger Store (");
    expect(md).toContain("- `adr:ADR-101` — ADR-101: Idempotency keys on every write (");
    expect(md).toContain("| 1. Place order | UC-01 | 300 ms | 2. Book order | Hub API → Ledger Store | 80 ms |");
    expect(md).toContain("| `interface:hub-api→ledger-store` | 6 | [NOT DOCUMENTED — pool size] |");
    expect(md).toContain("with `od-hub-api` beside it where an identifier is needed");
    expect(checkBundle(out).status).toBe("PASS");
    const bare = readFileSync(join(exportIndex(P, { kitCheck: clean }).out, "buildpacks/hub-api/BUILD.md"), "utf8");
    expect(bare).not.toContain('"server"');   // no URL given: the binding names none rather than a placeholder
  });

  test("BUILD.md rule 9: a blocking question goes to the architect — through the team's channel, or as an escalation on a RUN-team project", () => {
    const md = (o: any) => readFileSync(join(exportIndex(P, { kitCheck: clean }).out, "buildpacks/hub-api/BUILD.md"), "utf8");
    const standard = md({});
    expect(standard).toContain("9. **What only the architect can answer goes to the architect.**");
    expect(standard).not.toContain("preview_escalation");
    expect(standard).toContain("a question that blocks the build follows rule 9");
    w(".sa-skills/project.json", JSON.stringify({ support: "run" }));
    const run = md({});
    expect(run).toContain("9. **What only the architect can answer is escalated, never kept in a local file.**");
    expect(run).toContain('call `preview_escalation(project: "order-desk", …)`');
    expect(run).toContain("`request`, what the developer asked you to build, in their words — the task that led here, never their answer to a question of yours");
    expect(run).toContain("an authentication or authorization gap is `security-iam`; a gap no other trigger names is `low-confidence`");
    expect(run).toContain("only after a yes follow `file_with.steps` with the developer's own access, then `record_escalation`");
    expect(run).toContain("10. **A Tier 0 write is requested, never made here.**");
    expect(run).toContain('call `preview_tier0(project: "order-desk", kind, …)`');
    expect(run).toContain("only after a yes follow `file_with.steps`, then `record_tier0`");
    expect(standard).not.toContain("preview_tier0");
    // nobody attending: declared in the binding; questions become TODOs, escalations are filed by the build, a Tier 0 request goes without its key
    expect(run).toContain('**Nobody attending this build** — a CI job, a platform\'s build agent — is declared in this file: `"supervision": "unattended"`');
    expect(run).toContain("where the service needs a choice they do not make, ask — with no answer, or nobody attending, a `TODO(architecture)` as in rule 3.");
    expect(run).toContain("Unattended, nobody says yes: an escalation writes nothing, so follow `file_with.steps` with this build's own identity");
    expect(run).toContain('Unattended, pass `supervision: "unattended"`: the issue carries no `architecture-tier0` label');
    expect(run).toContain("Never apply `architecture-tier0` yourself.");
    expect(standard).toContain("give the user — unattended, your pull request — the questions");
    expect(standard).toMatch(/through the team's channel; never settle it in code\.\n\n## Build plan/);
    expect(run).not.toMatch(/\{\{\w+\}\}/);
  });

  test("the gate: a failing file skips its component, a failing shared document or another kit version packs nothing, no kit warns", () => {
    let m = exportIndex(P, { kitCheck: () => [{ file: join(P, "handoffs/assets/02-hub-api/openapi.yaml"), findings: [{ rule: "x" }] }] }).manifest;
    expect(m.buildpacks).toEqual([]); expect(m.skipped).toContainEqual({ component: "hub-api", reason: "kit-check fails on handoffs/assets/02-hub-api/openapi.yaml" });
    m = exportIndex(P, { kitCheck: () => [{ file: join(P, "handoffs/CROSS_CUTTING_STANDARDS.md"), findings: [{ rule: "x" }] }] }).manifest;
    expect(m.buildpacks).toEqual([]); expect(m.warnings.join("\n")).toMatch(/CROSS_CUTTING_STANDARDS\.md missing or failing — no build packs/);
    const mf = JSON.parse(readFileSync(join(P, "handoffs/.manifest.json"), "utf8")); mf.run.architecture_version = "1.2.0"; w("handoffs/.manifest.json", JSON.stringify(mf));
    m = exportIndex(P, { kitCheck: clean }).manifest;
    expect(m.buildpacks).toEqual([]); expect(m.warnings.join("\n")).toMatch(/handoff kit is for architecture 1\.2\.0, this is 1\.3\.0/);
    rmSync(join(P, "handoffs"), { recursive: true });
    m = exportIndex(P, { kitCheck: clean }).manifest;
    expect(m.warnings.join("\n")).toMatch(/no handoff kit/); expect(m.counts.chunks).toBeGreaterThan(0);
  });

  test("the real kit-check is the default gate: a kit that holds is packed, a kit part without its markers is not", () => {
    expect(exportIndex(P).manifest.buildpacks.map((b: any) => b.component)).toEqual(["hub-api"]);
    w("handoffs/SYSTEM_RUNTIME_VIEW.md", "# System Runtime View\n\nflows.\n");
    const m = exportIndex(P).manifest;
    expect(m.buildpacks).toEqual([]); expect(m.warnings.join("\n")).toMatch(/kit-check: handoffs\/SYSTEM_RUNTIME_VIEW\.md.*failing/);
  });
});

describe("export-index — what changed", () => {
  test("the same version twice: a replaced pack is revised, its security obligations are an action, a new server URL in BUILD.md is not", () => {
    const A = join(BASE, "same-a"), B = join(BASE, "same-b"), C = join(BASE, "same-c");
    [A, B, C].forEach((x) => rmSync(x, { recursive: true, force: true }));
    exportIndex(P, { out: A, kitCheck: clean });
    // nothing moved: no container changed, the revision is the same
    const same = diffBundles(A, A);
    expect(same).toMatchObject({ from: "1.3.0", to: "1.3.0", same_version: true, components: [] });
    expect(diffBundles(A, A, { component: "hub-api" }).components[0]).toMatchObject({ pack: "present", pack_revised: false, changed: false, action_required: false });
    // the kit regenerated after the tag: the security obligations of Hub API moved
    w("handoffs/assets/02-hub-api/security.md", readFileSync(join(P, "handoffs/assets/02-hub-api/security.md"), "utf8").replace("Any other caller is rejected.", "Any other caller is rejected. Ledger Store calls back over I-02."));
    exportIndex(P, { out: B, kitCheck: clean });
    const d = diffBundles(A, B);
    const hub = d.components.find((c: any) => c.component === "hub-api");
    expect(d.same_version).toBe(true);
    expect(hub).toMatchObject({ pack: "present", pack_revised: true, documents: ["Security Obligations", "Build instructions"], action_required: true, changed: true, facts: [], flows: [] });   // BUILD.md quotes the Inbound section
    expect(hub.pack_revision.from).toMatch(/^[0-9a-f]{64}$/); expect(hub.pack_revision.to).not.toBe(hub.pack_revision.from);
    expect(hub.pack_revision.to).toBe(JSON.parse(readFileSync(join(B, "manifest.json"), "utf8")).files.find((f: any) => f.path === "buildpacks/hub-api/pack.json").sha256);
    const md = renderChanges(d);
    expect(md).toContain("# What changed — order-desk 1.3.0, build packs revised");
    expect(md).toContain(`- build pack replaced: revision ${hub.pack_revision.from.slice(0, 12)} → ${hub.pack_revision.to.slice(0, 12)}`);
    expect(md).toContain("- documents: Security Obligations, Build instructions");
    // only the MCP URL in the binding moved: the pack is revised, the developer has nothing to change in code
    exportIndex(P, { out: C, kitCheck: clean, server: "https://mcp.example/mcp" });
    expect(diffBundles(B, C).components.find((c: any) => c.component === "hub-api")).toMatchObject({ pack_revised: true, documents: ["Build instructions"], action_required: false, changed: true });
  });

  test("technical debt: a TDR a container's descriptor starts naming, a status move, one it stops naming — listed, never an action", () => {
    const bundle = (v: string, names: string[], tdrs: any[]) => ({ m: { project: { key: "order-desk" }, architecture: { version: v } }, packs: {}, chunks: [],
      ledger: { components: [{ slug: "hub-api", name: "Hub API", level: "L2", tdrs: names }], tdrs } });
    const A = bundle("1.3.0", ["TDR-001"], [{ id: "TDR-001", title: "Batch settlement", status: "Open" }]);
    const B = bundle("1.4.0", ["TDR-001", "TDR-002"], [{ id: "TDR-001", title: "Batch settlement", status: "In Progress" }, { id: "TDR-002", title: "Keys never purged", status: "Open" }]);
    const hub = diffBundles(A, B).components[0];
    expect(hub.technical_debt).toEqual({ added: [{ id: "TDR-002", title: "Keys never purged", status: "Open" }], removed: [], status: [{ id: "TDR-001", title: "Batch settlement", from: "Open", to: "In Progress" }] });
    expect(hub).toMatchObject({ changed: true, action_required: false });
    expect(renderChanges(diffBundles(A, B))).toContain("- technical debt: added TDR-002 — Keys never purged (Open) · TDR-001 Open → In Progress");
    expect(renderChanges(diffBundles(B, A))).toContain("no longer names TDR-002");
    // a bundle written before the ledger carried a component's debt reads as none
    const old = bundle("1.2.0", [], []); delete (old.ledger.components[0] as any).tdrs;
    expect(diffBundles(old, A).components[0].technical_debt.added.map((t: any) => t.id)).toEqual(["TDR-001"]);
  });

  test("per container between two bundles: contracts, interfaces, facts, budgets, sections, open questions; action required where code must move, with or without a pack", () => {
    const A = join(BASE, "bundle-1.3.0"), B = join(BASE, "bundle-1.4.0");
    rmSync(A, { recursive: true, force: true }); rmSync(B, { recursive: true, force: true });
    exportIndex(P, { out: A, kitCheck: clean });
    fixture("1.4.0");
    const edit = (f: string, from: string, to: string) => w(f, readFileSync(join(P, f), "utf8").replace(from, to));
    edit("handoffs/assets/02-hub-api/openapi.yaml", "paths: {}", "paths:\n  /orders: {}");
    edit("handoffs/interfaces/hub-api→ledger-store.md", "[NOT DOCUMENTED — pool size]", "Pool of 20 connections.");
    edit("docs/04-data-flow-patterns.md", "**Latency budget (p95)**: 80 ms", "**Latency budget (p95)**: 90 ms");
    edit("docs/components/desk/02-hub-api.md", "**Technology:** [Spring Boot]", "**Technology:** [Spring Boot], [Kafka]");
    edit("docs/05-integration-points.md", "| I-01 | Web App | Hub API | HTTPS/JSON | sync |", "| I-01 | Web App | Hub API | HTTPS/JSON | async |");
    const { out, manifest } = exportIndex(P, { out: B, kitCheck: clean, previous: A });
    expect(manifest.changes).toMatchObject({ from: "1.3.0", to: "1.4.0", path: "changes.json", action_required: ["hub-api", "ledger-store", "web-app"] });
    expect(checkBundle(out).status).toBe("PASS");
    const d = JSON.parse(readFileSync(join(out, "changes.json"), "utf8"));
    const hub = d.components.find((c: any) => c.component === "hub-api");
    expect(hub).toMatchObject({ status: "present", pack: "present", pack_revised: true, action_required: true,
      facts: [{ field: "technology", from: ["Spring Boot"], to: ["Spring Boot", "Kafka"] }],
      contracts: { added: [], removed: [], changed: ["openapi.yaml"] }, interfaces: { added: [], removed: [], changed: ["hub-api→ledger-store"] },
      flows: [{ flow: "1", change: "changed", fields: [{ field: "phase 2 latency_budget", from: "80 ms", to: "90 ms" }] }],
      open_questions: { new: [], resolved: [{ part: "interface:hub-api→ledger-store", line: 6, text: "[NOT DOCUMENTED — pool size]" }] } });
    expect(hub.contracts.changed).not.toContain("ddl.sql");
    expect(hub.integrations).toMatchObject({ changed: ["I-01"], fields: [{ integration: "I-01", field: "pattern", from: "sync", to: "async" }] });
    expect(d.components.find((c: any) => c.component === "web-app")).toMatchObject({ action_required: true, integrations: { changed: ["I-01"] } });   // the other endpoint of the row moves too
    const ledger = d.components.find((c: any) => c.component === "ledger-store");
    // no build pack, and still the budget of a phase it runs in moved: read from the ledger, an action
    expect(ledger).toMatchObject({ pack: "absent", action_required: true, flows: [{ flow: "1", change: "changed", fields: [{ field: "phase 2 latency_budget", from: "80 ms", to: "90 ms" }] }] });
    expect(ledger.sections.changed.map((x: any) => x.title)).toContain("Phase 2 — Book order");

    const md = renderChanges(diffBundles(A, B, { component: "hub-api" }));
    expect(md).toContain("## Hub API (`hub-api`) — action required");
    expect(md).toContain("- contracts: changed openapi.yaml");
    expect(md).toContain("- flow 1. Place order: changed — phase 2 latency_budget 80 ms → 90 ms");
    expect(md).toContain("  - I-01 pattern: sync → async");
    expect(() => diffBundles(A, B, { component: "nope" })).toThrow(/container of neither version/);
  });
});

describe("export-index — channel and bundle", () => {
  test("released while the architecture's files are the tag's: the kit may land after the tag; an architecture edit or anything uncommitted is a draft", () => {
    const env = { ...process.env, GIT_CEILING_DIRECTORIES: BASE, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
    const git = (...a: string[]) => spawnSync("git", a, { cwd: P, env, encoding: "utf8" });
    const KIT = join(BASE, "kit-saved"); rmSync(KIT, { recursive: true, force: true }); cpSync(join(P, "handoffs"), KIT, { recursive: true });
    rmSync(join(P, "handoffs"), { recursive: true });   // the release commit carries no current kit
    git("init", "-q"); git("add", "-A"); git("commit", "-qm", "release"); git("tag", "architecture-v1.3.0");
    let r = exportIndex(P, { kitCheck: clean });
    expect(r.manifest.channel).toBe("released"); expect(r.out).toBe(join(P, ".cache", "sa-skills", "index", "1.3.0"));
    expect(r.manifest.git).toMatchObject({ tag: "architecture-v1.3.0", at_tag: true, matches_tag: true, dirty: false });
    expect(r.manifest.buildpacks).toEqual([]);   // phase 1: search goes live, packs wait for the kit
    cpSync(KIT, join(P, "handoffs"), { recursive: true }); git("add", "-A"); git("commit", "-qm", "kit");   // the kit regenerated and committed after the tag
    r = exportIndex(P, { kitCheck: clean });
    expect(r.manifest).toMatchObject({ channel: "released", git: { at_tag: false, matches_tag: true } });
    expect(r.manifest.buildpacks.map((b: any) => b.component)).toEqual(["hub-api"]);   // phase 2: the same version, with its packs
    w("docs/01-system-overview.md", "# changed\n"); git("commit", "-qam", "edit");
    expect(exportIndex(P, { kitCheck: clean }).manifest.channel).toBe("draft");   // the architecture moved past the tag
    git("reset", "-q", "--hard", "HEAD~1"); w("handoffs/components/02-hub-api.md", "# Hub API\n\nedited\n");
    expect(exportIndex(P, { kitCheck: clean }).manifest).toMatchObject({ channel: "draft", git: { dirty: true } });   // uncommitted kit
  });

  test("the manifest carries the RUN-team policy and the open escalations; the record never makes the bundle a draft", () => {
    const env = { ...process.env, GIT_CEILING_DIRECTORIES: BASE, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
    const git = (...a: string[]) => spawnSync("git", a, { cwd: P, env, encoding: "utf8" });
    expect(exportIndex(P, { kitCheck: clean }).manifest.support).toMatchObject({ mode: null, tier0: false, tier0_writes: [], escalations_open: [] });
    w(".sa-skills/project.json", JSON.stringify({ support: "run" }));
    git("init", "-q"); git("add", "-A"); git("commit", "-qm", "release"); git("tag", "architecture-v1.3.0");
    w("escalations/ESC-001-hub-api-secret.md", "---\nid: ESC-001\nstatus: Open\ndate: 2026-10-17\narchitecture: architecture-v1.3.0\nroute: tier-1\ntriggers: [security-iam]\ncomponents: [Hub API]\nissue:\n---\n# ESC-001 — Hub API secret\n");
    const m = exportIndex(P, { kitCheck: clean }).manifest;
    expect(m.channel).toBe("released");
    expect(m.support).toMatchObject({ mode: "run", tier0: true, released: "architecture-v1.3.0", tier0_writes: ["tdr-workaround", "tdr-status", "adr-proposed", "doc-fix"] });
    expect(Object.keys(m.support.triggers)).toEqual(["new-integration", "data-classification", "cross-domain", "security-iam", "regulatory", "new-technology", "low-confidence"]);
    expect(m.support.tier0_label).toBe("architecture-tier0");
    expect(m.support.tier0_kinds["tdr-status"]).toEqual({ label: "a TDR status move tdr-check.js --move accepts, with its dated History note", required: ["tdr", "to", "note"], evidence: true });
    expect(m.support.tdr_moves.Open).toEqual(["In Progress", "Won't Fix"]);
    expect(m.support.tdr_statuses).toEqual(["Open", "Planned", "In Progress", "Resolved", "Won't Fix"]);
    expect(m.support.tdr_drivers).toEqual(["Strategy", "Architecture", "Talent", "Process"]);
    expect(m.support.escalations_open).toEqual([{ id: "ESC-001", status: "Open", route: "tier-1", triggers: ["security-iam"], components: ["Hub API"], title: "Hub API secret", issue: null }]);
  });

  test("the check finds an edited file and an edited chunk; a folder that holds no bundle is never overwritten", () => {
    const { out } = exportIndex(P, { kitCheck: clean });
    writeFileSync(join(out, "buildpacks/hub-api/spec.md"), "edited\n");
    const lines = readFileSync(join(out, "chunks.jsonl"), "utf8").split("\n"); const c = JSON.parse(lines[0]); c.text += " edited"; lines[0] = JSON.stringify(c); writeFileSync(join(out, "chunks.jsonl"), lines.join("\n"));
    const r = checkBundle(out);
    expect(r.status).toBe("FAIL");
    expect(r.findings.map((f: any) => f.text)).toEqual(expect.arrayContaining(["sha256 differs from the manifest", "content_hash is not the text's", "part spec: sha256 differs"]));
    const other = join(BASE, "not-a-bundle"); mkdirSync(other, { recursive: true }); writeFileSync(join(other, "keep.txt"), "mine");
    expect(() => exportIndex(P, { out: other, kitCheck: clean })).toThrow(/refusing to overwrite/);
    expect(existsSync(join(other, "keep.txt"))).toBe(true);
  });
});

test("the ledger is byte-identical across runs of the same tree — no clock, no path", () => {
  const a = join(BASE, "ledger-a"), b = join(BASE, "ledger-b");
  exportIndex(P, { out: a, kitCheck: clean, draft: true }); Bun.sleepSync(5); exportIndex(P, { out: b, kitCheck: clean, draft: true });
  const la = readFileSync(join(a, "ledger.json"), "utf8");
  expect(la).toBe(readFileSync(join(b, "ledger.json"), "utf8"));
  expect(JSON.parse(la)).not.toHaveProperty("generated_at"); expect(JSON.parse(la)).not.toHaveProperty("project_root");
  expect(readFileSync(join(a, "buildpacks", "hub-api", "pack.json"), "utf8")).toBe(readFileSync(join(b, "buildpacks", "hub-api", "pack.json"), "utf8"));
});

describe("ci/publish-index.sh", () => {
  // a fake server in this process: the script runs with Bun.spawn (spawnSync would block the server's event loop)
  test("phase 1 at the tag publishes the search part, phase 2 adds the packs to the same version, a draft is not published", async () => {
    const posts: { path: string; auth: string | null; bytes: number }[] = []; const held = new Set<string>(); let refuse: object | null = null; let reader = false;
    const server = Bun.serve({ port: 0, async fetch(req) {
      const u = new URL(req.url);
      if (req.method === "GET") return new Response("none", { status: 404 });
      const body = await req.arrayBuffer(); posts.push({ path: u.pathname + u.search, auth: req.headers.get("authorization"), bytes: body.byteLength });
      if (reader) return Response.json({ error: "this instance only reads (archindex.role=reader): publish to the writer" }, { status: 403 });
      if (refuse) return Response.json(refuse, { status: 409 });
      if (!held.has(u.pathname)) { held.add(u.pathname); return new Response("ok", { status: 201 }); }
      return Response.json({ added: ["hub-api"], replaced: [], unchanged: [] }, { status: 200 });
    } });
    const env = { ...process.env, GIT_CEILING_DIRECTORIES: BASE, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
    const git = (...a: string[]) => spawnSync("git", a, { cwd: P, env, encoding: "utf8" });
    const run = async () => { const p = Bun.spawn(["bash", join(import.meta.dir, "..", "ci", "publish-index.sh"), "."], { cwd: P, stdout: "pipe", stderr: "pipe",
      env: { ...env, SA_SKILLS_DIR: join(import.meta.dir, "..", "..", "..", "..", ".."), SA_PLUGIN_REF: "unused", RUNNER_TEMP: join(BASE, "runner"),
        SA_INDEX_PROJECT_KEY: "order-desk", SA_INDEX_SERVER: `http://localhost:${server.port}`, SA_INDEX_TOKEN: "t0k" } });
      const [out, err] = [await new Response(p.stdout).text(), await new Response(p.stderr).text()]; return { code: await p.exited, out: out + err }; };
    try {
      const KIT = join(BASE, "kit-ci"); rmSync(KIT, { recursive: true, force: true }); cpSync(join(P, "handoffs"), KIT, { recursive: true }); rmSync(join(P, "handoffs"), { recursive: true });
      git("init", "-q"); git("add", "-A"); git("commit", "-qm", "release"); git("tag", "architecture-v1.3.0");
      let r = await run();
      expect(r.code).toBe(0); expect(r.out).toContain("1.3.0 published (released)"); expect(r.out).toContain("no earlier bundle on the server");
      cpSync(KIT, join(P, "handoffs"), { recursive: true }); git("add", "-A"); git("commit", "-qm", "kit");
      r = await run();
      expect(r.code).toBe(0); expect(r.out).toContain("1.3.0 updated"); expect(r.out).toContain("build packs — added: hub-api · replaced: none · unchanged: none"); expect(r.out).toContain("build packs: 1 — hub-api");
      // a publish that leaves out a pack the server holds is refused, and the reason and the packs are printed
      refuse = { reason: "packs_missing", packs: ["web-app"] };
      r = await run();
      expect(r.code).toBe(1); expect(r.out).toContain("1.3.0 refused (packs_missing): it leaves out build packs the server holds for this version — web-app");
      refuse = null; posts.pop();
      // a reader instance of the server never publishes: the script names the setting to fix
      reader = true;
      r = await run();
      expect(r.code).toBe(1); expect(r.out).toContain("is a reader instance of the server (archindex.role=reader), which never publishes — point SA_INDEX_SERVER at the writer");
      reader = false; posts.pop();
      expect(posts.map((p) => p.path)).toEqual(["/bundles/order-desk/1.3.0?channel=released", "/bundles/order-desk/1.3.0?channel=released"]);
      expect(posts.every((p) => p.auth === "Bearer t0k" && p.bytes > 0)).toBe(true);
      w("docs/01-system-overview.md", "# changed\n"); git("commit", "-qam", "edit");
      r = await run();
      expect(r.code).toBe(0); expect(r.out).toContain("is a draft here"); expect(posts).toHaveLength(2);
    } finally { server.stop(true); }
  }, 120000);
});

describe("publish-index.js — a draft into a test server", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { publish } = require("../scripts/publish-index.js");
  const env = { ...process.env, GIT_CEILING_DIRECTORIES: BASE, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  const git = (...a: string[]) => spawnSync("git", a, { cwd: P, env, encoding: "utf8" });

  test("--draft keeps a tree that equals its release tag out of the released channel", () => {
    git("init", "-q"); git("add", "-A"); git("commit", "-qm", "release"); git("tag", "architecture-v1.3.0");
    expect(exportIndex(P, { kitCheck: clean }).manifest.channel).toBe("released");
    expect(exportIndex(P, { kitCheck: clean, draft: true }).manifest).toMatchObject({ channel: "draft", git: { matches_tag: true } });
  });

  test("export, check, publish to the draft slot, wait for search; the key is written once and read back", async () => {
    const posts: { path: string; type: string | null; auth: string | null; bytes: number }[] = []; let polls = 0;
    const server = Bun.serve({ port: 0, async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname === "/actuator/health") return Response.json({ status: "UP" });
      if (req.method === "POST") { const b = await req.arrayBuffer(); posts.push({ path: u.pathname + u.search, type: req.headers.get("content-type"), auth: req.headers.get("authorization"), bytes: b.byteLength }); return Response.json({ outcome: "stored" }, { status: 201 }); }
      if (u.pathname === "/bundles") { polls++; const key = posts.at(-1)!.path.split("/")[2];
        return Response.json({ [key]: { draft: { search: polls < 2 ? { status: "INDEXING" } : { status: "READY", chunks: 22, embedded: 22, reused: 0 } } } }); }
      return new Response("no", { status: 404 });
    } });
    const url = `http://localhost:${server.port}`; const lines: string[] = []; const saved = process.env.SA_INDEX_TOKEN;
    try {
      process.env.SA_INDEX_TOKEN = "dev-token";
      const r = await publish(P, { server: url, kitCheck: clean, log: (m: string) => lines.push(m) });
      expect(r).toMatchObject({ project: "order-desk", version: "1.3.0", channel: "draft", build_packs: ["hub-api"], search: { status: "READY" } });
      expect(posts[0]).toMatchObject({ path: "/bundles/order-desk/1.3.0?channel=draft", type: "application/gzip", auth: "Bearer dev-token" });
      expect(posts[0].bytes).toBeGreaterThan(0);
      expect(JSON.parse(readFileSync(join(P, ".sa-skills/index.json"), "utf8"))).toEqual({ server: url, project_key: "order-desk" });
      expect(lines.join("\n")).toContain(`claude mcp add --transport http alia ${url}/mcp`);
      // the committed key wins over the architecture's name on every later run
      writeFileSync(join(P, ".sa-skills/index.json"), JSON.stringify({ server: url, project_key: "desk-orders" }));
      delete process.env.SA_INDEX_TOKEN;
      const again = await publish(P, { kitCheck: clean, wait: false, log: () => {} });
      expect(again.project).toBe("desk-orders");
      expect(posts[1]).toMatchObject({ path: "/bundles/desk-orders/1.3.0?channel=draft", auth: null });
    } finally { server.stop(true); if (saved === undefined) delete process.env.SA_INDEX_TOKEN; else process.env.SA_INDEX_TOKEN = saved; }
  }, 60000);

  test("a reader instance (403): the error names the writer's URL as the fix, and no key is written", async () => {
    const server = Bun.serve({ port: 0, async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname === "/actuator/health") return Response.json({ status: "UP" });
      if (req.method === "POST") return Response.json({ error: "this instance only reads (archindex.role=reader): publish to the writer" }, { status: 403 });
      return new Response("no", { status: 404 });
    } });
    try {
      await expect(publish(P, { server: `http://localhost:${server.port}`, kitCheck: clean, log: () => {} })).rejects.toMatchObject({ code: 1, message: expect.stringContaining("is a reader instance of the server (archindex.role=reader), which never publishes — pass the writer's URL with --server or SA_INDEX_SERVER") });
      expect(existsSync(join(P, ".sa-skills/index.json"))).toBe(false);
    } finally { server.stop(true); }
  }, 60000);

  test("no server: the error names how to start the local one", async () => {
    await expect(publish(P, { server: "http://localhost:9", kitCheck: clean, log: () => {} })).rejects.toMatchObject({ code: 3, message: expect.stringContaining("--up") });
    expect(existsSync(join(P, ".sa-skills/index.json"))).toBe(false);
  });
});

describe("publish-index.js --up — which Ollama the local server embeds through", () => {
  const { chooseOllama } = require("../scripts/publish-index.js");
  const answers = (...urls: string[]) => async (u: string) => urls.includes(u);
  const GW = () => "172.17.0.1";

  test("the host's Ollama by default, when the Docker bridge reaches it (the GPU)", async () => {
    const o = await chooseOllama({ env: {}, platform: "linux", gateway: GW, reach: answers("http://localhost:11434", "http://172.17.0.1:11434") });
    expect(o).toMatchObject({ url: "http://host.docker.internal:11434", cpu: false });
  });

  test("a host Ollama on localhost only falls back to the CPU container and says how to fix it", async () => {
    const o = await chooseOllama({ env: {}, platform: "linux", gateway: GW, reach: answers("http://localhost:11434") });
    expect(o).toMatchObject({ url: "http://ollama:11434", cpu: true });
    expect(o.note).toContain("OLLAMA_HOST=0.0.0.0");
  });

  test("no Ollama on the machine: the CPU container", async () => {
    expect(await chooseOllama({ env: {}, platform: "linux", gateway: GW, reach: answers() })).toMatchObject({ cpu: true });
  });

  test("Docker Desktop forwards to the host's localhost", async () => {
    expect(await chooseOllama({ env: {}, platform: "darwin", gateway: () => null, reach: answers("http://localhost:11434") })).toMatchObject({ cpu: false });
  });

  test("SA_INDEX_OLLAMA is taken as given", async () => {
    expect(await chooseOllama({ env: { SA_INDEX_OLLAMA: "http://gpu-box:11434" }, reach: answers() })).toMatchObject({ url: "http://gpu-box:11434", cpu: false });
    expect(await chooseOllama({ env: { SA_INDEX_OLLAMA: "http://ollama:11434" }, reach: answers() })).toMatchObject({ cpu: true });
  });
});
