# Stubia Core — Product Requirement Document
**Back-Office ERP & LMS Engine untuk stubia.id**

| | |
|---|---|
| **Versi** | v2.1 (Final Draft — AI Generator Update) |
| **Status** | Review Internal |
| **Target Rilis** | Q3 2026 |
| **Tech Stack** | React.js + Node.js + PostgreSQL (Neon) |
| **Penulis** | Tim Produk Stubia |

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Design System & Brand Identity](#2-design-system--brand-identity)
3. [Peran Pengguna & RBAC](#3-peran-pengguna--rbac)
4. [Spesifikasi Fitur Utama](#4-spesifikasi-fitur-utama)
5. [Arsitektur Teknis](#5-arsitektur-teknis)
6. [Skema Database](#6-skema-database)
7. [Alur Data Kritis](#7-alur-data-kritis)
8. [Keamanan & Non-Functional Requirements](#8-keamanan--non-functional-requirements)
9. [Deployment & Infrastruktur](#9-deployment--infrastruktur)
10. [Roadmap & Timeline](#10-roadmap--timeline)
11. [Checklist Pre-Launch](#11-checklist-pre-launch)

---

## 1. Ringkasan Eksekutif

Stubia Core adalah platform internal terintegrasi yang dirancang khusus untuk mendukung operasional **stubia.id** — platform persiapan UTBK-SNBT terkemuka di Indonesia. Aplikasi ini berfungsi sebagai pusat kendali tunggal (*single source of truth*) untuk seluruh operasional tim internal Stubia.

> **Misi Utama:** Menggantikan spreadsheet, grup WhatsApp, dan proses manual yang tersebar — menjadi satu sistem terpadu yang menggerakkan seluruh operasional Stubia dari dalam.

### Tujuan Strategis

- **Efisiensi Konten** — Generate soal UTBK secara otomatis via AI dengan master prompt yang dikurasi, dan deteksi duplikasi real-time menggunakan algoritma pencocokan teks (`pg_trgm`) sebelum soal masuk ke bank
- **Transparansi Operasional** — Integrasikan kinerja tugas karyawan langsung dengan sistem penggajian otomatis
- **Sentralisasi Data** — Satu sumber kebenaran untuk semua dokumen legal, SOP, dan arah strategis
- **Akuntabilitas Keuangan** — Rekam setiap debit/kredit secara terstruktur dan auditabel
- **Kolaborasi Tim** — Kanban board real-time yang terhubung dengan event kalender perusahaan
- **Ekspor Terstruktur** — Ambil soal dari bank dalam format Excel standar Stubia: `STIMULUS | SOAL | OPSI A–E | KUNCI | PEMBAHASAN`

---

## 2. Design System & Brand Identity

Stubia Core mengikuti design language yang sama dengan stubia.id — konsisten, profesional, dan berorientasi pada produktivitas.

### 2.1. Palet Warna (Design Tokens)

| Peran Token | Nama | Hex | Penggunaan |
|---|---|---|---|
| Brand Primary | Royal Blue | `#1B3FAB` | Sidebar, header, tombol utama, heading |
| Brand Secondary | Sky Blue | `#0EA5E9` | CTA, link aktif, badge status |
| Accent / Warning | Amber | `#F59E0B` | Notifikasi warning, badge pending |
| Success | Emerald | `#10B981` | Status done, approved, notifikasi sukses |
| Danger / Error | Red | `#EF4444` | Error, duplikasi terdeteksi, rejected |
| Background Page | Slate 100 | `#F1F5F9` | Background halaman utama |
| Background Card | White | `#FFFFFF` | Card, modal, panel konten |
| Text Primary | Slate 900 | `#0F172A` | Judul, body text utama |
| Text Secondary | Slate 500 | `#64748B` | Label, placeholder, teks sekunder |
| Border / Divider | Slate 300 | `#CBD5E1` | Border card, divider, tabel |
| AI Accent | Violet | `#7C3AED` | Badge AI-Generated, tombol Generate AI, panel AI |

> Token `AI Accent` (#7C3AED) digunakan **eksklusif** untuk semua elemen yang berkaitan dengan fitur AI Question Generator — sehingga tim bisa langsung tahu mana yang produk AI vs produk manual.

### 2.2. Tipografi

| Peran | Font Family | Weight | Ukuran |
|---|---|---|---|
| Display / Heading | Plus Jakarta Sans | 700 Bold | H1: 32px, H2: 24px, H3: 18px |
| Body / UI Text | Plus Jakarta Sans | 400–600 | 14–16px |
| Code / Monospace | JetBrains Mono | 400 | 13–14px |
| Prompt AI | JetBrains Mono | 400 | 13px, bg `#F5F3FF`, border `#7C3AED` |

> Gunakan Google Fonts CDN untuk Plus Jakarta Sans (weights: 400, 500, 600, 700) dan JetBrains Mono. Pastikan `font-display: swap`.

### 2.3. Layout Utama

```
┌─────────────────────────────────────────────────────┐
│  TOP BAR (56px) — breadcrumb | 🔔 | avatar          │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │  MAIN CONTENT AREA                       │
│ (240px)  │  padding: 24px, bg: #F1F5F9             │
│ #1B3FAB  │                                          │
│          │  ┌──────────┐  ┌──────────┐             │
│ Nav Item │  │  Card    │  │  Card    │             │
│ Nav Item │  │ bg white │  │ bg white │             │
│ Nav Item │  │ r: 12px  │  │ r: 12px  │             │
│ ✨ AI Gen│  └──────────┘  └──────────┘             │
└──────────┴──────────────────────────────────────────┘
```

- Sidebar collapsed: 64px (icon only)
- Card: `bg white, border-radius 12px, shadow: 0 1px 3px rgba(0,0,0,0.08), border: 1px #CBD5E1`
- AI Generator Panel: `border-left 4px #7C3AED, bg #FAFAFF`

### 2.4. Komponen UI Standar

| Komponen | Spesifikasi |
|---|---|
| Primary Button | `bg #1B3FAB, text white, radius 8px, padding 10px 20px, hover: #1535A0` |
| AI Generate Button | `bg #7C3AED, text white, radius 8px` — khusus trigger AI generation |
| Danger Button | `bg #EF4444, text white` — untuk aksi destructive |
| Ghost Button | `border 1px #CBD5E1, bg transparent, hover: bg #F1F5F9` |
| Status Badge | Pill `rounded-full`: Done=Emerald, In Progress=Sky, Pending=Amber, Rejected=Red, AI-Generated=Violet |
| Input Field | `border 1px #CBD5E1, radius 8px, focus: ring-2 #1B3FAB` |
| Prompt Textarea | `font JetBrains Mono, bg #F5F3FF, border 1px #7C3AED, radius 8px, min-h 120px` |
| Modal | `overlay: bg-black/50 backdrop-blur-sm, radius 16px, max-w 560px` |
| AI Result Card | `bg white, border 1px #7C3AED, border-radius 12px, badge "AI" violet top-right` |
| Toast | Top-right, auto-dismiss 4 detik, 4 varian: success/error/warning/info |
| Data Table | Header `bg #1B3FAB text white`, row striping `#F8FAFC`, hover `bg #EFF6FF` |
| Kanban Card | `bg white, border-left 4px warna prioritas, shadow sm, draggable` |
| Sidebar Nav | Aktif: `bg rgba(255,255,255,0.15)` bold; Hover: `bg rgba(255,255,255,0.08)` |

---

## 3. Peran Pengguna & RBAC

Sistem menggunakan Role-Based Access Control yang diimplementasikan di middleware Node.js dan divalidasi via Row-Level Security di PostgreSQL Neon.

| Peran (Role) | Modul yang Dapat Diakses | Batasan Kritis |
|---|---|---|
| **Super Admin** (C-Level) | Semua modul tanpa kecuali, termasuk manajemen API Key AI | Tidak ada — akses baca/tulis/hapus penuh |
| **Academic Manager** | Bank Soal (QC, Approve, AI Generator), Event Timeline, Task (view), Export Soal | Tidak bisa akses Payroll & Cashflow sensitif |
| **Content Creator** (Tentor) | Bank Soal (soal milik sendiri + AI Generator), Task (tugas sendiri) | Tidak bisa approve/delete soal orang lain, tidak lihat Finance |
| **HR / Operations** | Task Management (semua), Event Timeline, Blueprint (read) | Tidak bisa edit soal atau akses data keuangan |
| **Finance Officer** | Finance Module (full), Task (read-only untuk kalkulasi) | Tidak bisa edit soal atau manage event |

> **Implementasi Teknis:** JWT payload menyertakan `{ userId, role, email }`. Setiap endpoint Express dilindungi middleware `requireRole(['academic_manager', 'super_admin'])`. PostgreSQL RLS aktif di tabel sensitif, mencegah privilege escalation bahkan jika middleware bypass.

> **API Key AI:** Disimpan terenkripsi di environment variable backend (`AI_PROVIDER_API_KEY`). Tidak pernah dikirim ke frontend. Semua panggilan AI dilakukan server-side. Super Admin bisa rotate key via settings panel.

---

## 4. Spesifikasi Fitur Utama

### 4.1. AI Question Generator — Core Feature (BARU)

> **Tujuan:** Mengotomasi pembuatan soal UTBK berkualitas tinggi menggunakan AI (OpenAI / Claude / Gemini), dipandu oleh master prompt yang dikurasi tim akademik Stubia. Hasil soal langsung masuk ke pipeline anti-duplikasi sebelum tersimpan ke bank.

#### 4.1.1. Arsitektur AI Generator

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI QUESTION GENERATOR                        │
├──────────────┬──────────────────────────────────────────────────┤
│  SKILL       │  KONFIGURASI GENERATE                           │
│  LIBRARY     │                                                  │
│  ─────────── │  Subtes     : [dropdown]                        │
│  📄 Skill #1 │  Topik      : [multi-select]                    │
│  📄 Skill #2 │  Difficulty : Easy / Medium / HOTS             │
│  📄 Skill #3 │  Tipe Soal  : PG / PGK / BS / Isian           │
│  + Add Skill │  Jumlah     : [1–20 soal per generate]         │
│              │  AI Model   : [Claude / GPT-4o / Gemini]       │
│              │                                                  │
│  PROMPT      │  ┌──────────────────────────────────────────┐  │
│  PREVIEW     │  │ MASTER PROMPT (auto-compose dari skill)  │  │
│  (read-only) │  │ + konfigurasi di atas                    │  │
│              │  │ [JetBrains Mono, bg #F5F3FF]             │  │
│              │  └──────────────────────────────────────────┘  │
│              │                                                  │
│              │  [ ✨ Generate Soal AI ]  (bg #7C3AED)          │
└──────────────┴──────────────────────────────────────────────────┘
```

#### 4.1.2. Skill Library (Master Prompt Management)

Skill adalah template prompt yang dikurasi oleh Academic Manager atau Super Admin. Setiap skill mendefinisikan:

| Field Skill | Deskripsi | Contoh |
|---|---|---|
| `nama_skill` | Nama identifikasi skill | "Matematika Dasar — Aljabar UTBK" |
| `subtes` | Subtes UTBK yang ditarget | `Penalaran Matematika` |
| `topik_cakupan` | Daftar topik yang di-cover | `["Sistem Persamaan", "Fungsi Kuadrat"]` |
| `instruksi_soal` | Prompt instruksi utama (gaya soal, konteks, tingkat kognitif) | Teks panjang panduan gaya soal UTBK |
| `format_output` | Format JSON yang harus diikuti AI | Lihat spesifikasi di bawah |
| `contoh_soal` | Few-shot examples (1–3 soal referensi) untuk kalibrasi AI | Soal UTBK asli sebagai anchor |
| `larangan` | Hal-hal yang harus dihindari AI | "Jangan buat soal hafalan murni, harus penalaran" |
| `versi` | Versi skill | `v1.2` |
| `dibuat_oleh` | Author skill | `Academic Manager` |

**Komposisi Master Prompt Otomatis:**

Saat user klik `Generate`, backend menyusun prompt final sebagai berikut:

```
[SYSTEM ROLE]
Kamu adalah pembuat soal UTBK-SNBT profesional untuk Stubia...

[SKILL INSTRUKSI]
{skill.instruksi_soal}

[CONTOH REFERENSI]
{skill.contoh_soal}

[LARANGAN]
{skill.larangan}

[KONFIGURASI GENERATE]
Subtes: {config.subtes}
Topik: {config.topik}
Tingkat Kesulitan: {config.difficulty}
Tipe Soal: {config.tipe}
Jumlah: {config.jumlah}

[FORMAT OUTPUT — WAJIB JSON]
Kembalikan HANYA array JSON berikut, tanpa teks lain:
[
  {
    "stimulus": "...",        // teks pengantar/bacaan (bisa kosong "")
    "soal": "...",            // teks pertanyaan
    "opsi": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "...",
      "E": "..."              // bisa null untuk tipe non-PG
    },
    "kunci_jawaban": "A",    // huruf opsi benar
    "pembahasan": "...",      // penjelasan lengkap mengapa jawaban benar
    "subtes": "...",
    "topik": "...",
    "difficulty": "MEDIUM",
    "tipe": "PG"
  }
]
```

#### 4.1.3. Generate Flow & Anti-Duplikasi Terintegrasi

```
User klik [✨ Generate Soal AI]
    ↓
Backend POST /api/ai/generate-questions
    {skill_id, config: {subtes, topik, difficulty, tipe, jumlah}, model}
    ↓
Backend susun master prompt dari skill + config
    ↓
Call AI Provider API (server-side, API key tidak expose ke client)
  → OpenAI: POST https://api.openai.com/v1/chat/completions
  → Claude: POST https://api.anthropic.com/v1/messages
  → Gemini: POST https://generativelanguage.googleapis.com/...
    ↓
Parse JSON response → validasi schema (Zod)
    ↓
UNTUK SETIAP soal yang digenerate:
  ├── Jalankan cek anti-duplikasi pg_trgm
  │     sim > 0.70 → tandai status: DUPLICATE_BLOCKED
  │     sim 0.40–0.70 → tandai status: SIMILARITY_WARNING + ref soal mirip
  │     sim < 0.40 → tandai status: SAFE
  ↓
Return ke frontend: array soal dengan status masing-masing
    ↓
┌─────────────────────────────────────────┐
│  PREVIEW HASIL AI (sebelum save)        │
│                                         │
│  ✅ 8 soal SAFE → siap simpan          │
│  ⚠️  2 soal WARNING → perlu review     │
│  🔴 1 soal BLOCKED → mirip soal #4521  │
│                                         │
│  [Checkbox per soal untuk pilih simpan]│
│  [Simpan Soal Terpilih →Bank]           │
└─────────────────────────────────────────┘
    ↓
User pilih soal mana yang disimpan
    ↓
POST /api/ai/save-generated-questions
    ↓
Backend re-validasi duplikasi (anti-bypass)
    ↓
Soal tersimpan dengan:
  - status: DRAFT
  - source: AI_GENERATED
  - model_used: "claude-3-5-sonnet" / "gpt-4o" / dll
  - skill_id: referensi ke skill yang dipakai
  - generated_at: timestamp
    ↓
Masuk pipeline review normal: DRAFT → REVIEW → APPROVED → PUBLISHED
```

#### 4.1.4. Preview & Edit Sebelum Simpan

Hasil generate AI ditampilkan dalam panel preview interaktif:

- Setiap soal tampil sebagai card dengan badge status: `✅ SAFE` / `⚠️ WARNING` / `🔴 BLOCKED`
- Soal WARNING menampilkan accordion "Lihat soal yang mirip" dengan skor similarity
- Soal BLOCKED otomatis un-check tapi bisa di-override oleh Academic Manager dengan konfirmasi
- Setiap field soal bisa **diedit inline** sebelum disimpan (rich text mini untuk `soal` dan `pembahasan`)
- Tombol `🔄 Regenerate Soal Ini` untuk generate ulang soal yang kurang memuaskan secara individual
- Tombol `Simpan Semua SAFE` (shortcut) + `Simpan Terpilih` (manual pilih)

#### 4.1.5. Multi-Provider AI Support

| Provider | Model Default | Konfigurasi |
|---|---|---|
| Anthropic Claude | `claude-sonnet-4-6` | `AI_PROVIDER=anthropic`, `AI_API_KEY=sk-ant-...` |
| OpenAI | `gpt-4o` | `AI_PROVIDER=openai`, `AI_API_KEY=sk-...` |
| Google Gemini | `gemini-1.5-pro` | `AI_PROVIDER=gemini`, `AI_API_KEY=...` |

Provider aktif dikonfigurasi via environment variable. Dropdown model di UI hanya tampil jika `ALLOW_USER_SELECT_MODEL=true`. Default: provider & model ditentukan Super Admin, tidak bisa diubah user biasa.

#### 4.1.6. Logging & Audit AI Usage

Setiap panggilan AI dicatat di tabel `ai_generation_logs`:

```
ai_generation_logs:
  id, user_id, skill_id, model_used, config_json,
  questions_generated, questions_saved, questions_blocked,
  tokens_used, cost_estimate_usd, duration_ms, created_at
```

Super Admin dapat melihat dashboard penggunaan AI: total soal digenerate, rate duplikasi, cost estimate per bulan, dan skill paling sering dipakai.

---

### 4.2. Smart Question Bank & Anti-Duplicate Engine

> **Tujuan:** Menjadi satu-satunya bank soal UTBK — dengan penjagaan kualitas otomatis. Menerima soal dari dua sumber: **input manual** (TipTap editor) dan **AI Generator** (Section 4.1).

**Fitur Inti:**
- Rich Text Editor (TipTap) dengan dukungan LaTeX/KaTeX untuk notasi matematika UTBK
- Preview real-time WYSIWYG identik dengan tampilan di stubia.id
- Upload gambar soal dengan kompresi otomatis (maks 500KB) ke Cloudflare R2
- Tag system: subtes, topik, tingkat kesulitan (Easy/Medium/HOTS), tipe soal (PG/PGK/BS/Menjodohkan/Isian)
- Badge `AI-GENERATED` (violet) untuk soal yang berasal dari AI Generator
- Status workflow: `Draft → Review → Approved → Published → Archived`
- Field tambahan: `source` (`MANUAL` | `AI_GENERATED`), `model_used`, `skill_id`

**Mesin Anti-Duplikasi (Core Engine) — berlaku untuk SEMUA sumber soal:**

Saat konten ≥30 karakter (input manual: debounced 500ms; AI Generator: otomatis saat preview):

```sql
SELECT id, soal_text, similarity(soal_text, $1) AS sim
FROM questions
WHERE similarity(soal_text, $1) > 0.4
ORDER BY sim DESC
LIMIT 5;
```

| Threshold Similarity | Aksi Sistem |
|---|---|
| `sim > 0.70` (70%) | 🔴 **BLOKIR** penyimpanan — tampilkan red flag, paksa modifikasi signifikan |
| `sim 0.40–0.70` (40–70%) | 🟡 **WARNING** kuning — tampilkan 3 soal terdekat sebagai referensi |
| `sim < 0.40` | ✅ Aman — simpan normal |

> PostgreSQL extension `pg_trgm` diaktifkan dengan indeks GiST pada `soal_text` untuk performa <1.5 detik pada 100.000+ soal.

**Filter & Pencarian Bank Soal:**

| Filter | Opsi |
|---|---|
| Sumber | Manual / AI-Generated / Semua |
| Skill AI | Dropdown skill yang pernah dipakai (jika source=AI) |
| Subtes | Multi-select |
| Topik | Multi-select per subtes |
| Difficulty | Easy / Medium / HOTS |
| Status | Draft / Review / Approved / Published / Archived |
| Tipe Soal | PG / PGK / BS / Menjodohkan / Isian |
| Pembuat | Dropdown user |
| Tanggal | Date range picker |

---

### 4.3. Export Soal — Format Excel Standar Stubia (BARU)

> **Tujuan:** Memudahkan tim akademik mengambil soal dari bank untuk keperluan tryout, latihan, atau review — dalam format Excel terstruktur yang siap dipakai langsung.

#### 4.3.1. Format Export Excel

Setiap baris mewakili satu soal dengan kolom:

| No | Nama Kolom | Sumber Field | Catatan |
|---|---|---|---|
| A | `STIMULUS` | `questions.stimulus` | Teks pengantar/bacaan. Kosong jika tidak ada |
| B | `SOAL` | `questions.soal_text` (plain text) | Strip HTML tags. LaTeX dipertahankan |
| C | `OPSI A` | `questions.options['A']` | Kosong jika bukan tipe PG |
| D | `OPSI B` | `questions.options['B']` | |
| E | `OPSI C` | `questions.options['C']` | |
| F | `OPSI D` | `questions.options['D']` | |
| G | `OPSI E` | `questions.options['E']` | Bisa kosong untuk soal 4 opsi |
| H | `KUNCI JAWABAN` | `questions.answer_key` | Huruf: A/B/C/D/E atau kombinasi (PGK) |
| I | `PEMBAHASAN` | `questions.explanation` | Plain text. Strip HTML |
| J | `SUBTES` | `questions.subtes` | |
| K | `TOPIK` | `questions.topic` | |
| L | `DIFFICULTY` | `questions.difficulty` | EASY / MEDIUM / HOTS |
| M | `TIPE SOAL` | `questions.type` | PG / PGK / BS / dll |
| N | `SUMBER` | `questions.source` | MANUAL / AI_GENERATED |
| O | `STATUS` | `questions.status` | APPROVED / PUBLISHED / dll |

**Styling Excel (via ExcelJS):**

- Baris header: `bg #1B3FAB, text white, font bold, freeze pane row 1`
- Kolom SOAL & PEMBAHASAN: `wrapText: true, colWidth: 60`
- Kolom OPSI A–E: `wrapText: true, colWidth: 40`
- Kolom header lain: `colWidth: 20`
- Alternating row color: `odd #FFFFFF, even #F8FAFC`
- Border all cells: `thin, #CBD5E1`
- Sheet name: `Soal Stubia - {subtes} - {tanggal}`

#### 4.3.2. UI Export

Tombol `📥 Export Excel` tersedia di dua tempat:

**1. Export dari Filter Bank Soal:**

```
[Filter Panel]
  Subtes: [dropdown]          Topik: [multi-select]
  Difficulty: [checkbox]      Status: [dropdown] → default: APPROVED
  Sumber: [All/Manual/AI]     Jumlah: [max 500 soal per export]
  
  Soal ditemukan: 124 soal   [📥 Export Excel]
```

**2. Export dari Package Generator:**

Setelah paket soal dikonfigurasi dan di-preview, ada tombol `📥 Export Paket ke Excel` di samping tombol `Publish ke stubia.id` — untuk keperluan offline atau review fisik.

#### 4.3.3. Backend Export Endpoint

```
GET /api/questions/export
Query params:
  subtes, topik[], difficulty[], status[], source, 
  skill_id, date_from, date_to, limit (default 100, max 500)
Response:
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="stubia-soal-{timestamp}.xlsx"
```

---

### 4.4. Automated Package Generator (Update)

- Config builder UI: pilih subtes, komposisi materi (%), distribusi kesulitan, jumlah soal
- **Tambahan opsi:** `Sertakan soal AI-Generated` (toggle, default ON) + `Minimum similarity score max` (slider, default: hanya soal dengan sim <0.4 ke satu sama lain dalam paket)
- Query dinamis: ambil soal acak terstruktur, hindari soal yang sudah masuk paket aktif
- Preview paket sebelum dikonfirmasi, tombol `Regenerate` per-topik
- **Opsi export:** `Publish ke stubia.id` (JSON manifest via internal API) **ATAU** `Export ke Excel` (format standar Stubia)

---

### 4.5. Employee Task Management (Kanban)

| Fitur | Detail Spesifikasi |
|---|---|
| Kanban Board | 5 kolom: `Backlog / To Do / In Progress / Review / Done`. Drag-and-drop via `@hello-pangea/dnd` |
| Task Card | Judul, assignee (avatar), deadline, badge prioritas (P1–P4), badge tipe, indikator jam estimasi vs aktual |
| Time Tracking | Tombol Start/Stop per task. Log disimpan ke `task_time_logs`. Total jam jadi komponen kalkulasi payroll |
| Dependensi Task | Task punya `parent_task_id` — subtask otomatis terbuat saat event ditambahkan ke Event Timeline |
| Filter & Search | Filter: by assignee, status, deadline (overdue/today/week), tipe. Full-text search nama task |
| Real-time | Socket.io namespace `/kanban` untuk update status task tanpa reload |
| Deadline Alert | Cron job tiap jam: flag task H-1 dan H-0, kirim notifikasi ke assignee dan manager |

---

### 4.6. Corporate Finance Module

| Sub-Fitur | Detail Spesifikasi |
|---|---|
| Cashflow Ledger | Double-entry log: setiap transaksi punya debit/kredit, kategori (Operasional/Marketing/Payroll/Revenue), dan `ref_id` |
| Reimbursement | Upload foto nota (max 5MB) → simpan ke R2, URL di DB. Status: `Submitted → Under Review → Approved/Rejected` |
| Automated Payroll | Cron akhir bulan: ambil task `type=soal, status=Done, is_approved=true` → hitung `count × unit_price + base_salary` → generate slip |
| Dashboard KPI | Card: Total Pengeluaran, Total Pemasukan, Burn Rate, Runway. Bar chart cashflow 6 bulan (Recharts). **Tambahan:** Card AI Cost bulan ini |
| Export | Cashflow & payroll ke Excel (`.xlsx`) via ExcelJS. Filter by date range dan kategori |

---

### 4.7. Company Blueprint & Document Management

| Sub-Fitur | Detail Spesifikasi |
|---|---|
| Vision & Mission Page | Halaman editable oleh Super Admin: visi, misi, core values Stubia |
| OKR Dashboard | Objectives + Key Results dengan progress bar. Status: On Track / At Risk / Off Track |
| Secure Document Drive | Folder hierarkis (Kontrak/Legal/SOP/Internal). RLS per folder per role. Preview PDF in-browser via `react-pdf` |
| Version Control | Setiap upload = versi baru. Versi lama tetap tersimpan dan bisa diakses (soft history) |
| Audit Trail | Setiap akses dokumen sensitif tercatat: `user_id, timestamp, aksi (view/download)`. Tersedia untuk Super Admin |

---

### 4.8. Corporate Event Timeline

| Sub-Fitur | Detail Spesifikasi |
|---|---|
| Kalender Interaktif | Tampilan Month/Week/Day via FullCalendar. Warna by tipe: Tryout (biru), Internal (abu), Marketing (amber) |
| Gantt Chart | Visualisasi overlap event dan dependensi linimasa |
| Auto-Subtask Generation | Event type `tryout` otomatis generate task: Validasi Soal [H-14], Deploy Paket [H-7], Push Marketing [H-3] |
| Event Detail Panel | Slide-over panel kanan: deskripsi, PIC, status, linked tasks, tombol Edit/Delete/Duplicate |
| Reminder System | Notifikasi in-app + email untuk H-7, H-3, H-0 |

---

## 5. Arsitektur Teknis

### 5.1. Frontend — React.js + Tailwind CSS

| Aspek | Detail |
|---|---|
| Framework | React 18 + Vite. File structure: feature-based |
| State Management | Zustand (global state) + TanStack Query (server state, caching, background refetch) |
| Routing | React Router v6, nested routes, protected routes via `<RequireAuth role={...}>` |
| Styling | Tailwind CSS v3. Custom theme extend di `tailwind.config.js` untuk warna brand Stubia + AI Accent |
| Komponen Library | shadcn/ui sebagai base (headless, accessible), dikustomasi sesuai Stubia Design Tokens |
| Form Handling | React Hook Form + Zod (schema-first validation) |
| Rich Text Editor | TipTap + ekstensi matematika (`tiptap-math` / `react-katex`) |
| Real-time | Socket.io-client dengan reconnect otomatis (exponential backoff) |
| File Upload | `react-dropzone` dengan preview sebelum submit |
| AI Generator UI | Streaming response support via `EventSource` / `fetch` streaming untuk live token display |

### 5.2. Backend — Node.js + Express.js

| Aspek | Detail |
|---|---|
| Arsitektur | Clean Architecture: `Routes → Controllers → Services → Repositories` |
| Autentikasi | JWT. Access token 15 menit, Refresh token 7 hari di HttpOnly Cookie |
| Validasi Input | Zod middleware di setiap route. Sanitasi XSS semua input teks |
| File Storage | `@aws-sdk/client-s3` (S3-compatible) untuk Cloudflare R2. Upload stream langsung dari memori |
| Cron Jobs | `node-cron`: deadline checker tiap jam, payroll generator akhir bulan |
| Real-time Server | Socket.io. Namespace `/kanban` untuk task, `/notifications` untuk global |
| Logging | Winston (Console dev + File prod) + morgan untuk request logging |
| Error Handling | Global error handler middleware. Custom `AppError` class |
| Rate Limiting | `express-rate-limit`: Auth 10 req/menit, API 100 req/15 menit, **AI Generate: 20 req/menit per user** |
| AI Integration | Service `AIProviderService` dengan adapter pattern: `OpenAIAdapter`, `ClaudeAdapter`, `GeminiAdapter` |
| Export | ExcelJS untuk generate file `.xlsx` on-demand |

### 5.3. AI Provider Service Architecture

```
AIProviderService
├── getAdapter(provider: 'openai' | 'anthropic' | 'gemini') → AIAdapter
├── generateQuestions(skill, config) → Promise<GeneratedQuestion[]>
└── estimateCost(tokens, model) → number

AIAdapter (interface)
├── sendPrompt(systemPrompt, userPrompt, model) → Promise<string>
└── parseResponse(rawText) → GeneratedQuestion[]

OpenAIAdapter implements AIAdapter
ClaudeAdapter implements AIAdapter
GeminiAdapter implements AIAdapter
```

### 5.4. Database — PostgreSQL via Neon (Serverless)

| Aspek | Detail |
|---|---|
| ORM | Prisma ORM. Schema sebagai source of truth. Migration via `prisma migrate deploy` |
| Koneksi Pooling | Neon Serverless Driver (`@neondatabase/serverless`) + pgBouncer bawaan Neon |
| Anti-Duplikasi | `CREATE EXTENSION pg_trgm;` + `CREATE INDEX idx_questions_soal_trgm ON questions USING GiST (soal_text gist_trgm_ops);` |
| Row-Level Security | RLS aktif di tabel sensitif: `documents`, `payroll_records`, `cashflow_entries` |
| Branching | `main` (production) → `staging` → `dev-[nama]` per developer |
| Backup | Neon PITR otomatis + `pg_dump` manual mingguan ke R2 bucket |

---

## 6. Skema Database

### Tabel Core

| Tabel | Kolom Utama | Relasi & Catatan |
|---|---|---|
| `users` | `id, name, email, password_hash, role (enum), is_active, created_at` | Pusat semua FK |
| `questions` | `id, stimulus, soal_text, soal_html, options_json, answer_key, explanation, type, subtes, topic, difficulty, status, source (enum), model_used, skill_id, created_by, approved_by, created_at` | Indeks GiST pada `soal_text`. Field baru: `stimulus`, `options_json`, `answer_key`, `explanation`, `source`, `model_used`, `skill_id` |
| `ai_skills` | `id, nama_skill, subtes, topik_cakupan_json, instruksi_soal, format_output, contoh_soal_json, larangan, versi, is_active, created_by, updated_at` | Library master prompt AI |
| `ai_generation_logs` | `id, user_id, skill_id, model_used, config_json, questions_generated, questions_saved, questions_blocked, tokens_used, cost_estimate_usd, duration_ms, created_at` | Audit & cost tracking |
| `question_packages` | `id, name, config_json, status, created_by, created_at` | `config_json`: `{ subtests, topics, difficulty_dist, total_questions, include_ai }` |
| `tasks` | `id, title, assignee_id, creator_id, status, type, priority, deadline, parent_task_id, event_id, estimated_hours, actual_hours` | Self-referencing untuk subtask |
| `task_time_logs` | `id, task_id, user_id, started_at, stopped_at, duration_seconds` | Akumulasi durasi → `actual_hours` di `tasks` |
| `events` | `id, title, type, start_date, end_date, pic_id, description, status` | |
| `cashflow_entries` | `id, type (debit/kredit), amount, category, description, ref_id, ref_type, recorded_by, entry_date` | Kategori baru: `AI_COST` |
| `reimbursements` | `id, user_id, amount, description, receipt_url, status, reviewed_by, reviewed_at` | |
| `payroll_records` | `id, user_id, period_month, period_year, base_salary, soal_count, soal_incentive, total_amount, status, generated_at` | |
| `documents` | `id, name, folder_path, file_url, file_type, version, uploaded_by, created_at` | RLS aktif |
| `document_access_logs` | `id, document_id, accessed_by, action (view/download), accessed_at` | |

### Prisma Schema (Excerpt — Tabel Baru)

```prisma
model Question {
  id           String         @id @default(cuid())
  stimulus     String?        // teks pengantar/bacaan, nullable
  soalText     String         @map("soal_text")
  soalHtml     String         @map("soal_html")
  optionsJson  Json           @map("options_json") // { A, B, C, D, E }
  answerKey    String         @map("answer_key")   // "A" atau "A,C" untuk PGK
  explanation  String         // pembahasan lengkap
  subtes       String
  topic        String
  difficulty   Difficulty
  type         QuestionType
  status       QuestionStatus @default(DRAFT)
  source       QuestionSource @default(MANUAL)
  modelUsed    String?        @map("model_used")   // "claude-sonnet-4-6", etc
  skill        AISkill?       @relation(fields: [skillId], references: [id])
  skillId      String?        @map("skill_id")
  createdBy    User           @relation("CreatedQuestions", fields: [createdById], references: [id])
  createdById  String
  approvedBy   User?          @relation("ApprovedQuestions", fields: [approvedById], references: [id])
  approvedById String?
  createdAt    DateTime       @default(now())

  @@map("questions")
}

model AISkill {
  id                 String     @id @default(cuid())
  namaSkill          String
  subtes             String
  topikCakupanJson   Json       // string[]
  instruksiSoal      String     // long text
  formatOutput       String     // JSON schema instruksi
  contohSoalJson     Json?      // few-shot examples
  larangan           String?
  versi              String     @default("v1.0")
  isActive           Boolean    @default(true)
  createdBy          User       @relation(fields: [createdById], references: [id])
  createdById        String
  updatedAt          DateTime   @updatedAt
  questions          Question[]
  generationLogs     AIGenerationLog[]

  @@map("ai_skills")
}

model AIGenerationLog {
  id                 String    @id @default(cuid())
  user               User      @relation(fields: [userId], references: [id])
  userId             String
  skill              AISkill   @relation(fields: [skillId], references: [id])
  skillId            String
  modelUsed          String
  configJson         Json
  questionsGenerated Int
  questionsSaved     Int
  questionsBlocked   Int
  tokensUsed         Int?
  costEstimateUsd    Float?
  durationMs         Int?
  createdAt          DateTime  @default(now())

  @@map("ai_generation_logs")
}

enum QuestionStatus { DRAFT REVIEW APPROVED PUBLISHED ARCHIVED }
enum QuestionSource { MANUAL AI_GENERATED }
enum Difficulty     { EASY MEDIUM HOTS }
enum QuestionType   { PG PGK BS MENJODOHKAN ISIAN }
enum UserRole       { super_admin academic_manager content_creator hr_ops finance_officer }
enum TaskStatus     { BACKLOG TODO IN_PROGRESS REVIEW DONE }
enum TaskType       { soal review admin marketing }
```

---

## 7. Alur Data Kritis

### 7.1. AI Generate → Anti-Duplikasi → Bank Soal

```
User konfigurasi: skill + subtes + topik + difficulty + jumlah
    ↓
POST /api/ai/generate-questions
    ↓
Backend: load skill dari DB, susun master prompt
    ↓
Call AI Provider API (server-side)
    ↓
Parse JSON response, validasi schema Zod
    ↓
Untuk SETIAP soal: jalankan pg_trgm check
  sim > 0.70 → DUPLICATE_BLOCKED
  sim 0.40–0.70 → SIMILARITY_WARNING + ref candidates
  sim < 0.40 → SAFE
    ↓
Return preview ke frontend: { soal, status, candidates[] }
    ↓
User review, edit inline jika perlu, pilih soal mana yang disimpan
    ↓
POST /api/ai/save-generated-questions
    ↓
Backend re-validasi duplikasi (anti-bypass)
    ↓
Insert ke `questions` dengan source=AI_GENERATED, status=DRAFT
Insert ke `ai_generation_logs`
    ↓
Academic Manager review → APPROVED → PUBLISHED
```

### 7.2. Export Soal ke Excel

```
User set filter: subtes, topik, difficulty, status, jumlah
    ↓
GET /api/questions/export?{query params}
    ↓
Backend query: SELECT * FROM questions WHERE [filters] LIMIT 500
    ↓
Untuk setiap soal: parse options_json → OPSI A,B,C,D,E
    ↓
ExcelJS: buat workbook → worksheet "Soal Stubia"
    ↓
Set header row: STIMULUS | SOAL | OPSI A | B | C | D | E | KUNCI | PEMBAHASAN | ...
    ↓
Fill rows: satu soal per baris, strip HTML dari soal_text & explanation
    ↓
Apply styling: header blue, alternating rows, freeze row 1, wrap text
    ↓
res.setHeader('Content-Type', 'application/vnd.openxmlformats...')
res.setHeader('Content-Disposition', 'attachment; filename=stubia-soal-{ts}.xlsx')
workbook.xlsx.write(res)
```

### 7.3. Input Manual Soal & Anti-Duplikasi

```
Tentor ketik soal (≥30 karakter)
    ↓ debounce 500ms
Frontend → POST /api/questions/check-similarity { soal_text }
    ↓
Backend: query pg_trgm similarity
    ↓
sim > 0.7  → return { blocked: true, candidates: [...] }
sim 0.4–0.7 → return { warning: true, candidates: [...] }
sim < 0.4  → return { safe: true }
    ↓
Tentor klik Save → POST /api/questions
    ↓
Backend re-validasi (anti-bypass) → simpan ke DB dengan source=MANUAL
    ↓
Status: DRAFT → Academic Manager review → APPROVED → Push ke stubia.id
```

### 7.4. Siklus Task → Payroll Otomatis

```
HR buat task (type: soal) → assign Tentor → BACKLOG
    ↓
Tentor: Start Timer → drag ke IN_PROGRESS
    ↓
Selesai → drag ke DONE → notifikasi ke Academic Manager
    ↓
Academic Manager: approve task → is_payroll_approved = true
    ↓
[Akhir Bulan] node-cron trigger → POST /internal/payroll/generate
    ↓
Service: ambil semua task DONE + approved per user
    ↓
Hitung: soal_count × unit_price + base_salary = total_amount
    ↓
Insert ke payroll_records + cashflow_entries (debit: Payroll)
    ↓
Finance Officer review → Approve → status: PAID
```

### 7.5. Auto-Subtask dari Event

```
HR/Super Admin buat event (type: tryout)
    ↓
Backend detect event.type === 'tryout'
    ↓
Load template subtasks dari config:
  - "Validasi Soal Paket" → assign: Academic Manager, deadline: H-14
  - "Deploy Paket ke stubia.id" → assign: Tech Team, deadline: H-7
  - "Push Notifikasi & Marketing" → assign: Marketing, deadline: H-3
    ↓
Insert semua task ke task_management dengan parent_event_id
    ↓
Notifikasi dikirim ke masing-masing assignee
```

---

## 8. Keamanan & Non-Functional Requirements

| Kategori | Persyaratan | Target |
|---|---|---|
| Autentikasi | JWT + HttpOnly Cookie. Refresh token rotation setiap login | Access token expire: 15 menit |
| Password | bcrypt hash dengan salt rounds 12 | Min 8 karakter, 1 kapital, 1 angka |
| Transport | HTTPS wajib semua endpoint. HSTS header aktif | TLS 1.2+ |
| Input Sanitasi | Semua input di-sanitize (DOMPurify). Parameterized query via Prisma | Zero SQL injection & XSS |
| File Upload | Validasi MIME type + magic bytes | Max 5MB per file |
| Rate Limiting | Auth: 10 req/menit, API: 100 req/15 menit, **AI Generate: 20 req/menit per user** | Per IP |
| AI API Key | Disimpan di env var, tidak pernah dikirim ke client, di-rotate via console | Server-side only |
| AI Cost Guard | Hard limit per user: max 20 generate/hari (configurable). Alert Super Admin jika cost >threshold | Configurable |
| Prompt Injection | Sanitasi input sebelum dimasukkan ke prompt. Skill hanya bisa diedit Academic Manager+ | Validated |
| Audit Log | CRUD pada data sensitif tercatat di `audit_logs`. AI generation tercatat di `ai_generation_logs` | Retensi 1 tahun |
| Performa DB | Query similarity soal <1.5 detik untuk 100.000 baris | Indeks GiST + pg_trgm |
| Skalabilitas | Neon branching: dev / staging / production isolated | Zero downtime branching |
| Uptime | Production environment | 99.5% monthly |

---

## 9. Deployment & Infrastruktur

| Komponen | Platform | Konfigurasi |
|---|---|---|
| Frontend (React) | **Vercel** | Auto-deploy dari branch `main`. Preview deployment per PR |
| Backend (Node.js) | **Railway / Render** | Dockerfile-based. Min 512MB RAM. Health check: `GET /health` |
| Database | **Neon** (PostgreSQL Serverless) | 3 branch: `main`, `staging`, `dev`. Built-in pgBouncer |
| File Storage | **Cloudflare R2** | Bucket: `stubia-core-uploads`. Signed URL expire 1 jam. $0 egress |
| AI Provider | **Anthropic / OpenAI / Google** | API key di env var Railway. Timeout 60 detik per request |
| Monitoring | **Better Uptime** | Ping setiap 5 menit. Alert email + WhatsApp jika down |
| Logging | **Axiom / Logtail** | Stream log production. Retensi 30 hari. Alert jika error spike |
| CI/CD | **GitHub Actions** | Pipeline: `lint → test → build → deploy`. Blokir merge jika test gagal |

---

## 10. Roadmap & Timeline

| Fase | Durasi | Deliverable | Milestone |
|---|---|---|---|
| **Fase 0** — Fondasi | 2 Minggu | Setup project, auth system, RBAC middleware, DB schema, design system component library | Infrastructure siap, login + role guard berfungsi |
| **Fase 1** — Bank Soal + AI Generator | 4 Minggu | TipTap editor, anti-duplikasi engine, status workflow, **AI Skill Library**, **AI Question Generator**, **preview & save flow** | Soal bisa digenerate AI + duplikasi terdeteksi otomatis |
| **Fase 2** — Export & Package | 2 Minggu | **Export Excel format standar**, Package Generator update (include AI toggle), filter & search bank soal | Tim akademik bisa export soal siap pakai |
| **Fase 3** — Task Management | 2 Minggu | Kanban board DnD, time tracker, notifikasi real-time, deadline alert cron | Tim bisa manage task harian via Kanban |
| **Fase 4** — Finance | 2 Minggu | Cashflow ledger, reimbursement, payroll cron, dashboard KPI (+ AI cost card), export Excel | Finance Officer bisa proses payroll bulanan |
| **Fase 5** — Blueprint & Docs | 1.5 Minggu | Document drive + RLS, OKR dashboard, audit trail, version history | Dokumen legal aman + OKR terpantau |
| **Fase 6** — Event Timeline | 1.5 Minggu | Kalender interaktif, Gantt chart, auto-subtask generation, reminder | Event Tryout auto-generate task tim |
| **Fase 7** — Testing & Launch | 2 Minggu | UAT tim internal, bug fixing, performance testing, deploy production | ✅ Go-live Stubia Core |

> **Total estimasi: ~15 minggu** pengembangan aktif. Target go-live: Q3 2026.

---

## 11. Checklist Pre-Launch

### Security
- [ ] HTTPS aktif di semua endpoint production
- [ ] JWT refresh token rotation diimplementasikan
- [ ] RLS aktif di tabel sensitif (documents, payroll, cashflow)
- [ ] Rate limiting aktif di semua endpoint termasuk AI generate
- [ ] Input sanitasi & parameterized query di semua form
- [ ] AI API key tersimpan di env var, tidak pernah ter-log atau ter-expose ke client
- [ ] Prompt injection test: input berbahaya di field soal tidak bocor ke prompt AI

### Performance
- [ ] Indeks GiST pg_trgm terpasang + ditest dengan 100k baris soal
- [ ] Connection pooling Neon aktif
- [ ] Lazy loading di semua route React (`React.lazy + Suspense`)
- [ ] AI generate endpoint: timeout 60 detik, error handling jika provider down

### Functionality
- [ ] Anti-duplikasi engine: 5 skenario test passed (manual + AI-generated)
- [ ] AI Generator: test 3 provider (Claude, OpenAI, Gemini) dengan 3 skill berbeda
- [ ] AI Generator: test soal yang dihasilkan masuk pipeline duplikasi dengan benar
- [ ] Export Excel: validasi format kolom `STIMULUS | SOAL | OPSI A–E | KUNCI | PEMBAHASAN`
- [ ] Export Excel: test 500 soal, validasi styling dan file tidak corrupt
- [ ] Payroll cron: dry run 3 bulan data dummy passed
- [ ] Auto-subtask generation event: 3 tipe event test passed
- [ ] RBAC: semua role ditest akses yang tidak diperbolehkan

### UX
- [ ] Loading / empty / error state di semua halaman termasuk AI Generator
- [ ] AI Generator: streaming indicator (dots animation atau progress bar token)
- [ ] Responsive layout di tablet (768px) dan desktop
- [ ] Toast notifikasi untuk semua aksi CRUD
- [ ] Export button disabled dan menampilkan loading saat generate file

### Ops
- [ ] Monitoring uptime terpasang (Better Uptime)
- [ ] Logging production dikonfigurasi (Axiom / Logtail)
- [ ] Backup DB otomatis dikonfigurasi
- [ ] CI/CD pipeline: lint + test + build + deploy berjalan
- [ ] AI cost dashboard bisa diakses Super Admin

### UAT
- [ ] Super Admin: test semua modul + rotate AI API key + view AI cost dashboard
- [ ] Academic Manager: test AI Generator end-to-end + skill library management + export Excel
- [ ] Content Creator: test AI Generator + manual input soal + duplikasi flow
- [ ] Finance Officer: test payroll generation bulanan + lihat AI cost di KPI card

---

*Stubia Core PRD v2.1 — Dokumen Internal Rahasia — stubia.id*