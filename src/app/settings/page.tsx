import { prisma } from "@/lib/prisma";
import { 
  Settings, 
  Palette, 
  Monitor, 
  Lock, 
  Save, 
  Trash2, 
  ShieldAlert,
  Fingerprint,
  Zap,
  Layout
} from "lucide-react";

export default async function SettingsPage() {
  const org = await prisma.org.findFirst({
    include: {
      whitelabelConfig: true
    }
  });
  
  if (!org) return <div>No Org found.</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-sc-blue block shadow-[0_0_15px_rgba(0,209,255,0.5)]" />
            Admin System Control
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Vault Parameters // SEC-LVL-SUPER
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-sc-blue/20 hover:bg-sc-blue/30 border border-sc-blue/50 text-sc-blue text-xs font-bold uppercase transition-all rounded shadow-[0_0_15px_rgba(0,209,255,0.2)]">
            <Save className="w-4 h-4" />
            Sync All Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Whitelabeling Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="sc-glass p-8 rounded-lg relative overflow-hidden border-sc-blue/20">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-sc-blue mb-6 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Visual Identity (Whitelabel)
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Org Name Display</label>
                  <input 
                    type="text" 
                    defaultValue={org.name} 
                    className="w-full bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Platform Slug</label>
                  <input 
                    type="text" 
                    defaultValue={org.slug} 
                    disabled
                    className="w-full bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-gray-700 focus:outline-none opacity-50 cursor-not-allowed"
                  />
                  <p className="text-[8px] text-gray-600 italic">Unique identifier used for routing and tunneling.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Primary HUD Color</label>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded border border-white/20" style={{ backgroundColor: org.primaryColor }} />
                    <input 
                      type="text" 
                      defaultValue={org.primaryColor} 
                      className="flex-1 bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Accent HUD Color</label>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded border border-white/20" style={{ backgroundColor: org.accentColor }} />
                    <input 
                      type="text" 
                      defaultValue={org.accentColor} 
                      className="flex-1 bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Logo Resource URL</label>
                <input 
                  type="text" 
                  defaultValue={org.logoUrl || ""} 
                  placeholder="https://imgur.com/your-logo.png"
                  className="w-full bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-blue/50"
                />
              </div>
            </div>
          </div>

          <div className="sc-glass sc-hud-border p-6 rounded-lg border-sc-gold/20 bg-sc-gold/[0.02]">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-sc-gold mb-6 flex items-center gap-2">
              <Layout className="w-4 h-4" /> Global Platform Overrides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Header Branding</label>
                <input 
                  type="text" 
                  defaultValue={org.whitelabelConfig?.headerText || ""} 
                  className="w-full bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Footer Branding</label>
                <input 
                  type="text" 
                  defaultValue={org.whitelabelConfig?.footerText || ""} 
                  className="w-full bg-black/40 border border-white/10 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-sc-gold/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Info Sidebar */}
        <div className="space-y-6">
          <div className="sc-glass p-6 rounded-lg border-sc-blue/20">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-blue mb-6 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Technical Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[9px] text-gray-500 uppercase font-mono">SQLite Engine</span>
                <span className="text-[10px] text-sc-blue font-bold">V3.41.2</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[9px] text-gray-500 uppercase font-mono">ORM Connection</span>
                <span className="text-[10px] text-sc-green font-bold uppercase">SECURE</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[9px] text-gray-500 uppercase font-mono">Environment</span>
                <span className="text-[10px] text-sc-gold font-bold uppercase">Development</span>
              </div>
            </div>
          </div>

          <div className="sc-glass p-6 rounded-lg border-sc-red/30 bg-sc-red/[0.02]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-sc-red mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Danger Zone
            </h3>
            <div className="space-y-4">
              <p className="text-[9px] text-sc-red/60 font-mono uppercase leading-tight italic">
                The following actions are irreversible and will result in significant data loss across the organization manifest.
              </p>
              <button className="w-full py-3 bg-sc-red/10 hover:bg-sc-red/20 border border-sc-red/30 text-sc-red text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded flex items-center justify-center gap-2">
                <Fingerprint className="w-4 h-4" /> Wipe Item Manifest
              </button>
              <button className="w-full py-3 bg-white/5 hover:bg-sc-red/10 border border-white/10 hover:border-sc-red/30 text-white hover:text-sc-red text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Decommission Org
              </button>
            </div>
          </div>

          <div className="sc-glass p-4 rounded border-sc-blue/10">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-sc-blue animate-pulse" />
              <div>
                <p className="text-[9px] text-sc-blue font-bold uppercase tracking-widest">Auto-Scale Active</p>
                <p className="text-[8px] text-gray-500 uppercase">System will expand as loot increases.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
