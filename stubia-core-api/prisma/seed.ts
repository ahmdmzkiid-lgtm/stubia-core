import { PrismaClient, UserRole, Difficulty, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Enable pg_trgm extension & GiST index
  console.log('Enabling pg_trgm extension and creating GiST index...');
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_questions_soal_trgm ON questions USING GiST (soal_text gist_trgm_ops);`);
    console.log('pg_trgm extension and GiST index created.');
  } catch (err) {
    console.error('Failed to create pg_trgm or index:', err);
  }


  // 1. Create Default Users for each role
  const rolesInfo = [
    {
      name: 'Super Admin Stubia',
      email: 'admin@stubia.id',
      password: 'StubiaAdmin123!',
      role: UserRole.super_admin,
    },
    {
      name: 'Academic Manager Stubia',
      email: 'academic@stubia.id',
      password: 'StubiaAcademic123!',
      role: UserRole.academic_manager,
    },
    {
      name: 'Content Creator Tentor',
      email: 'tentor@stubia.id',
      password: 'StubiaTentor123!',
      role: UserRole.content_creator,
    },
    {
      name: 'HR & Ops Officer',
      email: 'hr@stubia.id',
      password: 'StubiaHR123!',
      role: UserRole.hr_ops,
    },
    {
      name: 'Finance Officer',
      email: 'finance@stubia.id',
      password: 'StubiaFinance123!',
      role: UserRole.finance_officer,
    },
  ];

  const seededUsers = [];

  for (const r of rolesInfo) {
    const existing = await prisma.user.findUnique({
      where: { email: r.email },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash(r.password, 12);
      const user = await prisma.user.create({
        data: {
          name: r.name,
          email: r.email,
          passwordHash,
          role: r.role,
          isActive: true,
        },
      });
      console.log(`Seeded user: ${r.email} (${r.role})`);
      seededUsers.push(user);
    } else {
      console.log(`User already exists: ${r.email}`);
      seededUsers.push(existing);
    }
  }

  const adminUser = seededUsers.find(u => u.role === UserRole.super_admin) || seededUsers[0];

  // 2. Create Default AI Skills (Library)
  const skills = [
    {
      namaSkill: 'TKA Bahasa Indonesia Wajib — Generator Soal Tryout',
      subtes: 'TKA Bahasa Indonesia Wajib',
      topikCakupanJson: ['Pemahaman Tekstual', 'Pemahaman Inferensial', 'Evaluasi dan Apresiasi'],
      instruksiSoal: `Anda adalah Pakar Penyusun Soal Tes Kemampuan Akademik (TKA) SMA untuk mata pelajaran Bahasa Indonesia Wajib (Kurikulum Merdeka), mengacu pada kerangka asesmen resmi Pusat Asesmen Pendidikan (Pusmendik), Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) RI.

FOKUS: TKA Bahasa Indonesia difokuskan pada keterampilan membaca — bukan hafalan kaidah kebahasaan.

JENIS TEKS (STIMULUS):
- Teks informasi: tunggal maupun jamak (multi-teks), berisi fakta, konsep, prosedur, dan metakognisi dari berbagai bidang/topik, genre, dan konteks (skala lokal, nasional, global).
- Teks fiksi: realisme atau absurd; latar konkret atau abstrak; tokoh berkarakter bulat; konflik tunggal atau jamak dengan penyelesaian terbuka; alur campuran; sudut pandang campuran.
- Termasuk teks puisi, prosa, dan drama untuk soal yang menilai respons emosional/estetis.

KARAKTERISTIK KEBAHASAAN STIMULUS:
- Kosakata: kata khusus & umum, kata berimbuhan kompleks, kata abstrak, makna denotatif, istilah teknis, makna konotatif sesuai konteks luas.
- Kalimat: 8–12 kata per kalimat, mencakup kalimat kompleks berbagai pola dan kalimat inversi.
- Wacana: konjungsi antarparagraf bermakna "pertentangan" dan "sebab-akibat", tanda baca yang mendukung ungkapan dan makna.
- Panjang teks: 250–300 kata (kecuali teks puisi, yang boleh lebih pendek).

MATRIKS ASESMEN — 3 Kompetensi Utama & Subkompetensi:
1. Pemahaman Tekstual: Mengidentifikasi kata serapan; Mengidentifikasi latar, karakter, atau fenomena; Menyusun kerangka/bagan penting teks.
2. Pemahaman Inferensial: Menyimpulkan ide pokok/gagasan pendukung/tokoh/nilai; Menjelaskan hubungan makna antarkalimat/paragraf; Memprediksi lanjutan/akhir cerita.
3. Evaluasi dan Apresiasi: Menilai relevansi peristiwa dengan kehidupan sehari-hari; Menilai keakuratan/kesesuaian informasi; Menilai ketepatan penggunaan bahasa; Menilai ketepatan bagian teks; Menyimpulkan respons emosional.

DISTRIBUSI SOAL (untuk 30 soal):
- Tipe soal: ± 20 multiple_choice, ± 6 complex_mc_multi, ± 4 complex_mc_tf
- Tingkat kesulitan: ± 30% Mudah, ± 45% Sedang, ± 25% Sulit/HOTS
- Kompetensi: ± 8 Pemahaman Tekstual, ± 10 Pemahaman Inferensial, ± 12 Evaluasi dan Apresiasi

