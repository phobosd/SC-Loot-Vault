"use client";

import { Package, Trophy, CheckCircle2, RotateCw, Loader2, ShieldAlert } from "lucide-react";
import { LootSessionItem, User } from "@/lib/types";

interface SessionManifestProps {
  items: LootSessionItem[];
}

export function SessionManifest({ items }: SessionManifestProps) {
  return (
    <div className="sc-glass p-8 border-sc-blue/20 flex flex-col min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black text-sc-blue uppercase tracking-widest flex items-center gap-2">
          <Package className="w-4 h-4" /> Sequence Manifest
        </h3>
        <span className="text-[10px] font-mono text-gray-600 uppercase">{items.length} Assets at stake</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[200px] pr-2">
        {items.map((i: LootSessionItem) => (
          <div key={i.id} className="p-3 bg-black/40 border border-white/5 rounded flex items-center justify-between">
            <p className="text-[10px] font-bold text-white uppercase truncate pr-4">{i.name}</p>
            <span className="text-[8px] font-mono text-sc-blue/40 uppercase">{i.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface WinnerHUDProps {
  winnerUser: User;
  sessionMode: "OPERATORS" | "ITEMS";
  itemCount: number;
  winningItemName: string | null;
  isAdmin: boolean;
  sessionStatus: string;
  isProcessing: boolean;
  onReset: () => void;
  onFinalize: () => void;
}

export function WinnerHUD({ 
  winnerUser, 
  sessionMode, 
  itemCount, 
  winningItemName, 
  isAdmin, 
  sessionStatus, 
  isProcessing,
  onReset, 
  onFinalize 
}: WinnerHUDProps) {
  return (
    <div className="sc-glass p-8 border-sc-gold/50 bg-sc-gold/5 text-center animate-in zoom-in-95 duration-700 h-full flex flex-col justify-center min-h-[300px]">
      <Trophy className="w-12 h-12 text-sc-gold mx-auto mb-4 animate-bounce" />
      <p className="text-[10px] text-sc-gold uppercase font-mono tracking-[0.3em] mb-2">Sequence Result Detected</p>
      <h2 className="text-3xl font-black text-white uppercase mb-1 tracking-tighter">{winnerUser.name || winnerUser.username}</h2>
      <p className="text-xs text-sc-gold font-bold uppercase mb-6 tracking-widest">
        WINS: {sessionMode === "OPERATORS" ? `${itemCount} Asset Manifest` : winningItemName}
      </p>
      
      {isAdmin && sessionStatus !== "COMPLETED" && (
        <div className="flex gap-4 mt-4">
          <button onClick={onReset} className="flex-1 py-4 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded">Re-Spin</button>
          <button onClick={onFinalize} disabled={isProcessing} className="flex-1 py-4 bg-sc-green/20 border border-sc-green/50 text-sc-green text-xs font-black uppercase tracking-widest rounded">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalize & Distribute"}
          </button>
        </div>
      )}
      {sessionStatus === "COMPLETED" && (
        <div className="mt-4 p-4 border border-sc-green/30 bg-sc-green/5 rounded flex items-center justify-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-sc-green" />
          <p className="text-[10px] text-sc-green font-black uppercase tracking-[0.2em]">Distribution Finalized & Logged</p>
        </div>
      )}
    </div>
  );
}

interface CommandControlsProps {
  onStartSpin: () => void;
  onTerminate: () => void;
  status: "ACTIVE" | "SPINNING" | "COMPLETED";
}

export function CommandControls({ onStartSpin, onTerminate, status }: CommandControlsProps) {
  return (
    <div className="sc-glass p-8 border-sc-blue/30 bg-black/40 h-full flex flex-col justify-between min-h-[300px]">
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-sc-blue uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Command Authorization
        </h3>
        <button 
          onClick={onStartSpin} 
          disabled={status !== "ACTIVE"} 
          className="w-full py-8 bg-sc-blue/20 border border-sc-blue/50 text-sc-blue text-md font-black uppercase tracking-[0.5em] shadow-[0_0_30px_rgba(0,209,255,0.1)] transition-all disabled:opacity-30"
        >
          Execute Sequence
        </button>
      </div>
      <button onClick={onTerminate} className="w-full py-3 bg-sc-red/10 border border-sc-red/30 text-sc-red text-[10px] uppercase font-black tracking-widest">
        Decommission Dispatch Node
      </button>
    </div>
  );
}
