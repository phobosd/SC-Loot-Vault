"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-checks";

export async function sendAllianceRequest(targetOrgId: string) {
  try {
    const user = await requireAdmin();
    if (!user.orgId) throw new Error("Unauthorized: You must belong to an organization.");

    const request = await prisma.allianceRequest.create({
      data: {
        senderOrgId: user.orgId,
        targetOrgId,
        status: "PENDING"
      }
    });
    revalidatePath("/alliances");
    return { success: true, request };
  } catch (err: any) {
    return { success: false, error: "Protocol Error: Handshake already in progress." };
  }
}

export async function approveAllianceRequest(requestId: string) {
  try {
    const user = await requireAdmin();
    if (!user.orgId) throw new Error("Unauthorized: You must belong to an organization.");

    const request = await prisma.allianceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || (request.targetOrgId !== user.orgId && user.role !== "SUPERADMIN")) {
      throw new Error("Invalid request or unauthorized.");
    }

    // Create mutual alliance entries
    await prisma.$transaction([
      prisma.alliance.create({
        data: { orgId: request.senderOrgId, allyId: request.targetOrgId }
      }),
      prisma.alliance.create({
        data: { orgId: request.targetOrgId, allyId: request.senderOrgId }
      }),
      prisma.allianceRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      })
    ]);

    revalidatePath("/alliances");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rejectAllianceRequest(requestId: string) {
  try {
    const user = await requireAdmin();
    if (!user.orgId) throw new Error("Unauthorized: You must belong to an organization.");

    const request = await prisma.allianceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || (request.targetOrgId !== user.orgId && user.role !== "SUPERADMIN")) {
       throw new Error("Invalid request or unauthorized.");
    }

    await prisma.allianceRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" }
    });
    revalidatePath("/alliances");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function breakAlliance(allyId: string) {
  try {
    const user = await requireAdmin();
    if (!user.orgId) throw new Error("Unauthorized: You must belong to an organization.");

    await prisma.alliance.deleteMany({
      where: {
        OR: [
          { orgId: user.orgId, allyId },
          { orgId: allyId, allyId: user.orgId }
        ]
      }
    });
    revalidatePath("/alliances");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
