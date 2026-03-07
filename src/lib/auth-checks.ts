import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAuth() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new Error("Forbidden: Administrator access required.");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  if (user.role !== "SUPERADMIN") {
    throw new Error("Forbidden: Super Administrator access required.");
  }
  return user;
}

export async function requireOrgAccess(orgId: string) {
  const user = await requireAuth();
  if (user.role !== "SUPERADMIN" && user.orgId !== orgId) {
    throw new Error("Forbidden: You do not have access to this organization's data.");
  }
  return user;
}
