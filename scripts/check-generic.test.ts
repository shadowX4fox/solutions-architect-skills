import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { check, referenceProjects, scan, termsOf } from "./check-generic";

const FACTS = {
  components: [
    { name: "Order Intake Service", slug: "order-intake-service", internal_name: "shp-msa-order-intake", technology: ["Spring Boot", "Apache Kafka"] },
    { name: "Apache Kafka", slug: "kafka", internal_name: null, technology: ["Apache Kafka"] },
    { name: "Ledger", slug: "ledger", technology: [] },
  ],
  systems: [{ name: "Shop Platform 2.0" }, { name: "Billing" }],
};

describe("check-generic", () => {
  test("a project's own names: canonical names, slugs, internal names, systems — never a technology or a short common word", () => {
    const terms = termsOf("/work/acme-shop-architecture", FACTS);
    expect(terms).toEqual(expect.arrayContaining(["Order Intake Service", "order-intake-service", "shp-msa-order-intake", "Shop Platform 2.0", "acme-shop-architecture"]));
    expect(terms).not.toContain("Apache Kafka");   // a product name is everyone's
    expect(terms).not.toContain("Ledger"); expect(terms).not.toContain("Billing");   // too short to be distinctive
  });

  test("a hit is found whatever its case or accents, with its line; the baseline is a hash that names nothing", () => {
    const hits = scan([{ path: "skills/x/a.js", text: "// ok\n// the ORDER INTAKE service failed here\n" }, { path: "skills/x/b.md", text: "generic text" }], ["Order Intake Service"]);
    expect(hits).toEqual([{ file: "skills/x/a.js", term: "Order Intake Service", line: 2, hash: expect.stringMatching(/^[0-9a-f]{16}$/) }]);
  });

  test("a new mention fails; one in the baseline passes; a baseline entry that no longer hits is reported; no project → skipped", () => {
    const dir = mkdtempSync(join(tmpdir(), "generic-")); mkdirSync(join(dir, "proj", ".cache", "sa-skills"), { recursive: true });
    writeFileSync(join(dir, "proj", "ARCHITECTURE.md"), "# Shop\n");
    const files = [{ path: "skills/x/a.js", text: "// Order Intake Service" }];
    const run = (baseline: string[]) => check({ root: dir, projects: [join(dir, "proj")], terms: ["Order Intake Service"], files, baseline });
    const first = run([]);
    expect(first).toMatchObject({ status: "FAIL", fresh: [{ file: "skills/x/a.js", line: 1 }] });
    expect(run([first.fresh[0]!.hash])).toMatchObject({ status: "PASS", fresh: [] });
    expect(run([first.fresh[0]!.hash, "0000000000000000"]).gone).toEqual(["0000000000000000"]);
    expect(check({ root: dir, projects: [] }).status).toBe("SKIPPED");
    expect(referenceProjects(dir, `${join(dir, "proj")}:${join(dir, "missing")}`)).toEqual([join(dir, "proj")]);   // only a path holding ARCHITECTURE.md
    writeFileSync(join(dir, ".sa-reference-projects"), `# mine\n${join(dir, "proj")}\n`);
    expect(referenceProjects(dir, undefined)).toEqual([join(dir, "proj")]);
  });

  test("the repository holds no new name of a configured reference project", () => {
    const r = check();
    expect(r.fresh.map((h) => `${h.file}:${h.line} ${h.term}`)).toEqual([]);   // SKIPPED (no project configured) passes too
  });
});
