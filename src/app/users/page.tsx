import { prisma } from "@/lib/prisma";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
} from "lucide-react";
import { UserTable } from "@/components/users/user-table";
import { AddUserDialog } from "@/components/users/add-user-dialog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const org = await prisma.org.findUnique({
    where: { id: session.user.orgId }
  });

  if (!org) return <div className="p-10 text-sc-red font-mono sc-glass border border-sc-red/20">Org Context Not Found.</div>;

  // Logic for users visibility: SUPERADMIN sees all, others see only their org
  const userWhere: any = {};
  if (session.user.role !== 'SUPERADMIN') {
    userWhere.orgId = org.id;
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
            {session.user.role === 'SUPERADMIN' ? "Global Personnel Database" : `Org Personnel Database // ${org.name}`}
          </p>
        </div>
        <AddUserDialog orgId={org.id} />
      </div>

      <UserTable initialUsers={users} currentUserRole={session.user.role} />
    </div>
  );
}
