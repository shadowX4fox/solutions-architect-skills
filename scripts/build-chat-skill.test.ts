import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { chatFrontmatter } from "./build-chat-skill";

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
});
