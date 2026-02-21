"use client";

import { useState } from "react";
import { 
  ChevronRight, 
  Trash2, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Loader2,
  Box
} from "lucide-react";
import { removeLootItems, createLootRequest } from "@/app/actions/loot";
import { cn } from "@/lib/utils";
import { ItemDetailsModal } from "@/components/shared/item-details-modal";
import { useSession } from "next-auth/react";

interface LootTableProps {
  items: any[];
  orgId: string;
}

export function LootTable({ items, orgId }: LootTableProps) {
  const { data: session }: any = useSession();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsSubmitting] = useState(false);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleRequest = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!session?.user) return;
    
    if (!confirm(`Submit request for 1x ${item.name}?`)) return;

    setRequestingId(item.id);
    try {
      const res = await createLootRequest({
        orgId,
        userId: session.user.id,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        quantity: 1
      });

      if (res.success) {
        alert("Request transmitted to Org leadership.");
      } else {
        alert("Request Failed: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const handleDelete = async (ids: string[]) => {
    const count = ids.length;
    if (!confirm(`Warning: You are about to decommission ${count} item(s) from the manifest. This action is irreversible. Proceed?`)) return;
    
    setIsSubmitting(true);
    try {
      const res = await removeLootItems(ids);
      if (res.success) {
        setSelectedIds([]);
      } else {
        alert("System Error: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Detail Modal */}
      <ItemDetailsModal itemId={detailItemId} onClose={() => setDetailItemId(null)} orgId={orgId} />

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-sc-red/10 border border-sc-red/30 p-4 rounded flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-sc-red animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">
                Batch Protocol Active // {selectedIds.length} items selected
              </p>
              <p className="text-[10px] text-sc-red/60 font-mono uppercase">Authorized removal only</p>
            </div>
          </div>
          <button 
            onClick={() => handleDelete(selectedIds)}
            disabled={isDeleting}
            className="px-6 py-2 bg-sc-red/20 hover:bg-sc-red/30 border border-sc-red/50 text-sc-red text-xs font-black uppercase tracking-widest transition-all rounded flex items-center gap-2"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Purge Selected Manifests
          </button>
        </div>
      )}

      <div className="sc-glass border-sc-border/20 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-blue/5 border-b border-sc-blue/20">
              <th className="px-4 py-4 w-10">
                <button onClick={toggleAll} className="text-gray-500 hover:text-sc-blue transition-colors">
                  {selectedIds.length === items.length && items.length > 0 ? <CheckSquare className="w-4 h-4 text-sc-blue" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Item Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Qty</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Size</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Grade</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Manufacturer</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-right">Clearance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                      <Box className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">Vault is empty</p>
                      <p className="text-xs text-gray-700 mt-1 font-mono uppercase">Import spreadsheet or add manifests to begin</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr 
                  key={item.id} 
                  className={cn(
                    "group transition-colors cursor-pointer",
                    selectedIds.includes(item.id) ? "bg-sc-red/[0.03]" : "hover:bg-sc-blue/[0.03]"
                  )}
                  onClick={() => setDetailItemId(item.id)}
                >
                  <td className="px-4 py-4" onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
                    <div className="flex items-center justify-center">
                      {selectedIds.includes(item.id) ? <CheckSquare className="w-4 h-4 text-sc-red" /> : <Square className="w-4 h-4 text-gray-700 group-hover:text-gray-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 sc-hud-corner flex items-center justify-center border transition-colors",
                        selectedIds.includes(item.id) ? "bg-sc-red/5 border-sc-red/20" : "bg-sc-blue/5 border-sc-blue/20"
                      )}>
                        <Box className={cn("w-4 h-4", selectedIds.includes(item.id) ? "text-sc-red/60" : "text-sc-blue/60 group-hover:text-sc-blue")} />
                      </div>
                      <p className="text-sm font-semibold text-white tracking-wide uppercase truncate max-w-[200px]">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-sc-blue/10 border border-sc-blue/20 text-sc-blue text-[9px] font-bold uppercase tracking-widest rounded">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-mono text-white font-bold">{item.quantity}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-[10px] font-mono text-gray-400">{item.size || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-[10px] font-mono text-sc-gold">{item.grade || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-mono text-gray-400 uppercase truncate max-w-[120px]">{item.manufacturer || 'Unknown'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => handleRequest(e, item)}
                        disabled={requestingId === item.id || item.quantity < 1}
                        className="px-3 py-1 bg-sc-blue/10 hover:bg-sc-blue/20 border border-sc-blue/30 text-sc-blue text-[9px] font-bold uppercase rounded transition-all flex items-center gap-1 disabled:opacity-30"
                      >
                        {requestingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                        Request
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete([item.id]); }}
                        className="p-2 text-gray-700 hover:text-sc-red transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
