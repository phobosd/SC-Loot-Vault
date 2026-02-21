import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    console.log(`[TELEMETRY] Fetching data for: ${id}`);
    // Try to find in Cache first (Master Manifest)
    let item = await prisma.sCItemCache.findFirst({
      where: {
        OR: [
          { id: id },
          { wikiId: id },
          { name: id }
        ]
      }
    });

    // If not found in cache, check Org Loot items
    if (!item) {
      console.log(`[TELEMETRY] Not in cache, checking LootItem: ${id}`);
      const lootItem = await prisma.lootItem.findUnique({
        where: { id: id }
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
      console.log(`[TELEMETRY] 404 - Item not found: ${id}`);
      return NextResponse.json({ error: "Item not found in master manifest." }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("[TELEMETRY] Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch telemetry: " + error.message }, { status: 500 });
  }
}
