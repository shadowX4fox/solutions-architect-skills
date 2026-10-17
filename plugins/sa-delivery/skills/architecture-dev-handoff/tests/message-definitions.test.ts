/**
 * handoff-prepare.js § Message Definitions (8.105.0) — a consumer's payload carries the message its producer documents:
 * the docs/05 block of each async integration, the message sections of the descriptor at the other end, and — through a
 * broker — of the producers behind it. Without it a consumer's Avro generator had no field to write.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prepare } = require("../scripts/handoff-prepare.js");
const TMP = join(__dirname, ".temp-message-definitions");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); };
const hdr = (self: string, type: string) => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: Kafka\ncomponent_self: ${self}\ncomponent_type: ${type}\nscope: s\nrelated_adrs: ADR-101\n-->`;

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: en -->\n\n# Jobs — Architecture\n`);
  w("docs/05-integration-points.md", `# Integrations\n\n## 7. Integration Points <!-- SECTION: Integration Points -->\n\n### 7.1 Inventory\n\n| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n| I-01 | \`Scheduler\` | \`Job Topic\` | Kafka | Event, async | internal |\n| I-02 | \`Job Topic\` | \`Worker\` | Kafka | Event, async | internal |\n| I-03 | \`Worker\` | \`Ledger\` | HTTPS/JSON | Request-response | internal |\n\n### 7.2 Integrations\n\n**I-01 — Job events published**\n\nThe scheduler publishes \`JobExecutionEvent\` when a job is due.\n\n**I-02 — Job events consumed**\n\nThe worker consumes \`JobExecutionEvent\` and runs the job.\n\n**I-03 — Posting**\n\nThe worker posts the result.\n`);
  w("docs/components/README.md", `# Components\n`);
  w("docs/components/jobs.md", `# Jobs\n\n${hdr("jobs", "internal-system")}\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/jobs/01-scheduler.md", `# Scheduler\n\n${hdr("scheduler", "api-service")}\n\n**Type:** API Service\n**Technology:** [Spring Boot, Kafka]\n\n## Event Schema\n\n\`\`\`json\n{ "jobId": "uuid", "eventTime": "timestamp-millis", "executionStartTime": "timestamp-millis | null" }\n\`\`\`\n\n## Scaling\n\nThree replicas.\n`);
  w("docs/components/jobs/02-job-topic.md", `# Job Topic\n\n${hdr("job-topic", "message-broker")}\n\n**Type:** Message Broker\n**Technology:** [Confluent Kafka]\n\n## Topics\n\n- **Event Schema Fields**: jobId, eventTime, executionStartTime\n`);
  w("docs/components/jobs/03-worker.md", `# Worker\n\n${hdr("worker", "message-consumer")}\n\n**Type:** Message Consumer\n**Technology:** [Spring Boot, Kafka]\n`);
  w("docs/components/jobs/04-ledger.md", `# Ledger\n\n${hdr("ledger", "api-service")}\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n\n## Event Schema\n\n\`\`\`json\n{ "unrelated": "true" }\n\`\`\`\n`);
  w("adr/ADR-101-x.md", `# ADR-101: x\n\n**Status**: Accepted\n**Scope**: Project\n\n## Decision\n\nx.\n`);
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("Message Definitions", () => {
  test("a consumer gets the docs/05 block, the broker's field list and — through the broker — the producer's schema", async () => {
    const r = await prepare(TMP, { components: "worker", date: "2026-10-01" });
    const p = readFileSync(r.result.cut_sheets[0].payload_path, "utf8");
    expect(p).toMatch(/asset_types: \[asyncapi, avro, c4-descriptor\]\nasset_basis: "descriptor keywords"\nserialization_default: avro\n/);   // Kafka, no format named: Avro by default
    const m = p.match(/## Message Definitions <!-- SECTION: Message Definitions -->\n([\s\S]*?)\n## Flows referencing/)![1];
    expect(m).toContain("### docs/05 § I-02 — Job events consumed");
    expect(m).toContain("### Job Topic (`docs/components/jobs/02-job-topic.md`) § Topics\n\n- **Event Schema Fields**: jobId, eventTime, executionStartTime");
    expect(m).toMatch(/### Scheduler \(`docs\/components\/jobs\/01-scheduler\.md`\) § Event Schema\n\n```json\n\{ "jobId"/);
    expect(m).not.toContain("unrelated");   // the Ledger is on a synchronous edge: its message sections are not this component's
    expect(m).not.toContain("Three replicas");   // only the message sections of a descriptor, never the whole file
  });

  test("a relational store gets ddl.sql with its engine; a NoSQL store gets none", async () => {
    w("docs/components/jobs/05-job-db.md", `# Job DB\n\n${hdr("job-db", "database")}\n\n**Type:** Database\n**Technology:** [Azure Database for PostgreSQL 16]\n`);
    w("docs/components/jobs/06-doc-store.md", `# Doc Store\n\n${hdr("doc-store", "database")}\n\n**Type:** Database\n**Technology:** [MongoDB Atlas]\n`);
    const r = await prepare(TMP, { components: "job-db,doc-store", date: "2026-10-01" });
    const fm = (slug: string) => readFileSync(r.result.cut_sheets.find((c: any) => c.slug === slug).payload_path, "utf8").split("---")[1];
    expect(fm("job-db")).toMatch(/asset_types: \[ddl, c4-descriptor\]\nasset_basis: "descriptor keywords"\nsql_engine: postgresql\n/);
    expect(fm("doc-store")).toMatch(/asset_types: \[c4-descriptor\]\n/); expect(fm("doc-store")).not.toContain("sql_engine");
  });

  test("a gRPC service gets schema.proto and no OpenAPI, and its gRPC integration's docs/05 block", async () => {
    const d05 = readFileSync(join(TMP, "docs/05-integration-points.md"), "utf8")
      .replace("| I-03 | `Worker` | `Ledger` | HTTPS/JSON | Request-response | internal |", "| I-03 | `Worker` | `Ledger` | HTTPS/JSON | Request-response | internal |\n| I-04 | `Worker` | `Rate Service` | gRPC | Request-response | internal |")
      + "\n**I-04 — Rate lookup**\n\nThe worker calls GetRate (currency) on the Rate Service, which returns rate.\n";
    w("docs/05-integration-points.md", d05);
    w("docs/components/jobs/07-rate-service.md", `# Rate Service\n\n${hdr("rate-service", "api-service")}\n\n**Type:** API Service\n**Technology:** [Go, gRPC]\n`);
    const r = await prepare(TMP, { components: "rate-service", date: "2026-10-01" });
    const p = readFileSync(r.result.cut_sheets[0].payload_path, "utf8");
    expect(p).toMatch(/asset_types: \[protobuf, c4-descriptor\]\n/);   // the .proto is its API contract — no openapi.yaml
    expect(p).toContain("### docs/05 § I-04 — Rate lookup");
  });

  test("a component with no message asset carries no section", async () => {
    const r = await prepare(TMP, { components: "ledger", date: "2026-10-01" });
    expect(readFileSync(r.result.cut_sheets[0].payload_path, "utf8")).not.toContain("## Message Definitions");
  });
});

/**
 * handoff-prepare.js § Operation Definitions (8.109.0) — an API's payload carries the operations docs/05 documents for the
 * integrations it receives: the I-nn block, its inventory row, and the rows of any other docs/05 table citing that id.
 * Without it an OpenAPI generator read the descriptor alone and left `paths: {}`.
 */
