import { prisma } from '../src/config/database';

async function cleanDatabase() {
  console.log('🧹 Removing all mock/seed data from PostgreSQL database...');
  try {
    await prisma.auditEvent.deleteMany({});
    await prisma.milestoneMedia.deleteMany({});
    await prisma.milestone.deleteMany({});
    await prisma.evidenceRequirement.deleteMany({});
    await prisma.verification.deleteMany({});
    await prisma.comparison.deleteMany({});
    await prisma.story.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.aIMetadata.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.project.deleteMany({});
    console.log('✅ All mock data successfully cleared from database!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
