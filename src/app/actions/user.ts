"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function updateUserRole(userId: string, role: Role) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import bcrypt from "bcryptjs";

export async function createUser(data: {
  username?: string;
  password?: string;
  email?: string;
  name?: string;
  role: Role;
  orgId: string;
}) {
  try {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await prisma.user.create({
      data: {
        username: data.username || null,
        password: hashedPassword,
        email: data.email || null,
        name: data.name,
        role: data.role,
        orgId: data.orgId,
      }
    });
    revalidatePath("/users");
    return { success: true, user };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Designation (Username) or Email already registered." };
    }
    return { success: false, error: error.message };
  }
}

export async function updateUser(userId: string, data: {
  email?: string;
  name?: string;
  role: Role;
  password?: string;
}) {
  try {
    const updateData: any = {
      email: data.email || null,
      name: data.name,
      role: data.role,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
