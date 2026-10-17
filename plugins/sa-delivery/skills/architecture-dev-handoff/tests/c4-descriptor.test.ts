/**
 * c4-descriptor.js — the C4 descriptor rendered by code: one table of facts, every value from a structured source,
 * every missing one a [NOT DOCUMENTED — …] gap naming the row to add, the gaps in kit-gaps-merge's format.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { run, technology, segments } = require("../scripts/c4-descriptor.js");
const TMP = join(__dirname, ".temp-c4-descriptor");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); };
const hdr = (self: string, type: string) => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: Java\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: s\nrelated_adrs: ADR-101\n-->`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 2.1.0 -->\n<!-- DOC_LANGUAGE: en -->\n\n# Orders — Architecture\n`);
  w("docs/components/README.md", `# Components\n`);
  w("docs/components/orders.md", `# Orders\n\n${hdr("orders", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/orders/01-hub-api.md", `# Hub API\n\n${hdr("hub-api", "api-service")}\n\n**Type:** API Service\n**Technology:** [Spring Boot 3.4 **WebFlux**, [Kafka](https://kafka.apache.org), Java 21] — mandated per [ADR-015](../../../adr/ADR-015.md)\n**Internal Name:** shp-msa-hub\n**Component Version:** 1.4.0\n**Owner:** Channels squad\n**Deploys as:** Container on AKS <!-- TODO: Add source reference -->\n**Capability:** XCHN\n**Lifecycle:** Live\n\n## Capacity <!-- LABEL: Capacity -->\n\n| Metric | Value | Unit | Source |\n|---|---|---|---|\n| capacity_per_replica | 120 | rps | load test |\n| replicas | 3 | count | HPA |\n| max_replicas | 12 | count | HPA |\n`);
  w("docs/components/orders/02-order-db.md", `# Order DB\n\n${hdr("order-db", "database")}\n\n**Type:** Database\n**Technology:** PostgreSQL 16\n`);
  w("BIAN_ALIGNMENT.md", `# BIAN\n\n## Diagram ID Segments <!-- SECTION: Diagram ID Segments -->\n\n| Business Area | \`DOM\` | Business Domain | \`CAP\` | BIAN id | Status |\n|---|---|---|---|---|---|\n| Channels | \`CNL\` | Cross Channel | \`XCHN\` | \`146482\` | 🟢 |\n| Customers | \`CUS\` | Party Reference | \`PRTY\` | \`146499\` | 🟡 |\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("c4-descriptor", () => {
  test("a documented component: every row from its source, no gap", () => {
    const r = run(TMP, { components: "hub-api", governed: true });
    const d = r.descriptors[0];
    expect(d.gaps.map((g: any) => g.field)).toEqual(["Host · IP · OS · Domain"]);   // the one fact the docs never structure
    expect(d.md).toMatch(/\| Component \| (\d+\.\d+ )?Hub API \(`shp-msa-hub`\) \|/);   // the index when the component index gives one, and the internal name beside the canonical name
    expect(d.md).toContain("| Technology | Spring Boot 3.4 WebFlux, Kafka, Java 21 |");   // the bracketed list only, as text — no prose, no links
    expect(d.md).toContain("| Versions | architecture v2.1.0 · component v1.4.0 |");
    expect(d.md).toContain("| Owner | Channels squad |");
    expect(d.md).toContain("| Runs on | Container on AKS |");   // the authoring comment does not leak
    expect(d.md).toContain("| Capacity | 3–12 replicas · 120 rps per replica |");
    expect(d.md).toContain("| Business Area · Capability | `CNL` · `XCHN` |");
    expect(d.md).toContain("| Lifecycle | `Live` |");
    expect(d.md).toMatch(/\*\*Specification\*\*: \[Component Specification\]\(\.\.\/\.\.\/components\/\d\d-hub-api\.md\)/);
    expect(d.md.length).toBeLessThan(1400);
  });

  test("an undocumented component: each missing fact is a gap naming the row and the file", () => {
    const d = run(TMP, { components: "order-db", governed: true }).descriptors[0];
    const fields = d.gaps.map((g: any) => g.field);
    expect(fields).toEqual(["component version", "Owner", "Runs on", "Capacity", "Host · IP · OS · Domain", "Business Area · Capability", "Lifecycle"]);
    expect(d.md).toContain("[NOT DOCUMENTED — add `**Owner:**` to docs/components/orders/02-order-db.md]");
    expect(d.md).toContain("one of CNL/XCHN, CUS/PRTY");   // the closed list the alignment allows
    expect(d.gaps.every((g: any) => g.asset === "c4-descriptor.md" && g.where && g.impact)).toBe(true);
  });

  test("fallback mode has no Model Identity rows", () => {
    const d = run(TMP, { components: "hub-api", governed: false }).descriptors[0];
    expect(d.md).not.toMatch(/Business Area|CI class|Lifecycle|u_diagram_id/);
  });

  test("Spanish labels and gap markers under doc_language es", () => {
    const d = run(TMP, { components: "order-db", governed: false, lang: "es" }).descriptors[0];
    expect(d.md).toContain("| Campo | Valor |");
    expect(d.md).toContain("[NO DOCUMENTADO — agregar `**Owner:**` a docs/components/orders/02-order-db.md]");
  });

  test("--write puts the descriptor in the asset folder and the gaps where Step 5.3 merges them", () => {
    const r = run(TMP, { components: "all", governed: true, write: true });
    expect(r.descriptors.map((d: any) => d.slug).sort()).toEqual(["hub-api", "order-db"]);   // L2 only — the L1 system has none
    const db = r.descriptors.find((d: any) => d.slug === "order-db");
    expect(existsSync(db.path)).toBe(true); expect(db.path).toMatch(/handoffs\/assets\/\d\d-order-db\/c4-descriptor\.md$/);
    expect(JSON.parse(readFileSync(db.gaps_path, "utf8")).gaps.length).toBe(7);
    expect(db.gaps_path).toMatch(/\.cache\/sa-skills\/handoff-payloads\/asset-gaps\/order-db\.c4-descriptor\.json$/);
  });

  test("unknown slugs are reported; the CLI exits 1 on them", () => {
    expect(run(TMP, { components: "nope", governed: false }).unknown).toEqual(["nope"]);
    const b = Bun.spawnSync(["bun", join(__dirname, "..", "scripts", "c4-descriptor.js"), TMP, "--components", "nope"], { stdout: "pipe", stderr: "pipe" });
    expect(b.exitCode).toBe(1);
  });

  test("helpers: technology keeps the bracketed list; segments read the closed DOM/CAP pairs", () => {
    expect(technology("**Technology:** PostgreSQL 16\n")).toBe("PostgreSQL 16");
    expect(segments(TMP)).toEqual([{ dom: "CNL", cap: "XCHN" }, { dom: "CUS", cap: "PRTY" }]);
  });
});
