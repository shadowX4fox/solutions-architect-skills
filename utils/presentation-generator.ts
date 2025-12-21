#!/usr/bin/env bun
/**
 * Architecture Presentation Generator (TypeScript/Bun Implementation)
 *
 * Generates PowerPoint presentations from ARCHITECTURE.md files for different stakeholder types.
 * Supports Business, Architecture, and Compliance stakeholders in English and Spanish.
 *
 * Replaces: presentation_generator.py (Python)
 * Library: officegen (PptxGenJS incompatible with Bun)
 *
 * Version: 1.5.24
 * Date: 2025-12-21
 */

import * as fs from 'fs';
import * as path from 'path';
import officegen from 'officegen';
import {
  addTitleSlide,
  addContentSlide,
  addBulletText,
  addBox,
  BLUE,
  GREEN,
  GRAY,
  WHITE,
  DARK_GRAY
} from './create-presentation';

// ============================================================
// Type Definitions
// ============================================================

interface DocumentIndex {
  [sectionNum: number]: {
    start: number;
    end: number;
  };
}

interface SlideTemplate {
  slides: Array<{
    id: string | number;
    title_key: string;
    subtitle_key?: string;
    data_sources: number[];
  }>;
}

interface Translations {
  [key: string]: any;
}

interface Summaries {
  [slideId: string]: string[];
}

// ============================================================
// Language Manager
// ============================================================

class LanguageManager {
  private languageCode: string;
  private translations: Translations;

  constructor(languageCode: string = 'en') {
    this.languageCode = languageCode.toLowerCase();
    this.translations = {};
    this.loadTranslations();
  }

  private loadTranslations(): void {
    // import.meta.dir gives us /home/.../solutions-architect-skills/utils
    // We need to go up one level to get the base directory
    const baseDir = path.resolve(import.meta.dir, '..');
    const langFile = path.join(
      baseDir,
      'skills',
      'architecture-docs',
      'presentation',
      `language_${this.languageCode}.json`
    );

    if (!fs.existsSync(langFile)) {
      throw new Error(
        `Language file not found: ${langFile}. Supported languages: 'en', 'es'`
      );
    }

    const content = fs.readFileSync(langFile, 'utf-8');
    this.translations = JSON.parse(content);
  }

  translate(key: string, variables: Record<string, any> = {}): string {
    const keys = key.split('.');
    let value: any = this.translations;

    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = value[k];
      } else {
        return `[Missing translation: ${key}]`;
      }
    }

    if (typeof value === 'string') {
      // Simple variable replacement
      return value.replace(/\{(\w+)\}/g, (match, varName) => {
        return variables[varName] !== undefined ? variables[varName] : match;
      });
    }

    return typeof value === 'string' ? value : String(value);
  }

  getAgendaItems(stakeholderType: string): string[] {
    const agendaItems = this.translations['agenda_items'];
    if (agendaItems && typeof agendaItems === 'object') {
      return agendaItems[stakeholderType] || [];
    }
    return [];
  }
}

// ============================================================
// Section Extractor (used when no LLM summaries provided)
// ============================================================

class SectionExtractor {
  static extractKeyMetrics(sectionContent: string): string[] {
    const bullets: string[] = [];
    const lines = sectionContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Extract bullet points or numbered lists
      if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/)) {
        const text = trimmed.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '').trim();
        if (text.length > 10) {  // Filter out very short items
          bullets.push(text);
        }
      }
    }

    return bullets.slice(0, 5);  // Return top 5
  }

  static extractPrinciples(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }

  static extractLayers(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }

  static extractComponents(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }

  static extractTechnologies(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }

  static extractDataFlow(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }

  static extractIntegrations(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }

  static extractSecurity(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }

  static extractADRs(sectionContent: string): string[] {
    const adrs: string[] = [];
    const lines = sectionContent.split('\n');

    for (const line of lines) {
      const match = line.match(/ADR[-\s]*(\d+):\s*(.+)/i);
      if (match) {
        adrs.push(`ADR-${match[1]}: ${match[2].trim()}`);
      }
    }

    return adrs.slice(0, 8);  // Return top 8 ADRs
  }

  static extractGenericBullets(sectionContent: string): string[] {
    return this.extractKeyMetrics(sectionContent);
  }
}

