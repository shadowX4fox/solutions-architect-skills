#!/usr/bin/env bun
// CI/CD for an architecture and the service repositories built from it, by code (10.13.0). Two sides:
//
//   architecture  the architecture repository — the five workflows (gates, release, handoff, index, Tier 0 on a RUN team)
//                 copied from the plugin's templates with the plugin's pin, the RUN-team policy, the labels, and the
//                 repository's variables, secrets and settings read with gh
//   service       a service (dev) repository — the binding (.architecture.json), the architecture MCP server for the IDE
//                 (.mcp.json), and for an unattended build its two workflows (architecture-build.yml and, opt in,
//                 architecture-build-merge.yml) with their secrets and variables
//
// Every check prints ✓ / ✗ / ! with the fix. --write writes local files only, and never over a workflow that differs from
// its template beyond the pin — changes of its own, or an older template: the code cannot tell them apart, so the user
// reads the diff and names the files to replace (--replace); variables, secrets, labels and settings are the user's: the
// fix is a command to run after a yes.
//
//   bun ci-setup.js architecture <project> [--runner <label,…>] [--write] [--replace <file,…>] [--json]
//   bun ci-setup.js service <dir> [--architecture <owner/repo>] [--project <key>] [--component <slug>] [--server <mcp_url>]
//                   [--attended] [--merge --tests "<workflow name>"] [--write] [--json]
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fromSaSkills } = require('../../../scripts/sa-skills.js');

const SKILL = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const exists = (f) => fs.existsSync(f);
const readJson = (f) => { try { return JSON.parse(read(f)); } catch (e) { return null; } };
const PIN = /SA_PLUGIN_REF: v\d+\.\d+\.\d+/g;
const pluginVersion = () => JSON.parse(read(fromSaSkills('.claude-plugin', 'plugin.json'))).version;

// gh, answered as GitHub would; a test passes its own
const ghDefault = (args) => spawnSync('gh', args, { encoding: 'utf8' });
function ghJson(gh, args) { const r = gh(args); if (r.status !== 0) return { error: (r.stderr || '').trim().split('\n')[0] || 'gh failed' }; try { return { value: JSON.parse(r.stdout || 'null') }; } catch (e) { return { error: 'gh answered no JSON' }; } }
function settings(gh, repo) {
  const v = ghJson(gh, ['variable', 'list', '-R', repo, '--json', 'name,value']), s = ghJson(gh, ['secret', 'list', '-R', repo, '--json', 'name']);
  return { error: v.error || s.error, vars: Object.fromEntries((v.value || []).map((x) => [x.name, x.value])), secrets: new Set((s.value || []).map((x) => x.name)) };
}
function githubRepo(dir) {
  const r = spawnSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], { encoding: 'utf8' });
  const m = (r.stdout || '').trim().match(/github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?$/);
  return m ? m[1] : null;
}
const row = (rows, state, item, fix) => rows.push({ state, item, ...(fix ? { fix } : {}) });

// ---- workflows: the template rendered for this repository, compared to the copy in .github/workflows ----------------
// a workflow is current, stale (only the pin differs), modified (changes of its own — never overwritten) or missing
function compareWorkflow(target, rendered) {
  if (!exists(target)) return 'missing';
  const have = read(target);
  if (have === rendered) return 'current';
  return have.replace(PIN, 'SA_PLUGIN_REF: v*') === rendered.replace(PIN, 'SA_PLUGIN_REF: v*') ? 'stale' : 'modified';
}
function placeWorkflows(root, list, rows, write, replace = []) {
  const dir = path.join(root, '.github', 'workflows');
  for (const w of list) {
    const target = path.join(dir, w.file), state = compareWorkflow(target, w.text), rel = path.relative(root, target);
    if (state === 'current') { row(rows, '✓', `${rel} — current`); continue; }
    if (state === 'modified' && !(write && replace.includes(w.file))) { row(rows, '!', `${rel} — differs from the template (changes of its own, or an older template); not rewritten`, `diff ${rel} ${w.template} — then --write --replace ${w.file}, or carry the change by hand`); continue; }
    if (state === 'modified') { fs.writeFileSync(target, w.text); row(rows, '✓', `${rel} — replaced with the template`); continue; }
    if (write) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(target, state === 'stale' ? read(target).replace(PIN, w.pin) : w.text); row(rows, '✓', `${rel} — ${state === 'stale' ? 'pin moved' : 'written'}`); }
    else row(rows, '✗', `${rel} — ${state === 'stale' ? 'pinned to another plugin version' : 'missing'}`, 'run again with --write');
  }
}

