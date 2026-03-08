"use client";

import { useState, useEffect } from "react";
import { 
  AlertCircle, 
  ChevronRight, 
  Box, 
  Zap,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";

export function PriorityAlert() {
  const { data: session }: any = useSession();
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    const checkSessions = async () => {
      try {
        const res = await axios.get("/api/my-loot-sessions");
        if (res.data && res.data.length > 0) {
          setActiveSessions(res.data);
        } else {
          setActiveSessions([]);
        }
      } catch (err) {
        console.error("Alert sync failure");
      }
    };

    checkSessions();
    
    let intervalId: NodeJS.Timeout;
    const startPolling = (ms: number) => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(checkSessions, ms);
    };

    // Initial state: 3s frequency
    startPolling(3000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Slow down to 15s when inactive
        startPolling(15000);
      } else {
        // Resume 3s when active
        checkSessions();
        startPolling(3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session]);

  if (activeSessions.length === 0) return null;

  return (
    <div className="mx-4 mb-6 space-y-3 animate-in slide-in-from-left-4 duration-500">
      {activeSessions.map((s) => (
        <div key={s.id} className="sc-glass border-sc-gold/50 bg-sc-gold/10 p-4 rounded-lg shadow-[0_0_20px_rgba(224,177,48,0.1)] relative overflow-hidden group border-l-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded bg-sc-gold/20 flex items-center justify-center border border-sc-gold/40 animate-pulse">
              <Zap className="w-4 h-4 text-sc-gold" />
            </div>
            <div>
              <p className="text-[10px] font-black text-sc-gold uppercase tracking-[0.2em]">Live Dispatch</p>
              <p className="text-[8px] text-sc-gold/60 font-mono uppercase tracking-widest">Network Pulse Synchronized</p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-white uppercase mb-3 truncate">{s.title}</h4>

          <Link 
            href={`/dispatch/${s.id}`}
            className="w-full py-2 bg-sc-gold/20 hover:bg-sc-gold/30 border border-sc-gold/50 text-sc-gold text-[9px] font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
          >
            Enter Synchronized Lobby
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      ))}
    </div>
  );
}
