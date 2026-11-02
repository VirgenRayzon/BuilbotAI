import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodePDFRawStream,
  PDFArray,
  PDFDocument,
  PDFRawStream,
  StandardFonts,
} from 'pdf-lib';
import type { Order } from '@/lib/types';
import {
  createOrderReceiptPdf,
  getOrderReceiptFilename,
  getReceiptTableLayout,
  getOrderReceiptModel,
  wrapReceiptText,
} from '@/lib/order-receipt-pdf';

const order: Order = {
  id: 'order-firestore-1',
  orderNumber: 'BB-20261102-DGU1',
  userId: 'customer-1',
  userEmail: 'user@test.com',
  items: [
    {
      id: 'cpu-1',
      productId: 'CPU-9900X3D',
      name: 'AMD Ryzen 9 9900X3D Processor',
      category: 'CPU',
      price: 35940,
      quantity: 1,
      buildType: 'custom-build',
    },
    {
      id: 'gpu-1',
      productId: 'GPU-RTX5070TI',
      name: 'Asus ProArt GeForce RTX 5070 Ti OC 16GB',
      category: 'GPU',
      price: 64199.4,
      quantity: 1,
      buildType: 'custom-build',
    },
  ],
  subtotal: 100139.4,
  shippingFee: 550,
  protectionFee: 350,
  totalPrice: 101039.4,
  status: 'finished building',
  fulfillmentStage: 'delivered',
  paymentMethod: 'cod',
  paymentStatus: 'paid',
  paymentReference: 'COD-REF-20261102',
  shippingMethod: 'sameday_express',
  shippingAddress: {
    fullName: 'Rayzon Virgen',
    phone: '+63 917 882 4910',
    email: 'user@test.com',
    region: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Diliman',
    streetAddress: '189 BFD Compound East Avenue',
    postalCode: '1101',
  },
  createdAt: new Date('2026-11-02T01:19:00+08:00'),
  paidAt: new Date('2026-11-02T02:30:00+08:00'),
  updatedAt: new Date('2026-11-05T09:00:00+08:00'),
};

test('order receipt model contains authoritative customer, item, payment, and total details', () => {
  const model = getOrderReceiptModel(order);

  assert.equal(model.receiptNumber, 'BB-20261102-DGU1');
  assert.equal(model.customerName, 'Rayzon Virgen');
  assert.equal(model.items.length, 2);
  assert.equal(model.items[1].sku, 'GPU-RTX5070TI');
  assert.equal(model.items[1].lineTotal, 64199.4);
  assert.equal(model.paymentMethod, 'Cash on Delivery');
  assert.equal(model.paymentReference, 'COD-REF-20261102');
  assert.equal(model.total, 101039.4);
  assert.equal(model.issuedAt.toISOString(), '2026-11-01T18:30:00.000Z');
});

test('order receipt PDF is exactly one US Letter page', async () => {
  const bytes = await createOrderReceiptPdf(order);
  const pdf = await PDFDocument.load(bytes);

  assert.equal(pdf.getPageCount(), 1);
  const { width, height } = pdf.getPage(0).getSize();
  assert.equal(width, 612);
  assert.equal(height, 792);
  assert.equal(pdf.getTitle(), 'Netcodex Receipt BB-20261102-DGU1');

  const contents = pdf.getPage(0).node.Contents();
  assert.ok(contents instanceof PDFArray);
  const decoded = contents
    .asArray()
    .map((reference) => pdf.context.lookup(reference))
    .filter((stream): stream is PDFRawStream => stream instanceof PDFRawStream)
    .map((stream) => Buffer.from(decodePDFRawStream(stream).decode()).toString('latin1'))
    .join('\n');
  for (const expected of ['NETCODEX', 'TOTAL AMOUNT', 'AMD Ryzen 9 9900X3D']) {
    assert.match(decoded, new RegExp(Buffer.from(expected).toString('hex'), 'i'));
  }
});

test('order receipt filename is stable and filesystem-safe', () => {
  assert.equal(
    getOrderReceiptFilename({ ...order, orderNumber: 'BB/2026:1102 DGU1' }),
    'netcodex-receipt-BB-2026-1102-DGU1.pdf'
  );
});

test('long delivery addresses wrap without discarding their final locality', async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const address = '189 BFD Compound East Avenue, Diliman, Quezon City, Metro Manila, 1101';
  const lines = wrapReceiptText(address, font, 8, 180, 3);

  assert.ok(lines.length > 1);
  assert.equal(lines.join(' '), address);
});

test('dense item tables remain above the fixed totals section', () => {
  const layout = getReceiptTableLayout(40);
  assert.ok(layout.rowHeight > 0);
  assert.ok(layout.fontSize > 0);
  assert.ok(layout.lastRowBottom >= 335);
});
