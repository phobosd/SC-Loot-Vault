"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addLootItems(items: {
  orgId: string;
  name: string;
  category: string;
  subCategory?: string | null;
  quantity: number;
  size?: string | null;
  grade?: string | null;
  class?: string | null;
  manufacturer?: string | null;
}[]) {
  try {
    // Filter out items with no name
    const validItems = items.filter(i => i.name.trim() !== "");
    
    if (validItems.length === 0) return { success: false, error: "No valid items to add." };

    await prisma.lootItem.createMany({
      data: validItems.map(i => ({
        ...i,
        source: "Manual Entry"
      }))
    });

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true, count: validItems.length };
  } catch (error: any) {
    console.error("Error adding loot:", error);
    return { success: false, error: error.message };
  }
}

export async function removeLootItems(itemIds: string[]) {
  try {
    await prisma.lootItem.deleteMany({
      where: {
        id: { in: itemIds }
      }
    });
    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLootItem(itemId: string, quantity: number) {
  try {
    await prisma.lootItem.update({
      where: { id: itemId },
      data: { quantity }
    });
    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
