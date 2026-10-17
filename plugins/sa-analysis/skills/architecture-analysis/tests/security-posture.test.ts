/**
 * security-posture.js — the checklist consolidated by code from the STRIDE and Data Sensitivity
 * reports: one check per matrix cell (pass → Documented, finding → Gap with the threat id and the
 * High-Priority table's mitigation), one check per required control of every S1 / S2 store (marked
 * from the inventory columns and the G tables; unassessed → [NOT DOCUMENTED] and a gap entry),
 * reviewer columns empty, the missing-source rule, the language from the marker.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "..", "scripts", "security-posture.js");
let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "posture-")); mkdirSync(join(dir, "analysis")); writeFileSync(join(dir, "ARCHITECTURE.md"), "<!-- ARCHITECTURE_VERSION: 2.0.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: en -->\n\n# Ledger Platform — Architecture\n"); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const STRIDE = `# STRIDE — Ledger v2.0.0

## 3. STRIDE Matrix <!-- SECTION: STRIDE Matrix -->

### TB-01 — Internet → API Gateway

| Auth Mechanism: OAuth2 JWT | Data: PII |
|---|---|

| # | Threat | Category | Severity | Status | Control / Gap |
|---|---|---|---|---|---|
| — | Token replay | S Spoofing | High | ✅ Pass | JWT validated at the gateway, 5-minute expiry |
| T1-I | PII in query strings | I Info Disclosure | High | ⚠️ Finding | Query parameters logged by the CDN |
| — | Rate limiting | D DoS | Medium | ✅ Pass | APIM 1000 req/min |

## 4. High-Priority Threats <!-- SECTION: High-Priority Threats -->

| # | Trust Boundary | STRIDE Category | Threat Description | Recommended Mitigation | ADR Reference |
|---|---|---|---|---|---|
| T1-I | TB-01 | I | PII in query strings | Move identifiers to the request body and mask the CDN log | ADR-012 |

## 6. Top 5 Remediation Recommendations <!-- SECTION: Top 5 Remediation Recommendations -->

**1. Mask the CDN log (T1-I)**
Move identifiers to the request body; enable CDN log masking. Trade-off: one client release.
_Source: docs/07-security-architecture.md § 9.4_

## 10. Documentation Gaps <!-- SECTION: Documentation Gaps -->

- [ ] \`[NOT DOCUMENTED]\` \`API Gateway\` — audit log retention (docs/09-operational-considerations.md)
`;
const DS = `# Data Sensitivity — Ledger v2.0.0

## 2. Data Inventory <!-- SECTION: Data Inventory -->

| # | Store / Queue / Cache | Type | Sensitivity Tier | Tags | Contains (examples) | Encryption at Rest | Encryption in Transit | Retention Policy | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | \`Ledger DB\` | Database | S1 - Restricted | PII | account ids | TDE (Azure SQL) | TLS 1.2 | Not documented | docs/07 § 9.3 |
| 2 | \`Session Cache\` | Cache | S2 - Confidential | tokens | session tokens | Not documented | TLS 1.2 | 24 h | docs/07 § 9.3 |
| 3 | \`Metrics Store\` | Database | S3 - Internal | — | counters | — | TLS | 30 d | docs/09 |

## 4. Encryption Gaps (G1 + G2) <!-- SECTION: Encryption Gaps -->

| # | Gap | Data Store / Flow | Sensitivity | Protocol / Storage | Missing Control | Source |
|---|---|---|---|---|---|---|
| G2-01 | G2 | \`Session Cache\` | S2 | Redis on VMs | Encryption at rest of the cache | docs/07 § 9.3 |

## 7. Recommendations <!-- SECTION: Recommendations -->

**1. Encrypt the cache volume (G2-01)**
Enable disk encryption on the Redis VMs. Trade-off: none at this volume.
`;
const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "SA_JUDGE"));   // the default engine, agent
const run = (args: string[] = []) => { const r = Bun.spawnSync([process.execPath, SCRIPT, dir, "--today", "2026-09-13", "--json", ...args], { stdout: "pipe", stderr: "pipe", env: ENV }); return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString(), json: (() => { try { return JSON.parse(r.stdout.toString()); } catch { return null; } })() }; };
const report = () => readFileSync(join(dir, "analysis", "SECURITY-POSTURE-2026-09-13.md"), "utf8");

describe("security-posture", () => {
  test("consolidates every matrix cell and every required control of the S1 / S2 stores", () => {
    writeFileSync(join(dir, "analysis", "STRIDE-2026-09-13.md"), STRIDE);
    writeFileSync(join(dir, "analysis", "DATA-SENSITIVITY-2026-09-13.md"), DS);
    const r = run();
    expect(r.code).toBe(0);
    expect(r.json.stride).toBe(3);
    expect(r.json.data).toBe(5 + 3);           // S1: five controls, S2: three; S3 summarized
    expect(r.json.stats.s34).toBe(1);
    const md = report();
    // STRIDE rows: the pass cell carries its control verbatim; the finding cell carries the High-Priority mitigation and the threat id
    expect(md).toMatch(/\| S-01 \| Internet → API Gateway \| JWT validated at the gateway, 5-minute expiry \| High \| ✅ Documented \|  \|  \|  \|/);
    expect(md).toMatch(/\| S-02 \| Internet → API Gateway \| Move identifiers to the request body and mask the CDN log \| High \| ⚠️ Gap \(T1-I\) \|  \|  \|  \|/);
    // data rows: documented from the inventory, gap from the G table, unassessed when the report never evaluated it
    expect(md).toMatch(/\| D-01 \| `Ledger DB` \| Encryption in transit \(TLS 1\.2\+\) \| S1 \| ✅ Documented \|/);
    expect(md).toMatch(/\| D-02 \| `Ledger DB` \| Encryption at rest \(TDE \/ envelope\) \| S1 \| ✅ Documented \|/);
    expect(md).toMatch(/\| D-03 \| `Ledger DB` \| Access logging \| S1 \| \[NOT DOCUMENTED\] \|/);
    expect(md).toMatch(/\| D-04 \| `Ledger DB` \| Retention ceiling \| S1 \| \[NOT DOCUMENTED\] \|/);
    expect(md).toMatch(/\| D-07 \| `Session Cache` \| Encryption at rest \(TDE \/ envelope\) \| S2 \| ⚠️ Gap \(G2-01\) \|/);
    // priorities reuse the source reports' recommendation prose; the source's own gaps are carried forward
    expect(md).toContain("Move identifiers to the request body; enable CDN log masking.");
    expect(md).toContain("Enable disk encryption on the Redis VMs.");
    expect(md).toContain("- [ ] `[NOT DOCUMENTED]` `API Gateway` — audit log retention");
    expect(md).toContain("<!-- SECTION: Validation Summary -->");
    expect(md).toMatch(/\| Total \| 11 \| \d+ \| 2 \| 1 \|/);
  });

  test("a gap row the judge has not answered binds to no store: no control is marked from it, and it is reported as undecided", () => {
    writeFileSync(join(dir, "analysis", "STRIDE-2026-09-13.md"), STRIDE);
    writeFileSync(join(dir, "analysis", "DATA-SENSITIVITY-2026-09-13.md"), DS.replace("| G2-01 | G2 | \`Session Cache\` |", "| G2-01 | G2 | the session cache VMs |"));
    const r = run();
    expect(r.code).toBe(0);
    expect(r.json.binding.undecided).toEqual(["G2-01"]);
    expect(r.json.binding.pending).toMatch(/\.md$/);
    expect(r.err).toContain("1 undecided, bound to no store (G2-01)");
    const md = report();
    expect(md).not.toContain("⚠️ Gap (G2-01)");                                  // never bound by the old fuzzy rule
    expect(md).toContain("G2-01 `the session cache vms` — gap row bound to no store — the judge has not answered");
  });

  test("one source missing: the other is consolidated, the missing table prints the NOT GENERATED row, the gap is recorded", () => {
    writeFileSync(join(dir, "analysis", "STRIDE-2026-09-13.md"), STRIDE);
    const r = run();
    expect(r.code).toBe(0);
    expect(r.json.missing).toEqual(["Data Sensitivity"]);
    const md = report();
    expect(md).toContain("[NOT GENERATED — run the Data Sensitivity analysis first]");
    expect(md).toContain("source report absent");
  });

  test("both sources missing: abort", () => {
    const r = run();
    expect(r.code).toBe(1);
    expect(r.err).toContain("ANALYSIS ABORTED");
  });

  test("the marker picks the language of the visible titles; ids, headers and enum values stay", () => {
    writeFileSync(join(dir, "ARCHITECTURE.md"), "<!-- ARCHITECTURE_VERSION: 2.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Plataforma — Arquitectura\n");
    writeFileSync(join(dir, "analysis", "STRIDE-2026-09-13.md"), STRIDE);
    writeFileSync(join(dir, "analysis", "DATA-SENSITIVITY-2026-09-13.md"), DS);
    expect(run().code).toBe(0);
    const md = report();
    expect(md).toContain("## 3. Controles STRIDE <!-- SECTION: STRIDE Controls -->");
    expect(md).toContain("| ID | Trust Boundary | Control to Validate | Sev | Finding | Status | Owner | Evidence |");
    expect(md).toContain("✅ Documented");
    expect(md).toContain("Cifrado en reposo (TDE / sobre)");
  });
});
