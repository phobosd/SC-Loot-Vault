"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function sendAllianceRequest(targetOrgId: string) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.orgId) throw new Error("Unauthorized");

  try {
    const request = await prisma.allianceRequest.create({
      data: {
        senderOrgId: session.user.orgId,
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
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.orgId) throw new Error("Unauthorized");

  try {
    const request = await prisma.allianceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.targetOrgId !== session.user.orgId) {
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
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.orgId) throw new Error("Unauthorized");

  try {
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
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.orgId) throw new Error("Unauthorized");

  try {
    await prisma.alliance.deleteMany({
      where: {
        OR: [
          { orgId: session.user.orgId, allyId },
          { orgId: allyId, allyId: session.user.orgId }
        ]
      }
    });
    revalidatePath("/alliances");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
