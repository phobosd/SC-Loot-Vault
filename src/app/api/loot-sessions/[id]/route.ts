import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lootSession = await prisma.lootSession.findUnique({
    where: { id },
    include: {
      items: true,
      participants: {
        where: { userId: session.user.id }
      }
    }
  });

  if (!lootSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(lootSession);
}
