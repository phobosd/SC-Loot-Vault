import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.lootSession.findMany({
    where: { 
      orgId: session.user.orgId,
      status: "ACTIVE",
      participants: {
        some: {
          userId: session.user.id
        }
      }
    },
    include: {
      participants: {
        where: {
          userId: session.user.id
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(sessions);
}
