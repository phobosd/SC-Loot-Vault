import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { addLootItemsSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

async function getAuthorizedOrgId() {
  let orgId: string | null = null;
  // 1. Try API Key Auth first
  orgId = await validateApiKey();
  
  // 2. Fallback to Session Auth
  if (!orgId) {
    const session: any = await getServerSession(authOptions);
    if (session?.user?.orgId) {
      orgId = session.user.orgId;
    }
  }
  return orgId;
}

export async function GET(request: Request) {
  let orgId: string | null = null;

  try {
    orgId = await getAuthorizedOrgId();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized: Missing API Key or Session" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (query && query.length >= 2) {
    // Fuzzy search within the organization's inventory
    const inventory = await prisma.$queryRaw`
      SELECT *, similarity(name, ${query}) as score
      FROM "LootItem"
      WHERE "orgId" = ${orgId} AND "quantity" > 0 AND (name % ${query} OR name ILIKE ${'%' + query + '%'})
      ORDER BY score DESC, name ASC
      LIMIT 50
    `;
    return NextResponse.json(inventory);
  }

  const inventory = await prisma.lootItem.findMany({
    where: { 
      orgId: orgId,
      quantity: { gt: 0 }
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(inventory);
}

export async function POST(request: Request) {
  let orgId: string | null = null;

  try {
    orgId = await getAuthorizedOrgId();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];
    
    // Inject orgId into each item if not present or mismatching
    const itemsToValidate = items.map(item => ({ ...item, orgId }));
    
    const validatedItems = addLootItemsSchema.parse(itemsToValidate);
    const validItems = validatedItems.filter(i => i.name.trim() !== "");

    if (validItems.length === 0) {
      return NextResponse.json({ error: "No valid items provided" }, { status: 400 });
    }

    // Fuzzy matching enrichment logic (same as Server Action)
    const enrichedItems = await Promise.all(validItems.map(async (item) => {
      try {
        const matches: any[] = await prisma.$queryRaw`
          SELECT name, type, manufacturer, "subType"
          FROM "SCItemCache"
          WHERE name % ${item.name} OR name ILIKE ${item.name}
          ORDER BY similarity(name, ${item.name}) DESC
          LIMIT 1
        `;
        
        if (matches.length > 0) {
          const match = matches[0];
          return {
            ...item,
            category: (item.category === "Unknown" || !item.category) ? (match.type || item.category) : item.category,
            manufacturer: !item.manufacturer ? (match.manufacturer || null) : item.manufacturer,
            subCategory: !item.subCategory ? (match.subType || null) : item.subCategory
          };
        }
      } catch (e) {
        // Silent fail for enrichment
      }
      return item;
    }));

    await prisma.lootItem.createMany({
      data: enrichedItems.map(i => ({
        ...i,
        source: "External API",
        lastUpdatedBy: "API_UPLINK"
      }))
    });

    // Log the addition
    await prisma.distributionLog.create({
      data: {
        orgId,
        itemName: `External Manifest Ingestion: ${validItems.length} items`,
        quantity: validItems.reduce((acc, i) => acc + i.quantity, 0),
        type: "MANIFEST_ADD",
        method: "API_UPLINK",
        performedBy: "SYSTEM_UPLINK"
      }
    });

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    revalidatePath("/logs");

    return NextResponse.json({ success: true, count: validItems.length });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
