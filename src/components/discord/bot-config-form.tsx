"use client";

import { useState } from "react";
import { 
  Settings, 
  Lock, 
  Loader2, 
  Check, 
  ShieldCheck,
  Zap,
  Server
} from "lucide-react";
import { updateOrgDiscord } from "@/app/actions/org";
import { cn } from "@/lib/utils";

interface BotConfigFormProps {
  orgId: string;
  initialToken: string | null;
  initialGuildId: string | null;
}

export function BotConfigForm({ orgId, initialToken, initialGuildId }: BotConfigFormProps) {
  const [token, setToken] = useState(initialToken || "");
  const [guildId, setGuildId] = useState(initialGuildId || "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    
    try {
      const res = await updateOrgDiscord(orgId, { 
        discordBotToken: token, 
        discordGuildId: guildId 
      });
      
      if (res.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-glass p-8 rounded-lg relative overflow-hidden border-l-4 border-[#5865F2]">
      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[#5865F2] mb-6 flex items-center gap-2">
        <Settings className="w-4 h-4" /> Backend Configuration
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" /> Discord Bot Token
          </label>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ODQ2NjU1NjU..." 
              className="flex-1 bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-sc-blue focus:outline-none focus:border-[#5865F2]/50"
            />
          </div>
          <p className="text-[9px] text-gray-600 font-mono italic">
            Sensitive authorization secret. Never share this across unencrypted channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Server className="w-3 h-3" /> Guild ID (Server)
            </label>
            <input 
              type="text" 
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              placeholder="84665565..." 
              className="w-full bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-sc-blue focus:outline-none focus:border-[#5865F2]/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center justify-between">
              Handshake Status
              <span className={cn(
                "text-[9px] lowercase tracking-tighter px-2 rounded",
                token && guildId ? "bg-sc-green/10 text-sc-green" : "bg-sc-red/10 text-sc-red"
              )}>
                {token && guildId ? "[Verified]" : "[Awaiting Data]"}
              </span>
            </label>
            <div className="px-4 py-2 bg-[#5865F2]/5 border border-[#5865F2]/20 rounded text-[10px] font-mono text-[#5865F2] uppercase">
              Authenticated Access Required
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === "success" && (
              <p className="text-[10px] text-sc-green font-mono uppercase animate-in fade-in slide-in-from-left-2">
                Encryption Keys Updated // Secure
              </p>
            )}
            {status === "error" && (
              <p className="text-[10px] text-sc-red font-mono uppercase animate-in shake duration-300">
                Update Failed // Bridge Timeout
              </p>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/50 text-white text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-sc-gold" />}
            {loading ? "SYNCHRONIZING..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
