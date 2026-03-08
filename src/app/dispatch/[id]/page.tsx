"use client";

import { useState, useEffect, useMemo, use } from "react";
import { 
  Loader2, 
  Zap, 
  Box, 
  ChevronRight, 
  Trophy,
  Activity,
  Users,
  Building2,
  RefreshCw,
  Play,
  ShieldCheck,
  Package,
  RotateCw,
  Target,
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { 
  startGlobalSpin, 
  resetGlobalSession, 
  archiveGlobalSession,
  finalizeGlobalSession
} from "@/app/actions/distribution";
import { useRouter } from "next/navigation";

// --- SEEDED RANDOM PROTOCOL ---
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// --- MASTER RNG WHEEL COMPONENT (REPLICATED ACROSS ALL CLIENTS) ---
function MasterRNGWheel({ participants, items, rotation, isSpinning, mode }: any) {
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

export default function DispatchOpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  const [localStatus, setLocalStatus] = useState<"ACTIVE" | "SPINNING" | "COMPLETED">("ACTIVE");
  const [reelItems, setReelItems] = useState<any[]>([]);
  const [winnerUser, setWinnerUser] = useState<any>(null);
  const [winningItem, setWinningItem] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await axios.get(`/api/loot-sessions/${id}`);
      const userRes = await axios.get("/api/auth/session");
      const s = res.data;
      const u = userRes.data?.user;
      
      setSession(s);
      setUser(u);
      setIsAdmin(u?.role === 'ADMIN' || u?.role === 'SUPERADMIN');

      if (s.status === "ARCHIVED") {
        router.push("/distributions");
        return;
      }

      if (s.status === "SPINNING" && localStatus === "ACTIVE" && s.animationState) {
        handleTriggerAnimation(s);
      } else if (s.status === "ACTIVE" && localStatus === "COMPLETED") {
        setLocalStatus("ACTIVE");
        setWinnerUser(null);
        setWinningItem(null);
        setReelItems([]);
        setRotation(0);
      } else if (s.status === "COMPLETED" || (s.status === "SPINNING" && localStatus === "COMPLETED")) {
        const participant = s.participants.find((p: any) => p.userId === s.currentWinnerId);
        if (participant?.user) setWinnerUser(participant.user);
        
        if (s.animationState) {
          const anim = JSON.parse(s.animationState);
          setWinningItem(anim.winningItemName);
        }

        setLocalStatus("COMPLETED");
        
        if (s.type === "WHEEL" && rotation === 0 && s.currentWinnerId) {
          const pool = s.mode === "OPERATORS" ? s.participants : s.items;
          const winnerIndex = s.mode === "OPERATORS" 
            ? s.participants.findIndex((p: any) => p.userId === s.currentWinnerId)
            : s.items.findIndex((i: any) => i.name === winningItem);

          if (winnerIndex !== -1) {
            const sliceSize = 360 / pool.length;
            setRotation((5 * 360) + (360 - (winnerIndex * sliceSize)) - (sliceSize / 2));
          }
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [id, localStatus]);

  const handleTriggerAnimation = (s: any) => {
    setLocalStatus("SPINNING");
    const animData = JSON.parse(s.animationState);
    setWinningItem(animData.winningItemName);
    
    setTimeout(() => {
      if (s.type === "REEL") {
        const targetIdx = animData.targetIndex;
        let seed = parseInt(id.replace(/\D/g, '').slice(0, 8)) + new Date(animData.startTime).getTime();
        const finalReel = [];
        const pool = s.mode === "OPERATORS" ? s.participants : s.items;
        
        // Find the actual winner profile/item to inject at targetIdx
        const winner = s.mode === "OPERATORS"
          ? s.participants.find((p: any) => p.userId === s.currentWinnerId)
          : s.items.find((i: any) => i.name === animData.winningItemName);

        for (let i = 0; i <= targetIdx + 10; i++) {
          const rand = seededRandom(seed++);
          let rawItem;
          
          if (i === targetIdx && winner) {
            rawItem = winner;
          } else {
            rawItem = pool[Math.floor(rand * pool.length)];
          }

          const label = s.mode === "OPERATORS" 
            ? (rawItem.user?.name || rawItem.user?.username || "OPERATOR")
            : rawItem.name;
          finalReel.push({ ...rawItem, label });
        }
        setReelItems(finalReel);
      } else {
        const pool = s.mode === "OPERATORS" ? s.participants : s.items;
        const winnerIndex = s.mode === "OPERATORS"
          ? s.participants.findIndex((p: any) => p.userId === s.currentWinnerId)
          : s.items.findIndex((i: any) => i.name === animData.winningItemName);

        if (winnerIndex !== -1) {
          const sliceSize = 360 / pool.length;
          const targetRotation = (5 * 360) + (360 - (winnerIndex * sliceSize)) - (sliceSize / 2);
          setRotation(targetRotation);
        }
      }
    }, 50);

    setTimeout(() => {
      const participant = s.participants.find((p: any) => p.userId === s.currentWinnerId);
      if (participant?.user) setWinnerUser(participant.user);
      setLocalStatus("COMPLETED");
    }, 7050);
  };

  const handleFinalize = async () => {
    if (!confirm("Finalize distribution? Items will be assigned to winner.")) return;
    setIsProcessing(true);
    const res = await finalizeGlobalSession(id);
    if (!res.success) alert(res.error);
    setIsProcessing(false);
  };

  const handleTerminate = async () => {
    if (!confirm("Terminate session and boot all participants?")) return;
    const res = await archiveGlobalSession(id);
    if (res.success) router.push("/distributions");
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-sc-blue animate-spin" /></div>;
  if (!session) return <div className="p-10 text-white uppercase font-mono text-center">Session Offline</div>;

  const currentAnimData = session.animationState ? JSON.parse(session.animationState) : { targetIndex: 55 };

  return (
    <div key={session.id} className="min-h-full flex flex-col items-center justify-center p-8 space-y-12 bg-[#05050A] relative overflow-hidden">
      <div className="text-center space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-sc-blue/10 border border-sc-blue/30 rounded-full text-sc-blue text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          <Activity className={cn("w-3 h-3", localStatus === "SPINNING" ? "animate-ping" : "animate-pulse")} /> 
          {localStatus === "SPINNING" ? "DECRYPTION ACTIVE" : "Transmission Synchronized"}
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-[0.2em]">{session.title}</h1>
        <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">
          Logic: {session.mode === "OPERATORS" ? "Winner takes ALL assets" : "Winner takes 1 random asset"}
        </p>
      </div>

      {session.type === "REEL" ? (
        <div className="relative w-full max-w-5xl h-48 sc-glass border-sc-blue/30 overflow-hidden shadow-[0_0_50px_rgba(0,209,255,0.1)]">
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-sc-gold z-20 shadow-[0_0_15px_rgba(224,177,48,0.8)]" />
          <div 
            className="flex items-center gap-4 py-4 px-[50%]"
            style={{ 
              transform: (localStatus === "SPINNING" || localStatus === "COMPLETED") ? `translateX(calc(-${currentAnimData.targetIndex * 160}px - 72px))` : "translateX(0px)",
              transitionProperty: 'transform',
              transitionDuration: localStatus === "SPINNING" ? '7000ms' : '500ms',
              transitionTimingFunction: localStatus === "SPINNING" ? 'cubic-bezier(0.15, 0, 0.15, 1)' : 'ease-out'
            }}
          >
            {(reelItems.length > 0 ? reelItems : (session.mode === "OPERATORS" ? session.participants : session.items)).map((item: any, i: number) => (
              <div key={i} className="w-36 h-36 flex-shrink-0 sc-glass border-white/10 bg-black/40 p-4 flex flex-col items-center justify-center text-center transition-all group">
                <div className="w-16 h-16 rounded bg-sc-blue/5 border border-sc-blue/20 flex items-center justify-center mb-3 group-hover:border-sc-blue/50">
                  {session.mode === "OPERATORS" ? <Users className="w-8 h-8 text-sc-blue/40" /> : <Box className="w-8 h-8 text-sc-blue/40" />}
                </div>
                <p className="text-[9px] font-black text-white uppercase truncate w-full">{item.label || item.name || item.user?.name || item.user?.username}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <MasterRNGWheel participants={session.participants} items={session.items} rotation={rotation} isSpinning={localStatus === "SPINNING"} mode={session.mode} />
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-6">
          {localStatus === "COMPLETED" && winnerUser ? (
            <div className="sc-glass p-8 border-sc-gold/50 bg-sc-gold/5 text-center animate-in zoom-in-95 duration-700 h-full flex flex-col justify-center min-h-[300px]">
              <Trophy className="w-12 h-12 text-sc-gold mx-auto mb-4 animate-bounce" />
              <p className="text-[10px] text-sc-gold uppercase font-mono tracking-[0.3em] mb-2">Sequence Result Detected</p>
              <h2 className="text-3xl font-black text-white uppercase mb-1 tracking-tighter">{winnerUser.name || winnerUser.username}</h2>
              <p className="text-xs text-sc-gold font-bold uppercase mb-6 tracking-widest">
                WINS: {session.mode === "OPERATORS" ? `${session.items.length} Asset Manifest` : winningItem}
              </p>
              
              {isAdmin && session.status !== "COMPLETED" && (
                <div className="flex gap-4 mt-4">
                  <button onClick={() => resetGlobalSession(id)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded">Re-Spin</button>
                  <button onClick={handleFinalize} disabled={isProcessing} className="flex-1 py-4 bg-sc-green/20 border border-sc-green/50 text-sc-green text-xs font-black uppercase tracking-widest rounded">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalize & Distribute"}
                  </button>
                </div>
              )}
              {session.status === "COMPLETED" && (
                <div className="mt-4 p-4 border border-sc-green/30 bg-sc-green/5 rounded flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sc-green" />
                  <p className="text-[10px] text-sc-green font-black uppercase tracking-[0.2em]">Distribution Finalized & Logged</p>
                </div>
              )}
            </div>
          ) : (
            <div className="sc-glass p-8 border-sc-blue/20 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-sc-blue uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-4 h-4" /> Sequence Manifest
                </h3>
                <span className="text-[10px] font-mono text-gray-600 uppercase">{session.items.length} Assets at stake</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[200px] pr-2">
                {session.items.map((i: any) => (
                  <div key={i.id} className="p-3 bg-black/40 border border-white/5 rounded flex items-center justify-between">
                    <p className="text-[10px] font-bold text-white uppercase truncate pr-4">{i.name}</p>
                    <span className="text-[8px] font-mono text-sc-blue/40 uppercase">{i.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {isAdmin ? (
            <div className="sc-glass p-8 border-sc-blue/30 bg-black/40 h-full flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-sc-blue uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Command Authorization
                </h3>
                <button onClick={() => startGlobalSpin(id)} disabled={localStatus !== "ACTIVE"} className="w-full py-8 bg-sc-blue/20 border border-sc-blue/50 text-sc-blue text-md font-black uppercase tracking-[0.5em] shadow-[0_0_30px_rgba(0,209,255,0.1)] transition-all disabled:opacity-30">
                  Execute Sequence
                </button>
              </div>
              <button onClick={handleTerminate} className="w-full py-3 bg-sc-red/10 border border-sc-red/30 text-sc-red text-[10px] uppercase font-black tracking-widest">
                Decommission Dispatch Node
              </button>
            </div>
          ) : (
            <div className="sc-glass p-8 border-white/5 bg-black/20 h-full flex flex-col justify-center text-center min-h-[300px]">
              <Zap className="w-12 h-12 text-sc-gold mx-auto mb-6 opacity-20" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Operator HUD Active</h3>
              <p className="text-[10px] text-gray-600 font-mono uppercase leading-relaxed">Transmission pulses synchronized.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
