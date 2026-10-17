#!/usr/bin/env node
// integration-head.js — the one reading of a docs/05 integration block's head line. Three scripts read it:
// docs-stats.js (the 150-word block budget), prose-check.js (S-FORM-02) and handoff-prepare.js (the Interface
// Contract's detail block). Each used to carry its own regex, and they disagreed on the forms below.
//
// A head opens the line, in bold, with one or more `I-nn` ids and a dash:
//
//   **I-04 — Consulta de saldos**                                    title line; the body follows on the next lines
//   **I-19 e I-20 — Atestación del dispositivo y revocación**         a compound head: one block, registered under each id
//   **I-11 — retirada**, per [ADR-120] the channel no longer calls…  a head with its body inline (a retired integration)
//   **I-07** — Validación local del SDK …                             bold on the id only
//
// Ids join with `y`, `e`, `and`, `,`, `&` or `/`. `## I-04 — …` is a heading, which every reader already treats as one.
'use strict';

const ID = 'I-\\d+';
const JOIN = '\\s*(?:,|&|/|\\by\\b|\\be\\b|\\band\\b)\\s*';
const IDS = `${ID}(?:${JOIN}${ID})*`;
const DASH = '\\s*[—–-]\\s*';
// the bold closes after the title (`**I-04 — title**` + optional inline body) or after the ids (`**I-07** — title …`)
const TITLE_BOLD = new RegExp(`^\\s*\\*\\*(${IDS})${DASH}(.+?)\\*\\*(.*)$`, 'i');
const IDS_BOLD = new RegExp(`^\\s*\\*\\*(${IDS})\\*\\*${DASH}(.+)$`, 'i');

function integrationHead(line) {
  const l = String(line || '');
  let m = l.match(TITLE_BOLD), title, rest;
  if (m) { title = m[2]; rest = m[3]; }
  else if ((m = l.match(IDS_BOLD))) { title = m[2]; rest = ''; }
  else return null;
  const ids = [...new Set(m[1].match(/I-\d+/gi).map((x) => x.toUpperCase()))];
  const inline = String(rest || '').replace(/^\s*[,.;:—–-]?\s*/, '').trim();
  return { ids, title: title.trim(), inline, titleOnly: !inline && !!l.match(TITLE_BOLD) };
}

module.exports = { integrationHead };
