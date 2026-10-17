/**
 * capability-prepare.js — the PO Spec onto the bundled BIAN landscape. Rules under test: the corpus parses to 8 areas, 43
 * domains and 341 Service Domains with their definitions, and the registry's DOM / CAP codes join by name; the brief is
 * the business "what" cut from the spec; one Noul per (use case, Service Domain) — a pair the judge has not answered is
 * undecided, never a claim nor a dismissal, and the report counts it with the worksheet; a claim at ≥ 0.75 makes the Service Domain claimed, the realizes / consumes Choice runs only for the
 * claimed, and the Business Domain and Area statuses are derived bottom-up; a pair between 0.4 and 0.75 is printed as a
 * candidate and never counted; every definition in the report is verbatim; --verify measures the cuts against a reviewed report.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const { loadCorpus, briefOf, align, report, verifyAgainst, SA_SKILLS, REGISTRY, NO_JUDGE } = require("../scripts/capability-prepare.js");
const TMP = join(import.meta.dir, ".temp-bian");
// the DOM / CAP codes come from the Design Language Standard, which ships with sa-skills' architecture-docs, and the
// judge is sa-skills' too — both optional to this skill, which ships in sa-requirements
const CODES = !!REGISTRY && existsSync(REGISTRY);
const judged = SA_SKILLS ? test : test.skip;
const w = (rel: string, s: string) => { mkdirSync(join(TMP, rel, ".."), { recursive: true }); writeFileSync(join(TMP, rel), s); };
const SPEC = [
  "# PO Spec", "", "## 1. Business Context <!-- SECTION: Business Context -->", "", "### Problem Statement <!-- SECTION: Problem Statement -->", "", "Customers lose access to their transfer history when the online path degrades.", "",
  "## 3. Business Objectives <!-- SECTION: Business Objectives -->", "", "### Primary Business Goals <!-- SECTION: Primary Business Goals -->", "", "1. **OBJ-1**: read the history without the backend.", "",
  "## 4. Use Cases <!-- SECTION: Use Cases -->", "",
  "### UC-01: Consult the transfer history with a contact", "", "**Description**: The customer opens the chat and reviews transfers with a counterparty, served from a facility on the customer's own device.", "", "**Actors**: Customer · Mobile app", "",
  "### UC-05: Remote wipe on device change", "", "**Description**: The bank revokes the device's entitlement and the local data is destroyed.", "",
  "## 5. Stories", "",
].join("\n");

// the Service Domains the landscape in force defines: 341 under an institution pack's full landscape, the 257 with a published
// API description under the open corpus — the judge is asked about those only
// what the base's own (open) corpus defines — a copy run without sa-skills never sees a pack
const BUNDLED_DEFINED = require("fs").readdirSync(join(import.meta.dir, "..", "references", "bian-v14")).filter((f: string) => /^BIAN-v14-\d.*\.md$/.test(f))
  .reduce((n: number, f: string) => n + (require("fs").readFileSync(join(import.meta.dir, "..", "references", "bian-v14", f), "utf8").match(/^\*\*What it does\.\*\*/gm) || []).length, 0);
