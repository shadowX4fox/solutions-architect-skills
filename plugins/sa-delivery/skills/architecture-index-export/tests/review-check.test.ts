// review-check.js — a service pull request held to its build pack: the code checks, and the verdict over the review's
// findings. A synthetic service (Hub API, of the Order Desk architecture) in a temporary git repository; the pack and gh are
// answered in-process.
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createHash } from "crypto";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const R = require("../scripts/review-check.js");
const TMP = join(tmpdir(), `sa-review-check-${process.pid}`);
const SVC = join(TMP, "hub-api");
const REV = "ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12";
const OPENAPI = "openapi: 3.1.0\ninfo:\n  title: Hub API\n  version: 1.1.0\n";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const w = (rel: string, body: string) => { mkdirSync(join(SVC, rel, ".."), { recursive: true }); writeFileSync(join(SVC, rel), body, "utf-8"); };
const git = (...a: string[]) => spawnSync("git", ["-C", SVC, ...a], { encoding: "utf8", env: { ...process.env, GIT_CEILING_DIRECTORIES: TMP } }).stdout.trim();
const commit = (m: string) => { git("add", "-A"); git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", m); };

const packOf = (o: { version?: string; latest?: string; revision?: string; assets?: Record<string, string> } = {}) => async (a: any) => ({
  architecture_version: a.version || o.latest || "1.1.0", pack_revision: o.revision || REV,
  parts: [{ id: "spec", kind: "specification" }, { id: "security", kind: "security" }, { id: "interface:hub-api→stock-ledger", kind: "interface" },
    ...Object.entries(o.assets || { "openapi.yaml": OPENAPI }).map(([t, body]) => ({ id: `asset:${t}`, kind: "asset", title: t, sha256: sha(body) }))],
});
// gh, as GitHub answers an issue of the architecture repository
const issues: Record<string, { title: string; state: string }> = {
  "acme/order-desk#7": { title: "[ESC-003] Hub API: retry budget not documented", state: "open" },
  "acme/order-desk#8": { title: "[ESC-002] closed one", state: "closed" },
  "acme/order-desk#9": { title: "[T0-?] not an escalation", state: "open" },
};
const gh = (args: string[]) => {
  const m = args[1].match(/^repos\/(.+)\/issues\/(\d+)$/), i = m && issues[`${m[1]}#${m[2]}`];
  return i ? { status: 0, stdout: JSON.stringify({ ...i, html_url: `https://github.com/${m![1]}/issues/${m![2]}` }), stderr: "" } : { status: 1, stdout: "", stderr: "HTTP 404" };
};
const codes = (r: any, sev?: string) => r.findings.filter((f: any) => !sev || f.severity === sev).map((f: any) => f.code);
const OK = { reviewed: true, findings: [] };
let base = "";

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(SVC, { recursive: true });
  git("init", "-q", "-b", "main");
  w(".architecture.json", JSON.stringify({ server: "http://idx/mcp", project: "order-desk", component: "hub-api", architecture_version: "1.1.0", pack_revision: REV }));
  w("architecture/openapi.yaml", OPENAPI); w("src/app.ts", "export {}\n");
  commit("base"); base = git("rev-parse", "HEAD");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));
const run = (o: any = {}) => R.check(SVC, { base, architecture: "acme/order-desk", gh, findings: OK, ...o, pack: packOf(o.pack) });

