// scripts/deduplicate-manifest.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deduplicate() {
  console.log('Starting manifest deduplication...');
  
  try {
    const allItems = await prisma.sCItemCache.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const seenNames = new Set<string>();
    const idsToDelete: string[] = [];

    for (const item of allItems) {
      if (seenNames.has(item.name)) {
        idsToDelete.push(item.id);
      } else {
        seenNames.add(item.name);
      }
    }

    console.log(`Found ${idsToDelete.length} duplicate entries.`);

    if (idsToDelete.length > 0) {
      // Delete in batches to avoid SQLite limits
      const batchSize = 100;
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        await prisma.sCItemCache.deleteMany({
          where: {
            id: { in: batch }
          }
        });
        console.log(`Deleted batch ${i / batchSize + 1}...`);
      }
    }

    const finalCount = await prisma.sCItemCache.count();
    console.log(`Deduplication complete. Remaining items: ${finalCount}`);

  } catch (error: any) {
    console.error('Error during deduplication:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deduplicate();
