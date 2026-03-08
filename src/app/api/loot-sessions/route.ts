import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch sessions where the user is either the creator (Admin) or a participant
  const sessions = await prisma.lootSession.findMany({
    where: { 
      status: { in: ["ACTIVE", "SPINNING"] },
      OR: [
        { orgId: session.user.orgId }, // If null (SuperAdmin), matches global sessions
        { participants: { some: { userId: session.user.id } } }
      ]
    },
    include: {
      participants: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(sessions);
}
