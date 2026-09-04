import { z } from 'zod';
import { AISkill } from '@prisma/client';
import { setGlobalDispatcher, Agent } from 'undici';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';

// Configure resilient global dispatcher with realistic 90s timeout (never hang for 10 minutes!)
try {
  setGlobalDispatcher(
    new Agent({
      headersTimeout: 90_000, // 90 seconds max header wait
      bodyTimeout: 90_000, // 90 seconds max body wait
      connectTimeout: 30_000, // 30 seconds connect timeout
    })
  );
} catch (e) {
  console.warn('[AI] Could not set undici global dispatcher:', e);
}

// Normalization helpers for AI output
const normalizeDifficulty = (val: any): 'EASY' | 'MEDIUM' | 'HOTS' => {
  const str = String(val || '').toUpperCase().trim();
  if (str === 'EASY' || str === 'MUDAH') return 'EASY';
  if (str === 'HOTS' || str === 'SULIT' || str === 'HARD') return 'HOTS';
  return 'MEDIUM';
};

const normalizeTipe = (val: any, tipeTka?: any): 'PG' | 'PGK' | 'BS' | 'ISIAN' => {
  const str = String(tipeTka || val || '').toUpperCase().trim();
  if (str === 'MULTIPLE_CHOICE' || str === 'PG' || str === 'PILIHAN GANDA') return 'PG';
  if (str === 'COMPLEX_MC_TF' || str === 'PGK' || str === 'PILIHAN GANDA KOMPLEKS') return 'PGK';
  if (str === 'COMPLEX_MC_MULTI' || str === 'BS' || str === 'BENAR SALAH') return 'BS';
  if (str === 'ISIAN' || str === 'ISIAN SINGKAT') return 'ISIAN';
  return 'PG';
};

// Zod Schema for Validating AI Output per Question with robust transforms
export const GeneratedQuestionSchema = z.object({
  stimulus: z.any().transform(v => (v !== null && v !== undefined ? String(v).trim() : '')),
  soal: z.any().transform(v => String(v || '').trim()),
  opsi: z.any().transform((val) => {
    if (!val || typeof val !== 'object') {
      return { A: '', B: '', C: '', D: '', E: '' };
    }
    return {
      A: String(val.A || '').trim(),
      B: String(val.B || '').trim(),
      C: String(val.C || '').trim(),
      D: String(val.D || '').trim(),
      E: val.E !== undefined && val.E !== null ? String(val.E).trim() : '',
    };
  }),
  kunci_jawaban: z.any().transform(v => String(v || '').trim()),
  pembahasan: z.any().transform(v => String(v || '').trim()),
  subtes: z.any().transform(v => String(v || '').trim()),
  topik: z.any().transform(v => String(v || '').trim()),
  difficulty: z.any().transform(normalizeDifficulty),
  tipe: z.any().transform((v) => normalizeTipe(v)),
  materi: z.any().transform(v => (v ? String(v).trim() : undefined)).optional(),
  tipe_soal_tka: z.any().transform(v => (v ? String(v).trim() : undefined)).optional(),
  tingkat_kesulitan: z.any().transform(v => (v ? String(v).trim() : undefined)).optional(),
  label_kolom: z.any().transform(v => (v ? String(v).trim() : undefined)).optional(),
  prompt_gambar: z.any().transform(v => (v ? String(v).trim() : undefined)).optional(),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export interface AIAdapter {
  sendPrompt(system: string, user: string, model: string): Promise<{ text: string; tokensUsed?: number }>;
}

export class OpenAICompatibleAdapter implements AIAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.baseUrl = (process.env.AI_BASE_URL || 'https://api.9router.com/v1').trim().replace(/\/+$/, '');
  }

  private getEndpointUrl(): string {
    return this.baseUrl.endsWith('/chat/completions') ? this.baseUrl : `${this.baseUrl}/chat/completions`;
  }

  async sendPrompt(system: string, user: string, model: string): Promise<{ text: string; tokensUsed?: number }> {
    const isCombo = !model || model === 'stubia-v.1' || model === 'smart-combo' || model === 'combo';
    
    // Priority order using user's 9router combos with multi-tier fallback
    const comboCascade = [
      'stubia-v.1',         // User's 9router custom combo: Sonnet 4.5 -> Sonnet 4.6 -> Gemini Flash
      'claude-sonnet-4.6',  // User's 9router combo: Sonnet 4.6 -> Sonnet 4.5
      'gemini-flash-3.8',   // User's 9router combo: Gemini Flash -> Sonnet 4.5
      'gh/gpt-4o',          // Standalone fast fallback
      'claude-opus-4.6',    // User's 9router combo: Opus Thinking
    ];
    const modelsToTry = isCombo
      ? comboCascade
      : [model, ...comboCascade.filter((m) => m !== model)];

    const endpoint = this.getEndpointUrl();
    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const activeModel = modelsToTry[i];
      const isLast = i === modelsToTry.length - 1;
      console.log(`[AI Smart Combo] Trying model ${i + 1}/${modelsToTry.length}: ${activeModel}`);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: activeModel,
            stream: false,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            temperature: 0.85,
            max_tokens: 8192,
          }),
          signal: AbortSignal.timeout(75_000), // 75-second hard limit per model
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[AI Smart Combo] Model ${activeModel} error HTTP ${response.status}: ${errBody.substring(0, 150)}`);
          if (response.status === 401) {
            throw new AppError(`AI Provider authentication error: ${errBody.substring(0, 200)}`, 401, 'AI_PROVIDER_ERROR');
          }
          lastError = new Error(`HTTP ${response.status} from ${activeModel}`);
          if (!isLast) {
            console.log(`[AI Smart Combo] Auto-failover: switching to next model in chain...`);
            continue; // Failover to next model in combo!
          }
        } else {
          const rawResponseText = await response.text();
          let text = '';
          let tokensUsed = 0;

          try {
            const data = JSON.parse(rawResponseText);
            text = data.choices?.[0]?.message?.content || '';
            tokensUsed = data.usage?.total_tokens || 0;
          } catch (parseErr) {
            // Fallback: handle SSE streaming data
            const lines = rawResponseText.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const chunk = JSON.parse(trimmed.substring(6));
                  const delta = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.text || '';
                  text += delta;
                } catch {}
              }
            }
          }

          if (!text || text.trim().length === 0) {
            console.warn(`[AI Smart Combo] Model ${activeModel} returned empty response.`);
            if (!isLast) continue;
          } else {
            console.log(`[AI Smart Combo] Success with ${activeModel}! (${text.length} chars, ${tokensUsed} tokens)`);
            return { text, tokensUsed };
          }
        }
      } catch (err: any) {
        if (err instanceof AppError && err.statusCode === 401) throw err;
        lastError = err;
        console.warn(`[AI Smart Combo] Model ${activeModel} request failed: ${err.message}.`);
        if (!isLast) {
          console.log(`[AI Smart Combo] Auto-failover: immediately switching to next model...`);
          continue;
        }
      }
    }

    throw new AppError(`Seluruh model AI combo gagal merespons: ${lastError?.message || 'Koneksi terputus'}`, 502, 'AI_CONNECTION_ERROR');
  }
}

export class GeminiAdapter implements AIAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').trim().replace(/\/+$/, '');
  }

  async sendPrompt(system: string, user: string, model: string): Promise<{ text: string; tokensUsed?: number }> {
    const activeModel = model || 'gemini-2.5-flash';
    const url = `${this.baseUrl}/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${system}\n\n${user}` }],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 8192,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('[AI] Gemini API Error:', response.status, errBody);
        throw new AppError(
          `Gemini API error (${response.status}): ${errBody.substring(0, 200)}`,
          response.status === 401 ? 401 : 502,
          'GEMINI_ERROR'
        );
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

      if (!text) {
        throw new AppError('Gemini API returned empty response.', 502, 'AI_PROVIDER_EMPTY');
      }

      return { text, tokensUsed };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Failed to connect to Gemini: ${err.message}`, 502, 'AI_CONNECTION_ERROR');
    }
  }
}

