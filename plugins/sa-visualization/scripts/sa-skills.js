'use strict';
// sa-visualization reads the architecture through sa-skills: the component facts, the capacity tables, the header parser,
// the judge, the name resolver and the findings contract (scripts/, scripts/shared/). sa-skills installs sa-visualization as a
// dependency, so both are on disk; this finds it by `--sa-skills <dir>`, SA_SKILLS_DIR, the repo layout
// (plugins/sa-visualization inside sa-skills) or Claude Code's install registry, and stops with the fix when none holds it.
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

// the sa-skills path of a file, or exit 2 naming the fix — sa-visualization does not run without sa-skills
function fromSaSkills(...rel) {
  const dir = saSkillsDir();
  if (!dir) {
    console.error('sa-visualization: sa-skills not found — it holds the facts ledger, the explorer and the judge this skill reads the architecture with. Install it (claude plugin install sa-skills@' + MARKETPLACE + '), or pass --sa-skills <dir> / set SA_SKILLS_DIR.');
    process.exit(2);
  }
  return path.join(dir, ...rel);
}

module.exports = { saSkillsDir, fromSaSkills };
