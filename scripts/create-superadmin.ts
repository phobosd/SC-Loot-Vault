// scripts/create-superadmin.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = "ADMIN";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const org = await prisma.org.findFirst({ where: { slug: 'dixncox' } });
  if (!org) {
    console.error("DIXNCOX org not found. Run seed-initial-org.ts first.");
    return;
  }

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: Role.SUPERADMIN,
    },
    create: {
      username,
      password: hashedPassword,
      name: "Global Root Admin",
      role: Role.SUPERADMIN,
      orgId: org.id,
    },
  });

  console.log(`-----------------------------------------`);
  console.log(`SUPERADMIN PROVISIONED`);
  console.log(`Designation: ${username}`);
  console.log(`Security Key: ${password}`);
  console.log(`Org Link: ${org.name}`);
  console.log(`-----------------------------------------`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
