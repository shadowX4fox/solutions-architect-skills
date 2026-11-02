#!/usr/bin/env bun
'use strict';
// Alia's music: a quiet neon-night bed under the video, composed here by code — original, so the plugin ships no
// third-party track and no licence — and cut to the video's exact length. Her look in sound: a warm detuned pad under a
// slow filter, a soft pulse arpeggio with a ping-pong echo (the neon), a round bass, light drums with a gentle pump, rain
// behind it all, and her ringed sparkle — a glassy shimmer — when she arrives and when she says goodbye. 84 bpm, in A
// minor's night. It follows her moods scene by scene, changing on a bar line: calm and thinking move, pleased lifts,
// worried and stern darken and drop the drums. Nothing in it leads: it waits with the viewer and never competes with
// the screen. Deterministic: the same length and moods give the same bytes (seeded generators, no clock).
//
//   bun music.js <out.wav> <seconds> [<mood>@<at>,…]
const fs = require('fs');

const SR = 32000, BPM = 84, BEAT = 60 / BPM, BAR = 4 * BEAT, STEP = BEAT / 4;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const N = (s) => { const m = /^([A-G])(b|#)?(-?\d)$/.exec(s); return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0); };
const chord = (root, ...v) => ({ root: N(root), voicing: v.map(N) });

// each mood: its four bars of chords, the drums it keeps (0 none, 1 kick and hats, 2 the full kit), the arpeggio, the pad's light
const MOODS = {
  intro:    { drums: 0, arp: 1, bright: 0.45, prog: [chord('A1', 'G3', 'B3', 'C4', 'E4'), chord('F1', 'A3', 'C4', 'E4', 'G4'), chord('C2', 'G3', 'B3', 'E4'), chord('G1', 'B3', 'D4', 'E4')] },
  calm:     { drums: 1, arp: 1, bright: 0.55, prog: [chord('A1', 'G3', 'B3', 'C4', 'E4'), chord('F1', 'A3', 'C4', 'E4', 'G4'), chord('C2', 'G3', 'B3', 'E4'), chord('G1', 'B3', 'D4', 'E4')] },
  thinking: { drums: 2, arp: 1, bright: 0.6,  prog: [chord('D2', 'F3', 'A3', 'C4', 'E4'), chord('A1', 'G3', 'B3', 'C4', 'E4'), chord('Bb1', 'A3', 'D4', 'F4'), chord('C2', 'G3', 'A3', 'E4')] },
  pleased:  { drums: 2, arp: 1, bright: 0.8,  prog: [chord('F1', 'A3', 'C4', 'E4', 'G4'), chord('G1', 'B3', 'D4', 'E4'), chord('E2', 'G3', 'B3', 'D4'), chord('A1', 'G3', 'B3', 'C4', 'E4')] },
  worried:  { drums: 1, arp: 0, bright: 0.35, prog: [chord('D2', 'F3', 'A3', 'C4', 'E4'), chord('Bb1', 'A3', 'D4', 'E4'), chord('G1', 'Bb3', 'D4', 'F4', 'A4'), chord('A1', 'G3', 'D4', 'E4')] },
  stern:    { drums: 0, arp: 0, bright: 0.25, prog: [chord('D2', 'F3', 'A3', 'C4'), chord('Bb1', 'F3', 'A3', 'D4'), chord('G1', 'F3', 'Bb3', 'D4'), chord('A1', 'E3', 'G3', 'C#4')] },
  outro:    { drums: 1, arp: 1, bright: 0.7,  prog: [chord('F1', 'A3', 'C4', 'E4', 'G4'), chord('G1', 'B3', 'D4', 'E4'), chord('A1', 'G3', 'B3', 'C4', 'E4'), chord('A1', 'G3', 'B3', 'C4', 'E4')] },
};
const HOME = chord('F1', 'F3', 'A3', 'C4', 'E4', 'G4');                     // the last chord, held: Fmaj9

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const blep = (t, dt) => t < dt ? (t /= dt, t + t - t * t - 1) : t > 1 - dt ? (t = (t - 1) / dt, t * t + t + t + 1) : 0;

// a stereo bus: two channels and a send to the room
const bus = (len) => ({ L: new Float32Array(len), R: new Float32Array(len) });
const put = (b, i, v, pan) => { if (i >= 0 && i < b.L.length) { b.L[i] += v * Math.cos((pan + 1) * Math.PI / 4); b.R[i] += v * Math.sin((pan + 1) * Math.PI / 4); } };

// voices
function pad(b, at, note, len, vel) {             // three detuned band-limited saws, spread across the stereo field
  const i0 = Math.floor(at * SR), n = Math.floor((len + 0.9) * SR);
  [[-0.08, -0.6], [0, 0], [0.08, 0.6]].forEach(([cents, pan], k) => {
    const f = midi(note + cents), dt = f / SR; let ph = (k * 0.31 + note * 0.07) % 1;
    for (let i = 0; i < n; i++) {
      const t = i / SR, env = Math.min(1, t / 0.45) * (t > len ? Math.exp(-(t - len) / 0.35) : 1);
      put(b, i0 + i, vel / 3 * env * (2 * ph - 1 - blep(ph, dt)), pan);
      ph += dt; if (ph >= 1) ph -= 1;
    }
  });
}
function pluck(b, at, note, vel, pan) {           // the arpeggio: a soft pulse, closing fast
  const f = midi(note), dt = f / SR, i0 = Math.floor(at * SR), n = Math.floor(0.3 * SR); let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, sq = (ph < 0.5 ? 1 : -1) + blep(ph, dt) - blep((ph + 0.5) % 1, dt);
    lp += (0.08 + 0.5 * Math.exp(-t / 0.03)) * (sq - lp);
    put(b, i0 + i, vel * Math.min(1, t / 0.003) * Math.exp(-t / 0.09) * lp, pan);
    ph += dt; if (ph >= 1) ph -= 1;
  }
}
function bass(b, at, note, len, vel) {
  const f = midi(note), i0 = Math.floor(at * SR), n = Math.floor((len + 0.08) * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.006) * Math.exp(-t / 0.5) * (t > len ? Math.exp(-(t - len) / 0.03) : 1);
    put(b, i0 + i, vel * env * Math.tanh(1.6 * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t))) / 1.2, 0);
  }
}
function kick(b, at, vel) {
  const i0 = Math.floor(at * SR), n = Math.floor(0.35 * SR); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (45 + 70 * Math.exp(-t / 0.035)) / SR; put(b, i0 + i, vel * Math.exp(-t / 0.2) * Math.sin(2 * Math.PI * ph), 0); }
}
function snare(b, at, vel, rnd) {
  const i0 = Math.floor(at * SR), n = Math.floor(0.3 * SR); let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, w = rnd() * 2 - 1; lp += 0.35 * (w - lp);
    put(b, i0 + i, vel * (0.8 * Math.exp(-t / 0.11) * (w - lp) + 0.4 * Math.exp(-t / 0.05) * Math.sin(2 * Math.PI * 185 * t)), 0.1);
  }
}
function hat(b, at, vel, rnd, pan) {
  const i0 = Math.floor(at * SR), n = Math.floor(0.06 * SR); let prev = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, w = rnd() * 2 - 1; put(b, i0 + i, vel * Math.exp(-t / 0.018) * (w - prev), pan); prev = w; }
}
function sparkle(b, at, vel, rnd) {               // her ringed sparkle: glassy bells climbing, scattered left and right
  [N('E6'), N('A6'), N('B6'), N('E7')].forEach((note, k) => {
    const f = midi(note), i0 = Math.floor((at + k * 0.09) * SR), n = Math.floor(2.2 * SR), pan = (rnd() * 2 - 1) * 0.7;
    for (let i = 0; i < n; i++) {
      const t = i / SR, idx = 2 * Math.exp(-t / 0.25);
      put(b, i0 + i, vel * Math.min(1, t / 0.002) * Math.exp(-t / 0.7) * Math.sin(2 * Math.PI * f * t + idx * Math.sin(2 * Math.PI * 3.5 * f * t)), pan);
    }
  });
}
function rain(b, from, to, vel, rnd) {            // a soft hiss of rain and the odd drop, uncorrelated left and right
  let lL = 0, hL = 0, lR = 0, hR = 0;
  for (let i = Math.floor(from * SR); i < Math.min(b.L.length, to * SR); i++) {
    const a = rnd() * 2 - 1, c = rnd() * 2 - 1;
    lL += 0.4 * (a - lL); hL += 0.08 * (lL - hL); lR += 0.4 * (c - lR); hR += 0.08 * (lR - hR);
    b.L[i] += vel * (lL - hL); b.R[i] += vel * (lR - hR);
    if (rnd() < 2.2 / SR) {
      const f = 1800 + rnd() * 2400, pan = rnd() * 2 - 1, n = Math.floor(0.03 * SR);
      for (let k = 0; k < n; k++) put(b, i + k, vel * 0.6 * Math.exp(-k / SR / 0.008) * Math.sin(2 * Math.PI * f * k / SR * (1 - k / n / 3)), pan);
    }
  }
}

