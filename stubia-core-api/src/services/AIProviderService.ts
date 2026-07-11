import { z } from 'zod';
import { AISkill } from '@prisma/client';
import { AppError } from '../errors/AppError';

// Zod Schema for Validating AI Output per Question
export const GeneratedQuestionSchema = z.object({
  stimulus: z.string().nullable().optional(),
  soal: z.string(),
  opsi: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
    E: z.string().nullable().optional(),
  }),
  kunci_jawaban: z.string(),
  pembahasan: z.string(),
  subtes: z.string(),
  topik: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HOTS']),
  tipe: z.enum(['PG', 'PGK', 'BS', 'ISIAN']),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export interface AIAdapter {
  sendPrompt(system: string, user: string, model: string): Promise<{ text: string; tokensUsed?: number }>;
}

export class GeminiAdapter implements AIAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    if (!this.apiKey || this.apiKey === 'sk-fake-placeholder-key') {
      console.warn('[AI] WARNING: Gemini API Key is empty or placeholder.');
    }
  }

  async sendPrompt(system: string, user: string, model: string): Promise<{ text: string; tokensUsed?: number }> {
    const activeModel = model || process.env.AI_DEFAULT_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: user,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: system,
          },
        ],
      },
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json() as any;

      if (!response.ok) {
        throw new AppError(
          result?.error?.message || 'Failed call to Gemini API',
          502,
          'AI_PROVIDER_ERROR'
        );
      }

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new AppError('AI response format error (no content text)', 502, 'AI_PARSE_ERROR');
      }

      // Estimate tokens (standard approximation if metadata not provided)
      const inputTokens = Math.round((system.length + user.length) / 4);
      const outputTokens = Math.round(text.length / 4);
      const tokensUsed = inputTokens + outputTokens;

      return { text, tokensUsed };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'System network error calling AI', 500, 'AI_PROVIDER_ERROR');
    }
  }
}

// Fallback Mock Adapter for Testing if API fails or in local dev offline
export class MockAIAdapter implements AIAdapter {
  async sendPrompt(system: string, user: string, model: string): Promise<{ text: string; tokensUsed?: number }> {
    console.log('[AI] Using Mock AI Adapter for testing...');
    
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResponse = [
      {
        stimulus: 'Di sebuah toko alat tulis, Adi membeli 3 buku dan 2 pensil seharga Rp 18.000. Banu membeli 2 buku dan 5 pensil seharga Rp 23.000.',
        soal: 'Jika Candra ingin membeli 4 buku dan 3 pensil di toko yang sama, jumlah uang yang harus dibayar Candra adalah...',
        opsi: {
          A: 'Rp 22.000',
          B: 'Rp 24.000',
          C: 'Rp 25.000',
          D: 'Rp 26.000',
          E: 'Rp 28.000',
        },
        kunci_jawaban: 'C',
        pembahasan: 'Misalkan buku = x, pensil = y.\nSistem persamaan:\n3x + 2y = 18.000 (x2 -> 6x + 4y = 36.000)\n2x + 5y = 23.000 (x3 -> 6x + 15y = 69.000)\n---------------------------------------- -\nSelisih: 11y = 33.000 -> y = 3.000 (harga pensil)\nSubstitusi y: 3x + 2(3.000) = 18.000 -> 3x = 12.000 -> x = 4.000 (harga buku).\nUntuk 4x + 3y = 4(4.000) + 3(3.000) = 16.000 + 9.000 = 25.000.',
        subtes: 'Penalaran Matematika',
        topik: 'Sistem Persamaan',
        difficulty: 'MEDIUM',
        tipe: 'PG',
      },
    ];

    return { text: JSON.stringify(mockResponse), tokensUsed: 400 };
  }
}

export class AIProviderService {
  private adapter: AIAdapter;

  constructor() {
    const provider = process.env.AI_PROVIDER || 'gemini';
    if (provider === 'gemini') {
      this.adapter = new GeminiAdapter();
    } else {
      this.adapter = new MockAIAdapter();
    }
  }

