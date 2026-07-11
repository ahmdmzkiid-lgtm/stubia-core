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
      namaSkill: 'Matematika Dasar — Aljabar UTBK',
      subtes: 'Penalaran Matematika',
      topikCakupanJson: ['Persamaan Linear', 'Sistem Persamaan', 'Fungsi Kuadrat', 'Aljabar'],
      instruksiSoal: 'Fokus pada soal penalaran aljabar, bukan sekadar hitung-hitungan kering. Soal harus berbasis studi kasus atau pemecahan masalah kontekstual yang relevan dengan kehidupan sehari-hari (misal: analisis biaya, optimasi keuntungan, atau model pertumbuhan). Soal harus menguji kemampuan pemodelan matematika tingkat tinggi (HOTS) di mana siswa harus menerjemahkan narasi menjadi bentuk matematika dan menyelesaikannya.',
      formatOutput: 'JSON array of question objects',
      contohSoalJson: [
        {
          stimulus: 'Sebuah perusahaan startup penyedia jasa les privat menetapkan biaya langganan bulanan tetap sebesar Rp 150.000 ditambah tarif per sesi sebesar Rp 40.000. Untuk menarik pelanggan baru, mereka memberikan diskon 20% khusus untuk tarif per sesi selama 3 bulan pertama.',
          soal: 'Jika seorang siswa mendaftar dan berencana mengambil x sesi setiap bulan selama masa promosi, fungsi matematika f(x) yang menyatakan total pengeluaran siswa tersebut per bulan adalah...',
          opsi: {
            A: 'f(x) = 150.000 + 40.000x',
            B: 'f(x) = 150.000 + 32.000x',
            C: 'f(x) = 120.000 + 32.000x',
            D: 'f(x) = 120.000 + 40.000x',
            E: 'f(x) = 150.000 + 8.000x'
          },
          kunci_jawaban: 'B',
          pembahasan: 'Biaya langganan tetap tidak mendapat diskon: Rp 150.000.\nTarif per sesi normal: Rp 40.000.\nTarif per sesi setelah diskon 20% selama masa promosi: Rp 40.000 - (20% x Rp 40.000) = Rp 32.000.\nJika siswa mengambil x sesi per bulan, total tarif sesi adalah 32.000x.\nMaka, fungsi total pengeluaran per bulan f(x) adalah biaya tetap + total biaya sesi = 150.000 + 32.000x.',
          difficulty: 'MEDIUM',
          tipe: 'PG'
        }
      ],
      larangan: 'Jangan membuat soal yang langsung meminta penyederhanaan aljabar abstrak seperti "sederhanakan x^2 - y^2". Harus ada konteks cerita yang realistis. Jangan berikan angka pecahan yang terlalu rumit dihitung manual tanpa kalkulator.',
      versi: 'v1.0',
    },
    {
      namaSkill: 'Analisis Paragraf & Simpulan Bacaan',
      subtes: 'Pemahaman Bacaan dan Menulis',
      topikCakupanJson: ['Simpulan Paragraf', 'Gagasan Utama', 'Pernyataan Sesuai/Tidak Sesuai'],
      instruksiSoal: 'Buatlah soal yang menguji kemampuan analisis wacana wacana panjang. Berikan stimulus berupa teks berita opini atau artikel ilmiah singkat sepanjang 150-250 kata. Pastikan opsi jawaban sangat mirip (pengecoh yang kuat) sehingga siswa harus benar-benar menganalisis keabsahan logika simpulan atau gagasan utama, bukan sekadar mencocokkan kata kunci.',
      formatOutput: 'JSON array of question objects',
      contohSoalJson: [
        {
          stimulus: 'Meskipun kendaraan listrik sering dikampanyekan sebagai solusi ramah lingkungan untuk menekan emisi karbon, dampak ekologis dari proses produksi baterainya masih menuai perdebatan. Penambangan nikel dan litium, yang merupakan bahan baku utama baterai, membutuhkan energi sangat besar dan berpotensi mencemari ekosistem air lokal jika tidak dikelola dengan standar yang ketat. Di sisi lain, transisi energi dari bahan bakar fosil tetap menjadi agenda darurat global untuk mencegah pemanasan global yang lebih parah.',
          soal: 'Berdasarkan teks di atas, simpulan yang paling tepat dan logis adalah...',
          opsi: {
            A: 'Kendaraan listrik sebenarnya tidak ramah lingkungan karena memicu kerusakan ekosistem air.',
            B: 'Transisi ke kendaraan listrik tetap mendesak dilakukan, meskipun pengelolaan dampak tambang baterai harus menjadi perhatian serius.',
            C: 'Penambangan nikel dan litium harus segera dihentikan demi menjaga kelestarian ekosistem air di lokasi penambangan.',
            D: 'Kerusakan akibat tambang bahan baku baterai jauh lebih berbahaya daripada polusi udara akibat kendaraan berbahan bakar fosil.',
            E: 'Kendaraan listrik akan menjadi solusi sempurna bagi pemanasan global jika pasokan nikel dan litium melimpah.'
          },
          kunci_jawaban: 'B',
          pembahasan: 'Teks menyebutkan kendaraan listrik memiliki perdebatan di tambang baterai tetapi di sisi lain transisi energi tetap merupakan agenda darurat. Pilihan B mencakup kedua sisi ini secara seimbang dan logis: transisi tetap mendesak dilakukan dengan catatan pengelolaan dampak tambang harus diperhatikan.',
          difficulty: 'MEDIUM',
          tipe: 'PG'
        }
      ],
      larangan: 'Hindari membuat soal yang jawabannya tertulis secara verbatim di dalam teks. Pengecoh tidak boleh berupa kalimat tidak masuk akal secara umum, melainkan kalimat yang tampak masuk akal namun tidak didukung oleh teks.',
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
      console.log(`Skill already exists: ${s.namaSkill}`);
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
