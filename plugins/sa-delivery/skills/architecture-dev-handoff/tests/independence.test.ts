/**
 * The handoff kit is independent of compliance: it reads the architecture, its analyses and its ADRs, and nothing the
 * compliance skill writes. No file of the skill or of the agents that build the kit may name a compliance output or
 * cite a requirement code as a rule source.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";

const SKILL = resolve(import.meta.dir, "..");
const AGENTS = resolve(import.meta.dir, "..", "..", "..", "agents", "generators");
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === "tests" || n === "node_modules" ? [] : walk(p)) : [p]; });
// the agents' shared untrusted-content notice lists `compliance-docs/**` among files that are data, not instructions
const NOTICE = /`tdr\/\*\*`, `compliance-docs\/\*\*`/g;
const FORBIDDEN = [/compliance-docs/, /\bCC-\d{3}\b/, /COMPLIANCE_MANIFEST/, /sa-compliance:/, /\bSREnn\b/, /compliance contracts? \+/i, /## Compliance Rules/];

describe("the handoff kit reads nothing compliance writes", () => {
  test("no script, template, guide or kit agent names a compliance output", () => {
    const files = [...walk(SKILL), ...["ekonte", "settei", "seam", "cutsheet", "handoff-asset"].map((a) => join(AGENTS, `${a}-generator.md`))];
    const hits = files.flatMap((f) => { const text = readFileSync(f, "utf-8").replace(NOTICE, ""); return FORBIDDEN.filter((re) => re.test(text)).map((re) => `${f}: ${re}`); });
    expect(hits).toEqual([]);
  });
});
