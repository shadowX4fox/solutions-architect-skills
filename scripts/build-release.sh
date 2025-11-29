#!/bin/bash
set -e

# Solutions Architect Skills - Release Build Script
# Builds a distributable ZIP package for Claude Code plugin

VERSION="1.0.0"
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

# Verify directories exist
required_dirs=(
    "skills/architecture-readiness"
    "skills/architecture-docs"
    "skills/architecture-compliance"
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

# Count files to include
echo "Counting files..."
SKILL_FILES=$(find skills -name "*.md" | wc -l)
DOC_FILES=$(find docs -name "*.md" | wc -l)
EXAMPLE_FILES=$(find examples -name "*.md" | wc -l)

echo "  Skills files: ${SKILL_FILES}"
echo "  Documentation files: ${DOC_FILES}"
echo "  Example files: ${EXAMPLE_FILES}"
echo ""

# Build ZIP archive
echo "Building release package..."
zip -r "${RELEASE_FILE}" \
    .claude-plugin/ \
    skills/ \
    docs/ \
    examples/ \
    README.md \
    LICENSE \
    CHANGELOG.md \
    CLAUDE.md \
    .gitignore \
    -x "*.git*" "*.DS_Store" "__pycache__/*" "*.pyc" "node_modules/*" \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Release package built successfully"
else
    echo "❌ ERROR: Failed to build release package"
    exit 1
fi

# Calculate package size
PACKAGE_SIZE=$(du -h "${RELEASE_FILE}" | cut -f1)
echo ""
echo "Package size: ${PACKAGE_SIZE}"
echo ""

# Verify ZIP contents
echo "Verifying ZIP contents..."
ZIP_FILE_COUNT=$(unzip -l "${RELEASE_FILE}" | grep -c "\.md")
echo "  Markdown files in ZIP: ${ZIP_FILE_COUNT}"

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