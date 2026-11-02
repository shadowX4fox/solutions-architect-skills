// The architecture video: the storyboard cut from a synthetic architecture (Order Desk — every name invented), Alia's lines
// held to their slots, and the HyperFrames project the build writes.
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { FILES } from "../../architecture-command-center/tests/order-desk.fixture";

const { prepare, request } = require("../scripts/video-prepare.js");
const { build, checkLines } = require("../scripts/video-build.js");
const { compose, moodAt, SR, BAR } = require("../scripts/music.js");

const EXTRA: Record<string, string> = {
  "docs/01-system-overview.md": `# System Overview

### Problem Statement <!-- LABEL: Problem Statement -->

Orders are typed twice and a failed payment is found a day later.

### Solution <!-- LABEL: Solution -->

Order Desk stores each order once and hands payment to the Payments Hub.
`,
  "adr/ADR-101.md": "# ADR-101: Outbox for order events\n\n**Status**: Accepted\n",
  "adr/ADR-102.md": "# ADR-102: Payments delegated to the hub\n\n**Status**: Proposed\n",
  "tdr/TDR-001.md": "---\nstatus: Open\n---\n# TDR-001: Order DB has a single primary\n",
  "tdr/TDR-002.md": "---\nstatus: Resolved\n---\n# TDR-002: Old cache removed\n",
};
const LINES = {
  "title.tagline": "Orders stored once and paid through the Payments Hub.",
  "what.problem": "Orders are typed twice and a failed payment is found a day later.",
  "what.solution": "Order Desk stores each order once and hands payment to the Payments Hub.",
  "chapter.context": "Order Desk is ours. It talks to the Payments Hub and to Fraud Screen.",
  "chapter.layers": "Inside, the containers sit in five layers.",
  "chapter.flows": "Let me walk you through each use case, phase by phase.",
  "chapter.decisions": "One decision in force shapes it.",
  "chapter.risks": "One item of debt stays open, written down.",
  "flow.1.tip": "Payment moves to the hub.",
  "end.closing": "Now you know how Order Desk works.",
};

let root: string, sb: any;
const write = (base: string, files: Record<string, string>) => { for (const [k, v] of Object.entries(files)) { mkdirSync(dirname(join(base, k)), { recursive: true }); writeFileSync(join(base, k), v); } };

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "sa-video-"));
  write(root, FILES); write(root, EXTRA);
  sb = prepare(root);
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("video-prepare", () => {
  test("cuts a scene for each part the architecture documents, in order", () => {
    const ids = sb.scenes.map((s: any) => s.id);
    expect(ids[0]).toBe("title");
    expect(ids.at(-1)).toBe("end");
    expect(ids).toEqual(expect.arrayContaining(["what", "context", "layers", "flow-1", "decisions", "risks"]));
    expect(sb.architecture).toMatchObject({ name: "Order Desk", version: "1.2.0", language: "en" });
  });

  test("context: the owned system and the pairs that talk across a boundary, qualifiers dropped from the names", () => {
    const c = sb.scenes.find((s: any) => s.kind === "context");
    expect(c.owned.map((s: any) => s.name)).toEqual(["Order Desk"]);
    expect(c.links.map((l: any) => `${l.from}→${l.to}`).sort()).toEqual(["Order Desk→Fraud Screen", "Order Desk→Payments Hub"]);
  });

  test("a flow carries its phases in order with their names, and only flows whose phases resolve", () => {
    const f = sb.scenes.find((s: any) => s.id === "flow-1");
    expect(f.name).toBe("Place an order");
    expect(f.phases.map((p: any) => p.name)).toEqual(["Device check", "Submit order", "Authorize payment"]);
    expect(f.chapter).toBe("flows");
    expect(sb.scenes.some((s: any) => s.name === "Orphan")).toBe(false);
  });

  test("decisions are the ADRs in force only; debt leaves out what is resolved", () => {
    expect(sb.scenes.find((s: any) => s.kind === "decisions").adrs.map((d: any) => d.id)).toEqual(["ADR-101"]);
    const r = sb.scenes.find((s: any) => s.kind === "risks");
    expect(r.total).toBe(1);
    expect(r.tdrs[0].id).toBe("TDR-001");
  });

  test("the slots match the scenes, and the request names each with its limit and sources", () => {
    expect(Object.keys(sb.slots)).toEqual(expect.arrayContaining(["title.tagline", "what.problem", "chapter.context", "flow.1.tip", "end.closing"]));
    expect(sb.slots["flow.1.tip"].optional).toBe(true);
    const md = request(sb);
    expect(md).toContain("`chapter.layers` | 220");
    expect(md).toContain("Orders are typed twice");
  });

  test("a scene with no material is left out and named", () => {
    const bare = mkdtempSync(join(tmpdir(), "sa-video-bare-"));
    try {
      write(bare, FILES);
      const s = prepare(bare);
      expect(s.scenes.some((x: any) => x.kind === "decisions" || x.kind === "overview")).toBe(false);
      expect(s.missing.join("\n")).toMatch(/docs\/01 not found/);
      expect(s.missing.join("\n")).toMatch(/no ADR in status Accepted/);
    } finally { rmSync(bare, { recursive: true, force: true }); }
  });
});