describe("review-check.js — the code checks", () => {
  test("a pull request that keeps the pack, its commits stamped: PASS", async () => {
    w("src/app.ts", "export const x = 1\n"); commit(`feat: x — architecture 1.1.0, pack_revision ${REV.slice(0, 12)}`);
    const r = await run();
    expect(r.status).toBe("PASS");
    expect(r.findings).toEqual([]);
  });

  test("a contract copy edited, missing or unknown; a commit mixing the contracts with code", async () => {
    w("architecture/openapi.yaml", OPENAPI + "  x-local: edited\n"); w("architecture/notes.md", "mine\n"); w("src/app.ts", "export const y = 2\n");
    commit(`edit — architecture 1.1.0 ${REV.slice(0, 8)}`);
    let r = await run();
    expect(r.status).toBe("FAIL");
    expect(codes(r, "blocking")).toEqual(expect.arrayContaining(["asset-modified", "assets-mixed"]));
    expect(codes(r, "warning")).toContain("asset-unknown");
    r = await run({ pack: { assets: { "openapi.yaml": OPENAPI, "ddl.sql": "create table t();\n" } } });
    expect(r.findings.find((f: any) => f.code === "asset-missing").where).toBe("architecture/ddl.sql");
  });

  test("rule 8: a code commit with no stamp warns; a CI-only commit needs none and mixes with nothing", async () => {
    w(".github/workflows/ci.yml", "name: CI\n# TODO(architecture): not a code marker\n"); commit("ci: add CI");
    w("src/app.ts", "// TODO(architecture): retry budget not documented (spec)\nexport {}\n"); w("README.md", "Each open question stays a `TODO(architecture)`.\n"); commit("feat: retry");
    const r = await run();
    const unstamped = r.findings.filter((f: any) => f.code === "commit-unstamped");
    expect(unstamped.length).toBe(1);
    expect(unstamped[0].text).toContain('"feat: retry"');
    expect(r.findings.filter((f: any) => f.code === "todo-added").map((f: any) => f.where)).toEqual(["src/app.ts"]);
    expect(r.status).toBe("PASS");
  });

  test("the binding: behind the latest release, its pack revised, or missing a field", async () => {
    let r = await run({ pack: { latest: "1.2.0", revision: "ff".repeat(32) } });
    expect(codes(r, "warning")).toEqual(expect.arrayContaining(["binding-behind", "pack-revised"]));
    w(".architecture.json", JSON.stringify({ server: "http://idx/mcp", project: "order-desk", component: "hub-api" }));
    r = await run();
    expect(r.findings[0]).toMatchObject({ severity: "blocking", code: "binding-missing" });
  });

  test("the server does not answer: blocking, fails closed", async () => {
    const r = await R.check(SVC, { pack: async () => { throw new Error("HTTP 502"); }, base, gh, findings: OK });
    expect(codes(r, "blocking")).toContain("pack-unreadable");
  });
});

describe("review-check.js — the verdict over the review's findings", () => {
  const f = (o: any) => ({ reviewed: true, findings: [{ rule: 4, severity: "blocking", file: "src/app.ts", line: 3, part: "security", part_line: 12, finding: "lets an unauthenticated caller in", ...o }] });

  test("no findings file, or one not marked reviewed: blocking review-missing", async () => {
    for (const findings of [null, { reviewed: false, findings: [] }, { findings: [] }]) expect(codes(await run({ findings }), "blocking")).toEqual(["review-missing"]);
  });

  test("a blocking finding stands; one that cites no part of the pack is a warning", async () => {
    let r = await run({ findings: f({}) });
    expect(r.status).toBe("FAIL");
    expect(r.findings[0].text).toContain("(pack: security:12)");
    r = await run({ findings: f({ part: "spec-of-another-thing" }) });
    expect(r).toMatchObject({ status: "PASS" });
    expect(codes(r)).toEqual(["review-uncited"]);
  });

  test("cleared only by the open [ESC-…] the finding names and the pull request cites", async () => {
    // named and cited, open: a warning that names it
    let r = await run({ findings: f({ escalation: "acme/order-desk#7" }), body: "Departs from security — see https://github.com/acme/order-desk/issues/7" });
    expect(r.status).toBe("PASS");
    expect(r.findings[0]).toMatchObject({ code: "review-escalated" });
    // named, not cited in the pull request
    r = await run({ findings: f({ escalation: "acme/order-desk#7" }), body: "no reference" });
    expect(r.status).toBe("FAIL");
    expect(r.findings[0].text).toContain("not cited in the pull request");
    // cited, but closed — or not an escalation
    for (const n of [8, 9]) expect((await run({ findings: f({ escalation: `acme/order-desk#${n}` }), body: `acme/order-desk#${n}` })).status).toBe("FAIL");
    // cited by the pull request, not tied to the finding: a body citation alone clears nothing; a bare #7 is this repository's
    expect((await run({ findings: f({}), body: "acme/order-desk#7 and #7" })).status).toBe("FAIL");
    // another repository's issue never counts
    expect((await run({ findings: f({ escalation: "acme/other#7" }), body: "acme/other#7" })).status).toBe("FAIL");
  });

  test("a code finding is never cleared by an escalation", async () => {
    w("architecture/openapi.yaml", "edited\n"); commit(`contracts — 1.1.0 ${REV.slice(0, 8)}`);
    const r = await run({ findings: f({ escalation: "acme/order-desk#7" }), body: "acme/order-desk#7" });
    expect(codes(r, "blocking")).toEqual(["asset-modified"]);
  });

  test("the comment: one marker, blocking first, the way out named on a FAIL", async () => {
    const r = await run({ findings: { reviewed: true, findings: [{ rule: 5, severity: "warning", finding: "no trace context" }, f({}).findings[0]] } });
    const md = R.render(r);
    expect(md.startsWith(R.MARKER)).toBe(true);
    expect(md).toContain("⛔ FAIL");
    expect(md.indexOf("⛔ blocking")).toBeLessThan(md.indexOf("⚠ warning"));
    expect(md).toContain("preview_escalation");
  });
});

