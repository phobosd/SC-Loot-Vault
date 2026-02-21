"use client";

import { useState } from "react";
import { RNGWheel } from "./rng-wheel";
import { recordDistribution } from "@/app/actions/distribution";
import { Package, ChevronRight } from "lucide-react";

interface DrawingAreaProps {
  inventory: any[];
  participants: any[];
  orgId: string;
}

export function DrawingArea({ inventory, participants, orgId }: DrawingAreaProps) {
  const [selectedItem, setSelectedItem] = useState<any>(inventory[0] || null);

  const handleWin = async (winnerId: string) => {
    if (!selectedItem) return;
    
    const winnerName = participants.find(p => p.id === winnerId)?.name || "Unknown";
    
    console.log(`Recording win: ${winnerName} won ${selectedItem.name}`);
    
    await recordDistribution({
      orgId,
      recipientId: null as any, // In a real app, link to real user ID
      itemName: selectedItem.name,
      quantity: 1,
      type: "GIVEAWAY",
      method: "RNG_WHEEL",
      lootItemId: selectedItem.id
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="sc-glass rounded-lg p-8 relative overflow-hidden">
          <RNGWheel 
            participants={participants} 
            itemToDistribute={selectedItem}
            onWin={handleWin}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="sc-glass p-6 rounded-lg border-sc-blue/20">
          <h3 className="text-sm font-bold uppercase tracking-widest text-sc-blue mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> Select Manifest Item
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {inventory.map((item) => (
              <button 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full flex items-center justify-between p-3 rounded border transition-all group text-left ${
                  selectedItem?.id === item.id 
                    ? "bg-sc-blue/10 border-sc-blue shadow-[0_0_10px_rgba(0,209,255,0.2)]" 
                    : "bg-black/40 border-white/5 hover:border-sc-blue/30 hover:bg-sc-blue/5"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-bold uppercase truncate ${selectedItem?.id === item.id ? "text-sc-blue" : "text-white"}`}>
                    {item.name}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase">{item.category} // QTY: {item.quantity}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-colors ${selectedItem?.id === item.id ? "text-sc-blue" : "text-gray-700 group-hover:text-sc-blue"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