// ---- the architecture repository -------------------------------------------------------------------------------------
function architectureWorkflows(root, opts = {}) {
  const pin = `SA_PLUGIN_REF: v${opts.version || pluginVersion()}`, support = require(fromSaSkills('scripts', 'shared', 'support.js')).supportOf(root);
  const life = fromSaSkills('skills', 'architecture-lifecycle', 'ci'), idx = path.join(SKILL, 'architecture-index-export', 'ci');
  const runner = opts.runner ? `[${opts.runner.split(',').map((x) => x.trim()).filter(Boolean).join(', ')}]` : null;
  const render = (template, file, edit = (t) => t) => ({ template, file, pin, text: edit(read(template).replace(PIN, pin)) });
  const list = [
    render(path.join(life, 'architecture-gates.yml'), 'architecture-gates.yml'),
    render(path.join(life, 'architecture-release.yml'), 'architecture-release.yml', (t) => (runner ? t.replace('runs-on: [self-hosted, sa-index]', `runs-on: ${runner}`) : t)),
    render(path.join(life, 'architecture-handoff.yml'), 'architecture-handoff.yml'),
    // phase 1 is the release workflow's index job: the index workflow keeps phase 2 and the manual publish, no tag trigger
    render(path.join(idx, 'github-actions.yml'), 'architecture-index.yml', (t) => {
      t = t.replace(/^    tags: \['architecture-v\*'\].*\n/m, '');
      return runner ? t.replace(/^(  index:\n    runs-on: )ubuntu-latest$/m, `$1${runner}`) : t;
    }),
  ];
  if (support.support === 'run') list.push(render(path.join(life, 'architecture-tier0.yml'), 'architecture-tier0.yml'));
  return { list, support };
}
function architecture(root, opts = {}) {
  root = path.resolve(root);
  const gh = opts.gh || ghDefault, rows = [], repo = opts.repo || githubRepo(root);
  if (!exists(path.join(root, 'ARCHITECTURE.md'))) row(rows, '✗', 'ARCHITECTURE.md — not an architecture repository', 'create the architecture first (architecture-docs)');
  if (!repo) row(rows, '✗', 'origin — not a GitHub repository; the workflows are GitHub Actions', 'add a GitHub origin, or use the Gitea / Azure examples under architecture-index-export/ci/');
  const { list, support } = architectureWorkflows(root, opts);
  placeWorkflows(root, list, rows, opts.write, opts.replace);
  row(rows, support.support === 'run' ? '✓' : '·', `support — ${support.reason}`, support.support === 'run' ? null : 'a RUN team: support.js <project> --declare run (then the Tier 0 workflow and its labels)');
  if (support.support === 'run') row(rows, '·', `tier0.auto — ${support.auto && support.auto.length ? support.auto.join(', ') : 'none: every Tier 0 key is a person\'s'}`, 'support.js <project> --declare-auto all|none|<kinds> — the kinds the repository keys for a trusted agent');
  if (!repo) return { side: 'architecture', root, repo, rows };
  const st = settings(gh, repo), cmd = (k, v) => `gh variable set ${k} -R ${repo} --body ${v}`, sec = (k) => `gh secret set ${k} -R ${repo}`;
  if (st.error) row(rows, '!', `variables and secrets — not readable (${st.error})`, 'gh auth login with admin on the repository');
  else {
    const need = (k, why, fix) => row(rows, st.vars[k] ? '✓' : '✗', `variable ${k}${st.vars[k] ? ` = ${st.vars[k]}` : ` — ${why}`}`, st.vars[k] ? null : fix);
    need('SA_INDEX_PROJECT_KEY', 'the index project key, the same on every release', cmd('SA_INDEX_PROJECT_KEY', '<key>'));
    need('SA_INDEX_SERVER', 'the architecture MCP server the index is published to', cmd('SA_INDEX_SERVER', '<https://server>'));
    row(rows, st.secrets.has('CLAUDE_CODE_OAUTH_TOKEN') ? '✓' : '✗', 'secret CLAUDE_CODE_OAUTH_TOKEN — the handoff kit and Tier 0 writes', st.secrets.has('CLAUDE_CODE_OAUTH_TOKEN') ? null : '/install-github-app in Claude Code, on this repository');
    row(rows, st.secrets.has('SA_INDEX_TOKEN') ? '✓' : '·', 'secret SA_INDEX_TOKEN — only when the server asks for one', st.secrets.has('SA_INDEX_TOKEN') ? null : sec('SA_INDEX_TOKEN'));
    row(rows, st.vars.SA_HANDOFF_AUTOMERGE === 'true' ? '✓' : '·', `variable SA_HANDOFF_AUTOMERGE${st.vars.SA_HANDOFF_AUTOMERGE ? ` = ${st.vars.SA_HANDOFF_AUTOMERGE}` : ' — unset: the kit\'s pull request waits for a reviewer, and its merge publishes the build packs'}`, st.vars.SA_HANDOFF_AUTOMERGE === 'true' ? null : cmd('SA_HANDOFF_AUTOMERGE', 'true'));
    if (support.support === 'run') {
      row(rows, st.vars.SA_TIER0_AUTOMERGE === 'true' ? '✓' : '·', `variable SA_TIER0_AUTOMERGE${st.vars.SA_TIER0_AUTOMERGE ? ` = ${st.vars.SA_TIER0_AUTOMERGE}` : ' — unset: a Tier 0 pull request waits for a reviewer'}`, st.vars.SA_TIER0_AUTOMERGE === 'true' ? null : cmd('SA_TIER0_AUTOMERGE', 'true'));
      if (support.auto && support.auto.length) row(rows, st.vars.SA_TIER0_TRUSTED_AGENTS ? '✓' : '✗', `variable SA_TIER0_TRUSTED_AGENTS${st.vars.SA_TIER0_TRUSTED_AGENTS ? ` = ${st.vars.SA_TIER0_TRUSTED_AGENTS}` : ' — tier0.auto is declared, but no agent is trusted'}`, st.vars.SA_TIER0_TRUSTED_AGENTS ? null : cmd('SA_TIER0_TRUSTED_AGENTS', '<build-agent-login>'));
    }
    const repos = st.vars.SA_SERVICE_REPOS;
    row(rows, repos ? '✓' : '·', `variable SA_SERVICE_REPOS${repos ? ` = ${repos}` : ' — no service repository is told of a release'}`, repos ? null : cmd('SA_SERVICE_REPOS', '<owner/service,…>'));
    if (repos) row(rows, st.secrets.has('SA_DISPATCH_TOKEN') ? '✓' : '✗', 'secret SA_DISPATCH_TOKEN — dispatches architecture-released to SA_SERVICE_REPOS', st.secrets.has('SA_DISPATCH_TOKEN') ? null : `${sec('SA_DISPATCH_TOKEN')}  (a token with write on each service repository)`);
  }
  const pr = ghJson(gh, ['api', `repos/${repo}/actions/permissions/workflow`]);
  if (!pr.error) row(rows, pr.value && pr.value.can_approve_pull_request_reviews ? '✓' : '✗', 'setting — Actions may create pull requests (the handoff kit, Tier 0)', pr.value && pr.value.can_approve_pull_request_reviews ? null : `gh api -X PUT repos/${repo}/actions/permissions/workflow -F can_approve_pull_request_reviews=true`);
  if (support.support === 'run') {
    try {
      const esc = require(fromSaSkills('scripts', 'shared', 'escalate.js')), names = esc.labelSet().map((l) => l.name);
      const have = ghJson(gh, ['label', 'list', '-R', repo, '--limit', '500', '--json', 'name']);
      if (!have.error) { const set = new Set((have.value || []).map((l) => l.name)), miss = names.filter((n) => !set.has(n));
        row(rows, miss.length ? '✗' : '✓', `labels — ${miss.length ? `${miss.length} of ${names.length} missing: ${miss.join(', ')}` : `all ${names.length}`}`, miss.length ? `escalate.js labels ${root} --create` : null); }
    } catch (e) { row(rows, '!', `labels — not checked (${e.message})`); }
  }
  return { side: 'architecture', root, repo, rows };
}

