"use client";

import { useMemo } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { LootSessionParticipant, LootSessionItem } from "@/lib/types";

interface MasterRNGWheelProps {
  participants: LootSessionParticipant[];
  items: LootSessionItem[];
  rotation: number;
  isSpinning: boolean;
  mode: "OPERATORS" | "ITEMS";
}

export function MasterRNGWheel({ participants, items, rotation, isSpinning, mode }: MasterRNGWheelProps) {
  const segments = useMemo(() => {
    const pool = mode === "OPERATORS" ? participants : items;
    if (!pool || pool.length === 0) return [];

    return pool.map((p: any, i: number) => {
      const angle = 360 / pool.length;
      const startAngle = i * angle;
      const endAngle = (i + 1) * angle;
      const radius = 100;
      const x1 = 100 + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = 100 + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = 100 + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = 100 + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);
      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      const label = mode === "OPERATORS" 
        ? (p.user?.name || p.user?.username || "OPERATOR")
        : p.name;

      return { pathData, label, midAngle: startAngle + angle / 2 };
    });
  }, [participants, items, mode]);

  return (
    <div className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px] flex-shrink-0 transition-all duration-700">
      <div className="absolute inset-[-40px] border border-sc-blue/10 rounded-full animate-pulse" />
      <div className="absolute inset-[-20px] border border-sc-blue/20 rounded-full" />
      
      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 z-30 w-24 h-24 flex flex-col items-center pointer-events-none">
        <div className="filter drop-shadow-[0_0_15px_rgba(0,209,255,0.9)] animate-bounce duration-[2000ms]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 24L2 12H7V0H17V12H22L12 24Z" className="fill-sc-blue" />
            <path d="M12 20L6 14H18L12 20Z" fill="black" fillOpacity="0.4" />
          </svg>
        </div>
      </div>

      <div 
        className="w-full h-full rounded-full overflow-hidden border-4 border-sc-blue/30 bg-black/40 shadow-[0_0_100px_rgba(0,209,255,0.1)]"
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transitionProperty: 'transform',
          transitionDuration: isSpinning ? '7000ms' : '500ms',
          transitionTimingFunction: isSpinning ? 'cubic-bezier(0.15, 0, 0.15, 1)' : 'ease-out'
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {segments.map((s: any, i: number) => (
            <g key={i}>
              <path 
                d={s.pathData} 
                fill={i % 2 === 0 ? "rgba(10, 10, 20, 0.98)" : "rgba(15, 15, 30, 0.95)"}
                stroke="rgba(0, 209, 255, 0.2)"
                strokeWidth="0.4"
              />
              <text
                x="100" y="25" transform={`rotate(${s.midAngle}, 100, 100)`}
                fill="var(--sc-blue)" fontSize="6" fontWeight="900" textAnchor="middle" className="uppercase font-mono tracking-tighter"
                style={{ textShadow: '0 0 3px rgba(0,209,255,0.5)' }}
              >
                {s.label.length > 18 ? s.label.substring(0, 16) + '...' : s.label}
              </text>
            </g>
          ))}
          <circle cx="100" cy="100" r="15" fill="#05050A" stroke="rgba(0, 209, 255, 0.5)" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full sc-glass border-2 border-sc-blue flex items-center justify-center z-20 bg-black shadow-[0_0_40px_rgba(0,209,255,0.2)]">
        <div className="text-center">
          <Zap className={cn("w-8 h-8 text-sc-blue mx-auto mb-1", isSpinning && "animate-ping")} />
          <p className="text-[6px] font-black text-sc-blue uppercase tracking-[0.2em]">{mode}</p>
        </div>
      </div>
    </div>
  );
}
