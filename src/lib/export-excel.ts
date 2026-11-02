import * as XLSX from 'xlsx';
import type { Order, Part, PrebuiltSystem } from '@/lib/types';
import { getPopularityCategories } from '@/lib/popularity';
import { getPaymentMethodLabel, getPaymentStatusInfo } from '@/lib/payment-methods';
import { downloadStyledWorkbook } from '@/lib/styled-excel';
import {
    calculateOrderFinancialSummary,
    getNetCollectedAmount,
    getOrderFulfillmentStage,
    getOrderFulfillmentStageLabel,
    getOrderStockState,
    getRefundedAmount,
    ORDER_REFUND_DESTINATION_LABELS,
} from '@/lib/order-workflow';

export interface ExportDataOptions {
    orders: Order[];
    parts: Part[];
    prebuilts: PrebuiltSystem[];
    revenueData: { name: string; revenue: number }[];
    timeRange: 'week' | 'month' | 'year';
}

export const SALES_WORKBOOK_SHEET_STYLES: Parameters<typeof downloadStyledWorkbook>[2] = [
    {
        currencyCells: ['B6', 'B7', 'B8', 'B9', 'B10'],
        countCells: ['B11', 'B12', 'B13', 'B16', 'B17', 'B18', 'B19', 'B20', 'B22', 'B23'],
        percentCells: ['B14'],
    },
    { currencyColumns: ['B'] },
    { currencyColumns: ['E'], countColumns: ['B', 'F', 'H'], percentColumns: ['G'] },
    { currencyColumns: ['H', 'M', 'N', 'O'], countColumns: ['G'] },
    { currencyColumns: ['C'], countColumns: ['B'] },
    { currencyColumns: ['B'], percentColumns: ['C'] },
];

/**
 * Export complete Sales & Analytics data as a multi-sheet Microsoft Excel (.xlsx) file.
 */
