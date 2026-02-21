import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const role = searchParams.get("role");

  try {
    let whereClause: any = {};
    
    if (orgId) {
      whereClause.orgId = orgId;
    } else {
      const org = await prisma.org.findFirst();
      if (!org) return NextResponse.json([]);
      whereClause.orgId = org.id;
    }

    if (role) {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
