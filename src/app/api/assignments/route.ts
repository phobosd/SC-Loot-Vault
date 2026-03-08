import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId;
  let org = null;

  if (orgId) {
    org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { name: true }
    });
  }

  const assignments = await prisma.distributionLog.findMany({
    where: { 
      ...(orgId ? { orgId } : {}),
      type: "ASSIGNED"
    },
    include: {
      recipient: {
        select: {
          name: true,
          email: true,
          role: true,
          image: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  return NextResponse.json({
    assignments,
    orgName: org?.name || "NEXUS NETWORK"
  });
}
