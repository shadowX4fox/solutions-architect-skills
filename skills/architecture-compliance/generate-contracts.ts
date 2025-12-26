#!/usr/bin/env bun

/**
 * Compliance Contract Generation Script
 *
 * Implements the full generation workflow from SKILL.md:
 * - Phase 1: Initialization - Locate and validate ARCHITECTURE.md
 * - Phase 2: Configuration - Select contracts and output directory
 * - Phase 3: Data Extraction - Extract data from ARCHITECTURE.md sections
 * - Phase 4: Document Generation - Load templates, resolve includes, post-process, replace placeholders
 * - Phase 5: Output - Save contracts and generate manifest
 *
 * Usage:
 *   bun generate-contracts.ts --all --arch-path ./ARCHITECTURE.md
 *   bun generate-contracts.ts --contract "Cloud Architecture" --arch-path ./ARCHITECTURE.md
 *   bun generate-contracts.ts --help
 *
 * @version 1.0.0
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Type Definitions
// ============================================================================

interface GenerationOptions {
  archPath: string;
  outputDir?: string;
  contractTypes?: string[];
  all?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

interface ArchitectureData {
  content: string;
  projectName: string;
  sections: Map<number, SectionInfo>;
}

interface SectionInfo {
  title: string;
  startLine: number;
  endLine: number;
  content: string;
}

interface ExtractedData {
  [key: string]: {
    value: string;
    status: 'Compliant' | 'Non-Compliant' | 'Not Applicable' | 'Unknown';
    sourceSection: string;
    sourceLines: string;
    explanation?: string;
  };
}

interface ContractGenerationResult {
  contractType: string;
  filename: string;
  success: boolean;
  dataPoints: number;
  placeholders: number;
  validationScore: number;
  documentStatus: string;
  completeness: number;
  error?: string;
}

interface ValidationResults {
  final_score: number;
  validation_date: string;
  completeness: number;
  compliance: number;
  quality: number;
  overall_status: string;
  document_status: string;
  review_actor: string;
}

interface DomainConfig {
  approval_authority: string;
  validation_config_path: string;
  [key: string]: any;
}

interface OutcomeTier {
  overall_status: string;
  document_status: string;
  review_actor: string;
  action: string;
}

// Contract type mapping
const CONTRACT_TYPES = {
  'Business Continuity': {
    key: 'business_continuity',
    template: 'TEMPLATE_BUSINESS_CONTINUITY.md',
    sections: [11, 10],
    config: 'business-continuity'
  },
  'SRE Architecture': {
    key: 'sre_architecture',
    template: 'TEMPLATE_SRE_ARCHITECTURE.md',
    sections: [10, 11, 5],
    config: 'sre-architecture'
  },
  'Cloud Architecture': {
    key: 'cloud_architecture',
    template: 'TEMPLATE_CLOUD_ARCHITECTURE.md',
    sections: [4, 8, 11, 9, 10],
    config: 'cloud-architecture'
  },
  'Data & AI Architecture': {
    key: 'data_ai_architecture',
    template: 'TEMPLATE_DATA_AI_ARCHITECTURE.md',
    sections: [5, 6, 7, 8, 10],
    config: 'data-ai-architecture'
  },
  'Development Architecture': {
    key: 'development_architecture',
    template: 'TEMPLATE_DEVELOPMENT_ARCHITECTURE.md',
    sections: [3, 5, 8, 12, 11],
    config: 'development-architecture'
  },
  'Process Transformation': {
    key: 'process_transformation',
    template: 'TEMPLATE_PROCESS_TRANSFORMATION.md',
    sections: [1, 2, 6, 5, 7],
    config: 'process-transformation'
  },
  'Security Architecture': {
    key: 'security_architecture',
    template: 'TEMPLATE_SECURITY_ARCHITECTURE.md',
    sections: [9, 7, 11],
    config: 'security-architecture'
  },
  'Platform & IT Infrastructure': {
    key: 'platform_it_infrastructure',
    template: 'TEMPLATE_PLATFORM_IT_INFRASTRUCTURE.md',
    sections: [4, 8, 11, 10],
    config: 'platform-it-infrastructure'
  },
  'Enterprise Architecture': {
    key: 'enterprise_architecture',
    template: 'TEMPLATE_ENTERPRISE_ARCHITECTURE.md',
    sections: [1, 2, 3, 4, 12],
    config: 'enterprise-architecture'
  },
  'Integration Architecture': {
    key: 'integration_architecture',
    template: 'TEMPLATE_INTEGRATION_ARCHITECTURE.md',
    sections: [7, 5, 6, 8],
    config: 'integration-architecture'
  }
};

// ============================================================================
// Phase 1: Initialization - Load and Validate ARCHITECTURE.md
// ============================================================================

/**
 * Load and validate ARCHITECTURE.md structure
 * @param archPath Path to ARCHITECTURE.md file
 * @returns Parsed architecture data with sections
 */
