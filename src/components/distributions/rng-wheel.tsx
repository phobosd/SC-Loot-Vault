"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  RotateCw, 
  User, 
  Package,
  Zap,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RNGWheelProps {
  participants: { id: string; name: string }[];
  itemToDistribute: { id: string; name: string } | null;
  onWin: (winnerId: string) => void;
}

export function RNGWheel({ participants, itemToDistribute, onWin }: RNGWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (isSpinning || participants.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);

    // Calculate a random winner
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const degreesPerSegment = 360 / participants.length;
    
    // Calculate final rotation: 
    // 5 full spins (1800deg) + rotation to the winner's segment
    // We aim for the middle of the segment
    const extraRotation = 360 - (winnerIndex * degreesPerSegment + degreesPerSegment / 2);
    const newRotation = rotation + 1800 + extraRotation;
    
    setRotation(newRotation);

    // Animation ends after 5s
    setTimeout(() => {
      setIsSpinning(false);
      const won = participants[winnerIndex];
      setWinner(won);
      onWin(won.id);
    }, 5000);
  };

  if (participants.length === 0) {
    return (
      <div className="sc-glass p-12 text-center border-dashed border-2 border-sc-blue/20">
        <User className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <p className="text-sm font-mono text-gray-500 uppercase">No active participants detected for drawing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-12 py-8">
      {/* The Wheel Visual */}
      <div className="relative w-80 h-80 md:w-96 md:h-96">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
          <div className="w-6 h-8 bg-sc-blue shadow-[0_0_15px_rgba(0,209,255,0.5)] clip-path-triangle" 
               style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }} />
        </div>

        {/* Wheel Container */}
        <div 
          ref={wheelRef}
          className="w-full h-full rounded-full border-4 border-sc-blue/30 shadow-[0_0_50px_rgba(0,209,255,0.1)] relative overflow-hidden transition-transform duration-[5s] cubic-bezier(0.15, 0, 0.15, 1)"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Slices */}
          {participants.map((p, i) => {
            const angle = 360 / participants.length;
            const rotate = i * angle;
            const skew = 90 - angle;
            
            return (
              <div 
                key={p.id}
                className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left border border-sc-blue/10 flex items-center justify-center overflow-hidden"
                style={{ 
                  transform: `rotate(${rotate}deg) skewY(-${skew}deg)`,
                  backgroundColor: i % 2 === 0 ? 'rgba(0, 209, 255, 0.05)' : 'rgba(10, 10, 20, 0.8)'
                }}
              >
                <div 
                  className="absolute bottom-4 left-4 text-[10px] font-bold text-sc-blue uppercase tracking-tighter whitespace-nowrap"
                  style={{ transform: `skewY(${skew}deg) rotate(45deg)` }}
                >
                  {p.name.substring(0, 12)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Cap */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#05050A] border-2 border-sc-blue flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,209,255,0.4)]">
          <Zap className={cn("w-5 h-5 text-sc-blue", isSpinning && "animate-pulse")} />
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-md space-y-6">
        <div className="sc-glass sc-hud-border p-6 rounded-lg border-sc-blue/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-sc-blue/60 font-mono uppercase tracking-widest">Active Manifest Item</p>
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Package className="w-4 h-4 text-sc-blue" />
                {itemToDistribute?.name || "No Item Selected"}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-sc-blue/60 font-mono uppercase tracking-widest">Participants</p>
              <p className="text-lg font-bold text-white font-mono">{participants.length}</p>
            </div>
          </div>

          {winner ? (
            <div className="bg-sc-gold/10 border border-sc-gold/30 p-4 rounded animate-in zoom-in-95 duration-500 text-center">
              <Trophy className="w-8 h-8 text-sc-gold mx-auto mb-2" />
              <p className="text-[10px] text-sc-gold uppercase font-mono tracking-widest mb-1">Winning Operator Identified</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{winner.name}</h2>
              <button 
                onClick={() => setWinner(null)}
                className="mt-4 text-[10px] font-bold text-sc-gold/60 hover:text-sc-gold transition-colors uppercase tracking-widest"
              >
                Reset for New Drawing
              </button>
            </div>
          ) : (
            <button 
              onClick={spin}
              disabled={isSpinning || !itemToDistribute}
              className="w-full group relative overflow-hidden flex items-center justify-center gap-3 py-4 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-sm font-black uppercase tracking-[0.3em] transition-all rounded disabled:opacity-30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {isSpinning ? <RotateCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-sc-blue" />}
              {isSpinning ? "SPINNING MANIFEST..." : "Initiate RNG Drawing"}
            </button>
          )}
        </div>

        {/* Participant List */}
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/5 rounded">
              <div className="w-2 h-2 rounded-full bg-sc-blue/40" />
              <span className="text-[10px] font-mono text-gray-400 truncate uppercase">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
