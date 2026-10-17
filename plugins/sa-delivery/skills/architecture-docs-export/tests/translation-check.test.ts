/**
 * translation-check.js — a translated part keeps everything a translation never touches. Rules under
 * test: identical structure passes; numbers take the target language's separators (a number left in
 * the source convention fails, a version or section number keeps its dots); a dropped table row, a
 * lost identifier or a missing part fails; a code span that changed is a warning, never a failure.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { check } = require("../scripts/translation-check.js");

const SRC = `## Operaciones <!-- SECTION: Operational Considerations -->

| Componente | Despliegue |
|---|---|
| \`Gateway de Control\` | Helm, per \`ADR-133\` |
| El endpoint en la app | Lo añade ADR-134, que enruta I-25 |

Demanda: 4.000.000 movimientos y 0,1 % de error en Banca 2.0, ver § 11.3 y [la guía](docs/09.md).

\`\`\`mermaid
flowchart TB
  A --> B
\`\`\`
`;
const EN = SRC.replace("## Operaciones", "## Operations").replace("| Componente | Despliegue |", "| Component | Deployment |")
  .replace("El endpoint en la app | Lo añade ADR-134, que enruta I-25", "The endpoint in the app | Added by ADR-134, which routes I-25")
  .replace("Demanda: 4.000.000 movimientos y 0,1 % de error en Banca 2.0, ver § 11.3 y [la guía]", "Demand: 4,000,000 movements and 0.1% errors on Banca 2.0, see § 11.3 and [the guide]");

let dir = "";
const put = (sub: string, name: string, body: string) => { mkdirSync(join(dir, sub), { recursive: true }); writeFileSync(join(dir, sub, name), body); };
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "translation-check-")); put("parts", "briefing-01.md", SRC); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));
const run = () => check(join(dir, "parts"), join(dir, "parts-en"), "es", "en");

describe("translation-check", () => {
  test("a faithful translation passes", () => {
    put("parts-en", "briefing-01.md", EN);
    const r = run();
    expect(r.ok).toBe(true); expect(r.results[0].warnings).toEqual([]);
  });
  test("a dropped table row fails, and names the identifiers it took", () => {
    put("parts-en", "briefing-01.md", EN.replace(/\| The endpoint[^\n]*\n/, ""));
    const r = run();
    expect(r.ok).toBe(false);
    expect(r.results[0].problems.join(" ")).toMatch(/table rows 4 → 3/);
    expect(r.results[0].problems.join(" ")).toMatch(/ids: missing ADR-134 I-25/);
  });
  test("numbers take the target language's separators: left in the source convention they fail", () => {
    put("parts-en", "briefing-01.md", EN.replace("4,000,000", "4.000.000").replace("0.1%", "0,1 %"));
    const r = run();
    expect(r.ok).toBe(false);
    expect(r.results[0].problems.join(" ")).toMatch(/numbers: missing 4000000 0\.1 extra 4\.000\.000 0,1/);
  });
  test("the other direction reads each side in its own convention", () => {
    rmSync(join(dir, "parts"), { recursive: true }); put("parts", "briefing-01.md", EN); put("parts-es", "briefing-01.md", SRC);
    expect(check(join(dir, "parts"), join(dir, "parts-es"), "en", "es").ok).toBe(true);
  });
  test("a changed code span is a warning, not a failure", () => {
    put("parts-en", "briefing-01.md", EN.replace("`Gateway de Control`", "`Control Gateway`"));
    const r = run();
    expect(r.ok).toBe(true);
    expect(r.results[0].warnings.join(" ")).toMatch(/code: missing `Gateway de Control` extra `Control Gateway`/);
  });
  test("a part left untranslated fails", () => {
    mkdirSync(join(dir, "parts-en"));
    expect(run().results[0].problems).toEqual(["not translated (file missing)"]);
  });
});
