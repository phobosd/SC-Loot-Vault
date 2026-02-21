"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Box,
  Zap,
  Cpu,
  Shield,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { ItemDetailsModal } from "@/components/shared/item-details-modal";

export function ManifestBrowser() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/sc-items?page=${page}&q=${search}&type=${type}&limit=50`);
      setItems(res.data.items);
      setTotalPages(res.data.pages);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, type]);

  const getItemIcon = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes('component')) return <Cpu className="w-4 h-4 text-sc-blue/60 group-hover:text-sc-blue transition-colors" />;
    if (t.includes('weapon')) return <Zap className="w-4 h-4 text-sc-blue/60 group-hover:text-sc-blue transition-colors" />;
    if (t.includes('suit') || t.includes('armor')) return <Shield className="w-4 h-4 text-sc-blue/60 group-hover:text-sc-blue transition-colors" />;
    return <Box className="w-4 h-4 text-sc-blue/60 group-hover:text-sc-blue transition-colors" />;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <ItemDetailsModal itemId={detailItemId} onClose={() => setDetailItemId(null)} />

      {/* Filter Bar - Vault Style */}
      <div className="p-4 flex flex-wrap items-center gap-4 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="SEARCH GLOBAL MANIFEST (UUID / NAME / CATEGORY)..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 transition-colors uppercase tracking-widest"
          />
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mr-4">
            MASTER RECORDS: <span className="text-sc-blue font-bold">{totalItems.toLocaleString()}</span>
          </p>
          <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 hover:bg-sc-blue/10 disabled:opacity-10 text-sc-blue transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-[10px] font-mono text-sc-blue border-x border-white/10 min-w-[80px] text-center py-2">
              {page} / {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-2 hover:bg-sc-blue/10 disabled:opacity-10 text-sc-blue transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table - Exact Vault Style */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-blue/5 border-b border-sc-blue/20">
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Item Designation</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Classification</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Size</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Grade</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Manufacturer</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-right">Technical Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-sc-blue animate-spin opacity-40" />
                    <p className="text-[10px] text-sc-blue/40 uppercase tracking-[0.4em]">Querying Master Database...</p>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-gray-600 uppercase text-xs font-mono">No records found matching criteria</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr 
                  key={item.wikiId} 
                  onClick={() => setDetailItemId(item.wikiId)}
                  className="hover:bg-sc-blue/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sc-hud-corner bg-sc-blue/5 flex items-center justify-center border border-sc-blue/20 group-hover:border-sc-blue/40 transition-colors">
                        {getItemIcon(item.type)}
                      </div>
                      <p className="text-sm font-semibold text-white tracking-wide uppercase truncate max-w-[250px]">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-sc-blue/10 border border-sc-blue/20 text-sc-blue text-[9px] font-bold uppercase tracking-widest rounded">
                      {item.type || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-[10px] font-mono text-gray-400">{item.size || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-[10px] font-mono text-sc-gold/80">{item.grade || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-mono text-gray-400 uppercase truncate max-w-[150px]">{item.manufacturer || 'Unknown'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sc-blue/40 group-hover:text-sc-blue transition-colors">
                      <ChevronRightIcon className="w-4 h-4 ml-auto" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 py-4 bg-black/40 border-t border-white/10 flex-shrink-0">
          <button 
            onClick={() => { setPage(1); window.scrollTo(0, 0); }}
            disabled={page === 1}
            className="text-[9px] font-bold text-gray-600 hover:text-sc-blue uppercase tracking-widest disabled:opacity-0 transition-colors"
          >
            &lt;&lt; First Record
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={page === 1}
              className="px-4 py-1.5 bg-white/5 border border-white/10 text-sc-blue text-[9px] font-bold uppercase tracking-widest rounded hover:bg-sc-blue/10 disabled:opacity-20 transition-all"
            >
              Previous
            </button>
            <span className="text-[10px] text-gray-500 font-mono">MANIFEST {page} // {totalPages}</span>
            <button 
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
              disabled={page === totalPages}
              className="px-4 py-1.5 bg-white/5 border border-white/10 text-sc-blue text-[9px] font-bold uppercase tracking-widest rounded hover:bg-sc-blue/10 disabled:opacity-20 transition-all"
            >
              Next
            </button>
          </div>
          <button 
            onClick={() => { setPage(totalPages); window.scrollTo(0, 0); }}
            disabled={page === totalPages}
            className="text-[9px] font-bold text-gray-600 hover:text-sc-blue uppercase tracking-widest disabled:opacity-0 transition-colors"
          >
            Last Record &gt;&gt;
          </button>
        </div>
      )}
    </div>
  );
}
