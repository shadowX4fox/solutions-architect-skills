#!/usr/bin/env bun
// prose-hook.js — the prose contract at the moment of writing, not after it (8.115.0).
//
//   bun prose-hook.js pre    (PreToolUse,  Write | Edit | MultiEdit — stdin: the hook input JSON)
//   bun prose-hook.js post   (PostToolUse, Write | Edit | MultiEdit)
//
// The gates (Step 5.7 check 3, Post-Write Check F, the release check) run prose-check.js after a section, a segment or an
// edit is written. On the reference project a first write came back with 800–1,200 warnings, the model brought them
// down in pass after pass, and 20 of the project's last 40 commits were prose rework; an edit never saw the length
// rules at all (scope `edit` runs Groups 1, 2, 6 and 8). The hook runs the same rules — prose-check.js, nothing
// transcribed — on the text a Write or an Edit is about to put in an architecture document, and only on its new lines:
//
//   pre  — the BLOCKING lexical rules (Groups 1, 2, 9: boilerplate, banned constructions, edit markers, a record's
//          localized structure). Under an enforcing project (`PROSE_STYLE: v1`) a hit denies the call with every
//          finding and its fix, and the model rewrites before the file changes. Report-only projects are never denied.
//   post — the WARNING rules of Groups 1–4 (sentence and paragraph length, consecutive prose paragraphs, a claim
//          without a number) on the lines just written, handed back as context in the same turn. Never blocks.
//
// The judgement rules (mannered prose, history, agentless passive, future tense) need the judge and stay with the gates.
// Scope: ARCHITECTURE.md, docs/**/*.md and project records (adr/ADR-101+, tdr/) of a directory holding ARCHITECTURE.md.
// Anything else, a malformed input or an internal error: exit 0 and silence — a hook never stands between the model
// and a file it is not about.
'use strict';
const fs = require('fs');
const path = require('path');
const { check } = require(path.join(__dirname, 'prose-check.js'));

const MAX = 12;   // findings printed per call; the rest are counted

