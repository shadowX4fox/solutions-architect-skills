#!/usr/bin/env python3
"""
Architecture Presentation Generator

Generates PowerPoint presentations from ARCHITECTURE.md files for different stakeholder types.
Supports Business, Architecture, and Compliance stakeholders in English and Spanish.

Version: 1.0
Date: 2025-12-21
"""

import sys
import os
import json
import re
from typing import Dict, List, Optional, Tuple, Any

# Add parent directory to path to import create_presentation utilities
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pptx import Presentation
from pptx.util import Inches, Pt
from create_presentation import (
    add_title_slide, add_content_slide, add_bullet_text, add_box,
    BLUE, GREEN, GRAY, WHITE, DARK_GRAY
)


class LanguageManager:
    """Manages translations and language-specific text for presentations"""

    def __init__(self, language_code: str = "en"):
        """
        Initialize language manager

        Args:
            language_code: Language code ('en' or 'es')
        """
        self.language_code = language_code.lower()
        self.translations = {}
        self._load_translations()

    def _load_translations(self):
        """Load translation file for the specified language"""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        lang_file = os.path.join(
            base_dir,
            'skills', 'architecture-docs', 'presentation',
            f'language_{self.language_code}.json'
        )

        if not os.path.exists(lang_file):
            raise FileNotFoundError(
                f"Language file not found: {lang_file}. "
                f"Supported languages: 'en', 'es'"
            )

        with open(lang_file, 'r', encoding='utf-8') as f:
            self.translations = json.load(f)

    def translate(self, key: str, **kwargs) -> str:
        """
        Get translated string for a key

        Args:
            key: Translation key (supports dot notation, e.g., 'slide_titles.agenda')
            **kwargs: Variables for string formatting

        Returns:
            Translated string
        """
        keys = key.split('.')
        value = self.translations

        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return f"[Missing translation: {key}]"

        if isinstance(value, str) and kwargs:
            return value.format(**kwargs)

        return value if isinstance(value, str) else str(value)

    def get_agenda_items(self, stakeholder_type: str) -> List[str]:
        """
        Get agenda items for a stakeholder type

        Args:
            stakeholder_type: 'business', 'architecture', or 'compliance'

        Returns:
            List of agenda items
        """
        return self.translations.get('agenda_items', {}).get(stakeholder_type, [])


