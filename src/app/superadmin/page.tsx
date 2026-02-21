import { prisma } from "@/lib/prisma";
import { 
  Building2, 
  Settings, 
  ExternalLink,
  Users,
  Package,
  LayoutGrid,
  History
} from "lucide-react";
import { ProvisionOrgDialog } from "@/components/superadmin/provision-org-dialog";
import { OrgRowActions } from "@/components/superadmin/org-row-actions";
import { OrgRequestManager } from "@/components/superadmin/org-request-manager";

export default async function SuperAdminPage() {
  let orgs: any[] = [];
  let requests: any[] = [];

  try {
    const [fetchedOrgs, fetchedRequests] = await Promise.all([
      prisma.org.findMany({
        include: {
          _count: {
            select: {
              users: true,
              lootItems: true
            }
          }
        }
      }),
      prisma.orgRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    orgs = fetchedOrgs;
    requests = fetchedRequests;
  } catch (error: any) {
    console.error("[NEXUS ERROR] Failed to fetch data:", error.message);
    // Fallback to empty arrays if DB is unavailable
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-sc-blue shadow-[0_0_15px_rgba(0,209,255,0.3)]" />
            Galactic Nexus Command
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Multi-Tenant Org Management // GLOBAL ROOT ACCESS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs font-bold uppercase transition-all rounded">
            <History className="w-4 h-4" /> Nexus Audit
          </button>
          <ProvisionOrgDialog />
        </div>
      </div>

      {/* Incoming Requests Section */}
      <OrgRequestManager requests={requests} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="sc-glass p-6 rounded-lg border-sc-blue/30">
          <p className="text-[10px] text-sc-blue/60 font-mono uppercase">Total Organizations</p>
          <p className="text-3xl font-bold text-white mt-1">{orgs.length}</p>
        </div>
        <div className="sc-glass p-6 rounded-lg border-sc-green/30">
          <p className="text-[10px] text-sc-green/60 font-mono uppercase">Total Global Users</p>
          <p className="text-3xl font-bold text-white mt-1">
            {orgs.reduce((acc, org) => acc + org._count.users, 0)}
          </p>
        </div>
        <div className="sc-glass p-6 rounded-lg border-sc-gold/30">
          <p className="text-[10px] text-sc-gold/60 font-mono uppercase">Total Global Items</p>
          <p className="text-3xl font-bold text-white mt-1">
            {orgs.reduce((acc, org) => acc + org._count.lootItems, 0)}
          </p>
        </div>
      </div>

      {/* Orgs List */}
      <div className="sc-glass border-sc-border/20 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-sc-blue/5 border-b border-sc-blue/20">
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Organization</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Slug / Endpoint</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Users</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-center">Inventory</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-sc-blue uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orgs.map((org) => (
              <tr key={org.id} className="group hover:bg-sc-blue/[0.03] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sc-hud-corner bg-sc-blue/5 flex items-center justify-center border border-sc-blue/20">
                      <Building2 className="w-5 h-5 text-sc-blue/60" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-wide">{org.name}</p>
                      <p className="text-[9px] text-gray-500 font-mono">ID: {org.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-sc-blue underline cursor-pointer">
                      {org.slug}.vault.local
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-700" />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-3 h-3 text-gray-600" />
                    <span className="text-xs font-mono text-white">{org._count.users}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Package className="w-3 h-3 text-gray-600" />
                    <span className="text-xs font-mono text-white">{org._count.lootItems}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sc-green shadow-[0_0_8px_rgba(0,255,194,0.5)]" />
                    <span className="text-[9px] font-bold text-sc-green uppercase">Operational</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <OrgRowActions org={org} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
