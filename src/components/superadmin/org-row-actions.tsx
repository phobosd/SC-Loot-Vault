"use client";

import { useState } from "react";
import { 
  MoreVertical, 
  Trash2, 
  Loader2, 
  Check, 
  Edit,
  X,
  Palette,
  Globe,
  Ghost,
  ShieldCheck
} from "lucide-react";
import { updateOrg, deleteOrg } from "@/app/actions/org";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import axios from "axios";

interface OrgRowActionsProps {
  org: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
    accentColor: string;
  };
}

export function OrgRowActions({ org }: OrgRowActionsProps) {
  const { update }: any = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ... (existing state)

  const handleImpersonateAdmin = async () => {
    setLoading(true);
    try {
      // Fetch the first admin/superadmin for this org to impersonate
      const res = await axios.get(`/api/users?orgId=${org.id}&role=ADMIN`);
      const admin = res.data[0];
      
      if (admin) {
        await update({ impersonateId: admin.id });
        window.location.href = "/dashboard";
      } else {
        alert("No administrative nodes found for this organization. Provision an admin first.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [primary, setPrimary] = useState(org.primaryColor);
  const [accent, setAccent] = useState(org.accentColor);

  const handleDelete = async () => {
    if (!confirm(`CRITICAL: You are about to decommission the entire ${org.name} organization. All manifest data, operators, and history will be purged. Proceed?`)) return;
    setLoading(true);
    try {
      await deleteOrg(org.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateOrg(org.id, { name, slug, primaryColor: primary, accentColor: accent });
      if (res.success) {
        setIsEditOpen(false);
        setIsMenuOpen(false);
      } else {
        alert("Update Failed: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-sc-blue/10 text-gray-500 hover:text-sc-blue rounded transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 sc-glass border border-sc-blue/50 rounded shadow-2xl z-[110] bg-[#0A0A12] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-1">
              <button 
                onClick={handleImpersonateAdmin}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-sc-blue hover:bg-sc-blue/10 transition-colors rounded mb-1"
              >
                <Ghost className="w-3 h-3" /> Impersonate Lead Admin
              </button>
              <button onClick={() => { setIsEditOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-gray-400 hover:bg-sc-blue/10 hover:text-sc-blue transition-colors rounded">
                <Edit className="w-3 h-3" /> Edit Org Node
              </button>
              <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-sc-red/60 hover:bg-sc-red/10 hover:text-sc-red transition-colors rounded">
                <Trash2 className="w-3 h-3" /> Decommission Org
              </button>
            </div>
          </div>
        </>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="sc-glass w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-sc-blue/30 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
              <div>
                <h2 className="text-lg font-bold text-sc-blue tracking-widest uppercase flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Modify Org Node
                </h2>
                <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Node Modification // {org.id}</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Primary HUD</label>
                  <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-full h-10 bg-black/60 border border-white/10 p-1 cursor-pointer rounded" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Accent HUD</label>
                  <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-full h-10 bg-black/60 border border-white/10 p-1 cursor-pointer rounded" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-3 text-xs font-bold text-white uppercase border border-white/10 hover:bg-white/5 transition-colors rounded">Abort</button>
                <button type="submit" disabled={loading} className="flex-[2] py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Synchronize Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
