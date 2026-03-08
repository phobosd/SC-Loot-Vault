"use client";

import { useState } from "react";
import { 
  Plus, 
  X, 
  Box, 
  Users, 
  Loader2, 
  Check, 
  Search,
  Zap,
  Layers,
  ChevronRight,
  AlertTriangle,
  RotateCw,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createLootSession } from "@/app/actions/distribution";
import { useRouter } from "next/navigation";

interface CreateSessionDialogProps {
  orgId: string;
  inventory: any[];
  users: any[];
}

export function CreateSessionDialog({ orgId, inventory, users }: CreateSessionDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Alpha Distribution Sequence");
  const [type, setType] = useState<"REEL" | "WHEEL">("REEL");
  const [mode, setMode] = useState<"OPERATORS" | "ITEMS">("OPERATORS");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const [itemSearch, setItemSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
  const filteredUsers = users.filter(u => (u.name || u.email).toLowerCase().includes(userSearch.toLowerCase()));

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleUser = (id: string) => {
    if (mode === "ITEMS") {
      setSelectedUserIds(prev => prev.includes(id) ? [] : [id]);
    } else {
      setSelectedUserIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const setSelectionMode = (newMode: "OPERATORS" | "ITEMS") => {
    setMode(newMode);
    if (newMode === "ITEMS" && selectedUserIds.length > 1) {
      setSelectedUserIds([selectedUserIds[0]]);
    }
  };

  const handleSubmit = async () => {
    if (selectedItemIds.length === 0 || selectedUserIds.length === 0) {
      setLastError("Incomplete parameters. Minimum 1 asset and 1 operator required.");
      return;
    }

    setIsSubmitting(true);
    setLastError(null);
    try {
      const res = await createLootSession({
        orgId,
        title,
        itemIds: selectedItemIds,
        participantIds: selectedUserIds,
        type,
        mode
      });

      if (res.success && res.sessionId) {
        setIsOpen(false);
        setSelectedItemIds([]);
        setSelectedUserIds([]);
        router.push(`/dispatch/${res.sessionId}`);
      } else {
        setLastError(res.error || "Initialization failed.");
      }
    } catch (err: any) {
      setLastError(err.message || "Link failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-bold uppercase transition-all rounded shadow-[0_0_15px_rgba(0,209,255,0.2)]"
      >
        <Plus className="w-4 h-4" /> New Dispatch Session
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="sc-glass w-full max-w-5xl h-[90vh] flex flex-col border-sc-blue/30 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
          <div className="flex items-center gap-4">
            <Layers className="w-6 h-6 text-sc-blue animate-pulse" />
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Loot Dispatch Protocol</h2>
              <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase mt-1">Multi-Operator RNG Sequence Initialization</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {lastError && (
          <div className="px-6 py-4 bg-sc-red/10 border-b border-sc-red/30">
            <div className="flex items-center gap-2 mb-2 text-sc-red text-[10px] font-black uppercase">
              <AlertTriangle className="w-4 h-4" /> Protocol Error
            </div>
            <div className="bg-black/40 p-2 rounded border border-sc-red/20 font-mono text-[10px] text-white select-all">
              {lastError}
            </div>
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/5 bg-sc-blue/[0.02]">
          <div className="space-y-3">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">1. Interface Protocol</label>
            <div className="flex gap-2">
              <button onClick={() => setType("REEL")} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded", type === "REEL" ? "bg-sc-blue text-black border-sc-blue shadow-[0_0_15px_rgba(0,209,255,0.4)]" : "bg-black/40 border-white/10 text-gray-500")}>
                <Box className="w-3 h-3 inline mr-2" /> Box Opening
              </button>
              <button onClick={() => setType("WHEEL")} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded", type === "WHEEL" ? "bg-sc-gold text-black border-sc-gold shadow-[0_0_15px_rgba(224,177,48,0.4)]" : "bg-black/40 border-white/10 text-gray-500")}>
                <RotateCw className="w-3 h-3 inline mr-2" /> Operator Wheel
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">2. Selection Logic</label>
            <div className="flex gap-2">
              <button onClick={() => setSelectionMode("OPERATORS")} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded", mode === "OPERATORS" ? "bg-sc-blue/20 border-sc-blue text-sc-blue" : "bg-black/40 border-white/10 text-gray-500")}>
                <Users className="w-3 h-3 inline mr-2" /> Winner gets ALL
              </button>
              <button onClick={() => setSelectionMode("ITEMS")} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest border transition-all rounded", mode === "ITEMS" ? "bg-sc-gold/20 border-sc-gold text-sc-gold" : "bg-black/40 border-white/10 text-gray-500")}>
                <Target className="w-3 h-3 inline mr-2" /> Winner gets 1 ASSET
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
          {/* Asset Selection */}
          <div className="flex flex-col h-full bg-[#05050A] p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-xs font-bold text-sc-blue uppercase tracking-widest flex items-center gap-2">
                <Box className="w-4 h-4" /> 3. Select Asset Pool ({selectedItemIds.length})
              </h3>
              <button 
                onClick={() => {
                  const allVisibleIds = filteredItems.map(i => i.id);
                  const isAllSelected = allVisibleIds.every(id => selectedItemIds.includes(id));
                  if (isAllSelected) {
                    setSelectedItemIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                  } else {
                    setSelectedItemIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
                  }
                }}
                className="text-[9px] font-black uppercase tracking-widest text-sc-blue/60 hover:text-sc-blue transition-colors px-2 py-1 border border-sc-blue/20 rounded bg-sc-blue/5"
              >
                {filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.includes(i.id)) ? "Deselect All" : "Select All Visible"}
              </button>
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input type="text" placeholder="FILTER VAULT..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 pl-9 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {filteredItems.map(item => (
                <button key={item.id} onClick={() => toggleItem(item.id)} className={cn("w-full flex items-center justify-between p-3 text-left transition-all border", selectedItemIds.includes(item.id) ? "bg-sc-blue/10 border-sc-blue/50 text-white" : "bg-black/20 border-white/5 text-gray-500")}>
                  <div><p className="text-[11px] font-bold uppercase">{item.name}</p><p className="text-[9px] font-mono opacity-60">{item.category}</p></div>
                  {selectedItemIds.includes(item.id) && <Check className="w-4 h-4 text-sc-blue" />}
                </button>
              ))}
            </div>
          </div>

          {/* Operator Selection */}
          <div className="flex flex-col h-full bg-[#05050A] p-6 space-y-4">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-xs font-bold text-sc-gold uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" /> 4. Designate Participants ({selectedUserIds.length})
              </h3>
              {mode === "OPERATORS" && (
                <button 
                  onClick={() => {
                    const allVisibleIds = filteredUsers.map(u => u.id);
                    const isAllSelected = allVisibleIds.every(id => selectedUserIds.includes(id));
                    if (isAllSelected) {
                      setSelectedUserIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                    } else {
                      setSelectedUserIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
                    }
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-sc-gold/60 hover:text-sc-gold transition-colors px-2 py-1 border border-sc-gold/20 rounded bg-sc-gold/5"
                >
                  {filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id)) ? "Deselect All" : "Select All Visible"}
                </button>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input type="text" placeholder="FILTER PERSONNEL..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 pl-9 pr-4 py-2 text-xs font-mono text-sc-gold focus:outline-none focus:border-sc-gold/50" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {filteredUsers.map(u => (
                <button key={u.id} onClick={() => toggleUser(u.id)} className={cn("w-full flex items-center justify-between p-3 text-left transition-all border", selectedUserIds.includes(u.id) ? "bg-sc-gold/10 border-sc-gold/50 text-white" : "bg-black/20 border-white/5 text-gray-500")}>
                  <div><p className="text-[11px] font-bold uppercase">{u.name || u.email}</p><p className="text-[9px] font-mono opacity-60">{u.role} // {u.username}</p></div>
                  {selectedUserIds.includes(u.id) && <Check className="w-4 h-4 text-sc-gold" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 bg-black/60 border-t border-white/10 flex items-center justify-between gap-6">
          <div className="flex-1 max-w-sm">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 px-4 py-3 text-xs font-mono text-white focus:outline-none" />
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsOpen(false)} className="px-8 text-xs font-bold text-gray-500 uppercase">Abort</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-4 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest rounded transition-all">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 inline mr-2" />}
              Initialize Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