class SectionExtractor:
    """Extracts data from ARCHITECTURE.md sections"""

    @staticmethod
    def extract_key_metrics(section_content: str) -> List[str]:
        """
        Extract key metrics from Section 1

        Args:
            section_content: Content of Section 1

        Returns:
            List of metric strings
        """
        metrics = []

        # Look for Key Metrics subsection
        metrics_pattern = r'###?\s+Key Metrics(.*?)(?:###|\Z)'
        match = re.search(metrics_pattern, section_content, re.DOTALL | re.IGNORECASE)

        if match:
            metrics_text = match.group(1)
            # Extract bullet points or table rows
            lines = metrics_text.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-') or line.startswith('*') or line.startswith('|'):
                    # Clean up markdown formatting
                    metric = re.sub(r'^[-*|\s]+', '', line)
                    metric = re.sub(r'\|', '', metric).strip()
                    if metric and not metric.startswith('---'):
                        metrics.append(metric)

        return metrics if metrics else ["[Metrics not documented in Section 1]"]

    @staticmethod
    def extract_business_value(section_content: str) -> List[str]:
        """
        Extract business value bullets from Section 1

        Args:
            section_content: Content of Section 1

        Returns:
            List of business value strings
        """
        values = []

        # Look for Business Value subsection
        value_pattern = r'###?\s+Business Value(.*?)(?:###|\Z)'
        match = re.search(value_pattern, section_content, re.DOTALL | re.IGNORECASE)

        if match:
            value_text = match.group(1)
            lines = value_text.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('-') or line.startswith('*'):
                    value = re.sub(r'^[-*\s]+', '', line)
                    if value:
                        values.append(value)

        return values if values else ["[Business value not documented in Section 1]"]

    @staticmethod
    def extract_use_cases(section_content: str) -> List[Dict[str, str]]:
        """
        Extract use cases from Section 2

        Args:
            section_content: Content of Section 2

        Returns:
            List of use case dictionaries
        """
        use_cases = []

        # Look for Use Cases subsection (2.3)
        uc_pattern = r'###?\s+2\.3.*?Use Cases(.*?)(?:###|##\s+3\.|\Z)'
        match = re.search(uc_pattern, section_content, re.DOTALL | re.IGNORECASE)

        if match:
            uc_text = match.group(1)
            # Extract individual use cases (usually h4 headers)
            uc_items = re.split(r'####\s+', uc_text)
            for item in uc_items[1:]:  # Skip first empty split
                lines = item.strip().split('\n')
                if lines:
                    title = lines[0].strip()
                    description = ' '.join(lines[1:]).strip()[:200]  # Limit to 200 chars
                    use_cases.append({'title': title, 'description': description})

        return use_cases if use_cases else [{'title': 'Use Cases', 'description': '[Not documented in Section 2.3]'}]

    @staticmethod
    def extract_principles(section_content: str, limit: Optional[int] = None) -> List[Dict[str, str]]:
        """
        Extract architecture principles from Section 3

        Args:
            section_content: Content of Section 3
            limit: Maximum number of principles to extract (None for all)

        Returns:
            List of principle dictionaries
        """
        principles = []

        # Extract principles (usually numbered or bulleted)
        principle_pattern = r'####\s+(?:\d+\.\s+)?(.*?)\n(.*?)(?=####|\Z)'
        matches = re.findall(principle_pattern, section_content, re.DOTALL)

        for title, content in matches:
            title = title.strip()
            # Extract description (usually first paragraph)
            desc_match = re.search(r'\*\*Description\*\*:(.*?)(?:\*\*|\Z)', content, re.DOTALL)
            description = desc_match.group(1).strip() if desc_match else content[:150]

            principles.append({
                'title': title,
                'description': description.strip()
            })

            if limit and len(principles) >= limit:
                break

        return principles if principles else [{'title': 'Architecture Principles', 'description': '[Not documented in Section 3]'}]

    @staticmethod
    def extract_components(section_content: str, limit: Optional[int] = None) -> List[Dict[str, str]]:
        """
        Extract components from Section 5

        Args:
            section_content: Content of Section 5
            limit: Maximum number of components to extract

        Returns:
            List of component dictionaries
        """
        components = []

        # Extract component subsections
        comp_pattern = r'###?\s+([\w\s-]+)(?:\n|\r\n)(.*?)(?=###|##\s+6\.|\Z)'
        matches = re.findall(comp_pattern, section_content, re.DOTALL)

        for title, content in matches:
            title = title.strip()
            if 'Component Details' in title or title.startswith('5.'):
                continue  # Skip section headers

            # Extract first few sentences as description
            sentences = re.split(r'[.!?]\s+', content.strip())
            description = '. '.join(sentences[:2])[:150]

            components.append({
                'name': title,
                'description': description
            })

            if limit and len(components) >= limit:
                break

        return components if components else [{'name': 'Components', 'description': '[Not documented in Section 5]'}]

    @staticmethod
    def extract_tech_stack(section_content: str) -> Dict[str, List[str]]:
        """
        Extract technology stack from Section 8

        Args:
            section_content: Content of Section 8

        Returns:
            Dictionary with categories (Backend, Frontend, Data, etc.)
        """
        tech_stack = {
            'Backend': [],
            'Frontend': [],
            'Data': [],
            'Infrastructure': []
        }

        # Extract subsections for each category
        for category in tech_stack.keys():
            pattern = rf'###?\s+{category}(.*?)(?=###|##\s+9\.|\Z)'
            match = re.search(pattern, section_content, re.DOTALL | re.IGNORECASE)

            if match:
                tech_text = match.group(1)
                # Extract technologies from bullets or table
                lines = tech_text.strip().split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('-') or line.startswith('*') or '|' in line:
                        tech = re.sub(r'^[-*|\s]+', '', line)
                        tech = re.sub(r'\|', ' ', tech).strip()
                        if tech and not tech.startswith('---') and tech:
                            tech_stack[category].append(tech)

        return tech_stack

    @staticmethod
    def extract_security_controls(section_content: str) -> Dict[str, List[str]]:
        """
        Extract security controls from Section 9

        Args:
            section_content: Content of Section 9

        Returns:
            Dictionary with security areas
        """
        security = {
            'Authentication': [],
            'Encryption': [],
            'Access Controls': []
        }

        for area in security.keys():
            pattern = rf'###?\s+.*?{area}(.*?)(?=###|##\s+10\.|\Z)'
            match = re.search(pattern, section_content, re.DOTALL | re.IGNORECASE)

            if match:
                sec_text = match.group(1)
                lines = sec_text.strip().split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('-') or line.startswith('*'):
                        control = re.sub(r'^[-*\s]+', '', line)
                        if control:
                            security[area].append(control)

        return security

    @staticmethod
    def extract_adrs(section_content: str, limit: Optional[int] = None) -> List[Dict[str, str]]:
        """
        Extract ADRs from Section 12 table

        Args:
            section_content: Content of Section 12
            limit: Maximum number of ADRs to extract

        Returns:
            List of ADR dictionaries
        """
        adrs = []

        # Extract table rows
        table_pattern = r'\|\s*\[ADR-(\d+)\]\(.*?\)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|'
        matches = re.findall(table_pattern, section_content)

        for number, title, status in matches:
            adrs.append({
                'number': number,
                'title': title.strip(),
                'status': status.strip()
            })

            if limit and len(adrs) >= limit:
                break

        return adrs if adrs else [{'number': '000', 'title': 'ADRs not documented', 'status': 'N/A'}]