// a low-pass whose cutoff moves (RBJ biquad, coefficients every 32 samples)
function lowpass(x, cutoff) {
  let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    if (i % 32 === 0) {
      const w = 2 * Math.PI * Math.min(cutoff(i / SR), SR * 0.45) / SR, al = Math.sin(w) / (2 * 0.8), c = Math.cos(w), a0 = 1 + al;
      b0 = (1 - c) / 2 / a0; b1 = (1 - c) / a0; b2 = b0; a1 = -2 * c / a0; a2 = (1 - al) / a0;
    }
    const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
  }
}
// the night's room: damped combs into all-passes, a little different on each side
function room(x, spread) {
  const out = new Float32Array(x.length), s = SR / 44100;
  for (const [d, g] of [[1116, 0.84], [1188, 0.83], [1277, 0.82], [1356, 0.81]]) {
    const L = Math.round((d + spread) * s), line = new Float32Array(L); let k = 0, lp = 0;
    for (let i = 0; i < x.length; i++) { const y = line[k]; lp = 0.55 * y + 0.45 * lp; line[k] = x[i] + g * lp; out[i] += y / 4; k = (k + 1) % L; }
  }
  for (const d of [556, 441]) {
    const L = Math.round((d + spread / 2) * s), line = new Float32Array(L); let k = 0;
    for (let i = 0; i < out.length; i++) { const b = line[k], y = -out[i] + b; line[k] = out[i] + 0.5 * b; out[i] = y; k = (k + 1) % L; }
  }
  return out;
}
function pingpong(b, time, fb) {                  // the arpeggio's echo, crossing sides
  const D = Math.round(time * SR), dl = new Float32Array(D), dr = new Float32Array(D); let k = 0;
  for (let i = 0; i < b.L.length; i++) {
    const yl = dl[k], yr = dr[k]; dl[k] = b.L[i] * 0.5 + b.R[i] * 0.5 + fb * yr; dr[k] = fb * yl;
    b.L[i] += 0.5 * yl; b.R[i] += 0.5 * yr; k = (k + 1) % D;
  }
}

