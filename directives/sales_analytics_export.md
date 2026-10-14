# Sales analytics Excel export

## Goal
Keep the Sales & Analytics workbook aligned with the dashboard's popularity matrix and make each worksheet readable in Excel.

## Data flow
1. Rank parts through `src/lib/popularity.ts`; the dashboard and export both use its top 10 items per category.
2. Build the six worksheets in `src/lib/export-excel.ts`. Keep money, counts, and rates numeric so Excel can sort and calculate them.
3. Apply workbook styles in `src/lib/styled-excel.ts`. The installed SheetJS Community writer omits visual cell styles, so this helper adds OOXML styles to its generated ZIP before download.

## Verification
- Run `npm run typecheck` and `npm run lint` after edits.
- Run `npx playwright test tests/sales-export.spec.ts` to check the ranking, saved data, and style entries.
- When the project's `next lint` command fails before analyzing files on Windows, run ESLint with a temporary flat config based on `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`, then remove the temporary config.
