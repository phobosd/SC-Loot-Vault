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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createLootSession } from "@/app/actions/distribution";

interface CreateSessionDialogProps {
  orgId: string;
  inventory: any[];
  users: any[];
}

export function CreateSessionDialog({ orgId, inventory, users }: CreateSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Alpha Distribution Sequence");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search states
  const [itemSearch, setItemSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const filteredItems = inventory.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
  const filteredUsers = users.filter(u => (u.name || u.email).toLowerCase().includes(userSearch.toLowerCase()));

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllItems = () => {
    const allFilteredIds = filteredItems.map(i => i.id);
    const allSelected = allFilteredIds.every(id => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const selectAllUsers = () => {
    const allFilteredIds = filteredUsers.map(u => u.id);
    const allSelected = allFilteredIds.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleSubmit = async () => {
    if (selectedItemIds.length === 0 || selectedUserIds.length === 0) {
      alert("Selection manifest incomplete. Minimum 1 asset and 1 operator required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createLootSession({
        orgId,
        title,
        itemIds: selectedItemIds,
        participantIds: selectedUserIds
      });

      if (res.success) {
        setIsOpen(false);
        setSelectedItemIds([]);
        setSelectedUserIds([]);
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
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
        <Plus className="w-4 h-4" />
        New Dispatch Session
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="sc-glass w-full max-w-5xl h-[90vh] flex flex-col border-sc-blue/30 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
          <div className="flex items-center gap-4">
            <Layers className="w-6 h-6 text-sc-blue animate-pulse" />
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Coordinate Loot Dispatch</h2>
              <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Multi-Operator Assignment Protocol</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

                <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
                  {/* Left: Asset Selection */}
                  <div className="flex flex-col h-full bg-[#05050A] p-6 space-y-4 overflow-hidden">
                    <div className="flex items-center justify-between flex-shrink-0">
                      <h3 className="text-xs font-bold text-sc-blue uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-4 h-4" /> 1. Select Asset Pool ({selectedItemIds.length})
                      </h3>
                      <button 
                        onClick={selectAllItems}
                        className="text-[9px] font-black uppercase tracking-widest text-sc-blue/60 hover:text-sc-blue transition-colors px-2 py-1 border border-sc-blue/20 rounded bg-sc-blue/5"
                      >
                        {filteredItems.every(i => selectedItemIds.includes(i.id)) ? "Deselect All" : "Select All Visible"}
                      </button>
                    </div>
                    <div className="relative flex-shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                      <input 
                        type="text"
                        placeholder="FILTER VAULT..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 pl-9 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                      {filteredItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 text-left transition-all border",
                            selectedItemIds.includes(item.id)
                              ? "bg-sc-blue/10 border-sc-blue/50 text-white"
                              : "bg-black/20 border-white/5 text-gray-500 hover:border-white/20"
                          )}
                        >
                          <div>
                            <p className="text-[11px] font-bold uppercase">{item.name}</p>
                            <p className="text-[9px] font-mono opacity-60">{item.category} // QTY: {item.quantity}</p>
                          </div>
                          {selectedItemIds.includes(item.id) && <Check className="w-4 h-4 text-sc-blue" />}
                        </button>
                      ))}
                    </div>
                  </div>
        
                  {/* Right: Operator Selection */}
                  <div className="flex flex-col h-full bg-[#05050A] p-6 space-y-4 overflow-hidden">
                    <div className="flex items-center justify-between flex-shrink-0">
                      <h3 className="text-xs font-bold text-sc-gold uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4" /> 2. Designate Operators ({selectedUserIds.length})
                      </h3>
                      <button 
                        onClick={selectAllUsers}
                        className="text-[9px] font-black uppercase tracking-widest text-sc-gold/60 hover:text-sc-gold transition-colors px-2 py-1 border border-sc-gold/20 rounded bg-sc-gold/5"
                      >
                        {filteredUsers.every(u => selectedUserIds.includes(u.id)) ? "Deselect All" : "Select All Visible"}
                      </button>
                    </div>
                    <div className="relative flex-shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                      <input 
                        type="text"
                        placeholder="FILTER PERSONNEL..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 pl-9 pr-4 py-2 text-xs font-mono text-sc-gold focus:outline-none focus:border-sc-gold/50"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => toggleUser(user.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 text-left transition-all border",
                            selectedUserIds.includes(user.id)
                              ? "bg-sc-gold/10 border-sc-gold/50 text-white"
                              : "bg-black/20 border-white/5 text-gray-500 hover:border-white/20"
                          )}
                        >
                          <div>
                            <p className="text-[11px] font-bold uppercase">{user.name || user.email}</p>
                            <p className="text-[9px] font-mono opacity-60">{user.role} // DESIGNATION: {user.username || 'UNLINKED'}</p>
                          </div>
                          {selectedUserIds.includes(user.id) && <Check className="w-4 h-4 text-sc-gold" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

        <div className="px-6 py-6 bg-black/60 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full max-w-md">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 block">Dispatch Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
            />
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-8 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10"
            >
              Abort Sequence
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || selectedItemIds.length === 0 || selectedUserIds.length === 0}
              className="px-10 py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.1)]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isSubmitting ? "INITIALIZING..." : "Initialize Dispatch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
