"use client";

import { useState } from "react";
import { 
  Building2, 
  Check, 
  X, 
  Loader2, 
  Mail, 
  User as UserIcon,
  Globe,
  Clock,
  ChevronRight
} from "lucide-react";
import { approveOrgRequest, rejectOrgRequest } from "@/app/actions/org";
import { cn } from "@/lib/utils";

interface OrgRequestManagerProps {
  requests: any[];
}

export function OrgRequestManager({ requests }: OrgRequestManagerProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await approveOrgRequest(id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Decline this integration request?")) return;
    setLoadingId(id);
    try {
      await rejectOrgRequest(id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-black text-sc-gold uppercase tracking-[0.4em] flex items-center gap-2 mb-4">
        <Clock className="w-3 h-3 animate-pulse" />
        Incoming Nexus Applications
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {requests.map((req) => (
          <div key={req.id} className="sc-glass border-l-2 border-sc-gold/50 p-6 flex flex-col justify-between gap-6 hover:bg-sc-gold/[0.02] transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{req.name}</h3>
                <div className="flex items-center gap-2 text-sc-blue text-[10px] font-mono">
                  <Globe className="w-3 h-3" /> {req.slug}.vault
                </div>
              </div>
              <span className="px-2 py-0.5 bg-sc-gold/10 border border-sc-gold/20 text-sc-gold text-[8px] font-black uppercase tracking-widest rounded">
                Pending Approval
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
              <div className="space-y-1">
                <p className="text-[8px] text-gray-600 uppercase font-mono tracking-widest">Requester</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <UserIcon className="w-3 h-3 text-sc-blue/40" /> {req.requesterName}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] text-gray-600 uppercase font-mono tracking-widest">Comm-Link</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                  <Mail className="w-3 h-3 text-sc-blue/40" /> {req.contactInfo}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => handleApprove(req.id)}
                disabled={!!loadingId}
                className="flex-1 py-2.5 bg-sc-green/20 hover:bg-sc-green/30 border border-sc-green/50 text-sc-green text-[10px] font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
              >
                {loadingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Approve Integration
              </button>
              <button 
                onClick={() => handleReject(req.id)}
                disabled={!!loadingId}
                className="flex-1 py-2.5 bg-white/5 hover:bg-sc-red/10 border border-white/10 hover:border-sc-red/30 text-gray-500 hover:text-sc-red text-[10px] font-bold uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