describe("Alia's lines", () => {
  test("a line that breaks a rule is refused, named, and the rest are kept", () => {
    const r = checkLines(sb, { ...LINES, "chapter.layers": "Two\nlines", "chapter.flows": "**bold**", "end.closing": "x".repeat(200), "nope": "?" });
    expect(r.refused.map((x: any) => x.slot).sort()).toEqual(["chapter.flows", "chapter.layers", "end.closing"]);
    expect(r.refused.find((x: any) => x.slot === "end.closing").why).toMatch(/limit is 160/);
    expect(r.unknown).toEqual(["nope"]);
    expect(r.ok["title.tagline"]).toBe(LINES["title.tagline"]);
  });

  test("an absent slot is reported unless it is optional", () => {
    const { ["flow.1.tip"]: _, ["chapter.risks"]: __, ...rest } = LINES;
    const r = checkLines(sb, rest);
    expect(r.absent).toEqual(["chapter.risks"]);
  });
});

describe("video-build", () => {
  let out: string, res: any;
  beforeAll(() => { out = join(root, "visualizations", "architecture-video"); res = build(sb, LINES, out); });

  test("writes the root, one composition per scene and Alia's assets", () => {
    expect(existsSync(join(out, "index.html"))).toBe(true);
    const comps = readdirSync(join(out, "compositions"));
    expect(comps.length).toBe(res.scenes.length);
    expect(existsSync(join(out, "assets", "alia", "escudo.png"))).toBe(true);
    expect(existsSync(join(out, "assets", "alia", "faces", "face-talk-open.webp"))).toBe(true);
    const index = readFileSync(join(out, "index.html"), "utf8");
    expect(index).toContain(`data-duration="${res.total_s}"`);
    for (const [sid] of res.scenes) expect(index).toContain(`data-composition-src="compositions/${sid}.html"`);
  });

  test("every composition registers its paused timeline and nothing depends on wall time or chance", () => {
    for (const f of readdirSync(join(out, "compositions"))) {
      const doc = readFileSync(join(out, "compositions", f), "utf8");
      const sid = f.replace(/\.html$/, "");
      expect(doc).toContain(`window.__timelines["${sid}"] = tl`);
      expect(doc).toContain("gsap.timeline({ paused: true })");
      expect(doc).not.toMatch(/Math\.random|Date\.now|repeat:\s*-1|setTimeout|setInterval/);
    }
  });

  test("a chapter is Alia's talking codec at the video size; a worried call bobs instead", () => {
    const ch = readFileSync(join(out, "compositions", "ch-context.html"), "utf8");
    expect(ch).toContain("width:160px; height:160px");
    expect(ch).toContain("face-talk-open.webp");
    expect(ch).toContain(`data-full="${LINES["chapter.context"]}"`);
    const risks = readFileSync(join(out, "compositions", "ch-risks.html"), "utf8");
    expect(risks).not.toContain("face-talk-open.webp");
    expect(risks).toContain("face-warn.webp");
    expect(risks).toContain("yoyo:true");
  });

  test("the escudo appears once, on the title; the figures on screen are the storyboard's", () => {
    const all = readdirSync(join(out, "compositions")).map((f) => readFileSync(join(out, "compositions", f), "utf8")).join("\n");
    expect(all.match(/escudo\.png/g)!.length).toBe(1);
    const flow = readFileSync(join(out, "compositions", "flow-1.html"), "utf8");
    for (const p of ["Device check", "Submit order", "Authorize payment"]) expect(flow).toContain(p);
    expect(flow).toContain("assets/alia/alia-point-left.webp");
  });

  test("a refused chapter line drops its card, never the scene it opens; Spanish chrome under DOC_LANGUAGE es", () => {
    const o2 = join(root, "v2");
    const r = build({ ...sb, architecture: { ...sb.architecture, language: "es" } }, { ...LINES, "chapter.layers": "x".repeat(300) }, o2);
    const ids = r.scenes.map(([s]: [string]) => s);
    expect(ids).not.toContain("ch-layers");
    expect(ids).toContain("layers");
    expect(r.lines.refused.map((x: any) => x.slot)).toEqual(["chapter.layers"]);
    expect(readFileSync(join(o2, "compositions", "layers.html"), "utf8")).toContain("Cómo se organiza");
  });
});

