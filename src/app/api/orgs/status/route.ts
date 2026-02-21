import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.org.findUnique({
    where: { id: session.user.orgId },
    select: { discordBotLastSeen: true }
  });

  return NextResponse.json({ lastSeen: org?.discordBotLastSeen });
}
