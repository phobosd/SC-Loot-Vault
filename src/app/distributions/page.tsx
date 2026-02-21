import { prisma } from "@/lib/prisma";
import { 
  RotateCw, 
  History, 
  Settings,
  AlertTriangle,
  Info
} from "lucide-react";
import { DrawingArea } from "@/components/distributions/drawing-area";

export default async function DistributionsPage() {
  const org = await prisma.org.findFirst();
  
  if (!org) return <div>No Org found.</div>;

  // Fetch items with quantity > 0
  const inventory = await prisma.lootItem.findMany({
    where: { 
      orgId: org.id,
      quantity: { gt: 0 }
    }
  });

  // Mock participants for demonstration
  const mockParticipants = [
    { id: "1", name: "Maverick-7" },
    { id: "2", name: "StarSlinger_2951" },
    { id: "3", name: "IceMan_X" },
    { id: "4", name: "Shadow_Pilot" },
    { id: "5", name: "Orion_Actual" },
    { id: "6", name: "Nova_Corp" },
    { id: "7", name: "Red_One" },
    { id: "8", name: "Drake_Lover" },
  ];

  const recentLogs = await prisma.distributionLog.findMany({
    where: { orgId: org.id },
    take: 5,
    orderBy: { timestamp: 'desc' }
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-blue block shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            Loot Distribution System
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            RNG Wheel Interface // ACCESS LEVEL: SEC-LVL-9
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase transition-all rounded">
            <History className="w-4 h-4 text-sc-blue" />
            Full History
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase transition-all rounded">
            <Settings className="w-4 h-4 text-sc-blue" />
            Drawing Params
          </button>
        </div>
      </div>

      {/* Interactive Drawing Area */}
      <DrawingArea 
        inventory={inventory} 
        participants={mockParticipants} 
        orgId={org.id} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="sc-glass sc-hud-border p-6 rounded-lg bg-sc-blue/[0.02]">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-sc-blue mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> System Protocol
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-gray-500 font-mono uppercase tracking-tighter leading-relaxed">
              <div className="space-y-2">
                <p>1. Selection of item from manifest will automatically reserve quantity.</p>
                <p>2. RNG algorithm utilizes hardware-entropy for true randomization.</p>
              </div>
              <div className="space-y-2">
                <p>3. Win will be broadcasted to all active Discord listeners.</p>
                <p>4. Audit logs are generated upon drawing completion.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Log */}
        <div className="sc-glass p-6 rounded-lg border-sc-gold/20 bg-sc-gold/[0.02]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-sc-gold mb-4 flex items-center gap-2">
            <RotateCw className="w-4 h-4" /> Live Log
          </h3>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="flex items-center gap-3 p-3 text-gray-600 italic">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase">No recent drawings logged.</span>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-2 border-l-2 border-sc-gold/30 bg-black/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-white uppercase">{log.itemName}</p>
                    <p className="text-[8px] text-sc-gold/60 font-mono uppercase">DISPATCHED // {log.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
