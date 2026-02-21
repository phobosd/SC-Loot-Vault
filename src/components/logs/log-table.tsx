"use client";

import { useState } from "react";
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  RotateCw,
  Box
} from "lucide-react";

interface LogTableProps {
  initialLogs: any[];
}

export function LogTable({ initialLogs }: LogTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = initialLogs.filter((log) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.itemName.toLowerCase().includes(searchLower) ||
      log.recipient?.name?.toLowerCase().includes(searchLower) ||
      log.type.toLowerCase().includes(searchLower) ||
      log.method.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="sc-glass p-4 flex items-center gap-4 border-b-2 border-sc-blue/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH TRANSACTIONS (ITEM / OPERATOR / TYPE)..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 transition-colors uppercase tracking-widest"
          />
        </div>
        <div className="text-[10px] font-mono text-sc-blue/40 uppercase">
          Matches: {filteredLogs.length}
        </div>
        <button className="p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors rounded">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="sc-glass overflow-hidden border-sc-border/20 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-blue/5 border-b border-sc-blue/20">
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Action</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Item Manifest</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Recipient</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Method</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-right">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <p className="text-gray-600 font-mono uppercase text-xs">No transaction history detected.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {log.type === "WITHDRAWN" ? (
                        <ArrowUpRight className="w-3 h-3 text-sc-red" />
                      ) : (
                        <ArrowDownLeft className="w-3 h-3 text-sc-green" />
                      )}
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${
                        log.type === "WITHDRAWN" ? "text-sc-red" : "text-sc-green"
                      }`}>
                        {log.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Box className="w-3 h-3 text-sc-blue/40" />
                      <p className="text-xs font-bold text-white uppercase">{log.itemName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] text-gray-400 font-mono uppercase">
                      {log.recipient?.name || "System / Unassigned"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {log.method === "RNG_WHEEL" && <RotateCw className="w-3 h-3 text-sc-gold" />}
                      <span className="text-[9px] text-gray-500 font-mono uppercase">{log.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-mono text-white font-bold">{log.quantity}</p>
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
