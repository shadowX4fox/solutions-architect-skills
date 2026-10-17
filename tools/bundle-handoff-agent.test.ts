/**
 * Sync test for tools/bundle-handoff-agent.ts.
 *
 * Asserts every BUNDLE_TARGETS entry in tools/bundle-handoff-agent.ts is in
 * sync with its source files. Ekonte-kit targets (v4.0.0+):
 *   - plugins/sa-delivery/agents/generators/ekonte-generator.md            ← SYSTEM_EKONTE_TEMPLATE.md
 *   - plugins/sa-delivery/agents/generators/settei-generator.md            ← SETTEI_TEMPLATE.md
 *   - plugins/sa-delivery/agents/generators/seam-generator.md              ← SEAM_SPEC_TEMPLATE.md
 *   - plugins/sa-delivery/agents/generators/cutsheet-generator.md          ← CUT_SHEET_TEMPLATE.md
 *   - plugins/sa-delivery/agents/generators/handoff-asset-generator.md     ← assets/_index.md,
 *                                                        ASSET_GENERATION_GUIDE.md
 *
 * Run via `bun test`.
 *
 * Maintainer workflow on failure:
 *   bun run bundle:handoff-agent
 *   git add plugins/sa-delivery/agents/<each-agent>.md plugins/sa-delivery/skills/architecture-dev-handoff/<source>.md
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
    // Every Ekonte-kit BUNDLE_TARGETS entry must appear in the success
    // report so the test fails loudly if a future entry is dropped
    // accidentally.
    expect(result.stdout).toContain("plugins/sa-delivery/agents/generators/ekonte-generator.md");
    expect(result.stdout).toContain("plugins/sa-delivery/agents/generators/settei-generator.md");
    expect(result.stdout).toContain("plugins/sa-delivery/agents/generators/seam-generator.md");
    expect(result.stdout).toContain("plugins/sa-delivery/agents/generators/cutsheet-generator.md");
    expect(result.stdout).toContain("plugins/sa-delivery/agents/generators/handoff-asset-generator.md");
  });
});
