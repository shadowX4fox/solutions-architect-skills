#!/usr/bin/env bun
/**
 * Test Script: Verify create-presentation.ts primitives
 */

import officegen from 'officegen';
import * as fs from 'fs';
import { addTitleSlide, addContentSlide, addBulletText, addBox, BLUE, GREEN, GRAY, WHITE, DARK_GRAY } from './create-presentation';

async function testPrimitives(): Promise<void> {
  console.log('🧪 Testing slide primitives...\n');

  const pptx = officegen({
    type: 'pptx',
    title: 'Primitives Test',
    author: 'Solutions Architect Skills',
    subject: 'Test create-presentation.ts primitives'
  });

  // Test 1: Title Slide
  console.log('Testing addTitleSlide()...');
  addTitleSlide(
    pptx,
    'Arquitectura de Software',
    'Prueba de Primitivas TypeScript',
    'v1.5.24'
  );
  console.log('✅ Title slide created');

  // Test 2: Content Slide with bullets
  console.log('Testing addContentSlide() + addBulletText()...');
  const slide2 = addContentSlide(
    pptx,
    'Resumen Ejecutivo',
    'Características Principales'
  );

  const bullets = [
    'Primera característica con texto largo para probar el formato',
    'Segunda característica con caracteres especiales: áéíóú ñÑ',
    'Tercera característica',
    'Cuarta característica'
  ];

  addBulletText(
    slide2,
    0.8,   // left (inches)
    2.0,   // top (inches)
    8.5,   // width (inches)
    4.0,   // height (inches)
    bullets,
    18,    // font size
    DARK_GRAY,
    false
  );
  console.log('✅ Content slide with bullets created');

  // Test 3: Colored boxes
  console.log('Testing addBox()...');
  const slide3 = addContentSlide(pptx, 'Elementos Visuales');

  addBox(
    slide3,
    0.8,   // left
    2.0,   // top
    2.5,   // width
    1.5,   // height
    'Caja Azul\nTexto Centrado',
    BLUE,
    20,
    WHITE
  );

  addBox(
    slide3,
    3.8,
    2.0,
    2.5,
    1.5,
    'Caja Verde\nTexto Centrado',
    GREEN,
    20,
    WHITE
  );

  addBox(
    slide3,
    6.8,
    2.0,
    2.5,
    1.5,
    'Caja Gris\nTexto Centrado',
    GRAY,
    20,
    WHITE
  );
  console.log('✅ Colored boxes created');

  // Save presentation
  const outputPath = '/tmp/test-primitives.pptx';

  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outputPath);

    pptx.generate(out);

    out.on('close', () => {
      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`\n✅ Presentation saved: ${outputPath}`);
      console.log(`📊 File size: ${sizeKB} KB`);

      if (stats.size > 0) {
        console.log('\n✅ ALL PRIMITIVES WORKING!');
        console.log('   - addTitleSlide() ✓');
        console.log('   - addContentSlide() ✓');
        console.log('   - addBulletText() ✓');
        console.log('   - addBox() ✓');
        console.log(`\n🎉 Ready to implement presentation-generator.ts`);
        resolve();
      } else {
        reject(new Error('Empty file'));
      }
    });

    out.on('error', reject);
  });
}

testPrimitives()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
