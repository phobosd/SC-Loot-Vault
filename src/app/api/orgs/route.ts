import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const orgs = await prisma.org.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(orgs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orgs" }, { status: 500 });
  }
}
