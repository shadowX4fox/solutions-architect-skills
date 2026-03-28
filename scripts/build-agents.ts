#!/usr/bin/env bun
/**
 * build-agents.ts — Assembles 10 compliance agent .md files from:
 *   agents/base/AGENT_BASE.md  (shared template)
 *   agents/base/sections/*.md  (shared sections)
 *   agents/base/overrides/*.md (domain-specific overrides)
 *   agents/base/configs/*.json (domain configs)
 *
 * Usage: bun scripts/build-agents.ts
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, resolve, basename } from "path";

const ROOT = resolve(import.meta.dir, "..");
const BASE_DIR = join(ROOT, "agents", "base");
const AGENTS_DIR = join(ROOT, "agents");
const CONFIGS_DIR = join(BASE_DIR, "configs");

// ── Helpers ──────────────────────────────────────────────

function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

function flattenConfig(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (value === null || value === undefined) {
      result[fullKey] = "";
    } else if (typeof value === "object" && !Array.isArray(value)) {
      const nested = flattenConfig(value, fullKey);
      Object.assign(result, nested);
      // Also register non-prefixed aliases for nested objects
      // so {{contract_type}} works in addition to {{domain_contract_type}}
      for (const [nk, nv] of Object.entries(nested)) {
        const unprefixed = nk.replace(`${fullKey}_`, "");
        if (!(unprefixed in result)) {
          result[unprefixed] = nv;
        }
      }
    } else if (Array.isArray(value)) {
      // Arrays are handled by @foreach, skip flattening
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

// ── Template Processors ─────────────────────────────────

/**
 * Replace {{variable}} placeholders with config values.
 * Supports nested keys via flattened dot-path (e.g., domain_name, persona_codename).
 */
function replaceVariables(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key === "item") return match; // Skip @foreach item placeholders
    return vars[key] ?? match;
  });
}

/**
 * Process <!-- @foreach array_name --> blocks.
 * Supports simple arrays and arrays of objects.
 */
function processForeach(content: string, config: Record<string, any>): string {
  const foreachRegex = /<!-- @foreach (\w+) -->\n([\s\S]*?)<!-- @endforeach -->/g;

  return content.replace(foreachRegex, (_match, arrayName: string, template: string) => {
    // Resolve array from config (supports nested keys like phase3_required_files)
    const arr = resolveConfigValue(config, arrayName);
    if (!Array.isArray(arr)) {
      console.warn(`Warning: ${arrayName} is not an array in config`);
      return "";
    }

    return arr
      .map((item) => {
        if (typeof item === "string") {
          return template.replace(/\{\{item\}\}/g, item).trimEnd();
        } else if (typeof item === "object") {
          let line = template;
          for (const [k, v] of Object.entries(item)) {
            line = line.replace(new RegExp(`\\{\\{item\\.${k}\\}\\}`, "g"), String(v));
          }
          return line.trimEnd();
        }
        return "";
      })
      .join("\n");
  });
}

/**
 * Resolve a value from config by key, supporting underscore-separated paths.
 * e.g., "phase3_required_files" -> config.phase3.required_files
 */
function resolveConfigValue(config: Record<string, any>, key: string): any {
  // Direct lookup first
  if (key in config) return config[key];

  // Try nested lookup
  const parts = key.split("_");
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join("_");
    const suffix = parts.slice(i).join("_");
    if (prefix in config && typeof config[prefix] === "object" && config[prefix] !== null) {
      const result = resolveConfigValue(config[prefix], suffix);
      if (result !== undefined) return result;
    }
  }

  return undefined;
}

/**
 * Process <!-- @if condition --> blocks.
 * Supports simple equality checks: scoring_model == "two-tier"
 */
function processConditionals(content: string, vars: Record<string, string>): string {
  const ifRegex = /<!-- @if (\w+) == "([^"]*)" -->\n([\s\S]*?)<!-- @endif -->/g;

  return content.replace(ifRegex, (_match, varName: string, expected: string, block: string) => {
    const actual = vars[varName] ?? "";
    return actual === expected ? block : "";
  });
}

/**
 * Process <!-- @insert path --> directives.
 * Resolves file paths relative to BASE_DIR.
 */
function processInserts(content: string, vars: Record<string, string>): string {
  const insertRegex = /<!-- @insert ([^\s]+) -->/g;

  return content.replace(insertRegex, (_match, filePath: string) => {
    const fullPath = join(BASE_DIR, filePath);
    try {
      let sectionContent = readFile(fullPath);
      // Apply variable replacement to inserted content
      sectionContent = replaceVariables(sectionContent, vars);
      return sectionContent;
    } catch {
      console.warn(`Warning: Could not read section file: ${fullPath}`);
      return `<!-- MISSING SECTION: ${filePath} -->`;
    }
  });
}

/**
 * Process override operations from config.
 * - insert_after: Find marker, insert content after it
 * - append_to: Find marker, append content
 * - insert_at: Find marker, replace with content
 */
