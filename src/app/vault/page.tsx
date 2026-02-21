import { prisma } from "@/lib/prisma";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Database,
  Handshake
} from "lucide-react";
import { ImportButton } from "@/components/vault/import-button";
import { BulkAddLootDialog } from "@/components/vault/bulk-add-loot-dialog";
import { AddItemDialog } from "@/components/vault/add-item-dialog";
import { LootTable } from "@/components/vault/loot-table";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function VaultPage({ searchParams }: { searchParams: Promise<{ allyId?: string }> }) {
  const session: any = await getServerSession(authOptions);
  const { allyId } = await searchParams;
  
  if (!session?.user) {
    redirect("/login");
  }

  const isSuperAdmin = session.user.role === 'SUPERADMIN';
  let org = null;
  let isAlliedView = false;

  if (allyId) {
    isAlliedView = allyId !== session.user.orgId;
    
    // If browsing an ally, verify alliance exists or user is SuperAdmin
    if (isSuperAdmin) {
      org = await prisma.org.findUnique({ where: { id: allyId } });
    } else {
      const alliance = await prisma.alliance.findFirst({
        where: {
          orgId: session.user.orgId || "NONE",
          allyId: allyId
        },
        include: { ally: true }
      });
      if (alliance) {
        org = alliance.ally;
      }
    }
  } else {
    org = session.user.orgId 
      ? await prisma.org.findUnique({ where: { id: session.user.orgId } })
      : null;
  }

  // If Global Admin (no org and not browsing an ally), show empty state per user preference
  if (isSuperAdmin && !org && !allyId) {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-blue block shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            Nexus Asset Vault
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Global Admin Mode // Awaiting Impersonation Protocol
          </p>
        </div>
        <div className="sc-glass p-20 flex flex-col items-center justify-center border-dashed border-sc-blue/20 rounded-lg text-center">
          <Database className="w-16 h-16 text-sc-blue/20 mb-6" />
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">No Active Org Context</h3>
          <p className="text-xs text-gray-500 font-mono uppercase max-w-md leading-relaxed">
            Local organization loot is isolated. To manage or view a specific vault, initialize the Impersonation Protocol from the Galactic Nexus command.
          </p>
        </div>
      </div>
    );
  }

  if (!org) return <div className="p-10 text-sc-red font-mono sc-glass border border-sc-red/20 uppercase tracking-widest text-xs">Access Denied // Diplomatic Link Not Established</div>;

  const lootItems = await prisma.lootItem.findMany({
    where: { 
      orgId: org.id,
      quantity: { gt: 0 }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className={cn(
              "w-2 h-8 block",
              isAlliedView ? "bg-sc-gold shadow-[0_0_10px_rgba(224,177,48,0.5)]" : "bg-sc-blue shadow-[0_0_10px_rgba(0,209,255,0.5)]"
            )} />
            {isAlliedView ? `Allied Vault: ${org.name}` : (isSuperAdmin && !session.user.orgId ? `Nexus Vault: ${org.name}` : "Org Loot Vault")}
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase flex items-center gap-2">
            {isAlliedView && <Handshake className="w-3 h-3 text-sc-gold" />}
            {isAlliedView ? "BROWSING EXTERNAL INVENTORY // DIP-LINK ACTIVE" : `Current Inventory Status // ${org.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isAlliedView && (
            <>
              <a href="/superadmin/manifest" className="flex items-center gap-2 px-4 py-2 bg-sc-gold/10 hover:bg-sc-gold/20 border border-sc-gold/30 text-sc-gold text-xs font-bold uppercase transition-all rounded">
                <Database className="w-4 h-4" />
                Global Manifest
              </a>
              <ImportButton orgId={org.id} />
              <AddItemDialog orgId={org.id} />
              <BulkAddLootDialog orgId={org.id} />
            </>
          )}
          {isAlliedView && (
            <div className="px-4 py-2 bg-sc-gold/10 border border-sc-gold/30 text-sc-gold text-[10px] font-black uppercase tracking-widest rounded">
              Read-Only Diplomatic Access
            </div>
          )}
        </div>
      </div>

      {/* Interactive Loot Table */}
      <LootTable 
        items={lootItems} 
        orgId={session.user.orgId || "GLOBAL"} 
        isAlliedView={isAlliedView}
        targetOrgId={org.id}
      />
    </div>
  );
}