// ============================================================
// Architecture Presentation Generator
// ============================================================

class ArchitecturePresentationGenerator {
  private archMdPath: string;
  private stakeholderType: string;
  private language: string;
  private summaries: Summaries | null;

  private docIndex: DocumentIndex = {};
  private loadedSections: { [sectionNum: number]: string } = {};
  private systemName: string = 'Architecture';
  private version: string = '1.0';

  private langManager: LanguageManager;
  private extractor: typeof SectionExtractor | null;
  private slideTemplate: SlideTemplate;

  constructor(
    archMdPath: string,
    stakeholderType: string,
    language: string = 'en',
    summaries: Summaries | null = null
  ) {
    this.archMdPath = archMdPath;
    this.stakeholderType = stakeholderType.toLowerCase();
    this.language = language.toLowerCase();
    this.summaries = summaries;

    // Initialize managers
    this.langManager = new LanguageManager(this.language);
    this.extractor = summaries ? null : SectionExtractor;

    // Load slide template
    this.slideTemplate = this.loadSlideTemplate();

    // Validate inputs
    this.validate();
  }

  private validate(): void {
    if (!fs.existsSync(this.archMdPath)) {
      throw new Error(
        `ARCHITECTURE.md not found at: ${this.archMdPath}\n` +
        'Presentation generation requires a valid ARCHITECTURE.md file. ' +
        'Please create one using the architecture-docs skill first.'
      );
    }

    const validStakeholders = ['business', 'architecture', 'compliance'];
    if (!validStakeholders.includes(this.stakeholderType)) {
      throw new Error(
        `Invalid stakeholder type: ${this.stakeholderType}. ` +
        `Must be one of: ${validStakeholders.join(', ')}`
      );
    }

    const validLanguages = ['en', 'es'];
    if (!validLanguages.includes(this.language)) {
      throw new Error(
        `Invalid language: ${this.language}. ` +
        `Must be one of: ${validLanguages.join(', ')}`
      );
    }
  }

  private loadSlideTemplate(): SlideTemplate {
    const baseDir = path.resolve(import.meta.dir, '..');
    const templateFile = path.join(
      baseDir,
      'skills',
      'architecture-docs',
      'presentation',
      `slide_templates_${this.stakeholderType}.json`
    );

    const content = fs.readFileSync(templateFile, 'utf-8');
    return JSON.parse(content);
  }