// ---- a service repository --------------------------------------------------------------------------------------------
function service(dir, opts = {}) {
  dir = path.resolve(dir);
  const gh = opts.gh || ghDefault, rows = [], repo = opts.repo || githubRepo(dir);
  const bf = path.join(dir, '.architecture.json'), binding = readJson(bf) || {};
  // the binding: project, component, server and supervision are the team's; architecture_version and pack_revision the
  // first build records from get_build_pack — never written here
  const want = { ...(opts.server ? { server: opts.server } : {}), ...(opts.project ? { project: opts.project } : {}), ...(opts.component ? { component: opts.component } : {}),
    ...(opts.attended ? {} : { supervision: 'unattended' }) };
  const next = { ...binding, ...want };
  if (opts.attended) delete next.supervision;
  const missing = ['server', 'project', 'component'].filter((k) => !next[k]);
  const changed = JSON.stringify(next) !== JSON.stringify(binding);
  if (missing.length) row(rows, '✗', `.architecture.json — no ${missing.join(', ')}`, `--${missing.map((k) => (k === 'server' ? 'server <mcp_url>' : `${k} <${k === 'project' ? 'key' : 'slug'}>`)).join(' --')}`);
  if (changed && opts.write && !missing.length) { fs.writeFileSync(bf, JSON.stringify(next, null, 2) + '\n'); row(rows, '✓', `.architecture.json — written (${Object.keys(want).join(', ')})`); }
  else if (changed && !missing.length) row(rows, '✗', `.architecture.json — ${exists(bf) ? 'differs' : 'missing'}: ${Object.keys(want).filter((k) => binding[k] !== next[k]).join(', ') || 'supervision'}`, 'run again with --write');
  else if (!missing.length) row(rows, '✓', `.architecture.json — ${next.project} / ${next.component}${next.supervision ? `, ${next.supervision}` : ', attended'}`);
  if (!next.architecture_version) row(rows, '·', '.architecture.json — no architecture_version / pack_revision yet: the first build records them from get_build_pack');
  // the IDE's MCP server: one entry with the binding's URL, whatever its name; added as "architecture", the rest kept
  const mf = path.join(dir, '.mcp.json'), mcp = readJson(mf) || { mcpServers: {} }, servers = mcp.mcpServers || {};
  const has = Object.entries(servers).find(([, v]) => v && v.url === next.server);
  if (has) row(rows, '✓', `.mcp.json — "${has[0]}" → ${next.server}`);
  else if (next.server && opts.write) { mcp.mcpServers = { ...servers, architecture: { type: 'http', url: next.server } }; fs.writeFileSync(mf, JSON.stringify(mcp, null, 2) + '\n'); row(rows, '✓', `.mcp.json — "architecture" → ${next.server} added`); }
  else row(rows, '✗', `.mcp.json — no server at ${next.server || '(no server)'}: the IDE cannot reach the architecture`, 'run again with --write');
  if (opts.attended) return { side: 'service', root: dir, repo, rows };
  // unattended: the build workflow, and the merge workflow when the team opts in
  const tpl = path.join(SKILL, 'architecture-index-export', 'ci', 'service'), list = [{ template: path.join(tpl, 'architecture-build.yml'), file: 'architecture-build.yml' }];
  if (opts.merge) {
    if (!opts.tests) row(rows, '✗', 'architecture-build-merge.yml — no test workflow named', '--tests "<the name: of this repository\'s test workflow>"');
    else list.push({ template: path.join(tpl, 'architecture-build-merge.yml'), file: 'architecture-build-merge.yml', edit: (t) => t.replace('workflows: ["Tests"]', `workflows: [${JSON.stringify(opts.tests)}]`) });
  }
  placeWorkflows(dir, list.map((w) => ({ ...w, pin: '', text: (w.edit || ((t) => t))(read(w.template)) })), rows, opts.write, opts.replace);
  if (opts.merge && opts.tests && !(exists(path.join(dir, '.github', 'workflows')) && fs.readdirSync(path.join(dir, '.github', 'workflows')).some((f) => /\.ya?ml$/.test(f) && new RegExp(`^name:\\s*["']?${opts.tests.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*$`, 'm').test(read(path.join(dir, '.github', 'workflows', f))))))
    row(rows, '✗', `no workflow named "${opts.tests}" — the merge waits for checks that never run`, 'add the repository\'s test workflow (its `name:` is what --tests names)');
  if (!repo) { row(rows, '✗', 'origin — not a GitHub repository; the workflows are GitHub Actions'); return { side: 'service', root: dir, repo, rows }; }
  const st = settings(gh, repo), cmd = (k, v) => `gh variable set ${k} -R ${repo} --body ${v}`;
  if (st.error) row(rows, '!', `variables and secrets — not readable (${st.error})`, 'gh auth login with admin on the repository');
  else {
    row(rows, st.secrets.has('CLAUDE_CODE_OAUTH_TOKEN') ? '✓' : '✗', 'secret CLAUDE_CODE_OAUTH_TOKEN — the build', st.secrets.has('CLAUDE_CODE_OAUTH_TOKEN') ? null : '/install-github-app in Claude Code, on this repository');
    row(rows, st.secrets.has('SA_BUILD_TOKEN') ? '✓' : '✗', 'secret SA_BUILD_TOKEN — the build agent\'s identity: its pull request here, its issues in the architecture repository', st.secrets.has('SA_BUILD_TOKEN') ? null : `gh secret set SA_BUILD_TOKEN -R ${repo}  (a machine user's or a GitHub App's token)`);
    row(rows, st.vars.SA_INDEX_MCP_URL || next.server ? '✓' : '✗', `the MCP server — ${st.vars.SA_INDEX_MCP_URL ? `variable SA_INDEX_MCP_URL = ${st.vars.SA_INDEX_MCP_URL}` : next.server ? `.architecture.json server = ${next.server}` : 'none'}`, st.vars.SA_INDEX_MCP_URL || next.server ? null : cmd('SA_INDEX_MCP_URL', '<mcp_url>'));
    if (/localhost|127\.0\.0\.1/.test(st.vars.SA_INDEX_MCP_URL || next.server || '') && !st.vars.SA_BUILD_RUNS_ON) row(rows, '!', 'the MCP server is on localhost — a GitHub-hosted runner cannot reach it', cmd('SA_BUILD_RUNS_ON', '\'["self-hosted","<label>"]\''));
    if (opts.merge) row(rows, st.vars.SA_BUILD_AGENT ? '✓' : '✗', `variable SA_BUILD_AGENT${st.vars.SA_BUILD_AGENT ? ` = ${st.vars.SA_BUILD_AGENT}` : ' — the login whose pull requests merge on their own'}`, st.vars.SA_BUILD_AGENT ? null : cmd('SA_BUILD_AGENT', '<build-agent-login>'));
  }
  // the architecture repository's side of the pair: it tells this repository of a release, and trusts its agent
  if (opts.architecture) {
    const a = settings(gh, opts.architecture);
    if (a.error) row(rows, '!', `${opts.architecture} — its variables are not readable (${a.error})`);
    else {
      const listed = String(a.vars.SA_SERVICE_REPOS || '').split(/[\s,]+/).map((x) => x.toLowerCase()).includes(repo.toLowerCase());
      row(rows, listed ? '✓' : '✗', `${opts.architecture} SA_SERVICE_REPOS ${listed ? 'lists' : 'does not list'} ${repo}`, listed ? null : `gh variable set SA_SERVICE_REPOS -R ${opts.architecture} --body "${[a.vars.SA_SERVICE_REPOS, repo].filter(Boolean).join(',')}"`);
      if (!a.secrets.has('SA_DISPATCH_TOKEN')) row(rows, '✗', `${opts.architecture} has no SA_DISPATCH_TOKEN — it cannot tell this repository of a release`, `gh secret set SA_DISPATCH_TOKEN -R ${opts.architecture}`);
      if (!st.error && st.vars.SA_BUILD_AGENT && a.vars.SA_TIER0_TRUSTED_AGENTS !== undefined) {
        const trusted = String(a.vars.SA_TIER0_TRUSTED_AGENTS || '').split(/[\s,]+/).map((x) => x.toLowerCase()).includes(st.vars.SA_BUILD_AGENT.toLowerCase());
        row(rows, trusted ? '✓' : '·', `${opts.architecture} SA_TIER0_TRUSTED_AGENTS ${trusted ? 'trusts' : 'does not trust'} ${st.vars.SA_BUILD_AGENT}${trusted ? '' : ' — its Tier 0 requests wait for a person'}`);
      }
    }
  }
  return { side: 'service', root: dir, repo, rows };
}

