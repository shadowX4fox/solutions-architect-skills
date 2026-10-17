/**
 * The diagram theme is never asked. The standard defines one palette (§9), so the question had no useful
 * answer — and through 8.29.0 a step file demanded it unconditionally while the guide forbade it. This holds
 * every instruction file of the skill to the rule: no prompt text, no "ask the user" next to DIAGRAM_THEME.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); if (n === "design-language" || n === "tests" || n === "node_modules") return []; return statSync(p).isDirectory() ? walk(p) : /\.md$/.test(n) ? [p] : []; });

describe("no theme question", () => {
  test("no instruction file asks which theme the user's editor uses", () => {
    const offenders: string[] = [];
    for (const f of walk(ROOT)) {
      const src = readFileSync(f, "utf-8");
      src.split("\n").forEach((l, i) => {
        if (/light or dark theme in your editor|Do you use a light or dark theme|MUST ask the user before proceeding/i.test(l)) offenders.push(`${f.replace(ROOT + "/", "")}:${i + 1}`);
        if (/DIAGRAM_THEME/.test(l) && /\bask\b(?! the user which theme)(?!ed)/i.test(l) && !/never ask|do not ask|nobody is asked|never a question/i.test(l)) offenders.push(`${f.replace(ROOT + "/", "")}:${i + 1} (asks next to DIAGRAM_THEME)`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
