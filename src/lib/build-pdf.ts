import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage, type PDFFont } from 'pdf-lib';
import sharp from 'sharp';
import type { Part } from '@/lib/types';
import { BUILD_PDF_REQUIRED, type BuildPdfCategory } from '@/lib/build-pdf-categories';

export type BuildPdfPart = Pick<Part, 'name' | 'price' | 'specifications' | 'description'> & {
  category: BuildPdfCategory;
  imageBytes: Uint8Array;
};

const WIDTH = 595.28;
const HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const INK = rgb(0.09, 0.14, 0.21);
const MUTED = rgb(0.38, 0.44, 0.52);
const CYAN = rgb(0.02, 0.59, 0.69);

function safeText(value: string): string {
  return value.normalize('NFKD').replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
}

function wrapText(value: string, font: PDFFont, size: number, width: number): string[] {
  const result: string[] = [];
  for (const paragraph of safeText(value).split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const proposed = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(proposed, size) <= width) {
        line = proposed;
        continue;
      }
      if (line) result.push(line);
      line = '';
      for (const character of word) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) {
          result.push(line);
          line = '';
        }
        line += character;
      }
    }
    result.push(line);
  }
  return result;
}

function money(value: number): string {
  return `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function embedCover(pdf: PDFDocument, imageBytes: Uint8Array): Promise<PDFImage> {
  const png = await sharp(Buffer.from(imageBytes)).rotate().resize(480, 480, {
    fit: 'contain', background: '#ffffff', withoutEnlargement: true,
  }).png().toBuffer();
  return pdf.embedPng(png);
}

export async function createBuildPdf(parts: BuildPdfPart[], generatedAt = new Date()): Promise<Uint8Array> {
  const present = new Set(parts.map((part) => part.category));
  if (BUILD_PDF_REQUIRED.some((category) => !present.has(category))) {
    throw new Error('Select all eight core parts before downloading your build.');
  }

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const total = parts.reduce((sum, part) => sum + part.price, 0);
  pdf.setTitle('Buildbot AI - Your PC Build');
  pdf.setAuthor('Buildbot AI');
  pdf.setCreationDate(generatedAt);
  let page: PDFPage = pdf.addPage([WIDTH, HEIGHT]);
  let y = HEIGHT - 118;

  const newPage = (reuse = false) => {
    if (!reuse) page = pdf.addPage([WIDTH, HEIGHT]);
    page.drawRectangle({ x: 0, y: HEIGHT - 95, width: WIDTH, height: 95, color: INK });
    page.drawRectangle({ x: MARGIN, y: HEIGHT - 95, width: 55, height: 3, color: CYAN });
    page.drawText('BUILDBOT AI', { x: MARGIN, y: HEIGHT - 37, size: 11, font: bold, color: rgb(0.38, 0.88, 0.94) });
    page.drawText('YOUR PC BUILD', { x: MARGIN, y: HEIGHT - 69, size: 21, font: bold, color: rgb(1, 1, 1) });
    page.drawText(generatedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }), {
      x: WIDTH - 195, y: HEIGHT - 37, size: 9, font: regular, color: rgb(0.76, 0.83, 0.89),
    });
    page.drawText('TOTAL BUILD PRICE', {
      x: WIDTH - 195, y: HEIGHT - 56, size: 8, font: bold, color: rgb(0.76, 0.83, 0.89),
    });
    page.drawText(money(total), {
      x: WIDTH - 195, y: HEIGHT - 76, size: 15, font: bold, color: rgb(1, 1, 1),
    });
    y = HEIGHT - 118;
  };
  const ensure = (height: number) => { if (y - height < 65) newPage(); };
  const writeLines = (value: string, x: number, width: number, size: number, lineHeight: number, font = regular, color = INK) => {
    for (const line of wrapText(value, font, size, width)) {
      ensure(lineHeight);
      if (line) page.drawText(line, { x, y, size, font, color });
      y -= lineHeight;
    }
  };

  newPage(true);
  writeLines(`${parts.length} selected items  |  8 core categories complete`, MARGIN, CONTENT_WIDTH, 10, 19, regular, MUTED);
  y -= 9;

  for (const [index, part] of parts.entries()) {
    ensure(164);
    const top = y;
    page.drawRectangle({ x: MARGIN, y: top - 20, width: CONTENT_WIDTH, height: 20, color: rgb(0.92, 0.96, 0.97) });
    page.drawText(`${String(index + 1).padStart(2, '0')}  ${part.category.toUpperCase()}`, {
      x: MARGIN + 9, y: top - 14, size: 9, font: bold, color: CYAN,
    });
    y -= 33;
    const image = await embedCover(pdf, part.imageBytes);
    const box = 95;
    const scale = Math.min(box / image.width, box / image.height);
    page.drawRectangle({ x: MARGIN, y: y - box, width: box, height: box, borderColor: rgb(0.87, 0.9, 0.93), borderWidth: 1, color: rgb(1, 1, 1) });
    page.drawImage(image, {
      x: MARGIN + (box - image.width * scale) / 2,
      y: y - box + (box - image.height * scale) / 2,
      width: image.width * scale, height: image.height * scale,
    });
    const imageTop = y;
    const textX = MARGIN + box + 14;
    writeLines(part.name, textX, CONTENT_WIDTH - box - 14, 12, 15, bold);
    y -= 4;
    writeLines(money(part.price), textX, CONTENT_WIDTH - box - 14, 12, 16, bold, CYAN);
    y = Math.min(y, imageTop - box) - 14;
    const specifications = Object.entries(part.specifications || {}).filter(([key, value]) => key && value !== '' && value !== null && value !== undefined);
    if (specifications.length) {
      writeLines('SPECIFICATIONS', MARGIN, CONTENT_WIDTH, 8, 14, bold, MUTED);
      for (const [key, value] of specifications) {
        writeLines(`${key}: ${String(value)}`, MARGIN + 8, CONTENT_WIDTH - 16, 9, 13);
      }
    } else {
      writeLines(part.description?.trim() || 'No additional specifications listed.', MARGIN + 8, CONTENT_WIDTH - 16, 9, 13, regular, MUTED);
    }
    y -= 12;
    if (y > 65) {
      page.drawLine({ start: { x: MARGIN, y }, end: { x: WIDTH - MARGIN, y }, thickness: 0.7, color: rgb(0.86, 0.9, 0.93) });
    }
    y -= 19;
  }

  const pages = pdf.getPages();
  pages.forEach((current, index) => {
    current.drawText(`Buildbot AI  |  ${index + 1} / ${pages.length}`, {
      x: MARGIN, y: 31, size: 8, font: regular, color: MUTED,
    });
    current.drawText('Prices in Philippine pesos', {
      x: WIDTH - 169, y: 31, size: 8, font: regular, color: MUTED,
    });
  });
  return pdf.save();
}
