/**
 * contract-check.js — the gate every generated openapi.yaml, asyncapi.yaml and schema.graphql passes: parse, structure, fidelity to
 * the descriptor the generator read, Redocly's schema validation. Cases are the defects found on real kits (2026-10-01):
 * `components.schemas` indented under `paths` (28 dangling $refs in three contracts), undeclared path parameters,
 * `paths:` holding only comments, a conventional `POST /graphql` no descriptor stated.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check, checkFile, sourceOps, normPath, REDOCLY_BLOCKING, judgeMissing, render } = require("../scripts/contract-check.js");
const TMP = join(__dirname, ".temp-contract-check");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); return join(TMP, p); };
const rules = (r: any) => r.findings.map((x: any) => x.rule);
const off = {};   // Redocly runs on every case — it is a dependency, so the structure cases must pass it too

const GOOD = `openapi: "3.1.0"
info:
  title: "Hub API"
  version: "1.0.0"
servers:
  - url: "https://hub.example/api/v1"
paths:
  /items/{id}:
    get:
      operationId: getItem
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: ok
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Item'
        '404':
          description: not found
components:
  schemas:
    Item:
      type: object
`;
const SOURCE = `# Hub API

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| \`GET\` | \`/api/v1/items/{itemId}\` | One item |
| \`POST\` | \`/api/v1/items\` | Create an item |

## Outbound calls

- \`POST /ledger/entries\` — posts to the ledger
`;

beforeAll(() => { rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true }); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("structure", () => {
  test("a valid 3.1 file passes", () => {
    const r = checkFile(w("good/openapi.yaml", GOOD), off);
    expect(r.findings).toEqual([]);
  });
  test("a file that is not YAML fails at the parse", () => {
    expect(rules(checkFile(w("bad/openapi.yaml", "openapi: [3.1\n  info: :"), off))).toEqual(["yaml-parse"]);
  });
  test("`paths:` holding only comments is null, not OpenAPI", () => {
    const r = checkFile(w("nullpaths/openapi.yaml", `openapi: "3.1.0"\ninfo: { title: x, version: "1" }\npaths:\n  # TODO: [NOT DOCUMENTED]\n`), off);
    expect(rules(r)).toContain("map");
  });
  test("`paths: {}` with the gap in a comment passes", () => {
    const r = checkFile(w("emptypaths/openapi.yaml", `openapi: "3.1.0"\ninfo: { title: x, version: "1" }\npaths: {}\n# TODO: [NOT DOCUMENTED — add to docs/components/x.md]\ncomponents:\n  schemas: {}\n`), off);
    expect(r.findings).toEqual([]);
  });
  test("components.schemas indented under paths: non-path keys and dangling $refs", () => {
    const misplaced = GOOD.replace(/components:\n  schemas:\n    Item:\n      type: object\n/, "  schemas:\n    Item:\n      type: object\n");
    const r = checkFile(w("misplaced/openapi.yaml", misplaced), off);
    expect(rules(r)).toEqual(expect.arrayContaining(["path-key", "redocly/no-unresolved-refs"]));
    expect(rules(r)).not.toContain("method");   // the misplaced block's keys are one finding, not one per schema
  });
  test("a path parameter must be declared in: path, required: true", () => {
    const r = checkFile(w("param/openapi.yaml", GOOD.replace(/      parameters:\n(        .*\n)+?(?=      responses)/, "")), off);
    expect(rules(r)).toContain("path-param");
    const r2 = checkFile(w("param2/openapi.yaml", GOOD.replace("required: true", "required: false")), off);
    expect(rules(r2)).toContain("path-param");
  });
  test("a path parameter shared through components.parameters is declared", () => {
    const shared = GOOD.replace(/        - name: id\n          in: path\n          required: true\n          schema: \{ type: string \}\n/, "        - $ref: '#/components/parameters/Id'\n")
      .replace("components:\n  schemas:", "components:\n  parameters:\n    Id:\n      name: id\n      in: path\n      required: true\n      schema: { type: string }\n  schemas:");
    expect(rules(checkFile(w("refparam/openapi.yaml", shared), off))).not.toContain("path-param");
    // the ref still carries the rule: a shared parameter that is not required is the same finding
    expect(rules(checkFile(w("refparam2/openapi.yaml", shared.replace("required: true\n      schema", "required: false\n      schema")), off))).toContain("path-param");
    // a dangling ref is Redocly's no-unresolved-refs, not a second path-param finding
    expect(rules(checkFile(w("refparam3/openapi.yaml", shared.replace("#/components/parameters/Id", "#/components/parameters/Nope")), off))).not.toContain("path-param");
  });
  test("responses need a status-code key and a description", () => {
    const r = checkFile(w("resp/openapi.yaml", GOOD.replace("'404':\n          description: not found", "'40x':\n          summary: nope")), off);
    expect(r.findings.filter((x: any) => x.rule === "responses").length).toBe(2);
  });
  test("operationIds are unique; security names a declared scheme", () => {
    const dup = GOOD.replace("components:", `  /other:\n    get:\n      operationId: getItem\n      security:\n        - bearerAuth: []\n      responses:\n        '200': { description: ok }\ncomponents:`);
    expect(rules(checkFile(w("dup/openapi.yaml", dup), off))).toEqual(expect.arrayContaining(["operation-id", "security"]));
  });
  test("a scaffold placeholder in a value fails; the NOT DOCUMENTED gap marker does not", () => {
    expect(rules(checkFile(w("ph/openapi.yaml", GOOD.replace('"Hub API"', '"[COMPONENT_NAME] API"')), off))).toContain("placeholder");
    expect(checkFile(w("nd/openapi.yaml", GOOD.replace('"1.0.0"', '"[NOT DOCUMENTED — add to docs/components/hub.md]"')), off).findings).toEqual([]);
  });
  test("3.0.x warns, anything else blocks", () => {
    const r = checkFile(w("v30/openapi.yaml", GOOD.replace('"3.1.0"', '"3.0.3"')), off);
    expect(r.findings).toEqual([]); expect(r.warnings.map((x: any) => x.rule)).toContain("version");
    expect(rules(checkFile(w("v2/openapi.yaml", GOOD.replace('openapi: "3.1.0"', 'openapi: "2.0"')), off))).toContain("version");
  });
});

describe("fidelity", () => {
  test("the source's three forms: a table row, a bullet, a structured method/path pair", () => {
    const s = sourceOps(`| \`GET\` | \`/a/{id}\` | x |\n- \`DELETE /b\` — y\napis:\n  inbound:\n    - method: POST\n      path: /c\n  outbound_calls:\n    - method: GET\n      path: /d\nSee also GET /e in prose.\n`);
    expect([...s.declared.keys()].sort()).toEqual(["DELETE /b", "GET /a/{}", "GET /d", "POST /c"]);
    expect(s.mentioned.has("GET /e")).toBe(true); expect(s.declared.has("GET /e")).toBe(false);
    expect(s.declared.get("GET /d").outbound).toBe(true); expect(s.declared.get("POST /c").outbound).toBe(false);
  });
  test("a server URL's path is a base path; parameters compare by position", () => {
    expect(normPath("/api/v1/items/{itemId}/")).toBe("/api/v1/items/{}");
    const r = checkFile(w("fid/openapi.yaml", GOOD), { ...off, source: w("fid/src.md", SOURCE) });
    expect(r.findings).toEqual([]);
    const missing = r.warnings.filter((x: any) => x.rule === "operation-missing").map((x: any) => x.key);
    expect(missing).toEqual(["POST /api/v1/items", "POST /ledger/entries"]);
    expect(r.warnings.find((x: any) => x.key === "POST /ledger/entries").text).toMatch(/outbound/);
  });
  test("--judge: an operation no judge has answered is undecided — listed, never blocked on; a confident yes blocks", async () => {
    const root = join(TMP, "judged");
    const run = () => { const r = checkFile(w("judged/assets/02-hub-api/openapi.yaml", GOOD), { ...off, source: w("judged/src.md", SOURCE) }); return { r, res: { status: "PASS", files: [r] } }; };
    // the default engine writes a worksheet: both declared-but-absent operations are undecided, neither is dismissed nor blocks
    const a = run(); const j = await judgeMissing(a.res.files, "agent", root);
    expect(j.pending).toMatch(/openapi-operation-exposed\.worksheet\.md$/);
    expect(j.undecided).toEqual(["02-hub-api:f1.op1", "02-hub-api:f1.op2"]);
    expect(a.r.findings).toEqual([]);
    expect(a.r.warnings.filter((x: any) => x.rule === "operation-missing")).toHaveLength(2);   // the code check stands
    expect(a.r.undecided.map((x: any) => x.key)).toEqual(["POST /api/v1/items", "POST /ledger/entries"]);
    expect(render(a.res)).toMatch(/\? \[operation-undecided\] POST \/api\/v1\/items — whether the component exposes it is undecided: the judge's worksheet is pending — answer .*worksheet\.md and re-run/);
    // the session answers one item beside the worksheet: that one is decided (a confident yes blocks), the other stays undecided
    const ws = readFileSync(j.pending, "utf8"); const out = ws.match(/Write the answers to `([^`]+)`/)![1], hash = ws.match(/"worksheet": "([^"]+)"/)![1];
    writeFileSync(out, JSON.stringify({ worksheet: hash, answers: { "02-hub-api:f1.op1": 1 } }));
    const b = run(); const j2 = await judgeMissing(b.res.files, "agent", root);
    expect(j2.undecided).toEqual(["02-hub-api:f1.op2"]);
    expect(b.r.findings.map((x: any) => x.text)).toEqual([expect.stringMatching(/^POST \/api\/v1\/items — the component exposes it \(judged 1\.00 by agent\)/)]);
    expect(b.r.undecided.map((x: any) => x.key)).toEqual(["POST /ledger/entries"]);
  });
  test("an operation the source never states is operation-undocumented", () => {
    const extra = GOOD.replace("components:", `  /graphql:\n    post:\n      operationId: gql\n      responses:\n        '200': { description: ok }\ncomponents:`);
    const r = checkFile(w("inv/openapi.yaml", extra), { ...off, source: w("inv/src.md", SOURCE) });
    expect(r.findings.map((x: any) => x.text)).toEqual([expect.stringMatching(/^POST \/graphql/)]);
  });
  test("a kit finds the cut-sheet payload by the asset directory's slug", () => {
    w("proj/ARCHITECTURE.md", "# P\n");
    w("proj/.cache/sa-skills/handoff-payloads/hub-api.md", SOURCE);
    const f = w("proj/handoffs/assets/02-hub-api/openapi.yaml", GOOD);
    const r = checkFile(f, off);
    expect(r.fidelity.source).toMatch(/handoff-payloads\/hub-api\.md$/);
    expect(checkFile(w("nosrc/x/openapi.yaml", GOOD), off).fidelity.skipped).toMatch(/no source/);
  });
  test("a payload cut for another architecture version is not the asset's source", () => {
    w("stale/ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.4.0 -->\n# P\n");
    w("stale/.cache/sa-skills/handoff-payloads/hub-api.md", `---\narchitecture_version: 1.0.0\n---\n${SOURCE}`);
    const f = w("stale/handoffs/assets/02-hub-api/openapi.yaml", GOOD);
    expect(checkFile(f, off).fidelity.source).toBeNull();
    w("stale/.cache/sa-skills/handoff-payloads/hub-api.md", `---\narchitecture_version: 1.4.0\n---\n${SOURCE}`);
    expect(checkFile(f, off).fidelity.source).toMatch(/handoff-payloads\/hub-api\.md$/);
  });
});

const ASYNC = `asyncapi: "3.0.0"
info:
  title: "Ledger Events"
  version: "1.0.0"
servers:
  kafka:
    host: "broker.example:9092"
    protocol: kafka
channels:
  ledgerPosted:
    address: "ledger.entries.posted.{env}"
    parameters:
      env: {}
    messages:
      Posted:
        $ref: '#/components/messages/Posted'
operations:
  publishPosted:
    action: send
    channel:
      $ref: '#/channels/ledgerPosted'
components:
  messages:
    Posted:
      payload:
        type: object
`;
const ASYNC_SRC = `# Ledger\n\n## Events\n\n| Topic | Role |\n|---|---|\n| \`ledger.entries.posted.<env>\` | producer |\n`;

describe("asyncapi", () => {
  test("a valid 3.0 file passes, and its channel address is held to the source ({param} is a wildcard)", () => {
    const r = checkFile(w("async/asyncapi.yaml", ASYNC), { source: w("async/src.md", ASYNC_SRC) });
    expect(r.kind).toBe("asyncapi"); expect(r.findings).toEqual([]);
    expect(r.fidelity.summary).toBe("1 channel address(es) checked");
  });
  test("a channel the source never names is channel-undocumented", () => {
    const r = checkFile(w("async2/asyncapi.yaml", ASYNC.replace("ledger.entries.posted", "ledger.audit")), { source: w("async2/src.md", ASYNC_SRC) });
    expect(rules(r)).toContain("channel-undocumented");
  });
  test("action must be send / receive; channel a $ref; channels: with only comments is null", () => {
    expect(rules(checkFile(w("async3/asyncapi.yaml", ASYNC.replace("action: send", "action: publish")), off))).toContain("operation");
    const empty = `asyncapi: "3.0.0"\ninfo: { title: x, version: "1" }\nchannels:\n  # TODO: [NOT DOCUMENTED]\n`;
    expect(rules(checkFile(w("async4/asyncapi.yaml", empty), off))).toContain("map");
  });
  test("a binding left as comments is null and blocks", () => {
    const r = checkFile(w("async5/asyncapi.yaml", ASYNC.replace("    parameters:", "    bindings:\n      amqp:\n    parameters:")), off);
    expect(r.findings.map((x: any) => x.text).join(" ")).toMatch(/bindings\.amqp.* is null/);
  });
  test("an AsyncAPI 2.x security requirement in a 3.0 file is a Redocly struct error", () => {
    const r = checkFile(w("async6/asyncapi.yaml", ASYNC.replace("    protocol: kafka\n", "    protocol: kafka\n    security:\n      - saslSsl: []\n")), off);
    expect(rules(r)).toContain("redocly/struct");
  });
  test("2.x warns; anything else blocks", () => {
    expect(checkFile(w("async7/asyncapi.yaml", ASYNC.replace('"3.0.0"', '"4.0.0"')), off).findings.map((x: any) => x.rule)).toContain("version");
  });
});

const SDL = `schema {
  query: Query
  mutation: Mutation
}

type Query {
  movements(accountId: ID!): [Movement!]!
}

type Mutation {
  enrolOffline(customerId: ID!): Enrolment!
}

type Movement {
  id: ID!
  amount: Float!
}

type Enrolment {
  id: ID!
  enabled: Boolean!
}
`;
const SDL_SRC = `# Movements\n\n## API\n\n| Operation | Kind |\n|---|---|\n| \`movements\` | query |\n| \`enrolOffline\` | mutation |\n`;

describe("graphql", () => {
  test("a valid schema passes, and every root field is held to the source", () => {
    const r = checkFile(w("gql/schema.graphql", SDL), { source: w("gql/src.md", SDL_SRC), baseline: false });
    expect(r.kind).toBe("graphql"); expect(r.findings).toEqual([]);
    expect(r.graphql).toMatch(/^graphql-js 16\./); expect(r.fidelity.summary).toBe("2 root field(s) checked");
  });
  test("an operation the source never names is operation-undocumented", () => {
    const r = checkFile(w("gql2/schema.graphql", SDL.replace("enrolOffline", "deleteAccount")), { source: w("gql2/src.md", SDL_SRC), baseline: false });
    expect(r.findings.map((x: any) => x.text)).toEqual([expect.stringMatching(/^mutation `deleteAccount`/)]);
  });
  test("a syntax error names its line; a placeholder is called a placeholder", () => {
    const r = checkFile(w("gql3/schema.graphql", SDL.replace("amount: Float!", "amount Float!")), { baseline: false });
    expect(r.findings[0]).toMatchObject({ rule: "graphql-syntax", line: 16 });
    expect(rules(checkFile(w("gql4/schema.graphql", SDL.replace("type Enrolment", "type [ENTITY_NAME]")), { baseline: false }))).toEqual(["placeholder"]);
  });
  test("schema validation: a Mutation without a Query root, an object type with no fields", () => {
    const noQuery = "schema { mutation: Mutation }\ntype Mutation { ping: Boolean }\n";
    expect(rules(checkFile(w("gql5/schema.graphql", noQuery), { baseline: false }))).toContain("graphql-schema");
    expect(rules(checkFile(w("gql6/schema.graphql", SDL + "\ntype Empty\n"), { baseline: false }))).toContain("graphql-schema");
  });
  test("comments only is a warning, not a failure — the file carries the gap list", () => {
    const r = checkFile(w("gql7/schema.graphql", "# TODO: [NOT DOCUMENTED — name the operation]\n# type Query {\n#   x: Int\n# }\n"), { baseline: false });
    expect(r.findings).toEqual([]); expect(r.warnings.map((x: any) => x.rule)).toEqual(["no-operations"]);
  });
  test("breaking and dangerous changes against --baseline are warnings", () => {
    const old = w("gql8/old.graphql", SDL);
    const next = SDL.replace("  amount: Float!\n", "").replace("movements(accountId: ID!)", "movements(accountId: ID!, from: String!)");
    const r = checkFile(w("gql8/schema.graphql", next), { baseline: old });
    expect(r.findings).toEqual([]);
    const ws = r.warnings.filter((x: any) => x.rule === "breaking-change").map((x: any) => x.text);
    expect(ws).toEqual(expect.arrayContaining([expect.stringMatching(/^FIELD_REMOVED: Movement\.amount/), expect.stringMatching(/^REQUIRED_ARG_ADDED/)]));
    expect(r.baseline).toMatch(/2 breaking/);   // Float, no longer referenced, is a built-in scalar — not a contract change
  });
  test("without --baseline, the previous version is the file at git HEAD", () => {
    const dir = join(TMP, "gqlgit"); mkdirSync(join(dir, "assets/01-x"), { recursive: true });
    const f = join(dir, "assets/01-x/schema.graphql"); writeFileSync(f, SDL);
    const git = (...a: string[]) => Bun.spawnSync(["git", "-C", dir, ...a], { stdout: "pipe", stderr: "pipe" });
    git("init", "-q"); git("add", "."); git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "kit");
    writeFileSync(f, SDL.replace("  enabled: Boolean!\n", ""));
    const r = checkFile(f, {});
    expect(r.baseline).toMatch(/^git HEAD:assets\/01-x\/schema\.graphql — 1 breaking/);
  });
  test("graphql-js not installed: the file fails with the install command", () => {
    const r = checkFile(w("gql9/schema.graphql", SDL), { graphql: null });
    expect(r.graphql).toBe("NOT INSTALLED"); expect(r.findings[0].text).toMatch(/bun install/);
  });
});

const AVSC = JSON.stringify({ type: "record", name: "JobExecutionEvent", namespace: "com.example.events", doc: "A job ran", fields: [
  { name: "eventId", type: "string" },
  { name: "executionStartTime", type: ["null", { type: "long", logicalType: "timestamp-millis" }], default: null },
  { name: "amount", type: { type: "bytes", logicalType: "decimal", precision: 12, scale: 2 } },
] }, null, 2);
const AVSC_SRC = "# Scheduler\n\n**Event Schema Fields**: eventId, executionStartTime, amount\n";

describe("avro", () => {
  test("a valid record passes; every field is held to the source (any case, with or without separators)", () => {
    const r = checkFile(w("avro/JobExecutionEvent.avsc", AVSC), { source: w("avro/src.md", AVSC_SRC.replace("executionStartTime", "execution_start_time")) });
    expect(r.kind).toBe("avro"); expect(r.findings).toEqual([]); expect(r.warnings).toEqual([]);
    expect(r.engine).toBe("avsc"); expect(r.fidelity.summary).toMatch(/^3 field\(s\) checked/);
  });
  test("a // comment is named as the reason the file is not JSON", () => {
    const r = checkFile(w("avro2/X.avsc", "// header\n" + AVSC), {});
    expect(r.findings[0].rule).toBe("json-parse"); expect(r.findings[0].text).toMatch(/`\/\/` comments make it unreadable/);
  });
  test("a field the docs never name is field-undocumented — a restructured message is caught", () => {
    const nested = AVSC.replace('"executionStartTime"', '"executionResult"');
    const r = checkFile(w("avro3/JobExecutionEvent.avsc", nested), { source: w("avro3/src.md", AVSC_SRC) });
    expect(r.findings.map((x: any) => x.rule)).toEqual(["field-undocumented"]);
  });
  test("avsc's own rules: a union default must match its first branch, names must be valid", () => {
    const bad = AVSC.replace('"default": null', '"default": 5');
    expect(rules(checkFile(w("avro4/JobExecutionEvent.avsc", bad), {}))).toContain("avro-schema");
    expect(rules(checkFile(w("avro5/JobExecutionEvent.avsc", AVSC.replace('"eventId"', '"event-id"')), {}))).toContain("avro-schema");
  });
  test("what avsc lets through: decimal without precision blocks, an unknown logical type warns", () => {
    const r = checkFile(w("avro6/JobExecutionEvent.avsc", AVSC.replace('"precision": 12,', "").replace('"timestamp-millis"', '"timestamp-nanos"')), {});
    expect(rules(r)).toContain("avro-decimal"); expect(r.warnings.map((x: any) => x.rule)).toContain("logical-type");
  });
  test("one record per file, named after it; a placeholder in a value blocks", () => {
    expect(rules(checkFile(w("avro7/All.avsc", `[${AVSC}]`), {}))).toEqual(["one-record-per-file"]);
    expect(checkFile(w("avro8/schema.avsc", AVSC), {}).warnings.map((x: any) => x.rule)).toContain("file-name");
    expect(rules(checkFile(w("avro9/JobExecutionEvent.avsc", AVSC.replace("A job ran", "[MESSAGE_DESCRIPTION]")), {}))).toContain("placeholder");
  });
  test("avsc not installed: the file fails with the install command", () => {
    const r = checkFile(w("avro10/JobExecutionEvent.avsc", AVSC), { avsc: null });
    expect(r.engine).toBe("NOT INSTALLED"); expect(r.findings[0].text).toMatch(/bun install/);
  });
});

const DDL_PG = `-- Engine: PostgreSQL 16
CREATE TABLE job_current_state (
    job_id      UUID         NOT NULL,
    work_type   VARCHAR(64)  NOT NULL,
    payload     JSONB,
    PRIMARY KEY (job_id)
);
CREATE TABLE job_execution_dlq (
    job_id      UUID REFERENCES job_current_state (job_id),
    error_code  VARCHAR(32)
);
CREATE INDEX idx_state_type ON job_current_state (work_type);
`;
const DDL_SRC = "# Store\n\nTables: JOB_CURRENT_STATE (job_id, work_type, payload), JOB_EXECUTION_DLQ (job_id, error_code).\n";

describe("ddl", () => {
  test("PostgreSQL DDL is parsed by PostgreSQL's own grammar; every table and column is held to the docs", () => {
    const r = checkFile(w("ddl/assets/01-store/ddl.sql", DDL_PG), { source: w("ddl/src.md", DDL_SRC) });
    expect(r.kind).toBe("ddl"); expect(r.findings).toEqual([]); expect(r.warnings).toEqual([]);
    expect(r.engine).toMatch(/^libpg-query /); expect(r.fidelity.summary).toMatch(/^2 table\(s\), 5 column\(s\)/);
  });
  test("a syntax error names its line", () => {
    const r = checkFile(w("ddl2/ddl.sql", DDL_PG.replace("work_type   VARCHAR(64)  NOT NULL,", "work_type   VARCHAR(64)  NOT NULL")), { source: w("ddl2/src.md", DDL_SRC) });
    expect(r.findings[0]).toMatchObject({ rule: "sql-syntax", line: 5 });
  });
  test("an invented partition and audit column are table- and column-undocumented", () => {
    const inv = DDL_PG.replace("    error_code  VARCHAR(32)\n", "    error_code  VARCHAR(32),\n    resolved_by VARCHAR(64)\n") + "CREATE TABLE job_state_2026_10 PARTITION OF job_current_state FOR VALUES IN ('x');\n";
    const r = checkFile(w("ddl3/ddl.sql", inv), { source: w("ddl3/src.md", DDL_SRC) });
    expect(r.findings.map((x: any) => x.rule).sort()).toEqual(["column-undocumented", "table-undocumented"]);
    expect(r.findings.find((x: any) => x.rule === "table-undocumented").text).toMatch(/\(a partition\)/);
  });
  test("a duplicate column blocks; a foreign key to a table the file does not create warns", () => {
    const d = DDL_PG.replace("    payload     JSONB,", "    payload     JSONB,\n    work_type   TEXT,").replace("REFERENCES job_current_state (job_id)", "REFERENCES ledger_entry (id)");
    const r = checkFile(w("ddl4/ddl.sql", d), { source: w("ddl4/src.md", DDL_SRC + " ledger_entry") });
    expect(rules(r)).toContain("duplicate-column"); expect(r.warnings.map((x: any) => x.rule)).toContain("fk-target");
  });
  test("SQL Server and MySQL are parsed in their own dialects by node-sql-parser", () => {
    const ms = "CREATE TABLE orders (id BIGINT IDENTITY(1,1) PRIMARY KEY, placed_at DATETIMEOFFSET NOT NULL);";
    const r = checkFile(w("ddl5/ddl.sql", ms), { engine: "transactsql", source: w("ddl5/src.md", "orders: id, placed_at") });
    expect(r.findings).toEqual([]); expect(r.engine).toBe("node-sql-parser (transactsql)");
    const bad = checkFile(w("ddl6/ddl.sql", "CREATE TABLE orders (id BIGINT NOT NULL AUTO_INCREMENT total DECIMAL(12,2));"), { engine: "mysql", source: w("ddl6/src.md", "orders: id, total") });
    expect(rules(bad)).toEqual(["sql-syntax"]);
  });
  test("Oracle: no JavaScript grammar — structure and fidelity only, and the receipt says so", () => {
    const r = checkFile(w("ddl7/ddl.sql", "-- Engine: Oracle 19c\nCREATE TABLE orders (\n  id NUMBER(19) NOT NULL,\n  invented_col VARCHAR2(10),\n  CONSTRAINT pk_orders PRIMARY KEY (id)\n);\n"), { source: w("ddl7/src.md", "orders: id") });
    expect(r.sql_engine).toBe("oracle"); expect(r.engine).toBe("grammar not checked for oracle");
    expect(r.warnings.map((x: any) => x.rule)).toContain("grammar");
    expect(r.findings.map((x: any) => x.text)).toEqual([expect.stringMatching(/^`orders\.invented_col`/)]);
  });
  test("no engine named: a warning, never a guess", () => {
    const r = checkFile(w("ddl8/ddl.sql", DDL_PG.replace("-- Engine: PostgreSQL 16\n", "")), { source: w("ddl8/src.md", DDL_SRC) });
    expect(r.warnings.map((x: any) => x.rule)).toContain("engine"); expect(r.findings).toEqual([]);
  });
  test("the parser not installed: the file fails with the install command", () => {
    const r = checkFile(w("ddl9/ddl.sql", DDL_PG), { source: w("ddl9/src.md", DDL_SRC), ddlParse: () => ({ absent: "libpg-query" }) });
    expect(r.engine).toBe("NOT INSTALLED"); expect(r.findings[0].text).toMatch(/bun install/);
  });
  test("comments only is a warning on every engine — node-sql-parser rejected an empty SQL Server script (8.133.1)", () => {
    const only = "-- Engine: SQL Server\n-- Component: 5.3 — Order Ledger\n\n-- TODO: [NOT DOCUMENTED — tables: add to the component file]\n";
    for (const [dir, engine] of [["ddl10", "transactsql"], ["ddl11", "postgresql"], ["ddl12", "mysql"]]) {
      const r = checkFile(w(`${dir}/ddl.sql`, only), { engine, source: w(`${dir}/src.md`, "Order Ledger: no tables documented") });
      expect(r.findings).toEqual([]); expect(r.warnings.map((x: any) => x.rule)).toEqual(["no-tables"]);
    }
    const ms = checkFile(w("ddl13/ddl.sql", "-- Engine: SQL Server\nCREATE TABLE orders (id BIGINT NOT NULL AUTO_INCREMENT total DECIMAL(12,2));"), { engine: "transactsql", source: w("ddl13/src.md", "orders: id, total") });
    expect(rules(ms)).toEqual(["sql-syntax"]);   // a statement is still parsed and its syntax still blocks
  });
});

const PROTO = `syntax = "proto3";

package jobs.v1;

// A job became due
message JobExecutionEvent {
  string job_id = 1;
  string work_type = 2;
  Status status = 3;
}

enum Status {
  STATUS_UNSPECIFIED = 0;
  STATUS_DONE = 1;
}

service JobScheduler {
  rpc SubmitJob (SubmitJobRequest) returns (SubmitJobResponse);
}

message SubmitJobRequest {
  string work_type = 1;
}

message SubmitJobResponse {
  string job_id = 1;
}
`;
const PROTO_SRC = "# Scheduler\n\nThe JobScheduler service exposes SubmitJob (workType) and returns jobId. It publishes JobExecutionEvent (jobId, workType, status).\n";

describe("protobuf", () => {
  test("a gRPC service and its messages pass; rpc wrappers need not be named in the docs", () => {
    const r = checkFile(w("pb/schema.proto", PROTO), { source: w("pb/src.md", PROTO_SRC), baseline: false });
    expect(r.kind).toBe("protobuf"); expect(r.findings).toEqual([]); expect(r.warnings).toEqual([]);
    expect(r.engine).toMatch(/^protobufjs /); expect(r.fidelity.summary).toMatch(/^3 message\(s\), 5 field\(s\), 1 rpc\(s\)/);
  });
  test("protobufjs: a syntax error names its line; an rpc on a missing message is refused", () => {
    expect(checkFile(w("pb2/schema.proto", PROTO.replace("string work_type = 2;", "string work_type = 2")), { baseline: false }).findings[0]).toMatchObject({ rule: "proto-syntax", line: 9 });   // the missing `;` of line 8 is reported at the next token, as protoc does
    expect(rules(checkFile(w("pb3/schema.proto", PROTO.replace("returns (SubmitJobResponse)", "returns (Missing)")), { baseline: false }))).toEqual(["proto-syntax"]);
  });
  test("what protobufjs lets through: an enum not starting at 0, field number 0 or 19000–19999, no package", () => {
    const bad = PROTO.replace("STATUS_UNSPECIFIED = 0;\n  STATUS_DONE = 1;", "STATUS_DONE = 1;").replace("string work_type = 2;", "string work_type = 19001;").replace("package jobs.v1;\n", "");
    expect(rules(checkFile(w("pb4/schema.proto", bad), { baseline: false })).sort()).toEqual(["enum-zero", "field-number", "package"]);
  });
  test("an rpc, a message or a field the docs never name is name-undocumented", () => {
    const inv = PROTO.replace("rpc SubmitJob (SubmitJobRequest) returns (SubmitJobResponse);", "rpc SubmitJob (SubmitJobRequest) returns (SubmitJobResponse);\n  rpc PurgeAll (SubmitJobRequest) returns (SubmitJobResponse);").replace("string work_type = 1;\n}", "string work_type = 1;\n  string tenant_id = 2;\n}");
    const r = checkFile(w("pb5/schema.proto", inv), { source: w("pb5/src.md", PROTO_SRC), baseline: false });
    expect(r.findings.map((x: any) => x.text).sort()).toEqual([expect.stringMatching(/^field `jobs\.v1\.SubmitJobRequest\.tenant_id`/), expect.stringMatching(/^rpc `JobScheduler\.PurgeAll`/)]);
  });
  test("field numbers are the wire contract: renumbering or reusing a removed number is a breaking change", () => {
    const old = w("pb6/old.proto", PROTO);
    const next = PROTO.replace("string job_id = 1;\n  string work_type = 2;", "string work_type = 1;\n  string job_id = 2;").replace("  Status status = 3;\n", "  string note = 3;\n");
    const r = checkFile(w("pb6/schema.proto", next), { baseline: old });
    const ws = r.warnings.filter((x: any) => x.rule === "breaking-change").map((x: any) => x.text);
    expect(ws).toEqual(expect.arrayContaining([expect.stringMatching(/job_id: field number 1 → 2/), expect.stringMatching(/number 3 of removed `status` reused by `note`/)]));
    expect(r.findings).toEqual([]);   // a warning: the architect decides
  });
  test("protobufjs not installed: the file fails with the install command", () => {
    const r = checkFile(w("pb7/schema.proto", PROTO), { protobufjs: null, baseline: false });
    expect(r.engine).toBe("NOT INSTALLED"); expect(r.findings[0].text).toMatch(/bun install/);
  });
});

const REDIS = `# Redis Key Schema — Redis Cache

## Keys

| Key pattern | Structure | TTL | Holds | Written by |
|---|---|---|---|---|
| \`job:lock:{jobId}\` | STRING | 30s | scheduler lock | Job Scheduler Service |
| \`idempotency:{eventId}\` | STRING | 7d | processed event marker | Reminder Worker |

## Settings

| Setting | Value |
|---|---|
| Engine | Azure Cache for Redis |
| Eviction policy | volatile-lru |
| Persistence | [NOT DOCUMENTED — add to docs/components/redis.md] |
| maxmemory | 10GB |

## On Redis failure

| Key pattern | On Redis failure |
|---|---|
| \`job:lock:{jobId}\` | fail-closed: the job is skipped [ADR-005] |
| \`idempotency:{eventId}\` | fail-open: the event is processed again |
`;
const REDIS_SRC = "# Redis\n\n- Locks: `job:lock:{jobId}` with 30-second TTL, written by the Job Scheduler Service.\n- Idempotency cache (7-day TTL) used by the Reminder Worker.\n- Memory: 10 GB.\n";

describe("redis key schema", () => {
  test("the three fixed tables pass; quantities match in any unit (30s = 30-second, 7d = 7-day, 10GB = 10 GB); a bracketed ADR is a citation", () => {
    const r = checkFile(w("rd-a/redis-key-schema.md", REDIS), { source: w("rd-a/src.md", REDIS_SRC) });
    expect(r.kind).toBe("redis"); expect(r.findings).toEqual([]); expect(r.fidelity.summary).toMatch(/^2 key pattern\(s\)/);
  });
  test("an invented key prefix, TTL or size is undocumented", () => {
    const inv = REDIS.replace("idempotency:{eventId}` | STRING | 7d", "history:customer:{id}:page:{n}` | STRING | 60s").replace("| maxmemory | 10GB |", "| maxmemory | 3GB |");
    const r = checkFile(w("rd-b/redis-key-schema.md", inv), { source: w("rd-b/src.md", REDIS_SRC) });
    expect(r.findings.map((x: any) => x.rule).sort()).toEqual(["key-undocumented", "value-undocumented", "value-undocumented"]);
  });
  test("closed vocabularies: structure, eviction policy, fail-open / fail-closed, TTL form", () => {
    const bad = REDIS.replace("| STRING | 30s |", "| STRINGS | 30 seconds-ish |").replace("volatile-lru", "lru").replace("fail-closed: the job", "the job");
    expect(rules(checkFile(w("rd-c/redis-key-schema.md", bad), { source: w("rd-c/src.md", REDIS_SRC) })).sort()).toEqual(["eviction-policy", "failure", "structure", "ttl"]);
  });
  test("exact headers, the four settings, and nothing else under H2", () => {
    const extra = REDIS.replace("| Key pattern | Structure | TTL | Holds | Written by |", "| Key | Structure | TTL | Holds | Written by |").replace("| maxmemory | 10GB |", "| maxmemory | 10GB |\n| Pool size | 50 |") + "\n## Example keys\n\n- job:lock:123\n";
    expect(rules(checkFile(w("rd-d/redis-key-schema.md", extra), { source: w("rd-d/src.md", REDIS_SRC) })).sort()).toEqual(["section", "setting", "table-header"]);
  });
});

describe("redocly (a dependency, in-process)", () => {
  test("3.0's `nullable` in a 3.1 file is a spec error and blocks; a missing auth only warns", () => {
    const f = w("rd/openapi.yaml", GOOD.replace("      type: object\n", "      type: object\n      properties:\n        name:\n          type: string\n          nullable: true\n"));
    const r = checkFile(f, off);
    expect(r.redocly).toMatch(/^redocly \S* ?\(recommended\)$/);
    expect(rules(r)).toContain("redocly/struct");
    expect(r.warnings.map((x: any) => x.rule)).toContain("redocly/security-defined");
    expect(r.findings.some((x: any) => x.rule === "redocly/security-defined")).toBe(false);
  });
  test("the project's redocly.yaml wins over recommended", () => {
    w("rd3/proj/ARCHITECTURE.md", "# P\n"); w("rd3/proj/redocly.yaml", "extends:\n  - minimal\n");
    expect(checkFile(w("rd3/proj/handoffs/assets/01-x/openapi.yaml", GOOD), off).redocly).toMatch(/rd3\/proj\/redocly\.yaml\)$/);
  });
  test("not installed: the file fails with the install command", () => {
    const r = checkFile(w("rd4/openapi.yaml", GOOD), { redoclyLint: () => ({ absent: true }) });
    expect(r.redocly).toBe("NOT INSTALLED"); expect(rules(r)).toContain("redocly");
    expect(r.findings.find((x: any) => x.rule === "redocly").text).toMatch(/bun install/);
  });
  test("--probe says whether the package loads", () => {
    const b = Bun.spawnSync(["bun", join(__dirname, "..", "scripts", "contract-check.js"), "--probe"], { stdout: "pipe" });
    expect(b.exitCode).toBe(0); expect(b.stdout.toString()).toMatch(/installed/);
  });
  test("only spec-conformance rules block", () => {
    expect(["struct", "no-unresolved-refs", "path-parameters-defined", "operation-operationId-unique", "spec-components-invalid-map-name"].every(REDOCLY_BLOCKING)).toBe(true);
    expect(["security-defined", "no-empty-servers", "operation-4xx-response", "info-license", "no-unused-components"].some(REDOCLY_BLOCKING)).toBe(false);
  });
});

test("check() walks a directory for openapi.yaml and asyncapi.yaml and fails on any blocking finding", () => {
  w("walk/assets/01-a/openapi.yaml", GOOD); w("walk/assets/02-b/openapi.yaml", "openapi: ["); w("walk/assets/03-c/asyncapi.yaml", ASYNC); w("walk/assets/04-d/schema.graphql", SDL);
  const r = check([join(TMP, "walk")], { baseline: false });
  expect(r.files.length).toBe(4); expect(r.status).toBe("FAIL");
});
