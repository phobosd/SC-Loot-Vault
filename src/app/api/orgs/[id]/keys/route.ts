import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const keys = await prisma.apiKey.findMany({
    where: { orgId: id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsed: true,
      key: true, // We'll manually mask this in the next step or here
    },
    orderBy: { createdAt: 'desc' }
  });

  const maskedKeys = keys.map(k => ({
    ...k,
    key: `nx_••••••••${k.key.slice(-4)}`
  }));

  return NextResponse.json(maskedKeys);
}
