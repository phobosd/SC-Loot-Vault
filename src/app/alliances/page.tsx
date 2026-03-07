export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  X, 
  Check, 
  ShieldAlert,
  Handshake,
  Globe,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AllianceManagerUI } from "@/components/alliances/alliance-manager-ui";
import { SuperAdminAllianceManagerUI } from "@/components/superadmin/superadmin-alliance-manager-ui";

export default async function AlliancesPage() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isGlobalAdmin = session.user.role === 'SUPERADMIN' && !session.user.orgId;

  if (isGlobalAdmin) {
    const [orgs, alliances] = await Promise.all([
      prisma.org.findMany({ orderBy: { name: 'asc' } }),
      prisma.alliance.findMany({
        include: {
          org: { select: { id: true, name: true } },
          ally: { select: { id: true, name: true } }
        }
      })
    ]);

    // De-duplicate alliances for display (since they are stored bi-directionally)
    const seen = new Set();
    const uniqueAlliances = alliances.filter(a => {
      const pair = [a.orgId, a.allyId].sort().join('-');
      if (seen.has(pair)) return false;
      seen.add(pair);
      return true;
    });

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-sc-red" />
              Global Alliance Command
            </h1>
            <p className="text-xs text-sc-red/60 mt-1 font-mono tracking-widest uppercase">
              Network-Wide Diplomatic Registry // GLOBAL ROOT
            </p>
          </div>
        </div>

        <SuperAdminAllianceManagerUI 
          orgs={orgs} 
          alliances={uniqueAlliances}
        />
      </div>
    );
  }

  const org = await prisma.org.findUnique({
    where: { id: session.user.orgId },
    include: {
      alliances: {
        include: {
          ally: true
        }
      },
      receivedAllianceRequests: {
        where: { status: "PENDING" },
        include: {
          sender: true
        }
      },
      sentAllianceRequests: {
        where: { status: "PENDING" },
        include: {
          target: true
        }
      }
    }
  });

  if (!org) return <div>Org not found.</div>;

  // Fetch all other orgs for the "Find Allies" list
  const otherOrgs = await prisma.org.findMany({
    where: {
      id: { not: session.user.orgId },
      // Not already allied
      alliedWith: {
        none: { orgId: session.user.orgId }
      },
      // No pending requests
      receivedAllianceRequests: {
        none: { senderOrgId: session.user.orgId, status: "PENDING" }
      }
    }
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <Handshake className="w-8 h-8 text-sc-blue" />
            Alliance Network
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Diplomatic Relations // {org.name}
          </p>
        </div>
      </div>

      <AllianceManagerUI 
        org={org} 
        otherOrgs={otherOrgs}
      />
    </div>
  );
}
