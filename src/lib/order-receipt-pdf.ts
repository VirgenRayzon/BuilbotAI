import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import type { Order, PaymentMethod, ShippingMethod } from '@/lib/types';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.07, 0.10, 0.16);
const MUTED = rgb(0.36, 0.42, 0.50);
const BORDER = rgb(0.82, 0.86, 0.90);
const CYAN = rgb(0.02, 0.59, 0.69);
const PALE_CYAN = rgb(0.91, 0.98, 0.99);

export interface OrderReceiptModel {
  receiptNumber: string;
  issuedAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  shippingMethod: string;
  paymentMethod: string;
  paymentReference: string;
  items: Array<{
    sku: string;
    description: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shippingFee: number;
  protectionFee: number;
  discount: number;
  total: number;
}

function toDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    const parsed = (value as { toDate?: () => Date }).toDate?.();
    if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function paymentMethodLabel(method?: PaymentMethod): string {
  switch (method) {
    case 'cod':
      return 'Cash on Delivery';
    case 'gcash_simulated':
      return 'GCash';
    case 'paymongo_simulated':
      return 'PayMongo';
    case 'card_simulated':
      return 'Card';
    default:
      return 'Not specified';
  }
}

function shippingMethodLabel(method?: ShippingMethod): string {
  switch (method) {
    case 'sameday_express':
      return 'Metro Manila Same-Day Express';
    case 'standard_courier':
      return 'Standard Courier';
    case 'store_pickup':
      return 'Store Pickup';
    default:
      return 'Not specified';
  }
}

function cleanText(value: string): string {
  return value
    .replace(/[—–]/g, '-')
    .replace(/[•●]/g, '-')
    .normalize('NFKD')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fitText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const safe = cleanText(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  const suffix = '...';
  let low = 0;
  let high = safe.length;
  let best = suffix;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${safe.slice(0, middle).trimEnd()}${suffix}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return best;
}

export function wrapReceiptText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  maxLines = Number.POSITIVE_INFINITY
): string[] {
  const words = cleanText(text).split(' ').filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  if (lines.length <= maxLines) return lines;
  return [
    ...lines.slice(0, Math.max(0, maxLines - 1)),
    lines.slice(Math.max(0, maxLines - 1)).join(' '),
  ];
}

export function getReceiptTableLayout(itemCount: number) {
  const tableTop = 566;
  const tableBottom = 335;
  const count = Math.max(1, itemCount);
  const rowHeight = Math.min(22, (tableTop - tableBottom) / count);
  const fontSize = Math.min(8, Math.max(2, rowHeight * 0.42));
  return {
    tableTop,
    tableBottom,
    rowHeight,
    fontSize,
    lastRowBottom: tableTop - rowHeight * count,
  };
}

function money(value: number): string {
  return `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function drawRight(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = INK
) {
  page.drawText(text, {
    x: x - font.widthOfTextAtSize(text, size),
    y,
    font,
    size,
    color,
  });
}

function drawRule(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.7,
    color: BORDER,
  });
}

export function getOrderReceiptModel(order: Order): OrderReceiptModel {
  const items = order.items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.price) || 0;
    return {
      sku: item.productId || item.id,
      description: item.name,
      unitPrice,
      quantity,
      lineTotal: Number(item.lineTotal) || unitPrice * quantity,
    };
  });
  const itemSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const address = order.shippingAddress;
  const deliveryAddress = address
    ? [
        address.streetAddress,
        address.barangay,
        address.city,
        address.region,
        address.postalCode,
      ]
        .filter(Boolean)
        .join(', ')
    : 'Not provided';

  return {
    receiptNumber: order.orderNumber || order.id,
    issuedAt: toDate(order.paidAt || order.createdAt),
    customerName: address?.fullName || order.userEmail || 'Customer',
    customerEmail: address?.email || order.userEmail || 'Not provided',
    customerPhone: address?.phone || 'Not provided',
    deliveryAddress,
    shippingMethod: shippingMethodLabel(order.shippingMethod),
    paymentMethod: paymentMethodLabel(order.paymentMethod),
    paymentReference: order.paymentReference || 'Not provided',
    items,
    subtotal: Number(order.subtotal) || itemSubtotal,
    shippingFee: Number(order.shippingFee) || 0,
    protectionFee: Number(order.protectionFee) || 0,
    discount: Number(order.discountAmount) || 0,
    total: Number(order.totalPrice) || 0,
  };
}

export function getOrderReceiptFilename(
  order: Pick<Order, 'id' | 'orderNumber'>
): string {
  const identifier = cleanText(order.orderNumber || order.id)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `netcodex-receipt-${identifier || 'order'}.pdf`;
}

export async function createOrderReceiptPdf(order: Order): Promise<Uint8Array> {
  const model = getOrderReceiptModel(order);
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Netcodex Receipt ${model.receiptNumber}`);
  pdf.setAuthor('Netcodex Computer Center');
  pdf.setSubject('Customer sales and warranty receipt');
  pdf.setCreator('Netcodex');

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  page.drawText('NETCODEX', { x: MARGIN, y: 744, font: bold, size: 24, color: CYAN });
  page.drawText('COMPUTER CENTER', { x: MARGIN + 1, y: 730, font: bold, size: 8, color: INK });
  page.drawText('35G Liberty Avenue, corner 9th Ave, Socorro, Cubao', {
    x: MARGIN,
    y: 714,
    font: regular,
    size: 7.5,
    color: MUTED,
  });
  page.drawText('Quezon City 1109, Metro Manila | netcodex.ph', {
    x: MARGIN,
    y: 703,
    font: regular,
    size: 7.5,
    color: MUTED,
  });

