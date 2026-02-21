// scripts/seed-initial-org.ts
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding initial Org and Admin...');
  
  try {
    const org = await prisma.org.upsert({
      where: { slug: 'dixncox' },
      update: {},
      create: {
        name: 'DIXNCOX',
        slug: 'dixncox',
        primaryColor: '#0A0A12',
        accentColor: '#00D1FF', // SC Blue
        whitelabelConfig: {
          create: {
            footerText: 'DIXNCOX Org Loot Vault',
            headerText: 'DIXNCOX',
          }
        }
      },
    });

    await prisma.user.upsert({
      where: { email: 'admin@dixncox.org' },
      update: {},
      create: {
        email: 'admin@dixncox.org',
        name: 'DIXNCOX Admin',
        role: Role.SUPERADMIN,
        orgId: org.id,
      },
    });

    console.log(`Successfully seeded Org: ${org.name} and Admin user.`);
  } catch (error) {
    console.error('Error during initial seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
