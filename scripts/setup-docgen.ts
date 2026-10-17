#!/usr/bin/env bun
/**
 * setup-docgen.ts — report the export toolchain and say exactly what is missing.
 *
 *   bun scripts/setup-docgen.ts [--json] [--strict] [--no-smoke]
 *
 * Four pieces back `tools/docgen/generate-doc.js`, and they fail differently:
 *
 *   docx      required   no Word output at all without it
 *   pdfmake   optional   --format pdf only; the Word path is unaffected
 *   mmdc      optional   every Mermaid diagram exports as monospace source instead of a picture
 *   a browser optional   mmdc drives Puppeteer; Bun skips Puppeteer's own browser download
 *
 * The last two are one chain, and a presence check on `mmdc` alone is not evidence the chain
 * works — the binary resolves, the browser is missing, and the failure shows up in the first
 * export instead of here. So this renders a real two-node diagram (`--no-smoke` opts out) and
 * reports what actually happened. Binary resolution is `render-mermaid.js`'s own `resolveMmdc`,
 * never a second copy of the rule.
 *
 * Exit code is 0 unless `--strict` (for CI) or `docx` is missing, because a missing optional
 * piece is a degraded export, not a broken install.
 */

import { existsSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DOCGEN = join(ROOT, "tools", "docgen");

type Check = {
  id: string;
  label: string;
  required: boolean;
  ok: boolean;
  detail: string;
  /** What the user runs to fix it. Absent when nothing is wrong. */
  fix?: string;
  /** What breaks while it is missing. */
  cost?: string;
};

/** A package counts when `bun install` put it under tools/docgen/node_modules at the version tools/docgen/package.json
 *  pins (scripts/shared/pinned.js — the check docgen itself loads it through); Bun's auto-install takes the latest major. */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pinState } = require(join(ROOT, "scripts", "shared", "pinned.js"));
function resolves(pkg: string): { ok: boolean; detail: string } {
  const s = pinState(DOCGEN, pkg);
  return { ok: s.ok, detail: s.ok ? `installed ${s.version}` : s.reason };
}

/** Where `bun install` would have put the shim, for a message that names a path the user can check. */
function shimHint(): string {
  const candidates = [join(DOCGEN, "node_modules", ".bin"), join(ROOT, "node_modules", ".bin")];
  const found = candidates.find((d) => existsSync(d));
  return found ? found : join(ROOT, "node_modules", ".bin");
}

async function smokeRender(binary: string): Promise<{ ok: boolean; detail: string }> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { renderMermaidBlocks } = require(join(DOCGEN, "render-mermaid.js"));
  const dir = mkdtempSync(join(tmpdir(), "sa-docgen-smoke-"));
  const blocks = [{ type: "code", lang: "mermaid", text: "flowchart TB\n  A[Setup] --> B[Check]\n" }];
  try {
    const r = await renderMermaidBlocks(blocks, { cacheDir: dir, mode: "auto" });
    if (r.status === "rendered" && r.rendered === 1) {
      const img = blocks[0] as unknown as { pixelWidth?: number; pixelHeight?: number };
      return { ok: true, detail: `rendered a ${img.pixelWidth}×${img.pixelHeight} PNG` };
    }
    if (r.failures?.length) return { ok: false, detail: String(r.failures[0].message).split("\n")[0] };
    return { ok: false, detail: `mmdc reported status ${r.status}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message.split("\n")[0] };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function run(opts: { smoke: boolean }): Promise<Check[]> {
  const checks: Check[] = [];

  const docx = resolves("docx");
  checks.push({
    id: "docx", label: "docx (Word output)", required: true, ok: docx.ok,
    detail: docx.detail,
    fix: docx.ok ? undefined : "bun install    (from the repository root)",
    cost: docx.ok ? undefined : "no .docx export at all",
  });

  const pdfmake = resolves("pdfmake");
  checks.push({
    id: "pdfmake", label: "pdfmake (PDF output)", required: false, ok: pdfmake.ok,
    detail: pdfmake.detail,
    fix: pdfmake.ok ? undefined : "bun install    (from the repository root)",
    cost: pdfmake.ok ? undefined : "--format pdf fails; the PO Spec distribution PDF is skipped with a warning",
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { resolveMmdc } = require(join(DOCGEN, "render-mermaid.js"));
  const bin: string | null = resolveMmdc();
  checks.push({
    id: "mmdc", label: "mermaid-cli (diagrams as pictures)", required: false, ok: Boolean(bin),
    detail: bin ? bin : `no mmdc in ${shimHint()}, on PATH, or at MMDC_PATH`,
    fix: bin ? undefined : "bun install    (from the repository root — it is an optionalDependency of tools/docgen)",
    cost: bin ? undefined : "every Mermaid diagram exports as monospace source instead of a picture",
  });

  if (bin && opts.smoke) {
    const s = await smokeRender(bin);
    checks.push({
      id: "browser", label: "browser for Puppeteer (end-to-end render)", required: false, ok: s.ok,
      detail: s.detail,
      fix: s.ok ? undefined
        : 'PUPPETEER_EXECUTABLE_PATH="<path to chrome>"    (or: bunx puppeteer browsers install chrome)',
      cost: s.ok ? undefined : "mmdc is installed but cannot render — diagrams still export as source",
    });
  } else if (bin) {
    checks.push({
      id: "browser", label: "browser for Puppeteer (end-to-end render)", required: false, ok: true,
      detail: "not checked (--no-smoke)",
    });
  }

  return checks;
}

const args = process.argv.slice(2);
const checks = await run({ smoke: !args.includes("--no-smoke") });

if (args.includes("--json")) {
  console.log(JSON.stringify({ checks }, null, 1));
} else {
  console.log("Export toolchain (tools/docgen):\n");
  for (const c of checks) {
    console.log(`  ${c.ok ? "✓" : c.required ? "❌" : "⬜"} ${c.label} — ${c.detail}`);
  }
  const broken = checks.filter((c) => !c.ok);
  if (broken.length) {
    console.log("");
    for (const c of broken) {
      console.log(`  ${c.label}`);
      if (c.cost) console.log(`    Without it: ${c.cost}`);
      if (c.fix) console.log(`    Fix:        ${c.fix}`);
    }
  } else {
    console.log("\n  Every diagram in an export renders as a picture.");
  }
}

const failed = checks.some((c) => !c.ok && (c.required || args.includes("--strict")));
process.exit(failed ? 1 : 0);