export class MockAIAdapter implements AIAdapter {
  async sendPrompt(system: string, user: string, model: string): Promise<{ text: string; tokensUsed?: number }> {
    console.log('[AI] Mock Adapter used with prompt:', { system: system.substring(0, 50), user: user.substring(0, 50), model });
    await new Promise((r) => setTimeout(r, 1200));

    const mockOutput = [
      {
        stimulus: 'Sebuah tangki penampungan air berbentuk silinder memiliki diameter 14 meter dan tinggi 10 meter.',
        soal: 'Berapakah volume air maksimum yang dapat ditampung dalam tangki tersebut? (Gunakan pi = 22/7)',
        opsi: {
          A: '1.540 meter kubik',
          B: '1.450 meter kubik',
          C: '770 meter kubik',
          D: '616 meter kubik',
          E: '308 meter kubik',
        },
        kunci_jawaban: 'A',
        pembahasan: 'Jari-jari r = 14 / 2 = 7 m. Volume = pi * r^2 * t = (22/7) * 7^2 * 10 = 22 * 7 * 10 = 1.540 m3.',
        subtes: 'Penalaran Matematika',
        topik: 'Geometri dan Pengukuran',
        difficulty: 'EASY',
        tipe: 'PG',
        materi: 'Geometri - Volume Tabung',
        tipe_soal_tka: 'multiple_choice',
        tingkat_kesulitan: 'Mudah',
        label_kolom: '',
        prompt_gambar: '',
      },
    ];

    return {
      text: JSON.stringify(mockOutput),
      tokensUsed: 420,
    };
  }
}

export class AIProviderService {
  private adapter: AIAdapter;

  constructor() {
    const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
    if (provider === 'gemini') {
      this.adapter = new GeminiAdapter();
    } else if (provider === 'mock') {
      this.adapter = new MockAIAdapter();
    } else {
      this.adapter = new OpenAICompatibleAdapter();
    }
  }

