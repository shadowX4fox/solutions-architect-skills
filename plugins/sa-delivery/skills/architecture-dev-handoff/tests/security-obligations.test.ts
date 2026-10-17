/**
 * security-obligations.js — a component's security obligations rendered by code: the callers docs/05 names (deny by
 * default), each interface's authentication from the STRIDE boundary inventory (none stated: it fails closed), the
 * Security by Design principle, the institutional ADRs the security section cites, the STRIDE findings of its
 * boundaries, the Data Sensitivity flows, the tests. kit-check fails a specification without it.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { run, cellNames } = require("../scripts/security-obligations.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const kitCheck = require("../scripts/kit-check.js");
const TMP = join(__dirname, ".temp-security-obligations");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); };
const hdr = (self: string, type: string) => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: Java\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: s\nrelated_adrs: ADR-101\n-->`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk — Architecture\n`);
  w("docs/components/README.md", `# Components\n`);
  w("docs/components/desk.md", `# Desk\n\n${hdr("desk", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/desk/01-web-app.md", `# Web App\n\n${hdr("web-app", "web-application")}\n\n**Type:** Web Application\n**Technology:** [React]\n`);
  w("docs/components/desk/02-hub-api.md", `# Hub API\n\n${hdr("hub-api", "api-service")}\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n**Internal Name:** od-hub-api\n`);
  w("docs/components/desk/03-ledger-store.md", `# Ledger Store\n\n${hdr("ledger-store", "database")}\n\n**Type:** Database\n**Technology:** [PostgreSQL]\n`);
  w("docs/05-integration-points.md", `# Integration Points\n\n## 7. Integration Points <!-- SECTION: Integration Points -->\n\n| ID | From | To | Protocol | Pattern | Notes |\n|---|---|---|---|---|---|\n| I-01 | \`Web App\` | \`Hub API\` | HTTPS/JSON | sync | — |\n| I-02 | \`Hub API\` | \`Ledger Store\` (orders schema) | PGWIRE | sync | — |\n| I-03 | Back Office | \`Hub API\` | HTTPS/JSON | sync | — |\n| I-04 | \`Web App\` and \`Hub API\` | Audit Sink | HTTPS/JSON | async | — |\n`);
  w("docs/02-architecture-principles.md", `# Principles\n\n## Architecture Principles <!-- SECTION: Architecture Principles -->\n\n### 4. Security by Design <!-- PRINCIPLE: Security by Design -->\n\n**Description:** <!-- LABEL: Description -->\nControls come before features.\n\n**Implementation:** <!-- LABEL: Implementation -->\n- Deny by default, per [ADR-012](../adr/ADR-012-service-mesh.md).\n  <!-- DEFERRED: something -->\n\n---\n### 5. Observability <!-- PRINCIPLE: Observability -->\n\nnot this one\n`);
  w("docs/07-security-architecture.md", `# Security\n\n## 9. Security Architecture <!-- SECTION: Security Architecture -->\n\nTokens per [ADR-005](../adr/ADR-005-identity.md); project decision [ADR-101](../adr/ADR-101-keys.md).\n`);
  w("adr/ADR-005-identity.md", `# ADR-005: Identity provider\n\n**Status**: Accepted\n\n## Decision\n\nJWT.\n`);
  w("adr/ADR-012-service-mesh.md", `# ADR-012: Service mesh\n\n**Status**: Accepted\n\n## Decision\n\nmTLS between pods.\n`);
  w("adr/ADR-101-keys.md", `# ADR-101: Idempotency keys\n\n**Status**: Accepted\n\n## Decision\n\nA key per write.\n`);
  w("analysis/STRIDE-2026-01-01.md", `# STRIDE\n\n## 2. Trust Boundary Inventory <!-- SECTION: Trust Boundary Inventory -->\n\n| ID | Name | From Zone | To Zone | Auth Mechanism | Data Classification | Source |\n|---|---|---|---|---|---|---|\n| TB-01 | Internet → Hub API (I-01) | Public | Internal | OAuth2 — JWT validated at the edge (ADR-005) | Confidential | docs/07 |\n| TB-02 | Back Office → Hub API (I-03) | Internal | Internal | [NOT DOCUMENTED] — operator login undefined | Restricted | docs/07 |\n| TB-03 | Many clients → Ledger Store (I-02, I-09) | Internal | Restricted | TLS | Restricted | docs/07 |\n\n## 3. STRIDE Matrix <!-- SECTION: STRIDE Matrix -->\n\n### TB-02 — Back Office → Hub API (I-03)\n\n| # | Threat | Category | Severity | Status | Control / Gap |\n|---|---|---|---|---|---|\n| — | Replay | Tampering | — | ✅ Pass | signed |\n| T4-S | An actor poses as Back Office | Spoofing | High | ⚠️ Finding | no operator authentication |\n\n### TB-03 — Many clients → Ledger Store\n\n| # | Threat | Category | Severity | Status | Control / Gap |\n|---|---|---|---|---|---|\n| T7-S | A stranger connector writes rows | Spoofing | Medium | ⚠️ Finding | not this component's |\n| T8-E | Hub API grants itself the admin role | Elevation of Privilege | High | ⚠️ Finding | names it |\n\n## 4. High-Priority Threats <!-- SECTION: High-Priority Threats -->\n\n| # | Trust Boundary | STRIDE Category | Threat Description | Recommended Mitigation | ADR Reference |\n|---|---|---|---|---|---|\n| T4-S | TB-02 | Spoofing | poses | Authenticate operators with SSO and MFA | ADR-005 |\n`);
  w("analysis/DATA-SENSITIVITY-2026-01-01.md", `# DS\n\n## 3. Sensitive Data Flow Map <!-- SECTION: Sensitive Data Flow Map -->\n\n| # | Flow | Step | From | To | Protocol | Carries Sensitive Data? | Encryption in Transit | Gap |\n|---|---|---|---|---|---|---|---|---|\n| 1 | Flow 1 — Place order | 1 | Web App | Hub API | HTTPS | Yes — card token | Documented | None |\n| 2 | Flow 1 — Place order | 2 | Ledger Store | Audit Sink | TLS | No | Documented | None |\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("security-obligations", () => {
  test("an endpoint cell names a component exactly, as one item of a list, or with a parenthetical — nothing looser", () => {
    const hub = { name: "Hub API", slug: "hub-api", internal_name: "od-hub-api" };
    expect(cellNames("`Hub API`", hub)).toBe(true);
    expect(cellNames("`Web App` and `Hub API`", hub)).toBe(true);
    expect(cellNames("Hub API (orders)", hub)).toBe(true);
    expect(cellNames("od-hub-api", hub)).toBe(true);
    expect(cellNames("Hub API Gateway", hub)).toBe(false);
    expect(cellNames("Hub", hub)).toBe(false);
  });

  test("callers deny by default; an interface with stated authentication is tested, one without fails closed and is a gap", () => {
    const d = run(TMP, { components: "hub-api" }).obligations[0];
    expect(d.inbound).toEqual([{ id: "I-01", caller: "Web App", authenticated: true }, { id: "I-03", caller: "Back Office", authenticated: false }]);
    expect(d.md).toContain("| I-01 | Web App | HTTPS/JSON | OAuth2 — JWT validated at the edge (ADR-005) | STRIDE TB-01 |");
    expect(d.md).toMatch(/\| I-03 \| Back Office \| HTTPS\/JSON \| \[NOT DOCUMENTED — authentication of I-03: state it in docs\/07-security-architecture\.md\] operator login undefined — fails closed until stated \| STRIDE TB-02 \|/);
    expect(d.md).toContain("Any other caller is rejected.");
    expect(d.md).toContain("- [ ] A call to I-01 without credentials is rejected.");
    expect(d.md).toContain("- [ ] A call to I-01 from a caller not listed under Inbound is rejected.");
    expect(d.md).toContain("- [ ] I-03 rejects every call until its authentication is documented.");
    expect(d.gaps.map((g: any) => g.field)).toEqual(["Authentication I-03", "Authentication I-04"]);   // an outbound row with no boundary is a gap too
  });

  test("outbound: the credential a boundary states, through an I-nn the component shares with others", () => {
    const d = run(TMP, { components: "hub-api" }).obligations[0];
    expect(d.md).toContain("| I-02 | Ledger Store (orders schema) | PGWIRE | TLS | STRIDE TB-03 |");
    expect(d.md).toContain("| I-04 | Audit Sink | HTTPS/JSON | [NOT DOCUMENTED — authentication of I-04: state it in docs/07-security-architecture.md] | docs/05 |");   // outbound never says "fails closed"
  });

  test("the principle verbatim with its links re-pointed, the institutional ADRs the security section cites, never a project one", () => {
    const d = run(TMP, { components: "hub-api" }).obligations[0];
    expect(d.md).toContain("### Principle: 4. Security by Design\n\n**Description:**\nControls come before features.");
    expect(d.md).toContain("per [ADR-012](../../../adr/ADR-012-service-mesh.md)");   // docs/ → handoffs/assets/NN-slug/
    expect(d.md).not.toContain("DEFERRED"); expect(d.md).not.toContain("not this one");
    expect(d.md).toContain("- [ADR-005](../../../adr/ADR-005-identity.md) — Identity provider");
    expect(d.md).toContain("- [ADR-012](../../../adr/ADR-012-service-mesh.md) — Service mesh");
    expect(d.md).not.toContain("- [ADR-101]");
  });

  test("threats: the findings of the boundaries whose sides name it, and any finding naming it — with the report's mitigation", () => {
    const d = run(TMP, { components: "hub-api" }).obligations[0];
    expect(d.threats).toEqual(["T4-S", "T8-E"]);   // T7-S sits on a boundary it reaches only through an I-nn, and does not name it
    expect(d.md).toContain("| T4-S | TB-02 | An actor poses as Back Office | Spoofing | High | ⚠️ Finding | Authenticate operators with SSO and MFA |");
    expect(d.md).toContain("- [ ] T4-S — An actor poses as Back Office: the mitigation holds, or a `TODO(architecture)` quotes this finding.");
    expect(d.md).toContain("| Flow 1 — Place order | 1 | Web App | Hub API | Yes — card token | Documented | None |");
    expect(d.md).not.toContain("| Ledger Store | Audit Sink |");
  });

  test("no STRIDE, no Data Sensitivity: each a gap naming the lens to run", () => {
    rmSync(join(TMP, "analysis"), { recursive: true, force: true });
    const d = run(TMP, { components: "web-app" }).obligations[0];
    expect(d.md).toContain("[NOT DOCUMENTED — analysis/STRIDE-*.md — run /sa-analysis:architecture-analysis stride]");
    expect(d.md).toContain("[NOT DOCUMENTED — analysis/DATA-SENSITIVITY-*.md — run /sa-analysis:architecture-analysis data-sensitivity]");
    expect(d.md).toContain("No documented caller: every inbound call is rejected.");
  });

  test("--write puts security.md beside the assets and its gaps where kit-gaps-merge reads them; kit-check fails a specification without it", () => {
    w("handoffs/components/02-hub-api.md", "# Hub API\n");
    const before = kitCheck.check([join(TMP, "handoffs")], { render: false });
    expect(before.files.find((f: any) => f.file.endsWith("02-hub-api.md")).findings.map((x: any) => x.rule)).toContain("security-missing");
    const r = run(TMP, { components: "hub-api", write: true });
    const p = join(TMP, "handoffs/assets/02-hub-api/security.md");
    expect(existsSync(p)).toBe(true); expect(readFileSync(p, "utf8")).toContain("rendered by security-obligations.js");
    expect(JSON.parse(readFileSync(r.obligations[0].gaps_path, "utf8")).assets).toEqual(["security.md"]);
    const after = kitCheck.check([join(TMP, "handoffs")], { render: false });
    expect(after.files.find((f: any) => f.file.endsWith("02-hub-api.md")).findings.map((x: any) => x.rule)).not.toContain("security-missing");
  });
});
