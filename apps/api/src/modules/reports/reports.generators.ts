import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

import type { ReportPreviewDto } from './reports.types';

/** GSP brand tokens (context/ui-rules.md §2) mirrored here since generators run
 * outside Tailwind/CSS — keep in sync if the palette ever changes. */
const COLORS = {
  green: '#1a6b3c',
  greenDark: '#164f30',
  greenPale: '#eaf5ee',
  gold: '#c8a900',
  gray: '#6c757d',
  dark: '#212529',
  border: '#d8dde0',
  white: '#ffffff',
};

/** A cell's display string, reclassified as an actual typed value so consumers
 * (Excel number formats, PDF column alignment) don't treat "₱1,500" / "67%" as text. */
interface ParsedCell {
  raw: string;
  numeric: boolean;
  value: string | number;
  numFmt?: string;
}

function parseCell(raw: string): ParsedCell {
  const trimmed = raw.trim();

  const currency = trimmed.match(/^(-)?₱\s?([\d,]+(?:\.\d+)?)$/);
  if (currency) {
    const amount = Number(currency[2]!.replace(/,/g, ''));
    return {
      raw,
      numeric: true,
      value: currency[1] ? -amount : amount,
      numFmt: '"₱"#,##0.00;[Red]-"₱"#,##0.00',
    };
  }

  const percent = trimmed.match(/^(-)?(\d+(?:\.\d+)?)%$/);
  if (percent) {
    const amount = Number(percent[2]!);
    return { raw, numeric: true, value: percent[1] ? -amount : amount, numFmt: '0"%"' };
  }

  const plainNumber = trimmed.match(/^(-)?[\d,]+(?:\.\d+)?$/);
  if (plainNumber && trimmed !== '') {
    return { raw, numeric: true, value: Number(trimmed.replace(/,/g, '')) };
  }

  return { raw, numeric: false, value: raw };
}

/** A column is right-aligned in the PDF if most of its non-empty cells parse as numeric —
 * decided per-column (not per-cell) so a stray "—" placeholder doesn't zig-zag the alignment. */
function columnAlignments(preview: ReportPreviewDto): Array<'left' | 'right'> {
  return preview.columns.map((_, colIndex) => {
    const cells = preview.rows.map((row) => row[colIndex] ?? '').filter((cell) => cell !== '' && cell !== '—');
    if (cells.length === 0) return 'left';
    const numericCount = cells.filter((cell) => parseCell(cell).numeric).length;
    return numericCount / cells.length > 0.5 ? 'right' : 'left';
  });
}

/** Renders a `ReportPreviewDto` to a styled PDF buffer — a branded header, stat cards for
 * the Summary section, and a bordered/banded table for Detail. One column-agnostic layout
 * covers all 6 report types since the data is already shaped generically. */
