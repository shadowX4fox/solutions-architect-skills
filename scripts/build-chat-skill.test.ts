import { describe, test, expect } from "bun:test";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { chatFrontmatter, bundlePrecheck } from "./build-chat-skill";

describe("build-chat-skill", () => {
  test("SKILL.md keeps name and a one-line description, drops every other key, keeps the body", () => {
    const src = readFileSync(join(import.meta.dir, "..", "plugins", "sa-requirements", "skills", "architecture-readiness", "SKILL.md"), "utf8");
    const out = chatFrontmatter(src);
    const fm = out.match(/^---\n([\s\S]*?)\n---\n/)![1].split("\n");
    expect(fm).toHaveLength(2);
    expect(fm[0]).toBe("name: architecture-readiness");
    const d = JSON.parse(fm[1].replace(/^description: /, ""));
    expect(d).toMatch(/^Requirements elicitation/);
    expect(d.length).toBeLessThanOrEqual(1024);
    expect(out).toContain("CHAT_MODE.md");
    expect(out.slice(out.indexOf("\n---\n") + 5)).toBe(src.slice(src.indexOf("\n---\n") + 5));
  });

  test("the Project instructions template ships with the package and names what the package carries", () => {
    const skill = join(import.meta.dir, "..", "plugins", "sa-requirements", "skills", "architecture-readiness");
    const t = readFileSync(join(skill, "templates", "PROJECT_INSTRUCTIONS_TEMPLATE.md"), "utf8");
    expect(t).toContain("{{PRODUCT}}");
    expect(t).toContain("precheck/po-spec-precheck.cjs");
    expect(t).toContain("READINESS_CHECK: draft");
    expect(readFileSync(join(skill, "CHAT_MODE.md"), "utf8")).toContain("templates/PROJECT_INSTRUCTIONS_TEMPLATE.md");
  });

  test("the pre-check bundles into one file that runs under Node with nothing beside it", async () => {
    const dir = mkdtempSync(join(tmpdir(), "precheck-"));
    try {
      const b = await bundlePrecheck(dir);
      expect(b.success).toBe(true);
      const spec = join(dir, "PRODUCT_OWNER_SPEC.md");
      writeFileSync(spec, "# Order Desk - Product Owner Specification\n\n## 3. Business Objectives <!-- SECTION: Business Objectives -->\n\n- The platform must be scalable and integrate with other systems, etc.\n- Store orders in MongoDB\n");
      const r = Bun.spawnSync(["node", join(dir, "po-spec-precheck.cjs"), spec]);
      const out = r.stdout.toString();
      expect(out).toContain("PRE-CHECK");
      expect(out).toMatch(/measurable/);
      expect(out).toMatch(/Implementation\?/);
      expect(out).toContain("Stamp: none");
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
