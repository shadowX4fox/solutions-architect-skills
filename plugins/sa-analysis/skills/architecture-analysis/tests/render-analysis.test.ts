/**
 * render-analysis.js — every plan × a synthetic fill renders a report that passes the findings
 * contract, in Markdown and in HTML, in both languages; the fill validation names the defects it
 * refuses (an id off the scheme, a column missing, a heat-map cell off the grid, a section the plan
 * does not declare); the Blast Radius render joins the SPOF ids of the SPOF report on disk.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const SKILL = join(import.meta.dir, "..");
const RENDER = join(SKILL, "scripts", "render-analysis.js");
const PLANS = join(SKILL, "analyses", "plans");
const F = require(join(SKILL, "scripts", "findings.js"));
const lenses = readdirSync(PLANS).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

let dir = "";
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), "render-analysis-")); mkdirSync(join(dir, "analysis")); });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

const plan = (lens: string) => JSON.parse(readFileSync(join(PLANS, `${lens}.json`), "utf8"));

/** An id that satisfies a plan's regex: the first alternative, numbered. */
const idFor = (re: string, n: number): string => {
  const two = String(n).padStart(2, "0");
  if (/^\^DEP-/.test(re)) return `DEP-${two}`;
  if (/^\^C/.test(re)) return `C${n}`; if (/^\^D/.test(re)) return `D${n}`; if (/^\^O\\d/.test(re)) return `O${n}`;
  if (/^\^B\\d\{1,3\}\$$/.test(re)) return `B${n}`;
  if (/^\^B\[12\]/.test(re)) return `B1-${two}`; if (/^\^B\[34\]/.test(re) || /^\^B4/.test(re)) return `B4-${two}`;
  if (/^\^P-/.test(re)) return `P-${two}`; if (/^\^Q-/.test(re)) return `Q-${two}`; if (/^\^O-/.test(re)) return `O-${two}`;
  if (/^\^TB-/.test(re)) return `TB-${two}`; if (/^\^T\\d\{1,3\}-/.test(re)) return `T${n}-S`;
  if (/^\^L1-/.test(re)) return `L1-${two}`; if (/^\^L2-/.test(re)) return `L2-${two}`; if (/^\^L\[12\]/.test(re)) return `L1-${two}`;
  if (/^\^OB-/.test(re)) return `OB-${two}`; if (/^\^TL-/.test(re)) return `TL-${two}`;
  if (/^\^T\[1-5\]/.test(re)) return `T1-${two}`; if (/^\^T\[12\]/.test(re)) return `T1-${two}`; if (/^\^DEP-/.test(re)) return `DEP-${two}`; if (/^\^AD-/.test(re)) return `AD-${two}`;
  if (/^\^K1-/.test(re)) return `K1-${two}`; if (/^\^K2-/.test(re)) return `K2-${two}`; if (/^\^K3-/.test(re)) return `K3-${two}`; if (/^\^K4-/.test(re)) return `K4-${two}`;
  if (/^\^G\[12\]/.test(re)) return `G1-${two}`; if (/^\^G3-/.test(re)) return `G3-${two}`; if (/^\^G4-/.test(re)) return `G4-${two}`;
  throw new Error(`no synthetic id for ${re}`);
};

