"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-checks";
import bcrypt from "bcryptjs";

import { 
  provisionOrgSchema, 
  updateOrgSchema, 
  deleteOrgSchema, 
  updateOrgDiscordSchema,
  updateOrgSettingsSchema,
  submitOrgRequestSchema,
  approveOrgRequestSchema,
  rejectOrgRequestSchema
} from "@/lib/validations";

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
    const validated = provisionOrgSchema.parse(data);
    const superAdmin = await requireSuperAdmin();
    
    // 1. Create the Org
    const org = await prisma.org.create({
      data: {
        name: validated.name,
        slug: validated.slug.toLowerCase(),
        primaryColor: validated.primaryColor || "#0A0A12",
        accentColor: validated.accentColor || "#00D1FF",
        whitelabelConfig: {
          create: {
            headerText: validated.name,
            footerText: `${validated.name} Vault`,
          }
        }
      }
    });

    // 2. Create the initial ADMIN user for this Org
    const initialUsername = validated.requesterName.replace(/\s+/g, '').toUpperCase();
    
    let finalHashedPassword;
    if (data.isPasswordHashed && validated.adminPassword) {
      finalHashedPassword = validated.adminPassword;
    } else {
      finalHashedPassword = await bcrypt.hash(validated.adminPassword || "welcome123", 10);
    }

    await prisma.user.create({
      data: {
        username: initialUsername,
        password: finalHashedPassword,
        name: validated.requesterName,
        email: validated.contactInfo.includes('@') ? validated.contactInfo : null,
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
    const validated = updateOrgSchema.parse({ orgId, ...data });
    const superAdmin = await requireSuperAdmin();
    const org = await prisma.org.update({
      where: { id: validated.orgId },
      data: {
        name: validated.name,
        slug: validated.slug.toLowerCase(),
        primaryColor: validated.primaryColor,
        accentColor: validated.accentColor,
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
    const validated = deleteOrgSchema.parse({ orgId });
    const superAdmin = await requireSuperAdmin();
    const org = await prisma.org.findUnique({ where: { id: validated.orgId } });

    await prisma.org.delete({
      where: { id: validated.orgId }
    });

    await prisma.distributionLog.create({
      data: {
        itemName: `Organization Decommissioned: ${org?.name || validated.orgId}`,
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
    const validated = updateOrgDiscordSchema.parse({ orgId, ...data });
    const user = await requireAdmin();
    if (user.role !== "SUPERADMIN" && user.orgId !== validated.orgId) {
      throw new Error("Forbidden: Cannot update Discord settings for another organization.");
    }
    
    await prisma.org.update({
      where: { id: validated.orgId },
      data: {
        discordBotToken: validated.discordBotToken,
        discordGuildId: validated.discordGuildId,
      }
    });

    await prisma.distributionLog.create({
      data: {
        orgId: validated.orgId,
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
    const validated = updateOrgSettingsSchema.parse({ orgId, ...data });
    const user = await requireAdmin();
    if (user.role !== "SUPERADMIN" && user.orgId !== validated.orgId) {
      throw new Error("Forbidden: Cannot update settings for another organization.");
    }

    await prisma.$transaction([
      prisma.org.update({
        where: { id: validated.orgId },
        data: {
          name: validated.name,
          primaryColor: validated.primaryColor,
          accentColor: validated.accentColor,
          secondaryColor: validated.secondaryColor,
          successColor: validated.successColor,
          dangerColor: validated.dangerColor,
          textColor: validated.textColor,
          logoUrl: validated.logoUrl,
        }
      }),
      prisma.whitelabelConfig.upsert({
        where: { orgId: validated.orgId },
        update: {
          headerText: validated.headerText,
          footerText: validated.footerText,
        },
        create: {
          orgId: validated.orgId,
          headerText: validated.headerText,
          footerText: validated.footerText,
        }
      })
    ]);

    await prisma.distributionLog.create({
      data: {
        orgId: validated.orgId,
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
    const validated = submitOrgRequestSchema.parse(data);
    const hashedPassword = validated.adminPassword ? await bcrypt.hash(validated.adminPassword, 10) : null;

    // This is public, no auth check needed
    const request = await prisma.orgRequest.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        requesterName: validated.requesterName,
        adminUsername: validated.requesterName.replace(/\s+/g, '').toUpperCase(),
        adminPassword: hashedPassword,
        contactInfo: validated.contactInfo,
        status: "PENDING"
      }
    });

    // Global Log for Org Request
    await prisma.distributionLog.create({
      data: {
        itemName: `Org Signup Requested: ${validated.name}`,
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
    const validated = approveOrgRequestSchema.parse({ requestId });
    const superAdmin = await requireSuperAdmin();
    const request = await prisma.orgRequest.findUnique({
      where: { id: validated.requestId }
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
      where: { id: validated.requestId },
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
    const validated = rejectOrgRequestSchema.parse({ requestId });
    const superAdmin = await requireSuperAdmin();
    const request = await prisma.orgRequest.findUnique({ where: { id: validated.requestId } });

    await prisma.orgRequest.update({
      where: { id: validated.requestId },
      data: { status: "REJECTED" }
    });

    await prisma.distributionLog.create({
      data: {
        itemName: `Integration Rejected: ${request?.name || validated.requestId}`,
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
