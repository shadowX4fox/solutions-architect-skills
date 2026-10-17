/**
 * Unit tests for component-facts.ts — covers the component fact walk, each
 * warning class, the index diff buckets, and index rendering.
 *
 * Fixtures are built in a temp project per test (same convention as
 * skills/architecture-explorer-headers/utils/header-detector.test.ts).
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import {
  CANONICAL_L2_TYPES,
  DESCRIPTION_MAX_CHARS,
  checkDescription,
  diffIndex,
  formatTechnology,
  listComponents,
  parseIndexRows,
  parseTechnology,
  renderIndex,
  renderReadme,
  slugFromFilename,
} from "../utils/component-facts";

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "component-facts-test-"));
});

afterEach(() => {
  if (existsSync(projectRoot)) rmSync(projectRoot, { recursive: true, force: true });
});

function write(relPath: string, content: string): void {
  const abs = join(projectRoot, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf-8");
}

function header(fields: Record<string, string>): string {
  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${v}`);
  return `<!-- EXPLORER_HEADER\n${lines.join("\n")}\n-->`;
}

function container(opts: {
  name: string;
  slug?: string;
  type?: string;
  technology?: string;
  headerTech?: string;
  omitHeader?: boolean;
  c4Level?: string;
  /** the `**Description:**` line verbatim; `null` omits the field */
  description?: string | null;
}): string {
  const head = opts.omitHeader
    ? ""
    : `\n${header({
        key_concepts: "idempotency, refund, settlement",
        technologies: opts.headerTech ?? "Spring Boot 3.2",
        component_self: opts.slug ?? "payment-service",
        component_type: "api-service",
        scope: "Card authorization, capture and refund",
      })}\n`;
  return [
    `# ${opts.name}`,
    head,
    `**Type:** ${opts.type ?? "API Service"}`,
    `**Technology:** ${opts.technology ?? "[Spring Boot 3.2]"}`,
    ...(opts.description === null
      ? []
      : [`**Description:** ${opts.description ?? `${opts.name} authorizes, captures and refunds card payments.`}`]),
    `**C4 Level:** ${opts.c4Level ?? "Container (L2)"}`,
    "",
    "**Component Version:** 1.2.0",
    "**Architecture Version:** 2.0.0",
    "**Last Updated:** 2026-08-01",
    "",
  ].join("\n");
}

function descriptor(name: string, slug: string): string {
  return [
    `# ${name}`,
    "",
    header({
      key_concepts: "fan-out, dedupe, opt-in registry",
      technologies: "Kafka, PostgreSQL 16",
      component_self: slug,
      component_type: "internal-system",
      scope: "System boundary for the payments platform",
    }),
    "",
    "**C4 Level:** System (L1)",
    "**Type:** Internal System",
    "",
  ].join("\n");
}

describe("pure helpers", () => {
  test("parseTechnology strips IcePanel brackets and splits on commas", () => {
    expect(parseTechnology("[React 18, Vite 5]")).toEqual(["React 18", "Vite 5"]);
    expect(parseTechnology("[Spring Boot 3.2]")).toEqual(["Spring Boot 3.2"]);
    expect(parseTechnology("PostgreSQL 16")).toEqual(["PostgreSQL 16"]);
    expect(parseTechnology("[Redis 7], [Kafka 3.7]")).toEqual(["Redis 7", "Kafka 3.7"]);
    expect(parseTechnology(null)).toEqual([]);
  });

  test("formatTechnology round-trips back to the bracket form", () => {
    expect(formatTechnology(parseTechnology("[React 18, Vite 5]"))).toBe("[React 18, Vite 5]");
    expect(formatTechnology([])).toBe("");
  });

  test("slugFromFilename drops the NN- prefix and the extension", () => {
    expect(slugFromFilename("03-payment-service.md")).toBe("payment-service");
    expect(slugFromFilename("payments.md")).toBe("payments");
  });

  test("parseIndexRows ignores headers, separators and prose", () => {
    const readme = [
      "# Component Details",
      "",
      "### [Payments](payments.md)",
      "",
      "| # | Component | File | Type | Technology |",
      "|---|-----------|------|------|------------|",
      "| 5.1 | Payment Service | [01-payment-service.md](payments/01-payment-service.md) | API Service | [Spring Boot 3.2] |",
      "",
      "| Two | Column |",
    ].join("\n");
    const rows = parseIndexRows(readme);
    expect(rows).toHaveLength(1);
    expect(rows[0].index).toBe("5.1");
    expect(rows[0].component).toBe("Payment Service");
    expect(rows[0].type).toBe("API Service");
  });
});

