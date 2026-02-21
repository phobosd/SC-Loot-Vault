"use client";

import { useState } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Building2,
  Fingerprint
} from "lucide-react";
import { updateUser } from "@/app/actions/user";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  user: any;
  org: any;
}

export function ProfileForm({ user, org }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setPasswordConfirm] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password && password !== confirmPassword) {
      setError("Security Key mismatch detected.");
      setLoading(false);
      return;
    }

    try {
      const res = await updateUser(user.id, {
        name,
        email,
        role: user.role, // Keep current role
        password: password || undefined
      });

      if (res.success) {
        setSuccess(true);
        setPassword("");
        setPasswordConfirm("");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[0.3em] text-white uppercase flex items-center gap-3">
            <span className="w-2 h-10 bg-sc-blue block shadow-[0_0_20px_rgba(0,209,255,0.5)]" />
            Operator Profile
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Personal Telemetry // {user.username}
          </p>
        </div>
        
        {success && (
          <div className="flex items-center gap-2 text-sc-green text-[10px] font-mono uppercase bg-sc-green/10 px-4 py-2 border border-sc-green/30 rounded">
            <CheckCircle className="w-4 h-4" /> Profile Synchronized
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="sc-glass p-8 rounded-lg border-sc-blue/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Fingerprint className="w-32 h-32 text-sc-blue" />
            </div>

            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-sc-blue mb-8 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Personnel Data
            </h3>

            {error && (
              <div className="mb-6 p-4 bg-sc-red/10 border border-sc-red/30 text-sc-red text-xs font-mono uppercase flex items-center gap-3">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator Designation</label>
                  <input 
                    type="text" 
                    value={user.username} 
                    disabled
                    className="w-full bg-black/40 border border-white/5 px-4 py-3 text-sm font-mono text-gray-600 focus:outline-none opacity-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator Name (Display)</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.G. CHRIS ROBERTS"
                    className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Comm-Link Address (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="OPERATOR@ORGNODE.NET"
                    className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-sc-blue/80 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Security Key Reset
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">New Security Key</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Confirm Key</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-3 px-8 py-4 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-[0.2em] transition-all rounded shadow-[0_0_20px_rgba(0,209,255,0.1)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Synchronize Profile
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="sc-glass p-6 rounded-lg border-sc-blue/20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-blue mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Clearances
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[9px] text-gray-500 uppercase font-mono">Assigned Org</span>
                <span className="text-[10px] text-sc-blue font-bold uppercase">{org.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[9px] text-gray-500 uppercase font-mono">Security Role</span>
                <span className={cn(
                  "text-[10px] font-bold uppercase",
                  user.role === 'SUPERADMIN' ? "text-sc-red" : user.role === 'ADMIN' ? "text-sc-blue" : "text-gray-400"
                )}>{user.role}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[9px] text-gray-500 uppercase font-mono">Access Status</span>
                <span className="text-[10px] text-sc-green font-bold uppercase tracking-tighter flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> VERIFIED
                </span>
              </div>
            </div>
          </div>

          <div className="sc-glass p-6 rounded-lg border-sc-blue/20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-blue mb-6 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Org Context
            </h3>
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                You are currently linked to the <span className="text-sc-blue font-bold">{org.name}</span> logistics node. All asset requests and distribution logs are associated with this organization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