describe("Alia's music", () => {
  const plan = [{ at: 0, mood: "intro" }, { at: 8, mood: "thinking" }, { at: 16, mood: "worried" }];

  test("the bed is stereo, the video's length, quiet at both ends, peaking under -1 dBFS, and the same bytes every time", () => {
    const a = compose(24, plan), b = compose(24, plan);
    expect(a.length).toBe(2 * Math.ceil(24 * SR));
    expect(Buffer.from(a.buffer).equals(Buffer.from(b.buffer))).toBe(true);
    let peak = 0; for (const x of a) peak = Math.max(peak, Math.abs(x));
    expect(peak).toBeLessThanOrEqual(Math.round(0.89 * 32767));
    expect(peak).toBeGreaterThan(20000);
    expect(a[0]).toBe(0);
    expect(Math.abs(a[a.length - 1])).toBeLessThan(50);
    let diff = 0; for (let i = 0; i < a.length; i += 2) diff += Math.abs(a[i] - a[i + 1]);
    expect(diff).toBeGreaterThan(0);
  });

  test("it follows her mood: a scene's mood takes the bar line nearest its start; another plan, another bed", () => {
    expect(moodAt(plan, 0)).toBe("intro");
    expect(moodAt(plan, 8 - BAR / 3)).toBe("thinking");
    expect(moodAt(plan, 8 - BAR)).toBe("intro");
    expect(moodAt([{ at: 0, mood: "unknown" }], 0)).toBe("calm");
    const calm = compose(24, [{ at: 0, mood: "calm" }]);
    expect(Buffer.from(calm.buffer).equals(Buffer.from(compose(24, plan).buffer))).toBe(false);
  });

  test("the build places it under the whole video with the scenes' moods at the gain asked; --no-music leaves it silent", () => {
    const o = join(root, "v-music");
    const r = build(sb, LINES, o, { volume: 0.2 });
    const index = readFileSync(join(o, "index.html"), "utf8");
    expect(index).toContain(`<audio id="music" class="clip" src="assets/music/bed.wav" data-start="0" data-duration="${r.total_s}" data-track-index="2" data-volume="0.2">`);
    expect(r.music.moods[0]).toEqual({ at: 0, mood: "intro" });
    expect(r.music.moods.at(-1).mood).toBe("outro");
    expect(r.music.moods.find((m: any) => m.mood === "worried")).toBeTruthy();
    const wav = readFileSync(join(o, "assets", "music", "bed.wav"));
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.readUInt16LE(22)).toBe(2);
    expect(wav.readUInt32LE(40) / 4).toBe(Math.ceil(r.total_s * SR));
    const q = build(sb, LINES, o, { music: false });
    expect(q.music).toBeNull();
    expect(readFileSync(join(o, "index.html"), "utf8")).not.toContain("<audio");
    expect(existsSync(join(o, "assets", "music", "bed.wav"))).toBe(false);
  });
});
