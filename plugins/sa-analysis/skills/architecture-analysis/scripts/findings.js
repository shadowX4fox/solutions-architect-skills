// Moved to scripts/shared/findings.js, the layer shared across skills: the findings contract the analysis skill
// writes and the command center reads. Re-exported here so an existing require keeps working.
module.exports = require(require('../../../scripts/sa-skills.js').fromSaSkills('scripts', 'shared', 'findings.js'));
