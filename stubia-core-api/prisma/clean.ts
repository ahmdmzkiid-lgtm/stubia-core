import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Wiping Database History and Non-Admin Accounts ---');

  // 1. Delete dependent document records
  console.log('Deleting document logs...');
  await prisma.documentAccessLog.deleteMany({});
  await prisma.document.deleteMany({});

  // 2. Delete chat logs
  console.log('Deleting chat histories...');
  await prisma.chatMessage.deleteMany({});
  await prisma.chatParticipant.deleteMany({});
  await prisma.chatRoom.deleteMany({});

  // 3. Delete tasks and time logs
  console.log('Deleting task boards and logs...');
  await prisma.taskTimeLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.event.deleteMany({});

  // 4. Delete finance records
  console.log('Deleting cashflows, payroll, and reimbursements...');
  await prisma.cashflowEntry.deleteMany({});
  await prisma.reimbursement.deleteMany({});
  await prisma.payrollRecord.deleteMany({});

  // 5. Delete OKRs
  console.log('Deleting OKRs objectives...');
  await prisma.keyResult.deleteMany({});
  await prisma.objective.deleteMany({});

  // 6. Delete questions, packages, and generations
  console.log('Deleting question packages and logs...');
  await prisma.aIGenerationLog.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionPackage.deleteMany({});
  await prisma.aISkill.deleteMany({});

  // 7. Reset user accounts (preserving only admin@stubia.id)
  const adminEmail = 'admin@stubia.id';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash('StubiaAdmin123!', 12);
    adminUser = await prisma.user.create({
      data: {
        name: 'Super Admin Stubia',
        email: adminEmail,
        passwordHash,
        role: UserRole.super_admin,
        isActive: true,
      },
    });
    console.log(`Created default Super Admin account: ${adminEmail}`);
  }

  console.log('Deleting all other user accounts...');
  const delUsersResult = await prisma.user.deleteMany({
    where: {
      email: { not: adminEmail },
    },
  });
  console.log(`Deleted ${delUsersResult.count} other accounts.`);

  // 8. Re-seed default AI skills so that the question generator is operational on launch
  console.log('Re-seeding standard AI skills...');
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
  }

  console.log('--- Database Reset & seeding completed successfully ---');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
