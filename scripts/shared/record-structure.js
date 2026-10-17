#!/usr/bin/env node
// Moved to plugins/sa-records/scripts/shared/record-structure.js (sa-records ships it; sa-skills carries plugins/ in its root).
// Re-exported here, and runnable from here.
const path = require('path');
module.exports = require(path.join(__dirname, '..', '..', 'plugins', 'sa-records', 'scripts', 'shared', 'record-structure.js'));
if (require.main === module) module.exports.main(process.argv.slice(2));
