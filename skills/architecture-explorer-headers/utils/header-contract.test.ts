/**
 * The EXPLORER_HEADER contract, held from both ends.
 *
 * The parser (`header-detector.ts`) reads a closed key set. Every place that *teaches* a writer
 * to emit a header — the documentation guide, the guardian, the backfill skill, the command
 * center skill — carries example blocks. This test parses every example and holds it to the
 * parser: a documented key the parser would drop, a required field an example omits, or a
 * builder that does not round-trip fails `bun test`, so the prose and the code cannot drift apart
 * without a red build. It also checks the guide's field-guidance bullets against the key set.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { ALLOWED_FIELDS, buildHeader, parseHeader, rawHeaderKeys, validateHeader, HeaderFields } from "./header-detector";

const REPO = join(__dirname, "..", "..", "..");
const SOURCES = [
  "skills/architecture-docs/ARCHITECTURE_DOCUMENTATION_GUIDE.md",
  "skills/architecture-component-guardian/SKILL.md",
  "skills/architecture-explorer-headers/SKILL.md",
  "plugins/sa-visualization/skills/architecture-command-center/SKILL.md",
].filter((f) => existsSync(join(REPO, f)));   // a copy without a skill checks the examples of the skills it holds

/** Every fenced EXPLORER_HEADER block in a file, with a path guess from the key set it uses. */
function examples(file: string): { src: string; block: string; path: string }[] {
  const text = readFileSync(join(REPO, file), "utf-8");
  const out: { src: string; block: string; path: string }[] = [];
  const rx = /<!-- EXPLORER_HEADER[\s\S]*?-->/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text))) {
    const block = m[0];
    const keys = rawHeaderKeys(block);
    if (!keys.some((k) => /^[a-z_]+$/.test(k))) continue;   // an inline mention (`<!-- EXPLORER_HEADER -->`, `<!-- EXPLORER_HEADER ... -->`), not an example
    // a template placeholder line (`components: <comma-separated>     # OR ...`) is instruction, not a value — skip pure-placeholder blocks
    if (/<[a-z -]+>/.test(block) && !/[A-Za-z]+, [A-Za-z]/.test(block)) continue;
    out.push({ src: file, block, path: keys.includes("component_self") ? "docs/components/x/01-x.md" : "docs/01-x.md" });
  }
  return out;
}

describe("EXPLORER_HEADER contract", () => {
  test("every documented example uses only keys the parser reads, and validates for its file kind", () => {
    const all = SOURCES.flatMap(examples);
    expect(all.length).toBeGreaterThan(5);
    for (const ex of all) {
      const unknown = rawHeaderKeys(ex.block).filter((k) => !ALLOWED_FIELDS.has(k));
      expect({ src: ex.src, unknown }).toEqual({ src: ex.src, unknown: [] });
      const v = validateHeader(`# T\n\n${ex.block}\n`, ex.path);
      expect({ src: ex.src, block: ex.block.slice(0, 60), errors: v.errors }).toEqual({ src: ex.src, block: ex.block.slice(0, 60), errors: [] });
    }
  });

  test("the guide's field guidance names only keys in the closed set, and the set is what the guide's language section lists", () => {
    const guide = readFileSync(join(REPO, SOURCES[0]), "utf-8");
    const bullets = [...guide.matchAll(/^- \*\*([a-z_]+)\*\* — /gm)].map((m) => m[1]);
    expect(bullets.length).toBeGreaterThan(3);
    bullets.forEach((k) => expect(ALLOWED_FIELDS.has(k)).toBe(true));
    const listed = (guide.match(/field \*\*keys\*\* \(([^)]+)\)/) || [])[1] || "";
    const keys = [...listed.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
    keys.forEach((k) => expect(ALLOWED_FIELDS.has(k)).toBe(true));
    [...ALLOWED_FIELDS].filter((k) => k !== "internal_name").forEach((k) => expect(keys).toContain(k));
  });

  test("buildHeader → parseHeader round-trips every field the builder writes", () => {
    const fields: HeaderFields = { key_concepts: ["a", "b c"], technologies: ["Kafka 3.7"], component_self: "payment-service", component_type: "api-service", scope: "One line.", related_adrs: ["ADR-001", "ADR-002"] };
    const parsed = parseHeader(`# T\n\n${buildHeader(fields, "Summary.")}\n`);
    expect(parsed).toEqual(fields);
    const doc: HeaderFields = { key_concepts: ["x"], technologies: ["y"], components: ["payment-service"], scope: "s", related_adrs: [] };
    expect(parseHeader(`# T\n\n${buildHeader(doc)}\n`)).toEqual({ key_concepts: ["x"], technologies: ["y"], components: ["payment-service"], scope: "s" });
  });
});
