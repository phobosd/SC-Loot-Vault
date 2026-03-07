"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-checks";

export async function sendAllianceRequest(targetOrgId: string) {
  try {
    const user = await requireAdmin();
    if (!user.orgId) throw new Error("Unauthorized: You must belong to an organization.");

    const [senderOrg, targetOrg] = await Promise.all([
      prisma.org.findUnique({ where: { id: user.orgId }, select: { name: true } }),
      prisma.org.findUnique({ where: { id: targetOrgId }, select: { name: true } })
    ]);

    const request = await prisma.allianceRequest.create({
      data: {
        senderOrgId: user.orgId,
        targetOrgId,
        status: "PENDING"
      }
    });

    // Log for both sides
    await prisma.distributionLog.createMany({
      data: [
        {
          orgId: user.orgId,
          itemName: `Diplomatic Outreach: ${targetOrg?.name || "Unknown Org"}`,
          quantity: 1,
          type: "ALLIANCE_REQUEST",
          method: "DIPLOMATIC_OUTREACH",
          performedBy: user.username || "ADMIN"
        },
        {
          orgId: targetOrgId,
          itemName: `Incoming Handshake: ${senderOrg?.name || "Unknown Org"}`,
          quantity: 1,
          type: "ALLIANCE_REQUEST",
          method: "DIPLOMATIC_OUTREACH",
          performedBy: "EXTERNAL_SYSTEM"
        }
      ]
    });

    revalidatePath("/alliances");
    revalidatePath("/logs");
    revalidatePath("/dashboard");
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
      where: { id: requestId },
      include: { sender: { select: { name: true } }, target: { select: { name: true } } }
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
      }),
      // Log for sender
      prisma.distributionLog.create({
        data: {
          orgId: request.senderOrgId,
          itemName: `Diplomatic Link Established: ${request.target.name}`,
          quantity: 1,
          type: "ALLIANCE_CREATED",
          method: "DIPLOMATIC_HANDSHAKE",
          performedBy: "SYSTEM_APPROVAL"
        }
      }),
      // Log for target
      prisma.distributionLog.create({
        data: {
          orgId: request.targetOrgId,
          itemName: `Diplomatic Link Established: ${request.sender.name}`,
          quantity: 1,
          type: "ALLIANCE_CREATED",
          method: "DIPLOMATIC_HANDSHAKE",
          performedBy: user.username || "ADMIN"
        }
      })
    ]);

    revalidatePath("/alliances");
    revalidatePath("/logs");
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
      where: { id: requestId },
      include: { 
        sender: { select: { id: true, name: true } }, 
        target: { select: { id: true, name: true } } 
      }
    });

    if (!request || (request.targetOrgId !== user.orgId && user.role !== "SUPERADMIN")) {
       throw new Error("Invalid request or unauthorized.");
    }

    await prisma.$transaction([
      prisma.allianceRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      }),
      // Log for the org that rejected
      prisma.distributionLog.create({
        data: {
          orgId: request.targetOrgId,
          itemName: `Alliance Request Declined: ${request.sender.name}`,
          quantity: 1,
          type: "ALLIANCE_REJECTED",
          method: "DIPLOMATIC_REFUSAL",
          performedBy: user.username || "ADMIN"
        }
      }),
      // Log for the org that was rejected
      prisma.distributionLog.create({
        data: {
          orgId: request.senderOrgId,
          itemName: `Alliance Request Declined by ${request.target.name}`,
          quantity: 1,
          type: "ALLIANCE_REJECTED",
          method: "DIPLOMATIC_REFUSAL",
          performedBy: "EXTERNAL_SYSTEM"
        }
      })
    ]);

    revalidatePath("/alliances");
    revalidatePath("/logs");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function breakAlliance(allyId: string) {
  try {
    const user = await requireAdmin();
    if (!user.orgId) throw new Error("Unauthorized: You must belong to an organization.");

    // Fetch org names for better logging
    const [myOrg, allyOrg] = await Promise.all([
      prisma.org.findUnique({ where: { id: user.orgId }, select: { name: true } }),
      prisma.org.findUnique({ where: { id: allyId }, select: { name: true } })
    ]);

    await prisma.$transaction([
      prisma.alliance.deleteMany({
        where: {
          OR: [
            { orgId: user.orgId, allyId },
            { orgId: allyId, allyId: user.orgId }
          ]
        }
      }),
      // Log for the org that initiated the break
      prisma.distributionLog.create({
        data: {
          orgId: user.orgId,
          itemName: `Diplomatic Termination: ${allyOrg?.name || "Unknown Org"}`,
          quantity: 1,
          type: "ALLIANCE_BROKEN",
          method: "DIPLOMATIC_TERMINATION",
          performedBy: user.username || "ADMIN"
        }
      }),
      // Log for the other org so they know what happened
      prisma.distributionLog.create({
        data: {
          orgId: allyId,
          itemName: `Alliance Severed by ${myOrg?.name || "Unknown Org"}`,
          quantity: 1,
          type: "ALLIANCE_BROKEN",
          method: "DIPLOMATIC_TERMINATION",
          performedBy: "EXTERNAL_ACTION"
        }
      })
    ]);
    revalidatePath("/alliances");
    revalidatePath("/logs");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
