/**
 * tier0.js — the Tier 0 request an IDE files and the architecture repository writes: the issue format both ways, the
 * policy re-read here (refusals with their reasons), the doc fix by code held to the facts ledger, and verify holding
 * a written record to the request. Synthetic project (Order Desk / Hub API) in a temporary git repository.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const T = require("./shared/tier0.js");

const TMP = join(tmpdir(), `sa-tier0-test-${process.pid}`);
process.env.GIT_CEILING_DIRECTORIES = TMP;
const ROOT = join(TMP, "project");
const w = (rel: string, body: string) => { mkdirSync(join(ROOT, rel, ".."), { recursive: true }); writeFileSync(join(ROOT, rel), body, "utf-8"); };
const git = (...a: string[]) => spawnSync("git", ["-C", ROOT, ...a], { encoding: "utf8" }).stdout.trim();
const header = (self: string) => `<!-- EXPLORER_HEADER\nkey_concepts: orders\ntechnologies: Go\ncomponent_self: ${self}\ncomponent_type: api\nscope: One line.\nrelated_adrs: ADR-101\n-->`;

function project(opts: { run?: boolean; tag?: boolean } = { run: true, tag: true }) {
  rmSync(TMP, { recursive: true, force: true });
  w("ARCHITECTURE.md", `<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- ARCHITECTURE_STATUS: Released -->\n<!-- DOC_LANGUAGE: en -->\n\n# Order Desk — Architecture\n`);
  w("docs/01-system-overview.md", `# System Overview\n\nThe Order Desk takes orders from the web.\n`);
  w("docs/components/order-desk.md", `# Order Desk\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n`);
  w("docs/components/order-desk/01-hub-api.md", `# Hub API\n\n${header("hub-api")}\n\n**Type:** API\n**Technology:** [Go 1.23]\n**Description:** Hub API takes orders.\n**C4 Level:** Container (L2)\n`);
  w("adr/ADR-101-keep.md", `# ADR-101: Keep the desk\n\n**Status**: Accepted\n**Scope**: Project\n`);
  w("tdr/TDR-001-polling.md", `---\nstatus: Open\ndriver: Architecture\n---\n\n# TDR-001: Hub API polls the stock\n\n## Status\n\n\`Open\`\n\n**Initiative**: Order Desk\n**Driver**: Architecture — polling\n\n## Description\n\nx\n\n## Impact\n\ny\n\n## Possible Solutions\n\n- A\n\n## Owner\n\n- **Technical**: Desk team\n\n---\n\n## History\n\n- 2026-10-01: Created. Status: \`Open\`.\n`);
  if (opts.run) w(".sa-skills/project.json", JSON.stringify({ support: "run" }));
  spawnSync("git", ["init", "-q", "-b", "main", ROOT]);
  git("config", "user.email", "t@example.com"); git("config", "user.name", "T"); git("config", "commit.gpgsign", "false"); git("config", "tag.gpgsign", "false");
  git("add", "-A"); git("commit", "-q", "-m", "create");
  if (opts.tag) git("tag", "-a", "architecture-v1.0.0", "-m", "v1.0.0");
}
const REQ = {
  kind: "tdr-workaround", title: "Hub API caches the stock for 5 minutes", request: "build the stock lookup within its p95",
  components: ["Hub API"], requested_by: "Desk team", architecture: "architecture-v1.0.0",
  evidence: [{ where: "hub-api@abc1234 internal/stock/cache.go:42", note: "a 5-minute cache | with a pipe" }],
  fields: { description: "Hub API caches the stock ```five``` minutes.", impact: "A sold-out item shows for 5 minutes.", solutions: ["Push stock events"], owner_technical: "Desk team" },
};
const issue = (req: any, n = 7) => ({ n, url: `https://example.com/org/arch/issues/${n}`, title: T.issueTitle(req), body: T.issueBody(req), labels: T.labelsOf(req) });

beforeEach(() => project());
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("tier0.js", () => {
  test("the issue: title [T0-?], its labels, and the request read back exactly from the body", () => {
    const i = issue(REQ);
    expect(i.title).toBe("[T0-?] Hub API caches the stock for 5 minutes");
    expect(i.labels).toEqual(["architecture-tier0", "tier0:tdr-workaround"]);
    expect(i.body).toContain("| Kind | `tdr-workaround` — a workaround recorded as a new TDR |");
    expect(T.requestOf(i)).toEqual(REQ);
    expect(T.requestOf({ ...i, title: "[TDR-004] Hub API caches the stock for 5 minutes" }).title).toBe(REQ.title);
  });

  test("prepare numbers a workaround TDR after the last one and writes the payload", () => {
    const r = T.prepare(ROOT, issue(REQ));
    expect(r).toMatchObject({ ok: true, kind: "tdr-workaround", id: "TDR-002", file: "tdr/TDR-002-hub-api-caches-the-stock-for-5-minutes.md" });
    expect(JSON.parse(readFileSync(join(ROOT, r.payload_file), "utf8")).request).toEqual(REQ);
    const adr = T.prepare(ROOT, issue({ ...REQ, kind: "adr-proposed", title: "Stock events", fields: { context: "c", decision: "d", consequences: ["e"] } }, 8));
    expect(adr).toMatchObject({ ok: true, id: "ADR-102", file: "adr/ADR-102-stock-events.md" });
  });

  test("the policy is read here: no Tier 0, a name in doubt, a kind or a move it does not allow — refused with the reason", () => {
    project({ run: true, tag: false });
    expect(T.prepare(ROOT, issue(REQ)).reasons.join("\n")).toMatch(/Tier 0 does not apply here: RUN team, but no architecture release yet/);
    project();
    expect(T.prepare(ROOT, issue({ ...REQ, components: ["Hub"] })).reasons).toContain('component "Hub" is not a canonical name of this architecture — a name in doubt is no Tier 0 write');
    expect(T.prepare(ROOT, issue({ ...REQ, kind: "adr-accepted" })).reasons[0]).toMatch(/is not a Tier 0 write/);
    expect(T.prepare(ROOT, issue({ ...REQ, evidence: [] })).reasons).toContain("tdr-workaround needs evidence: where it shows in the service (repository, commit, file:line)");
    const move = (to: string) => issue({ ...REQ, kind: "tdr-status", fields: { tdr: "TDR-001", to, note: "the cache is gone" } });
    expect(T.prepare(ROOT, move("Resolved")).reasons[0]).toMatch(/TDR-001: Open → Resolved is refused/);
    expect(T.prepare(ROOT, move("Won't Fix")).reasons.join()).toMatch(/is a decision, not a Tier 0 write/);
    expect(T.prepare(ROOT, move("In Progress"))).toMatchObject({ ok: true, id: "TDR-001", from: "Open" });
    expect(T.prepare(ROOT, { ...issue(REQ), labels: [], title: "Hub API caches" }).reasons[0]).toMatch(/not a Tier 0 request/);
  });

  test("a doc fix is applied by code, verified when no fact moved, refused when one did", () => {
    const fix = (before: string, after: string, file = "docs/01-system-overview.md", line = 3) =>
      ({ ...REQ, kind: "doc-fix", title: "typo", components: [], evidence: [], fields: { file, line, before, after } });
    let p = T.prepare(ROOT, issue(fix("from the web", "from the website")));
    expect(p.ok).toBe(true);
    T.apply(ROOT, p);
    expect(readFileSync(join(ROOT, "docs/01-system-overview.md"), "utf8")).toContain("takes orders from the website.");
    expect(T.verify(ROOT, p)).toMatchObject({ ok: true, changed: ["docs/01-system-overview.md"] });
    git("checkout", "-q", ".");
    p = T.prepare(ROOT, issue(fix("Go 1.23", "Go 1.24", "docs/components/order-desk/01-hub-api.md", 99)));   // not on line 99, once in the file
    expect(p.line).toBe(13);
    T.apply(ROOT, p);
    expect(T.verify(ROOT, p).problems).toContain("the fix changed a fact of the architecture — no Tier 0 write; it goes through the architect");
    git("checkout", "-q", ".");
    expect(T.prepare(ROOT, issue(fix("not there", "x"))).reasons[0]).toMatch(/does not carry the text to replace/);
    expect(T.prepare(ROOT, issue(fix("x", "y", "adr/ADR-101-keep.md"))).reasons).toContain('fields.file "adr/ADR-101-keep.md" is not under docs/');
  });

  test("a TDR write may add its own summary row to the debt section, found by its anchor — and nothing else there", () => {
    w("docs/10-risks.md", "# Risks\n\n## 13. Risks and Technical Debt <!-- SECTION: Risks and Technical Debt -->\n\n| TDR | Title | Status |\n|---|---|---|\n| TDR-001 | Polling | Open |\n");
    git("add", "-A"); git("commit", "-q", "-m", "risks");
    const p = T.prepare(ROOT, issue(REQ));
    w(p.file, "x"); w("docs/10-risks.md", "# Risks\n\n## 13. Risks and Technical Debt <!-- SECTION: Risks and Technical Debt -->\n\n| TDR | Title | Status |\n|---|---|---|\n| TDR-001 | Polling | Open |\n| TDR-002 | Stock cache | Open |\n");
    expect(T.verify(ROOT, p).problems.filter((x: string) => x.includes("docs/10"))).toEqual([]);
    w("docs/10-risks.md", "# Risks\n\n## 13. Risks and Technical Debt <!-- SECTION: Risks and Technical Debt -->\n\n| TDR | Title | Status |\n|---|---|---|\n| TDR-001 | Polling | Resolved |\n| TDR-002 | Stock cache | Open |\n");
    expect(T.verify(ROOT, p).problems.some((x: string) => /docs\/10-risks\.md: a line that is not TDR-002's summary row changed/.test(x))).toBe(true);
    git("checkout", "-q", "docs/10-risks.md");
    expect(T.verify(ROOT, p).problems).toContain("docs/10-risks.md has no summary row for TDR-002 — the TDR skill appends one to the Risks and Technical Debt section");
  });

  test("verify holds the written record to the request and to its paths", () => {
    const p = T.prepare(ROOT, issue({ ...REQ, kind: "tdr-status", fields: { tdr: "TDR-001", to: "In Progress", note: "n" } }));
    expect(T.verify(ROOT, p).problems).toContain("nothing was written");
    const f = join(ROOT, "tdr/TDR-001-polling.md");
    writeFileSync(f, readFileSync(f, "utf8").replace("status: Open", "status: In Progress").replace("`Open`\n\n**Initiative", "`In Progress`\n\n**Initiative"));
    w("docs/01-system-overview.md", "# System Overview\n\nChanged on the side.\n");
    const v = T.verify(ROOT, p);
    expect(v.problems).toContain("docs/01-system-overview.md changed — a tdr-status writes tdr/ only");
    expect(v.problems.some((x: string) => /is Open, the request says In Progress/.test(x))).toBe(false);
  });
});
