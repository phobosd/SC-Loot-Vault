"use client";

import { useState } from "react";
import { 
  Search, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  User as UserIcon
} from "lucide-react";
import { UserRowActions } from "./user-row-actions";

interface UserTableProps {
  initialUsers: any[];
  currentUserRole: string;
}

export function UserTable({ initialUsers, currentUserRole }: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = initialUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.org?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN": return <ShieldAlert className="w-4 h-4 text-sc-red" />;
      case "ADMIN": return <ShieldCheck className="w-4 h-4 text-sc-blue" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="sc-glass p-4 flex items-center gap-4 border-b-2 border-sc-gold/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH PERSONNEL (NAME / EMAIL / ORG)..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-gold focus:outline-none focus:border-sc-gold/50 transition-colors uppercase tracking-widest"
          />
        </div>
        <div className="text-[10px] font-mono text-sc-gold/40 uppercase">
          Matching Nodes: {filteredUsers.length}
        </div>
      </div>

      <div className="sc-glass border-sc-border/20 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-gold/5 border-b border-sc-gold/20">
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest">Operator</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest text-center">Organization</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest text-center">Security Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest">Comm-Link Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest">Enlistment Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-gold uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <p className="text-gray-600 font-mono uppercase text-xs">No operators matching search criteria detected.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-sc-gold/[0.03] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sc-gold/10 border border-sc-gold/20 flex items-center justify-center text-sc-gold text-xs overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.name?.substring(0, 2).toUpperCase() || user.username?.substring(0, 2).toUpperCase() || "UN"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white tracking-wide uppercase">{user.name || user.username || "Unknown"}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{user.email || "NO_COMM_LINK"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] text-sc-blue font-mono uppercase tracking-widest border border-sc-blue/20 px-2 py-1 bg-sc-blue/5 rounded">
                      {user.org?.name || "NEXUS_CORE"}
                    </span>
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
                      {new Date(user.createdAt).toISOString().split('T')[0]}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <UserRowActions user={user} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
