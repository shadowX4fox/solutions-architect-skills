#!/usr/bin/env bun
/**
 * One-shot script that auto-derives the explorer configs for every
 * task_type from existing source-of-truth in this repo:
 *
 *   compliance-<domain>  ← agents/configs/<domain>.json (phase3.required_files
 *                         become required_sections; phase3.data_points patterns
 *                         become relevance_keywords.boost terms; gap_markers
 *                         derive from blocker-tier patterns)
 *   analysis-<type>      ← hardcoded mapping below (one per analysis spec)
 *   peer-review-<cat>    ← hardcoded mapping below (one per category)
 *   handoff-component    ← hand-authored (non-derivable)
 *   architecture-question← hand-authored
 *   adr-application      ← hand-authored
 *
 * Run:
 *   bun run tools/derive-explorer-configs.ts            # generate missing
 *   bun run tools/derive-explorer-configs.ts --force    # overwrite existing
 *
 * After it succeeds, run `bun test skills/architecture-explorer/` to validate
 * every generated config against the schema.
 *
 * This script is intentionally one-shot — once configs are tuned, source-of-
 * truth edits to compliance configs no longer flow back here automatically.
 * Re-run with --force only when the underlying compliance configs change.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const COMPLIANCE_CONFIGS = join(REPO_ROOT, "agents/configs");
const EXPLORER_CONFIGS = join(REPO_ROOT, "agents/configs/explorer");

const FORCE = process.argv.includes("--force");

mkdirSync(EXPLORER_CONFIGS, { recursive: true });

let written = 0;
let skipped = 0;

function writeIfMissing(filename: string, body: object): void {
  const path = join(EXPLORER_CONFIGS, filename);
  if (existsSync(path) && !FORCE) {
    skipped++;
    return;
  }
  writeFileSync(path, JSON.stringify(body, null, 2) + "\n", "utf-8");
  written++;
  console.log(`  wrote ${filename}`);
}

function deriveComplianceConfigs(): void {
  console.log("compliance configs:");
  const entries = readdirSync(COMPLIANCE_CONFIGS).filter(
    (f) => f.endsWith(".json") && !f.startsWith("explorer/"),
  );
  for (const file of entries) {
    if (file === "explorer") continue;
    const path = join(COMPLIANCE_CONFIGS, file);
    let parsed: ComplianceConfig;
    try {
      parsed = JSON.parse(readFileSync(path, "utf-8")) as ComplianceConfig;
    } catch {
      continue;
    }
    if (!parsed.domain || !parsed.phase3) continue;
    const short = parsed.domain.short_name
      ?.toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!short) continue;
    const taskType = `compliance-${short}`;
    const explorerFile = `${taskType}.json`;
    writeIfMissing(explorerFile, complianceConfigToExplorer(parsed, taskType));
  }
}

function complianceConfigToExplorer(c: ComplianceConfig, taskType: string): object {
  const phase3 = c.phase3 ?? {};
  const domain = c.domain ?? {};
  const required = (phase3.required_files ?? []).map((f) => ({ file: f.path }));
  required.unshift({ file: "ARCHITECTURE.md" });

  const seenBoostTerms = new Set<string>();
  const boost: Array<{ term: string; weight: number }> = [];

  for (const dp of phase3.data_points ?? []) {
    const terms = extractTermsFromPattern(dp.pattern ?? "");
    for (const term of terms) {
      const lower = term.toLowerCase();
      if (seenBoostTerms.has(lower)) continue;
      seenBoostTerms.add(lower);
      boost.push({ term, weight: 3 });
      if (boost.length >= 30) break;
    }
    if (boost.length >= 30) break;
  }

  for (const kdp of c.key_data_points ?? []) {
    const lower = kdp.toLowerCase();
    if (!seenBoostTerms.has(lower) && boost.length < 30) {
      seenBoostTerms.add(lower);
      boost.push({ term: kdp, weight: 4 });
    }
  }

  const gaps: object[] = [];
  for (const dp of phase3.data_points ?? []) {
    if (!dp.name || !dp.pattern) continue;
    gaps.push({
      name: `missing_${slugify(dp.name)}`,
      absent_pattern: dp.pattern,
      case_insensitive: dp.case_insensitive === true,
      severity: "high",
    });
    if (gaps.length >= 6) break;
  }

  return {
    task_type: taskType,
    task_family: "compliance",
    downstream_agent: "sa-skills:compliance-generator",
    required_sections: dedupeRequired(required),
    optional_sections: [
      { file: "docs/01-system-overview.md" },
      { file: "adr/*.md", anchor_hints: c.focus_areas?.slice(0, 4) ?? [] },
      { file: "docs/components/**/*.md" },
    ],
    candidate_files: [
      "ARCHITECTURE.md",
      "docs/*.md",
      "docs/components/README.md",
      "docs/components/**/*.md",
      "adr/*.md",
    ],
    relevance_keywords: {
      boost,
      negative: ["pricing", "marketing copy", "user research"],
    },
    gap_markers: gaps,
    score_threshold: 0.3,
    output_format: "v1",
    notes: `Auto-derived from agents/configs/${domain.tmp_prefix ?? "(unknown)"}.json. Boost terms extracted from phase3.data_points patterns + key_data_points. Gap markers project blocker-tier data_points to absent_pattern checks. Hand-tune via --force after editing this file directly.`,
  };
}

