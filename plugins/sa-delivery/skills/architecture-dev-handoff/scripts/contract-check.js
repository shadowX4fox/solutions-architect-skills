#!/usr/bin/env bun
// contract-check.js — the gate every generated API contract passes: `openapi.yaml` (OpenAPI 3.1), `asyncapi.yaml`
// (AsyncAPI 3.0) and `schema.graphql` (GraphQL SDL). Step 5.2b runs it through kit-check.js.
//
//   bun contract-check.js <openapi.yaml | asyncapi.yaml | schema.graphql | handoffs_dir …> [--source <component.md | payload.md>]
//                         [--baseline <previous schema.graphql> | --no-baseline] [--judge <engine>] [--json]
//   bun contract-check.js --probe          exit 0 when Redocly, graphql-js and avsc are installed, 1 with the install command when not
//
// Four layers, all blocking where they say so:
//
//   parse      the file is YAML (Bun's own parser).
//   structure  what a generator gets wrong, with the fix in the message. Both specs: the version the scaffold targets
//              (OpenAPI 3.0.x / AsyncAPI 2.x warn — valid, but not what the scaffold writes), `info.title` and
//              `info.version`, every map a mapping (`paths:` / `channels:` / `bindings.amqp:` holding only comments is
//              YAML null — the scaffold writes `{}`), and no scaffold placeholder (`[COMPONENT_NAME]`) left in a value —
//              `[NOT DOCUMENTED …]` is the gap marker and is legal. OpenAPI: path keys start with `/`; operations sit
//              under HTTP methods with `responses` of `default` / `NNN` / `NXX`, each described; every `{param}` is
//              declared `in: path, required: true` (Redocly's recommended set does not catch this one); unique
//              operationIds; `security` names declared schemes. AsyncAPI: every operation's `action` is `send` or
//              `receive` and its `channel` a `$ref`.
//   fidelity   the contract is the documented one. The source is the descriptor the generator read (`--source`, or —
//              for a kit — the cut-sheet payload `.cache/sa-skills/handoff-payloads/<slug>.md`, which carries it
//              verbatim). OpenAPI: an operation whose method and path the source never states is
//              `operation-undocumented` (BLOCKING — the no-invention rule); one the source *declares* (a table row or
//              bullet led by the method, a `method:` / `path:` pair) and the file lacks is `operation-missing`, a
//              WARNING, since a descriptor also lists the endpoints it calls — `--judge <engine>` asks scripts/judge.js
//              whether the component exposes it, and a confident yes blocks; an operation no judge has answered
//              (a pending worksheet, a judge error) is undecided — listed, never blocked on (8.119.0). A server URL's path is a base path; path parameters compare by position. AsyncAPI: a channel whose
//              address the source never states is `channel-undocumented` (BLOCKING); `{param}` segments of an address
//              are wildcards, a null address (dynamic) is not checked.
//   redocly    `@redocly/openapi-core` (MIT), a dependency of the plugin, run in-process — no binary, no account. It
//              validates both specs against their schemas. The project's `redocly.yaml` wins; without one, the
//              `recommended` ruleset. Spec conformance blocks — `struct` (3.0's `nullable` in an OpenAPI 3.1 file,
//              AsyncAPI 2.x security requirements in a 3.0 file, a Kafka `groupId` on a channel), unresolved refs, path
//              parameters, duplicate operationIds; every other rule warns (`security-defined` where the docs state no
//              auth, `no-empty-servers` where they state no URL — a gap to record, not a value to invent). The package
//              is required: when it cannot be loaded the file FAILS with the install command.
//
// A Redis key schema (`redis-key-schema.md`, 8.108.0) is Markdown with three fixed tables — Keys, Settings, On Redis failure —
// held to their exact headers and nothing else, to the closed vocabularies (structure, eviction policy, fail-open / -closed)
// and to the docs: a key pattern's fixed prefix, every TTL and setting quantity, every writer (`key-undocumented`,
// `value-undocumented`, BLOCKING).
//
// Protobuf (`schema.proto`, one per component, 8.107.0) is parsed and resolved by `protobufjs` (BSD-3: syntax with its line,
// duplicate numbers or names, unknown types, an rpc on a missing message), held to what it lets through (an enum starts at
// 0, no field number 0 or in 19000–19999, a `package`), to the docs (every service, rpc, message and field named —
// `<Rpc>Request` / `Response` wrappers of a documented rpc excepted; `name-undocumented`, BLOCKING), and — field numbers
// being the wire contract — to its previous version: a number that changed or a removed field's number reused is a
// breaking change (warning, like GraphQL's).
//
// DDL (`ddl.sql`, 8.106.0) is checked in its engine's dialect — the payload's `sql_engine`, else the file's `-- Engine:` line:
// PostgreSQL by libpg-query (its own parser), MySQL / MariaDB / SQL Server / DB2 / SQLite / Snowflake / Redshift / BigQuery by
// node-sql-parser, Oracle by neither (the receipt says the grammar was not checked). A syntax error names its line; a column
// declared twice blocks; a foreign key to a table the file does not create warns; every table and column is named in the
// architecture docs (`table-undocumented`, `column-undocumented`, BLOCKING — invented partitions and audit columns).
//
// Avro (`<RecordName>.avsc`, one record per file) is parsed as JSON — a `//` comment is named as the cause —, built by `avsc`
// (MIT, a dependency: names, unions and their defaults, enums, duplicate fields), held to two rules avsc lets through
// (a `decimal` needs `precision`; an undefined logical type warns, readers ignore it) and to the source: every field name,
// in any case and with or without separators, is named in the payload (`field-undocumented`, BLOCKING).
//
// GraphQL SDL (`schema.graphql`) takes the same four steps with graphql-js (`graphql`, MIT, the reference
// implementation — a dependency of the plugin, also required): `buildSchema` + `validateSchema` are the schema layer
// (syntax with its line, unknown or duplicate types, a Mutation without the required Query root, an object type with no
// fields, wrong `implements`) — BLOCKING; a placeholder outside a comment blocks; every Query / Mutation / Subscription
// field must be named in the source (`operation-undocumented`, BLOCKING). A schema of comments only — the docs describe
// the capability but name no operation — is a WARNING (`no-operations`): the file carries the gap list. Then the
// contract is compared with its previous version (`--baseline`, else the file at git HEAD) through graphql-js's
// `findBreakingChanges` / `findDangerousChanges`: a removed field, a changed type, a new required argument are
// WARNINGs — a regenerated kit that breaks its consumers says so before the devs find out.
//
// Exit 1 on a BLOCKING finding, 2 on a usage error.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
// the validators are npm packages of sa-skills' install (`bun install` there): an installed sa-delivery has no node_modules of its own
const SA = require(path.join(__dirname, '..', '..', '..', 'scripts', 'sa-skills.js'));
const pkg = (name) => SA.requireFromSaSkills(name);

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const PLACEHOLDER = /\[(?!NOT DOCUMENTED\b)(?!(?:ADR|TDR|UC|I|F|E|B|C|K|T|S|D)-\d)[A-Z][A-Z0-9_]{2,}(?:[ —–-][^\]\n]*)?\]/;   // a bracketed id (`[ADR-005]`, `[I-10]`) is a citation, as kit-check.js reads it   // `[COMPONENT_NAME]`, `[API_VERSION]` — `[NOT DOCUMENTED …]` is the gap marker, legal in a value
const OUTBOUND = /outbound|saliente|calls?\b|llamad|consum|depend|upstream|invoca|egress/i;
const INSTALL = 'run `bun install` in sa-skills\' directory (bun ~/.claude/plugins/marketplaces/shadowx4fox-solution-architect-marketplace/scripts/plugin-root.ts prints it) — sa-delivery\'s contract checks load their validators from there';

