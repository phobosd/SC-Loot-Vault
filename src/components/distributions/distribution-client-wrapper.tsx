"use client";

import { useState } from "react";
import { 
  RotateCw, 
  History, 
  Settings,
  AlertTriangle,
  Info,
  X,
  Search,
  Shield,
  Handshake
} from "lucide-react";
import { DrawingArea } from "@/components/distributions/drawing-area";
import { CreateSessionDialog } from "@/components/distributions/create-session-dialog";
import { cn } from "@/lib/utils";

interface DistributionClientWrapperProps {
  org: any;
  inventory: any[];
  recentLogs: any[];
  allUsers: any[];
  userRole: string;
}

export function DistributionClientWrapper({ 
  org, 
  inventory, 
  recentLogs, 
  allUsers, 
  userRole 
}: DistributionClientWrapperProps) {
  // UI State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  
  // Params State
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [allianceFilter, setAllianceFilter] = useState<"LOCAL" | "ALLIANCE">("LOCAL");
  const [searchHistory, setSearchHistory] = useState("");

  const participants = allUsers.filter(u => {
    // 1. Filter by Organization (Local vs Alliance)
    if (allianceFilter === "LOCAL" && u.org?.name !== org.name) return false;
    
    // 2. Filter by Role
    if (roleFilter === "ALL") return true;
    return u.role === roleFilter;
  });

  const filteredHistory = recentLogs.filter(log => 
    log.itemName.toLowerCase().includes(searchHistory.toLowerCase()) ||
    log.recipient?.name?.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-blue block shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            Loot Distribution System
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            RNG Wheel Interface // {org.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
            <CreateSessionDialog orgId={org.id} inventory={inventory} users={allUsers} />
          )}
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase transition-all rounded"
          >
            <History className="w-4 h-4 text-sc-blue" />
            Full History
          </button>
          <button 
            onClick={() => setIsParamsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase transition-all rounded"
          >
            <Settings className="w-4 h-4 text-sc-blue" />
            Drawing Params
          </button>
        </div>
      </div>

      <DrawingArea 
        inventory={inventory} 
        participants={participants.map(u => ({ 
          id: u.id, 
          name: u.name || u.email,
          orgName: u.org?.name
        }))} 
        orgId={org.id} 
      />

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="sc-glass w-full max-w-4xl max-h-[80vh] flex flex-col border-sc-blue/30 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-sc-blue" />
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">Full Distribution History</h2>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-white/5 bg-black/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  placeholder="SEARCH HISTORICAL TRANSACTIONS..."
                  className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 uppercase"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-mono text-gray-500 uppercase border-b border-white/5">
                    <th className="pb-4">Timestamp</th>
                    <th className="pb-4">Operator</th>
                    <th className="pb-4">Asset</th>
                    <th className="pb-4">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.map((log) => (
                    <tr key={log.id} className="text-xs hover:bg-white/[0.02]">
                      <td className="py-4 font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-4 text-white font-bold uppercase">{log.recipient?.name || "Unknown"}</td>
                      <td className="py-4 text-sc-blue uppercase">{log.itemName}</td>
                      <td className="py-4 font-mono text-[10px] text-gray-400 uppercase">{log.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Params Modal */}
      {isParamsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="sc-glass w-full max-w-md border-sc-blue/30 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-sc-blue" />
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">Drawing Parameters</h2>
              </div>
              <button onClick={() => setIsParamsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Alliance Toggle */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-sc-blue/60 uppercase tracking-widest flex items-center gap-2">
                  <Handshake className="w-3 h-3" /> Diplomatic Network Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAllianceFilter("LOCAL")}
                    className={cn(
                      "py-2 text-[10px] font-bold uppercase border transition-all",
                      allianceFilter === "LOCAL" 
                        ? "bg-sc-blue/20 border-sc-blue text-sc-blue" 
                        : "bg-black/40 border-white/5 text-gray-500 hover:text-white"
                    )}
                  >
                    Local Only
                  </button>
                  <button
                    onClick={() => setAllianceFilter("ALLIANCE")}
                    className={cn(
                      "py-2 text-[10px] font-bold uppercase border transition-all",
                      allianceFilter === "ALLIANCE" 
                        ? "bg-sc-gold/20 border-sc-gold text-sc-gold" 
                        : "bg-black/40 border-white/5 text-gray-500 hover:text-white"
                    )}
                  >
                    Allied Network
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-mono text-sc-blue/60 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-3 h-3" /> Security Clearance Filter
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["ALL", "MEMBER", "ADMIN", "SUPERADMIN"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={cn(
                        "py-2 text-[10px] font-bold uppercase border transition-all",
                        roleFilter === role 
                          ? "bg-sc-blue/20 border-sc-blue text-sc-blue" 
                          : "bg-black/40 border-white/5 text-gray-500 hover:text-white"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-sc-blue/5 border border-sc-blue/20 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono uppercase">Eligible Operators</span>
                  <span className="text-xl font-bold text-white font-mono">{participants.length}</span>
                </div>
              </div>

              <button 
                onClick={() => setIsParamsOpen(false)}
                className="w-full py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="sc-glass sc-hud-border p-6 rounded-lg bg-sc-blue/[0.02]">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-sc-blue mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> System Protocol
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-gray-500 font-mono uppercase tracking-tighter leading-relaxed">
              <div className="space-y-2">
                <p>1. Selection of item from manifest will automatically reserve quantity.</p>
                <p>2. RNG algorithm utilizes hardware-entropy for true randomization.</p>
              </div>
              <div className="space-y-2">
                <p>3. Win will be broadcasted to all active Discord listeners.</p>
                <p>4. Audit logs are generated upon drawing completion.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sc-glass p-6 rounded-lg border-sc-gold/20 bg-sc-gold/[0.02]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-sc-gold mb-4 flex items-center gap-2">
            <RotateCw className="w-4 h-4" /> Live Log
          </h3>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="flex items-center gap-3 p-3 text-gray-600 italic">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase">No recent drawings logged.</span>
              </div>
            ) : (
              recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-2 border-l-2 border-sc-gold/30 bg-black/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-white uppercase">{log.itemName}</p>
                    <p className="text-[8px] text-sc-gold/60 font-mono uppercase">DISPATCHED // {new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
