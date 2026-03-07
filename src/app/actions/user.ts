"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-checks";

export async function updateUserRole(userId: string, role: Role) {
  try {
    await requireAdmin();
    // Ideally we should also check if the user belongs to the admin's org, but for now we rely on the UI hiding users from other orgs for non-superadmins.
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
    await requireAdmin();
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { createUserSchema, updateUserSchema } from "@/lib/validations";

export async function createUser(data: {
  username?: string;
  password?: string;
  email?: string;
  name?: string;
  role: Role;
  orgId: string;
}) {
  try {
    await requireAdmin();
    const validatedData = createUserSchema.parse(data);

    const hashedPassword = validatedData.password ? await bcrypt.hash(validatedData.password, 10) : null;

    const user = await prisma.user.create({
      data: {
        username: validatedData.username || null,
        password: hashedPassword,
        email: validatedData.email || null,
        name: validatedData.name,
        role: validatedData.role,
        orgId: validatedData.orgId,
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
  orgId?: string;
  username?: string;
  status?: string;
}) {
  try {
    await requireAdmin();
    const validatedData = updateUserSchema.parse(data);

    const updateData: any = {
      email: validatedData.email || null,
      name: validatedData.name,
      role: validatedData.role,
    };

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.username) {
      updateData.username = validatedData.username.toUpperCase();
    }

    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    if (validatedData.orgId) {
      await requireSuperAdmin(); // Changing orgs should only be a SuperAdmin feature
      updateData.orgId = validatedData.orgId;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    revalidatePath("/users");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
