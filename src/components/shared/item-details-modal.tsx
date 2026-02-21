"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Cpu, 
  Shield, 
  Box, 
  Info, 
  Loader2, 
  ExternalLink,
  Zap,
  Activity,
  Maximize2,
  Users,
  ChevronRight,
  UserPlus
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { updateLootItem } from "@/app/actions/loot";
import { assignItemToOperator } from "@/app/actions/distribution";

interface ItemDetailsModalProps {
  itemId: string | null;
  onClose: () => void;
  orgId?: string; // Optional orgId for actions
}

export function ItemDetailsModal({ itemId, onClose, orgId }: ItemDetailsModalProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Action state
  const [activeTab, setActiveTab] = useState<"info" | "dispatch">("info");
  const [qty, setQty] = useState(1);
  const [isActing, setIsActing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (!itemId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`/api/sc-items/${encodeURIComponent(itemId)}`);
        setItem(res.data);
        setQty(res.data.quantity || 1);
      } catch (err: any) {
        setError(err.response?.data?.error || "Handshake failed.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      if (!orgId) return;
      try {
        const res = await axios.get('/api/users'); // I'll need to create this simple list API
        setUsers(res.data);
      } catch (err) {}
    };

    fetchDetails();
    fetchUsers();
  }, [itemId, orgId]);

  if (!itemId) return null;

  const handleUpdateQty = async () => {
    if (!item.isOrgItem) return;
    setIsActing(true);
    try {
      await updateLootItem(item.id, qty);
      onClose();
    } catch (err) {} finally { setIsActing(false); }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !orgId) return;
    setIsActing(true);
    try {
      await assignItemToOperator({
        orgId,
        recipientId: selectedUserId,
        lootItemId: item.id,
        itemName: item.name,
        quantity: qty
      });
      onClose();
    } catch (err) {} finally { setIsActing(false); }
  };

  const getItemIcon = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes('component') || t.includes('shield') || t.includes('power')) return <Cpu className="w-6 h-6 text-sc-blue" />;
    if (t.includes('weapon')) return <Zap className="w-6 h-6 text-sc-gold" />;
    if (t.includes('armor')) return <Shield className="w-6 h-6 text-sc-green" />;
    return <Box className="w-6 h-6 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="sc-glass w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-sc-blue/30 shadow-[0_0_100px_rgba(0,209,255,0.15)] flex flex-col max-h-[90vh] z-[210]">
        {/* Header */}
        <div className="px-6 pt-5 border-b border-white/10 bg-sc-blue/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sc-hud-corner flex items-center justify-center bg-sc-blue/5 border border-sc-blue/20">
                {loading ? <Loader2 className="w-6 h-6 text-sc-blue animate-spin" /> : getItemIcon(item?.type)}
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">
                  {loading ? "Decrypting..." : item?.name}
                </h2>
                <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">
                  {loading ? "Awaiting Data Link..." : `Telemetry Node // ${item?.type || "Unknown Class"}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          {item?.isOrgItem && (
            <div className="flex gap-6">
              <button 
                onClick={() => setActiveTab("info")}
                className={cn(
                  "pb-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border-b-2",
                  activeTab === "info" ? "text-sc-blue border-sc-blue" : "text-gray-600 border-transparent hover:text-gray-400"
                )}
              >
                Intelligence
              </button>
              <button 
                onClick={() => setActiveTab("dispatch")}
                className={cn(
                  "pb-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border-b-2",
                  activeTab === "dispatch" ? "text-sc-gold border-sc-gold" : "text-gray-600 border-transparent hover:text-gray-400"
                )}
              >
                Operator Dispatch
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Activity className="w-12 h-12 text-sc-blue animate-pulse" />
              <p className="text-xs font-mono text-sc-blue/40 uppercase tracking-[0.5em]">Synchronizing Master Database...</p>
            </div>
          ) : activeTab === "dispatch" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="sc-hud-border p-6 bg-sc-gold/[0.03] border-l-2 border-sc-gold/50 rounded-r">
                <h4 className="text-[10px] font-bold text-sc-gold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Manifest Modification Protocol
                </h4>
                
                <div className="space-y-6">
                  {/* Quantity Adjustment */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Available Manifest</label>
                      <p className="text-xl font-bold text-white font-mono">{item.quantity} units</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Target Quantity</label>
                      <input 
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={qty}
                        onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                        className="w-full bg-black/40 border border-sc-gold/30 px-4 py-2 text-sm font-mono text-sc-gold focus:outline-none focus:border-sc-gold shadow-[0_0_10px_rgba(224,177,48,0.1)]"
                      />
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/5" />

                  {/* Assignment Selection */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-3 h-3" /> Select Recipient Operator
                    </label>
                    <select 
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-sc-gold/50 appearance-none uppercase tracking-widest"
                    >
                      <option value="">-- AWAITING OPERATOR SELECTION --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name || u.email} [{u.role}]</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleUpdateQty}
                      disabled={isActing}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      Update Inventory Only
                    </button>
                    <button 
                      onClick={handleAssign}
                      disabled={isActing || !selectedUserId}
                      className="py-3 bg-sc-gold/20 hover:bg-sc-gold/30 border border-sc-gold/50 text-sc-gold text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(224,177,48,0.1)]"
                    >
                      {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      Finalize Assignment
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded italic">
                <p className="text-[9px] text-gray-600 font-mono leading-relaxed">
                  NOTE: ASSIGNING AN ASSET WILL AUTOMATICALLY REMOVE THE SPECIFIED QUANTITY FROM THE ORGANIZATION LOOT VAULT AND APPEND THE ACTION TO THE PERSISTENT AUDIT LOG.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4">
              <Info className="w-12 h-12 text-sc-red mx-auto opacity-50" />
              <p className="text-sm font-mono text-sc-red uppercase">{error}</p>
              <button onClick={onClose} className="text-[10px] text-gray-500 underline uppercase tracking-widest">Close Link</button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Intelligence Summary */}
              <div className="space-y-6">
                <div className="sc-hud-border p-6 bg-sc-blue/[0.03] border-l-2 border-sc-blue/50 rounded-r relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    {getItemIcon(item?.type)}
                  </div>
                  <h4 className="text-[10px] font-bold text-sc-blue uppercase tracking-[0.3em] mb-3">Primary Intelligence</h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-light">
                    {item.description || "Historical data for this entry is currently restricted or unavailable in the local cache. No extended telemetry logs detected for this asset designation."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="sc-glass p-4 bg-black/40 border border-white/5 rounded">
                    <p className="text-[8px] text-gray-600 uppercase font-mono mb-1 tracking-widest">Manufacturer</p>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{item.manufacturer || "UNKNOWN DESIGNATION"}</p>
                  </div>
                  <div className="sc-glass p-4 bg-black/40 border border-white/5 rounded">
                    <p className="text-[8px] text-gray-600 uppercase font-mono mb-1 tracking-widest">Size / Grade Class</p>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{item.size || "—"} / {item.grade || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Specs Table */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Maximize2 className="w-3 h-3 text-sc-blue" />
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/5 border border-white/5 overflow-hidden rounded">
                  {[
                    { label: "Designation", value: item.name },
                    { label: "Classification", value: item.type },
                    { label: "Sub-Type", value: item.subType || "Standard" },
                    { label: "Wiki ID", value: item.wikiId || "LOCAL-ENT" },
                    { label: "Manifest Source", value: item.isOrgItem ? "Org Vault" : "Galactic Wiki" },
                    { label: "System Integrity", value: "Verified" },
                  ].map((spec) => (
                    <div key={spec.label} className="p-4 bg-[#0A0A12] hover:bg-sc-blue/[0.02] transition-colors">
                      <p className="text-[8px] text-gray-600 uppercase font-mono mb-1">{spec.label}</p>
                      <p className="text-[10px] text-sc-blue/80 font-mono uppercase truncate">{spec.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-6 border-t border-white/5 flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em]">
                  End-to-End Encryption: 256-BIT // UEE-DATA-LINK ACTIVE
                </p>
                {item.wikiId && (
                  <a 
                    href={`https://starcitizen.tools/${encodeURIComponent(item.name)}`} 
                    target="_blank" 
                    className="flex items-center gap-2 text-sc-blue hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest"
                  >
                    View Galactic Archive <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
