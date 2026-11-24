import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting Database Cleanup...");

  // Delete transactional data in the correct order (child tables first)
  await prisma.revisionChecklist.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.defensePanelMember.deleteMany();
  await prisma.defenseSchedule.deleteMany();
  await prisma.titleProposal.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.capstoneGroup.deleteMany();

  console.log("✅ Cleanup Complete! All dummy groups, schedules, and proposals have been wiped.");
  console.log("👥 Users, Advisers, Panelists, Rooms, and Criteria have been preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });