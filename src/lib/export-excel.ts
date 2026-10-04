import * as XLSX from 'xlsx';
import type { Order, Part, PrebuiltSystem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export interface ExportDataOptions {
    orders: Order[];
    parts: Part[];
    prebuilts: PrebuiltSystem[];
    revenueData: { name: string; revenue: number }[];
    timeRange: 'week' | 'month' | 'year';
}

/**
 * Export complete Sales & Analytics data as a multi-sheet Microsoft Excel (.xlsx) file.
 */
export function exportSalesAnalyticsToExcel({
    orders,
    parts,
    prebuilts,
    revenueData,
    timeRange
}: ExportDataOptions) {
    const validOrders = (orders || []).filter(o => o.status !== 'cancelled');
    const totalGrossRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? totalGrossRevenue / validOrders.length : 0;
    const cancelledOrders = (orders || []).filter(o => o.status === 'cancelled');
    const cancellationRate = (orders || []).length > 0
        ? (cancelledOrders.length / (orders || []).length) * 100
        : 0;

    const pendingOrders = (orders || []).filter(o => o.status === 'pending');
    const buildingOrders = (orders || []).filter(o => o.status === 'building');
    const finishedOrders = (orders || []).filter(o => o.status === 'finished building' || (o.status as any) === 'finished');

    // 1. Sheet 1: Executive KPI Summary
    const summaryData = [
        { Metric: 'Report Title', Value: 'Buildbot AI - Sales & Analytics Report' },
        { Metric: 'Generated At', Value: new Date().toLocaleString() },
        { Metric: 'Selected Time Range Filter', Value: timeRange.toUpperCase() },
        { Metric: '', Value: '' },
        { Metric: 'Gross Revenue (PHP)', Value: totalGrossRevenue },
        { Metric: 'Total Valid Reservations', Value: validOrders.length },
        { Metric: 'All-Time Total Orders', Value: (orders || []).length },
        { Metric: 'Average Order Value (AOV)', Value: Math.round(avgOrderValue * 100) / 100 },
        { Metric: 'Cancellation Rate', Value: `${cancellationRate.toFixed(1)}%` },
        { Metric: '', Value: '' },
        { Metric: 'Orders - Pending Review', Value: pendingOrders.length },
        { Metric: 'Orders - Assembly in Progress', Value: buildingOrders.length },
        { Metric: 'Orders - Finished Building', Value: finishedOrders.length },
        { Metric: 'Orders - Cancelled / Void', Value: cancelledOrders.length },
        { Metric: '', Value: '' },
        { Metric: 'Total Components Tracked', Value: (parts || []).length },
        { Metric: 'Total Prebuilt Systems Tracked', Value: (prebuilts || []).length },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 32 }, { wch: 36 }];

    // 2. Sheet 2: Revenue Trend Data
    const revenueSheetData = revenueData.map(item => ({
        'Period': item.name,
        'Revenue (PHP)': item.revenue
    }));
    const wsRevenue = XLSX.utils.json_to_sheet(revenueSheetData);
    wsRevenue['!cols'] = [{ wch: 22 }, { wch: 20 }];

    // 3. Sheet 3: Component Popularity Matrix
    const popularityRows: any[] = [];
    const categoryGroups = (parts || []).reduce((acc, part) => {
        if (!acc[part.category]) acc[part.category] = [];
        acc[part.category].push(part);
        return acc;
    }, {} as Record<string, Part[]>);

    Object.entries(categoryGroups).forEach(([category, catParts]) => {
        const sorted = [...catParts]
            .filter(p => ((p as any).popularity || 0) >= 0)
            .sort((a, b) => ((b as any).popularity || 0) - ((a as any).popularity || 0));

        const maxPop = sorted[0] ? ((sorted[0] as any).popularity || 1) : 1;

        sorted.forEach((part, index) => {
            const pop = (part as any).popularity || 0;
            const relativeStrength = maxPop > 0 ? Math.round((pop / maxPop) * 100) : 0;
            popularityRows.push({
                'Category': category,
                'Rank': `#${index + 1}`,
                'Component Name': part.name,
                'Brand': part.brand || 'N/A',
                'Unit Price (PHP)': part.price,
                'Purchase Demand Score': pop,
                'Relative Category Demand': `${relativeStrength}%`,
                'In Stock': part.stock ?? 'N/A'
            });
        });
    });

    const wsPopularity = XLSX.utils.json_to_sheet(popularityRows);
    wsPopularity['!cols'] = [
        { wch: 18 }, // Category
        { wch: 8 },  // Rank
        { wch: 38 }, // Name
        { wch: 18 }, // Brand
        { wch: 18 }, // Price
        { wch: 24 }, // Demand Score
        { wch: 26 }, // Relative Demand
        { wch: 12 }  // In Stock
    ];

    // 4. Sheet 4: Customer Reservations & Orders Log
    const orderRows = (orders || []).map(order => {
        const dateStr = order.createdAt?.toDate
            ? order.createdAt.toDate().toLocaleDateString()
            : (order.createdAt?.seconds
                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                : 'Recent');

        const isPrebuilt = (order as any).type === 'prebuilt';
        const buildInfo = isPrebuilt
            ? ((order as any).prebuiltName || 'Custom Prebuilt')
            : `Custom Build (${order.items?.length || 0} parts)`;

        return {
            'Order ID': `#${order.id}`,
            'Customer Email': order.userEmail || 'N/A',
            'Order Type': isPrebuilt ? 'Prebuilt' : 'Custom Build',
            'Build / Rig Details': buildInfo,
            'Status': (order.status || 'pending').toUpperCase(),
            'Items Count': order.items?.length || 0,
            'Total Price (PHP)': order.totalPrice || 0,
            'Reservation Date': dateStr
        };
    });

    const wsOrders = XLSX.utils.json_to_sheet(orderRows);
    wsOrders['!cols'] = [
        { wch: 24 }, // Order ID
        { wch: 30 }, // Email
        { wch: 16 }, // Type
        { wch: 32 }, // Details
        { wch: 18 }, // Status
        { wch: 14 }, // Items
        { wch: 20 }, // Price
        { wch: 18 }  // Date
    ];

    // 5. Sheet 5: Prebuilt Sales by Tier
    const prebuiltTierCounts: Record<string, number> = {
        'Entry': 0,
        'Mid-Range': 0,
        'High-End': 0,
        'Workstation': 0
    };
    const prebuiltTierRevenue: Record<string, number> = {
        'Entry': 0,
        'Mid-Range': 0,
        'High-End': 0,
        'Workstation': 0
    };

    validOrders.filter(o => (o as any).type === 'prebuilt').forEach(order => {
        const prebuiltId = (order as any).prebuiltId;
        const system = (prebuilts || []).find(s => s.id === prebuiltId);
        const tier = system?.tier || (order as any).prebuiltTier || 'Mid-Range';
        if (tier in prebuiltTierCounts) {
            prebuiltTierCounts[tier]++;
            prebuiltTierRevenue[tier] += order.totalPrice || 0;
        }
    });

    const prebuiltRows = Object.entries(prebuiltTierCounts).map(([tier, count]) => ({
        'Performance Tier': tier,
        'Units Reserved': count,
        'Revenue Generated (PHP)': prebuiltTierRevenue[tier] || 0
    }));

    const wsPrebuilts = XLSX.utils.json_to_sheet(prebuiltRows);
    wsPrebuilts['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 26 }];

    // 6. Sheet 6: Revenue by Category
    const catMap = new Map<string, number>();
    validOrders.forEach(order => {
        order.items?.forEach(item => {
            const cat = item.category || 'Other';
            catMap.set(cat, (catMap.get(cat) || 0) + (item.price || 0));
        });
    });

    const catRows = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
            'Category': name,
            'Revenue (PHP)': value,
            'Share of Revenue': totalGrossRevenue > 0 ? `${((value / totalGrossRevenue) * 100).toFixed(1)}%` : '0%'
        }));

    const wsCategories = XLSX.utils.json_to_sheet(catRows);
    wsCategories['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 18 }];

    // Construct the workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'KPI Summary');
    XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue Trend');
    XLSX.utils.book_append_sheet(wb, wsPopularity, 'Popularity Matrix');
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Reservations Log');
    XLSX.utils.book_append_sheet(wb, wsPrebuilts, 'Prebuilt Tiers');
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Category Revenue');

    // Trigger download
    const dateFormatted = new Date().toISOString().split('T')[0];
    const fileName = `BuildbotAI_Sales_Analytics_${dateFormatted}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
