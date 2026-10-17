#!/usr/bin/env node
// Moved to scripts/shared/mermaid-check.js, the layer shared across skills. Re-exported here, and runnable from here, so an
// existing require or command keeps working.
const path = require('path');
module.exports = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'mermaid-check.js'));
if (require.main === module) module.exports.main(process.argv.slice(2));
