/**
 * po-spec-delta.js — the delta between an architecture and the PO Spec that last reflected it: the sync
 * state from the marker, the changelog entries since, the ADRs and TDRs they name, the containers updated,
 * the use-case reconciliation, the retired integrations; and `--stamp`.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { delta, render, stamp, check } = require("../scripts/po-spec-delta.js");
const SCRIPT = join(__dirname, "..", "scripts", "po-spec-delta.js");

const TMP = join(__dirname, ".temp-po-spec-delta");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };
const hdr = (self: string, type: string) => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: React\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: s\nrelated_adrs: ADR-101\n-->`;
const SPEC = `<!-- DOC_LANGUAGE: es -->\n\n# Order Desk — Product Owner Specification\n\n**Product Owner**: PO\n**Date**: 2026-08-15\n**Version**: 1.2\n\n## 4. Casos de Uso <!-- SECTION: Use Cases -->\n\n### UC-01: Place an order\n\n### UC-02: Track it\n\n### UC-9: Old one\n\n## Apéndice <!-- SECTION: Appendix -->\n`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.3.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- ARCHITECTURE_RELEASED: 2026-09-05 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Order Desk — Arquitectura\n`);
  w("PRODUCT_OWNER_SPEC.md", SPEC);
  w("docs/CHANGELOG.md", `# Changelog\n\n## [Unreleased]\n\n### Changed\n- **Freshness target moves to 15 s.** A long argument about why, spanning\n  two lines, per ADR-103 and TDR-001.\n- Plain bullet without bold. Second sentence dropped.\n\n## [1.3.0] - 2026-09-05\n\n### Added\n- Hub settlement flow (UC-03), per ADR-102; debt TDR-001 accepted.\n\n## [1.2.0] - 2026-08-20\n\n### Changed\n- Retired I-02.\n\n## [1.1.0] - 2026-08-01\n\n- Baseline.\n`);
  w("docs/04-data-flow-patterns.md", `# Flows\n\n| Flow | Trigger | Use Case | Latency Target |\n|---|---|---|---|\n| 1. Place | The user | UC-01 | ≤ 2 s |\n| 2. Settle | The hub | UC-03 | ≤ 30 s |\n\n| # | Phase | On critical path? | Owner | Failure mode |\n|---|---|---|---|---|\n| 1 | Submit | yes | Web App → Hub API | Rejected |\n`);
  w("docs/05-integration-points.md", `# Int\n\n| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n| I-01 | \`Web App\` | \`Hub API\` | HTTPS/JSON | RR | Partner |\n| ~~I-02~~ | ~~\`Web App\`~~ | ~~\`Ledger\`~~ | — | — | **Retired** |\n`);
  w("docs/components/order-desk.md", `# Order Desk\n\n${hdr("order-desk", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-web-app.md", `# Web App\n\n${hdr("web-app", "web-application")}\n\n**Type:** Web Application\n**Technology:** [React]\n**C4 Level:** Container (L2)\n\n**Component Version:** 1.4.0\n**Last Updated:** 2026-09-04\n`);
  w("docs/components/order-desk/02-old.md", `# Old Service\n\n${hdr("old", "api-service")}\n\n**Type:** API Service\n**Technology:** [Java]\n**C4 Level:** Container (L2)\n\n**Last Updated:** 2026-07-01\n`);
  w("adr/ADR-101-a.md", `# ADR-101: A\n\n**Status**: Accepted\n**Scope**: Project\n`);
  w("adr/ADR-102-b.md", `# ADR-102: Hub\n\n**Status**: Accepted\n**Scope**: Project\n`);
  w("tdr/TDR-001-x.md", `# TDR-001: Debt\n\n**Status**: Open\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

// the sync reads the architecture through sa-skills' arch-facts.js: the repo (plugins/sa-requirements inside sa-skills),
// or an install named by SA_SKILLS_DIR; a copy of sa-requirements alone skips these
const ARCH_FACTS = existsSync(join(__dirname, "..", "..", "..", "..", "..", "scripts", "shared", "arch-facts.js"))
  || !!(process.env.SA_SKILLS_DIR && existsSync(join(process.env.SA_SKILLS_DIR, "scripts", "shared", "arch-facts.js")));

describe.skipIf(!ARCH_FACTS)("po-spec-delta", () => {
  test("never synced: the delta runs from the spec date — releases after it plus Unreleased, the ADRs and TDRs they name, containers updated, use cases reconciled, retired rows", () => {
    const d = delta(TMP);
    expect(d.state).toMatchObject({ spec_version: "1.2", spec_date: "2026-08-15", synced_version: null, architecture_version: "1.3.0", architecture_status: "Released", sync_state: "never synced", releases_behind: 2, unreleased_changes: true, language: "es" });
    expect(d.releases.map((r: any) => r.version)).toEqual(["Unreleased", "1.3.0", "1.2.0"]);
    expect(d.releases[1].body).toBe("### Added\n- Hub settlement flow (UC-03), per ADR-102; debt TDR-001 accepted.");
    expect(d.releases[0].body).toBe("### Changed\n- Freshness target moves to 15 s. [ADR-103, TDR-001]\n- Plain bullet without bold.");   // headlines: the bold lead or the first sentence, plus the ids
    expect(d.releases[0].full).toMatch(/A long argument about why/);
    expect(delta(TMP, { full: true }).releases[0].body).toMatch(/A long argument about why/);
    expect(d.adrs.map((a: any) => [a.id, a.title, a.status])).toEqual([["ADR-102", "Hub", "Accepted"], ["ADR-103", "(no file under adr/)", null]]);
    expect(d.tdrs).toEqual([{ id: "TDR-001", file: "tdr/TDR-001-x.md", title: "Debt", status: "Open", initiative: null, driver: null, capability: null, named_by_changes: true }]);
    expect(d.components.map((c: any) => c.slug)).toEqual(["web-app"]);
    expect(d.useCases).toMatchObject({ in_spec: ["UC-01", "UC-02", "UC-09"], in_architecture: ["UC-01", "UC-03"], architecture_only: ["UC-03"], spec_only: ["UC-02", "UC-09"] });
    expect(d.retired_integrations.map((i: any) => i.id)).toEqual(["I-02"]);
    const md = render(d);
    expect(md).toMatch(/\| State \| \*\*never synced\*\* \|/);
    expect(md).toMatch(/## Section mapping \(fixed\)/);
    expect(md).toMatch(/### \[1\.3\.0\] — 2026-09-05\n\n### Added\n- Hub settlement flow/);
    expect(md).toMatch(/\| ★ TDR-001 \|/);
    expect(md).toMatch(/\*\*In the spec only\*\*[^\n]*: UC-02, UC-09/);
    expect(md).toMatch(/headlines — each bullet/);
  });

  test("entries rotated to the archive are part of the delta when the sync predates the main file", () => {
    w("docs/CHANGELOG-ARCHIVE.md", `# Changelog — archive\n\n## [1.0.0] - 2026-07-15\n\n### Added\n- The baseline, per ADR-101.\n`);
    expect(delta(TMP).releases.map((r: any) => r.version)).toEqual(["Unreleased", "1.3.0", "1.2.0"]);   // never synced: from the spec date — the archived entry predates it
    writeFileSync(join(TMP, "PRODUCT_OWNER_SPEC.md"), SPEC.replace("<!-- DOC_LANGUAGE: es -->", "<!-- DOC_LANGUAGE: es -->\n<!-- ARCHITECTURE_SYNC: 0.9.0 (2026-07-01) -->"));
    const old = delta(TMP);
    expect(old.state.sync_state).toBe("behind by 4 release(s)");
    expect(old.releases.map((r: any) => [r.version, !!r.archived])).toEqual([["Unreleased", false], ["1.3.0", false], ["1.2.0", false], ["1.1.0", false], ["1.0.0", true]]);
    expect(render(old)).toMatch(/### \[1\.0\.0\] — 2026-07-15 \(archived — docs\/CHANGELOG-ARCHIVE\.md\)/);
    rmSync(join(TMP, "docs/CHANGELOG-ARCHIVE.md")); writeFileSync(join(TMP, "PRODUCT_OWNER_SPEC.md"), SPEC);
  });

  test("--stamp writes the marker after DOC_LANGUAGE, bumps the spec's minor version and sets the date; the next delta is then in sync with unreleased changes pending", () => {
    const r = stamp(TMP, { today: "2026-09-07" });
    expect(r).toEqual({ file: "PRODUCT_OWNER_SPEC.md", marker: "<!-- ARCHITECTURE_SYNC: 1.3.0 (2026-09-07) -->", version: { from: "1.2", to: "1.3" }, date: "2026-09-07" });
    const spec = readFileSync(join(TMP, "PRODUCT_OWNER_SPEC.md"), "utf-8");
    expect(spec).toMatch(/^<!-- DOC_LANGUAGE: es -->\n<!-- ARCHITECTURE_SYNC: 1\.3\.0 \(2026-09-07\) -->\n/);
    expect(spec).toMatch(/\*\*Date\*\*: 2026-09-07\n\*\*Version\*\*: 1\.3\n/);
    const d = delta(TMP);
    expect(d.state.sync_state).toBe("in sync with the last release; unreleased changes pending");
    expect(d.releases.map((r: any) => r.version)).toEqual(["Unreleased"]);
    expect(d.components).toEqual([]);                       // updated before the sync date
    // a second stamp replaces the marker in place and bumps again
    stamp(TMP, { today: "2026-09-08" });
    const again = readFileSync(join(TMP, "PRODUCT_OWNER_SPEC.md"), "utf-8");
    expect(again.match(/ARCHITECTURE_SYNC/g)!.length).toBe(1);
    expect(again).toMatch(/\*\*Version\*\*: 1\.4\n/);
  });

  test("behind by releases: a marker older than the architecture selects only the entries after it", () => {
    writeFileSync(join(TMP, "PRODUCT_OWNER_SPEC.md"), SPEC.replace("<!-- DOC_LANGUAGE: es -->", "<!-- DOC_LANGUAGE: es -->\n<!-- ARCHITECTURE_SYNC: 1.2.0 (2026-08-21) -->"));
    const d = delta(TMP);
    expect(d.state.sync_state).toBe("behind by 1 release(s)");
    expect(d.releases.map((r: any) => r.version)).toEqual(["Unreleased", "1.3.0"]);
    expect(d.components.map((c: any) => c.slug)).toEqual(["web-app"]);
  });

  test("the CLI writes .cache/sa-skills/po-spec-delta.md and exits 2 without a spec", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    expect(readFileSync(join(TMP, ".cache", "sa-skills", "po-spec-delta.md"), "utf-8")).toMatch(/^# PO Spec delta — PRODUCT_OWNER_SPEC\.md/);
    expect(r.stderr.toString()).toMatch(/PO Spec v1\.2 \(2026-08-15\) — behind by 1 release\(s\); architecture v1\.3\.0; 2 changelog entries since/);
    const bad = Bun.spawnSync(["bun", SCRIPT, TMP, "--po-spec", join(TMP, "nope.md")], { stdout: "pipe", stderr: "pipe" });
    expect(bad.exitCode).toBe(2);
    expect(bad.stderr.toString()).toMatch(/PO Spec not found/);
  });
});

// the PO Spec is business only — check needs no architecture, so it runs without sa-skills
describe("po-spec-delta --check", () => {
  const DIR = join(__dirname, ".temp-po-spec-check");
  beforeAll(() => { rmSync(DIR, { recursive: true, force: true }); mkdirSync(DIR, { recursive: true }); });
  afterAll(() => rmSync(DIR, { recursive: true, force: true }));
  const run = (body: string) => { writeFileSync(join(DIR, "PRODUCT_OWNER_SPEC.md"), body, "utf-8"); return check(DIR).findings; };

  test("a clean business spec passes", () => {
    expect(run(`# Spec\n\n**Version**: 1.0\n\nEl cliente consulta su historial sin conexión. Riesgo I-alto no es un id.\n`)).toEqual([]);
  });
  test("an ADR link is one finding with its target; bare ids, TDRs, integrations and docs links are findings", () => {
    const f = run(`# Spec\n\nPer [ADR-117](adr/ADR-117-base.md) y ADR-016.\nDeuda TDR-002; integración I-09.\nVer [flujo](docs/04-data-flow-patterns.md).\n`);
    expect(f.map((x: any) => x.ref)).toEqual(["ADR-117", "ADR-016", "TDR-002", "I-09", "docs/04-data-flow-patterns.md"]);
    expect(f[0]).toMatchObject({ line: 3, link: "adr/ADR-117-base.md" });
  });
  test("HTML comments and fenced code are not the spec's text", () => {
    expect(run(`# Spec\n<!-- ARCHITECTURE_SYNC: 1.0.0 (2026-09-30) ADR-101 -->\n<!--\nADR-102\n-->\n\`\`\`\nADR-103\n\`\`\`\nTexto.\n`)).toEqual([]);
  });
  test("the CLI exits 1 on a finding and 0 on a clean spec", () => {
    writeFileSync(join(DIR, "PRODUCT_OWNER_SPEC.md"), "# Spec\n\nPer ADR-101.\n", "utf-8");
    expect(Bun.spawnSync(["bun", SCRIPT, DIR, "--check"]).exitCode).toBe(1);
    writeFileSync(join(DIR, "PRODUCT_OWNER_SPEC.md"), "# Spec\n\nTexto de negocio.\n", "utf-8");
    expect(Bun.spawnSync(["bun", SCRIPT, DIR, "--check"]).exitCode).toBe(0);
  });
});
