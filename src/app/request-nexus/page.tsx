"use client";

import { useState } from "react";
import { 
  Globe, 
  ChevronRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Building2,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { submitOrgRequest } from "@/app/actions/org";
import Link from "next/link";

export default function RequestNexusPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [requester, setRequester] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await submitOrgRequest({
        name,
        slug,
        requesterName: requester,
        contactInfo: contact
      });

      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(res.error || "Integration request failed.");
      }
    } catch (err) {
      setError("Nexus bridge timeout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A] overflow-y-auto p-4 py-20">
      <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 sc-hud-corner flex items-center justify-center bg-sc-blue/5 border border-sc-blue/20">
            <Globe className="w-10 h-10 text-sc-blue animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[0.5em] text-white uppercase">Nexus Integration</h1>
            <p className="text-xs text-sc-blue/60 font-mono tracking-widest uppercase mt-2">
              Organization Onboarding Protocol // AWAITING TELEMETRY
            </p>
          </div>
        </div>

        <div className="sc-glass border-sc-blue/30 p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sc-blue/5 blur-3xl rounded-full -mr-16 -mt-16" />
          
          {status === "success" ? (
            <div className="py-10 text-center space-y-6">
              <CheckCircle className="w-20 h-20 text-sc-green mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Application Transmitted</h2>
                <p className="text-sm text-gray-500 font-mono leading-relaxed max-w-md mx-auto">
                  Your organization's telemetry has been received. A Galactic Root Administrator will review your request for Nexus integration.
                </p>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sc-blue hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Return to Command Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {status === "error" && (
                <div className="col-span-2 p-4 bg-sc-red/10 border border-sc-red/30 text-sc-red text-xs font-mono uppercase flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> {error}
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-sc-blue uppercase tracking-[0.3em] border-b border-sc-blue/20 pb-2">Org Intelligence</h3>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Organization Designation</label>
                  <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="E.G. AEGIS DYNAMICS" 
                    className="w-full bg-black/60 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Network Slug</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" required value={slug} 
                      onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                      placeholder="aegis-node" 
                      className="flex-1 bg-black/60 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                    />
                    <span className="text-[10px] text-gray-600 font-mono">.VAULT</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-sc-blue uppercase tracking-[0.3em] border-b border-sc-blue/20 pb-2">Requester Clearance</h3>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Administrator Name</label>
                  <input 
                    type="text" required value={requester} onChange={(e) => setRequester(e.target.value)}
                    placeholder="CHRIS ROBERTS" 
                    className="w-full bg-black/60 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Comm-Link / Contact</label>
                  <input 
                    type="text" required value={contact} onChange={(e) => setContact(e.target.value)}
                    placeholder="EMAIL OR DISCORD HANDLE" 
                    className="w-full bg-black/60 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                  />
                </div>
              </div>

              <div className="col-span-2 pt-4">
                <button 
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,209,255,0.1)]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Request Nexus Integration
                </button>
                <div className="mt-6 text-center">
                  <Link href="/login" className="text-[9px] text-gray-600 hover:text-white uppercase tracking-[0.2em] transition-colors">
                    Cancel Application // Return to Bridge
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-[8px] text-sc-blue/20 font-mono tracking-[0.4em] uppercase">
          Nexus Root Infrastructure // DIXNCOX // 2954
        </div>
      </div>
    </div>
  );
}