module.exports = { architecture, service, compareWorkflow, architectureWorkflows, githubRepo };

if (require.main === module) {
  const a = process.argv.slice(2), side = a[0], target = a[1] && !a[1].startsWith('--') ? a[1] : '.';
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const o = { write: a.includes('--write'), runner: opt('--runner'), architecture: opt('--architecture'), project: opt('--project'), component: opt('--component'),
    server: opt('--server'), attended: a.includes('--attended'), merge: a.includes('--merge'), tests: opt('--tests'),
    replace: String(opt('--replace') || '').split(',').map((x) => x.trim()).filter(Boolean) };
  if (side !== 'architecture' && side !== 'service') { console.error('Usage: bun ci-setup.js architecture <project> [--runner <label,…>] [--write] [--replace <file,…>] [--json]\n       bun ci-setup.js service <dir> [--architecture <owner/repo>] [--project <key>] [--component <slug>] [--server <mcp_url>] [--attended] [--merge --tests "<name>"] [--write] [--json]'); process.exit(2); }
  const r = side === 'architecture' ? architecture(target, o) : service(target, o);
  if (a.includes('--json')) { console.log(JSON.stringify(r, null, 1)); process.exit(r.rows.some((x) => x.state === '✗') ? 1 : 0); }
  console.log(`CI SETUP — ${r.side}: ${r.root}${r.repo ? ` (${r.repo})` : ''}`);
  for (const x of r.rows) console.log(`${x.state} ${x.item}${x.fix ? `\n    → ${x.fix}` : ''}`);
  const open = r.rows.filter((x) => x.state === '✗').length;
  console.log(open ? `${open} to do` : 'nothing to do');
  process.exit(open ? 1 : 0);
}
