import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  let isAuthorized = false;

  try {
    const orgId = await validateApiKey();
    if (orgId) {
      isAuthorized = true;
    } else {
      const session = await getServerSession(authOptions);
      if (session) isAuthorized = true;
    }
  } catch (err) {
    // API key was provided but invalid
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    console.log("[SEARCH DEBUG] Querying for:", query);
    
    // Use trigram similarity for fuzzy matching
    const items = await prisma.$queryRaw`
      SELECT *, similarity(name, ${query}) as score
      FROM "SCItemCache"
      WHERE name % ${query} OR name ILIKE ${'%' + query + '%'}
      ORDER BY score DESC, name ASC
      LIMIT 10
    `;
    
    console.log("[SEARCH DEBUG] Found items:", (items as any[]).length);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
