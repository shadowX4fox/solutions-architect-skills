#!/usr/bin/env bun
/**
 * Orchestrator-invokable CLI for handoffs/.manifest.json (v3, handoff kit).
 *
 * Subcommands:
 *   hash <payload_path> <template_version>
 *     Print SHA-256 of payload + template version.
 *
 *   check-cut-sheet <manifest_path> <slug> <payload_hash> <template_version> \
 *                   <schema_version> <cut_sheet_file_abs_path> [--force]
 *   check-seam      <manifest_path> <edge_key> <payload_hash> <template_version> \
 *                   <schema_version> <seam_file_abs_path> [--force]
 *   check-run       <manifest_path> <part:ekonte|settei> <payload_hash> \
 *                   <template_version> <schema_version> <output_file_abs_path> [--force]
 *     Print "SKIP <reason>" or "REGEN <reason>" for the requested part.
 *
 *   update-cut-sheet <manifest_path> <slug> <payload_hash> <template_version> \
 *                    <schema_version> <architecture_version> <cut_sheet_file_rel> \
 *                    <doc_language> <generator_version> <asset1,asset2,...>
 *   update-seam      <manifest_path> <edge_key> <payload_hash> <template_version> \
 *                    <schema_version> <seam_file_rel> <generator_version> \
 *                    <adr1,adr2,...>
 *   update-run       <manifest_path> <part:ekonte|settei> <payload_hash> \
 *                    <template_version> <schema_version> <architecture_version> \
 *                    <generator_version>
 *
 *   init <manifest_path> <generator_version>
 *     Create an empty v3 manifest if one doesn't exist. Idempotent.
 *
 *   template-version <template_path>
 *     Print the TEMPLATE_VERSION marker embedded in a template file.
 */
import {
  hashPayload,
  loadManifest,
  readTemplateVersion,
  saveManifest,
  shouldSkip,
  updateCutSheetEntry,
  updateRunEntry,
  updateSeamEntry,
  type ManifestSection,
} from "./manifest";

const [, , subcommand, ...rest] = process.argv;

function fail(msg: string): never {
  console.error(`manifest-cli: ${msg}`);
  process.exit(2);
}

