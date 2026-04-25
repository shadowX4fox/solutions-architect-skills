/**
 * Sync test for tools/bundle-handoff-agent.ts.
 *
 * Asserts every BUNDLE_TARGETS entry in tools/bundle-handoff-agent.ts is in
 * sync with its source files. Currently:
 *   - agents/generators/handoff-generator.md       ← HANDOFF_TEMPLATE.md,
 *                                                     SECTION_EXTRACTION_GUIDE.md,
 *                                                     assets/_index.md,
 *                                                     ASSET_GENERATION_GUIDE.md
 *   - agents/builders/handoff-context-builder.md   ← PAYLOAD_SCHEMA.md
 *
 * Run via `bun test`.
 *
 * Maintainer workflow on failure:
 *   bun run bundle:handoff-agent
 *   git add agents/<each-agent>.md skills/architecture-dev-handoff/<source>.md
 *   git commit
 */
import { describe, test, expect } from "bun:test";
import { spawnSync } from "child_process";
import { resolve } from "path";

const REPO_ROOT = resolve(__dirname, "..");

describe("bundle-handoff-agent sync", () => {
  test("all bundled agents are in sync with their source files", () => {
    const result = spawnSync(
      "bun",
      ["tools/bundle-handoff-agent.ts", "--check"],
      { cwd: REPO_ROOT, encoding: "utf-8" },
    );
    if (result.status !== 0) {
      console.error(result.stdout);
      console.error(result.stderr);
    }
    expect(result.status).toBe(0);
    // Both agent file paths must appear in the success report so the test
    // fails loudly if a future BUNDLE_TARGETS entry is dropped accidentally.
    expect(result.stdout).toContain("agents/generators/handoff-generator.md");
    expect(result.stdout).toContain("agents/builders/handoff-context-builder.md");
  });
});
