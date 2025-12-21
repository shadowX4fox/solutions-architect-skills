#!/usr/bin/env bun
/**
 * Test Script: Try officegen with Bun
 */

import officegen from 'officegen';
import * as fs from 'fs';

async function testOfficegen() {
  console.log('🧪 Testing officegen with Bun...\n');

  try {
    // Create PowerPoint document
    const pptx = officegen({
      type: 'pptx',
      title: 'Test Presentation',
      author: 'Bun Test'
    });

    // Add a slide
    const slide = pptx.makeNewSlide();
    slide.addText('Hello from Bun!', {
      y: 100,
      x: 100,
      font_size: 44,
      bold: true,
      color: '1E3A8A'
    });

    // Save to file
    const outputPath = '/tmp/test-officegen.pptx';
    const out = fs.createWriteStream(outputPath);

    pptx.generate(out);

    out.on('close', () => {
      console.log(`✅ File created: ${outputPath}`);
      const stats = fs.statSync(outputPath);
      console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log('\n✅ Officegen works with Bun!');
    });

    out.on('error', (err: Error) => {
      console.error('❌ Error:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

testOfficegen();
