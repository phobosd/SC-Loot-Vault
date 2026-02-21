import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/components/providers/session-provider";
import { RouteSync } from "@/components/layout/route-sync";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SC Org Loot Vault",
  description: "Star Citizen Organization Loot Vault Manager",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session: any = await getServerSession(authOptions);
  let themeStyles: any = {};

  if (session?.user?.orgId) {
    const org = await prisma.org.findUnique({
      where: { id: session.user.orgId }
    });
    if (org) {
      const accent = org.accentColor || "#00D1FF";
      const primary = org.primaryColor || "#05050A";
      const secondary = org.secondaryColor || "#E0B130";
      const success = org.successColor || "#00FFC2";
      const danger = org.dangerColor || "#FF4D4D";
      const text = org.textColor || "#FFFFFF";

      const accentRgb = hexToRgb(accent);
      const primaryRgb = hexToRgb(primary);
      const secondaryRgb = hexToRgb(secondary);
      const successRgb = hexToRgb(success);
      const dangerRgb = hexToRgb(danger);
      
      themeStyles = {
        "--sc-blue": accent,
        "--sc-blue-rgb": accentRgb,
        "--sc-bg": primary,
        "--sc-bg-rgb": primaryRgb,
        "--sc-gold": secondary,
        "--sc-gold-rgb": secondaryRgb,
        "--sc-green": success,
        "--sc-green-rgb": successRgb,
        "--sc-red": danger,
        "--sc-red-rgb": dangerRgb,
        "--sc-text": text,
        "--sc-border": `rgba(${accentRgb}, 0.2)`,
        "--sc-surface": `rgba(${primaryRgb}, 0.85)`,
      };
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex overflow-hidden`}
        style={themeStyles}
      >
        <AuthProvider>
          <Suspense fallback={null}>
            <RouteSync />
          </Suspense>
          <Sidebar />
          <main className="flex-1 flex flex-col h-full bg-[var(--sc-bg,#05050A)] overflow-y-auto">
            {/* Top Bar (HUD Elements) */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-sc-border/20 bg-black/30 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="flex gap-1 h-3">
                  <div className="w-1 h-full bg-sc-blue/20" />
                  <div className="w-1 h-full bg-sc-blue/40" />
                  <div className="w-1 h-full bg-sc-blue/60" />
                </div>
                <h2 className="text-xs uppercase tracking-[0.3em] font-medium text-sc-blue/80">Vault Monitor // SEC-LV1</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <p className="text-[10px] text-sc-blue font-mono">SYSTEM STATUS: <span className="text-sc-green">OPTIMAL</span></p>
                  <p className="text-[8px] text-sc-blue/40 font-mono tracking-widest">ENCRYPTION ACTIVE: AES-256-X</p>
                </div>
                <div className="w-px h-8 bg-sc-border/30" />
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-sc-green shadow-[0_0_8px_rgba(0,255,194,0.5)]" />
                </div>
              </div>
            </header>
            
            <div className="p-8">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "0, 209, 255";
}
