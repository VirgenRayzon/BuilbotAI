import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFFont } from 'pdf-lib';
import sharp from 'sharp';
import type { Part } from '@/lib/types';
import { BUILD_PDF_REQUIRED, type BuildPdfCategory } from '@/lib/build-pdf-categories';

export type BuildPdfPart = Pick<Part, 'name' | 'price' | 'specifications' | 'description'> & {
  category: BuildPdfCategory;
  imageBytes: Uint8Array;
  wattage?: number;
};

// Standard North American Letter Paper Size in PostScript Points (72 points = 1 inch)
// 8.5 in x 11.0 in = 612 pt x 792 pt
const WIDTH = 612;
const HEIGHT = 792;
const MARGIN_X = 26;
const CONTENT_WIDTH = WIDTH - MARGIN_X * 2; // 560 pt

const INK = rgb(0.07, 0.10, 0.16); // Slate 950
const MUTED = rgb(0.40, 0.46, 0.54); // Slate 500
const LIGHT_BORDER = rgb(0.88, 0.91, 0.94); // Slate 200
const CYAN = rgb(0.02, 0.59, 0.69); // Buildbot Brand Cyan
const CYAN_LIGHT = rgb(0.38, 0.88, 0.94);

function safeText(value: string): string {
  return value
    .replace(/[•●]/g, '\u00b7')
    .replace(/[—–]/g, '-')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .normalize('NFKD')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, ' ');
}