describe("listComponents", () => {
  test("returns one clean fact per file and classifies L1 vs L2", () => {
    write("docs/components/payments.md", descriptor("Payments Platform", "payments"));
    write(
      "docs/components/payments/01-payment-service.md",
      container({ name: "Payment Service", slug: "payment-service" }),
    );
    write(
      "docs/components/payments/02-ledger-db.md",
      container({
        name: "Ledger Database",
        slug: "ledger-db",
        type: "Database",
        technology: "[PostgreSQL 16]",
        headerTech: "PostgreSQL 16",
      }),
    );

    const facts = listComponents(projectRoot);
    expect(facts).toHaveLength(3);

    const l1 = facts.find((f) => f.level === "L1")!;
    expect(l1.path).toBe("docs/components/payments.md");
    expect(l1.name).toBe("Payments Platform");
    expect(l1.system).toBe("payments");
    expect(l1.index).toBeNull();
    expect(l1.warnings).toEqual([]);

    const service = facts.find((f) => f.slug === "payment-service")!;
    expect(service.level).toBe("L2");
    expect(service.index).toBe("5.1");
    expect(service.system).toBe("payments");
    expect(service.type).toBe("API Service");
    expect(service.type_canonical).toBe(true);
    expect(service.technology).toEqual(["Spring Boot 3.2"]);
    expect(service.component_version).toBe("1.2.0");
    expect(service.architecture_version).toBe("2.0.0");
    expect(service.last_updated).toBe("2026-08-01");
    expect(service.warnings).toEqual([]);

    const db = facts.find((f) => f.slug === "ledger-db")!;
    expect(db.index).toBe("5.2");
    expect(db.type).toBe("Database");
  });

  test("every canonical type is accepted", () => {
    CANONICAL_L2_TYPES.forEach((type, i) => {
      const slug = `component-${i}`;
      write(
        `docs/components/sys/0${i + 1}-${slug}.md`,
        container({ name: `Component ${i}`, slug, type }),
      );
    });
    write("docs/components/sys.md", descriptor("Sys", "sys"));
    const facts = listComponents(projectRoot).filter((f) => f.level === "L2");
    expect(facts).toHaveLength(CANONICAL_L2_TYPES.length);
    expect(facts.every((f) => f.type_canonical)).toBe(true);
    // Gateway is canonical but still carries the C-14 altitude warning.
    const gateway = facts.find((f) => f.type === "Gateway")!;
    expect(gateway.warnings.some((w) => w.startsWith("gateway-at-l2"))).toBe(true);
  });

  test("returns an empty array when docs/components is absent", () => {
    expect(listComponents(projectRoot)).toEqual([]);
  });

  test("a legacy flat file with no header and no system folder is an L2 container", () => {
    write(
      "docs/components/legacy-report-service.md",
      ["# Legacy Report Service", "", "**Type:** API Service", "**Technology:** [Java 8]", ""].join(
        "\n",
      ),
    );
    const [fact] = listComponents(projectRoot);
    expect(fact.level).toBe("L2");
    expect(fact.system).toBeNull();
    expect(fact.index).toBeNull();
    expect(fact.header).toBeNull();
    expect(fact.slug).toBe("legacy-report-service");
    expect(fact.warnings).toContain("missing-header: no EXPLORER_HEADER block");
  });
});

