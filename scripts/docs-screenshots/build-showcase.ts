// a showcase project for the docs' screenshots: the synthetic Order Desk fixture, plus capacity and demand; its ten analysis reports come from analysis-fills.js through the renderer (README § The analysis pictures)
import { mkdirSync, writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
const [skill, root] = process.argv.slice(2);
const { FILES } = require(join(skill, "tests", "order-desk.fixture.ts"));
const w = (rel: string, s: string) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), s); };
for (const [k, v] of Object.entries(FILES)) w(k, v as string);
const cap = (per: number, rep: number, max: number) => `\n\n## Capacity <!-- LABEL: Capacity -->\n\n| Metric | Value | Unit | Source |\n|---|---|---|---|\n| capacity_per_replica | ${per} | rps | Load test, 2026-09 |\n| replicas | ${rep} | count | Deployment manifest |\n| max_replicas | ${max} | count | Autoscaler policy |\n| request_size | 2 | KB | API contract |\n| response_size | 6 | KB | API contract |\n`;
const add = (rel: string, s: string) => w(rel, (FILES[rel] as string) + s);
add("docs/components/order-desk/01-web-app.md", cap(400, 3, 8));
add("docs/components/order-desk/02-api-gateway.md", cap(600, 2, 6));
add("docs/components/order-desk/03-order-service.md", cap(150, 3, 6));
add("docs/components/order-desk/04-order-db.md", cap(300, 1, 1));
add("docs/components/order-desk/05-outbox-relay.md", cap(200, 2, 4));
w("docs/08-scalability-and-performance.md", `# Scalability and Performance\n\n### Demand <!-- LABEL: Demand by Use Case -->\n\n| Use Case | Value | Unit | Peak factor | Source |\n|---|---|---|---|---|\n| UC-01 | 240 | rps | 2 | Marketing forecast, holiday peak |\n`);
mkdirSync(join(root, "visualizations"), { recursive: true });
copyFileSync(join(skill, "examples", "order-desk.scene.json"), join(root, "visualizations", "architecture-command-center.scene.json"));
