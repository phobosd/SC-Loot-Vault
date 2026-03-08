import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.user.orgId) {
    return NextResponse.json(null);
  }

  const org = await prisma.org.findUnique({
    where: { id: session.user.orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      secondaryColor: true,
      successColor: true,
      dangerColor: true,
      textColor: true,
      discordBotLastSeen: true,
      discordGuildId: true,
      whitelabelConfig: true,
      _count: {
        select: {
          receivedAllianceRequests: {
            where: { status: "PENDING" }
          }
        }
      }
    }
  });

  return NextResponse.json(org);
}
