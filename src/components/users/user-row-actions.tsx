"use client";

import { useState, useEffect } from "react";
import { 
  MoreVertical, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Trash2,
  Loader2,
  Check,
  Edit,
  X,
  Mail,
  User as UserIcon,
  Ghost,
  Building2,
  Globe
} from "lucide-react";
import { Role } from "@prisma/client";
import { updateUser, deleteUser } from "@/app/actions/user";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import axios from "axios";

interface UserRowActionsProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    role: Role;
    orgId: string;
  };
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const { data: session, update }: any = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState<Role>(user.role);
  const [password, setPassword] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState(user.orgId);
  const [orgs, setOrgs] = useState<any[]>([]);

  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const isMe = session?.user?.id === user.id;

  useEffect(() => {
    if (isEditOpen && isSuperAdmin) {
      const fetchOrgs = async () => {
        try {
          const res = await axios.get("/api/orgs");
          setOrgs(res.data);
        } catch (err) {}
      };
      fetchOrgs();
    }
  }, [isEditOpen, isSuperAdmin]);

  const handleImpersonate = async () => {
    setLoading(true);
    await update({ impersonateId: user.id });
    setIsMenuOpen(false);
    window.location.href = "/dashboard";
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to decommission Operator ${user.name || user.email}? This action is irreversible.`)) return;
    setLoading(true);
    try {
      await deleteUser(user.id);
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
      const res = await updateUser(user.id, { 
        name, 
        username,
        email, 
        role, 
        password: password || undefined,
        orgId: isSuperAdmin ? selectedOrgId : undefined
      });
      if (res.success) {
        setIsEditOpen(false);
        setIsMenuOpen(false);
        setPassword("");
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
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 hover:bg-sc-gold/10 text-gray-500 hover:text-sc-gold rounded transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 sc-glass border border-sc-gold/50 rounded shadow-[0_0_30px_rgba(0,0,0,0.9)] z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200 bg-[#0A0A12]">
            <div className="p-1">
              {isSuperAdmin && !isMe && (
                <button 
                  onClick={handleImpersonate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-sc-blue hover:bg-sc-blue/10 transition-colors rounded mb-1"
                >
                  <Ghost className="w-3 h-3" /> Impersonate Operator
                </button>
              )}
              <button 
                onClick={() => { setIsEditOpen(true); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-gray-400 hover:bg-sc-blue/10 hover:text-sc-blue transition-colors rounded"
              >
                <Edit className="w-3 h-3" /> Edit Clearances
              </button>
              <button 
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase text-sc-red/60 hover:bg-sc-red/10 hover:text-sc-red transition-colors rounded"
              >
                <Trash2 className="w-3 h-3" /> Decommission
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="sc-glass w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-sc-blue/30 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
              <div>
                <h2 className="text-lg font-bold text-sc-blue tracking-widest uppercase flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Modify Operator
                </h2>
                <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Personnel Record Update // {user.id}</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              {isSuperAdmin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Organization Node
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select 
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-sc-blue/50 appearance-none uppercase transition-all"
                    >
                      {orgs.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Operator Name (Display)</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Designation (Username)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Comm-Link</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Reset Security Key (Optional)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="LEAVE BLANK TO KEEP CURRENT"
                  className="w-full bg-black/60 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-sc-blue/80 uppercase tracking-widest">Security Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[Role.MEMBER, Role.ADMIN, Role.SUPERADMIN].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "py-2 text-[9px] font-bold uppercase border transition-all",
                        role === r 
                          ? "bg-sc-blue/20 border-sc-blue text-sc-blue shadow-[0_0_10px_rgba(209,255,0,0.2)]" 
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
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {loading ? "SYNCING..." : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
