export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  Heart
} from "lucide-react";
import { WishlistManager } from "@/components/wishlist/wishlist-manager";
import { User as NexusUser } from "@/lib/types";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions) as { user: NexusUser } | null;
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const orgId = session.user.orgId;

  // 1. Fetch User's Wishlist
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Fetch alliances to know which vaults to check
  let alliedOrgIds: string[] = [];
  if (orgId) {
    const alliances = await prisma.alliance.findMany({
      where: { orgId },
      select: { allyId: true }
    });
    alliedOrgIds = alliances.map(a => a.allyId);
  }

  const searchableOrgIds = orgId ? [orgId, ...alliedOrgIds] : [];

  // 3. Check availability for each wishlisted item
  // We'll fetch items from LootItem table that match names in wishlist and belong to reachable orgs
  const availableItems = await prisma.lootItem.findMany({
    where: {
      orgId: { in: searchableOrgIds },
      name: { in: wishlist.map(w => w.name) },
      quantity: { gt: 0 }
    },
    include: {
      org: { select: { id: true, name: true } }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase flex items-center gap-3">
            <Heart className="w-8 h-8 text-sc-red shadow-[0_0_15px_rgba(255,77,77,0.3)]" />
            Asset Wishlist
          </h1>
          <p className="text-xs text-sc-blue/60 mt-1 font-mono tracking-widest uppercase">
            Personnel Procurement Desires // {session.user.name}
          </p>
        </div>
      </div>

      <WishlistManager 
        initialWishlist={wishlist} 
        availableItems={availableItems}
        orgId={orgId || ""}
        userId={userId || ""}
      />
    </div>
  );
}
