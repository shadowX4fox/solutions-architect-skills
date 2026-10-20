#!/usr/bin/env bash
# publish-index.sh — the CI step every pipeline example runs: export the architecture index bundle with a pinned plugin,
# check it, and publish it to the architecture MCP server.
#
#   bash publish-index.sh [project_dir]          (default: the current directory)
#
# A release publishes twice, both runs of this script:
#   1. the tag architecture-v<version> is pushed  → the chunks and the ledger (search goes live); no build pack yet,
#      because the handoff kit is regenerated from the released version afterwards
#   2. the regenerated kit is committed on main   → the same version again, with its build packs
# A run whose architecture differs from its release tag, or has uncommitted files, is a draft and is not published
# unless SA_INDEX_ALLOW_DRAFT=true.
#
# Environment
#   SA_INDEX_PROJECT_KEY   required  the project's key on the server — the same on every release, it is part of every chunk id;
#                                    unset, it is read from .sa-skills/index.json (project_key), which publish-index.js writes
#   SA_PLUGIN_REF          required  the plugin tag the bundle is built with, e.g. v10.6.2 (pinned: a bundle is reproducible)
#   SA_PLUGIN_REPO         optional  default https://github.com/shadowx4fox/solutions-architect-skills.git (a mirror works)
#   SA_SKILLS_DIR          optional  a checkout of the plugin at SA_PLUGIN_REF already on the runner — used instead of a clone
#   SA_INDEX_SERVER        optional  the server's base URL; without it the bundle is built and checked, not published.
#                                    With several server instances, the writer's (archindex.role=all): a reader answers 403
#   SA_INDEX_TOKEN         optional  bearer token for the server (a pipeline secret)
#   SA_INDEX_MCP_URL       optional  the MCP endpoint written into each build pack's .architecture.json binding — committed in
#                                    every service repository, so a stable name (the load balancer, or a DNS name you can
#                                    repoint), never one server instance
#   SA_INDEX_ALLOW_DRAFT   optional  true publishes a draft to the server's draft channel
#   SA_INDEX_ARTIFACT      optional  where the bundle .tgz is copied for the pipeline to keep (default: <work>/bundle.tgz)
#
# The server contract this script calls (the Spring AI server implements it):
#   GET  {server}/bundles/{key}/before/{version}             200 application/gzip — the newest bundle older than version · 404 none
#   POST {server}/bundles/{key}/{version}?channel={channel}  body application/gzip — 201 stored · 200 a version it holds, the body
#                                                            {"added":[…],"replaced":[…],"unchanged":[…]} naming the build packs, and
#                                                            "ledger":"same|extended" with "ledger_added":[path…] (Alia 0.4.0) · 409 refused,
#                                                            the body {"reason":"chunks_differ|ledger_differs|packs_missing","packs":[…]} ·
#                                                            403 a reader instance, which never publishes
#   A second publish of a released version carries the same chunks, the same ledger and every pack the version holds; it may add
#   packs and replace them (a pack is replaced when a file's sha256 differs). This script prints the server's answer, never decides it.
#   A ledger may be extended, never changed: keys a newer plugin derives (a field added at any depth, every value the same) are
#   stored with the publish that carries the build packs; a changed value, a dropped field or an array element added or removed is
#   ledger_differs. Chunks the plugin writes differently since the publish are chunks_differ: they reach the server with the next
#   architecture release.
set -euo pipefail

PROJECT_DIR="${1:-.}"
if [ -z "${SA_INDEX_PROJECT_KEY:-}" ] && [ -f "$PROJECT_DIR/.sa-skills/index.json" ]; then
  SA_INDEX_PROJECT_KEY=$(bun -e "process.stdout.write(require(process.argv[1]).project_key || '')" "$(cd "$PROJECT_DIR" && pwd)/.sa-skills/index.json")
