"use client";

import { useState } from "react";
import { 
  Building2, 
  X, 
  Loader2, 
  Check, 
  Globe,
  Palette,
  User as UserIcon,
  Lock,
  Mail
} from "lucide-react";
import { provisionOrg } from "@/app/actions/org";
import { cn } from "@/lib/utils";

export function ProvisionOrgDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const result = await provisionOrg({ 
        name, 
        slug: generatedSlug,
        requesterName,
        adminPassword,
        contactInfo
      });
      if (result.success) {
        if (result.message) alert(result.message);
        setIsOpen(false);
        setName("");
        setRequesterName("");
        setAdminPassword("");
        setContactInfo("");
      } else {
        setError(result.error || "Provisioning failed");
      }
    } catch (err) {
      setError("Galactic Nexus link failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-2 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-bold uppercase transition-all rounded shadow-[0_0_15px_rgba(0,209,255,0.2)]"
      >
        <Building2 className="w-4 h-4" />
        Provision New Org
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="sc-glass w-full max-w-md overflow-hidden border-sc-blue/30 shadow-2xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
          <div>
            <h2 className="text-lg font-bold text-sc-blue tracking-widest uppercase flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Provision Organization
            </h2>
            <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Nexus Authorization Required // GLOBAL-ROOT</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && <div className="p-3 bg-sc-red/10 border border-sc-red/30 text-sc-red text-[10px] font-mono uppercase">{error}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Org Designation (ORG NAME)</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.G. AEGIS DYNAMICS" 
              className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Lead Admin Designation</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" required value={requesterName} onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="USERNAME" 
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Lead Admin Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Comm-Link / Contact</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" required value={contactInfo} onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="EMAIL OR DISCORD" 
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 text-xs font-bold text-white uppercase border border-white/10 hover:bg-white/5 transition-colors rounded">Abort</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Finalize Provisioning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
