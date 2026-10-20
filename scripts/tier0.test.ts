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

  test("an unattended build agent files without the key: no architecture-tier0 label, the footer says a person applies it; the attended issue is unchanged", () => {
    const u = issue({ ...REQ, supervision: "unattended" });
    expect(u.labels).toEqual(["tier0:tdr-workaround"]);
    expect(u.body).toContain("filed by an unattended build agent: a person reviews it and applies the label `architecture-tier0` — that is the approval");
    expect(u.body.replace(/_Tier 0[^\n]*_/, "")).toBe(issue(REQ).body.replace(/_Tier 0[^\n]*_/, ""));
    expect(T.requestOf(u).components).toEqual(REQ.components);
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

  test("a TDR propagates over the docs surface where it names itself; anything else, an institutional ADR or a moved fact is refused", () => {
    const risks = (rows: string) => `# Risks\n\n## 13. Risks and Technical Debt <!-- SECTION: Risks and Technical Debt -->\n\n| TDR | Title | Status |\n|---|---|---|\n${rows}`;
    w("docs/10-risks.md", risks("| TDR-001 | Polling | Open |\n"));
    w("adr/ADR-001-institutional.md", "# ADR-001: Institutional\n\n**Status**: Accepted\n");
    git("add", "-A"); git("commit", "-q", "-m", "risks");
    const p = T.prepare(ROOT, issue(REQ)), hub = "docs/components/order-desk/01-hub-api.md", hubSrc = readFileSync(join(ROOT, hub), "utf8");
    const tdrFile = readFileSync(join(ROOT, "tdr/TDR-001-polling.md"), "utf8").replace(/TDR-001/g, "TDR-002").replace("Hub API polls the stock", "Hub API caches the stock");
    w(p.file, tdrFile); w("tdr/README.md", "# TDRs\n\n| ID | Title | Status |\n|---|---|---|\n| TDR-001 | Polling | Open |\n| TDR-002 | Stock cache | Open |\n");
    const docsProblems = () => T.verify(ROOT, p).problems.filter((x: string) => !/^tdr\/|TDR-001|has no record|is Open/.test(x));
    // missing Section 13 row
    expect(docsProblems()).toContain("docs/10-risks.md has no summary row for TDR-002 — the TDR skill appends one to the Risks and Technical Debt section");
    // the row and the link both ways in the component descriptor: allowed
    w("docs/10-risks.md", risks("| TDR-001 | Polling | Open |\n| TDR-002 | Stock cache | Open |\n"));
    // the descriptor's link back is required too
    expect(docsProblems()).toContain("docs/components/order-desk/01-hub-api.md does not name TDR-002 — the affected component's descriptor carries `**Technical Debt:** [TDR-002](…)` after `**Last Updated:**`");
    w(hub, hubSrc.replace("**C4 Level:** Container (L2)\n", "**C4 Level:** Container (L2)\n**Technical Debt:** [TDR-002](../../../tdr/TDR-002-hub-api-caches-the-stock.md)\n"));
    expect(docsProblems()).toEqual([]);
    // a change that does not name the record
    w("docs/01-system-overview.md", "# System Overview\n\nThe Order Desk takes orders by phone.\n");
    expect(docsProblems()).toContain("docs/01-system-overview.md: a change that does not name TDR-002 — The Order Desk takes orders by phone.");
    git("checkout", "-q", "docs/01-system-overview.md");
    // an institutional ADR, even naming it
    w("adr/ADR-001-institutional.md", "# ADR-001: Institutional\n\n**Status**: Accepted\n\nSee TDR-002.\n");
    expect(docsProblems()).toContain("adr/ADR-001-institutional.md changed — an institutional ADR is never edited by a Tier 0 write");
    git("checkout", "-q", "adr/ADR-001-institutional.md");
    // a hunk that names the record but moves a fact
    w(hub, hubSrc.replace("[Go 1.23]", "[Go 1.24] (TDR-002)"));
    expect(docsProblems().some((x: string) => /a fact of the architecture outside TDR-002's own record moved/.test(x))).toBe(true);
  });

  test("verify holds the written record to the request and to its paths", () => {
    const p = T.prepare(ROOT, issue({ ...REQ, kind: "tdr-status", fields: { tdr: "TDR-001", to: "In Progress", note: "n" } }));
    expect(T.verify(ROOT, p).problems).toContain("nothing was written");
    const f = join(ROOT, "tdr/TDR-001-polling.md");
    writeFileSync(f, readFileSync(f, "utf8").replace("status: Open", "status: In Progress").replace("`Open`\n\n**Initiative", "`In Progress`\n\n**Initiative"));
    w("docs/01-system-overview.md", "# System Overview\n\nChanged on the side.\n");
    const v = T.verify(ROOT, p);
    expect(v.problems).toContain("docs/01-system-overview.md: a change that does not name TDR-001 — Changed on the side.");
    expect(v.problems.some((x: string) => /is Open, the request says In Progress/.test(x))).toBe(false);
    // a sentence still stating the old status is refused until the write edits it (10.10.10)
    w("docs/01-system-overview.md", "# System Overview\n\nPolling stays until TDR-001 (Open) is paid.\n");
    expect(T.verify(ROOT, p).problems.some((x: string) => /docs\/01-system-overview.md:3 states TDR-001 as `Open`, the record is `In Progress`/.test(x))).toBe(true);
    w("docs/01-system-overview.md", "# System Overview\n\nPolling stays until TDR-001 (In Progress) is paid.\n");
    expect(T.verify(ROOT, p).problems.some((x: string) => /states TDR-001/.test(x))).toBe(false);
  });
});

describe("the Tier 0 labels escalate.js labels creates", () => {
  test("are the key, the refusal and one per kind — the ones the workflow and the issue format use", () => {
    const E = require("../plugins/sa-records/scripts/shared/escalate.js");
    const names = E.labelSet().map((l: any) => l.name);
    expect(names).toContain(T.LABEL);
    for (const k of Object.keys(T.KINDS)) expect(names).toContain(`tier0:${k}`);
    const yml = readFileSync(join(__dirname, "..", "skills", "architecture-lifecycle", "ci", "architecture-tier0.yml"), "utf8");
    for (const l of (yml.match(/--(?:add|remove)-label ([\w:-]+)/g) || []).map((x) => x.split(" ")[1])) expect(names).toContain(l);
  });
});

describe("the workflow's key", () => {
  // the step's script, cut from the template by its indentation, run against a fake gh that logs its calls
  const yml = readFileSync(join(__dirname, "..", "skills", "architecture-lifecycle", "ci", "architecture-tier0.yml"), "utf8");
  const lines = yml.split("\n");
  const at = lines.findIndex((l) => l.includes("- name: The label is the key"));
  const from = lines.findIndex((l, i) => i > at && /^\s+run: \|$/.test(l)) + 1;
  const indent = lines[from].match(/^\s*/)![0].length;
  const end = lines.findIndex((l, i) => i >= from && l.trim() !== "" && l.match(/^\s*/)![0].length < indent);
  const script = lines.slice(from, end).map((l) => l.slice(indent)).join("\n");
  const run = (sender: string, type: string, agents: string, role: string, more: Record<string, string> = {}) => {
    const dir = join(TMP, `key-${sender}-${type}-${Object.values(more).join("-").replace(/[^a-z0-9]/gi, "").slice(0, 20)}`);
    mkdirSync(dir, { recursive: true });
    const log = join(dir, "gh.log");
    // like gh before the checkout: an issue command without -R finds no repository on disk and fails
    writeFileSync(join(dir, "gh"), `#!/bin/bash\necho "$*" >> "${log}"\n[ "$1" = api ] && echo ${role}\n[ "$1 $2" = "issue list" ] && echo ${more.USED || 0}\n` +
      `if [ "$1" = issue ] && [[ " $* " != *" -R acme/order-desk "* ]]; then echo "not a git repository" >&2; exit 1; fi\nexit 0\n`, { mode: 0o755 });
    const r = spawnSync("bash", ["-e", "-c", script], { encoding: "utf8", cwd: dir,
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, SENDER: sender, SENDER_TYPE: type, AGENTS: agents,
             N: "7", RUNNER_TEMP: dir, GITHUB_REPOSITORY: "acme/order-desk", GITHUB_OUTPUT: join(dir, "out"), AUTHOR: sender,
             BODY: "x\n<!-- sa-tier0 -->\n", TRUSTED: "", DAILY: "", ...more } });
    const out = (() => { try { return readFileSync(join(dir, "out"), "utf8"); } catch { return ""; } })();
    const calls = (() => { try { return readFileSync(log, "utf8"); } catch { return ""; } })();
    const comment = (() => { try { return readFileSync(join(dir, "k.md"), "utf8"); } catch { return ""; } })();
    return { code: r.status, calls, comment, out };
  };

  test("an account in SA_TIER0_AGENTS is refused on the issue: a comment, the label off, no tier0-refused", () => {
    const r = run("build-bot-user", "User", "ci-runner, Build-Bot-User", "write");
    expect(r.code).toBe(1);
    expect(r.comment).toContain("`build-bot-user` is an automation account");
    expect(r.comment).toContain("the request stands");
    expect(r.calls).toContain("issue comment 7 -R acme/order-desk --body-file");
    expect(r.calls).toContain("issue edit 7 -R acme/order-desk --remove-label architecture-tier0");
    expect(r.calls).not.toContain("tier0-refused");
  });

  test("a bot is refused the same way, and a reader without triage too", () => {
    expect(run("app[bot]", "Bot", "", "admin").comment).toContain("automation account");
    const r = run("visitor", "User", "", "read");
    expect(r.code).toBe(1);
    expect(r.comment).toContain("`visitor` (read) cannot start a Tier 0 write");
    expect(r.calls).toContain("--remove-label architecture-tier0");
  });

  test("a trusted agent keys the request it filed: tier0-auto, auto=true for prepare, before any refusal of agents and bots", () => {
    const r = run("build-bot-user", "User", "build-bot-user", "write", { TRUSTED: "ci-runner build-bot-user" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("auto=true");
    expect(r.calls).toContain("issue edit 7 -R acme/order-desk --add-label tier0-auto");
    expect(run("svc-builder[bot]", "Bot", "", "none", { TRUSTED: "svc-builder[bot]" }).code).toBe(0);
  });

  test("a trusted agent never keys another's issue, an issue without the marker, or past its daily limit", () => {
    const other = run("build-bot-user", "User", "", "write", { TRUSTED: "build-bot-user", AUTHOR: "stranger" });
    expect(other.code).toBe(1);
    expect(other.comment).toContain("keys the requests it filed, and #7 was filed by `stranger`");
    expect(run("build-bot-user", "User", "", "write", { TRUSTED: "build-bot-user", BODY: "please write this" }).comment).toContain("no sa-tier0 marker");
    const busy = run("build-bot-user", "User", "", "write", { TRUSTED: "build-bot-user", USED: "3", DAILY: "3" });
    expect(busy.comment).toContain("keyed 3 requests in the last 24 hours, the limit (SA_TIER0_AUTO_DAILY) is 3");
    expect(busy.calls).not.toContain("--add-label tier0-auto");
    expect(run("build-bot-user", "User", "", "write", { TRUSTED: "build-bot-user", USED: "9" }).code).toBe(0);
  });

  test("a person who can write goes on, and the issue is not touched", () => {
    const r = run("maintainer", "User", "build-bot-user", "write");
    expect(r.code).toBe(0);
    expect(r.calls).not.toContain("issue ");
  });
});

describe("tier0.auto — a trusted agent keys its own request (10.12.0)", () => {
  const U = { ...REQ, supervision: "unattended" };
  const declare = (auto: any) => { w(".sa-skills/project.json", JSON.stringify({ support: "run", tier0: { auto } })); git("add", "-A"); git("commit", "-q", "-m", "auto"); };
  const inProgress = () => { const f = join(ROOT, "tdr/TDR-001-polling.md");
    writeFileSync(f, readFileSync(f, "utf8").replace("status: Open", "status: In Progress").replace("`Open`\n\n**Initiative", "`In Progress`\n\n**Initiative")); git("commit", "-qam", "wip"); };
  const resolve = (where: string) => issue({ ...U, kind: "tdr-status", evidence: [{ where, note: "the cache is gone" }], fields: { tdr: "TDR-001", to: "Resolved", note: "paid" } });

  test("the issue of an auto kind carries the key and says no person approved it first; any other kind stays without it", () => {
    expect(T.labelsOf(U, ["tdr-workaround"])).toEqual(["architecture-tier0", "tier0:tdr-workaround"]);
    expect(T.labelsOf(U, ["doc-fix"])).toEqual(["tier0:tdr-workaround"]);
    expect(T.labelsOf(REQ, [])).toEqual(["architecture-tier0", "tier0:tdr-workaround"]);
    expect(T.issueBody(U, ["tdr-workaround"])).toContain("filed and keyed by an unattended build agent");
    expect(T.issueBody(U, ["doc-fix"])).toContain("a person reviews it and applies the label");
  });

  test("prepare --auto refuses a kind the architecture does not list, and accepts one it does", () => {
    expect(T.prepare(ROOT, issue(U), { auto: true }).reasons[0]).toMatch(/is not in this architecture's tier0.auto \(.sa-skills\/project.json: none\) — a person applies architecture-tier0/);
    declare(["doc-fix"]);
    expect(T.prepare(ROOT, issue(U), { auto: true }).reasons[0]).toMatch(/tier0.auto \(.sa-skills\/project.json: doc-fix\)/);
    declare("all");
    expect(T.prepare(ROOT, issue(U), { auto: true })).toMatchObject({ ok: true, id: "TDR-002", auto: true });
    expect(T.prepare(ROOT, issue(U)).auto).toBeUndefined();
  });

  test("a move to Resolved keyed by an agent names a commit merged into its repository's default branch", () => {
    declare("all"); inProgress();
    const merged = (c: any) => (c.sha.startsWith("aaaa") ? { ok: true, branch: "main" } : { ok: false, branch: "main", reason: "main does not contain it (compare: ahead)" });
    expect(T.prepare(ROOT, resolve("hub-api internal/stock/cache.go:42"), { auto: true, merged }).reasons[0]).toMatch(/names the commit that resolved it — evidence `owner\/repo@sha`; none is named/);
    expect(T.prepare(ROOT, resolve("acme/hub-api@bbbbbbb1 internal/stock/cache.go:42"), { auto: true, merged }).reasons[0])
      .toBe("acme/hub-api@bbbbbbb1 is not on acme/hub-api's default branch (main): main does not contain it (compare: ahead) — merge the change, then key the request again");
    expect(T.prepare(ROOT, resolve("acme/hub-api@aaaaaaa1 internal/stock/cache.go:42"), { auto: true, merged })).toMatchObject({ ok: true, from: "In Progress", auto: true });
    // a person's key is not held to it: the person read the request
    expect(T.prepare(ROOT, resolve("hub-api internal/stock/cache.go:42")).ok).toBe(true);
  });

  test("commitsOf reads owner/repo@sha once each; mergedOnDefault asks GitHub's compare", () => {
    expect(T.commitsOf([{ where: "acme/hub-api@abc1234 a.go:1" }, { where: "acme/hub-api@abc1234 b.go:2 and acme/web@def56789" }, { where: "hub-api@abc1234" }]))
      .toEqual([{ repo: "acme/hub-api", sha: "abc1234" }, { repo: "acme/web", sha: "def56789" }]);
    const gh = (status: string) => (args: string[]) => ({ status: 0, stderr: "", stdout: args[1].includes("/compare/") ? `${status}\n` : "main\n" });
    const c = { repo: "acme/hub-api", sha: "abc1234" };
    expect(T.mergedOnDefault(c, gh("behind"))).toEqual({ ok: true, branch: "main" });
    expect(T.mergedOnDefault(c, gh("identical")).ok).toBe(true);
    expect(T.mergedOnDefault(c, gh("diverged"))).toEqual({ ok: false, branch: "main", reason: "main does not contain it (compare: diverged)" });
    expect(T.mergedOnDefault(c, () => ({ status: 1, stdout: "", stderr: "HTTP 404: Not Found" })).reason).toMatch(/could not be read \(HTTP 404/);
  });
});
