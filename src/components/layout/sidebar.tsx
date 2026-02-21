"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  Database, 
  Package, 
  RotateCw, 
  History, 
  Users, 
  Settings, 
  Bot,
  ChevronRight,
  LogOut,
  ShieldCheck,
  UserCheck,
  Building2,
  Ghost,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: Database },
  { name: "Org Loot", href: "/vault", icon: Package },
  { name: "Assigned Assets", href: "/assigned", icon: UserCheck },
  { name: "Galactic Manifest", href: "/superadmin/manifest", icon: Database },
  { name: "Distributions", href: "/distributions", icon: RotateCw },
  { name: "Logs & History", href: "/logs", icon: History },
  { name: "Personnel", href: "/users", icon: Users },
  { name: "Discord Bot", href: "/discord", icon: Bot, role: ["ADMIN", "SUPERADMIN"] },
  { name: "Admin Settings", href: "/settings", icon: Settings, role: ["ADMIN", "SUPERADMIN"] },
  { name: "Galactic Nexus", href: "/superadmin", icon: Building2, role: ["SUPERADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, update }: any = useSession();

  const user = session?.user;

  const handleStopImpersonating = async () => {
    await update({ stopImpersonating: true });
    window.location.href = "/superadmin";
  };

  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-full sc-glass border-r border-sc-border z-10">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sc-hud-corner flex items-center justify-center">
            <div className="w-6 h-6 bg-sc-blue opacity-50 blur-[2px]" />
          </div>
          <div>
            <h1 className="font-bold text-sc-blue tracking-widest text-lg">DIXNCOX</h1>
            <p className="text-[10px] text-sc-blue/60 tracking-tighter uppercase">Org Loot Vault</p>
          </div>
        </div>
      </div>

      {/* Impersonation Banner */}
      {user?.isImpersonating && (
        <div className="mx-4 mb-4 p-3 bg-sc-red/10 border border-sc-red/30 rounded animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 mb-2">
            <Ghost className="w-3 h-3 text-sc-red animate-pulse" />
            <p className="text-[9px] font-bold text-sc-red uppercase tracking-widest">Impersonation Active</p>
          </div>
          <button 
            onClick={handleStopImpersonating}
            className="w-full py-1.5 bg-sc-red/20 hover:bg-sc-red/30 border border-sc-red/50 text-sc-red text-[8px] font-black uppercase tracking-widest transition-all rounded shadow-[0_0_10px_rgba(255,0,0,0.1)]"
          >
            End Protocol
          </button>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // Check role access
          if (item.role && !item.role.includes(user?.role)) return null;

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-3 text-sm font-medium transition-all duration-200 border-l-2",
                isActive 
                  ? "bg-sc-blue/10 border-sc-blue text-sc-blue" 
                  : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", isActive ? "text-sc-blue" : "text-gray-500 group-hover:text-gray-300")} />
                {item.name}
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sc-border/50 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-sc-border/20">
          <div className="w-8 h-8 rounded-full bg-sc-blue/20 border border-sc-blue/40 flex items-center justify-center text-sc-blue text-xs overflow-hidden">
            {user?.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.substring(0, 2).toUpperCase() || "UN"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || "Unknown User"}</p>
            <p className="text-[10px] text-gray-500 truncate uppercase tracking-tighter">{user?.role || "MEMBER"}</p>
          </div>
        </div>
        
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-sc-red/60 hover:text-sc-red hover:bg-sc-red/10 border border-transparent hover:border-sc-red/20 rounded transition-all uppercase tracking-[0.2em]"
        >
          <LogOut className="w-3 h-3" />
          Terminate Session
        </button>
      </div>
    </div>
  );
}