const DEFINED = loadCorpus().areas.reduce((n: number, a: any) => n + a.domains.reduce((m: number, d: any) => m + d.services.filter((x: any) => x.what).length, 0), 0);
beforeAll(() => { rmSync(TMP, { recursive: true, force: true }); w("ARCHITECTURE.md", "# A\n"); w("PRODUCT_OWNER_SPEC.md", SPEC); });
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("capability-prepare", () => {
  test("the corpus: 8 areas, 43 domains, 341 Service Domains with verbatim definitions, codes joined from the registry", () => {
    const c = loadCorpus();
    expect(c.areas.length).toBe(8); expect(c.areas.reduce((n: number, a: any) => n + a.domains.length, 0)).toBe(43);
    expect(c.areas.reduce((n: number, a: any) => n + a.domains.reduce((m: number, d: any) => m + d.services.length, 0), 0)).toBe(341);
    const channels = c.areas.find((a: any) => a.name === "Channels"), xchn = channels.domains.find((d: any) => d.name === "Cross Channel");
    if (CODES) { expect(channels.dom).toBe("CNL"); expect(xchn.cap).toBe("XCHN"); expect(xchn.bian_id).toBe("146482"); }
    else { expect(channels.dom).toBeUndefined(); expect(xchn.cap).toBeUndefined(); }
    const wb = xchn.services.find((s: any) => s.name === "Customer Workbench"); expect(wb.bian_id).toBe("44851"); expect(wb.what).toMatch(/client device based\/resident facility|customer side devices/);   // the full landscape's definition, or the API's own description
    expect(c.areas.find((a: any) => a.name === "Business Development").domains.some((d: any) => d.name === "Intelectual Property And Knowledge")).toBe(true);   // BIAN's spelling, reproduced
  });
  test("the brief is the business what, cut from the spec", () => {
    const b = briefOf(SPEC);
    expect(b.problem).toContain("lose access"); expect(b.objectives).toContain("OBJ-1");
    expect(b.use_cases.map((u: any) => u.id)).toEqual(["UC-01", "UC-05"]); expect(b.use_cases[0].actors).toBe("Customer · Mobile app");
  });
  judged("one Noul per pair; unanswered pairs are undecided and reported; a claim makes the levels above it by code; a candidate below the cut is printed, not counted", async () => {
    const h = await align(TMP, { engine: "agent", cache: false, today: "2026-09-21" });
    expect(h.judge.rounds[0]).toMatchObject({ spec: "bian-claim", asked: 3 * DEFINED, pending: true });   // two use cases + the objectives unit
    expect(h.judge.undecided.pairs).toBe(3 * DEFINED); expect(h.judge.undecided.by_use_case).toEqual({ "UC-01": DEFINED, "UC-05": DEFINED, OBJ: DEFINED });
    expect(h.judge.worksheets.length).toBe(1);
    expect(h.corpus.areas.every((a: any) => a.verdict.choice === "undecided")).toBe(true);                // nothing claimed, nothing dismissed
    const hmd = report(h);
    expect(hmd).toContain("## Undecided"); expect(hmd).toContain(`${3 * DEFINED} use-case × Service Domain pair(s)`); expect(hmd).toContain(h.judge.worksheets[0]);
    expect(hmd).toContain("| 7 | Channels |"); expect(hmd).toMatch(/\| 7 \| Channels \| [^|]+ \| ❔ Undecided \|/); expect(hmd).not.toContain("term-overlap");
    const seen: any[] = [];
    const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); seen.push(b); const answers: any = {};
      for (const [id, q] of Object.entries<any>(b.questions)) { const st = b.state.items[id];
        if (q.type === "noul") answers[id] = { type: "noul", noul: /Customer Workbench/.test(st.service_domain) && st.use_case.id === "UC-01" ? 0.93 : /Party Authentication/.test(st.service_domain) && st.use_case.id === "UC-05" ? 0.81 : /Customer Access Entitlement/.test(st.service_domain) ? 0.55 : 0.03 };
        else answers[id] = { type: "choice", choice: /Workbench/.test(st.service_domain) ? "realizes" : "consumes", probabilities: {}, confidence: 0.8 }; }
      return { ok: true, json: async () => ({ model: "jev-test", answers }) }; };
    const j = await align(TMP, { engine: "typesafe", apiKey: "k", fetch, cache: false, today: "2026-09-21", chunk: 400 });
    expect(j.judge.undecided).toEqual({ pairs: 0, by_use_case: {}, roles: [] }); expect(j.judge.rounds.map((x: any) => `${x.spec} ${x.asked}`)).toEqual([`bian-claim ${3 * DEFINED}`, "bian-role 2"]);
    expect(seen.some((b) => b.questions[Object.keys(b.questions)[0]].type === "noul" && Object.keys(b.state.items).length <= 400)).toBe(true);
    const channels = j.corpus.areas.find((a: any) => a.name === "Channels"), xchn = channels.domains.find((d: any) => d.name === "Cross Channel");
    expect(channels.verdict).toMatchObject({ choice: "impacted", by: "derived" }); expect(xchn.verdict.choice).toBe("impacted");
    expect(xchn.services.find((s: any) => s.name === "Customer Workbench").verdict).toMatchObject({ choice: "realizes", by: "jev-test" });
    expect(xchn.services.find((s: any) => s.name === "Party Authentication").verdict.choice).toBe("consumes");
    expect(xchn.services.find((s: any) => s.name === "Customer Access Entitlement").verdict).toBeNull();                        // 0.55: a candidate, not a claim
    expect(j.judge.unsettled.map((u: any) => u.service)).toEqual(["Customer Access Entitlement", "Customer Access Entitlement", "Customer Access Entitlement"]);   // one per unit, the objectives included
    expect(j.corpus.areas.filter((a: any) => a.verdict.choice === "not_applicable").length).toBe(7);
    const md = report(j);
    if (CODES) {
      expect(md).toContain("| 7 | Channels | `CNL` | 🟢 Impacted | 1/5 | 2 |");
      expect(md).toContain("| Channels | `CNL` | Cross Channel | `XCHN` | `146482` | 🟢 |");
    } else {
      expect(md).toContain("| 7 | Channels | — | 🟢 Impacted | 1/5 | 2 |");
      expect(md).not.toContain("`XCHN`");
    }
    expect(md).toContain("| Customer Workbench | `44851` | **Realizes** <!-- jev-test 0.8 --> | § 4 (UC-01 0.93) |");
    expect(md).toContain("## Candidates Below the Cut"); expect(md).toContain("Customer Access Entitlement ← UC-01 at 0.55");
    expect(md).toContain("realizes** capability in `Channels`: `Customer Workbench`"); expect(md).not.toContain("## Undecided");
    // --verify against a reviewed report: the two claims reach the gold, the candidate is reached at a lower cut
    w("GOLD.md", "| Customer Workbench | `44851` | **Realizes** | § 4 | \"…\" |\n| Party Authentication | `38917` | Consumes | § 4 | \"…\" |\n| Customer Access Entitlement | `43057` | Consumes | § 4 | \"…\" |\n");
    const v = verifyAgainst(j, join(TMP, "GOLD.md"));
    expect(v.gold.length).toBe(3);
    expect(v.cuts.find((c: any) => c.cut === 0.75)).toMatchObject({ claimed: 2, gold_reached: 2, precision: 1, missed: ["Customer Access Entitlement"] });
    expect(v.cuts.find((c: any) => c.cut === 0.5)).toMatchObject({ claimed: 3, gold_reached: 3, precision: 1 });
  });
});

