#!/usr/bin/env node
// po-spec-precheck.js — chat mode's pre-check (CHAT_MODE.md): the candidates the evaluation's code would find, for the
// model in the chat to read, and never a score.
//
//   node po-spec-precheck.js <PRODUCT_OWNER_SPEC.md> [--json]        (Node or Bun — a Claude chat's sandbox has both)
//
// Stage 1 of po-spec-checkability.js, nothing more: a use case missing a part (by code — a finding), a statement whose
// words suggest it fails one of the five tests, a statement that names a technology. The tests' criteria and the
// implementation question print with them, so the chat reads each candidate against the evaluation's own wording. No
// judge, no section multiplier, no Ready cap, no stamp: those run in Claude Code (`evaluate PO spec`). The chat package
// carries this file bundled (scripts/build-chat-skill.ts → precheck/po-spec-precheck.cjs).
// Exit: 0 nothing found by code · 1 a part missing · always 0 for candidates alone (a candidate is a question, not a failure).
'use strict';
const fs = require('fs');
const { extract, SPEC, IMPL, LADDER } = require('./po-spec-checkability.js');

const DRAFT_RE = /^<!--\s*READINESS_CHECK:\s*(draft|verified)\b/m;

function precheck(text) {
  const ex = extract(text);
  const row = (s) => ({ id: s.id, where: s.where, line: s.line, text: s.text });
  const stamp = (text.replace(/\r\n?/g, '\n').match(DRAFT_RE) || [])[1] || 'none';
  return {
    statements: ex.statements.length,
    missing_sections: ex.sections.filter((s) => !s.present).map((s) => s.anchor),
    missing_parts: ex.structural.map((s) => ({ where: s.where, line: s.line, text: s.text, ask: LADDER['missing-part'] })),
    candidates: ex.statements.filter((s) => s.cues.length).map((s) => ({ ...row(s), tests: s.cues, ask: s.cues.map((t) => LADDER[t]) })),
    implementation: ex.statements.filter((s) => s.impl).map(row),
    stamp,
  };
}

function render(r) {
  const out = [`PRE-CHECK · ${r.statements} statement(s) · ${r.missing_parts.length} missing part(s) · ${r.candidates.length} to read · ${r.implementation.length} naming a technology · no score — the evaluation runs in Claude Code`];
  if (r.missing_sections.length) out.push(`  sections not found: ${r.missing_sections.join(', ')}`);
  if (r.missing_parts.length) { out.push('', 'Missing parts (by code — each one a finding):'); for (const m of r.missing_parts) out.push(`  ✗ ${m.where} (line ${m.line}) — ${m.text}`); }
  if (r.candidates.length) {
    out.push('', 'To read — a finding only when the statement really fails the test named; the words that flagged it may be fine:');
    for (const c of r.candidates) out.push(`  ? [${c.id}] ${c.where} (line ${c.line}) · ${c.tests.join(', ')} — "${c.text}"`, ...c.ask.map((a) => `      → ${a}`));
    out.push('', `Question: ${SPEC.question.replace('`item.text`', 'the statement').replace('`item.where`', 'its place')}`);
    for (const t of [...new Set(r.candidates.flatMap((c) => c.tests))]) out.push(`  ${t}: ${SPEC.criteria[t]}`);
    out.push(`  ok: ${SPEC.criteria.ok}`);
  }
  if (r.implementation.length) {
    out.push('', 'Implementation? — a finding only when it prescribes how to build the system:');
    for (const c of r.implementation) out.push(`  ? [${c.id}] ${c.where} (line ${c.line}) — "${c.text}"`);
    out.push('', `Question: ${IMPL.question.replace('`item.statement`', 'the statement').replace('`item.where`', 'its place')}`, `  yes: ${IMPL.criteria.true}`, `  no: ${IMPL.criteria.false}`);
  }
  out.push('', `Stamp: ${r.stamp}${r.stamp === 'draft' ? '' : ' — a spec written in chat ends with <!-- READINESS_CHECK: draft -->'}`);
  return out.join('\n');
}

module.exports = { precheck, render };

if (require.main === module) {
  const args = process.argv.slice(2), spec = args.find((a) => !a.startsWith('--'));
  if (!spec) { console.error('usage: po-spec-precheck.js <PRODUCT_OWNER_SPEC.md> [--json]'); process.exit(2); }
  const r = precheck(fs.readFileSync(spec, 'utf8'));
  console.log(args.includes('--json') ? JSON.stringify(r, null, 1) : render(r));
  process.exit(r.missing_parts.length ? 1 : 0);
}