async function loadArchitecture(archPath: string): Promise<ArchitectureData> {
  if (!existsSync(archPath)) {
    throw new Error(`ARCHITECTURE.md not found at: ${archPath}`);
  }

  const content = await readFile(archPath, 'utf-8');
  const lines = content.split('\n');

  // Extract project name - try **System**: field first, then H1 header
  let projectName = '';
  const systemFieldMatch = content.match(/^\*\*System\*\*:\s*(.+)$/m);
  if (systemFieldMatch) {
    projectName = systemFieldMatch[1].trim();
  } else {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (!titleMatch) {
      throw new Error('ARCHITECTURE.md missing title (H1 header) and **System**: field');
    }
    projectName = titleMatch[1].replace(/^Architecture:\s*/i, '').trim();
  }

  // Parse sections (H2 headers)
  const sections = new Map<number, SectionInfo>();
  const sectionPattern = /^##\s+(\d+)\.\s+(.+)$/gm;
  let match;
  const sectionMatches: Array<{ num: number; title: string; line: number }> = [];

  // Find all section headers
  let lineNum = 0;
  for (const line of lines) {
    if (/^##\s+\d+\./.test(line)) {
      const secMatch = line.match(/^##\s+(\d+)\.\s+(.+)$/);
      if (secMatch) {
        sectionMatches.push({
          num: parseInt(secMatch[1]),
          title: secMatch[2].trim(),
          line: lineNum
        });
      }
    }
    lineNum++;
  }

  // Extract section content with line ranges
  for (let i = 0; i < sectionMatches.length; i++) {
    const section = sectionMatches[i];
    const nextSection = sectionMatches[i + 1];
    const startLine = section.line;
    const endLine = nextSection ? nextSection.line - 1 : lines.length - 1;

    const sectionContent = lines.slice(startLine, endLine + 1).join('\n');

    sections.set(section.num, {
      title: section.title,
      startLine,
      endLine,
      content: sectionContent
    });
  }

  // Validate 12-section structure
  const expectedSections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const missingSections = expectedSections.filter(num => !sections.has(num));

  if (missingSections.length > 0) {
    console.warn(`⚠️  Warning: Missing sections: ${missingSections.join(', ')}`);
  }

  return {
    content,
    projectName,
    sections
  };
}

// ============================================================================
// Phase 3: Data Extraction
// ============================================================================

/**
 * Extract data from ARCHITECTURE.md for a specific contract type
 * Uses Direct, Aggregation, or Transformation strategies
 */
async function extractDataForContract(
  archData: ArchitectureData,
  contractType: string
): Promise<ExtractedData> {
  const contractInfo = CONTRACT_TYPES[contractType as keyof typeof CONTRACT_TYPES];
  if (!contractInfo) {
    throw new Error(`Unknown contract type: ${contractType}`);
  }

  const requiredSections = contractInfo.sections;
  const extractedData: ExtractedData = {};

  // Route to specific extraction function based on contract type
  switch (contractInfo.key) {
    case 'business_continuity':
      return extractBusinessContinuityData(archData, requiredSections);
    case 'sre_architecture':
      return extractSREData(archData, requiredSections);
    case 'cloud_architecture':
      return extractCloudArchitectureData(archData, requiredSections);
    case 'data_ai_architecture':
      return extractDataAIData(archData, requiredSections);
    case 'development_architecture':
      return extractDevelopmentArchitectureData(archData, requiredSections);
    case 'process_transformation':
      return extractProcessTransformationData(archData, requiredSections);
    case 'security_architecture':
      return extractSecurityArchitectureData(archData, requiredSections);
    case 'platform_it_infrastructure':
      return extractPlatformITData(archData, requiredSections);
    case 'enterprise_architecture':
      return extractEnterpriseArchitectureData(archData, requiredSections);
    case 'integration_architecture':
      return extractIntegrationArchitectureData(archData, requiredSections);
    default:
      throw new Error(`No extraction function for: ${contractInfo.key}`);
  }
}

/**
 * Helper function to extract value from section with pattern
 */
function extractFromSection(
  section: SectionInfo | undefined,
  pattern: RegExp,
  sectionNum: number
): { value: string; sourceLines: string } | null {
  if (!section) {
    return null;
  }

  const match = section.content.match(pattern);
  if (!match) {
    return null;
  }

  // Find line number within section
  const lines = section.content.split('\n');
  let matchLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      matchLine = section.startLine + i;
      break;
    }
  }

  return {
    value: match[1] || match[0],
    sourceLines: `line ${matchLine}`
  };
}

/**
 * Determine status based on data availability and quality
 */
function determineStatus(value: string | null, isRequired: boolean = true):
  'Compliant' | 'Non-Compliant' | 'Not Applicable' | 'Unknown' {
  if (!value || value.trim() === '') {
    return isRequired ? 'Non-Compliant' : 'Not Applicable';
  }

  // Check for placeholder-like values
  if (value.includes('TBD') || value.includes('TODO') || value.includes('[') || value.includes('Not specified')) {
    return 'Unknown';
  }

  return 'Compliant';
}

// ============================================================================
// Contract-Specific Extraction Functions
// ============================================================================

