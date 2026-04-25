/**
 * Unit tests for header-detector.ts — covers detection, insertion,
 * removal, parsing, validation, and the listDocFiles fs walker.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  buildHeader,
  extractH1,
  findInsertionPoint,
  hasExplorerHeader,
  HEADER_OPEN,
  insertHeader,
  listDocFiles,
  parseHeader,
  removeHeader,
  validateHeader,
} from "./header-detector";

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "header-test-"));
});

afterEach(() => {
  if (existsSync(projectRoot)) rmSync(projectRoot, { recursive: true, force: true });
});

function touch(rel: string, body: string): void {
  const abs = join(projectRoot, rel);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, body);
}

describe("hasExplorerHeader", () => {
  test("returns true when block is present", () => {
    expect(hasExplorerHeader("# H1\n\n<!-- EXPLORER_HEADER\nfoo: bar\n-->\n\nbody")).toBe(true);
  });
  test("returns false when block is absent", () => {
    expect(hasExplorerHeader("# H1\n\nbody")).toBe(false);
  });
  test("returns false when only the suffix is present", () => {
    expect(hasExplorerHeader("# H1\n\n<!-- some other comment -->\n")).toBe(false);
  });
});

describe("extractH1", () => {
  test("captures plain H1", () => {
    expect(extractH1("# Section 8: Scalability\n\nbody")).toBe("Section 8: Scalability");
  });
  test("returns empty string when no H1", () => {
    expect(extractH1("no headings here")).toBe("");
  });
  test("ignores H2/H3", () => {
    expect(extractH1("## H2\n### H3\n# Real H1")).toBe("Real H1");
  });
});

describe("findInsertionPoint", () => {
  test("returns offset just after H1 + blank line", () => {
    const body = "# Heading\n\nbody starts here\n";
    const { offset } = findInsertionPoint(body);
    expect(body.slice(offset)).toBe("body starts here\n");
  });
  test("flags needsLeadingBlank when H1 has no trailing blank", () => {
    const body = "# Heading\nbody starts here";
    const { needsLeadingBlank } = findInsertionPoint(body);
    expect(needsLeadingBlank).toBe(true);
  });
  test("returns 0 when no H1", () => {
    const { offset } = findInsertionPoint("just body content");
    expect(offset).toBe(0);
  });
});

describe("buildHeader / parseHeader round-trip", () => {
  test("round-trips a typical doc-file header", () => {
    const fields = {
      key_concepts: ["SLO", "MTTR", "error budget"],
      technologies: ["Prometheus", "Grafana"],
      components: ["api-gateway", "payment-service"],
      scope: "Service-level objectives and operational reliability",
      related_adrs: ["ADR-014", "ADR-022"],
    };
    const text = buildHeader(fields, "30-second summary here");
    expect(text).toContain(HEADER_OPEN);
    expect(text).toContain("key_concepts: SLO, MTTR, error budget");
    expect(text).toContain("> 30-second summary here");

    const parsed = parseHeader(text);
    expect(parsed).not.toBeNull();
    expect(parsed?.key_concepts).toEqual(["SLO", "MTTR", "error budget"]);
    expect(parsed?.technologies).toEqual(["Prometheus", "Grafana"]);
    expect(parsed?.scope).toBe("Service-level objectives and operational reliability");
    expect(parsed?.related_adrs).toEqual(["ADR-014", "ADR-022"]);
  });

  test("emits component_self instead of components for component files", () => {
    const text = buildHeader({
      key_concepts: ["idempotency", "settlement"],
      technologies: ["Spring Boot 3.3"],
      component_self: "payment-service",
      component_type: "api-service",
      scope: "Payment ingestion and ledger",
      related_adrs: ["ADR-018"],
    });
    expect(text).toContain("component_self: payment-service");
    expect(text).toContain("component_type: api-service");
    expect(text).not.toContain("components:");

    const parsed = parseHeader(text);
    expect(parsed?.component_self).toBe("payment-service");
    expect(parsed?.component_type).toBe("api-service");
  });

  test("parseHeader returns null when no block present", () => {
    expect(parseHeader("# Heading\n\nbody")).toBeNull();
  });

  test("parseHeader ignores unknown fields", () => {
    const text = "<!-- EXPLORER_HEADER\nkey_concepts: a, b\nunknown_field: ignore-me\n-->";
    const parsed = parseHeader(text);
    expect(parsed?.key_concepts).toEqual(["a", "b"]);
    expect((parsed as Record<string, unknown>).unknown_field).toBeUndefined();
  });
});

describe("insertHeader", () => {
  test("inserts after H1 + blank line", () => {
    const original = "# Heading\n\nfirst body line\nsecond line\n";
    const block = buildHeader(
      { key_concepts: ["x"], technologies: ["y"], scope: "z" },
      "summary",
    );
    const updated = insertHeader(original, block);
    expect(updated.startsWith("# Heading\n")).toBe(true);
    expect(updated).toContain(block);
    expect(updated).toContain("first body line");
    expect(updated.indexOf(block)).toBeLessThan(updated.indexOf("first body line"));
  });

  test("throws when header already present and force=false", () => {
    const original = `# H1\n\n${HEADER_OPEN}\nkey_concepts: a\n-->\n\nbody`;
    expect(() => insertHeader(original, "<!-- EXPLORER_HEADER\nkey_concepts: b\n-->")).toThrow();
  });

  test("replaces existing header when force=true", () => {
    const original = `# H1\n\n${HEADER_OPEN}\nkey_concepts: old\n-->\n\nbody`;
    const newBlock = `${HEADER_OPEN}\nkey_concepts: new\n-->`;
    const updated = insertHeader(original, newBlock, { force: true });
    expect(updated).toContain("key_concepts: new");
    expect(updated).not.toContain("key_concepts: old");
    expect(updated).toContain("body");
  });

  test("handles file without H1 by inserting at start", () => {
    const original = "no h1 here\nbody";
    const block = `${HEADER_OPEN}\nkey_concepts: x\n-->`;
    const updated = insertHeader(original, block);
    expect(updated.startsWith(block)).toBe(true);
  });
});

describe("removeHeader", () => {
  test("removes block and trailing blank line", () => {
    const original = `# H1\n\n${HEADER_OPEN}\nkey_concepts: a\n-->\n\nbody starts`;
    const cleaned = removeHeader(original);
    expect(cleaned).not.toContain(HEADER_OPEN);
    expect(cleaned).toContain("body starts");
    expect(cleaned).toContain("# H1");
  });

  test("is a no-op when no header present", () => {
    const original = "# H1\n\nbody";
    expect(removeHeader(original)).toBe(original);
  });
});

describe("validateHeader — doc files", () => {
  test("accepts well-formed doc header", () => {
    const text = buildHeader({
      key_concepts: ["SLO", "MTTR"],
      technologies: ["Prometheus"],
      scope: "ops",
      related_adrs: ["ADR-014"],
    });
    const result = validateHeader(text, "docs/08-scalability.md");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("rejects header missing required fields", () => {
    const text = "<!-- EXPLORER_HEADER\nkey_concepts: a\n-->";
    const result = validateHeader(text, "docs/01-overview.md");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("technologies"))).toBe(true);
    expect(result.errors.some((e) => e.includes("scope"))).toBe(true);
  });

  test("rejects content with no header at all", () => {
    const result = validateHeader("# H1\n\nbody", "docs/01.md");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("no EXPLORER_HEADER block");
  });

  test("warns on overly long scope", () => {
    const text = buildHeader({
      key_concepts: ["a", "b"],
      technologies: ["c"],
      scope: "x".repeat(200),
    });
    const result = validateHeader(text, "docs/01.md");
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("scope"))).toBe(true);
  });

  test("warns on malformed ADR id", () => {
    const text = buildHeader({
      key_concepts: ["a", "b"],
      technologies: ["c"],
      scope: "z",
      related_adrs: ["adr 14", "ADR-015"],
    });
    const result = validateHeader(text, "docs/01.md");
    expect(result.warnings.some((w) => w.includes("malformed"))).toBe(true);
  });
});

describe("validateHeader — component files", () => {
  test("requires component_self", () => {
    const text = buildHeader({
      key_concepts: ["a", "b"],
      technologies: ["c"],
      scope: "z",
    });
    const result = validateHeader(text, "docs/components/payment-service.md");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("component_self"))).toBe(true);
  });

  test("warns when component file uses 'components' instead of 'component_self'", () => {
    // buildHeader correctly picks one OR the other, so we hand-construct
    // the malformed legacy form to exercise the validator directly.
    const text =
      `${HEADER_OPEN}\n` +
      `key_concepts: a, b\n` +
      `technologies: c\n` +
      `components: other-service\n` +
      `component_self: payment-service\n` +
      `scope: z\n` +
      `-->`;
    const result = validateHeader(text, "docs/components/payment-service.md");
    expect(result.warnings.some((w) => w.includes("component_self"))).toBe(true);
  });
});

describe("listDocFiles", () => {
  test("lists docs/*.md files", () => {
    touch("docs/01-overview.md", "# Overview\n");
    touch("docs/02-arch.md", "# Architecture\n");
    touch("ARCHITECTURE.md", "# Project\n");

    const list = listDocFiles(projectRoot);
    expect(list.map((e) => e.path).sort()).toEqual(["docs/01-overview.md", "docs/02-arch.md"]);
  });

  test("excludes ARCHITECTURE.md (navigation index — exempt)", () => {
    touch("ARCHITECTURE.md", "# Project\n\n<!-- EXPLORER_HEADER\nkey_concepts: x\n-->");
    touch("docs/01-overview.md", "# Overview\n");
    const list = listDocFiles(projectRoot);
    expect(list.find((e) => e.path === "ARCHITECTURE.md")).toBeUndefined();
  });

  test("excludes README.md inside docs/components/", () => {
    touch("docs/components/README.md", "# Components\n");
    touch("docs/components/payment-service.md", "# Payment\n");
    const list = listDocFiles(projectRoot);
    expect(list.find((e) => e.path.endsWith("README.md"))).toBeUndefined();
    expect(list.find((e) => e.path === "docs/components/payment-service.md")).not.toBeUndefined();
  });

  test("recurses into docs/components/ subdirectories", () => {
    touch("docs/components/system-a/01-svc.md", "# Svc A\n");
    touch("docs/components/system-b/sub/02-svc.md", "# Svc B\n");
    const list = listDocFiles(projectRoot);
    expect(list.map((e) => e.path).sort()).toEqual([
      "docs/components/system-a/01-svc.md",
      "docs/components/system-b/sub/02-svc.md",
    ]);
  });

  test("does NOT recurse into docs/ subdirectories (other than components)", () => {
    touch("docs/templates/some-template.md", "# Template\n");
    const list = listDocFiles(projectRoot);
    expect(list.find((e) => e.path.includes("templates"))).toBeUndefined();
  });

  test("populates has_header and h1 correctly", () => {
    touch("docs/01.md", "# Overview\n");
    touch("docs/02.md", "# Layers\n\n<!-- EXPLORER_HEADER\nkey_concepts: a\n-->\n\nbody");
    const list = listDocFiles(projectRoot);
    const e1 = list.find((e) => e.path === "docs/01.md");
    const e2 = list.find((e) => e.path === "docs/02.md");
    expect(e1?.has_header).toBe(false);
    expect(e1?.h1).toBe("Overview");
    expect(e2?.has_header).toBe(true);
    expect(e2?.h1).toBe("Layers");
  });

  test("returns empty array when project has no docs/", () => {
    expect(listDocFiles(projectRoot)).toEqual([]);
  });
});
