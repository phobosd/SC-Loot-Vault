"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  X, 
  Search, 
  Loader2, 
  Check, 
  ChevronDown,
  Trash2,
  Box,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { addLootItems } from "@/app/actions/loot";

interface AddItemDialogProps {
  orgId: string;
}

interface ItemEntry {
  id: number;
  query: string;
  selected: any | null;
  quantity: number;
  suggestions: any[];
  isSearching: boolean;
}

export function AddItemDialog({ orgId }: AddItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<ItemEntry[]>([
    ...Array(10).fill(0).map((_, i) => ({ id: i, query: "", selected: null, quantity: 1, suggestions: [], isSearching: false }))
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMoreSlots = () => {
    if (entries.length >= 100) return;
    const start = entries.length;
    const newSlots = Array(10).fill(0).map((_, i) => ({ 
      id: start + i, 
      query: "", 
      selected: null, 
      quantity: 1, 
      suggestions: [], 
      isSearching: false 
    }));
    setEntries([...entries, ...newSlots]);
  };

  const handleSearch = async (index: number, q: string) => {
    const newEntries = [...entries];
    newEntries[index].query = q;
    newEntries[index].selected = null;
    
    if (q.length < 2) {
      newEntries[index].suggestions = [];
      setEntries(newEntries);
      return;
    }

    newEntries[index].isSearching = true;
    setEntries(newEntries);

    try {
      const res = await axios.get(`/api/sc-items/search?q=${q}`);
      const updated = [...entries];
      updated[index].suggestions = res.data;
      updated[index].isSearching = false;
      setEntries(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const selectItem = (index: number, item: any) => {
    const newEntries = [...entries];
    newEntries[index].selected = item;
    newEntries[index].query = item.name;
    newEntries[index].suggestions = [];
    setEntries(newEntries);
  };

  const updateQty = (index: number, qty: number) => {
    const newEntries = [...entries];
    newEntries[index].quantity = qty;
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = entries
      .filter(e => e.selected)
      .map(e => ({
        orgId,
        name: e.selected.name,
        category: e.selected.type,
        subCategory: e.selected.subType,
        quantity: e.quantity,
        size: e.selected.size,
        grade: e.selected.grade,
        class: e.selected.class,
        manufacturer: e.selected.manufacturer
      }));

    try {
      const res = await addLootItems(payload);
      if (res.success) {
        setIsOpen(false);
        setEntries([...Array(10).fill(0).map((_, i) => ({ id: i, query: "", selected: null, quantity: 1, suggestions: [], isSearching: false }))]);
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
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-bold uppercase transition-all rounded shadow-[0_0_15px_rgba(0,209,255,0.2)]"
      >
        <Plus className="w-4 h-4" />
        Bulk Add Loot
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="sc-glass w-full max-w-5xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border-sc-blue/30">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-sc-blue/5">
          <div className="flex items-center gap-4">
            <Layers className="w-6 h-6 text-sc-blue" />
            <div>
              <h2 className="text-lg font-bold text-sc-blue tracking-widest uppercase">Bulk Manifest Entry</h2>
              <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Batch Processor // entries: {entries.filter(e => e.selected).length} / {entries.length}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar bg-black/20">
          <div className="grid grid-cols-12 gap-4 mb-2 px-4 py-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
            <div className="col-span-1">Slot</div>
            <div className="col-span-7">Search & Select Item</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {entries.map((entry, index) => (
            <div key={entry.id} className="grid grid-cols-12 gap-4 items-start bg-white/[0.02] border border-white/5 p-2 rounded hover:border-sc-blue/20 transition-all group">
              <div className="col-span-1 flex items-center justify-center h-10 text-[10px] font-mono text-gray-600">
                {index + 1}
              </div>
              
              <div className="col-span-7 relative">
                <div className="relative">
                  <input 
                    type="text"
                    value={entry.query}
                    onChange={(e) => handleSearch(index, e.target.value)}
                    placeholder="TYPE ITEM NAME..."
                    className={cn(
                      "w-full bg-black/40 border px-4 py-2 text-xs font-mono text-white focus:outline-none transition-all",
                      entry.selected ? "border-sc-green/30 text-sc-green" : "border-white/10 focus:border-sc-blue/50"
                    )}
                  />
                  {entry.isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-sc-blue animate-spin" />}
                  {entry.selected && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-sc-green" />}
                </div>

                {entry.suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 sc-glass border border-sc-blue/50 shadow-2xl z-[110] max-h-40 overflow-y-auto bg-[#0A0A12]">
                    {entry.suggestions.map((s) => (
                      <button
                        key={s.wikiId}
                        onClick={() => selectItem(index, s)}
                        className="w-full px-3 py-2 text-left hover:bg-sc-blue/20 border-b border-white/5 last:border-0 text-[10px] flex justify-between"
                      >
                        <span className="text-white font-bold">{s.name}</span>
                        <span className="text-gray-500 uppercase">{s.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <input 
                  type="number"
                  min="1"
                  value={entry.quantity}
                  onChange={(e) => updateQty(index, parseInt(e.target.value) || 1)}
                  className="w-full bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-sc-blue/50"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                <button 
                  onClick={() => removeEntry(index)}
                  className="p-2 text-gray-700 hover:text-sc-red transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addMoreSlots}
            disabled={entries.length >= 100}
            className="w-full py-4 border-2 border-dashed border-white/5 rounded text-gray-600 hover:text-sc-blue hover:border-sc-blue/20 hover:bg-sc-blue/5 transition-all text-[10px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Expand Manifest Buffer (+10 Slots)
          </button>
        </div>

        <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Validated Entries</span>
              <span className="text-lg font-bold text-sc-green font-mono">{entries.filter(e => e.selected).length}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-mono">Buffer Capacity</span>
              <span className="text-lg font-bold text-white font-mono">{entries.length} / 100</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-6 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors rounded border border-white/10"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || entries.filter(e => e.selected).length === 0}
              className="px-8 py-3 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-black uppercase tracking-widest transition-all rounded disabled:opacity-30 flex items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.1)]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />}
              {isSubmitting ? "BUFFERING DATA..." : "Commit to Vault Manifest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
