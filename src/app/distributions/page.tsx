import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DistributionClientWrapper } from "@/components/distributions/distribution-client-wrapper";
import { User as NexusUser } from "@/lib/types";

export default async function DistributionsPage() {
  const session = await getServerSession(authOptions) as { user: NexusUser } | null;
  
  if (!session?.user) {
    redirect("/login");
  }

  const isGlobalAdmin = session.user.role === 'SUPERADMIN' && !session.user.orgId;

  if (isGlobalAdmin) {
    redirect("/dashboard");
  }

  const org = await prisma.org.findUnique({ where: { id: session.user.orgId || undefined } });
  if (!org) return <div>No Org context.</div>;

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

  // 4. Fetch Active Sessions for this Org or User
  const activeSessions = await prisma.lootSession.findMany({
    where: {
      ...(org ? { orgId: org.id } : {}),
      status: { in: ["ACTIVE", "SPINNING"] }
    },
    include: {
      participants: {
        include: { user: { select: { name: true, username: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <DistributionClientWrapper 
      org={org || { name: "NEXUS CORE", id: "GLOBAL" }}
      inventory={inventory}
      recentLogs={recentLogs}
      allUsers={allEligibleParticipants}
      userRole={session.user.role || 'MEMBER'}
      initialActiveSessions={activeSessions}
    />
  );
}
