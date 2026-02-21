"use client";

import { useState } from "react";
import { 
  Plus, 
  X, 
  Search, 
  Loader2, 
  Check, 
  Box,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { addLootItems } from "@/app/actions/loot";

interface AddItemDialogProps {
  orgId: string;
  trigger?: React.ReactNode;
}

export function AddItemDialog({ orgId, trigger }: AddItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    setSelected(null);
    
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await axios.get(`/api/sc-items/search?q=${q}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectItem = (item: any) => {
    setSelected(item);
    setQuery(item.name);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    
    const payload = [{
      orgId,
      name: selected.name,
      category: selected.type,
      subCategory: selected.subType,
      quantity: quantity,
      size: selected.size,
      grade: selected.grade,
      class: selected.class,
      manufacturer: selected.manufacturer
    }];

    try {
      const res = await addLootItems(payload);
      if (res.success) {
        setIsOpen(false);
        setQuery("");
        setSelected(null);
        setQuantity(1);
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    if (trigger) {
      return <div onClick={() => setIsOpen(true)} className="cursor-pointer">{trigger}</div>;
    }
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-bold uppercase transition-all rounded"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="sc-glass w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-sc-blue/30">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-sc-blue" />
            <div>
              <h2 className="text-lg font-bold text-sc-blue tracking-widest uppercase">Add Asset</h2>
              <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Single Entry Protocol</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Identify Item</label>
            <div className="relative">
              <input 
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="TYPE NAME OR CATEGORY..."
                className={cn(
                  "w-full bg-black/60 border px-4 py-3 text-sm font-mono text-white focus:outline-none transition-all uppercase",
                  selected ? "border-sc-green/30 text-sc-green" : "border-white/10 focus:border-sc-blue/50"
                )}
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-blue animate-spin" />}
              {selected && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-green" />}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute left-6 right-6 mt-1 sc-glass border border-sc-blue/50 shadow-2xl z-[110] max-h-60 overflow-y-auto bg-[#0A0A12]">
                {suggestions.map((s) => (
                  <button
                    key={s.wikiId}
                    onClick={() => selectItem(s)}
                    className="w-full px-4 py-3 text-left hover:bg-sc-blue/20 border-b border-white/5 last:border-0 text-xs flex justify-between items-center group"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-bold group-hover:text-sc-blue transition-colors">{s.name}</span>
                      <span className="text-[9px] text-gray-500 uppercase">{s.manufacturer || "Unknown Mfg"}</span>
                    </div>
                    <span className="text-[9px] text-sc-blue/40 uppercase font-mono">{s.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center bg-black/60 border border-white/10 overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <input 
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent text-center text-sm font-mono text-white focus:outline-none"
                />
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase hover:bg-white/10 transition-all rounded flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> 1
              </button>
            </div>
          </div>

          {selected && (
            <div className="p-4 bg-sc-blue/5 border border-sc-blue/20 rounded space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-sc-blue uppercase">{selected.name}</h3>
                  <p className="text-[9px] text-sc-blue/60 uppercase font-mono mt-1">{selected.manufacturer} // S{selected.size}</p>
                </div>
                <span className="px-2 py-0.5 bg-sc-blue/20 text-sc-blue text-[8px] font-black uppercase rounded tracking-tighter">
                  {selected.type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-sc-blue/10 pt-3">
                <div>
                  <span className="block text-[8px] text-gray-500 uppercase font-mono">Grade</span>
                  <span className="text-[10px] text-white uppercase font-mono">{selected.grade || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-gray-500 uppercase font-mono">Class</span>
                  <span className="text-[10px] text-white uppercase font-mono">{selected.class || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex gap-3">
          <button 
            onClick={() => setIsOpen(false)}
            className="flex-1 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !selected}
            className="flex-[2] py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.1)]"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />}
            {isSubmitting ? "COMMITING..." : "Provision Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}
