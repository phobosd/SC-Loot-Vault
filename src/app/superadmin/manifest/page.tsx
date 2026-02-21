import { ManifestBrowser } from "@/components/superadmin/manifest-browser";
import { Database, History, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ManifestPage() {
  const lastItem = await prisma.sCItemCache.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  const lastSync = lastItem?.updatedAt.toLocaleString() || "Never";

  return (
    <div className="flex flex-col h-full max-h-screen space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <Database className="w-8 h-8 text-sc-blue" />
            Galactic Manifest Archive
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            UEE Central Intelligence Cache // READ-ONLY
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase transition-all rounded">
            <History className="w-4 h-4 text-sc-blue" />
            View Bridge History
          </button>
          <div className="flex items-center gap-2 text-[9px] font-mono text-sc-green/60 uppercase tracking-tighter">
            <Clock className="w-3 h-3" />
            Node Latency: 14ms // Last Sync: {lastSync}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-sc-blue/[0.01] rounded-lg border border-sc-blue/10">
        <ManifestBrowser />
      </div>
    </div>
  );
}
