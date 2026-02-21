import { prisma } from "@/lib/prisma";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Database
} from "lucide-react";
import { ImportButton } from "@/components/vault/import-button";
import { BulkAddLootDialog } from "@/components/vault/bulk-add-loot-dialog";
import { AddItemDialog } from "@/components/vault/add-item-dialog";
import { LootTable } from "@/components/vault/loot-table";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VaultPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const org = await prisma.org.findUnique({
    where: { id: session.user.orgId }
  });
  
  if (!org) return <div className="p-10 text-sc-red font-mono sc-glass border border-sc-red/20 uppercase tracking-widest text-xs">Org Context Corrupted</div>;

  const lootItems = await prisma.lootItem.findMany({
    where: { orgId: org.id },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-blue block shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            Org Loot Vault
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Current Inventory Status // {org.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/superadmin/manifest" className="flex items-center gap-2 px-4 py-2 bg-sc-gold/10 hover:bg-sc-gold/20 border border-sc-gold/30 text-sc-gold text-xs font-bold uppercase transition-all rounded">
            <Database className="w-4 h-4" />
            Global Manifest
          </a>
          <ImportButton orgId={org.id} />
          <AddItemDialog orgId={org.id} />
          <BulkAddLootDialog orgId={org.id} />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sc-glass p-4 flex flex-wrap items-center gap-4 border-b-2 border-sc-blue/30">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="SEARCH VAULT (UUID / NAME / CATEGORY)..." 
            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-2 text-xs font-mono text-sc-blue focus:outline-none focus:border-sc-blue/50 transition-colors uppercase tracking-widest"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors rounded">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors rounded">
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Loot Table */}
      <LootTable items={lootItems} orgId={org.id} />
    </div>
  );
}
