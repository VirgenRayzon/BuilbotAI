import assert from 'node:assert/strict';
import test from 'node:test';
import * as XLSX from 'xlsx';
import {
    buildSalesAnalyticsWorkbook,
    SALES_WORKBOOK_SHEET_STYLES,
} from './export-excel';
import { buildStyledWorkbook } from './styled-excel';
import type { Order } from './types';

test('buildSalesAnalyticsWorkbook separates placed value, collected payments, refunds, and net sales', () => {
    const orders: Order[] = [
        {
            id: 'legacy-1',
            userId: 'u-legacy',
            userEmail: 'legacy@test.com',
            items: [{ id: 'p1', name: 'Ryzen 5 5600', category: 'CPU', price: 9000 }],
            totalPrice: 9000,
            status: 'building',
            createdAt: new Date('2025-05-01T10:00:00Z'),
        },
        {
            id: 'paid-gcash-1',
            orderNumber: 'ORD-2026-1001',
            userId: 'u-gcash',
            userEmail: 'gcash@test.com',
            items: [{ id: 'p2', name: 'RTX 4070', category: 'GPU', price: 36000 }],
            totalPrice: 36000,
            status: 'finished building',
            fulfillmentStage: 'delivered',
            paymentMethod: 'gcash_simulated',
            paymentStatus: 'paid',
            refundStatus: 'partial',
            refundedAmount: 6000,
            refunds: [
                {
                    id: 'rf-1',
                    amount: 6000,
                    method: 'manual',
                    destination: 'gcash',
                    reason: 'Partial refund test',
                    reference: 'GC-999',
                    actorId: 'mgr-1',
                    actorName: 'Manager One',
                    actorRole: 'Manager',
                    status: 'succeeded',
                    createdAt: new Date('2026-10-02T10:00:00Z'),
                },
            ],
            createdAt: new Date('2026-10-01T10:00:00Z'),
        },
        {
            id: 'cancelled-paid-1',
            orderNumber: 'ORD-2026-1002',
            userId: 'u-cancel',
            userEmail: 'cancel@test.com',
            items: [{ id: 'p3', name: '1TB NVMe', category: 'Storage', price: 4500 }],
            totalPrice: 4500,
            status: 'cancelled',
            paymentMethod: 'paymongo_simulated',
            paymentStatus: 'paid',
            refundStatus: 'refunded',
            refundedAmount: 4500,
            stockState: 'restored',
            createdAt: new Date('2026-10-03T10:00:00Z'),
        },
    ];

    const wb = buildSalesAnalyticsWorkbook({
        orders,
        parts: [],
        prebuilts: [],
        revenueData: [{ name: 'Oct 1', revenue: 30000 }],
        timeRange: 'week',
    });

    const summaryRows = XLSX.utils.sheet_to_json<{ Metric: string; Value: string | number }>(
        wb.Sheets['KPI Summary']
    );
    const byMetric = new Map(summaryRows.map((r) => [r.Metric, r.Value]));

    assert.equal(byMetric.get('Placed Order Value (PHP)'), 45000); // 9000 + 36000
    assert.equal(byMetric.get('Collected Payments (PHP)'), 40500); // 36000 + 4500 (unpaid 9000 excluded)
    assert.equal(byMetric.get('Refunds Issued (PHP)'), 10500); // 6000 + 4500
    assert.equal(byMetric.get('Net Sales (PHP)'), 30000); // 40500 - 10500
    assert.equal(byMetric.get('Orders - Assembling & Testing'), 1);
    assert.equal(byMetric.get('Orders - Delivered'), 1);
    assert.equal(byMetric.get('Orders - Cancelled / Void'), 1);

    const bytes = buildStyledWorkbook(wb, SALES_WORKBOOK_SHEET_STYLES);
    const reopened = XLSX.read(bytes, { type: 'array' });
    const orderRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        reopened.Sheets['Orders Log']
    );
    assert.equal(orderRows.length, 3);
    assert.equal(orderRows[0]['Fulfillment Stage'], 'Assembling & Testing');
    assert.equal(orderRows[0]['Collected (PHP)'], 0);
    assert.equal(orderRows[1]['Payment Status'], 'Paid (GCash)');
    assert.equal(orderRows[1]['Net Sales (PHP)'], 30000);
});
