# Build {{name}}

You are building **{{name}}**{{internal_name}} — {{type}}, {{technology}} — as specified by the architecture **{{project_name}}**, version **{{version}}**. Everything you need is in this build pack. Fetch each part with `get_build_part(project: "{{project}}", component: "{{slug}}", part: "<part id>")`; ask the architecture questions with `search_architecture` while you work.

## Bind the repository first

Write `.architecture.json` at the root of the repository, or check the one there names this component and this version. Call `get_build_pack(project: "{{project}}", component: "{{slug}}")` and replace the `pack_revision` placeholder with the `pack_revision` it returns — the revision of this pack you are building from:

```json
{{binding}}
```

**Nobody attending this build** — a CI job, a platform's build agent — is declared in this file: `"supervision": "unattended"` (absent, a person works with you). Then nobody answers a question or says yes: the rules below say what changes, and your work ends in a pull request whose description lists, under **Architecture requests**, every `TODO(architecture)` you left and every issue you filed, with its URL — the person who reviews it reads them there.

When the architecture releases a new version, or this pack is revised within its version (`get_build_pack` returns another `pack_revision`), call `what_changed(project: "{{project}}", component: "{{slug}}", from: "<the version in this file>", from_revision: "<the pack_revision in this file>", to: "<the new version>")`. Overwrite the copies under `architecture/` with the new assets first (delete the ones it removes) and commit them alone — `architecture: contracts <new version> (pack_revision <new revision>)` — so the IDE and the pull request show what the contract changed before any code moves; then update the service, then this file.

## Rules

1. **Contracts are implemented exactly.** Every asset under `asset:` is the contract: paths, operations, messages, fields, types, tables, keys and their names as written. Keep each one, byte for byte, at `architecture/<file>` in the repository — the file name as the part gives it — and generate code from that copy where a generator exists. Copy the bytes, never retype them: when `get_build_pack` lists a `download_url` for the part, download it with the MCP server's bearer token and the revision you recorded — `curl -fsSL -H "Authorization: Bearer <token>" -o architecture/<file> "<download_url>?pack_revision=<pack_revision>"` (a 409 means the pack was revised since: call `get_build_pack` again, then `what_changed` with `from_revision`; a 404 just after a release means the server instance that answered has not loaded it yet: wait a few seconds and download again, for up to a minute — a 404 that stays is a missing part: report it, never write the file from memory); else write the `content` of every page of `get_build_part` unchanged. Either way its `sha256` must equal the part's, or fetch it again. Those copies are read-only: the code changes, they do not. Never rename, add or drop an element to make the code easier; if a contract looks wrong, record it as a question for the architect and implement it as written.
2. **Names are the architecture's.** Call this component **{{name}}** in code comments, logs, metrics and documentation{{internal_name_rule}}. Name every other component by its canonical name, as the parts write it.
3. **Never fill a gap.** Every open question below is something the architecture does not state. Ask the person you work with; if no answer comes, or nobody attends this build, leave a `TODO(architecture)` that quotes the question and the part, and continue with the rest — a question that blocks the build follows rule 9. Never invent a value, a limit, a timeout or a behaviour.
4. **Security is never a gap to work around.** Deny by default: only the callers under Security reach this component. An interface whose authentication is not documented fails closed — it rejects every call, and its tests prove it — until the architect states it; never ship it open with a TODO. The `security` part lists the threats to mitigate and the security decisions in force; a contract with no security scheme does not mean the operation is public.
5. **The cross-cutting standards and the governing ADRs apply to every line.** Errors, versioning, identity, idempotency, observability and resilience follow `cross-cutting-standards` and the `adr:` parts; where the service needs a choice they do not make, ask — with no answer, or nobody attending, a `TODO(architecture)` as in rule 3.
6. **Budgets are requirements.** Each phase this component takes part in has a latency budget; measure the component against its share.
7. **The stack comes from the team's service template**, not from this pack: the pack states the technology, not the project skeleton, libraries or CI.
8. **Record the version and the revision.** Every commit that implements this pack names architecture version {{version}} and the `pack_revision` in `.architecture.json`.
{{escalation_rule}}{{tier0_rule}}

## Build plan

{{plan}}

## Security

Who may call this component and how each interface authenticates (the `security` part; its threats and tests follow there):

{{security}}

## Interfaces

{{interfaces}}

## Flows and latency budgets

{{flows}}

## Open questions

{{questions}}

## Done when

- [ ] every contract asset is implemented exactly, and the contract the service publishes matches it
- [ ] every asset is committed under `architecture/`, its `sha256` equal to the part's
- [ ] every interface handles the failure semantics its Interface Contract states
- [ ] every test under Security Tests of the `security` part passes: a call without credentials and a call from an unlisted caller are rejected, and an interface without documented authentication rejects every call
- [ ] the acceptance criteria of the Component Specification pass as automated tests
- [ ] every latency budget above is measured
- [ ] every open question is answered or left as a `TODO(architecture)` that quotes it
- [ ] `.architecture.json` names version {{version}} and the `pack_revision` you built from
