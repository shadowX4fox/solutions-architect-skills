/**
 * Unit tests for parse-explore-result.ts — covers happy path,
 * malformed YAML, missing required fields, and the false-negative
 * safeguard (rejection when required_sections are absent from
 * relevant_files).
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  extractExploreResultBlock,
  parseExploreResult,
  parseSimpleYaml,
} from "./parse-explore-result";

let workdir: string;
let configPath: string;

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), "explore-parse-test-"));
  configPath = join(workdir, "config.json");
});

afterEach(() => {
  if (existsSync(workdir)) rmSync(workdir, { recursive: true, force: true });
});

function writeConfig(required: Array<{ file: string }>): void {
  writeFileSync(
    configPath,
    JSON.stringify({
      task_type: "compliance-sre",
      task_family: "compliance",
      downstream_agent: "sa-skills:compliance-generator",
      required_sections: required,
      optional_sections: [],
      candidate_files: ["**/*.md"],
      relevance_keywords: { boost: [] },
      score_threshold: 0.3,
      output_format: "v1",
    }),
  );
}

const HAPPY_RESULT = `
EXPLORE_RESULT:
\`\`\`yaml
schema_version: 1
status: OK
task_type: compliance-sre
task_family: compliance
generated_at: 2026-04-25T14:22:11Z
cache_key: sha256:abc
inputs_hash: sha256:abc
config_path: /tmp/c.json
cache_hit: false

metadata:
  architecture_version: 1.4.0
  architecture_status: Released
  doc_language: en
  doc_inventory:
    architecture_md: true
    docs_dir_files: 9
    components: 12
    adrs: 7

relevant_files:
  - path: ARCHITECTURE.md
    score: 1.00
    reason: required_section
    matched_sections: ["# System Overview"]
  - path: docs/08-scalability-and-performance.md
    score: 0.85
    reason: matched [SLO, MTTR]
    matched_sections: ["## SLOs"]

irrelevant_files:
  - path: docs/06-technology-stack.md
    score: 0.05
    reason: below_threshold

gaps:
  - file: docs/08-scalability-and-performance.md
    marker: missing_mttr
    severity: high
    note: "MTTR not defined"

stats:
  files_scanned: 3
  files_relevant: 2
  files_irrelevant: 1
  bytes_skipped_estimate: 4096
\`\`\`
`;

describe("extractExploreResultBlock", () => {
  test("extracts the YAML body from a fenced block", () => {
    const body = extractExploreResultBlock(HAPPY_RESULT);
    expect(body).not.toBeNull();
    expect(body).toContain("schema_version: 1");
    expect(body).toContain("relevant_files:");
    expect(body).not.toContain("```yaml");
  });

  test("returns null when no EXPLORE_RESULT marker is present", () => {
    expect(extractExploreResultBlock("hello world")).toBeNull();
  });

  test("returns null when fenced YAML block is missing", () => {
    expect(extractExploreResultBlock("EXPLORE_RESULT: failed")).toBeNull();
  });
});

