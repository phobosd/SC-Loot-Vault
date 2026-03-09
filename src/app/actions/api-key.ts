"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireOrgAccess } from "@/lib/auth-checks";
import { createApiKeySchema, deleteApiKeySchema } from "@/lib/validations";
import crypto from "crypto";

export async function createApiKey(data: { orgId: string; name: string }) {
  try {
    const validated = createApiKeySchema.parse(data);
    const user = await requireAdmin();
    await requireOrgAccess(validated.orgId);

    // Generate a secure random key
    const key = `nx_${crypto.randomBytes(32).toString("hex")}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        orgId: validated.orgId,
        name: validated.name,
        key: key,
      },
    });

    await prisma.distributionLog.create({
      data: {
        orgId: validated.orgId,
        itemName: `API Uplink Key Generated: ${validated.name}`,
        quantity: 1,
        type: "ORG_CONFIG_CHANGE",
        method: "ADMIN_ACTION",
        performedBy: user.username || "ADMIN",
      },
    });

    revalidatePath("/settings");
    return { success: true, key: apiKey.key };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteApiKey(keyId: string) {
  try {
    const validated = deleteApiKeySchema.parse({ keyId });
    const user = await requireAdmin();
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: validated.keyId },
    });

    if (!apiKey) throw new Error("API Key not found.");
    
    await requireOrgAccess(apiKey.orgId);

    await prisma.apiKey.delete({
      where: { id: validated.keyId },
    });

    await prisma.distributionLog.create({
      data: {
        orgId: apiKey.orgId,
        itemName: `API Uplink Key Decommissioned: ${apiKey.name}`,
        quantity: 1,
        type: "ORG_CONFIG_CHANGE",
        method: "ADMIN_ACTION",
        performedBy: user.username || "ADMIN",
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
