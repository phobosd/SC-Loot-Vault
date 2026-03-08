"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth, requireOrgAccess } from "@/lib/auth-checks";

export async function assignItemToOperator(data: {
  orgId: string;
  recipientId: string;
  lootItemId: string;
  itemName: string;
  quantity: number;
  performedBy?: string;
}) {
  try {
    await requireAdmin();
    await requireOrgAccess(data.orgId);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.lootItem.findUnique({
        where: { id: data.lootItemId }
      });

      if (!item || item.quantity < data.quantity || item.orgId !== data.orgId) {
        throw new Error("Insufficient manifest quantity or unauthorized.");
      }

      const log = await tx.distributionLog.create({
        data: {
          orgId: data.orgId,
          recipientId: data.recipientId,
          itemName: data.itemName,
          quantity: data.quantity,
          type: "ASSIGNED",
          method: "ADMIN_ASSIGN",
          performedBy: data.performedBy,
        },
      });

      if (item.quantity === data.quantity) {
        await tx.lootItem.delete({
          where: { id: data.lootItemId }
        });
      } else {
        await tx.lootItem.update({
          where: { id: data.lootItemId },
          data: { quantity: { decrement: data.quantity } }
        });
      }

      return log;
    });

    revalidatePath("/vault");
    revalidatePath("/dashboard");
    revalidatePath("/logs");
    revalidatePath("/assigned");
    
    return { success: true, log: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recordDistribution(data: {
  orgId: string;
  recipientId?: string | null;
  itemName: string;
  quantity: number;
  type: string;
  method: string;
  performedBy?: string;
  lootItemId?: string;
}) {
  try {
    await requireAdmin();
    await requireOrgAccess(data.orgId);

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.distributionLog.create({
        data: {
          orgId: data.orgId,
          recipientId: data.recipientId || null,
          itemName: data.itemName,
          quantity: data.quantity,
          type: data.type,
          method: data.method,
          performedBy: data.performedBy,
        },
      });

      if (data.lootItemId) {
        const item = await tx.lootItem.findUnique({
          where: { id: data.lootItemId }
        });

        if (item && item.orgId === data.orgId) {
          if (item.quantity <= data.quantity) {
            await tx.lootItem.delete({ where: { id: data.lootItemId } });
          } else {
            await tx.lootItem.update({
              where: { id: data.lootItemId },
              data: { quantity: { decrement: data.quantity } }
            });
          }
        }
      }

      return log;
    });

    revalidatePath("/vault");
    revalidatePath("/distributions");
    revalidatePath("/dashboard");
    revalidatePath("/logs");
    revalidatePath("/assigned");
    
    return { success: true, log: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createLootSession(data: {
  orgId: string;
  title: string;
  itemIds: string[];
  participantIds: string[];
  type?: string;
  mode?: string;
}) {
  try {
    const admin = await requireAdmin();
    const isGlobal = data.orgId === "GLOBAL" || (admin.role === "SUPERADMIN" && !admin.orgId);
    
    if (!isGlobal) {
      await requireOrgAccess(data.orgId);
    }

    const items = await prisma.lootItem.findMany({
      where: { id: { in: data.itemIds } }
    });

    if (items.length !== data.itemIds.length) {
       throw new Error(`Verification failure: Requested ${data.itemIds.length} assets, found ${items.length}.`);
    }

    const session = await prisma.lootSession.create({
      data: {
        orgId: isGlobal ? null : data.orgId,
        title: data.title,
        status: "ACTIVE",
        type: data.type || "REEL",
        mode: data.mode || "OPERATORS",
        items: {
          create: items.map(item => ({
            itemId: item.id,
            name: item.name,
            category: item.category,
            rarity: "COMMON"
          }))
        },
        participants: {
          create: data.participantIds.map(userId => ({
            userId
          }))
        }
      }
    });

    await prisma.distributionLog.create({
      data: {
        orgId: isGlobal ? null : data.orgId,
        itemName: `Dispatch sequence initialized: ${data.title} (${data.mode || 'OPERATORS'})`,
        quantity: data.participantIds.length,
        type: "DISPATCH_START",
        method: "ADMIN_ACTION",
        performedBy: admin.username || "ADMIN"
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/distributions");
    revalidatePath("/logs");
    return { success: true, sessionId: session.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function startGlobalSpin(sessionId: string) {
  try {
    const admin = await requireAdmin();
    const session = await prisma.lootSession.findUnique({
      where: { id: sessionId },
      include: { participants: true, items: true }
    });

    if (!session) throw new Error("Session not found");
    if (session.status === "SPINNING") throw new Error("Already in progress.");

    let currentWinnerId = null;
    let winningItemName = null;

    if (session.mode === "OPERATORS") {
      const winnerIndex = Math.floor(Math.random() * session.participants.length);
      currentWinnerId = session.participants[winnerIndex].userId;
      winningItemName = "ALL SESSION ASSETS";
    } else {
      const itemIndex = Math.floor(Math.random() * session.items.length);
      winningItemName = session.items[itemIndex].name;
      // In Items mode, assume the first/selected participant is the recipient
      currentWinnerId = session.participants[0]?.userId;
    }

    const targetIndex = 50 + Math.floor(Math.random() * 10);
    
    await prisma.lootSession.update({
      where: { id: sessionId },
      data: {
        status: "SPINNING",
        currentWinnerId,
        animationState: JSON.stringify({ targetIndex, startTime: new Date().toISOString(), winningItemName })
      }
    });

    revalidatePath(`/dispatch/${sessionId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function finalizeGlobalSession(sessionId: string) {
  try {
    const admin = await requireAdmin();
    const session = await prisma.lootSession.findUnique({
      where: { id: sessionId },
      include: { participants: { include: { user: true } }, items: true }
    });

    if (!session || !session.currentWinnerId) throw new Error("No winner designated.");

    const winner = session.participants.find(p => p.userId === session.currentWinnerId);
    if (!winner) throw new Error("Winner profile unreachable.");

    const animData = session.animationState ? JSON.parse(session.animationState) : null;
    const winningItemName = animData?.winningItemName;

    await prisma.$transaction(async (tx) => {
      // 1. Determine which items to assign
      const itemsToAssign = session.mode === "OPERATORS" 
        ? session.items 
        : session.items.filter(i => i.name === winningItemName);

      // 2. Log and Decrement each physical asset
      for (const sItem of itemsToAssign) {
        // Create the official assignment log
        await tx.distributionLog.create({
          data: {
            orgId: session.orgId,
            recipientId: winner.userId,
            itemName: sItem.name,
            quantity: 1,
            type: "ASSIGNED",
            method: "SYNCHRONIZED_RNG",
            performedBy: admin.username || "ADMIN"
          }
        });

        // Pull from physical inventory
        const vaultItem = await tx.lootItem.findUnique({ where: { id: sItem.itemId } });
        if (vaultItem) {
          if (vaultItem.quantity <= 1) {
            await tx.lootItem.delete({ where: { id: sItem.itemId } });
          } else {
            await tx.lootItem.update({
              where: { id: sItem.itemId },
              data: { quantity: { decrement: 1 } }
            });
          }
        }
      }

      // 3. Decommission session
      await tx.lootSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED" }
      });
    });

    revalidatePath("/vault");
    revalidatePath("/assigned");
    revalidatePath("/logs");
    revalidatePath(`/dispatch/${sessionId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetGlobalSession(sessionId: string) {
  try {
    await requireAdmin();
    await prisma.lootSession.update({
      where: { id: sessionId },
      data: {
        status: "ACTIVE",
        currentWinnerId: null,
        animationState: null
      }
    });
    revalidatePath(`/dispatch/${sessionId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveGlobalSession(sessionId: string) {
  try {
    await requireAdmin();
    await prisma.lootSession.update({
      where: { id: sessionId },
      data: { status: "ARCHIVED" }
    });
    revalidatePath("/distributions");
    revalidatePath(`/dispatch/${sessionId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