async function extractBusinessContinuityData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 11: Operational Considerations (primary)
  const sec11 = archData.sections.get(11);

  // RTO (Recovery Time Objective)
  const rto = extractFromSection(sec11, /RTO:?\s*([^,\n]+)/i, 11);
  data['rto'] = {
    value: rto?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11.3]',
    status: determineStatus(rto?.value),
    sourceSection: rto ? 'Section 11' : 'Not documented',
    sourceLines: rto?.sourceLines || 'N/A'
  };

  // RPO (Recovery Point Objective)
  const rpo = extractFromSection(sec11, /RPO:?\s*([^,\n]+)/i, 11);
  data['rpo'] = {
    value: rpo?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11.3]',
    status: determineStatus(rpo?.value),
    sourceSection: rpo ? 'Section 11' : 'Not documented',
    sourceLines: rpo?.sourceLines || 'N/A'
  };

  // Backup Strategy
  const backup = extractFromSection(sec11, /backup\s+(?:strategy|approach):?\s*([^\n]+)/i, 11);
  data['backup_strategy'] = {
    value: backup?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11.3]',
    status: determineStatus(backup?.value),
    sourceSection: backup ? 'Section 11' : 'Not documented',
    sourceLines: backup?.sourceLines || 'N/A'
  };

  // Disaster Recovery
  const dr = extractFromSection(sec11, /disaster\s+recovery:?\s*([^\n]+)/i, 11);
  data['disaster_recovery'] = {
    value: dr?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11]',
    status: determineStatus(dr?.value),
    sourceSection: dr ? 'Section 11' : 'Not documented',
    sourceLines: dr?.sourceLines || 'N/A'
  };

  return data;
}

async function extractSREData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 10: Performance Requirements (primary for SLOs)
  const sec10 = archData.sections.get(10);

  // SLO - Availability
  const availability = extractFromSection(sec10, /(?:availability|uptime|SLA):?\s*([\d.]+%)/i, 10);
  data['slo_availability'] = {
    value: availability?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 10]',
    status: determineStatus(availability?.value),
    sourceSection: availability ? 'Section 10' : 'Not documented',
    sourceLines: availability?.sourceLines || 'N/A'
  };

  // Calculate error budget if availability exists
  if (availability) {
    const availNum = parseFloat(availability.value);
    const errorBudgetMin = ((100 - availNum) / 100) * 43200; // minutes per month
    data['error_budget'] = {
      value: `${errorBudgetMin.toFixed(1)} minutes/month`,
      status: 'Compliant',
      sourceSection: 'Section 10',
      sourceLines: `${availability.sourceLines} (calculated)`,
      explanation: `Calculated from ${availability.value} availability: (100% - ${availNum}%) × 43,200 min/month`
    };
  } else {
    data['error_budget'] = {
      value: '[PLACEHOLDER: Cannot calculate without availability SLO]',
      status: 'Non-Compliant',
      sourceSection: 'Not documented',
      sourceLines: 'N/A'
    };
  }

  // SLO - Latency (p95, p99)
  const latencyP95 = extractFromSection(sec10, /p95[:\s]+([^\n,]+)/i, 10);
  data['slo_latency_p95'] = {
    value: latencyP95?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 10]',
    status: determineStatus(latencyP95?.value),
    sourceSection: latencyP95 ? 'Section 10' : 'Not documented',
    sourceLines: latencyP95?.sourceLines || 'N/A'
  };

  const latencyP99 = extractFromSection(sec10, /p99[:\s]+([^\n,]+)/i, 10);
  data['slo_latency_p99'] = {
    value: latencyP99?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 10]',
    status: determineStatus(latencyP99?.value),
    sourceSection: latencyP99 ? 'Section 10' : 'Not documented',
    sourceLines: latencyP99?.sourceLines || 'N/A'
  };

  // Section 11: Operational Considerations (monitoring, incidents)
  const sec11 = archData.sections.get(11);

  // Monitoring Stack
  const monitoring = extractFromSection(sec11, /monitoring:?\s*([^\n]+)/i, 11);
  data['monitoring_stack'] = {
    value: monitoring?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11]',
    status: determineStatus(monitoring?.value),
    sourceSection: monitoring ? 'Section 11' : 'Not documented',
    sourceLines: monitoring?.sourceLines || 'N/A'
  };

  // Incident Management
  const incidents = extractFromSection(sec11, /incident[s]?:?\s*([^\n]+)/i, 11);
  data['incident_management'] = {
    value: incidents?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11]',
    status: determineStatus(incidents?.value),
    sourceSection: incidents ? 'Section 11' : 'Not documented',
    sourceLines: incidents?.sourceLines || 'N/A'
  };

  return data;
}

