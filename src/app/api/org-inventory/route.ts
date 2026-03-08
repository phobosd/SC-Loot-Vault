import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (query && query.length >= 2) {
    // Fuzzy search within the organization's inventory
    const inventory = await prisma.$queryRaw`
      SELECT *, similarity(name, ${query}) as score
      FROM "LootItem"
      WHERE "orgId" = ${session.user.orgId} AND "quantity" > 0 AND (name % ${query} OR name ILIKE ${'%' + query + '%'})
      ORDER BY score DESC, name ASC
      LIMIT 50
    `;
    return NextResponse.json(inventory);
  }

  const inventory = await prisma.lootItem.findMany({
    where: { 
      orgId: session.user.orgId,
      quantity: { gt: 0 }
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(inventory);
}
