import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";
import { ApiKeyManager } from "@/components/settings/api-key-manager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session: any = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.orgId && session.user.role === 'SUPERADMIN') {
    redirect("/superadmin");
  }

  // Find the specific Org for the logged in user
  const orgRaw = await prisma.org.findUnique({
    where: { id: session.user.orgId },
    include: {
      whitelabelConfig: true,
      apiKeys: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!orgRaw) return <div className="p-10 text-sc-red font-mono sc-glass border border-sc-red/20 uppercase tracking-widest text-xs">Org Context Corrupted // Please Contact SuperAdmin</div>;

  // Mask keys
  const org = {
    ...orgRaw,
    apiKeys: orgRaw.apiKeys.map(k => ({
      ...k,
      key: `nx_••••••••${k.key.slice(-4)}`
    }))
  };

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-700 space-y-12">
      <SettingsForm org={org} />
      
      <div className="sc-glass border-sc-blue/20 p-8">
        <ApiKeyManager orgId={org.id} keys={org.apiKeys} />
      </div>
    </div>
  );
}
