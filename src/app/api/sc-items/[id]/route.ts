import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let identifier = id;
  let isNameLookup = false;

  if (id.startsWith("name:")) {
    identifier = decodeURIComponent(id.replace("name:", ""));
    isNameLookup = true;
  }

  try {
    console.log(`[TELEMETRY] Fetching data for: ${identifier} (isNameLookup: ${isNameLookup})`);
    
    // 1. Try to find in Cache first (Master Manifest)
    let item = await prisma.sCItemCache.findFirst({
      where: {
        OR: [
          { id: identifier },
          { wikiId: identifier },
          { name: identifier }
        ]
      }
    });

    // 2. If not found in cache and not explicitly a name lookup, check Org Loot items by ID
    if (!item && !isNameLookup) {
      console.log(`[TELEMETRY] Not in cache, checking LootItem: ${identifier}`);
      const lootItem = await prisma.lootItem.findUnique({
        where: { id: identifier }
      });
      
      if (lootItem) {
        console.log(`[TELEMETRY] Found in LootItem, bridging to cache: ${lootItem.name}`);
        // Try to find master data for this loot item by name
        const cacheItem = await prisma.sCItemCache.findFirst({
          where: { name: lootItem.name }
        });
        
        if (cacheItem) {
          return NextResponse.json({
            ...cacheItem,
            id: lootItem.id, // Use the LootItem ID for actions
            isOrgItem: true,
            quantity: lootItem.quantity
          });
        }
        
        // If still no master data, just return the loot item data mapped to cache schema
        return NextResponse.json({
          id: lootItem.id,
          name: lootItem.name,
          type: lootItem.category,
          subType: lootItem.subCategory,
          size: lootItem.size,
          grade: lootItem.grade,
          class: lootItem.class,
          manufacturer: lootItem.manufacturer,
          description: "No extended telemetry available for this specific manifest entry.",
          isOrgItem: true,
          quantity: lootItem.quantity
        });
      }
    }

    if (!item) {
      console.log(`[TELEMETRY] 404 - Item not found: ${identifier}`);
      return NextResponse.json({ error: "Item not found in master manifest." }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("[TELEMETRY] Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch telemetry: " + error.message }, { status: 500 });
  }
}
