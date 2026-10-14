import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';
import { buildSalesAnalyticsWorkbook } from '../src/lib/export-excel';
import { getPopularityCategories } from '../src/lib/popularity';
import { buildStyledWorkbook } from '../src/lib/styled-excel';
import type { Part } from '../src/lib/types';

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
    const parts = [...Array.from({ length: 12 }, (_, index) => makePart(index + 1)), makePart(1, 'GPU')];
    const categories = getPopularityCategories(parts);
    expect(categories.find((group) => group.category === 'CPU')?.parts.map((part) => part.popularity))
        .toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);

    const workbook = buildSalesAnalyticsWorkbook({
        orders: [],
        parts,
        prebuilts: [],
        revenueData: [{ name: 'Oct 14', revenue: 1234.5 }],
        timeRange: 'week',
    });
    const popularityRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(workbook.Sheets['Popularity Matrix']);
    expect(popularityRows).toHaveLength(11);
    expect(popularityRows.filter((row) => row.Category === 'CPU').map((row) => row['Component Name']))
        .toEqual(['CPU 12', 'CPU 11', 'CPU 10', 'CPU 9', 'CPU 8', 'CPU 7', 'CPU 6', 'CPU 5', 'CPU 4', 'CPU 3']);
    expect(popularityRows[0]['Relative Category Demand']).toBe(1);

    const bytes = buildStyledWorkbook(workbook, [{}, {}, { currencyColumns: ['E'], percentColumns: ['G'] }, {}, {}, {}]);
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
