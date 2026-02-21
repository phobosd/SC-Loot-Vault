import { prisma } from "@/lib/prisma";
import { 
  Bot, 
  Terminal, 
  ShieldCheck,
  Command,
} from "lucide-react";
import { DiscordBotUI } from "@/components/discord/discord-bot-ui";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DiscordBotPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.orgId && session.user.role === 'SUPERADMIN') {
    redirect("/superadmin");
  }

  const org = await prisma.org.findUnique({
    where: { id: session.user.orgId },
    include: {
      whitelabelConfig: true
    }
  });
  
  if (!org) return <div>No Org context detected.</div>;

  const botCommands = [
    { name: "/help", description: "Display available commands and bridge protocols.", role: "Public" },
    { name: "/link-account [designation]", description: "Link Discord ID to your Vault Operator designation.", role: "Public" },
    { name: "/my-assets", description: "View all gear currently assigned to your personnel manifest.", role: "Public" },
    { name: "/request-asset [item]", description: "Request an asset from the vault (Requires linked account).", role: "Public" },
    { name: "/vault-status", description: "Immersive telemetry report on vault health.", role: "Public" },
    { name: "/loot-search [query]", description: "Search for specific items in the organization manifest.", role: "Public" },
    { name: "/personnel", description: "View a manifest of all registered operators (Admin Only).", role: "Admin" },
  ];

  // Real-time status check (within last 2 minutes)
  const isOnline = org.discordBotLastSeen 
    ? (new Date().getTime() - new Date(org.discordBotLastSeen).getTime()) < 120000 
    : false;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-[#5865F2] block shadow-[0_0_15px_rgba(88,101,242,0.5)]" />
            Discord Bot Interface
          </h1>
          <p className="text-xs text-[#5865F2]/60 mt-1 font-mono tracking-widest uppercase">
            Comms Integration // SEC-BOT-V1
          </p>
        </div>
      </div>

      <DiscordBotUI org={org} botCommands={botCommands} isOnline={isOnline} />
    </div>
  );
}
