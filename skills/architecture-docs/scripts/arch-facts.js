#!/usr/bin/env node
// Moved to scripts/shared/arch-facts.js, the layer shared across skills (the facts ledger every category reads).
// Re-exported here, and runnable from here, so a command written against the old path keeps working.
const path = require('path');
module.exports = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'arch-facts.js'));
if (require.main === module) module.exports.main(process.argv.slice(2));
