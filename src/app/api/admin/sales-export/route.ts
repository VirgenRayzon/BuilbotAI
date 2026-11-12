import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/server-init';
import { getOrderActor } from '@/lib/server/order-auth';
import {
  validateSalesExportParams,
  traverseOrdersInPages,
  aggregateExportRevenueData,
  type SalesExportQueryOptions,
} from '@/lib/server/sales-export-helpers';
import { buildSalesAnalyticsWorkbook } from '@/lib/export-excel';
import { INVENTORY_CATEGORY_SLUGS, inventoryItemsPath } from '@/lib/inventory-paths';
import type { Order, Part, PrebuiltSystem } from '@/lib/types';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

async function executeExport(options: SalesExportQueryOptions, idToken: string) {
  const { firestore, isStaff } = await getOrderActor(idToken);
  if (!isStaff) {
    return Response.json({ error: 'Forbidden: Staff access is required for export.' }, { status: 403 });
  }

  // Determine date boundaries
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (options.startDate) {
    startDate = new Date(options.startDate);
  }
  if (options.endDate) {
    endDate = new Date(options.endDate);
  }

  if (!startDate && options.timeRange !== 'all') {
    const now = Date.now();
    if (options.timeRange === 'week') {
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    } else if (options.timeRange === 'month') {
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    } else if (options.timeRange === 'year') {
      startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
    }
  }

  const PAGE_SIZE = 250;
  const allOrders = await traverseOrdersInPages({
    fetchPage: async (cursor) => {
      let q = firestore.collection('orders').orderBy('createdAt', 'desc').limit(PAGE_SIZE);
      if (startDate) {
        q = q.where('createdAt', '>=', startDate);
      }
      if (endDate) {
        q = q.where('createdAt', '<=', endDate);
      }
      if (cursor) {
        const cursorDoc = await firestore.collection('orders').doc(cursor).get();
        if (cursorDoc.exists) {
          q = q.startAfter(cursorDoc);
        }
      }
      const snap = await q.get();
      const orders = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as unknown as Order));
      const nextCursor = orders.length === PAGE_SIZE ? orders[orders.length - 1].id : null;
      return { orders, nextCursor };
    },
    maxOrders: options.maxOrders,
  });

  // Fetch parts & prebuilt systems for workbook enrichment
  const [prebuiltsSnap, ...categorySnaps] = await Promise.all([
    firestore.collection('prebuiltSystems').get().catch(() => ({ docs: [] })),
    ...INVENTORY_CATEGORY_SLUGS.map((slug) =>
      firestore.collection(inventoryItemsPath(slug)).get().catch(() => ({ docs: [] }))
    ),
  ]);

  const parts: Part[] = categorySnaps.flatMap((snap) =>
    snap.docs.map((d) => ({ ...(d.data() as Part), id: d.id }))
  );
  const prebuilts: PrebuiltSystem[] = prebuiltsSnap.docs.map((d) => ({
    ...(d.data() as PrebuiltSystem),
    id: d.id,
  }));

  const revenueData = aggregateExportRevenueData(allOrders, options.timeRange, startDate, endDate);
  const timeRangeLabel = options.timeRange === 'all' ? 'week' : options.timeRange;

  const wb = buildSalesAnalyticsWorkbook({
    orders: allOrders,
    parts,
    prebuilts,
    revenueData,
    timeRange: timeRangeLabel,
  });

  const dateFormatted = new Date().toISOString().split('T')[0];

  if (options.format === 'csv') {
    const ordersSheet = wb.Sheets['Orders Log'] || wb.Sheets[wb.SheetNames[0]];
    const csvContent = XLSX.utils.sheet_to_csv(ordersSheet);
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Netcodex_Sales_Orders_${dateFormatted}.csv"`,
      },
    });
  }

  const fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Netcodex_Sales_Analytics_${dateFormatted}.xlsx"`,
    },
  });
}

function extractBearerToken(request: NextRequest, bodyToken?: string): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return bodyToken || null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validation = validateSalesExportParams(searchParams);
    if (!validation.success) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const token = extractBearerToken(request);
    if (!token) {
      return Response.json({ error: 'Unauthorized: Missing authentication token.' }, { status: 401 });
    }

    return await executeExport(validation.data, token);
  } catch (error) {
    console.error('sales-export GET failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to export sales data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const validation = validateSalesExportParams(body);
    if (!validation.success) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const token = extractBearerToken(request, typeof body.idToken === 'string' ? body.idToken : undefined);
    if (!token) {
      return Response.json({ error: 'Unauthorized: Missing authentication token.' }, { status: 401 });
    }

    return await executeExport(validation.data, token);
  } catch (error) {
    console.error('sales-export POST failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to export sales data.' },
      { status: 500 }
    );
  }
}
