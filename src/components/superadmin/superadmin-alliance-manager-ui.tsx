"use client";

import { useState } from "react";
import { 
  Handshake, 
  Plus, 
  Trash2, 
  Loader2, 
  Building2, 
  ShieldAlert,
  Search,
  Globe,
  Check
} from "lucide-react";
import { adminCreateAlliance, adminDeleteAlliance } from "@/app/actions/alliance";
import { cn } from "@/lib/utils";

interface SuperAdminAllianceManagerUIProps {
  orgs: any[];
  alliances: any[];
}

export function SuperAdminAllianceManagerUI({ orgs, alliances }: SuperAdminAllianceManagerUIProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [org1, setOrg1] = useState("");
  const [org2, setOrg2] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = async () => {
    if (!org1 || !org2) return;
    if (org1 === org2) {
      alert("Cannot ally an organization with itself.");
      return;
    }
    setLoading("create");
    try {
      const res = await adminCreateAlliance(org1, org2);
      if (res.success) {
        setOrg1("");
        setOrg2("");
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (o1: string, o2: string) => {
    if (!confirm("Terminate this diplomatic link?")) return;
    setLoading(`${o1}-${o2}`);
    try {
      const res = await adminDeleteAlliance(o1, o2);
      if (!res.success) {
        alert(res.error);
      }
    } catch (err: any) {
      alert("Nexus Protocol Error: " + err.message);
    } finally {
      setLoading(null);
    }
  };

  const filteredAlliances = alliances.filter(a => 
    a.org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ally.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Alliance Creation Form */}
      <div className="sc-glass p-8 rounded-lg border-sc-blue/30 bg-sc-blue/[0.02]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 sc-hud-corner flex items-center justify-center bg-sc-blue/10 border border-sc-blue/30">
            <Handshake className="w-6 h-6 text-sc-blue animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Establish Diplomatic Link</h2>
            <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Root Override // Manual Alliance Provisioning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Primary Node</label>
            <select 
              value={org1} onChange={(e) => setOrg1(e.target.value)}
              className="w-full bg-black/60 border border-white/10 px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-sc-blue/50 uppercase appearance-none"
            >
              <option value="">-- SELECT ORG --</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div className="flex justify-center pb-3">
            <Globe className="w-6 h-6 text-sc-blue/20" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Target Node</label>
            <select 
              value={org2} onChange={(e) => setOrg2(e.target.value)}
              className="w-full bg-black/60 border border-white/10 px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-sc-blue/50 uppercase appearance-none"
            >
              <option value="">-- SELECT ORG --</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={handleCreate}
          disabled={!org1 || !org2 || loading === "create"}
          className="w-full mt-8 py-4 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-[0.3em] transition-all rounded flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,209,255,0.1)] disabled:opacity-30"
        >
          {loading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Finalize Diplomatic Link
        </button>
      </div>

      {/* Global Alliance Registry */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black text-sc-gold uppercase tracking-[0.4em] flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" />
            Global Alliance Registry
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH REGISTRY..."
              className="w-full bg-black/40 border border-white/10 pl-9 pr-4 py-2 text-[10px] font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 uppercase"
            />
          </div>
        </div>

        <div className="sc-glass border-sc-border/20 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Organization A</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Organization B</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAlliances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-600 uppercase text-xs font-mono">
                    No active diplomatic records detected in registry.
                  </td>
                </tr>
              ) : (
                filteredAlliances.map((alliance) => (
                  <tr key={alliance.id} className="hover:bg-sc-blue/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-sc-blue/40" />
                        <span className="text-sm font-bold text-white uppercase">{alliance.org.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-sc-green animate-pulse shadow-[0_0_5px_rgba(0,255,194,1)]" />
                        <span className="text-[8px] font-black text-sc-green uppercase">Linked</span>
                        <div className="w-1 h-1 rounded-full bg-sc-green animate-pulse shadow-[0_0_5px_rgba(0,255,194,1)]" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-sc-blue/40" />
                        <span className="text-sm font-bold text-white uppercase">{alliance.ally.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(alliance.orgId, alliance.allyId)}
                        disabled={!!loading}
                        className="p-2 bg-sc-red/10 border border-sc-red/30 text-sc-red rounded hover:bg-sc-red/20 transition-all"
                      >
                        {loading === `${alliance.orgId}-${alliance.allyId}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