  page.drawText('SALES & WARRANTY RECEIPT', {
    x: 358,
    y: 744,
    font: bold,
    size: 11,
    color: INK,
  });
  drawRight(page, `Receipt: ${model.receiptNumber}`, PAGE_WIDTH - MARGIN, 727, mono, 7.5);
  drawRight(
    page,
    model.issuedAt.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    }),
    PAGE_WIDTH - MARGIN,
    714,
    regular,
    7.5,
    MUTED
  );
  drawRule(page, 690);

  const detailSize = 8;
  page.drawText('CUSTOMER', { x: MARGIN, y: 672, font: bold, size: 7, color: MUTED });
  page.drawText(fitText(model.customerName, regular, detailSize, 220), {
    x: MARGIN,
    y: 658,
    font: regular,
    size: detailSize,
    color: INK,
  });
  page.drawText(fitText(model.customerEmail, regular, detailSize, 220), {
    x: MARGIN,
    y: 646,
    font: regular,
    size: detailSize,
    color: INK,
  });
  page.drawText(fitText(model.customerPhone, regular, detailSize, 220), {
    x: MARGIN,
    y: 634,
    font: regular,
    size: detailSize,
    color: INK,
  });

  page.drawText('DELIVERY & PAYMENT', { x: 330, y: 672, font: bold, size: 7, color: MUTED });
  const addressLines = wrapReceiptText(model.deliveryAddress, regular, detailSize, 246, 3);
  addressLines.forEach((line, index) => {
    page.drawText(line, {
      x: 330,
      y: 658 - index * 12,
      font: regular,
      size: detailSize,
      color: INK,
    });
  });
  page.drawText(fitText(model.shippingMethod, regular, detailSize, 246), {
    x: 330,
    y: 620,
    font: regular,
    size: detailSize,
    color: INK,
  });
  page.drawText(
    fitText(`${model.paymentMethod} | Ref: ${model.paymentReference}`, regular, detailSize, 246),
    { x: 330, y: 608, font: regular, size: detailSize, color: INK }
  );
  drawRule(page, 594);

  page.drawRectangle({ x: MARGIN, y: 569, width: CONTENT_WIDTH, height: 20, color: PALE_CYAN });
  page.drawText('SKU', { x: MARGIN + 5, y: 576, font: bold, size: 7, color: INK });
  page.drawText('PRODUCT DESCRIPTION', { x: 126, y: 576, font: bold, size: 7, color: INK });
  drawRight(page, 'PRICE', 446, 576, bold, 7);
  drawRight(page, 'QTY', 484, 576, bold, 7);
  drawRight(page, 'TOTAL', PAGE_WIDTH - MARGIN - 4, 576, bold, 7);

  const { tableTop, rowHeight, fontSize: rowFontSize } = getReceiptTableLayout(model.items.length);
  let rowY = tableTop - rowHeight + Math.max(2, rowHeight * 0.35);

  for (const item of model.items) {
    page.drawText(fitText(item.sku, mono, rowFontSize, 82), {
      x: MARGIN + 5,
      y: rowY,
      font: mono,
      size: rowFontSize,
      color: MUTED,
    });
    page.drawText(fitText(item.description, regular, rowFontSize, 238), {
      x: 126,
      y: rowY,
      font: regular,
      size: rowFontSize,
      color: INK,
    });
    drawRight(page, money(item.unitPrice), 446, rowY, regular, rowFontSize);
    drawRight(page, String(item.quantity), 484, rowY, regular, rowFontSize);
    drawRight(page, money(item.lineTotal), PAGE_WIDTH - MARGIN - 4, rowY, regular, rowFontSize);
    page.drawLine({
      start: { x: MARGIN, y: rowY - Math.max(2, rowHeight * 0.3) },
      end: { x: PAGE_WIDTH - MARGIN, y: rowY - Math.max(2, rowHeight * 0.3) },
      thickness: 0.35,
      color: BORDER,
    });
    rowY -= rowHeight;
  }

  drawRule(page, 325);
  const summaryRows: Array<[string, number, boolean?]> = [
    ['Subtotal', model.subtotal],
    ['Shipping fee', model.shippingFee],
    ['Crate protection', model.protectionFee],
    ['Discount', model.discount > 0 ? -model.discount : 0],
    ['TOTAL AMOUNT', model.total, true],
  ];
  let summaryY = 306;
  for (const [label, value, strong] of summaryRows) {
    page.drawText(label, {
      x: 385,
      y: summaryY,
      font: strong ? bold : regular,
      size: strong ? 9 : 7.5,
      color: strong ? INK : MUTED,
    });
    drawRight(page, money(value), PAGE_WIDTH - MARGIN, summaryY, strong ? bold : regular, strong ? 10 : 7.5, strong ? CYAN : INK);
    summaryY -= strong ? 17 : 13;
  }

  page.drawText(`Items sold: ${model.items.reduce((sum, item) => sum + item.quantity, 0)}`, {
    x: MARGIN,
    y: 306,
    font: regular,
    size: 7.5,
    color: MUTED,
  });
  page.drawText(`Payment: ${model.paymentMethod}`, { x: MARGIN, y: 293, font: regular, size: 7.5, color: INK });
  page.drawText(`Reference: ${model.paymentReference}`, { x: MARGIN, y: 280, font: mono, size: 7, color: INK });

  drawRule(page, 238);
  page.drawText('WARRANTY & AFTER-SALES SUPPORT', {
    x: MARGIN,
    y: 220,
    font: bold,
    size: 8.5,
    color: INK,
  });
  const warrantyLines = [
    'All items are authentic and include their applicable manufacturer warranty. Keep this receipt and the original packaging.',
    'Confirmed defects reported within 7 days of receipt are covered by the Netcodex DOA replacement policy, subject to technical inspection.',
    'Change-of-mind and compatibility returns are not accepted. Warranty claims remain subject to manufacturer and store guidelines.',
    'Support is available daily, 10:00 AM-7:00 PM (PH time), through the official channels listed at netcodex.ph.',
  ];
  let warrantyY = 203;
  for (const line of warrantyLines) {
    page.drawText(fitText(line, regular, 6.8, CONTENT_WIDTH), {
      x: MARGIN,
      y: warrantyY,
      font: regular,
      size: 6.8,
      color: MUTED,
    });
    warrantyY -= 13;
  }

  page.drawRectangle({ x: MARGIN, y: 78, width: CONTENT_WIDTH, height: 46, color: PALE_CYAN });
  page.drawText('Thank you for choosing Netcodex Computer Center.', {
    x: MARGIN + 12,
    y: 103,
    font: bold,
    size: 9,
    color: INK,
  });
  page.drawText('This digitally generated receipt is your proof of purchase. No signature is required.', {
    x: MARGIN + 12,
    y: 89,
    font: regular,
    size: 7,
    color: MUTED,
  });
  page.drawText('NETCODEX COMPUTER CENTER | netcodex.ph', {
    x: MARGIN,
    y: 42,
    font: bold,
    size: 7,
    color: CYAN,
  });
  drawRight(page, `Receipt ${model.receiptNumber} | Page 1 of 1`, PAGE_WIDTH - MARGIN, 42, mono, 6.5, MUTED);

  return pdf.save();
}
