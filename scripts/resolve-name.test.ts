/**
 * resolve-name.js — one resolver for "which component does this name refer to". Rules under test:
 * containment only finds the candidates — an exact name is code's, and a cell no judge has answered is
 * undecided, never resolved by the old rule (8.119.0); the judge picks among the candidates code found, so a cell naming two
 * components resolves to the one it names first and reports the second; a name the ledger carries
 * twice is offered once per level with its tagline; a cell containing no name is offered every
 * file-backed component, so a paraphrase can resolve; `none` and a low-confidence pick are
 * unresolved with a reason; fixtures separate a recall miss from a judge miss.
 */
import { describe, test, expect } from "bun:test";
import { join } from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";

const R = require(join(import.meta.dir, "resolve-name.js"));
const { resolveNames, verifyResolutions, containmentHits, optionKeys } = R;

const facts = [
  { name: "Aplicación Tienda Móvil", slug: "app", level: "L2", system: "Tienda Movil", description: "Aplicación Tienda Móvil — the mobile app", file_backed: true },
  { name: "Base Local de Pedidos", slug: "base-local", level: "L2", system: "Tienda Movil", description: "Base Local de Pedidos — the on-device store", file_backed: true },
  { name: "Core Contable", slug: "core-contable", level: "L1", system: null, description: null, file_backed: true },
  { name: "Core Contable", slug: "core-contable-l2", level: "L2", system: "Core Contable", internal_name: "COR0009 - Books", description: "Core Contable — the ledger of record", file_backed: false },
  { name: "Servicio de Replicación", slug: "replicacion", level: "L2", system: "Tienda Movil", description: "Servicio de Replicación — replicates", file_backed: true },
];
const cells = [
  { id: "I-06:to", cell: "`Aplicación Tienda Móvil` y `Base Local de Pedidos`", context: { integration: "I-06" } },
  { id: "I-03:to", cell: "Core Contable", context: { integration: "I-03" } },
  { id: "I-07:to", cell: "AppDome", context: { integration: "I-07" } },
  { id: "I-09:from", cell: "la app móvil del banco", context: { integration: "I-09" } },
  { id: "I-14:to", cell: "`Servicio de Replicación`", context: { integration: "I-14" } },   // exactly one candidate's name: code answers, the judge never sees it
];
/** A fake API: answers by item id; records every request. */
function fake(reply: (id: string, q: any) => any) {
  const calls: any[] = [];
  const fetch = async (_u: string, init: any) => { const b = JSON.parse(init.body); calls.push(b); const answers: any = {}; for (const [id, q] of Object.entries(b.questions)) answers[id] = reply(id, q); return { ok: true, json: async () => ({ model: "jev-test", answers }) }; };
  return { fetch, calls };
}

