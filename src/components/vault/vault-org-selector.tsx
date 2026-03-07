"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronDown, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface VaultOrgSelectorProps {
  currentOrgId: string;
  userOrgId: string;
  alliances: { id: string; name: string }[];
}

export function VaultOrgSelector({ currentOrgId, userOrgId, alliances }: VaultOrgSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOrgChange = (orgId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (orgId === userOrgId) {
      params.delete("allyId");
    } else {
      params.set("allyId", orgId);
    }
    router.push(`/vault?${params.toString()}`);
  };

  return (
    <div className="relative inline-block group">
      <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded cursor-pointer hover:border-sc-blue/50 transition-all">
        <Building2 className="w-4 h-4 text-sc-blue" />
        <span className="text-[10px] font-mono text-white uppercase tracking-widest">
          {alliances.find(a => a.id === currentOrgId)?.name || "Primary Vault"}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-sc-blue transition-colors" />
      </div>

      <div className="absolute top-full left-0 mt-1 w-64 sc-glass border border-sc-blue/30 rounded shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[50] overflow-hidden">
        <div className="p-1">
          <p className="text-[8px] text-gray-500 font-mono uppercase p-2 border-b border-white/5">Vault Network Nodes</p>
          
          <button
            onClick={() => handleOrgChange(userOrgId)}
            className={cn(
              "w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded mb-1 flex items-center justify-between",
              currentOrgId === userOrgId ? "bg-sc-blue/20 text-sc-blue" : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            Primary Org Vault
            {currentOrgId === userOrgId && <div className="w-1 h-1 rounded-full bg-sc-blue shadow-[0_0_5px_rgba(0,209,255,1)]" />}
          </button>

          {alliances.length > 0 && (
            <>
              <div className="h-px bg-white/5 my-1" />
              <p className="text-[8px] text-sc-gold/60 font-mono uppercase p-2">Diplomatic Links</p>
              {alliances.map((ally) => (
                <button
                  key={ally.id}
                  onClick={() => handleOrgChange(ally.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-all rounded mb-1 flex items-center justify-between group/item",
                    currentOrgId === ally.id ? "bg-sc-gold/20 text-sc-gold" : "text-gray-400 hover:bg-sc-gold/10 hover:text-sc-gold"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Handshake className="w-3 h-3 opacity-40 group-hover/item:opacity-100" />
                    {ally.name}
                  </div>
                  {currentOrgId === ally.id && <div className="w-1 h-1 rounded-full bg-sc-gold shadow-[0_0_5px_rgba(224,177,48,1)]" />}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
