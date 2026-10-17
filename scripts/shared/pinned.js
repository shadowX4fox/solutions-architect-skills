'use strict';
// pinned.js — load an npm package only as `bun install` put it: from <root>/node_modules, at a version inside the range
// <root>/package.json pins. Never through Bun's auto-install.
//
//   const { pinnedRequire, pinState } = require('<sa-skills>/scripts/shared/pinned.js');
//   const docx = pinnedRequire(__dirname, 'docx', { installIn }); // root = the folder whose package.json pins it;
//                                                                // installIn = where `bun install` runs (a workspace's root)
//   pinState(root, 'graphql')  →  { name, range, version, ok, reason }
//
// Why: Claude Code's plugin install does not run `bun install`, and with no node_modules Bun auto-installs a missing
// package on first use — at the registry's latest version, whatever package.json pins (measured 2026-10-06 on an installed
// sa-skills 8.129.0: graphql 17.0.2 against `^16.14.2` — a major the contract checks were never run on). The range test
// stops that; the exact version inside the range is the lockfile's, which `bun install` applies. A shipped `bunfig.toml`
// (`install.auto = "disable"`) does not help: Bun reads it from the working directory, which is the user's project.
// So the check is here: a package that is not on disk, or not at its pin, is refused with the command that fixes it, and
// a require never reaches the auto-installer (with node_modules present, Bun resolves locally).
const fs = require('fs');
const path = require('path');

const nameOf = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const satisfies = (v, range) => (typeof Bun !== 'undefined' && Bun.semver ? Bun.semver.satisfies(v, range) : true);   // Bun is the runtime; anything else skips the range test

// what <root> pins for `name`, what is installed under <root>/node_modules, and whether the two agree
function pinState(root, spec) {
  const name = nameOf(spec), pkg = readJson(path.join(root, 'package.json')) || {};
  const range = (pkg.dependencies || {})[name] || (pkg.optionalDependencies || {})[name] || (pkg.devDependencies || {})[name] || null;
  const installed = readJson(path.join(root, 'node_modules', name, 'package.json'));
  const version = installed && installed.version || null;
  if (!version) return { name, range, version: null, ok: false, reason: 'not installed' };
  if (range && !satisfies(version, range)) return { name, range, version, ok: false, reason: `${version} installed, pinned ${range}` };
  return { name, range, version, ok: true, reason: null };
}

// require(spec) from <root>, or throw a MODULE_NOT_FOUND naming the fix — callers that treat a missing package as
// "absent" (try { … } catch) keep doing so, and now also treat an off-pin one that way
function pinnedRequire(root, spec, opts = {}) {
  const s = pinState(root, spec);
  if (!s.ok) {
    const e = new Error(`${s.name}: ${s.reason} — run \`bun install\` in ${opts.installIn || root}${s.range ? ` (pinned ${s.range})` : ''}`);
    e.code = 'MODULE_NOT_FOUND'; e.pin = s;
    throw e;
  }
  return require('module').createRequire(path.join(root, 'package.json'))(spec);
}

module.exports = { pinnedRequire, pinState, nameOf };
