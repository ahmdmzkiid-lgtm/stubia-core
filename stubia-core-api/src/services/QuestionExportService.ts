import ExcelJS from 'exceljs';
import { Question } from '@prisma/client';

export class QuestionExportService {
  /**
   * Strips HTML tags from text but retains LaTeX format \(...\) and \[...\]
   */
  private stripHtml(html?: string | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Map tipe soal:
   * PG -> multiple_choice
   * PGK -> complex_mc_tf
   * BS -> complex_mc_multi
   * ISIAN -> ISIAN
   */
  private mapTipeSoal(tipe?: string): string {
    const t = (tipe || '').trim().toUpperCase();
    switch (t) {
      case 'PG':
      case 'PILIHAN GANDA':
        return 'multiple_choice';
      case 'PGK':
      case 'PILIHAN GANDA KOMPLEKS':
        return 'complex_mc_tf';
      case 'BS':
      case 'BENAR SALAH':
      case 'BENAR/SALAH':
        return 'complex_mc_multi';
      case 'ISIAN':
      case 'ISIAN SINGKAT':
        return 'ISIAN';
      default:
        return 'multiple_choice';
    }
  }

  /**
   * Map difficulty:
   * MUDAH, SEDANG, SULIT
   */
  private mapTingkatKesulitan(difficulty?: string): string {
    const raw = (difficulty || '').trim().toUpperCase();
    if (raw === 'EASY' || raw === 'MUDAH') return 'MUDAH';
    if (raw === 'MEDIUM' || raw === 'SEDANG') return 'SEDANG';
    if (raw === 'HOTS' || raw === 'HARD' || raw === 'SULIT') return 'SULIT';
    return 'SEDANG';
  }

  /**
   * Format MATERI: TOPIK - Materinya
   */
  private buildMateri(topik?: string, subtes?: string): string {
    const cleanTopik = (topik || '').trim();
    const cleanSubtes = (subtes || '').trim();
    if (cleanTopik && cleanSubtes) {
      return `${cleanTopik} - ${cleanSubtes}`;
    }
    return cleanTopik || cleanSubtes || '';
  }

  /**
   * Format KUNCI JAWABAN:
   * - multiple_choice: "A"
   * - complex_mc_multi: "A, B"
   * - complex_mc_tf: "A:B, B:S, C:B, D:S, E:B" (B = Positif/Benar/Tepat/Sesuai/Ya, S = Negatif/Salah/Tidak)
   */
  private formatKunciJawaban(kunciRaw: string, tipeSoal: string): string {
    if (!kunciRaw) return '';
    const clean = String(kunciRaw).trim();

    if (tipeSoal === 'multiple_choice') {
      const match = clean.match(/[A-E]/i);
      return match ? match[0].toUpperCase() : clean.toUpperCase();
    }

    if (tipeSoal === 'complex_mc_multi') {
      if (clean.includes(':')) {
        const parts = clean.split(',').map(p => p.trim());
        const positiveLetters = parts
          .filter(p => /^[A-E]\s*:\s*(B|BENAR|TRUE|YA|SESUAI|TEPAT|1)$/i.test(p))
          .map(p => p.charAt(0).toUpperCase());
        if (positiveLetters.length > 0) return positiveLetters.join(', ');
      }
      const letters = clean.match(/[A-E]/gi);
      if (letters && letters.length > 0) {
        const unique = Array.from(new Set(letters.map(l => l.toUpperCase())));
        return unique.join(', ');
      }
      return clean;
    }

    if (tipeSoal === 'complex_mc_tf') {
      if (clean.includes(':')) {
        const parts = clean.split(',').map(p => p.trim());
        const normalized = parts.map(part => {
          const [opt, val] = part.split(':').map(s => s.trim());
          if (!opt) return part;
          const letter = opt.toUpperCase();
          const valUpper = (val || '').toUpperCase();
          const isPositive = /^(B|BENAR|TRUE|YA|SESUAI|TEPAT|1)$/i.test(valUpper);
          return `${letter}:${isPositive ? 'B' : 'S'}`;
        });
        return normalized.join(', ');
      }

      const letters = (clean.match(/[A-E]/gi) || []).map(l => l.toUpperCase());
      if (letters.length > 0) {
        const allOpts = ['A', 'B', 'C', 'D', 'E'];
        return allOpts.map(opt => `${opt}:${letters.includes(opt) ? 'B' : 'S'}`).join(', ');
      }

      return clean;
    }

    return clean;
  }

  async exportQuestionsToExcel(questions: Question[], subtesName: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const dateStr = new Date().toISOString().split('T')[0];
    const sheetName = `Soal Stubia - ${dateStr}`;
    
    const safeSheetName = sheetName.replace(/[:\\/\?\*\[\]]/g, '').substring(0, 31);
    const worksheet = workbook.addWorksheet(safeSheetName, {
      views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
    });

    const hasPromptGambar = questions.some(
      (q: any) => (q.prompt_gambar && q.prompt_gambar.trim().length > 0) || (q.promptGambar && q.promptGambar.trim().length > 0)
    );

    // Columns
    const columns: any[] = [
      { header: 'MATERI', key: 'materi', width: 35 },
      { header: 'STIMULUS', key: 'stimulus', width: 50 },
      { header: 'SOAL', key: 'soal', width: 50 },
      { header: 'OPSI A', key: 'opsiA', width: 35 },
      { header: 'OPSI B', key: 'opsiB', width: 35 },
      { header: 'OPSI C', key: 'opsiC', width: 35 },
      { header: 'OPSI D', key: 'opsiD', width: 35 },
      { header: 'OPSI E', key: 'opsiE', width: 35 },
      { header: 'KUNCI JAWABAN', key: 'kunci', width: 25 },
      { header: 'PEMBAHASAN', key: 'pembahasan', width: 55 },
      { header: 'TIPE SOAL', key: 'tipe', width: 22 },
      { header: 'TINGKAT KESULITAN', key: 'difficulty', width: 22 },
      { header: 'LABEL KOLOM', key: 'labelKolom', width: 25 },
    ];

    if (hasPromptGambar) {
      columns.push({ header: 'PROMPT GAMBAR', key: 'promptGambar', width: 45 });
    }

    worksheet.columns = columns;

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 32;
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
    questions.forEach((q: any, index) => {
      const options = (q.optionsJson as any) || {};
      const tipeSoal = this.mapTipeSoal(q.type);
      
      const rowData = {
        materi: this.buildMateri(q.topic, q.subtes),
        stimulus: this.stripHtml(q.stimulus || ''),
        soal: this.stripHtml(q.soalText),
        opsiA: options.A ? this.stripHtml(options.A) : '',
        opsiB: options.B ? this.stripHtml(options.B) : '',
        opsiC: options.C ? this.stripHtml(options.C) : '',
        opsiD: options.D ? this.stripHtml(options.D) : '',
        opsiE: options.E ? this.stripHtml(options.E) : '',
        kunci: this.formatKunciJawaban(q.answerKey, tipeSoal),
        pembahasan: this.stripHtml(q.explanation),
        tipe: tipeSoal,
        difficulty: this.mapTingkatKesulitan(q.difficulty),
        labelKolom: tipeSoal === 'complex_mc_tf' ? 'BENAR / SALAH' : '',
        promptGambar: this.stripHtml(q.prompt_gambar || q.promptGambar || ''),
      };

      const row = worksheet.addRow(rowData);
      row.height = 26;

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
