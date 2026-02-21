import { prisma } from "@/lib/prisma";
import { 
  Bot, 
  Settings, 
  Terminal, 
  ShieldCheck,
  ExternalLink,
  Copy,
  Command,
  ChevronRight,
  Zap,
  Lock
} from "lucide-react";
import { BotConfigForm } from "@/components/discord/bot-config-form";

export default async function DiscordBotPage() {
  const org = await prisma.org.findFirst();
  
  if (!org) return <div>No Org found.</div>;

  const botCommands = [
    { name: "/loot search", description: "Search the current DIXNCOX vault inventory.", role: "Public" },
    { name: "/vault status", description: "Show a summary of the vault health and total items.", role: "Public" },
    { name: "/drawing join", description: "Join an active loot drawing event.", role: "Public" },
    { name: "/giveaway start", description: "Initiate a new drawing for an item (Admin only).", role: "Admin" },
    { name: "/loot add", description: "Quickly add items found in the verse (Admin only).", role: "Admin" },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <BotConfigForm 
            orgId={org.id} 
            initialToken={org.discordBotToken} 
            initialGuildId={org.discordGuildId} 
          />

          <div className="sc-glass sc-hud-border p-6 rounded-lg border-sc-blue/20">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-sc-blue mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Command Documentation
            </h3>
            <div className="space-y-2">
              {botCommands.map((cmd) => (
                <div key={cmd.name} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group hover:bg-white/5 px-2 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="px-2 py-1 bg-black/40 border border-sc-blue/30 rounded font-mono text-xs text-sc-blue font-bold">
                      {cmd.name}
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{cmd.description}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                    cmd.role === 'Admin' ? 'border-sc-red/30 text-sc-red' : 'border-sc-green/30 text-sc-green'
                  }`}>
                    {cmd.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Setup Guide */}
        <div className="space-y-6">
          <div className="sc-glass p-6 rounded-lg border-sc-gold/20 bg-sc-gold/[0.02]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-gold mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Protocol Manual
            </h3>
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="space-y-3 relative pl-6 border-l border-sc-gold/30">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sc-gold text-black text-[10px] font-bold flex items-center justify-center">1</span>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Application Creation</p>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                  Access the Discord Developer Portal and initiate a "New Application". Use your Org designation for the name.
                </p>
                <a href="https://discord.com/developers/applications" target="_blank" className="inline-flex items-center gap-2 px-3 py-1 bg-sc-gold/10 border border-sc-gold/20 text-sc-gold text-[9px] font-bold uppercase hover:bg-sc-gold/20 transition-all rounded">
                  Developer Portal <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Step 2 */}
              <div className="space-y-3 relative pl-6 border-l border-sc-gold/30">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sc-gold text-black text-[10px] font-bold flex items-center justify-center">2</span>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Token Acquisition</p>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                  Navigate to the <span className="text-sc-gold">"Bot"</span> tab in the sidebar. Click <span className="text-sc-gold">"Reset Token"</span> to generate your unique encryption key. Copy this into the "Bot Token" field on this page.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-3 relative pl-6 border-l border-sc-gold/30">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sc-gold text-black text-[10px] font-bold flex items-center justify-center">3</span>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Privileged Intents</p>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                  Scroll down in the "Bot" tab to the <span className="text-sc-gold">"Privileged Gateway Intents"</span> section. You MUST enable <span className="text-white">Server Members Intent</span> and <span className="text-white">Message Content Intent</span> for the manifest bridge to function.
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-3 relative pl-6 border-l border-sc-gold/30">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sc-gold text-black text-[10px] font-bold flex items-center justify-center">4</span>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Server Bridge (Invite)</p>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                  Navigate to <span className="text-sc-gold">"OAuth2"</span> → <span className="text-sc-gold">"URL Generator"</span>. Select the following scopes:
                </p>
                <div className="p-2 bg-black/40 border border-white/5 rounded text-[8px] font-mono text-gray-400 space-y-1 uppercase">
                  <p>• bot</p>
                  <p>• applications.commands</p>
                </div>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                  Under "Bot Permissions", select <span className="text-white">Administrator</span> or custom permissions including Manage Messages and Read/Write. Use the generated URL to invite the bot.
                </p>
              </div>

              {/* Step 5 */}
              <div className="space-y-3 relative pl-6 border-l border-sc-gold/30">
                <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-sc-gold text-black text-[10px] font-bold flex items-center justify-center">5</span>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Operational Verification</p>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                  Initiate the bridge node from your Mac mini terminal:
                </p>
                <div className="p-2 bg-black/40 border border-sc-blue/30 rounded text-[8px] font-mono text-sc-blue uppercase">
                  npx ts-node scripts/run-bot.ts
                </div>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                  Once the terminal shows <span className="text-sc-green">NODE ONLINE</span>, navigate to your Discord server and type:
                </p>
                <div className="p-2 bg-black/40 border border-white/5 rounded text-[8px] font-mono text-white uppercase tracking-widest">
                  !vault status
                </div>
                <p className="text-[9px] text-gray-500 font-mono leading-relaxed italic">
                  If the bot replies with telemetry data, the manifest bridge is successfully established.
                </p>
              </div>
            </div>
          </div>

          <div className="sc-glass p-6 rounded-lg border-[#5865F2]/30">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#5865F2] mb-4 flex items-center gap-2">
              <Command className="w-4 h-4" /> Quick Info
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-black/40 rounded border border-white/5">
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter mb-2">Bot Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sc-red animate-pulse" />
                  <span className="text-[10px] font-bold text-sc-red uppercase">OFFLINE</span>
                </div>
              </div>
              <div className="p-3 bg-black/40 rounded border border-white/5">
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter mb-2">Endpoint URL</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-gray-600 truncate uppercase">https://{org.slug}.vault-tunnel.xyz</span>
                  <Copy className="w-3 h-3 text-gray-700 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