  loadDocumentIndex(): DocumentIndex {
    console.log('Step 1/6: Loading ARCHITECTURE.md Document Index...');

    const content = fs.readFileSync(this.archMdPath, 'utf-8');
    const lines = content.split('\n');

    const docIndex: DocumentIndex = {};
    let inIndex = false;

    for (let i = 0; i < Math.min(100, lines.length); i++) {
      const line = lines[i];

      if (line.includes('Document Index') || line.includes('Section Index')) {
        inIndex = true;
        continue;
      }

      if (inIndex && line.startsWith('##')) {
        break;  // End of index
      }

      if (inIndex) {
        // Parse index entries: "1. Executive Summary: Lines 25-65"
        const match = line.match(/(\d+)\.\s+(.+?):\s+Lines?\s+(\d+)-(\d+)/);
        if (match) {
          const sectionNum = parseInt(match[1]);
          const startLine = parseInt(match[3]);
          const endLine = parseInt(match[4]);
          docIndex[sectionNum] = { start: startLine, end: endLine };
        }
      }

      // Extract system name from first heading
      if (i < 30 && line.startsWith('# ')) {
        this.systemName = line.replace(/^#\s+/, '').trim();
      }
    }

    if (Object.keys(docIndex).length === 0) {
      console.log('Warning: Document Index not found. Using default line ranges.');
      // Use default ranges
      this.docIndex = this.getDefaultIndex();
    } else {
      this.docIndex = docIndex;
    }

    console.log(`  ✓ Loaded index for ${Object.keys(this.docIndex).length} sections`);
    return this.docIndex;
  }

  private getDefaultIndex(): DocumentIndex {
    // Default 12-section structure
    return {
      1: { start: 50, end: 150 },
      2: { start: 151, end: 250 },
      3: { start: 251, end: 350 },
      4: { start: 351, end: 450 },
      5: { start: 451, end: 550 },
      6: { start: 551, end: 650 },
      7: { start: 651, end: 750 },
      8: { start: 751, end: 850 },
      9: { start: 851, end: 950 },
      10: { start: 951, end: 1050 },
      11: { start: 1051, end: 1150 },
      12: { start: 1151, end: 1250 }
    };
  }

  loadSection(sectionNum: number): string {
    if (this.loadedSections[sectionNum]) {
      return this.loadedSections[sectionNum];
    }

    const range = this.docIndex[sectionNum];
    if (!range) {
      console.log(`Warning: Section ${sectionNum} not in index`);
      return '';
    }

    const content = fs.readFileSync(this.archMdPath, 'utf-8');
    const lines = content.split('\n');

    // Convert line numbers to 0-indexed
    const start = range.start - 1;
    const end = range.end;

    const sectionContent = lines.slice(start, end).join('\n');
    this.loadedSections[sectionNum] = sectionContent;

    return sectionContent;
  }

  async generatePresentation(outputPath: string): Promise<string> {
    console.log('\n' + '='.repeat(60));
    console.log('   ARCHITECTURE PRESENTATION GENERATOR');
    console.log('='.repeat(60));
    console.log(`\n🎯 Stakeholder: ${this.stakeholderType.charAt(0).toUpperCase() + this.stakeholderType.slice(1)}`);
    console.log(`🌐 Language: ${this.language.toUpperCase()}`);
    console.log(`📄 Source: ${path.basename(this.archMdPath)}`);

    if (this.summaries) {
      console.log(`🤖 Content: LLM Summaries (${Object.keys(this.summaries).length} slides)`);
    } else {
      console.log(`🔍 Content: Regex Extraction (fallback mode)`);
    }

    console.log('');

    // Step 1: Load document index
    this.loadDocumentIndex();

    // Step 2: Create presentation
    console.log('Step 2/6: Initializing presentation...');
    const pptx = officegen({
      type: 'pptx',
      title: `${this.systemName} - ${this.stakeholderType.charAt(0).toUpperCase() + this.stakeholderType.slice(1)} Presentation`,
      author: 'Solutions Architect Skills',
      company: 'Architecture Documentation',
      subject: `Architecture Presentation for ${this.stakeholderType} stakeholders`
    });
    console.log('  ✓ Presentation initialized');

    // Step 3-6: Generate slides
    await this.generateSlides(pptx);

    // Save presentation
    console.log('\nStep 6/6: Saving presentation...');
    await this.savePresentationToFile(pptx, outputPath);

    this.printSuccessSummary(outputPath, this.slideTemplate.slides.length + 1);

    return outputPath;
  }

  private async generateSlides(pptx: any): Promise<void> {
    console.log('Step 3/6: Building slides...');

    let slideNum = 1;

    // Slide 1: Title Slide
    const titleText = this.langManager.translate('slide_titles.title_slide', {
      system: this.systemName
    });
    const subtitleText = this.langManager.translate('slide_titles.subtitle', {
      stakeholder: this.stakeholderType
    });

    addTitleSlide(pptx, titleText, subtitleText, this.version);
    console.log(`  - Slide ${slideNum}: Title ✓`);
    slideNum++;

    // Slide 2: Agenda
    const agendaSlide = addContentSlide(
      pptx,
      this.langManager.translate('slide_titles.agenda')
    );
    const agendaItems = this.langManager.getAgendaItems(this.stakeholderType);

    if (agendaItems.length > 0) {
      addBulletText(
        agendaSlide,
        0.8, 2.0, 8.5, 4.5,
        agendaItems,
        20,
        DARK_GRAY,
        false
      );
    }

    console.log(`  - Slide ${slideNum}: Agenda ✓`);
    slideNum++;

    // Content Slides (from template)
    console.log('Step 4/6: Generating content slides...');

    for (const slideConfig of this.slideTemplate.slides) {
      const slideId = String(slideConfig.id);
      const titleKey = slideConfig.title_key;
      const title = this.langManager.translate(`slide_titles.${titleKey}`);

      // Get content
      let content: string[];

      if (this.summaries && this.summaries[slideId]) {
        // Use LLM summaries
        content = this.summaries[slideId];
        console.log(`  - Slide ${slideNum}: ${titleKey} (LLM) ✓`);
      } else {
        // Extract from ARCHITECTURE.md
        content = this.extractSlideContent(slideConfig);
        console.log(`  - Slide ${slideNum}: ${titleKey} (extracted) ✓`);
      }

      // Build slide
      const slide = addContentSlide(pptx, title);

      if (content.length > 0) {
        addBulletText(
          slide,
          0.8, 2.0, 8.5, 4.5,
          content,
          18,
          DARK_GRAY,
          false
        );
      } else {
        // Placeholder if no content - extract section numbers
        if (slideConfig.data_sources && slideConfig.data_sources.length > 0) {
          const sectionNums = slideConfig.data_sources
            .map((ds: any) => typeof ds === 'number' ? ds : ds.section)
            .filter((n: any) => n !== undefined);

          addBulletText(
            slide,
            0.8, 3.0, 8.5, 2.0,
            [`Ver ARCHITECTURE.md Sección ${sectionNums.join(', ')}`],
            16,
            GRAY,
            true
          );
        } else {
          addBulletText(
            slide,
            0.8, 3.0, 8.5, 2.0,
            ['[No content available]'],
            16,
            GRAY,
            true
          );
        }
      }

      slideNum++;
    }

    console.log('Step 5/6: Finalizing presentation...');
  }

  private extractSlideContent(slideConfig: any): string[] {
    if (!this.extractor) {
      return [];
    }

    if (!slideConfig || !slideConfig.data_sources) {
      console.log(`Warning: Invalid slide config, no data_sources`);
      return [];
    }

    // Load sections
    const sections: string[] = [];

    // Handle both formats: array of numbers OR array of objects with "section" property
    for (const dataSource of slideConfig.data_sources) {
      let sectionNum: number;

      if (typeof dataSource === 'number') {
        sectionNum = dataSource;
      } else if (typeof dataSource === 'object' && dataSource.section) {
        sectionNum = dataSource.section;
      } else {
        continue;
      }

      const section = this.loadSection(sectionNum);
      if (section) {
        sections.push(section);
      }
    }

    const combinedContent = sections.join('\n\n');

    // Use appropriate extractor based on slide type
    const titleKey = slideConfig.title_key;

    if (titleKey.includes('executive') || titleKey.includes('summary')) {
      return SectionExtractor.extractKeyMetrics(combinedContent);
    } else if (titleKey.includes('principle')) {
      return SectionExtractor.extractPrinciples(combinedContent);
    } else if (titleKey.includes('layer')) {
      return SectionExtractor.extractLayers(combinedContent);
    } else if (titleKey.includes('component')) {
      return SectionExtractor.extractComponents(combinedContent);
    } else if (titleKey.includes('technology') || titleKey.includes('stack')) {
      return SectionExtractor.extractTechnologies(combinedContent);
    } else if (titleKey.includes('data_flow') || titleKey.includes('flow')) {
      return SectionExtractor.extractDataFlow(combinedContent);
    } else if (titleKey.includes('integration')) {
      return SectionExtractor.extractIntegrations(combinedContent);
    } else if (titleKey.includes('security')) {
      return SectionExtractor.extractSecurity(combinedContent);
    } else if (titleKey.includes('adr') || titleKey.includes('decision')) {
      return SectionExtractor.extractADRs(combinedContent);
    } else {
      return SectionExtractor.extractGenericBullets(combinedContent);
    }
  }

  private async savePresentationToFile(pptx: any, outputPath: string): Promise<void> {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const out = fs.createWriteStream(outputPath);

      pptx.generate(out);

      out.on('close', () => {
        resolve();
      });

      out.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  private printSuccessSummary(outputPath: string, slideCount: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('   PRESENTATION GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\n✓ Successfully generated presentation!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Slides: ${slideCount} slides (~15 minute presentation)`);
    console.log(`🎯 Stakeholder: ${this.stakeholderType.charAt(0).toUpperCase() + this.stakeholderType.slice(1)}`);
    console.log(`🌐 Language: ${this.language.toUpperCase()}`);

    console.log('\nData Sources Used:');
    for (const sectionNum of Object.keys(this.loadedSections).sort()) {
      const range = this.docIndex[parseInt(sectionNum)];
      if (range) {
        console.log(`- Section ${sectionNum}: ARCHITECTURE.md (lines ${range.start}-${range.end})`);
      }
    }

    console.log(`\n${this.langManager.translate('labels.next_steps')}:`);
    console.log('1. Review the generated presentation');
    console.log('2. Customize slide content as needed');
    console.log('3. Add company branding/logos if required');
    console.log('\n' + '='.repeat(60));
  }
}

// ============================================================
// Main Entry Point
// ============================================================

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Architecture Presentation Generator

Usage:
  bun run presentation-generator.ts <arch_md> --stakeholder <type> [options]

Arguments:
  <arch_md>                 Path to ARCHITECTURE.md file

Options:
  --stakeholder <type>      Target stakeholder type (business|architecture|compliance)
  --language <lang>         Presentation language (en|es) [default: en]
  --output <path>           Output path [default: ./presentations/ARCHITECTURE_<Type>_<Lang>.pptx]
  --summaries <path>        Path to JSON file with LLM-generated summaries (optional)
  --help, -h                Show this help message

Examples:
  bun run presentation-generator.ts ARCHITECTURE.md --stakeholder architecture --language es
  bun run presentation-generator.ts ARCHITECTURE.md --stakeholder business --summaries summaries.json
`);
    return 0;
  }

  // Parse arguments
  const archMd = args[0];
  let stakeholder: string | null = null;
  let language = 'en';
  let output: string | null = null;
  let summariesPath: string | null = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--stakeholder' && i + 1 < args.length) {
      stakeholder = args[i + 1];
      i++;
    } else if (args[i] === '--language' && i + 1 < args.length) {
      language = args[i + 1];
      i++;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      output = args[i + 1];
      i++;
    } else if (args[i] === '--summaries' && i + 1 < args.length) {
      summariesPath = args[i + 1];
      i++;
    }
  }

  if (!stakeholder) {
    console.error('Error: --stakeholder is required');
    console.error('Run with --help for usage information');
    return 1;
  }

  // Determine output path
  let outputPath: string;
  if (output) {
    outputPath = output;
  } else {
    const baseDir = path.dirname(path.resolve(archMd));
    const presentationsDir = path.join(baseDir, 'presentations');
    const filename = `ARCHITECTURE_${stakeholder.charAt(0).toUpperCase() + stakeholder.slice(1)}_${language.toUpperCase()}.pptx`;
    outputPath = path.join(presentationsDir, filename);
  }

  // Load LLM summaries if provided
  let summaries: Summaries | null = null;
  if (summariesPath) {
    try {
      const summariesContent = fs.readFileSync(summariesPath, 'utf-8');
      summaries = JSON.parse(summariesContent);
      console.log(`✓ Loaded LLM summaries from ${summariesPath}`);
    } catch (e) {
      console.log(`⚠️  Warning: Could not load summaries file: ${e}`);
      console.log('   Falling back to regex extraction');
    }
  }

  // Generate presentation
  try {
    const generator = new ArchitecturePresentationGenerator(
      archMd,
      stakeholder,
      language,
      summaries
    );
    await generator.generatePresentation(outputPath);
    return 0;
  } catch (e) {
    console.error(`\n❌ Error generating presentation: ${e}`);
    if (e instanceof Error) {
      console.error(e.stack);
    }
    return 1;
  }
}

// Run if executed directly
if (import.meta.main) {
  main()
    .then(code => process.exit(code))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { ArchitecturePresentationGenerator, LanguageManager, SectionExtractor };