const normPath = (p) => String(p).replace(/[?#].*$/, '').replace(/[.,;:]+$/, '').replace(/\{[^}]*\}|:[A-Za-z_]\w*/g, '{}').replace(/\/+$/, '') || '/';
const opKey = (m, p) => `${m.toUpperCase()} ${normPath(p)}`;
const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const kindOf = (doc) => (isMap(doc) && doc.asyncapi !== undefined ? 'asyncapi' : 'openapi');

// ---- source: every method + path the descriptor states, and which of them it declares — a table row or bullet led by
// the method, or a structured `method: X` / `path: /y` pair (an `apis:` block); the nearest heading, or the nearest
// key-only line of a structured block (`inbound:`, `outbound_rest_via_apim:`), says whether it reads as outbound
const OP_RE = /\b(GET|PUT|POST|DELETE|OPTIONS|HEAD|PATCH|TRACE)\b[`*\s|:]{1,12}`?(\/[^\s`|)"'<>,;\]]*)/g;
function sourceOps(text) {
  const mentioned = new Map(), declared = new Map(); let heading = '', key = '', pending = null;
  text.replace(/\r\n?/g, '\n').split('\n').forEach((l, i) => {
    const h = l.match(/^#{1,6}\s+(.+)$/); if (h) { heading = h[1]; key = ''; }
    const kl = l.match(/^\s*([A-Za-z_][\w-]*):\s*$/); if (kl) key = kl[1];
    const sm = l.match(/^\s*(?:-\s+)?method:\s*["']?(GET|PUT|POST|DELETE|OPTIONS|HEAD|PATCH|TRACE)\b/i); if (sm) pending = { method: sm[1], line: i };
    const sp = l.match(/^\s*(?:-\s+)?path:\s*["']?(\/[^\s"']*)/);
    if (sp && pending && i - pending.line <= 3) {
      const k = opKey(pending.method, sp[1]), ctx = key || heading, at = { line: i + 1, text: `${pending.method.toUpperCase()} ${sp[1]}`, heading: ctx, outbound: OUTBOUND.test(ctx) };
      if (!mentioned.has(k)) mentioned.set(k, at); if (!declared.has(k)) declared.set(k, at); pending = null;
    }
    const lead = /^\s*\|/.test(l) ? l.split('|').slice(1, 3).join('|') : /^\s*[-*]\s/.test(l) ? l.replace(/^\s*[-*]\s+/, '').slice(0, 80) : null;
    for (const m of l.matchAll(OP_RE)) {
      const k = opKey(m[1], m[2]); if (!mentioned.has(k)) mentioned.set(k, { line: i + 1, text: l.trim().slice(0, 200), heading });
      const inLead = lead !== null && new RegExp(`^[\\s\`*]*${m[1]}\\b`).test(lead.replace(/^\s*\|?\s*/, '')) && lead.includes(m[2].replace(/[.,;:]+$/, ''));
      if (inLead && !declared.has(k)) declared.set(k, { line: i + 1, text: l.trim().slice(0, 200), heading, outbound: OUTBOUND.test(heading) || OUTBOUND.test(l) });
    }
  });
  return { mentioned, declared };
}

// ---- structure (pointers recorded so Redocly's report of the same spot is not printed twice)
function common(doc, spec, target, err, warn) {
  const v = String(doc[spec] || '');
  if (spec === 'openapi') { if (/^3\.0\.\d+$/.test(v)) warn('version', `\`openapi\` is ${v} — valid, but the handoff scaffold targets 3.1.x`); else if (!/^3\.1\.\d+$/.test(v)) err('version', `\`openapi\` is ${JSON.stringify(doc.openapi)} — the handoff scaffold targets 3.1.x`, '#/openapi'); }
  else { if (/^2\.\d+\.\d+$/.test(v)) warn('version', `\`asyncapi\` is ${v} — valid, but the handoff scaffold targets 3.0.x (operations are top-level, \`action: send | receive\`)`); else if (!/^3\.0\.\d+$/.test(v)) err('version', `\`asyncapi\` is ${JSON.stringify(doc.asyncapi)} — the handoff scaffold targets 3.0.x`, '#/asyncapi'); }
  if (!isMap(doc.info)) err('info', 'no `info` object', '#/info');
  else { if (typeof doc.info.title !== 'string' || !doc.info.title.trim()) err('info', '`info.title` missing', '#/info/title'); if (doc.info.version == null || String(doc.info.version).trim() === '') err('info', '`info.version` missing', '#/info/version'); }
  for (const k of target) if (k in doc && !isMap(doc[k])) err('map', `\`${k}\` is not a mapping — a \`${k}:\` holding only comments is YAML null; write \`${k}: {}\` and keep the TODO comment`, `#/${k}`);
  if (isMap(doc.components)) for (const [k, val] of Object.entries(doc.components)) if (!isMap(val)) err('map', `\`components.${k}\` is not a mapping — write \`${k}: {}\``, `#/components/${k}`);
  // a binding left as comments: `bindings:\n  amqp:` → null
  const walk = (o, at) => { if (!o || typeof o !== 'object') return; for (const [k, val] of Object.entries(o)) { const p = `${at}/${k.replace(/~/g, '~0').replace(/\//g, '~1')}`; if (k === 'bindings' && isMap(val)) for (const [b, bv] of Object.entries(val)) if (bv === null) err('map', `\`${p.slice(2).replace(/\//g, '.')}.${b}\` is null — a binding holding only comments; remove it or write \`${b}: {}\``, `${p}/${b}`); walk(val, p); } };
  walk(doc, '#');
  const strings = (o, at, out) => { if (typeof o === 'string') { if (PLACEHOLDER.test(o)) out.push(`${at}: ${o.match(PLACEHOLDER)[0]}`); } else if (o && typeof o === 'object') for (const [k, val] of Object.entries(o)) { if (PLACEHOLDER.test(k)) out.push(`${at}: key ${k}`); strings(val, `${at}/${k}`, out); } return out; };
  strings(doc, '#', []).forEach((x) => err('placeholder', `template placeholder left in a value — ${x}`));
}

function structure(doc) {
  const f = [], w = [], pointers = new Set();
  const err = (rule, text, ptr) => { f.push({ rule, text }); if (ptr) pointers.add(ptr); }, warn = (rule, text) => w.push({ rule, text });
  if (!isMap(doc)) { err('root', 'the document is not a YAML mapping'); return { f, w, ops: [], channels: [], pointers, kind: 'openapi' }; }
  const kind = kindOf(doc);
  if (kind === 'asyncapi') {
    common(doc, 'asyncapi', ['channels', 'operations', 'servers', 'components'], err, warn);
    const channels = isMap(doc.channels) ? Object.entries(doc.channels).map(([k, c]) => ({ key: k, address: isMap(c) && 'address' in c ? c.address : k })) : [];
    if (isMap(doc.operations)) for (const [id, op] of Object.entries(doc.operations)) {
      if (!isMap(op)) { err('operation', `operation \`${id}\` is empty`, `#/operations/${id}`); continue; }
      if (!['send', 'receive'].includes(op.action)) err('operation', `operation \`${id}\`: \`action\` is ${JSON.stringify(op.action)} — AsyncAPI 3.0 takes \`send\` (producer) or \`receive\` (consumer)`, `#/operations/${id}/action`);
      if (!isMap(op.channel) || typeof op.channel.$ref !== 'string') err('operation', `operation \`${id}\`: \`channel\` must be a \`$ref: '#/channels/<name>'\``, `#/operations/${id}/channel`);
    }
    return { f, w, ops: [], channels, pointers, kind };
  }
  common(doc, 'openapi', ['paths', 'components', 'webhooks'], err, warn);
  if (!('paths' in doc) && !('components' in doc) && !('webhooks' in doc)) err('root', 'none of `paths`, `components`, `webhooks` — OpenAPI 3.1 needs one');
  if (doc.servers !== undefined && (!Array.isArray(doc.servers) || doc.servers.some((s) => !s || typeof s.url !== 'string'))) err('servers', '`servers` must be a list of objects with a `url`', '#/servers');
  const schemes = new Set(Object.keys((doc.components && doc.components.securitySchemes) || {}));
  const checkSecurity = (sec, where) => { if (sec === undefined) return; if (!Array.isArray(sec)) return err('security', `${where}: \`security\` is not a list`); sec.forEach((req) => Object.keys(req || {}).forEach((n) => { if (!schemes.has(n)) err('security', `${where}: \`${n}\` is not a declared \`components.securitySchemes\` entry`); })); };
  checkSecurity(doc.security, 'root');
  const opIds = new Map(), ops = [];
  // a parameter shared as `$ref: '#/components/parameters/X'` is the parameter it points at — valid OpenAPI, and the usual
  // way to declare one `{customerId}` for every path; an unresolvable ref is Redocly's `no-unresolved-refs`, not a path-param finding
  const deref = (x) => { for (let i = 0; i < 8 && x && typeof x.$ref === 'string' && x.$ref.startsWith('#/'); i++) x = x.$ref.slice(2).split('/').map((k) => k.replace(/~1/g, '/').replace(/~0/g, '~')).reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), doc) || { unresolved: true }; return x; };
  const params = (list) => (Array.isArray(list) ? list.map(deref) : []);
  if (isMap(doc.paths)) {
    for (const [p, item] of Object.entries(doc.paths)) {
      const pp = `#/paths/${p.replace(/~/g, '~0').replace(/\//g, '~1')}`;
      if (!p.startsWith('/')) err('path-key', `\`${p}\` under \`paths\` does not start with \`/\` — a block indented one level too deep (\`components.schemas\` under \`paths\` is the usual case)`, pp);
      if (!isMap(item)) { err('path-item', `\`${p}\` is empty`, pp); continue; }
      const itemParams = params(item.parameters);
      const pathParams = itemParams.filter((x) => x && x.in === 'path').map((x) => x.name);
      const tmpl = [...p.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
      for (const [m, op] of Object.entries(item)) {
        if (['parameters', 'summary', 'description', 'servers', '$ref'].includes(m) || m.startsWith('x-')) continue;
        if (!METHODS.includes(m)) { if (p.startsWith('/')) err('method', `\`${p}\`: \`${m}\` is not an HTTP method`, `${pp}/${m}`); else pointers.add(`${pp}/${m}`); continue; }
        const where = `${m.toUpperCase()} ${p}`; ops.push({ method: m, path: p, operationId: isMap(op) && typeof op.operationId === 'string' ? op.operationId : null });
        if (!isMap(op)) { err('operation', `${where}: empty operation`, `${pp}/${m}`); continue; }
        if (op.operationId) { if (opIds.has(op.operationId)) err('operation-id', `${where}: operationId \`${op.operationId}\` already used by ${opIds.get(op.operationId)}`); else opIds.set(op.operationId, where); }
        else warn('operation-id', `${where}: no operationId`);
        if (!isMap(op.responses) || !Object.keys(op.responses).length) err('responses', `${where}: no responses`, `${pp}/${m}/responses`);
        else for (const [code, r] of Object.entries(op.responses)) {
          if (!/^(default|[1-5](\d\d|XX))$/.test(String(code))) err('responses', `${where}: \`${code}\` is not a status code (\`200\`, \`4XX\`, \`default\`)`, `${pp}/${m}/responses/${code}`);
          if (r && !r.$ref && typeof r.description !== 'string') err('responses', `${where} ${code}: no \`description\``, `${pp}/${m}/responses/${code}`);
        }
        const opParams = params(op.parameters);
        const declaredHere = [...pathParams, ...opParams.filter((x) => x && x.in === 'path').map((x) => x.name)];
        if (![...itemParams, ...opParams].some((x) => x && x.unresolved)) tmpl.filter((n) => !declaredHere.includes(n)).forEach((n) => err('path-param', `${where}: \`{${n}}\` has no \`in: path\` parameter`));
        [...itemParams, ...opParams].filter((x) => x && x.in === 'path' && x.required !== true).forEach((x) => err('path-param', `${where}: path parameter \`${x.name}\` must be \`required: true\``));
        checkSecurity(op.security, where);
      }
    }
  }
  return { f, w, ops, channels: [], pointers, kind };
}

