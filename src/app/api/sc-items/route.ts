import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";

  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (query) {
      where.name = { 
        contains: query,
        mode: 'insensitive'
      };
    }
    if (type) {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      prisma.sCItemCache.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.sCItemCache.count({ where })
    ]);

    return NextResponse.json({
      items,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
