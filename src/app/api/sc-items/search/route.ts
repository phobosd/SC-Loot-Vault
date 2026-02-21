import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const items = await prisma.sCItemCache.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      take: 10,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
