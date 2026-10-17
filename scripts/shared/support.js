#!/usr/bin/env bun
// Lives in plugins/sa-records/scripts/shared/support.js (sa-records ships it; sa-skills carries plugins/ in its root).
// Re-exported here, and runnable from here.
const path = require('path');
const MOVED = path.join(__dirname, '..', '..', 'plugins', 'sa-records', 'scripts', 'shared', 'support.js');
if (require.main === module) {
  const r = require('child_process').spawnSync(process.execPath, [MOVED, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
module.exports = require(MOVED);
