// architecture-handoff.yml's last step — the kit's pull request, and SA_HANDOFF_AUTOMERGE (10.14.0): merged here once the
// kit gate and the drift gate pass, then architecture-index.yml dispatched, since a GITHUB_TOKEN merge starts no push
// workflow. The step's script is cut from the template and run in a temporary git repository against shims: `bun` answers
// each script by name, `gh` logs and prints a pull request URL, `git push` and `git remote set-url` are recorded only.
import { describe, test, expect, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

const TMP = join(tmpdir(), `sa-handoff-wf-${process.pid}`);
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const yml = readFileSync(join(__dirname, "..", "ci", "architecture-handoff.yml"), "utf8");
const lines = yml.split("\n");
const at = lines.findIndex((l) => l.includes("- name: Open the handoff pull request"));
const from = lines.findIndex((l, i) => i > at && /^\s+run: \|$/.test(l)) + 1;
const indent = lines[from].match(/^\s*/)![0].length;
const endAt = lines.findIndex((l, i) => i >= from && l.trim() !== "" && l.match(/^\s*/)![0].length < indent);
const script = lines.slice(from, endAt < 0 ? undefined : endAt).map((l) => l.slice(indent)).join("\n");

let k = 0;
const realBun = process.execPath, ciText = join(__dirname, "..", "..", "..", "scripts", "shared", "ci-text.js");
const run = (o: { automerge?: string; drift?: number; changed?: boolean; dispatch?: number; lang?: string }) => {
  const dir = join(TMP, `r-${++k}`), bin = join(dir, ".bin"), log = join(dir, "calls.log");
  mkdirSync(join(dir, "handoffs"), { recursive: true }); mkdirSync(bin, { recursive: true });
  const git = (...a: string[]) => spawnSync("git", ["-C", dir, ...a], { encoding: "utf8", env: { ...process.env, GIT_CEILING_DIRECTORIES: TMP } });
  writeFileSync(join(dir, "ARCHITECTURE.md"), `<!-- DOC_LANGUAGE: ${o.lang || "en"} -->\n# Order Desk\n`);
  writeFileSync(join(dir, "handoffs", "README.md"), "kit v1\n");
  git("init", "-q", "-b", "main"); git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "base");
  git("add", "-A"); git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "kit");
  if (o.changed !== false) writeFileSync(join(dir, "handoffs", "README.md"), "kit v2\n");
  const realGit = spawnSync("bash", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
  writeFileSync(join(bin, "git"), `#!/bin/bash
case "$1 $2" in "remote set-url"|"push -u") echo "git $*" >> "${log}"; exit 0;; esac
exec "${realGit}" "$@"
`, { mode: 0o755 });
  // the messages are the real ones (ci-text.js, in the architecture's language); every other script is answered by name
  writeFileSync(join(bin, "bun"), `#!/bin/bash
[ "$(basename "$1")" = ci-text.js ] && { shift; exec "${realBun}" "${ciText}" "$@"; }
echo "bun $(basename "$1")" >> "${log}"
case "$(basename "$1")" in kit-drift.js) exit ${o.drift ?? 0};; snapshot.js) echo "Order Desk v1.1.0"; exit 0;; esac
exit 0
`, { mode: 0o755 });
  writeFileSync(join(bin, "gh"), `#!/bin/bash
echo "gh $*" >> "${log}"
[ "$1 $2" = "pr create" ] && echo "https://github.com/acme/order-desk/pull/9"
[ "$1 $2" = "workflow run" ] && exit ${o.dispatch ?? 0}
exit 0
`, { mode: 0o755 });
  const r = spawnSync("bash", ["-e", "-c", script], { encoding: "utf8", cwd: dir,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GIT_CEILING_DIRECTORIES: TMP, GH_TOKEN: "t", TAG: "architecture-v1.1.0",
           AUTOMERGE: o.automerge ?? "", SA_SKILLS_DIR: "/sa", GITHUB_REPOSITORY: "acme/order-desk" } });
  let calls = ""; try { calls = readFileSync(log, "utf8"); } catch {}
  return { code: r.status, out: r.stdout + r.stderr, calls };
};

describe("architecture-handoff.yml — the kit's pull request and SA_HANDOFF_AUTOMERGE", () => {
  test("unset: the pull request opens and waits for a reviewer; nothing merged, nothing dispatched", () => {
    const r = run({});
    expect(r.code).toBe(0);
    expect(r.calls).toContain("bun kit-check.js");
    expect(r.calls).toContain("bun kit-drift.js");
    expect(r.calls).toContain("gh pr create --base main --head handoff/architecture-v1.1.0");
    expect(r.calls).not.toContain("gh pr merge");
    expect(r.calls).not.toContain("gh workflow run");
    expect(r.out).toContain("left open for a reviewer: SA_HANDOFF_AUTOMERGE is not true");
  });

  test("true and both gates pass: merged, then architecture-index.yml dispatched on main as released", () => {
    const r = run({ automerge: "true" });
    expect(r.code).toBe(0);
    expect(r.calls).toContain("gh pr merge https://github.com/acme/order-desk/pull/9 --squash --delete-branch");
    expect(r.calls).toContain("gh workflow run architecture-index.yml -R acme/order-desk --ref main -f draft=false");
    expect(r.calls.indexOf("gh pr merge")).toBeLessThan(r.calls.indexOf("gh workflow run"));
    expect(r.out).toContain("merged; architecture-index.yml dispatched");
  });

  test("true but the drift gate blocks: the pull request opens, is not merged, and says why", () => {
    const r = run({ automerge: "true", drift: 1 });
    expect(r.code).toBe(0);
    expect(r.calls).toContain("gh pr create");
    expect(r.calls).not.toContain("gh pr merge");
    expect(r.calls).toContain("gh pr comment https://github.com/acme/order-desk/pull/9 --body Not merged automatically: the drift gate blocks (kit-drift.js, exit 1)");
  });

  test("merged, the dispatch refused: a warning to run the index by hand, the step still green", () => {
    const r = run({ automerge: "true", dispatch: 1 });
    expect(r.code).toBe(0);
    expect(r.calls).toContain("gh pr merge");
    expect(r.out).toContain("::warning::merged, but architecture-index.yml could not be dispatched");
  });

  test("the pull request, its commits and its comment in the architecture's language (DOC_LANGUAGE, 10.17.0)", () => {
    const r = run({ automerge: "true", drift: 1, lang: "es" });
    expect(r.code).toBe(0);
    expect(r.calls).toContain("gh pr create --base main --head handoff/architecture-v1.1.0 --title Kit de handoff de architecture-v1.1.0 --body Regenerado por el workflow");
    expect(r.calls).toContain("--body No se fusionó automáticamente: el control de deriva bloquea (kit-drift.js, salida 1)");
  });

  test("the kit did not change: no pull request, no merge", () => {
    const r = run({ automerge: "true", changed: false });
    expect(r.code).toBe(0);
    expect(r.out).toContain("the kit did not change");
    expect(r.calls).not.toContain("gh pr");
  });
});