async function extractCloudArchitectureData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 4: Deployment Architecture (primary for cloud)
  const sec4 = archData.sections.get(4);

  // Cloud Provider
  const provider = extractFromSection(sec4, /(AWS|Azure|GCP|Google Cloud)/i, 4);
  data['cloud_provider'] = {
    value: provider?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 4]',
    status: determineStatus(provider?.value),
    sourceSection: provider ? 'Section 4' : 'Not documented',
    sourceLines: provider?.sourceLines || 'N/A'
  };

  // Deployment Model (IaaS, PaaS, SaaS, Hybrid, Multi-cloud)
  const model = extractFromSection(sec4, /(IaaS|PaaS|SaaS|Hybrid|Multi-cloud)/i, 4);
  data['deployment_model'] = {
    value: model?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 4]',
    status: determineStatus(model?.value),
    sourceSection: model ? 'Section 4' : 'Not documented',
    sourceLines: model?.sourceLines || 'N/A'
  };

  // Regions
  const regions = extractFromSection(sec4, /regions?:?\s*([^\n]+)/i, 4);
  data['regions'] = {
    value: regions?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 4]',
    status: determineStatus(regions?.value),
    sourceSection: regions ? 'Section 4' : 'Not documented',
    sourceLines: regions?.sourceLines || 'N/A'
  };

  // Section 8: Technology Stack (cloud services)
  const sec8 = archData.sections.get(8);
  const cloudServices = extractFromSection(sec8, /cloud\s+services:?\s*([^\n]+)/i, 8);
  data['cloud_services'] = {
    value: cloudServices?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 8]',
    status: determineStatus(cloudServices?.value, false),
    sourceSection: cloudServices ? 'Section 8' : 'Not documented',
    sourceLines: cloudServices?.sourceLines || 'N/A'
  };

  return data;
}

async function extractDataAIData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 5: System Components (data components)
  const sec5 = archData.sections.get(5);
  const sec6 = archData.sections.get(6); // Data Flow

  // Data Quality
  const dataQuality = extractFromSection(sec6, /data\s+quality:?\s*([^\n]+)/i, 6);
  data['data_quality'] = {
    value: dataQuality?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 6]',
    status: determineStatus(dataQuality?.value),
    sourceSection: dataQuality ? 'Section 6' : 'Not documented',
    sourceLines: dataQuality?.sourceLines || 'N/A'
  };

  // AI Models
  const aiModels = extractFromSection(sec5, /(?:AI|ML|machine learning)\s+model[s]?:?\s*([^\n]+)/i, 5);
  data['ai_models'] = {
    value: aiModels?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 5]',
    status: determineStatus(aiModels?.value, false),
    sourceSection: aiModels ? 'Section 5' : 'Not documented',
    sourceLines: aiModels?.sourceLines || 'N/A'
  };

  // Hallucination Control
  const hallucination = extractFromSection(sec5, /hallucination\s+(?:control|mitigation):?\s*([^\n]+)/i, 5);
  data['hallucination_control'] = {
    value: hallucination?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 5]',
    status: determineStatus(hallucination?.value, false),
    sourceSection: hallucination ? 'Section 5' : 'Not documented',
    sourceLines: hallucination?.sourceLines || 'N/A'
  };

  return data;
}

async function extractDevelopmentArchitectureData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 8: Technology Stack (primary)
  const sec8 = archData.sections.get(8);

  // Programming Languages
  const languages = extractFromSection(sec8, /(?:languages?|programming):?\s*([^\n]+)/i, 8);
  data['programming_languages'] = {
    value: languages?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 8]',
    status: determineStatus(languages?.value),
    sourceSection: languages ? 'Section 8' : 'Not documented',
    sourceLines: languages?.sourceLines || 'N/A'
  };

  // Frameworks
  const frameworks = extractFromSection(sec8, /frameworks?:?\s*([^\n]+)/i, 8);
  data['frameworks'] = {
    value: frameworks?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 8]',
    status: determineStatus(frameworks?.value),
    sourceSection: frameworks ? 'Section 8' : 'Not documented',
    sourceLines: frameworks?.sourceLines || 'N/A'
  };

  // Section 11: Operational (CI/CD, code coverage)
  const sec11 = archData.sections.get(11);
  const cicd = extractFromSection(sec11, /CI\/CD:?\s*([^\n]+)/i, 11);
  data['cicd'] = {
    value: cicd?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 11]',
    status: determineStatus(cicd?.value),
    sourceSection: cicd ? 'Section 11' : 'Not documented',
    sourceLines: cicd?.sourceLines || 'N/A'
  };

  return data;
}

async function extractProcessTransformationData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 2: Business Context (automation benefits)
  const sec2 = archData.sections.get(2);
  const automation = extractFromSection(sec2, /automation:?\s*([^\n]+)/i, 2);
  data['automation'] = {
    value: automation?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 2]',
    status: determineStatus(automation?.value),
    sourceSection: automation ? 'Section 2' : 'Not documented',
    sourceLines: automation?.sourceLines || 'N/A'
  };

  // Process efficiency gains
  const efficiency = extractFromSection(sec2, /efficiency:?\s*([^\n]+)/i, 2);
  data['efficiency_gains'] = {
    value: efficiency?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 2]',
    status: determineStatus(efficiency?.value, false),
    sourceSection: efficiency ? 'Section 2' : 'Not documented',
    sourceLines: efficiency?.sourceLines || 'N/A'
  };

  return data;
}

