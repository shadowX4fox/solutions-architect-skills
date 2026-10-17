/**
 * setup-docgen.ts — the export toolchain report: what is installed, what breaks without it, and
 * the exit code contract (a missing optional piece is a degraded export, not a broken install).
 *
 * The smoke render is exercised once, without `--no-smoke`, because a check that reports a resolved
 * `mmdc` and a browser it never reached is the failure this helper exists to prevent.
 */
import { describe, test, expect } from "bun:test";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "setup-docgen.ts");

type Check = { id: string; required: boolean; ok: boolean; detail: string; fix?: string; cost?: string };
const run = (args: string[], env: Record<string, string> = {}) => {
  const r = Bun.spawnSync(["bun", SCRIPT, ...args], { stdout: "pipe", stderr: "pipe", env: { ...process.env, ...env } });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};
const checksOf = (out: string): Check[] => JSON.parse(out).checks;
const by = (cs: Check[], id: string) => cs.find((c) => c.id === id)!;

describe("setup-docgen", () => {
  test("reports every piece of the toolchain, and only docx is required", () => {
    const r = run(["--json", "--no-smoke"]);
    expect(r.code).toBe(0);
    const cs = checksOf(r.out);
    expect(cs.map((c) => c.id)).toEqual(["docx", "pdfmake", "mmdc", "browser"]);
    expect(cs.filter((c) => c.required).map((c) => c.id)).toEqual(["docx"]);
    expect(by(cs, "docx").ok).toBe(true);   // the repo's own install must at least produce Word
    expect(by(cs, "browser").detail).toBe("not checked (--no-smoke)");
  });

  test("a missing optional piece names what breaks and the command that fixes it, and does not fail the run", () => {
    const r = run(["--json"], { MMDC_PATH: "/nonexistent/mmdc" });
    expect(r.code).toBe(0);                                   // a degraded export is not a broken install
    const mmdc = by(checksOf(r.out), "mmdc");
    expect(mmdc.ok).toBe(false);
    expect(mmdc.detail).toMatch(/no mmdc in .*node_modules[/\\]\.bin, on PATH, or at MMDC_PATH/);
    expect(mmdc.cost).toMatch(/exports as monospace source/);
    expect(mmdc.fix).toMatch(/bun install/);
    expect(checksOf(r.out).find((c) => c.id === "browser")).toBeUndefined();   // nothing to smoke-test without a binary
  });

  test("--strict turns any missing optional piece into a non-zero exit, for CI", () => {
    expect(run(["--json", "--strict"], { MMDC_PATH: "/nonexistent/mmdc" }).code).toBe(1);
    expect(run(["--json"], { MMDC_PATH: "/nonexistent/mmdc" }).code).toBe(0);
  });

  test("the browser check renders a real diagram rather than testing for a binary", () => {
    const r = run(["--json"]);
    const browser = by(checksOf(r.out), "browser");
    const mmdc = by(checksOf(r.out), "mmdc");
    if (!mmdc.ok) return;                                     // no binary here — the case above covers it
    expect(browser.ok).toBe(true);
    expect(browser.detail).toMatch(/^rendered a \d+×\d+ PNG$/);
  }, 120_000);

  test("the human report marks each line and prints the fixes under it", () => {
    const r = run(["--no-smoke"], { MMDC_PATH: "/nonexistent/mmdc" });
    expect(r.out).toMatch(/^Export toolchain \(tools\/docgen\):/);
    expect(r.out).toMatch(/✓ docx \(Word output\) — installed/);
    expect(r.out).toMatch(/⬜ mermaid-cli \(diagrams as pictures\) — no mmdc/);
    expect(r.out).toMatch(/Without it: every Mermaid diagram exports as monospace source/);
    expect(r.out).toMatch(/Fix: +bun install/);
  });
});
