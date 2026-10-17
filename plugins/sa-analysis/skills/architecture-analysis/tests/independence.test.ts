/**
 * The analysis skill is independent of compliance: it reads the architecture (ARCHITECTURE.md, docs/, adr/) and
 * nothing the compliance skill writes. A spec, a plan, the renderer or the agent that named `compliance-docs/`, a
 * contract file or a compliance cross-reference section would make a report depend on whether, and how, compliance
 * ran — so no file of the skill (or its agent) may.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";

const SKILL = resolve(import.meta.dir, "..");
const AGENT = resolve(import.meta.dir, "..", "..", "..", "agents", "reviewers", "architecture-analysis-agent.md");
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === "tests" ? [] : walk(p)) : [p]; });
const FORBIDDEN = [/compliance-docs/, /\bCC-\d{3}\b/, /COMPLIANCE_MANIFEST/, /complianceCrossReference/, /Compliance Cross-Reference/];

describe("the analysis skill reads nothing compliance writes", () => {
  test("no spec, plan, script, template or agent names a compliance output", () => {
    const hits = [...walk(SKILL), AGENT].flatMap((f) => {
      const text = readFileSync(f, "utf-8");
      return FORBIDDEN.filter((re) => re.test(text)).map((re) => `${f.replace(SKILL + "/", "")}: ${re}`);
    });
    expect(hits).toEqual([]);
  });
});
