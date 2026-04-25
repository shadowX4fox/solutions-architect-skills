#!/usr/bin/env bun
/**
 * Orchestrator-invokable CLI for architecture-explorer cache + helpers.
 *
 * Subcommands:
 *   inputs-hash <project_root> <task_type> <config_path> <plugin_version>
 *     Print sha256 hash mixing candidate-file mtimes, config mtime, and
 *     plugin version. Used by the explorer agent in PHASE 2 to decide
 *     whether to short-circuit on a cache hit.
 *
 *   check-cache <project_root> <task_type> <expected_inputs_hash>
 *     Print "HIT <abs_cache_path>" if the cache file's stored
 *     inputs_hash matches, or "MISS <abs_cache_path>" otherwise.
 *
 *   expand-candidates <project_root> <config_path>
 *     Print a JSON array of repo-relative paths that match the config's
 *     candidate_files[] globs (existing files only, sorted).
 *
 *   write-cache <project_root> <task_type> <inputs_hash> <result_path>
 *     Read result_path (a YAML file the agent already wrote), persist it
 *     as the cache entry for the (project, task_type) pair, and print the
 *     absolute cache path. result_path may be "-" to read from stdin.
 *
 *   read-cache <project_root> <task_type>
 *     Print the cached EXPLORE_RESULT YAML body (if any) to stdout.
 *     Exit code 1 if no cache entry exists.
 *
 *   project-hash <project_root>
 *     Print the 32-char sha256 prefix used in cache directory names.
 *     (Diagnostic / test helper.)
 *
 * Exit codes: 0 success, 1 expected-miss, 2 invalid usage / IO error.
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  cachePath,
  checkCache,
  computeInputsHash,
  expandGlobs,
  projectHash,
  writeCache,
  readCache,
} from "./explore-cache";

type Config = {
  candidate_files?: string[];
  required_sections?: Array<{ file: string }>;
};

const [, , subcommand, ...rest] = process.argv;

function fail(msg: string): never {
  console.error(`explore-cli: ${msg}`);
  process.exit(2);
}

function readConfig(configPath: string): Config {
  if (!existsSync(configPath)) fail(`config not found: ${configPath}`);
  try {
    return JSON.parse(readFileSync(configPath, "utf-8")) as Config;
  } catch (e) {
    fail(`config parse error: ${(e as Error).message}`);
  }
}

switch (subcommand) {
  case "inputs-hash": {
    const [projectRoot, taskType, configPath, pluginVersion] = rest;
    if (!projectRoot || !taskType || !configPath || !pluginVersion) {
      fail("usage: inputs-hash <project_root> <task_type> <config_path> <plugin_version>");
    }
    const config = readConfig(configPath);
    const candidatePatterns = config.candidate_files ?? [];
    const candidateFiles = expandGlobs(projectRoot, candidatePatterns);
    const hash = computeInputsHash({
      projectRoot,
      taskType,
      configPath,
      pluginVersion,
      candidateFiles,
    });
    console.log(hash);
    break;
  }

  case "check-cache": {
    const [projectRoot, taskType, expectedHash] = rest;
    if (!projectRoot || !taskType || !expectedHash) {
      fail("usage: check-cache <project_root> <task_type> <expected_inputs_hash>");
    }
    const result = checkCache(projectRoot, taskType, expectedHash);
    if (result.hit) {
      console.log(`HIT ${result.path}`);
    } else {
      console.log(`MISS ${result.path}`);
    }
    break;
  }

  case "expand-candidates": {
    const [projectRoot, configPath] = rest;
    if (!projectRoot || !configPath) {
      fail("usage: expand-candidates <project_root> <config_path>");
    }
    const config = readConfig(configPath);
    const files = expandGlobs(projectRoot, config.candidate_files ?? []);
    console.log(JSON.stringify(files));
    break;
  }

  case "write-cache": {
    const [projectRoot, taskType, inputsHash, resultPath] = rest;
    if (!projectRoot || !taskType || !inputsHash || !resultPath) {
      fail("usage: write-cache <project_root> <task_type> <inputs_hash> <result_path|->");
    }
    let body: string;
    if (resultPath === "-") {
      body = readFileSync(0, "utf-8");
    } else {
      body = readFileSync(resolve(resultPath), "utf-8");
    }
    const path = writeCache(projectRoot, taskType, inputsHash, body);
    console.log(path);
    break;
  }

  case "read-cache": {
    const [projectRoot, taskType] = rest;
    if (!projectRoot || !taskType) {
      fail("usage: read-cache <project_root> <task_type>");
    }
    const entry = readCache(projectRoot, taskType);
    if (!entry) {
      console.error(`no cache entry: ${cachePath(projectRoot, taskType)}`);
      process.exit(1);
    }
    process.stdout.write(entry.result_yaml);
    break;
  }

  case "project-hash": {
    const [projectRoot] = rest;
    if (!projectRoot) fail("usage: project-hash <project_root>");
    console.log(projectHash(projectRoot));
    break;
  }

  default:
    fail(
      `unknown subcommand "${subcommand ?? ""}". Expected one of: ` +
        "inputs-hash, check-cache, expand-candidates, write-cache, read-cache, project-hash.",
    );
}
