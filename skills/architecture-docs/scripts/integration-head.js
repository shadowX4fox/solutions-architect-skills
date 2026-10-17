#!/usr/bin/env node
// Moved to scripts/shared/integration-head.js, the layer shared across skills. Re-exported here so an
// existing require keeps working.
const path = require('path');
module.exports = require(path.join(__dirname, '..', '..', '..', 'scripts', 'shared', 'integration-head.js'));
