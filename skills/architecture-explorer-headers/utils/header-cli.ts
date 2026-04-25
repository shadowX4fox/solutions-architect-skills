#!/usr/bin/env bun
// Bun CLI for the architecture-explorer-headers skill.
//
// Subcommands:
//   list <project_root>
//     Print JSON array describing every doc file under docs/ and
//     docs/components/ (recursive), one entry per file with
//     {path, has_header, h1, byte_size}. ARCHITECTURE.md is excluded
//     by design — it is the project's navigation index, exempt from
//     EXPLORER_HEADER requirements.
//
//   validate <file_abs_path>
//     Validate the EXPLORER_HEADER inside a single file. Exit 0 if
//     valid, 1 if invalid, 2 if file unreadable. Prints errors and
//     warnings to stderr.
//
//   has-header <file_abs_path>
//     Print "yes" or "no". Exit 0 either way (it's a yes/no probe,
//     not a validation gate). Useful for test scripts.
//
//   session-log <add|list|count|clear> [args]
//     Session-scoped editlog used by the PostToolUse hook to track
//     which architecture docs were edited in the current Claude
//     session. The /regenerate-explorer-headers --session slash
//     command consumes the log and clears it on success.
//
//       session-log add <file_abs_path>
//         Append one JSONL entry. Drops paths outside docs/, the
//         ARCHITECTURE.md navigation index, and component-index
//         README.md files. Exit 0 even on dropped paths so the hook
//         never blocks the user's edit. Project root is inferred from
//         the first ancestor of <file_abs_path> that contains a
//         CLAUDE.md, ARCHITECTURE.md, or .git directory; otherwise the
//         file's parent directory is used.
//       session-log list [--project-root <dir>]
//         Print deduped relative paths (latest-edit first), one per
//         line, to stdout. Exit 0 even if the editlog is missing.
//       session-log count [--project-root <dir>]
//         Print the deduped count to stdout. Exit 0 always.
//       session-log clear [--project-root <dir>]
//         Truncate the editlog. Exit 0 even if missing.
import { existsSync, readFileSync, statSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
import { hasExplorerHeader, listDocFiles, validateHeader } from "./header-detector";
import {
  appendEdit,
  clearSessionEdits,
  readSessionEdits,
} from "./session-log";

function inferProjectRoot(startPath: string): string {
  const start = isAbsolute(startPath) ? startPath : resolve(startPath);
  let cursor = existsSync(start) && statSync(start).isFile() ? dirname(start) : start;
  while (true) {
    if (
      existsSync(resolve(cursor, "ARCHITECTURE.md")) ||
      existsSync(resolve(cursor, "CLAUDE.md")) ||
      existsSync(resolve(cursor, ".git"))
    ) {
      return cursor;
    }
    const parent = dirname(cursor);
    if (parent === cursor) return existsSync(start) && statSync(start).isFile() ? dirname(start) : start;
    cursor = parent;
  }
}

function takeFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  const value = args[idx + 1];
  args.splice(idx, 2);
  return value;
}

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

  case "session-log": {
    const [sub, ...sessionArgs] = rest;
    switch (sub) {
      case "add": {
        const [filePath] = sessionArgs;
        if (!filePath) {
          // Hook may fire without a path (no-op tool). Exit 0 silently.
          break;
        }
        const root = inferProjectRoot(filePath);
        appendEdit(filePath, root);
        break;
      }
      case "list": {
        const args = [...sessionArgs];
        const explicitRoot = takeFlag(args, "--project-root");
        const root = explicitRoot ? resolve(explicitRoot) : inferProjectRoot(process.cwd());
        const entries = readSessionEdits(root);
        for (const e of entries) console.log(e.relativePath);
        break;
      }
      case "count": {
        const args = [...sessionArgs];
        const explicitRoot = takeFlag(args, "--project-root");
        const root = explicitRoot ? resolve(explicitRoot) : inferProjectRoot(process.cwd());
        console.log(String(readSessionEdits(root).length));
        break;
      }
      case "clear": {
        const args = [...sessionArgs];
        const explicitRoot = takeFlag(args, "--project-root");
        const root = explicitRoot ? resolve(explicitRoot) : inferProjectRoot(process.cwd());
        clearSessionEdits(root);
        break;
      }
      default:
        fail(`unknown session-log subcommand "${sub ?? ""}". Expected: add, list, count, clear.`);
    }
    break;
  }

  default:
    fail(
      `unknown subcommand "${subcommand ?? ""}". Expected one of: list, validate, has-header, session-log.`,
    );
}
