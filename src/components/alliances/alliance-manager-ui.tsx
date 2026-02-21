"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  X, 
  Check, 
  ShieldAlert,
  Handshake,
  Globe,
  Plus,
  Loader2,
  Search,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendAllianceRequest, approveAllianceRequest, rejectAllianceRequest, breakAlliance } from "@/app/actions/alliance";

interface AllianceManagerUIProps {
  org: any;
  otherOrgs: any[];
}

export function AllianceManagerUI({ org, otherOrgs }: AllianceManagerUIProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOtherOrgs = otherOrgs.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = async (id: string, action: () => Promise<any>, confirmation?: string) => {
    if (confirmation && !confirm(confirmation)) return;
    setLoading(id);
    try {
      const res = await action();
      if (!res.success) alert(res.error);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Active Alliances & Incoming Requests */}
      <div className="lg:col-span-2 space-y-8">
        {/* Incoming Handshakes */}
        {org.receivedAllianceRequests.length > 0 && (
          <div className="sc-glass p-6 rounded-lg border-sc-gold/30 bg-sc-gold/[0.02] animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-sm font-black uppercase tracking-widest text-sc-gold mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Pending Handshake Requests
            </h3>
            <div className="space-y-4">
              {org.receivedAllianceRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-black/40 border border-sc-gold/20 rounded">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sc-hud-corner bg-sc-gold/5 flex items-center justify-center border border-sc-gold/20">
                      <Handshake className="w-5 h-5 text-sc-gold/60" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase">{req.sender.name}</p>
                      <p className="text-[10px] text-sc-gold/60 font-mono uppercase">Origin: {req.sender.slug}.vault.local</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(req.id, () => approveAllianceRequest(req.id))}
                      disabled={!!loading}
                      className="px-4 py-2 bg-sc-green/20 hover:bg-sc-green/30 border border-sc-green/50 text-sc-green text-[10px] font-black uppercase rounded transition-all"
                    >
                      {loading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Authorize"}
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, () => rejectAllianceRequest(req.id))}
                      disabled={!!loading}
                      className="px-4 py-2 bg-sc-red/20 hover:bg-sc-red/30 border border-sc-red/50 text-sc-red text-[10px] font-black uppercase rounded transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Established Alliances */}
        <div className="sc-glass p-6 rounded-lg border-sc-blue/20">
          <h3 className="text-sm font-black uppercase tracking-widest text-sc-blue mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Authorized Alliances
          </h3>
          {org.alliances.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Globe className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">No active diplomatic links established.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {org.alliances.map((alliance: any) => (
                <div key={alliance.id} className="p-4 bg-sc-blue/[0.03] border border-sc-blue/20 rounded group hover:border-sc-blue/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-sc-blue/10 flex items-center justify-center">
                        <Handshake className="w-4 h-4 text-sc-blue" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase">{alliance.ally.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-sc-green animate-pulse" />
                          <span className="text-[8px] text-sc-green font-black uppercase">Link: Stable</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAction(alliance.id, () => breakAlliance(alliance.allyId), `CRITICAL: You are about to terminate the diplomatic link with ${alliance.ally.name}. This will revoke mutual vault visibility and joint distribution access. Proceed?`)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-sc-red/40 hover:text-sc-red transition-all"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                    <Link 
                      href={`/vault?allyId=${alliance.allyId}`}
                      className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white uppercase rounded transition-all"
                    >
                      <Search className="w-3 h-3" /> View Vault
                    </Link>
                    <Link 
                      href={`/vault?allyId=${alliance.allyId}`}
                      className="flex items-center justify-center gap-2 py-2 bg-sc-blue/10 hover:bg-sc-blue/20 text-[9px] font-bold text-sc-blue uppercase rounded transition-all"
                    >
                      <Plus className="w-3 h-3" /> Request Loot
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Find Allies */}
      <div className="space-y-6">
        <div className="sc-glass p-6 rounded-lg border-sc-blue/20 bg-black/20 flex flex-col h-full">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Network Relay
          </h3>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH ORG CODES..."
              className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 uppercase"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {filteredOtherOrgs.map((otherOrg) => (
              <div key={otherOrg.id} className="p-3 bg-white/[0.02] border border-white/5 rounded flex items-center justify-between group hover:bg-sc-blue/[0.02] hover:border-sc-blue/20 transition-all">
                <div>
                  <p className="text-[10px] font-bold text-white uppercase">{otherOrg.name}</p>
                  <p className="text-[8px] text-gray-500 font-mono uppercase">{otherOrg.slug}.local</p>
                </div>
                <button 
                  onClick={() => handleAction(otherOrg.id, () => sendAllianceRequest(otherOrg.id))}
                  disabled={!!loading}
                  className="p-2 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue rounded hover:bg-sc-blue/20 transition-all"
                >
                  {loading === otherOrg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Handshake className="w-3 h-3" />}
                </button>
              </div>
            ))}
            {filteredOtherOrgs.length === 0 && (
              <p className="text-center py-10 text-[9px] font-mono text-gray-600 uppercase">No unknown entities detected.</p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Pending Handshakes</h4>
            <div className="space-y-2">
              {org.sentAllianceRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-2 bg-black/20 border border-white/5 rounded italic opacity-60">
                  <span className="text-[9px] text-gray-400 uppercase">{req.target.name}</span>
                  <span className="text-[8px] font-mono uppercase">Awaiting ACK...</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
