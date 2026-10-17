#!/usr/bin/env bun
/**
 * build-example.ts — the worked example scene, built from the synthetic Order Desk architecture.
 *
 *   bun skills/architecture-command-center/examples/build-example.ts [--check]
 *
 * The logical part is generated: the fixture (`tests/order-desk.fixture.ts`) is written to a temporary project and
 * `scene-from-docs.js` reads it, exactly as it reads a real one. The `deployment` block below is authored — in a project
 * it comes from Section 11 and the ADRs — and shows every shape the physical view draws: four tiers, a region holding a
 * cluster and its namespaces, a provider-managed service, the customer's device, instances and paths of every class.
 * Everything is invented: an example never carries a real project's names. `--check` fails when the committed
 * `order-desk.scene.json` is not what this script yields (a test runs it).
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { FILES } from "../tests/order-desk.fixture";

const SKILL = join(import.meta.dir, "..");
const OUT = join(import.meta.dir, "order-desk.scene.json");

const DEPLOYMENT = {
  description: "Production in one cloud region: an edge gateway in the DMZ, the services in a cluster, the store in a restricted subnet.",
  derivedFrom: "docs/03-architecture-layers.md § Diagram: C4 Level 2 — Container",
  tiers: [{ n: 1, name: "Public", owned: false }, { n: 2, name: "DMZ" }, { n: 3, name: "Internal" }, { n: 4, name: "Restricted" }],
  nodes: [
    { id: "browser", name: "Customer browser", kind: "client", tier: 1, owned: false, trustZone: "Public", jurisdiction: "Multi", tech: "Evergreen browsers", note: "Not deployed by the organization: a release reaches it on the next page load." },
    { id: "region", name: "Cloud region (primary)", kind: "region", trustZone: "Internal", jurisdiction: "US", resilience: "Active", note: "One region; a second one is a documented gap." },
    { id: "edge", name: "Edge gateway", kind: "device", tier: 2, parent: "region", trustZone: "DMZ", tech: "WAF · TLS termination", note: "Terminates TLS and applies rate limits before the cluster." },
    { id: "cluster", name: "Order Desk cluster", kind: "cluster", tier: 3, parent: "region", tech: "Kubernetes", resilience: "Active", note: "Three zones; the services scale on CPU." },
    { id: "ns-desk", name: "namespace order-desk", kind: "namespace", tier: 3, parent: "cluster" },
    { id: "data", name: "Data subnet", kind: "zone", tier: 4, parent: "region", trustZone: "Restricted", note: "Reachable from the cluster only." },
    { id: "pg", name: "Managed PostgreSQL", kind: "managed", tier: 4, parent: "data", owned: false, resilience: "Warm-Standby", tech: "PostgreSQL 16", note: "Provider-managed; one standby in another zone." },
    { id: "hub", name: "Payments Hub (partner)", kind: "managed", tier: 1, owned: false, trustZone: "Public", jurisdiction: "US", note: "Operated by the partner; reached over the public internet with mutual TLS." },
  ],
  instances: [
    { container: "web-app", node: "browser", replicas: "one per session", note: "Static assets served from the edge." },
    { container: "api-gateway", node: "ns-desk", replicas: "2–6 (HPA)" },
    { container: "order-service", node: "ns-desk", replicas: "3–10 (HPA)" },
    { container: "outbox-relay", node: "ns-desk", replicas: "1", note: "Single consumer: ordering matters more than throughput." },
    { container: "order-db", node: "pg", replicas: "primary + 1 standby" },
    { container: "hub-api", node: "hub", replicas: "Not documented" },
  ],
  paths: [
    { a: "browser", b: "edge", transport: "TLS:443", pathClass: "Public Internet", auth: "OAuth2" },
    { a: "edge", b: "cluster", transport: "TLS:443", pathClass: "Peering", auth: "mTLS" },
    { a: "ns-desk", b: "pg", transport: "TLS:5432", pathClass: "Private Link", auth: "Client certificate" },
    { a: "cluster", b: "hub", transport: "TLS:443", pathClass: "Public Internet", auth: "mTLS", crossBorder: "No" },
  ],
};

function build(): string {
  const root = mkdtempSync(join(tmpdir(), "order-desk-example-"));
  try {
    for (const [rel, body] of Object.entries(FILES)) { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body); }
    const gen = Bun.spawnSync(["bun", join(SKILL, "scripts", "scene-from-docs.js"), root, "--json"]);
    if (gen.exitCode !== 0) throw new Error(`scene-from-docs.js failed: ${gen.stderr.toString()}`);
    const scene = JSON.parse(gen.stdout.toString());
    scene.thesis = "A worked example: an order-taking system whose every name is invented.";
    scene.deployment = DEPLOYMENT;
    const text = JSON.stringify(scene, null, 1) + "\n";
    // the renderer is the schema's validator: a scene it refuses is not an example
    const tmp = join(root, "example.scene.json"); writeFileSync(tmp, text);
    for (const view of ["logical", "physical"]) {
      const r = Bun.spawnSync(["bun", join(SKILL, "scripts", "render.js"), tmp, join(root, `${view}.html`), "--lang", "en", "--view", view]);
      if (r.exitCode !== 0) throw new Error(`render.js refused the example (${view}): ${r.stderr.toString() || r.stdout.toString()}`);
    }
    return text;
  } finally { rmSync(root, { recursive: true, force: true }); }
}

export { build, OUT };

if (import.meta.main) {
  const text = build();
  if (process.argv.includes("--check")) {
    const same = existsSync(OUT) && readFileSync(OUT, "utf-8") === text;
    console.log(same ? "✓ examples/order-desk.scene.json is what build-example.ts yields" : "✗ examples/order-desk.scene.json is stale — run build-example.ts");
    process.exit(same ? 0 : 1);
  }
  writeFileSync(OUT, text);
  console.log(`✓ ${OUT} — ${(text.length / 1024).toFixed(1)} KB`);
}
