/**
 * PowerPoint Slide Primitives for Bun + Officegen
 *
 * Provides formatting primitives for creating PowerPoint presentations
 * Compatible with the Python version's API but implemented using officegen
 *
 * IMPORTANT: This replaces the Python create_presentation.py
 * Library: officegen (PptxGenJS is incompatible with Bun)
 */

import type officegen from 'officegen';

// Type definitions for slide objects (officegen doesn't export these)
type Slide = any; // officegen slide type
type TextOptions = any; // officegen text options type

// ============================================================
// Color Constants (matching Python implementation exactly)
// ============================================================
export const BLUE = '1E3A8A';      // #1E3A8A - rgb(30, 58, 138)
export const GREEN = '10B981';     // #10B981 - rgb(16, 185, 129)
export const GRAY = '6B7280';      // #6B7280 - rgb(107, 114, 128)
export const WHITE = 'FFFFFF';     // #FFFFFF - rgb(255, 255, 255)
export const DARK_GRAY = '374151'; // #374151 - rgb(55, 65, 81)

// ============================================================
// Coordinate Conversion Utilities
// ============================================================
// PowerPoint slide dimensions (standard widescreen)
const SLIDE_WIDTH = 1000;   // Points (not pixels) - officegen uses points
const SLIDE_HEIGHT = 720;   // Points

/**
 * Convert percentage to points for X coordinate
 */
function pctToX(percent: number): number {
  return Math.round((percent / 100) * SLIDE_WIDTH);
}

/**
 * Convert percentage to points for Y coordinate
 */
function pctToY(percent: number): number {
  return Math.round((percent / 100) * SLIDE_HEIGHT);
}

/**
 * Convert inches to points (officegen uses points, Python uses inches)
 * 1 inch = 72 points
 */
function inchesToPoints(inches: number): number {
  return Math.round(inches * 72);
}

// ============================================================
// Slide Primitives
// ============================================================

/**
 * Add a title slide with blue background
 *
 * Matches Python: add_title_slide(prs, title, subtitle, version)
 *
 * @param pptx - The presentation object
 * @param title - Main title text
 * @param subtitle - Subtitle text (default: "")
 * @param version - Version string (default: "1.0")
 */
export function addTitleSlide(
  pptx: any,
  title: string,
  subtitle: string = "",
  version: string = "1.0"
): Slide {
  const slide = pptx.makeNewSlide();

  // Blue background (matching Python)
  slide.back = BLUE;

  // Title - centered, white, large (35% from top)
  slide.addText(title, {
    y: pctToY(35),
    x: 'c',  // Center horizontally
    cx: '80%',
    font_size: 44,
    bold: true,
    color: WHITE,
    align: 'center'
  });

  // Subtitle - centered, white, medium (52% from top)
  if (subtitle) {
    slide.addText(subtitle, {
      y: pctToY(52),
      x: 'c',
      cx: '80%',
      font_size: 24,
      color: WHITE,
      align: 'center'
    });
  }

  // Version badge - bottom right (90% from top, 85% from left)
  slide.addText(version, {
    y: pctToY(90),
    x: pctToX(85),
    font_size: 12,
    color: WHITE,
    align: 'right'
  });

  return slide;
}

/**
 * Add a content slide with optional header
 *
 * Matches Python: add_content_slide(prs, title, subtitle=None)
 *
 * @param pptx - The presentation object
 * @param title - Slide title (appears in blue header)
 * @param subtitle - Optional subtitle (appears below header in gray italic)
 * @returns The slide object for further customization
 */
export function addContentSlide(
  pptx: any,
  title: string,
  subtitle?: string
): Slide {
  const slide = pptx.makeNewSlide();

  // Header box (blue background, white text, 15% height)
  slide.addText(title, {
    y: 0,
    x: 0,
    cx: '100%',
    cy: pctToY(15),
    font_size: 28,
    bold: true,
    color: WHITE,
    fill: BLUE,
    align: 'center',
    valign: 'm'  // middle vertical alignment
  });

  // Optional subtitle (gray italic text, 18% from top)
  if (subtitle) {
    slide.addText(subtitle, {
      y: pctToY(18),
      x: pctToX(8),
      cx: '85%',
      font_size: 18,
      color: GRAY,
      italic: true
    });
  }

  return slide;
}