function toCsv(input: string | undefined): string[] {
  return (input ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function printDecision(section: ManifestSection, args: {
  manifestPath: string;
  payloadHash: string;
  templateVersion: string;
  schemaVersion: string;
  outputFileAbsPath: string;
  force: boolean;
  slug?: string;
  edgeKey?: string;
  part?: "ekonte" | "settei";
}): void {
  const manifest = loadManifest(args.manifestPath, "0.0.0");
  let decision;
  if (section === "cut_sheets") {
    decision = shouldSkip({
      manifest,
      section: "cut_sheets",
      slug: args.slug!,
      payloadHash: args.payloadHash,
      templateVersion: args.templateVersion,
      schemaVersion: args.schemaVersion,
      outputFileAbsPath: args.outputFileAbsPath,
      force: args.force,
    });
  } else if (section === "seams") {
    decision = shouldSkip({
      manifest,
      section: "seams",
      edgeKey: args.edgeKey!,
      payloadHash: args.payloadHash,
      templateVersion: args.templateVersion,
      schemaVersion: args.schemaVersion,
      outputFileAbsPath: args.outputFileAbsPath,
      force: args.force,
    });
  } else {
    decision = shouldSkip({
      manifest,
      section: "run",
      part: args.part!,
      payloadHash: args.payloadHash,
      templateVersion: args.templateVersion,
      schemaVersion: args.schemaVersion,
      outputFileAbsPath: args.outputFileAbsPath,
      force: args.force,
    });
  }
  console.log(`${decision.skip ? "SKIP" : "REGEN"} ${decision.reason}`);
}

switch (subcommand) {
  case "hash": {
    const [payloadPath, templateVersion] = rest;
    if (!payloadPath || !templateVersion) {
      fail("usage: hash <payload_path> <template_version>");
    }
    console.log(hashPayload(payloadPath, templateVersion));
    break;
  }

  case "check-cut-sheet": {
    const [manifestPath, slug, payloadHash, templateVersion, schemaVersion, outFile, ...flags] =
      rest;
    if (!manifestPath || !slug || !payloadHash || !templateVersion || !schemaVersion || !outFile) {
      fail(
        "usage: check-cut-sheet <manifest_path> <slug> <payload_hash> " +
          "<template_version> <schema_version> <cut_sheet_file_abs_path> [--force]",
      );
    }
    printDecision("cut_sheets", {
      manifestPath,
      slug,
      payloadHash,
      templateVersion,
      schemaVersion,
      outputFileAbsPath: outFile,
      force: flags.includes("--force"),
    });
    break;
  }

  case "check-seam": {
    const [
      manifestPath,
      edgeKey,
      payloadHash,
      templateVersion,
      schemaVersion,
      outFile,
      ...flags
    ] = rest;
    if (
      !manifestPath ||
      !edgeKey ||
      !payloadHash ||
      !templateVersion ||
      !schemaVersion ||
      !outFile
    ) {
      fail(
        "usage: check-seam <manifest_path> <edge_key> <payload_hash> " +
          "<template_version> <schema_version> <seam_file_abs_path> [--force]",
      );
    }
    printDecision("seams", {
      manifestPath,
      edgeKey,
      payloadHash,
      templateVersion,
      schemaVersion,
      outputFileAbsPath: outFile,
      force: flags.includes("--force"),
    });
    break;
  }

  case "check-run": {
    const [manifestPath, part, payloadHash, templateVersion, schemaVersion, outFile, ...flags] =
      rest;
    if (
      !manifestPath ||
      !part ||
      !payloadHash ||
      !templateVersion ||
      !schemaVersion ||
      !outFile
    ) {
      fail(
        "usage: check-run <manifest_path> <part:ekonte|settei> <payload_hash> " +
          "<template_version> <schema_version> <output_file_abs_path> [--force]",
      );
    }
    if (part !== "ekonte" && part !== "settei") {
      fail(`check-run: part must be "ekonte" or "settei" (got "${part}")`);
    }
    printDecision("run", {
      manifestPath,
      part: part as "ekonte" | "settei",
      payloadHash,
      templateVersion,
      schemaVersion,
      outputFileAbsPath: outFile,
      force: flags.includes("--force"),
    });
    break;
  }

  case "update-cut-sheet": {
    const [
      manifestPath,
      slug,
      payloadHash,
      templateVersion,
      schemaVersion,
      architectureVersion,
      cutSheetFileRel,
      docLanguage,
      generatorVersion,
      assetsCsv,
    ] = rest;
    if (
      !manifestPath ||
      !slug ||
      !payloadHash ||
      !templateVersion ||
      !schemaVersion ||
      !cutSheetFileRel ||
      !docLanguage ||
      !generatorVersion
    ) {
      fail(
        "usage: update-cut-sheet <manifest_path> <slug> <payload_hash> " +
          "<template_version> <schema_version> <architecture_version> " +
          "<cut_sheet_file_rel> <doc_language> <generator_version> " +
          "<asset1,asset2,...>",
      );
    }
    const manifest = loadManifest(manifestPath, generatorVersion);
    manifest.generator_version = generatorVersion;
    updateCutSheetEntry(manifest, slug, {
      payload_hash: payloadHash,
      template_version: templateVersion,
      schema_version: schemaVersion,
      architecture_version: architectureVersion === "" ? null : architectureVersion,
      cut_sheet_file: cutSheetFileRel,
      assets: toCsv(assetsCsv),
      doc_language: docLanguage,
    });
    saveManifest(manifestPath, manifest);
    console.log(`updated cut-sheet ${slug} in ${manifestPath}`);
    break;
  }

  case "update-seam": {
    const [
      manifestPath,
      edgeKey,
      payloadHash,
      templateVersion,
      schemaVersion,
      seamFileRel,
      generatorVersion,
      adrsCsv,
    ] = rest;
    if (
      !manifestPath ||
      !edgeKey ||
      !payloadHash ||
      !templateVersion ||
      !schemaVersion ||
      !seamFileRel ||
      !generatorVersion
    ) {
      fail(
        "usage: update-seam <manifest_path> <edge_key> <payload_hash> " +
          "<template_version> <schema_version> <seam_file_rel> " +
          "<generator_version> <adr1,adr2,...>",
      );
    }
    const manifest = loadManifest(manifestPath, generatorVersion);
    manifest.generator_version = generatorVersion;
    updateSeamEntry(manifest, edgeKey, {
      payload_hash: payloadHash,
      template_version: templateVersion,
      schema_version: schemaVersion,
      seam_file: seamFileRel,
      related_adrs: toCsv(adrsCsv),
    });
    saveManifest(manifestPath, manifest);
    console.log(`updated seam ${edgeKey} in ${manifestPath}`);
    break;
  }

  case "update-run": {
    const [
      manifestPath,
      part,
      payloadHash,
      templateVersion,
      schemaVersion,
      architectureVersion,
      generatorVersion,
    ] = rest;
    if (
      !manifestPath ||
      !part ||
      !payloadHash ||
      !templateVersion ||
      !schemaVersion ||
      !generatorVersion
    ) {
      fail(
        "usage: update-run <manifest_path> <part:ekonte|settei> <payload_hash> " +
          "<template_version> <schema_version> <architecture_version> " +
          "<generator_version>",
      );
    }
    if (part !== "ekonte" && part !== "settei") {
      fail(`update-run: part must be "ekonte" or "settei" (got "${part}")`);
    }
    const manifest = loadManifest(manifestPath, generatorVersion);
    manifest.generator_version = generatorVersion;
    const fields =
      part === "ekonte"
        ? {
            ekonte_hash: payloadHash,
            ekonte_template_version: templateVersion,
            schema_version: schemaVersion,
            architecture_version: architectureVersion === "" ? null : architectureVersion,
          }
        : {
            settei_hash: payloadHash,
            settei_template_version: templateVersion,
            schema_version: schemaVersion,
            architecture_version: architectureVersion === "" ? null : architectureVersion,
          };
    updateRunEntry(manifest, fields);
    saveManifest(manifestPath, manifest);
    console.log(`updated run.${part} in ${manifestPath}`);
    break;
  }

  case "init": {
    const [manifestPath, generatorVersion] = rest;
    if (!manifestPath || !generatorVersion) {
      fail("usage: init <manifest_path> <generator_version>");
    }
    const manifest = loadManifest(manifestPath, generatorVersion);
    saveManifest(manifestPath, manifest);
    console.log(`initialized ${manifestPath}`);
    break;
  }

  case "template-version": {
    const [templatePath] = rest;
    if (!templatePath) {
      fail("usage: template-version <template_path>");
    }
    console.log(readTemplateVersion(templatePath));
    break;
  }

  default:
    fail(
      `unknown subcommand "${subcommand ?? ""}". ` +
        "Expected one of: hash, check-cut-sheet, check-seam, check-run, " +
        "update-cut-sheet, update-seam, update-run, init, template-version.",
    );
}
