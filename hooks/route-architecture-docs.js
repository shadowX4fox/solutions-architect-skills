#!/usr/bin/env bun
// hooks/route-architecture-docs.js — UserPromptSubmit: when the project has ARCHITECTURE.md, a prompt the user typed gets
// the skill routing table (hooks/route-architecture-docs.payload.json, the payload's one source). Run by Bun, the suite's
// one runtime, on every OS — no `sh`, so Windows without Git Bash runs it as Linux and macOS do (11.8.2; before, a POSIX
// `sh` wrapper and a hand-wired PowerShell copy). Silent otherwise.
//
// Only a prompt the user typed (8.91.0): Claude Code fires UserPromptSubmit for the turns a sub-agent's hand-back or a
// background task's notification opens as well; those get nothing.
const fs = require('fs');
const path = require('path');

const project = process.env.CLAUDE_PROJECT_DIR || process.cwd();
if (!fs.existsSync(path.join(project, 'ARCHITECTURE.md'))) process.exit(0);
let input = '';
try { input = fs.readFileSync(0, 'utf8'); } catch { input = ''; }
if (/<task-notification>|\\u003ctask-notification|<agent-message|\\u003cagent-message|Another Claude session sent a message/.test(input)) process.exit(0);
process.stdout.write(fs.readFileSync(path.join(__dirname, 'route-architecture-docs.payload.json'), 'utf8'));
