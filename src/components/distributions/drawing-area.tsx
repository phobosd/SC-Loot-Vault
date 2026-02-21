"use client";

import { useState, useEffect } from "react";
import { RNGWheel } from "./rng-wheel";
import { recordDistribution } from "@/app/actions/distribution";
import { 
  Package, 
  Search, 
  Loader2, 
  Trophy, 
  Check, 
  Users,
  Settings2,
  X,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingAreaProps {
  inventory: any[];
  participants: any[];
  orgId: string;
}

export function DrawingArea({ inventory, participants, orgId }: DrawingAreaProps) {
  const [drawingMode, setDrawingMode] = useState<"OPERATORS" | "ITEMS">("OPERATORS");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  
  // Consolidated Personnel State
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<{ id: string; name: string } | null>(null);

  // Sync initial selections
  useEffect(() => {
    if (drawingMode === "OPERATORS") {
      setSelectedParticipantIds(participants.map(p => p.id));
    } else {
      setSelectedParticipantIds([]);
    }
  }, [participants, drawingMode]);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const toggleParticipant = (id: string) => {
    if (drawingMode === "OPERATORS") {
      // Multi-select for Operator Wheel (these are the slices)
      setSelectedParticipantIds(prev => 
        prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
      );
    } else {
      // Single-select for Item Roulette (this is the lone recipient)
      setSelectedParticipantIds([id]);
    }
  };

  const selectAllVisibleParticipants = () => {
    if (drawingMode === "ITEMS") return; // Not allowed in single-target mode
    const allFilteredIds = filteredParticipants.map(p => p.id);
    const allSelected = allFilteredIds.every(id => selectedParticipantIds.includes(id));
    if (allSelected) {
      setSelectedParticipantIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedParticipantIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const activeParticipants = participants.filter(p => selectedParticipantIds.includes(p.id));
  const targetUser = activeParticipants[0] || null;

  const toggleItem = (item: any) => {
    if (drawingMode === "OPERATORS") {
      // One prize (can be a pool) for the winner
      setSelectedItems(prev => {
        const isSelected = prev.find(i => i.id === item.id);
        if (isSelected) return prev.filter(i => i.id !== item.id);
        return [...prev, item];
      });
    } else {
      // Slices on the wheel
      setSelectedItems(prev => {
        const isSelected = prev.find(i => i.id === item.id);
        if (isSelected) return prev.filter(i => i.id !== item.id);
        return [...prev, item];
      });
    }
  };

  const handleWinIdentified = (winnerId: string) => {
    if (drawingMode === "OPERATORS") {
      const winner = participants.find(p => p.id === winnerId);
      if (winner) setPendingWinner(winner);
    } else {
      const winner = selectedItems.find(i => i.id === winnerId);
      if (winner) setPendingWinner({ id: winner.id, name: winner.name });
    }
  };

  const confirmAssignment = async () => {
    if (!pendingWinner) return;
    
    setIsRecording(true);
    try {
      if (drawingMode === "OPERATORS") {
        for (const item of selectedItems) {
          await recordDistribution({
            orgId,
            recipientId: pendingWinner.id,
            itemName: item.name,
            quantity: 1,
            type: "GIVEAWAY",
            method: "RNG_WHEEL_OP",
            lootItemId: item.id
          });
        }
      } else {
        if (!targetUser) return;
        await recordDistribution({
          orgId,
          recipientId: targetUser.id,
          itemName: pendingWinner.name,
          quantity: 1,
          type: "GIVEAWAY",
          method: "RNG_WHEEL_ITEM",
          lootItemId: pendingWinner.id
        });
      }
      setPendingWinner(null);
      if (drawingMode === "OPERATORS") setSelectedItems([]);
    } catch (err) {
      console.error("Failed to record win:", err);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Left: Consolidated Personnel Selection */}
      <div className="space-y-6">
        <div className="sc-glass p-6 rounded-lg border-sc-gold/20 h-full flex flex-col bg-black/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-gold flex items-center gap-2">
              <Users className="w-4 h-4" /> 
              {drawingMode === "OPERATORS" ? "Eligible Ops" : "Target Recipient"}
            </h3>
            {drawingMode === "OPERATORS" && (
              <button 
                onClick={selectAllVisibleParticipants}
                className="text-[9px] font-black uppercase tracking-widest text-sc-gold/60 hover:text-sc-gold transition-colors px-2 py-1 border border-sc-gold/20 rounded bg-sc-gold/5"
              >
                {filteredParticipants.every(p => selectedParticipantIds.includes(p.id)) ? "None" : "All"}
              </button>
            )}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input 
              type="text"
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              placeholder="SEARCH PERSONNEL..."
              className="w-full bg-black/60 border border-white/10 pl-9 pr-4 py-2 text-[10px] font-mono text-sc-gold focus:outline-none focus:border-sc-gold/50 transition-all uppercase"
            />
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
            {filteredParticipants.map((p) => {
              const isSelected = selectedParticipantIds.includes(p.id);
              return (
                <button 
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded border transition-all text-left group",
                    isSelected 
                      ? "bg-sc-gold/10 border-sc-gold/40 text-white shadow-[0_0_10px_rgba(224,177,48,0.1)]" 
                      : "bg-black/40 border-white/5 text-gray-500 hover:border-sc-gold/20"
                  )}
                >
                  <div className="flex flex-col truncate">
                    <span className="text-[10px] font-bold uppercase truncate">{p.name}</span>
                    {p.orgName && (
                      <span className="text-[7px] text-sc-gold/40 font-mono uppercase tracking-tighter">{p.orgName}</span>
                    )}
                  </div>
                  {isSelected ? (
                    <Check className="w-3 h-3 text-sc-gold flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 border border-white/10 rounded group-hover:border-sc-gold/30 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] text-gray-500 font-mono uppercase">Nodes Selected</span>
            <span className="text-xs font-black text-sc-gold font-mono">{selectedParticipantIds.length}</span>
          </div>
        </div>
      </div>

      {/* Middle: RNG Wheel */}
      <div className="xl:col-span-2 space-y-8">
        <div className="sc-glass rounded-lg p-8 relative overflow-hidden flex flex-col items-center justify-start pt-24 min-h-[600px] bg-black/40">
          
          {/* Enhanced Sliding Mode Toggle - Always Visible */}
          {!isRecording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
              <div className="relative flex bg-black/60 border border-white/10 rounded-full p-1 shadow-2xl w-[320px]">
                {/* Sliding Background Pill */}
                <div 
                  className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-500 ease-out",
                    drawingMode === "OPERATORS" 
                      ? "left-1 bg-sc-blue shadow-[0_0_20px_rgba(0,209,255,0.4)]" 
                      : "left-[calc(50%+2px)] bg-sc-gold shadow-[0_0_20px_rgba(224,177,48,0.4)]"
                  )}
                />
                
                <button 
                  onClick={() => { setDrawingMode("OPERATORS"); setPendingWinner(null); }}
                  disabled={!!pendingWinner}
                  className={cn(
                    "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                    drawingMode === "OPERATORS" ? "text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  <Users className="w-3 h-3" /> Operator Wheel
                </button>
                <button 
                  onClick={() => { setDrawingMode("ITEMS"); setPendingWinner(null); }}
                  disabled={!!pendingWinner}
                  className={cn(
                    "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                    drawingMode === "ITEMS" ? "text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  <Package className="w-3 h-3" /> Item Roulette
                </button>
              </div>
            </div>
          )}

          {isRecording ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-sc-blue animate-spin" />
              <p className="text-xs font-mono text-sc-blue/60 uppercase tracking-widest">Synchronizing Manifest Data...</p>
            </div>
          ) : pendingWinner ? (
            <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500 text-center max-w-md w-full">
              <div className="w-full">
                <Trophy className={cn("w-16 h-16 mx-auto mb-4 animate-bounce", drawingMode === "OPERATORS" ? "text-sc-gold" : "text-sc-blue")} />
                <p className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mb-2">
                  {drawingMode === "OPERATORS" ? "Winning Operator" : "Winning Asset"}
                </p>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">{pendingWinner.name}</h2>
                
                <div className="bg-white/5 border border-white/10 rounded p-4 text-left space-y-3">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                    <Settings2 className="w-3 h-3" /> 
                    {drawingMode === "OPERATORS" ? "Asset Manifest" : "Target Recipient"}
                  </p>
                  {drawingMode === "OPERATORS" ? (
                    <ul className="space-y-1">
                      {selectedItems.map(item => (
                        <li key={item.id} className="text-xs text-white uppercase font-bold flex items-center gap-2">
                          <div className="w-1 h-1 bg-sc-blue rounded-full" /> {item.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-sc-gold font-bold uppercase flex items-center gap-2">
                      <Users className="w-4 h-4" /> {targetUser?.name || "Target Missing"}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full space-y-4">
                <p className="text-[10px] text-gray-500 font-mono uppercase italic">Commit sequence to persistent log?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={confirmAssignment}
                    className="py-4 bg-sc-green/20 hover:bg-sc-green/30 border border-sc-green/50 text-sc-green text-xs font-black uppercase tracking-widest transition-all rounded shadow-[0_0_20px_rgba(0,255,194,0.1)]"
                  >
                    Confirm & Sync
                  </button>
                  <button 
                    onClick={() => setPendingWinner(null)}
                    className="py-4 bg-sc-red/20 hover:bg-sc-red/30 border border-sc-red/50 text-sc-red text-[8px] font-black uppercase tracking-widest transition-all rounded"
                  >
                    Abort Sequence
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <RNGWheel 
              participants={drawingMode === "OPERATORS" ? activeParticipants : selectedItems.map(i => ({ id: i.id, name: i.name }))} 
              itemToDistribute={
                drawingMode === "OPERATORS" 
                  ? (selectedItems.length > 0 ? { id: "multiple", name: `${selectedItems.length} Assets Pooled` } : null)
                  : (targetUser ? { id: targetUser.id, name: `Recipient: ${targetUser.name}` } : null)
              }
              onWin={handleWinIdentified}
              mode={drawingMode}
            />
          )}
        </div>
      </div>

      {/* Right: Manifest Pool (Consistent across modes) */}
      <div className="space-y-6">
        <div className="sc-glass p-6 rounded-lg border-sc-blue/20 h-full flex flex-col bg-black/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-blue flex items-center gap-2">
              <Package className="w-4 h-4" /> 
              {drawingMode === "OPERATORS" ? "Manifest Pool" : "Items on Wheel"}
            </h3>
            <span className="text-[10px] font-mono text-sc-blue bg-sc-blue/10 px-2 py-0.5 rounded border border-sc-blue/20">
              {selectedItems.length} Selection
            </span>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER VAULT..."
              className="w-full bg-black/40 border border-white/10 pl-9 pr-4 py-2 text-[10px] font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 uppercase"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
            {filteredInventory.map((item) => {
              const isSelected = selectedItems.find(i => i.id === item.id);
              return (
                <button 
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded border transition-all group text-left",
                    isSelected 
                      ? "bg-sc-blue/10 border-sc-blue shadow-[0_0_10px_rgba(0,209,255,0.1)]" 
                      : "bg-black/40 border-white/5 hover:border-sc-blue/30"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] font-bold uppercase truncate",
                      isSelected ? "text-sc-blue" : "text-white"
                    )}>
                      {item.name}
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase">{item.category} // QTY: {item.quantity}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-sc-blue" />}
                </button>
              );
            })}
          </div>
          
          {(selectedItems.length > 0 || selectedParticipantIds.length > 0) && (
            <button 
              onClick={() => { setSelectedItems([]); setSelectedParticipantIds([]); }}
              className="mt-4 w-full py-2 text-[10px] font-bold text-sc-red/60 hover:text-sc-red uppercase tracking-widest transition-colors border border-transparent hover:border-sc-red/20 rounded"
            >
              Reset Configuration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