/** The project root above a file: the nearest directory holding ARCHITECTURE.md. */
function rootOf(file) { let d = path.dirname(file); for (let i = 0; i < 12; i++) { if (fs.existsSync(path.join(d, 'ARCHITECTURE.md'))) return d; const up = path.dirname(d); if (up === d) break; d = up; } return null; }
/** Which architecture document a path is: 'docs' | 'record' | null. */
function kindOf(root, file) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (rel === 'ARCHITECTURE.md' || (/^docs\/.+\.md$/.test(rel))) return 'docs';
  if (/^adr\/ADR-(\d+)[^/]*\.md$/.test(rel) && Number(rel.match(/^adr\/ADR-(\d+)/)[1]) > 100) return 'record';
  if (/^tdr\/TDR-\d+[^/]*\.md$/.test(rel)) return 'record';
  return null;
}
const readOr = (f, d) => { try { return fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n'); } catch { return d; } };
const norm = (s) => String(s == null ? '' : s).replace(/\r\n?/g, '\n');
/** Apply one Edit to a text: the first occurrence, or every one under replace_all. null when old_string is absent (the tool will fail on its own). */
function applyEdit(text, e) {
  const o = norm(e.old_string), n = norm(e.new_string); if (!o) return n + text;
  if (!text.includes(o)) return null;
  return e.replace_all ? text.split(o).join(n) : text.replace(o, () => n);
}
/** The content a call will leave in the file, from its input and the file as it stands. */
function contentAfter(tool, input, before) {
  if (tool === 'Write') return norm(input.content);
  if (tool === 'Edit') return applyEdit(before, input);
  if (tool === 'MultiEdit') { let t = before; for (const e of input.edits || []) { t = applyEdit(t, e); if (t === null) return null; } return t; }
  return null;
}
/** The content the file held before a call that has already run, rebuilt from its input — '' for a Write (all of it is new). */
function contentBefore(tool, input, after) {
  if (tool === 'Write') return '';
  const undo = (t, e) => { const o = norm(e.old_string), n = norm(e.new_string); if (!n) return t; return e.replace_all ? t.split(n).join(o) : t.replace(n, () => o); };
  if (tool === 'Edit') return undo(after, input);
  if (tool === 'MultiEdit') return (input.edits || []).slice().reverse().reduce(undo, after);
  return after;
}
/** Line numbers (1-based) of `after` that `before` did not hold — a multiset difference of lines, so a moved line is old. */
function newLines(before, after) {
  const pool = new Map(); before.split('\n').forEach((l) => pool.set(l, (pool.get(l) || 0) + 1));
  const out = new Set(); after.split('\n').forEach((l, i) => { const c = pool.get(l) || 0; if (c > 0) pool.set(l, c - 1); else if (l.trim()) out.add(i + 1); });
  return out;
}

async function review(event, payload) {
  const tool = payload.tool_name, input = payload.tool_input || {};
  if (!['Write', 'Edit', 'MultiEdit'].includes(tool) || !input.file_path) return null;
  const file = path.resolve(payload.cwd || process.cwd(), input.file_path);
  if (!/\.md$/i.test(file)) return null;
  const root = rootOf(file); if (!root) return null;
  const kind = kindOf(root, file); if (!kind) return null;
  let before, after;
  if (event === 'pre') { before = readOr(file, ''); after = contentAfter(tool, input, before); if (after === null) return null; }
  else { after = readOr(file, null); if (after === null) return null; before = contentBefore(tool, input, after); }
  const lines = newLines(before, after); if (!lines.size) return null;
  const scope = kind === 'record' ? 'records' : 'first-write';
  const groups = event === 'pre' ? [1, 2, 9] : [1, 2, 3, 4];
  const r = await check(root, { scope, files: [file], groups, judge: false, texts: { [file]: after } });
  const mine = r.findings.filter((f) => lines.has(f.line));
  const hits = event === 'pre' ? mine.filter((f) => f.severity === 'BLOCKING') : mine.filter((f) => f.severity !== 'BLOCKING');
  return { root, file, mode: r.mode, hits };
}

const lineOf = (f) => `- ${f.ruleId} line ${f.line}: ${String(f.excerpt || '').slice(0, 140)}${f.fix ? ` → ${String(f.fix).slice(0, 220)}` : ''}`;
function message(event, res) {
  const rel = path.relative(res.root, res.file).split(path.sep).join('/');
  const list = res.hits.slice(0, MAX).map(lineOf).join('\n') + (res.hits.length > MAX ? `\n- … ${res.hits.length - MAX} more` : '');
  return event === 'pre'
    ? `Prose contract (PROSE_VALIDATION.md, enforcing): the text for ${rel} breaks ${res.hits.length} BLOCKING rule(s) on its new lines. Rewrite those lines and retry the call; do not drop a fact.\n${list}`
    : `Prose contract — ${res.hits.length} warning(s) on the lines just written to ${rel} (fix now while the text is in context; never by dropping a fact):\n${list}`;
}

// The hook protocol: PreToolUse denies through hookSpecificOutput.permissionDecision, PostToolUse hands context back
// through hookSpecificOutput.additionalContext; an empty stdout is a no-op.
function output(event, res) {
  if (!res || !res.hits.length) return '';
  if (event === 'pre') { if (res.mode !== 'enforcing') return ''; return JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: message('pre', res) } }); }
  return JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message('post', res) } });
}

module.exports = { review, output, message, newLines, contentAfter, contentBefore, kindOf, rootOf };

if (require.main === module) {
  (async () => {
    const event = process.argv[2] === 'post' ? 'post' : 'pre';
    let raw = ''; for await (const c of process.stdin) raw += c;
    let payload; try { payload = JSON.parse(raw); } catch { return; }
    const out = output(event, await review(event, payload));
    if (out) process.stdout.write(out);
  })().catch(() => { /* a hook never blocks on its own failure */ }).finally(() => process.exit(0));
}
