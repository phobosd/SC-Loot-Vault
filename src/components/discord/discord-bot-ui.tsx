"use client";

import { useState, useEffect } from "react";
import { 
  Bot, 
  Settings, 
  Terminal, 
  ShieldCheck,
  ExternalLink,
  Copy,
  Command,
  ChevronRight,
  Zap,
  Lock,
  CheckCircle,
  AlertCircle,
  Server
} from "lucide-react";
import { BotConfigForm } from "./bot-config-form";
import { cn } from "@/lib/utils";
import axios from "axios";

interface DiscordBotUIProps {
  org: any;
  botCommands: any[];
  isOnline: boolean;
}

export function DiscordBotUI({ org, botCommands, isOnline: initialOnline }: DiscordBotUIProps) {
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [lastSeen, setLastSeen] = useState(org.discordBotLastSeen);

  // Poll for status changes every 30s
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(`/api/orgs/status`);
        const online = res.data.lastSeen 
          ? (new Date().getTime() - new Date(res.data.lastSeen).getTime()) < 120000 
          : false;
        setIsOnline(online);
        setLastSeen(res.data.lastSeen);
      } catch (err) {}
    };

    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [org.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Panel */}
      <div className="lg:col-span-2 space-y-6">
        <BotConfigForm 
          orgId={org.id} 
          initialToken={org.discordBotToken} 
          initialGuildId={org.discordGuildId} 
        />

        <div className="sc-glass sc-hud-border p-6 rounded-lg border-sc-blue/20">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-sc-blue mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Command Documentation
          </h3>
          <div className="space-y-2">
            {botCommands.map((cmd) => (
              <div key={cmd.name} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group hover:bg-white/5 px-2 transition-all">
                <div className="flex items-center gap-4">
                  <div className="px-2 py-1 bg-black/40 border border-sc-blue/30 rounded font-mono text-xs text-sc-blue font-bold">
                    {cmd.name}
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{cmd.description}</p>
                </div>
                <span className={cn(
                  "text-[8px] font-bold px-2 py-0.5 rounded border",
                  cmd.role === 'Admin' ? 'border-sc-red/30 text-sc-red' : 'border-sc-green/30 text-sc-green'
                )}>
                  {cmd.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Setup Guide */}
      <div className="space-y-6">
        <div className="sc-glass p-6 rounded-lg border-sc-gold/20 bg-sc-gold/[0.02]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-sc-gold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Protocol Manual
          </h3>
          <div className="space-y-8">
            <div className="space-y-3 relative pl-6 border-l border-sc-gold/30">
              <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sc-gold text-black text-[10px] font-bold flex items-center justify-center">1</span>
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Bot Intelligence Node</p>
              <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                Ensure the bot is running on your Mac mini node using the <span className="text-sc-blue">manage-vault.sh</span> script.
              </p>
            </div>
            
            <div className="space-y-3 relative pl-6 border-l border-sc-gold/30">
              <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sc-gold text-black text-[10px] font-bold flex items-center justify-center">2</span>
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Protocol Check</p>
              <p className="text-[9px] text-gray-500 font-mono leading-relaxed italic">
                Type <span className="text-white">/help</span> in any authorized channel to verify bridge synchronization.
              </p>
            </div>
          </div>
        </div>

        <div className="sc-glass p-6 rounded-lg border-[#5865F2]/30">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#5865F2] mb-4 flex items-center gap-2">
            <Command className="w-4 h-4" /> Quick Info
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-black/40 rounded border border-white/5">
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter mb-2">Bridge Status</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-sc-green shadow-[0_0_8px_rgba(0,255,194,0.5)] animate-pulse" : "bg-sc-red shadow-[0_0_8px_rgba(255,0,0,0.5)]"
                )} />
                <span className={cn(
                  "text-[10px] font-bold uppercase",
                  isOnline ? "text-sc-green" : "text-sc-red"
                )}>
                  {isOnline ? "OPERATIONAL" : "OFFLINE"}
                </span>
              </div>
              {lastSeen && (
                <p className="text-[7px] text-gray-600 font-mono mt-2 uppercase">
                  Last Pulse Detected: {new Date(lastSeen).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="p-3 bg-black/40 rounded border border-white/5">
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter mb-2">Link Node</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-mono text-gray-600 truncate uppercase">vault.andypace.com</span>
                <button 
                  onClick={() => navigator.clipboard.writeText("https://vault.andypace.com")}
                  className="p-1 hover:bg-white/5 rounded"
                >
                  <Copy className="w-3 h-3 text-gray-700 cursor-pointer" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