/** A fill that exercises every section of a plan: two rows per table, a matrix group, two blocks, a heat map, two recommendations, one gap. */
function syntheticFill(lens: string, language: "en" | "es") {
  const p = plan(lens); const sections: Record<string, any> = {}; const ids: string[] = []; const firstIds: Record<string, string[]> = {};
  let counter = 0;
  const cells = (cols: string[], subject: string) => Object.fromEntries(cols.filter((c) => c !== "#" && c !== "ID").map((c) => [c, /component|technology|data store|threat|trust boundary|cycle path|title|store/i.test(c) ? subject : /severity|risk/i.test(c) ? "High" : /tier/i.test(c) ? (lens === "blast-radius" ? "S2" : lens === "bottleneck" ? "B1" : "T1") : `${c} value`]));
  p.sections.forEach((s: any) => {
    if (s.kind === "table") {
      const rows = [1, 2].map((k) => { let id: string; if (s.repeatsIds) { const pool = ids.filter((x) => new RegExp(s.id).test(x)); id = pool[k - 1]; if (!id) return null; } else { counter++; id = idFor(s.id, counter); ids.push(id); } return { id, cells: cells(s.columns, `\`Component ${id}\``) }; }).filter(Boolean);
      firstIds[s.key] = rows.map((r: any) => r.id); sections[s.key] = { rows };
    } else if (s.kind === "inventory") sections[s.key] = { rows: [1, 2].map((k) => ({ cells: cells(s.columns, `\`Store ${k}\``) })) };
    else if (s.kind === "matrix") { counter++; const id = idFor(s.id, counter); ids.push(id); sections[s.key] = { groups: [{ id: "TB-01", title: "Internet → API Gateway", header: { "Auth Mechanism": "OAuth2 JWT", Data: "PII" }, rows: [{ id, cells: cells(s.columns, "Token replay") }, { id: "—", cells: Object.assign(cells(s.columns, "Tampering in transit"), { Status: "✅ Pass" }) }] }] }; }
    else if (s.kind === "blocks") sections[s.key] = { blocks: [{ title: "Scenario 1 — `Component A` fails", text: "Two consumers cascade.", mermaid: "flowchart TB\n  A[Component A fails] --> B[Consumer B]", table: { columns: ["Hop #", "Component", "p95 (ms)", "Status"], rows: [["1", "`Gateway`", "40", "within"], ["2", "`Service`", "120", "over"]] } }, { title: "Scenario 2 — `Component B` fails", text: "Contained." }] };
    else if (s.kind === "text") sections[s.key] = { text: "Edges run from caller to callee." };
    else if (s.kind === "strengths") sections[s.key] = { items: ["TLS 1.3 everywhere", "Secrets in Key Vault"] };
  });
  const hm = p.sections.find((s: any) => s.kind === "heatmap");
  const heatmap = hm ? ids.slice(0, 3).map((id, i) => ({ id, x: 1 + (i % hm.axes.x.n), y: 1 + (i % hm.axes.y.n) })) : [];
  const viz = lens === "blast-radius" ? { graph: { nodes: ids.map((id) => ({ id, label: `Component ${id}`, fanout: 2, tier: "S2" })), links: ids.length > 1 ? [{ source: ids[0], target: ids[1], cascade: "Cascading" }] : [] } }
    : lens === "data-sensitivity" ? { sankey: { nodes: [{ name: "Store 1", tier: "S1" }, { name: "Store 2", tier: "S3" }], links: [{ source: 0, target: 1, value: 1, encrypted: true, label: "TLS" }] } } : undefined;
  return { lens, language, today: "2026-09-13", viz, project: { name: "Test Solution", version: "1.2.0", status: "Released", source: "ARCHITECTURE.md" }, summary: ["First paragraph.", "Second paragraph."], sections, heatmap, recommendations: ids.slice(0, 2).map((id, i) => ({ id, title: `Do the thing ${i + 1}`, body: "Specific action and trade-off.", source: "docs/05-integration-points.md § 7.1" })), verdict: "Overall posture sentence.", gaps: [{ subject: "`Component X`", missing: "RTO", where: "docs/09-operational-considerations.md § 11.5" }], citations: ["ARCHITECTURE.md", "docs/05-integration-points.md"] };
}
const run = (fillObj: any, extra: string[] = []) => {
  const fp = join(dir, `${fillObj.lens}-${fillObj.language}.fill.json`); writeFileSync(fp, JSON.stringify(fillObj));
  const r = Bun.spawnSync([process.execPath, RENDER, fp, "--project", dir, "--json", ...extra], { stdout: "pipe", stderr: "pipe", env: Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "SA_JUDGE")) });   // the default engine, agent
  const out = r.stdout.toString(); let parsed: any = null; try { parsed = JSON.parse(out); } catch { /* validation errors print to stderr */ }
  return { code: r.exitCode, out, err: r.stderr.toString(), json: parsed };
};

describe("render-analysis — one report per lens (8.117.0)", () => {
  test("a report that passes sends the earlier one of its lens to analysis/archive/", () => {
    const fill = syntheticFill("spof", "en");
    expect(run(fill).code).toBe(0);
    const later = run(fill, ["--today", "2026-09-20"]);
    expect(later.code).toBe(0);
    expect(later.json.archived).toContain("archive/SPOF-2026-09-13.md");
    expect(existsSync(join(dir, "analysis", "SPOF-2026-09-13.md"))).toBe(false);
    expect(existsSync(join(dir, "analysis", "archive", "SPOF-2026-09-13.md"))).toBe(true);
  });
});

