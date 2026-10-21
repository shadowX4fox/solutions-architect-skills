// ci-setup.js — the CI/CD of an architecture and of a service repository built from it: the workflows from the plugin's
// templates (written, pin moved, never over changes of their own unless named), the binding and the IDE's MCP server, and
// the repositories' settings read through gh. Synthetic repositories (Order Desk, Hub API) in a temporary directory.
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const C = require("../scripts/ci-setup.js");
const TMP = join(tmpdir(), `sa-ci-setup-test-${process.pid}`);
process.env.GIT_CEILING_DIRECTORIES = TMP;
const ARCH = join(TMP, "order-desk"), SVC = join(TMP, "hub-api");
const w = (root: string, rel: string, body: string) => { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), body, "utf-8"); };
const git = (root: string, ...a: string[]) => spawnSync("git", ["-C", root, ...a], { encoding: "utf8" });
const repo = (root: string, slug: string) => { mkdirSync(root, { recursive: true }); git(root, "init", "-q", "-b", "main"); git(root, "remote", "add", "origin", `https://github.com/acme/${slug}.git`); };

// gh as GitHub answers it: per repository its variables, secrets and labels; the workflow permission
type Repo = { vars?: Record<string, string>; secrets?: string[]; labels?: string[]; canPr?: boolean; runners?: { name: string; status: string; labels: string[] }[]; protection?: any };
const calls: string[][] = [];
const fakeGh = (repos: Record<string, Repo>) => (args: string[]) => {
  calls.push(args);
  const ok = (v: any) => ({ status: 0, stdout: JSON.stringify(v), stderr: "" });
  const r = repos[args[args.indexOf("-R") + 1]] || {};
  if (args[0] === "variable" && args[1] === "set") { (r.vars ||= {})[args[2]] = args[args.indexOf("--body") + 1]; return ok(null); }
  if (args[0] === "api" && /^repos\/[^/]+\/[^/]+$/.test(args[1])) return ok({ default_branch: "main" });
  if (args[0] === "api" && args.includes("-X") && args.some((x) => /branches\/main\/protection/.test(x))) return ok(null);
  if (args[0] === "api" && /branches\/main\/protection/.test(args[1])) { const x = repos[args[1].split("/").slice(1, 3).join("/")] || {};
    return x.protection ? ok(x.protection) : { status: 1, stdout: "", stderr: "gh: Branch not protected (HTTP 404)" }; }
  if (args[0] === "api" && /actions\/runners$/.test(args[1])) { const x = repos[args[1].split("/").slice(1, 3).join("/")];
    return x && x.runners ? ok({ runners: x.runners.map((n) => ({ ...n, labels: n.labels.map((name) => ({ name })) })) }) : { status: 1, stdout: "", stderr: "HTTP 404" }; }
  if (args[0] === "variable") return ok(Object.entries(r.vars || {}).map(([name, value]) => ({ name, value })));
  if (args[0] === "secret") return ok((r.secrets || []).map((name) => ({ name })));
  if (args[0] === "label") return ok((r.labels || []).map((name) => ({ name })));
  if (args[0] === "api" && /actions\/permissions\/workflow$/.test(args[1])) return ok({ can_approve_pull_request_reviews: (repos[args[1].split("/").slice(1, 3).join("/")] || {}).canPr ?? true });
  return { status: 1, stdout: "", stderr: "unexpected" };
};
const states = (r: any) => Object.fromEntries(r.rows.map((x: any) => [x.item.split(" — ")[0], x.state]));

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  repo(ARCH, "order-desk"); w(ARCH, "ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n# Order Desk\n");
  repo(SVC, "hub-api");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("ci-setup.js architecture", () => {
  test("the four workflows are written from the templates with the plugin's pin; the index keeps no tag trigger; then current", () => {
    const gh = fakeGh({ "acme/order-desk": { vars: { SA_INDEX_PROJECT_KEY: "order-desk", SA_INDEX_SERVER: "https://idx" }, secrets: ["CLAUDE_CODE_OAUTH_TOKEN"] } });
    let r = C.architecture(ARCH, { gh, version: "9.9.9" });
    expect(states(r)[".github/workflows/architecture-gates.yml"]).toBe("✗");
    r = C.architecture(ARCH, { gh, version: "9.9.9", write: true, runner: "self-hosted,idx" });
    for (const f of ["gates", "release", "handoff", "index"]) expect(readFileSync(join(ARCH, `.github/workflows/architecture-${f}.yml`), "utf8")).toContain("SA_PLUGIN_REF: v9.9.9");
    expect(existsSync(join(ARCH, ".github/workflows/architecture-tier0.yml"))).toBe(false);   // not a RUN team
    const idx = readFileSync(join(ARCH, ".github/workflows/architecture-index.yml"), "utf8");
    expect(idx).not.toMatch(/^\s+tags: \['architecture-v\*'\]/m);
    expect(idx).toContain("  index:\n    runs-on: [self-hosted, idx]");
    expect(readFileSync(join(ARCH, ".github/workflows/architecture-release.yml"), "utf8")).toContain("runs-on: [self-hosted, idx]");
    r = C.architecture(ARCH, { gh, version: "9.9.9", runner: "self-hosted,idx" });
    expect(r.rows.filter((x: any) => x.item.startsWith(".github")).every((x: any) => x.state === "✓")).toBe(true);
    expect(states(r)["variable SA_INDEX_PROJECT_KEY = order-desk"]).toBe("✓");
    expect(r.rows.find((x: any) => x.item.startsWith("variable SA_HANDOFF_AUTOMERGE"))).toMatchObject({ state: "·", fix: "gh variable set SA_HANDOFF_AUTOMERGE -R acme/order-desk --body true" });
  });

  test("a pin of another version moves; a workflow with changes of its own is kept until it is named in --replace", () => {
    const gh = fakeGh({});
    C.architecture(ARCH, { gh, version: "9.9.9", write: true });
    const gates = join(ARCH, ".github/workflows/architecture-gates.yml"), handoff = join(ARCH, ".github/workflows/architecture-handoff.yml");
    writeFileSync(gates, readFileSync(gates, "utf8").replace("SA_PLUGIN_REF: v9.9.9", "SA_PLUGIN_REF: v1.0.0"));
    writeFileSync(handoff, readFileSync(handoff, "utf8") + "# our own step\n");
    let r = C.architecture(ARCH, { gh, version: "9.9.9" });
    expect(r.rows.find((x: any) => x.item.includes("architecture-gates.yml")).item).toContain("pinned to another plugin version");
    expect(r.rows.find((x: any) => x.item.includes("architecture-handoff.yml")).state).toBe("!");
    C.architecture(ARCH, { gh, version: "9.9.9", write: true });
    expect(readFileSync(gates, "utf8")).toContain("SA_PLUGIN_REF: v9.9.9");
    expect(readFileSync(handoff, "utf8")).toContain("# our own step");
    r = C.architecture(ARCH, { gh, version: "9.9.9", write: true, replace: ["architecture-handoff.yml"] });
    expect(readFileSync(handoff, "utf8")).not.toContain("# our own step");
    expect(r.rows.find((x: any) => x.item.includes("architecture-handoff.yml")).item).toContain("replaced with the template");
  });

  test("a RUN team: the Tier 0 workflow, its labels, the trusted agents tier0.auto needs, the dispatch token SA_SERVICE_REPOS needs", () => {
    w(ARCH, ".sa-skills/project.json", JSON.stringify({ support: "run", tier0: { auto: ["tdr-status"] } }));
    const gh = fakeGh({ "acme/order-desk": { vars: { SA_SERVICE_REPOS: "acme/hub-api" }, labels: ["architecture-tier0"], canPr: false } });
    const r = C.architecture(ARCH, { gh, version: "9.9.9", write: true });
    expect(existsSync(join(ARCH, ".github/workflows/architecture-tier0.yml"))).toBe(true);
    const s = states(r);
    expect(s["variable SA_TIER0_TRUSTED_AGENTS"]).toBe("✗");
    expect(s["secret SA_DISPATCH_TOKEN"]).toBe("✗");
    expect(s["setting"]).toBe("✗");
    expect(r.rows.find((x: any) => x.item.startsWith("labels")).item).toMatch(/^labels — 17 of 18 missing: architecture-escalation/);
  });

  test("no GitHub origin: said, and nothing read from gh", () => {
    git(ARCH, "remote", "set-url", "origin", "https://gitlab.example.com/acme/order-desk.git");
    const r = C.architecture(ARCH, { gh: () => { throw new Error("gh called"); }, version: "9.9.9" });
    expect(r.rows.some((x: any) => /not a GitHub repository/.test(x.item))).toBe(true);
  });
});