// ---- fidelity
function fidelity(doc, st, src) {
  const f = [], w = [];
  if (st.kind === 'asyncapi') {
    const text = src.replace(/\r\n?/g, '\n');
    let checked = 0;
    st.channels.forEach((c) => {
      if (c.address === null || c.address === undefined) return; checked++;
      const pieces = String(c.address).split(/\{[^}]*\}/).map((x) => x.trim()).filter((x) => x.length >= 3);
      if (!pieces.length || pieces.every((x) => text.includes(x))) return;
      f.push({ rule: 'channel-undocumented', text: `channel \`${c.key}\` — address \`${c.address}\`: the source never states it; an asset carries only documented topics and queues` });
    });
    return { f, w, summary: `${checked} channel address(es) checked`, missing: [] };
  }
  const s = sourceOps(src);
  const bases = (Array.isArray(doc.servers) ? doc.servers : []).map((x) => { try { return new URL(x.url, 'http://h').pathname.replace(/\/+$/, ''); } catch { return ''; } }).filter(Boolean);
  const keysOf = (o) => [opKey(o.method, o.path), ...bases.map((b) => opKey(o.method, b + o.path))];
  const inFile = new Set(st.ops.flatMap(keysOf));
  st.ops.forEach((o) => { if (!keysOf(o).some((k) => s.mentioned.has(k))) f.push({ rule: 'operation-undocumented', text: `${o.method.toUpperCase()} ${o.path} — the source never states this method and path; an asset carries only documented operations` }); });
  // the names a regeneration re-decides when the docs leave them open (8.153.0): an operationId or an info.version the source
  // never states is a WARNING — pin it in the docs, or a later run renames it and the consumers' generated clients break
  const said = (x, lead = '') => new RegExp(`(^|[^\\w.-]|${lead || '(?!)'})${String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`).test(src);
  st.ops.filter((o) => o.operationId && !said(o.operationId)).forEach((o) => w.push({ rule: 'operation-id-undocumented', text: `${o.method.toUpperCase()} ${o.path}: operationId \`${o.operationId}\` — the source never names it; state the operation names in the docs, or a regeneration may rename it` }));
  const ver = doc && doc.info && doc.info.version != null ? String(doc.info.version) : null;
  if (ver && !said(ver, '[vV]')) w.push({ rule: 'version-undocumented', text: `info.version \`${ver}\` — the source never states the contract's version; pin it in the docs, or a regeneration may change it` });
  const missing = [...s.declared].filter(([k]) => !inFile.has(k)).map(([k, v]) => ({ key: k, ...v }));
  missing.forEach((m) => w.push({ rule: 'operation-missing', key: m.key, text: `${m.key} — declared at source line ${m.line}${m.heading ? ` (§ ${m.heading})` : ''} and absent from the file${m.outbound ? '; the section reads as outbound, so it may be an endpoint this component calls' : ''}` }));
  return { f, w, summary: `${st.ops.length} operation(s) against ${s.declared.size} declared`, missing };
}

// ---- redocly (a dependency, in-process — no binary). The package is async; it runs in a child Bun so the gate stays
// synchronous for kit-check.js. Only spec conformance blocks; see the header.
const REDOCLY_BLOCKING = (id) => /^(struct|spec(-.+)?|no-unresolved-refs|path-parameters-defined|operation-operationId-unique|operation-parameters-unique|path-declaration-must-exist|no-identical-paths|path-not-include-query|no-path-trailing-slash|channels-kebab-case-never)$/.test(id);
function redocly(file) {
  const r = spawnSync(process.execPath, [__filename, '--redocly-worker', path.resolve(file)], { encoding: 'utf8', timeout: 120000 });
  try { return JSON.parse(String(r.stdout).trim().split('\n').pop()); } catch { return { error: String(r.stderr || r.error || `exit ${r.status}`).split(/\r?\n/).filter(Boolean).slice(0, 3).join(' ') }; }
}
function redoclyConfigPath(file) {
  let d = path.dirname(path.resolve(file));
  for (let i = 0; i < 8; i++) { for (const n of ['redocly.yaml', 'redocly.yml', '.redocly.yaml']) { const p = path.join(d, n); if (fs.existsSync(p)) return p; } if (fs.existsSync(path.join(d, 'ARCHITECTURE.md'))) break; const up = path.dirname(d); if (up === d) break; d = up; }
  return null;
}
function loadCore() { try { return pkg('@redocly/openapi-core'); } catch { return null; } }
async function redoclyWorker(file) {
  const core = loadCore(); if (!core) return { absent: true };
  const configPath = redoclyConfigPath(file);
  const config = configPath ? await core.loadConfig({ configPath }) : await core.createConfig({ extends: ['recommended'] });
  const problems = await core.lintFromString({ source: fs.readFileSync(file, 'utf8'), absoluteRef: file, config });
  let version = ''; try { version = pkg('@redocly/openapi-core/package.json').version; } catch { /* exports may hide it */ }
  return { version, config: configPath || 'recommended', problems: problems.map((p) => { const loc = (p.location || [])[0] || {}; let line = null; try { const lc = core.getLineColLocation ? core.getLineColLocation(loc) : null; line = lc && lc.start ? lc.start.line : null; } catch { line = null; } return { ruleId: p.ruleId, severity: p.severity, message: p.message, pointer: loc.pointer || '', line }; }) };
}

// ---- graphql (graphql-js, the reference implementation — a dependency of the plugin)
function loadGraphql() { try { return pkg('graphql'); } catch { return null; } }
const stripGqlComments = (sdl) => sdl.split('\n').map((l) => { let inStr = false; for (let i = 0; i < l.length; i++) { if (l[i] === '"' && l[i - 1] !== '\\') inStr = !inStr; else if (l[i] === '#' && !inStr) return l.slice(0, i); } return l; }).join('\n');
const ROOTS = [['query', 'getQueryType'], ['mutation', 'getMutationType'], ['subscription', 'getSubscriptionType']];

// the previous version of the same schema: --baseline <file>, else the file as the git HEAD commit has it
function previousSdl(file, baseline) {
  if (baseline) return fs.existsSync(baseline) ? { sdl: fs.readFileSync(baseline, 'utf8'), from: baseline } : null;
  const dir = path.dirname(path.resolve(file));
  const top = spawnSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (top.status !== 0) return null;
  const rel = path.relative(String(top.stdout).trim(), path.resolve(file)).split(path.sep).join('/');
  const r = spawnSync('git', ['-C', dir, 'show', `HEAD:${rel}`], { encoding: 'utf8' });
  return r.status === 0 ? { sdl: r.stdout, from: `git HEAD:${rel}` } : null;
}

