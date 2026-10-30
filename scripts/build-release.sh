#!/bin/bash
set -e

# Solutions Architect Skills - Release Build Script
# Builds a distributable ZIP package for Claude Code plugin

# The canonical version lives in .claude-plugin/plugin.json — never hardcode it
# here, or every build overwrites one stale artifact under the wrong name.
MANIFEST=".claude-plugin/plugin.json"
if [ ! -f "${MANIFEST}" ]; then
    echo "❌ ERROR: ${MANIFEST} not found — run this script from the repo root."
    exit 1
fi
VERSION=$(rg -m1 '"version"' "${MANIFEST}" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')
if [ -z "${VERSION}" ]; then
    echo "❌ ERROR: could not read \"version\" from ${MANIFEST}."
    exit 1
fi
PLUGIN_NAME="solutions-architect-skills"
OUTPUT_DIR="./release"
RELEASE_FILE="${OUTPUT_DIR}/${PLUGIN_NAME}-v${VERSION}.zip"

echo "=================================="
echo " Solutions Architect Skills"
echo " Release Build Script"
echo "=================================="
echo ""
echo "Version: ${VERSION}"
echo "Output: ${RELEASE_FILE}"
echo ""

# Create output directory
echo "Creating output directory..."
mkdir -p ${OUTPUT_DIR}

# Remove old release if exists
if [ -f "${RELEASE_FILE}" ]; then
    echo "Removing old release file..."
    rm -f "${RELEASE_FILE}"
fi

# Verify required files exist
echo "Verifying plugin structure..."
required_files=(
    ".claude-plugin/plugin.json"
    "README.md"
    "LICENSE"
    "CHANGELOG.md"
    "CLAUDE.md"
    ".gitignore"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ ERROR: Required file missing: $file"
        exit 1
    fi
done

# Verify directories exist. agents/, commands/, hooks/ and tools/ are shipped
# and load-bearing at runtime — a package without them has no sub-agents, no
# slash commands, no routing hook and no .docx/PDF export.
required_dirs=(
    "plugins/sa-requirements/skills/architecture-readiness"
    "skills/architecture-docs"
    "plugins/sa-records"
    "plugins/sa-analysis/skills/architecture-analysis"
    "plugins/sa-analysis/skills/architecture-traceability"
    "plugins/sa-delivery/skills/architecture-dev-handoff"
    "plugins/sa-delivery/skills/architecture-docs-export"
    "plugins/sa-delivery/skills/architecture-blueprint"
    "plugins/sa-delivery/skills/architecture-icepanel-sync"
    "plugins/sa-delivery/agents"
    "plugins/sa-visualization/skills/architecture-command-center"
    "agents"
    "commands"
    "hooks"
    "tools/docgen"
    "docs"
    "examples"
)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ ERROR: Required directory missing: $dir"
        exit 1
    fi
done

echo "✅ All required files and directories present"
echo ""

# Verify the dev-handoff agent bundles are in sync with their source files
echo "Verifying dev-handoff agent bundles..."
if ! bun tools/bundle-handoff-agent.ts --check; then
    echo "❌ ERROR: a bundled Ekonte generator is out of sync with its source template."
    echo "   Targets: plugins/sa-delivery/agents/generators/{ekonte,settei,seam,cutsheet,handoff-asset}-generator.md"
    echo "   Run: bun run bundle:handoff-agent && commit the result."
    exit 1
fi
echo ""

# Run the unit tests — this is what catches a template edited without a
# TEMPLATE_VERSION bump (the frozen-fixture tripwire in
# plugins/sa-delivery/skills/architecture-dev-handoff/utils/manifest.test.ts). Without this gate a
# stale fixture ships silently and the tripwire protects nothing.
echo "Running unit tests..."
if ! bun test; then
    echo "❌ ERROR: unit tests failed. Fix them before building a release."
    echo "   If HANDOFF_TEMPLATE.md changed on purpose: bump its TEMPLATE_VERSION,"
    echo "   then update FROZEN_SHA and FROZEN_VERSION in utils/manifest.test.ts."
    exit 1
fi
echo ""

# Validate skill frontmatter. An over-long description is silently truncated at
# routing time, which is how the export skill lost its "do NOT use this for
# release" clause; this gate makes that a build failure instead.
echo "Checking skill frontmatter..."
if ! bun scripts/check-skill-frontmatter.ts; then
    echo "❌ ERROR: skill frontmatter invalid. Fix the reported errors before building a release."
    exit 1
fi
echo ""

# Validate agent structure. A standing-instruction section swallowed by a code
# fence reads as sample data and silently stops binding the agent.
echo "Checking agent structure..."
if ! bun scripts/check-agent-structure.ts; then
    echo "❌ ERROR: agent structure invalid. Fix the reported errors before building a release."
    exit 1
fi
echo ""

# Every file a validator reads must also be in its config's phase3.required_files,
# or the generator writes a contract without the evidence the validator used.
echo "Checking validator/config file coverage..."
if ! bun scripts/check-validator-configs.ts; then
    echo "❌ ERROR: validator/config coverage gap. Fix the reported errors before building a release."
    exit 1
fi
echo ""

# The Lazy-Load Contract advertises a context budget per guide; a stale count
# means the orchestrator is planning against numbers the files do not impose.
echo "Checking Lazy-Load Contract line counts..."
if ! bun scripts/check-lazyload-sizes.ts; then
    echo "❌ ERROR: stale line counts. Run: bun scripts/check-lazyload-sizes.ts --fix"
    exit 1
fi
echo ""

# Type-check the TypeScript utilities
echo "Type-checking..."
if ! bun run typecheck; then
    echo "❌ ERROR: type-check failed. Fix the reported errors before building a release."
    exit 1
fi
echo ""

# Count files to include
echo "Counting files..."
SKILL_FILES=$(rg --files skills -g '*.md' | wc -l)
DOC_FILES=$(rg --files docs -g '*.md' | wc -l)
EXAMPLE_FILES=$(rg --files examples -g '*.md' 2>/dev/null | wc -l)

echo "  Skills files: ${SKILL_FILES}"
echo "  Documentation files: ${DOC_FILES}"
echo "  Example files: ${EXAMPLE_FILES}"
echo ""

# Build ZIP archive.
#
# agents/, commands/, hooks/ and tools/ were missing here through v5.2.0, so a
# ZIP install had no sub-agents, no slash commands, no UserPromptSubmit routing
# hook and no document export. package.json + tsconfig.json ship so the
# TypeScript utilities and docgen can be installed and run from the package.
echo "Building release package..."
# `set -e` aborts on a non-zero zip exit before any `$?` test could run, so the
# failure branch has to be attached to the command itself.
if ! zip -r "${RELEASE_FILE}" \
    .claude-plugin/ \
    agents/ \
    commands/ \
    hooks/ \
    skills/ \
    plugins/ \
    tools/ \
    scripts/ \
    docs/ \
    examples/ \
    README.md \
    LICENSE \
    CHANGELOG.md \
    CLAUDE.md \
    package.json \
    tsconfig.json \
    .gitignore \
    -x "*.git*" "*.DS_Store" "__pycache__/*" "*.pyc" "node_modules/*" "*/node_modules/*" \
    > /dev/null 2>&1; then
    echo "❌ ERROR: Failed to build release package"
    exit 1
fi
echo "✅ Release package built successfully"

# Calculate package size
PACKAGE_SIZE=$(du -h "${RELEASE_FILE}" | cut -f1)
echo ""
echo "Package size: ${PACKAGE_SIZE}"
echo ""

# Verify ZIP contents. `rg -c` prints nothing and exits 1 on zero matches, which under
# `set -e` would abort the build after the artifact was already written — so the
# count is taken with a guard that yields 0.
echo "Verifying ZIP contents..."
ZIP_LISTING=$(unzip -l "${RELEASE_FILE}")
ZIP_FILE_COUNT=$(echo "${ZIP_LISTING}" | rg -c '\.md' || echo 0)
echo "  Markdown files in ZIP: ${ZIP_FILE_COUNT}"

# A package missing any of these installs but does not work. Assert on the
# real listing rather than trusting the zip argument list above.
echo "Verifying required paths are present in the package..."
required_in_zip=(
    ".claude-plugin/plugin.json"
    "commands/setup.md"
    "hooks/route-architecture-docs.sh"
    "hooks/hooks.json"
    "hooks/prose-hook.sh"
    "skills/architecture-docs/scripts/prose-hook.js"
    "tools/docgen/generate-doc.js"
    "tools/docgen/render-pdf.js"
    "tools/docgen/render-mermaid.js"
    "tools/docgen/theme.js"
    "tools/docgen/themes/alia/theme.json"
    "tools/docgen/themes/alia/cover.png"
    "tools/docgen/package.json"
    "scripts/setup-docgen.ts"
    "skills/architecture-docs/SKILL.md"
    "plugins/sa-records/.claude-plugin/plugin.json"
    "plugins/sa-records/skills/architecture-definition-record/SKILL.md"
    "plugins/sa-analysis/.claude-plugin/plugin.json"
    "plugins/sa-analysis/scripts/sa-skills.js"
    "plugins/sa-delivery/.claude-plugin/plugin.json"
    "plugins/sa-delivery/scripts/sa-skills.js"
    "plugins/sa-visualization/.claude-plugin/plugin.json"
    "plugins/sa-visualization/scripts/sa-skills.js"
    "plugins/sa-visualization/skills/architecture-command-center/VIEWER_TEMPLATE.html"
)
missing_in_zip=0
for path in "${required_in_zip[@]}"; do
    if ! echo "${ZIP_LISTING}" | rg -q " ${path}$"; then
        echo "❌ ERROR: ${path} is missing from the release package"
        missing_in_zip=1
    fi
done
if [ "${missing_in_zip}" -ne 0 ]; then
    echo "   The zip file list in this script is out of sync with the plugin layout."
    exit 1
fi
AGENT_COUNT=$(echo "${ZIP_LISTING}" | rg -c 'agents/.*\.md$' || echo 0)
echo "  ✅ All required paths present (${AGENT_COUNT} agent files bundled)"

# Calculate SHA256 checksum
if command -v sha256sum &> /dev/null; then
    CHECKSUM=$(sha256sum "${RELEASE_FILE}" | cut -d' ' -f1)
    echo ""
    echo "SHA256: ${CHECKSUM}"
    echo "${CHECKSUM}  ${RELEASE_FILE}" > "${OUTPUT_DIR}/${PLUGIN_NAME}-v${VERSION}.sha256"
    echo "Checksum saved to: ${OUTPUT_DIR}/${PLUGIN_NAME}-v${VERSION}.sha256"
fi

echo ""
echo "=================================="
echo " Build Complete!"
echo "=================================="
echo ""
echo "Release file: ${RELEASE_FILE}"
echo "Package size: ${PACKAGE_SIZE}"
echo ""
echo "Next steps:"
echo "1. Test installation:"
echo "   unzip ${RELEASE_FILE} -d /tmp/test-plugin"
echo "   mv /tmp/test-plugin/${PLUGIN_NAME} ~/.claude/plugins/"
echo ""
echo "2. Create GitHub release:"
echo "   - Tag: v${VERSION}"
echo "   - Upload: ${RELEASE_FILE}"
echo "   - Upload: ${OUTPUT_DIR}/${PLUGIN_NAME}-v${VERSION}.sha256"
echo ""