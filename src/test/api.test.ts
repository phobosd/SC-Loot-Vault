import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getOrgMe } from '@/app/api/orgs/me/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    org: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe('API Security Probe', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should not include sensitive fields in orgs/me response', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user1', role: 'ADMIN', orgId: 'org1' }
    });

    vi.mocked(prisma.org.findUnique).mockResolvedValue({
      id: 'org1',
      name: 'Test Org',
      discordBotToken: 'SENSITIVE_TOKEN', // This shouldn't be here if 'select' is used correctly in the mock call, but we test the logic
      googleSheetId: 'SENSITIVE_ID'
    } as any);

    await getOrgMe();
    
    expect(prisma.org.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        id: true,
        name: true,
      })
    }));

    const selectArgs = vi.mocked(prisma.org.findUnique).mock.calls[0][0].select;
    expect(selectArgs.discordBotToken).toBeUndefined();
    expect(selectArgs.googleSheetId).toBeUndefined();
  });
});
