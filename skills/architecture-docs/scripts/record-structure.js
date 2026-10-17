#!/usr/bin/env node
// Moved to scripts/shared/record-structure.js, the layer shared across skills (the ADR and TDR skills read it too).
// Re-exported here, and runnable from here, so a command written against the old path keeps working.
const path = require('path');
module.exports = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'record-structure.js'));
if (require.main === module) module.exports.main(process.argv.slice(2));
