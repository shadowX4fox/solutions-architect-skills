/**
 * prose-hook.js (8.115.0) — the prose contract at the moment of writing: PreToolUse denies a Write or an Edit whose new
 * lines break a BLOCKING lexical rule of an enforcing project; PostToolUse hands back the warnings of the lines just
 * written. Old lines, other files and report-only projects are never touched.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { review, output, newLines, contentAfter, contentBefore, kindOf } = require("../scripts/prose-hook.js");
const SCRIPT = join(__dirname, "..", "scripts", "prose-hook.js");
const TMP = join(__dirname, ".temp-prose-hook");
const w = (p: string, s: string) => { mkdirSync(join(TMP, p, ".."), { recursive: true }); writeFileSync(join(TMP, p), s); };
const LONG = "El servicio valida el token del cliente contra la bóveda en cada lectura y además registra el resultado en el log de auditoría con el identificador opaco del dispositivo para correlacionarlo.";
const BOILER = "Esta sección proporciona una visión general de las integraciones.";
const OLD_LONG = "La puerta de enlace recibe la petición del canal móvil y la reenvía al servicio interno que corresponde según la ruta declarada en el inventario de integraciones del sistema.";

beforeAll(() => {
  rmSync(TMP, { recursive: true, force: true });
  w("stamped/ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n<!-- PROSE_STYLE: v1 -->\n\n# Mesa — Arquitectura\n");
  w("stamped/docs/05-integration-points.md", `# Puntos de Integración\n\n## 7. Puntos de Integración <!-- SECTION: Integration Points -->\n\n${OLD_LONG}\n`);
  w("legacy/ARCHITECTURE.md", "<!-- ARCHITECTURE_VERSION: 1.0.0 -->\n<!-- DOC_LANGUAGE: es -->\n\n# Mesa — Arquitectura\n");
  w("legacy/docs/05-integration-points.md", "# Puntos de Integración\n");
});
afterAll(() => rmSync(TMP, { recursive: true, force: true }));
const d05 = (p: string) => join(TMP, p, "docs/05-integration-points.md");
const edit = (p: string, add: string) => ({ tool_name: "Edit", cwd: "/", tool_input: { file_path: d05(p), old_string: "## 7. Puntos de Integración <!-- SECTION: Integration Points -->", new_string: `## 7. Puntos de Integración <!-- SECTION: Integration Points -->\n\n${add}` } });

describe("prose-hook", () => {
  test("the new lines of a call: a multiset difference — a line already there is old, a Write is all new", () => {
    expect([...newLines("a\nb\nc", "a\nx\nb\nc")]).toEqual([2]);
    expect([...newLines("a\nb", "b\na")]).toEqual([]);   // moved, not new
    const before = "one\ntwo\n";
    const after = contentAfter("Edit", { old_string: "two", new_string: "two\nthree" }, before);
    expect(after).toBe("one\ntwo\nthree\n");
    expect(contentBefore("Edit", { old_string: "two", new_string: "two\nthree" }, after)).toBe(before);
    expect(contentBefore("Write", { content: "x" }, "x")).toBe("");
    expect(contentAfter("Edit", { old_string: "absent", new_string: "y" }, before)).toBeNull();   // the tool fails on its own
  });

  test("scope: ARCHITECTURE.md, docs/**, project ADRs (101+) and TDRs — never an institutional ADR or another file", () => {
    const r = join(TMP, "stamped");
    expect(kindOf(r, join(r, "ARCHITECTURE.md"))).toBe("docs");
    expect(kindOf(r, join(r, "docs/components/x/01-a.md"))).toBe("docs");
    expect(kindOf(r, join(r, "adr/ADR-120-x.md"))).toBe("record");
    expect(kindOf(r, join(r, "tdr/TDR-003-x.md"))).toBe("record");
    expect(kindOf(r, join(r, "adr/ADR-004-x.md"))).toBeNull();
    expect(kindOf(r, join(r, "handoffs/README.md"))).toBeNull();
  });

  test("pre: a BLOCKING rule on a new line denies the call under an enforcing project, with the rule and its fix", async () => {
    const res = await review("pre", edit("stamped", BOILER));
    const out = JSON.parse(output("pre", res));
    expect(out.hookSpecificOutput).toMatchObject({ hookEventName: "PreToolUse", permissionDecision: "deny" });
    expect(out.hookSpecificOutput.permissionDecisionReason).toContain("S-BAN-01 line 5");
    expect(out.hookSpecificOutput.permissionDecisionReason).toContain("Delete the clause");
    // a long sentence is a warning, never a denial
    expect(output("pre", await review("pre", edit("stamped", LONG)))).toBe("");
  });

  test("pre: a report-only project is never denied; post: warnings on the lines just written only", async () => {
    expect(output("pre", await review("pre", edit("legacy", BOILER)))).toBe("");
    // post reads the file as written: write it first, as the tool would have
    const e = edit("stamped", LONG); const before = require("fs").readFileSync(d05("stamped"), "utf8");
    writeFileSync(d05("stamped"), contentAfter("Edit", e.tool_input, before));
    const out = JSON.parse(output("post", await review("post", e)));
    expect(out.hookSpecificOutput.hookEventName).toBe("PostToolUse");
    expect(out.hookSpecificOutput.additionalContext).toContain("S-LEN-01 line 5");
    expect(out.hookSpecificOutput.additionalContext).not.toContain("line 7");   // the old long sentence is not this call's
  });

  test("the CLI: silent and exit 0 for another file, a malformed input, or nothing to say", () => {
    const run = (stdin: string, ev = "pre") => Bun.spawnSync(["bun", SCRIPT, ev], { stdin: Buffer.from(stdin) });
    const a = run(JSON.stringify({ tool_name: "Write", cwd: "/", tool_input: { file_path: "/tmp/elsewhere.md", content: BOILER } }));
    expect(a.exitCode).toBe(0); expect(a.stdout.toString()).toBe("");
    const b = run("not json"); expect(b.exitCode).toBe(0); expect(b.stdout.toString()).toBe("");
    const c = run(JSON.stringify(edit("stamped", BOILER))); expect(c.exitCode).toBe(0); expect(JSON.parse(c.stdout.toString()).hookSpecificOutput.permissionDecision).toBe("deny");
  });
});
