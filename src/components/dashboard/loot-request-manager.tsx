"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Box, 
  Loader2,
  ChevronRight,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { approveLootRequest, rejectLootRequest } from "@/app/actions/loot";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface LootRequestManagerProps {
  requests: any[];
}

export function LootRequestManager({ requests }: LootRequestManagerProps) {
  const { data: session }: any = useSession();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleApprove = async (requestId: string) => {
    if (!session?.user) return;
    setLoadingId(requestId);
    try {
      const res = await approveLootRequest(requestId, session.user.id);
      if (!res.success) alert(res.error);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    if (!reason) {
      alert("Please provide a reason for denial.");
      return;
    }
    setLoadingId(requestId);
    try {
      const res = await rejectLootRequest(requestId, reason);
      if (res.success) {
        setDenyingId(null);
        setReason("");
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="sc-glass sc-hud-border p-6 rounded-lg border-sc-gold/30 bg-sc-gold/[0.02] mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-sc-gold flex items-center gap-3">
          <Clock className="w-5 h-5 animate-pulse" /> Pending Loot Requests
        </h3>
        <span className="px-3 py-1 bg-sc-gold/20 text-sc-gold text-[10px] font-bold rounded-full border border-sc-gold/30">
          {requests.length} Awaiting Authorization
        </span>
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-black/40 border border-white/5 rounded p-4 group hover:border-sc-gold/20 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-sc-gold/10 flex items-center justify-center border border-sc-gold/20 text-sc-gold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{req.user.name || req.user.username}</p>
                    <span className="text-[9px] text-gray-500 font-mono">// {req.user.role} // {req.org.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Box className="w-3 h-3 text-sc-blue" />
                    <p className="text-xs text-sc-blue/80 font-mono uppercase">Requesting: {req.quantity}x {req.itemName}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {denyingId === req.id ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                    <input 
                      type="text" 
                      placeholder="Reason for denial..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="bg-black/60 border border-sc-red/30 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sc-red/50 w-48"
                    />
                    <button 
                      onClick={() => handleDeny(req.id)}
                      disabled={loadingId === req.id}
                      className="p-2 bg-sc-red/20 text-sc-red rounded border border-sc-red/30 hover:bg-sc-red/30 transition-all"
                    >
                      {loadingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => { setDenyingId(null); setReason(""); }}
                      className="p-2 text-gray-500 hover:text-white"
                    >
                      <XCircle className="w-4 h-4 opacity-50" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleApprove(req.id)}
                      disabled={loadingId === req.id}
                      className="flex items-center gap-2 px-4 py-2 bg-sc-green/10 hover:bg-sc-green/20 border border-sc-green/30 text-sc-green text-[10px] font-black uppercase tracking-widest transition-all rounded"
                    >
                      {loadingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Approve
                    </button>
                    <button 
                      onClick={() => setDenyingId(req.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-sc-red/10 hover:bg-sc-red/20 border border-sc-red/30 text-sc-red text-[10px] font-black uppercase tracking-widest transition-all rounded"
                    >
                      <XCircle className="w-3 h-3" />
                      Deny
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono uppercase">
                <span>TX_ID: {req.id.substring(0, 8)}</span>
                <span>Time: {new Date(req.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-sc-gold/40 font-mono">
                <ShieldCheck className="w-3 h-3" /> SECURITY_VERIFIED
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
