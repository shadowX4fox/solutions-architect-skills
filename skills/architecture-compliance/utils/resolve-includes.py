#!/usr/bin/env python3

"""
Template Include Resolution Utility

Resolves @include and @include-with-config directives in compliance templates.

Usage:
    python3 resolve-includes.py <template-file> [output-file]

If output-file is omitted, outputs to stdout.
"""

import json
import os
import re
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).parent.parent
MAX_DEPTH = 3


def load_config(config_name):
    """Load a JSON config file"""
    config_path = SKILL_DIR / 'shared' / 'config' / f'{config_name}.json'

    if not config_path.exists():
        raise FileNotFoundError(f'Config file not found: {config_path}')

    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def replace_variables(content, config):
    """Replace {{variables}} in content with values from config"""

    def replacer(match):
        var_name = match.group(1)
        if var_name in config:
            return str(config[var_name])
        # Keep the placeholder if variable not found in config
        print(f'Warning: Variable {{{{{var_name}}}}} not found in config', file=sys.stderr)
        return match.group(0)

    return re.sub(r'\{\{(\w+)\}\}', replacer, content)


def parse_directive(directive_text):
    """Parse an include directive"""
    # Pattern: <!-- @include(-with-config)? path/to/file.md (config=name)? -->
    pattern = r'<!--\s*@include(-with-config)?\s+(.+?)\s*(?:config=(\S+))?\s*-->'
    match = re.match(pattern, directive_text)

    if not match:
        return None

    return {
        'full': match.group(0),
        'type': 'with-config' if match.group(1) else 'simple',
        'file_path': match.group(2).strip(),
        'config_name': match.group(3) or None
    }


def resolve_include(directive, config, depth, processed_files):
    """Resolve a single include directive"""
    include_type = directive['type']
    file_path = directive['file_path']
    config_name = directive['config_name']

    # Prevent infinite recursion
    if depth > MAX_DEPTH:
        raise RecursionError(f'Max include depth ({MAX_DEPTH}) exceeded')

    # Resolve file path relative to skill directory
    full_path = SKILL_DIR / file_path

    # Detect circular includes
    full_path_str = str(full_path)
    if full_path_str in processed_files:
        raise ValueError(f'Circular include detected: {file_path}')

    if not full_path.exists():
        raise FileNotFoundError(f'Include file not found: {full_path}')

    # Read the included file
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Mark as processed
    processed_files.add(full_path_str)

    # If it's a parameterized include, load config and replace variables
    if include_type == 'with-config':
        if not config_name:
            raise ValueError(f'Config name required for @include-with-config: {file_path}')

        domain_config = config or load_config(config_name)
        content = replace_variables(content, domain_config)

    # Recursively resolve nested includes
    content = resolve_includes(content, config, depth + 1, processed_files)

    # Remove from processed to allow reuse in different branches
    processed_files.discard(full_path_str)

    return content


def resolve_includes(content, config=None, depth=0, processed_files=None):
    """Resolve all includes in content"""
    if processed_files is None:
        processed_files = set()

    # Find all include directives
    include_pattern = r'<!--\s*@include(-with-config)?\s+.+?\s*(?:config=\S+)?\s*-->'

    result = content
    for match in re.finditer(include_pattern, content):
        directive_text = match.group(0)
        directive = parse_directive(directive_text)

        if not directive:
            print(f'Warning: Could not parse directive: {directive_text}', file=sys.stderr)
            continue

        try:
            resolved_content = resolve_include(directive, config, depth, processed_files)
            result = result.replace(directive['full'], resolved_content, 1)
        except Exception as e:
            print(f"Error resolving include: {directive['file_path']}", file=sys.stderr)
            print(f"  {str(e)}", file=sys.stderr)
            # Keep the directive in place on error

    return result


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print('Usage: python3 resolve-includes.py <template-file> [output-file]', file=sys.stderr)
        print('', file=sys.stderr)
        print('Example:', file=sys.stderr)
        print('  python3 resolve-includes.py templates/TEMPLATE_BUSINESS_CONTINUITY.md expanded.md', file=sys.stderr)
        sys.exit(1)

    template_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(template_path):
        print(f'Error: Template file not found: {template_path}', file=sys.stderr)
        sys.exit(1)

    try:
        # Read template
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Resolve includes
        expanded = resolve_includes(content)

        # Output
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(expanded)

            print(f'Template expanded successfully: {output_path}')

            # Show statistics
            original_lines = len(content.splitlines())
            expanded_lines = len(expanded.splitlines())
            print(f'Lines: {original_lines} → {expanded_lines} (+{expanded_lines - original_lines})')
        else:
            print(expanded)

    except Exception as e:
        print(f'Error: {str(e)}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
