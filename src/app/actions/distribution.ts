"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignItemToOperator(data: {
  orgId: string;
  recipientId: string;
  lootItemId: string;
  itemName: string;
  quantity: number;
  performedBy?: string;
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the item
      const item = await tx.lootItem.findUnique({
        where: { id: data.lootItemId }
      });

      if (!item || item.quantity < data.quantity) {
        throw new Error("Insufficient manifest quantity.");
      }

      // 2. Create the log entry
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

      // 3. Update or delete the item
      if (item.quantity === data.quantity) {
        await tx.lootItem.delete({
          where: { id: data.lootItemId }
        });
      } else {
        await tx.lootItem.update({
          where: { id: data.lootItemId },
          data: {
            quantity: {
              decrement: data.quantity
            }
          }
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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the log entry
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

      // 2. Decrement the item quantity if a lootItemId was provided
      if (data.lootItemId) {
        const item = await tx.lootItem.findUnique({
          where: { id: data.lootItemId }
        });

        if (item) {
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
    console.error("Distribution recording error:", error);
    return { success: false, error: error.message };
  }
}
