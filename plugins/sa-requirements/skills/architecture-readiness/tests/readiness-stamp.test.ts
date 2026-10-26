/**
 * readiness-stamp.js — the evaluation's stamp. Rules under test: `verified` is written only when the checkability rule is
 * answered in full with no Ready cap and the coherence gate passes; a check that waits writes nothing and exits PENDING;
 * the hash covers the text without the stamp (CRLF and trailing whitespace ignored), so any edit makes it stale; a chat
 * `draft` is replaced by `verified`, never kept beside it.
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const RS = require("../scripts/readiness-stamp.js");
let dir = "";
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "readiness-stamp-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const SPEC = "# Order Desk - Product Owner Specification\n\n## 3. Business Objectives <!-- SECTION: Business Objectives -->\n\n1. Reduce order capture time from 12 minutes to 4 minutes by Q2 2027.\n";
const write = (body = SPEC) => { const p = join(dir, "PRODUCT_OWNER_SPEC.md"); writeFileSync(p, body); return p; };
const checks = (chk: any, coh: any) => ({ checkability: async () => chk, coherence: async () => coh });
const OK = checks({ status: "PASS", ready_cap: null, capped_by: [] }, { status: "PASS", blocking: 0 });

describe("readiness-stamp", () => {
  test("both checks pass → verified, today's date, the hash of the text; a chat draft is replaced", async () => {
    const p = write(SPEC + "\n<!-- READINESS_CHECK: draft -->\n");
    expect(RS.stampOf(readFileSync(p, "utf8")).state).toBe("draft");
    const r = await RS.stamp(p, { checks: OK, date: "2026-10-25" });
    expect(r).toMatchObject({ status: "PASS", written: true });
    const out = readFileSync(p, "utf8");
    expect(out).not.toMatch(/draft/);
    expect(out.trim().split("\n").pop()).toBe(`<!-- READINESS_CHECK: verified 2026-10-25 sha256:${RS.specHash(SPEC)} -->`);
    expect(RS.stampOf(out)).toMatchObject({ state: "current", date: "2026-10-25" });
  });

  test("checkability FAIL outside the critical sections still stamps — the score is not stamped, the cap is", async () => {
    const p = write();
    const r = await RS.stamp(p, { checks: checks({ status: "FAIL", ready_cap: null, capped_by: [] }, { status: "PASS", blocking: 0 }), date: "2026-10-25" });
    expect(r.status).toBe("PASS");
  });

  test("a Ready cap or a blocking coherence finding fails and writes nothing; a check that waits is PENDING", async () => {
    const p = write();
    let r = await RS.stamp(p, { checks: checks({ status: "FAIL", ready_cap: 7.4, capped_by: ["Use Cases"] }, { status: "FAIL", blocking: 2 }) });
    expect(r.status).toBe("FAIL");
    expect(r.reasons.join("\n")).toMatch(/Ready cap 7.4 .*Use Cases[\s\S]*2 blocking/);
    expect(readFileSync(p, "utf8")).toBe(SPEC);
    r = await RS.stamp(p, { checks: checks({ status: "PENDING", ready_cap: null, capped_by: [] }, { status: "PASS", blocking: 0 }) });
    expect(r.status).toBe("PENDING");
    expect(readFileSync(p, "utf8")).toBe(SPEC);
  });

  test("any edit makes the stamp stale; CRLF and trailing whitespace do not", () => {
    const s = RS.stamped(SPEC, "2026-10-25");
    expect(RS.stampOf(s.replace(/\n/g, "\r\n") + "  \n").state).toBe("current");
    expect(RS.stampOf(s.replace("4 minutes", "5 minutes")).state).toBe("stale");
    expect(RS.stampOf(SPEC).state).toBe("none");
    expect(RS.stamped(s, "2026-10-26").match(/READINESS_CHECK/g)).toHaveLength(1);
  });
});