function dedupeRequired(arr: Array<{ file: string }>): Array<{ file: string }> {
  const seen = new Set<string>();
  return arr.filter((entry) => {
    if (seen.has(entry.file)) return false;
    seen.add(entry.file);
    return true;
  });
}

function extractTermsFromPattern(pattern: string): string[] {
  const cleaned = pattern
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .replace(/\\/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "");
  return cleaned
    .split(/\||\+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && s.length < 40 && !/[{}*?^$]/.test(s))
    .slice(0, 8);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type ComplianceConfig = {
  domain?: { short_name?: string; tmp_prefix?: string };
  key_data_points?: string[];
  focus_areas?: string[];
  phase3?: {
    required_files?: Array<{ path: string }>;
    data_points?: Array<{ name?: string; pattern?: string; case_insensitive?: boolean }>;
  };
};

function deriveAnalysisConfigs(): void {
  console.log("analysis configs:");
  const map: Record<string, AnalysisSpec> = {
    spof: {
      required: [
        "ARCHITECTURE.md",
        "docs/03-architecture-layers.md",
        "docs/components/README.md",
      ],
      anchors: ["Failure Modes", "Dependencies", "Scaling", "HA"],
      boost: [
        ["single point of failure", 5],
        ["failover", 4],
        ["redundancy", 4],
        ["replica", 3],
        ["HA", 3],
        ["DR", 3],
        ["multi-region", 3],
        ["multi-AZ", 3],
        ["active-active", 3],
        ["active-passive", 3],
        ["circuit breaker", 2],
      ],
      gaps: [
        ["no_failure_modes", "absent", "Failure Modes"],
        ["single_region", "present", "single[- ]region"],
      ],
    },
    "blast-radius": {
      required: ["ARCHITECTURE.md", "docs/04-data-flow-patterns.md", "docs/05-integration-points.md", "docs/components/README.md"],
      anchors: ["Dependencies", "Consumers", "Downstream"],
      boost: [
        ["downstream", 4],
        ["upstream", 4],
        ["dependency", 3],
        ["fan-out", 4],
        ["bulkhead", 3],
        ["isolation", 3],
        ["timeout", 2],
        ["retry", 2],
        ["circuit breaker", 3],
      ],
      gaps: [["no_dependencies_section", "absent", "Dependencies"]],
    },
    bottleneck: {
      required: ["ARCHITECTURE.md", "docs/08-scalability-and-performance.md", "docs/04-data-flow-patterns.md", "docs/components/README.md"],
      anchors: ["Throughput", "TPS", "Latency", "Capacity"],
      boost: [
        ["TPS", 5],
        ["throughput", 4],
        ["bottleneck", 5],
        ["queue", 3],
        ["backlog", 3],
        ["rate limit", 3],
        ["capacity", 3],
        ["concurrent", 2],
        ["batch size", 2],
      ],
      gaps: [["missing_tps", "absent", "TPS|throughput"]],
    },
    "cost-hotspots": {
      required: ["ARCHITECTURE.md", "docs/06-technology-stack.md", "docs/09-operational-considerations.md"],
      anchors: ["Cost", "Pricing", "Cloud"],
      boost: [
        ["cost", 4],
        ["FinOps", 5],
        ["reserved instance", 3],
        ["spot instance", 3],
        ["right-sizing", 3],
        ["egress", 4],
        ["storage class", 2],
        ["cold storage", 2],
        ["GPU", 2],
        ["expensive", 2],
      ],
      gaps: [["no_cost_section", "absent", "cost|pricing|spend"]],
    },
    stride: {
      required: ["ARCHITECTURE.md", "docs/07-security-architecture.md", "docs/05-integration-points.md", "docs/components/README.md"],
      anchors: ["Trust Boundary", "Authentication", "Authorization"],
      boost: [
        ["spoofing", 5],
        ["tampering", 5],
        ["repudiation", 4],
        ["information disclosure", 5],
        ["denial of service", 5],
        ["elevation of privilege", 5],
        ["trust boundary", 5],
        ["threat model", 5],
        ["attack surface", 4],
        ["principal", 3],
      ],
      gaps: [
        ["no_trust_boundary", "absent", "trust boundary"],
        ["no_authn", "absent", "authentication|authn"],
      ],
    },
    "vendor-lockin": {
      required: ["ARCHITECTURE.md", "docs/06-technology-stack.md", "docs/03-architecture-layers.md"],
      anchors: ["Provider", "Cloud", "Vendor"],
      boost: [
        ["vendor lock-in", 5],
        ["proprietary", 4],
        ["managed service", 3],
        ["SaaS", 3],
        ["AWS", 2],
        ["Azure", 2],
        ["GCP", 2],
        ["portable", 4],
        ["open source", 3],
        ["egress fee", 3],
      ],
      gaps: [["no_exit_strategy", "absent", "exit|migration|portability"]],
    },
    "latency-budget": {
      required: ["ARCHITECTURE.md", "docs/04-data-flow-patterns.md", "docs/08-scalability-and-performance.md"],
      anchors: ["Latency", "p95", "p99", "SLO"],
      boost: [
        ["p50", 3],
        ["p95", 5],
        ["p99", 5],
        ["latency", 5],
        ["budget", 4],
        ["hop", 3],
        ["round trip", 3],
        ["RTT", 3],
        ["timeout", 3],
        ["deadline", 3],
      ],
      gaps: [["no_p95", "absent", "p95|p99"]],
    },
    "tech-debt": {
      required: ["ARCHITECTURE.md", "docs/06-technology-stack.md", "docs/03-architecture-layers.md"],
      anchors: ["Version", "EOL", "Deprecated"],
      boost: [
        ["EOL", 5],
        ["end of life", 5],
        ["deprecated", 5],
        ["legacy", 4],
        ["technical debt", 4],
        ["upgrade", 3],
        ["migration", 3],
        ["unsupported", 4],
        ["CVE", 3],
      ],
      gaps: [["no_versions", "absent", "version|v[0-9]+"]],
    },
    coupling: {
      required: ["ARCHITECTURE.md", "docs/05-integration-points.md", "docs/components/README.md"],
      anchors: ["Integration", "Dependency", "API"],
      boost: [
        ["coupling", 5],
        ["dependency", 4],
        ["fan-in", 4],
        ["fan-out", 4],
        ["cycle", 4],
        ["shared database", 4],
        ["bounded context", 3],
        ["interface", 3],
        ["contract", 3],
      ],
      gaps: [["no_integration_section", "absent", "integration|dependency"]],
    },
    "data-sensitivity": {
      required: ["ARCHITECTURE.md", "docs/07-security-architecture.md", "docs/05-integration-points.md", "docs/04-data-flow-patterns.md"],
      anchors: ["PII", "Encryption", "Data Classification"],
      boost: [
        ["PII", 5],
        ["personal data", 5],
        ["GDPR", 5],
        ["HIPAA", 5],
        ["PCI", 5],
        ["data classification", 5],
        ["sensitive", 4],
        ["encryption at rest", 4],
        ["encryption in transit", 4],
        ["pseudonymization", 4],
        ["anonymization", 4],
        ["audit log", 3],
      ],
      gaps: [
        ["no_data_classification", "absent", "data classification|PII|sensitive"],
        ["no_encryption", "absent", "encryption"],
      ],
    },
  };

  for (const [type, spec] of Object.entries(map)) {
    writeIfMissing(`analysis-${type}.json`, analysisToExplorer(`analysis-${type}`, spec));
  }
}

type AnalysisSpec = {
  required: string[];
  anchors: string[];
  boost: Array<[string, number]>;
  gaps: Array<[string, "absent" | "present", string]>;
};

function analysisToExplorer(taskType: string, s: AnalysisSpec): object {
  return {
    task_type: taskType,
    task_family: "analysis",
    downstream_agent: "sa-skills:architecture-analysis-agent",
    required_sections: s.required.map((f) => ({ file: f })),
    optional_sections: [
      { file: "docs/01-system-overview.md" },
      { file: "adr/*.md", anchor_hints: s.anchors },
      { file: "docs/components/**/*.md", anchor_hints: s.anchors },
    ],
    candidate_files: [
      "ARCHITECTURE.md",
      "docs/*.md",
      "docs/components/README.md",
      "docs/components/**/*.md",
      "adr/*.md",
    ],
    relevance_keywords: {
      boost: s.boost.map(([term, weight]) => ({ term, weight })),
      negative: ["pricing", "marketing copy"],
    },
    gap_markers: s.gaps.map(([name, kind, pattern]) => ({
      name,
      [kind === "absent" ? "absent_pattern" : "present_pattern"]: pattern,
      case_insensitive: true,
      severity: "high",
    })),
    score_threshold: 0.3,
    output_format: "v1",
    notes: `Auto-derived from architecture-analysis spec for ${taskType}. Boost terms tuned per analysis vocabulary.`,
  };
}

function derivePeerReviewConfigs(): void {
  console.log("peer-review configs:");
  const map: Record<string, PeerReviewSpec> = {
    struct: {
      required: ["ARCHITECTURE.md", "docs/01-system-overview.md", "docs/03-architecture-layers.md"],
      boost: [["section", 3], ["heading", 2], ["table of contents", 3], ["completeness", 3]],
    },
    naming: {
      required: ["ARCHITECTURE.md", "docs/01-system-overview.md"],
      boost: [["component", 3], ["service", 2], ["naming", 4], ["convention", 3]],
    },
    sections: {
      required: ["ARCHITECTURE.md", "docs/01-system-overview.md", "docs/03-architecture-layers.md", "docs/04-data-flow-patterns.md"],
      boost: [["section", 3], ["overview", 2], ["coverage", 3]],
    },
    coherence: {
      required: ["ARCHITECTURE.md", "docs/01-system-overview.md", "docs/03-architecture-layers.md", "docs/04-data-flow-patterns.md", "docs/05-integration-points.md"],
      boost: [["coherence", 4], ["consistency", 4], ["alignment", 3], ["narrative", 2]],
    },
    tech: {
      required: ["ARCHITECTURE.md", "docs/06-technology-stack.md", "docs/03-architecture-layers.md"],
      boost: [["version", 3], ["framework", 3], ["library", 2], ["stack", 3]],
    },
    integ: {
      required: ["ARCHITECTURE.md", "docs/05-integration-points.md", "docs/04-data-flow-patterns.md"],
      boost: [["integration", 5], ["API", 4], ["protocol", 3], ["contract", 3], ["versioning", 3]],
    },
    metrics: {
      required: ["ARCHITECTURE.md", "docs/08-scalability-and-performance.md", "docs/09-operational-considerations.md"],
      boost: [["TPS", 4], ["latency", 4], ["SLO", 5], ["throughput", 4], ["realistic", 2]],
    },
    scale: {
      required: ["ARCHITECTURE.md", "docs/08-scalability-and-performance.md", "docs/components/README.md"],
      boost: [["HPA", 4], ["scaling", 4], ["autoscale", 4], ["load", 3], ["capacity", 3]],
    },
    security: {
      required: ["ARCHITECTURE.md", "docs/07-security-architecture.md", "docs/05-integration-points.md"],
      boost: [["authentication", 4], ["encryption", 4], ["mTLS", 5], ["IAM", 3], ["audit", 3]],
    },
    perf: {
      required: ["ARCHITECTURE.md", "docs/08-scalability-and-performance.md"],
      boost: [["p95", 5], ["p99", 5], ["latency", 4], ["benchmark", 3]],
    },
    ops: {
      required: ["ARCHITECTURE.md", "docs/09-operational-considerations.md"],
      boost: [["runbook", 4], ["monitoring", 4], ["incident", 3], ["alert", 3], ["dashboard", 2]],
    },
    adr: {
      required: ["ARCHITECTURE.md"],
      boost: [["ADR", 5], ["decision record", 5], ["context", 3], ["consequences", 4], ["alternatives", 4]],
      includeAdrs: true,
    },
    tradeoff: {
      required: ["ARCHITECTURE.md"],
      boost: [["trade-off", 5], ["tradeoff", 5], ["alternative", 4], ["chosen because", 3], ["honest", 3]],
      includeAdrs: true,
    },
  };

  for (const [code, spec] of Object.entries(map)) {
    writeIfMissing(`peer-review-${code}.json`, peerReviewToExplorer(`peer-review-${code}`, spec));
  }
}

type PeerReviewSpec = {
  required: string[];
  boost: Array<[string, number]>;
  includeAdrs?: boolean;
};

function peerReviewToExplorer(taskType: string, s: PeerReviewSpec): object {
  const required = s.required.map((f) => ({ file: f }));
  if (s.includeAdrs) {
    required.push({ file: "adr/*.md" });
  }
  return {
    task_type: taskType,
    task_family: "peer-review",
    downstream_agent: "sa-skills:peer-review-category-agent",
    required_sections: required,
    optional_sections: [
      { file: "docs/components/**/*.md" },
      { file: "adr/*.md" },
    ],
    candidate_files: [
      "ARCHITECTURE.md",
      "docs/*.md",
      "docs/components/README.md",
      "docs/components/**/*.md",
      "adr/*.md",
    ],
    relevance_keywords: {
      boost: s.boost.map(([term, weight]) => ({ term, weight })),
      negative: [],
    },
    gap_markers: [],
    score_threshold: 0.25,
    output_format: "v1",
    notes: `Auto-derived from skills/architecture-peer-review/PEER_REVIEW_CRITERIA.md category ${taskType.replace("peer-review-", "").toUpperCase()}. Lower threshold (0.25) since peer-review categories overlap and broad inclusion is preferred.`,
  };
}

function writeSpecialConfigs(): void {
  console.log("special configs:");

  writeIfMissing("handoff-component.json", {
    task_type: "handoff-component",
    task_family: "handoff",
    downstream_agent: "sa-skills:handoff-slicer",
    required_sections: [
      { file: "ARCHITECTURE.md" },
      { file: "docs/01-system-overview.md" },
      { file: "docs/04-data-flow-patterns.md" },
      { file: "docs/05-integration-points.md" },
      { file: "docs/06-technology-stack.md" },
      { file: "docs/07-security-architecture.md" },
      { file: "docs/08-scalability-and-performance.md" },
      { file: "docs/09-operational-considerations.md" },
      { file: "docs/components/README.md" },
    ],
    optional_sections: [
      { file: "adr/*.md", anchor_hints: ["technology", "component", "integration"] },
      { file: "docs/components/**/*.md" },
    ],
    candidate_files: [
      "ARCHITECTURE.md",
      "docs/*.md",
      "docs/components/README.md",
      "docs/components/**/*.md",
      "adr/*.md",
    ],
    relevance_keywords: {
      boost: [
        { term: "component", weight: 4 },
        { term: "service", weight: 3 },
        { term: "API", weight: 3 },
        { term: "endpoint", weight: 3 },
        { term: "schema", weight: 3 },
        { term: "deployment", weight: 3 },
        { term: "Failure Modes", weight: 4 },
        { term: "Dependencies", weight: 4 },
        { term: "Scaling", weight: 3 },
      ],
      negative: [],
    },
    gap_markers: [],
    score_threshold: 0.2,
    output_format: "v1",
    notes: "Used by architecture-dev-handoff skill. Provides a relevance map per component to handoff-slicer (Sonnet) which then performs YAML extraction, per-component slicing, dedup, and manifest writes. All seven shared docs are required_sections — handoff payloads need lossless coverage.",
  });

  writeIfMissing("architecture-question.json", {
    task_type: "architecture-question",
    task_family: "question",
    downstream_agent: "main",
    required_sections: [{ file: "ARCHITECTURE.md" }],
    optional_sections: [
      { file: "docs/01-system-overview.md" },
      { file: "docs/03-architecture-layers.md" },
      { file: "docs/04-data-flow-patterns.md" },
      { file: "docs/05-integration-points.md" },
      { file: "docs/06-technology-stack.md" },
      { file: "docs/07-security-architecture.md" },
      { file: "docs/08-scalability-and-performance.md" },
      { file: "docs/09-operational-considerations.md" },
      { file: "docs/components/README.md" },
      { file: "docs/components/**/*.md" },
      { file: "adr/*.md" },
    ],
    candidate_files: [
      "ARCHITECTURE.md",
      "docs/*.md",
      "docs/components/README.md",
      "docs/components/**/*.md",
      "adr/*.md",
    ],
    relevance_keywords: {
      boost: [],
      negative: [],
    },
    gap_markers: [],
    score_threshold: 0.2,
    output_format: "v1",
    notes: "Free-form architecture Q&A. Boost keywords are injected at runtime from extra_terms (the user's question keywords) — that's why the static boost list is empty. The skill orchestrator passes question terms; the explorer adds them as weight-4 boosts before classifying.",
  });

  writeIfMissing("adr-application.json", {
    task_type: "adr-application",
    task_family: "adr",
    downstream_agent: "main",
    required_sections: [{ file: "ARCHITECTURE.md" }, { file: "docs/03-architecture-layers.md" }],
    optional_sections: [
      { file: "docs/06-technology-stack.md" },
      { file: "adr/*.md" },
      { file: "docs/components/**/*.md" },
    ],
    candidate_files: [
      "ARCHITECTURE.md",
      "docs/*.md",
      "docs/components/README.md",
      "docs/components/**/*.md",
      "adr/*.md",
    ],
    relevance_keywords: {
      boost: [
        { term: "ADR", weight: 5 },
        { term: "decision", weight: 3 },
        { term: "supersedes", weight: 4 },
        { term: "superseded by", weight: 4 },
      ],
      negative: [],
    },
    gap_markers: [],
    score_threshold: 0.2,
    output_format: "v1",
    notes: "Used by architecture-definition-record skill when creating or superseding ADRs. The orchestrator passes the proposed decision's tech/component terms via extra_terms; explorer adds them as weight-4 boosts so prior ADRs touching the same area are included in relevant_files for cross-referencing.",
  });
}

console.log(`derive-explorer-configs (${FORCE ? "FORCE" : "skip-existing"})`);
console.log(`output: ${EXPLORER_CONFIGS}`);
console.log("");

deriveComplianceConfigs();
deriveAnalysisConfigs();
derivePeerReviewConfigs();
writeSpecialConfigs();

console.log("");
console.log(`done. wrote ${written} files, skipped ${skipped} existing.`);