describe("architecture-review.yml — the template", () => {
  const yml = readFileSync(join(__dirname, "..", "ci", "service", "architecture-review.yml"), "utf8");
  test("Claude reads the checkout, writes its findings only, runs no shell; a fork fails; the verdict is code's", () => {
    expect(yml).toContain("if: github.event.pull_request.head.repo.full_name != github.repository");
    expect(yml).toContain('--allowedTools "Read(./**),Glob,Grep,Edit(./.sa-review/findings.json),mcp__architecture"');
    expect(yml).toContain('--disallowedTools "Bash,WebFetch,WebSearch"');
    expect(yml).toContain("if: github.event.pull_request.head.repo.full_name != github.repository");
    expect(yml).toContain("exit $verdict");
  });

  test("the pull request never runs its own review: the default branch's file, its code read as data, the result a status on the head (10.16.2)", () => {
    expect(yml).toMatch(/^on:\n  pull_request_target:/m);
    expect(yml).not.toMatch(/^  pull_request:/m);
    // the action's own pattern: the default branch at the root, the pull request as data in pr-head/, read through --add-dir
    expect(yml).toMatch(/- uses: actions\/checkout@v4 .*\n\s+with:\n\s+persist-credentials: false/);
    expect(yml).toMatch(/ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}\n\s+path: pr-head\n\s+fetch-depth: 0\n\s+persist-credentials: false/);
    expect(yml).toContain("--add-dir pr-head");
    expect(yml).toContain("git -C pr-head diff");
    // no OIDC exchange (pull_request_target refuses it): the job's own token
    expect(yml).toContain("github_token: ${{ github.token }}");
    expect(yml).not.toContain("id-token: write");
    expect(yml).toContain("rm -rf .sa-review && mkdir -p .sa-review");
    // the verdict from the pinned plugin, outside the checkout (Bun reads bunfig.toml from its working directory)
    expect(yml).toMatch(/\( cd "\$RUNNER_TEMP" && "\$\{\{ steps\.bun\.outputs\.bun-path \}\}" "\$RUNNER_TEMP\/sa\/plugins\/sa-delivery\/skills\/architecture-index-export\/scripts\/review-check\.js" "\$W\/pr-head" --base "\$BASE" \\\n\s+--server "\$SA_INDEX_MCP_URL"/);
    // the required check is the commit status on the head commit — pending first, the verdict's state, a failure if it never ran
    expect(yml).toContain("statuses: write");
    for (const s of ["state=pending", 'state="$state"', "the review did not finish"]) expect(yml).toContain(s);
    expect((yml.match(/statuses\/\$HEAD" -f state=[^ ]+ -f context="Architecture review"/g) || []).length).toBe(4);
    expect(yml).toContain("name: review\n");   // the job's own check run is not the required context
  });

  test("on a self-hosted runner, Claude never loads the runner user's ~/.claude: its step has a home of its own (10.16.1)", () => {
    for (const f of ["architecture-review.yml", "architecture-build.yml"]) {
      const t = readFileSync(join(__dirname, "..", "ci", "service", f), "utf8");
      const step = t.slice(t.indexOf("uses: anthropics/claude-code-action@v1"), t.indexOf("with:", t.indexOf("uses: anthropics/claude-code-action@v1")));
      expect(step).toContain("HOME: ${{ runner.temp }}/claude-home");
      expect(step).toContain("CLAUDE_CONFIG_DIR: ${{ runner.temp }}/claude-home/.claude");
      expect(t).toContain('mkdir -p');
      expect(t.indexOf('"$RUNNER_TEMP/claude-home/.claude"')).toBeLessThan(t.indexOf("uses: anthropics/claude-code-action@v1"));
    }
    // the review's own Bun: installed in a home of its own, called by its path — the action installs Bun 1.3.14 into $HOME/.bun
    expect(yml).toMatch(/uses: oven-sh\/setup-bun@v2\n\s+id: bun\n\s+env:\n\s+HOME: \$\{\{ runner\.temp \}\}\/bun-home/);
    expect(yml).toContain('"${{ steps.bun.outputs.bun-path }}" "$RUNNER_TEMP/sa/plugins/sa-delivery/skills/architecture-index-export/scripts/review-check.js" "$W/pr-head"');
  });
});
