import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isGlobalAdmin = session.user.role === 'SUPERADMIN' && !session.user.orgId;
  const counts: any = {
    pendingOrgRequests: 0,
    pendingUserRequests: 0,
    pendingAllianceRequests: 0
  };

  if (isGlobalAdmin) {
    // Global Admin sees ALL pending orgs and ALL pending users
    const [orgReqs, userReqs] = await Promise.all([
      prisma.orgRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "PENDING" } })
    ]);
    counts.pendingOrgRequests = orgReqs;
    counts.pendingUserRequests = userReqs;
  } else if (session.user.orgId) {
    // Org Admin sees pending users in THEIR org and pending alliance requests
    const [userReqs, allianceReqs] = await Promise.all([
      prisma.user.count({ 
        where: { 
          orgId: session.user.orgId, 
          status: "PENDING" 
        } 
      }),
      prisma.allianceRequest.count({ 
        where: { 
          targetOrgId: session.user.orgId, 
          status: "PENDING" 
        } 
      })
    ]);
    counts.pendingUserRequests = userReqs;
    counts.pendingAllianceRequests = allianceReqs;
  }

  return NextResponse.json(counts);
}
