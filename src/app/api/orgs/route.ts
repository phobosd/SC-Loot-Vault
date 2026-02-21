import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.org.findMany({
    select: {
      id: true,
      name: true,
      slug: true
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(orgs);
}