FORMAT KOLOM MATERI: "TOPIK - Materinya" (contoh: "Pemahaman Tekstual - Teks Puisi")
TIPE SOAL & KUNCI JAWABAN:
1. multiple_choice: OPSI A–E 5 pilihan, hanya 1 benar. KUNCI: 1 huruf kapital (contoh: "A").
2. complex_mc_multi: SOAL hanya instruksi singkat. OPSI A–E adalah pilihan pernyataan. KUNCI: gabungan huruf benar dipisah koma (contoh: "A, B" atau "A, B, D").
3. complex_mc_tf: SOAL hanya instruksi evaluasi. OPSI A–E adalah 5 pernyataan TANPA label status. LABEL KOLOM: kategori dikotomis (misal: "TEPAT / TIDAK TEPAT", "BENAR / SALAH", "SESUAI / TIDAK SESUAI", "YA / TIDAK"). KUNCI: format "A:B, B:S, C:B, D:S, E:B" di mana huruf B bertindak sebagai nilai POSITIF (Benar/Tepat/Sesuai/Ya) dan huruf S bertindak sebagai nilai NEGATIF (Salah/Tidak Tepat/Tidak Sesuai/Tidak).`,
      formatOutput: 'JSON array of question objects',
      contohSoalJson: [
        {
          stimulus: 'Kota-kota besar di Indonesia menghadapi tantangan urbanisasi yang semakin kompleks. Pertumbuhan penduduk urban yang pesat tidak diimbangi dengan penyediaan infrastruktur dan layanan publik yang memadai. Kemacetan lalu lintas, banjir, dan polusi udara menjadi masalah kronis yang menurunkan kualitas hidup warga kota.\n\nDi sisi lain, desa-desa mengalami penurunan populasi produktif akibat arus migrasi ke kota. Lahan pertanian yang subur dibiarkan menganggur karena generasi muda lebih tertarik mencari penghidupan di sektor informal perkotaan. Ironisnya, sebagian besar migran urban justru terjebak dalam lingkaran kemiskinan di permukiman kumuh pinggiran kota.\n\nPemerintah telah meluncurkan program "Desa Digital" sebagai upaya desentralisasi ekonomi. Program ini menyediakan infrastruktur internet dan pelatihan kewirausahaan digital bagi pemuda desa. Harapannya, akses terhadap pasar digital dapat mengurangi ketimpangan ekonomi desa-kota dan meredam laju urbanisasi yang tidak terkendali.\n\nDiadaptasi dari www.kompas.com',
          soal: 'Berdasarkan paragraf ketiga, apa tujuan utama program "Desa Digital" yang diluncurkan pemerintah?',
          opsi: {
            A: 'Meningkatkan jumlah penduduk di desa-desa terpencil.',
            B: 'Mengurangi ketimpangan ekonomi desa-kota melalui akses pasar digital.',
            C: 'Menggantikan sektor pertanian dengan industri teknologi di pedesaan.',
            D: 'Menyediakan hiburan digital bagi pemuda desa agar tidak bosan.',
            E: 'Memindahkan pusat pemerintahan dari kota ke desa.'
          },
          kunci_jawaban: 'B',
          pembahasan: 'Paragraf ketiga secara eksplisit menyatakan bahwa program "Desa Digital" bertujuan agar "akses terhadap pasar digital dapat mengurangi ketimpangan ekonomi desa-kota dan meredam laju urbanisasi yang tidak terkendali." Opsi B merupakan parafrase yang tepat dari tujuan ini.',
          subtes: 'TKA Bahasa Indonesia Wajib',
          topik: 'Pemahaman Tekstual',
          difficulty: 'EASY',
          tipe: 'PG',
          materi: 'Pemahaman Tekstual – Mengidentifikasi informasi tersurat dalam teks',
          tipe_soal_tka: 'multiple_choice',
          tingkat_kesulitan: 'Mudah',
          label_kolom: '',
          prompt_gambar: ''
        }
      ],
      larangan: 'DILARANG membuat soal yang bisa dijawab tanpa membaca stimulus (soal hafalan/trivia). DILARANG menaruh label status jawaban di dalam teks OPSI untuk tipe complex_mc_tf. DILARANG menumpuk kunci jawaban di huruf yang sama. DILARANG stimulus melebihi 300 kata (kecuali puisi). DILARANG bahasa tidak baku yang menyimpang dari EYD/PUEBI.',
      versi: 'v1.0',
    }
  ];

  for (const s of skills) {
    const existing = await prisma.aISkill.findFirst({
      where: { namaSkill: s.namaSkill },
    });

    if (!existing) {
      await prisma.aISkill.create({
        data: {
          namaSkill: s.namaSkill,
          subtes: s.subtes,
          topikCakupanJson: s.topikCakupanJson,
          instruksiSoal: s.instruksiSoal,
          formatOutput: s.formatOutput,
          contohSoalJson: s.contohSoalJson,
          larangan: s.larangan,
          versi: s.versi,
          isActive: true,
          createdById: adminUser.id,
        },
      });
      console.log(`Seeded skill: ${s.namaSkill}`);
    } else {
      await prisma.aISkill.update({
        where: { id: existing.id },
        data: {
          subtes: s.subtes,
          topikCakupanJson: s.topikCakupanJson,
          instruksiSoal: s.instruksiSoal,
          contohSoalJson: s.contohSoalJson,
          larangan: s.larangan,
          versi: s.versi,
        }
      });
      console.log(`Updated existing skill: ${s.namaSkill}`);
    }
  }

  console.log('Seeding database completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
