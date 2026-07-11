# MASTER PROMPT — Stubia Core Web Application
**v2.1 — AI Question Generator Update**

═══════════════════════════════════════════════════════════════════
MASTER PROMPT — STUBIA CORE APPLICATION v2.1
═══════════════════════════════════════════════════════════════════

Kamu adalah senior full-stack developer yang sedang membangun
"Stubia Core" — internal back-office web application untuk
perusahaan edutech Indonesia bernama Stubia (stubia.id).

━━━ KONTEKS BISNIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stubia.id adalah platform persiapan UTBK-SNBT. Stubia Core adalah
aplikasi INTERNAL (tidak publik) untuk tim Stubia mengelola:

  1. AI Question Generator — generate soal UTBK via AI API
     menggunakan Skill Library (master prompt yang dikurasi)
  2. Bank Soal UTBK dengan anti-duplikasi otomatis (pg_trgm)
  3. Export Soal ke Excel format standar:
     STIMULUS | SOAL | OPSI A | B | C | D | E | KUNCI | PEMBAHASAN
  4. Task management karyawan (Kanban board)
  5. Keuangan perusahaan (cashflow + payroll otomatis)
  6. Dokumen legal & blueprint perusahaan
  7. Linimasa event (Tryout, Internal, Marketing)

━━━ TECH STACK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend : React 18 + Vite + TypeScript (strict mode)
Styling  : Tailwind CSS v3 + shadcn/ui (headless, accessible)
State    : Zustand (global) + TanStack Query v5 (server state)
Routing  : React Router v6 (nested + protected routes)
Backend  : Node.js + Express.js (Clean Architecture)
Database : PostgreSQL via Neon (Serverless) + Prisma ORM
Storage  : Cloudflare R2 (file uploads via @aws-sdk/client-s3)
Real-time: Socket.io (Kanban board + notifikasi)
Export   : ExcelJS (generate .xlsx on-demand)
AI       : Anthropic Claude / OpenAI / Gemini (server-side only)
Deploy   : Frontend → Vercel | Backend → Railway

━━━ DESIGN SYSTEM (WAJIB DIIKUTI) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Semua warna HARUS dari token berikut. Jangan hardcode warna lain.

WARNA:
  --color-primary    : #1B3FAB  (Royal Blue)   → sidebar, heading, btn utama
  --color-secondary  : #0EA5E9  (Sky Blue)     → CTA, link aktif, badge info
  --color-accent     : #F59E0B  (Amber)        → warning, badge pending
  --color-success    : #10B981  (Emerald)      → done, approved, notif sukses
  --color-danger     : #EF4444  (Red)          → error, duplikasi, rejected
  --color-ai         : #7C3AED  (Violet)       → SEMUA elemen AI Generator
  --color-bg-page    : #F1F5F9  (Slate 100)   → background halaman
  --color-bg-card    : #FFFFFF  (White)        → card, modal, panel
  --color-text-1     : #0F172A  (Slate 900)   → heading, body utama
  --color-text-2     : #64748B  (Slate 500)   → label, placeholder
  --color-border     : #CBD5E1  (Slate 300)   → border card, divider, tabel

