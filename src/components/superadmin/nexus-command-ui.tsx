"use client";

import { useState } from "react";
import { 
  Building2, 
  ExternalLink,
  Users,
  Package,
  Search,
  Filter
} from "lucide-react";
import { OrgRowActions } from "./org-row-actions";

interface NexusCommandUIProps {
  initialOrgs: any[];
}

export function NexusCommandUI({ initialOrgs }: NexusCommandUIProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrgs = initialOrgs.filter((org) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.slug.toLowerCase().includes(searchLower) ||
      org.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="sc-glass p-4 flex items-center gap-4 border-b-2 border-sc-blue/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER ORGANIZATIONS (NAME / SLUG / ID)..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 transition-colors uppercase tracking-widest"
          />
        </div>
        <div className="text-[10px] font-mono text-sc-blue/40 uppercase">
          Nodes: {filteredOrgs.length}
        </div>
      </div>

      {/* Orgs List */}
      <div className="sc-glass border-sc-border/20 rounded-lg overflow-hidden pb-32">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-blue/5 border-b border-sc-blue/20">
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Organization</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Slug / Endpoint</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Users</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Inventory</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrgs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-600 uppercase text-xs font-mono">
                  No organization nodes detected matching telemetry.
                </td>
              </tr>
            ) : (
              filteredOrgs.map((org) => (
                <tr key={org.id} className="group hover:bg-sc-blue/[0.03] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sc-hud-corner bg-sc-blue/5 flex items-center justify-center border border-sc-blue/20">
                        <Building2 className="w-5 h-5 text-sc-blue/60" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-wide">{org.name}</p>
                        <p className="text-[9px] text-gray-500 font-mono">ID: {org.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-sc-blue underline cursor-pointer">
                        {org.slug}.vault.local
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-700" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-mono text-white">{org._count.users}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-mono text-white">{org._count.lootItems}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sc-green shadow-[0_0_8px_rgba(0,255,194,0.5)]" />
                      <span className="text-[9px] font-bold text-sc-green uppercase">Operational</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <OrgRowActions org={org} />
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
