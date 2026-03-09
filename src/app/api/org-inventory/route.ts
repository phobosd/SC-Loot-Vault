import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  let orgId: string | null = null;

  try {
    // 1. Try API Key Auth first
    orgId = await validateApiKey();
    
    // 2. Fallback to Session Auth
    if (!orgId) {
      const session: any = await getServerSession(authOptions);
      if (session?.user?.orgId) {
        orgId = session.user.orgId;
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized: Missing API Key or Session" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (query && query.length >= 2) {
    // Fuzzy search within the organization's inventory
    const inventory = await prisma.$queryRaw`
      SELECT *, similarity(name, ${query}) as score
      FROM "LootItem"
      WHERE "orgId" = ${orgId} AND "quantity" > 0 AND (name % ${query} OR name ILIKE ${'%' + query + '%'})
      ORDER BY score DESC, name ASC
      LIMIT 50
    `;
    return NextResponse.json(inventory);
  }

  const inventory = await prisma.lootItem.findMany({
    where: { 
      orgId: orgId,
      quantity: { gt: 0 }
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(inventory);
}
