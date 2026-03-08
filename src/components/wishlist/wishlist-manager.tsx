"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  Loader2, 
  Check, 
  X,
  Package,
  ArrowRight,
  ShieldCheck,
  Building2,
  Trash2,
  Heart,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { addToWishlist, removeFromWishlist } from "@/app/actions/wishlist";
import { createLootRequest } from "@/app/actions/loot";

interface WishlistManagerProps {
  initialWishlist: any[];
  availableItems: any[];
  orgId: string;
  userId: string;
}

export function WishlistManager({ initialWishlist, availableItems, orgId, userId }: WishlistManagerProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleSearch = async (q: string) => {
    setQuery(q);
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

  const handleAdd = async (item: any) => {
    setIsSubmitting(true);
    try {
      const res = await addToWishlist(item.name, item.wikiId);
      if (res.success) {
        setQuery("");
        setSuggestions([]);
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (wikiId: string) => {
    try {
      const res = await removeFromWishlist(wikiId);
      if (!res.success) alert(res.error);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequest = async (item: any, lootItem: any) => {
    const isAllied = lootItem.orgId !== orgId;
    const targetName = isAllied ? lootItem.org.name : "Org Leadership";
    
    if (!confirm(`Submit request for ${item.name} from ${targetName}?`)) return;

    setRequestingId(lootItem.id);
    try {
      const res = await createLootRequest({
        orgId: orgId,
        userId: userId,
        itemId: lootItem.id,
        itemName: item.name,
        category: lootItem.category,
        quantity: 1,
        targetOrgId: isAllied ? lootItem.orgId : null
      });

      if (res.success) {
        alert("Diplomatic request transmitted.");
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="sc-glass p-6 rounded-lg border-sc-blue/30 relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 sc-hud-corner flex items-center justify-center bg-sc-blue/5 border border-sc-blue/20">
            <Search className="w-5 h-5 text-sc-blue" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Add to Wishlist</h2>
            <p className="text-[10px] text-sc-blue/60 font-mono tracking-widest uppercase">Target Specific Hardware Profiles</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <input 
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="SEARCH GALACTIC MANIFEST..."
            className="w-full bg-black/60 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50 uppercase transition-all"
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-blue animate-spin" />}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute left-6 right-6 md:left-20 md:right-auto md:w-[500px] mt-1 sc-glass border border-sc-blue/50 shadow-2xl z-[110] max-h-64 overflow-y-auto bg-[#0A0A12]">
            {suggestions.map((s) => (
              <button
                key={s.wikiId}
                onClick={() => handleAdd(s)}
                className="w-full px-4 py-3 text-left hover:bg-sc-blue/20 border-b border-white/5 last:border-0 text-xs flex justify-between items-center group"
              >
                <div className="flex flex-col">
                  <span className="text-white font-bold group-hover:text-sc-blue transition-colors">{s.name}</span>
                  <span className="text-[9px] text-gray-500 uppercase">{s.manufacturer}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-sc-blue/40 uppercase font-mono">{s.type}</span>
                  <Plus className="w-4 h-4 text-sc-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {initialWishlist.length === 0 ? (
          <div className="col-span-full py-20 text-center sc-glass border-dashed border-white/10">
            <Heart className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <p className="text-xs font-mono text-gray-600 uppercase tracking-widest">Wishlist Empty // Awaiting Target Designation</p>
          </div>
        ) : (
          initialWishlist.map((item) => {
            const matches = availableItems.filter(i => i.name === item.name);
            const isAvailable = matches.length > 0;

            return (
              <div key={item.id} className={cn(
                "sc-glass p-6 flex flex-col justify-between border-l-2 transition-all hover:bg-white/[0.02]",
                isAvailable ? "border-l-sc-green bg-sc-green/[0.02]" : "border-l-sc-blue/20"
              )}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide leading-tight max-w-[80%]">{item.name}</h3>
                    <button 
                      onClick={() => handleRemove(item.wikiId)}
                      className="text-gray-700 hover:text-sc-red transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isAvailable ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sc-green animate-pulse">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Asset Detected in Network</span>
                      </div>
                      
                      <div className="space-y-2">
                        {matches.map((loot) => (
                          <div key={loot.id} className="p-3 bg-black/40 border border-white/5 rounded flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-gray-500 uppercase flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> {loot.org.name}
                              </span>
                              <span className="text-sc-green font-bold">QTY: {loot.quantity}</span>
                            </div>
                            <button
                              onClick={() => handleRequest(item, loot)}
                              disabled={requestingId === loot.id}
                              className="w-full py-2 bg-sc-green/20 hover:bg-sc-green/30 border border-sc-green/50 text-sc-green text-[9px] font-black uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
                            >
                              {requestingId === loot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
                              Request Asset
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600 italic">
                      <Package className="w-4 h-4 opacity-30" />
                      <span className="text-[10px] font-mono uppercase">Offline // No Local Matches</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[8px] text-gray-600 font-mono">Added: {new Date(item.createdAt).toLocaleDateString()}</span>
                  <button className="text-[8px] text-sc-blue/40 hover:text-sc-blue font-bold uppercase transition-colors">Telemetry Details</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