/**
 * Add bullet text to a slide
 *
 * Matches Python: add_bullet_text(slide, left, top, width, height, text, font_size=18, color=DARK_GRAY, bold=False)
 *
 * Note: Python uses inches, this implementation converts to points
 *
 * @param slide - The slide object
 * @param left - Left position in inches (converted to points)
 * @param top - Top position in inches (converted to points)
 * @param width - Width in inches (converted to points)
 * @param height - Height in inches (converted to points)
 * @param text - Text content (string or array of strings for bullets)
 * @param fontSize - Font size (default: 18)
 * @param color - Text color hex (default: DARK_GRAY)
 * @param bold - Bold text (default: false)
 */
export function addBulletText(
  slide: Slide,
  left: number,
  top: number,
  width: number,
  height: number,
  text: string | string[],
  fontSize: number = 18,
  color: string = DARK_GRAY,
  bold: boolean = false
): void {
  // Convert inches to points
  const x = inchesToPoints(left);
  const y = inchesToPoints(top);
  const cx = inchesToPoints(width);
  const cy = inchesToPoints(height);

  // Convert text to bullet format if array
  let bulletText: any;
  if (Array.isArray(text)) {
    // Array of strings → convert to bullet points
    bulletText = text.map(item => ({
      text: item,
      options: { bullet: true, color: color }
    }));
  } else {
    // Single string → just text
    bulletText = text;
  }

  slide.addText(bulletText, {
    y: y,
    x: x,
    cx: cx,
    cy: cy,
    font_size: fontSize,
    color: color,
    bold: bold,
    line_spacing: 28,
    ...(Array.isArray(text) ? {} : {})  // bullets are defined per-item in array
  });
}

/**
 * Add a colored box with centered text
 *
 * Matches Python: add_box(slide, left, top, width, height, text, bg_color=BLUE, font_size=24, text_color=WHITE)
 *
 * @param slide - The slide object
 * @param left - Left position in inches
 * @param top - Top position in inches
 * @param width - Width in inches
 * @param height - Height in inches
 * @param text - Text content
 * @param bgColor - Background color hex (default: BLUE)
 * @param fontSize - Font size (default: 24)
 * @param textColor - Text color hex (default: WHITE)
 */
export function addBox(
  slide: Slide,
  left: number,
  top: number,
  width: number,
  height: number,
  text: string,
  bgColor: string = BLUE,
  fontSize: number = 24,
  textColor: string = WHITE
): void {
  // Convert inches to points
  const x = inchesToPoints(left);
  const y = inchesToPoints(top);
  const cx = inchesToPoints(width);
  const cy = inchesToPoints(height);

  slide.addText(text, {
    y: y,
    x: x,
    cx: cx,
    cy: cy,
    font_size: fontSize,
    bold: true,
    color: textColor,
    fill: bgColor,
    align: 'center',
    valign: 'm'  // middle vertical alignment
  });
}

/**
 * Add simple text to a slide
 *
 * Helper function for adding non-bullet, non-box text
 *
 * @param slide - The slide object
 * @param left - Left position in inches
 * @param top - Top position in inches
 * @param width - Width in inches
 * @param height - Height in inches
 * @param text - Text content
 * @param fontSize - Font size
 * @param color - Text color hex
 * @param options - Additional options (bold, italic, align, etc.)
 */
export function addText(
  slide: Slide,
  left: number,
  top: number,
  width: number,
  height: number,
  text: string,
  fontSize: number = 18,
  color: string = DARK_GRAY,
  options: {
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    valign?: 't' | 'm' | 'b';
  } = {}
): void {
  const x = inchesToPoints(left);
  const y = inchesToPoints(top);
  const cx = inchesToPoints(width);
  const cy = inchesToPoints(height);

  slide.addText(text, {
    y: y,
    x: x,
    cx: cx,
    cy: cy,
    font_size: fontSize,
    color: color,
    ...options
  });
}

// ============================================================
// Export Type for External Use
// ============================================================
export interface SlideOptions {
  title?: string;
  subtitle?: string;
  version?: string;
}

/**
 * Convenience function to create a presentation object
 * (This is a passthrough since officegen is created externally)
 */
export function createPresentation(options: {
  title?: string;
  author?: string;
  company?: string;
  subject?: string;
} = {}): any {
  // This is just a type helper - actual creation happens in generator
  // Return type matches officegen presentation object
  return null;
}
