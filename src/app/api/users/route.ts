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
  const orgId = searchParams.get("orgId");
  const role = searchParams.get("role");
  const includeAllies = searchParams.get("includeAllies") === "true";

  const isGlobalAdmin = session.user.role === 'SUPERADMIN' && !session.user.orgId;

  // Security: Only GLOBAL Root Admin can filter by arbitrary orgId
  const targetOrgId = (isGlobalAdmin && orgId) ? orgId : session.user.orgId;

  if (!targetOrgId && isGlobalAdmin) {
    // If Global Admin with no org and no specific orgId requested, return all users (capped)
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, username: true, org: { select: { name: true } }, status: true },
      orderBy: { name: 'asc' },
      take: 100
    });
    return NextResponse.json(users);
  }

  if (!targetOrgId) {
    return NextResponse.json({ error: "Missing organization context." }, { status: 400 });
  }

  const where: any = { 
    OR: [
      { orgId: targetOrgId }
    ]
  };

  if (includeAllies) {
    const alliances = await prisma.alliance.findMany({
      where: { orgId: targetOrgId },
      select: { allyId: true }
    });
    const allyIds = alliances.map(a => a.allyId);
    if (allyIds.length > 0) {
      where.OR.push({ orgId: { in: allyIds } });
    }
  }

  if (role) {
    where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      username: true,
      org: { select: { name: true } }
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(users);
}
