/**
 * kit-coherence.js and kit-drift.js — the kit held to itself across parts (who owns what) and across regenerations
 * (what a run dropped or re-decided). The cuts are code's, every semantic verdict the judge's: a worksheet first, the
 * answers second, an unanswered item undecided.
 */
import { describe, test, expect, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const coherence = require("../scripts/kit-coherence.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const drift = require("../scripts/kit-drift.js");

const roots: string[] = [];
afterAll(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));
const project = () => { const r = mkdtempSync(join(tmpdir(), "kit-coherence-")); roots.push(r); return r; };
const w = (root: string, p: string, s: string) => { mkdirSync(join(root, p, ".."), { recursive: true }); writeFileSync(join(root, p), s); };
/** Answer a worksheet as the session's worksheet-judge would: every item id with the given probability. */
const answer = (root: string, id: string, p: (itemId: string) => number) => {
  const sheet = readFileSync(join(root, `.cache/sa-skills/judge/${id}.worksheet.md`), "utf8");
  const hash = sheet.match(/"worksheet": "([0-9a-f]+)"/)![1];
  const ids = [...sheet.matchAll(/^### ((?:if|inv)-\d+)$/gm)].map((m) => m[1]);
  writeFileSync(join(root, `.cache/sa-skills/judge/${id}.answers.json`), JSON.stringify({ worksheet: hash, answers: Object.fromEntries(ids.map((x) => [x, p(x)])) }));
  return ids;
};

const contract = (owned: string) => `# Interface Contract: Hub API → Ledger Store\n\n<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n\n## Exit state <!-- SECTION: Exit state -->\n\n- The ledger holds the order's \`status\`, its \`postedAt\` and the wrapped signing-key blob.\n\n## Ownership <!-- SECTION: Ownership -->\n\n| Direction | Fields / entities |\n|---|---|\n| Owned by upstream | ${owned} |\n| Owned by downstream | the ledger entries |\n`;
const spec = (invariants: string[]) => `# Component Specification — Hub API\n\n<!-- managed by sa-skills:architecture-dev-handoff — do not edit manually -->\n\n## 4. Invariants <!-- SECTION: Invariants -->\n\n${invariants.map((x, i) => `- **INV-0${i + 1}** ${x}`).join("\n")}\n\n## 6. Data ownership <!-- SECTION: Data Ownership -->\n\n- The order record: \`status\`, \`postedAt\`, the wrapped signing-key blob.\n`;

describe("kit-coherence — one fact in three parts", () => {
  test("one item per Interface Contract, carrying its Ownership table, its Exit state and both specifications' § 6", () => {
    const root = project();
    w(root, "handoffs/interfaces/hub-api→ledger-store.md", contract("`status`, `postedAt`"));
    w(root, "handoffs/interfaces/old→style.md", "# Interface Contract: Old → Style\n\nno sections\n");
    w(root, "handoffs/components/02-hub-api.md", spec(["Every write carries a key"]));
    const { items, skipped } = coherence.candidates(root);
    expect(items).toHaveLength(1);
    expect(items[0].state).toMatchObject({ interface: "hub-api→ledger-store", upstream: "hub-api", downstream: "ledger-store" });
    expect(items[0].state.ownership).toMatch(/Owned by upstream \| `status`, `postedAt` \|/);
    expect(items[0].state.exit_state).toMatch(/wrapped signing-key blob/);
    expect(items[0].state.upstream_owns).toMatch(/^- The order record/);
    expect(items[0].state.downstream_owns).toMatch(/^no Component Specification § 6 for the downstream/);
    expect(skipped).toEqual(["old→style.md: no Ownership section"]);
  });

  test("the agent judge: PENDING with a worksheet, then a confident disagreement blocks, a weak one warns, agreement passes", async () => {
    const root = project();
    w(root, "handoffs/interfaces/hub-api→ledger-store.md", contract("`status`, `postedAt`"));
    w(root, "handoffs/components/02-hub-api.md", spec(["Every write carries a key"]));
    const first = await coherence.check(root, { engine: "agent" });
    expect(first).toMatchObject({ status: "PENDING", contracts: 1, findings: [], undecided: ["handoffs/interfaces/hub-api→ledger-store.md"] });
    expect(first.note).toMatch(/kit-ownership-coherence\.worksheet\.md — dispatch worksheet-judge/);
    answer(root, "kit-ownership-coherence", () => 0.95);
    const fail = await coherence.check(root, { engine: "agent" });
    expect(fail.status).toBe("FAIL");
    expect(fail.findings).toEqual([{ rule: "ownership-mismatch", severity: "BLOCKING", file: "handoffs/interfaces/hub-api→ledger-store.md", p: 0.95, by: "agent" }]);
    answer(root, "kit-ownership-coherence", () => 0.6);
    expect((await coherence.check(root, { engine: "agent" })).status).toBe("WARN");
    answer(root, "kit-ownership-coherence", () => 0.05);
    expect(await coherence.check(root, { engine: "agent" })).toMatchObject({ status: "PASS", agreed: 1 });
    expect(coherence.render(fail)).toMatch(/^KIT_COHERENCE: FAIL — 1 Interface Contract\(s\), 0 agree, 1 disagree/);
  });
});

describe("kit-drift — a regenerated kit against the committed one", () => {
  const sh = (root: string, ...args: string[]) => { const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", env: { ...process.env, GIT_CEILING_DIRECTORIES: tmpdir(), GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.com", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.com" } }); if (r.status !== 0) throw new Error(r.stderr); return r.stdout; };
  const openapi = (version: string, ops: [string, string, string][]) => `openapi: 3.1.0\ninfo:\n  title: Hub API\n  version: ${version}\npaths:\n${ops.map(([m, p, id]) => `  ${p}:\n    ${m}:\n      operationId: ${id}\n      responses:\n        "200":\n          description: ok\n`).join("")}`;

  test("no git, or no kit at the base: SKIPPED", async () => {
    const root = project();
    expect((await drift.check(root, {})).status).toBe("SKIPPED");
    sh(root, "init", "-q"); w(root, "README.md", "x\n"); sh(root, "add", "-A"); sh(root, "commit", "-qm", "init");
    expect(await drift.check(root, {})).toMatchObject({ status: "SKIPPED", reason: "no handoffs/ kit at HEAD — nothing to compare" });
  });

  test("a documented operationId renamed and an unpinned version moved block; an undocumented rename warns; a dropped invariant goes to the judge", async () => {
    const root = project(); sh(root, "init", "-q");
    w(root, "docs/05-integration-points.md", "# Integrations\n\nOperations of Hub API: `createReceipt`, `GET /orders`, contract v1.0.0.\n");
    w(root, "handoffs/assets/02-hub-api/openapi.yaml", openapi("1.0.0", [["post", "/receipts", "createReceipt"], ["get", "/orders", "listOrders"], ["get", "/health", "health"]]));
    w(root, "handoffs/components/02-hub-api.md", spec(["Every write carries an idempotency key.", "The key blob is re-wrapped on readmission and on key rotation."]));
    sh(root, "add", "-A"); sh(root, "commit", "-qm", "kit 1");
    // the regenerated kit: the documented name renamed, the version re-decided, an undocumented operation renamed, the re-wrap rule gone
    w(root, "handoffs/assets/02-hub-api/openapi.yaml", openapi("0.1.0", [["post", "/receipts", "issueReceipt"], ["get", "/orders", "getOrders"]]));
    w(root, "handoffs/components/02-hub-api.md", spec(["Every write carries an idempotency key."]));
    const r = await drift.check(root, { engine: "agent" });
    expect(r.status).toBe("FAIL");
    const lines = r.findings.map((f: any) => `${f.severity} ${f.rule}: ${f.text}`);
    expect(lines).toEqual([
      "BLOCKING regression: info.version 1.0.0 → 0.1.0 — the docs do not state 0.1.0; pin the contract version in the docs (or restore 1.0.0)",
      "BLOCKING regression: POST /receipts: operationId createReceipt → issueReceipt — the docs name createReceipt",
      "WARNING operation-renamed: GET /orders: operationId listOrders → getOrders — neither name is in the docs; pin the operation names there",
      "WARNING operation-removed: GET /health (health) is gone — confirm the architecture removed it",
    ]);
    expect(r.invariants_asked).toBe(1);
    expect(r.undecided).toEqual(["handoffs/components/02-hub-api.md INV-02"]);
    answer(root, "kit-invariant-kept", () => 0.1);
    const again = await drift.check(root, { engine: "agent" });
    expect(again.findings.at(-1)).toMatchObject({ rule: "invariant-dropped", severity: "WARNING", file: "handoffs/components/02-hub-api.md" });
    expect(again.findings.at(-1).text).toMatch(/^INV-02 "The key blob is re-wrapped on readmission and on key rotation\." — no invariant of the new list states it \[agent 0\.10\]/);
    // the architecture states the new names and version: nothing blocks, a kept invariant raises nothing
    w(root, "docs/05-integration-points.md", "# Integrations\n\nOperations of Hub API: `issueReceipt`, `getOrders`, `GET /orders`, contract v0.1.0.\n");
    answer(root, "kit-invariant-kept", () => 0.9);
    const ok = await drift.check(root, { engine: "agent" });
    expect(ok.findings.map((f: any) => f.rule)).toEqual(["operation-removed"]);
    expect(ok.status).toBe("WARN");
  });

  test("invariants are read from § 4 alone, bullets with their bold id, links and code marks out", () => {
    expect(drift.invariantsOf(spec(["A `key` per [write](x.md)."]))).toEqual([{ id: "INV-01", text: "A key per write." }]);
    expect(drift.named("contract v1.0.0", "1.0.0", "[vV]")).toBe(true);
    expect(drift.named("issueCustomerReceipt", "issueCustomer")).toBe(false);
  });
});
