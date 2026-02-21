import { prisma } from "@/lib/prisma";
import { 
  Users, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Search
} from "lucide-react";
import { UserRowActions } from "@/components/users/user-row-actions";
import { AddUserDialog } from "@/components/users/add-user-dialog";

export default async function UsersPage() {
  const org = await prisma.org.findFirst();
  if (!org) return <div>No Org found.</div>;

  const users = await prisma.user.findMany({
    where: { orgId: org.id },
    include: {
      org: true,
    },
    orderBy: {
      role: 'desc'
    }
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN": return <ShieldAlert className="w-4 h-4 text-sc-red" />;
      case "ADMIN": return <ShieldCheck className="w-4 h-4 text-sc-blue" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-gold block shadow-[0_0_10px_rgba(224,177,48,0.5)]" />
            User Management
          </h1>
          <p className="text-xs text-sc-gold/60 mt-1 font-mono tracking-widest uppercase">
            Org Personnel Database // {org.name}
          </p>
        </div>
        <AddUserDialog orgId={org.id} />
      </div>

      {/* Filter Bar */}
      <div className="sc-glass p-4 flex items-center gap-4 border-b-2 border-sc-gold/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="SEARCH PERSONNEL (NAME / EMAIL / CID)..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-gold focus:outline-none focus:border-sc-gold/50 transition-colors uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="sc-glass border-sc-border/20 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-gold/5 border-b border-sc-gold/20">
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest">Operator</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest text-center">Security Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest">Comm-Link Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest">Enlistment Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="group hover:bg-sc-gold/[0.03] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sc-gold/10 border border-sc-gold/20 flex items-center justify-center text-sc-gold text-xs overflow-hidden">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name?.substring(0, 2).toUpperCase() || "UN"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white tracking-wide">{user.name || "Unknown Operator"}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${
                      user.role === 'SUPERADMIN' ? 'text-sc-red' : user.role === 'ADMIN' ? 'text-sc-blue' : 'text-gray-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] text-sc-green font-mono uppercase tracking-tighter">Handshake Active</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[10px] text-gray-500 font-mono">
                    {user.createdAt.toISOString().split('T')[0]}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <UserRowActions user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
