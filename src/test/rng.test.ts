import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startGlobalSpin, finalizeGlobalSession } from '@/app/actions/distribution';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lootSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lootItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    distributionLog: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe('RNG & Assignment Protocol', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin1', role: 'ADMIN', orgId: 'org1', username: 'ADMIN_USER' }
    });
  });

  describe('startGlobalSpin', () => {
    it('should determine a winner and set animation state', async () => {
      const sessionId = 'cmmghvk0o000lhk3wyx8xka8s';
      vi.mocked(prisma.lootSession.findUnique).mockResolvedValue({
        id: sessionId,
        status: 'ACTIVE',
        mode: 'OPERATORS',
        participants: [{ userId: 'user1' }, { userId: 'user2' }],
        items: [{ id: 'item1', name: 'Asset 1' }]
      } as any);

      const result = await startGlobalSpin(sessionId);
      if (!result.success) console.log('startGlobalSpin Error:', (result as any).error);
      
      expect(result.success).toBe(true);
      expect(prisma.lootSession.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: sessionId },
        data: expect.objectContaining({
          status: 'SPINNING',
          currentWinnerId: expect.any(String),
          animationState: expect.any(String)
        })
      }));
    });
  });

  describe('finalizeGlobalSession', () => {
    it('should assign all items in OPERATORS mode', async () => {
      const sessionId = 'cmmghvk0o000lhk3wyx8xka8s';
      vi.mocked(prisma.lootSession.findUnique).mockResolvedValue({
        id: sessionId,
        orgId: 'org1',
        mode: 'OPERATORS',
        currentWinnerId: 'user1',
        participants: [{ userId: 'user1', user: { name: 'Winner' } }],
        items: [
          { itemId: 'vaultItem1', name: 'Item 1' },
          { itemId: 'vaultItem2', name: 'Item 2' }
        ]
      } as any);

      vi.mocked(prisma.lootItem.findUnique).mockResolvedValue({ id: 'v1', quantity: 1 } as any);

      const result = await finalizeGlobalSession(sessionId);
      if (!result.success) console.log('finalizeGlobalSession Error:', (result as any).error);

      expect(result.success).toBe(true);
      expect(prisma.distributionLog.createMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ itemName: 'Item 1', recipientId: 'user1' }),
          expect.objectContaining({ itemName: 'Item 2', recipientId: 'user1' })
        ])
      }));
    });
  });
});
