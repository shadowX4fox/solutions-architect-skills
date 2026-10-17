#!/usr/bin/env bun
/**
 * setup-contracts.ts — report the API contract validator and say exactly what is missing.
 *
 *   bun scripts/setup-contracts.ts [--json]
 *
 * `architecture-dev-handoff` validates every generated `openapi.yaml`, `asyncapi.yaml` and `schema.graphql` with
 * `plugins/sa-delivery/skills/architecture-dev-handoff/scripts/contract-check.js` (sa-delivery, which loads them from sa-skills' install), whose schema layers are `@redocly/openapi-core`
 * (OpenAPI, AsyncAPI) and `graphql` (graphql-js, GraphQL SDL) — dependencies of the plugin, run in-process. Claude Code's plugin install does not run `bun install`, so a
 * fresh install or an update can leave it missing; the handoff skill then refuses to start (Step 1.2).
 *
 * A package that resolves is not evidence the validator works, so this validates three throwaway contracts — an
 * OpenAPI 3.1, an AsyncAPI 3.0 and a GraphQL SDL file, all valid — through contract-check.js itself, and reports
 * what happened. The check is required: exit 1 when a package is missing or a sample does not validate.
 */

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CHECKER = join(ROOT, "plugins", "sa-delivery", "skills", "architecture-dev-handoff", "scripts", "contract-check.js");

export type Check = { id: string; label: string; required: boolean; ok: boolean; detail: string; fix?: string; cost?: string };

const OPENAPI = `openapi: "3.1.0"
info: { title: "Setup check", version: "1.0.0" }
paths:
  /ping:
    get:
      operationId: ping
      responses:
        '200': { description: ok }
`;
const ASYNCAPI = `asyncapi: "3.0.0"
info: { title: "Setup check", version: "1.0.0" }
channels:
  ping:
    address: "setup.ping"
operations:
  sendPing:
    action: send
    channel: { $ref: '#/channels/ping' }
`;

const AVRO = JSON.stringify({ type: "record", name: "Ping", namespace: "setup.check", fields: [{ name: "at", type: { type: "long", logicalType: "timestamp-millis" } }] });

const DDL_PG = "-- Engine: PostgreSQL 16\nCREATE TABLE ping (at TIMESTAMPTZ NOT NULL);\n";
const DDL_MSSQL = "CREATE TABLE ping (at DATETIMEOFFSET NOT NULL);";

const PROTO = 'syntax = "proto3";\npackage setup.check;\nmessage Ping { int64 at = 1; }\nservice PingService { rpc Send (Ping) returns (Ping); }\n';

const GRAPHQL = `type Query {
  ping: Boolean
}
`;

const FIX = `bun install    (in the plugin directory: ${ROOT})`;
const COST = "architecture-dev-handoff refuses to start (Step 1.2); every openapi.yaml, asyncapi.yaml, schema.graphql, .avsc, ddl.sql and schema.proto asset would fail the kit gate";

// the package as `bun install` put it — on disk under node_modules, at the version package.json pins (scripts/shared/pinned.js);
// a package Bun would auto-install, or one off its pin, is not installed: the checks refuse it the same way
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pinState } = require(join(ROOT, "scripts", "shared", "pinned.js"));
const resolvePkg = (name: string): { version: string; off?: string } | null => {
  const s = pinState(ROOT, name);
  if (s.ok) return { version: s.version };
  return s.version ? { version: s.version, off: s.reason } : null;
};

