/**
 * tier0.js — the Tier 0 request an IDE files and the architecture repository writes: the issue format both ways, the
 * policy re-read here (refusals with their reasons), the doc fix by code held to the facts ledger, and verify holding
 * a written record to the request. Synthetic project (Order Desk / Hub API) in a temporary git repository.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, symlinkSync } from "fs";
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
    // in the architecture's language (10.17.0): the reasons are the refusal comment's body
    const es = T.prepare(ROOT, issue({ ...REQ, components: ["Hub"], evidence: [] }), { lang: "es" }).reasons;
    expect(es).toContain("tdr-workaround necesita evidencia: dónde se ve en el servicio (repositorio, commit, archivo:línea)");
    expect(es).toContain('el componente "Hub" no es un nombre canónico de esta arquitectura: un nombre en duda no es una escritura Tier 0');
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
  // the key job's script, cut from the template by its indentation, run against a fake gh that logs its calls and answers
  // the issue, the policy file and the collaborator role as GitHub would; an issue command without -R fails, as it does
  // in a job without a checkout
  const yml = readFileSync(join(__dirname, "..", "skills", "architecture-lifecycle", "ci", "architecture-tier0.yml"), "utf8");
  const lines = yml.split("\n");
  const at = lines.findIndex((l) => l.includes("- name: The label is the key"));
  const from = lines.findIndex((l, i) => i > at && /^\s+run: \|$/.test(l)) + 1;
  const indent = lines[from].match(/^\s*/)![0].length;
  const end = lines.findIndex((l, i) => i >= from && l.trim() !== "" && l.match(/^\s*/)![0].length < indent);
  const script = lines.slice(from, end).map((l) => l.slice(indent)).join("\n");
  let k = 0;
  type Opts = { event?: string; sender?: string; type?: string; author?: string; labels?: string[]; body?: string; state?: string;
    agents?: string; trusted?: string; role?: string; used?: number; daily?: string; auto?: any; lang?: string };
  const run = (o: Opts) => {
    const dir = join(TMP, `key-${++k}`);
    mkdirSync(dir, { recursive: true });
    const log = join(dir, "gh.log");
    // the step before: the plugin cloned at $RUNNER_TEMP/sa, ARCHITECTURE.md read through the API into $RUNNER_TEMP/arch
    symlinkSync(join(__dirname, ".."), join(dir, "sa"));
    mkdirSync(join(dir, "arch"));
    if (o.lang) writeFileSync(join(dir, "arch", "ARCHITECTURE.md"), `<!-- DOC_LANGUAGE: ${o.lang} -->\n# Order Desk\n`);
    writeFileSync(join(dir, "fixture-issue.json"), JSON.stringify({ state: o.state || "open", user: { login: o.author || o.sender || "build-bot-user" },
      labels: (o.labels || ["tier0:tdr-status"]).map((name) => ({ name })), body: o.body ?? "x\n<!-- sa-tier0 -->\n" }));
    writeFileSync(join(dir, "project.b64"), Buffer.from(JSON.stringify({ support: "run", ...(o.auto ? { tier0: { auto: o.auto } } : {}) })).toString("base64"));
    writeFileSync(join(dir, "gh"), `#!/bin/bash
echo "$*" >> "${log}"
case "$1 $2" in
  "api repos/acme/order-desk/issues/7") cat "${dir}/fixture-issue.json"; exit 0;;
  "api repos/acme/order-desk/contents/.sa-skills/project.json") cat "${dir}/project.b64"; exit 0;;
  "issue list") echo ${o.used || 0}; exit 0;;
esac
[[ "$2" == */permission ]] && { echo ${o.role || "write"}; exit 0; }
if [ "$1" = issue ] && [[ " $* " != *" -R acme/order-desk "* ]]; then echo "not a git repository" >&2; exit 1; fi
exit 0
`, { mode: 0o755 });
    const r = spawnSync("bash", ["-e", "-c", script], { encoding: "utf8", cwd: dir,
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, EVENT: o.event || "labeled", SENDER: o.sender || "build-bot-user", SENDER_TYPE: o.type || "User",
             AGENTS: o.agents || "", TRUSTED: o.trusted || "", DAILY: o.daily || "", N: "7", RUNNER_TEMP: dir, GITHUB_REPOSITORY: "acme/order-desk", GITHUB_OUTPUT: join(dir, "out") } });
    const read = (f: string) => { try { return readFileSync(join(dir, f), "utf8"); } catch { return ""; } };
    return { code: r.status, calls: read("gh.log"), comment: read("k.md"), out: read("out"), stdout: r.stdout };
  };

  test("labeled by an account in SA_TIER0_AGENTS: refused on the issue — a comment, the label off, no tier0-refused", () => {
    const r = run({ sender: "build-bot-user", agents: "ci-runner, Build-Bot-User", author: "dev" });
    expect(r.code).toBe(1);
    expect(r.comment).toContain("`build-bot-user` is an automation account");
    expect(r.comment).toContain("the request stands");
    expect(r.calls).toContain("issue comment 7 -R acme/order-desk --body-file");
    expect(r.calls).toContain("issue edit 7 -R acme/order-desk --remove-label architecture-tier0");
    expect(r.calls).not.toContain("tier0-refused");
  });

  test("a refusal speaks the architecture's language (DOC_LANGUAGE), its codes and names as they are (10.17.0)", () => {
    const r = run({ sender: "build-bot-user", agents: "build-bot-user", author: "dev", lang: "es" });
    expect(r.code).toBe(1);
    expect(r.comment).toContain("Alia · Tier 0 no iniciado");   // her codec heads it (11.3.0)
    expect(r.comment).toContain("`build-bot-user` es una cuenta de automatización");
    expect(r.comment).toContain("la solicitud sigue en pie");
    expect(r.comment).toContain("`architecture-tier0`");
  });

  test("labeled by a bot or a reader without triage: refused; by a person who can write: go, no auto", () => {
    expect(run({ sender: "app[bot]", type: "Bot", role: "admin" }).comment).toContain("automation account");
    const reader = run({ sender: "visitor", role: "read" });
    expect(reader.code).toBe(1);
    expect(reader.comment).toContain("`visitor` (read) cannot start a Tier 0 write");
    const person = run({ sender: "maintainer", author: "build-bot-user", agents: "build-bot-user" });
    expect(person.code).toBe(0);
    expect(person.out).toBe("go=true\n");
    expect(person.calls).not.toContain("issue edit");
  });

  test("opened by a trusted agent, its kind in tier0.auto: keyed here — architecture-tier0 and tier0-auto, auto for prepare", () => {
    const r = run({ event: "opened", sender: "build-bot-user", trusted: "ci-runner build-bot-user", auto: ["tdr-status"] });
    expect(r.code).toBe(0);
    expect(r.out).toBe("go=true\nauto=true\nkeyed=build-bot-user\n");
    expect(r.calls).toContain("issue edit 7 -R acme/order-desk --add-label architecture-tier0 --add-label tier0-auto");
    expect(run({ event: "opened", sender: "build-bot-user", trusted: "build-bot-user", auto: "all", labels: ["tier0:doc-fix"] }).out).toContain("auto=true");
  });

  test("opened, and nothing for the workflow: not a trusted agent, already keyed, no marker, a kind not in tier0.auto — green, no go", () => {
    expect(run({ event: "opened", sender: "dev", trusted: "build-bot-user", auto: "all" })).toMatchObject({ code: 0, out: "go=false\n" });
    expect(run({ event: "opened", trusted: "build-bot-user", auto: "all", labels: ["architecture-tier0", "tier0:tdr-status"] }).out).toBe("go=false\n");
    expect(run({ event: "opened", trusted: "build-bot-user", auto: "all", body: "write this" }).out).toBe("go=false\n");
    const notAuto = run({ event: "opened", trusted: "build-bot-user", auto: ["doc-fix"] });
    expect(notAuto).toMatchObject({ code: 0, out: "go=false\n" });
    expect(notAuto.calls).toContain("issue comment 7 -R acme/order-desk --body ### ");
    expect(notAuto.calls).toContain("Alia\n\nTier 0: `tdr-status` is not in this architecture's `tier0.auto`");
    expect(notAuto.calls).not.toContain("--add-label");
    expect(run({ event: "opened", trusted: "build-bot-user", auto: "all", state: "closed" }).out).toBe("go=false\n");
  });

  test("a trusted agent's daily limit refuses the next request; the re-check takes only a waiting auto request", () => {
    const busy = run({ event: "opened", trusted: "build-bot-user", auto: "all", used: 3, daily: "3" });
    expect(busy.code).toBe(1);
    expect(busy.comment).toContain("keyed 3 requests in the last 24 hours, the limit (SA_TIER0_AUTO_DAILY) is 3");
    expect(busy.calls).not.toContain("--add-label");
    expect(run({ event: "workflow_dispatch", sender: "github-actions[bot]", type: "Bot", author: "build-bot-user", labels: ["architecture-tier0", "tier0-auto", "tier0-waiting"] }).out)
      .toBe("go=true\nauto=true\nkeyed=build-bot-user\n");
    expect(run({ event: "workflow_dispatch", sender: "maintainer", labels: ["tier0:tdr-status"] }).code).toBe(1);
  });

  test("labeled by a trusted agent on its own request — filed with the label, as Alia 0.5.0 renders an auto kind: keyed; on another's: refused", () => {
    expect(run({ sender: "build-bot-user", trusted: "build-bot-user", auto: ["tdr-status"] }).out).toBe("go=true\nauto=true\nkeyed=build-bot-user\n");
    const other = run({ sender: "build-bot-user", trusted: "build-bot-user", author: "stranger" });
    expect(other.code).toBe(1);
    expect(other.comment).toContain("keys the requests it filed, and #7 was filed by `stranger`");
  });

  test("labeled by a trusted agent, its kind not in tier0.auto: refused on the issue, the label off — a person keys it (10.13.1)", () => {
    for (const auto of [undefined, ["doc-fix"]]) {
      const r = run({ sender: "build-bot-user", trusted: "build-bot-user", auto });
      expect(r.code).toBe(1);
      expect(r.comment).toContain("`tdr-status` is not in this architecture's `tier0.auto`");
      expect(r.calls).toContain("issue edit 7 -R acme/order-desk --remove-label architecture-tier0");
      expect(r.calls).not.toContain("tier0-auto");
    }
  });
});

