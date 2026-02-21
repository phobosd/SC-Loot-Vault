import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  TrendingUp, 
  Package, 
  Users, 
  UserPlus,
  Zap,
  Box,
  Cpu,
  Trophy,
  ArrowRight,
  Plus
} from "lucide-react";
import { LootRequestManager } from "@/components/dashboard/loot-request-manager";
import { AddItemDialog } from "@/components/vault/add-item-dialog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const org = session.user.orgId 
    ? await prisma.org.findUnique({ where: { id: session.user.orgId } })
    : null;

  const isGlobalAdmin = session.user.role === 'SUPERADMIN' && !session.user.orgId;

  // Fetch pending alliance requests for local org admin
  const allianceRequests = org ? await prisma.allianceRequest.findMany({
    where: { targetOrgId: org.id, status: "PENDING" },
    include: { sender: true }
  }) : [];

  // Fetch pending users for local org admin or global admin
  const pendingUsers = await prisma.user.count({
    where: isGlobalAdmin ? { status: "PENDING" } : { orgId: org?.id, status: "PENDING" }
  });

  // Logic for data fetching: Global Admin (Global) vs Org Admins/MEMBER (Local)
  const [itemCount, userCount, recentLogs, pendingRequests] = await Promise.all([
    prisma.lootItem.count({ 
      where: isGlobalAdmin && !org ? {} : { orgId: org?.id || 'UNDEFINED' } 
    }),
    prisma.user.count({ 
      where: isGlobalAdmin && !org ? {} : { orgId: org?.id || 'UNDEFINED' } 
    }),
    prisma.distributionLog.findMany({
      where: isGlobalAdmin && !org ? {} : { orgId: org?.id || 'UNDEFINED' },
      take: 5,
      orderBy: { timestamp: 'desc' }
    }),
    prisma.lootRequest.findMany({
      where: isGlobalAdmin ? { status: "PENDING" } : { orgId: org?.id || 'UNDEFINED', status: "PENDING" },
      include: {
        user: true,
        org: true 
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const stats = [
    { name: isGlobalAdmin && !org ? "Network Assets" : "Total Items", value: itemCount.toString(), icon: Package, color: "text-sc-blue", href: "/superadmin/manifest" },
    { name: isGlobalAdmin && !org ? "Global Personnel" : "Org Members", value: userCount.toString(), icon: Users, color: "text-sc-green", href: "/users" },
    { name: "Recent Draws", value: recentLogs.length.toString(), icon: Trophy, color: "text-sc-gold", href: "/logs" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase font-mono">
            {isGlobalAdmin && !org ? "Nexus Core Dashboard" : "Command Dashboard"}
          </h1>
          <p className="text-sm text-sc-blue/60 mt-2 font-mono tracking-wider uppercase">
            SYSTEM STATUS: {isGlobalAdmin && !org ? "MONITORING GLOBAL NETWORK" : `MONITORING VAULT // ${org?.name}`} // ACCESS: {session.user.role}
          </p>
        </div>
        <div className="sc-glass px-4 py-2 border-sc-blue/30 rounded flex items-center gap-3">
          <Zap className="w-4 h-4 text-sc-gold animate-pulse" />
          <span className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em]">Live Data Sync: ACTIVE</span>
        </div>
      </div>

      {/* Alliance Handshake Alert */}
      {allianceRequests.length > 0 && (
        <Link href="/alliances" className="block p-4 bg-sc-gold/10 border border-sc-gold/30 rounded flex items-center justify-between hover:bg-sc-gold/20 transition-all group animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sc-hud-corner bg-sc-gold/5 flex items-center justify-center border border-sc-gold/20">
              <Zap className="w-5 h-5 text-sc-gold animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-sc-gold/60 uppercase tracking-widest">Incoming Diplomatic Handshake</p>
              <p className="text-sm font-bold text-white uppercase">{allianceRequests[0].sender.name} requests an alliance protocol</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-sc-gold uppercase tracking-widest group-hover:gap-4 transition-all">
            Review Request <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      )}

      {pendingUsers > 0 && (
        <Link href="/users" className="block p-4 bg-sc-blue/10 border border-sc-blue/30 rounded flex items-center justify-between hover:bg-sc-blue/20 transition-all group animate-in slide-in-from-top-4 duration-500 delay-75">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sc-hud-corner bg-sc-blue/5 flex items-center justify-center border border-sc-blue/20">
              <UserPlus className="w-5 h-5 text-sc-blue animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-sc-blue/60 uppercase tracking-widest">Personnel Authorization Pending</p>
              <p className="text-sm font-bold text-white uppercase">{pendingUsers} operator designation(s) awaiting approval</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-sc-blue uppercase tracking-widest group-hover:gap-4 transition-all">
            Review Personnel <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      )}

      {/* Pending Requests Section (Admins Only) */}
      {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
        <LootRequestManager requests={pendingRequests} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="sc-glass sc-hud-corner p-6 transition-all hover:border-sc-blue/40 hover:bg-sc-blue/[0.05] group block">
            <div className="flex items-center justify-between">
              <stat.icon className={`w-8 h-8 ${stat.color} opacity-80 group-hover:scale-110 transition-transform`} />
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{stat.name}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 sc-glass sc-hud-border p-6 rounded-lg">
          <h3 className="text-sm font-bold uppercase tracking-widest text-sc-blue mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Recent Activity Log
          </h3>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <div className="py-10 text-center text-gray-600 font-mono uppercase text-xs">
                No recent distributions detected in log.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-white/5 hover:bg-white/5 px-2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-sc-blue/10 border border-sc-blue/30 flex items-center justify-center rounded">
                      <Box className="w-4 h-4 text-sc-blue/80" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{log.itemName}</p>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">Method: {log.method} // Action: {log.type}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-sc-blue/40 font-mono">{log.timestamp.toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="sc-glass p-6 rounded-lg border-sc-gold/20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-gold mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <Link href="/distributions" className="block w-full text-left py-3 px-4 rounded bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/30 text-sc-blue text-xs font-bold uppercase tracking-widest transition-all">
                Start RNG Drawing
              </Link>
              {org && (
                <AddItemDialog 
                  orgId={org.id} 
                  trigger={
                    <button className="w-full text-left py-3 px-4 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all">
                      Manual Item Entry
                    </button>
                  } 
                />
              )}
              <Link href="/superadmin/manifest" className="block w-full text-left py-3 px-4 rounded bg-sc-gold/10 hover:bg-sc-gold/20 border border-sc-gold/30 text-sc-gold text-xs font-bold uppercase tracking-widest transition-all">
                Browse Global Manifest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
