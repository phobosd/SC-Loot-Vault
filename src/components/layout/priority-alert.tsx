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
  const [activeSession, setActiveSession] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const checkSessions = async () => {
      try {
        const res = await axios.get("/api/my-loot-sessions");
        if (res.data && res.data.length > 0) {
          // Find first session they haven't opened yet
          const pending = res.data.find((s: any) => !s.participants[0].openedAt);
          if (pending) setActiveSession(pending);
        }
      } catch (err) {}
    };

    checkSessions();
    // Refresh every minute
    const interval = setInterval(checkSessions, 60000);
    return () => clearInterval(interval);
  }, [session]);

  if (!activeSession || dismissed) return null;

  return (
    <div className="mx-4 mb-6 animate-in slide-in-from-left-4 duration-500">
      <div className="sc-glass border-sc-blue/50 bg-sc-blue/10 p-4 rounded-lg shadow-[0_0_20px_rgba(0,209,255,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-1">
          <button onClick={() => setDismissed(true)} className="text-sc-blue/40 hover:text-sc-blue">
            <X className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded bg-sc-blue/20 flex items-center justify-center border border-sc-blue/40 animate-pulse">
            <Zap className="w-4 h-4 text-sc-blue" />
          </div>
          <div>
            <p className="text-[10px] font-black text-sc-blue uppercase tracking-[0.2em]">Priority Dispatch</p>
            <p className="text-[8px] text-sc-blue/60 font-mono uppercase tracking-widest">Unclaimed Asset Manifest</p>
          </div>
        </div>

        <h4 className="text-xs font-bold text-white uppercase mb-3 truncate">{activeSession.title}</h4>

        <Link 
          href={`/dispatch/${activeSession.id}`}
          className="w-full py-2 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-[9px] font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
        >
          Initialize Opening
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
