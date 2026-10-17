/**
 * CRLF documents parse exactly as LF documents (8.50.1). A consumer project checked out with
 * Windows line endings broke the component facts parser — the `\r` stayed on the last table cell —
 * and every reader that splits project Markdown on `\n` had the same exposure. The readers now
 * normalize at the read; this test parses one project in both encodings through the component
 * facts, the ledger and the explorer's manifest and expects identical results.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const PLUGIN = join(import.meta.dir, "..", "..");
const { listComponents } = require(join(PLUGIN, "architecture-component-guardian", "utils", "component-facts.ts"));
const { collect } = require(join(PLUGIN, "architecture-docs", "scripts", "arch-facts.js"));
const { manifest } = require(join(PLUGIN, "architecture-explorer-headers", "utils", "explorer.ts"));

const ARCH = `<!-- ARCHITECTURE_VERSION: 1.4.0 -->
<!-- ARCHITECTURE_STATUS: Released -->
<!-- DOC_LANGUAGE: en -->

# Ledger Platform — Architecture

**Version**: 1.4.0
`;
const README = `# Component Index

| # | Component | File | Type | Technology |
|---|-----------|------|------|------------|
| 1 | Ledger API | ledger-api.md | Service | Spring Boot 3.2 |
`;
const DESCRIPTOR = `# Ledger API

<!-- EXPLORER_HEADER
key_concepts: ledger, posting
technologies: Spring Boot 3.2, PostgreSQL 16
components: ledger-api
scope: Posts and reads ledger entries for the channel.
related_adrs: ADR-101
component_self: ledger-api
-->

> The service that posts ledger entries and serves the balance read.

**Type:** Service
**Technology:** Spring Boot 3.2
**Description:** Ledger API posts ledger entries and serves the balance read.
**Internal Name:** omn-ledger-api

## Capacity <!-- LABEL: Capacity -->

| Metric | Value | Unit | Source |
|---|---|---|---|
| capacity_per_replica | 120 | rps | docs/08 § 10.2 |
| replicas | 3 | count | docs/09 § 11.1 |
| max_replicas | 6 | count | docs/09 § 11.1 |

## Dependencies

**Depends on:** [Ledger DB](ledger-db.md) for every posting.
`;
const DOC03 = `# Architecture Layers

<!-- EXPLORER_HEADER
key_concepts: layers
technologies: Spring Boot 3.2
components: ledger-api
scope: The layers of the platform.
related_adrs: ADR-101
-->

> One layer.

<!-- ARCHITECTURE_TYPE: 3-Tier -->

## 4. Architecture Layers <!-- SECTION: Architecture Layers -->

### 4.1 Layer Overview

| Layer | Containers | Owned |
|---|---|---|
| **L1 — Service** | Ledger API | Yes |
`;

let lf = "", crlf = "";
const project = (dir: string, eol: string) => {
  mkdirSync(join(dir, "docs", "components"), { recursive: true }); mkdirSync(join(dir, "adr"), { recursive: true });
  const w = (rel: string, s: string) => writeFileSync(join(dir, rel), s.replace(/\n/g, eol));
  w("ARCHITECTURE.md", ARCH); w("docs/components/README.md", README); w("docs/components/ledger-api.md", DESCRIPTOR); w("docs/03-architecture-layers.md", DOC03);
  w("adr/ADR-101-posting-model.md", "# ADR-101: Posting model\n\n**Status:** Accepted\n\n## Context\n\nOne ledger.\n");
};
beforeAll(() => { lf = mkdtempSync(join(tmpdir(), "crlf-lf-")); crlf = mkdtempSync(join(tmpdir(), "crlf-crlf-")); project(lf, "\n"); project(crlf, "\r\n"); });
afterAll(() => { rmSync(lf, { recursive: true, force: true }); rmSync(crlf, { recursive: true, force: true }); });

const strip = (o: any) => JSON.parse(JSON.stringify(o).replace(/"(path|file|project_root|generated_at)":"[^"]*"/g, '"$1":""'));

describe("CRLF documents", () => {
  test("component facts: type, technology, internal name and the capacity table parse the same", () => {
    const a = listComponents(lf), b = listComponents(crlf);
    expect(a.length).toBe(1);
    expect(a[0].technology).toEqual(["Spring Boot 3.2"]);
    expect(a[0].capacity.capacity_per_replica_rps).toBe(120);
    expect(a[0].capacity.replicas).toBe(3);
    expect(strip(b)).toEqual(strip(a));
    expect(JSON.stringify(b)).not.toContain("\\r");
  });
  test("the ledger and the explorer manifest read the CRLF project as the LF one", () => {
    const a = collect(lf), b = collect(crlf);
    expect(a.architecture.version).toBe("1.4.0");
    expect(a.layers.length).toBe(1);
    expect(strip(b.layers)).toEqual(strip(a.layers));
    expect(strip(b.components)).toEqual(strip(a.components));
    expect(strip(b.adrs)).toEqual(strip(a.adrs));
    const ma = manifest(lf), mb = manifest(crlf);
    expect(ma.status).toBe("OK");
    expect(strip(mb.docs)).toEqual(strip(ma.docs));
    expect(JSON.stringify(mb)).not.toContain("\\r");
  });
});
