"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-checks";
import bcrypt from "bcryptjs";

export async function provisionOrg(data: {
  name: string;
  slug: string;
  requesterName: string;
  adminPassword?: string; // Expects hashed password if coming from approveOrgRequest, or raw if from direct provision
  contactInfo: string;
  isPasswordHashed?: boolean;
  primaryColor?: string;
  accentColor?: string;
}) {
  try {
    await requireSuperAdmin();
    
    // 1. Create the Org
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

    // 2. Create the initial ADMIN user for this Org
    const initialUsername = data.requesterName.replace(/\s+/g, '').toUpperCase();
    
    let finalHashedPassword;
    if (data.isPasswordHashed && data.adminPassword) {
      finalHashedPassword = data.adminPassword;
    } else {
      finalHashedPassword = await bcrypt.hash(data.adminPassword || "welcome123", 10);
    }

    await prisma.user.create({
      data: {
        username: initialUsername,
        password: finalHashedPassword,
        name: data.requesterName,
        email: data.contactInfo.includes('@') ? data.contactInfo : null,
        role: "ADMIN",
        orgId: org.id,
        status: "APPROVED"
      }
    });

    revalidatePath("/superadmin");
    revalidatePath("/users");
    
    return { 
      success: true, 
      org,
      message: `Organization ${org.name} provisioned. Admin Account "${initialUsername}" is active.`
    };
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
    await requireSuperAdmin();
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
    await requireSuperAdmin();
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
    const user = await requireAdmin();
    if (user.role !== "SUPERADMIN" && user.orgId !== orgId) {
      throw new Error("Forbidden: Cannot update Discord settings for another organization.");
    }
    
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
  secondaryColor: string;
  successColor: string;
  dangerColor: string;
  textColor: string;
  logoUrl?: string | null;
  headerText?: string | null;
  footerText?: string | null;
}) {
  try {
    const user = await requireAdmin();
    if (user.role !== "SUPERADMIN" && user.orgId !== orgId) {
      throw new Error("Forbidden: Cannot update settings for another organization.");
    }

    await prisma.$transaction([
      prisma.org.update({
        where: { id: orgId },
        data: {
          name: data.name,
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          secondaryColor: data.secondaryColor,
          successColor: data.successColor,
          dangerColor: data.dangerColor,
          textColor: data.textColor,
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
  adminPassword?: string;
  contactInfo: string;
}) {
  try {
    const hashedPassword = data.adminPassword ? await bcrypt.hash(data.adminPassword, 10) : null;

    // This is public, no auth check needed
    const request = await prisma.orgRequest.create({
      data: {
        name: data.name,
        slug: data.slug,
        requesterName: data.requesterName,
        adminUsername: data.requesterName.replace(/\s+/g, '').toUpperCase(),
        adminPassword: hashedPassword,
        contactInfo: data.contactInfo,
        status: "PENDING"
      }
    });
    revalidatePath("/superadmin");
    return { success: true, request };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: "Slug or Name already in use." };
    return { success: false, error: error.message };
  }
}

export async function approveOrgRequest(requestId: string) {
  try {
    await requireSuperAdmin();
    const request = await prisma.orgRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error("Request not found");

    // 1. Provision the Org and its Admin
    const orgResult = await provisionOrg({
      name: request.name,
      slug: request.slug,
      requesterName: request.requesterName,
      adminPassword: request.adminPassword || undefined,
      contactInfo: request.contactInfo,
      isPasswordHashed: true // The password in OrgRequest is already hashed
    });

    if (!orgResult.success) {
      throw new Error(orgResult.error || "Provisioning failed.");
    }

    // 2. Update the request record status for history
    await prisma.orgRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" }
    });

    // 3. Log the provisioning in the global manifest
    await prisma.distributionLog.create({
      data: {
        orgId: orgResult.org?.id || "NEXUS",
        itemName: `Organization Provisioned: ${request.name}`,
        quantity: 1,
        type: "ORG_PROVISIONED",
        method: "NEXUS_APPROVAL",
        performedBy: "GLOBAL_ROOT"
      }
    });

    revalidatePath("/superadmin");
    revalidatePath("/logs");
    
    return { 
      success: true, 
      message: orgResult.message 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectOrgRequest(requestId: string) {
  try {
    await requireSuperAdmin();
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
