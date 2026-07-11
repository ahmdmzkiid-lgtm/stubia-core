import ExcelJS from 'exceljs';
import { Question } from '@prisma/client';

export class QuestionExportService {
  /**
   * Strips HTML tags from text but retains LaTeX format \(...\) and \[...\]
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    // Strip standard HTML tags but keep text
    return html.replace(/<[^>]*>/g, '').trim();
  }

  async exportQuestionsToExcel(questions: Question[], subtesName: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const dateStr = new Date().toISOString().split('T')[0];
    const sheetName = `Soal Stubia - ${subtesName.substring(0, 15)} - ${dateStr}`;
    
    // ExcelJS Sheet names cannot exceed 31 chars and cannot contain special chars (like :, \, /, ?, *, [, ])
    const safeSheetName = sheetName.replace(/[:\\/\?\*\[\]]/g, '').substring(0, 31);
    const worksheet = workbook.addWorksheet(safeSheetName, {
      views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
    });

    // Define Columns
    worksheet.columns = [
      { header: 'STIMULUS', key: 'stimulus', width: 40 },
      { header: 'SOAL', key: 'soal', width: 60 },
      { header: 'OPSI A', key: 'opsiA', width: 40 },
      { header: 'OPSI B', key: 'opsiB', width: 40 },
      { header: 'OPSI C', key: 'opsiC', width: 40 },
      { header: 'OPSI D', key: 'opsiD', width: 40 },
      { header: 'OPSI E', key: 'opsiE', width: 40 },
      { header: 'KUNCI JAWABAN', key: 'kunci', width: 20 },
      { header: 'PEMBAHASAN', key: 'pembahasan', width: 60 },
      { header: 'SUBTES', key: 'subtes', width: 25 },
      { header: 'TOPIK', key: 'topik', width: 25 },
      { header: 'DIFFICULTY', key: 'difficulty', width: 20 },
      { header: 'TIPE SOAL', key: 'tipe', width: 20 },
      { header: 'SUMBER', key: 'sumber', width: 20 },
      { header: 'STATUS', key: 'status', width: 20 }
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1B3FAB' } // Royal Blue #1B3FAB
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Populate data
    questions.forEach((q, index) => {
      const options = (q.optionsJson as any) || {};
      
      const rowData = {
        stimulus: this.stripHtml(q.stimulus || ''),
        soal: this.stripHtml(q.soalText),
        opsiA: options.A ? this.stripHtml(options.A) : '',
        opsiB: options.B ? this.stripHtml(options.B) : '',
        opsiC: options.C ? this.stripHtml(options.C) : '',
        opsiD: options.D ? this.stripHtml(options.D) : '',
        opsiE: options.E ? this.stripHtml(options.E) : '',
        kunci: q.answerKey,
        pembahasan: this.stripHtml(q.explanation),
        subtes: q.subtes,
        topik: q.topic,
        difficulty: q.difficulty,
        tipe: q.type,
        sumber: q.source,
        status: q.status
      };

      const row = worksheet.addRow(rowData);
      row.height = 24;

      // Formatting details for data rows
      row.eachCell((cell) => {
        cell.font = {
          name: 'Segoe UI',
          size: 10
        };
        cell.alignment = {
          vertical: 'top',
          horizontal: 'left',
          wrapText: true
        };
        // Alternating Row colors
        const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        // Borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });
    });

    return workbook;
  }
}
