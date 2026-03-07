import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const alliances = await prisma.alliance.findMany();
  console.log('ALL ALLIANCES:', JSON.stringify(alliances, null, 2));
  
  const requests = await prisma.allianceRequest.findMany();
  console.log('ALL REQUESTS:', JSON.stringify(requests, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
