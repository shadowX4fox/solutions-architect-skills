/**
 * Exit-code contract for component-cli.
 *
 * The CLI wrappers had no tests of any kind, and this one's contract had drifted
 * from the library it wraps: `listComponents` documents fail-open ("returns an
 * empty array when the directory is absent — callers fail open rather than
 * aborting") while the CLI exited 2 for exactly that case, so a caller following
 * the documented contract got an error code instead of an empty list.
 *
 * Contract under test:
 *   0  success — including a project with no docs/components directory
 *   1  `check` only: one or more findings
 *   2  unusable invocation: bad subcommand, missing argument, missing project_root
 *
 * @module component-cli.test
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const CLI = resolve(import.meta.dir, "..", "utils", "component-cli.ts");

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "component-cli-test-"));
});

afterEach(() => {
  try { rmSync(projectRoot, { recursive: true, force: true }); } catch { /* best effort */ }
});

function write(relPath: string, content: string): void {
  const abs = join(projectRoot, relPath);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, content);
}

async function run(...args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", CLI, ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const code = await proc.exited;
  return { code, stdout, stderr };
}

/** A well-formed L2 container file that produces no findings. */
function container(name: string, slug: string): string {
  return [
    `# ${name}`,
    "",
    "<!-- EXPLORER_HEADER",
    `key_concepts: alpha, beta, gamma`,
    "technologies: Kong",
    `component_self: ${slug}`,
    "scope: edge routing",
    "-->",
    "",
    // `Gateway` is a canonical L2 type but is separately flagged at L2 by the
    // SA Design Language C-14 rule, so a "clean" fixture must not use it.
    "**Type:** API Service",
    "**Technology:** [Kong]",
    `**Description:** ${name} routes every inbound request to the service that owns it.`,
    "",
    "Body.",
  ].join("\n");
}

describe("component-cli — no docs/components directory", () => {
  beforeEach(() => { mkdirSync(join(projectRoot, "docs"), { recursive: true }); });

  test("list exits 0 and prints an empty array", async () => {
    const { code, stdout } = await run("list", projectRoot);
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  test("index exits 0", async () => {
    expect((await run("index", projectRoot)).code).toBe(0);
  });

  test("check exits 0 and says there is nothing to check", async () => {
    const { code, stdout } = await run("check", projectRoot);
    expect(code).toBe(0);
    expect(stdout).toContain("nothing to check");
  });
});

describe("component-cli — unusable invocation exits 2", () => {
  test("missing project_root argument", async () => {
    expect((await run("list")).code).toBe(2);
  });

  test("project_root that does not exist", async () => {
    expect((await run("list", join(projectRoot, "nope"))).code).toBe(2);
  });

  test("unknown subcommand", async () => {
    const { code, stderr } = await run("bogus", projectRoot);
    expect(code).toBe(2);
    expect(stderr).toContain("unknown subcommand");
  });

  test("no subcommand at all", async () => {
    expect((await run()).code).toBe(2);
  });
});

describe("component-cli — a clean project", () => {
  beforeEach(() => {
    write("docs/components/01-api-gateway.md", container("api-gateway", "api-gateway"));
    write(
      "docs/components/README.md",
      [
        "# Component Index",
        "",
        "| # | Component | File | Type | Technology |",
        "|---|-----------|------|------|------------|",
        "| 5.1 | api-gateway | [01-api-gateway.md](01-api-gateway.md) | API Service | [Kong] |",
      ].join("\n"),
    );
  });

  test("check exits 0 and reports the index in sync", async () => {
    const { code, stdout } = await run("check", projectRoot);
    expect(code).toBe(0);
    expect(stdout).toContain("index in sync");
  });

  test("list exits 0 and returns one component", async () => {
    const { code, stdout } = await run("list", projectRoot);
    expect(code).toBe(0);
    const facts = JSON.parse(stdout);
    expect(facts).toHaveLength(1);
    expect(facts[0].name).toBe("api-gateway");
  });
});

describe("component-cli — check reports findings by class", () => {
  test("index drift exits 1 and is labelled as drift", async () => {
    write("docs/components/01-api-gateway.md", container("api-gateway", "api-gateway"));
    write(
      "docs/components/README.md",
      [
        "# Component Index",
        "",
        "| # | Component | File | Type | Technology |",
        "|---|-----------|------|------|------------|",
        "| 5.1 | api-gateway | [01-api-gateway.md](01-api-gateway.md) | API Service | [Nginx] |",
      ].join("\n"),
    );

    const { code, stderr } = await run("check", projectRoot);
    expect(code).toBe(1);
    expect(stderr).toContain("Index drift");
    // The "run sync" advice belongs to the drift class only.
    expect(stderr).toContain("sync");
  });

  test("a component-file defect is reported separately from drift", async () => {
    // No EXPLORER_HEADER — an authoring defect that `sync` cannot fix.
    write(
      "docs/components/01-api-gateway.md",
      ["# api-gateway", "", "**Type:** API Service", "**Technology:** [Kong]", ""].join("\n"),
    );
    write(
      "docs/components/README.md",
      [
        "# Component Index",
        "",
        "| # | Component | File | Type | Technology |",
        "|---|-----------|------|------|------------|",
        "| 5.1 | api-gateway | [01-api-gateway.md](01-api-gateway.md) | API Service | [Kong] |",
      ].join("\n"),
    );

    const { code, stderr } = await run("check", projectRoot);
    expect(code).toBe(1);
    expect(stderr).toContain("Component file defects");
    expect(stderr).toContain("missing-header");
  });
});
