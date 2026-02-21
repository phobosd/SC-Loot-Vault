import { prisma } from "@/lib/prisma";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
} from "lucide-react";
import { UserTable } from "@/components/users/user-table";
import { ProfileForm } from "@/components/users/profile-form";
import { AddUserDialog } from "@/components/users/add-user-dialog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { org: true }
  });

  if (!currentUser) redirect("/login");

  const org = currentUser.org;
  const isGlobalAdmin = currentUser.role === 'SUPERADMIN' && !org;

  if (!org && !isGlobalAdmin) return <div className="p-10 text-sc-red font-mono sc-glass border border-sc-red/20">Org Context Not Found.</div>;

  // If user is a MEMBER, show their profile instead of the user list
  if (currentUser.role === 'MEMBER') {
    if (!org) return <div>Global User Profile coming soon.</div>;
    return <ProfileForm user={currentUser} org={org} />;
  }

  // Logic for users visibility: Global Admin sees all, Org Admins see only their org
  const userWhere: any = {};
  if (!isGlobalAdmin) {
    userWhere.orgId = org?.id;
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    include: {
      org: true,
    },
    orderBy: [
      { role: 'desc' },
      { name: 'asc' }
    ]
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-gold block shadow-[0_0_10px_rgba(224,177,48,0.5)]" />
            User Management
          </h1>
          <p className="text-xs text-sc-gold/60 mt-1 font-mono tracking-widest uppercase">
            {isGlobalAdmin ? "Global Personnel Database" : `Org Personnel Database // ${org?.name}`}
          </p>
        </div>
        <AddUserDialog orgId={org?.id || ""} currentUserRole={currentUser.role} />
      </div>

      <UserTable initialUsers={users} currentUserRole={currentUser.role} />
    </div>
  );
}
