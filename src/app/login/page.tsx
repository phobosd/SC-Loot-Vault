"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Gamepad2, 
  ChevronRight,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username: username.toUpperCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid Designation or Security Key.");
        setLoading(false);
      } else {
        // Use hard reload to ensure session is picked up in iframe
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Link failure. Database unreachable.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 border-l border-t border-sc-blue/30" />
        <div className="absolute bottom-10 right-10 w-64 h-64 border-r border-b border-sc-blue/30" />
      </div>

      <div className="w-full max-w-md space-y-6 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto w-16 h-16 sc-hud-corner flex items-center justify-center bg-sc-blue/5 border border-sc-blue/20 shadow-[0_0_20px_rgba(0,209,255,0.1)]">
            <ShieldCheck className="w-8 h-8 text-sc-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-[0.4em] text-white uppercase">Vault Access</h1>
            <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase mt-2">
              Personnel Handshake Required // SEC-LEVEL-9
            </p>
          </div>
        </div>

        <div className="sc-glass border-sc-blue/30 p-8 space-y-6">
          {error && (
            <div className="p-3 bg-sc-red/10 border border-sc-red/30 text-sc-red text-[10px] font-mono uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator Designation</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USERNAME"
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 transition-all uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-[0.2em] transition-all rounded disabled:opacity-30"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Initialize Session
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[8px] font-mono text-gray-600 uppercase tracking-widest">OR EXTERNAL LINK</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button 
            onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-between px-6 py-4 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-white rounded transition-all group"
          >
            <div className="flex items-center gap-4">
              <Gamepad2 className="w-5 h-5 text-[#5865F2]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Link via Discord Node</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="text-center space-y-4">
          <p className="text-[8px] text-sc-blue/20 font-mono tracking-[0.3em] uppercase">
            Encrypted Data-Link provided by DIXNCOX Engineering // 2954
          </p>
          <div className="pt-2">
            <button 
              onClick={() => router.push("/signup")}
              className="text-[10px] text-sc-blue/40 hover:text-sc-blue uppercase tracking-widest transition-colors font-mono underline underline-offset-4"
            >
              Request Public Enrollment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
