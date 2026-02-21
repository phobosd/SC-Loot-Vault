import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Find the specific Org for the logged in user
  const org = await prisma.org.findUnique({
    where: { id: session.user.orgId },
    include: {
      whitelabelConfig: true
    }
  });
  
  if (!org) return <div className="p-10 text-sc-red font-mono sc-glass border border-sc-red/20 uppercase tracking-widest text-xs">Org Context Corrupted // Please Contact SuperAdmin</div>;

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-700">
      <SettingsForm org={org} />
    </div>
  );
}