describe("warning classes", () => {
  test("non-canonical type", () => {
    write("docs/components/sys.md", descriptor("Sys", "sys"));
    write(
      "docs/components/sys/01-thing.md",
      container({ name: "Thing", slug: "thing", type: "Microservice" }),
    );
    const fact = listComponents(projectRoot).find((f) => f.slug === "thing")!;
    expect(fact.type_canonical).toBe(false);
    expect(fact.warnings.some((w) => w.startsWith("non-canonical-type"))).toBe(true);
  });

  test("slug mismatch between component_self and the filename", () => {
    write("docs/components/sys.md", descriptor("Sys", "sys"));
    write(
      "docs/components/sys/01-payment-service.md",
      container({ name: "Payment Service", slug: "payments-svc" }),
    );
    const [, fact] = listComponents(projectRoot);
    expect(fact.warnings.some((w) => w.startsWith("slug-mismatch"))).toBe(true);
  });

  test("technology mismatch between the header and the body field", () => {
    write("docs/components/sys.md", descriptor("Sys", "sys"));
    write(
      "docs/components/sys/01-payment-service.md",
      container({
        name: "Payment Service",
        slug: "payment-service",
        technology: "[Spring Boot 3.3]",
        headerTech: "Spring Boot 3.2",
      }),
    );
    const fact = listComponents(projectRoot).find((f) => f.slug === "payment-service")!;
    expect(fact.warnings.some((w) => w.startsWith("technology-mismatch"))).toBe(true);
  });

  test("missing Type and Technology fields", () => {
    write("docs/components/sys.md", descriptor("Sys", "sys"));
    write(
      "docs/components/sys/01-bare.md",
      ["# Bare Component", "", header({ component_self: "bare" }), ""].join("\n"),
    );
    const fact = listComponents(projectRoot).find((f) => f.slug === "bare")!;
    expect(fact.warnings).toContain("missing-field: **Type:**");
    expect(fact.warnings).toContain("missing-field: **Technology:**");
  });

  test("level conflict between the filename and the C4 Level field", () => {
    write("docs/components/sys.md", descriptor("Sys", "sys"));
    write(
      "docs/components/sys/01-payment-service.md",
      container({ name: "Payment Service", slug: "payment-service", c4Level: "System (L1)" }),
    );
    const fact = listComponents(projectRoot).find((f) => f.slug === "payment-service")!;
    expect(fact.level).toBe("L2");
    expect(fact.warnings.some((w) => w.startsWith("level-conflict"))).toBe(true);
  });
});

describe("diffIndex", () => {
  function seedProject(): void {
    write("docs/components/payments.md", descriptor("Payments Platform", "payments"));
    write(
      "docs/components/payments/01-payment-service.md",
      container({ name: "Payment Service", slug: "payment-service" }),
    );
    write(
      "docs/components/payments/02-ledger-db.md",
      container({
        name: "Ledger Database",
        slug: "ledger-db",
        type: "Database",
        technology: "[PostgreSQL 16]",
        headerTech: "PostgreSQL 16",
      }),
    );
  }

  function readme(rows: string[]): string {
    return [
      "<!-- managed by sa-skills:architecture-component-guardian — do not edit manually -->",
      "[Architecture](../../ARCHITECTURE.md) > Components",
      "",
      "# Component Details",
      "",
      "### [Payments Platform](payments.md)",
      "",
      "| # | Component | File | Type | Technology |",
      "|---|-----------|------|------|------------|",
      ...rows,
      "",
    ].join("\n");
  }

  test("clean index produces no findings", () => {
    seedProject();
    write(
      "docs/components/README.md",
      readme([
        "| 5.1 | Payment Service | [01-payment-service.md](payments/01-payment-service.md) | API Service | [Spring Boot 3.2] |",
        "| 5.2 | Ledger Database | [02-ledger-db.md](payments/02-ledger-db.md) | Database | [PostgreSQL 16] |",
      ]),
    );
    expect(diffIndex(projectRoot)).toEqual({
      missing_rows: [],
      orphan_rows: [],
      stale_rows: [],
    });
  });

  test("missing row, orphan row and stale columns are each reported", () => {
    seedProject();
    write(
      "docs/components/README.md",
      readme([
        "| 5.1 | Payments Svc | [01-payment-service.md](payments/01-payment-service.md) | Worker/Consumer | [Spring Boot 3.2] |",
        "| 5.9 | Deleted Service | [09-deleted.md](payments/09-deleted.md) | API Service | [Go 1.22] |",
      ]),
    );
    const diff = diffIndex(projectRoot);
    expect(diff.missing_rows).toEqual(["docs/components/payments/02-ledger-db.md"]);
    expect(diff.orphan_rows).toHaveLength(1);
    const columns = diff.stale_rows.map((r) => r.column).sort();
    expect(columns).toEqual(["Component", "Type"]);
    const nameRow = diff.stale_rows.find((r) => r.column === "Component")!;
    expect(nameRow.index_value).toBe("Payments Svc");
    expect(nameRow.file_value).toBe("Payment Service");
  });

  test("a project with component files but no index reports every file as missing", () => {
    seedProject();
    const diff = diffIndex(projectRoot);
    expect(diff.missing_rows).toHaveLength(2);
    expect(diff.orphan_rows).toEqual([]);
  });

  test("L1 descriptors are never expected as index rows", () => {
    seedProject();
    write(
      "docs/components/README.md",
      readme([
        "| 5.1 | Payment Service | [01-payment-service.md](payments/01-payment-service.md) | API Service | [Spring Boot 3.2] |",
        "| 5.2 | Ledger Database | [02-ledger-db.md](payments/02-ledger-db.md) | Database | [PostgreSQL 16] |",
      ]),
    );
    expect(diffIndex(projectRoot).missing_rows).toEqual([]);
  });
});