describe("resolve-name", () => {
  test("no judge answer yet: an exact name resolves by code, every other cell is undecided with the worksheet named (8.119.0)", async () => {
    const res = await resolveNames(cells, facts, { engine: "agent", root: mkdtempSync(join(tmpdir(), "rn-")) });
    expect(res.pending).toContain("resolve-name");
    expect(res.get("I-14:to")).toMatchObject({ name: "Servicio de Replicación", by: "exact", resolved: true });
    for (const id of ["I-06:to", "I-03:to", "I-07:to", "I-09:from"]) {
      expect(res.get(id)).toMatchObject({ resolved: false, undecided: true, by: "undecided", name: null });   // never the earliest containment hit
      expect(res.get(id).unresolved_reason).toContain("worksheet is pending");
    }
    expect(containmentHits("Aplicación Tienda Móvil y Base Local de Pedidos", facts).map((h: any) => h.f.slug)).toEqual(["app", "base-local"]);
  });
  test("the judge picks among code's candidates and reports the second name", async () => {
    const api = fake((id, q) => {
      if (q.type === "noul") return { type: "noul", noul: q.instructions.item === "items.I-06:to::1" ? 0.92 : 0.05 };   // the second hit of I-06's cell
      if (id === "I-06:to") return { type: "choice", choice: "Aplicación Tienda Móvil", probabilities: {}, confidence: 0.9 };
      if (id === "I-03:to") return { type: "choice", choice: "Core Contable (L2)", probabilities: {}, confidence: 0.8 };
      if (id === "I-07:to") return { type: "choice", choice: "none", probabilities: {}, confidence: 0.95 };
      return { type: "choice", choice: "Aplicación Tienda Móvil", probabilities: {}, confidence: 0.5 };
    });
    const res = await resolveNames(cells, facts, { engine: "typesafe", apiKey: "k", fetch: api.fetch, cache: false });
    expect(api.calls.every((c) => Object.keys(c.questions).length === 1)).toBe(true);        // one item per request (8.120.4)
    const q = (id: string) => api.calls.find((c) => c.questions[id])?.questions[id];
    const which = { questions: { "I-06:to": q("I-06:to"), "I-03:to": q("I-03:to"), "I-09:from": q("I-09:from"), "I-14:to": q("I-14:to") } };
    expect(Object.keys(which.questions["I-06:to"].criteria)).toEqual(["none", "Aplicación Tienda Móvil", "Base Local de Pedidos"]);   // the containment hits, in cell order
    expect(Object.keys(which.questions["I-03:to"].criteria)).toEqual(["none", "Core Contable (L1)", "Core Contable (L2)"]);            // a tie offered once per level
    expect(which.questions["I-03:to"].criteria["Core Contable (L2)"].internal_name).toBe("COR0009 - Books");
    expect(Object.keys(which.questions["I-09:from"].criteria).length).toBe(1 + facts.filter((f) => f.file_backed).length);            // no hit: every file-backed component
    expect(res.get("I-06:to")).toMatchObject({ name: "Aplicación Tienda Móvil", by: "jev-test", confidence: 0.9, also: ["Base Local de Pedidos"], band: "high" });
    expect(res.get("I-03:to").fact.slug).toBe("core-contable-l2");
    expect(which.questions["I-14:to"]).toBeUndefined();
    expect(res.get("I-14:to")).toMatchObject({ name: "Servicio de Replicación", by: "exact", resolved: true, band: "high" });   // on the reference Jev answered `none` at 0.05 for an exact name; code owns that case
    expect(res.get("I-07:to")).toMatchObject({ resolved: false, unresolved_reason: "names no documented component" });
    expect(res.get("I-09:from")).toMatchObject({ name: null, band: "mid", resolved: false });                                        // a paraphrase at mid confidence: named as possible, never resolved
    expect(res.get("I-09:from").unresolved_reason).toContain("possibly Aplicación Tienda Móvil (0.5)");
    const sure = await resolveNames([cells[3]], facts, { engine: "typesafe", apiKey: "k", cache: false, fetch: fake(() => ({ type: "choice", choice: "Aplicación Tienda Móvil", probabilities: {}, confidence: 0.9 })).fetch });
    expect(sure.get("I-09:from")).toMatchObject({ name: "Aplicación Tienda Móvil", band: "high", resolved: true });                  // a paraphrase at high confidence resolves
    const low = await resolveNames([cells[3]], facts, { engine: "typesafe", apiKey: "k", cache: false, fetch: fake(() => ({ type: "choice", choice: "Aplicación Tienda Móvil", probabilities: {}, confidence: 0.2 })).fetch });
    expect(low.get("I-09:from")).toMatchObject({ resolved: false, band: "low" }); expect(low.get("I-09:from").unresolved_reason).toContain("below the floor");
  });
  test("mentions: which components a text is about — unanswered candidates are undecided, the judge drops one named in passing", async () => {
    const { mentions, mentionCandidates } = R;
    const text = "Aplicación Tienda Móvil has no fallback when Servicio de Replicación is down. Recommendation: cache in Base Local de Pedidos.";
    expect(mentionCandidates(text, facts).map((f: any) => f.slug)).toEqual(["app", "base-local", "replicacion"]);
    expect(mentionCandidates("the replication service", facts, { aliases: new Map([["replication service", facts[4]]]) }).map((f: any) => f.slug)).toEqual(["replicacion"]);
    expect(mentionCandidates("cluster de tienda movil en la region norte", [{ name: "Tienda Movil Region Norte" }], { looseWords: true }).length).toBe(1);   // every significant word present
    const h = await mentions([{ id: "f1", text }], facts, { engine: "agent", root: mkdtempSync(join(tmpdir(), "rn-")) });
    expect(h.get("f1").names).toEqual([]);                                                    // nothing kept on a guess (8.119.0)
    expect(h.get("f1").undecided).toEqual(["Aplicación Tienda Móvil", "Base Local de Pedidos", "Servicio de Replicación"]);
    const api = fake((id) => ({ type: "noul", noul: id.endsWith("::1") ? 0.08 : 0.9 }));   // the second candidate, Base Local, is named only in the recommendation
    const j = await mentions([{ id: "f1", text }], facts, { engine: "typesafe", apiKey: "k", fetch: api.fetch, cache: false });
    expect(api.calls.flatMap((c) => Object.keys(c.questions)).sort()).toEqual(["f1::0", "f1::1", "f1::2"]);   // one item per request (8.120.4)
    const one = api.calls.find((c) => c.questions["f1::1"]);
    expect(one.questions["f1::1"].type).toBe("noul"); expect(one.state.items["f1::1"].candidate).toBe("Base Local de Pedidos");
    expect(j.get("f1").names).toEqual(["Aplicación Tienda Móvil", "Servicio de Replicación"]); expect(j.get("f1").by).toBe("jev-test");
    expect(j.get("f1").judged.find((x: any) => x.name === "Base Local de Pedidos").p).toBe(0.08);
  });
  test("option keys and fixtures", async () => {
    const keys = optionKeys(facts);
    expect(keys.get(facts[0])).toBe("Aplicación Tienda Móvil"); expect(keys.get(facts[2])).toBe("Core Contable (L1)");
    const api = fake((id, q) => q.type === "noul" ? { type: "noul", noul: id.endsWith("::1") ? 0.9 : 0.05 } : ({ type: "choice", choice: id === "I-07:to" ? "none" : id === "I-09:from" ? "Aplicación Tienda Móvil" : id === "I-03:to" ? "Core Contable (L2)" : "Aplicación Tienda Móvil", probabilities: {}, confidence: id === "I-09:from" ? 0.5 : 0.9 }));
    const res = await resolveNames(cells, facts, { engine: "typesafe", apiKey: "k", fetch: api.fetch, cache: false });
    const v = verifyResolutions([{ id: "I-06:to", label: "Aplicación Tienda Móvil", also: ["Base Local de Pedidos"] }, { id: "I-07:to", label: "none" }, { id: "I-09:from", label: "Aplicación Tienda Móvil" }, { id: "I-99:to", label: "none" }], res);
    expect(v.tp).toBe(2); expect(v.fn.map((f: any) => f.id)).toEqual(["I-09:from"]); expect(v.also_missed).toEqual([]); expect(v.unseen.map((f: any) => f.id)).toEqual(["I-99:to"]);
    expect(res.get("I-14:to").by).toBe("exact");
  });
});