async function extractSecurityArchitectureData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 9: Security Considerations (primary)
  const sec9 = archData.sections.get(9);

  // Authentication
  const auth = extractFromSection(sec9, /authentication:?\s*([^\n]+)/i, 9);
  data['authentication'] = {
    value: auth?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 9]',
    status: determineStatus(auth?.value),
    sourceSection: auth ? 'Section 9' : 'Not documented',
    sourceLines: auth?.sourceLines || 'N/A'
  };

  // Encryption
  const encryption = extractFromSection(sec9, /encryption:?\s*([^\n]+)/i, 9);
  data['encryption'] = {
    value: encryption?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 9]',
    status: determineStatus(encryption?.value),
    sourceSection: encryption ? 'Section 9' : 'Not documented',
    sourceLines: encryption?.sourceLines || 'N/A'
  };

  // API Security
  const apiSecurity = extractFromSection(sec9, /API\s+security:?\s*([^\n]+)/i, 9);
  data['api_security'] = {
    value: apiSecurity?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 9]',
    status: determineStatus(apiSecurity?.value),
    sourceSection: apiSecurity ? 'Section 9' : 'Not documented',
    sourceLines: apiSecurity?.sourceLines || 'N/A'
  };

  return data;
}

async function extractPlatformITData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 4: Deployment Architecture (environments)
  const sec4 = archData.sections.get(4);
  const environments = extractFromSection(sec4, /environments?:?\s*([^\n]+)/i, 4);
  data['environments'] = {
    value: environments?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 4]',
    status: determineStatus(environments?.value),
    sourceSection: environments ? 'Section 4' : 'Not documented',
    sourceLines: environments?.sourceLines || 'N/A'
  };

  // Section 8: Technology Stack (databases, OS)
  const sec8 = archData.sections.get(8);
  const database = extractFromSection(sec8, /database[s]?:?\s*([^\n]+)/i, 8);
  data['databases'] = {
    value: database?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 8]',
    status: determineStatus(database?.value),
    sourceSection: database ? 'Section 8' : 'Not documented',
    sourceLines: database?.sourceLines || 'N/A'
  };

  return data;
}

async function extractEnterpriseArchitectureData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 3: Architecture Patterns (modularity, cloud-first, API-first)
  const sec3 = archData.sections.get(3);

  const modularity = extractFromSection(sec3, /modular|microservices/i, 3);
  data['modularity'] = {
    value: modularity?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 3]',
    status: determineStatus(modularity?.value),
    sourceSection: modularity ? 'Section 3' : 'Not documented',
    sourceLines: modularity?.sourceLines || 'N/A'
  };

  const cloudFirst = extractFromSection(sec3, /cloud[- ]first/i, 3);
  data['cloud_first'] = {
    value: cloudFirst?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 3]',
    status: determineStatus(cloudFirst?.value, false),
    sourceSection: cloudFirst ? 'Section 3' : 'Not documented',
    sourceLines: cloudFirst?.sourceLines || 'N/A'
  };

  return data;
}

async function extractIntegrationArchitectureData(
  archData: ArchitectureData,
  sections: number[]
): Promise<ExtractedData> {
  const data: ExtractedData = {};

  // Section 7: Integration Points (primary)
  const sec7 = archData.sections.get(7);

  if (sec7) {
    // Count integrations
    const integrationMatches = sec7.content.match(/(?:REST|SOAP|gRPC|GraphQL|Webhook|Message Queue)/gi);
    const integrationCount = integrationMatches ? integrationMatches.length : 0;

    data['integration_count'] = {
      value: integrationCount.toString(),
      status: integrationCount > 0 ? 'Compliant' : 'Non-Compliant',
      sourceSection: 'Section 7',
      sourceLines: `lines ${sec7.startLine}-${sec7.endLine}`
    };

    // API Standards
    const apiStandards = extractFromSection(sec7, /API\s+standard[s]?:?\s*([^\n]+)/i, 7);
    data['api_standards'] = {
      value: apiStandards?.value || '[PLACEHOLDER: Not specified in ARCHITECTURE.md Section 7]',
      status: determineStatus(apiStandards?.value),
      sourceSection: apiStandards ? 'Section 7' : 'Not documented',
      sourceLines: apiStandards?.sourceLines || 'N/A'
    };
  } else {
    data['integration_count'] = {
      value: '[PLACEHOLDER: Section 7 missing]',
      status: 'Non-Compliant',
      sourceSection: 'Not documented',
      sourceLines: 'N/A'
    };
  }

  return data;
}

// ============================================================================
// Phase 4: Document Generation
// ============================================================================

/**
 * Generate a single compliance contract
 * Full pipeline: load template → resolve includes → post-process → replace placeholders → populate summary
 */
