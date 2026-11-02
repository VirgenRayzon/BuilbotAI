import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';
import {
    buildSalesAnalyticsWorkbook,
    SALES_WORKBOOK_SHEET_STYLES,
} from '../src/lib/export-excel';
import { getPopularityCategories } from '../src/lib/popularity';
import { buildStyledWorkbook } from '../src/lib/styled-excel';
import type { Order, Part } from '../src/lib/types';

function makePart(index: number, category: Part['category'] = 'CPU'): Part {
    return {
        id: `${category}-${index}`,
        name: `${category} ${index}`,
        category,
        brand: 'Test brand',
        price: 1000 + index,
        popularity: index,
        stock: index,
        imageUrl: '',
        specifications: {},
    };
}

test('popularity view and Excel sheet include the top 10 per category', () => {
    const parts = [
        ...Array.from({ length: 12 }, (_, index) => makePart(index + 1)),
        makePart(1, 'GPU'),
    ];
    const categories = getPopularityCategories(parts);
    expect(
        categories
            .find((group) => group.category === 'CPU')
            ?.parts.map((part) => part.popularity)
    ).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);

    const workbook = buildSalesAnalyticsWorkbook({
        orders: [],
        parts,
        prebuilts: [],
        revenueData: [{ name: 'Oct 14', revenue: 1234.5 }],
        timeRange: 'week',
    });
    const popularityRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        workbook.Sheets['Popularity Matrix']
    );
    expect(popularityRows).toHaveLength(11);
    expect(
        popularityRows
            .filter((row) => row.Category === 'CPU')
            .map((row) => row['Component Name'])
    ).toEqual([
        'CPU 12',
        'CPU 11',
        'CPU 10',
        'CPU 9',
        'CPU 8',
        'CPU 7',
        'CPU 6',
        'CPU 5',
        'CPU 4',
        'CPU 3',
    ]);
    expect(popularityRows[0]['Relative Category Demand']).toBe(1);

    const bytes = buildStyledWorkbook(workbook, SALES_WORKBOOK_SHEET_STYLES);
    const reopened = XLSX.read(bytes, { type: 'array' });
    expect(XLSX.utils.sheet_to_json(reopened.Sheets['Popularity Matrix'])).toHaveLength(11);

    const archive = XLSX.CFB.read(bytes, { type: 'array' });
    const styleEntry = XLSX.CFB.find(archive, 'Root Entry/xl/styles.xml');
    const sheetEntry = XLSX.CFB.find(archive, 'Root Entry/xl/worksheets/sheet3.xml');
    const styles = new TextDecoder().decode(styleEntry.content);
    const sheet = new TextDecoder().decode(sheetEntry.content);
    expect(styles).toContain('FF102A43');
    expect(styles).toContain('₱');
    expect(sheet).toContain('state="frozen"');
    expect(sheet).toMatch(/<c r="E2"[^>]*s="4"/);
    expect(sheet).toMatch(/<c r="G2"[^>]*s="8"/);
});

test('sales workbook distinguishes placed value, collected payments, refunds issued, and net sales', () => {
    const orders: Order[] = [
        {
            id: 'ord-unpaid-cod',
            orderNumber: 'ORD-2026-0001',
            userId: 'user-1',
            userEmail: 'cod@test.com',
            items: [{ id: 'cpu-1', name: 'Ryzen 7 7800X3D', category: 'CPU', price: 24000 }],
            totalPrice: 24000,
            status: 'pending',
            fulfillmentStage: 'order_placed',
            paymentMethod: 'cod',
            paymentStatus: 'unpaid',
            createdAt: new Date('2026-10-20T10:00:00Z'),
        },
        {
            id: 'ord-paid-partial-refund',
            orderNumber: 'ORD-2026-0002',
            userId: 'user-2',
            userEmail: 'gcash@test.com',
            items: [{ id: 'gpu-1', name: 'RTX 4070 Super', category: 'GPU', price: 40000 }],
            totalPrice: 40000,
            status: 'finished building',
            fulfillmentStage: 'delivered',
            paymentMethod: 'gcash_simulated',
            paymentStatus: 'paid',
            refundStatus: 'partial',
            refundedAmount: 5000,
            refunds: [
                {
                    id: 'rf-1',
                    amount: 5000,
                    method: 'manual',
                    destination: 'gcash',
                    reason: 'Promo price adjustment',
                    reference: 'GCASH-REF-100',
                    actorId: 'mgr-1',
                    actorName: 'Store Manager',
                    actorRole: 'Manager',
                    status: 'succeeded',
                    createdAt: new Date('2026-10-21T10:00:00Z'),
                },
            ],
            createdAt: new Date('2026-10-20T12:00:00Z'),
        },
        {
            id: 'ord-cancelled-refunded',
            orderNumber: 'ORD-2026-0003',
            userId: 'user-3',
            userEmail: 'paymongo@test.com',
            items: [{ id: 'ram-1', name: '32GB DDR5', category: 'RAM', price: 8000 }],
            totalPrice: 8000,
            status: 'cancelled',
            paymentMethod: 'paymongo_simulated',
            paymentStatus: 'paid',
            refundStatus: 'refunded',
            refundedAmount: 8000,
            stockState: 'restored',
            refunds: [
                {
                    id: 'rf-2',
                    amount: 8000,
                    method: 'paymongo',
                    destination: 'original_payment_method',
                    reason: 'Customer cancelled before assembly',
                    reference: 'rfnd_pm_999',
                    actorId: 'mgr-1',
                    actorName: 'Store Manager',
                    actorRole: 'Manager',
                    status: 'succeeded',
                    createdAt: new Date('2026-10-22T10:00:00Z'),
                },
            ],
            createdAt: new Date('2026-10-20T14:00:00Z'),
        },
    ];

    const workbook = buildSalesAnalyticsWorkbook({
        orders,
        parts: [],
        prebuilts: [],
        revenueData: [{ name: 'Oct 20', revenue: 35000 }],
        timeRange: 'week',
    });

    const summaryRows = XLSX.utils.sheet_to_json<{ Metric: string; Value: string | number }>(
        workbook.Sheets['KPI Summary']
    );
    const byMetric = new Map(summaryRows.map((row) => [row.Metric, row.Value]));

    // Placed value counts non-cancelled orders only (24000 unpaid COD + 40000 paid = 64000)
    expect(byMetric.get('Placed Order Value (PHP)')).toBe(64000);
    // Collected payments counts gross paid orders only (40000 + 8000 = 48000; excludes 24000 unpaid COD)
    expect(byMetric.get('Collected Payments (PHP)')).toBe(48000);
    // Refunds issued sums recorded refunds (5000 + 8000 = 13000)
    expect(byMetric.get('Refunds Issued (PHP)')).toBe(13000);
    // Net sales = collected minus refunds (48000 - 13000 = 35000)
    expect(byMetric.get('Net Sales (PHP)')).toBe(35000);

    const orderRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        workbook.Sheets['Orders Log']
    );
    expect(orderRows[0]['Collected (PHP)']).toBe(0);
    expect(orderRows[0]['Net Sales (PHP)']).toBe(0);
    expect(orderRows[1]['Fulfillment Stage']).toBe('Delivered');
    expect(orderRows[1]['Payment Status']).toBe('Paid (GCash)');
    expect(orderRows[1]['Refund Destinations']).toBe('GCash E-Wallet');
    expect(orderRows[1]['Net Sales (PHP)']).toBe(35000);
    expect(orderRows[2]['Stock State']).toBe('Returned');
    expect(orderRows[2]['Net Sales (PHP)']).toBe(0);
});
