import ExcelJS from 'exceljs';

export interface TKAQuestionRow {
  materi: string;
  stimulus: string;
  soal: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  opsiE: string;
  kunciJawaban: string;
  pembahasan: string;
  tipeSoal: string;
  tingkatKesulitan: string;
  labelKolom: string;
  promptGambar?: string;
}

export class TKAExportService {
  /**
   * Map tipe soal:
   * PG -> multiple_choice
   * PGK -> complex_mc_tf
   * BS -> complex_mc_multi
   * ISIAN -> ISIAN
   */
  private mapTipeSoal(tipe?: string, tipeTka?: string): string {
    const raw = (tipeTka || tipe || '').trim().toLowerCase();
    
    if (raw === 'multiple_choice' || raw === 'complex_mc_tf' || raw === 'complex_mc_multi' || raw === 'isian') {
      return raw === 'isian' ? 'ISIAN' : raw;
    }

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
   * MUDAH, SEDANG, SULIT (Uppercase)
   */
  private mapTingkatKesulitan(difficulty?: string, tingkatKesulitan?: string): string {
    const raw = (tingkatKesulitan || difficulty || '').trim().toUpperCase();
    if (raw === 'EASY' || raw === 'MUDAH') return 'MUDAH';
    if (raw === 'MEDIUM' || raw === 'SEDANG') return 'SEDANG';
    if (raw === 'HOTS' || raw === 'HARD' || raw === 'SULIT') return 'SULIT';
    return 'SEDANG';
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html?: string | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Format MATERI as: TOPIK - Materinya (misal: "Pemahaman Tekstual - Teks Puisi")
   */
  private buildMateri(materi?: string, topik?: string, subtes?: string): string {
    const cleanTopik = (topik || subtes || '').trim();
    const cleanMateri = (materi || '').trim();

    if (!cleanMateri && !cleanTopik) return '';
    if (!cleanMateri) return cleanTopik;
    if (!cleanTopik) return cleanMateri;

    // If materi already starts with or contains the topic, return it
    if (cleanMateri.toLowerCase().startsWith(cleanTopik.toLowerCase())) {
      return cleanMateri;
    }

    // If materi contains dash separator already
    if (cleanMateri.includes(' - ') || cleanMateri.includes(' – ')) {
      return cleanMateri;
    }

    return `${cleanTopik} - ${cleanMateri}`;
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

  /**
   * Export questions to Excel with 13-column format:
   * MATERI | STIMULUS | SOAL | OPSI A | OPSI B | OPSI C | OPSI D | OPSI E | KUNCI JAWABAN | PEMBAHASAN | TIPE SOAL | TINGKAT KESULITAN | LABEL KOLOM
   */
  async exportToExcel(questions: any[], fileName?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const dateStr = new Date().toISOString().split('T')[0];
    const firstSubtes = questions[0]?.subtes || '';
    const firstSubtesLower = firstSubtes.toLowerCase();
    let sheetPrefix = 'TKA Tryout';
    if (firstSubtesLower.includes('kimia')) {
      sheetPrefix = 'TKA Kimia';
    } else if (firstSubtesLower.includes('fisika')) {
      sheetPrefix = 'TKA Fisika';
    } else if (firstSubtesLower.includes('biologi')) {
      sheetPrefix = 'TKA Biologi';
    } else if (firstSubtesLower.includes('ppkn') || firstSubtesLower.includes('pancasila')) {
      sheetPrefix = 'TKA PPKn';
    } else if (firstSubtesLower.includes('ekonomi')) {
      sheetPrefix = 'TKA Ekonomi';
    } else if (firstSubtesLower.includes('geografi')) {
      sheetPrefix = 'TKA Geografi';
    } else if (firstSubtesLower.includes('sosiologi')) {
      sheetPrefix = 'TKA Sosiologi';
    } else if (firstSubtesLower.includes('sejarah')) {
      sheetPrefix = 'TKA Sejarah';
    } else if (firstSubtesLower.includes('antropologi')) {
      sheetPrefix = 'TKA Antropologi';
    } else if (firstSubtesLower.includes('pkwu') || firstSubtesLower.includes('kewirausahaan')) {
      sheetPrefix = 'TKA PKWU';
    } else if (firstSubtesLower.includes('prancis') || firstSubtesLower.includes('francais')) {
      sheetPrefix = 'TKA B. Prancis';
    } else if (firstSubtesLower.includes('indo') && firstSubtesLower.includes('lanjut')) {
      sheetPrefix = 'TKA Bindo Lanjut';
    } else if (firstSubtesLower.includes('indo')) {
      sheetPrefix = 'TKA Bindo';
    } else if (firstSubtesLower.includes('matematika') && (firstSubtesLower.includes('lanjut') || firstSubtesLower.includes('tingkat lanjut'))) {
      sheetPrefix = 'TKA MTK Lanjut';
    } else if (firstSubtesLower.includes('matematika')) {
      sheetPrefix = 'TKA MTK';
    } else if (firstSubtesLower.includes('inggris') && (firstSubtesLower.includes('lanjut') || firstSubtesLower.includes('tingkat lanjut'))) {
      sheetPrefix = 'TKA B. Inggris Lanjut';
    } else if (firstSubtesLower.includes('inggris')) {
      sheetPrefix = 'TKA B. Inggris';
    } else if (firstSubtes) {
      sheetPrefix = firstSubtes;
    }
    const sheetName = `${sheetPrefix} - ${dateStr}`;
    const safeSheetName = sheetName.replace(/[:\\/\?\*\[\]]/g, '').substring(0, 31);
    
    const worksheet = workbook.addWorksheet(safeSheetName, {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    const hasPromptGambar = questions.some(
      q => (q.prompt_gambar && q.prompt_gambar.trim().length > 0) || (q.promptGambar && q.promptGambar.trim().length > 0)
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
      { header: 'KUNCI JAWABAN', key: 'kunciJawaban', width: 25 },
      { header: 'PEMBAHASAN', key: 'pembahasan', width: 55 },
      { header: 'TIPE SOAL', key: 'tipeSoal', width: 22 },
      { header: 'TINGKAT KESULITAN', key: 'tingkatKesulitan', width: 22 },
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
        fgColor: { argb: 'FF7C3AED' } // Purple accent
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
        bottom: { style: 'medium', color: { argb: 'FF5B21B6' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Populate data rows
    questions.forEach((q, index) => {
      const options = q.opsi || (q.optionsJson as any) || {};
      const calculatedTipe = this.mapTipeSoal(q.tipe || q.type || '', q.tipe_soal_tka);

      let labelKolom = q.label_kolom || q.labelKolom || '';
      if (!labelKolom && calculatedTipe === 'complex_mc_tf') {
        labelKolom = 'BENAR / SALAH';
      }

      const rawKunci = q.kunci_jawaban || q.answerKey || '';

      const rowData: TKAQuestionRow = {
        materi: this.buildMateri(q.materi, q.topik || q.topic, q.subtes),
        stimulus: this.stripHtml(q.stimulus || ''),
        soal: this.stripHtml(q.soal || q.soalText || ''),
        opsiA: this.stripHtml(options.A || ''),
        opsiB: this.stripHtml(options.B || ''),
        opsiC: this.stripHtml(options.C || ''),
        opsiD: this.stripHtml(options.D || ''),
        opsiE: this.stripHtml(options.E || ''),
        kunciJawaban: this.formatKunciJawaban(rawKunci, calculatedTipe),
        pembahasan: this.stripHtml(q.pembahasan || q.explanation || ''),
        tipeSoal: calculatedTipe,
        tingkatKesulitan: this.mapTingkatKesulitan(q.difficulty, q.tingkat_kesulitan),
        labelKolom: labelKolom,
        promptGambar: this.stripHtml(q.prompt_gambar || q.promptGambar || ''),
      };

      const row = worksheet.addRow(rowData);
      row.height = 26;

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
        const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF5F3FF'; // Light purple alternating
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
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