async function generateContract(
  contractType: string,
  archData: ArchitectureData,
  extractedData: ExtractedData,
  outputDir: string,
  verbose: boolean = false
): Promise<ContractGenerationResult> {
  try {
    const contractInfo = CONTRACT_TYPES[contractType as keyof typeof CONTRACT_TYPES];
    const skillBasePath = join(__dirname);
    const templatePath = join(skillBasePath, 'templates', contractInfo.template);

    if (verbose) {
      console.log(`  📄 Loading template: ${contractInfo.template}`);
    }

    // Step 4.1: Load template with include resolution
    const rawTemplate = await readFile(templatePath, 'utf-8');
    const expandedTemplate = await resolveIncludes(rawTemplate, skillBasePath, verbose);

    // Step 4.1.5: Post-process template (remove instructions, replace dynamic fields)
    const generationDate = getCurrentDate();
    const validationResults = await performValidation(extractedData, contractInfo.key);
    const config: DomainConfig = {
      approval_authority: 'Technical Architecture Review Board',
      validation_config_path: join(skillBasePath, 'validation', `${contractInfo.key}_validation.json`)
    };

    const postProcessed = await postProcessTemplate(
      expandedTemplate,
      validationResults,
      config,
      generationDate,
      verbose
    );

    // Step 4.2: Replace placeholders with extracted data
    let contractContent = postProcessed;
    contractContent = contractContent.replace(/\[PROJECT_NAME\]/g, archData.projectName);
    contractContent = contractContent.replace(/\[GENERATION_DATE\]/g, generationDate);

    // Replace data placeholders
    for (const [key, dataPoint] of Object.entries(extractedData)) {
      const placeholder = `[${key.toUpperCase()}]`;
      // Escape special regex characters in placeholder (especially square brackets)
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      contractContent = contractContent.replace(
        new RegExp(escapedPlaceholder, 'g'),
        dataPoint.value
      );
    }

    // Step 4.3: Populate Compliance Summary table (handled by template for now)

    // Calculate metrics
    const dataPoints = Object.keys(extractedData).length;
    const placeholders = Object.values(extractedData).filter(d =>
      d.value.includes('[PLACEHOLDER')
    ).length;
    const completeness = Math.round(((dataPoints - placeholders) / dataPoints) * 100);

    // Generate filename
    const filenameSafeProjectName = archData.projectName.replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `${contractInfo.key.toUpperCase()}_${filenameSafeProjectName}_${generationDate}.md`;
    const filepath = join(outputDir, filename);

    // Save contract
    await writeFile(filepath, contractContent, 'utf-8');

    if (verbose) {
      console.log(`  ✅ Generated: ${filename}`);
    }

    return {
      contractType,
      filename,
      success: true,
      dataPoints,
      placeholders,
      validationScore: validationResults.final_score,
      documentStatus: validationResults.document_status,
      completeness
    };

  } catch (error) {
    return {
      contractType,
      filename: '',
      success: false,
      dataPoints: 0,
      placeholders: 0,
      validationScore: 0,
      documentStatus: 'Error',
      completeness: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Resolve @include and @include-with-config directives in template
 */
async function resolveIncludes(
  template: string,
  basePath: string,
  verbose: boolean = false
): Promise<string> {
  const includePattern = /<!--\s*@include(?:-with-config)?\s+(.+?)\s*(?:config=(\S+))?\s*-->/g;
  let result = template;
  let match;
  let depth = 0;
  const maxDepth = 3;

  while ((match = includePattern.exec(result)) !== null && depth < maxDepth) {
    const fullMatch = match[0];
    const includePath = match[1].trim();
    const configName = match[2];

    if (verbose) {
      console.log(`    📎 Resolving include: ${includePath}${configName ? ` (config: ${configName})` : ''}`);
    }

    const fullPath = join(basePath, includePath);
    let includeContent = await readFile(fullPath, 'utf-8');

    // If config specified, load and apply variable substitution
    if (configName) {
      const configPath = join(basePath, 'shared', 'config', `${configName}.json`);
      const configData = JSON.parse(await readFile(configPath, 'utf-8'));

      // Replace {{variables}} with config values
      for (const [key, value] of Object.entries(configData)) {
        includeContent = includeContent.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value)
        );
      }
    }

    result = result.replace(fullMatch, includeContent);
    depth++;
  }

  return result;
}

/**
 * Post-process template: remove instructions, replace dynamic fields
 */
async function postProcessTemplate(
  template: string,
  validationResults: ValidationResults,
  config: DomainConfig,
  generationDate: string,
  verbose: boolean = false
): Promise<string> {
  if (verbose) {
    console.log('    🔧 Post-processing template...');
  }

  let result = template;

  // Remove instructional sections
  const instructionPattern = /<!--\s*BEGIN INSTRUCTIONS.*?-->([\s\S]*?)<!--\s*END INSTRUCTIONS\s*-->/gi;
  result = result.replace(instructionPattern, '');

  // Map outcome from validation score
  const outcome = mapOutcomeFromScore(validationResults.final_score, config.approval_authority);

  // Replace dynamic fields
  result = result.replace(/\[DOCUMENT_STATUS\]/g, outcome.document_status);
  result = result.replace(/\[VALIDATION_SCORE\]/g, `${validationResults.final_score.toFixed(1)}/10`);
  result = result.replace(/\[VALIDATION_STATUS\]/g, outcome.overall_status);
  result = result.replace(/\[VALIDATION_DATE\]/g, validationResults.validation_date);
  result = result.replace(/\[VALIDATION_EVALUATOR\]/g, 'Claude Code (Automated Validation Engine)');
  result = result.replace(/\[REVIEW_ACTOR\]/g, outcome.review_actor);
  result = result.replace(/\[APPROVAL_AUTHORITY\]/g, config.approval_authority);

  return result;
}

/**
 * Map validation score to outcome tier
 */
function mapOutcomeFromScore(score: number, approvalAuthority: string): OutcomeTier {
  if (score >= 8.0) {
    return {
      overall_status: 'PASS',
      document_status: 'Approved',
      review_actor: 'System (Auto-Approved)',
      action: 'AUTO_APPROVE'
    };
  } else if (score >= 7.0) {
    return {
      overall_status: 'PASS',
      document_status: 'In Review',
      review_actor: approvalAuthority,
      action: 'MANUAL_REVIEW'
    };
  } else if (score >= 5.0) {
    return {
      overall_status: 'CONDITIONAL',
      document_status: 'Draft',
      review_actor: 'Architecture Team',
      action: 'NEEDS_WORK'
    };
  } else {
    return {
      overall_status: 'FAIL',
      document_status: 'Rejected',
      review_actor: 'N/A (Blocked)',
      action: 'REJECT'
    };
  }
}

/**
 * Perform validation on extracted data (simplified for MVP)
 */
async function performValidation(
  extractedData: ExtractedData,
  contractKey: string
): Promise<ValidationResults> {
  const totalDataPoints = Object.keys(extractedData).length;
  const compliantPoints = Object.values(extractedData).filter(d => d.status === 'Compliant').length;
  const nonCompliantPoints = Object.values(extractedData).filter(d => d.status === 'Non-Compliant').length;

  // Calculate completeness (% of fields with values)
  const completenessScore = (compliantPoints / totalDataPoints) * 10;

  // Calculate compliance (% of compliant + N/A items)
  const complianceScore = (compliantPoints / totalDataPoints) * 10;

  // Quality score (simplified: based on source references)
  const qualityScore = 8.0; // Fixed for MVP

  // Weighted final score (completeness 40%, compliance 50%, quality 10%)
  const finalScore = (completenessScore * 0.4) + (complianceScore * 0.5) + (qualityScore * 0.1);

  const outcome = mapOutcomeFromScore(finalScore, 'Technical Architecture Review Board');

  return {
    final_score: finalScore,
    validation_date: getCurrentDate(),
    completeness: completenessScore,
    compliance: complianceScore,
    quality: qualityScore,
    overall_status: outcome.overall_status,
    document_status: outcome.document_status,
    review_actor: outcome.review_actor
  };
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  try {
    const dateOutput = execSync('date +%Y-%m-%d', { encoding: 'utf-8' });
    return dateOutput.trim();
  } catch {
    // Fallback to JS Date if bash command fails
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}

// ============================================================================
// Phase 5: Output and Manifest Generation
// ============================================================================

/**
 * Generate or update compliance manifest
 */
async function updateManifest(
  results: ContractGenerationResult[],
  projectName: string,
  outputDir: string,
  mode: 'create' | 'update',
  verbose: boolean = false
): Promise<void> {
  if (verbose) {
    console.log(`\n📋 ${mode === 'create' ? 'Creating' : 'Updating'} manifest...`);
  }

  const skillBasePath = join(__dirname);
  const manifestPath = join(outputDir, 'COMPLIANCE_MANIFEST.md');

  // Use manifest-generator utility
  for (const result of results) {
    if (!result.success) continue;

    const cmd = [
      'bun',
      join(skillBasePath, 'utils', 'manifest-generator.ts'),
      '--mode', mode,
      '--project', `"${projectName}"`,
      '--contract-type', `"${result.contractType}"`,
      '--filename', result.filename,
      '--score', result.validationScore.toString(),
      '--status', `"${result.documentStatus}"`,
      '--completeness', result.completeness.toString()
    ].join(' ');

    try {
      execSync(cmd, { cwd: outputDir, stdio: verbose ? 'inherit' : 'pipe' });
      mode = 'update'; // Switch to update mode after first contract
    } catch (error) {
      console.error(`⚠️  Warning: Failed to update manifest for ${result.contractType}`);
    }
  }

  if (verbose && existsSync(manifestPath)) {
    console.log(`✅ Manifest saved: ${manifestPath}`);
  }
}

// ============================================================================
// Main Workflow
// ============================================================================

/**
 * Main contract generation workflow
 * Implements all 5 phases from SKILL.md
 */
async function generateContracts(options: GenerationOptions): Promise<void> {
  const startTime = Date.now();

  console.log('🚀 Compliance Contract Generation Script v1.0.0\n');

  // Phase 1: Initialization
  console.log('📂 Phase 1: Loading ARCHITECTURE.md...');
  const archData = await loadArchitecture(options.archPath);
  console.log(`   Project: ${archData.projectName}`);
  console.log(`   Sections found: ${archData.sections.size}/12`);

  // Phase 2: Configuration
  console.log('\n⚙️  Phase 2: Configuration...');
  const contractsToGenerate = options.all
    ? Object.keys(CONTRACT_TYPES)
    : options.contractTypes || [];

  const outputDir = options.outputDir || join(dirname(options.archPath), 'compliance-docs');
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
    console.log(`   Created output directory: ${outputDir}`);
  }

  console.log(`   Contracts to generate: ${contractsToGenerate.length}`);
  if (options.verbose) {
    contractsToGenerate.forEach((ct, i) => console.log(`     ${i + 1}. ${ct}`));
  }

  if (options.dryRun) {
    console.log('\n🔍 DRY RUN - No files will be generated');
    return;
  }

  // Phase 3 & 4: Data Extraction and Document Generation
  console.log('\n🔄 Phase 3 & 4: Extracting data and generating contracts...\n');
  const results: ContractGenerationResult[] = [];

  for (const contractType of contractsToGenerate) {
    console.log(`📝 Generating: ${contractType}`);

    // Extract data for this contract type
    const extractedData = await extractDataForContract(archData, contractType);
    if (options.verbose) {
      console.log(`  📊 Extracted ${Object.keys(extractedData).length} data points`);
    }

    // Generate contract
    const result = await generateContract(
      contractType,
      archData,
      extractedData,
      outputDir,
      options.verbose
    );

    results.push(result);

    if (result.success) {
      console.log(`✅ ${contractType}: ${result.filename}`);
      console.log(`   Score: ${result.validationScore.toFixed(1)}/10 | Status: ${result.documentStatus} | Completeness: ${result.completeness}%\n`);
    } else {
      console.log(`❌ ${contractType}: FAILED`);
      console.log(`   Error: ${result.error}\n`);
    }
  }

  // Phase 5: Generate Manifest
  console.log('📋 Phase 5: Generating manifest...');
  await updateManifest(results, archData.projectName, outputDir, 'create', options.verbose);

  // Summary Report
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalPlaceholders = results.reduce((sum, r) => sum + r.placeholders, 0);
  const avgCompleteness = Math.round(
    results.filter(r => r.success).reduce((sum, r) => sum + r.completeness, 0) / successful
  );

  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successful}/${contractsToGenerate.length}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📍 Total placeholders: ${totalPlaceholders}`);
  console.log(`📈 Average completeness: ${avgCompleteness}%`);
  console.log(`⏱️  Time elapsed: ${elapsed}s`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log('='.repeat(60));

  if (totalPlaceholders > 0) {
    console.log(`\n⚠️  ${totalPlaceholders} placeholders require manual review`);
    console.log('   Review generated contracts and update ARCHITECTURE.md to reduce gaps');
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

function printUsage(): void {
  console.log(`
Compliance Contract Generation Script

Usage:
  bun generate-contracts.ts [OPTIONS]

Options:
  --all                     Generate all 10 compliance contracts
  --contract "TYPE"         Generate specific contract type (can repeat)
  --arch-path PATH          Path to ARCHITECTURE.md (required)
  --output DIR              Output directory (default: compliance-docs/)
  --dry-run                 Show what would be generated without creating files
  --verbose                 Enable verbose logging
  --help                    Show this help message

Examples:
  # Generate all contracts
  bun generate-contracts.ts --all --arch-path ./ARCHITECTURE.md

  # Generate specific contract
  bun generate-contracts.ts --contract "SRE Architecture" --arch-path ./ARCHITECTURE.md

  # Generate multiple specific contracts
  bun generate-contracts.ts --contract "Cloud Architecture" --contract "Security Architecture" --arch-path ./ARCHITECTURE.md

  # Dry run with verbose output
  bun generate-contracts.ts --all --arch-path ./ARCHITECTURE.md --dry-run --verbose

Contract Types:
  - Business Continuity
  - SRE Architecture
  - Cloud Architecture
  - Data & AI Architecture
  - Development Architecture
  - Process Transformation
  - Security Architecture
  - Platform & IT Infrastructure
  - Enterprise Architecture
  - Integration Architecture
`);
}

// Parse CLI arguments
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options: GenerationOptions = {
    archPath: '',
    contractTypes: [],
    all: false,
    dryRun: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--all':
        options.all = true;
        break;
      case '--contract':
        options.contractTypes = options.contractTypes || [];
        options.contractTypes.push(args[++i]);
        break;
      case '--arch-path':
        options.archPath = args[++i];
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  // Validate required options
  if (!options.archPath) {
    console.error('Error: --arch-path is required');
    printUsage();
    process.exit(1);
  }

  if (!options.all && (!options.contractTypes || options.contractTypes.length === 0)) {
    console.error('Error: Must specify --all or at least one --contract');
    printUsage();
    process.exit(1);
  }

  // Run generation
  try {
    await generateContracts(options);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
