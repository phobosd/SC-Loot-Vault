"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-checks";
import { allianceOverrideSchema } from "@/lib/validations";

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
  } catch {
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
    await prisma.$transaction(async (tx) => {
      await tx.alliance.create({
        data: { orgId: request.senderOrgId, allyId: request.targetOrgId }
      });
      await tx.alliance.create({
        data: { orgId: request.targetOrgId, allyId: request.senderOrgId }
      });
      await tx.allianceRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });
      // Log for sender
      await tx.distributionLog.create({
        data: {
          orgId: request.senderOrgId,
          itemName: `Diplomatic Link Established: ${request.target.name}`,
          quantity: 1,
          type: "ALLIANCE_CREATED",
          method: "DIPLOMATIC_HANDSHAKE",
          performedBy: "SYSTEM_APPROVAL"
        }
      });
      // Log for target
      await tx.distributionLog.create({
        data: {
          orgId: request.targetOrgId,
          itemName: `Diplomatic Link Established: ${request.sender.name}`,
          quantity: 1,
          type: "ALLIANCE_CREATED",
          method: "DIPLOMATIC_HANDSHAKE",
          performedBy: user.username || "ADMIN"
        }
      });
    });

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

    await prisma.$transaction(async (tx) => {
      await tx.allianceRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });
      // Log for the org that rejected
      await tx.distributionLog.create({
        data: {
          orgId: request.targetOrgId,
          itemName: `Alliance Request Declined: ${request.sender.name}`,
          quantity: 1,
          type: "ALLIANCE_REJECTED",
          method: "DIPLOMATIC_REFUSAL",
          performedBy: user.username || "ADMIN"
        }
      });
      // Log for the org that was rejected
      await tx.distributionLog.create({
        data: {
          orgId: request.senderOrgId,
          itemName: `Alliance Request Declined by ${request.target.name}`,
          quantity: 1,
          type: "ALLIANCE_REJECTED",
          method: "DIPLOMATIC_REFUSAL",
          performedBy: "EXTERNAL_SYSTEM"
        }
      });
    });

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

    await prisma.$transaction(async (tx) => {
      await tx.alliance.deleteMany({
        where: {
          OR: [
            { orgId: user.orgId, allyId },
            { orgId: allyId, allyId: user.orgId }
          ]
        }
      });
      // Log for the org that initiated the break
      await tx.distributionLog.create({
        data: {
          orgId: user.orgId,
          itemName: `Diplomatic Termination: ${allyOrg?.name || "Unknown Org"}`,
          quantity: 1,
          type: "ALLIANCE_BROKEN",
          method: "DIPLOMATIC_TERMINATION",
          performedBy: user.username || "ADMIN"
        }
      });
      // Log for the other org so they know what happened
      await tx.distributionLog.create({
        data: {
          orgId: allyId,
          itemName: `Alliance Severed by ${myOrg?.name || "Unknown Org"}`,
          quantity: 1,
          type: "ALLIANCE_BROKEN",
          method: "DIPLOMATIC_TERMINATION",
          performedBy: "EXTERNAL_ACTION"
        }
      });
    });
    revalidatePath("/alliances");
    revalidatePath("/logs");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminCreateAlliance(org1Id: string, org2Id: string) {
  try {
    const validated = allianceOverrideSchema.parse({ org1Id, org2Id });
    const admin = await requireSuperAdmin();

    const [org1, org2] = await Promise.all([
      prisma.org.findUnique({ where: { id: validated.org1Id }, select: { name: true } }),
      prisma.org.findUnique({ where: { id: validated.org2Id }, select: { name: true } })
    ]);

    if (!org1 || !org2) throw new Error("Target organization not found.");
    if (validated.org1Id === validated.org2Id) throw new Error("Cannot ally an organization with itself.");

    await prisma.$transaction(async (tx) => {
      // 1. Clear any existing requests to prevent unique constraint conflicts
      await tx.allianceRequest.deleteMany({
        where: {
          OR: [
            { senderOrgId: validated.org1Id, targetOrgId: validated.org2Id },
            { senderOrgId: validated.org2Id, targetOrgId: validated.org1Id }
          ]
        }
      });
      // 2. Establish bi-directional alliance
      await tx.alliance.upsert({
        where: { orgId_allyId: { orgId: validated.org1Id, allyId: validated.org2Id } },
        update: {},
        create: { orgId: validated.org1Id, allyId: validated.org2Id }
      });
      await tx.alliance.upsert({
        where: { orgId_allyId: { orgId: validated.org2Id, allyId: validated.org1Id } },
        update: {},
        create: { orgId: validated.org2Id, allyId: validated.org1Id }
      });
      // 3. Log the override for both sides and system-wide
      await tx.distributionLog.createMany({
        data: [
          {
            orgId: validated.org1Id,
            itemName: `Diplomatic Link Established: ${org2.name}`,
            quantity: 1,
            type: "ALLIANCE_CREATED",
            method: "ROOT_OVERRIDE",
            performedBy: admin.username || "SUPERADMIN"
          },
          {
            orgId: validated.org2Id,
            itemName: `Diplomatic Link Established: ${org1.name}`,
            quantity: 1,
            type: "ALLIANCE_CREATED",
            method: "ROOT_OVERRIDE",
            performedBy: admin.username || "SUPERADMIN"
          },
          {
            orgId: null,
            itemName: `Diplomatic Link Forced: ${org1.name} <-> ${org2.name}`,
            quantity: 1,
            type: "ALLIANCE_CREATED",
            method: "ROOT_OVERRIDE",
            performedBy: admin.username || "SUPERADMIN"
          }
        ]
      });
    });

    revalidatePath("/alliances");
    revalidatePath("/logs");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminDeleteAlliance(org1Id: string, org2Id: string) {
  try {
    const validated = allianceOverrideSchema.parse({ org1Id, org2Id });
    const admin = await requireSuperAdmin();

    const [org1, org2] = await Promise.all([
      prisma.org.findUnique({ where: { id: validated.org1Id }, select: { name: true } }),
      prisma.org.findUnique({ where: { id: validated.org2Id }, select: { name: true } })
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.alliance.deleteMany({
        where: {
          OR: [
            { orgId: validated.org1Id, allyId: validated.org2Id },
            { orgId: validated.org2Id, allyId: validated.org1Id }
          ]
        }
      });
      // Also clear any corresponding approved requests
      await tx.allianceRequest.deleteMany({
        where: {
          OR: [
            { senderOrgId: validated.org1Id, targetOrgId: validated.org2Id },
            { senderOrgId: validated.org2Id, targetOrgId: validated.org1Id }
          ],
          status: "APPROVED"
        }
      });
      // Log for both sides and system-wide
      await tx.distributionLog.createMany({
        data: [
          {
            orgId: validated.org1Id,
            itemName: `Diplomatic Link Terminated: ${org2?.name || validated.org2Id}`,
            quantity: 1,
            type: "ALLIANCE_BROKEN",
            method: "ROOT_OVERRIDE",
            performedBy: admin.username || "SUPERADMIN"
          },
          {
            orgId: validated.org2Id,
            itemName: `Diplomatic Link Terminated: ${org1?.name || validated.org1Id}`,
            quantity: 1,
            type: "ALLIANCE_BROKEN",
            method: "ROOT_OVERRIDE",
            performedBy: admin.username || "SUPERADMIN"
          },
          {
            orgId: null,
            itemName: `Diplomatic Link Terminated: ${org1?.name || validated.org1Id} <-> ${org2?.name || validated.org2Id}`,
            quantity: 1,
            type: "ALLIANCE_BROKEN",
            method: "ROOT_OVERRIDE",
            performedBy: admin.username || "SUPERADMIN"
          }
        ]
      });
    });

    revalidatePath("/alliances");
    revalidatePath("/logs");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
