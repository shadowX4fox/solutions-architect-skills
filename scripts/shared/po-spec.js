#!/usr/bin/env node
// Moved to plugins/sa-requirements/scripts/shared/po-spec.js (sa-requirements ships it with BIAN alignment; sa-skills carries plugins/ in its root).
// Re-exported here for traceability.
const path = require('path');
module.exports = require(path.join(__dirname, '..', '..', 'plugins', 'sa-requirements', 'scripts', 'shared', 'po-spec.js'));
