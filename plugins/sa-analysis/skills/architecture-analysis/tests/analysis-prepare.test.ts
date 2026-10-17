/**
 * analysis-prepare.js — the payload per lens, and the three rules the first real run taught (8.51.1):
 * a system descriptor's dependency lines are the system's, never the containers its table declares
 * (attributing them fabricated two-node cycles); a docs/05 row's direction is the judge's answer, printed per
 * edge, and a row the judge has not answered gets no direction and is named (8.119.0); no
 * arithmetic over the phase budgets — the flow's own block from docs/04 is carried verbatim and the
 * agent reads the accounting there.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "..", "scripts", "analysis-prepare.js");
let dir = "";
const HDR = (self: string) => `<!-- EXPLORER_HEADER\nkey_concepts: a\ntechnologies: Kafka\ncomponents: ${self}\ncomponent_self: ${self}\nscope: s\nrelated_adrs: ADR-101\n-->`;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "analysis-prepare-"));
  const w = (rel: string, s: string) => { mkdirSync(join(dir, rel, ".."), { recursive: true }); writeFileSync(join(dir, rel), s); };
  w("ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 2.0.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: en -->\n<!-- ARCHITECTURE_TYPE: 3-Tier -->\n\n# Ledger Platform — Architecture\n");
  w("docs/components/README.md", "# Component Details\n\n### [Ledger](ledger.md)\n\n| # | Component | File | Type | Technology |\n|---|---|---|---|---|\n| 5.1 | Ledger API | [ledger/01-ledger-api.md](ledger/01-ledger-api.md) | Service | Spring Boot |\n| 5.2 | Ledger DB | [ledger/02-ledger-db.md](ledger/02-ledger-db.md) | Database | PostgreSQL |\n");
  w("docs/components/ledger.md", `# Ledger\n\n${HDR("ledger")}\n\n> The ledger system.\n\n**Type:** Internal System\n\n**Consumed by:** [Streaming](streaming.md), which reads the topics.\n`);
  w("docs/components/ledger/01-ledger-api.md", `# Ledger API\n\n${HDR("ledger-api")}\n\n> Posts entries.\n\n**Type:** Service\n**Technology:** Spring Boot\n\n**Depends on:** [Ledger DB](02-ledger-db.md) for every posting, per \`ADR-101\`.\n`);
  w("docs/components/ledger/02-ledger-db.md", `# Ledger DB\n\n${HDR("ledger-db")}\n\n> Stores entries.\n\n**Type:** Database\n**Technology:** PostgreSQL\n`);
  // a system that declares its containers only as table rows, and carries system-level dependency lines
  w("docs/components/streaming.md", `# Streaming\n\n${HDR("streaming")}\n\n> The data team's platform.\n\n**Type:** External System\n\n**Depends on:** [Ledger](ledger.md) for the source of every topic.\n**Consumed by:** [Ledger](ledger.md), which reads the digests back.\n\n## Containers\n\n| Component | Type | Technology |\n|---|---|---|\n| Topic Entries | Message Broker | Kafka |\n| Digest Job | Batch | Flink |\n`);
  w("docs/03-architecture-layers.md", `# Layers\n\n${HDR("layers")}\n\n## 4. Architecture Layers <!-- SECTION: Architecture Layers -->\n\n### 4.1 Layer Overview\n\n| Layer | Containers | Owned |\n|---|---|---|\n| **L1 — Service** | Ledger API, Ledger DB | Yes |\n| **L2 — Data** | Topic Entries, Digest Job | No |\n`);
  w("docs/04-data-flow-patterns.md", `# Flows\n\n${HDR("flows")}\n\n## 6. Data Flow Patterns <!-- SECTION: Data Flow Patterns -->\n\n### Flow Inventory <!-- SECTION: Flow Inventory -->\n\n| Flow | Trigger | Use Case | Latency Target |\n|---|---|---|---|\n| 1. Post an entry | The channel posts | UC-01 | ≤ 1 s end to end |\n\n#### Flow 1 — Post an entry\n\n**Phases**: 1, 2\n**Governed by**: ADR-101\n\nThe 1 s target breaks down as 600 ms for phase 1 and 400 ms for phase 2, which overlap the gate.\n\n### Phase Catalog <!-- SECTION: Phase Catalog -->\n\n| # | Phase | On critical path? | Owner | Failure mode |\n|---|---|---|---|---|\n| 1 | Validate | yes | Ledger API | Rejected |\n| 2 | Persist | yes | Ledger API → Ledger DB | Rolled back |\n\n#### Phase 1 — Validate\n\n**Hops**: Ledger API → Ledger DB\n**Latency budget (p95)**: ≤ 800 ms, serial, gate included.\n\n#### Phase 2 — Persist\n\n**Hops**: Ledger API → Ledger DB\n**Latency budget (p95)**: ≤ 700 ms.\n`);
  w("docs/05-integration-points.md", `# Integrations\n\n${HDR("integrations")}\n\n## 7. Integration Points <!-- SECTION: Integration Points -->\n\n### 7.1 Inventory\n\n| # | From | To | Protocol | Pattern | Boundary |\n|---|---|---|---|---|---|\n| I-01 | \`Ledger API\` | \`Ledger DB\` | JDBC | Request-response | Internal |\n| I-02 | \`Ledger DB\` | \`Digest Job\` | Debezium | Replication | External |\n| I-03 | \`Topic Entries\` | \`Ledger API\` | Kafka | Event | External |\n| I-04 | \`Ops Console\` | \`Ledger API\` | Sync Gateway admin API over HTTPS | Request-response | Internal |\n`);
  w("docs/08-scalability-and-performance.md", `# Scale\n\n${HDR("scale")}\n\n## 10. Scalability <!-- SECTION: Scalability and Performance -->\n\n| SLO | Target |\n|---|---|\n| Post | ≤ 1 s |\n`);
  w("adr/ADR-101-posting.md", "# ADR-101: Posting model\n\n**Status:** Accepted\n**Scope:** Project\n\n## Context\n\nOne ledger.\n");
});
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "SA_JUDGE" && k !== "TYPESAFE_API_KEY"));   // the default engine, agent
const run = (lens: string) => { const r = Bun.spawnSync([process.execPath, SCRIPT, dir, "--lens", lens, "--today", "2026-09-14", "--json"], { stdout: "pipe", stderr: "pipe", env: ENV }); return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() }; };
const facts = (lens: string) => JSON.parse(readFileSync(join(dir, ".cache", "sa-skills", "analysis", `${lens}.facts.json`), "utf8"));
const payload = (lens: string) => readFileSync(join(dir, ".cache", "sa-skills", "analysis", `${lens}.payload.md`), "utf8");

describe("analysis-prepare", () => {
  test("writes the payload, the documents bundle and the facts for a lens, and the run manifest", () => {
    const r = run("coupling");
    expect(r.code).toBe(0);
    const m = JSON.parse(r.out);
    expect(Object.keys(m.lenses)).toEqual(["coupling"]);
    expect(existsSync(join(dir, m.lenses.coupling.payload))).toBe(true);
    expect(existsSync(join(dir, m.lenses.coupling.docs))).toBe(true);
    const p = payload("coupling");
    expect(p).toContain("## Plan — the report's shape");
    expect(p).toContain("## Spec — the classification rules");
    expect(p).toContain('"lens": "coupling"');            // the fill skeleton in the contract
    expect(p).toContain("**Reading list**");
    expect(p).toContain("## Next: the documents parts of the reading list");
  });

  test("a system descriptor's dependency lines are the system's — its table-declared containers get no edge from them", () => {
    run("coupling");
    const f = facts("coupling");
    const fromSystemFile = f.edges.filter((e: any) => /streaming\.md$/.test(e.source));
    expect(JSON.stringify(fromSystemFile.map((e: any) => [e.from, e.to, e.via]))).toBe("[]");
    expect(f.systemDeps.map((d: any) => `${d.system} ${d.relation} ${d.other}`).sort()).toEqual(["Ledger consumed by Streaming", "Streaming consumed by Ledger", "Streaming depends on Ledger"]);   // every L1 descriptor's lines, the system's own
    // the file-backed container's own line becomes an edge (the ADR id in backticks does not)
    expect(f.edges.filter((e: any) => e.from === "Ledger API" && e.to === "Ledger DB").length).toBe(1);   // docs/05 I-01 and the descriptor line name the same edge: one edge, never two
    expect(f.edges.some((e: any) => /ADR-/.test(e.to) || /ADR-/.test(e.from))).toBe(false);
    expect(f.cycles).toEqual([]);
  });

  test("a docs/05 row the judge has not answered is undecided: no direction, out of the graph, named with the worksheet", () => {
    const r = run("coupling");
    const m = JSON.parse(r.out), f = facts("coupling");
    // the agent engine wrote a worksheet and nobody answered it: no docs/05 row is read one way or the other
    expect(m.judge.pending).toMatch(/edge-direction/);
    expect(m.judge.undecided).toEqual(["I-01", "I-02", "I-03", "I-04"]);
    expect(f.edges.filter((e: any) => e.source === "docs/05")).toEqual([]);
    expect(f.undirected.map((e: any) => [e.via.split(" ")[0], e.by, e.undecided])).toEqual([["I-01", "undecided", true], ["I-02", "undecided", true], ["I-03", "undecided", true], ["I-04", "undecided", true]]);
    // the graph carries only what is decided: the descriptor line Ledger API → Ledger DB; the replication and the event add no dependents
    const mt = (n: string) => f.metrics.find((x: any) => x.component === n);
    expect(mt("Ledger DB").directDependents).toEqual(["Ledger API"]);
    expect(f.metrics.some((x: any) => x.component === "Ops Console")).toBe(false);
    const pl = payload("coupling");
    expect(pl).toContain("| I-02 | `Ledger DB` | `Digest Job` | Debezium | Replication | undecided — the judge has not answered; no direction, left out of the graph |");
    expect(pl).toContain("**Direction undecided** — 4 rows the judge has not answered (worksheet: ");
    expect(pl).not.toMatch(/lexicon|heuristic/);
  });

  test("the direction is a judgement: the engine's answer is the edge, an unsettled row gets no direction and is named as a gap", async () => {
    // a fake TypeSafe API: I-04 is a call (a product name in its Protocol cell), I-03 comes back unsettled
    const server = Bun.serve({ port: 0, fetch: async (req) => {
      const body = (await req.json()) as { questions: Record<string, any> }; const answers: any = {};
      for (const [id, q] of Object.entries(body.questions)) answers[id] = q.type === "noul" ? { type: "noul", noul: 0 } : q.criteria && "none" in q.criteria ? { type: "choice", choice: "none", probabilities: {}, confidence: 0.9 }   // the name questions: nothing here is a paraphrase
        : id === "I-04" ? { type: "choice", choice: "call", probabilities: { call: 0.9, data: 0.05, unclear: 0.05 }, confidence: 0.85 }
        : id === "I-03" ? { type: "choice", choice: "unclear", probabilities: { call: 0.3, data: 0.3, unclear: 0.4 }, confidence: 0.1 }
        : { type: "choice", choice: id === "I-02" ? "data" : "call", probabilities: {}, confidence: 0.95 };
      return Response.json({ model: "jev-test", answers, usage: { input_tokens: 1, output_tokens: 1 } });
    } });
    try {
      const fixtures = join(dir, "fixtures.json"); writeFileSync(fixtures, JSON.stringify([{ id: "I-04", label: "call" }, { id: "I-02", label: "data" }, { id: "I-03", label: "data" }, { id: "I-99", label: "call" }]));
      const p = Bun.spawn([process.execPath, SCRIPT, dir, "--lens", "coupling", "--today", "2026-09-14", "--json", "--verify", fixtures], { stdout: "pipe", stderr: "pipe", env: { ...ENV, SA_JUDGE: "typesafe", TYPESAFE_API_KEY: "k", TYPESAFE_ENDPOINT: `http://127.0.0.1:${server.port}/` } });
      const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
      expect(code).toBe(0);
      const f = facts("coupling"); const by = (id: string) => f.edges.find((e: any) => e.via.startsWith(id));
      expect(by("I-04")).toMatchObject({ kind: "call", by: "jev-test", confidence: 0.85 });
      expect(by("I-02")).toMatchObject({ kind: "data", by: "jev-test" });
      expect(by("I-03")).toBeUndefined();                                                                     // not stated: no edge
      expect(f.undirected.find((e: any) => e.via.startsWith("I-03"))).toMatchObject({ kind: null, uncertain: true, judged: "unclear" });
      expect(JSON.parse(out).judge).toMatchObject({ uncertain: ["I-03"], undecided: [] });
      const m = (n: string) => f.metrics.find((x: any) => x.component === n);
      expect(m("Ledger API").directDependents).toContain("Ops Console");                                     // From depends on To: the console depends on the API
      expect(m("Ledger DB").directDependents).toContain("Digest Job");                                       // data: the job depends on the store it replicates from
      expect(m("Topic Entries").directDependents).toEqual([]);                                               // I-03 adds nothing
      const pl = payload("coupling");
      expect(pl).toContain("| I-04 | `Ops Console` | `Ledger API` | Sync Gateway admin API over HTTPS | Request-response | call (From depends on To) · jev-test 0.85 |");
      expect(pl).toContain("**Direction not stated** — 1 row"); expect(pl).toContain("I-03");
      expect(pl).not.toContain("**Direction undecided**");
      // --verify: two fixtures answered as labelled, I-03 answered unclear, I-99 is no row of this project
      expect(err).toContain("2/4 fixtures answered as labelled");
      expect(err).toContain("✗ I-03: labelled data, answered unclear");
      expect(err).toContain("✗✗ I-99: not a docs/05 row");
    } finally { server.stop(true); }
  });

  test("without a key the typesafe engine does not stop the run: every row is undecided and the note says why", async () => {
    const p = Bun.spawn([process.execPath, SCRIPT, dir, "--lens", "coupling", "--today", "2026-09-14"], { stdout: "pipe", stderr: "pipe", env: { ...ENV, SA_JUDGE: "typesafe" } });
    const [out, code] = await Promise.all([new Response(p.stdout).text(), p.exited]);
    expect(code).toBe(0);
    expect(out).toContain("edge direction: the typesafe engine needs TYPESAFE_API_KEY");
    expect(out).toContain("4 undecided, left out of the graph (I-01, I-02, I-03, I-04)");
    expect(facts("coupling").edges.filter((e: any) => e.source === "docs/05")).toEqual([]);
  });

  test("latency: the flow's own block is carried verbatim and no sum of phase budgets is printed", () => {
    run("latency-budget");
    const p = payload("latency-budget");
    expect(p).toContain("<!-- flow 1 block -->\n#### Flow 1 — Post an entry");
    expect(p).toContain("The 1 s target breaks down as 600 ms for phase 1 and 400 ms for phase 2, which overlap the gate.");
    expect(p).not.toMatch(/Sum of phase budgets|\| over \||1500 ms/);
    expect(p).toContain("| 1 | Validate | yes | Ledger API → Ledger DB | 1 | ≤ 800 ms, serial, gate included. |");
    const f = facts("latency-budget");
    expect(f.latency[0].block).toContain("**Phases**: 1, 2");
    expect(f.latency[0].sumMs).toBeUndefined();
  });

  test("payload and documents come in parts one Read returns whole, listed in order, and the payload names no plugin file", () => {
    const A = join(dir, ".cache", "sa-skills", "analysis");
    const section = (n: number) => `### 9.${n} Control ${n}\n\n` + Array.from({ length: 40 }, (_, i) => `- The Ledger API validates request ${n}.${i} against the boundary rule — evidence row ${"x".repeat(40)}.`).join("\n") + "\n";
    const big = `# Security\n\n${HDR("security")}\n\n## 9. Security Architecture <!-- SECTION: Security Architecture -->\n\n` + Array.from({ length: 60 }, (_, n) => section(n)).join("\n");
    writeFileSync(join(dir, "docs", "07-security-architecture.md"), big);
    expect(run("stride").code).toBe(0);
    const m = JSON.parse(readFileSync(join(A, "_run.json"), "utf8")).lenses.stride;
    expect(m.docsParts.length).toBeGreaterThan(2);
    expect(m.maxPartBytes).toBeLessThanOrEqual(38000 + 400);           // the cap, plus the part's head and tail comments
    const first = payload("stride");
    const listed = [...first.matchAll(/^\d+\. `([^`]+)`/gm)].map((x) => x[1]);
    expect(listed).toEqual([...m.payloadParts, ...m.docsParts].map((p: string) => join(dir, p)));
    // the parts, stripped of their head and tail comments, are the documents bundle, in order, nothing lost
    const strip = (t: string) => t.replace(/^<!-- [^\n]* part \d+ of \d+[^\n]*-->\n\n/, "").replace(/\n\n<!-- continues in [^\n]*-->\n$/, "");
    const joined = m.docsParts.map((p: string) => strip(readFileSync(join(dir, p), "utf8"))).join("\n");
    expect(joined).toContain(big.trim());
    const all = m.payloadParts.map((p: string) => readFileSync(join(dir, p), "utf8")).join("\n");
    expect(all).not.toMatch(/plans\/README|\[sa_skills_dir\]|\[plugin_dir\]/);
    expect(all).toContain("## Design Language Standard");
    // a smaller bundle on the next run leaves no stale part behind
    writeFileSync(join(dir, "docs", "07-security-architecture.md"), `# Security\n\n${HDR("security")}\n\n## 9. Security Architecture <!-- SECTION: Security Architecture -->\n\nOne control.\n`);
    expect(run("stride").code).toBe(0);
    const m2 = JSON.parse(readFileSync(join(A, "_run.json"), "utf8")).lenses.stride;
    expect(m2.docsParts.length).toBe(1);
    expect(existsSync(join(A, "stride.docs-2.md"))).toBe(false);
  });
});