function checkGraphql(file, raw, res, opts) {
  const g = opts.graphql !== undefined ? opts.graphql : loadGraphql();
  if (!g) { res.graphql = 'NOT INSTALLED'; res.findings.push({ rule: 'graphql', text: `graphql (graphql-js) is not installed — the schema cannot be validated: ${INSTALL}` }); return; }
  res.graphql = `graphql-js ${g.version}`;
  const body = stripGqlComments(raw);
  if (!body.trim()) { res.warnings.push({ rule: 'no-operations', text: 'the schema is comments only — no documented operation to declare; the gaps it lists go to the component file' }); res.fidelity = { source: null, skipped: 'no operations' }; return; }
  const ph = body.match(PLACEHOLDER);
  let schema;
  try { schema = g.buildSchema(raw); }
  catch (e) {
    const loc = e.locations && e.locations[0];
    res.findings.push(ph ? { rule: 'placeholder', line: loc && loc.line, text: `template placeholder left outside a comment — ${ph[0]}` } : { rule: 'graphql-syntax', line: loc && loc.line, text: String(e.message).split('\n')[0] });
    return;
  }
  g.validateSchema(schema).forEach((e) => { const loc = e.locations && e.locations[0]; res.findings.push({ rule: 'graphql-schema', line: loc && loc.line, text: e.message }); });
  if (ph) res.findings.push({ rule: 'placeholder', text: `template placeholder left outside a comment — ${ph[0]}` });

  // fidelity — every root field is named in the source
  const ops = ROOTS.flatMap(([kind, get]) => { const t = schema[get](); return t ? Object.keys(t.getFields()).map((name) => ({ kind, name })) : []; });
  const source = opts.source || findPayload(file);
  if (source && fs.existsSync(source)) {
    const text = fs.readFileSync(source, 'utf8');
    ops.forEach((o) => { if (!new RegExp(`(^|[^A-Za-z0-9_])${o.name}([^A-Za-z0-9_]|$)`).test(text)) res.findings.push({ rule: 'operation-undocumented', text: `${o.kind} \`${o.name}\` — the source never names this operation; an asset carries only documented operations` }); });
    res.fidelity = { source, summary: `${ops.length} root field(s) checked`, missing: [] };
  } else res.fidelity = { source: null, skipped: 'no source — pass --source <component.md>, or run over a kit whose cut-sheet payloads are in .cache/sa-skills/handoff-payloads/' };

  // breaking changes against the previous version — warnings, so the architect sees a contract break before the devs do
  const prev = opts.baseline === false ? null : previousSdl(file, opts.baseline);
  if (!prev) { res.baseline = 'none — no previous version (pass --baseline <schema.graphql>, or commit the kit)'; return; }
  if (prev.sdl === raw) { res.baseline = `${prev.from} (unchanged)`; return; }
  let old; try { old = g.buildSchema(prev.sdl); } catch { if (stripGqlComments(prev.sdl).trim()) res.warnings.push({ rule: 'baseline', text: `the previous version (${prev.from}) does not build — no comparison` }); res.baseline = `${prev.from} (not comparable)`; return; }
  // a built-in scalar (`Float`, `Boolean` …) no field references any more is not a contract change — graphql-js reports it as TYPE_REMOVED
  const breaking = g.findBreakingChanges(old, schema).filter((c) => !/^Standard scalar /.test(c.description)), dangerous = g.findDangerousChanges(old, schema);
  breaking.forEach((c) => res.warnings.push({ rule: 'breaking-change', text: `${c.type}: ${c.description}` }));
  dangerous.forEach((c) => res.warnings.push({ rule: 'dangerous-change', text: `${c.type}: ${c.description}` }));
  res.baseline = `${prev.from} — ${breaking.length} breaking, ${dangerous.length} dangerous`;
}

// ---- avro (avsc, the JavaScript Avro implementation — a dependency of the plugin)
function projectRoot(file) { let d = path.dirname(path.resolve(file)); for (let i = 0; i < 10; i++) { if (fs.existsSync(path.join(d, 'ARCHITECTURE.md'))) return d; const up = path.dirname(d); if (up === d) break; d = up; } return null; }
function corpus(root) {
  const out = [fs.readFileSync(path.join(root, 'ARCHITECTURE.md'), 'utf8')];
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'handoffs' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.md$/i.test(e.name)) out.push(fs.readFileSync(p, 'utf8')); } };
  walk(path.join(root, 'docs')); return out;
}
function loadAvsc() { try { return pkg('avsc'); } catch { return null; } }
const LOGICAL = new Set(['decimal', 'uuid', 'date', 'time-millis', 'time-micros', 'timestamp-millis', 'timestamp-micros', 'local-timestamp-millis', 'local-timestamp-micros', 'duration']);
// a field name is documented when the source names it, in any case and with or without separators (`event_id` · `eventId`)
const normId = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

