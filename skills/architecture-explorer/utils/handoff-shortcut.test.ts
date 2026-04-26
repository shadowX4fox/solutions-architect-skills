/**
 * Unit tests for handoff-shortcut.ts.
 *
 * Round-trip safeguard: every successful synthesis is fed through
 * parseExploreResult() to confirm the produced YAML is byte-shape-compatible
 * with what the orchestrator already validates today.
 */
import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { synthesizeHandoffShortcut } from "./handoff-shortcut";
import { extractExploreResultBlock, parseExploreResult } from "./parse-explore-result";

const TEMP_DIR = join(__dirname, ".temp-shortcut-test");

beforeEach(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true });
  mkdirSync(TEMP_DIR, { recursive: true });
});

afterAll(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true });
});

const HANDOFF_CONFIG_BODY = JSON.stringify({
  task_type: "handoff-component",
  task_family: "handoff",
  required_sections: [
    { file: "ARCHITECTURE.md" },
    { file: "docs/01-system-overview.md" },
    { file: "docs/04-data-flow-patterns.md" },
    { file: "docs/components/README.md" },
  ],
  candidate_files: ["ARCHITECTURE.md", "docs/*.md", "docs/components/**/*.md", "adr/*.md"],
  relevance_keywords: { boost: [], negative: [] },
  gap_markers: [],
  score_threshold: 0.2,
});

function setupProject(args: {
  componentHeader: string;
  componentBody?: string;
  adrFiles?: string[];
  includeRequiredDocs?: boolean;
}): {
  projectRoot: string;
  componentFile: string;
  configPath: string;
} {
  const projectRoot = TEMP_DIR;
  // Required docs (so they show up in relevant_files via existsSync filter)
  if (args.includeRequiredDocs ?? true) {
    writeFileSync(join(projectRoot, "ARCHITECTURE.md"), "# Arch\n", "utf-8");
    mkdirSync(join(projectRoot, "docs"), { recursive: true });
    mkdirSync(join(projectRoot, "docs/components"), { recursive: true });
    writeFileSync(join(projectRoot, "docs/01-system-overview.md"), "# Sys\n", "utf-8");
    writeFileSync(join(projectRoot, "docs/04-data-flow-patterns.md"), "# Flow\n", "utf-8");
    writeFileSync(join(projectRoot, "docs/components/README.md"), "# Index\n", "utf-8");
  }
  // Component file with header
  mkdirSync(join(projectRoot, "docs/components"), { recursive: true });
  const componentFile = join(projectRoot, "docs/components/03-payment-service.md");
  writeFileSync(
    componentFile,
    `# Payment Service\n\n${args.componentHeader}\n\n${args.componentBody ?? "body"}\n`,
    "utf-8",
  );
  // ADR files
  if (args.adrFiles && args.adrFiles.length > 0) {
    mkdirSync(join(projectRoot, "adr"), { recursive: true });
    for (const name of args.adrFiles) {
      writeFileSync(join(projectRoot, "adr", name), `# ${name}\n`, "utf-8");
    }
  }
  // Config
  const configPath = join(projectRoot, "handoff-component.json");
  writeFileSync(configPath, HANDOFF_CONFIG_BODY, "utf-8");
  return { projectRoot, componentFile, configPath };
}

function validHeader(adrs: string[]): string {
  return [
    "<!-- EXPLORER_HEADER",
    "key_concepts: payments, settlement, idempotency",
    "technologies: Java, PostgreSQL",
    "component_self: payment-service",
    "component_type: api-service",
    "scope: Routes payments and persists settlement state.",
    `related_adrs: ${adrs.join(", ")}`,
    "-->",
  ].join("\n");
}

