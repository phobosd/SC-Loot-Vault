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
import { cn, seededRandom } from "@/lib/utils";
import { 
  startGlobalSpin, 
  resetGlobalSession, 
  archiveGlobalSession,
  finalizeGlobalSession
} from "@/app/actions/distribution";
import { useRouter } from "next/navigation";
import { MasterRNGWheel } from "@/components/distributions/master-rng-wheel";
import { SessionManifest, WinnerHUD, CommandControls } from "@/components/distributions/session-ui";
import { LootSession, User as NexusUser, LootSessionItem, LootSessionParticipant } from "@/lib/types";

export default function DispatchOpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LootSession | null>(null);
  const [user, setUser] = useState<NexusUser | null>(null);
  
  const [localStatus, setLocalStatus] = useState<"ACTIVE" | "SPINNING" | "COMPLETED">("ACTIVE");
  const [reelItems, setReelItems] = useState<any[]>([]);
  const [winnerUser, setWinnerUser] = useState<NexusUser | null>(null);
  const [winningItem, setWinningItem] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await axios.get(`/api/loot-sessions/${id}`);
      const userRes = await axios.get("/api/auth/session");
      const s = res.data as LootSession;
      const u = userRes.data?.user as NexusUser;
      
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
        const participant = s.participants?.find((p: any) => p.userId === s.currentWinnerId);
        if (participant?.user) setWinnerUser(participant.user as NexusUser);
        
        if (s.animationState) {
          const anim = JSON.parse(s.animationState);
          setWinningItem(anim.winningItemName);
        }

        setLocalStatus("COMPLETED");
        
        if (s.type === "WHEEL" && rotation === 0 && s.currentWinnerId) {
          const pool = s.mode === "OPERATORS" ? s.participants : s.items;
          const winnerIndex = s.mode === "OPERATORS" 
            ? s.participants?.findIndex((p: any) => p.userId === s.currentWinnerId)
            : s.items?.findIndex((i: any) => i.name === winningItem);

          if (winnerIndex !== -1 && winnerIndex !== undefined && pool) {
            const sliceSize = 360 / pool.length;
            setRotation((5 * 360) + (360 - (winnerIndex * sliceSize)) - (sliceSize / 2));
          }
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSession();
    
    // SSE Listener for real-time achievement synchronization
    const eventSource = new EventSource(`/api/events/${id}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE DEBUG] Event Received:", data);
        // Force a session fetch on any relevant update
        fetchSession();
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error:", err);
      eventSource.close();
    };

    let intervalId: NodeJS.Timeout;
    const startPolling = (ms: number) => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(fetchSession, ms);
    };

    // Initial state: high frequency
    startPolling(2000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Slow down polling to 10s when tab is inactive
        startPolling(10000);
      } else {
        // Resume 2s polling when tab is active
        fetchSession();
        startPolling(2000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(intervalId);
      eventSource.close();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id, localStatus]);

  const handleTriggerAnimation = (s: LootSession) => {
    setLocalStatus("SPINNING");
    const animData = JSON.parse(s.animationState!);
    setWinningItem(animData.winningItemName);
    
    setTimeout(() => {
      if (s.type === "REEL") {
        const targetIdx = animData.targetIndex;
        let seed = parseInt(id.replace(/\D/g, '').slice(0, 8)) + new Date(animData.startTime).getTime();
        const finalReel = [];
        const pool = s.mode === "OPERATORS" ? s.participants : s.items;
        
        // Find the actual winner profile/item to inject at targetIdx
        const winner = s.mode === "OPERATORS"
          ? s.participants?.find((p: any) => p.userId === s.currentWinnerId)
          : s.items?.find((i: any) => i.name === animData.winningItemName);

        for (let i = 0; i <= targetIdx + 10; i++) {
          const rand = seededRandom(seed++);
          let rawItem;
          
          if (i === targetIdx && winner) {
            rawItem = winner;
          } else if (pool) {
            rawItem = pool[Math.floor(rand * pool.length)];
          }

          if (rawItem) {
            let label = "UNKNOWN";
            if (s.mode === "OPERATORS") {
              const participant = rawItem as LootSessionParticipant;
              label = participant.user?.name || participant.user?.username || "OPERATOR";
            } else {
              const item = rawItem as LootSessionItem;
              label = item.name;
            }
            finalReel.push({ ...rawItem, label });
          }
        }
        setReelItems(finalReel);
      } else {
        const pool = s.mode === "OPERATORS" ? s.participants : s.items;
        const winnerIndex = s.mode === "OPERATORS"
          ? s.participants?.findIndex((p: any) => p.userId === s.currentWinnerId)
          : s.items?.findIndex((i: any) => i.name === animData.winningItemName);

        if (winnerIndex !== -1 && winnerIndex !== undefined && pool) {
          const sliceSize = 360 / pool.length;
          const targetRotation = (5 * 360) + (360 - (winnerIndex * sliceSize)) - (sliceSize / 2);
          setRotation(targetRotation);
        }
      }
    }, 50);

    setTimeout(() => {
      const participant = s.participants?.find((p: any) => p.userId === s.currentWinnerId);
      if (participant?.user) setWinnerUser(participant.user as NexusUser);
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
            {(reelItems.length > 0 ? reelItems : (session.mode === "OPERATORS" ? (session.participants || []) : (session.items || []))).map((item: any, i: number) => (
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
        <MasterRNGWheel participants={session.participants || []} items={session.items || []} rotation={rotation} isSpinning={localStatus === "SPINNING"} mode={session.mode as "OPERATORS" | "ITEMS"} />
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-6">
          {localStatus === "COMPLETED" && winnerUser ? (
            <WinnerHUD 
              winnerUser={winnerUser}
              sessionMode={session.mode as "OPERATORS" | "ITEMS"}
              itemCount={session.items?.length || 0}
              winningItemName={winningItem}
              isAdmin={isAdmin}
              sessionStatus={session.status}
              isProcessing={isProcessing}
              onReset={() => resetGlobalSession(id)}
              onFinalize={handleFinalize}
            />
          ) : (
            <SessionManifest items={session.items || []} />
          )}
        </div>

        <div className="space-y-6">
          {isAdmin ? (
            <CommandControls 
              onStartSpin={() => startGlobalSpin(id)}
              onTerminate={handleTerminate}
              status={localStatus}
            />
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
