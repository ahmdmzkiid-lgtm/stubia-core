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
  const skills: any[] = [];

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
