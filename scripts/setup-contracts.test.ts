/**
 * setup-contracts.ts — the contract validator report: the package, then a real validation of one OpenAPI 3.1 and
 * one AsyncAPI 3.0 sample through contract-check.js, because a package that resolves is not a validator that runs.
 */
import { describe, test, expect } from "bun:test";
import { join } from "path";
import { report } from "./setup-contracts";

const SCRIPT = join(import.meta.dir, "setup-contracts.ts");

describe("setup-contracts", () => {
  test("the repo's install validates both samples end to end", () => {
    const r = Bun.spawnSync(["bun", SCRIPT, "--json"], { stdout: "pipe", stderr: "pipe" });
    expect(r.exitCode).toBe(0);
    const cs = JSON.parse(r.stdout.toString()).checks;
    expect(cs.map((c: any) => c.id)).toEqual(["redocly", "graphql", "avsc", "libpg-query", "node-sql-parser", "protobufjs", "openapi", "asyncapi", "graphql-sdl", "avro", "ddl-postgresql", "ddl-transactsql", "protobuf"]);
    expect(cs.every((c: any) => c.ok && c.required)).toBe(true);
    expect(cs[6].detail).toMatch(/^validated by redocly /); expect(cs[8].detail).toMatch(/^validated by graphql-js /); expect(cs[9].detail).toBe("validated by avsc"); expect(cs[10].detail).toMatch(/^validated by libpg-query /); expect(cs[11].detail).toBe("validated by node-sql-parser (transactsql)"); expect(cs[12].detail).toMatch(/^validated by protobufjs /);
  });

  test("a missing package is a failed required check with the install command", () => {
    const cs = report({ load: (name) => (name === "graphql" ? null : { version: "x" }) });
    expect(cs).toHaveLength(6);
    expect(cs[0].ok).toBe(true);
    expect(cs[1]).toMatchObject({ id: "graphql", ok: false, required: true });
    expect(cs[1].fix).toMatch(/^bun install/);
    expect(report({ load: () => null })[0]).toMatchObject({ id: "redocly", ok: false });
    expect(cs[1].cost).toMatch(/refuses to start/);
  });

  test("a package that loads but does not validate is reported, not passed", () => {
    const cs = report({ load: () => ({ version: "x" }), lint: () => ({ redocly: "error — boom", findings: [{ rule: "redocly", text: "Redocly could not lint the file: boom" }] }) });
    expect(cs.slice(6).every((c) => !c.ok)).toBe(true);
    expect(cs[6].detail).toMatch(/could not lint/);
  });

  test("the human report names what breaks and exits 1 only on a failure", () => {
    const r = Bun.spawnSync(["bun", SCRIPT], { stdout: "pipe" });
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString()).toMatch(/✓ OpenAPI 3\.1 sample/);
    expect(r.stdout.toString()).toMatch(/✓ AsyncAPI 3\.0 sample/);
    expect(r.stdout.toString()).toMatch(/✓ GraphQL SDL sample/);
    expect(r.stdout.toString()).toMatch(/✓ Avro sample/);
    expect(r.stdout.toString()).toMatch(/✓ PostgreSQL DDL sample/);
    expect(r.stdout.toString()).toMatch(/✓ Protobuf sample/);
  });
});
