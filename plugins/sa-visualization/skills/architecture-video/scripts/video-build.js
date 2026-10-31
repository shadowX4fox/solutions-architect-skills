#!/usr/bin/env bun
'use strict';
// The architecture video as a HyperFrames project, by code: storyboard.json (video-prepare.js) + lines.json (Alia's lines,
// written by the session) → <out>/index.html, <out>/compositions/<scene>.html and <out>/assets/. Every figure and name on
// screen comes from the storyboard; the lines are checked here — a line that breaks a rule is refused, named, and its scene
// renders without it. The look is the Alia Guide design system: night and light grounds, Nunito and IBM Plex Mono, her poses
// on the stage, her talking codec (160 px, the video size) on each chapter card, her escudo once, on the title.
//
//   bun video-build.js <storyboard.json> <lines.json> --out <dir> [--json]
const fs = require('fs');
const path = require('path');

const W = 1920, H = 1080;
const GSAP = 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js';
const ASSETS = path.join(__dirname, '..', 'assets');
// the Alia Guide palette
const NIGHT = '#0d1418', NIGHT2 = '#15222a', NLINE = '#2b4a55', AQUA = '#2ee6e6', AQUA_MARK = '#0c9da3', AQUA_INK = '#0a7177', SILVER = '#c9d1d9', MUTED = '#8ea3ad';
const PAGE = '#f3f7f9', INK = '#1b1f24', INK2 = '#44515c', BORDER = '#d5e0e5', CODE_FILL = '#e8f0f3';
const MOOD = { calm: ['#2ee6e6', '46,230,230'], thinking: ['#2ee6e6', '46,230,230'], pleased: ['#4dffa0', '77,255,160'], worried: ['#ffd23f', '255,210,63'], stern: ['#ff3b4e', '255,59,78'] };
const FACE = { calm: 'face-calm', thinking: 'face-thinking', pleased: 'face-pleased', worried: 'face-warn', stern: 'face-stern' };
const TALKS = new Set(['calm', 'thinking', 'pleased']);   // the talking frames smile: a worried or stern call keeps its face and bobs
const GRID = 'linear-gradient(rgba(46,230,230,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(46,230,230,.07) 1px, transparent 1px)';
const READ_WPS = 2.2, READ_PAD = 1.5, TYPE_CPS = 26, MOUTH = 0.15;

const T = {
  en: { kick_what: 'WHAT IT IS', problem: 'The problem', answer: 'The answer', chapter: { context: 'Who it talks to', layers: 'How it is organized', flows: 'How a request moves', decisions: 'Decisions that shape it', risks: 'What stays open' },
    verb: { calm: 'explains', thinking: 'thinks', pleased: 'highlights', worried: 'warns', stern: 'stops' }, owned: 'owned', external: 'external', containers: (n) => `${n} container${n === 1 ? '' : 's'}`,
    links: (n) => `${n} cross-system link${n === 1 ? '' : 's'}`, systems: (n) => `${n} system${n === 1 ? '' : 's'}`, layers_n: (n) => `${n} layers`, flows_n: (n) => `${n} use case${n === 1 ? '' : 's'}`,
    use_case: 'USE CASE', trigger: 'Trigger', target: 'Target', governed: 'Governed by', more: (n) => `+${n} more phases`, consumed: 'consumed', decisions_k: (n, s) => `${n} ${s === 'project' ? 'PROJECT ' : ''}DECISION${n === 1 ? '' : 'S'} IN FORCE`,
    debt_k: (n) => `${n} OPEN ITEM${n === 1 ? '' : 'S'} OF TECHNICAL DEBT`, decisions_n: (n) => `${n} decision${n === 1 ? '' : 's'} in force`, debt_n: (n) => `${n} open item${n === 1 ? '' : 's'}`,
    read_more: 'Read more: ARCHITECTURE.md · docs/ · adr/', tip: "Alia's tip", shown_of: (a, b) => `${a} of ${b}` },
  es: { kick_what: 'QUÉ ES', problem: 'El problema', answer: 'La respuesta', chapter: { context: 'Con quién habla', layers: 'Cómo se organiza', flows: 'Cómo viaja una petición', decisions: 'Las decisiones que la forman', risks: 'Lo que queda abierto' },
    verb: { calm: 'explica', thinking: 'piensa', pleased: 'destaca', worried: 'advierte', stern: 'frena' }, owned: 'propio', external: 'externo', containers: (n) => `${n} contenedor${n === 1 ? '' : 'es'}`,
    links: (n) => `${n} enlace${n === 1 ? '' : 's'} entre sistemas`, systems: (n) => `${n} sistema${n === 1 ? '' : 's'}`, layers_n: (n) => `${n} capas`, flows_n: (n) => `${n} caso${n === 1 ? '' : 's'} de uso`,
    use_case: 'CASO DE USO', trigger: 'Disparador', target: 'Objetivo', governed: 'Gobernado por', more: (n) => `+${n} fases más`, consumed: 'consumido', decisions_k: (n, s) => `${n} DECISI${n === 1 ? 'ÓN' : 'ONES'} ${s === 'project' ? 'DEL PROYECTO ' : ''}VIGENTE${n === 1 ? '' : 'S'}`,
    debt_k: (n) => `${n} DEUDA${n === 1 ? '' : 'S'} TÉCNICA${n === 1 ? '' : 'S'} ABIERTA${n === 1 ? '' : 'S'}`, decisions_n: (n) => `${n} decisi${n === 1 ? 'ón vigente' : 'ones vigentes'}`, debt_n: (n) => `${n} abierta${n === 1 ? '' : 's'}`,
    read_more: 'Más en: ARCHITECTURE.md · docs/ · adr/', tip: 'Tip de Alia', shown_of: (a, b) => `${a} de ${b}` },
};

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const words = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const need = (s) => (s ? READ_PAD + words(s) / READ_WPS : 0);
const r2 = (x) => Math.round(x * 100) / 100;

