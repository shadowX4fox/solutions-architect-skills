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
// reads the diff and names the files to replace (--replace). A required variable (✗) with a known value is set by
// --settings, after the user's yes, on either repository of the pair (10.15.0); a secret never is — its fix is a command
// for the user — and labels and the workflow permission stay a command too.
//
//   bun ci-setup.js architecture <project> [--runner <label,…>] [--write] [--replace <file,…>] [--settings] [--json]
//   bun ci-setup.js service <dir> [--architecture <owner/repo>] [--project <key>] [--component <slug>] [--server <mcp_url>]
//                   [--attended [--review]] [--merge --tests "<workflow name>"] [--agent <login>] [--runs-on <label,…>]
//                   [--write] [--settings] [--json]
//
// --merge is full auto: the build's pull request merges on its tests, so a release reaches it with no person only when the
// architecture merges its kit (SA_HANDOFF_AUTOMERGE) and trusts the agent's Tier 0 requests (SA_TIER0_TRUSTED_AGENTS).
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
const row = (rows, state, item, fix, apply) => rows.push({ state, item, ...(fix ? { fix } : {}), ...(apply ? { apply } : {}) });
// a repository variable: the command to print, and — with a value, no placeholder — the gh call --settings makes
const variable = (repo, k, v) => ({ fix: `gh variable set ${k} -R ${repo} --body ${v == null ? `<${k.toLowerCase()}>` : /^[\w./:@,-]+$/.test(v) ? v : `'${v}'`}`,
  apply: v == null ? undefined : ['variable', 'set', k, '-R', repo, '--body', v] });
const varRow = (rows, state, item, repo, k, v) => { const x = variable(repo, k, v); row(rows, state, item, state === '✓' ? null : x.fix, state === '✓' ? undefined : x.apply); };
const addTo = (list, v) => [...String(list || '').split(/[\s,]+/).filter(Boolean), v].join(',');
const inList = (list, v) => String(list || '').split(/[\s,]+/).map((x) => x.toLowerCase()).includes(String(v).toLowerCase());
// --settings: every required row (✗) that carries a gh call is set, and says so; the others are left as they are
function applySettings(gh, rows) {
  for (const x of rows) {
    if (x.state !== '✗' || !x.apply) continue;
    const r = gh(x.apply);
    if (r.status === 0) { x.state = '✓'; x.item = `${x.done || x.item} — set`; delete x.fix; }
    else { x.state = '!'; x.item += ` — not set (${(r.stderr || '').trim().split('\n')[0] || 'gh failed'})`; }
    delete x.apply; delete x.done;
  }
}

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
  if (opts.settings) applySettings(gh, rows);
  return { side: 'architecture', root, repo, rows };
}

