#!/usr/bin/env bun
/**
 * Bun CLI for the architecture-explorer-headers skill.
 *
 * Subcommands:
 *   list <project_root>
 *     Print JSON array describing every doc file under docs/ and
 *     docs/components/ (recursive), one entry per file with
 *     {path, has_header, h1, byte_size}. ARCHITECTURE.md is excluded
 *     by design — it is the project's navigation index, exempt from
 *     EXPLORER_HEADER requirements.
 *
 *   validate <file_abs_path>
 *     Validate the EXPLORER_HEADER inside a single file. Exit 0 if
 *     valid, 1 if invalid, 2 if file unreadable. Prints errors and
 *     warnings to stderr.
 *
 *   has-header <file_abs_path>
 *     Print "yes" or "no". Exit 0 either way (it's a yes/no probe,
 *     not a validation gate). Useful for test scripts.
 */
import { existsSync, readFileSync } from "fs";
import { hasExplorerHeader, listDocFiles, validateHeader } from "./header-detector";

const [, , subcommand, ...rest] = process.argv;

function fail(msg: string): never {
  console.error(`header-cli: ${msg}`);
  process.exit(2);
}

switch (subcommand) {
  case "list": {
    const [projectRoot] = rest;
    if (!projectRoot) fail("usage: list <project_root>");
    if (!existsSync(projectRoot)) fail(`project_root does not exist: ${projectRoot}`);
    const entries = listDocFiles(projectRoot);
    console.log(JSON.stringify(entries, null, 2));
    break;
  }

  case "validate": {
    const [path] = rest;
    if (!path) fail("usage: validate <file_abs_path>");
    if (!existsSync(path)) fail(`file does not exist: ${path}`);
    const content = readFileSync(path, "utf-8");
    const result = validateHeader(content, path);
    if (result.errors.length > 0) {
      for (const e of result.errors) console.error(`error: ${e}`);
    }
    if (result.warnings.length > 0) {
      for (const w of result.warnings) console.error(`warn: ${w}`);
    }
    if (!result.valid) process.exit(1);
    console.log("valid");
    break;
  }

  case "has-header": {
    const [path] = rest;
    if (!path) fail("usage: has-header <file_abs_path>");
    if (!existsSync(path)) fail(`file does not exist: ${path}`);
    const content = readFileSync(path, "utf-8");
    console.log(hasExplorerHeader(content) ? "yes" : "no");
    break;
  }

  default:
    fail(
      `unknown subcommand "${subcommand ?? ""}". Expected one of: list, validate, has-header.`,
    );
}
