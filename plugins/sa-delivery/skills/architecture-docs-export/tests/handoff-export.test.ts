// handoff-export.js — Workflow B by code. A synthetic kit (every name invented), the menu, the selection grammar, the
// composed package (fixed header, sources byte for byte), a native render through docgen, the translated round trip
// and the older layouts it refuses to export.
import { describe, expect, test, beforeEach, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync, copyFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT = join(import.meta.dir, "..", "scripts", "handoff-export.js");
const BASE = mkdtempSync(join(tmpdir(), "handoff-export-"));
afterAll(() => rmSync(BASE, { recursive: true, force: true }));
let root = "";
const w = (p: string, t: string) => { mkdirSync(join(root, p, ".."), { recursive: true }); writeFileSync(join(root, p), t); };
const run = (...a: string[]) => { const r = Bun.spawnSync(["bun", SCRIPT, root, ...a]); return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() }; };
const SEAM = "# Interface Contract: Web App → Order Service\n\n| Field | Rule |\n|---|---|\n| orderId | required |\n";
const SPEC = "# Component Specification — Order Service\n\n## Responsibility\n\nTakes orders.\n";

beforeEach(() => {
  root = mkdtempSync(join(BASE, "p-"));
  w("ARCHITECTURE.md", "<!-- DOC_LANGUAGE: en -->\n# Order Desk\n");
  w("docs/01-system-overview.md", "# Order Desk <!-- SECTION: System Overview -->\n");
  w("handoffs/SYSTEM_RUNTIME_VIEW.md", "# System Runtime View\n\nFlows.\n");
  w("handoffs/CROSS_CUTTING_STANDARDS.md", "# Cross-Cutting Standards\n\nRules.\n");
  w("handoffs/interfaces/web-app→order-service.md", SEAM);
  w("handoffs/components/01-order-service.md", SPEC);
  w("handoffs/components/02-hub-api.md", "# Component Specification — Hub API\n\nAlone.\n");
});

describe("handoff-export.js", () => {
  test("--list numbers the shared parts, then the component packages with their seams, then the seams", () => {
    const r = run("--list", "--json"); expect(r.code).toBe(0);
    const { menu, legacy, missing } = JSON.parse(r.out);
    expect(legacy).toBeNull(); expect(missing).toEqual([]);
    expect(menu.map((m: any) => `${m.n}:${m.kind}`)).toEqual(["1:shared", "2:shared", "3:component", "4:component", "5:seam"]);
    expect(menu[2]).toMatchObject({ label: "Order Service — 1 seam(s) + component specification", seams: ["handoffs/interfaces/web-app→order-service.md"] });
    expect(menu[3].seams).toEqual([]);   // a seam belongs to a component when either side of the arrow is its slug
  });

  test("the selection grammar: all excludes the individual seams; numbers and ranges; out-of-range refused", () => {
    expect(run("--select", "7").code).toBe(2);
    expect(run("--select", "x").err).toContain("not a number or a range");
    const r = run("--select", "all", "--json"); expect(r.code).toBe(0);
    expect(JSON.parse(r.out).outputs.map((o: any) => o.output)).toEqual([
      "exports/KIT-01-runtime-view-order-desk.docx", "exports/KIT-02-standards-order-desk.docx", "exports/HANDOFF-order-service.docx", "exports/HANDOFF-hub-api.docx"]);
    expect(existsSync(join(root, ".cache", "sa-skills", "export", "handoff"))).toBe(false);   // the composed files are removed
  });

  test("a native export renders every selected item through docgen, the seam named -to- instead of the arrow", () => {
    const r = run("--select", "3-5"); expect(r.code).toBe(0);
    expect(readdirSync(join(root, "exports")).sort()).toEqual(["HANDOFF-hub-api.docx", "HANDOFF-order-service.docx", "INTERFACE-web-app-to-order-service.docx"]);
    expect(r.out).toContain("NOT self-contained");
  });

  test("translated: the parts are laid out, the package is the fixed header and the sources verbatim, then rendered with --translated-from", () => {
    const r = run("--select", "3,5", "--lang", "es", "--json"); expect(r.code).toBe(0);
    const t = JSON.parse(r.out); expect(t).toMatchObject({ status: "TRANSLATE", from: "en", lang: "es" });
    const parts = join(root, t.parts), pkg = readFileSync(join(parts, "handoff-package-order-service.md"), "utf8");
    expect(pkg.startsWith("# Handoff Package — Order Service\n\n> **Part of a four-part handoff kit")).toBe(true);
    expect(pkg).toContain("| `KIT-01-runtime-view-order-desk-es.docx` |");   // the language suffix reaches the cross-references
    expect(pkg).toContain(SEAM.trimEnd()); expect(pkg).toContain(SPEC.trimEnd());
    expect(pkg.indexOf("# Interface Contracts")).toBeLessThan(pkg.indexOf("# Component Specification\n"));
    expect(run("--render-translated").err).toContain("not translated yet");
    const out = join(root, t.translate_to); mkdirSync(out, { recursive: true });
    for (const f of t.files) copyFileSync(join(parts, f), join(out, f));   // the agent's job; here the parts stand in for it
    const done = run("--render-translated", "--json"); expect(done.code).toBe(0);
    expect(JSON.parse(done.out).outputs.map((o: any) => o.output)).toEqual(["exports/HANDOFF-order-service-es.docx", "exports/INTERFACE-web-app-to-order-service-es.docx"]);
  });

  test("a component with no seam gets the NOT DOCUMENTED line; a missing shared part is reported, never invented", () => {
    rmSync(join(root, "handoffs", "CROSS_CUTTING_STANDARDS.md"));
    const t = JSON.parse(run("--select", "3", "--lang", "es", "--json").out);
    expect(readFileSync(join(root, t.parts, "handoff-package-hub-api.md"), "utf8")).toContain("[NOT DOCUMENTED — no Interface Contract in handoffs/interfaces/ names hub-api on either side]");
    expect(JSON.parse(run("--list", "--json").out).missing).toEqual(["handoffs/CROSS_CUTTING_STANDARDS.md"]);
  });

  test("the older layouts are named and not exported", () => {
    rmSync(join(root, "handoffs"), { recursive: true });
    w("handoffs/SETTEI.md", "# old");
    expect(JSON.parse(run("--list", "--json").out).legacy).toBe("3.x");
    expect(run("--select", "all").err).toContain("3.x layout");
    rmSync(join(root, "handoffs"), { recursive: true }); mkdirSync(join(root, "handoffs"));
    expect(run("--select", "all").err).toContain("no handoff kit");
  });
});