describe("Operation Definitions", () => {
  test("a REST service gets its inbound block, its inventory row and the operations table rows that cite it", async () => {
    w("docs/05-integration-points.md", readFileSync(join(TMP, "docs/05-integration-points.md"), "utf8")
      + "\n### 7.6 Operation Contracts\n\nWhat each Ledger operation carries. `{entryId}` is opaque.\n\n| Operation | Edge | Request | Response |\n|---|---|---|---|\n| `POST /v1/entries` | I-03 | `jobId`, `amount` | `entryId` |\n| `GET /v1/entries/{entryId}` | I-03 | — | `entryId`, `amount` |\n| `POST /v1/rates` | I-30 | `currency` | `rate` |\n");
    const r = await prepare(TMP, { components: "ledger", date: "2026-10-01" });
    const p = readFileSync(r.result.cut_sheets[0].payload_path, "utf8");
    expect(p).toMatch(/asset_types: \[openapi, c4-descriptor\]\n/);
    const m = p.match(/## Operation Definitions <!-- SECTION: Operation Definitions -->\n([\s\S]*?)\n## Flows referencing/)![1];
    expect(m).toContain("### docs/05 § I-03 — Posting");
    expect(m).toMatch(/### docs\/05 § 7\.1 Inventory\n\n\| # \| From[^\n]*\n\|[-| ]+\|\n\| I-03 \|[^\n]*\n\n/);   // the inventory gives I-03's row alone
    expect(m).toContain("What each Ledger operation carries. `{entryId}` is opaque.");   // the prose that opens the section
    expect(m).toContain("| `POST /v1/entries` | I-03 |"); expect(m).toContain("| `GET /v1/entries/{entryId}` | I-03 |");
    expect(m).not.toContain("I-30");   // `I-3` is not a prefix match — and I-30 is not this component's
    expect(m).not.toContain("I-01");   // async edges are Message Definitions, not operations
  });

  test("a consumer with no API asset carries no section", async () => {
    const r = await prepare(TMP, { components: "worker", date: "2026-10-01" });
    expect(readFileSync(r.result.cut_sheets[0].payload_path, "utf8")).not.toContain("## Operation Definitions");
  });
});

/**
 * Asset selection (8.113.0) — the API contracts follow the protocols of the integrations a component receives in docs/05,
 * and another component's name in the descriptor is no signal. On 2026-10-01 a REST service lost its OpenAPI to a GraphQL
 * hop (HTTPS/JSON did not count as REST) and later turned GraphQL because its deployment section named a GraphQL gateway.
 */
describe("asset selection", () => {
  const fmOf = (r: any, slug: string) => readFileSync(r.result.cut_sheets.find((c: any) => c.slug === slug).payload_path, "utf8").split("---")[1];
  test("an HTTPS/JSON inbound edge is an OpenAPI surface beside a GraphQL one", async () => {
    w("docs/05-integration-points.md", readFileSync(join(TMP, "docs/05-integration-points.md"), "utf8")
      .replace("| I-03 | `Worker` | `Ledger` | HTTPS/JSON | Request-response | internal |", "| I-03 | `Worker` | `Ledger` | HTTPS/JSON | Request-response | internal |\n| I-05 | `Scheduler` | `Ledger` | GraphQL/HTTPS | Request-response | internal |"));
    const r = await prepare(TMP, { components: "ledger", date: "2026-10-01" });
    expect(fmOf(r, "ledger")).toMatch(/asset_types: \[openapi, graphql-sdl, c4-descriptor\]\nasset_basis: "docs\/05 inbound I-03 → openapi, I-05 → graphql-sdl"\n/);
  });
  test("another component's name in the deployment section is not a signal", async () => {
    w("docs/components/jobs/08-graph-gateway.md", `# Graph Gateway GraphQL\n\n${hdr("graph-gateway", "api-service")}\n\n**Type:** API Service\n**Technology:** [Apollo]\n`);
    w("docs/components/jobs/09-billing.md", `# Billing\n\n${hdr("billing", "api-service")}\n\n**Type:** API Service\n**Technology:** [Spring Boot]\n\n## Deployment\n\nReached through the Graph Gateway GraphQL.\n`);
    const r = await prepare(TMP, { components: "billing", date: "2026-10-01" });
    expect(fmOf(r, "billing")).toMatch(/asset_types: \[openapi, c4-descriptor\]\n/);   // no inbound edge: keywords, without the gateway's name
  });
  test("a data store gets no API contract from keywords — only from a documented inbound edge", async () => {
    w("docs/components/jobs/10-state-store.md", `# State Store\n\n${hdr("state-store", "database")}\n\n**Type:** Database\n**Technology:** [Couchbase Server]\n**Communicates via:** Couchbase SDK from the service endpoint\n`);
    const r = await prepare(TMP, { components: "state-store", date: "2026-10-01" });
    expect(fmOf(r, "state-store")).toMatch(/asset_types: \[c4-descriptor\]\n/);
  });
});