function processOverrides(
  content: string,
  overrides: Array<{
    id: string;
    file?: string;
    content_lines?: string[];
    insert_after?: string;
    append_to?: string;
    insert_at?: string;
  }>,
  vars: Record<string, string>
): string {
  for (const override of overrides) {
    let overrideContent = "";

    if (override.file) {
      // If file doesn't contain a directory separator, assume it's in overrides/
      const relativePath = override.file.includes("/") ? override.file : `overrides/${override.file}`;
      const fullPath = join(BASE_DIR, relativePath);
      try {
        overrideContent = readFile(fullPath);
        overrideContent = replaceVariables(overrideContent, vars);
      } catch {
        console.warn(`Warning: Could not read override file: ${fullPath}`);
        continue;
      }
    } else if (override.content_lines) {
      overrideContent = override.content_lines.join("\n");
    }

    if (override.insert_after) {
      const marker = `<!-- @insert-overrides ${override.insert_after} -->`;
      content = content.replace(marker, `${overrideContent}\n\n${marker}`);
    } else if (override.append_to) {
      const marker = `<!-- @append ${override.append_to} -->`;
      content = content.replace(marker, `${overrideContent}\n${marker}`);
    } else if (override.insert_at) {
      const marker = `<!-- @insert-at ${override.insert_at} -->`;
      content = content.replace(marker, overrideContent);
    }
  }

  return content;
}

/**
 * Clean up remaining build directives from the output.
 */
function cleanupDirectives(content: string): string {
  // Remove remaining @insert-overrides markers
  content = content.replace(/<!-- @insert-overrides \S+ -->\n?/g, "");
  // Remove remaining @append markers
  content = content.replace(/<!-- @append \S+ -->\n?/g, "");
  // Remove remaining @insert-at markers
  content = content.replace(/<!-- @insert-at \S+ -->\n?/g, "");
  // Remove remaining unresolved @foreach blocks
  content = content.replace(/<!-- @foreach \w+ -->\n[\s\S]*?<!-- @endforeach -->\n?/g, "");
  // Remove remaining unresolved @if blocks
  content = content.replace(/<!-- @if [^>]+ -->\n[\s\S]*?<!-- @endif -->\n?/g, "");
  // Collapse 3+ consecutive blank lines to 2
  content = content.replace(/\n{4,}/g, "\n\n\n");
  return content;
}

// ── Main ─────────────────────────────────────────────────

function buildAgent(configPath: string): { name: string; lines: number } {
  const config = JSON.parse(readFile(configPath));
  const vars = flattenConfig(config);

  // Add build date
  const buildDate = new Date().toISOString().split("T")[0];
  vars.build_date = buildDate;
  vars.config_filename = basename(configPath);

  // Read base template
  let content = readFile(join(BASE_DIR, "AGENT_BASE.md"));

  // 1. Process @if conditionals first (removes blocks for non-matching agents)
  content = processConditionals(content, vars);

  // 2. Process @foreach blocks (before variable replacement to handle arrays)
  content = processForeach(content, config);

  // 3. Process @insert directives (loads section files)
  content = processInserts(content, vars);

  // 4. Process overrides
  if (config.overrides && config.overrides.length > 0) {
    content = processOverrides(content, config.overrides, vars);
  }

  // 5. Final variable replacement (catches variables in inserted sections)
  content = replaceVariables(content, vars);

  // 6. Cleanup remaining directives
  content = cleanupDirectives(content);

  // Write output
  const outputPath = join(AGENTS_DIR, `${config.agent_name}.md`);
  writeFileSync(outputPath, content);

  const lineCount = content.split("\n").length;
  return { name: config.agent_name, lines: lineCount };
}

// ── Entry Point ──────────────────────────────────────────

console.log("Building compliance agents from base template + domain configs...\n");

const configFiles = readdirSync(CONFIGS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (configFiles.length === 0) {
  console.error("Error: No config files found in agents/base/configs/");
  process.exit(1);
}

const results: Array<{ name: string; lines: number }> = [];
const errors: string[] = [];

for (const configFile of configFiles) {
  const configPath = join(CONFIGS_DIR, configFile);
  try {
    const result = buildAgent(configPath);
    results.push(result);
    console.log(`  ✅ ${result.name}.md (${result.lines} lines)`);
  } catch (err) {
    const msg = `  ❌ ${configFile}: ${err instanceof Error ? err.message : String(err)}`;
    errors.push(msg);
    console.error(msg);
  }
}

console.log(`\nBuilt ${results.length}/${configFiles.length} agents.`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  errors.forEach((e) => console.error(e));
  process.exit(1);
}

// Validation
const MIN_LINES = 500;
const MAX_LINES = 800;

const outOfRange = results.filter((r) => r.lines < MIN_LINES || r.lines > MAX_LINES);
if (outOfRange.length > 0) {
  console.warn("\n⚠️  Line count warnings:");
  for (const r of outOfRange) {
    console.warn(`   ${r.name}: ${r.lines} lines (expected ${MIN_LINES}-${MAX_LINES})`);
  }
}

// Check for unresolved placeholders
let unresolvedCount = 0;
for (const result of results) {
  const outputPath = join(AGENTS_DIR, `${result.name}.md`);
  const content = readFile(outputPath);
  const unresolved = content.match(/\{\{[^}]+\}\}/g);
  if (unresolved) {
    const unique = [...new Set(unresolved)];
    console.warn(`\n⚠️  ${result.name}: ${unique.length} unresolved placeholder(s): ${unique.join(", ")}`);
    unresolvedCount += unique.length;
  }
}

if (unresolvedCount === 0) {
  console.log("\n✅ All placeholders resolved successfully.");
}

console.log("\nDone.");
