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

export async function wipeLootManifest(orgId: string) {
  try {
    await prisma.lootItem.deleteMany({
      where: { orgId }
    });
    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createLootRequest(data: {
  orgId: string;
  userId: string;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
}) {
  try {
    const request = await prisma.lootRequest.create({
      data: {
        ...data,
        status: "PENDING"
      }
    });
    revalidatePath("/vault");
    revalidatePath("/dashboard");
    return { success: true, request };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveLootRequest(requestId: string, adminId: string) {
  try {
    const request = await prisma.lootRequest.findUnique({
      where: { id: requestId },
      include: { org: true, user: true }
    });

    if (!request) throw new Error("Request not found.");
    if (request.status !== "PENDING") throw new Error("Request already processed.");

    // 1. Check vault availability
    const vaultItem = await prisma.lootItem.findUnique({
      where: { id: request.itemId }
    });

    if (!vaultItem || vaultItem.quantity < request.quantity) {
      throw new Error("Insufficient stock in vault to approve request.");
    }

    // 2. Perform transaction
    await prisma.$transaction([
      // Decrease vault quantity
      prisma.lootItem.update({
        where: { id: request.itemId },
        data: { quantity: { decrement: request.quantity } }
      }),
      // Create assignment log
      prisma.distributionLog.create({
        data: {
          orgId: request.orgId,
          recipientId: request.userId,
          itemName: request.itemName,
          quantity: request.quantity,
          type: "ASSIGNED",
          method: "REQUEST_APPROVAL",
          performedBy: adminId
        }
      }),
      // Update request status
      prisma.lootRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      })
    ]);

    revalidatePath("/vault");
    revalidatePath("/assigned");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectLootRequest(requestId: string, reason: string) {
  try {
    await prisma.lootRequest.update({
      where: { id: requestId },
      data: { 
        status: "REJECTED",
        denialReason: reason
      }
    });
    revalidatePath("/dashboard");
    revalidatePath("/vault");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
