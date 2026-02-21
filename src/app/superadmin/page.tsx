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
import { OrgRequestManager } from "@/components/superadmin/org-request-manager";
import { NexusCommandUI } from "@/components/superadmin/nexus-command-ui";

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
            {orgs.reduce((acc, org) => acc + (org._count?.users || 0), 0)}
          </p>
        </div>
        <div className="sc-glass p-6 rounded-lg border-sc-gold/30">
          <p className="text-[10px] text-sc-gold/60 font-mono uppercase">Total Global Items</p>
          <p className="text-3xl font-bold text-white mt-1">
            {orgs.reduce((acc, org) => acc + (org._count?.lootItems || 0), 0)}
          </p>
        </div>
      </div>

      <NexusCommandUI initialOrgs={orgs} />
    </div>
  );
}