function fitText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const safe = safeText(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;

  const ellipsis = '...';
  const ellipsisWidth = font.widthOfTextAtSize(ellipsis, size);
  if (ellipsisWidth >= maxWidth) return '';

  let low = 0;
  let high = safe.length;
  let best = '';

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = `${safe.slice(0, mid).trimEnd()}${ellipsis}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

function money(value: number): string {
  return `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function embedCover(pdf: PDFDocument, imageBytes: Uint8Array): Promise<PDFImage> {
  const png = await sharp(Buffer.from(imageBytes)).rotate().resize(180, 180, {
    fit: 'contain', background: '#ffffff', withoutEnlargement: true,
  }).png().toBuffer();
  return pdf.embedPng(png);
}

function cleanCpuCores(cores: string, threads: string): string {
  const cleanedCores = cores
    .replace(/\s*\(\s*(\d+)\s*P-cores?,\s*(\d+)\s*E-cores?\s*\)/i, ' ($1P+$2E)')
    .replace(/\s*cores?/i, '');
  if (threads) {
    const cleanedThreads = threads.replace(/\s*threads?/i, '');
    return `${cleanedCores} Cores / ${cleanedThreads} Threads`;
  }
  return `${cleanedCores} Cores`;
}

function cleanCpuBoost(boost: string, base: string): string {
  if (boost) {
    const cleaned = boost.replace(/\s*\(P-core\).*/i, ' GHz').replace(/\s*GHz\s*GHz/i, ' GHz').trim();
    return `Up to ${cleaned}`;
  }
  if (base) {
    const cleaned = base.replace(/\s*\(P-core\).*/i, ' GHz').replace(/\s*GHz\s*GHz/i, ' GHz').trim();
    return `Base: ${cleaned}`;
  }
  return '';
}

function getFormattedSpecs(part: BuildPdfPart): string {
  const specs = part.specifications || {};
  const get = (key: string): string => {
    const val = specs[key];
    if (val === undefined || val === null) return '';
    return String(val).trim();
  };

  const items: string[] = [];

  switch (part.category) {
    case 'CPU': {
      const cores = get('Cores');
      const threads = get('Threads');
      if (cores) items.push(cleanCpuCores(cores, threads));

      const boost = get('Boost Clock (GHz)');
      const base = get('Base Clock (GHz)');
      const clockStr = cleanCpuBoost(boost, base);
      if (clockStr) items.push(clockStr);

      const socket = get('Socket');
      if (socket) items.push(`Socket: ${socket}`);

      const tdp = get('TDP / Peak Power') || get('TDP');
      if (tdp) items.push(`TDP: ${tdp}`);

      const arch = get('Architecture');
      if (arch && items.length < 4) items.push(arch);
      break;
    }

    case 'GPU': {
      const chipset = get('Chipset');
      if (chipset) items.push(chipset);

      const vram = get('VRAM Capacity');
      const memType = get('Memory Type');
      if (vram) items.push(`${vram}${memType ? ` ${memType}` : ''}`);

      const tgp = get('TGP / Power Draw (W)') || get('TGP');
      if (tgp) items.push(`TGP: ${tgp}`);

      const length = get('Length (Depth) (mm)');
      if (length) items.push(`Length: ${length}`);

      const iface = get('Interface');
      if (iface && items.length < 4) items.push(iface);
      break;
    }

    case 'Motherboard': {
      const socket = get('Socket');
      if (socket) items.push(`Socket: ${socket}`);

      const chipset = get('Chipset');
      if (chipset) items.push(`Chipset: ${chipset}`);

      const ff = get('Form Factor');
      if (ff) items.push(ff.toUpperCase());

      const ram = get('RAM Type') || get('Memory Type');
      if (ram) items.push(ram);

      const nvme = get('NVMe Slots');
      if (nvme) items.push(`${nvme}x M.2 NVMe`);

      const conn = get('Connectivity');
      if (conn && items.length < 4) items.push(conn);
      break;
    }

    case 'RAM': {
      const cap = get('Capacity');
      if (cap) items.push(cap);

      const gen = get('Generation');
      const speed = get('Speed');
      if (gen || speed) items.push([gen, speed].filter(Boolean).join(' '));

      const cas = get('CAS Latency');
      if (cas) items.push(cas);

      const sticks = get('Stick Count');
      if (sticks) items.push(`${sticks} Stick${sticks === '1' ? '' : 's'}`);
      break;
    }

    case 'Storage': {
      const cap = get('Capacity');
      if (cap) items.push(cap);

      const type = get('Type') || get('Interface');
      if (type) items.push(type);

      const ff = get('Form Factor');
      if (ff) items.push(ff);

      const read = get('Read Speed');
      if (read) items.push(`Read: ${read}`);
      break;
    }

    case 'PSU': {
      const watt = get('Wattage (W)') || get('Wattage');
      if (watt) items.push(watt);

      const eff = get('Efficiency Rating');
      if (eff) items.push(eff);

      const mod = get('Modularity');
      if (mod) items.push(mod);

      const ff = get('Form Factor');
      if (ff) items.push(ff.toUpperCase());
      break;
    }

    case 'Cooler': {
      const type = get('Type');
      if (type) items.push(type);

      const height = get('Height') || get('Radiator Size');
      if (height) items.push(`Size: ${height}`);

      const sockets = get('Socket Support');
      if (sockets) items.push(`Sockets: ${sockets}`);

      const tdp = get('TDP Rating');
      if (tdp) items.push(`TDP: ${tdp}`);
      break;
    }

    case 'Case': {
      const type = get('Case Type') || get('Type');
      if (type) items.push(type.replace(/\b\w/g, (c) => c.toUpperCase()));

      const mobo = get('Mobo Support');
      if (mobo) items.push(`Mobo: ${mobo.toUpperCase()}`);

      const gpu = get('Max GPU Length');
      if (gpu) items.push(`Max GPU: ${gpu}`);

      const cooler = get('Max CPU Cooler Height');
      if (cooler) items.push(`Cooler: ${cooler}`);
      break;
    }

    case 'Monitor': {
      const size = get('Screen Size');
      if (size) items.push(size);
      const res = get('Resolution');
      if (res) items.push(res);
      const hz = get('Refresh Rate');
      if (hz) items.push(hz);
      const panel = get('Panel Type');
      if (panel) items.push(panel);
      break;
    }

    case 'Keyboard': {
      const type = get('Type');
      if (type) items.push(type);
      const sw = get('Switches');
      if (sw) items.push(sw);
      const layout = get('Layout');
      if (layout) items.push(layout);
      break;
    }

    case 'Mouse': {
      const sensor = get('Sensor');
      if (sensor) items.push(sensor);
      const dpi = get('DPI');
      if (dpi) items.push(`${dpi} DPI`);
      const conn = get('Connectivity');
      if (conn) items.push(conn);
      break;
    }

    case 'Headset': {
      const type = get('Type');
      if (type) items.push(type);
      const conn = get('Connectivity');
      if (conn) items.push(conn);
      const driver = get('Driver Size');
      if (driver) items.push(driver);
      break;
    }
  }

  // Fallback: If no curated specs matched, take the first 4 non-empty specs
  if (items.length === 0) {
    for (const [k, v] of Object.entries(specs)) {
      if (k && v !== '' && v !== null && v !== undefined) {
        items.push(`${k}: ${v}`);
        if (items.length >= 4) break;
      }
    }
  }

  if (items.length === 0 && part.description) {
    return part.description.trim().replace(/\s+/g, ' ');
  }

  return items.join(' \u00b7 ');
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
  const totalWattage = parts.reduce((sum, part) => sum + (part.wattage || 0), 0);

  pdf.setTitle('Netcodex - Your PC Build');
  pdf.setAuthor('Netcodex');
  pdf.setCreationDate(generatedAt);

  // Exactly ONE single page with Letter dimensions (612 x 792 pt)
  const page = pdf.addPage([WIDTH, HEIGHT]);

  // 1. Sleek Header Banner
  const HEADER_HEIGHT = 64;
  page.drawRectangle({
    x: 0,
    y: HEIGHT - HEADER_HEIGHT,
    width: WIDTH,
    height: HEADER_HEIGHT,
    color: INK,
  });

  // Cyan accent strip at the bottom of header
  page.drawRectangle({
    x: MARGIN_X,
    y: HEIGHT - HEADER_HEIGHT,
    width: 60,
    height: 3,
    color: CYAN,
  });

  // Left header brand & title
  page.drawText('NETCODEX \u00b7 POWERED BY BUILDBOT AI', {
    x: MARGIN_X,
    y: HEIGHT - 22,
    size: 8.5,
    font: bold,
    color: CYAN_LIGHT,
  });
  page.drawText('YOUR PC BUILD', {
    x: MARGIN_X,
    y: HEIGHT - 42,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  });

  const coreCount = BUILD_PDF_REQUIRED.filter((cat) => present.has(cat)).length;
  const headerSubtitle = `${parts.length} components  \u00b7  ${coreCount} core categories complete  \u00b7  Verified Specification Sheet`;
  page.drawText(headerSubtitle, {
    x: MARGIN_X,
    y: HEIGHT - 55,
    size: 7.5,
    font: regular,
    color: rgb(0.72, 0.79, 0.86),
  });

  // Right header: Date & Total
  const dateStr = generatedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const priceLabel = 'TOTAL BUILD PRICE';
  const priceValue = money(total);

  const priceValWidth = bold.widthOfTextAtSize(priceValue, 15);
  const priceLabelWidth = bold.widthOfTextAtSize(priceLabel, 7.5);
  const dateWidth = regular.widthOfTextAtSize(dateStr, 8);

  const rightX = WIDTH - MARGIN_X;

  page.drawText(dateStr, {
    x: rightX - dateWidth,
    y: HEIGHT - 20,
    size: 8,
    font: regular,
    color: rgb(0.72, 0.79, 0.86),
  });
  page.drawText(priceLabel, {
    x: rightX - priceLabelWidth,
    y: HEIGHT - 33,
    size: 7.5,
    font: bold,
    color: rgb(0.72, 0.79, 0.86),
  });
  page.drawText(priceValue, {
    x: rightX - priceValWidth,
    y: HEIGHT - 52,
    size: 15,
    font: bold,
    color: rgb(1, 1, 1),
  });

  // 2. Info Bar below Header
  const INFO_BAR_Y = HEIGHT - HEADER_HEIGHT - 16;
  const powerNote = totalWattage > 0 ? `  \u00b7  Est. Power Load: ${totalWattage}W` : '';
  page.drawText(`${parts.length} selected items  \u00b7  8 core categories complete${powerNote}`, {
    x: MARGIN_X,
    y: INFO_BAR_Y,
    size: 8,
    font: bold,
    color: MUTED,
  });

  const currencyNote = 'Prices in Philippine pesos (PHP)';
  const currWidth = regular.widthOfTextAtSize(currencyNote, 8);
  page.drawText(currencyNote, {
    x: rightX - currWidth,
    y: INFO_BAR_Y,
    size: 8,
    font: regular,
    color: MUTED,
  });

  // 3. Dynamic Single-Page Parts Layout
  const listTop = INFO_BAR_Y - 10;
  const listBottom = 42; // Above footer divider
  const usableHeight = listTop - listBottom;

  const count = parts.length;
  const gap = count <= 9 ? 6 : (count <= 11 ? 5 : 4);
  const totalGaps = (count - 1) * gap;
  const rawRowHeight = (usableHeight - totalGaps) / count;
  const rowHeight = Math.min(count <= 8 ? 68 : (count <= 9 ? 62 : 56), Math.max(38, Math.floor(rawRowHeight)));

  const listActualHeight = count * rowHeight + totalGaps;
  const extraTopPadding = Math.max(0, Math.floor((usableHeight - listActualHeight) / 2));
  let currentY = listTop - extraTopPadding;

  const priceColWidth = 86;
  const rightEdge = MARGIN_X + CONTENT_WIDTH - 10;

  for (const [index, part] of parts.entries()) {
    const rowBottom = currentY - rowHeight;

    // Card background with subtle alternating tint
    page.drawRectangle({
      x: MARGIN_X,
      y: rowBottom,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: index % 2 === 0 ? rgb(0.985, 0.99, 1.0) : rgb(1, 1, 1),
      borderColor: LIGHT_BORDER,
      borderWidth: 0.75,
    });

    // Left cyan accent strip
    page.drawRectangle({
      x: MARGIN_X,
      y: rowBottom,
      width: 2.5,
      height: rowHeight,
      color: CYAN,
    });

    // Thumbnail image box
    const boxSize = Math.max(28, Math.min(42, rowHeight - 14));
    const imgX = MARGIN_X + 8;
    const imgY = rowBottom + (rowHeight - boxSize) / 2;

    page.drawRectangle({
      x: imgX,
      y: imgY,
      width: boxSize,
      height: boxSize,
      color: rgb(1, 1, 1),
      borderColor: LIGHT_BORDER,
      borderWidth: 0.6,
    });

    if (part.imageBytes && part.imageBytes.length > 0) {
      try {
        const image = await embedCover(pdf, part.imageBytes);
        const scale = Math.min((boxSize - 4) / image.width, (boxSize - 4) / image.height);
        const drawW = image.width * scale;
        const drawH = image.height * scale;
        page.drawImage(image, {
          x: imgX + (boxSize - drawW) / 2,
          y: imgY + (boxSize - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      } catch {
        // Fallback gracefully if image parsing encounters unexpected bytes
      }
    }

    const textX = imgX + boxSize + 10;
    const maxTextWidth = (rightEdge - priceColWidth) - textX;

    // 1. Category Tag + Index
    const catNum = String(index + 1).padStart(2, '0');
    const catText = `${catNum}  ${part.category.toUpperCase()}`;
    const catY = rowHeight >= 55 ? rowBottom + rowHeight - 14 : rowBottom + rowHeight - 12;

    page.drawText(catText, {
      x: textX,
      y: catY,
      size: rowHeight >= 55 ? 7 : 6.5,
      font: bold,
      color: CYAN,
    });

    // 2. Part Name with adaptive font sizing
    const nameY = rowHeight >= 55 ? catY - 14 : catY - 12;
    let nameSize = rowHeight >= 55 ? 9.5 : (rowHeight >= 48 ? 9 : 8);
    const safeName = safeText(part.name);
    if (bold.widthOfTextAtSize(safeName, nameSize) > maxTextWidth && nameSize > 8) {
      nameSize = bold.widthOfTextAtSize(safeName, 8.5) <= maxTextWidth ? 8.5 : 8;
    }
    const fittedName = fitText(part.name, bold, nameSize, maxTextWidth);

    page.drawText(fittedName, {
      x: textX,
      y: nameY,
      size: nameSize,
      font: bold,
      color: INK,
    });

    // 3. Technical Specifications
    const specsText = getFormattedSpecs(part);
    const specSize = rowHeight >= 55 ? 7.5 : (rowHeight >= 48 ? 7 : 6.5);
    const fittedSpecs = fitText(specsText, regular, specSize, maxTextWidth);
    const specsY = rowHeight >= 55 ? nameY - 13 : nameY - 11;

    page.drawText(fittedSpecs, {
      x: textX,
      y: specsY,
      size: specSize,
      font: regular,
      color: MUTED,
    });

    // 4. Price (Right Column)
    const priceText = money(part.price);
    const priceSize = rowHeight >= 55 ? 10.5 : (rowHeight >= 48 ? 10 : 9);
    const priceWidth = bold.widthOfTextAtSize(priceText, priceSize);
    const priceX = rightEdge - priceWidth;
    const priceY = rowBottom + (rowHeight - priceSize) / 2 + 1;

    page.drawText(priceText, {
      x: priceX,
      y: priceY,
      size: priceSize,
      font: bold,
      color: INK,
    });

    currentY -= (rowHeight + gap);
  }

  // 4. Footer
  page.drawLine({
    start: { x: MARGIN_X, y: 30 },
    end: { x: WIDTH - MARGIN_X, y: 30 },
    thickness: 0.6,
    color: LIGHT_BORDER,
  });

  page.drawText('Netcodex  \u00b7  Official PC Build Specification  \u00b7  Validated by Buildbot AI', {
    x: MARGIN_X,
    y: 18,
    size: 7,
    font: regular,
    color: MUTED,
  });

  const pageText = 'Page 1 of 1';
  const pageTextWidth = regular.widthOfTextAtSize(pageText, 7);
  page.drawText(pageText, {
    x: WIDTH - MARGIN_X - pageTextWidth,
    y: 18,
    size: 7,
    font: regular,
    color: MUTED,
  });

  return pdf.save();
}
