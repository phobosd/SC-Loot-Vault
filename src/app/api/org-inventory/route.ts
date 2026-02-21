import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