  async generateQuestions(
    skill: AISkill,
    config: {
      subtes: string;
      topik: string[];
      difficulty: string;
      tipe: string;
      jumlah: number;
      model?: string;
    }
  ): Promise<{ questions: GeneratedQuestion[]; tokensUsed: number; costEstimate: number }> {
    const systemPrompt = this.buildSystemPrompt(skill);
    const userPrompt = this.buildUserPrompt(config);

    const activeModel = config.model || process.env.AI_DEFAULT_MODEL || 'gemini-2.5-flash';
    const { text, tokensUsed = 0 } = await this.adapter.sendPrompt(systemPrompt, userPrompt, activeModel);

    // Clean JSON response (strip markdown ticks if present)
    const cleanedText = text
      .trim()
      .replace(/^```json/gi, '')
      .replace(/^```/gi, '')
      .replace(/```$/gi, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanedText);
      const validated = z.array(GeneratedQuestionSchema).parse(parsed);

      // Calculate cost
      const costEstimate = this.estimateCost(tokensUsed, activeModel);

      return {
        questions: validated,
        tokensUsed,
        costEstimate,
      };
    } catch (err: any) {
      console.error('[AI] JSON Parse or Validation Error:', err, '\nRaw text was:\n', text);
      throw new AppError(
        'Format jawaban dari AI tidak valid. Gagal melakukan parsing JSON.',
        500,
        'AI_PARSE_ERROR'
      );
    }
  }

  public estimateCost(tokens: number, model: string): number {
    // Pricing references (input + output blended rate per token)
    // gemini-2.5-flash: ~$0.15 per 1M tokens combined average
    if (model.includes('gemini-2.5-flash')) {
      return (tokens / 1_000_000) * 0.15;
    }
    // gemini-1.5-pro: ~$2.50 per 1M tokens
    if (model.includes('pro')) {
      return (tokens / 1_000_000) * 2.50;
    }
    // standard default
    return (tokens / 1_000_000) * 0.20;
  }

  private buildSystemPrompt(skill: AISkill): string {
    const examples = skill.contohSoalJson ? JSON.stringify(skill.contohSoalJson, null, 2) : '[]';
    return `
[SYSTEM ROLE]
Kamu adalah pembuat soal UTBK-SNBT profesional untuk platform Stubia.id.
Tugas kamu: membuat soal berkualitas tinggi yang menguji kemampuan penalaran kritis siswa, bukan sekadar hafalan kering.

[INSTRUKSI AKADEMIK SKILL]
${skill.instruksiSoal}

[CONTOH REFERENSI SOAL (FEW-SHOT EXAMPLES)]
${examples}

[LARANGAN KERAS]
${skill.larangan || 'Tidak ada larangan khusus.'}

[FORMAT OUTPUT — WAJIB HANYA JSON]
Kembalikan HANYA array JSON valid tanpa penjelasan teks lain, tanpa markdown format block "html" atau text di luar JSON. Jangan memberikan pembungkus markdown (seperti \`\`\`json). Kembalikan langsung array raw JSON.
Schema per objek soal harus persis seperti ini:
{
  "stimulus": "Teks pengantar atau bacaan cerita kasus. Bisa null atau string kosong jika tidak butuh.",
  "soal": "Teks pertanyaan yang diajukan secara mendalam.",
  "opsi": {
    "A": "Pilihan A",
    "B": "Pilihan B",
    "C": "Pilihan C",
    "D": "Pilihan D",
    "E": "Pilihan E (bisa null jika tipe soal bukan PG 5 opsi)"
  },
  "kunci_jawaban": "Kunci jawaban, contoh: 'A', 'B', 'C' dst. (Bisa berupa kombinasi dipisah koma untuk PGK, misal: 'A,C')",
  "pembahasan": "Pembahasan lengkap dan penjelasan logis langkah demi langkah.",
  "subtes": "Subtes yang diuji",
  "topik": "Topik spesifik soal",
  "difficulty": "EASY" atau "MEDIUM" atau "HOTS",
  "tipe": "PG" atau "PGK" atau "BS" atau "ISIAN"
}
    `.trim();
  }

  private buildUserPrompt(config: {
    subtes: string;
    topik: string[];
    difficulty: string;
    tipe: string;
    jumlah: number;
  }): string {
    return `
Buatkan ${config.jumlah} soal UTBK baru dengan kriteria berikut:
- Subtes: ${config.subtes}
- Topik: ${config.topik.join(', ')}
- Tingkat Kesulitan: ${config.difficulty}
- Tipe Soal: ${config.tipe}

Pastikan setiap soal:
1. Sesuai dengan instruksi akademik dan larangan di system prompt.
2. Memiliki pembahasan yang detail dan mudah dipahami.
3. Memiliki opsi pengecoh yang masuk akal dan kuat.
4. Menggunakan bahasa Indonesia yang baku sesuai PUEBI.

Kembalikan HANYA array JSON berisi ${config.jumlah} objek soal.
    `.trim();
  }
}