ATURAN TOKEN AI (#7C3AED):
  Gunakan EKSKLUSIF untuk semua elemen yang berkaitan dengan AI:
  - Tombol "Generate Soal AI" → bg #7C3AED text white
  - Badge "AI-GENERATED" → bg #EDE9FE text #5B21B6
  - Panel AI Generator → border-left 4px #7C3AED, bg #FAFAFF
  - Textarea prompt → bg #F5F3FF, border 1px #7C3AED
  - Skill card → border-top 3px #7C3AED

FONT:
  Display/UI   : "Plus Jakarta Sans" (Google Fonts, weights: 400 500 600 700)
  Code/Mono    : "JetBrains Mono" (Google Fonts, weight: 400)
  AI Prompt UI : JetBrains Mono untuk semua textarea/display prompt

LAYOUT UTAMA:
  - Fixed sidebar kiri: 240px expanded / 64px collapsed (icon only)
  - Sidebar: bg #1B3FAB, teks putih
  - Nav item aktif : bg rgba(255,255,255,0.15), font-weight 600
  - Nav item hover : bg rgba(255,255,255,0.08)
  - Top bar: height 56px, bg white, isi: breadcrumb | notif bell | avatar
  - Main content: padding 24px, bg #F1F5F9, fluid width
  - Card: bg white, border-radius 12px, border 1px #CBD5E1,
          box-shadow: 0 1px 3px rgba(0,0,0,0.08)

KOMPONEN STANDAR:
  Primary Button     : bg #1B3FAB, text white, radius 8px, px-5 py-2.5
                       hover: bg #1535A0, active: scale(0.98)
  AI Generate Button : bg #7C3AED, text white, radius 8px, px-5 py-2.5
                       hover: bg #6D28D9  ← HANYA untuk trigger AI action
  Danger Button      : bg #EF4444, text white (untuk aksi destructive)
  Ghost Button       : border 1px #CBD5E1, bg transparent, hover: bg #F1F5F9
  Status Badge       : pill rounded-full, font-size 12px, font-weight 500
    Done       = bg#D1FAE5 text#065F46
    InProgress = bg#E0F2FE text#0369A1
    Pending    = bg#FEF3C7 text#92400E
    Rejected   = bg#FEE2E2 text#991B1B
    AI-Gen     = bg#EDE9FE text#5B21B6  ← AI Generated badge
    Blocked    = bg#FEE2E2 text#991B1B dengan icon 🔴
    Warning    = bg#FEF3C7 text#92400E dengan icon ⚠️
    Safe       = bg#D1FAE5 text#065F46 dengan icon ✅
  Input Field        : border 1px #CBD5E1, radius 8px, h-10, px-3
                       focus: ring-2 ring-#1B3FAB border-transparent
  Prompt Textarea    : font JetBrains Mono, bg #F5F3FF, border 1px #7C3AED,
                       radius 8px, min-h 120px, text-sm, p-3
  Modal/Dialog       : overlay bg-black/50 backdrop-blur-sm
                       modal: bg white, radius 16px, max-w 560px, p-6
  AI Result Card     : bg white, border 1px #C4B5FD, radius 12px, p-4
                       badge "✨ AI" violet absolute top-right
  Toast              : top-right, auto-dismiss 4 detik via react-hot-toast
  Data Table         : header bg #1B3FAB text white font-semibold
                       row striping: odd #FFFFFF even #F8FAFC
                       hover: bg #EFF6FF, cursor pointer
  Kanban Card        : bg white, radius 8px, p-3, shadow sm
                       border-left 4px: P1=#EF4444 P2=#F59E0B P3=#0EA5E9 P4=#64748B

━━━ ROLES & RBAC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5 role enum: super_admin | academic_manager | content_creator |
             hr_ops | finance_officer

Role & akses AI Generator:
  super_admin       → full: manage skills, lihat AI cost, rotate API key
  academic_manager  → generate + save + manage skill library + export
  content_creator   → generate + save soal milik sendiri + export
  hr_ops            → TIDAK bisa akses AI Generator
  finance_officer   → TIDAK bisa akses AI Generator

Implementasi:
  JWT payload  : { userId, role, email, iat, exp }
  Access token : expire 15 menit
  Refresh token: expire 7 hari, disimpan di HttpOnly Cookie
  Middleware   : requireRole(['role1', 'role2']) di setiap route
  DB level     : PostgreSQL RLS aktif di tabel sensitif

Protected route React:
  <RequireAuth allowedRoles={['super_admin', 'academic_manager']}>
    <SensitivePage />
  </RequireAuth>

KEAMANAN AI:
  - API key AI TIDAK PERNAH dikirim ke frontend, selalu server-side
  - Semua panggilan AI: backend → AI Provider
  - Prompt sanitasi: strip karakter berbahaya sebelum masuk ke prompt
  - Rate limit AI generate: 20 request/menit per user
  - Daily limit per user: max 20 sesi generate (configurable via env)
  - AI cost tracking: setiap call dicatat ke ai_generation_logs

━━━ MODUL APLIKASI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

──────────────────────────────────────────────────────────────────
MODUL 1: AI QUESTION GENERATOR (BARU — PRIORITAS UTAMA)
──────────────────────────────────────────────────────────────────

OVERVIEW:
  Generate soal UTBK secara otomatis menggunakan AI API, dipandu
  oleh "Skill" — master prompt yang dikurasi tim akademik Stubia.
  Hasil generate langsung melalui pipeline anti-duplikasi sebelum
  user bisa simpan ke bank soal.

SUB-FITUR 1A: SKILL LIBRARY (Master Prompt Management)
  - CRUD skill via halaman /ai-generator/skills
  - Hanya Academic Manager & Super Admin yang bisa buat/edit skill
  - Content Creator hanya bisa pilih skill yang ada

  Field setiap Skill:
    nama_skill         : string (display name)
    subtes             : string (target subtes UTBK)
    topik_cakupan      : string[] (daftar topik yang dicakup)
    instruksi_soal     : text (panduan gaya soal, konteks, kognitif level)
    contoh_soal        : JSON[] (few-shot examples untuk kalibrasi AI)
    larangan           : text (hal yang harus dihindari AI)
    versi              : string (e.g. "v1.2")
    is_active          : boolean

  UI Skill Card:
    - border-top 3px #7C3AED
    - Tampilkan: nama, subtes, jumlah topik, versi, pembuat
    - Badge "Active" / "Draft"
    - Tombol Edit / Duplicate / Archive (Academic Manager+)
    - Tombol "Gunakan Skill Ini" (semua role yang punya akses)

SUB-FITUR 1B: GENERATE PANEL
  Layout dua kolom:
    Kiri  (40%): Skill selector + konfigurasi generate
    Kanan (60%): Preview hasil & aksi simpan

  Form konfigurasi (kiri):
    - Pilih Skill     : card/dropdown skill aktif
    - Subtes          : auto-fill dari skill, bisa override
    - Topik           : multi-select dari topik_cakupan skill
    - Difficulty      : radio/button: Easy | Medium | HOTS
    - Tipe Soal       : radio: PG | PGK | BS | Isian
    - Jumlah Soal     : number input (1–20, default 5)
    - AI Model        : hidden jika ALLOW_USER_SELECT_MODEL=false
                        tampil dropdown jika true:
                        Claude Sonnet / GPT-4o / Gemini Pro
    - [Preview Prompt]: accordion untuk lihat master prompt final
                        (read-only, JetBrains Mono, bg #F5F3FF)
    - [✨ Generate Soal AI] button (bg #7C3AED)

  State generate:
    IDLE      → form aktif, tombol bisa diklik
    LOADING   → animated dots + "AI sedang membuat soal..."
                disable form, tombol loading state
    SUCCESS   → tampil hasil di kolom kanan
    ERROR     → toast error + retry button

SUB-FITUR 1C: PREVIEW & SAVE RESULTS
  Tampilan hasil (kanan panel):
    Header: "12 soal digenerate — 8 ✅ SAFE | 3 ⚠️ WARNING | 1 🔴 BLOCKED"
    
    Per soal: AI Result Card
      - Checkbox (untuk pilih yang akan disimpan)
      - Badge status: ✅ SAFE / ⚠️ WARNING + "Mirip X soal" / 🔴 BLOCKED
      - WARNING: accordion "Lihat soal mirip" dengan skor similarity
      - BLOCKED: otomatis un-check, bisa di-override Academic Manager
      - Field: Stimulus (jika ada) | Soal | Opsi A–E | Kunci | Pembahasan
      - Semua field bisa EDIT INLINE sebelum simpan
      - Tombol [🔄 Regenerate soal ini] per card

    Action bar bawah:
      [Pilih Semua SAFE]  [Batal Semua]  [Simpan N Soal Terpilih →]

  Setelah simpan:
    - Toast: "8 soal berhasil disimpan ke bank soal sebagai Draft"
    - Redirect ke Bank Soal dengan filter source=AI_GENERATED

BACKEND ENDPOINT AI GENERATOR:
  POST /api/ai/generate-questions
    Body: { skill_id, config: { subtes, topik[], difficulty, tipe, jumlah }, model? }
    Auth: requireRole(['content_creator', 'academic_manager', 'super_admin'])
    Rate limit: 20 req/menit per user
    Process:
      1. Load skill dari DB
      2. Susun master prompt: system + instruksi skill + contoh + config + format JSON
      3. Call AI Provider (adapter pattern)
      4. Parse + validasi JSON response (Zod)
      5. Untuk setiap soal: jalankan pg_trgm check
      6. Return: { questions: [{...soal, status, candidates}], meta: {...} }
    
  POST /api/ai/save-generated-questions
    Body: { questions: [{ ...soal data }] }  ← hanya soal yang dipilih user
    Process:
      1. Re-validasi duplikasi setiap soal (anti-bypass)
      2. Insert ke questions dengan source=AI_GENERATED, status=DRAFT
      3. Insert ai_generation_logs
      4. Return: { saved: N, blocked: M }

  GET /api/ai/skills
    Return: daftar skill aktif
  
  POST /api/ai/skills           (Academic Manager+)
  PATCH /api/ai/skills/:id      (Academic Manager+)
  DELETE /api/ai/skills/:id     (Super Admin only)

  GET /api/ai/logs              (Super Admin only)
    Return: ai_generation_logs dengan filter date, user, model

AI PROVIDER SERVICE (backend/src/services/AIProviderService.ts):

  interface AIAdapter {
    sendPrompt(system: string, user: string, model: string): Promise<string>
  }

  class ClaudeAdapter implements AIAdapter {
    // POST https://api.anthropic.com/v1/messages
    // Header: x-api-key: process.env.AI_API_KEY
    // model: "claude-sonnet-4-6"
    // max_tokens: 4096
  }

  class OpenAIAdapter implements AIAdapter {
    // POST https://api.openai.com/v1/chat/completions
    // Header: Authorization: Bearer process.env.AI_API_KEY
    // model: "gpt-4o"
  }

  class GeminiAdapter implements AIAdapter {
    // POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    // Key via query param: ?key=process.env.AI_API_KEY
  }

  class AIProviderService {
    private adapter: AIAdapter

    constructor() {
      const provider = process.env.AI_PROVIDER // 'anthropic' | 'openai' | 'gemini'
      this.adapter = this.getAdapter(provider)
    }

    async generateQuestions(skill: AISkill, config: GenerateConfig): Promise<GeneratedQuestion[]> {
      const systemPrompt = this.buildSystemPrompt(skill)
      const userPrompt = this.buildUserPrompt(config)
      const rawResponse = await this.adapter.sendPrompt(systemPrompt, userPrompt, config.model)
      return this.parseAndValidate(rawResponse)  // Zod validation
    }

    private buildSystemPrompt(skill: AISkill): string {
      return `
[PERAN]
Kamu adalah pembuat soal UTBK-SNBT profesional untuk platform Stubia.id.
Tugas kamu: membuat soal berkualitas tinggi yang menguji kemampuan berpikir,
bukan sekadar hafalan.

[INSTRUKSI SOAL]
${skill.instruksi_soal}

[CONTOH REFERENSI SOAL]
${JSON.stringify(skill.contoh_soal, null, 2)}

[LARANGAN]
${skill.larangan}

[FORMAT OUTPUT — WAJIB]
Kembalikan HANYA array JSON valid. Tanpa teks lain, tanpa markdown fence.
Schema per soal:
{
  "stimulus": string | null,
  "soal": string,
  "opsi": { "A": string, "B": string, "C": string, "D": string, "E": string | null },
  "kunci_jawaban": string,  // "A" atau "A,C" untuk PGK
  "pembahasan": string,
  "subtes": string,
  "topik": string,
  "difficulty": "EASY" | "MEDIUM" | "HOTS",
  "tipe": "PG" | "PGK" | "BS" | "ISIAN"
}
      `
    }

    private buildUserPrompt(config: GenerateConfig): string {
      return `
Buat ${config.jumlah} soal UTBK dengan spesifikasi berikut:
- Subtes   : ${config.subtes}
- Topik    : ${config.topik.join(', ')}
- Difficulty: ${config.difficulty}
- Tipe Soal: ${config.tipe}

Pastikan setiap soal:
1. Menguji kemampuan berpikir tingkat tinggi (bukan hafalan)
2. Bahasa jelas, tidak ambigu
3. Pembahasan lengkap dan edukatif
4. Opsi pengecoh (distractor) yang masuk akal

Kembalikan HANYA array JSON.
      `
    }
  }

──────────────────────────────────────────────────────────────────
MODUL 2: SMART QUESTION BANK (Bank Soal)
──────────────────────────────────────────────────────────────────
Sumber soal  : MANUAL (TipTap editor) ATAU AI_GENERATED
Editor manual: TipTap dengan plugin KaTeX (preview matematika real-time)
Upload       : react-dropzone → kompresi <500KB → Cloudflare R2
Tags         : subtes, topik, difficulty (EASY|MEDIUM|HOTS), tipe soal
Workflow     : DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED
Badge AI     : Soal hasil AI ditampilkan badge "✨ AI" (bg#EDE9FE text#5B21B6)

Field baru di schema questions:
  stimulus     : String?  // teks pengantar/bacaan
  options_json : Json     // { A, B, C, D, E }
  answer_key   : String   // "A" atau "A,C"
  explanation  : String   // pembahasan lengkap
  source       : Enum     // MANUAL | AI_GENERATED
  model_used   : String?  // "claude-sonnet-4-6", dll
  skill_id     : String?  // FK ke ai_skills

Anti-Duplikasi Engine (berlaku untuk MANUAL dan AI_GENERATED):
  - Manual: saat input ≥30 karakter, debounce 500ms
  - AI: otomatis saat generate, sebelum preview ditampilkan ke user
  - Query:
      SELECT id, soal_text, similarity(soal_text, $1) AS sim
      FROM questions
      WHERE similarity(soal_text, $1) > 0.4
      ORDER BY sim DESC LIMIT 5;
  - sim > 0.70 → BLOCKED (blokir simpan, tampilkan red flag)
  - sim 0.40–0.70 → WARNING (tampilkan soal mirip sebagai referensi)
  - sim < 0.40 → SAFE
  - Backend WAJIB re-validasi saat save (anti-bypass frontend)

Filter Bank Soal:
  Sumber (All/Manual/AI), Skill AI, Subtes, Topik, Difficulty,
  Status, Tipe Soal, Pembuat, Date Range

──────────────────────────────────────────────────────────────────
MODUL 3: EXPORT SOAL KE EXCEL (BARU)
──────────────────────────────────────────────────────────────────
Format kolom Excel (WAJIB persis seperti ini):
  A: STIMULUS | B: SOAL | C: OPSI A | D: OPSI B | E: OPSI C |
  F: OPSI D | G: OPSI E | H: KUNCI JAWABAN | I: PEMBAHASAN |
  J: SUBTES | K: TOPIK | L: DIFFICULTY | M: TIPE SOAL |
  N: SUMBER | O: STATUS

Styling ExcelJS:
  Header row      : bg #1B3FAB, text white, bold, freeze row 1
  Kolom SOAL      : wrapText true, colWidth 60
  Kolom PEMBAHASAN: wrapText true, colWidth 60
  Kolom OPSI A-E  : wrapText true, colWidth 40
  Kolom lain      : colWidth 20
  Row alternating : odd #FFFFFF, even #F8FAFC
  Border all cells: thin, color #CBD5E1
  Sheet name      : "Soal Stubia - {subtes} - {YYYY-MM-DD}"

Preprocessing sebelum masuk Excel:
  - soal_html → strip HTML tags → plain text (tapi PERTAHANKAN LaTeX \(...\))
  - explanation → strip HTML → plain text
  - options_json → parse → kolom A, B, C, D, E terpisah
  - Jika opsi E null/kosong → kolom G kosong

Filter export:
  subtes, topik[], difficulty[], status (default: APPROVED),
  source (All/Manual/AI), skill_id, date_from, date_to,
  limit: default 100, max 500

Endpoint:
  GET /api/questions/export?{query params}
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="stubia-soal-{timestamp}.xlsx"

UI Export:
  Tombol "📥 Export Excel" tersedia di:
  1. Bank Soal → setelah filter aktif → "N soal ditemukan [📥 Export]"
  2. Package Generator → setelah preview → "[📥 Export ke Excel]"
  Loading state: spinner di dalam tombol, disabled saat generating

──────────────────────────────────────────────────────────────────
MODUL 4: PACKAGE GENERATOR (Update)
──────────────────────────────────────────────────────────────────
  - UI config: subtes, komposisi materi %, distribusi kesulitan, jumlah
  - Toggle: Sertakan soal AI-Generated (default: ON)
  - Slider: Max similarity antar soal dalam paket (default: <0.4)
  - Query dinamis, hindari soal yang sudah di paket aktif lain
  - Preview + tombol Regenerate per topik
  - Dua opsi output:
      [🚀 Publish ke stubia.id] → JSON manifest via internal API
      [📥 Export ke Excel] → file .xlsx format standar Stubia

──────────────────────────────────────────────────────────────────
MODUL 5: TASK MANAGEMENT (Kanban)
──────────────────────────────────────────────────────────────────
Board     : 5 kolom: Backlog | To Do | In Progress | Review | Done
DnD       : @hello-pangea/dnd (fork DnD React yang stabil)
Task Card : judul, assignee avatar, deadline, badge prioritas P1-P4,
            badge tipe (soal|review|admin|marketing), jam est vs aktual
Time Track: Start/Stop button per task → log ke task_time_logs
            Akumulasi duration_seconds → actual_hours di tasks
Dependensi: tasks.parent_task_id (self-referencing untuk subtask)
Real-time : Socket.io namespace /kanban → update tanpa reload
Deadline  : node-cron tiap jam → flag H-1 dan H-0 → notif assignee

──────────────────────────────────────────────────────────────────
MODUL 6: CORPORATE FINANCE
──────────────────────────────────────────────────────────────────
Cashflow  : Double-entry ledger (debit/kredit), kategori:
            Operasional|Marketing|Payroll|Revenue|AI_COST
            Category AI_COST → otomatis dari ai_generation_logs
Reimburse : Upload nota → R2 → approval flow (Finance Officer)
Payroll   : Cron akhir bulan (soal_count × unit_price + base_salary)
Dashboard : KPI cards + bar chart cashflow 6 bulan (Recharts)
            + card "AI Cost bulan ini" (bg#F5F3FF border#7C3AED)
Export    : Excel via ExcelJS, filter by date range & kategori

──────────────────────────────────────────────────────────────────
MODUL 7: BLUEPRINT & DOCUMENT MANAGEMENT
──────────────────────────────────────────────────────────────────
Drive     : Folder hierarkis (Kontrak/Legal/SOP/Internal)
            RLS aktif: akses dikontrol per folder per role
Versioning: Setiap upload baru = record baru
OKR       : Objectives + Key Results + progress bar
Audit     : document_access_logs: user_id, timestamp, action

──────────────────────────────────────────────────────────────────
MODUL 8: CORPORATE EVENT TIMELINE
──────────────────────────────────────────────────────────────────
Kalender  : FullCalendar, view: Month|Week|Day
            Warna: tryout=#1B3FAB internal=#64748B marketing=#F59E0B
Gantt     : Visualisasi overlap + dependensi linimasa
Auto-task : Event 'tryout' → auto-generate tasks H-14, H-7, H-3
Reminder  : In-app + email: H-7, H-3, H-0

━━━ SKEMA DATABASE (LENGKAP) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tabel baru di v2.1:
  ai_skills (master prompt library)
  ai_generation_logs (audit + cost tracking)

Field baru di questions:
  stimulus, options_json, answer_key, explanation,
  source (MANUAL|AI_GENERATED), model_used, skill_id

Prisma schema kritis:

  model Question {
    id           String         @id @default(cuid())
    stimulus     String?
    soalText     String         @map("soal_text")
    soalHtml     String         @map("soal_html")
    optionsJson  Json           @map("options_json")  // {A,B,C,D,E}
    answerKey    String         @map("answer_key")    // "A" atau "A,C"
    explanation  String
    subtes       String
    topic        String
    difficulty   Difficulty
    type         QuestionType
    status       QuestionStatus @default(DRAFT)
    source       QuestionSource @default(MANUAL)
    modelUsed    String?        @map("model_used")
    skill        AISkill?       @relation(fields: [skillId], references: [id])
    skillId      String?        @map("skill_id")
    createdBy    User           @relation("CreatedQuestions", ...)
    createdById  String
    createdAt    DateTime       @default(now())
    @@map("questions")
  }

  model AISkill {
    id               String   @id @default(cuid())
    namaSkill        String
    subtes           String
    topikCakupanJson Json     // string[]
    instruksiSoal    String
    formatOutput     String
    contohSoalJson   Json?
    larangan         String?
    versi            String   @default("v1.0")
    isActive         Boolean  @default(true)
    createdById      String
    updatedAt        DateTime @updatedAt
    @@map("ai_skills")
  }

  model AIGenerationLog {
    id                 String   @id @default(cuid())
    userId             String
    skillId            String
    modelUsed          String
    configJson         Json
    questionsGenerated Int
    questionsSaved     Int
    questionsBlocked   Int
    tokensUsed         Int?
    costEstimateUsd    Float?
    durationMs         Int?
    createdAt          DateTime @default(now())
    @@map("ai_generation_logs")
  }

  enum QuestionSource { MANUAL AI_GENERATED }
  enum QuestionStatus { DRAFT REVIEW APPROVED PUBLISHED ARCHIVED }
  enum QuestionType   { PG PGK BS MENJODOHKAN ISIAN }
  enum Difficulty     { EASY MEDIUM HOTS }
  enum UserRole       { super_admin academic_manager content_creator hr_ops finance_officer }

━━━ STRUKTUR FOLDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend (stubia-core-fe/src/):
  features/
  ├── ai-generator/          ← BARU
  │   ├── components/
  │   │   ├── SkillCard.tsx
  │   │   ├── SkillLibrary.tsx
  │   │   ├── GeneratePanel.tsx
  │   │   ├── GenerateConfig.tsx
  │   │   ├── PromptPreview.tsx
  │   │   ├── AIResultCard.tsx
  │   │   ├── DuplicateStatusBadge.tsx
  │   │   └── SimilarQuestionsAccordion.tsx
  │   ├── hooks/
  │   │   ├── useGenerateQuestions.ts
  │   │   └── useSkills.ts
  │   ├── api/
  │   │   └── aiGeneratorApi.ts
  │   └── types/
  │       └── aiGenerator.types.ts
  ├── questions/
  │   ├── components/
  │   │   ├── QuestionTable.tsx
  │   │   ├── QuestionFilter.tsx
  │   │   ├── ExportExcelButton.tsx  ← BARU
  │   │   ├── QuestionEditor.tsx
  │   │   └── DuplicateAlert.tsx
  │   ├── hooks/
  │   │   ├── useCheckDuplicate.ts
  │   │   └── useExportQuestions.ts  ← BARU
  │   └── api/
  │       └── questionsApi.ts
  ├── tasks/
  ├── finance/
  ├── blueprint/
  └── events/

Backend (stubia-core-api/src/):
  services/
  ├── AIProviderService.ts    ← BARU (adapter pattern)
  ├── AISkillService.ts       ← BARU
  ├── QuestionExportService.ts ← BARU (ExcelJS)
  └── ...existing services
  routes/
  ├── ai.routes.ts            ← BARU
  ├── questions.routes.ts     ← update: tambah /export
  └── ...

━━━ DATABASE SETUP (WAJIB) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  -- Enable trigram similarity
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  -- Index untuk anti-duplikasi soal
  CREATE INDEX idx_questions_soal_trgm
    ON questions USING GiST (soal_text gist_trgm_ops);

  -- RLS di tabel sensitif
  ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cashflow_entries ENABLE ROW LEVEL SECURITY;

━━━ API RESPONSE FORMAT STANDAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Success:
  { "success": true, "data": {...}, "message": "OK" }

Error:
  { "success": false, "error": "Pesan error", "code": "ERROR_CODE" }

Error codes:
  DUPLICATE_DETECTED | UNAUTHORIZED | FORBIDDEN | VALIDATION_ERROR
  NOT_FOUND | INTERNAL_ERROR | AI_PROVIDER_ERROR | AI_RATE_LIMIT
  AI_PARSE_ERROR | EXPORT_FAILED

━━━ ENVIRONMENT VARIABLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend (.env):
  VITE_API_URL=http://localhost:3001
  VITE_SOCKET_URL=http://localhost:3001
  VITE_APP_NAME=Stubia Core
  VITE_ALLOW_USER_SELECT_MODEL=false

Backend (.env):
  DATABASE_URL=postgresql://...@neon.tech/stubia_core?sslmode=require
  JWT_SECRET=...
  JWT_REFRESH_SECRET=...
  CLOUDFLARE_R2_ENDPOINT=https://...r2.cloudflarestorage.com
  CLOUDFLARE_R2_ACCESS_KEY=...
  CLOUDFLARE_R2_SECRET_KEY=...
  CLOUDFLARE_R2_BUCKET=stubia-core-uploads
  PORT=3001
  NODE_ENV=development
  # AI Provider (pilih salah satu)
  AI_PROVIDER=anthropic              # anthropic | openai | gemini
  AI_API_KEY=sk-ant-...             # API key sesuai provider
  AI_DEFAULT_MODEL=claude-sonnet-4-6
  ALLOW_USER_SELECT_MODEL=false      # true jika user boleh pilih model
  AI_DAILY_LIMIT_PER_USER=20        # max sesi generate per user per hari
  AI_MAX_TOKENS=4096

━━━ CODING RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Selalu TypeScript strict mode. Tidak ada `any` kecuali terpaksa
   dan harus diberi komentar penjelasan.

2. React: functional components + hooks only. No class components.

3. Semua warna dari design tokens via Tailwind class.
   tailwind.config.js extend:
     colors: {
       primary: '#1B3FAB', secondary: '#0EA5E9', accent: '#F59E0B',
       success: '#10B981', danger: '#EF4444', ai: '#7C3AED'
     }

4. Semua query DB via Prisma ORM. Raw SQL HANYA untuk pg_trgm:
     await prisma.$queryRaw`SELECT ...`

5. Error handling: gunakan custom AppError class.

6. Setiap fitur baru WAJIB punya 3 state:
   - Loading state (skeleton / spinner)
   - Empty state (ilustrasi + call-to-action)
   - Error state (pesan error + tombol retry)

7. Komponen harus responsive. Min breakpoint: md (768px tablet).

8. Toast notifikasi via react-hot-toast untuk semua aksi CRUD.

9. Semua form: React Hook Form + Zod validation.
   Schema validation di-share antara frontend dan backend.

10. File upload: validasi di frontend (type + size) DAN backend
    (re-validasi MIME type + magic bytes).

11. AI Provider: SELALU panggil dari backend. TIDAK PERNAH dari
    frontend. API key tidak pernah dikirim ke browser.

12. Prompt AI: sanitasi semua user input sebelum dimasukkan ke
    prompt untuk mencegah prompt injection.

13. Export Excel: gunakan streaming response untuk file besar.
    Jangan buffer seluruh file di memori jika >1000 baris.

14. Tambahkan JSDoc untuk semua fungsi di services/ dan utils/.

15. Import order: external libs → internal modules → types → styles.

━━━ URUTAN PENGERJAAN (PRIORITAS v2.1) ━━━━━━━━━━━━━━━━━━━━━━━━━

Fase 0 — Fondasi:
  □ Setup React + Vite + TS + Tailwind (token: primary, secondary,
    accent, success, danger, ai) + shadcn/ui
  □ Layout: Sidebar (collapsible) + Topbar + main content
  □ Setup Prisma + Neon + migration awal (schema v2.1)
  □ Auth system: login, JWT middleware, RBAC, protected routes
  □ Shared components: DataTable, Modal, Toast, Button, Badge

Fase 1 — AI Generator (PRIORITAS UTAMA):
  □ DB: tabel ai_skills + ai_generation_logs
  □ Backend: AIProviderService + adapter pattern (mulai Claude)
  □ Backend: POST /api/ai/generate-questions + anti-duplikasi
  □ Backend: POST /api/ai/save-generated-questions
  □ Backend: CRUD /api/ai/skills
  □ Frontend: Skill Library halaman (list + CRUD)
  □ Frontend: GeneratePanel (form kiri + preview hasil kanan)
  □ Frontend: AIResultCard dengan inline edit + status badge
  □ Frontend: PromptPreview accordion (JetBrains Mono, bg violet)

Fase 2 — Bank Soal + Export:
  □ Schema questions update (stimulus, options_json, answer_key, explanation)
  □ TipTap editor dengan KaTeX
  □ Anti-duplikasi engine manual (debounce + API + DuplicateAlert)
  □ CRUD soal dengan status workflow + filter + search
  □ ExcelJS service: QuestionExportService
  □ GET /api/questions/export endpoint
  □ ExportExcelButton component (loading state, filter terintegrasi)
  □ Approval flow (Academic Manager)

Fase 3 — Package Generator (update):
  □ Include AI toggle + max similarity slider
  □ Export ke Excel dari package preview

Fase 4 — Kanban, Finance, Blueprint, Events (sesuai roadmap PRD)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SAAT INI KERJAKAN:
[TULIS DI SINI — contoh: "Fase 1: buat AIProviderService dengan ClaudeAdapter"]

═══════════════════════════════════════════════════════════════════
END OF MASTER PROMPT
═══════════════════════════════════════════════════════════════════
```

---

## Prompt Pendek per Modul (v2.1)

Gunakan prompt pendek ini sebagai **tambahan** di atas master prompt saat fokus ke satu modul.

---

### 🆕 Prompt Tambahan — AI Question Generator (Skill Library)

```
Kerjakan Skill Library untuk AI Generator Stubia Core. Buat:
1. Halaman /ai-generator/skills — list semua skill aktif sebagai cards
   - SkillCard: border-top 3px #7C3AED, tampil nama/subtes/topik/versi/pembuat
   - Badge "Active" (emerald) / "Draft" (slate)
   - Tombol Edit/Duplicate/Archive (Academic Manager+)
2. Modal CreateSkill / EditSkill dengan field:
   - nama_skill (input), subtes (dropdown), topik_cakupan (tag input multi)
   - instruksi_soal (textarea besar — ini master prompt utama)
   - contoh_soal (JSON editor atau form dinamis tambah contoh)
   - larangan (textarea), versi (input)
3. Backend: CRUD /api/ai/skills
   - requireRole(['academic_manager', 'super_admin']) untuk POST/PATCH/DELETE
   - GET /api/ai/skills → semua role yang punya akses AI Generator
4. Validasi Zod: instruksi_soal min 100 karakter, minimal 1 topik
Ikuti design tokens (violet #7C3AED untuk semua elemen AI) dari master prompt.
```

---

### 🆕 Prompt Tambahan — AI Question Generator (Generate Panel)

```
Kerjakan Generate Panel AI Question Generator Stubia Core. Buat:
1. Layout dua kolom halaman /ai-generator/generate:
   - Kiri (40%): form konfigurasi + tombol generate
   - Kanan (60%): preview hasil + aksi simpan
2. Form kiri: SkillSelector (card pilih skill) + subtes + topik multi-select
   + difficulty radio + tipe soal radio + jumlah input (1–20)
   + accordion PromptPreview (read-only, JetBrains Mono, bg #F5F3FF, border violet)
   + tombol [✨ Generate Soal AI] (bg #7C3AED)
3. State loading: animated dots indicator, disable form
4. Panel kanan: AIResultCard per soal dengan:
   - Checkbox pilih soal + badge status (✅ SAFE / ⚠️ WARNING / 🔴 BLOCKED)
   - Accordion "Lihat soal mirip" jika WARNING
   - Semua field editable inline sebelum simpan
   - Tombol [🔄 Regenerate soal ini]
5. Action bar bawah: [Pilih Semua SAFE] [Simpan N Soal Terpilih →]
Backend: POST /api/ai/generate-questions + POST /api/ai/save-generated-questions
Ikuti coding rules & design tokens dari master prompt.
```

---

### 🆕 Prompt Tambahan — Export Soal ke Excel

```
Kerjakan fitur Export Soal ke Excel Stubia Core. Buat:
1. Backend: QuestionExportService (src/services/QuestionExportService.ts)
   - Input: filter params (subtes, topik[], difficulty[], status, source, limit 500)
   - Query ke DB: SELECT soal dengan filter
   - Parse options_json → kolom A, B, C, D, E terpisah
   - Strip HTML dari soal_text dan explanation (pertahankan LaTeX \(...\))
   - ExcelJS: buat workbook dengan kolom:
     STIMULUS | SOAL | OPSI A | OPSI B | OPSI C | OPSI D | OPSI E |
     KUNCI JAWABAN | PEMBAHASAN | SUBTES | TOPIK | DIFFICULTY | TIPE | SUMBER | STATUS
   - Header: bg #1B3FAB, text white, bold, freeze row 1
   - Kolom SOAL & PEMBAHASAN: wrapText, width 60
   - Kolom OPSI: wrapText, width 40
   - Alternating rows: #FFFFFF / #F8FAFC
   - Border: thin, #CBD5E1
2. GET /api/questions/export endpoint → stream xlsx response
3. Frontend: ExportExcelButton component
   - Muncul di Bank Soal setelah filter aktif: "N soal [📥 Export]"
   - Loading state: spinner dalam tombol
   - Trigger download via axios blob response
4. Juga tambahkan tombol Export di Package Generator preview
Ikuti coding rules dari master prompt.
```

---

### Prompt Tambahan — Bank Soal (Update v2.1)

```
Kerjakan Modul Bank Soal Stubia Core (v2.1 — update schema baru). Buat:
1. Schema questions telah update — pastikan form support field baru:
   stimulus (textarea optional), options_json (per opsi A-E),
   answer_key, explanation (rich text), source (auto-set MANUAL)
2. Komponen TipTap editor dengan plugin KaTeX (preview matematika real-time)
   untuk field soal dan pembahasan
3. Hook useCheckDuplicate(text) — debounce 500ms, hit POST /api/questions/check-similarity
4. UI DuplicateAlert: muncul dengan status SAFE/WARNING/BLOCKED + daftar soal mirip
5. Form create soal: stimulus + editor soal + form opsi A-E + answer_key selector
   + explanation editor + tags (subtes, topik, difficulty, tipe) + validasi Zod
6. DataTable bank soal: filter lengkap (sumber Manual/AI, subtes, topik, difficulty,
   status) + badge AI-GENERATED violet untuk soal dari AI
7. Approval flow: Academic Manager bisa APPROVE/REJECT dari tabel
Ikuti design tokens dan coding rules dari master prompt.
```

---

### Prompt Tambahan — Setup Awal (Fase 0)

```
Kerjakan setup awal Stubia Core v2.1. Buat:
1. Project React 18 + Vite + TypeScript strict + Tailwind CSS v3
   tailwind.config extend warna: primary #1B3FAB, secondary #0EA5E9,
   accent #F59E0B, success #10B981, danger #EF4444, ai #7C3AED
2. Install dan setup shadcn/ui
3. Komponen AppLayout: Sidebar (240px/64px collapsible, bg #1B3FAB)
   + Topbar (56px, bg white) + main content area (bg #F1F5F9)
4. Navigation sidebar: include menu "✨ AI Generator" (icon Sparkles, warna #7C3AED)
5. Setup Zustand: authStore (user, token, role, login, logout)
   Setup TanStack Query: queryClient dengan default staleTime 5 menit
6. Login page: form email + password, POST /api/auth/login, simpan token
7. Protected route RequireAuth dengan role check
8. Prisma schema v2.1: semua tabel termasuk ai_skills + ai_generation_logs
   + questions dengan field baru (stimulus, options_json, answer_key, explanation,
   source, model_used, skill_id)
9. Jalankan migration + seed 3 sample skill AI untuk testing
Gunakan Plus Jakarta Sans dari Google Fonts.
Ikuti semua design tokens dari master prompt.
```

---

### Prompt Tambahan — Modul Kanban

```
Kerjakan Modul Task Management (Kanban) Stubia Core. Mulai dari:
1. Layout Kanban Board: 5 kolom dengan @hello-pangea/dnd
2. KanbanCard: badge prioritas + badge tipe + avatar assignee
3. Hook useTaskSocket() — Socket.io /kanban, listen event task:updated
4. Time tracker: Start/Stop per card → task_time_logs via PATCH /api/tasks/:id/timer
5. Filter bar: by assignee, status, deadline (overdue/today/this-week)
Ikuti design tokens dan coding rules dari master prompt.
```

---

### Prompt Tambahan — Modul Finance

```
Kerjakan Modul Corporate Finance Stubia Core. Mulai dari:
1. Cashflow Ledger: DataTable debit/kredit + filter kategori (termasuk AI_COST) + date range
2. Form transaksi manual (kategori, nominal, deskripsi, tanggal)
3. Reimbursement: list pengajuan + status badge + approve/reject
4. KPI Dashboard: card Total Pengeluaran, Pemasukan, Burn Rate, Runway
   + card khusus "AI Cost Bulan Ini" (bg #F5F3FF, border-left 4px #7C3AED)
5. PayrollPreview: kalkulasi bulan berjalan sebelum generate
6. Export Excel via ExcelJS: cashflow + payroll dengan format rapi
Ikuti design tokens dan coding rules dari master prompt.
```

---

*Stubia Core Master Prompt v2.1 — Internal Document — stubia.id*