import { prisma } from "@/lib/prisma";
import { 
  UserCheck, 
  Search, 
  Box, 
  Calendar,
  ChevronRight,
  Shield,
  User as UserIcon
} from "lucide-react";

export default async function AssignedAssetsPage() {
  const org = await prisma.org.findFirst();
  if (!org) return <div>No Org found.</div>;

  const assignments = await prisma.distributionLog.findMany({
    where: { 
      orgId: org.id,
      type: { in: ["ASSIGNED", "GIVEAWAY"] }
    },
    include: {
      recipient: true
    },
    orderBy: { timestamp: 'desc' }
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-sc-green shadow-[0_0_10px_rgba(0,255,194,0.3)]" />
            Assigned Personnel Assets
          </h1>
          <p className="text-xs text-sc-green/60 mt-1 font-mono tracking-widest uppercase">
            Active Deployment Manifest // {org.name}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sc-glass p-4 flex items-center gap-4 border-b-2 border-sc-green/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="SEARCH BY OPERATOR OR ITEM DESIGNATION..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-green focus:outline-none focus:border-sc-green/50 transition-colors uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="sc-glass border-sc-border/20 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-green/5 border-b border-sc-green/20">
              <th className="px-6 py-4 text-[10px] font-bold text-sc-green uppercase tracking-widest">Operator</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-green uppercase tracking-widest">Asset Designation</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-green uppercase tracking-widest text-center">Qty</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-green uppercase tracking-widest">Assignment Date</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-green uppercase tracking-widest">Method</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-green uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <p className="text-gray-600 font-mono uppercase text-xs">No active asset deployments detected.</p>
                </td>
              </tr>
            ) : (
              assignments.map((log) => (
                <tr key={log.id} className="hover:bg-sc-green/[0.02] transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sc-green/10 border border-sc-green/20 flex items-center justify-center text-sc-green text-xs overflow-hidden">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white tracking-wide uppercase">{log.recipient?.name || log.recipient?.email || "Unknown"}</p>
                        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter">{log.recipient?.role || "Operator"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-sc-blue/40" />
                      <p className="text-sm font-bold text-white uppercase">{log.itemName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-mono text-white font-bold">{log.quantity}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <p className="text-[10px] font-mono">{log.timestamp.toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-500 text-[9px] font-bold uppercase tracking-widest rounded">
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sc-green/40 group-hover:text-sc-green transition-colors">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
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