describe("synthesizeHandoffShortcut", () => {
  test("returns OK when header has resolvable ADRs and required docs exist", () => {
    const { projectRoot, componentFile, configPath } = setupProject({
      componentHeader: validHeader(["ADR-003", "ADR-118"]),
      adrFiles: ["ADR-003-postgres-pin.md", "ADR-118-payment-routing.md"],
    });
    const out = synthesizeHandoffShortcut({
      componentFile,
      configPath,
      projectRoot,
      taskType: "handoff-component",
      inputsHash: "sha256:abc123",
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.resolvedAdrs).toContain("adr/ADR-003-postgres-pin.md");
      expect(out.resolvedAdrs).toContain("adr/ADR-118-payment-routing.md");
    }
  });

  test("synthesized YAML round-trips through parseExploreResult", () => {
    const { projectRoot, componentFile, configPath } = setupProject({
      componentHeader: validHeader(["ADR-003"]),
      adrFiles: ["ADR-003-postgres-pin.md"],
    });
    const out = synthesizeHandoffShortcut({
      componentFile,
      configPath,
      projectRoot,
      taskType: "handoff-component",
      inputsHash: "sha256:def456",
    });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    // Wrap in the same block markers the agent uses
    const wrapped = `EXPLORE_RESULT:\n\`\`\`yaml\n${out.resultYaml}\`\`\`\n`;
    const block = extractExploreResultBlock(wrapped);
    expect(block).not.toBeNull();
    const parsed = parseExploreResult(wrapped, configPath);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.result.status).toBe("OK");
      expect(parsed.result.task_family).toBe("handoff");
      expect(parsed.result.task_type).toBe("handoff-component");
      // Required docs MUST appear in relevant_files (false-negative safeguard)
      const paths = parsed.result.relevant_files.map((f) => f.path);
      expect(paths).toContain("ARCHITECTURE.md");
      expect(paths).toContain("docs/01-system-overview.md");
      expect(paths).toContain("docs/04-data-flow-patterns.md");
      expect(paths).toContain("docs/components/README.md");
      // The resolved ADR appears
      expect(paths).toContain("adr/ADR-003-postgres-pin.md");
      // The component file appears
      expect(paths).toContain("docs/components/03-payment-service.md");
      // No irrelevant_files in the shortcut path
      expect(parsed.result.irrelevant_files).toHaveLength(0);
    }
  });

  test("rejects when component file lacks EXPLORER_HEADER", () => {
    const { projectRoot, componentFile, configPath } = setupProject({
      componentHeader: "<!-- some other comment -->",
    });
    const out = synthesizeHandoffShortcut({
      componentFile,
      configPath,
      projectRoot,
      taskType: "handoff-component",
      inputsHash: "sha256:zzz",
    });
    expect(out.ok).toBe(false);
  });

  test("rejects when EXPLORER_HEADER has empty related_adrs", () => {
    const header = [
      "<!-- EXPLORER_HEADER",
      "key_concepts: x",
      "technologies: y",
      "component_self: z",
      "component_type: api-service",
      "scope: scope",
      "-->",
    ].join("\n");
    const { projectRoot, componentFile, configPath } = setupProject({
      componentHeader: header,
    });
    const out = synthesizeHandoffShortcut({
      componentFile,
      configPath,
      projectRoot,
      taskType: "handoff-component",
      inputsHash: "sha256:zzz",
    });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.reason).toContain("related_adrs");
    }
  });

  test("rejects when component file does not exist", () => {
    const { projectRoot, configPath } = setupProject({
      componentHeader: validHeader(["ADR-003"]),
      adrFiles: ["ADR-003-postgres-pin.md"],
    });
    const out = synthesizeHandoffShortcut({
      componentFile: join(projectRoot, "docs/components/does-not-exist.md"),
      configPath,
      projectRoot,
      taskType: "handoff-component",
      inputsHash: "sha256:zzz",
    });
    expect(out.ok).toBe(false);
  });

  test("unresolved ADR ids appear in shortcut_unresolved_adrs but do not fail", () => {
    const { projectRoot, componentFile, configPath } = setupProject({
      componentHeader: validHeader(["ADR-003", "ADR-999"]),
      adrFiles: ["ADR-003-postgres-pin.md"], // ADR-999 missing
    });
    const out = synthesizeHandoffShortcut({
      componentFile,
      configPath,
      projectRoot,
      taskType: "handoff-component",
      inputsHash: "sha256:abc",
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.adrsRequested).toEqual(["ADR-003", "ADR-999"]);
      expect(out.resolvedAdrs).toEqual(["adr/ADR-003-postgres-pin.md"]);
      expect(out.resultYaml).toContain("shortcut_unresolved_adrs: [ADR-999]");
    }
  });
});

describe("handoff-shortcut CLI integration smoke", () => {
  test("CLI handoff-shortcut subcommand exits 0 with valid header + ADRs", async () => {
    const { projectRoot, componentFile, configPath } = setupProject({
      componentHeader: validHeader(["ADR-003"]),
      adrFiles: ["ADR-003-postgres-pin.md"],
    });
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        join(__dirname, "explore-cli.ts"),
        "handoff-shortcut",
        componentFile,
        configPath,
        projectRoot,
        "sha256:cli-test",
      ],
    });
    expect(proc.exitCode).toBe(0);
    expect(proc.stdout.toString()).toContain("status: OK");
    expect(proc.stdout.toString()).toContain("shortcut: header");
  });

  test("CLI handoff-shortcut exits 1 when header missing", async () => {
    const { projectRoot, componentFile, configPath } = setupProject({
      componentHeader: "no header here",
    });
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        join(__dirname, "explore-cli.ts"),
        "handoff-shortcut",
        componentFile,
        configPath,
        projectRoot,
        "sha256:cli-test",
      ],
    });
    expect(proc.exitCode).toBe(1);
    expect(proc.stderr.toString()).toContain("shortcut unavailable");
  });

  test("CLI read-component-header prints JSON with related_adrs", async () => {
    const { projectRoot, componentFile } = setupProject({
      componentHeader: validHeader(["ADR-003", "ADR-118"]),
    });
    void projectRoot;
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        join(__dirname, "explore-cli.ts"),
        "read-component-header",
        componentFile,
      ],
    });
    expect(proc.exitCode).toBe(0);
    const json = JSON.parse(proc.stdout.toString());
    expect(json.related_adrs).toEqual(["ADR-003", "ADR-118"]);
    expect(json.component_self).toBe("payment-service");
  });
});