/** The mood plan → the mood of the bar starting at t0: a scene's mood takes the bar line nearest its start. */
const moodAt = (plan, t) => { let m = plan[0].mood; for (const p of plan) if (p.at <= t + BAR / 2) m = p.mood; return MOODS[m] ? m : 'calm'; };

/** The bed as 16-bit interleaved stereo PCM, `seconds` long, following `plan` ([{ at, mood }], scene starts in seconds). */
function compose(seconds, plan = [{ at: 0, mood: 'calm' }]) {
  const total = Math.max(4, seconds), len = Math.ceil(total * SR);
  const rDrum = rng(0xa11a), rArp = rng(0x0e0e), rRain = rng(0x4a1a);
  const pads = bus(len), arp = bus(len), low = bus(len), drums = bus(len), air = bus(len), send = bus(len);
  const last = Math.max(1, Math.floor((total - 3) / BAR));
  const bright = new Float32Array(last + 2), pump = new Float32Array(last + 2);
  let mood = null, step = 0;
  for (let b = 0; b < last; b++) {
    const t0 = b * BAR, m = moodAt(plan, t0);
    if (m !== mood) { mood = m; step = 0; }
    const M = MOODS[m], c = M.prog[step++ % M.prog.length];
    bright[b] = M.bright; pump[b] = M.drums ? 1 : 0;
    c.voicing.forEach((n) => pad(pads, t0, n, BAR, 0.11));
    if (M.drums === 2) for (let e = 0; e < 8; e++) bass(low, t0 + e * BEAT / 2, c.root + (e === 7 ? 12 : 0) + 12, BEAT / 2 * 0.7, e % 2 ? 0.14 : 0.18);
    else { bass(low, t0, c.root + 12, 1.5 * BEAT, 0.17); bass(low, t0 + 2 * BEAT, c.root + 12, 1.5 * BEAT, 0.13); }
    if (M.arp) {
      const tones = [...c.voicing, c.voicing[0] + 12, c.voicing[1] + 12], order = [0, 1, 2, 3, 4, 3, 2, 1];
      for (let s = 0; s < 16; s++) if (s % 2 === 0 || rArp() < 0.55) pluck(arp, t0 + s * STEP, tones[order[s % order.length] % tones.length] + 12, s % 4 === 0 ? 0.07 : 0.045, s % 2 ? 0.35 : -0.35);
    }
    if (M.drums) {
      for (let q = 0; q < 4; q++) if (q % 2 === 0 || M.drums === 2) kick(drums, t0 + q * BEAT, q % 2 ? 0.22 : 0.3);
      for (let e = 0; e < 8; e++) hat(drums, t0 + e * BEAT / 2, e % 2 ? 0.05 : 0.025, rDrum, 0.3);
      if (M.drums === 2) for (const q of [1, 3]) snare(drums, t0 + q * BEAT, 0.11, rDrum);
      if (M.drums === 2) for (const q of [1, 3]) snare(send, t0 + q * BEAT, 0.08, rDrum);
    }
  }
  const end = last * BAR, hold = Math.max(0.5, total - end - 0.4);
  HOME.voicing.forEach((n) => pad(pads, end, n, hold, 0.11));
  bass(low, end, HOME.root + 12, hold, 0.15);
  bright[last] = bright[last + 1] = 0.6;
  sparkle(air, 0.6, 0.05, rArp);
  sparkle(air, end + 0.2, 0.045, rArp);
  rain(air, 0, total, 0.018, rRain);

  // the pad: a slow filter breathing with the mood's light, pumped by the kick when the drums play
  const light = (t) => { const b = Math.min(last + 1, Math.floor(t / BAR)), f = (t % BAR) / BAR, from = bright[Math.max(0, b - 1)], to = bright[b]; return from + (to - from) * Math.min(1, f * 4); };
  for (const x of [pads.L, pads.R]) lowpass(x, (t) => 500 + 1700 * light(t) + 250 * Math.sin(2 * Math.PI * t / 11));
  for (let i = 0; i < len; i++) {
    const t = i / SR, b = Math.min(last + 1, Math.floor(t / BAR)), g = pump[b] ? 1 - 0.3 * Math.exp(-((t % BEAT) / 0.09)) : 1;
    pads.L[i] *= g; pads.R[i] *= g;
  }
  pingpong(arp, 0.75 * BEAT, 0.4);
  for (let i = 0; i < len; i++) {
    send.L[i] += 0.35 * pads.L[i] + 0.6 * arp.L[i] + 0.5 * air.L[i]; send.R[i] += 0.35 * pads.R[i] + 0.6 * arp.R[i] + 0.5 * air.R[i];
  }
  const wl = room(send.L, 0), wr = room(send.R, 23);
  const pcm = new Int16Array(len * 2), mixL = new Float32Array(len), mixR = new Float32Array(len); let peak = 1e-9;
  for (let i = 0; i < len; i++) {
    mixL[i] = pads.L[i] + arp.L[i] + low.L[i] + drums.L[i] + air.L[i] + 0.45 * wl[i];
    mixR[i] = pads.R[i] + arp.R[i] + low.R[i] + drums.R[i] + air.R[i] + 0.45 * wr[i];
    peak = Math.max(peak, Math.abs(mixL[i]), Math.abs(mixR[i]));
  }
  const fin = 2 * SR, fout = Math.min(4, total / 3) * SR, g = 0.89 / peak;   // peak at -1 dBFS
  for (let i = 0; i < len; i++) {
    const f = Math.min(1, i / fin, (len - i) / fout);
    pcm[2 * i] = Math.round(Math.max(-1, Math.min(1, mixL[i] * g * f)) * 32767);
    pcm[2 * i + 1] = Math.round(Math.max(-1, Math.min(1, mixR[i] * g * f)) * 32767);
  }
  return pcm;
}

function wav(pcm, channels = 2) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length * 2, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2 * channels, 28);
  h.writeUInt16LE(2 * channels, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length * 2, 40);
  return Buffer.concat([h, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength)]);
}

/** Writes the bed for a video `seconds` long, following the scenes' moods, to `file`. */
function writeBed(file, seconds, plan) { const b = wav(compose(seconds, plan)); fs.writeFileSync(file, b); return { file, seconds, bytes: b.length, sample_rate: SR, channels: 2 }; }

module.exports = { compose, wav, writeBed, moodAt, MOODS, SR, BPM, BAR };

if (require.main === module) {
  const [file, s, p] = process.argv.slice(2);
  if (!file || !(+s > 0)) { console.error('usage: bun music.js <out.wav> <seconds> [<mood>@<at>,…]'); process.exit(2); }
  const plan = p ? p.split(',').map((x) => { const [mood, at] = x.split('@'); return { mood, at: +at || 0 }; }) : undefined;
  console.log(JSON.stringify(writeBed(file, +s, plan)));
}
