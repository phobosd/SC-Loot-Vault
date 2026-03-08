"use client";

import { useState, useEffect, useRef, use } from "react";
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
  ShieldCheck
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { claimLootSessionItem, startGlobalSpin, resetGlobalSession } from "@/app/actions/distribution";
import { useRouter } from "next/navigation";

export default function DispatchOpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Animation/Sync States
  const [localStatus, setLocalStatus] = useState<"ACTIVE" | "SPINNING" | "COMPLETED">("ACTIVE");
  const [reelItems, setReelItems] = useState<any[]>([]);
  const [winnerUser, setWinnerUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchSession = async () => {
    try {
      const [sessionRes, userRes] = await Promise.all([
        axios.get(`/api/loot-sessions/${id}`),
        axios.get("/api/auth/session")
      ]);
      
      const s = sessionRes.data;
      const u = userRes.data?.user;
      setSession(s);
      setUser(u);
      setIsAdmin(u?.role === 'ADMIN' || u?.role === 'SUPERADMIN');

      // If session is SPINNING and we are still ACTIVE, start the local animation
      if (s.status === "SPINNING" && localStatus === "ACTIVE") {
        handleTriggerAnimation(s);
      }

      // If session is ACTIVE and we were COMPLETED, reset
      if (s.status === "ACTIVE" && localStatus === "COMPLETED") {
        setLocalStatus("ACTIVE");
        setWinnerUser(null);
        setReelItems([]);
      }

    } catch (err) {
      console.error("Link Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for state changes every 2 seconds
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [id, localStatus]);

  const handleTriggerAnimation = (s: any) => {
    setLocalStatus("SPINNING");
    
    // 1. Build the reel
    const items = s.items;
    const animData = JSON.parse(s.animationState);
    const targetIdx = animData.targetIndex;
    
    const finalReel = [];
    for (let i = 0; i <= targetIdx + 5; i++) {
      finalReel.push(items[Math.floor(Math.random() * items.length)]);
    }
    
    // Find the winner's data
    const winner = s.participants.find((p: any) => p.userId === s.currentWinnerId)?.user;
    
    // Force the winning item at the target index (optional: or just let it be random)
    // For now, we just show who won at the end
    setReelItems(finalReel);

    // 2. Wait for animation to finish (match CSS transition)
    setTimeout(() => {
      setLocalStatus("COMPLETED");
      setWinnerUser(winner);
    }, 7000);
  };

  const handleAdminStart = async () => {
    if (localStatus !== "ACTIVE") return;
    const res = await startGlobalSpin(id);
    if (!res.success) alert(res.error);
  };

  const handleAdminReset = async () => {
    const res = await resetGlobalSession(id);
    if (!res.success) alert(res.error);
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-sc-blue animate-spin" /></div>;
  if (!session) return <div className="p-10 text-white uppercase font-mono text-center">Session Offline // Terminal Link Severed</div>;

  const targetIndex = session.animationState ? JSON.parse(session.animationState).targetIndex : 55;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12 bg-[#05050A] relative overflow-hidden">
      {/* Background HUD elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sc-blue rounded-full blur-[150px]" />
      </div>

      <div className="text-center space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-sc-blue/10 border border-sc-blue/30 rounded-full text-sc-blue text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          <Activity className={cn("w-3 h-3", localStatus === "SPINNING" ? "animate-ping" : "animate-pulse")} /> 
          {localStatus === "SPINNING" ? "DECRYPTION IN PROGRESS" : "Secure Dispatch Link Active"}
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-[0.2em]">{session.title}</h1>
        <p className="text-sm text-sc-blue/60 font-mono tracking-widest uppercase">
          {localStatus === "ACTIVE" ? "Awaiting Network Pulse to Synchronize Sequence" : "Synchronized Asset Decryption Initialized"}
        </p>
      </div>

      {/* The Synchronized Wheel */}
      <div className="relative w-full max-w-5xl h-48 group">
        <div className="absolute inset-0 sc-glass border-sc-blue/30 overflow-hidden shadow-[0_0_50px_rgba(0,209,255,0.1)]">
          {/* Centered Selector Arrow */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-sc-gold z-20 shadow-[0_0_15px_rgba(224,177,48,0.8)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 bg-sc-gold rotate-45" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-4 h-4 bg-sc-gold rotate-45" />
          </div>

          <div 
            className={cn(
              "flex items-center gap-4 py-4 px-[50%] transition-transform ease-out",
              localStatus === "SPINNING" ? "duration-[7000ms]" : "duration-500"
            )}
            style={{ 
              transform: localStatus === "SPINNING" 
                ? `translateX(calc(-${targetIndex * 160}px + 0px))` 
                : localStatus === "COMPLETED" ? `translateX(calc(-${targetIndex * 160}px + 0px))` : "translateX(0px)" 
            }}
          >
            {(reelItems.length > 0 ? reelItems : session.items).map((item: any, i: number) => (
              <div 
                key={i} 
                className="w-36 h-36 flex-shrink-0 sc-glass border-white/10 bg-black/40 p-4 flex flex-col items-center justify-center text-center group transition-all"
              >
                <div className="w-16 h-16 rounded bg-sc-blue/5 border border-sc-blue/20 flex items-center justify-center mb-3">
                  <Box className="w-8 h-8 text-sc-blue opacity-40" />
                </div>
                <p className="text-[9px] font-black text-white uppercase truncate w-full">{item.name}</p>
                <p className="text-[7px] text-sc-blue/40 font-mono uppercase mt-1">{item.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Left Col: Winner/Status */}
        <div className="space-y-6">
          {localStatus === "COMPLETED" && winnerUser ? (
            <div className="sc-glass p-8 border-sc-gold/50 bg-sc-gold/5 text-center animate-in zoom-in-95 duration-700">
              <Trophy className="w-12 h-12 text-sc-gold mx-auto mb-4 animate-bounce" />
              <p className="text-[10px] text-sc-gold uppercase font-mono tracking-[0.3em] mb-2">Assignment Confirmed</p>
              <h2 className="text-2xl font-black text-white uppercase mb-1">{winnerUser.name || winnerUser.username}</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase mb-6">Operator Node Verified</p>
              
              {isAdmin && (
                <button 
                  onClick={handleAdminReset}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" /> Initialize Next Sequence
                </button>
              )}
            </div>
          ) : (
            <div className="sc-glass p-8 border-sc-blue/20 text-center">
              <Users className="w-10 h-10 text-sc-blue/20 mx-auto mb-4" />
              <p className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mb-2">Active Participants</p>
              <div className="flex flex-wrap justify-center gap-2">
                {session.participants.map((p: any) => (
                  <div key={p.id} className="px-2 py-1 bg-sc-blue/5 border border-sc-blue/20 text-[8px] text-sc-blue uppercase font-bold rounded">
                    {p.user.name || p.user.username}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Admin Controls */}
        <div className="space-y-6">
          {isAdmin ? (
            <div className="sc-glass p-8 border-sc-blue/30 bg-black/40 space-y-6">
              <h3 className="text-xs font-bold text-sc-blue uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Command Authorization
              </h3>
              
              <button 
                onClick={handleAdminStart}
                disabled={localStatus !== "ACTIVE"}
                className="w-full py-6 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-sm font-black uppercase tracking-[0.4em] transition-all rounded disabled:opacity-30 shadow-[0_0_30px_rgba(0,209,255,0.1)] flex items-center justify-center gap-3"
              >
                <Play className="w-4 h-4 fill-sc-blue" />
                Trigger Global Spin
              </button>

              <p className="text-[8px] text-gray-600 font-mono leading-relaxed uppercase">
                Warning: Triggering the spin will synchronize all connected client HUDs to the same asset decryption sequence.
              </p>
            </div>
          ) : (
            <div className="sc-glass p-8 border-white/5 bg-black/20">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Operator Status</h3>
              <p className="text-[10px] text-gray-400 font-mono leading-relaxed uppercase">
                Awaiting Command Authorization... <br/>
                Keep your HUD active to receive synchronized asset telemetry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
