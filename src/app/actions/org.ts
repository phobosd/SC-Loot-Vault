"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function provisionOrg(data: {
  name: string;
  slug: string;
  primaryColor?: string;
  accentColor?: string;
}) {
  try {
    const org = await prisma.org.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        primaryColor: data.primaryColor || "#0A0A12",
        accentColor: data.accentColor || "#00D1FF",
        whitelabelConfig: {
          create: {
            headerText: data.name,
            footerText: `${data.name} Vault`,
          }
        }
      }
    });
    revalidatePath("/superadmin");
    return { success: true, org };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: "Slug or Name already in use." };
    return { success: false, error: error.message };
  }
}

export async function updateOrg(orgId: string, data: {
  name: string;
  slug: string;
  primaryColor: string;
  accentColor: string;
}) {
  try {
    await prisma.org.update({
      where: { id: orgId },
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
      }
    });
    revalidatePath("/superadmin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteOrg(orgId: string) {
  try {
    await prisma.org.delete({
      where: { id: orgId }
    });
    revalidatePath("/superadmin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOrgDiscord(orgId: string, data: {
  discordBotToken?: string;
  discordGuildId?: string;
}) {
  try {
    await prisma.org.update({
      where: { id: orgId },
      data: {
        discordBotToken: data.discordBotToken,
        discordGuildId: data.discordGuildId,
      }
    });
    revalidatePath("/discord");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOrgSettings(orgId: string, data: {
  name: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  headerText?: string | null;
  footerText?: string | null;
}) {
  try {
    await prisma.$transaction([
      prisma.org.update({
        where: { id: orgId },
        data: {
          name: data.name,
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          logoUrl: data.logoUrl,
        }
      }),
      prisma.whitelabelConfig.upsert({
        where: { orgId: orgId },
        update: {
          headerText: data.headerText,
          footerText: data.footerText,
        },
        create: {
          orgId: orgId,
          headerText: data.headerText,
          footerText: data.footerText,
        }
      })
    ]);
    
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/vault");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitOrgRequest(data: {
  name: string;
  slug: string;
  requesterName: string;
  contactInfo: string;
}) {
  try {
    const request = await prisma.orgRequest.create({
      data: {
        ...data,
        status: "PENDING"
      }
    });
    return { success: true, request };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: "Slug or Name already in use." };
    return { success: false, error: error.message };
  }
}

export async function approveOrgRequest(requestId: string) {
  try {
    const request = await prisma.orgRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error("Request not found");

    // Create the Org
    await provisionOrg({
      name: request.name,
      slug: request.slug,
    });

    // Update request status
    await prisma.orgRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" }
    });

    revalidatePath("/superadmin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectOrgRequest(requestId: string) {
  try {
    await prisma.orgRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" }
    });
    revalidatePath("/superadmin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
