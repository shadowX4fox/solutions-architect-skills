#!/usr/bin/env node

/**
 * Template Include Resolution Utility
 *
 * Resolves @include and @include-with-config directives in compliance templates.
 *
 * Usage:
 *   node resolve-includes.js <template-file> [output-file]
 *
 * If output-file is omitted, outputs to stdout.
 */

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.join(__dirname, '..');
const MAX_DEPTH = 3;

/**
 * Load a JSON config file
 */
function loadConfig(configName) {
  const configPath = path.join(SKILL_DIR, 'shared', 'config', `${configName}.json`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Replace {{variables}} in content with values from config
 */
function replaceVariables(content, config) {
  let result = content;

  // Replace all {{variable}} patterns
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (config.hasOwnProperty(varName)) {
      return config[varName];
    }
    // Keep the placeholder if variable not found in config
    console.warn(`Warning: Variable {{${varName}}} not found in config`);
    return match;
  });

  return result;
}

/**
 * Resolve a single include directive
 */
function resolveInclude(directive, config, depth, processedFiles) {
  const { type, filePath, configName } = directive;

  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    throw new Error(`Max include depth (${MAX_DEPTH}) exceeded`);
  }

  // Resolve file path relative to skill directory
  const fullPath = path.join(SKILL_DIR, filePath);

  // Detect circular includes
  if (processedFiles.has(fullPath)) {
    throw new Error(`Circular include detected: ${filePath}`);
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Include file not found: ${fullPath}`);
  }

  // Read the included file
  let content = fs.readFileSync(fullPath, 'utf8');

  // Mark as processed
  processedFiles.add(fullPath);

  // If it's a parameterized include, load config and replace variables
  if (type === 'with-config') {
    if (!configName) {
      throw new Error(`Config name required for @include-with-config: ${filePath}`);
    }

    const domainConfig = config || loadConfig(configName);
    content = replaceVariables(content, domainConfig);
  }

  // Recursively resolve nested includes
  content = resolveIncludes(content, config, depth + 1, processedFiles);

  // Remove from processed to allow reuse in different branches
  processedFiles.delete(fullPath);

  return content;
}

/**
 * Parse an include directive
 */
function parseDirective(directiveText) {
  // Pattern: <!-- @include(-with-config)? path/to/file.md (config=name)? -->
  const match = directiveText.match(/<!--\s*@include(-with-config)?\s+(.+?)\s*(?:config=(\S+))?\s*-->/);

  if (!match) {
    return null;
  }

  return {
    full: match[0],
    type: match[1] ? 'with-config' : 'simple',
    filePath: match[2].trim(),
    configName: match[3] || null
  };
}

/**
 * Resolve all includes in content
 */
function resolveIncludes(content, config = null, depth = 0, processedFiles = new Set()) {
  // Find all include directives
  const includePattern = /<!--\s*@include(-with-config)?\s+.+?\s*(?:config=\S+)?\s*-->/g;

  let result = content;
  let match;

  while ((match = includePattern.exec(content)) !== null) {
    const directive = parseDirective(match[0]);

    if (!directive) {
      console.warn(`Warning: Could not parse directive: ${match[0]}`);
      continue;
    }

    try {
      const resolvedContent = resolveInclude(directive, config, depth, processedFiles);
      result = result.replace(directive.full, resolvedContent);
    } catch (error) {
      console.error(`Error resolving include: ${directive.filePath}`);
      console.error(error.message);
      // Keep the directive in place on error
    }
  }

  return result;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node resolve-includes.js <template-file> [output-file]');
    console.error('');
    console.error('Example:');
    console.error('  node resolve-includes.js templates/TEMPLATE_BUSINESS_CONTINUITY.md expanded.md');
    process.exit(1);
  }

  const templatePath = args[0];
  const outputPath = args[1] || null;

  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template file not found: ${templatePath}`);
    process.exit(1);
  }

  try {
    // Read template
    const content = fs.readFileSync(templatePath, 'utf8');

    // Resolve includes
    const expanded = resolveIncludes(content);

    // Output
    if (outputPath) {
      fs.writeFileSync(outputPath, expanded, 'utf8');
      console.log(`Template expanded successfully: ${outputPath}`);

      // Show statistics
      const originalLines = content.split('\n').length;
      const expandedLines = expanded.split('\n').length;
      console.log(`Lines: ${originalLines} → ${expandedLines} (+${expandedLines - originalLines})`);
    } else {
      console.log(expanded);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { resolveIncludes, loadConfig, replaceVariables };