describe("renderIndex — positional numbering is order-dependent", () => {
  // Documented, not asserted-as-desirable. A file with no `NN-` prefix has no
  // authoritative index; renderIndex seeds a counter from the highest explicit
  // prefix and increments from there. Adding a prefixed file with a higher
  // number therefore renumbers every unprefixed file, producing churn in
  // docs/components/README.md that is unrelated to the edit. Each such file
  // already carries a `missing-index-prefix` warning saying its number is
  // positional; these tests make the consequence visible.

  test("unprefixed files number after the highest explicit prefix", () => {
    write("docs/components/02-alpha.md", container({ name: "Alpha", slug: "alpha" }));
    write("docs/components/beta.md", container({ name: "Beta", slug: "beta" }));

    const index = renderIndex(projectRoot);
    expect(index).toContain("| 5.2 |");   // explicit prefix wins
    expect(index).toContain("| 5.3 |");   // beta takes the next positional slot
  });

  test("adding a higher-prefixed file renumbers the unprefixed ones", () => {
    write("docs/components/02-alpha.md", container({ name: "Alpha", slug: "alpha" }));
    write("docs/components/beta.md", container({ name: "Beta", slug: "beta" }));
    const before = renderIndex(projectRoot);

    write("docs/components/09-gamma.md", container({ name: "Gamma", slug: "gamma" }));
    const after = renderIndex(projectRoot);

    // Beta did not change, but its number did — from 5.3 to 5.10.
    expect(before).toContain("| 5.3 | Beta");
    expect(after).toContain("| 5.10 | Beta");
    expect(after).not.toContain("| 5.3 | Beta");
  });

  test("an all-prefixed component set is stable across additions", () => {
    // The mitigation: give every component an NN- prefix and the churn is gone.
    write("docs/components/01-alpha.md", container({ name: "Alpha", slug: "alpha" }));
    write("docs/components/02-beta.md", container({ name: "Beta", slug: "beta" }));
    const before = renderIndex(projectRoot);

    write("docs/components/09-gamma.md", container({ name: "Gamma", slug: "gamma" }));
    const after = renderIndex(projectRoot);

    expect(before).toContain("| 5.1 | Alpha");
    expect(before).toContain("| 5.2 | Beta");
    expect(after).toContain("| 5.1 | Alpha");
    expect(after).toContain("| 5.2 | Beta");
  });
});