  async generateQuestions(
    skill: AISkill,
    config: {
      subtes: string;
      topik: string[];
      materi?: string;
      materiList?: string[];
      difficulty: string;
      difficultyDistribution?: { EASY: number; MEDIUM: number; HOTS: number };
      tipe?: string;
      tipes?: string[];
      typesDistribution?: Record<string, number>;
      jumlah: number;
      reuseStimulus?: boolean;
      questionsPerStimulus?: number;
      includeImagePrompts?: boolean;
      model?: string;
    }
  ): Promise<{ questions: GeneratedQuestion[]; tokensUsed: number; costEstimate: number }> {
    const totalJumlah = config.jumlah;
    const batchSize = config.questionsPerStimulus || (totalJumlah >= 10 ? 5 : totalJumlah);

    const materiList = config.materiList && config.materiList.length > 0
      ? config.materiList
      : (config.materi ? [config.materi] : []);

    // Query recent stimuli from database to prevent generating identical/duplicate stories
    let recentStimuli: string[] = [];
    try {
      const recentQuestions = await prisma.question.findMany({
        where: {
          stimulus: { not: '' },
          subtes: config.subtes || skill.subtes,
        },
        select: { stimulus: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const uniqueSet = new Set<string>();
      for (const rq of recentQuestions) {
        if (rq.stimulus) {
          const clean = rq.stimulus.replace(/<[^>]*>/g, '').trim();
          if (clean.length > 30) {
            uniqueSet.add(clean.substring(0, 100) + '...');
          }
        }
      }
      recentStimuli = Array.from(uniqueSet).slice(0, 8);
    } catch {}

    // If total questions is large (> 6) and reuseStimulus is active, split into parallel batches
    // This prevents token truncation and generates all 30 questions in seconds
    if (totalJumlah > 6 && config.reuseStimulus !== false) {
      const batches: Array<{
        batchJumlah: number;
        batchTopik: string[];
        batchMateri?: string;
      }> = [];

      let remaining = totalJumlah;
      let batchIndex = 0;

      while (remaining > 0) {
        const currentBatchCount = Math.min(batchSize, remaining);
        const topic = config.topik.length > 0
          ? [config.topik[batchIndex % config.topik.length]]
          : [];
        const batchMateri = materiList.length > 0
          ? materiList[batchIndex % materiList.length]
          : undefined;

        batches.push({
          batchJumlah: currentBatchCount,
          batchTopik: topic.length > 0 ? topic : config.topik,
          batchMateri: batchMateri,
        });
        remaining -= currentBatchCount;
        batchIndex++;
      }

      console.log(`[AI] Dispatching ${batches.length} batches for ${totalJumlah} questions with materi allocation:`, batches.map(b => b.batchMateri));

      // Execute batches with controlled concurrency (max 3 concurrent requests)
      // for fast throughput while avoiding server connection drops.
      const CONCURRENCY_LIMIT = 3;
      const batchResults: Array<{ questions: GeneratedQuestion[]; tokensUsed: number; costEstimate: number } | null> = new Array(batches.length).fill(null);
      let nextBatchIdx = 0;

      const worker = async () => {
        while (nextBatchIdx < batches.length) {
          const idx = nextBatchIdx++;
          const b = batches[idx];
          console.log(`[AI] Executing batch #${idx + 1}/${batches.length} (${b.batchJumlah} questions, materi: "${b.batchMateri || 'default'}")`);
          try {
            const res = await this.generateSingleBatch(skill, {
              ...config,
              jumlah: b.batchJumlah,
              topik: b.batchTopik,
              materi: b.batchMateri,
              questionsPerStimulus: b.batchJumlah,
              recentStimuli,
            });
            batchResults[idx] = res;
            console.log(`[AI] Batch #${idx + 1}/${batches.length} succeeded (${res.questions.length} questions generated).`);
          } catch (batchErr: any) {
            console.error(`[AI] Batch #${idx + 1}/${batches.length} failed:`, batchErr.message || batchErr);
            batchResults[idx] = null;
          }
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, batches.length) }, () => worker());
      await Promise.all(workers);

      let allQuestions: GeneratedQuestion[] = [];
      let totalTokens = 0;
      let totalCost = 0;

      for (const res of batchResults) {
        if (res && Array.isArray(res.questions)) {
          allQuestions.push(...res.questions);
          totalTokens += res.tokensUsed || 0;
          totalCost += res.costEstimate || 0;
        }
      }

      // If any batch generated fewer questions, run a guaranteed backfill loop (up to 3 attempts)
      let backfillAttempt = 0;
      while (allQuestions.length < totalJumlah && backfillAttempt < 3) {
        backfillAttempt++;
        const deficit = totalJumlah - allQuestions.length;
        console.log(`[AI] Deficit detected: generated ${allQuestions.length}/${totalJumlah} questions. Running backfill attempt #${backfillAttempt} for ${deficit} questions...`);
        try {
          const backfillMateri = materiList.length > 0
            ? materiList[(batches.length + backfillAttempt) % materiList.length]
            : config.materi;
          const backfill = await this.generateSingleBatch(skill, {
            ...config,
            jumlah: deficit,
            topik: config.topik.length > 0 ? [config.topik[(batches.length + backfillAttempt) % config.topik.length]] : [],
            materi: backfillMateri,
            reuseStimulus: deficit >= 2,
            questionsPerStimulus: deficit,
            recentStimuli,
          });

          if (backfill.questions.length > 0) {
            allQuestions.push(...backfill.questions);
            totalTokens += backfill.tokensUsed;
            totalCost += backfill.costEstimate;
          }
        } catch (backfillErr: any) {
          console.warn(`[AI] Backfill attempt #${backfillAttempt} notice:`, backfillErr.message || backfillErr);
        }
      }

      if (allQuestions.length === 0) {
        throw new AppError('AI provider gagal menghasilkan soal setelah beberapa percobaan. Silakan coba lagi.', 502, 'AI_PROVIDER_ERROR');
      }

      // Ensure exact count match
      if (allQuestions.length > totalJumlah) {
        allQuestions = allQuestions.slice(0, totalJumlah);
      }

      console.log(`[AI] Generation finished with ${allQuestions.length}/${totalJumlah} questions.`);

      return {
        questions: allQuestions,
        tokensUsed: totalTokens,
        costEstimate: totalCost,
      };
    }

    // Small batch execution (<= 6 questions)
    return this.generateSingleBatch(skill, { ...config, recentStimuli });
  }

  private async generateSingleBatch(
    skill: AISkill,
    config: {
      subtes: string;
      topik: string[];
      materi?: string;
      difficulty: string;
      difficultyDistribution?: { EASY: number; MEDIUM: number; HOTS: number };
      tipe?: string;
      tipes?: string[];
      typesDistribution?: Record<string, number>;
      jumlah: number;
      reuseStimulus?: boolean;
      questionsPerStimulus?: number;
      includeImagePrompts?: boolean;
      recentStimuli?: string[];
      model?: string;
    }
  ): Promise<{ questions: GeneratedQuestion[]; tokensUsed: number; costEstimate: number }> {
    const systemPrompt = this.buildSystemPrompt(skill, config.includeImagePrompts);
    const userPrompt = this.buildUserPrompt(config);

    const activeModel = config.model || process.env.AI_DEFAULT_MODEL || 'opus-4.6';
    const { text, tokensUsed = 0 } = await this.adapter.sendPrompt(systemPrompt, userPrompt, activeModel);

    try {
      const items = this.extractJsonQuestions(text);
      const validated = z.array(GeneratedQuestionSchema).parse(items);
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

  private extractJsonQuestions(rawText: string): any[] {
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    // 1. Direct JSON.parse
    try {
      const parsed = JSON.parse(cleanedText);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.questions)) return parsed.questions;
        else if (Array.isArray(parsed.soal)) return parsed.soal;
        else if (Array.isArray(parsed.data)) return parsed.data;
        else return [parsed];
      }
    } catch {}

    // 2. Substring between outermost '[' and ']'
    const startArr = cleanedText.indexOf('[');
    const endArr = cleanedText.lastIndexOf(']');
    if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
      try {
        const arrChunk = cleanedText.substring(startArr, endArr + 1);
        const parsedArr = JSON.parse(arrChunk);
        if (Array.isArray(parsedArr)) return parsedArr;
      } catch {}
    }

    // 3. Robust recovery: extract all individual complete JSON objects { ... }
    const recovered: any[] = [];
    let depth = 0;
    let inString = false;
    let escape = false;
    let objStart = -1;

    for (let i = 0; i < cleanedText.length; i++) {
      const char = cleanedText[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          if (depth === 0) {
            objStart = i;
          }
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && objStart !== -1) {
            const objChunk = cleanedText.substring(objStart, i + 1);
            try {
              const parsedObj = JSON.parse(objChunk);
              if (parsedObj && typeof parsedObj === 'object' && (parsedObj.soal || parsedObj.stimulus || parsedObj.opsi)) {
                recovered.push(parsedObj);
              }
            } catch {}
            objStart = -1;
          }
        }
      }
    }

    if (recovered.length > 0) {
      return recovered;
    }

    throw new Error('No valid question objects found in response text');
  }

  public estimateCost(tokens: number, model: string): number {
    const lower = model.toLowerCase();
    // Claude Opus pricing estimate: ~$15.00 per 1M tokens
    if (lower.includes('opus')) {
      return (tokens / 1_000_000) * 15.0;
    }
    // Claude Sonnet pricing estimate: ~$3.00 per 1M tokens
    if (lower.includes('sonnet')) {
      return (tokens / 1_000_000) * 3.0;
    }
    // gemini-2.5-flash: ~$0.15 per 1M tokens combined average
    if (lower.includes('flash')) {
      return (tokens / 1_000_000) * 0.15;
    }
    // gemini-1.5-pro: ~$2.50 per 1M tokens
    if (lower.includes('pro')) {
      return (tokens / 1_000_000) * 2.50;
    }
    // standard default
    return (tokens / 1_000_000) * 1.00;
  }

  private buildSystemPrompt(skill: AISkill, includeImagePrompts?: boolean): string {
    const examples = skill.contohSoalJson ? JSON.stringify(skill.contohSoalJson, null, 2) : '[]';
    return `
[SYSTEM ROLE]
Kamu adalah pembuat soal UTBK-SNBT dan TKA SMA profesional untuk platform Stubia.id.
Tugas kamu: membuat soal berkualitas tinggi yang menguji kemampuan penalaran kritis dan pemahaman wacana siswa secara mendalam.

[INSTRUKSI AKADEMIK SKILL]
${skill.instruksiSoal}

[CONTOH REFERENSI SOAL (FEW-SHOT EXAMPLES)]
${examples}

[PANDUAN ANTI-PLAGIARISME & KEUNIKAN WACANA — WAJIB 100% ORISINAL]
1. DILARANG KERAS menyalin, mengutip, atau meniru teks stimulus wacana yang ada pada [CONTOH REFERENSI SOAL (FEW-SHOT EXAMPLES)]! Contoh referensi HANYA untuk mempelajari format JSON dan gaya butir soal, BUKAN untuk ditiru alur ceritanya.
2. Setiap kali dipanggil, kamu WAJIB menciptakan teks stimulus/wacana (panjang 250–300 kata), cerita, data riset, latar kasus, dan nama tokoh yang 100% BARU, SEGAR, dan BELUM PERNAH ADA SEBELUMNYA.
3. DILARANG mengulang wacana dengan topik yang sama berulang kali (misal: jangan selalu tentang perubahan iklim batubara atau tentang Pak Raden). Eksplorasi tema-tema beragam: bioteknologi terbarukan, arkeologi maritim, etnobotani nusantara, astrofisika, sastra modern, sosiologi perkotaan, seni tradisi daerah, psikologi kognitif, keanekaragaman hayati, dan ekonomi sirkular.

[LARANGAN KERAS]
${skill.larangan || 'Tidak ada larangan khusus.'}

[PANDUAN JUMLAH BUTIR SOAL — WAJIB PERSIS]
Array JSON yang kamu hasilkan WAJIB berisi persis sejumlah N elemen objek soal yang diminta pada user prompt. DILARANG berhenti di tengah jalan atau mengurangi jumlah soal. Jika diminta 5 soal, hasilkan TEPAT 5 objek soal lengkap di dalam array.

[FORMAT OUTPUT — WAJIB HANYA JSON]
Kembalikan HANYA array JSON valid tanpa penjelasan teks lain, tanpa markdown format block "html" atau text di luar JSON. Jangan memberikan pembungkus markdown (seperti \`\`\`json). Kembalikan langsung array raw JSON.
Schema per objek soal harus persis seperti ini:
{
  "stimulus": "Teks pengantar atau bacaan cerita kasus (250–300 kata). Tulis teks lengkap di setiap soal.",
  "soal": "Teks pertanyaan yang diajukan secara mendalam.",
  "opsi": {
    "A": "Pilihan A",
    "B": "Pilihan B",
    "C": "Pilihan C",
    "D": "Pilihan D",
    "E": "Pilihan E (bisa string kosong jika bukan PG 5 opsi)"
  },
  "kunci_jawaban": "Kunci jawaban sesuai tipe soal: 1 huruf ('A') untuk PG, multi huruf ('A, B') untuk complex_mc_multi, pasangan ('A:B, B:S, C:B, D:S, E:B') untuk complex_mc_tf.",
  "pembahasan": "Pembahasan lengkap dan penjelasan logis langkah demi langkah.",
  "subtes": "Subtes yang diuji",
  "topik": "Topik spesifik soal",
  "difficulty": "EASY" atau "MEDIUM" atau "HOTS",
  "tipe": "PG" atau "PGK" atau "BS" atau "ISIAN",
  "materi": "Format: TOPIK - Materinya (misal: 'Pemahaman Tekstual - Teks Puisi')",
  "tipe_soal_tka": "multiple_choice" atau "complex_mc_tf" atau "complex_mc_multi" atau "ISIAN",
  "tingkat_kesulitan": "MUDAH" atau "SEDANG" atau "SULIT",
  "label_kolom": "Contoh: 'TEPAT / TIDAK TEPAT', 'BENAR / SALAH', 'SESUAI / TIDAK SESUAI', 'YA / TIDAK'",
  "prompt_gambar": "Opsional. Jika soal berbasis infografis, grafik data, tabel visual, bagan alur, ilustrasi sastra, atau komik strip, berikan deskripsi prompt gambar yang sangat detail untuk AI Image Generator (misal: 'Infografis vertikal bertema emisi karbon dengan diagram batang tren 2015-2024 dan 3 ikon energi terbarukan'). Jika tidak memerlukan gambar (murni teks), isi null atau string kosong \"\"."
}
    `.trim();
  }

  private buildUserPrompt(config: {
    subtes: string;
    topik: string[];
    materi?: string;
    difficulty: string;
    difficultyDistribution?: { EASY: number; MEDIUM: number; HOTS: number };
    tipe?: string;
    tipes?: string[];
    typesDistribution?: Record<string, number>;
    jumlah: number;
    reuseStimulus?: boolean;
    questionsPerStimulus?: number;
    includeImagePrompts?: boolean;
    recentStimuli?: string[];
  }): string {
    const selectedTypes = config.tipes && config.tipes.length > 0 
      ? config.tipes 
      : (config.tipe ? [config.tipe] : ['PG']);
    
    const typesStr = selectedTypes.join(', ');
    const reuse = config.reuseStimulus !== undefined ? config.reuseStimulus : (config.jumlah >= 3);
    const qPerStimulus = config.questionsPerStimulus || (config.jumlah >= 10 ? 5 : Math.min(3, config.jumlah));
    const stimulusCount = Math.ceil(config.jumlah / qPerStimulus);

    let stimulusGuideline = '';
    if (reuse && config.jumlah >= 2) {
      stimulusGuideline = `
[ATURAN PENGELOMPOKAN STIMULUS (1 STIMULUS UNTUK ${qPerStimulus} SOAL)]
- Kelompokkan soal per teks stimulus: Buat 1 teks stimulus mendalam (panjang 250–300 kata, otentik dengan konteks wacana), lalu gunakan teks tersebut untuk PERSIS ${qPerStimulus} nomor soal berturut-turut sebelum membuat teks stimulus baru.
- Untuk total ${config.jumlah} soal dengan ${qPerStimulus} soal per stimulus, kamu akan menghasilkan sekitar ${stimulusCount} teks wacana/stimulus berbeda.
- Siswa tidak perlu membaca teks baru di tiap nomor.
- PENTING: Tuliskan teks stimulus LENGKAP yang sama pada setiap objek soal dalam kelompok tersebut (jangan kosongkan atau ganti teks referensi) agar setiap baris data mandiri.`;
    }

    let materiGuideline = '';
    if (config.materi && config.materi.trim()) {
      materiGuideline = `
[FOKUS MATERI SPESIFIK]
- Fokuskan seluruh teks stimulus/wacana dan butir pertanyaan soal pada materi khusus: "${config.materi.trim()}".
- Pastikan field "materi" pada setiap objek JSON diisi dengan format: "${config.topik[0] || config.subtes} - ${config.materi.trim()}".`;
    } else {
      materiGuideline = `
[PANDUAN MATERI (DEFAULT / OTOMATIS BERVARIASI)]
- Buat materi wacana dan butir soal yang bervariasi secara proporsional sesuai cakupan topik (${config.topik.join(', ')}), seperti Teks Puisi, Teks Dongeng / Cerita Rakyat, Teks Cerpen & Fabel, Teks Berita & Eksplanasi, Teks Editorial & Opini, Teks Biografi, atau Artikel Ilmiah Populer.
- Isi field "materi" pada setiap objek JSON dengan format: "[Topik] - [Nama Materinya]" (misal: "${config.topik[0] || config.subtes} - Teks Puisi" atau "${config.topik[0] || config.subtes} - Teks Dongeng").`;
    }

    let antiRepetitionGuideline = '';
    if (config.recentStimuli && config.recentStimuli.length > 0) {
      const list = config.recentStimuli.map((s) => `  * "${s}"`).join('\n');
      antiRepetitionGuideline = `
[ANTI-DUPLIKASI: WACANA BERIKUT SUDAH ADA DI DATABASE — DILARANG DIBUAT SERUPA]
${list}
- Ciptakan wacana dengan alur cerita, tokoh, sudut pandang, data riset, atau tema yang 100% BARU dan BERBEDA dari daftar di atas!`;
    }

    let imagePromptGuideline = '';
    if (config.includeImagePrompts) {
      imagePromptGuideline = `
[PANDUAN PROMPT GAMBAR / INFOGRAFIS (AKTIF)]
- Soal atau stimulus dapat dilengkapi dengan infografis, diagram alur, grafik data, ilustrasi cerita, atau bagan visual pendukung.
- Untuk setiap soal atau stimulus yang membutuhkan visualisasi gambar/infografis, WAJIB isi field "prompt_gambar" dengan deskripsi visual yang sangat detail, jelas, dan siap dimasukkan ke AI Image Generator.
- Jika soal tertentu murni berbasis teks tanpa perlu gambar, isi "prompt_gambar": "".`;
    }

    let difficultyGuideline = '';
    if (config.difficultyDistribution) {
      const { EASY = 30, MEDIUM = 50, HOTS = 20 } = config.difficultyDistribution;
      const countEasy = Math.max(1, Math.round((EASY / 100) * config.jumlah));
      const countHots = Math.max(1, Math.round((HOTS / 100) * config.jumlah));
      const countMedium = Math.max(0, config.jumlah - countEasy - countHots);

      difficultyGuideline = `
[KOMPOSISI TINGKAT KESULITAN WAJIB MERATA SESUAI TARGET]
- Total ${config.jumlah} soal HARUS didistribusikan ke dalam 3 tingkat kesulitan sesuai target berikut:
  * MUDAH (EASY): ${countEasy} soal
  * SEDANG (MEDIUM): ${countMedium} soal
  * SULIT (HOTS): ${countHots} soal
- Pastikan nilai field "difficulty" (EASY/MEDIUM/HOTS) dan "tingkat_kesulitan" (MUDAH/SEDANG/SULIT) di setiap objek soal mencerminkan kuota target di atas.`;
    }

    let typeDistributionGuideline = '';
    if (selectedTypes.length > 1) {
      let remainingTypesCount = config.jumlah;
      const typeLines = selectedTypes.map((t, i) => {
        let count: number;
        if (i === selectedTypes.length - 1) {
          count = Math.max(1, remainingTypesCount);
        } else {
          const pct = config.typesDistribution?.[t] || Math.round(100 / selectedTypes.length);
          count = Math.max(1, Math.min(remainingTypesCount - (selectedTypes.length - 1 - i), Math.round((pct / 100) * config.jumlah)));
          remainingTypesCount -= count;
        }
        return `  * ${t}: ${count} soal`;
      }).join('\n');

      typeDistributionGuideline = `
[KOMPOSISI TIPE SOAL WAJIB MERATA / SESUAI TARGET]
- Distribusikan total ${config.jumlah} soal ke dalam tipe-tipe pilihan berikut (Total harus tepat ${config.jumlah} soal):
${typeLines}
- Aturan format kunci per tipe:
  * multiple_choice (PG): Kunci 1 huruf ("A")
  * complex_mc_multi (PG Jawaban Jamak / BS): Kunci huruf-huruf benar dipisah koma ("A, B" atau "A, B, D")
  * complex_mc_tf (PG Kompleks / PGK): Kunci format pasangan "A:B, B:S, C:B, D:S, E:B" (B = Positif/Benar/Tepat/Sesuai/Ya, S = Negatif/Salah/Tidak) dan isi label_kolom (misal: "TEPAT / TIDAK TEPAT").
  * ISIAN: Teks jawaban singkat.`;
    }

    const sessionSalt = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const isEnglish = config.subtes.toLowerCase().includes('inggris') || config.subtes.toLowerCase().includes('english');
    const isFrench = config.subtes.toLowerCase().includes('prancis') || config.subtes.toLowerCase().includes('french');
    const isGerman = config.subtes.toLowerCase().includes('jerman') || config.subtes.toLowerCase().includes('german') || config.subtes.toLowerCase().includes('deutsch');
    const isJapanese = config.subtes.toLowerCase().includes('jepang') || config.subtes.toLowerCase().includes('japanese') || config.subtes.toLowerCase().includes('nihongo');
    const isKorean = config.subtes.toLowerCase().includes('korea') || config.subtes.toLowerCase().includes('korean') || config.subtes.toLowerCase().includes('hangugeo') || config.subtes.toLowerCase().includes('hangul');
    const isArabic = config.subtes.toLowerCase().includes('arab') || config.subtes.toLowerCase().includes('arabic');

    const englishSpecificSection = isEnglish ? `
[ATURAN BAHASA KHUSUS MAPEL BAHASA INGGRIS — WAJIB DIPATUHI]
- Teks STIMULUS (Reading Passage): WAJIB 100% BAHASA INGGRIS otentik.
- Kalimat SOAL (Question Stem): WAJIB 100% BAHASA INGGRIS (DILARANG menggunakan Bahasa Indonesia untuk pertanyaan!).
- Pilihan OPSI JAWABAN (A, B, C, D, E): WAJIB 100% BAHASA INGGRIS (DILARANG menggunakan Bahasa Indonesia untuk opsi!).
- Teks PEMBAHASAN: WAJIB BAHASA INDONESIA (berisi penjelasan alasan kunci jawaban benar dan rujukan kalimat bukti dalam teks bahasa Inggris).
- Label Kolom (untuk tipe complex_mc_tf): Gunakan "TRUE / FALSE" atau "SESUAI / TIDAK SESUAI".
` : '';

    const frenchSpecificSection = isFrench ? `
[ATURAN BAHASA KHUSUS MAPEL BAHASA PRANCIS — WAJIB DIPATUHI 100%]
- Teks STIMULUS (Compréhension Écrite): WAJIB 100% BAHASA PRANCIS level A2-2 CECRL (perhatikan aksen: é, è, ê, à, ç, ô, û).
- Kalimat SOAL (Question Stem): WAJIB 100% BAHASA PRANCIS (DILARANG menggunakan Bahasa Indonesia untuk pertanyaan!).
- Pilihan OPSI JAWABAN (A, B, C, D, E): WAJIB 100% BAHASA PRANCIS (DILARANG menggunakan Bahasa Indonesia untuk opsi!).
- Teks PEMBAHASAN: WAJIB BAHASA INDONESIA (berisi analisis dan kutipan kalimat bukti dari teks bahasa Prancis beserta terjemahan dan alasannya ke Bahasa Indonesia).
- Label Kolom (untuk tipe complex_mc_tf): Gunakan "VRAI / FAUX".
` : '';

    const germanSpecificSection = isGerman ? `
[ATURAN BAHASA KHUSUS MAPEL BAHASA JERMAN — WAJIB DIPATUHI 100%]
- Teks STIMULUS (Leseverstehen): WAJIB 100% BAHASA JERMAN level A1 Plus–A2.1 GER/CEFR (perhatikan huruf khusus ä, ö, ü, ß). Teks sederhana 3–100 kata dengan ragam teks fungsional otentik Jerman (Stundenplan, Fahrkarte, Fahrplan, e-mail, Hinweisschilder, Anzeigen, Kochrezepte, dialog/deskripsi).
- Kalimat SOAL (Question Stem): WAJIB BAHASA INDONESIA (mengikuti konvensi resmi TKA Kemendikdasmen RI).
- Pilihan OPSI JAWABAN (A, B, C, D, E): WAJIB BAHASA INDONESIA, KECUALI pada soal jenis Lückentext (teks rumpang) di mana opsi berisi kata/frasa bahasa Jerman, atau soal Reorganisasi (urutan kalimat a-b-c-d).
- Teks PEMBAHASAN: WAJIB BAHASA INDONESIA (berisi analisis logika kunci jawaban dan rujukan kutipan ke bagian teks bahasa Jerman beserta terjemahan dan penjelasannya).
- Label Kolom (untuk tipe complex_mc_tf): Gunakan "SESUAI / TIDAK SESUAI" atau "BENAR / SALAH".
` : '';

    const japaneseSpecificSection = isJapanese ? `
[ATURAN BAHASA KHUSUS MAPEL BAHASA JEPANG — WAJIB DIPATUHI 100%]
- Teks STIMULUS (Dokkai / 読解): WAJIB BAHASA JEPANG level A1 JF Standard (gunakan kombinasi Hiragana, Katakana, dan Kanji sangat dasar dengan romaji/furigana pendamping, atau teks pendek 5–50 kata seputar kehidupan sehari-hari dan sekolah).
- Kalimat SOAL (Question Stem): WAJIB BAHASA INDONESIA (mengikuti konvensi resmi TKA Kemendikdasmen RI).
- Pilihan OPSI JAWABAN (A, B, C, D, E): WAJIB BAHASA INDONESIA, KECUALI pada soal melengkapi teks rumpang/kosakata Jepang atau Reorganisasi urutan kata (pola Subjek + Objek + Predikat).
- Teks PEMBAHASAN: WAJIB BAHASA INDONESIA (berisi penjelasan logika jawaban, kutipan teks Jepang dengan cara baca romaji dan arti/terjemahan ringkas).
- Label Kolom (untuk tipe complex_mc_tf): Gunakan "SESUAI / TIDAK SESUAI" atau "BENAR / SALAH".
` : '';

    const koreanSpecificSection = isKorean ? `
[ATURAN BAHASA KHUSUS MAPEL BAHASA KOREA — WAJIB DIPATUHI 100%]
- Teks STIMULUS (Ilgi / 읽기): WAJIB HURUF HANGEUL standar level TOPIK I Level 1 / CEFR A1 (maksimal 200 karakter Hangeul, ejaan baku standar 표준어 pyojuneo dan spasi 띄어쓰기 ttieosseugi yang tepat). Format teks berupa wacana pendek, memo, pengumuman, pesan teks, atau dialog sederhana seputar situasi sehari-hari dan sekolah.
- Kalimat SOAL (Question Stem): WAJIB BAHASA INDONESIA (mengikuti konvensi resmi TKA Kemendikdasmen RI).
- Pilihan OPSI JAWABAN (A, B, C, D, E): WAJIB BAHASA INDONESIA, KECUALI pada soal melengkapi teks rumpang/partikel/kosakata Hangeul atau Reorganisasi urutan kata/kalimat.
- Teks PEMBAHASAN: WAJIB BAHASA INDONESIA (berisi penjelasan logika jawaban, kutipan teks Hangeul dengan cara baca dan arti/terjemahan ringkas).
- Label Kolom (untuk tipe complex_mc_tf): Gunakan "SESUAI / TIDAK SESUAI" atau "BENAR / SALAH".
` : '';

    const arabicSpecificSection = isArabic ? `
[ATURAN BAHASA KHUSUS MAPEL BAHASA ARAB — WAJIB DIPATUHI 100%]
- Teks STIMULUS (al-Qirā'ah / القراءة): WAJIB 100% BAHASA ARAB baku (fusha) berharakat lengkap (tasykil) level SMA/MA (teks naratif 25–50 kosakata atau dialog 5–6 kali tanya jawab seputar kehidupan sehari-hari, sekolah, keluarga, hobi, pekerjaan, pelayanan umum, lingkungan, serta dialog persetujuan/perintah/larangan). DILARANG menulis stimulus tanpa harakat!
- Kalimat SOAL (Question Stem): WAJIB BAHASA INDONESIA (mengikuti konvensi resmi TKA Kemendikdasmen RI).
- Pilihan OPSI JAWABAN (A, B, C, D, E): WAJIB BAHASA INDONESIA, KECUALI pada soal sinonim (مرادف), antonim (ضد), arti mufradat kontekstual, Reorganisasi urutan kata/kalimat, atau analisis gramatika nahwu-sharf di mana opsi berisi kata/frasa Bahasa Arab berharakat.
- Teks PEMBAHASAN: WAJIB BAHASA INDONESIA (berisi analisis logika jawaban, kutipan teks Arab berharakat beserta terjemahan/penjelasan kaidah nahwu/sharf).
- Label Kolom (untuk tipe complex_mc_tf): Gunakan "SESUAI / TIDAK SESUAI" atau "BENAR / SALAH".
` : '';

    const languagePoint = isEnglish
      ? '4. KHUSUS BAHASA INGGRIS: Stimulus, kalimat soal (stem), dan seluruh opsi (A–E) WAJIB 100% Bahasa Inggris alami & gramatikal. Kolom PEMBAHASAN WAJIB Bahasa Indonesia.'
      : isFrench
      ? '4. KHUSUS BAHASA PRANCIS: Stimulus, kalimat soal (stem), dan seluruh opsi (A–E) WAJIB 100% Bahasa Prancis level A2-2 CECRL. Kolom PEMBAHASAN WAJIB Bahasa Indonesia.'
      : isGerman
      ? '4. KHUSUS BAHASA JERMAN: Stimulus teks bacaan WAJIB 100% Bahasa Jerman level A1 Plus–A2.1 GER. Kalimat soal, opsi jawaban (kecuali Lückentext/Reorganisasi), dan pembahasan WAJIB Bahasa Indonesia.'
      : isJapanese
      ? '4. KHUSUS BAHASA JEPANG: Stimulus teks bacaan WAJIB Bahasa Jepang level A1 JF Standard (Hiragana/Katakana/Kanji dasar). Kalimat soal, opsi jawaban (kecuali melengkapi kosakata/Reorganisasi), dan pembahasan WAJIB Bahasa Indonesia.'
      : isKorean
      ? '4. KHUSUS BAHASA KOREA: Stimulus teks bacaan WAJIB Huruf Hangeul standar level TOPIK I Level 1. Kalimat soal, opsi jawaban (kecuali melengkapi kosakata/tata bahasa/Reorganisasi), dan pembahasan WAJIB Bahasa Indonesia.'
      : isArabic
      ? '4. KHUSUS BAHASA ARAB: Stimulus teks bacaan WAJIB Bahasa Arab baku (fusha) berharakat lengkap (tasykil). Kalimat soal, opsi jawaban (kecuali sinonim/antonim/mufradat/Reorganisasi/nahwu), dan pembahasan WAJIB Bahasa Indonesia.'
      : '4. Menggunakan bahasa Indonesia yang baku sesuai EYD/PUEBI.';

    return `
Buatkan ${config.jumlah} soal UTBK/TKA baru dengan kriteria berikut (Sesi Unik: ${sessionSalt}):
- Subtes: ${config.subtes}
- Topik: ${config.topik.join(', ')}
- Fokus Materi: ${config.materi && config.materi.trim() ? config.materi.trim() : 'Default (Otomatis bervariasi)'}
- Tingkat Kesulitan: ${config.difficultyDistribution ? 'Sesuai Komposisi Distribusi' : config.difficulty}
- Tipe Soal yang Diminta: ${typesStr}
- Total Jumlah Soal: ${config.jumlah}
${stimulusGuideline}
${materiGuideline}
${antiRepetitionGuideline}
${imagePromptGuideline}
${difficultyGuideline}
${typeDistributionGuideline}
${englishSpecificSection}
${frenchSpecificSection}
${germanSpecificSection}
${japaneseSpecificSection}
${koreanSpecificSection}
${arabicSpecificSection}

Pastikan setiap soal:
1. Sesuai dengan instruksi akademik dan larangan di system prompt.
2. Memiliki pembahasan yang detail dan mudah dipahami langkah demi langkah.
3. Memiliki opsi pengecoh yang masuk akal dan kuat.
${languagePoint}
5. Format materi diisi: "TOPIK - Materinya" (misal: "${config.topik[0] || config.subtes} - ${config.materi || 'Teks Wacana'}").

PENTING: Kembalikan HANYA array JSON berisi PERSIS ${config.jumlah} objek soal lengkap (array.length = ${config.jumlah}). Jangan kurang dan jangan lebih!
    `.trim();
  }
}
