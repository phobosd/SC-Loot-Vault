"use client";

import { useState } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { createApiKey, deleteApiKey } from "@/app/actions/api-key";
import { cn } from "@/lib/utils";

interface ApiKeyManagerProps {
  orgId: string;
  keys: any[];
}

export function ApiKeyManager({ orgId, keys }: ApiKeyManagerProps) {
  const [isCreating, setIsProcessing] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    
    setIsProcessing(true);
    const res = await createApiKey({ orgId, name: newKeyName });
    if (res.success) {
      setNewlyCreatedKey(res.key || null);
      setNewKeyName("");
    } else {
      alert(res.error);
    }
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this API Uplink? External integrations using this key will fail immediately.")) return;
    const res = await deleteApiKey(id);
    if (!res.success) alert(res.error);
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Key className="w-4 h-4 text-sc-blue" />
            API Uplink Management
          </h3>
          <p className="text-[10px] text-sc-blue/60 font-mono uppercase mt-1">Authorized external integration nodes</p>
        </div>
      </div>

      {newlyCreatedKey && (
        <div className="p-4 bg-sc-blue/10 border border-sc-blue/30 rounded-lg animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-sc-green" />
            <p className="text-[10px] font-black text-sc-green uppercase tracking-widest">New Uplink Key Generated</p>
          </div>
          <p className="text-[9px] text-sc-blue/60 mb-4 uppercase">This key will only be shown ONCE. Store it securely in your external application parameters.</p>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black/60 border border-white/10 px-4 py-2 font-mono text-xs text-sc-blue break-all">
              {newlyCreatedKey}
            </div>
            <button 
              onClick={() => copyToClipboard(newlyCreatedKey)}
              className="p-2 bg-sc-blue/20 hover:bg-sc-blue/30 text-sc-blue border border-sc-blue/50 transition-all rounded"
            >
              {copied === newlyCreatedKey ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          
          <button 
            onClick={() => setNewlyCreatedKey(null)}
            className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded border border-white/10"
          >
            I have secured the key
          </button>
        </div>
      )}

      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="p-10 border border-dashed border-white/10 rounded-lg text-center">
            <p className="text-[10px] text-gray-500 uppercase font-mono italic">No active API Uplinks found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 border border-white/10 rounded-lg overflow-hidden">
            {keys.map((k) => (
              <div key={k.id} className="p-4 bg-black/40 flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">{k.name}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[9px] font-mono text-sc-blue/40 uppercase tracking-tighter">
                      Key: nx_••••••••{k.key.slice(-4)}
                    </p>
                    {k.lastUsed && (
                      <p className="text-[8px] font-mono text-sc-green/40 uppercase">
                        Last Active: {new Date(k.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(k.id)}
                  className="p-2 text-gray-600 hover:text-sc-red hover:bg-sc-red/10 transition-all rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input 
          type="text"
          placeholder="NEW UPLINK NAME (E.G. RECRUITMENT SITE)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value.toUpperCase())}
          className="flex-1 bg-black/60 border border-white/10 px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-sc-blue/50"
          required
        />
        <button 
          type="submit" 
          disabled={isCreating}
          className="px-6 py-2 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Generate Uplink
        </button>
      </form>

      <div className="p-4 bg-sc-gold/5 border border-sc-gold/20 rounded flex gap-3">
        <AlertTriangle className="w-5 h-5 text-sc-gold shrink-0" />
        <div>
          <p className="text-[10px] font-bold text-sc-gold uppercase tracking-widest mb-1">Security Protocol</p>
          <p className="text-[9px] text-sc-gold/60 font-mono leading-relaxed uppercase">
            API keys grant read-access to your organization&apos;s inventory and recent logs. Never commit these keys to client-side code or public repositories.
          </p>
        </div>
      </div>
    </div>
  );
}