describe("renderIndex", () => {
  test("groups by system, links the descriptor, and matches the committed table", () => {
    write("docs/components/payments.md", descriptor("Payments Platform", "payments"));
    write(
      "docs/components/payments/01-payment-service.md",
      container({ name: "Payment Service", slug: "payment-service" }),
    );
    write(
      "docs/components/payments/02-ledger-db.md",
      container({
        name: "Ledger Database",
        slug: "ledger-db",
        type: "Database",
        technology: "[PostgreSQL 16]",
        headerTech: "PostgreSQL 16",
      }),
    );

    expect(renderIndex(projectRoot)).toBe(
      [
        "### [Payments Platform](payments.md)",
        "",
        "| # | Component | File | Type | Technology |",
        "|---|-----------|------|------|------------|",
        "| 5.1 | Payment Service | [01-payment-service.md](payments/01-payment-service.md) | API Service | [Spring Boot 3.2] |",
        "| 5.2 | Ledger Database | [02-ledger-db.md](payments/02-ledger-db.md) | Database | [PostgreSQL 16] |",
      ].join("\n"),
    );
  });

  test("rendered output round-trips through diffIndex with no findings", () => {
    write("docs/components/payments.md", descriptor("Payments Platform", "payments"));
    write(
      "docs/components/payments/01-payment-service.md",
      container({ name: "Payment Service", slug: "payment-service" }),
    );
    write(
      "docs/components/README.md",
      ["# Component Details", "", renderIndex(projectRoot), ""].join("\n"),
    );
    expect(diffIndex(projectRoot)).toEqual({
      missing_rows: [],
      orphan_rows: [],
      stale_rows: [],
    });
  });

  test("legacy flat components render before any grouped system", () => {
    write(
      "docs/components/legacy-service.md",
      ["# Legacy Service", "", "**Type:** API Service", "**Technology:** [Java 8]", ""].join("\n"),
    );
    write("docs/components/payments.md", descriptor("Payments Platform", "payments"));
    write(
      "docs/components/payments/01-payment-service.md",
      container({ name: "Payment Service", slug: "payment-service" }),
    );
    const rendered = renderIndex(projectRoot);
    expect(rendered.indexOf("Legacy Service")).toBeLessThan(
      rendered.indexOf("### [Payments Platform]"),
    );
  });

  test("an unprefixed component gets a free number, never a blank or duplicate cell", () => {
    write(
      "docs/components/legacy-service.md",
      ["# Legacy Service", "", "**Type:** API Service", "**Technology:** [Java 8]", ""].join("\n"),
    );
    write("docs/components/payments.md", descriptor("Payments Platform", "payments"));
    write(
      "docs/components/payments/01-payment-service.md",
      container({ name: "Payment Service", slug: "payment-service" }),
    );
    write(
      "docs/components/payments/02-ledger-db.md",
      container({
        name: "Ledger Database",
        slug: "ledger-db",
        type: "Database",
        technology: "[PostgreSQL 16]",
        headerTech: "PostgreSQL 16",
      }),
    );

    const rendered = renderIndex(projectRoot);
    const numbers = parseIndexRows(rendered).map((r) => r.index);
    expect(numbers).toEqual(["5.3", "5.1", "5.2"]);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(numbers).not.toContain("");
  });

  test("an unprefixed component round-trips through diffIndex without a false missing row", () => {
    write(
      "docs/components/legacy-service.md",
      ["# Legacy Service", "", "**Type:** API Service", "**Technology:** [Java 8]", ""].join("\n"),
    );
    write(
      "docs/components/README.md",
      ["# Component Details", "", renderIndex(projectRoot), ""].join("\n"),
    );
    expect(diffIndex(projectRoot)).toEqual({
      missing_rows: [],
      orphan_rows: [],
      stale_rows: [],
    });
  });

  test("an unprefixed L2 file is flagged so the architect can rename it", () => {
    write(
      "docs/components/legacy-service.md",
      ["# Legacy Service", "", "**Type:** API Service", "**Technology:** [Java 8]", ""].join("\n"),
    );
    const [fact] = listComponents(projectRoot);
    expect(fact.warnings.some((w) => w.startsWith("missing-index-prefix"))).toBe(true);
  });
});

describe("internal name", () => {
  const file = (opts: { row?: string; headerKey?: string }) =>
    `# MFA Historial de Pedidos\n\n<!-- EXPLORER_HEADER\nkey_concepts: historial, contraparte\ntechnologies: React 18\ncomponent_self: mfa-historial-de-pedidos\ncomponent_type: web-application\n${opts.headerKey ? `internal_name: ${opts.headerKey}\n` : ""}scope: Micro frontend del historial\n-->\n\n**Type:** Web Application\n**Technology:** [React 18]\n**Description:** MFA Historial de Pedidos compone la vista conversacional del historial.\n${opts.row ? `**Internal Name:** ${opts.row}\n` : ""}\n**Component Version:** 1.2.0\n`;

  test("the metadata row is the source, backticks stripped, and it mirrors the header", () => {
    write("docs/components/tienda-movil/03-mfa-historial-de-pedidos.md", file({ row: "`shp-spa-order-history`", headerKey: "shp-spa-order-history" }));
    const [f] = listComponents(projectRoot);
    expect(f.internal_name).toBe("shp-spa-order-history");
    expect(f.name).toBe("MFA Historial de Pedidos");
    expect(f.warnings).toEqual([]);
  });

  test("the header alone supplies it; a disagreeing header is a warning and the row wins", () => {
    write("docs/components/tienda-movil/03-mfa-historial-de-pedidos.md", file({ headerKey: "shp-spa-order-history" }));
    expect(listComponents(projectRoot)[0].internal_name).toBe("shp-spa-order-history");
    write("docs/components/tienda-movil/03-mfa-historial-de-pedidos.md", file({ row: "shp-spa-order-history", headerKey: "shp-spa-old" }));
    const [f] = listComponents(projectRoot);
    expect(f.internal_name).toBe("shp-spa-order-history");
    expect(f.warnings.some((w) => w.startsWith("internal-name-mismatch"))).toBe(true);
  });

  test("a placeholder or an authoring comment is not an internal name", () => {
    write("docs/components/tienda-movil/03-mfa-historial-de-pedidos.md", file({ row: "Sin declarar <!-- TODO: Add source reference -->" }));
    expect(listComponents(projectRoot)[0].internal_name).toBeNull();
    write("docs/components/tienda-movil/03-mfa-historial-de-pedidos.md", file({ row: "`shp-spa-x` <!-- confirm with the team -->" }));
    expect(listComponents(projectRoot)[0].internal_name).toBe("shp-spa-x");
  });

  test("absent everywhere is null, not the slug", () => {
    write("docs/components/tienda-movil/03-mfa-historial-de-pedidos.md", file({}));
    expect(listComponents(projectRoot)[0].internal_name).toBeNull();
  });
});

