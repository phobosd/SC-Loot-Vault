"use client";

import { useState, useEffect, useRef, use } from "react";
import { 
  Loader2, 
  Zap, 
  Box, 
  ChevronRight, 
  Trophy,
  ShieldCheck,
  Activity
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { claimLootSessionItem } from "@/app/actions/distribution";
import { useRouter } from "next/navigation";

export default function DispatchOpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [reelItems, setReelItems] = useState<any[]>([]);
  const reelRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [sessionRes, userRes] = await Promise.all([
        axios.get(`/api/loot-sessions/${id}`),
        axios.get("/api/auth/session")
      ]);
      setSession(sessionRes.data);
      setUser(userRes.data?.user);
      
      const participant = sessionRes.data.participants.find((p: any) => p.userId === userRes.data?.user?.id);
      if (participant?.openedAt) {
        setWinner({ name: participant.wonItemName });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const startOpening = () => {
    if (spinning || winner) return;
    setSpinning(true);

    const items = session.items;
    if (!items || items.length === 0) return;

    const finalReel = [];
    for (let i = 0; i < 60; i++) {
      finalReel.push(items[Math.floor(Math.random() * items.length)]);
    }
    
    const winningIndex = 55;
    const wonItem = finalReel[winningIndex];
    setReelItems(finalReel);

    setTimeout(async () => {
      setSpinning(false);
      setWinner(wonItem);
      
      await claimLootSessionItem({
        sessionId: id,
        userId: user.id,
        wonItemName: wonItem.name,
        lootItemId: wonItem.itemId
      });
    }, 7000);
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-sc-blue animate-spin" /></div>;
  if (!session) return <div className="p-10 text-white uppercase font-mono">Session Offline // Terminal Link Severed</div>;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12 bg-[#05050A] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sc-blue rounded-full blur-[150px]" />
      </div>

      <div className="text-center space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-sc-blue/10 border border-sc-blue/30 rounded-full text-sc-blue text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          <Activity className="w-3 h-3 animate-pulse" /> Secure Dispatch Link Active
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-[0.2em]">{session.title}</h1>
        <p className="text-sm text-sc-blue/60 font-mono tracking-widest uppercase">Select 'Initialize' to begin asset decryption sequence</p>
      </div>

      <div className="relative w-full max-w-5xl h-48 group">
        <div className="absolute inset-0 sc-glass border-sc-blue/30 overflow-hidden shadow-[0_0_50px_rgba(0,209,255,0.1)]">
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-sc-gold z-20 shadow-[0_0_15px_rgba(224,177,48,0.8)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 bg-sc-gold rotate-45" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-4 h-4 bg-sc-gold rotate-45" />
          </div>

          <div 
            className={cn(
              "flex items-center gap-4 py-4 px-[50%] transition-transform ease-out",
              spinning ? "duration-[7000ms]" : "duration-500"
            )}
            style={{ 
              transform: spinning 
                ? `translateX(calc(-${55 * 160}px + 0px))` 
                : winner ? `translateX(calc(-${55 * 160}px + 0px))` : "translateX(0px)" 
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

      <div className="w-full max-w-md space-y-6 relative z-10">
        {winner ? (
          <div className="sc-glass p-8 border-sc-gold/50 bg-sc-gold/5 text-center animate-in zoom-in-95 duration-700">
            <Trophy className="w-12 h-12 text-sc-gold mx-auto mb-4 animate-bounce" />
            <p className="text-xs text-sc-gold uppercase font-mono tracking-widest mb-2">Asset Successfully Assigned</p>
            <h2 className="text-3xl font-black text-white uppercase mb-6 tracking-tight">{winner.name}</h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push("/assigned")}
                className="w-full py-4 bg-sc-gold/20 hover:bg-sc-gold/30 border border-sc-gold/50 text-sc-gold text-xs font-black uppercase tracking-widest transition-all rounded shadow-[0_0_20px_rgba(224,177,48,0.2)]"
              >
                View Assigned Assets
              </button>
              <button 
                onClick={() => router.push("/dashboard")}
                className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-mono"
              >
                Return to Command Link
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={startOpening}
            disabled={spinning}
            className="w-full relative group overflow-hidden py-6 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-lg font-black uppercase tracking-[0.4em] transition-all rounded disabled:opacity-30 shadow-[0_0_30px_rgba(0,209,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {spinning ? (
              <div className="flex items-center justify-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin" />
                Deciphering Data...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Zap className="w-6 h-6 fill-sc-blue" />
                Initialize Sequence
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
