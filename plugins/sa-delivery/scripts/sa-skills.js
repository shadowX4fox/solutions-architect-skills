'use strict';
// sa-delivery reads the architecture through sa-skills: the facts ledger, the explorer, the judge, the name resolver, the
// Mermaid and integration helpers (scripts/, scripts/shared/), the Word / PDF renderer (tools/docgen) and the npm packages
// the contract checks run in-process (sa-skills' package.json). sa-skills installs sa-delivery as a dependency, so both are
// on disk; this finds it by `--sa-skills <dir>`, SA_SKILLS_DIR, the repo layout (plugins/sa-delivery inside sa-skills) or
// Claude Code's install registry, and stops with the fix when none holds it.
const fs = require('fs');
const path = require('path');

const MARKETPLACE = 'shadowx4fox-solution-architect-marketplace';
const holds = (d) => !!d && fs.existsSync(path.join(d, 'scripts', 'judge.js')) && fs.existsSync(path.join(d, 'scripts', 'shared', 'arch-facts.js'));
let found;

function saSkillsDir() {
  if (found !== undefined) return found;
  const flag = process.argv.includes('--sa-skills') ? process.argv[process.argv.indexOf('--sa-skills') + 1] : null;
  for (const d of [flag, process.env.SA_SKILLS_DIR, path.join(__dirname, '..', '..', '..')]) if (holds(d)) return (found = path.resolve(d));
  const claude = process.env.CLAUDE_CONFIG_DIR ? path.resolve(process.env.CLAUDE_CONFIG_DIR) : path.join(require('os').homedir(), '.claude');
  const resolver = path.join(claude, 'plugins', 'marketplaces', MARKETPLACE, 'scripts', 'plugin-root.ts');
  if (fs.existsSync(resolver)) {
    const r = require('child_process').spawnSync(process.execPath, [resolver, '--quiet'], { encoding: 'utf8' });
    const out = (r.stdout || '').trim();
    if (r.status === 0 && holds(out)) return (found = out);
  }
  return (found = null);
}

// the sa-skills path of a file, or exit 2 naming the fix — sa-delivery does not run without sa-skills
function fromSaSkills(...rel) {
  const dir = saSkillsDir();
  if (!dir) {
    console.error('sa-delivery: sa-skills not found — it holds the facts ledger, the explorer and the judge this skill reads the architecture with. Install it (claude plugin install sa-skills@' + MARKETPLACE + '), or pass --sa-skills <dir> / set SA_SKILLS_DIR.');
    process.exit(2);
  }
  return path.join(dir, ...rel);
}

// an npm package the plugin's code runs in-process (the contract checks' validators): resolved from sa-skills' install,
// where `bun install` puts them — an installed sa-delivery has no node_modules of its own. Throws like require() when absent.
function requireFromSaSkills(name) {
  const dir = saSkillsDir();
  if (!dir) { const e = new Error(`Cannot find module '${name}' (sa-skills not found)`); e.code = 'MODULE_NOT_FOUND'; throw e; }
  // held to sa-skills' package.json pin (scripts/shared/pinned.js): never Bun's auto-install, which takes the latest major
  return require(path.join(dir, 'scripts', 'shared', 'pinned.js')).pinnedRequire(dir, name);
}

module.exports = { saSkillsDir, fromSaSkills, requireFromSaSkills };
