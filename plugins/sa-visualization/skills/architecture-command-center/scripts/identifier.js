// What is an internal identifier, so `code` (the BIAN eyebrow) never hides one. Shared by render.js (the
// gate) and scene-from-docs.js (the carry-over from a base scene). A `code` is segments joined by ` · `;
// a segment is an identifier when it is a portfolio application id (`COR0009 - Books`, `CHL0003 - SHOP-APP`),
// or a single token — no whitespace — that is not a bare number and not a BIAN reference: a workload slug
// (`shp-msa-dm-rt-order-transaction`), a schema or product code (`BDD_OMNI_TRANS`,
// `WSProductos0223`, `Kong-CAS`), a topic (`evt_tcp_sp_books_p012-inct_prod`), a host path.
'use strict';
const PORTFOLIO_ID = /^[A-Z]{3}\d{4}\s*-\s*\S/;
const isIdentifier = (seg) => { const s = String(seg || '').trim(); if (!s) return false; if (PORTFOLIO_ID.test(s)) return true; if (/^BIAN\b/i.test(s) || /^\d+$/.test(s)) return false; return !/\s/.test(s) && /[-_.]|[A-Za-z]\d|\d[A-Za-z]/.test(s); };
const segments = (code) => String(code || '').split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
const identifierSegments = (code) => segments(code).filter(isIdentifier);
module.exports = { PORTFOLIO_ID, isIdentifier, segments, identifierSegments };
