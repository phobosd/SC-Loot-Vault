// scripts/seed-sc-items.ts
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'https://api.star-citizen.wiki/api/items';

/**
 * REFINED SYNC LIST:
 * - Ship Weapons (Ship.Weapon)
 * - Shields (Ship.Shield)
 * - Missile Racks (Ship.MissileLauncher.MissileRack)
 * - Power Plants (Ship.PowerPlant)
 * - Coolers (Ship.Cooler)
 * - Quantum Drives (Ship.QuantumDrive)
 * - FPS Weapons (FPS.Weapon)
 * - FPS Armor (CharArmor)
 */
const TARGET_CLASSIFICATIONS = [
  'Ship.Weapon',
  'Ship.Shield',
  'Ship.MissileLauncher.MissileRack',
  'Ship.PowerPlant',
  'Ship.Cooler',
  'Ship.QuantumDrive',
  'FPS.Weapon',
  'CharArmor'
];

async function seed() {
  console.log('Starting Final Refined SC Item Seeding...');
  
  try {
    console.log('Clearing existing SCItemCache for clean sync...');
    await prisma.sCItemCache.deleteMany({});

    let page = 1;
    let totalPages = 1;
    const pageSize = 100;

    do {
      console.log(`Fetching page ${page}/${totalPages || '?' }...`);
      const response = await axios.get(API_BASE, {
        params: {
          'page[size]': pageSize,
          'page[number]': page,
        },
        headers: {
          'accept': 'application/json'
        }
      });

      const { data, meta } = response.data;
      totalPages = meta.last_page;

      if (data.length === 0) break;

      const filteredItems = data.filter((item: any) => {
        const cls = item.classification || "";
        const name = item.name || "";
        const isPlaceholder = name.includes('PLACEHOLDER') || name.includes('TBD') || name === "";
        return !isPlaceholder && TARGET_CLASSIFICATIONS.some(target => cls.startsWith(target));
      });

      if (filteredItems.length > 0) {
        console.log(`Page ${page}: Found ${filteredItems.length} matching items.`);
        for (const item of filteredItems) {
          // Check if we've already cached an item with this name to prevent duplicates
          const existing = await prisma.sCItemCache.findFirst({
            where: { name: item.name }
          });

          if (existing) {
            // Update existing record if found, but keep the name as the primary identity
            await prisma.sCItemCache.update({
              where: { id: existing.id },
              data: {
                wikiId: item.uuid, // Keep latest UUID
                type: item.type || item.classification || 'Unknown',
                subType: item.sub_type || null,
                manufacturer: item.manufacturer?.name || null,
                size: item.size !== null && item.size !== undefined ? String(item.size) : null,
                grade: item.grade !== null && item.grade !== undefined ? String(item.grade) : null,
                class: item.class !== null && item.class !== undefined ? String(item.class) : null,
                description: item.description?.en_EN || null,
                imageUrl: item.web_url ? `${item.web_url}/image` : null,
              }
            });
          } else {
            await prisma.sCItemCache.create({
              data: {
                wikiId: item.uuid,
                name: item.name,
                type: item.type || item.classification || 'Unknown',
                subType: item.sub_type || null,
                manufacturer: item.manufacturer?.name || null,
                size: item.size !== null && item.size !== undefined ? String(item.size) : null,
                grade: item.grade !== null && item.grade !== undefined ? String(item.grade) : null,
                class: item.class !== null && item.class !== undefined ? String(item.class) : null,
                description: item.description?.en_EN || null,
                imageUrl: item.web_url ? `${item.web_url}/image` : null,
              },
            });
          }
        }
      }

      page++;
    } while (page <= totalPages);

    console.log('\nRefined Seeding completed successfully!');
    
    const count = await prisma.sCItemCache.count();
    console.log(`Total items in Master Manifest: ${count}`);

  } catch (error: any) {
    console.error('Error during seeding:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