describe("ci-setup.js service", () => {
  const svcGh = (svc: Repo = {}, arch: Repo = {}) => fakeGh({ "acme/hub-api": svc, "acme/order-desk": arch });

  test("the binding and the IDE's MCP server: written, other servers kept, the recorded version never touched", () => {
    w(SVC, ".mcp.json", JSON.stringify({ mcpServers: { docs: { type: "http", url: "https://docs/mcp" } } }));
    w(SVC, ".architecture.json", JSON.stringify({ project: "order-desk", architecture_version: "1.0.0", pack_revision: "abc" }));
    let r = C.service(SVC, { gh: svcGh(), attended: true });
    expect(r.rows[0]).toMatchObject({ state: "✗", item: ".architecture.json — no server, component" });
    r = C.service(SVC, { gh: svcGh(), attended: true, write: true, server: "https://idx/mcp", component: "hub-api" });
    expect(JSON.parse(readFileSync(join(SVC, ".architecture.json"), "utf8"))).toEqual({ project: "order-desk", architecture_version: "1.0.0", pack_revision: "abc", server: "https://idx/mcp", component: "hub-api" });
    expect(JSON.parse(readFileSync(join(SVC, ".mcp.json"), "utf8")).mcpServers).toEqual({ docs: { type: "http", url: "https://docs/mcp" }, architecture: { type: "http", url: "https://idx/mcp" } });
    expect(existsSync(join(SVC, ".github/workflows/architecture-build.yml"))).toBe(false);   // attended: no build workflow
  });

  test("unattended: the build workflow, the merge workflow on the named test workflow, and the secrets and variables they read", () => {
    const opts = { server: "http://localhost:18080/mcp", project: "order-desk", component: "hub-api", architecture: "acme/order-desk", merge: true };
    let r = C.service(SVC, { gh: svcGh(), ...opts, write: true });
    expect(r.rows.some((x: any) => x.state === "✗" && /no test workflow named/.test(x.item))).toBe(true);
    expect(JSON.parse(readFileSync(join(SVC, ".architecture.json"), "utf8")).supervision).toBe("unattended");
    w(SVC, ".github/workflows/tests.yml", "name: Unit tests\non: [pull_request]\n");
    r = C.service(SVC, { gh: svcGh({ secrets: ["CLAUDE_CODE_OAUTH_TOKEN"] }, { vars: { SA_SERVICE_REPOS: "acme/other" }, secrets: [] }), ...opts, tests: "Unit tests", write: true });
    expect(readFileSync(join(SVC, ".github/workflows/architecture-build-merge.yml"), "utf8")).toContain('workflows: ["Unit tests"]');
    expect(existsSync(join(SVC, ".github/workflows/architecture-build.yml"))).toBe(true);
    const s = states(r);
    expect(s["secret SA_BUILD_TOKEN"]).toBe("✗");
    expect(s["variable SA_BUILD_RUNS_ON"]).toBe("✗");
    expect(s["variable SA_BUILD_AGENT"]).toBe("✗");
    const listed = r.rows.find((x: any) => /SA_SERVICE_REPOS does not list/.test(x.item));
    expect(listed.fix).toBe("gh variable set SA_SERVICE_REPOS -R acme/order-desk --body acme/other,acme/hub-api");
    expect(r.rows.some((x: any) => /no workflow named/.test(x.item))).toBe(false);
  });

  test("attaching an unattended build with --merge is full auto: --settings sets every required variable on both sides, never a secret", () => {
    w(SVC, ".github/workflows/tests.yml", "name: Tests\non: [pull_request]\n");
    const svc: Repo = { secrets: ["CLAUDE_CODE_OAUTH_TOKEN"], runners: [{ name: "box-1", status: "online", labels: ["self-hosted", "Linux", "idx"] }] };
    const arch: Repo = { vars: { SA_SERVICE_REPOS: "acme/other", SA_TIER0_TRUSTED_AGENTS: "ci-bot" }, secrets: [] };
    const gh = fakeGh({ "acme/hub-api": svc, "acme/order-desk": arch });
    const opts = { server: "http://localhost:18080/mcp", project: "order-desk", component: "hub-api", architecture: "acme/order-desk", merge: true, tests: "Tests", write: true };
    // without the values: required, with the command to run — and nothing set
    let r = C.service(SVC, { gh, ...opts });
    let s = states(r);
    expect(s["variable SA_BUILD_RUNS_ON"]).toBe("✗");
    expect(s["acme/order-desk SA_HANDOFF_AUTOMERGE"]).toBe("✗");
    expect(s["variable SA_BUILD_AGENT"]).toBe("✗");
    // the values, then --settings
    calls.length = 0;
    r = C.service(SVC, { gh, ...opts, agent: "hub-builder", runsOn: "self-hosted,idx", settings: true });
    const set = calls.filter((c) => c[0] === "variable" && c[1] === "set").map((c) => `${c[4]} ${c[2]}=${c[6]}`);
    expect(set).toEqual(expect.arrayContaining([
      'acme/hub-api SA_BUILD_RUNS_ON=["self-hosted","idx"]', "acme/hub-api SA_BUILD_AGENT=hub-builder",
      "acme/order-desk SA_SERVICE_REPOS=acme/other,acme/hub-api", "acme/order-desk SA_TIER0_TRUSTED_AGENTS=ci-bot,hub-builder", "acme/order-desk SA_HANDOFF_AUTOMERGE=true"]));
    expect(calls.some((c) => c[0] === "secret" && c[1] === "set")).toBe(false);
    s = states(r);
    expect(s["runner [self-hosted, idx]"]).toBe("✓");
    expect(r.rows.find((x: any) => x.item.startsWith("variable SA_BUILD_AGENT")).item).toMatch(/— set$/);
    expect(s["secret SA_BUILD_TOKEN"]).toBe("✗");                        // the user's, in the prompt
    expect(s["acme/order-desk has no SA_DISPATCH_TOKEN"]).toBe("✗");
    // run again: what was set reads back as done
    r = C.service(SVC, { gh, ...opts });
    s = states(r);
    for (const k of ["variable SA_BUILD_AGENT = hub-builder", "acme/order-desk SA_SERVICE_REPOS lists acme/hub-api", "acme/order-desk SA_TIER0_TRUSTED_AGENTS trusts hub-builder", "acme/order-desk SA_HANDOFF_AUTOMERGE = true"]) expect(s[k]).toBe("✓");
  });

  test("attended with --review: the review workflow pinned, its variables, and the required check on the default branch", () => {
    const svc: Repo = { secrets: ["CLAUDE_CODE_OAUTH_TOKEN"], runners: [{ name: "box-2", status: "online", labels: ["self-hosted", "idx"] }] };
    const gh = fakeGh({ "acme/hub-api": svc, "acme/order-desk": {} });
    const opts = { server: "http://localhost:18080/mcp", project: "order-desk", component: "hub-api", architecture: "acme/order-desk", attended: true, review: true, version: "9.9.9", write: true };
    let r = C.service(SVC, { gh, ...opts });
    const yml = readFileSync(join(SVC, ".github/workflows/architecture-review.yml"), "utf8");
    expect(yml).toContain("SA_PLUGIN_REF: v9.9.9");
    expect(existsSync(join(SVC, ".github/workflows/architecture-build.yml"))).toBe(false);   // attended: no build
    expect(JSON.parse(readFileSync(join(SVC, ".architecture.json"), "utf8")).supervision).toBeUndefined();
    let s = states(r);
    expect(s["variable SA_REVIEW_RUNS_ON"]).toBe("✗");
    expect(s["variable SA_ARCHITECTURE_REPO"]).toBe("✗");
    const prot = (x: any) => r.rows.find((y: any) => y.item.startsWith("branch protection"));
    expect(prot(r)).toMatchObject({ state: "✗", item: expect.stringContaining("not required (the branch is not protected)") });
    expect(r.rows.some((x: any) => /SA_SERVICE_REPOS|SA_BUILD_TOKEN|SA_HANDOFF_AUTOMERGE/.test(x.item))).toBe(false);  // the unattended pair's, not this
    calls.length = 0;
    r = C.service(SVC, { gh, ...opts, runsOn: "self-hosted,idx", settings: true });
    expect(calls.some((c) => c.join(" ") === "api -X PUT repos/acme/hub-api/branches/main/protection -F required_status_checks[strict]=false -F required_status_checks[contexts][]=Architecture review -F enforce_admins=true -F required_pull_request_reviews=null -F restrictions=null")).toBe(true);
    expect(calls.filter((c) => c[0] === "variable" && c[1] === "set").map((c) => `${c[2]}=${c[6]}`)).toEqual(expect.arrayContaining(['SA_REVIEW_RUNS_ON=["self-hosted","idx"]', "SA_ARCHITECTURE_REPO=acme/order-desk"]));
    s = states(r);
    expect(s["runner [self-hosted, idx]"]).toBe("✓");
    expect(r.rows.find((y: any) => y.item.startsWith("branch protection")).item).toBe('branch protection — "Architecture review" required, enforced for admins on main — set');
    // a protection that already requires checks: the review is added to them, nothing else touched
    svc.protection = { required_status_checks: { contexts: ["Tests"], checks: [{ context: "Tests" }] } };
    calls.length = 0;
    C.service(SVC, { gh, ...opts, settings: true });
    expect(calls.filter((c) => c.includes("-X")).map((c) => c.join(" "))).toEqual(["api -X POST repos/acme/hub-api/branches/main/protection/required_status_checks/contexts -f contexts[]=Architecture review"]);
    svc.protection = { required_status_checks: { contexts: ["Tests", "Architecture review"] } };
    expect(C.service(SVC, { gh, ...opts }).rows.find((y: any) => y.item.startsWith("branch protection"))).toMatchObject({ state: "✓", item: 'branch protection — "Architecture review" required on main' });
  });

  test("a self-hosted runner that is not registered, or offline, is a required row", () => {
    const gh = (runners: any) => fakeGh({ "acme/hub-api": { vars: { SA_BUILD_RUNS_ON: '["self-hosted","idx"]' }, runners }, "acme/order-desk": {} });
    const opts = { server: "http://localhost:18080/mcp", project: "order-desk", component: "hub-api", write: true };
    expect(C.service(SVC, { gh: gh([]), ...opts }).rows.find((x: any) => x.item.startsWith("runner")).item).toContain("none registered on this repository");
    expect(C.service(SVC, { gh: gh([{ name: "box-1", status: "offline", labels: ["self-hosted", "idx"] }]), ...opts }).rows.find((x: any) => x.item.startsWith("runner"))).toMatchObject({ state: "✗", item: expect.stringContaining("box-1 offline") });
  });
});