class SlideBuilder:
    """Builds PowerPoint slides using reusable primitives"""

    def __init__(self, prs: Presentation, lang_manager: LanguageManager):
        """
        Initialize slide builder

        Args:
            prs: PowerPoint presentation object
            lang_manager: Language manager for translations
        """
        self.prs = prs
        self.lang = lang_manager

    def build_title_slide(self, system_name: str, stakeholder_type: str, version: str = "1.0") -> None:
        """
        Build title slide

        Args:
            system_name: Name of the system
            stakeholder_type: 'business', 'architecture', or 'compliance'
            version: Version string
        """
        subtitle = self.lang.translate(f'title_suffix.{stakeholder_type}')
        add_title_slide(self.prs, system_name, subtitle)

        # Note: add_title_slide doesn't return the slide, but we can access it
        # The version is already added by add_title_slide

    def build_agenda_slide(self, stakeholder_type: str) -> None:
        """
        Build agenda slide

        Args:
            stakeholder_type: 'business', 'architecture', or 'compliance'
        """
        title = self.lang.translate('slide_titles.agenda')
        slide = add_content_slide(self.prs, title)

        agenda_items = self.lang.get_agenda_items(stakeholder_type)
        agenda_text = '\n'.join([f"{i+1}. {item}" for i, item in enumerate(agenda_items)])

        add_bullet_text(slide, 1.5, 1.8, 7, 4.5, agenda_text, font_size=20)

    def build_content_slide(self, title_key: str, content_bullets: List[str]) -> None:
        """
        Build generic content slide with bullets

        Args:
            title_key: Translation key for slide title
            content_bullets: List of bullet points
        """
        title = self.lang.translate(title_key)
        slide = add_content_slide(self.prs, title)

        if content_bullets:
            bullets_text = '\n'.join([f"• {bullet}" for bullet in content_bullets])
            add_bullet_text(slide, 0.8, 1.8, 8.5, 4.5, bullets_text, font_size=16)
        else:
            not_doc = self.lang.translate('labels.not_documented')
            add_bullet_text(slide, 0.8, 3, 8.5, 2, f"[{not_doc}]", font_size=18, color=GRAY)

    def build_metric_table_slide(self, title_key: str, metrics: List[str]) -> None:
        """
        Build slide with metrics

        Args:
            title_key: Translation key for slide title
            metrics: List of metric strings
        """
        title = self.lang.translate(title_key)
        slide = add_content_slide(self.prs, title)

        if metrics:
            metrics_text = '\n'.join([f"• {metric}" for metric in metrics])
            add_bullet_text(slide, 0.8, 1.8, 8.5, 4.5, metrics_text, font_size=16)

    def build_principles_slide(self, title_key: str, principles: List[Dict[str, str]]) -> None:
        """
        Build slide with architecture principles

        Args:
            title_key: Translation key for slide title
            principles: List of principle dictionaries
        """
        title = self.lang.translate(title_key)
        slide = add_content_slide(self.prs, title)

        if len(principles) <= 5:
            # Show all principles with descriptions
            y_pos = 1.8
            for principle in principles:
                prin_title = principle.get('title', '')
                prin_desc = principle.get('description', '')[:80]  # Limit description

                text = f"• {prin_title}\n  {prin_desc}"
                add_bullet_text(slide, 0.8, y_pos, 8.5, 0.9, text, font_size=14)
                y_pos += 1.0
        else:
            # Show principle titles only (for >5 principles)
            prin_text = '\n'.join([f"• {p.get('title', '')}" for p in principles])
            add_bullet_text(slide, 0.8, 1.8, 8.5, 4.5, prin_text, font_size=16)

    def build_components_slide(self, title_key: str, components: List[Dict[str, str]]) -> None:
        """
        Build slide with components

        Args:
            title_key: Translation key for slide title
            components: List of component dictionaries
        """
        title = self.lang.translate(title_key)
        slide = add_content_slide(self.prs, title)

        if components:
            comp_text = '\n'.join([
                f"• {c.get('name', '')}: {c.get('description', '')[:80]}"
                for c in components[:10]  # Limit to 10 components
            ])
            add_bullet_text(slide, 0.8, 1.8, 8.5, 5, comp_text, font_size=14)

    def build_tech_stack_slide(self, title_key: str, tech_stack: Dict[str, List[str]]) -> None:
        """
        Build slide with technology stack

        Args:
            title_key: Translation key for slide title
            tech_stack: Dictionary of technologies by category
        """
        title = self.lang.translate(title_key)
        slide = add_content_slide(self.prs, title)

        y_pos = 1.8
        for category, techs in tech_stack.items():
            if techs:
                # Add category header
                add_bullet_text(slide, 0.8, y_pos, 8.5, 0.4, f"• {category}:", font_size=16, bold=True)
                y_pos += 0.5

                # Add technologies
                tech_text = ', '.join(techs[:5])  # Limit to 5 items per category
                add_bullet_text(slide, 1.2, y_pos, 8, 0.4, tech_text, font_size=14)
                y_pos += 0.6

    def build_summary_slide(self, title_key: str) -> None:
        """
        Build summary slide with Q&A

        Args:
            title_key: Translation key for slide title
        """
        title = self.lang.translate(title_key)
        slide = add_content_slide(self.prs, title)

        # Add Q&A box
        questions = self.lang.translate('messages.questions')
        add_box(slide, 2.5, 3, 5, 1.5, questions, BLUE, font_size=32)


