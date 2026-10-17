/**
 * changelog-rotate.js — the newest N versioned entries stay in docs/CHANGELOG.md, older ones move whole to
 * docs/CHANGELOG-ARCHIVE.md above the entries already there; [Unreleased] and the header always stay; one
 * footer line names the archive; nothing happens when there is nothing to rotate.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { rotate, parse } = require("../scripts/changelog-rotate.js");
const SCRIPT = join(__dirname, "..", "scripts", "changelog-rotate.js");

const TMP = join(__dirname, ".temp-changelog-rotate");
const w = (rel: string, body: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), body, "utf-8"); };
const entry = (v: string, d: string, body: string) => `## [${v}] - ${d}\n\n### Changed\n- ${body}\n`;
const LOG = `# Changelog\n\nKeep a Changelog.\n\n## [Unreleased]\n\n### Added\n- Pending thing.\n\n${entry("1.4.0", "2026-09-05", "Four.")}\n${entry("1.3.0", "2026-09-01", "Three.")}\n${entry("1.2.0", "2026-08-20", "Two.")}\n${entry("1.1.0", "2026-08-10", "One.")}\n${entry("1.0.0", "2026-08-01", "Zero.")}`;

beforeEach(() => { rmSync(TMP, { recursive: true, force: true }); w("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: es -->\n\n# X\n"); w("docs/CHANGELOG.md", LOG); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("changelog-rotate", () => {
  test("keeps the newest N, archives the rest whole, leaves Unreleased and the header, writes the footer once", () => {
    const r = rotate(TMP, { keep: 2 });
    expect(r).toEqual({ keep: 2, kept: ["1.4.0", "1.3.0"], rotated: ["1.2.0", "1.1.0", "1.0.0"], archive: "docs/CHANGELOG-ARCHIVE.md", dry_run: false });
    const main = readFileSync(join(TMP, "docs/CHANGELOG.md"), "utf-8");
    expect(main).toMatch(/^# Changelog\n\nKeep a Changelog\.\n\n## \[Unreleased\]\n\n### Added\n- Pending thing\.\n\n## \[1\.4\.0\] - 2026-09-05\n/);
    expect(main).not.toMatch(/\[1\.2\.0\]/);
    expect(main.trim()).toMatch(/\n> Versiones anteriores: \[CHANGELOG-ARCHIVE\.md\]\(CHANGELOG-ARCHIVE\.md\)\.$/);
    const arch = readFileSync(join(TMP, "docs/CHANGELOG-ARCHIVE.md"), "utf-8");
    expect(arch).toMatch(/^# Changelog — archivo\n/);
    expect(parse(arch).entries.map((e: any) => e.version)).toEqual(["1.2.0", "1.1.0", "1.0.0"]);
    expect(arch).toMatch(/## \[1\.0\.0\] - 2026-08-01\n\n### Changed\n- Zero\./);   // whole, untouched
    // a second rotation with a new release puts the newly rotated entry above the archived ones and keeps one footer
    w("docs/CHANGELOG.md", main.replace("## [1.4.0]", entry("1.5.0", "2026-09-07", "Five.") + "\n## [1.4.0]"));
    const r2 = rotate(TMP, { keep: 2 });
    expect(r2.rotated).toEqual(["1.3.0"]);
    const main2 = readFileSync(join(TMP, "docs/CHANGELOG.md"), "utf-8");
    expect(main2.match(/Versiones anteriores/g)!.length).toBe(1);
    expect(parse(readFileSync(join(TMP, "docs/CHANGELOG-ARCHIVE.md"), "utf-8")).entries.map((e: any) => e.version)).toEqual(["1.3.0", "1.2.0", "1.1.0", "1.0.0"]);
  });

  test("nothing to rotate leaves both files untouched; --dry-run reports without writing", () => {
    const r = rotate(TMP, { keep: 5 });
    expect(r.rotated).toEqual([]);
    expect(readFileSync(join(TMP, "docs/CHANGELOG.md"), "utf-8")).toBe(LOG);
    expect(existsSync(join(TMP, "docs/CHANGELOG-ARCHIVE.md"))).toBe(false);
    const d = rotate(TMP, { keep: 1, dryRun: true });
    expect(d.rotated).toEqual(["1.3.0", "1.2.0", "1.1.0", "1.0.0"]);
    expect(readFileSync(join(TMP, "docs/CHANGELOG.md"), "utf-8")).toBe(LOG);
  });

  test("the CLI prints what it rotated and exits 2 without a changelog", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, TMP, "--keep", "3"], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    expect(r.stderr.toString()).toMatch(/^Rotated 2 entries to docs\/CHANGELOG-ARCHIVE\.md: 1\.1\.0, 1\.0\.0 — kept 1\.4\.0, 1\.3\.0, 1\.2\.0/);
    rmSync(join(TMP, "docs/CHANGELOG.md"));
    expect(Bun.spawnSync(["bun", SCRIPT, TMP], { stdout: "pipe", stderr: "pipe" }).exitCode).toBe(2);
  });
});