describe("description — the tagline contract (8.64.0)", () => {
  test("checkDescription: absent is a defect on L2 only; the name first, plain, then a non-word character; 120 code points at most", () => {
    expect(checkDescription("Payment Service", null, "L2")).toEqual(["missing-field: **Description:**"]);
    expect(checkDescription("Payments", null, "L1")).toEqual([]);
    expect(checkDescription("Payment Service", "Payment Service authorizes card payments.", "L2")).toEqual([]);
    expect(checkDescription("Payment Service", "Payment Service", "L2")).toEqual([]);                        // the name alone opens and ends it
    expect(checkDescription("Payment Service", "Payment Service: captures and refunds.", "L2")).toEqual([]);
    expect(checkDescription("Payment Service", "Payment Services authorizes.", "L2")[0]).toMatch(/^description-name-prefix: must open with the canonical name "Payment Service"/);
    expect(checkDescription("Payment Service", "`Payment Service` authorizes.", "L2")[0]).toMatch(/^description-name-prefix/);   // plain text, no markup
    expect(checkDescription("Payment Service", "Authorizes card payments.", "L2")[0]).toMatch(/reads "Authorizes card payments\."$/);
    const accented = "Bóveda Key Vault " + "é".repeat(DESCRIPTION_MAX_CHARS - 17);       // exactly 120 code points, more bytes
    expect(checkDescription("Bóveda Key Vault", accented, "L2")).toEqual([]);
    expect(checkDescription("Bóveda Key Vault", accented + "x", "L2")).toEqual([
      `description-too-long: ${DESCRIPTION_MAX_CHARS + 1} characters (cap ${DESCRIPTION_MAX_CHARS}) — a fixed-width slot; move the detail to Purpose`,
    ]);
    const both = checkDescription("Payment Service", "Handles " + "x".repeat(130), "L2");
    expect(both.map((w) => w.split(":")[0])).toEqual(["description-too-long", "description-name-prefix"]);
  });

  test("listComponents reads the field, warns per file, and leaves it null on an L1 descriptor and a table-declared row", () => {
    write("docs/components/payments.md", descriptor("Payments Platform", "payments"));
    write("docs/components/payments/01-payment-service.md", container({ name: "Payment Service", slug: "payment-service" }));
    write("docs/components/payments/02-ledger.md", container({ name: "Ledger", slug: "ledger", description: "Stores every posting." }));
    write("docs/components/payments/03-vault.md", container({ name: "Vault", slug: "vault", description: null }));
    write("docs/components/hub.md", `# Hub\n\n**C4 Level:** System (L1)\n**Type:** External System\n**Description:** Hub clears interbank transfers.\n\n## Containers\n\n| Component | Type | Technology |\n|---|---|---|\n| Hub API | Gateway | [Azure APIM] |\n`);
    const facts = listComponents(projectRoot);
    const by = (name: string) => facts.find((f) => f.name === name)!;
    expect(by("Payment Service").description).toBe("Payment Service authorizes, captures and refunds card payments.");
    expect(by("Payment Service").warnings).toEqual([]);
    expect(by("Ledger").warnings).toEqual([expect.stringMatching(/^description-name-prefix: must open with the canonical name "Ledger"/)]);
    expect(by("Vault").description).toBeNull();
    expect(by("Vault").warnings).toEqual(["missing-field: **Description:**"]);
    expect(by("Payments Platform")).toMatchObject({ description: null, warnings: [] });   // an L1 without one is not a defect
    expect(by("Hub")).toMatchObject({ description: "Hub clears interbank transfers.", warnings: ["missing-header: no EXPLORER_HEADER block"] });   // held to the contract when present
    expect(by("Hub API").description).toBeNull();
  });
});

