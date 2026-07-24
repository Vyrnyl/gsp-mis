import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

import type { ReportPreviewDto } from './reports.types';

/** Renders a `ReportPreviewDto` to a PDF buffer — one column-agnostic layout covers
 * all 6 report types since the data is already shaped generically. */
export function generatePdfBuffer(title: string, preview: ReportPreviewDto): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text(title);
    doc.fontSize(10).font('Helvetica').fillColor('#6c757d').text(preview.rangeLabel);
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    for (const stat of preview.stats) {
      doc.text(`${stat.label}: ${stat.value}`);
    }
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('Detail');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(preview.columns.join('   |   '));
    doc.moveDown(0.2);
    doc.font('Helvetica');
    for (const row of preview.rows) {
      doc.text(row.join('   |   '));
    }

    doc.end();
  });
}

/** Renders a `ReportPreviewDto` to an .xlsx buffer — a Summary sheet plus a Detail sheet. */
export async function generateExcelBuffer(title: string, preview: ReportPreviewDto): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GSP Management Information System';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow([title]);
  summarySheet.addRow([preview.rangeLabel]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Metric', 'Value']);
  for (const stat of preview.stats) {
    summarySheet.addRow([stat.label, stat.value]);
  }
  summarySheet.getColumn(1).width = 28;
  summarySheet.getColumn(2).width = 20;

  const detailSheet = workbook.addWorksheet('Detail');
  detailSheet.addRow(preview.columns);
  detailSheet.getRow(1).font = { bold: true };
  for (const row of preview.rows) {
    detailSheet.addRow(row);
  }
  detailSheet.columns.forEach((column) => {
    column.width = 22;
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