class ArchitecturePresentationGenerator:
    """Main class for generating architecture presentations"""

    def __init__(self, arch_md_path: str, stakeholder_type: str, language: str = "en"):
        """
        Initialize presentation generator

        Args:
            arch_md_path: Path to ARCHITECTURE.md file
            stakeholder_type: 'business', 'architecture', or 'compliance'
            language: Language code ('en' or 'es')
        """
        self.arch_md_path = arch_md_path
        self.stakeholder_type = stakeholder_type.lower()
        self.language = language.lower()

        self.doc_index = {}
        self.loaded_sections = {}
        self.system_name = "Architecture"
        self.version = "1.0"

        # Initialize managers
        self.lang_manager = LanguageManager(self.language)
        self.extractor = SectionExtractor()

        # Load slide template
        self.slide_template = self._load_slide_template()

        # Validate
        self._validate()

    def _validate(self):
        """Validate inputs and file existence"""
        if not os.path.exists(self.arch_md_path):
            raise FileNotFoundError(
                f"ARCHITECTURE.md not found at: {self.arch_md_path}\n"
                "Presentation generation requires a valid ARCHITECTURE.md file. "
                "Please create one using the architecture-docs skill first."
            )

        if self.stakeholder_type not in ['business', 'architecture', 'compliance']:
            raise ValueError(
                f"Invalid stakeholder type: {self.stakeholder_type}. "
                "Must be 'business', 'architecture', or 'compliance'"
            )

        if self.language not in ['en', 'es']:
            raise ValueError(
                f"Invalid language: {self.language}. "
                "Must be 'en' or 'es'"
            )

    def _load_slide_template(self) -> Dict:
        """Load slide template for stakeholder type"""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_file = os.path.join(
            base_dir,
            'skills', 'architecture-docs', 'presentation',
            f'slide_templates_{self.stakeholder_type}.json'
        )

        with open(template_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def load_document_index(self) -> Dict[int, Dict[str, int]]:
        """
        Load Document Index from ARCHITECTURE.md

        Returns:
            Dictionary mapping section numbers to line ranges
        """
        print("Step 1/6: Loading ARCHITECTURE.md Document Index...")

        with open(self.arch_md_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Parse Document Index (lines 1-50)
        doc_index = {}
        in_index = False

        for i, line in enumerate(lines[:100]):  # Search first 100 lines
            if 'Document Index' in line or 'Section Index' in line:
                in_index = True
                continue

            if in_index and line.startswith('##'):
                break  # End of index

            if in_index:
                # Parse index entries: "1. Executive Summary: Lines 25-65"
                match = re.search(r'(\d+)\.\s+(.+?):\s+Lines?\s+(\d+)-(\d+)', line)
                if match:
                    section_num = int(match.group(1))
                    start_line = int(match.group(3))
                    end_line = int(match.group(4))
                    doc_index[section_num] = {'start': start_line, 'end': end_line}

            # Extract system name from first heading
            if i < 30 and line.startswith('# '):
                self.system_name = line.strip('#').strip()

        if not doc_index:
            print("Warning: Document Index not found. Using default line ranges.")
            # Fallback to default ranges
            doc_index = self._get_default_index()

        self.doc_index = doc_index
        print(f"  ✓ Loaded index for {len(doc_index)} sections")
        return doc_index

    def _get_default_index(self) -> Dict[int, Dict[str, int]]:
        """Get default document index if parsing fails"""
        return {
            1: {'start': 25, 'end': 100},
            2: {'start': 101, 'end': 250},
            3: {'start': 251, 'end': 500},
            4: {'start': 501, 'end': 750},
            5: {'start': 751, 'end': 1200},
            6: {'start': 1201, 'end': 1400},
            7: {'start': 1401, 'end': 1600},
            8: {'start': 1601, 'end': 1800},
            9: {'start': 1801, 'end': 2100},
            10: {'start': 2101, 'end': 2300},
            11: {'start': 2301, 'end': 2600},
            12: {'start': 2601, 'end': 2800}
        }

    def load_sections_incrementally(self, section_list: List[int]) -> Dict[int, str]:
        """
        Load only required sections with context buffer

        Args:
            section_list: List of section numbers to load

        Returns:
            Dictionary mapping section numbers to content
        """
        print(f"Step 2/6: Loading required sections ({', '.join(map(str, section_list))})...")

        with open(self.arch_md_path, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()

        loaded_sections = {}
        total_lines = 0

        for section_num in section_list:
            if section_num in self.doc_index:
                range_info = self.doc_index[section_num]
                start = max(0, range_info['start'] - 10)  # 10-line buffer
                end = min(len(all_lines), range_info['end'] + 10)

                section_content = ''.join(all_lines[start:end])
                loaded_sections[section_num] = section_content
                total_lines += (end - start)

        self.loaded_sections = loaded_sections
        print(f"  ✓ Loaded {len(loaded_sections)} sections ({total_lines} lines)")
        print(f"  ✓ Context efficiency: {total_lines}/{len(all_lines)} lines = {(total_lines/len(all_lines)*100):.1f}%")

        return loaded_sections

    def extract_data_for_stakeholder(self) -> Dict[str, Any]:
        """
        Extract relevant data based on stakeholder type

        Returns:
            Dictionary of extracted data
        """
        print(f"Step 3/6: Extracting data for {self.stakeholder_type} stakeholders...")

        extracted = {}

        # Extract based on loaded sections
        for section_num, content in self.loaded_sections.items():
            if section_num == 1:
                extracted['key_metrics'] = self.extractor.extract_key_metrics(content)
                extracted['business_value'] = self.extractor.extract_business_value(content)
            elif section_num == 2:
                extracted['use_cases'] = self.extractor.extract_use_cases(content)
            elif section_num == 3:
                limit = 5 if self.stakeholder_type == 'business' else None
                extracted['principles'] = self.extractor.extract_principles(content, limit)
            elif section_num == 5:
                limit = 10 if self.stakeholder_type == 'architecture' else None
                extracted['components'] = self.extractor.extract_components(content, limit)
            elif section_num == 8:
                extracted['tech_stack'] = self.extractor.extract_tech_stack(content)
            elif section_num == 9:
                extracted['security'] = self.extractor.extract_security_controls(content)
            elif section_num == 12:
                limit = 5 if self.stakeholder_type in ['architecture', 'compliance'] else None
                extracted['adrs'] = self.extractor.extract_adrs(content, limit)

        print(f"  ✓ Extracted {len(extracted)} data categories")
        return extracted

    def generate_presentation(self, output_path: str) -> str:
        """
        Generate PowerPoint presentation

        Args:
            output_path: Path to save .pptx file

        Returns:
            Path to generated file
        """
        print("\n" + "=" * 60)
        print("   ARCHITECTURE PRESENTATION GENERATION")
        print("=" * 60)
        print(f"Stakeholder: {self.stakeholder_type.capitalize()}")
        print(f"Language: {self.language.upper()}")
        print(f"Output: {output_path}")
        print("=" * 60 + "\n")

        # Step 1: Load Document Index
        self.load_document_index()

        # Step 2: Load required sections
        sections_to_load = self.slide_template['primary_sections']
        if 'secondary_sections' in self.slide_template:
            sections_to_load.extend(self.slide_template['secondary_sections'])
        self.load_sections_incrementally(sections_to_load)

        # Step 3: Extract data
        extracted_data = self.extract_data_for_stakeholder()

        # Step 4: Initialize presentation
        print("Step 4/6: Loading language translations...")
        prs = Presentation()
        prs.slide_width = Inches(10)
        prs.slide_height = Inches(7.5)

        slide_builder = SlideBuilder(prs, self.lang_manager)
        print(f"  ✓ Loaded {self.language.upper()} translations")

        # Step 5: Generate slides
        print(f"Step 5/6: Generating slides ({self.slide_template['slide_count']} slides)...")
        slide_num = 0

        for slide_config in self.slide_template['slides']:
            slide_num += 1
            slide_type = slide_config['type']

            if slide_type == 'title':
                slide_builder.build_title_slide(
                    self.system_name,
                    self.stakeholder_type,
                    self.version
                )
                print(f"  - Slide {slide_num}: Title Slide ✓")

            elif slide_type == 'agenda':
                slide_builder.build_agenda_slide(self.stakeholder_type)
                print(f"  - Slide {slide_num}: Agenda ✓")

            elif slide_type == 'content':
                title_key = slide_config.get('title_key', '')

                # Determine content based on title
                if 'executive_summary' in title_key:
                    content = extracted_data.get('key_metrics', [])
                    slide_builder.build_metric_table_slide(title_key, content)
                elif 'business_value' in title_key:
                    content = extracted_data.get('business_value', [])
                    slide_builder.build_content_slide(title_key, content)
                elif 'use_cases' in title_key:
                    use_cases = extracted_data.get('use_cases', [])
                    content = [f"{uc['title']}: {uc['description'][:80]}" for uc in use_cases]
                    slide_builder.build_content_slide(title_key, content)
                elif 'principles' in title_key:
                    principles = extracted_data.get('principles', [])
                    slide_builder.build_principles_slide(title_key, principles)
                elif 'component' in title_key:
                    components = extracted_data.get('components', [])
                    slide_builder.build_components_slide(title_key, components)
                elif 'technology' in title_key or 'tech_stack' in title_key:
                    tech_stack = extracted_data.get('tech_stack', {})
                    slide_builder.build_tech_stack_slide(title_key, tech_stack)
                else:
                    # Generic content slide
                    slide_builder.build_content_slide(title_key, [])

                print(f"  - Slide {slide_num}: {slide_config.get('title_key', 'Content')} ✓")

            elif slide_type == 'summary':
                title_key = slide_config.get('title_key', 'slide_titles.summary')
                slide_builder.build_summary_slide(title_key)
                print(f"  - Slide {slide_num}: Summary & Q&A ✓")

        # Step 6: Save presentation
        print("Step 6/6: Saving presentation file...")

        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        prs.save(output_path)
        print(f"  ✓ Saved to {output_path}")

        # Print success summary
        self._print_success_summary(output_path, slide_num)

        return output_path

    def _print_success_summary(self, output_path: str, slide_count: int):
        """Print success summary"""
        print("\n" + "=" * 60)
        print("   PRESENTATION GENERATION COMPLETE")
        print("=" * 60)
        print(f"\n✓ Successfully generated presentation!")
        print(f"📁 Output: {output_path}")
        print(f"📊 Slides: {slide_count} slides (~15 minute presentation)")
        print(f"🎯 Stakeholder: {self.stakeholder_type.capitalize()}")
        print(f"🌐 Language: {self.language.upper()}")

        print(f"\nData Sources Used:")
        for section_num in sorted(self.loaded_sections.keys()):
            range_info = self.doc_index.get(section_num, {})
            start = range_info.get('start', 0)
            end = range_info.get('end', 0)
            print(f"- Section {section_num}: ARCHITECTURE.md (lines {start}-{end})")

        print(f"\n{self.lang_manager.translate('labels.next_steps')}:")
        print("1. Review the generated presentation")
        print("2. Customize slide content as needed")
        print("3. Add company branding/logos if required")
        print("\n" + "=" * 60)


def main():
    """Main entry point for command-line usage"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate architecture presentations from ARCHITECTURE.md'
    )
    parser.add_argument(
        'arch_md',
        help='Path to ARCHITECTURE.md file'
    )
    parser.add_argument(
        '--stakeholder',
        choices=['business', 'architecture', 'compliance'],
        required=True,
        help='Target stakeholder type'
    )
    parser.add_argument(
        '--language',
        choices=['en', 'es'],
        default='en',
        help='Presentation language (default: en)'
    )
    parser.add_argument(
        '--output',
        help='Output path (default: /presentations/ARCHITECTURE_{Type}_{Lang}.pptx)'
    )

    args = parser.parse_args()

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        base_dir = os.path.dirname(os.path.abspath(args.arch_md))
        presentations_dir = os.path.join(base_dir, 'presentations')
        filename = f"ARCHITECTURE_{args.stakeholder.capitalize()}_{args.language.upper()}.pptx"
        output_path = os.path.join(presentations_dir, filename)

    # Generate presentation
    try:
        generator = ArchitecturePresentationGenerator(
            args.arch_md,
            args.stakeholder,
            args.language
        )
        generator.generate_presentation(output_path)
        return 0
    except Exception as e:
        print(f"\n❌ Error generating presentation: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
