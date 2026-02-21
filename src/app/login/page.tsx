"use client";

import { signIn } from "next-auth/react";
import { 
  ShieldCheck, 
  Gamepad2, 
  Mail, 
  ChevronRight,
  Lock
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A]">
      {/* Background HUD elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 border-l border-t border-sc-blue/30" />
        <div className="absolute bottom-10 right-10 w-64 h-64 border-r border-b border-sc-blue/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-sc-blue/20 to-transparent" />
      </div>

      <div className="w-full max-w-md sc-glass border-sc-blue/30 p-8 space-y-8 animate-in zoom-in-95 duration-500 shadow-[0_0_100px_rgba(0,209,255,0.1)]">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 sc-hud-corner flex items-center justify-center bg-sc-blue/5 border border-sc-blue/20">
            <ShieldCheck className="w-8 h-8 text-sc-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-[0.4em] text-white uppercase">Vault Access</h1>
            <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase mt-2">
              Unauthorized Access Prohibited // SEC-LEVEL-9
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-between px-6 py-4 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-white rounded transition-all group"
          >
            <div className="flex items-center gap-4">
              <Gamepad2 className="w-5 h-5 text-[#5865F2]" />
              <span className="text-xs font-bold uppercase tracking-widest">Sign in with Discord</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </button>

          <button 
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded transition-all group"
          >
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-sc-gold" />
              <span className="text-xs font-bold uppercase tracking-widest">Sign in with Google</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="pt-6 border-t border-sc-border/30">
          <div className="flex items-center gap-3 p-3 bg-black/40 rounded border border-sc-blue/10">
            <Lock className="w-4 h-4 text-sc-blue/40" />
            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter">
              Encrypted biometric handshake active. Org membership verified on first login.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[8px] text-sc-blue/20 font-mono tracking-[0.3em] uppercase">
            System developed by DIXNCOX Engineering // 2954
          </p>
        </div>
      </div>
    </div>
  );
}
