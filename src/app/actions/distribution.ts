"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth, requireOrgAccess } from "@/lib/auth-checks";
import { 
  createLootSessionSchema, 
  assignItemToOperatorSchema, 
  recordDistributionSchema,
  startGlobalSpinSchema,
  finalizeGlobalSessionSchema,
  resetGlobalSessionSchema,
  archiveGlobalSessionSchema
} from "@/lib/validations";
import { eventEmitter, EVENTS } from "@/lib/events";

export async function assignItemToOperator(data: {
  orgId: string;
  recipientId: string;
  lootItemId: string;
  itemName: string;
  quantity: number;
  performedBy?: string;
}) {
  try {
    const validated = assignItemToOperatorSchema.parse(data);
    await requireAdmin();
    await requireOrgAccess(validated.orgId);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.lootItem.findUnique({
        where: { id: validated.lootItemId }
      });

      if (!item || item.quantity < validated.quantity || item.orgId !== validated.orgId) {
        throw new Error("Insufficient manifest quantity or unauthorized.");
      }

      const log = await tx.distributionLog.create({
        data: {
          orgId: validated.orgId,
          recipientId: validated.recipientId,
          itemName: validated.itemName,
          quantity: validated.quantity,
          type: "ASSIGNED",
          method: "ADMIN_ASSIGN",
          performedBy: validated.performedBy,
        },
      });

      if (item.quantity === validated.quantity) {
        await tx.lootItem.delete({
          where: { id: validated.lootItemId }
        });
      } else {
        await tx.lootItem.update({
          where: { id: validated.lootItemId },
          data: { quantity: { decrement: validated.quantity } }
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
    const validated = recordDistributionSchema.parse(data);
    await requireAdmin();
    await requireOrgAccess(validated.orgId);

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.distributionLog.create({
        data: {
          orgId: validated.orgId,
          recipientId: validated.recipientId || null,
          itemName: validated.itemName,
          quantity: validated.quantity,
          type: validated.type,
          method: validated.method,
          performedBy: validated.performedBy,
        },
      });

      if (validated.lootItemId) {
        const item = await tx.lootItem.findUnique({
          where: { id: validated.lootItemId }
        });

        if (item && item.orgId === validated.orgId) {
          if (item.quantity <= validated.quantity) {
            await tx.lootItem.delete({ where: { id: validated.lootItemId } });
          } else {
            await tx.lootItem.update({
              where: { id: validated.lootItemId },
              data: { quantity: { decrement: validated.quantity } }
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
    const validatedData = createLootSessionSchema.parse(data);
    const admin = await requireAdmin();
    const isGlobal = validatedData.orgId === "GLOBAL" || (admin.role === "SUPERADMIN" && !admin.orgId);
    
    if (!isGlobal) {
      await requireOrgAccess(validatedData.orgId);
    }

    const items = await prisma.lootItem.findMany({
      where: { id: { in: validatedData.itemIds } }
    });

    if (items.length !== validatedData.itemIds.length) {
       throw new Error(`Verification failure: Requested ${validatedData.itemIds.length} assets, found ${items.length}.`);
    }

    const session = await prisma.lootSession.create({
      data: {
        orgId: isGlobal ? null : validatedData.orgId,
        title: validatedData.title,
        status: "ACTIVE",
        type: validatedData.type || "REEL",
        mode: validatedData.mode || "OPERATORS",
        items: {
          create: items.map(item => ({
            itemId: item.id,
            name: item.name,
            category: item.category,
            rarity: "COMMON"
          }))
        },
        participants: {
          create: validatedData.participantIds.map(userId => ({
            userId
          }))
        }
      }
    });

    await prisma.distributionLog.create({
      data: {
        orgId: isGlobal ? null : validatedData.orgId,
        itemName: `Dispatch sequence initialized: ${validatedData.title} (${validatedData.mode || 'OPERATORS'})`,
        quantity: validatedData.participantIds.length,
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
    const validated = startGlobalSpinSchema.parse({ sessionId });
    const admin = await requireAdmin();
    const session = await prisma.lootSession.findUnique({
      where: { id: validated.sessionId },
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
      where: { id: validated.sessionId },
      data: {
        status: "SPINNING",
        currentWinnerId,
        animationState: JSON.stringify({ targetIndex, startTime: new Date().toISOString(), winningItemName })
      }
    });

    revalidatePath(`/dispatch/${validated.sessionId}`);
    eventEmitter.emit(EVENTS.LOOT_SESSION_UPDATED(validated.sessionId), { type: "SPIN_STARTED" });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function finalizeGlobalSession(sessionId: string) {
  try {
    const validated = finalizeGlobalSessionSchema.parse({ sessionId });
    const admin = await requireAdmin();
    const session = await prisma.lootSession.findUnique({
      where: { id: validated.sessionId },
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

      // 2. Batch create distribution logs
      await tx.distributionLog.createMany({
        data: itemsToAssign.map(sItem => ({
          orgId: session.orgId,
          recipientId: winner.userId,
          itemName: sItem.name,
          quantity: 1,
          type: "ASSIGNED",
          method: "SYNCHRONIZED_RNG",
          performedBy: admin.username || "ADMIN"
        }))
      });

      // 3. Update physical inventory (Sequential to avoid deadlocks, but in transaction)
      for (const sItem of itemsToAssign) {
        const vaultItem = await tx.lootItem.findUnique({ 
          where: { id: sItem.itemId },
          select: { id: true, quantity: true } 
        });
        
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

      // 4. Decommission session
      await tx.lootSession.update({
        where: { id: validated.sessionId },
        data: { status: "COMPLETED" }
      });
    });

    revalidatePath("/vault");
    revalidatePath("/assigned");
    revalidatePath("/logs");
    revalidatePath(`/dispatch/${validated.sessionId}`);
    eventEmitter.emit(EVENTS.LOOT_SESSION_UPDATED(validated.sessionId), { type: "SESSION_FINALIZED" });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetGlobalSession(sessionId: string) {
  try {
    const validated = resetGlobalSessionSchema.parse({ sessionId });
    await requireAdmin();
    await prisma.lootSession.update({
      where: { id: validated.sessionId },
      data: {
        status: "ACTIVE",
        currentWinnerId: null,
        animationState: null
      }
    });
    revalidatePath(`/dispatch/${validated.sessionId}`);
    eventEmitter.emit(EVENTS.LOOT_SESSION_UPDATED(validated.sessionId), { type: "SESSION_RESET" });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveGlobalSession(sessionId: string) {
  try {
    const validated = archiveGlobalSessionSchema.parse({ sessionId });
    await requireAdmin();
    await prisma.lootSession.update({
      where: { id: validated.sessionId },
      data: { status: "ARCHIVED" }
    });
    revalidatePath("/distributions");
    revalidatePath(`/dispatch/${validated.sessionId}`);
    eventEmitter.emit(EVENTS.LOOT_SESSION_UPDATED(validated.sessionId), { type: "SESSION_ARCHIVED" });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