// the review is a required status check of the default branch, or it blocks nothing: added to the checks a protection
// already requires, or — no protection yet — a protection that requires it of everyone, admins included; any other protection
// is the team's, and the command is printed, never run
const REVIEW_CHECK = 'Architecture review';
function reviewProtection(gh, repo, rows) {
  const meta = ghJson(gh, ['api', `repos/${repo}`]);
  if (meta.error) { row(rows, '!', `branch protection — not readable (${meta.error})`); return; }
  const branch = (meta.value && meta.value.default_branch) || 'main', base = `repos/${repo}/branches/${branch}/protection`;
  const p = ghJson(gh, ['api', base]);
  const item = (what) => `branch protection — "${REVIEW_CHECK}" ${what} on ${branch}`;
  if (p.error && /404|not protected/i.test(p.error)) {
    row(rows, '✗', item('not required (the branch is not protected): a failing review blocks nothing'), `gh api -X PUT ${base} -F required_status_checks[strict]=false -F 'required_status_checks[contexts][]=${REVIEW_CHECK}' -F enforce_admins=true -F required_pull_request_reviews=null -F restrictions=null`,
      ['api', '-X', 'PUT', base, '-F', 'required_status_checks[strict]=false', '-F', `required_status_checks[contexts][]=${REVIEW_CHECK}`, '-F', 'enforce_admins=true', '-F', 'required_pull_request_reviews=null', '-F', 'restrictions=null']);
    rows[rows.length - 1].done = item('required, enforced for admins');
    return;
  }
  if (p.error) { row(rows, '!', `branch protection — not readable (${p.error})`, 'gh auth login with admin on the repository'); return; }
  const rsc = p.value && p.value.required_status_checks, ctx = rsc ? [...(rsc.contexts || []), ...((rsc.checks || []).map((c) => c.context))] : [];
  if (ctx.includes(REVIEW_CHECK)) { row(rows, '✓', item('required')); return; }
  if (rsc) { row(rows, '✗', item('not among the required checks'), `gh api -X POST ${base}/required_status_checks/contexts -f 'contexts[]=${REVIEW_CHECK}'`, ['api', '-X', 'POST', `${base}/required_status_checks/contexts`, '-f', `contexts[]=${REVIEW_CHECK}`]); rows[rows.length - 1].done = item('required'); }
  else row(rows, '!', item('not required: the branch is protected without status checks — add it to that protection (Settings → Branches)'));
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
  if (opts.attended && !opts.review) return { side: 'service', root: dir, repo, rows };
  // unattended: the build workflow, and the merge workflow when the team opts in; --review: the pull requests' reviewer
  const tpl = path.join(SKILL, 'architecture-index-export', 'ci', 'service'), list = [];
  if (!opts.attended) {
    list.push({ template: path.join(tpl, 'architecture-build.yml'), file: 'architecture-build.yml' });
    if (opts.merge) {
      if (!opts.tests) row(rows, '✗', 'architecture-build-merge.yml — no test workflow named', '--tests "<the name: of this repository\'s test workflow>"');
      else list.push({ template: path.join(tpl, 'architecture-build-merge.yml'), file: 'architecture-build-merge.yml', edit: (t) => t.replace('workflows: ["Tests"]', `workflows: [${JSON.stringify(opts.tests)}]`) });
    }
  }
  if (opts.review) list.push({ template: path.join(tpl, 'architecture-review.yml'), file: 'architecture-review.yml' });
  const pin = `SA_PLUGIN_REF: v${opts.version || pluginVersion()}`;
  placeWorkflows(dir, list.map((w) => ({ ...w, pin, text: (w.edit || ((t) => t))(read(w.template)).replace(PIN, pin) })), rows, opts.write, opts.replace);
  if (opts.merge && opts.tests && !(exists(path.join(dir, '.github', 'workflows')) && fs.readdirSync(path.join(dir, '.github', 'workflows')).some((f) => /\.ya?ml$/.test(f) && new RegExp(`^name:\\s*["']?${opts.tests.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*$`, 'm').test(read(path.join(dir, '.github', 'workflows', f))))))
    row(rows, '✗', `no workflow named "${opts.tests}" — the merge waits for checks that never run`, 'add the repository\'s test workflow (its `name:` is what --tests names)');
  if (!repo) { row(rows, '✗', 'origin — not a GitHub repository; the workflows are GitHub Actions'); return { side: 'service', root: dir, repo, rows }; }
  const st = settings(gh, repo);
  if (st.error) row(rows, '!', `variables and secrets — not readable (${st.error})`, 'gh auth login with admin on the repository');
  const agent = st.vars.SA_BUILD_AGENT || opts.agent;
  const server = st.vars.SA_INDEX_MCP_URL || next.server;
  // where a job runs: a server only a runner of the team's reaches — localhost, a private network — needs one, registered
  // on this repository and online
  const runnerRows = (k, what) => {
    const runsOn = st.vars[k] || (opts.runsOn ? JSON.stringify(opts.runsOn.split(',').map((x) => x.trim()).filter(Boolean)) : null);
    if (st.vars[k]) row(rows, '✓', `variable ${k} = ${st.vars[k]}`);
    else if (opts.runsOn) varRow(rows, '✗', `variable ${k} — the runner ${what} runs on`, repo, k, runsOn);
    else if (/localhost|127\.0\.0\.1/.test(server || '')) row(rows, '✗', `variable ${k} — the MCP server is on localhost: a GitHub-hosted runner cannot reach it`, `gh variable set ${k} -R ${repo} --body '["self-hosted","<label>"]'  (or --runs-on self-hosted,<label>)`);
    let labels = null; try { labels = JSON.parse(runsOn || 'null'); } catch (e) { labels = null; }
    if (!Array.isArray(labels) || !labels.includes('self-hosted')) return;
    const rn = ghJson(gh, ['api', `repos/${repo}/actions/runners`]);
    if (rn.error) { row(rows, '!', `runners — not readable (${rn.error})`); return; }
    const fit = ((rn.value && rn.value.runners) || []).filter((r) => labels.every((l) => (r.labels || []).some((x) => String(x.name).toLowerCase() === String(l).toLowerCase())));
    const up = fit.filter((r) => r.status === 'online');
    row(rows, up.length ? '✓' : '✗', `runner [${labels.join(', ')}] — ${up.length ? `${up.map((r) => r.name).join(', ')} online` : fit.length ? `${fit.map((r) => r.name).join(', ')} offline: ${what} queues until it is back` : 'none registered on this repository'}`,
      up.length ? null : fit.length ? 'start it: ./run.sh in its directory (or its service)' : `register one on ${repo} with the labels ${labels.filter((l) => l !== 'self-hosted').join(', ')}: Settings → Actions → Runners → New self-hosted runner (a personal account's runner serves one repository)`);
  };
  if (!st.error) {
    row(rows, st.secrets.has('CLAUDE_CODE_OAUTH_TOKEN') ? '✓' : '✗', `secret CLAUDE_CODE_OAUTH_TOKEN — ${opts.attended ? 'the review' : 'the build'}`, st.secrets.has('CLAUDE_CODE_OAUTH_TOKEN') ? null : '/install-github-app in Claude Code, on this repository');
    if (!opts.attended) row(rows, st.secrets.has('SA_BUILD_TOKEN') ? '✓' : '✗', 'secret SA_BUILD_TOKEN — the build agent\'s identity: its pull request here, its issues in the architecture repository', st.secrets.has('SA_BUILD_TOKEN') ? null : `gh secret set SA_BUILD_TOKEN -R ${repo}  (a machine user's or a GitHub App's token)`);
    row(rows, server ? '✓' : '✗', `the MCP server — ${st.vars.SA_INDEX_MCP_URL ? `variable SA_INDEX_MCP_URL = ${st.vars.SA_INDEX_MCP_URL}` : next.server ? `.architecture.json server = ${next.server}` : 'none'}`, server ? null : variable(repo, 'SA_INDEX_MCP_URL').fix);
    if (!opts.attended) runnerRows('SA_BUILD_RUNS_ON', 'the build');
    if (opts.review) {
      runnerRows('SA_REVIEW_RUNS_ON', 'the review');
      const ar = st.vars.SA_ARCHITECTURE_REPO, want = opts.architecture;
      varRow(rows, ar && (!want || ar.toLowerCase() === want.toLowerCase()) ? '✓' : '✗', `variable SA_ARCHITECTURE_REPO${ar ? ` = ${ar}` : ' — the architecture repository, where an escalation that clears a review finding lives'}`, repo, 'SA_ARCHITECTURE_REPO', want);
      reviewProtection(gh, repo, rows);
    }
    if (opts.merge) varRow(rows, st.vars.SA_BUILD_AGENT ? '✓' : '✗', `variable SA_BUILD_AGENT${st.vars.SA_BUILD_AGENT ? ` = ${st.vars.SA_BUILD_AGENT}` : ' — the login whose pull requests merge on their own'}`, repo, 'SA_BUILD_AGENT', opts.agent);
  }
  // the architecture repository's side of the pair, for an unattended build: SA_SERVICE_REPOS is how a release reaches this
  // repository — the handoff names no service, the index dispatches architecture-released to every repository listed there
  if (opts.architecture && !opts.attended) {
    const A = opts.architecture, a = settings(gh, A);
    if (a.error) row(rows, '!', `${A} — its variables are not readable (${a.error})`);
    else {
      const listed = inList(a.vars.SA_SERVICE_REPOS, repo);
      varRow(rows, listed ? '✓' : '✗', `${A} SA_SERVICE_REPOS ${listed ? 'lists' : 'does not list'} ${repo}${listed ? '' : ' — a release never reaches this repository'}`, A, 'SA_SERVICE_REPOS', addTo(a.vars.SA_SERVICE_REPOS, repo));
      if (!a.secrets.has('SA_DISPATCH_TOKEN')) row(rows, '✗', `${A} has no SA_DISPATCH_TOKEN — it cannot tell this repository of a release`, `gh secret set SA_DISPATCH_TOKEN -R ${A}  (a token with write on this repository)`);
      // full auto (--merge): nothing between the architecture's release and this merge waits for a person
      const full = opts.merge ? '✗' : '·';
      if (agent) {
        const trusted = inList(a.vars.SA_TIER0_TRUSTED_AGENTS, agent);
        varRow(rows, trusted ? '✓' : full, `${A} SA_TIER0_TRUSTED_AGENTS ${trusted ? 'trusts' : 'does not trust'} ${agent}${trusted ? '' : ' — its Tier 0 requests wait for a person'}`, A, 'SA_TIER0_TRUSTED_AGENTS', addTo(a.vars.SA_TIER0_TRUSTED_AGENTS, agent));
      }
      const kit = a.vars.SA_HANDOFF_AUTOMERGE === 'true';
      varRow(rows, kit ? '✓' : full, `${A} SA_HANDOFF_AUTOMERGE ${kit ? '= true' : '— unset: a release reaches this build once a person merges the kit'}`, A, 'SA_HANDOFF_AUTOMERGE', 'true');
    }
  }
  if (opts.settings) applySettings(gh, rows);
  return { side: 'service', root: dir, repo, rows };
}