describe("capability-prepare — the brief in English", () => {
  test("--brief replaces the brief cut from the spec, and the objectives and constraints become pair units", async () => {
    const { align } = require("../scripts/capability-prepare.js");
    writeFileSync(join(TMP, "brief.json"), JSON.stringify({ problem: "p", objectives: "OBJ-1 read the history offline", use_cases: [{ id: "UC-01", name: "Consult the history", description: "A facility on the customer's device gives local access to the bank's accounts.", actors: "Customer" }], regulatory_and_integration_constraints: "12-month retention on the device under the bank's obligations." }));
    const r = await align(TMP, { brief: "brief.json", engine: "agent", cache: false });
    expect(r.brief.problem).toBe("p");
    if (SA_SKILLS) expect(r.judge.rounds[0]).toMatchObject({ spec: "bian-claim", asked: 3 * DEFINED });   // one use case + objectives + constraints
    expect(r.judge.undecided.pairs).toBe(3 * DEFINED);                                                       // pending (or no judge): every pair undecided
  });
});

describe("capability-prepare — without sa-skills", () => {
  // sa-requirements installed alone: in this repository sa-skills always sits above the skill, so the module would find it.
  // The test copies what the script loads (the skill's scripts and BIAN corpus, sa-requirements' po-spec.js) to a directory
  // no sa-skills is reachable from — no SA_SKILLS_DIR, an empty Claude config dir — and runs it there, in its own process.
  test("no judge: every claim is undecided, nothing is ranked, and the report says no judge was available", () => {
    const { cpSync, mkdtempSync } = require("fs"); const { tmpdir } = require("os"); const { spawnSync } = require("child_process");
    const iso = mkdtempSync(join(tmpdir(), "bian-alone-"));
    try {
      const plug = join(iso, "plugins", "sa-requirements"), skill = join(plug, "skills", "architecture-capability-alignment");
      cpSync(join(import.meta.dir, "..", "scripts"), join(skill, "scripts"), { recursive: true });
      cpSync(join(import.meta.dir, "..", "references"), join(skill, "references"), { recursive: true });
      cpSync(join(import.meta.dir, "..", "..", "..", "scripts", "shared", "po-spec.js"), join(plug, "scripts", "shared", "po-spec.js"));
      mkdirSync(join(iso, "claude"));
      const probe = `const b = require(${JSON.stringify(join(skill, "scripts", "capability-prepare.js"))});
        b.align(${JSON.stringify(TMP)}, { engine: "typesafe", today: "2026-09-21" }).then((h) => { const md = b.report(h);
          console.log(JSON.stringify({ sa: b.SA_SKILLS, engine: h.judge.engine, warnings: h.judge.warnings, noJudge: b.NO_JUDGE, pairs: h.judge.undecided.pairs,
            allUndecided: h.corpus.areas.every((a) => a.verdict.choice === "undecided"), says: md.includes("No judge was available"), undecidedSection: md.includes("## Undecided"), overlap: md.includes("term-overlap") })); });`;
      const env: Record<string, string | undefined> = { ...process.env, CLAUDE_CONFIG_DIR: join(iso, "claude") }; delete env.SA_SKILLS_DIR;
      const r = spawnSync(process.execPath, ["-e", probe], { encoding: "utf8", env, cwd: iso });
      expect(r.stderr).toBe("");
      const h = JSON.parse(r.stdout);
      expect(h.sa).toBeNull();
      expect(h.engine).toBe("none"); expect(h.warnings).toContain(h.noJudge);
      // the open corpus carries no definition for the Service Domains without a published API: they are counted, never judged
      expect(h.warnings.filter((w: string) => w !== h.noJudge).every((w: string) => /carry no definition/.test(w))).toBe(true);
      expect(h.pairs).toBe(3 * BUNDLED_DEFINED); expect(h.allUndecided).toBe(true);
      expect(h.says).toBe(true); expect(h.undecidedSection).toBe(true); expect(h.overlap).toBe(false);
    } finally { rmSync(iso, { recursive: true, force: true }); }
  });
});

