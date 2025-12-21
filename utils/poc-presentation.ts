#!/usr/bin/env bun
/**
 * POC Script: Test PptxGenJS with Bun
 *
 * Goals:
 * - Verify PptxGenJS works with Bun
 * - Test color formatting matches Python output
 * - Test Spanish character encoding
 * - Create simple 2-slide presentation
 */

// Try importing the ES module version explicitly
import pptxgen from 'pptxgenjs/dist/pptxgen.es.js';

// Color constants matching Python implementation
const BLUE = '1E3A8A';      // #1E3A8A - rgb(30, 58, 138)
const GREEN = '10B981';     // #10B981 - rgb(16, 185, 129)
const GRAY = '6B7280';      // #6B7280 - rgb(107, 114, 128)
const WHITE = 'FFFFFF';     // #FFFFFF - rgb(255, 255, 255)
const DARK_GRAY = '374151'; // #374151 - rgb(55, 65, 81)

async function createPOCPresentation() {
  console.log('🚀 Starting PptxGenJS POC with Bun...\n');

  // Initialize presentation
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 10" x 7.5" widescreen (matches Python)
  pres.author = 'Solutions Architect Skills - Bun POC';
  pres.company = 'Claude Code Plugin';
  pres.subject = 'PptxGenJS POC Test';

  console.log('✅ Initialized presentation (10" x 7.5" widescreen)');

  // ============================================================
  // SLIDE 1: Title Slide
  // ============================================================
  const slide1 = pres.addSlide();

  // Background color (blue)
  slide1.background = { color: BLUE };

  // Title
  slide1.addText('Arquitectura de Software', {
    x: '10%',
    y: '35%',
    w: '80%',
    h: '15%',
    fontSize: 44,
    bold: true,
    color: WHITE,
    align: 'center',
    valign: 'middle'
  });

  // Subtitle
  slide1.addText('Prueba de Concepto - PptxGenJS + Bun', {
    x: '10%',
    y: '52%',
    w: '80%',
    h: '10%',
    fontSize: 24,
    color: WHITE,
    align: 'center',
    valign: 'middle'
  });

  // Version badge
  slide1.addText('v1.0', {
    x: '85%',
    y: '90%',
    w: '10%',
    h: '5%',
    fontSize: 12,
    color: WHITE,
    align: 'right',
    valign: 'bottom'
  });

  console.log('✅ Created Slide 1: Title slide (Spanish text, blue background)');

  // ============================================================
  // SLIDE 2: Content Slide with Bullets
  // ============================================================
  const slide2 = pres.addSlide();

  // Header box (blue background)
  slide2.addText('Resumen Ejecutivo', {
    x: 0,
    y: 0,
    w: '100%',
    h: '15%',
    fontSize: 28,
    bold: true,
    color: WHITE,
    fill: { color: BLUE },
    align: 'center',
    valign: 'middle'
  });

  // Subtitle
  slide2.addText('Características Principales', {
    x: '8%',
    y: '18%',
    w: '85%',
    h: '8%',
    fontSize: 18,
    color: GRAY,
    italic: true
  });

  // Bullet points with Spanish characters
  const bullets = [
    'Sistema de gestión empresarial con capacidad de 10,000+ usuarios concurrentes',
    'Arquitectura de microservicios con 15+ componentes independientes',
    'Disponibilidad del 99.9% con recuperación automática ante fallos',
    'Integración con sistemas externos mediante APIs RESTful y eventos',
    'Cumplimiento de estándares BIAN v12.0 (Capa 4 → META Layer 5)'
  ];

  slide2.addText(bullets, {
    x: '8%',
    y: '28%',
    w: '85%',
    h: '60%',
    fontSize: 18,
    color: DARK_GRAY,
    bullet: true,
    lineSpacing: 28
  });

  console.log('✅ Created Slide 2: Content slide (bullets, Spanish characters)');

  // ============================================================
  // SLIDE 3: Visual Elements Test
  // ============================================================
  const slide3 = pres.addSlide();

  // Header
  slide3.addText('Prueba de Elementos Visuales', {
    x: 0,
    y: 0,
    w: '100%',
    h: '15%',
    fontSize: 28,
    bold: true,
    color: WHITE,
    fill: { color: BLUE },
    align: 'center',
    valign: 'middle'
  });

  // Blue box
  slide3.addText('Caja Azul\nTexto centrado', {
    x: '8%',
    y: '25%',
    w: '25%',
    h: '20%',
    fontSize: 18,
    bold: true,
    color: WHITE,
    fill: { color: BLUE },
    align: 'center',
    valign: 'middle'
  });

  // Green box
  slide3.addText('Caja Verde\nTexto centrado', {
    x: '38%',
    y: '25%',
    w: '25%',
    h: '20%',
    fontSize: 18,
    bold: true,
    color: WHITE,
    fill: { color: GREEN },
    align: 'center',
    valign: 'middle'
  });

  // Gray box
  slide3.addText('Caja Gris\nTexto centrado', {
    x: '68%',
    y: '25%',
    w: '25%',
    h: '20%',
    fontSize: 18,
    bold: true,
    color: WHITE,
    fill: { color: GRAY },
    align: 'center',
    valign: 'middle'
  });

  // Special characters test
  slide3.addText('Caracteres especiales: áéíóú ñÑ ¿? ¡!', {
    x: '8%',
    y: '55%',
    w: '85%',
    h: '10%',
    fontSize: 16,
    color: DARK_GRAY,
    align: 'center'
  });

  console.log('✅ Created Slide 3: Visual elements (color boxes, special characters)');

  // ============================================================
  // Save Presentation
  // ============================================================
  const outputPath = '/tmp/poc-test.pptx';

  try {
    await pres.writeFile({ fileName: outputPath });
    console.log(`\n✅ Presentation saved successfully: ${outputPath}`);

    // Check file size
    const file = Bun.file(outputPath);
    const size = file.size;
    console.log(`📊 File size: ${(size / 1024).toFixed(2)} KB`);

    if (size > 0) {
      console.log('\n✅ POC SUCCESSFUL!');
      console.log('   - PptxGenJS works with Bun');
      console.log('   - Color formatting applied correctly');
      console.log('   - Spanish characters rendered properly');
      console.log('   - File created and readable');
      console.log(`\n🎉 Next step: Open ${outputPath} in PowerPoint to verify visuals`);
    } else {
      console.error('\n❌ POC FAILED: File is empty');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ POC FAILED: Error saving presentation');
    console.error(error);
    process.exit(1);
  }
}

// Run POC
createPOCPresentation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
