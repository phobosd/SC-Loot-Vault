import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const org = await prisma.org.findFirst();
    if (!org) return NextResponse.json([]);

    const users = await prisma.user.findMany({
      where: { orgId: org.id },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