describe("capability-prepare — the brief's language", () => {
  judged("a Spanish brief against the English definitions is named as a warning under a judge; an English one is silent", async () => {
    const { briefLanguage, align } = require("../scripts/capability-prepare.js");
    expect(briefLanguage({ problem: "", objectives: "", use_cases: [{ name: "Consult the history", description: "The customer opens the chat and reviews the transfers with the counterparty from the device." }], regulatory_and_integration_constraints: "" })).toBe("en");
    const es = { problem: "El cliente pierde el acceso al historial de transferencias cuando la ruta en línea se degrada.", objectives: "Leer el historial sin el backend para los clientes habilitados del banco.", use_cases: [{ id: "UC-01", name: "Consultar el historial con un contacto", description: "El cliente abre el chat y revisa las transferencias con la contraparte, servidas desde el dispositivo." }], regulatory_and_integration_constraints: "" };
    expect(briefLanguage(es)).toBe("es");
    expect(briefLanguage({ problem: "", objectives: "", use_cases: [], regulatory_and_integration_constraints: "" })).toBe("unknown");
    writeFileSync(join(TMP, "brief-es.json"), JSON.stringify(es));
    const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); const answers: any = {}; for (const id of Object.keys(b.questions)) answers[id] = { type: "noul", noul: 0.02 }; return { ok: true, json: async () => ({ model: "jev-test", answers }) }; };
    const j = await align(TMP, { brief: "brief-es.json", engine: "typesafe", apiKey: "k", fetch, cache: false, chunk: 400 });
    const lw = (w: string[]) => w.filter((x) => !/carry no definition/.test(x));   // the open corpus's own note is not about the brief
    expect(lw(j.judge.warnings).length).toBe(1); expect(lw(j.judge.warnings)[0]).toMatch(/reads as Spanish against BIAN's English definitions.*--brief/);
    const e = await align(TMP, { brief: "brief.json", engine: "typesafe", apiKey: "k", fetch, cache: false, chunk: 400 });
    expect(e.judge.brief_language).toBe("en"); expect(lw(e.judge.warnings)).toEqual([]); expect(e.judge.brief_source).toBe("brief.json");
  });
});

describe("capability-prepare — another framework (the cross-industry map)", () => {
  const { frameworkOf, questionsOf, relabel } = require("../scripts/capability-prepare.js");
  test("the corpus parses by its framework.json: 9 Domains, 41 Capability Groups, 223 Capabilities, every one defined", () => {
    const F = frameworkOf(TMP, "cross-industry"), c = loadCorpus(F);
    expect(F.report).toBe("CAPABILITY_ALIGNMENT.md"); expect(c.codes_available).toBe(false);
    expect(c.areas.length).toBe(9);
    expect(c.areas.reduce((n: number, a: any) => n + a.domains.length, 0)).toBe(41);
    const units = c.areas.flatMap((a: any) => a.domains.flatMap((d: any) => d.services));
    expect(units.length).toBe(223); expect(units.every((u: any) => u.what && u.bian_id)).toBe(true);
  });
  test("the questions name the framework and the organization; BIAN keeps the wording it was measured with", () => {
    const q = questionsOf(frameworkOf(TMP, "cross-industry"));
    expect(q.claim.question).toMatch(/business capability Cross-Industry Capability Map defines/); expect(q.claim.question).not.toMatch(/BIAN|bank/);
    expect(q.role.question).toMatch(/realize this Capability/);
    const b = questionsOf(frameworkOf(TMP, "BIAN")); expect(b.claim.id).toBe("bian-claim"); expect(b.claim.question).toMatch(/banking capability BIAN defines/);
  });
  test("its report: generic markers and title, its counts and levels, no API Surface, definitions untouched", async () => {
    const r = await align(TMP, { framework: "cross-industry", engine: "agent", today: "2026-10-17" });
    const md = report(r);
    expect(md).toMatch(/^<!-- ALIGNMENT_FRAMEWORK: CROSS-INDUSTRY -->\n<!-- ALIGNMENT_VERSION: 1\.0 -->/m);
    expect(md).toMatch(/^# Capability Alignment <!-- SECTION: Capability Alignment -->$/m);
    expect(md).toMatch(/9 Domains · 41 Capability Groups · 223 Capabilities/);
    expect(md).not.toMatch(/BIAN|Service Domain|Business Area|API Surface/);
    expect(relabel('| x | "a Business Domain inside a quote" | Business Domain |', r)).toBe('| x | "a Business Domain inside a quote" | Capability Group |');
  });
});