// ---------------------------------------------------------------- lines: Alia's, checked
function checkLines(sb, lines) {
  const ok = {}, refused = [], absent = [];
  for (const [k, s] of Object.entries(sb.slots)) {
    const v = lines[k];
    if (v == null || v === '') { if (!s.optional) absent.push(k); continue; }
    const why = typeof v !== 'string' ? 'not a string'
      : /[\r\n]/.test(v) ? 'a line break'
      : /(\*\*|__|`|^#|\[[^\]]*\]\(|\|)/.test(v) ? 'Markdown'
      : /<[a-z!/]/i.test(v) ? 'HTML'
      : v.trim().length > s.max ? `${v.trim().length} characters, the limit is ${s.max}` : null;
    if (why) refused.push({ slot: k, why }); else ok[k] = v.trim();
  }
  const unknown = Object.keys(lines).filter((k) => !sb.slots[k]);
  return { ok, refused, absent, unknown };
}

// ---------------------------------------------------------------- pieces
const css = (sid, night, inner) => `
    #root { position:absolute; inset:0; overflow:hidden; font-family:'Nunito', sans-serif; }
    #${sid} { position:absolute; inset:0; overflow:hidden; font-family:'Nunito', sans-serif; ${night ? `background-color:${NIGHT}; background-image:${GRID}; background-size:48px 48px; color:#fff;` : `background:${PAGE}; color:${INK};`} }
    #${sid} .kicker { font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:28px; letter-spacing:4px; color:${night ? AQUA : AQUA_INK}; margin:0; }
    #${sid} h1 { margin:0; }
    #${sid} .stage { position:absolute; }
    #${sid} .stage .halo { position:absolute; inset:4% 2% 8%; border-radius:50%; background:radial-gradient(closest-side, ${night ? 'rgba(46,230,230,.16)' : '#dcfafa'}, transparent); }
    #${sid} .stage .ring { position:absolute; left:20%; right:20%; bottom:0; height:56px; border-radius:50%; ${night ? `border:3px solid ${AQUA}; box-shadow:0 0 28px rgba(46,230,230,.45);` : `border:3px solid ${AQUA_MARK};`} }
    #${sid} .stage img { position:absolute; left:-35%; bottom:26px; width:170%; height:calc(100% - 40px); object-fit:contain; object-position:bottom; filter:${night ? 'drop-shadow(0 0 40px rgba(46,230,230,.42))' : 'drop-shadow(0 16px 26px rgba(13,20,24,.18))'}; }
    #${sid} .stage .tag { position:absolute; top:0; right:0; margin:0; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:24px; letter-spacing:4px; color:${night ? AQUA : AQUA_INK}; }
    ${inner}`;

function card(sid, night, innerCss, innerHtml, js, dur) {
  return { sid, dur: r2(dur), doc: `<template>
  <style>${css(sid, night, innerCss)}
  </style>
  <div id="${sid}" data-composition-id="${sid}" data-width="${W}" data-height="${H}">
${innerHtml}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${js.filter(Boolean).join('\n    ')}
    window.__timelines["${sid}"] = tl;
  </script>
</template>
` };
}

// Alia on her stage: halo, ring, the pose standing on it, her tag
const stage = (sid, pose, tag, [l, t, w, h]) => `    <div id="${sid}-st" class="stage" style="left:${l}px; top:${t}px; width:${w}px; height:${h}px">
      <div class="halo"></div><div class="ring"></div>
      <img id="${sid}-alia" src="assets/alia/alia-${pose}.webp" alt="Alia">
      <p class="tag">ALIA · ${esc(tag.toUpperCase())}</p>
    </div>`;
const stageIn = (sid, at, out) => [`tl.fromTo("#${sid}-st", { opacity:0 }, { opacity:1, duration:0.5, ease:"power2.out" }, ${at});`,
  `tl.fromTo("#${sid}-alia", { y:60 }, { y:0, duration:0.9, ease:"expo.out" }, ${at});`, `tl.to("#${sid}-st", { opacity:0, duration:0.25, ease:"power3.in" }, ${r2(out)});`];
const fadeIn = (sel, at, y = 24) => `tl.fromTo("${sel}", { opacity:0, y:${y} }, { opacity:1, y:0, duration:0.5, ease:"expo.out" }, ${r2(at)});`;
const fadeOut = (sid, at) => `tl.to("#${sid} > *", { opacity:0, duration:0.25, ease:"power3.in" }, ${r2(at)});`;

// ---------------------------------------------------------------- scenes
function titleScene(sb, L, t) {
  const a = sb.architecture, sid = 'title', dur = Math.max(7, 3 + need(L['title.tagline']));
  const kick = [a.type, a.version && `v${a.version}`, a.status].filter(Boolean).join(' · ').toUpperCase();
  return card(sid, true, `#title-k { position:absolute; left:160px; top:270px; display:flex; align-items:center; gap:24px; }
    #title-k img { width:64px; height:64px; }
    #title-bar { position:absolute; left:160px; top:372px; width:14px; height:200px; background:${AQUA}; border-radius:7px; box-shadow:0 0 22px rgba(46,230,230,.55); }
    #title-h { position:absolute; left:206px; top:360px; font-weight:900; font-size:96px; letter-spacing:-1.5px; line-height:1.05; max-width:1080px; color:#fff; }
    #title-s { position:absolute; left:208px; top:620px; font-weight:700; font-size:38px; color:${SILVER}; margin:0; max-width:1060px; line-height:1.3; }`,
  `    <div id="title-k" class="kicker"><img src="assets/alia/escudo.png" alt="Alia's escudo"><span>${esc(kick)}</span></div>
    <div id="title-bar"></div>
    <h1 id="title-h">${esc(a.name)}</h1>
${L['title.tagline'] ? `    <p id="title-s">${esc(L['title.tagline'])}</p>` : ''}
${stage(sid, 'cover', a.language === 'es' ? 'navegadora' : 'navigator', [1340, 110, 500, 860])}`,
  [fadeIn('#title-k', 0.2, 0), `tl.fromTo("#title-bar", { scaleY:0, transformOrigin:"50% 0" }, { scaleY:1, duration:0.6, ease:"expo.out" }, 0.4);`,
    `tl.fromTo("#title-h", { opacity:0, filter:"blur(8px)" }, { opacity:1, filter:"blur(0px)", duration:0.5, ease:"power4.out" }, 0.6);`,
    L['title.tagline'] && fadeIn('#title-s', 1.3), ...stageIn(sid, 0.4, dur - 0.3), fadeOut(sid, dur - 0.3)], dur);
}

function overviewScene(sb, L, t) {
  const p = L['what.problem'], s = L['what.solution'];
  if (!p && !s) return null;
  const sid = 'what', dur = Math.max(9, 2.5 + need(p) + need(s));
  const box = (id, head, text, at) => text ? [`    <div id="${id}" class="wcard"><p class="wh">${esc(head)}</p><p class="wt">${esc(text)}</p></div>`, fadeIn('#' + id, at)] : ['', null];
  const [hp, jp] = box('what-p', t.problem, p, 1.0), [hs, js] = box('what-s', t.answer, s, 1.0 + (p ? need(p) * 0.6 : 0));
  return card(sid, false, `#what-k { position:absolute; left:120px; top:110px; }
    #what-h { position:absolute; left:120px; top:156px; font-weight:800; font-size:72px; letter-spacing:-1px; }
    #what-row { position:absolute; left:120px; top:330px; width:1260px; display:flex; flex-direction:column; gap:36px; }
    .wcard { background:#fff; border:1.5px solid ${BORDER}; border-radius:24px; padding:32px 40px; box-shadow:0 10px 28px rgba(13,20,24,.08); }
    .wh { margin:0 0 12px; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:24px; letter-spacing:3px; text-transform:uppercase; color:${AQUA_INK}; }
    .wt { margin:0; font-weight:700; font-size:36px; line-height:1.4; color:${INK}; }`,
  `    <p id="what-k" class="kicker">${esc(t.kick_what)}</p>
    <h1 id="what-h">${esc(sb.architecture.name)}</h1>
    <div id="what-row">
${hp}
${hs}
    </div>
${stage(sid, 'explaining', t.verb.calm, [1440, 230, 400, 720])}`,
  [fadeIn('#what-k', 0.1, 0), fadeIn('#what-h', 0.25), jp, js, ...stageIn(sid, 0.5, dur - 0.3), fadeOut(sid, dur - 0.3)], dur);
}

// a chapter card: its number, title and the facts it opens on, and Alia's call — the talking codec at the video size
function chapterScene(sb, L, t, n, key, sub, mood) {
  const sid = `ch-${key}`, text = L[`chapter.${key}`];
  if (!text) return null;
  const [hexm, rgb] = MOOD[mood], talks = TALKS.has(mood);
  const tIn = 0.9, tType = tIn + 0.5, dType = r2(text.length / TYPE_CPS);
  const dur = Math.max(9, tType + dType + 1.2, 2.5 + words(text) / 2.4);
  const faces = talks ? `<img id="${sid}-fm" src="assets/alia/faces/${FACE[mood]}.webp" alt="Alia"><img id="${sid}-fc" src="assets/alia/faces/face-talk-closed.webp" alt=""><img id="${sid}-fo" src="assets/alia/faces/face-talk-open.webp" alt="">`
    : `<img id="${sid}-fm" src="assets/alia/faces/${FACE[mood]}.webp" alt="Alia">`;
  const js = [`tl.fromTo("#${sid}-n", { opacity:0, y:40 }, { opacity:1, y:0, duration:0.6, ease:"expo.out" }, 0.1);`,
    `tl.fromTo("#${sid}-t", { opacity:0, filter:"blur(8px)" }, { opacity:1, filter:"blur(0px)", duration:0.4, ease:"power4.out" }, 0.25);`,
    `tl.fromTo("#${sid}-s", { opacity:0 }, { opacity:1, duration:0.4, ease:"power2.out" }, 0.55);`, fadeIn(`#${sid}-codec`, tIn),
    // the line, typed: a function of timeline time, so a seek shows the same letters
    `const say = document.querySelector("#${sid}-say"), full = say.dataset.full, ty = { v: 0 };`,
    `tl.to(ty, { v: full.length, duration: ${dType}, ease: "none", onUpdate: () => { say.textContent = full.slice(0, Math.round(ty.v)); } }, ${tType});`];
  if (talks) {
    js.push(`tl.set(["#${sid}-fc", "#${sid}-fo"], { opacity:0 }, 0);`, `tl.set("#${sid}-fm", { opacity:0 }, ${tType});`);
    for (let k = 0, at = tType; at < tType + dType; k++, at += MOUTH) js.push(`tl.set("#${sid}-fc", { opacity:${k % 2 ? 0 : 1} }, ${r2(at)}); tl.set("#${sid}-fo", { opacity:${k % 2 ? 1 : 0} }, ${r2(at)});`);
    js.push(`tl.set(["#${sid}-fc", "#${sid}-fo"], { opacity:0 }, ${r2(tType + dType)}); tl.set("#${sid}-fm", { opacity:1 }, ${r2(tType + dType)});`);
  } else js.push(`tl.to("#${sid}-face", { y:-8, duration:0.3, ease:"sine.inOut", yoyo:true, repeat:${Math.max(1, Math.floor(dType / 0.6) * 2 - 1)} }, ${tType});`);
  js.push(fadeOut(sid, dur - 0.25));
  return card(sid, true, `#${sid}-n { position:absolute; left:160px; top:150px; font-weight:900; font-size:260px; line-height:1; color:${AQUA}; margin:0; border-bottom:16px solid ${AQUA}; text-shadow:0 0 40px rgba(46,230,230,.35); }
    #${sid}-col { position:absolute; left:${n >= 10 ? 560 : 400}px; top:192px; width:1360px; display:flex; flex-direction:column; gap:28px; }
    #${sid}-t { font-weight:900; font-size:84px; letter-spacing:-1px; line-height:1.05; color:#fff; }
    #${sid}-s { font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:28px; color:${SILVER}; margin:0; line-height:1.4; }
    #${sid}-codec { position:absolute; left:160px; top:560px; width:1600px; display:flex; align-items:center; gap:36px; padding:28px 44px 28px 28px; box-sizing:border-box;
      background:${NIGHT2}; border:2px solid ${hexm}; border-radius:24px; box-shadow:0 0 30px rgba(${rgb},.28); }
    #${sid}-face { position:relative; flex:none; width:160px; height:160px; border-radius:999px; border:4px solid ${hexm}; background:${NIGHT2}; overflow:hidden; }
    #${sid}-face img { position:absolute; inset:0; width:160px; height:160px; object-fit:cover; }
    #${sid}-body { margin:0; flex:1; }
    #${sid}-lab { display:block; margin:0 0 12px; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:24px; letter-spacing:3px; color:${SILVER}; }
    #${sid}-lab b { color:${hexm}; font-weight:600; }
    #${sid}-say { display:block; min-height:150px; font-weight:700; font-size:36px; line-height:1.4; color:#fff; }`,
  `    <p id="${sid}-n">${n}</p>
    <div id="${sid}-col">
      <h1 id="${sid}-t">${esc(t.chapter[key])}</h1>
      <p id="${sid}-s">${esc(sub)}</p>
    </div>
    <div id="${sid}-codec">
      <div id="${sid}-face">${faces}</div>
      <p id="${sid}-body"><span id="${sid}-lab"><b>ALIA</b> · ${esc(t.verb[mood].toUpperCase())}</span><span id="${sid}-say" data-full="${esc(text)}"></span></p>
    </div>`, js, dur);
}

// the system context: the owned systems in the middle, the others on both sides, a line per pair that talks
function contextScene(sb, sc, t) {
  const sid = 'context', own = sc.owned.length ? sc.owned : [{ name: sb.architecture.name, containers: 0 }];
  const ext = sc.external.slice(0, 10), left = ext.filter((_, i) => i % 2 === 0), right = ext.filter((_, i) => i % 2 === 1);
  const pos = new Map(), boxes = [];
  const col = (list, x, w, h, cls) => { const gap = Math.min(40, (640 - list.length * h) / Math.max(1, list.length - 1)); const top = 300 + (640 - (list.length * h + (list.length - 1) * gap)) / 2;
    list.forEach((s, i) => { const y = top + i * (h + gap); pos.set(s.name, { x, y, w, h }); boxes.push({ s, x, y, w, h, cls }); }); };
  col(own, 720, 480, own.length > 2 ? 160 : 240, 'own'); col(left, 120, 440, 140, 'ext'); col(right, 1360, 440, 140, 'ext');
  const links = sc.links.filter((l) => pos.has(l.from) && pos.has(l.to));
  const anchor = (b, other) => ({ x: other.x + other.w / 2 < b.x ? b.x : other.x > b.x + b.w / 2 ? b.x + b.w : b.x + b.w / 2, y: b.y + b.h / 2 });
  const svg = links.map((l, i) => { const A = pos.get(l.from), B = pos.get(l.to), p = anchor(A, B), q = anchor(B, A), len = Math.hypot(q.x - p.x, q.y - p.y);
    return `<line id="cx-l${i}" x1="${r2(p.x)}" y1="${r2(p.y)}" x2="${r2(q.x)}" y2="${r2(q.y)}" stroke="${AQUA_MARK}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${r2(len)}" stroke-dashoffset="${r2(len)}"/>`
      + `<text id="cx-t${i}" x="${r2((p.x + q.x) / 2)}" y="${r2((p.y + q.y) / 2 - 12)}" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="24" fill="${AQUA_INK}">${esc((l.protocols[0] || '') + (l.count > 1 ? ` ×${l.count}` : ''))}</text>`; }).join('');
  const dur = Math.max(10, 3 + boxes.length * 0.5 + links.length * 0.5 + 2);
  const js = [fadeIn('#cx-k', 0.1, 0), fadeIn('#cx-h', 0.25)];
  boxes.forEach((b, i) => js.push(`tl.fromTo("#cx-b${i}", { opacity:0, scale:0.9 }, { opacity:1, scale:1, duration:0.5, ease:"back.out(1.6)" }, ${r2(0.8 + (b.cls === 'own' ? 0 : 0.6 + i * 0.25))});`));
  const l0 = 1.4 + boxes.length * 0.25;
  links.forEach((_, i) => js.push(`tl.to("#cx-l${i}", { strokeDashoffset:0, duration:0.7, ease:"power2.inOut" }, ${r2(l0 + i * 0.45)});`, `tl.fromTo("#cx-t${i}", { opacity:0 }, { opacity:1, duration:0.3 }, ${r2(l0 + i * 0.45 + 0.5)});`));
  js.push(fadeOut(sid, dur - 0.3));
  return card(sid, false, `#cx-k { position:absolute; left:120px; top:90px; }
    #cx-h { position:absolute; left:120px; top:136px; font-weight:800; font-size:64px; letter-spacing:-1px; }
    #cx-svg { position:absolute; left:0; top:0; }
    .cxb { position:absolute; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; padding:0 28px; border-radius:20px; }
    .cxb.own { background:${NIGHT}; color:#fff; border:3px solid ${AQUA}; box-shadow:0 0 34px rgba(46,230,230,.35); }
    .cxb.ext { background:#fff; color:${INK}; border:2px dashed ${MUTED}; }
    .cxb b { font-weight:800; font-size:38px; line-height:1.15; }
    .cxb span { margin-top:6px; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:20px; letter-spacing:2px; text-transform:uppercase; }
    .cxb.own span { color:${AQUA}; } .cxb.ext span { color:${INK2}; }`,
  `    <p id="cx-k" class="kicker">${esc([t.systems(sc.owned.length + sc.external.length), t.links(sc.links.length)].join(' · ').toUpperCase())}</p>
    <h1 id="cx-h">${esc(t.chapter.context)}</h1>
    <svg id="cx-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg>
${boxes.map((b, i) => `    <div id="cx-b${i}" class="cxb ${b.cls}" style="left:${r2(b.x)}px; top:${r2(b.y)}px; width:${b.w}px; height:${b.h}px"><b>${esc(b.s.name)}</b><span>${esc(b.cls === 'own' ? t.owned : t.external)}${b.s.containers ? ' · ' + esc(t.containers(b.s.containers)) : ''}</span></div>`).join('\n')}`, js, dur);
}

// the layers, top to bottom, each with its containers; a layer outside the boundary is drawn as consumed
function layersScene(sb, sc, t) {
  const sid = 'layers', n = sc.layers.length, bandH = Math.min(120, Math.floor(690 / n) - 14), dur = Math.max(10, 3 + n * 1.1 + 2);
  const js = [fadeIn('#ly-k', 0.1, 0), fadeIn('#ly-h', 0.25)];
  const bands = sc.layers.map((l, i) => {
    js.push(`tl.fromTo("#ly-b${i}", { opacity:0, x:-40 }, { opacity:1, x:0, duration:0.5, ease:"expo.out" }, ${r2(0.9 + i * 1.0)});`);
    l.containers.forEach((_, j) => js.push(`tl.fromTo("#ly-c${i}-${j}", { opacity:0, scale:0.85 }, { opacity:1, scale:1, duration:0.35, ease:"back.out(1.8)" }, ${r2(1.2 + i * 1.0 + j * 0.12)});`));
    return `    <div id="ly-b${i}" class="lyb${l.owned ? '' : ' cons'}" style="top:${300 + i * (bandH + 14)}px; height:${bandH}px">
      <p class="lyn"><span>L${esc(l.n)}</span>${esc(l.name)}${l.owned ? '' : ` <i>${esc(t.consumed)}</i>`}</p>
      <div class="lyc">${l.containers.map((c, j) => `<span id="ly-c${i}-${j}">${esc(c)}</span>`).join('')}</div>
    </div>`;
  });
  js.push(fadeOut(sid, dur - 0.3));
  const chip = Math.max(20, Math.min(26, bandH / 3.4));
  return card(sid, false, `#ly-k { position:absolute; left:120px; top:90px; }
    #ly-h { position:absolute; left:120px; top:136px; font-weight:800; font-size:64px; letter-spacing:-1px; }
    .lyb { position:absolute; left:120px; width:1680px; box-sizing:border-box; display:flex; align-items:center; gap:32px; padding:0 28px; background:#fff; border:1.5px solid ${BORDER}; border-left:10px solid ${AQUA_MARK}; border-radius:18px; }
    .lyb.cons { background:${CODE_FILL}; border-left-color:${MUTED}; border-style:dashed; }
    .lyn { flex:none; width:380px; margin:0; font-weight:800; font-size:30px; color:${INK}; }
    .lyn span { display:inline-block; width:64px; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:24px; color:${AQUA_INK}; }
    .lyn i { font-style:normal; font-family:'IBM Plex Mono', monospace; font-size:18px; color:${INK2}; letter-spacing:2px; text-transform:uppercase; }
    .lyc { display:flex; flex-wrap:wrap; gap:10px 12px; }
    .lyc span { padding:6px 16px; border-radius:999px; background:${NIGHT}; color:#fff; font-weight:700; font-size:${r2(chip)}px; }
    .lyb.cons .lyc span { background:#fff; color:${INK}; border:1.5px solid ${MUTED}; }`,
  `    <p id="ly-k" class="kicker">${esc([t.layers_n(n), sc.type].filter(Boolean).join(' · ').toUpperCase())}</p>
    <h1 id="ly-h">${esc(t.chapter.layers)}</h1>
${bands.join('\n')}`, js, dur);
}

// one use case: its phases in order with owner chain and budget, the target, the ADRs that govern it, and Alia's tip
function flowScene(sb, sc, L, t) {
  const sid = `flow-${String(sc.code).replace(/[^\w-]/g, '')}`, tip = L[`flow.${sc.code}.tip`], n = sc.phases.length;
  const tPh = 1.4, step = 1.3, tEnd = tPh + n * step, dur = Math.max(10, tEnd + 2.5 + (tip ? need(tip) : 0));
  const cw = Math.min(440, Math.floor((1680 - (n - 1) * 40) / n)), js = [fadeIn('#fl-k', 0.1, 0), fadeIn('#fl-h', 0.25), fadeIn('#fl-tr', 0.6, 0)];
  const cards = sc.phases.map((p, i) => {
    js.push(`tl.fromTo("#fl-p${i}", { opacity:0, y:30 }, { opacity:1, y:0, duration:0.45, ease:"expo.out" }, ${r2(tPh + i * step)});`);
    if (i) js.push(`tl.fromTo("#fl-a${i}", { scaleX:0, transformOrigin:"0 50%" }, { scaleX:1, duration:0.35, ease:"power2.out" }, ${r2(tPh + i * step - 0.3)});`);
    js.push(`tl.fromTo("#fl-p${i}", { borderColor:"${AQUA}" }, { borderColor:"${BORDER}", duration:0.6 }, ${r2(tPh + i * step + 0.9)});`);
    return (i ? `      <div id="fl-a${i}" class="fla"></div>\n` : '') + `      <div id="fl-p${i}" class="flp" style="width:${cw}px">
      <p class="fln">${esc(p.n)}</p><p class="flt">${esc(p.name)}</p>${p.owner_chain ? `<p class="flo">${esc(p.owner_chain)}</p>` : ''}${p.budget ? `<p class="flb">${esc(p.budget)}</p>` : ''}
    </div>`;
  });
  js.push(fadeIn('#fl-tg', tEnd), sc.governed_by.length && fadeIn('#fl-gv', tEnd + 0.3));
  let tipHtml = '';
  if (tip) {
    const at = r2(tEnd + 0.8);
    tipHtml = `    <div id="fl-tip"><div class="tipalia"><div class="tipring"></div><img id="fl-tipa" src="assets/alia/alia-point-left.webp" alt="Alia"></div><p id="fl-tipb" class="tipbubble"><b>${esc(t.tip)}</b>${esc(tip)}</p></div>`;
    js.push(`tl.fromTo("#fl-tipa", { opacity:0, y:80 }, { opacity:1, y:0, duration:0.6, ease:"back.out(1.6)" }, ${at});`, `tl.fromTo("#fl-tipb", { opacity:0, x:30 }, { opacity:1, x:0, duration:0.45, ease:"power3.out" }, ${r2(at + 0.3)});`);
  }
  js.push(fadeOut(sid, dur - 0.3));
  const kick = [`${t.use_case} ${sc.code}`, ...(sc.use_cases || [])].join(' · ');
  return card(sid, false, `#fl-k { position:absolute; left:120px; top:90px; }
    #fl-h { position:absolute; left:120px; top:136px; font-weight:800; font-size:64px; letter-spacing:-1px; max-width:1680px; }
    #fl-tr { position:absolute; left:120px; top:236px; margin:0; font-weight:700; font-size:30px; color:${INK2}; max-width:1680px; }
    #fl-tr b, #fl-tg b, #fl-gv b { font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:22px; letter-spacing:2px; text-transform:uppercase; color:${AQUA_INK}; margin-right:14px; }
    #fl-body { position:absolute; left:120px; top:320px; width:1680px; display:flex; flex-direction:column; gap:34px; }
    #fl-row { display:flex; align-items:stretch; }
    .flp { flex:none; min-height:250px; box-sizing:border-box; padding:22px 20px; background:#fff; border:3px solid ${BORDER}; border-radius:20px; box-shadow:0 10px 26px rgba(13,20,24,.08); }
    .fla { flex:none; align-self:center; width:40px; height:4px; background:${AQUA_MARK}; }
    .fln { margin:0; width:48px; height:48px; border-radius:24px; background:${NIGHT}; color:${AQUA}; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:24px; display:flex; align-items:center; justify-content:center; }
    .flt { margin:14px 0 0; font-weight:800; font-size:${n > 4 ? 28 : 34}px; line-height:1.2; color:${INK}; }
    .flo { margin:10px 0 0; font-weight:600; font-size:${n > 4 ? 20 : 24}px; line-height:1.3; color:${INK2}; }
    .flb { margin:12px 0 0; display:inline-block; padding:4px 12px; border-radius:8px; background:${CODE_FILL}; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:20px; color:${AQUA_INK}; }
    #fl-tg { margin:0; font-weight:800; font-size:34px; color:${INK}; }
    #fl-gv { margin:0; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:24px; color:${INK}; }
    #fl-tip { position:absolute; inset:0; pointer-events:none; }
    .tipalia { position:absolute; right:40px; bottom:24px; width:300px; height:330px; }
    .tipalia img { position:absolute; left:-20%; bottom:18px; width:140%; height:100%; object-fit:contain; object-position:bottom; filter:drop-shadow(0 8px 14px rgba(13,20,24,.25)); }
    .tipring { position:absolute; left:18%; right:18%; bottom:4px; height:34px; border-radius:50%; border:3px solid ${AQUA_MARK}; }
    .tipbubble { position:absolute; right:350px; bottom:120px; width:700px; margin:0; padding:22px 28px; background:${NIGHT2}; border:2px solid ${AQUA}; border-radius:22px; color:#fff; font-weight:700; font-size:31px; line-height:1.35; }
    .tipbubble b { display:block; margin-bottom:6px; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:22px; letter-spacing:3px; text-transform:uppercase; color:${AQUA}; }
    .tipbubble::after { content:""; position:absolute; right:-36px; bottom:40px; border-top:16px solid transparent; border-bottom:16px solid transparent; border-left:34px solid ${AQUA}; }`,
  `    <p id="fl-k" class="kicker">${esc(kick.toUpperCase())}</p>
    <h1 id="fl-h">${esc(sc.name)}</h1>
${sc.trigger ? `    <p id="fl-tr"><b>${esc(t.trigger)}</b>${esc(sc.trigger)}</p>` : ''}
    <div id="fl-body">
      <div id="fl-row">
${cards.join('\n')}
      </div>
${sc.target ? `    <p id="fl-tg"><b>${esc(t.target)}</b>${esc(sc.target)}${sc.more_phases ? ` · ${esc(t.more(sc.more_phases))}` : ''}</p>` : ''}
${sc.governed_by.length ? `    <p id="fl-gv"><b>${esc(t.governed)}</b>${esc(sc.governed_by.join(' · '))}</p>` : ''}
    </div>
${tipHtml}`, js, dur);
}

const listCss = (pfx) => `#${pfx}-k { position:absolute; left:120px; top:110px; }
    #${pfx}-h { position:absolute; left:120px; top:156px; font-weight:800; font-size:64px; letter-spacing:-1px; }
    #${pfx}-grid { position:absolute; left:120px; top:300px; width:1260px; display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    .${pfx}c { background:#fff; border:1.5px solid ${BORDER}; border-radius:20px; padding:24px 28px; box-shadow:0 10px 26px rgba(13,20,24,.07); }
    .${pfx}c p { margin:0; }
    .${pfx}c .id { font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:22px; letter-spacing:2px; color:${AQUA_INK}; }
    .${pfx}c .tt { margin-top:8px; font-weight:800; font-size:28px; line-height:1.25; color:${INK}; }`;

function decisionsScene(sb, sc, t) {
  const sid = 'decisions', dur = Math.max(10, 2.5 + sc.adrs.length * 1.3 + 2);
  const js = [fadeIn('#dc-k', 0.1, 0), fadeIn('#dc-h', 0.25), ...sc.adrs.map((_, i) => fadeIn(`#dc-c${i}`, 0.9 + i * 1.0)), ...stageIn(sid, 0.5, dur - 0.3), fadeOut(sid, dur - 0.3)];
  return card(sid, false, listCss('dc'), `    <p id="dc-k" class="kicker">${esc(t.decisions_k(sc.total, sc.scope) + (sc.total > sc.adrs.length ? ' · ' + t.shown_of(sc.adrs.length, sc.total).toUpperCase() : ''))}</p>
    <h1 id="dc-h">${esc(t.chapter.decisions)}</h1>
    <div id="dc-grid">
${sc.adrs.map((d, i) => `      <div id="dc-c${i}" class="dcc"><p class="id">${esc(d.id)}</p><p class="tt">${esc(d.title)}</p></div>`).join('\n')}
    </div>
${stage(sid, 'explaining', t.verb.calm, [1440, 230, 400, 720])}`, js, dur);
}

function risksScene(sb, sc, t) {
  const sid = 'risks', dur = Math.max(10, 2.5 + sc.tdrs.length * 1.3 + 2);
  const js = [fadeIn('#rk-k', 0.1, 0), fadeIn('#rk-h', 0.25), ...sc.tdrs.map((_, i) => fadeIn(`#rk-c${i}`, 0.9 + i * 1.0)), ...stageIn(sid, 0.5, dur - 0.3), fadeOut(sid, dur - 0.3)];
  return card(sid, false, listCss('rk') + `\n    .rkc .st { float:right; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:20px; color:#a04f00; background:#fcf3d6; padding:2px 10px; border-radius:8px; }`,
  `    <p id="rk-k" class="kicker">${esc(t.debt_k(sc.total) + ' · ' + Object.entries(sc.by_status).map(([s, n]) => `${s} ${n}`).join(' · ').toUpperCase())}</p>
    <h1 id="rk-h">${esc(t.chapter.risks)}</h1>
    <div id="rk-grid">
${sc.tdrs.map((d, i) => `      <div id="rk-c${i}" class="rkc"><p class="id">${esc(d.id)}<span class="st">${esc(d.status)}</span></p><p class="tt">${esc(d.title)}</p></div>`).join('\n')}
    </div>
${stage(sid, 'warning', t.verb.worried, [1440, 230, 400, 720])}`, js, dur);
}

function endScene(sb, L, t) {
  const a = sb.architecture, sid = 'end', c = L['end.closing'], dur = Math.max(8, 3 + need(c));
  return card(sid, true, `#end-k { position:absolute; left:160px; top:300px; }
    #end-h { position:absolute; left:160px; top:350px; font-weight:900; font-size:88px; letter-spacing:-1.5px; line-height:1.05; max-width:1100px; color:#fff; }
    #end-c { position:absolute; left:160px; top:500px; margin:0; max-width:1100px; font-weight:700; font-size:40px; line-height:1.35; color:${SILVER}; }
    #end-r { position:absolute; left:160px; top:820px; margin:0; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:26px; letter-spacing:2px; color:${MUTED}; }`,
  `    <p id="end-k" class="kicker">${esc([a.version && `v${a.version}`, a.status, a.released].filter(Boolean).join(' · ').toUpperCase())}</p>
    <h1 id="end-h">${esc(a.name)}</h1>
${c ? `    <p id="end-c">${esc(c)}</p>` : ''}
    <p id="end-r">${esc(t.read_more)}</p>
${stage(sid, 'happy', a.language === 'es' ? 'hasta pronto' : 'see you', [1340, 110, 500, 860])}`,
  [fadeIn('#end-k', 0.2, 0), fadeIn('#end-h', 0.4), c && fadeIn('#end-c', 1.0), fadeIn('#end-r', 1.6, 0), ...stageIn(sid, 0.4, dur - 0.3), fadeOut(sid, dur - 0.3)], dur);
}

// ---------------------------------------------------------------- the project
function build(sb, lines, out) {
  const t = T[sb.architecture.language] || T.en, chk = checkLines(sb, lines), L = chk.ok, order = [];
  let n = 0;
  const chapter = (sc, sub) => { const c = chapterScene(sb, L, t, n + 1, sc.chapter, sub, sc.mood); if (c) { n++; order.push(c); } };
  for (const sc of sb.scenes) {
    if (sc.kind === 'title') order.push(titleScene(sb, L, t));
    else if (sc.kind === 'overview') { const s = overviewScene(sb, L, t); if (s) order.push(s); }
    else if (sc.kind === 'context') { chapter(sc, [t.systems(sc.owned.length + sc.external.length), t.links(sc.links.length)].join(' · ')); order.push(contextScene(sb, sc, t)); }
    else if (sc.kind === 'layers') { chapter(sc, [t.layers_n(sc.layers.length), sc.type].filter(Boolean).join(' · ')); order.push(layersScene(sb, sc, t)); }
    else if (sc.kind === 'flow') { if (sc.chapter) chapter(sc, t.flows_n(sb.scenes.filter((x) => x.kind === 'flow').length)); order.push(flowScene(sb, sc, L, t)); }
    else if (sc.kind === 'decisions') { chapter(sc, t.decisions_n(sc.total)); order.push(decisionsScene(sb, sc, t)); }
    else if (sc.kind === 'risks') { chapter(sc, t.debt_n(sc.total)); order.push(risksScene(sb, sc, t)); }
    else if (sc.kind === 'end') order.push(endScene(sb, L, t));
  }
  fs.mkdirSync(path.join(out, 'compositions'), { recursive: true });
  for (const f of fs.readdirSync(path.join(out, 'compositions'))) if (f.endsWith('.html')) fs.rmSync(path.join(out, 'compositions', f));
  fs.cpSync(ASSETS, path.join(out, 'assets'), { recursive: true });
  let at = 0;
  const hosts = order.map((s) => { fs.writeFileSync(path.join(out, 'compositions', `${s.sid}.html`), s.doc);
    const h = `      <div id="${s.sid}" data-composition-id="${s.sid}" data-composition-src="compositions/${s.sid}.html" data-start="${r2(at)}" data-duration="${s.dur}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`;
    at = r2(at + s.dur); return h; });
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="${sb.architecture.language}" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(sb.architecture.name)} — architecture video</title>
    <script src="${GSAP}"></script>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { margin:0; width:${W}px; height:${H}px; overflow:hidden; background:${NIGHT}; }
      #root { position:relative; width:100%; height:100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${at}" data-width="${W}" data-height="${H}">
${hosts.join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);
  fs.writeFileSync(path.join(out, 'hyperframes.json'), JSON.stringify({ paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' } }, null, 2) + '\n');
  return { out, total_s: at, scenes: order.map((s) => [s.sid, s.dur]), lines: { used: Object.keys(L).length, refused: chk.refused, absent: chk.absent, unknown: chk.unknown } };
}

module.exports = { build, checkLines, T };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const [sbPath, linesPath] = argv.filter((x, i) => !x.startsWith('--') && argv[i - 1] !== '--out');
  if (!sbPath || !linesPath || !opt('--out')) { console.error('usage: bun video-build.js <storyboard.json> <lines.json> --out <dir> [--json]'); process.exit(2); }
  try {
    const sb = JSON.parse(fs.readFileSync(sbPath, 'utf8'));
    const lines = fs.existsSync(linesPath) ? JSON.parse(fs.readFileSync(linesPath, 'utf8')) : {};
    const r = build(sb, lines, path.resolve(opt('--out')));
    if (argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(`video project: ${r.out} — ${r.scenes.length} scenes, ${r.total_s} s`);
      console.log(`  ${r.scenes.map(([s, d]) => `${s} ${d}s`).join(' · ')}`);
      console.log(`lines: ${r.lines.used} used`);
      r.lines.refused.forEach((x) => console.log(`  refused ${x.slot}: ${x.why} — its scene renders without it; fix it in lines.json and build again`));
      r.lines.absent.forEach((k) => console.log(`  absent ${k}`));
      r.lines.unknown.forEach((k) => console.log(`  unknown slot ${k} (ignored)`));
    }
    process.exit(r.lines.refused.length ? 1 : 0);
  } catch (e) { console.error(`video-build: ${e.message}`); process.exit(1); }
}
