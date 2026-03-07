"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth, requireOrgAccess } from "@/lib/auth-checks";

import { addLootItemsSchema } from "@/lib/validations";

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
    const user = await requireAdmin();
    const validatedItems = addLootItemsSchema.parse(items);
    
    const validItems = validatedItems.filter(i => i.name.trim() !== "");
    
    if (validItems.length === 0) return { success: false, error: "No valid items to add." };

    // Verify user has access to add to this org (unless superadmin)
    if (user.role !== "SUPERADMIN" && validItems.some(i => i.orgId !== user.orgId)) {
       throw new Error("Forbidden: Cannot add items to an organization you do not belong to.");
    }

    await prisma.lootItem.createMany({
      data: validItems.map(i => ({
        ...i,
        source: "Manual Entry",
        lastUpdatedBy: user.username
      }))
    });

    // Log the addition
    let logItemName = "";
    if (validItems.length === 1) {
      logItemName = `Asset Added: ${validItems[0].name}`;
    } else {
      const names = validItems.map(i => i.name);
      const displayedNames = names.slice(0, 3).join(", ");
      logItemName = `Manifest Expansion: ${validItems.length} items (${displayedNames}${names.length > 3 ? "..." : ""})`;
    }

    await prisma.distributionLog.create({
      data: {
        orgId: user.role === "SUPERADMIN" ? validItems[0].orgId : user.orgId!,
        itemName: logItemName,
        quantity: validItems.reduce((acc, i) => acc + i.quantity, 0),
        type: "MANIFEST_ADD",
        method: "MANUAL_ENTRY",
        performedBy: user.username || "ADMIN"
      }
    });

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    revalidatePath("/logs");
    return { success: true, count: validItems.length };
  } catch (error: any) {
    console.error("Error adding loot:", error);
    return { success: false, error: error.message };
  }
}

export async function removeLootItems(itemIds: string[]) {
  try {
    const user = await requireAdmin();

    // Only delete items that belong to the user's organization
    await prisma.lootItem.deleteMany({
      where: {
        id: { in: itemIds },
        ...(user.role !== "SUPERADMIN" ? { orgId: user.orgId } : {})
      }
    });

    // Log the removal
    await prisma.distributionLog.create({
      data: {
        orgId: user.orgId || null,
        itemName: `Manifest Purge: ${itemIds.length} items removed`,
        quantity: itemIds.length,
        type: "MANIFEST_REMOVE",
        method: "MANUAL_DELETION",
        performedBy: user.username || "ADMIN"
      }
    });

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    revalidatePath("/logs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLootItem(itemId: string, quantity: number) {
  try {
    const user = await requireAdmin();
    
    // First find the item to ensure it belongs to the admin's org
    const item = await prisma.lootItem.findUnique({ where: { id: itemId }});
    if (!item) throw new Error("Item not found");
    
    if (user.role !== "SUPERADMIN" && item.orgId !== user.orgId) {
       throw new Error("Forbidden: Cannot update items in another organization.");
    }

    await prisma.lootItem.update({
      where: { id: itemId },
      data: { quantity, lastUpdatedBy: user.username }
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
    const user = await requireAdmin();
    if (user.role !== "SUPERADMIN" && user.orgId !== orgId) {
      throw new Error("Forbidden: Cannot wipe another organization's manifest.");
    }

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
  targetOrgId?: string | null;
}) {
  try {
    const user = await requireAuth();
    if (user.id !== data.userId && user.role !== "SUPERADMIN") {
      throw new Error("Forbidden: Cannot create a request for another user.");
    }

    const request = await prisma.lootRequest.create({
      data: {
        orgId: data.orgId,
        userId: data.userId,
        itemId: data.itemId,
        itemName: data.itemName,
        category: data.category,
        quantity: data.quantity,
        targetOrgId: data.targetOrgId || null,
        status: "PENDING"
      }
    });

    // Log the request
    await prisma.distributionLog.create({
      data: {
        orgId: data.orgId,
        recipientId: data.userId,
        itemName: `Asset Requested: ${data.itemName}`,
        quantity: data.quantity,
        type: "LOOT_REQUEST",
        method: "USER_ACTION",
        performedBy: user.username || "MEMBER"
      }
    });

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    revalidatePath("/logs");
    return { success: true, request };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveLootRequest(requestId: string, adminId: string) {
  try {
    const admin = await requireAdmin();
    
    const request = await prisma.lootRequest.findUnique({
      where: { id: requestId },
      include: { org: true, user: true }
    });

    if (!request) throw new Error("Request not found.");
    if (request.status !== "PENDING") throw new Error("Request already processed.");

    const targetOrgId = request.targetOrgId || request.orgId;
    if (admin.role !== "SUPERADMIN" && admin.orgId !== targetOrgId) {
      throw new Error("Forbidden: You do not have permission to approve requests for this organization.");
    }

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
          orgId: targetOrgId,
          recipientId: request.userId,
          itemName: request.itemName,
          quantity: request.quantity,
          type: "ASSIGNED",
          method: "REQUEST_APPROVAL",
          performedBy: admin.username || adminId
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
    const admin = await requireAdmin();
    
    const request = await prisma.lootRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) throw new Error("Request not found");
    
    const targetOrgId = request.targetOrgId || request.orgId;
    if (admin.role !== "SUPERADMIN" && admin.orgId !== targetOrgId) {
      throw new Error("Forbidden: You do not have permission to reject requests for this organization.");
    }

    await prisma.lootRequest.update({
      where: { id: requestId },
      data: { 
        status: "REJECTED",
        denialReason: reason
      }
    });

    // Log the rejection
    await prisma.distributionLog.create({
      data: {
        orgId: targetOrgId,
        recipientId: request.userId,
        itemName: `Asset Request Rejected: ${request.itemName}`,
        quantity: request.quantity,
        type: "LOOT_REJECTED",
        method: "ADMIN_ACTION",
        performedBy: admin.username || "ADMIN"
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/vault");
    revalidatePath("/logs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
