/**
 * Schema validation tests for every explorer config in
 * agents/configs/explorer/. Runs on every change.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync } from "fs";
import { join, resolve } from "path";
import { validateConfig, validateConfigFile } from "./validate-config";

const CONFIG_DIR = resolve(import.meta.dir, "../../../agents/configs/explorer");

function listConfigs(): string[] {
  return readdirSync(CONFIG_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();
}

describe("explorer configs — schema validation", () => {
  for (const name of listConfigs()) {
    test(`config validates: ${name}`, () => {
      const errors = validateConfigFile(join(CONFIG_DIR, name));
      if (errors.length > 0) {
        console.error(`Errors in ${name}:`, errors);
      }
      expect(errors).toEqual([]);
    });
  }

  test("at least one config exists", () => {
    expect(listConfigs().length).toBeGreaterThan(0);
  });
});

describe("validateConfig — error cases", () => {
  test("rejects non-object input", () => {
    expect(validateConfig(null)[0]).toContain("not an object");
    expect(validateConfig("string")[0]).toContain("not an object");
  });

  test("rejects missing required fields", () => {
    const errors = validateConfig({ task_type: "x" });
    expect(errors.some((e) => e.includes("missing required field"))).toBe(true);
  });

  test("rejects invalid task_family", () => {
    const errors = validateConfig({
      task_type: "compliance-sre",
      task_family: "not-a-family",
      downstream_agent: "x",
      required_sections: [],
      optional_sections: [],
      candidate_files: ["a"],
      relevance_keywords: { boost: [] },
      score_threshold: 0.3,
      output_format: "v1",
    });
    expect(errors.some((e) => e.includes("task_family"))).toBe(true);
  });

  test("rejects out-of-range score_threshold", () => {
    const errors = validateConfig({
      task_type: "compliance-sre",
      task_family: "compliance",
      downstream_agent: "x",
      required_sections: [],
      optional_sections: [],
      candidate_files: ["a"],
      relevance_keywords: { boost: [] },
      score_threshold: 2.5,
      output_format: "v1",
    });
    expect(errors.some((e) => e.includes("out of range"))).toBe(true);
  });

  test("rejects gap with both absent and present pattern", () => {
    const errors = validateConfig({
      task_type: "compliance-sre",
      task_family: "compliance",
      downstream_agent: "x",
      required_sections: [],
      optional_sections: [],
      candidate_files: ["a"],
      relevance_keywords: { boost: [] },
      score_threshold: 0.3,
      output_format: "v1",
      gap_markers: [
        {
          name: "broken",
          absent_pattern: "x",
          present_pattern: "y",
          severity: "high",
        },
      ],
    });
    expect(errors.some((e) => e.includes("cannot have both"))).toBe(true);
  });

  test("rejects boost weight outside 1..5", () => {
    const errors = validateConfig({
      task_type: "compliance-sre",
      task_family: "compliance",
      downstream_agent: "x",
      required_sections: [],
      optional_sections: [],
      candidate_files: ["a"],
      relevance_keywords: { boost: [{ term: "x", weight: 99 }] },
      score_threshold: 0.3,
      output_format: "v1",
    });
    expect(errors.some((e) => e.includes("weight must be 1..5"))).toBe(true);
  });

  test("rejects unexpected fields", () => {
    const errors = validateConfig({
      task_type: "compliance-sre",
      task_family: "compliance",
      downstream_agent: "x",
      required_sections: [],
      optional_sections: [],
      candidate_files: ["a"],
      relevance_keywords: { boost: [] },
      score_threshold: 0.3,
      output_format: "v1",
      bogus_field: 42,
    });
    expect(errors.some((e) => e.includes("unexpected field"))).toBe(true);
  });

  test("accepts a minimal valid config", () => {
    const errors = validateConfig({
      task_type: "compliance-sre",
      task_family: "compliance",
      downstream_agent: "sa-skills:compliance-generator",
      required_sections: [{ file: "ARCHITECTURE.md" }],
      optional_sections: [],
      candidate_files: ["docs/*.md"],
      relevance_keywords: { boost: [{ term: "SLO", weight: 5 }] },
      score_threshold: 0.3,
      output_format: "v1",
    });
    expect(errors).toEqual([]);
  });
});