/** `load` resolves a package by name (injectable for tests); `lint` runs the checker on one file. */
export function report(opts: { load?: (name: string) => { version: string; off?: string } | null; lint?: (file: string) => any } = {}): Check[] {
  const load = opts.load || resolvePkg;
  const pkgs = [["redocly", "@redocly/openapi-core", "OpenAPI / AsyncAPI validation"], ["graphql", "graphql", "GraphQL SDL validation"], ["avsc", "avsc", "Avro schema validation"], ["libpg-query", "libpg-query", "PostgreSQL DDL grammar"], ["node-sql-parser", "node-sql-parser", "MySQL / SQL Server / … DDL grammar"], ["protobufjs", "protobufjs", "Protobuf schema validation"]] as const;
  const checks: Check[] = pkgs.map(([id, name, what]) => { const pkg = load(name), ok = Boolean(pkg && !pkg.off); return {
    id, label: `${name} (${what})`, required: true, ok,
    detail: pkg ? (pkg.off ? pkg.off : `installed${pkg.version ? ` ${pkg.version}` : ""}`) : "not installed",
    fix: ok ? undefined : FIX, cost: ok ? undefined : COST,
  }; });
  if (checks.some((c) => !c.ok)) return checks;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const lint = opts.lint || ((file: string) => require(CHECKER).checkFile(file));
  const dir = mkdtempSync(join(tmpdir(), "sa-contracts-smoke-"));
  try {
    for (const [id, name, body] of [["openapi", "openapi.yaml", OPENAPI], ["asyncapi", "asyncapi.yaml", ASYNCAPI], ["graphql-sdl", "schema.graphql", GRAPHQL], ["avro", "Ping.avsc", AVRO], ["ddl-postgresql", "ddl.sql", DDL_PG], ["ddl-transactsql", "ddl.sql", DDL_MSSQL], ["protobuf", "schema.proto", PROTO]] as const) {
      mkdirSync(join(dir, id)); const f = join(dir, id, name); writeFileSync(f, body);
      const r = id === "graphql-sdl" && !opts.lint ? require(CHECKER).checkFile(f, { baseline: false }) : id === "avro" && !opts.lint ? require(CHECKER).checkFile(f, { source: f }) : id.startsWith("ddl-") && !opts.lint ? require(CHECKER).checkFile(f, { source: f, engine: id.slice(4) }) : id === "protobuf" && !opts.lint ? require(CHECKER).checkFile(f, { source: f, baseline: false }) : lint(f); const blocking = (r.findings || []) as { rule: string; text: string }[];
      const engine = String(r.engine || r.redocly || "");
      const ok = blocking.length === 0 && /^(redocly |graphql-js |avsc$|libpg-query |node-sql-parser |protobufjs )/.test(engine);
      checks.push({
        id, label: `${{ openapi: "OpenAPI 3.1", asyncapi: "AsyncAPI 3.0", "graphql-sdl": "GraphQL SDL", avro: "Avro", "ddl-postgresql": "PostgreSQL DDL", "ddl-transactsql": "SQL Server DDL", protobuf: "Protobuf" }[id]} sample (end-to-end validation)`, required: true, ok,
        detail: ok ? `validated by ${engine}` : blocking.length ? `${blocking[0].rule}: ${blocking[0].text}`.slice(0, 200) : `validator: ${engine}`,
        fix: ok ? undefined : `${FIX}; if it persists, run: bun ${CHECKER} ${f}`,
        cost: ok ? undefined : COST,
      });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return checks;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const checks = report();
  if (args.includes("--json")) console.log(JSON.stringify({ checks }, null, 1));
  else {
    console.log("API contract validator (architecture-dev-handoff):\n");
    for (const c of checks) console.log(`  ${c.ok ? "✓" : "❌"} ${c.label} — ${c.detail}`);
    const broken = checks.filter((c) => !c.ok);
    if (broken.length) {
      console.log("");
      for (const c of broken) { console.log(`  ${c.label}`); if (c.cost) console.log(`    Without it: ${c.cost}`); if (c.fix) console.log(`    Fix:        ${c.fix}`); }
    } else console.log("\n  Every OpenAPI, AsyncAPI, GraphQL, Avro, DDL and Protobuf contract in a handoff kit is validated against its schema or grammar.");
  }
  process.exit(checks.some((c) => !c.ok) ? 1 : 0);
}