describe("table-declared containers (8.20.0)", () => {
  test("rows of an external descriptor's Containers table are L2 facts with file_backed false; an internal descriptor restating its files adds nothing", () => {
    write("docs/components/desk.md", `# Desk\n\n**C4 Level:** System (L1)\n**Type:** Internal System\n\n## Containers\n\n| Component | Type | Technology |\n|---|---|---|\n| [Web App](desk/01-web-app.md) | Web Application | [React] |\n`);
    write("docs/components/desk/01-web-app.md", `# Web App\n\n**Type:** Web Application\n**Technology:** [React]\n**Internal Name:** \`CHL-1\`\n**C4 Level:** Container (L2)\n`);
    write("docs/components/hub.md", `# Hub\n\n**C4 Level:** System (L1)\n**Type:** External System\n\n## Containers\n\n| Component | Type | Technology | Internal Name |\n|---|---|---|---|\n| Hub API | Gateway | [Azure APIM] | \`HUB-API\` |\n| Hub Ledger | Database | [Oracle] | |\n`);
    const facts = listComponents(projectRoot);
    const hub = facts.find((f) => f.slug === "hub")!;
    expect(hub.level).toBe("L1");                                   // typed as a System, no folder needed
    const web = facts.filter((f) => f.name === "Web App");
    expect(web.length).toBe(1);                                      // the descriptor's row restates the file — not a second fact
    expect(web[0]).toMatchObject({ file_backed: true, internal_name: "CHL-1" });
    const api = facts.find((f) => f.name === "Hub API")!;
    expect(api).toMatchObject({ level: "L2", system: "hub", slug: "hub-api", type: "Gateway", technology: ["Azure APIM"], internal_name: "HUB-API", file_backed: false, path: "docs/components/hub.md", index: null, header: null });
    expect(facts.find((f) => f.name === "Hub Ledger")).toMatchObject({ type: "Database", technology: ["Oracle"], internal_name: null, file_backed: false });
    expect(renderIndex(projectRoot)).not.toMatch(/Hub API|Hub Ledger/);   // the index lists files only
    expect(diffIndex(projectRoot).missing_rows).not.toContain("docs/components/hub.md");
  });
});


describe("renderReadme (8.90.0)", () => {
  test("the whole README by code: header, intro, system section, externals, relationships, related docs — and check passes it", () => {
    write("docs/components/payments.md", descriptor("Payments", "payments"));
    write("docs/components/payments/01-payment-service.md", container({ name: "Payment Service" }));
    write("docs/components/card-network.md", ["# Card Network", "", "**C4 Level:** System (L1)", "**Type:** External System", ""].join("\n"));
    write("docs/05-integration-points.md", "# Integraciones\n\n| # | From | To | Protocol |\n|---|---|---|---|\n| I-01 | `Payment Service` | Card Network | HTTPS/JSON [Command] |\n| I-02 | ~~Old~~ | Card Network | SOAP |\n");
    write("docs/01-system-overview.md", "# Descripción del Sistema\n");
    const r = renderReadme(projectRoot, "es");
    expect(r.split("\n")[0]).toBe("<!-- managed by sa-skills:architecture-component-guardian — do not edit manually -->");
    expect(r).toContain("# Component Details");
    expect(r).toContain("Índice de los contenedores C4 de nivel 2 de Payments.");
    expect(r).toContain("## Payments Components");
    expect(r).toContain("| 5.1 | Payment Service |");
    expect(r).toContain("### Sistemas externos\n\n- [Card Network](card-network.md)");
    expect(r).toContain("- Payment Service → Card Network · HTTPS/JSON [Command]");
    expect(r).not.toContain("SOAP");
    expect(r).toContain("- [Descripción del Sistema](../01-system-overview.md)");
    write("docs/components/README.md", r);
    const d = diffIndex(projectRoot); expect(d.missing_rows.length + d.orphan_rows.length + d.stale_rows.length).toBe(0);
  });
});
