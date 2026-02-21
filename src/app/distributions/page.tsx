import { prisma } from "@/lib/prisma";
import { 
  RotateCw, 
  History, 
  Settings,
  AlertTriangle,
  Info
} from "lucide-react";
import { DrawingArea } from "@/components/distributions/drawing-area";
import { CreateSessionDialog } from "@/components/distributions/create-session-dialog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DistributionClientWrapper } from "@/components/distributions/distribution-client-wrapper";

export default async function DistributionsPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const org = session.user.orgId 
    ? await prisma.org.findUnique({ where: { id: session.user.orgId } })
    : null;

  const isGlobalAdmin = session.user.role === 'SUPERADMIN' && !session.user.orgId;

  // If not global admin and no org, then it's an error
  if (!org && !isGlobalAdmin) return <div>No Org context.</div>;

  const [inventory, recentLogs, localUsers, alliances] = await Promise.all([
    prisma.lootItem.findMany({
      where: isGlobalAdmin && !org ? { quantity: { gt: 0 } } : { orgId: org?.id || 'UNDEFINED', quantity: { gt: 0 } },
      orderBy: { name: 'asc' }
    }),
    prisma.distributionLog.findMany({
      where: isGlobalAdmin && !org ? { type: "ASSIGNED" } : { orgId: org?.id || 'UNDEFINED', type: "ASSIGNED" },
      include: { recipient: true },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.user.findMany({
      where: isGlobalAdmin && !org ? {} : { orgId: org?.id || 'UNDEFINED' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        org: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.alliance.findMany({
      where: { orgId: org?.id || 'UNDEFINED' },
      include: { 
        ally: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                org: { select: { name: true } }
              }
            }
          }
        }
      }
    })
  ]);

  // Consolidate all eligible participants (Local + Allied)
  const alliedUsers = alliances.flatMap(a => a.ally.users);
  const allEligibleParticipants = [...localUsers, ...alliedUsers];

  return (
    <DistributionClientWrapper 
      org={org || { name: "NEXUS CORE", id: "GLOBAL" }}
      inventory={inventory}
      recentLogs={recentLogs}
      allUsers={allEligibleParticipants}
      userRole={session.user.role}
    />
  );
}