module.exports = { architecture, service, compareWorkflow, architectureWorkflows, githubRepo };

if (require.main === module) {
  const a = process.argv.slice(2), side = a[0], target = a[1] && !a[1].startsWith('--') ? a[1] : '.';
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const o = { write: a.includes('--write'), runner: opt('--runner'), architecture: opt('--architecture'), project: opt('--project'), component: opt('--component'),
    server: opt('--server'), attended: a.includes('--attended'), merge: a.includes('--merge'), tests: opt('--tests'),
    agent: opt('--agent'), runsOn: opt('--runs-on'), settings: a.includes('--settings'), review: a.includes('--review'),
    replace: String(opt('--replace') || '').split(',').map((x) => x.trim()).filter(Boolean) };
  if (side !== 'architecture' && side !== 'service') { console.error('Usage: bun ci-setup.js architecture <project> [--runner <label,…>] [--write] [--replace <file,…>] [--settings] [--json]\n       bun ci-setup.js service <dir> [--architecture <owner/repo>] [--project <key>] [--component <slug>] [--server <mcp_url>] [--attended [--review]] [--merge --tests "<name>"] [--agent <login>] [--runs-on <label,…>] [--write] [--settings] [--json]'); process.exit(2); }
  const r = side === 'architecture' ? architecture(target, o) : service(target, o);
  if (a.includes('--json')) { console.log(JSON.stringify(r, null, 1)); process.exit(r.rows.some((x) => x.state === '✗') ? 1 : 0); }
  console.log(`CI SETUP — ${r.side}: ${r.root}${r.repo ? ` (${r.repo})` : ''}`);
  for (const x of r.rows) console.log(`${x.state} ${x.item}${x.fix ? `\n    → ${x.fix}` : ''}`);
  const open = r.rows.filter((x) => x.state === '✗').length;
  console.log(open ? `${open} to do` : 'nothing to do');
  process.exit(open ? 1 : 0);
}