fi
: "${SA_INDEX_PROJECT_KEY:?set SA_INDEX_PROJECT_KEY, or commit .sa-skills/index.json — the key of the project on the server}"
: "${SA_PLUGIN_REF:?set SA_PLUGIN_REF — the plugin tag to build the bundle with, e.g. v10.6.2}"
SA_PLUGIN_REPO="${SA_PLUGIN_REPO:-https://github.com/shadowx4fox/solutions-architect-skills.git}"
WORK="${RUNNER_TEMP:-${AGENT_TEMPDIRECTORY:-${TMPDIR:-/tmp}}}/sa-index"
ARTIFACT="${SA_INDEX_ARTIFACT:-$WORK/bundle.tgz}"
rm -rf "$WORK"; mkdir -p "$WORK"

[ -f "$PROJECT_DIR/ARCHITECTURE.md" ] || { echo "publish-index: no ARCHITECTURE.md in $PROJECT_DIR" >&2; exit 2; }
VERSION=$(sed -n 's/.*<!--[[:space:]]*ARCHITECTURE_VERSION:[[:space:]]*\([0-9][^[:space:]]*\)[[:space:]]*-->.*/\1/p' "$PROJECT_DIR/ARCHITECTURE.md" | head -n 1)
[ -n "$VERSION" ] || { echo "publish-index: no <!-- ARCHITECTURE_VERSION: --> marker in ARCHITECTURE.md" >&2; exit 2; }
echo "publish-index: ${SA_INDEX_PROJECT_KEY} ${VERSION}, plugin ${SA_PLUGIN_REF}"

# the plugin, pinned: the checkout the pipeline already made (SA_SKILLS_DIR), else a clone of SA_PLUGIN_REF; `bun install`
# brings the contract checks' validators the kit gate runs
if [ -z "${SA_SKILLS_DIR:-}" ] || [ ! -f "$SA_SKILLS_DIR/scripts/shared/arch-facts.js" ]; then
  git clone --quiet --depth 1 --branch "$SA_PLUGIN_REF" "$SA_PLUGIN_REPO" "$WORK/plugin"
  SA_SKILLS_DIR="$WORK/plugin"
fi
(cd "$SA_SKILLS_DIR" && bun install --frozen-lockfile)
export SA_SKILLS_DIR
EXPORT="$SA_SKILLS_DIR/plugins/sa-delivery/skills/architecture-index-export/scripts/export-index.js"

AUTH=(); [ -n "${SA_INDEX_TOKEN:-}" ] && AUTH=(-H "Authorization: Bearer ${SA_INDEX_TOKEN}")
PREVIOUS=()
if [ -n "${SA_INDEX_SERVER:-}" ]; then
  code=$(curl -sS -o "$WORK/previous.tgz" -w '%{http_code}' ${AUTH[@]+"${AUTH[@]}"} "${SA_INDEX_SERVER%/}/bundles/${SA_INDEX_PROJECT_KEY}/before/${VERSION}")
  case "$code" in
    200) mkdir -p "$WORK/previous" && tar -xzf "$WORK/previous.tgz" -C "$WORK/previous" && PREVIOUS=(--previous "$WORK/previous") ;;
    404) echo "publish-index: no earlier bundle on the server — no changes.json this time" ;;
    *)   echo "publish-index: GET the previous bundle answered ${code}" >&2; exit 1 ;;
  esac
fi
SERVER=(); [ -n "${SA_INDEX_MCP_URL:-}" ] && SERVER=(--server "$SA_INDEX_MCP_URL")

# export + its own check (exit 1: the bundle failed its check; 2: the export could not run)
bun "$EXPORT" "$PROJECT_DIR" --out "$WORK/bundle" --project-key "$SA_INDEX_PROJECT_KEY" ${SERVER[@]+"${SERVER[@]}"} ${PREVIOUS[@]+"${PREVIOUS[@]}"}
bun "$EXPORT" --check "$WORK/bundle"

CHANNEL=$(bun -e "process.stdout.write(require(process.argv[1]).channel)" "$WORK/bundle/manifest.json")
if [ "$CHANNEL" != "released" ] && [ "${SA_INDEX_ALLOW_DRAFT:-false}" != "true" ]; then
  echo "publish-index: ${VERSION} is a draft here — the architecture differs from architecture-v${VERSION}, or files are uncommitted. Not published."
  exit 0
