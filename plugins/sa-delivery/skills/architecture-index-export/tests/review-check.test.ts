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

const packOf = (o: { version?: string; latest?: string; revision?: string; assets?: Record<string, string>; deps?: Record<string, string> } = {}) => async (a: any) => ({
  architecture_version: a.version || o.latest || "1.1.0", pack_revision: o.revision || REV,
  parts: [{ id: "spec", kind: "specification" }, { id: "security", kind: "security" }, { id: "interface:hub-api→stock-ledger", kind: "interface" },
    ...Object.entries(o.assets || { "openapi.yaml": OPENAPI }).map(([t, body]) => ({ id: `asset:${t}`, kind: "asset", title: t, sha256: sha(body) })),
    ...Object.entries(o.deps || {}).map(([k, body]) => ({ id: `dependency:${k}`, kind: "dependency", title: k, provider: k.split("/")[0], sha256: sha(body) }))],
});
// gh, as GitHub answers an issue of the architecture repository
const issues: Record<string, { title: string; state: string; state_reason?: string; repository_url?: string }> = {
  "acme/order-desk#7": { title: "[ESC-003] Hub API: retry budget not documented", state: "open" },
  "acme/order-desk#8": { title: "[ESC-002] closed one", state: "closed" },
  "acme/order-desk#9": { title: "[T0-?] not an escalation", state: "open" },
  "acme/order-desk#10": { title: "[ESC-004] moved away", state: "open", repository_url: "https://api.github.com/repos/acme/elsewhere" },
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

  test("a contract copy outside architecture/ is blocked — kept as a byte copy, or a former copy changed with code (#23)", async () => {
    w("contracts/hub/openapi.yaml", OPENAPI); commit(`chore: client copy — architecture 1.1.0 ${REV.slice(0, 8)}`);
    let r = await run();
    expect(r.status).toBe("FAIL");
    expect(r.findings.filter((f: any) => f.code === "asset-outside").map((f: any) => f.where)).toEqual(["contracts/hub/openapi.yaml"]);
    base = git("rev-parse", "HEAD");
    w("contracts/hub/openapi.yaml", OPENAPI + "  x-client: regenerated\n"); w("src/app.ts", "export const z = 3\n");
    commit(`feat: z — architecture 1.1.0 ${REV.slice(0, 8)}`);
    r = await run();
    const out = r.findings.filter((f: any) => f.code === "asset-outside");
    expect(out.length).toBe(1);
    expect(out[0].text).toContain("was a copy of openapi.yaml");
    expect(codes(r, "blocking")).not.toContain("assets-mixed");
  });

  test("a dependency contract is held like its own: at architecture/deps/<provider>/, byte for byte, committed alone, never copied elsewhere", async () => {
    const LEDGER = "openapi: 3.1.0\ninfo:\n  title: Stock Ledger\n  version: 2.0.0\n";
    const pack = { deps: { "stock-ledger/openapi.yaml": LEDGER } };
    let r = await run({ pack });
    expect(r.findings.find((f: any) => f.code === "asset-missing").where).toBe("architecture/deps/stock-ledger/openapi.yaml");
    w("architecture/deps/stock-ledger/openapi.yaml", LEDGER); commit(`architecture: contracts 1.1.0 (pack_revision ${REV.slice(0, 12)})`);
    base = git("rev-parse", "HEAD");
    r = await run({ pack });
    expect(r.status).toBe("PASS");
    w("architecture/deps/stock-ledger/openapi.yaml", LEDGER + "  x-mine: 1\n"); w("architecture/deps/old-svc/openapi.yaml", "x\n");
    w("src/client/ledger.yaml", LEDGER); w("src/app.ts", "export const w = 4\n");
    commit(`feat: w — architecture 1.1.0 ${REV.slice(0, 8)}`);
    r = await run({ pack });
    expect(codes(r, "blocking")).toEqual(expect.arrayContaining(["asset-modified", "assets-mixed", "asset-outside"]));
    expect(r.findings.find((f: any) => f.code === "asset-outside").where).toBe("src/client/ledger.yaml");
    expect(r.findings.filter((f: any) => f.code === "asset-unknown").map((f: any) => f.where)).toEqual(["architecture/deps/old-svc/openapi.yaml"]);
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
    expect(r.status).toBe("HELD");
    expect(r.findings[0]).toMatchObject({ code: "review-escalated" });
    // named, not cited in the pull request
    r = await run({ findings: f({ escalation: "acme/order-desk#7" }), body: "no reference" });
    expect(r.status).toBe("FAIL");
    expect(r.findings[0].text).toContain("not cited in the pull request");
    // cited, but closed — or not an escalation
    for (const n of [8, 9, 10]) expect((await run({ findings: f({ escalation: `acme/order-desk#${n}` }), body: `acme/order-desk#${n}` })).status).toBe("FAIL");
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

  test("the review speaks the architecture's language — SA_DOC_LANGUAGE — and writes the status's one line (10.17.0)", async () => {
    const r = await run({ findings: { reviewed: true, findings: [{ rule: 5, severity: "warning", finding: "sin contexto de traza" }, f({}).findings[0]] }, lang: "es" });
    const md = R.render(r);
    expect(md).toContain("### Revisión de arquitectura — ⛔ FAIL");
    expect(md).toContain("| | Control | Dónde | Hallazgo |");
    expect(md).toContain("⛔ bloqueante");
    expect(md).toContain("regla 5 — sin contexto de traza");
    expect(md).toContain("`[ESC-…]`");
    expect(R.statusLine(r)).toBe("1 bloqueante(s) · 1 advertencia(s) · 0 nota(s)");
    expect(R.statusLine(await run({ findings: OK }))).toBe("0 blocking · 0 warning · 0 note");
  });
});

describe("review-check.js --recheck — a PASS an escalation cleared, held to it again (10.18.0)", () => {
  const f = { reviewed: true, findings: [{ rule: 4, severity: "blocking", file: "src/app.ts", line: 3, part: "security", finding: "lets a caller in", escalation: "acme/order-desk#7" }] };
  // GitHub for the service repository: its open pull requests and their review comments; the architecture's issues as above
  const service = (prs: { number: number; head: string; comment?: string; planted?: { id: number; author: string; body: string } }[], calls: string[][]) => (args: string[]) => {
    calls.push(args);
    const path = args.find((x) => x.startsWith("repos/")) || "";
    if (/^repos\/acme\/hub-api\/pulls\?/.test(path)) return { status: 0, stdout: prs.map((p) => JSON.stringify({ number: p.number, head: p.head })).join("\n"), stderr: "" };
    const c = path.match(/^repos\/acme\/hub-api\/issues\/(\d+)\/comments/);
    if (c) { const p = prs.find((x) => x.number === Number(c[1]));
      const cs = p ? [...(p.planted ? [p.planted] : []), ...(p.comment ? [{ id: 500 + p.number, body: p.comment, author: R.REVIEW_BOT }] : [])] : [];
      return { status: 0, stdout: cs.map((x) => JSON.stringify(x)).join("\n"), stderr: "" }; }
    if (/statuses|comments\/\d+$/.test(path)) return { status: 0, stdout: "{}", stderr: "" };
    return gh(args);
  };

  test("an open escalation holds the pull request: HELD, pending, and the comment says it waits for the architect (10.19.0)", async () => {
    const r = await run({ findings: f, body: "acme/order-desk#7" });
    expect(r.status).toBe("HELD");
    expect(R.statusLine(r)).toBe("waiting for acme/order-desk#7 · 0 blocking · 1 warning · 0 note");
    const md = R.render(r);
    expect(md).toContain("### Architecture review — ⏸ HELD");
    expect(md).toContain("the status stays pending until then");
    expect(md).not.toContain("A blocking finding is cleared");
    const es = await run({ findings: f, body: "acme/order-desk#7", lang: "es" });
    expect(R.render(es)).toContain("### Revisión de arquitectura — ⏸ EN ESPERA");
    expect(R.statusLine(es)).toBe("en espera de acme/order-desk#7 · 0 bloqueante(s) · 1 advertencia(s) · 0 nota(s)");
    // a blocking finding the escalation does not cover still fails, whatever else it covers
    const both = { reviewed: true, findings: [f.findings[0], { ...f.findings[0], line: 9, escalation: null }] };
    expect((await run({ findings: both, body: "acme/order-desk#7" })).status).toBe("FAIL");
  });

  test("the HELD verdict records the escalations it stands on and the head; a FAIL, or a PASS without one, records none", async () => {
    const r = await run({ findings: f, body: "acme/order-desk#7", runUrl: "https://ci/run/1" });
    expect(r).toMatchObject({ status: "HELD", escalations: ["acme/order-desk#7"], head: git("rev-parse", "HEAD") });
    expect(R.render(r)).toContain(`${R.ESCALATIONS}{"head":"${r.head}","refs":["acme/order-desk#7"],"run":"https://ci/run/1"} -->`);
    expect(R.render(await run({ findings: OK }))).not.toContain(R.ESCALATIONS);
    expect(R.render(await run({ findings: f, body: "nothing" }))).not.toContain(R.ESCALATIONS);
  });

  test("an escalation closed: the status fails on the head, the comment says why and drops the record; open, or another head: untouched", async () => {
    const pass = async (ref: string) => R.render(await run({ findings: { ...f, findings: [{ ...f.findings[0], escalation: ref }] }, body: ref, head: "h1", runUrl: "https://ci/run/1" }));
    const open = await pass("acme/order-desk#7");
    issues["acme/order-desk#11"] = { title: "[ESC-005] answered", state: "open" };
    const closed = await pass("acme/order-desk#11");
    issues["acme/order-desk#11"].state = "closed";
    const calls: string[][] = [];
    const res = await R.recheck("acme/hub-api", { gh: service([{ number: 1, head: "h1", comment: open }, { number: 2, head: "h1", comment: closed }, { number: 3, head: "h2", comment: closed }, { number: 4, head: "h1" }], calls), runUrl: "https://ci/recheck" });
    expect(res.map((x: any) => `${x.pr}:${x.state}`)).toEqual(["1:covered", "2:failed", "3:skipped"]);
    const status = calls.find((c) => c.includes("repos/acme/hub-api/statuses/h1"))!;
    expect(status).toEqual(expect.arrayContaining(["state=failure", "context=Architecture review", "target_url=https://ci/run/1"]));
    expect(status.find((x) => x.startsWith("description="))).toBe("description=acme/order-desk#11 closed — the release that answered it is the one to build");
    const patch = calls.find((c) => c.includes("repos/acme/hub-api/issues/comments/502"))!, body = patch.find((x) => x.startsWith("body="))!.slice(5);
    expect(body.startsWith(`${R.MARKER}\n> ⛔ **The escalation this review stood on no longer covers it**`)).toBe(true);
    expect(body).not.toContain(R.ESCALATIONS);
    expect(body).toContain("### Architecture review — ⛔ FAIL");
    expect(body).not.toContain("⏸");
    expect(body).not.toContain("Nothing blocks");   // the HELD paragraph goes with the heading (10.19.1)
    expect(calls.filter((c) => c.some((x) => x.includes("/statuses/"))).length).toBe(1);   // pull request 2's only
    expect(calls.filter((c) => c.some((x) => /comments\/50[134]$/.test(x)))).toEqual([]);
    delete issues["acme/order-desk#11"];
  });

  test("only the review's own comment is read: a marker comment from another author, placed first, is neither read nor patched (#19)", async () => {
    const pass = async (ref: string) => R.render(await run({ findings: { ...f, findings: [{ ...f.findings[0], escalation: ref }] }, body: ref, head: "h1" }));
    const real = await pass("acme/order-desk#7");                   // open: the real review is covered
    issues["acme/order-desk#11"] = { title: "[ESC-005] answered", state: "closed" };
    const planted = { id: 999, author: "mallory", body: R.render({ status: "HELD", lang: "en", head: "h1", run: null, escalations: ["acme/order-desk#11"], binding: {}, findings: [] }) };   // a record of a closed escalation
    const calls: string[][] = [];
    const res = await R.recheck("acme/hub-api", { gh: service([{ number: 1, head: "h1", comment: real, planted }], calls) });
    expect(res.map((x: any) => `${x.pr}:${x.state}`)).toEqual(["1:covered"]);
    expect(calls.filter((c) => c.some((x) => /statuses|comments\/999$/.test(x)))).toEqual([]);
    // the planted comment alone: nothing to re-check, nothing written
    calls.length = 0;
    expect(await R.recheck("acme/hub-api", { gh: service([{ number: 1, head: "h1", planted }], calls) })).toEqual([]);
    expect(calls.filter((c) => c.includes("-X") || c.some((x) => x.includes("/statuses/")))).toEqual([]);
    // another identity writes the comment: --author names it
    expect((await R.recheck("acme/hub-api", { gh: service([{ number: 1, head: "h1", planted }], calls), author: "mallory", dryRun: true })).map((x: any) => x.state)).toEqual(["failed"]);
    delete issues["acme/order-desk#11"];
  });

  test("a finding that cites a rejected escalation: the footer says fix the code, never escalate again (10.19.2)", async () => {
    issues["acme/order-desk#13"] = { title: "[ESC-007] refused", state: "closed", state_reason: "not_planned" };
    const r = await run({ findings: { ...f, findings: [{ ...f.findings[0], escalation: "acme/order-desk#13" }] }, body: "acme/order-desk#13", lang: "es" });
    expect(r).toMatchObject({ status: "FAIL", rejected: ["acme/order-desk#13"] });
    const md = R.render(r);
    expect(md).toContain("El arquitecto rechazó `acme/order-desk#13`: la desviación no se acepta.");
    expect(md).not.toContain("preview_escalation");
    // a FAIL with no rejection keeps the way through an escalation
    expect(R.render(await run({ findings: f, body: "nothing" }))).toContain("preview_escalation");
    delete issues["acme/order-desk#13"];
  });

  test("closed as not planned is a rejection: the code is the way out, said once, no colon chain (10.19.1)", async () => {
    issues["acme/order-desk#12"] = { title: "[ESC-006] refused", state: "closed", state_reason: "not_planned" };
    const at = R.render({ status: "HELD", lang: "es", head: "h1", run: null, escalations: ["acme/order-desk#12"], binding: {}, findings: [] });
    const calls: string[][] = [];
    await R.recheck("acme/hub-api", { gh: service([{ number: 1, head: "h1", comment: at }], calls), lang: "es" });
    const desc = calls.find((c) => c.some((x) => x.includes("/statuses/")))!.find((x) => x.startsWith("description="))!;
    expect(desc).toBe("description=acme/order-desk#12 rechazada — la desviación no se acepta; corrija el código");
    const body = calls.find((c) => c.includes("-X"))!.find((x) => x.startsWith("body="))!;
    expect(body).toContain("**El arquitecto rechazó la desviación en la que se apoyaba esta revisión**");
    expect(body).not.toContain("release que la respondió");
    delete issues["acme/order-desk#12"];
  });

  test("transferred, deleted or retitled away from [ESC-…]: each no longer covers; --dry-run writes nothing", async () => {
    const at = (ref: string) => R.render({ status: "HELD", lang: "es", head: "h1", run: null, escalations: [ref], binding: {}, findings: [] });
    for (const [n, why] of [["10", "transferida a acme/elsewhere"], ["99", "no existe"], ["9", "no es una escalación"]]) {
      const calls: string[][] = [];
      const res = await R.recheck("acme/hub-api", { gh: service([{ number: 1, head: "h1", comment: at(`acme/order-desk#${n}`) }], calls), lang: "es", dryRun: true });
      expect(res[0]).toMatchObject({ state: "failed", why: expect.stringContaining(why) });
      expect(calls.filter((c) => c.includes("-X") || c.some((x) => x.includes("statuses")))).toEqual([]);
    }
  });
});

describe("architecture-escalations.yml — the architecture repository's side", () => {
  const yml = readFileSync(join(__dirname, "..", "ci", "architecture-escalations.yml"), "utf8");
  test("a failed dispatch is an error and fails the run, after every repository was tried (#20)", () => {
    expect(yml).toContain('::error::$r: the dispatch failed');
    expect(yml).toContain("failed=1; fi\n          done\n          exit $failed");
  });

  test("an [ESC-…] issue closed, transferred, deleted or retitled away dispatches architecture-escalation-closed to SA_SERVICE_REPOS", () => {
    expect(yml).toContain("types: [closed, edited, transferred, deleted]");
    expect(yml).toContain("startsWith(github.event.changes.title.from, '[ESC-') && !startsWith(github.event.issue.title, '[ESC-')");
    expect(yml).toContain("GH_TOKEN: ${{ secrets.SA_DISPATCH_TOKEN }}");
    expect(yml).toContain("event_type=architecture-escalation-closed");
    expect(yml).toContain("permissions: {}");
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
    expect(yml).toContain("if: github.event_name == 'pull_request_target'");
    // HELD (exit 3) is a pending status and a finished step; FAIL stays a failure (10.19.0)
    expect(yml).toContain('state=$(case "$verdict" in 0) echo success ;; 3) echo pending ;; *) echo failure ;; esac)');
    expect(yml).toContain('[ "$verdict" -eq 3 ] && exit 0\n          exit $verdict');
  });

  test("the re-check: a closed escalation's dispatch and the hourly sweep run review-check.js --recheck, no model, no checkout (10.18.0)", () => {
    expect(yml).toMatch(/  repository_dispatch:\n    types: \[architecture-escalation-closed\]/);
    expect(yml).toMatch(/  schedule:\n    - cron: '23 \* \* \* \*'/);
    expect(yml).toContain("GitHub disables a public repository's schedule after 60 days without");   // #20
    expect(yml).toContain(`select(.user.login == "github-actions[bot]" and (.body | startswith("<!-- sa-architecture-review -->")))`);   // #19
    const job = yml.slice(yml.indexOf("  recheck:"), yml.indexOf("  review:\n"));
    expect(job).toContain("if: github.event_name != 'pull_request_target'");
    expect(job).toContain('--recheck "$GITHUB_REPOSITORY"');
    expect(job).not.toContain("claude-code-action");
    expect(job).not.toContain("actions/checkout");
    expect(yml).toContain("group: architecture-review-${{ github.event.pull_request.number || 'recheck' }}");
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