describe("parseSimpleYaml", () => {
  test("parses scalar values", () => {
    const out = parseSimpleYaml("schema_version: 1\nstatus: OK\n") as Record<string, unknown>;
    expect(out.schema_version).toBe(1);
    expect(out.status).toBe("OK");
  });

  test("parses nested mappings", () => {
    const out = parseSimpleYaml(`
metadata:
  doc_language: en
  doc_inventory:
    architecture_md: true
    components: 12
`) as { metadata: { doc_language: string; doc_inventory: Record<string, unknown> } };
    expect(out.metadata.doc_language).toBe("en");
    expect(out.metadata.doc_inventory.architecture_md).toBe(true);
    expect(out.metadata.doc_inventory.components).toBe(12);
  });

  test("parses list of mappings", () => {
    const out = parseSimpleYaml(`
relevant_files:
  - path: ARCHITECTURE.md
    score: 1.00
    reason: required_section
  - path: docs/08.md
    score: 0.85
    reason: matched
`) as { relevant_files: Array<{ path: string; score: number; reason: string }> };
    expect(out.relevant_files).toHaveLength(2);
    expect(out.relevant_files[0].path).toBe("ARCHITECTURE.md");
    expect(out.relevant_files[0].score).toBe(1.0);
    expect(out.relevant_files[1].path).toBe("docs/08.md");
  });

  test("parses flow-style sequences", () => {
    const out = parseSimpleYaml(`matched_sections: ["# A", "## B"]\n`) as {
      matched_sections: string[];
    };
    expect(out.matched_sections).toEqual(["# A", "## B"]);
  });

  test("parses booleans, numbers, quoted strings", () => {
    const out = parseSimpleYaml(`
cache_hit: false
count: 42
ratio: 0.85
title: "hello world"
`) as Record<string, unknown>;
    expect(out.cache_hit).toBe(false);
    expect(out.count).toBe(42);
    expect(out.ratio).toBe(0.85);
    expect(out.title).toBe("hello world");
  });
});

describe("parseExploreResult — happy path", () => {
  test("parses a well-formed EXPLORE_RESULT", () => {
    writeConfig([{ file: "ARCHITECTURE.md" }]);
    const outcome = parseExploreResult(HAPPY_RESULT, configPath);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe("OK");
    expect(outcome.result.relevant_files).toHaveLength(2);
    expect(outcome.result.relevant_files[0].path).toBe("ARCHITECTURE.md");
    expect(outcome.result.gaps).toHaveLength(1);
    expect(outcome.result.gaps[0].marker).toBe("missing_mttr");
    expect(outcome.result.metadata.doc_inventory.adrs).toBe(7);
  });
});

describe("parseExploreResult — malformed input", () => {
  test("rejects when no EXPLORE_RESULT block is present", () => {
    writeConfig([{ file: "ARCHITECTURE.md" }]);
    const outcome = parseExploreResult("nothing here", configPath);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toContain("no EXPLORE_RESULT block");
    expect(outcome.fallbackFiles).toEqual(["ARCHITECTURE.md"]);
  });

  test("rejects when required fields are missing", () => {
    writeConfig([{ file: "ARCHITECTURE.md" }]);
    const malformed = `
EXPLORE_RESULT:
\`\`\`yaml
schema_version: 1
\`\`\`
`;
    const outcome = parseExploreResult(malformed, configPath);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toContain("missing required field");
  });

  test("rejects unsupported schema_version", () => {
    writeConfig([{ file: "ARCHITECTURE.md" }]);
    const wrongSchema = `
EXPLORE_RESULT:
\`\`\`yaml
schema_version: 99
status: OK
task_type: compliance-sre
task_family: compliance
relevant_files: []
irrelevant_files: []
\`\`\`
`;
    const outcome = parseExploreResult(wrongSchema, configPath);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toContain("schema_version");
  });
});

describe("parseExploreResult — false-negative safeguard", () => {
  test("rejects when a required_sections file is missing from relevant_files", () => {
    writeConfig([
      { file: "ARCHITECTURE.md" },
      { file: "docs/01-system-overview.md" },
    ]);

    const outcome = parseExploreResult(HAPPY_RESULT, configPath);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toContain("required_sections missing");
    expect(outcome.reason).toContain("docs/01-system-overview.md");
    expect(outcome.fallbackFiles).toEqual([
      "ARCHITECTURE.md",
      "docs/01-system-overview.md",
    ]);
  });

  test("does not enforce required_sections when status is FAILED", () => {
    writeConfig([{ file: "ARCHITECTURE.md" }, { file: "docs/01.md" }]);

    const failedResult = `
EXPLORE_RESULT:
\`\`\`yaml
schema_version: 1
status: FAILED
task_type: compliance-sre
task_family: compliance
relevant_files: []
irrelevant_files: []
\`\`\`
`;
    const outcome = parseExploreResult(failedResult, configPath);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe("FAILED");
  });
});
