"use client";

import { useState, useMemo } from "react";
import { 
  RotateCw, 
  Zap,
  Play,
  User,
  Package,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RNGWheelProps {
  participants: { id: string; name: string }[];
  itemToDistribute: { id: string; name: string } | null;
  onWin: (winnerId: string) => void;
  mode?: "OPERATORS" | "ITEMS";
}

export function RNGWheel({ participants, itemToDistribute, onWin, mode = "OPERATORS" }: RNGWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null);
  
  const accentColor = mode === "OPERATORS" ? "var(--sc-blue)" : "var(--sc-gold)";
  const glowColor = mode === "OPERATORS" ? "rgba(var(--sc-blue-rgb), 0.3)" : "rgba(var(--sc-gold-rgb), 0.3)";
  const pointerColor = mode === "OPERATORS" ? "bg-sc-gold" : "bg-sc-blue";

  const segments = useMemo(() => {
    return participants.map((p, i) => {
      const angle = 360 / participants.length;
      const startAngle = i * angle;
      const endAngle = (i + 1) * angle;
      
      const radius = 100;
      const x1 = 100 + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = 100 + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = 100 + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = 100 + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      return { pathData, ...p, midAngle: startAngle + angle / 2 };
    });
  }, [participants]);

  const spin = () => {
    if (isSpinning || participants.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);

    const winnerIndex = Math.floor(Math.random() * participants.length);
    const degreesPerSegment = 360 / participants.length;
    
    const extraRotation = 360 - (winnerIndex * degreesPerSegment + degreesPerSegment / 2);
    const newRotation = rotation + 2880 + extraRotation; 
    
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const won = participants[winnerIndex];
      setWinner(won);
      onWin(won.id);
    }, 6000);
  };

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-sc-blue/20 rounded-lg">
        <User className="w-12 h-12 text-gray-700 mb-4" />
        <p className="text-sm font-mono text-gray-500 uppercase">Awaiting Sequence Parameters...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-12 w-full">
      {/* The Wheel Visual */}
      <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px]">
        {/* Outer Glow Ring */}
        <div className={cn(
          "absolute inset-[-20px] border rounded-full animate-pulse opacity-20",
          mode === "OPERATORS" ? "border-sc-blue" : "border-sc-gold"
        )} />
        
        {/* UEE TARGETING RETICLE (The Pointer) */}
        <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-30 w-24 h-24 flex flex-col items-center pointer-events-none">
          {/* Animated Scanning Brackets */}
          <div className="absolute inset-0 border-x border-t border-sc-blue/20 rounded-t-xl animate-pulse" 
               style={{ borderColor: mode === "OPERATORS" ? 'rgba(0, 209, 255, 0.2)' : 'rgba(224, 177, 48, 0.2)' }} />
          
          {/* Glowing Arrow */}
          <div className="relative z-10 filter drop-shadow-[0_0_12px_rgba(0,209,255,0.9)] animate-bounce duration-[2000ms]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 24L2 12H7V0H17V12H22L12 24Z" className={cn(mode === "OPERATORS" ? "fill-sc-blue" : "fill-sc-gold")} />
              {/* Internal Detail Line */}
              <path d="M12 20L6 14H18L12 20Z" fill="black" fillOpacity="0.3" />
            </svg>
          </div>
          
          {/* Graphical Scanner Markers */}
          <div className="flex gap-1 mt-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn(
                "w-1 h-3 rounded-full opacity-40",
                mode === "OPERATORS" ? "bg-sc-blue" : "bg-sc-gold",
                isSpinning && "animate-pulse"
              )} style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>

          {/* Crosshair Graphic */}
          <div className="absolute top-12 flex items-center justify-center w-full">
            <div className={cn("w-full h-[1px] opacity-20", mode === "OPERATORS" ? "bg-sc-blue" : "bg-sc-gold")} />
            <div className={cn(
              "absolute w-2 h-2 rotate-45 border border-sc-blue shadow-[0_0_10px_rgba(0,209,255,0.5)]",
              mode === "OPERATORS" ? "border-sc-blue" : "border-sc-gold"
            )} />
          </div>
        </div>

        {/* SVG Wheel */}
        <div 
          className="w-full h-full rounded-full transition-transform cubic-bezier(0.1, 0, 0.1, 1)"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '6000ms' : '500ms'
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            {segments.map((s, i) => (
              <g key={s.id} className="group">
                <path 
                  d={s.pathData} 
                  fill={i % 2 === 0 ? "rgba(10, 10, 20, 0.95)" : "rgba(15, 15, 30, 0.9)"}
                  stroke={mode === "OPERATORS" ? "rgba(0, 209, 255, 0.2)" : "rgba(224, 177, 48, 0.2)"}
                  strokeWidth="0.5"
                  className={cn(
                    "transition-colors",
                    mode === "OPERATORS" ? "hover:fill-sc-blue/10" : "hover:fill-sc-gold/10"
                  )}
                />
                <text
                  x="100"
                  y="30"
                  transform={`rotate(${s.midAngle}, 100, 100)`}
                  fill={accentColor}
                  fontSize="5"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="uppercase font-mono tracking-tighter"
                  style={{ textShadow: `0 0 2px ${glowColor}` }}
                >
                  {s.name.length > 15 ? s.name.substring(0, 13) + '...' : s.name}
                </text>
              </g>
            ))}
            {/* Inner Ring Decor */}
            <circle cx="100" cy="100" r="10" fill="#05050A" stroke={mode === "OPERATORS" ? "rgba(0, 209, 255, 0.5)" : "rgba(224, 177, 48, 0.5)"} strokeWidth="1" />
          </svg>
        </div>

        {/* Center UI */}
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full sc-glass border-2 flex items-center justify-center z-20 bg-black/80",
          mode === "OPERATORS" ? "border-sc-blue shadow-[0_0_30px_rgba(0,209,255,0.3)]" : "border-sc-gold shadow-[0_0_30px_rgba(224,177,48,0.3)]"
        )}>
          {mode === "OPERATORS" ? (
            <Zap className={cn("w-8 h-8 text-sc-blue", isSpinning && "animate-pulse")} />
          ) : (
            <Package className={cn("w-8 h-8 text-sc-gold", isSpinning && "animate-pulse")} />
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-md">
        <div className={cn(
          "sc-glass sc-hud-border p-6 rounded-lg bg-black/60 shadow-2xl",
          mode === "OPERATORS" ? "border-sc-blue/20" : "border-sc-gold/20"
        )}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className={cn("text-[10px] font-mono uppercase tracking-widest mb-1", mode === "OPERATORS" ? "text-sc-blue/60" : "text-sc-gold/60")}>
                {mode === "OPERATORS" ? "Active Manifest Status" : "Active Selection Sequence"}
              </p>
              <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 tracking-widest">
                {mode === "OPERATORS" ? <Package className="w-4 h-4 text-sc-blue" /> : <Users className="w-4 h-4 text-sc-gold" />}
                {itemToDistribute?.name || "AWAITING CONFIGURATION"}
              </h3>
            </div>
            <div className="text-right">
              <p className={cn("text-[10px] font-mono uppercase tracking-widest mb-1", mode === "OPERATORS" ? "text-sc-blue/60" : "text-sc-gold/60")}>
                {mode === "OPERATORS" ? "Eligible Ops" : "Wheel Slices"}
              </p>
              <p className="text-xl font-black text-white font-mono">{participants.length}</p>
            </div>
          </div>

          <button 
            onClick={spin}
            disabled={isSpinning || !itemToDistribute || participants.length === 0}
            className={cn(
              "w-full group relative overflow-hidden flex items-center justify-center gap-4 py-5 border text-sm font-black uppercase tracking-[0.4em] transition-all rounded disabled:opacity-30 disabled:cursor-not-allowed",
              mode === "OPERATORS" 
                ? "bg-sc-blue/20 hover:bg-sc-blue/30 border-sc-blue/50 text-sc-blue" 
                : "bg-sc-gold/20 hover:bg-sc-gold/30 border-sc-gold/50 text-sc-gold"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isSpinning ? (
              <><RotateCw className="w-5 h-5 animate-spin" /> CALCULATING ENTROPY...</>
            ) : participants.length === 0 ? (
              <>{mode === "OPERATORS" ? "NO ELIGIBLE OPS" : "NO ASSETS SELECTED"}</>
            ) : !itemToDistribute ? (
              <>{mode === "OPERATORS" ? "SELECT ASSETS" : "SELECT RECIPIENT"}</>
            ) : (
              <><Play className={cn("w-5 h-5", mode === "OPERATORS" ? "fill-sc-blue" : "fill-sc-gold")} /> INITIALIZE SEQUENCE</>
            )}
          </button>
          
          <p className="text-[8px] text-center text-gray-600 font-mono uppercase mt-4 tracking-widest">
            UEE-RNG Protocol // Hardware Entropy Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
