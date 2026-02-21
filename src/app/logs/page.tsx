import { prisma } from "@/lib/prisma";
import { LogTable } from "@/components/logs/log-table";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LogsPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const org = session.user.orgId 
    ? await prisma.org.findUnique({ where: { id: session.user.orgId } })
    : null;

  const isGlobalAdmin = session.user.role === 'SUPERADMIN' && !session.user.orgId;

  if (!org && !isGlobalAdmin) return <div className="p-10 text-sc-red font-mono sc-glass border border-sc-red/20">Org Context Not Found.</div>;

  const logs = await prisma.distributionLog.findMany({
    where: isGlobalAdmin && !org ? {} : { orgId: org?.id || 'UNDEFINED' },
    orderBy: { timestamp: 'desc' },
    include: {
      recipient: true
    }
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-blue block shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            Audit Logs & History
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            {isGlobalAdmin && !org ? "GLOBAL TRANSACTION MANIFEST" : `Transaction Manifest // ${org?.name}`}
          </p>
        </div>
      </div>

      <LogTable initialLogs={logs} />
    </div>
  );
}
