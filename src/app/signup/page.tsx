"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  UserPlus, 
  Loader2, 
  ChevronRight,
  Lock,
  User as UserIcon,
  Globe,
  CheckCircle,
  AlertCircle,
  Building2,
  Mail,
  Zap
} from "lucide-react";
import axios from "axios";
import { submitOrgRequest } from "@/app/actions/org";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function UnifiedSignupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"operator" | "org">("operator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Operator State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  // Org State
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [requester, setRequester] = useState("");
  const [contact, setContact] = useState("");

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await axios.get("/api/orgs");
        setOrgs(res.data);
        if (res.data.length > 0) setSelectedOrgId(res.data[0].id);
      } catch (err) {}
    };
    fetchOrgs();
  }, []);

  const handleOperatorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/auth/signup", {
        username, password, name, orgId: selectedOrgId
      });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(res.data.error || "Enrollment failed.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Link failure.");
    } finally { setLoading(false); }
  };

  const handleOrgRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await submitOrgRequest({
        name: orgName,
        slug: orgSlug,
        requesterName: requester,
        contactInfo: contact
      });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Integration failed.");
      }
    } catch (err) { setError("Nexus bridge timeout."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A] overflow-y-auto p-4 py-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 right-10 w-64 h-64 border-r border-t border-sc-blue/30" />
        <div className="absolute bottom-10 left-10 w-64 h-64 border-l border-b border-sc-blue/30" />
      </div>

      <div className="w-full max-w-xl space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 sc-hud-corner flex items-center justify-center bg-sc-blue/5 border border-sc-blue/20">
            {activeTab === "operator" ? (
              <UserPlus className="w-10 h-10 text-sc-blue animate-pulse" />
            ) : (
              <Globe className="w-10 h-10 text-sc-blue animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[0.5em] text-white uppercase">Vault Enrollment</h1>
            <p className="text-xs text-sc-blue/60 font-mono tracking-widest uppercase mt-2">
              System Access Initialization // {activeTab === "operator" ? "OPERATOR-NODE" : "NEXUS-INTEGRATION"}
            </p>
          </div>
        </div>

        <div className="sc-glass border-sc-blue/30 p-8 space-y-8 relative overflow-hidden">
          {/* Tab Navigation */}
          {!success && (
            <div className="flex border-b border-white/5 pb-4 gap-8">
              <button 
                onClick={() => { setActiveTab("operator"); setError(""); }}
                className={cn(
                  "pb-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2",
                  activeTab === "operator" ? "text-sc-blue border-sc-blue" : "text-gray-600 border-transparent hover:text-gray-400"
                )}
              >
                Operator Link
              </button>
              <button 
                onClick={() => { setActiveTab("org"); setError(""); }}
                className={cn(
                  "pb-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2",
                  activeTab === "org" ? "text-sc-gold border-sc-gold" : "text-gray-600 border-transparent hover:text-gray-400"
                )}
              >
                Nexus Integration
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-sc-red/10 border border-sc-red/30 text-sc-red text-[10px] font-mono uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {success ? (
            <div className="py-10 text-center space-y-6">
              <CheckCircle className="w-20 h-20 text-sc-green mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Transmission Successful</h2>
                <p className="text-sm text-gray-500 font-mono leading-relaxed max-w-md mx-auto">
                  {activeTab === "operator" 
                    ? "Your operator designation has been verified. Redirecting to login..."
                    : "Nexus integration request transmitted. A SuperAdmin will review your telemetry shortly."}
                </p>
              </div>
              {activeTab === "org" && (
                <Link href="/login" className="inline-flex items-center gap-2 text-sc-blue hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Return to Command Link
                </Link>
              )}
            </div>
          ) : activeTab === "operator" ? (
            <form onSubmit={handleOperatorSignup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator Designation</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" required value={username} onChange={(e) => setUsername(e.target.value.toUpperCase())}
                      placeholder="USERNAME"
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Security Key</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator Name (Display)</label>
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="CHRIS ROBERTS"
                  className="w-full bg-black/60 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Assign Organization Node</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 appearance-none uppercase"
                  >
                    {orgs.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full py-4 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-[0.2em] transition-all rounded flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,209,255,0.1)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Finalize Enrollment
              </button>
            </form>
          ) : (
            <form onSubmit={handleOrgRequest} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Org Designation</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-gold/40" />
                    <input 
                      type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)}
                      placeholder="E.G. AEGIS DYNAMICS" 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Network Slug</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" required value={orgSlug} 
                      onChange={(e) => setOrgSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                      placeholder="aegis-node" 
                      className="flex-1 bg-black/60 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50"
                    />
                    <span className="text-[10px] text-gray-600 font-mono">.VAULT</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Lead Admin Designation</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-gold/40" />
                    <input 
                      type="text" required value={requester} onChange={(e) => setRequester(e.target.value)}
                      placeholder="CHRIS ROBERTS" 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-sc-gold/80 uppercase tracking-widest">Comm-Link / Contact</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-gold/40" />
                    <input 
                      type="text" required value={contact} onChange={(e) => setContact(e.target.value)}
                      placeholder="EMAIL OR DISCORD HANDLE" 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full py-4 bg-sc-gold/20 hover:bg-sc-gold/30 border border-sc-gold/50 text-sc-gold text-xs font-black uppercase tracking-[0.2em] transition-all rounded flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(224,177,48,0.1)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Transmit Nexus Application
              </button>
            </form>
          )}

          {!success && (
            <div className="text-center pt-4 border-t border-white/5">
              <Link href="/login" className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest transition-colors font-mono underline underline-offset-4">
                Already registered? Return to Link
              </Link>
            </div>
          )}
        </div>

        <div className="text-center text-[8px] text-sc-blue/20 font-mono tracking-[0.4em] uppercase">
          Root Infrastructure // DIXNCOX NEXUS // 2954
        </div>
      </div>
    </div>
  );
}
