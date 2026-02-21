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
