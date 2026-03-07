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

    // Audit Log for Organization Provisioning (Global and Local)
    await prisma.distributionLog.createMany({
      data: [
        {
          orgId: org.id,
          itemName: `Organization Node Activated: ${org.name}`,
          quantity: 1,
          type: "ORG_CREATED",
          method: "ROOT_PROVISIONING",
          performedBy: superAdmin.username || "SUPERADMIN"
        },
        {
          orgId: null,
          itemName: `New Organization Provisioned: ${org.name}`,
          quantity: 1,
          type: "ORG_CREATED",
          method: "ROOT_PROVISIONING",
          performedBy: superAdmin.username || "SUPERADMIN"
        }
      ]
    });

    revalidatePath("/superadmin");
    revalidatePath("/users");
    revalidatePath("/logs");
    
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
    const org = await prisma.org.update({
      where: { id: orgId },
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
      }
    });

    await prisma.distributionLog.createMany({
      data: [
        {
          orgId: null,
          itemName: `Organization Parameters Updated: ${org.name}`,
          quantity: 1,
          type: "ORG_UPDATED",
          method: "ADMIN_ACTION",
          performedBy: superAdmin.username || "SUPERADMIN"
        },
        {
          orgId: org.id,
          itemName: `Organization Parameters Updated by Global Root`,
          quantity: 1,
          type: "ORG_UPDATED",
          method: "ROOT_OVERRIDE",
          performedBy: superAdmin.username || "SUPERADMIN"
        }
      ]
    });

    revalidatePath("/superadmin");
    revalidatePath("/logs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteOrg(orgId: string) {
  try {
    const superAdmin = await requireSuperAdmin();
    const org = await prisma.org.findUnique({ where: { id: orgId } });

    await prisma.org.delete({
      where: { id: orgId }
    });

    await prisma.distributionLog.create({
      data: {
        itemName: `Organization Decommissioned: ${org?.name || orgId}`,
        quantity: 1,
        type: "ORG_DELETED",
        method: "ADMIN_ACTION",
        performedBy: superAdmin.username || "SUPERADMIN"
      }
    });

    revalidatePath("/superadmin");
    revalidatePath("/logs");
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

    await prisma.distributionLog.create({
      data: {
        orgId: orgId,
        itemName: `Discord Bot Configuration Updated`,
        quantity: 1,
        type: "ORG_CONFIG_CHANGE",
        method: "ADMIN_ACTION",
        performedBy: user.username || "ADMIN"
      }
    });

    revalidatePath("/discord");
    revalidatePath("/logs");
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

    await prisma.distributionLog.create({
      data: {
        orgId: orgId,
        itemName: `Whitelabel HUD Parameters Updated`,
        quantity: 1,
        type: "ORG_CONFIG_CHANGE",
        method: "ADMIN_ACTION",
        performedBy: user.username || "ADMIN"
      }
    });
    
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

    // Global Log for Org Request
    await prisma.distributionLog.create({
      data: {
        itemName: `Nexus Integration Requested: ${data.name}`,
        quantity: 1,
        type: "ORG_REQUEST",
        method: "PUBLIC_SIGNUP",
        performedBy: "SYSTEM"
      }
    });

    revalidatePath("/superadmin");
    revalidatePath("/logs");
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
        itemName: `Integration Approved: ${request.name}`,
        quantity: 1,
        type: "ORG_APPROVED",
        method: "NEXUS_ACTION",
        performedBy: superAdmin.username || "SUPERADMIN"
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
    const superAdmin = await requireSuperAdmin();
    const request = await prisma.orgRequest.findUnique({ where: { id: requestId } });

    await prisma.orgRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" }
    });

    await prisma.distributionLog.create({
      data: {
        itemName: `Integration Rejected: ${request?.name || requestId}`,
        quantity: 1,
        type: "ORG_REJECTED",
        method: "NEXUS_ACTION",
        performedBy: superAdmin.username || "SUPERADMIN"
      }
    });

    revalidatePath("/superadmin");
    revalidatePath("/logs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
