import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/components/providers/session-provider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex overflow-hidden`}
      >
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col h-full bg-[#05050A] overflow-y-auto">
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
