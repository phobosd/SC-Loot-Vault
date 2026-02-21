import { prisma } from "@/lib/prisma";
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  RotateCw,
  Box
} from "lucide-react";

export default async function LogsPage() {
  const org = await prisma.org.findFirst();
  if (!org) return <div>No Org context.</div>;

  const logs = await prisma.distributionLog.findMany({
    where: { orgId: org.id },
    orderBy: { timestamp: 'desc' },
    include: {
      recipient: true
    }
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-blue block shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            Audit Logs & History
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Transaction Manifest // {org.name}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sc-glass p-4 flex items-center gap-4 border-b-2 border-sc-blue/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="SEARCH TRANSACTIONS (ITEM / OPERATOR)..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 transition-colors uppercase tracking-widest"
          />
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
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <p className="text-gray-600 font-mono uppercase text-xs">No transaction history detected.</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-mono text-gray-500">{log.timestamp.toLocaleString()}</p>
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
