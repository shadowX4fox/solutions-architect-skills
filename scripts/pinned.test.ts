// pinned.js — an npm package loads only as `bun install` put it: on disk, inside the range package.json pins. A package Bun
// would auto-install (no node_modules) or one off its pin is refused with the fix, before any require reaches the installer.
import { describe, expect, test, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const { pinnedRequire, pinState, nameOf } = require("./shared/pinned.js");
const ROOT = mkdtempSync(join(tmpdir(), "pinned-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

const pkg = (root: string, deps: Record<string, any>) => { mkdirSync(root, { recursive: true }); writeFileSync(join(root, "package.json"), JSON.stringify({ name: "host", ...deps })); };
const mod = (root: string, name: string, version: string) => {
  const d = join(root, "node_modules", name); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, "package.json"), JSON.stringify({ name, version, main: "index.js" }));
  writeFileSync(join(d, "index.js"), `module.exports = { name: ${JSON.stringify(name)}, version: ${JSON.stringify(version)} };`);
};

describe("pinned.js", () => {
  test("a package inside its pin loads from node_modules", () => {
    const r = join(ROOT, "ok"); pkg(r, { dependencies: { "ok-lib": "^1.2.0" } }); mod(r, "ok-lib", "1.4.0");
    expect(pinState(r, "ok-lib")).toMatchObject({ ok: true, version: "1.4.0", range: "^1.2.0" });
    expect(pinnedRequire(r, "ok-lib")).toEqual({ name: "ok-lib", version: "1.4.0" });
  });

  test("a major past the pin is refused with the fix — the auto-install case (graphql 17 against ^16)", () => {
    const r = join(ROOT, "off"); pkg(r, { dependencies: { "graph-lib": "^16.14.2" } }); mod(r, "graph-lib", "17.0.2");
    expect(pinState(r, "graph-lib")).toMatchObject({ ok: false, reason: "17.0.2 installed, pinned ^16.14.2" });
    let err: any; try { pinnedRequire(r, "graph-lib"); } catch (e) { err = e; }
    expect(err.code).toBe("MODULE_NOT_FOUND"); expect(err.message).toContain("run `bun install` in"); expect(err.message).toContain("pinned ^16.14.2");
  });

  test("no node_modules: refused before any require, so Bun never auto-installs", () => {
    const r = join(ROOT, "none"); pkg(r, { optionalDependencies: { "never-fetched-pkg-xyz": "^1.0.0" } });
    expect(pinState(r, "never-fetched-pkg-xyz")).toMatchObject({ ok: false, reason: "not installed", range: "^1.0.0" });
    expect(() => pinnedRequire(r, "never-fetched-pkg-xyz")).toThrow(/not installed — run `bun install`/);
  });

  test("a subpath is held to its package's pin; scoped names keep their scope", () => {
    const r = join(ROOT, "scoped"); pkg(r, { dependencies: { "@acme/core": "^2.57.0" } }); mod(r, "@acme/core", "2.59.0");
    expect(nameOf("@acme/core/package.json")).toBe("@acme/core"); expect(nameOf("pdfmake/build/vfs_fonts.js")).toBe("pdfmake");
    expect(pinState(r, "@acme/core/package.json")).toMatchObject({ ok: true, version: "2.59.0" });
    expect(pinnedRequire(r, "@acme/core/package.json").version).toBe("2.59.0");
  });

  test("the real installs this repository pins: docgen's docx and the contract checks' graphql", () => {
    const repo = join(import.meta.dir, "..");
    expect(pinState(join(repo, "tools", "docgen"), "docx").ok).toBe(true);
    expect(pinState(repo, "graphql").ok).toBe(true);
  });
});