export function buildSalesAnalyticsWorkbook({
    orders,
    parts,
    prebuilts,
    revenueData,
    timeRange,
}: ExportDataOptions) {
    const safeOrders = orders || [];
    const financials = calculateOrderFinancialSummary(safeOrders);
    const validOrders = safeOrders.filter((o) => o.status !== 'cancelled');
    const paidOrders = safeOrders.filter((o) => o.paymentStatus === 'paid');
    const avgOrderValue =
        financials.paidOrderCount > 0 ? financials.netSales / financials.paidOrderCount : 0;
    const cancellationRate =
        financials.totalOrderCount > 0
            ? (financials.cancelledOrderCount / financials.totalOrderCount) * 100
            : 0;

    const stageCounts = {
        order_placed: 0,
        assembling_testing: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
    };

    for (const order of safeOrders) {
        if (order.status === 'cancelled') {
            stageCounts.cancelled += 1;
        } else {
            const stage = getOrderFulfillmentStage(order);
            stageCounts[stage] += 1;
        }
    }

    // 1. Sheet 1: Executive KPI Summary
    // Note: Row 1 is Header (Metric | Value), so summaryData[idx] maps to Excel cell B{idx + 2}.
    const summaryData = [
        { Metric: 'Report Title', Value: 'Netcodex - Sales & Analytics Report' }, // B2
        { Metric: 'Generated At', Value: new Date().toLocaleString() }, // B3
        { Metric: 'Selected Time Range Filter', Value: timeRange.toUpperCase() }, // B4
        { Metric: '', Value: '' }, // B5
        { Metric: 'Placed Order Value (PHP)', Value: financials.placedOrderValue }, // B6
        { Metric: 'Collected Payments (PHP)', Value: financials.collectedPayments }, // B7
        { Metric: 'Refunds Issued (PHP)', Value: financials.refundsIssued }, // B8
        { Metric: 'Net Sales (PHP)', Value: financials.netSales }, // B9
        { Metric: 'Average Net Order Value (AOV)', Value: Math.round(avgOrderValue * 100) / 100 }, // B10
        { Metric: 'Active Orders', Value: financials.activeOrderCount }, // B11
        { Metric: 'Paid Orders', Value: financials.paidOrderCount }, // B12
        { Metric: 'All-Time Total Orders', Value: financials.totalOrderCount }, // B13
        { Metric: 'Cancellation Rate', Value: cancellationRate / 100 }, // B14
        { Metric: '', Value: '' }, // B15
        { Metric: 'Orders - Order Placed', Value: stageCounts.order_placed }, // B16
        { Metric: 'Orders - Assembling & Testing', Value: stageCounts.assembling_testing }, // B17
        { Metric: 'Orders - Out for Delivery / Pickup', Value: stageCounts.out_for_delivery }, // B18
        { Metric: 'Orders - Delivered', Value: stageCounts.delivered }, // B19
        { Metric: 'Orders - Cancelled / Void', Value: stageCounts.cancelled }, // B20
        { Metric: '', Value: '' }, // B21
        { Metric: 'Total Components Tracked', Value: (parts || []).length }, // B22
        { Metric: 'Total Prebuilt Systems Tracked', Value: (prebuilts || []).length }, // B23
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 36 }, { wch: 36 }];

    // 2. Sheet 2: Revenue Trend Data (strictly Net Sales from paid orders)
    const revenueSheetData = revenueData.map((item) => ({
        Period: item.name,
        'Net Sales (PHP)': item.revenue,
    }));
    const wsRevenue = XLSX.utils.json_to_sheet(revenueSheetData, {
        header: ['Period', 'Net Sales (PHP)'],
    });
    wsRevenue['!cols'] = [{ wch: 22 }, { wch: 20 }];

    // 3. Sheet 3: Component Popularity Matrix
    const popularityRows: Record<string, string | number>[] = [];
    getPopularityCategories(parts || []).forEach(({ category, parts: rankedParts, maxPopularity }) => {
        rankedParts.forEach((part, index) => {
            const pop = part.popularity ?? 0;
            const relativeStrength = maxPopularity > 0 ? pop / maxPopularity : 0;
            popularityRows.push({
                Category: category,
                Rank: index + 1,
                'Component Name': part.name,
                Brand: part.brand || 'Standard',
                'Unit Price (PHP)': part.price,
                Orders: pop,
                'Relative Category Demand': relativeStrength,
                'In Stock': part.stock ?? 0,
            });
        });
    });

    const wsPopularity = XLSX.utils.json_to_sheet(popularityRows, {
        header: [
            'Category',
            'Rank',
            'Component Name',
            'Brand',
            'Unit Price (PHP)',
            'Orders',
            'Relative Category Demand',
            'In Stock',
        ],
    });
    wsPopularity['!cols'] = [
        { wch: 18 },
        { wch: 8 },
        { wch: 38 },
        { wch: 18 },
        { wch: 18 },
        { wch: 24 },
        { wch: 26 },
        { wch: 12 },
    ];

    // 4. Sheet 4: Customer Orders Log
    const orderRows = safeOrders.map((order) => {
        const dateStr = order.createdAt?.toDate
            ? order.createdAt.toDate().toLocaleDateString()
            : order.createdAt?.seconds
              ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
              : 'Recent';

        const isPrebuilt = order.type === 'prebuilt' || Boolean(order.prebuiltName);
        const buildInfo = isPrebuilt
            ? order.prebuiltName || 'Custom Prebuilt'
            : `Custom Build (${order.items?.length || 0} parts)`;

        const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.paymentMethod);
        const collectedAmount = order.paymentStatus === 'paid' ? order.totalPrice || 0 : 0;
        const refundDestinations =
            order.refunds
                ?.map((refund) =>
                    refund.destination
                        ? ORDER_REFUND_DESTINATION_LABELS[refund.destination]
                        : refund.method === 'paymongo'
                          ? 'Original Payment Method'
                          : 'Manual Payout'
                )
                .join(', ') || 'N/A';

        return {
            'Order ID': order.orderNumber || `#${order.id}`, // A
            'Customer Email': order.userEmail || 'N/A', // B
            'Order Type': isPrebuilt ? 'Prebuilt' : 'Custom Build', // C
            'Build / Rig Details': buildInfo, // D
            'Fulfillment Stage': getOrderFulfillmentStageLabel(order), // E
            'Stock State': getOrderStockState(order) === 'restored' ? 'Returned' : 'Reserved', // F
            'Items Count': order.items?.length || 0, // G (count)
            'Placed Value (PHP)': order.totalPrice || 0, // H (currency)
            'Order Date': dateStr, // I
            'Payment Method': getPaymentMethodLabel(order.paymentMethod, false), // J
            'Payment Status': paymentStatusInfo.label, // K
            'Payment Reference': order.paymentReference || 'N/A', // L
            'Collected (PHP)': collectedAmount, // M (currency)
            'Refunded (PHP)': getRefundedAmount(order), // N (currency)
            'Net Sales (PHP)': getNetCollectedAmount(order), // O (currency)
            'Refund Status': order.refundStatus || 'none', // P
            'Refund Destinations': refundDestinations, // Q
            'Refund References': order.refunds?.map((refund) => refund.reference).join(', ') || 'N/A', // R
        };
    });

    const wsOrders = XLSX.utils.json_to_sheet(orderRows, {
        header: [
            'Order ID',
            'Customer Email',
            'Order Type',
            'Build / Rig Details',
            'Fulfillment Stage',
            'Stock State',
            'Items Count',
            'Placed Value (PHP)',
            'Order Date',
            'Payment Method',
            'Payment Status',
            'Payment Reference',
            'Collected (PHP)',
            'Refunded (PHP)',
            'Net Sales (PHP)',
            'Refund Status',
            'Refund Destinations',
            'Refund References',
        ],
    });
    wsOrders['!cols'] = [
        { wch: 24 },
        { wch: 30 },
        { wch: 16 },
        { wch: 32 },
        { wch: 24 },
        { wch: 16 },
        { wch: 14 },
        { wch: 20 },
        { wch: 18 },
        { wch: 24 },
        { wch: 28 },
        { wch: 24 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 26 },
        { wch: 30 },
    ];

    // 5. Sheet 5: Prebuilt Sales by Tier
    const prebuiltTierCounts: Record<string, number> = {
        Entry: 0,
        'Mid-Range': 0,
        'High-End': 0,
        Workstation: 0,
    };
    const prebuiltTierRevenue: Record<string, number> = {
        Entry: 0,
        'Mid-Range': 0,
        'High-End': 0,
        Workstation: 0,
    };

    validOrders
        .filter((o) => o.type === 'prebuilt' || Boolean(o.prebuiltName))
        .forEach((order) => {
            const prebuiltId = order.prebuiltId;
            const system = (prebuilts || []).find((s) => s.id === prebuiltId);
            const tier = system?.tier || order.prebuiltTier || 'Mid-Range';
            if (tier in prebuiltTierCounts) {
                prebuiltTierCounts[tier]++;
                prebuiltTierRevenue[tier] += getNetCollectedAmount(order);
            }
        });

    const prebuiltRows = Object.entries(prebuiltTierCounts).map(([tier, count]) => ({
        'Performance Tier': tier,
        'Units Ordered': count,
        'Net Sales Generated (PHP)': prebuiltTierRevenue[tier] || 0,
    }));

    const wsPrebuilts = XLSX.utils.json_to_sheet(prebuiltRows);
    wsPrebuilts['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 26 }];

    // 6. Sheet 6: Net Sales by Category (strictly from paid orders)
    const catMap = new Map<string, number>();
    paidOrders.forEach((order) => {
        const itemsTotal = (order.items || []).reduce((sum, item) => {
            const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
            return sum + (item.lineTotal ?? item.price * qty);
        }, 0);
        const subtotal = order.subtotal || itemsTotal;
        const netOrderSales = getNetCollectedAmount(order);
        order.items?.forEach((item) => {
            const cat = item.category || 'Other';
            const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
            const lineVal = item.lineTotal ?? item.price * qty;
            const allocation = subtotal > 0 ? (lineVal / subtotal) * netOrderSales : 0;
            catMap.set(cat, (catMap.get(cat) || 0) + allocation);
        });
    });

    const catRows = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
            Category: name,
            'Net Sales (PHP)': value,
            'Share of Net Sales': financials.netSales > 0 ? value / financials.netSales : 0,
        }));

    const wsCategories = XLSX.utils.json_to_sheet(catRows, {
        header: ['Category', 'Net Sales (PHP)', 'Share of Net Sales'],
    });
    wsCategories['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 20 }];

    // Construct the workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'KPI Summary');
    XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue Trend');
    XLSX.utils.book_append_sheet(wb, wsPopularity, 'Popularity Matrix');
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders Log');
    XLSX.utils.book_append_sheet(wb, wsPrebuilts, 'Prebuilt Tiers');
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Category Revenue');

    [wsRevenue, wsPopularity, wsOrders, wsPrebuilts, wsCategories].forEach((sheet) => {
        if (sheet['!ref']) sheet['!autofilter'] = { ref: sheet['!ref'] };
    });

    return wb;
}

export function exportSalesAnalyticsToExcel(options: ExportDataOptions) {
    const wb = buildSalesAnalyticsWorkbook(options);
    const dateFormatted = new Date().toISOString().split('T')[0];
    const fileName = `Netcodex_Sales_Analytics_${dateFormatted}.xlsx`;
    downloadStyledWorkbook(wb, fileName, SALES_WORKBOOK_SHEET_STYLES);
}
