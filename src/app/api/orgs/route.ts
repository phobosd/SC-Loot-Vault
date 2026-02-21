import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session: any = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const isSignup = searchParams.get("signup") === "true";

  // Allow public access ONLY for the signup enrollment dropdown
  if (!isSignup) {
    if (!session?.user || session.user.role !== 'SUPERADMIN' || session.user.orgId) {
      return NextResponse.json({ error: "Unauthorized: Global Root Access Required" }, { status: 401 });
    }
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