export function generatePdfBuffer(title: string, preview: ReportPreviewDto): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const MARGIN = 40;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - MARGIN * 2;
    const FOOTER_ZONE = 36;

    function drawBanner(): void {
      doc.rect(0, 0, pageWidth, 96).fill(COLORS.green);
      doc
        .fillColor('#bfe0c8')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('GSP MANAGEMENT INFORMATION SYSTEM', MARGIN, 22, { characterSpacing: 0.6 });
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(19).text(title, MARGIN, 38, { width: contentWidth });
      doc.fillColor('#d7ead9').font('Helvetica').fontSize(10).text(preview.rangeLabel, MARGIN, 66);
      doc
        .fillColor('#bfe0c8')
        .fontSize(8)
        .text(
          `Generated ${new Date(preview.generatedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`,
          MARGIN,
          66,
          { width: contentWidth, align: 'right' },
        );
      doc.y = 118;
    }

    function ensureSpace(needed: number): void {
      if (doc.y + needed > pageHeight - MARGIN - FOOTER_ZONE) {
        doc.addPage();
        doc.y = MARGIN;
      }
    }

    drawBanner();

    // --- Summary: stat cards ---
    doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(12).text('Summary', MARGIN, doc.y);
    doc.moveDown(0.6);

    const CARD_GAP = 12;
    const cardsPerRow = Math.min(4, preview.stats.length) || 1;
    const cardWidth = (contentWidth - CARD_GAP * (cardsPerRow - 1)) / cardsPerRow;
    const cardHeight = 56;
    let cx = MARGIN;
    let cy = doc.y;
    ensureSpace(cardHeight);
    cy = doc.y;

    preview.stats.forEach((item, i) => {
      if (i > 0 && i % cardsPerRow === 0) {
        cx = MARGIN;
        cy += cardHeight + CARD_GAP;
      }
      doc.rect(cx, cy, cardWidth, cardHeight).fillAndStroke('#fbfbf8', COLORS.border);
      doc.rect(cx, cy, cardWidth, 3).fill(COLORS.gold);
      doc
        .fillColor(COLORS.gray)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(item.label.toUpperCase(), cx + 12, cy + 14, { width: cardWidth - 20, characterSpacing: 0.3 });
      doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(15).text(item.value, cx + 12, cy + 28, { width: cardWidth - 20 });
      cx += cardWidth + CARD_GAP;
    });
    doc.y = cy + cardHeight + 26;

    // --- Detail: table ---
    ensureSpace(60);
    doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(12).text('Detail', MARGIN, doc.y);
    doc.moveDown(0.6);

    const columnCount = preview.columns.length;
    const colWidth = contentWidth / columnCount;
    const CELL_PAD_X = 6;
    const HEADER_HEIGHT = 24;
    const alignments = columnAlignments(preview);

    function drawTableHeader(y: number): number {
      doc.rect(MARGIN, y, contentWidth, HEADER_HEIGHT).fill(COLORS.green);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.white);
      preview.columns.forEach((col, i) => {
        const x = MARGIN + i * colWidth;
        doc.text(col.toUpperCase(), x + CELL_PAD_X, y + 8, { width: colWidth - CELL_PAD_X * 2, align: alignments[i], characterSpacing: 0.2 });
      });
      return y + HEADER_HEIGHT;
    }

    let tableY = drawTableHeader(doc.y);

    if (preview.rows.length === 0) {
      doc.rect(MARGIN, tableY, contentWidth, 40).fillAndStroke(COLORS.white, COLORS.border);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.gray)
        .text('No records found for this date range.', MARGIN, tableY + 15, { width: contentWidth, align: 'center' });
      doc.y = tableY + 40;
    } else {
      preview.rows.forEach((row, rowIndex) => {
        doc.font('Helvetica').fontSize(9);
        const rowHeight = Math.max(
          20,
          ...row.map((cell) => doc.heightOfString(cell, { width: colWidth - CELL_PAD_X * 2 }) + 10),
        );

        if (tableY + rowHeight > pageHeight - MARGIN - FOOTER_ZONE) {
          doc.addPage();
          tableY = drawTableHeader(MARGIN);
        }

        if (rowIndex % 2 === 1) {
          doc.rect(MARGIN, tableY, contentWidth, rowHeight).fill(COLORS.greenPale);
        }
        row.forEach((cell, i) => {
          const x = MARGIN + i * colWidth;
          doc
            .fillColor(COLORS.dark)
            .font('Helvetica')
            .fontSize(9)
            .text(cell, x + CELL_PAD_X, tableY + 6, { width: colWidth - CELL_PAD_X * 2, align: alignments[i] });
        });
        doc
          .moveTo(MARGIN, tableY + rowHeight)
          .lineTo(MARGIN + contentWidth, tableY + rowHeight)
          .lineWidth(0.5)
          .strokeColor(COLORS.border)
          .stroke();
        tableY += rowHeight;
      });
      doc.y = tableY + 20;
    }

    // --- Footer: page numbers on every page ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .moveTo(MARGIN, pageHeight - FOOTER_ZONE)
        .lineTo(pageWidth - MARGIN, pageHeight - FOOTER_ZONE)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.gray)
        .text('GSP Management Information System', MARGIN, pageHeight - FOOTER_ZONE + 10, { width: contentWidth / 2 });
      doc
        .fillColor(COLORS.gray)
        .text(`Page ${i + 1} of ${range.count}`, MARGIN + contentWidth / 2, pageHeight - FOOTER_ZONE + 10, {
          width: contentWidth / 2,
          align: 'right',
        });
    }

    doc.end();
  });
}

/** Renders a `ReportPreviewDto` to an .xlsx buffer — a Summary sheet plus a Detail sheet.
 * Currency/percentage/plain-number cells are written as real numbers with number formats
 * (not display strings) so totals, sorting, and right-alignment work natively in Excel. */
export async function generateExcelBuffer(title: string, preview: ReportPreviewDto): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GSP Management Information System';
  workbook.created = new Date();

  const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A6B3C' } };
  const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };
  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD8DDE0' } },
    bottom: { style: 'thin', color: { argb: 'FFD8DDE0' } },
    left: { style: 'thin', color: { argb: 'FFD8DDE0' } },
    right: { style: 'thin', color: { argb: 'FFD8DDE0' } },
  };

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.getColumn(1).width = 28;
  summarySheet.getColumn(2).width = 20;

  const titleRow = summarySheet.addRow([title]);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1A6B3C' } };
  const rangeRow = summarySheet.addRow([preview.rangeLabel]);
  rangeRow.getCell(1).font = { italic: true, color: { argb: 'FF6C757D' } };
  summarySheet.addRow([]);

  const summaryHeaderRow = summarySheet.addRow(['Metric', 'Value']);
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = THIN_BORDER;
  });

  for (const item of preview.stats) {
    const parsed = parseCell(item.value);
    const row = summarySheet.addRow([item.label, parsed.value]);
    row.eachCell((cell) => (cell.border = THIN_BORDER));
    const valueCell = row.getCell(2);
    if (parsed.numFmt) valueCell.numFmt = parsed.numFmt;
    if (parsed.numeric) valueCell.alignment = { horizontal: 'right' };
  }

  const detailSheet = workbook.addWorksheet('Detail');
  detailSheet.columns = preview.columns.map((col) => ({ header: col, width: Math.max(16, col.length + 6) }));
  detailSheet.views = [{ state: 'frozen', ySplit: 1 }];

  const detailHeaderRow = detailSheet.getRow(1);
  detailHeaderRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = THIN_BORDER;
  });

  const alignments = columnAlignments(preview);
  for (const row of preview.rows) {
    const parsedCells = row.map((cell) => parseCell(cell));
    const newRow = detailSheet.addRow(parsedCells.map((cell) => cell.value));
    newRow.eachCell((cell, colNumber) => {
      cell.border = THIN_BORDER;
      const parsed = parsedCells[colNumber - 1];
      if (parsed?.numFmt) cell.numFmt = parsed.numFmt;
      if (alignments[colNumber - 1] === 'right') cell.alignment = { horizontal: 'right' };
    });
  }

  if (preview.rows.length > 0) {
    detailSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: preview.columns.length } };
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
