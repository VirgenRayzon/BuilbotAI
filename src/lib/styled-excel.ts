import * as XLSX from 'xlsx';

type SheetFormat = {
    currencyColumns?: string[];
    countColumns?: string[];
    percentColumns?: string[];
    currencyCells?: string[];
    countCells?: string[];
    percentCells?: string[];
};

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;₱&quot;#,##0.00"/></numFmts>
<fonts count="2"><font><sz val="11"/><color rgb="FF334155"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF102A43"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="medium"><color rgb="FF06B6D4"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="3" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="10" fontId="0" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4"/></styleSheet>`;

/** SheetJS Community writes data and number formats but not visual styles. Apply OOXML styles to its ZIP. */
export function buildStyledWorkbook(
    workbook: XLSX.WorkBook,
    formats: SheetFormat[],
): Uint8Array {
    const raw = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const archive = XLSX.CFB.read(new Uint8Array(raw), { type: 'buffer' });
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    function updateEntry(path: string, transform: (xml: string) => string) {
        const entry = XLSX.CFB.find(archive, `Root Entry/${path}`);
        if (!entry) throw new Error(`Missing Excel entry: ${path}`);
        entry.content = encoder.encode(transform(decoder.decode(entry.content)));
        entry.size = entry.content.length;
    }

    updateEntry('xl/styles.xml', () => STYLES_XML);

    formats.forEach((format, sheetIndex) => {
        updateEntry(`xl/worksheets/sheet${sheetIndex + 1}.xml`, (xml) => {
            const styledCells = xml.replace(/<c r="([A-Z]+)(\d+)"([^>]*)>/g, (_tag, column: string, rowText: string, attributes: string) => {
                const row = Number(rowText);
                const address = `${column}${rowText}`;
                let style = row % 2 === 0 ? 2 : 3;
                if (row === 1) style = 1;
                else if (format.currencyColumns?.includes(column) || format.currencyCells?.includes(address)) style += 2;
                else if (format.countColumns?.includes(column) || format.countCells?.includes(address)) style += 4;
                else if (format.percentColumns?.includes(column) || format.percentCells?.includes(address)) style += 6;
                return `<c r="${column}${rowText}"${attributes.replace(/ s="\d+"/, '')} s="${style}">`;
            });

            return styledCells.replace(
                '<sheetView workbookViewId="0"/>',
                '<sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView>',
            );
        });
    });

    return XLSX.CFB.write(archive, { fileType: 'zip', type: 'array' }) as Uint8Array;
}

export function downloadStyledWorkbook(workbook: XLSX.WorkBook, fileName: string, formats: SheetFormat[]) {
    const bytes = buildStyledWorkbook(workbook, formats);
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
