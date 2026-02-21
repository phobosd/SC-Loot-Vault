"use client";

import { useState } from "react";
import { 
  UserPlus, 
  X, 
  Loader2, 
  Check, 
  Shield,
  Mail,
  User as UserIcon,
  Key
} from "lucide-react";
import { Role } from "@prisma/client";
import { createUser } from "@/app/actions/user";
import { cn } from "@/lib/utils";

interface AddUserDialogProps {
  orgId: string;
}

export function AddUserDialog({ orgId }: AddUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>(Role.MEMBER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleReset = () => {
    setUsername("");
    setPassword("");
    setEmail("");
    setName("");
    setRole(Role.MEMBER);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const result = await createUser({
        username,
        password,
        email,
        name,
        role,
        orgId
      });

      if (result.success) {
        setIsOpen(false);
        handleReset();
      } else {
        setError(result.error || "Failed to provision operator");
      }
    } catch (err) {
      setError("System handshake failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-sc-gold/20 hover:bg-sc-gold/30 border border-sc-gold/50 text-sc-gold text-xs font-bold uppercase transition-all rounded shadow-[0_0_15px_rgba(224,177,48,0.2)]"
      >
        <UserPlus className="w-4 h-4" />
        Provision Operator
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="sc-glass w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-sc-gold/30">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-gold/5">
          <div>
            <h2 className="text-lg font-bold text-sc-gold tracking-widest uppercase flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Provision Personnel
            </h2>
            <p className="text-[10px] text-sc-gold/60 font-mono tracking-widest uppercase">Admin Authorization Required // SEC-LVL-ADMIN</p>
          </div>
          <button onClick={() => { setIsOpen(false); handleReset(); }} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-sc-red/10 border border-sc-red/30 text-sc-red text-[10px] font-mono uppercase tracking-tighter">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Designation (Username)</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="C.ROBERTS" 
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Security Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Operator Name (Display)</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.G. CHRIS ROBERTS" 
              className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Comm-Link Address (Optional Email)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="OPERATOR@DIXNCOX.ORG" 
                className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Security Clearance</label>
            <div className="grid grid-cols-3 gap-2">
              {[Role.MEMBER, Role.ADMIN, Role.SUPERADMIN].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "py-2 text-[9px] font-bold uppercase border transition-all",
                    role === r 
                      ? "bg-sc-gold/20 border-sc-gold text-sc-gold shadow-[0_0_10px_rgba(224,177,48,0.2)]" 
                      : "bg-black/40 border-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => { setIsOpen(false); handleReset(); }}
              className="flex-1 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 bg-sc-gold/20 hover:bg-sc-gold/30 border border-sc-gold/50 text-sc-gold text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSubmitting ? "PROVISIONING..." : "Confirm Clearance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
