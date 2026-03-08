"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-checks";

export async function addToWishlist(name: string, wikiId: string) {
  try {
    const user = await requireAuth();

    await prisma.wishlistItem.upsert({
      where: {
        userId_wikiId: {
          userId: user.id,
          wikiId
        }
      },
      update: {},
      create: {
        userId: user.id,
        name,
        wikiId
      }
    });

    revalidatePath("/wishlist");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeFromWishlist(wikiId: string) {
  try {
    const user = await requireAuth();

    await prisma.wishlistItem.delete({
      where: {
        userId_wikiId: {
          userId: user.id,
          wikiId
        }
      }
    });

    revalidatePath("/wishlist");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