describe("render-analysis", () => {
  for (const lens of lenses) {
    test(`${lens}: the synthetic fill renders a Markdown report that passes the contract, in both languages`, () => {
      for (const language of ["en", "es"] as const) {
        const r = run(syntheticFill(lens, language));
        expect(r.err).toBe("");
        expect(JSON.stringify((r.json || {}).errors) + JSON.stringify((r.json || {}).html)).toBe("[][]");
        expect(r.code).toBe(0);
        expect(r.json.ok).toBe(true);
        const md = readFileSync(resolve(r.json.file), "utf8")   /* the report names the file relative to the cwd */;
        expect(md).toContain("<!-- SECTION: Executive Summary -->");
        expect(md).toContain("<!-- SECTION: Summary Verdict -->");
        expect(md).toMatch(/\*\*1\. Do the thing 1 \(/);
        const p = plan(lens);
        p.sections.filter((s: any) => s.kind === "table").forEach((s: any) => expect(md).toContain(`<!-- SECTION: ${s.key} -->`));
        if (p.sections.some((s: any) => s.kind === "heatmap")) expect(md).toMatch(/```\n[\s\S]*│[\s\S]*```/);
        // the check's own reading: every synthetic finding is a finding with a severity
        const items = F.extractMarkdown(md, p.slug).items;
        expect(items.length).toBeGreaterThan(0);
        items.forEach((it: any) => expect(it.severity).toBeTruthy());
      }
    });
    test(`${lens}: the HTML render fills every token and keeps one viz section`, () => {
      const r = run(syntheticFill(lens, "en"), ["--format", "html"]);
      expect(r.err).toBe("");
      expect(JSON.stringify((r.json || {}).errors) + JSON.stringify((r.json || {}).html)).toBe("[][]");
      expect(r.json.ok).toBe(true);
      const html = readFileSync(resolve(r.json.file), "utf8")   /* the report names the file relative to the cwd */;
      expect(html).not.toMatch(/\{\{[A-Z_]+\}\}/);
      expect((html.match(/<section class="report-section" id="visualization">/g) || []).length).toBe(1);
      expect(html).toContain("const data = {");
    });
  }

  test("the fill validation names an id off the scheme, a missing column, a heat-map cell off the grid and an undeclared section", () => {
    const f: any = syntheticFill("spof", "en");
    f.sections["Critical SPOFs"].rows[0].id = "B1";
    delete f.sections["Degradation SPOFs"].rows[0].cells["Impact"];
    f.heatmap = [{ id: "C1", x: 9, y: 1 }];
    f.sections["Nonexistent"] = { rows: [] };
    const r = run(f);
    expect(r.code).toBe(1);
    const errs = r.json.errors.join("\n");
    expect(errs).toContain('id "B1" does not match');
    expect(errs).toContain('missing column "Impact"');
    expect(errs).toContain("cells run 1..3");
    expect(errs).toContain('section "Nonexistent" is not in the spof plan');
  });

  test("a repeated-id table must list ids an earlier table carries", () => {
    const f: any = syntheticFill("stride", "en");
    f.sections["High-Priority Threats"].rows[0].id = "T99-S";
    const r = run(f);
    expect(r.code).toBe(1);
    expect(r.json.errors.join("\n")).toContain('"T99-S" lists a finding that no earlier table carries');
  });

  test("blast radius joins the SPOF ids of the SPOF report on disk", () => {
    const spof = run(syntheticFill("spof", "en"));
    expect(spof.json.ok).toBe(true);
    const f: any = syntheticFill("blast-radius", "en");
    f.sections["High-Blast Components"].rows[0].cells.Component = "`Component C1`";   // the SPOF report names this subject
    const r = run(f);
    expect(r.json.ok).toBe(true);
    expect(r.json.crossRefs.joined).toBe(1);
    const md = readFileSync(resolve(r.json.file), "utf8")   /* the report names the file relative to the cwd */;
    expect(md).toMatch(/\| B1 ⚡ SPOF\+Blast \| `Component C1` \(SPOF C1\)/);
  });

  test("a blast label the judge has not answered joins nothing and is reported as undecided with the worksheet", () => {
    run(syntheticFill("spof", "en"));
    const f: any = syntheticFill("blast-radius", "en");
    f.sections["High-Blast Components"].rows[0].cells.Component = "`Component C1 primary node`";   // a qualified label: the judge's to read
    const r = run(f);
    expect(r.json.ok).toBe(true);
    expect(r.json.crossRefs.joined).toBe(0);
    expect(r.json.crossRefs.undecided).toContain("`Component C1 primary node`");
    expect(r.json.crossRefs.pending).toMatch(/\.md$/);
  });
});