fi

tar -czf "$WORK/bundle.tgz" -C "$WORK/bundle" .
[ "$ARTIFACT" = "$WORK/bundle.tgz" ] || { mkdir -p "$(dirname "$ARTIFACT")"; cp "$WORK/bundle.tgz" "$ARTIFACT"; }
echo "publish-index: bundle ${ARTIFACT}"
[ -z "${TF_BUILD:-}" ] || echo "##vso[task.setvariable variable=SA_INDEX_BUILT]true"   # Azure Pipelines: keep the artifact
if [ -z "${SA_INDEX_SERVER:-}" ]; then echo "publish-index: SA_INDEX_SERVER not set — built and checked, not published"; exit 0; fi

code=$(curl -sS -o "$WORK/publish.out" -w '%{http_code}' -X POST ${AUTH[@]+"${AUTH[@]}"} -H 'Content-Type: application/gzip' \
  --data-binary "@$WORK/bundle.tgz" "${SA_INDEX_SERVER%/}/bundles/${SA_INDEX_PROJECT_KEY}/${VERSION}?channel=${CHANNEL}")
# the server's body, read when it is the JSON of the contract above; any other body is printed as it came
answer() { bun -e '
  let b; try { b = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); } catch { process.exit(1); }
  const list = (k) => (Array.isArray(b[k]) && b[k].length ? b[k].join(", ") : "none");
  if (process.argv[2] === "200") { if (!["added", "replaced", "unchanged"].some((k) => Array.isArray(b[k]))) process.exit(1);
    console.log(`build packs — added: ${list("added")} · replaced: ${list("replaced")} · unchanged: ${list("unchanged")}`);
    if (b.ledger === "extended") console.log(`ledger extended: ${list("ledger_added")}`); }
  else { if (!b.reason) process.exit(1);
    const why = { chunks_differ: "its chunks differ from the released version held", ledger_differs: "its ledger differs from the released version held",
      packs_missing: "it leaves out build packs the server holds for this version" }[b.reason] || b.reason;
    console.log(`refused (${b.reason}): ${why}${Array.isArray(b.packs) && b.packs.length ? ` — ${b.packs.join(", ")}` : ""}`); }' "$WORK/publish.out" "$1"; }
case "$code" in
  201) echo "publish-index: ${VERSION} published (${CHANNEL})" ;;
  200) echo "publish-index: ${VERSION} updated"; answer 200 | sed 's/^/publish-index: /' || true ;;
  409) if msg=$(answer 409); then echo "publish-index: ${VERSION} ${msg}" >&2; else echo "publish-index: the server answered 409" >&2; cat "$WORK/publish.out" >&2 || true; fi
       # what to do depends on the reason: a missing pack is fixed here, a changed ledger value is a changed architecture, chunks only by a release
       case "${msg:-}" in
         *"(ledger_differs)"*)
           echo "publish-index: a second publish of a released version may add ledger fields, never change one: a value, a field or a list entry of the ledger differs from the one published — the architecture differs from its tag (publish a draft, or release it), or the plugin reads a fact differently since that publish (SA_PLUGIN_REF moved), which reaches the server with the next architecture release" >&2 ;;
         *"(chunks_differ)"*)
           echo "publish-index: a second publish of a released version carries the same chunks. With the architecture at its tag, the plugin writes them differently since the version was published (SA_PLUGIN_REF moved): they reach the server with the next architecture release" >&2 ;;
         *) echo "publish-index: a second publish of a released version carries every build pack the server holds — regenerate the missing packs or fix the kit (kit-check.js)" >&2 ;;
       esac; exit 1 ;;
  403) echo "publish-index: ${SA_INDEX_SERVER} is a reader instance of the server (archindex.role=reader), which never publishes — point SA_INDEX_SERVER at the writer" >&2
       cat "$WORK/publish.out" >&2 || true; echo >&2; exit 1 ;;
  *)   echo "publish-index: the server answered ${code}" >&2; cat "$WORK/publish.out" >&2 || true; exit 1 ;;
esac
