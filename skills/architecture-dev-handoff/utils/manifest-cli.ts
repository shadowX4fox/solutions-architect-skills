#!/usr/bin/env bun
/**
 * Orchestrator-invokable CLI for handoffs/.manifest.json operations.
 *
 * Subcommands:
 *   hash <payload_path> <template_version>
 *     Print SHA-256 of payload + template version. Used by the orchestrator
 *     to compute the per-component fingerprint after writing each payload.
 *
 *   check <manifest_path> <slug> <payload_hash> <template_version> \
 *         <schema_version> <handoff_file_abs_path> [--force]
 *     Print "SKIP <reason>" or "REGEN <reason>" — orchestrator uses this
 *     decision to include or exclude the component from the next sub-agent
 *     batch. Exit code is always 0 unless the inputs themselves are invalid.
 *
 *   update <manifest_path> <slug> <payload_hash> <template_version> \
 *          <schema_version> <architecture_version> <handoff_file_rel> \
 *          <doc_language> <generator_version> <asset1,asset2,...>
 *     Merge or insert a manifest entry and write back atomically.
 *
 *   init <manifest_path> <generator_version>
 *     Create an empty manifest if one doesn't exist. Idempotent.
 */
import {
  emptyManifest,
  hashPayload,
  loadManifest,
  saveManifest,
  shouldSkip,
  updateEntry,
} from "./manifest";

const [, , subcommand, ...rest] = process.argv;

function fail(msg: string): never {
  console.error(`manifest-cli: ${msg}`);
  process.exit(2);
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

  case "check": {
    const [
      manifestPath,
      slug,
      payloadHash,
      templateVersion,
      schemaVersion,
      handoffFileAbsPath,
      ...flags
    ] = rest;
    if (
      !manifestPath ||
      !slug ||
      !payloadHash ||
      !templateVersion ||
      !schemaVersion ||
      !handoffFileAbsPath
    ) {
      fail(
        "usage: check <manifest_path> <slug> <payload_hash> " +
          "<template_version> <schema_version> <handoff_file_abs_path> [--force]",
      );
    }
    const force = flags.includes("--force");
    const manifest = loadManifest(manifestPath, "0.0.0");
    const decision = shouldSkip({
      manifest,
      slug,
      payloadHash,
      templateVersion,
      schemaVersion,
      handoffFileAbsPath,
      force,
    });
    console.log(`${decision.skip ? "SKIP" : "REGEN"} ${decision.reason}`);
    break;
  }

  case "update": {
    const [
      manifestPath,
      slug,
      payloadHash,
      templateVersion,
      schemaVersion,
      architectureVersion,
      handoffFileRel,
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
      !handoffFileRel ||
      !docLanguage ||
      !generatorVersion
    ) {
      fail(
        "usage: update <manifest_path> <slug> <payload_hash> " +
          "<template_version> <schema_version> <architecture_version> " +
          "<handoff_file_rel> <doc_language> <generator_version> " +
          "<asset1,asset2,...>",
      );
    }
    const manifest = loadManifest(manifestPath, generatorVersion);
    manifest.generator_version = generatorVersion;
    const assets = (assetsCsv ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    updateEntry(manifest, slug, {
      payload_hash: payloadHash,
      template_version: templateVersion,
      schema_version: schemaVersion,
      architecture_version: architectureVersion === "" ? null : architectureVersion,
      handoff_file: handoffFileRel,
      assets,
      doc_language: docLanguage,
    });
    saveManifest(manifestPath, manifest);
    console.log(`updated ${slug} in ${manifestPath}`);
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

  default:
    fail(
      `unknown subcommand "${subcommand ?? ""}". ` +
        "Expected one of: hash, check, update, init.",
    );
}