function checkAvro(file, raw, res, opts) {
  const avro = opts.avsc !== undefined ? opts.avsc : loadAvsc();
  if (!avro) { res.engine = 'NOT INSTALLED'; res.findings.push({ rule: 'avsc', text: `avsc is not installed — the schema cannot be validated: ${INSTALL}` }); return; }
  res.engine = 'avsc';
  let schema;
  try { schema = JSON.parse(raw); }
  catch (e) { res.findings.push({ rule: 'json-parse', text: `${String(e.message).split('\n')[0]}${/^\s*\/\//m.test(raw) ? ' — a .avsc is JSON: `//` comments make it unreadable to every tool; put a gap in a `doc` value' : ''}` }); return; }
  if (!isMap(schema) || schema.type !== 'record') { res.findings.push({ rule: 'one-record-per-file', text: `the file holds ${Array.isArray(schema) ? `an array of ${schema.length} schemas` : `a \`${isMap(schema) ? schema.type : typeof schema}\``} — one record per file, named after it` }); return; }
  if (path.basename(file, '.avsc') !== schema.name) res.warnings.push({ rule: 'file-name', text: `the file is \`${path.basename(file)}\` and the record \`${schema.name}\` — name the file \`${schema.name}.avsc\`` });
  const strings = (o, at, out) => { if (typeof o === 'string') { if (PLACEHOLDER.test(o)) out.push(`${at}: ${o.match(PLACEHOLDER)[0]}`); } else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) strings(v, `${at}/${k}`, out); return out; };
  strings(schema, '#', []).forEach((x) => res.findings.push({ rule: 'placeholder', text: `template placeholder left in a value — ${x}` }));
  // what avsc lets through: a decimal without precision (the spec requires it), a logical type the spec does not define (ignored silently)
  const fields = [];
  const walk = (t, at) => {
    if (Array.isArray(t)) return t.forEach((x, i) => walk(x, `${at}[${i}]`));
    if (!isMap(t)) return;
    if (t.logicalType) { if (!LOGICAL.has(t.logicalType)) res.warnings.push({ rule: 'logical-type', text: `${at}: \`${t.logicalType}\` is not an Avro logical type — readers ignore it and see the underlying \`${t.type}\`` }); else if (t.logicalType === 'decimal' && !Number.isInteger(t.precision)) res.findings.push({ rule: 'avro-decimal', text: `${at}: a \`decimal\` needs an integer \`precision\` (and \`scale\`)` }); }
    if (t.type === 'record' && Array.isArray(t.fields)) t.fields.forEach((f) => { if (isMap(f)) { fields.push({ name: f.name, at: `${at}.${f.name}` }); walk(f.type, `${at}.${f.name}`); } });
    if (t.type === 'array') walk(t.items, `${at}[]`); if (t.type === 'map') walk(t.values, `${at}{}`); if (isMap(t.type) || Array.isArray(t.type)) walk(t.type, at);
  };
  walk(schema, schema.name || 'record');
  try { avro.Type.forSchema(schema); } catch (e) { res.findings.push({ rule: 'avro-schema', text: String(e.message).split('\n')[0].slice(0, 300) }); }
  // A message is documented by its producer — its descriptor, docs/05, docs/04 — and a consumer's schema repeats it, so the
  // source is the architecture: the payload plus every Markdown file under docs/ (handoffs excluded) and ARCHITECTURE.md.
  // `--source` narrows it to one file.
  const source = opts.source || findPayload(file), root = opts.source ? null : projectRoot(file);
  const texts = [source && fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : '', ...(root ? corpus(root) : [])].filter(Boolean);
  if (texts.length) {
    const ids = new Set(texts.flatMap((t) => (t.match(/[A-Za-z][A-Za-z0-9_.-]*/g) || []).flatMap((w) => [normId(w), ...w.split(/[.]/).map(normId)])));
    fields.forEach((f) => { if (!ids.has(normId(f.name))) res.findings.push({ rule: 'field-undocumented', text: `\`${f.at}\` — the architecture docs never name this field; a schema carries only documented fields` }); });
    if (schema.fields.length === 0 && !/NOT DOCUMENTED|NO DOCUMENTADO/.test(String(schema.doc || ''))) res.warnings.push({ rule: 'no-fields', text: 'the record has no fields and its `doc` names no gap — say which file should document them' });
    res.fidelity = { source: source || root, summary: `${fields.length} field(s) checked against ${opts.source ? 'the given source' : `the architecture docs (${texts.length} file(s))`}`, missing: [] };
  } else res.fidelity = { source: null, skipped: 'no source — pass --source <component.md>, or run over a kit whose cut-sheet payloads are in .cache/sa-skills/handoff-payloads/' };
}

// ---- ddl (8.106.0): the engine's own dialect, checked by the engine's own grammar where one exists in JavaScript —
// libpg-query (PostgreSQL's parser, WebAssembly) for PostgreSQL, node-sql-parser for MySQL, MariaDB, SQL Server, DB2,
// SQLite, Snowflake, Redshift, BigQuery. Oracle has neither: structure and fidelity only, and the receipt says so.
const NSP = { mysql: 'mysql', mariadb: 'mariadb', transactsql: 'transactsql', db2: 'db2', sqlite: 'sqlite', snowflake: 'snowflake', redshift: 'redshift', bigquery: 'bigquery' };
const ENGINE_OF = [[/postgres/i, 'postgresql'], [/mariadb/i, 'mariadb'], [/mysql/i, 'mysql'], [/sql server|mssql|azure sql|t-sql/i, 'transactsql'], [/oracle/i, 'oracle'], [/\bdb2\b/i, 'db2'], [/sqlite/i, 'sqlite'], [/snowflake/i, 'snowflake'], [/redshift/i, 'redshift'], [/bigquery/i, 'bigquery']];
// the engine: the payload's `sql_engine`, else the file's own `-- Engine:` / `-- Database:` line
function ddlEngine(file, raw, opts) {
  if (opts.engine) return opts.engine;
  const pl = findPayload(file); if (pl) { const m = fs.readFileSync(pl, 'utf8').match(/^sql_engine:\s*(\S+)/m); if (m && m[1] !== 'unknown') return m[1]; }
  const h = raw.match(/^\s*--\s*(?:Engine|Database|Motor|Base de datos)\s*:\s*(.+)$/im); if (h) { const e = ENGINE_OF.find(([re]) => re.test(h[1])); if (e) return e[1]; }
  return null;
}
function ddlParse(file, engine) {
  const r = spawnSync(process.execPath, [__filename, '--ddl-worker', path.resolve(file), engine], { encoding: 'utf8', timeout: 120000 });
  try { return JSON.parse(String(r.stdout).trim().split('\n').pop()); } catch { return { error: { message: String(r.stderr || r.error || `exit ${r.status}`).split(/\r?\n/).filter(Boolean).slice(0, 2).join(' ') } }; }
}
// tables → { name, columns[], fks[] } from either parser's tree; a syntax error → { message, line }
async function ddlWorker(file, engine) {
  const sql = fs.readFileSync(file, 'utf8');
  if (engine === 'postgresql') {
    let pg; try { pg = pkg('libpg-query'); } catch { return { absent: 'libpg-query' }; }
    await pg.loadModule();
    let tree; try { tree = pg.parseSync(sql); } catch (e) { const pos = e.sqlDetails && e.sqlDetails.cursorPosition; return { error: { message: String(e.message || e).split('\n')[0], line: pos != null ? sql.slice(0, pos).split('\n').length : null } }; }
    const tables = []; const fk = (c) => (c && c.Constraint && c.Constraint.contype === 'CONSTR_FOREIGN' && c.Constraint.pktable ? c.Constraint.pktable.relname : null);
    for (const s of tree.stmts || []) { const c = s.stmt && s.stmt.CreateStmt; if (!c) continue; const t = { name: c.relation.relname, partition_of: !!c.partbound, columns: [], fks: [] };
      for (const el of c.tableElts || []) { if (el.ColumnDef) { t.columns.push(el.ColumnDef.colname); (el.ColumnDef.constraints || []).forEach((k) => { const f = fk(k); if (f) t.fks.push(f); }); } else { const f = fk(el); if (f) t.fks.push(f); } }
      tables.push(t); }
    return { parser: `libpg-query ${(() => { try { return pkg('libpg-query/package.json').version; } catch { return ''; } })()}`.trim(), tables };
  }
  if (NSP[engine]) {
    let P; try { P = pkg('node-sql-parser').Parser; } catch { return { absent: 'node-sql-parser' }; }
    let ast; try { ast = new P().astify(sql, { database: NSP[engine] }); } catch (e) { return { error: { message: String(e.message || e).split('\n')[0].slice(0, 300), line: e.location && e.location.start ? e.location.start.line : null } }; }
    const name = (x) => (x == null ? null : typeof x === 'string' ? x : x.expr ? name(x.expr.value != null ? x.expr.value : x.expr) : x.value != null ? x.value : x.column != null ? name(x.column) : null);
    const tables = [];
    for (const s of [].concat(ast)) { if (!s || s.type !== 'create' || s.keyword !== 'table') continue; const t = { name: s.table && s.table[0] ? s.table[0].table : null, partition_of: false, columns: [], fks: [] };
      for (const d of s.create_definitions || []) { if (d.resource === 'column') t.columns.push(name(d.column)); if (d.reference_definition && d.reference_definition.table) t.fks.push(d.reference_definition.table[0].table); if (d.constraint_type && /foreign/i.test(d.constraint_type) && d.reference_definition) t.fks.push(d.reference_definition.table[0].table); }
      tables.push(t); }
    return { parser: `node-sql-parser (${NSP[engine]})`, tables };
  }
  return { parser: null, tables: [] };
}

function checkDdl(file, raw, res, opts) {
  const engine = ddlEngine(file, raw, opts); res.sql_engine = engine || 'unknown';
  const body = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
  const ph = body.match(PLACEHOLDER);
  // a file of comments only is what the generator writes when the docs name no table: the gaps it lists go to the
  // component file. It is a warning on every engine — node-sql-parser rejects an empty script where libpg-query
  // accepts it, so a SQL Server store with no documented table used to block the kit (8.133.1)
  if (!body.trim()) { res.engine = engine ? `${engine} — nothing to parse` : 'nothing to parse'; res.warnings.push({ rule: 'no-tables', text: 'the DDL is comments only — no documented table to create; the gaps it lists go to the component file' }); res.fidelity = { source: null, skipped: 'no tables' }; return; }
  if (!engine) res.warnings.push({ rule: 'engine', text: 'no SQL engine named — the payload has no `sql_engine` and the file no `-- Engine:` line; grammar not checked' });
  const r = engine && (engine === 'postgresql' || NSP[engine]) ? (opts.ddlParse ? opts.ddlParse(file, engine) : ddlParse(file, engine)) : { parser: null, tables: [] };
  if (r.absent) { res.engine = 'NOT INSTALLED'; res.findings.push({ rule: 'sql-parser', text: `${r.absent} is not installed — the DDL cannot be checked: ${INSTALL}` }); return; }
  if (r.error) { res.engine = engine; res.findings.push(ph ? { rule: 'placeholder', line: r.error.line, text: `template placeholder left outside a comment — ${ph[0]}` } : { rule: 'sql-syntax', line: r.error.line, text: `${engine}: ${r.error.message}` }); res.fidelity = null; return; }
  res.engine = r.parser || `grammar not checked for ${engine || 'an unnamed engine'}`;
  if (!r.parser && engine) res.warnings.push({ rule: 'grammar', text: `no JavaScript grammar for ${engine} — structure and fidelity are checked, the syntax is not` });
  if (ph) res.findings.push({ rule: 'placeholder', text: `template placeholder left outside a comment — ${ph[0]}` });
  // without a parser, the tables come from the CREATE TABLE statements themselves
  const tables = r.parser ? r.tables : [...body.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."[\]`]+)\s*\(([\s\S]*?)\)\s*[;\n]/gi)].map((m) => ({ name: m[1].replace(/["[\]`]/g, '').split('.').pop(), partition_of: false, fks: [], columns: m[2].split(/,(?![^(]*\))/).map((l) => l.trim().match(/^["[`]?([A-Za-z_][\w$#]*)["\]`]?\s+[A-Za-z]/)).filter((x) => x && !/^(constraint|primary|foreign|unique|check|key|index)$/i.test(x[1])).map((x) => x[1]) }));
  const defined = new Set(tables.map((t) => String(t.name).toLowerCase()));
  tables.forEach((t) => {
    const seen = new Set(); t.columns.forEach((c) => { const k = String(c).toLowerCase(); if (seen.has(k)) res.findings.push({ rule: 'duplicate-column', text: `${t.name}.${c} is declared twice` }); seen.add(k); });
    t.fks.filter((f) => f && !defined.has(String(f).toLowerCase())).forEach((f) => res.warnings.push({ rule: 'fk-target', text: `${t.name} references \`${f}\`, which this file does not create — fine when another component owns it, a typo otherwise` }));
  });
  const source = opts.source || findPayload(file), root = opts.source ? null : projectRoot(file);
  const texts = [source && fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : '', ...(root ? corpus(root) : [])].filter(Boolean);
  if (texts.length) {
    const ids = new Set(texts.flatMap((t) => (t.match(/[A-Za-z][A-Za-z0-9_.-]*/g) || []).flatMap((w) => [normId(w), ...w.split(/[.]/).map(normId)])));
    tables.forEach((t) => {
      if (!ids.has(normId(t.name))) res.findings.push({ rule: 'table-undocumented', text: `table \`${t.name}\`${t.partition_of ? ' (a partition)' : ''} — the architecture docs never name it; a DDL creates only documented tables` });
      t.columns.forEach((c) => { if (!ids.has(normId(c))) res.findings.push({ rule: 'column-undocumented', text: `\`${t.name}.${c}\` — the architecture docs never name this column` }); });
    });
    res.fidelity = { source: source || root, summary: `${tables.length} table(s), ${tables.reduce((n, t) => n + t.columns.length, 0)} column(s) checked against ${opts.source ? 'the given source' : `the architecture docs (${texts.length} file(s))`}`, missing: [] };
  } else res.fidelity = { source: null, skipped: 'no source — pass --source <component.md>, or run over a kit whose cut-sheet payloads are in .cache/sa-skills/handoff-payloads/' };
}

// ---- protobuf (8.107.0): protobufjs parses and resolves; the rules it lets through are ours; field numbers are the wire contract
function loadProtobuf() { try { return pkg('protobufjs'); } catch { return null; } }
// every message (nested included), enum and service of a parsed root
function protoParts(pb, root) {
  const out = { messages: [], enums: [], services: [] };
  const walk = (ns) => (ns.nestedArray || []).forEach((n) => {
    if (n instanceof pb.Type) { out.messages.push({ name: n.name, full: n.fullName.replace(/^\./, ''), fields: Object.values(n.fields).map((f) => ({ name: f.name, id: f.id })), reserved: n.reserved || [] }); }
    else if (n instanceof pb.Enum) out.enums.push({ name: n.name, full: n.fullName.replace(/^\./, ''), values: Object.entries(n.values).map(([k, v]) => ({ name: k, id: v })) });
    else if (n instanceof pb.Service) out.services.push({ name: n.name, full: n.fullName.replace(/^\./, ''), rpcs: Object.values(n.methods).map((m) => ({ name: m.name, req: m.requestType, res: m.responseType })) });
    if (n.nestedArray) walk(n);
  });
  walk(root); return out;
}
function checkProto(file, raw, res, opts) {
  const pb = opts.protobufjs !== undefined ? opts.protobufjs : loadProtobuf();
  if (!pb) { res.engine = 'NOT INSTALLED'; res.findings.push({ rule: 'protobufjs', text: `protobufjs is not installed — the schema cannot be validated: ${INSTALL}` }); return; }
  res.engine = `protobufjs ${(() => { try { return pkg('protobufjs/package.json').version; } catch { return ''; } })()}`.trim();
  const body = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const ph = body.match(PLACEHOLDER);
  let root;
  try { root = pb.parse(raw, { keepCase: true }).root; root.resolveAll(); }
  catch (e) { const m = String(e.message).match(/\(line (\d+)\)/); res.findings.push(ph ? { rule: 'placeholder', line: m ? +m[1] : null, text: `template placeholder left outside a comment — ${ph[0]}` } : { rule: 'proto-syntax', line: m ? +m[1] : null, text: String(e.message).split('\n')[0] }); return; }
  if (ph) res.findings.push({ rule: 'placeholder', text: `template placeholder left outside a comment — ${ph[0]}` });
  const parts = protoParts(pb, root);
  if (!/^\s*syntax\s*=\s*["']proto3["']/m.test(body)) res.warnings.push({ rule: 'syntax', text: 'no `syntax = "proto3";` — the scaffold writes proto3' });
  if (!/^\s*package\s+[\w.]+\s*;/m.test(body)) res.findings.push({ rule: 'package', text: 'no `package` — every .proto of the kit declares one (the docs\' package, or the component slug with a gap)' });
  parts.enums.forEach((e) => { if (!e.values.length || e.values[0].id !== 0) res.findings.push({ rule: 'enum-zero', text: `enum \`${e.full}\`: its first value must be 0 in proto3 (\`${e.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}_UNSPECIFIED = 0\`)` }); });
  parts.messages.forEach((m) => m.fields.forEach((f) => { if (f.id < 1) res.findings.push({ rule: 'field-number', text: `${m.full}.${f.name} = ${f.id}: field numbers start at 1` }); else if (f.id >= 19000 && f.id <= 19999) res.findings.push({ rule: 'field-number', text: `${m.full}.${f.name} = ${f.id}: 19000–19999 are reserved by the protobuf implementation` }); }));
  // fidelity — every service, rpc, message and field is named in the architecture docs; a documented rpc's <Rpc>Request / Response / Reply wrapper is the gRPC convention
  const source = opts.source || findPayload(file), root_ = opts.source ? null : projectRoot(file);
  const texts = [source && fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : '', ...(root_ ? corpus(root_) : [])].filter(Boolean);
  if (texts.length) {
    const ids = new Set(texts.flatMap((t) => (t.match(/[A-Za-z][A-Za-z0-9_.-]*/g) || []).flatMap((w) => [normId(w), ...w.split(/[.]/).map(normId)])));
    const has = (n) => ids.has(normId(n));
    const rpcs = parts.services.flatMap((sv) => sv.rpcs.filter((r) => has(r.name)).map((r) => r.name));
    const wrapper = (n) => rpcs.some((r) => new RegExp(`^${r}(Request|Response|Reply)$`).test(n));
    parts.services.forEach((sv) => { if (!has(sv.name)) res.findings.push({ rule: 'name-undocumented', text: `service \`${sv.full}\` — the architecture docs never name it` }); sv.rpcs.forEach((r) => { if (!has(r.name)) res.findings.push({ rule: 'name-undocumented', text: `rpc \`${sv.name}.${r.name}\` — the architecture docs never name this operation` }); }); });
    parts.messages.forEach((m) => { if (!has(m.name) && !wrapper(m.name)) res.findings.push({ rule: 'name-undocumented', text: `message \`${m.full}\` — the architecture docs never name it` }); m.fields.forEach((f) => { if (!has(f.name)) res.findings.push({ rule: 'name-undocumented', text: `field \`${m.full}.${f.name}\` — the architecture docs never name it` }); }); });
    res.fidelity = { source: source || root_, summary: `${parts.messages.length} message(s), ${parts.messages.reduce((n, m) => n + m.fields.length, 0)} field(s), ${parts.services.reduce((n, sv) => n + sv.rpcs.length, 0)} rpc(s) checked against ${opts.source ? 'the given source' : `the architecture docs (${texts.length} file(s))`}`, missing: [] };
  } else res.fidelity = { source: null, skipped: 'no source — pass --source <component.md>, or run over a kit whose cut-sheet payloads are in .cache/sa-skills/handoff-payloads/' };
  // field numbers against the previous version: a number is the wire contract
  const prev = opts.baseline === false ? null : previousSdl(file, opts.baseline);
  if (!prev) { res.baseline = 'none — no previous version (pass --baseline <schema.proto>, or commit the kit)'; return; }
  if (prev.sdl === raw) { res.baseline = `${prev.from} (unchanged)`; return; }
  let old; try { old = protoParts(pb, pb.parse(prev.sdl, { keepCase: true }).root); } catch { res.baseline = `${prev.from} (not comparable)`; return; }
  let breaking = 0;
  old.messages.forEach((om) => {
    const nm = parts.messages.find((m) => m.full === om.full);
    if (!nm) { breaking++; res.warnings.push({ rule: 'breaking-change', text: `message \`${om.full}\` removed` }); return; }
    om.fields.forEach((of) => {
      const nf = nm.fields.find((f) => f.name === of.name);
      if (nf && nf.id !== of.id) { breaking++; res.warnings.push({ rule: 'breaking-change', text: `${om.full}.${of.name}: field number ${of.id} → ${nf.id} — every consumer reads it as another field` }); }
      if (!nf) { const taker = nm.fields.find((f) => f.id === of.id); if (taker) { breaking++; res.warnings.push({ rule: 'breaking-change', text: `${om.full}: number ${of.id} of removed \`${of.name}\` reused by \`${taker.name}\` — list it in \`reserved\` instead` }); } }
    });
  });
  old.services.forEach((os) => os.rpcs.forEach((or) => { const ns = parts.services.find((s) => s.full === os.full); if (!ns || !ns.rpcs.some((r) => r.name === or.name)) { breaking++; res.warnings.push({ rule: 'breaking-change', text: `rpc \`${os.name}.${or.name}\` removed` }); } }));
  res.baseline = `${prev.from} — ${breaking} breaking`;
}

// ---- redis key schema (8.108.0): Markdown with three fixed tables — the format teams read; fixed headers make it parseable
const REDIS_TABLES = { Keys: ['Key pattern', 'Structure', 'TTL', 'Holds', 'Written by'], Settings: ['Setting', 'Value'], 'On Redis failure': ['Key pattern', 'On Redis failure'] };
const STRUCTURES = new Set(['STRING', 'HASH', 'LIST', 'SET', 'SORTED SET', 'STREAM', 'JSON', 'BITMAP', 'HYPERLOGLOG', 'GEO', 'TIMESERIES']);
const EVICTION = new Set(['noeviction', 'allkeys-lru', 'allkeys-lfu', 'allkeys-random', 'volatile-lru', 'volatile-lfu', 'volatile-random', 'volatile-ttl']);
const SETTINGS = ['Engine', 'Eviction policy', 'Persistence', 'maxmemory'];
const isGap = (v) => /^\[(NOT DOCUMENTED|NO DOCUMENTADO)\b/.test(v);
const cellText = (v) => String(v).trim().replace(/^`|`$/g, '').trim();
// every quantity as seconds or bytes, so `300s` meets "5 minutes" and `7d` meets "7-day TTL"
const UNIT = { ms: 0.001, millisecond: 0.001, milliseconds: 0.001, s: 1, sec: 1, secs: 1, second: 1, seconds: 1, m: 60, min: 60, mins: 60, minute: 60, minutes: 60, h: 3600, hr: 3600, hrs: 3600, hour: 3600, hours: 3600, d: 86400, day: 86400, days: 86400, kb: 1024, kib: 1024, mb: 1024 ** 2, mib: 1024 ** 2, gb: 1024 ** 3, gib: 1024 ** 3, tb: 1024 ** 4 };
const QTY = /(\d[\d,]*(?:\.\d+)?)\s*-?\s*(milliseconds?|ms|seconds?|secs?|s|minutes?|mins?|min|m|hours?|hrs?|hr|h|days?|d|kib|mib|gib|kb|mb|gb|tb)\b/gi;
const qty = (v) => [...String(v).matchAll(QTY)].map((x) => { const u = x[2].toLowerCase(); return `${/b$/.test(u) ? 'B' : 't'}:${+(parseFloat(x[1].replace(/,/g, '')) * UNIT[u]).toFixed(3)}`; });

function checkRedis(file, raw, res, opts) {
  res.engine = 'contract-check (Markdown tables)';
  const lines = raw.split('\n');
  if (!/^#\s+\S/m.test(raw)) res.findings.push({ rule: 'h1', text: 'no H1' });
  // the H2 sections and the first table under each
  const sections = []; let cur = null;
  lines.forEach((l, i) => { const h = l.match(/^##\s+(.+?)\s*$/); if (h) { cur = { name: h[1], line: i + 1, rows: null, header: null }; sections.push(cur); return; }
    if (cur && !cur.header && /^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) { cur.header = l.split('|').slice(1, -1).map((c) => c.trim()); cur.rows = []; cur.hline = i + 1; for (let j = i + 2; j < lines.length && /^\|.*\|\s*$/.test(lines[j]); j++) cur.rows.push({ line: j + 1, cells: lines[j].split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim()) }); } });
  sections.filter((s) => !REDIS_TABLES[s.name]).forEach((s) => res.findings.push({ rule: 'section', line: s.line, text: `\`## ${s.name}\` — the schema is three tables (Keys, Settings, On Redis failure); examples, estimates and client settings are not part of it` }));
  const t = {};
  Object.entries(REDIS_TABLES).forEach(([name, cols]) => { const s = sections.find((x) => x.name === name);
    if (!s || !s.header) return res.findings.push({ rule: 'table', text: `no \`## ${name}\` table` });
    if (s.header.join('|') !== cols.join('|')) return res.findings.push({ rule: 'table-header', line: s.hline, text: `\`## ${name}\` header is \`| ${s.header.join(' | ')} |\` — it must be \`| ${cols.join(' | ')} |\`` });
    t[name] = s.rows; });
  const body = raw.replace(/<!--[\s\S]*?-->/g, ''); const ph = body.match(PLACEHOLDER); if (ph) res.findings.push({ rule: 'placeholder', text: `template placeholder left — ${ph[0]}` });
  // vocabularies
  (t.Keys || []).forEach((r) => { const [pattern, st, ttl] = r.cells.map(cellText);
    if (st && !isGap(st) && !STRUCTURES.has(st.toUpperCase())) res.findings.push({ rule: 'structure', line: r.line, text: `\`${st}\` is not a Redis data structure (${[...STRUCTURES].join(', ')})` });
    if (ttl && !isGap(ttl) && !/^(none|\d+(\.\d+)?\s*(ms|s|min|m|h|d))$/i.test(ttl)) res.findings.push({ rule: 'ttl', line: r.line, text: `TTL \`${ttl}\` — a number and a unit (\`300s\`, \`24h\`) or \`none\`` });
    if (pattern && !isGap(pattern) && /\b(e\.g\.|example|ejemplo)\b/i.test(pattern)) res.findings.push({ rule: 'example', line: r.line, text: 'a key pattern is a pattern, not an example key' }); });
  if (t.Settings) {
    const got = t.Settings.map((r) => cellText(r.cells[0]));
    got.filter((g) => !SETTINGS.includes(g)).forEach((g) => res.findings.push({ rule: 'setting', text: `\`${g}\` is not one of the four settings (${SETTINGS.join(', ')}) — client and sizing values live elsewhere` }));
    SETTINGS.filter((s) => !got.includes(s)).forEach((s) => res.findings.push({ rule: 'setting', text: `no \`${s}\` row — write \`[NOT DOCUMENTED — …]\` when the docs do not state it` }));
    const ev = t.Settings.find((r) => cellText(r.cells[0]) === 'Eviction policy'); const evv = ev && cellText(ev.cells[1]);
    if (evv && !isGap(evv) && !EVICTION.has(evv)) res.findings.push({ rule: 'eviction-policy', line: ev.line, text: `\`${evv}\` is not a Redis eviction policy (${[...EVICTION].join(', ')})` });
  }
  (t['On Redis failure'] || []).forEach((r) => { const v = cellText(r.cells[1] || ''); if (v && !isGap(v) && !/^fail-(open|closed)\b/i.test(v)) res.findings.push({ rule: 'failure', line: r.line, text: 'the cell opens with `fail-open` or `fail-closed`' }); });
  // fidelity — a pattern's fixed prefix, every quantity, every writer, as the docs state them
  const source = opts.source || findPayload(file), root = opts.source ? null : projectRoot(file);
  const texts = [source && fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : '', ...(root ? corpus(root) : [])].filter(Boolean);
  if (!texts.length) { res.fidelity = { source: null, skipped: 'no source — pass --source <component.md>, or run over a kit whose cut-sheet payloads are in .cache/sa-skills/handoff-payloads/' }; return; }
  const all = texts.join('\n'), lower = all.toLowerCase(), quantities = new Set(qty(all)), ids = new Set((all.match(/[A-Za-z][A-Za-z0-9_.-]*/g) || []).map(normId));
  let checked = 0;
  (t.Keys || []).forEach((r) => { const [pattern, , ttl, , writer] = r.cells.map(cellText);
    if (pattern && !isGap(pattern)) { checked++; const prefix = pattern.split('{')[0].replace(/[:._-]+$/, ''); if (prefix && !lower.includes(prefix.toLowerCase())) res.findings.push({ rule: 'key-undocumented', line: r.line, text: `\`${pattern}\` — the architecture docs never state the prefix \`${prefix}\`; a key pattern is the docs', not the convention's` }); }
    qty(ttl).forEach((q) => { if (!quantities.has(q)) res.findings.push({ rule: 'value-undocumented', line: r.line, text: `TTL \`${ttl}\` — the architecture docs never state this duration` }); });
    if (writer && !isGap(writer) && !writer.split(/\s*[,;/]\s*|\s+(?:and|y)\s+/).every((w) => ids.has(normId(w)) || lower.includes(w.toLowerCase()))) res.findings.push({ rule: 'value-undocumented', line: r.line, text: `writer \`${writer}\` — not a name the architecture docs use` }); });
  (t.Settings || []).forEach((r) => { const v = cellText(r.cells[1] || ''); if (isGap(v)) return; qty(v).forEach((q) => { if (!quantities.has(q)) res.findings.push({ rule: 'value-undocumented', line: r.line, text: `${cellText(r.cells[0])} \`${v}\` — the architecture docs never state this quantity` }); }); });
  res.fidelity = { source: source || root, summary: `${checked} key pattern(s) checked against ${opts.source ? 'the given source' : `the architecture docs (${texts.length} file(s))`}`, missing: [] };
}

// ---- one file
function slugOf(file) { const m = path.basename(path.dirname(path.resolve(file))).match(/^\d+-(.+)$/); return m ? m[1] : null; }
function findPayload(file) {
  const slug = slugOf(file); if (!slug) return null; let d = path.dirname(path.resolve(file));
  for (let i = 0; i < 8; i++) { const p = path.join(d, '.cache', 'sa-skills', 'handoff-payloads', `${slug}.md`); if (fs.existsSync(p)) return stalePayload(p, d) ? null : p; const up = path.dirname(d); if (up === d) break; d = up; }
  return null;
}
// a payload cut for another architecture version is not the asset's source: a kit regenerated elsewhere (CI) leaves the
// local cut behind, and its operations are the old version's
function stalePayload(p, root) {
  const pv = (fs.readFileSync(p, 'utf8').match(/^architecture_version:\s*"?([\w.-]+)"?\s*$/m) || [])[1];
  const a = path.join(root, 'ARCHITECTURE.md');
  const av = fs.existsSync(a) ? (fs.readFileSync(a, 'utf8').match(/<!--\s*ARCHITECTURE_VERSION:\s*([\w.-]+)\s*-->/) || [])[1] : null;
  return !!(pv && av && pv !== av);
}

function checkFile(file, opts = {}) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  if (/\.graphqls?$/i.test(file)) { const res = { file, kind: 'graphql', findings: [], warnings: [], fidelity: null, graphql: null, baseline: null }; checkGraphql(file, raw, res, opts); res.engine = res.graphql; return res; }
  if (/\.avsc$/i.test(file)) { const res = { file, kind: 'avro', findings: [], warnings: [], fidelity: null, engine: null }; checkAvro(file, raw, res, opts); return res; }
  if (/redis-key-schema\.md$/i.test(file)) { const res = { file, kind: 'redis', findings: [], warnings: [], fidelity: null, engine: null }; checkRedis(file, raw, res, opts); return res; }
  if (/\.proto$/i.test(file)) { const res = { file, kind: 'protobuf', findings: [], warnings: [], fidelity: null, engine: null, baseline: null }; checkProto(file, raw, res, opts); return res; }
  if (/\.sql$/i.test(file)) { const res = { file, kind: 'ddl', findings: [], warnings: [], fidelity: null, engine: null }; checkDdl(file, raw, res, opts); return res; }
  const res = { file, kind: /asyncapi/i.test(path.basename(file)) ? 'asyncapi' : 'openapi', findings: [], warnings: [], fidelity: null, redocly: null };
  let doc; try { doc = Bun.YAML.parse(raw); } catch (e) { res.findings.push({ rule: 'yaml-parse', text: String(e.message || e).split('\n')[0] }); return res; }
  if (Array.isArray(doc)) doc = doc[0];
  const st = structure(doc); res.kind = st.kind; res.findings.push(...st.f); res.warnings.push(...st.w);
  const source = opts.source || findPayload(file);
  if (source && fs.existsSync(source) && isMap(doc)) {
    const fi = fidelity(doc, st, fs.readFileSync(source, 'utf8'));
    res.findings.push(...fi.f); res.warnings.push(...fi.w);
    res.fidelity = { source, summary: fi.summary, missing: fi.missing };
  } else res.fidelity = { source: null, skipped: 'no source — pass --source <component.md>, or run over a kit whose cut-sheet payloads are in .cache/sa-skills/handoff-payloads/' };
  const rd = opts.redoclyLint ? opts.redoclyLint(file) : redocly(file);
  if (rd.absent) { res.redocly = 'NOT INSTALLED'; res.findings.push({ rule: 'redocly', text: `@redocly/openapi-core is not installed — the contract cannot be validated: ${INSTALL}` }); }
  else if (rd.error) { res.redocly = `error — ${rd.error}`; res.findings.push({ rule: 'redocly', text: `Redocly could not lint the file: ${rd.error}` }); }
  else {
    res.redocly = `redocly ${rd.version} (${rd.config})`;
    rd.problems.forEach((p) => {
      if (st.pointers.has(p.pointer) || [...st.pointers].some((x) => p.pointer.startsWith(`${x}/`))) return;   // already reported above, with its fix
      const x = { rule: `redocly/${p.ruleId}`, line: p.line, text: `${p.message}${p.pointer ? ` (${p.pointer})` : ''}` };
      (p.severity === 'error' && REDOCLY_BLOCKING(p.ruleId) ? res.findings : res.warnings).push(x);
    });
  }
  return res;
}

// `--judge`: is a declared-but-absent operation one the component exposes? A confident yes blocks. An operation the
// judge has not answered stays an `operation-missing` warning (the code check) and is listed under the file's
// `undecided` with the worksheet — never blocked on, never dismissed (8.119.0).
async function judgeMissing(results, engine, root) {
  const { judge, value } = require(SA.fromSaSkills('scripts', 'judge.js'));
  // a file-safe id per operation (the judge refuses a space or a `/`): the asset directory's slug, the file's and the operation's position; the key travels in the state
  const items = results.flatMap((r, i) => (r.fidelity && r.fidelity.missing || []).map((m, k) => ({ id: `${path.basename(path.dirname(r.file)).replace(/[^a-z0-9._-]+/gi, '-').replace(/^[^a-z0-9]+/i, '') || 'asset'}:f${i + 1}.op${k + 1}`, state: { operation: m.key, section: m.heading || '', line: m.text }, _r: r, _m: m })));
  if (!items.length) return null;
  const spec = { id: 'openapi-operation-exposed', type: 'noul', question: 'The component this descriptor documents exposes `item.operation` itself — it serves this endpoint; it is not an endpoint the component calls on another system.', criteria: 'Judge from `item.section` and `item.line`. A row in an endpoints / API / inbound table, or a bullet listing what the component serves, is exposed. A call made to an upstream or downstream system, or a mention inside another endpoint\'s description, is not.' };
  let res; try { res = await judge(spec, items.map(({ id, state }) => ({ id, state })), { engine, root }); } catch (e) { if (e.name !== 'JudgeError' || e.code === 'engine') throw e; res = { engine, answers: {}, error: e.message }; }   // a misnamed engine is a usage error, not an undecided item
  const why = res.pending ? `the judge's worksheet is pending — answer ${res.pending} and re-run` : res.error ? `the judge failed — ${res.error}` : 'no judge answered';
  const undecided = [];
  items.forEach((it) => { const a = res.answers[it.id];
    if (!a) { (it._r.undecided = it._r.undecided || []).push({ rule: 'operation-undecided', key: it._m.key, text: `${it._m.key} — whether the component exposes it is undecided: ${why}` }); undecided.push(it.id); return; }
    const p = value(a); const by = a.by || res.engine;
    const wi = it._r.warnings.find((x) => x.rule === 'operation-missing' && x.key === it._m.key); if (wi) wi.text += ` · judged ${p.toFixed(2)} by ${by}`;
    if (p >= 0.85) { it._r.findings.push({ rule: 'operation-missing', text: `${it._m.key} — the component exposes it (judged ${p.toFixed(2)} by ${by}) and the file lacks it` }); if (wi) it._r.warnings.splice(it._r.warnings.indexOf(wi), 1); } });
  return { engine: res.engine, pending: res.pending || null, error: res.error || null, undecided };
}

const CONTRACT = /^((openapi|asyncapi)\.ya?ml|schema\.graphqls?|[^/]+\.avsc|ddl\.sql|schema\.proto|redis-key-schema\.md)$/;
function files(targets) {
  const out = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name === '.cache') continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (CONTRACT.test(e.name)) out.push(p); } };
  targets.forEach((t) => (fs.statSync(t).isDirectory() ? walk(t) : out.push(t))); return out;
}
function check(targets, opts = {}) {
  const r = { status: 'PASS', files: files(targets).map((f) => checkFile(f, opts)) };
  if (r.files.some((f) => f.findings.length)) r.status = 'FAIL';
  return r;
}
const render = (r) => r.files.map((f) => {
  const fi = !f.fidelity ? 'fidelity: not reached — the file does not parse' : f.fidelity.source ? `fidelity: ${f.fidelity.summary} in ${path.basename(f.fidelity.source)}` : `fidelity: ${f.fidelity.skipped}`;
  return `${f.file}: ${f.findings.length ? 'FAIL' : 'ok'}\n  ${fi}\n  ${f.kind === 'graphql' ? `graphql: ${f.graphql}\n  baseline: ${f.baseline || '—'}` : f.kind === 'avro' ? `avro: ${f.engine}` : f.kind === 'ddl' ? `sql: ${f.engine}` : f.kind === 'redis' ? `redis: ${f.engine}` : f.kind === 'protobuf' ? `protobuf: ${f.engine}\n  baseline: ${f.baseline || '—'}` : `redocly: ${f.redocly}`}` + f.findings.map((x) => `\n    ✗ [${x.rule}]${x.line ? ` line ${x.line}` : ''} ${x.text}`).join('') + f.warnings.map((x) => `\n    ! [${x.rule}]${x.line ? ` line ${x.line}` : ''} ${x.text}`).join('') + (f.undecided || []).map((x) => `\n    ? [${x.rule}] ${x.text}`).join('');
}).join('\n') + `\n${r.files.length} file(s) · ${r.status}`;

module.exports = { check, checkFile, judgeMissing, render, sourceOps, structure, fidelity, normPath, REDOCLY_BLOCKING, loadCore, loadGraphql, loadAvsc, loadProtobuf, stripGqlComments, ddlEngine, CONTRACT };

if (require.main === module && process.argv[2] === '--redocly-worker') {
  redoclyWorker(process.argv[3]).then((r) => console.log(JSON.stringify(r)), (e) => console.log(JSON.stringify({ error: String(e && e.message || e).split('\n')[0] })));
} else if (require.main === module && process.argv[2] === '--ddl-worker') {
  ddlWorker(process.argv[3], process.argv[4]).then((r) => console.log(JSON.stringify(r)), (e) => console.log(JSON.stringify({ error: { message: String(e && e.message || e).split('\n')[0] } })));
} else if (require.main === module && process.argv[2] === '--probe') {
  const absent = [loadCore() ? null : '@redocly/openapi-core', loadGraphql() ? null : 'graphql', loadAvsc() ? null : 'avsc', (() => { try { require.resolve('libpg-query'); return null; } catch { return 'libpg-query'; } })(), (() => { try { require.resolve('node-sql-parser'); return null; } catch { return 'node-sql-parser'; } })(), loadProtobuf() ? null : 'protobufjs'].filter(Boolean);
  if (!absent.length) { console.log('contract-check: @redocly/openapi-core, graphql, avsc, libpg-query, node-sql-parser and protobufjs installed'); process.exit(0); }
  console.log(`contract-check: ${absent.join(' and ')} not installed — ${INSTALL}`); process.exit(1);
} else if (require.main === module) {
  (async () => {
    const a = process.argv.slice(2), val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
    const flagged = new Set(['--source', '--judge', '--baseline'].flatMap((k) => { const i = a.indexOf(k); return i >= 0 ? [i + 1] : []; }));
    const targets = a.filter((x, i) => !x.startsWith('--') && !flagged.has(i));
    if (!targets.length) { console.error('Usage: bun contract-check.js <openapi.yaml | asyncapi.yaml | schema.graphql | handoffs_dir …> [--source <component.md>] [--baseline <old schema.graphql> | --no-baseline] [--judge <engine>] [--json]\n       bun contract-check.js --probe'); process.exit(2); }
    const missing = targets.filter((t) => !fs.existsSync(t)); if (missing.length) { console.error(`contract-check: not found: ${missing.join(', ')}`); process.exit(2); }
    const r = check(targets, { source: val('--source'), baseline: a.includes('--no-baseline') ? false : val('--baseline') });
    if (val('--judge')) { const j = await judgeMissing(r.files, val('--judge'), process.cwd()); if (j && j.undecided.length) console.error(`contract-check: ${j.undecided.length} operation(s) undecided — ${j.pending ? `answer the worksheet at ${j.pending} and re-run with --judge agent` : `the judge failed (${j.error || 'no answer'})`}`); r.status = r.files.some((f) => f.findings.length) ? 'FAIL' : 'PASS'; }
    console.log(a.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
    process.exit(r.status === 'FAIL' ? 1 : 0);
  })();
}
