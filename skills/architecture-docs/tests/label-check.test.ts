/**
 * label-check.js — the Connection Label Check as code: the registries read from the bundled standard's
 * machine registry (rules-registry.json), the
 * expression the guide prints held to them, label extraction from every edge form, the verdict on each
 * failure kind, the fallback when the folder is absent, the CLI's exit codes.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { registries, labelsOf, judge, check, DEFAULT_DL } = require("../scripts/label-check.js");
const GOV = !!require("../../../scripts/shared/packs.js").designLanguageDir();   // a design language in force (an institution pack's): the governed tests run only then
const SCRIPT = join(__dirname, "..", "scripts", "label-check.js");
const GUIDE = join(__dirname, "..", "references", "DIAGRAM-GENERATION-GUIDE.md");

const TMP = join(__dirname, ".temp-label-check");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };

const DOC = `# Layers

#### Diagram: C4 Level 2 — Container View

\`\`\`mermaid
%%{
  init: { 'theme': 'base' }
}%%
flowchart TB
  A["Web App"] -->|"HTTPS/JSON [Query]"| B["API"]
  B -->|"JDBC/SQL [Query] · schema orders (orders, order_items)"| C[("DB")]
  B -- "TLS/AVRO [Event] · publish" --> D(["Topic"])
  D -. "TLS/AVRO [Event] · group payments" .-> E["Consumer"]
  A -->|"TCP [Data] · único escritor"| F
  A -->|"REST/JSON [Query]"| G
  A -->|"HTTPS/XML [Data]"| H
  A -->|"HTTPS/JSON [Sync]"| I
  A -->|"HTTPS/JSON [Query] · schema a · schema b"| J
  A -->|"consulta"| K
\`\`\`

#### Diagram: C4 Level 1 — System Context

\`\`\`mermaid
C4Context
  Rel(a, b, "Uses", "HTTPS/JSON [Command]")
  Rel_D(b, c, "Reads", "gRPC/PROTOBUF [Internal]")
  Rel(c, d, "Two args only")
\`\`\`

\`\`\`mermaid
sequenceDiagram
  A->>B: 1. Consulta el historial [HTTPS/JSON]
\`\`\`

\`\`\`mermaid
%% Analysis exhibit
flowchart TB
  A -->|"whatever"| B
\`\`\`
`;

beforeAll(() => { rmSync(TMP, { recursive: true, force: true }); w("docs/03-architecture-layers.md", DOC); mkdirSync(join(TMP, "empty-dl"), { recursive: true }); w("partial-dl/llms-rules.txt", "# rules\n"); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("label-check", () => {
  test.if(GOV)("the registries come from the bundled rules-registry.json: the fifteen Action Types, the token lists, the forms, the qualifiers, the stamp", () => {
    const reg = registries(DEFAULT_DL);
    expect(reg.source).toMatch(/rules-registry\.json$/);
    expect(reg.actions).toEqual(["Data", "Query", "Event", "Internal", "Cache", "Command", "Stream", "File", "Batch", "Auth", "Notification", "Replication", "Telemetry", "Transaction", "Config"]);
    expect(reg.protocols).toEqual(expect.arrayContaining(["HTTPS", "gRPC", "TLS", "JDBC", "TCP", "AMQP", "WSS", "SFTP", "GraphQL", "PGWIRE"]));
    expect(reg.styles).toEqual(expect.arrayContaining(["JSON", "PROTOBUF", "AVRO", "SQL", "RESP", "BSON", "CSVC", "ESM", "ISO20022", "ISO8583"]));
    // the tokens §5.4 only illustrates, and the check id a prose reader once took for a STYLE, are not registered
    for (const t of ["KAFKA", "HTTP", "LDAPS", "SMTP"]) expect(reg.protocols).not.toContain(t);
    for (const t of ["CSV", "BINARY", "OAuth", "SAML", "LDAP", "MIME", "OTLP", "HTML", "C-11"]) expect(reg.styles).not.toContain(t);
    expect(reg.illustrative).toEqual(expect.arrayContaining(["KAFKA", "HTML"]));
    expect(reg.dataScope.map((f: string) => f.split(/[ <]/)[0])).toEqual(["schema", "keyspace", "collection", "bucket/", "index", "group"]);
    expect(reg.composition).toEqual(["loads", "publish", "served from"]);
    expect(reg.stamp).toMatch(/^v\d+\.\d+.*\d{4}-\d{2}-\d{2}$/);
  });

  test.if(GOV)("the bundle is one drop: the registry carries the stamp of every llms file in both editions", () => {
    const { stampOf } = require("../../../scripts/sync-design-language.ts");
    const stamp = stampOf(readFileSync(join(DEFAULT_DL, "llms.txt"), "utf-8"));
    expect(registries(DEFAULT_DL).stamp.replace(", built ", ", ")).toBe(stamp);
    for (const f of ["llms-rules.txt", "llms-mermaid.txt", "llms-full.txt", "llms-HOWTO.md"].flatMap((x) => [x, `es/${x}`]).concat("es/llms.txt"))
      expect([f, stampOf(readFileSync(join(DEFAULT_DL, f), "utf-8"))]).toEqual([f, stamp]);
  });

  test("a folder with llms-rules.txt and no registry is a partial drop and an error, never fallback mode", () => {
    expect(() => registries(join(TMP, "partial-dl"))).toThrow(/no rules-registry\.json.*sync-design-language/);
  });

  test.if(GOV)("the expression the guide prints is the one the registries yield (token sets, forms, qualifiers)", () => {
    const reg = registries(DEFAULT_DL);
    const printed = (readFileSync(GUIDE, "utf-8").match(/^\^\(HTTPS[^\n]*\$$/m) || [""])[0];
    expect(printed).not.toBe("");
    const groups = (e: string) => { const m = e.match(/^\^\(([^)]*)\)\(\/\(([^)]*)\)\)\? \\\[\(([^)]*)\)\\\]((?:\( · Via \[\^·\]\+\)\?)?)\( · \((.*?)\)\)\?\( · \(([^)]*)\)\)\?\$$/); return m ? [m[1], m[2], m[3], m[4], m[5], m[6]].map((g) => g.split("|").sort()) : null; };
    expect(groups(printed)).toEqual(groups(reg.expression));
  });

  test("labels are extracted from pipe text, dashed and dotted quoted edges and Rel() 4th parameters; sequence and exhibit blocks are skipped; the multi-line directive is not the first line", () => {
    const blocks = labelsOf(DOC);
    expect(blocks.map((b: any) => [b.diagram, b.kind, b.skipped, b.labels.length])).toEqual([
      ["C4 Level 2 — Container View", "flowchart", null, 10],
      ["C4 Level 1 — System Context", "C4Context", null, 2],
      ["C4 Level 1 — System Context", "sequenceDiagram", "sequenceDiagram (§12 regime)", 0],
      ["C4 Level 1 — System Context", "flowchart", "analysis exhibit", 0],
    ]);
    expect(blocks[0].labels.slice(0, 4).map((x: any) => x.label)).toEqual(["HTTPS/JSON [Query]", "JDBC/SQL [Query] · schema orders (orders, order_items)", "TLS/AVRO [Event] · publish", "TLS/AVRO [Event] · group payments"]);
    expect(blocks[1].labels.map((x: any) => x.label)).toEqual(["HTTPS/JSON [Command]", "gRPC/PROTOBUF [Internal]"]);
  });

  test.if(GOV)("the verdict names the unregistered slot", () => {
    const reg = registries(DEFAULT_DL);
    expect(judge("HTTPS/JSON [Query]", reg)).toBeNull();
    expect(judge("TCP [Query]", reg)).toBeNull();
    expect(judge("HTTPS [Data] · served from", reg)).toBeNull();
    expect(judge("PGWIRE/SQL [Query] · schema orders (orders)", reg)).toBeNull();
    expect(judge("GraphQL/JSON [Command]", reg)).toBeNull();
    // RC5 (§5.9): a gateway, proxy, load balancer or broker is the connection's `Via` — at most one, right after the protocol form
    expect(judge("HTTPS/JSON [Query] · Via apim / accounts-proxy", reg)).toBeNull();
    expect(judge("TLS/AVRO [Event] · Via ledger-broker · group ledger-consumers", reg)).toBeNull();
    expect(judge("HTTPS/JSON [Query] · Via apim · schema orders (orders) · served from", reg)).toBeNull();
    expect(judge("HTTPS/JSON [Query] · Via apim · Via waf", reg)).toMatch(/more than one `· Via`/);
    expect(judge("HTTPS/JSON [Query] · schema orders · Via apim", reg)).toMatch(/comes right after the protocol form/);
    expect(judge("HTTPS/JSON [Query] · through apim", reg)).toMatch(/neither a `Via <name>`/);
    expect(judge("HTTPS/HTML [Data] · served from", reg)).toBe("STYLE `HTML` is not registered (§5.3) — §5.4 shows it as an illustration only, it is not registered (RFC-011)");
    expect(judge("KAFKA/AVRO [Event] · publish", reg)).toMatch(/^PROTOCOL `KAFKA` is not registered .*RFC-011/);
    expect(judge("JDBC/SQL [Query] · schema orders (orders, order_items)", reg)).toBeNull();
    expect(judge("TCP/RESP [Cache] · keyspace orders:*", reg)).toBeNull();
    expect(judge("TCP [Data] · único escritor", reg)).toMatch(/^qualifier `· único escritor` is neither a `Via <name>`, a data-scope form/);
    expect(judge("REST/JSON [Query]", reg)).toBe("PROTOCOL `REST` is not registered (§5.3)");
    expect(judge("HTTPS/XML [Data]", reg)).toBe("STYLE `XML` is not registered (§5.3)");
    expect(judge("HTTPS/JSON [Sync]", reg)).toBe("Action Type `[Sync]` is not one of the fifteen registered values (§5.4)");
    expect(judge("HTTPS/JSON [Query] · schema a · schema b", reg)).toBe("more than one data-scope qualifier (§5.3: at most one)");
    expect(judge("TLS/AVRO [Event] · publish · loads", reg)).toBe("more than one composition qualifier (§5.3: at most one)");
    expect(judge("consulta", reg)).toMatch(/^not in the protocol normal form/);
  });

  test.if(GOV)("check() fails the file with one failure per bad label and passes clean ones; an absent folder skips", () => {
    const r = check([join(TMP, "docs/03-architecture-layers.md")], DEFAULT_DL);
    expect(r.status).toBe("FAIL");
    const c4l2 = r.files[0].blocks[0];
    expect([c4l2.labels, c4l2.failures.length]).toEqual([10, 6]);
    expect(c4l2.failures.map((f: any) => f.label)).toEqual(["TCP [Data] · único escritor", "REST/JSON [Query]", "HTTPS/XML [Data]", "HTTPS/JSON [Sync]", "HTTPS/JSON [Query] · schema a · schema b", "consulta"]);
    expect(r.files[0].blocks[1].failures).toEqual([]);
    expect(r.files[0].blocks[2].skipped).toBe("sequenceDiagram (§12 regime)");
    w("docs/clean.md", "```mermaid\nflowchart TB\n  A -->|\"HTTPS/JSON [Query]\"| B\n```\n");
    expect(check([join(TMP, "docs/clean.md")], DEFAULT_DL).status).toBe("PASS");
    const skipped = check([join(TMP, "docs/clean.md")], join(TMP, "empty-dl"));
    expect(skipped.status).toBe("SKIPPED");
    expect(skipped.reason).toMatch(/fallback mode/);
  });

  test.if(GOV)("the CLI exits 1 on a failure, 0 on a pass and on the skipped case, 2 on a missing file, and prints the receipt", () => {
    const bad = Bun.spawnSync(["bun", SCRIPT, join(TMP, "docs/03-architecture-layers.md")], { stdout: "pipe", stderr: "pipe" });
    expect(bad.exitCode).toBe(1);
    expect(bad.stdout.toString()).toMatch(/Connection Label Check — registries from .*rules-registry\.json \(v\d+\.\d+/);
    expect(bad.stdout.toString()).toMatch(/C4 Level 2 — Container View \(line 5\): 4\/10 labels registered\n {4}✗ line 14: "TCP \[Data\] · único escritor"/);
    expect(bad.stdout.toString()).toMatch(/not checked — sequenceDiagram/);
    expect(bad.stdout.toString()).toMatch(/\nFAIL — fix every label above/);
    const ok = Bun.spawnSync(["bun", SCRIPT, join(TMP, "docs/clean.md")], { stdout: "pipe", stderr: "pipe" });
    expect(ok.exitCode).toBe(0);
    expect(ok.stdout.toString().trim()).toMatch(/1\/1 labels registered ✓\nPASS$/);
    const skipped = Bun.spawnSync(["bun", SCRIPT, join(TMP, "docs/clean.md"), "--design-language", join(TMP, "empty-dl")], { stdout: "pipe", stderr: "pipe" });
    expect(skipped.exitCode).toBe(0);
    expect(skipped.stdout.toString()).toMatch(/^Connection Label Check: skipped — no llms-rules\.txt/);
    expect(Bun.spawnSync(["bun", SCRIPT, join(TMP, "nope.md")], { stdout: "pipe", stderr: "pipe" }).exitCode).toBe(2);
    const expr = Bun.spawnSync(["bun", SCRIPT, "--expression"], { stdout: "pipe" }).stdout.toString().trim();
    expect(expr).toBe(registries(DEFAULT_DL).expression);
  });
});
