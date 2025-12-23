#!/usr/bin/env bun
/**
 * Test Script: Dark Blue Professional Slide Types
 *
 * Purpose:
 * - Showcases all 11 slide types with the new dark blue theme
 * - Validates that all slide helper functions work correctly
 * - Generates a test presentation for visual verification
 *
 * Usage:
 *   bun run utils/test-new-slides.ts
 *
 * Output:
 *   /tmp/test-new-slides.pptx
 */

import officegen from 'officegen';
import * as fs from 'fs';
import {
  // Slide functions
  addTitleSlide,
  addContentSlide,
  addBulletText,
  addSectionDividerSlide,
  addSingleFocusSlide,
  addComparisonSlide,
  addProcessSlide,
  addExplanationSlide,
  addMetricsSlide,
  addQuoteSlide,
  addCallToActionSlide,
  // Colors
  DARK_GRAY
} from './create-presentation';

async function generateTestPresentation(): Promise<void> {
  console.log('🧪 Testing Dark Blue Professional Slide Types\n');

  // Initialize presentation
  const pptx = officegen({
    type: 'pptx',
    title: 'Dark Blue Professional Theme - Test Suite',
    author: 'Solutions Architect Skills',
    company: 'Claude Code Plugin',
    subject: 'Slide Type Validation'
  });

  console.log('✅ Initialized presentation');

  let slideNum = 1;

  // ============================================================
  // SLIDE 1: Title Slide
  // ============================================================
  addTitleSlide(
    pptx,
    'Dark Blue Professional Theme',
    'Complete Slide Type Showcase',
    'v1.6.0'
  );
  console.log(`✓ Slide ${slideNum}: Title Slide (PRIMARY background #0A1E3D)`);
  slideNum++;

  // ============================================================
  // SLIDE 2: Agenda Slide
  // ============================================================
  const agendaSlide = addContentSlide(pptx, 'Agenda');
  addBulletText(
    agendaSlide,
    0.8, 2.0, 8.5, 4.5,
    [
      'Section Divider',
      'Single Focus',
      'Comparison',
      'Process/Timeline',
      'Explanation + Visual',
      'Metrics Dashboard',
      'Quote/Testimonial',
      'Call to Action',
      'Standard Content',
      'Summary'
    ],
    20,
    DARK_GRAY,
    false
  );
  console.log(`✓ Slide ${slideNum}: Agenda (standard content slide)`);
  slideNum++;

  // ============================================================
  // SLIDE 3: Section Divider
  // ============================================================
  addSectionDividerSlide(pptx, '01', 'New Slide Types');
  console.log(`✓ Slide ${slideNum}: Section Divider (ACCENT badge on PRIMARY bg)`);
  slideNum++;

  // ============================================================
  // SLIDE 4: Single Focus
  // ============================================================
  addSingleFocusSlide(
    pptx,
    'Single Focus Slide',
    'Emphasize One Key Message',
    'Perfect for important takeaways and announcements'
  );
  console.log(`✓ Slide ${slideNum}: Single Focus (large centered text)`);
  slideNum++;

  // ============================================================
  // SLIDE 5: Comparison
  // ============================================================
  addComparisonSlide(
    pptx,
    'Architecture Evolution',
    'Current State',
    [
      'Monolithic application architecture',
      'Single relational database',
      'Manual deployment process',
      'Limited horizontal scalability',
      'Tight coupling between components'
    ],
    'Target State',
    [
      'Microservices architecture',
      'Distributed data stores',
      'Automated CI/CD pipeline',
      'Horizontal scaling capabilities',
      'Loosely coupled services'
    ]
  );
  console.log(`✓ Slide ${slideNum}: Comparison (SECONDARY vs ACCENT headers)`);
  slideNum++;

  // ============================================================
  // SLIDE 6: Process/Timeline
  // ============================================================
  addProcessSlide(
    pptx,
    'Deployment Pipeline',
    [
      'Code Commit & PR Review',
      'Automated Unit & Integration Tests',
      'Security & Vulnerability Scanning',
      'Deploy to Staging Environment',
      'Production Release & Monitoring'
    ]
  );
  console.log(`✓ Slide ${slideNum}: Process (horizontal flow with numbered steps)`);
  slideNum++;

  // ============================================================
  // SLIDE 7: Explanation + Visual
  // ============================================================
  addExplanationSlide(
    pptx,
    'Data Architecture',
    [
      'Event-driven architecture with message queues',
      'CQRS pattern for read/write separation',
      'Event sourcing for complete audit trail',
      'Eventual consistency model',
      'Distributed caching layer for performance'
    ],
    '[Add data flow diagram showing event flow from Section 6]'
  );
  console.log(`✓ Slide ${slideNum}: Explanation + Visual (split layout with placeholder)`);
  slideNum++;

  // ============================================================
  // SLIDE 8: Metrics Dashboard
  // ============================================================
  addMetricsSlide(
    pptx,
    'Key Performance Metrics',
    [
      { value: '10,000+', label: 'Concurrent Users' },
      { value: '99.9%', label: 'System Availability' },
      { value: '<200ms', label: 'Avg Response Time' }
    ]
  );
  console.log(`✓ Slide ${slideNum}: Metrics (3 cards with ACCENT numbers)`);
  slideNum++;

  // ============================================================
  // SLIDE 9: Quote/Testimonial
  // ============================================================
  addQuoteSlide(
    pptx,
    'The new architecture reduced our deployment time from hours to minutes, enabling true continuous delivery and significantly improving our time to market.',
    'Chief Technology Officer, Enterprise Client'
  );
  console.log(`✓ Slide ${slideNum}: Quote (PRIMARY bg with italic text)`);
  slideNum++;

  // ============================================================
  // SLIDE 10: Call to Action
  // ============================================================
  addCallToActionSlide(
    pptx,
    'Questions?',
    [
      'Architecture Team: architecture@company.com',
      'Technical Support: support@company.com',
      'Documentation: docs.company.com/architecture',
      'GitHub: github.com/company/solutions-architect-skills'
    ]
  );
  console.log(`✓ Slide ${slideNum}: Call to Action (contact info with ACCENT bar)`);
  slideNum++;

  // ============================================================
  // SLIDE 11: Standard Content Slide
  // ============================================================
  const contentSlide = addContentSlide(pptx, 'Standard Content Slide');
  addBulletText(
    contentSlide,
    0.8, 2.0, 8.5, 4.5,
    [
      'Traditional bullet point slide with PRIMARY header bar',
      'Used for lists, features, technical details',
      'Most common slide type (default)',
      'Supports unlimited bullet points',
      'Compatible with legacy presentations'
    ],
    18,
    DARK_GRAY,
    false
  );
  console.log(`✓ Slide ${slideNum}: Content (standard bullet points)`);
  slideNum++;

  // ============================================================
  // SLIDE 12: Summary
  // ============================================================
  const summarySlide = addContentSlide(pptx, 'Summary & Q&A');
  addBulletText(
    summarySlide,
    0.8, 2.0, 8.5, 4.5,
    [
      '11 slide types available (8 new + 3 existing)',
      'Dark Blue Professional Theme (#0A1E3D)',
      'Backward compatible with existing presentations',
      'Bun + officegen architecture maintained',
      'Ready for production use'
    ],
    18,
    DARK_GRAY,
    false
  );
  console.log(`✓ Slide ${slideNum}: Summary (recap with bullets)`);
  slideNum++;

  // ============================================================
  // Save Presentation
  // ============================================================
  const outputPath = '/tmp/test-new-slides.pptx';

  console.log('\n💾 Saving presentation...');

  return new Promise((resolve, reject) => {
    try {
      const out = fs.createWriteStream(outputPath);

      pptx.generate(out);

      out.on('close', () => {
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);

        console.log(`\n✅ SUCCESS! Presentation saved to: ${outputPath}`);
        console.log(`📊 File size: ${sizeKB} KB`);
        console.log(`📄 Total slides: ${slideNum - 1}`);
        console.log('\n🎉 All slide types validated successfully!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Open the presentation in PowerPoint or LibreOffice');
        console.log('   2. Verify visual appearance of each slide type');
        console.log('   3. Check color consistency (PRIMARY #0A1E3D)');
        console.log('   4. Confirm text readability and layout');
        console.log(`\n🚀 Open: ${outputPath}`);

        resolve();
      });

      out.on('error', (err: Error) => {
        console.error('\n❌ ERROR: Failed to save presentation');
        console.error(err);
        reject(err);
      });

    } catch (error) {
      console.error('\n❌ ERROR: Unexpected error during generation');
      console.error(error);
      reject(error);
    }
  });
}

// ============================================================
// Main Execution
// ============================================================
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   Dark Blue Professional Theme - Test Suite v1.6.0   ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

generateTestPresentation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Fatal Error:', error);
    process.exit(1);
  });
