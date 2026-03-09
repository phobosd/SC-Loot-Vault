import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";

export async function GET() {
  let orgId: string | null = null;

  try {
    orgId = await validateApiKey();
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let org = null;

  if (orgId) {
    org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { name: true }
    });
  }

  const assignments = await prisma.distributionLog.findMany({
    where: { 
      orgId: orgId,
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