describe("tier0.auto — the architecture repository keys a trusted agent's request (10.12.0, 10.13.0)", () => {
  const U = { ...REQ, supervision: "unattended" };
  const declare = (auto: any) => { w(".sa-skills/project.json", JSON.stringify({ support: "run", tier0: { auto } })); git("add", "-A"); git("commit", "-q", "-m", "auto"); };
  const inProgress = () => { const f = join(ROOT, "tdr/TDR-001-polling.md");
    writeFileSync(f, readFileSync(f, "utf8").replace("status: Open", "status: In Progress").replace("`Open`\n\n**Initiative", "`In Progress`\n\n**Initiative")); git("commit", "-qam", "wip"); };
  const resolve = (where: string) => issue({ ...U, kind: "tdr-status", evidence: [{ where, note: "the cache is gone" }], fields: { tdr: "TDR-001", to: "Resolved", note: "paid" } });

  test("an unattended issue never carries the key, auto kind or not; the footer says who keys an auto kind", () => {
    expect(T.labelsOf(U)).toEqual(["tier0:tdr-workaround"]);
    expect(T.labelsOf(REQ)).toEqual(["architecture-tier0", "tier0:tdr-workaround"]);
    expect(T.issueBody(U, ["tdr-workaround"])).toContain("the architecture repository keys it itself");
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
    const merged = (c: any) => (c.pr === 5 || (c.sha || "").startsWith("aaaa") ? { ok: true, branch: "main" }
      : c.pr === 9 ? { ok: false, branch: "main", reason: "the pull request was closed without a merge" }
      : { ok: false, wait: true, branch: "main", reason: c.pr ? "the pull request is open" : "main does not contain it (compare: ahead)" });
    expect(T.prepare(ROOT, resolve("hub-api internal/stock/cache.go:42"), { auto: true, merged }).reasons[0]).toMatch(/evidence `owner\/repo#N` \(its pull request\) or `owner\/repo@sha`; none is named/);
    // not merged yet: the request waits, it is not refused
    const w = T.prepare(ROOT, resolve("acme/hub-api#7 internal/stock/cache.go:42"), { auto: true, merged });
    expect(w).toMatchObject({ ok: false, wait: true });
    expect(w.reasons[0]).toBe("acme/hub-api#7 is not merged into acme/hub-api's default branch (main) yet: the pull request is open");
    expect(T.prepare(ROOT, resolve("acme/hub-api@bbbbbbb1 internal/stock/cache.go:42"), { auto: true, merged }).wait).toBe(true);
    // closed without a merge: refused
    const c = T.prepare(ROOT, resolve("acme/hub-api#9"), { auto: true, merged });
    expect(c.wait).toBeUndefined(); expect(c.reasons[0]).toBe("acme/hub-api#9: the pull request was closed without a merge");
    expect(T.prepare(ROOT, resolve("acme/hub-api#5 internal/stock/cache.go:42"), { auto: true, merged })).toMatchObject({ ok: true, from: "In Progress", auto: true });
    expect(T.prepare(ROOT, resolve("acme/hub-api@aaaaaaa1 internal/stock/cache.go:42"), { auto: true, merged })).toMatchObject({ ok: true, from: "In Progress", auto: true });
    // a person's key is not held to it: the person read the request
    expect(T.prepare(ROOT, resolve("hub-api internal/stock/cache.go:42")).ok).toBe(true);
  });

  test("refsOf reads owner/repo@sha and owner/repo#N once each; mergedOnDefault asks GitHub's compare or the pull request", () => {
    expect(T.refsOf([{ where: "acme/hub-api#12 and acme/hub-api@abc1234" }, { where: "acme/hub-api#12" }])).toEqual([{ repo: "acme/hub-api", pr: 12 }, { repo: "acme/hub-api", sha: "abc1234" }]);
    const pr = (tsv: string) => (args: string[]) => ({ status: 0, stderr: "", stdout: args[1].includes("/pulls/") ? `${tsv}\n` : "main\n" });
    const p = { repo: "acme/hub-api", pr: 12 };
    expect(T.mergedOnDefault(p, pr("closed\ttrue\tmain"))).toEqual({ ok: true, branch: "main" });
    expect(T.mergedOnDefault(p, pr("open\tfalse\tmain"))).toEqual({ ok: false, wait: true, branch: "main", reason: "the pull request is open" });
    expect(T.mergedOnDefault(p, pr("closed\tfalse\tmain")).wait).toBeUndefined();
    expect(T.mergedOnDefault(p, pr("closed\ttrue\trelease")).reason).toBe("it targets release, not the default branch main");
    expect(T.commitsOf([{ where: "acme/hub-api@abc1234 a.go:1" }, { where: "acme/hub-api@abc1234 b.go:2 and acme/web@def56789" }, { where: "hub-api@abc1234" }]))
      .toEqual([{ repo: "acme/hub-api", sha: "abc1234" }, { repo: "acme/web", sha: "def56789" }]);
    const gh = (status: string) => (args: string[]) => ({ status: 0, stderr: "", stdout: args[1].includes("/compare/") ? `${status}\n` : "main\n" });
    const c = { repo: "acme/hub-api", sha: "abc1234" };
    expect(T.mergedOnDefault(c, gh("behind"))).toEqual({ ok: true, branch: "main" });
    expect(T.mergedOnDefault(c, gh("identical")).ok).toBe(true);
    expect(T.mergedOnDefault(c, gh("diverged"))).toEqual({ ok: false, wait: true, branch: "main", reason: "main does not contain it (compare: diverged)" });
    expect(T.mergedOnDefault(c, () => ({ status: 1, stdout: "", stderr: "HTTP 404: Not Found" })).reason).toMatch(/could not be read \(HTTP 404/);
  });
});
