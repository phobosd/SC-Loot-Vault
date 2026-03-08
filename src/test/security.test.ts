import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin, requireSuperAdmin, requireOrgAccess } from '@/lib/auth-checks';
import { getServerSession } from "next-auth";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe('Security Protocols (RBAC & Multi-Tenancy)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('RBAC Enforcement', () => {
    it('should allow ADMIN to access admin actions', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user1', role: 'ADMIN', orgId: 'org1' }
      });
      
      const user = await requireAdmin();
      expect(user.role).toBe('ADMIN');
    });

    it('should deny MEMBER from accessing admin actions', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user1', role: 'MEMBER', orgId: 'org1' }
      });
      
      await expect(requireAdmin()).rejects.toThrow('Forbidden: Administrator access required.');
    });

    it('should allow SUPERADMIN to access everything', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user1', role: 'SUPERADMIN', orgId: null }
      });
      
      const user = await requireSuperAdmin();
      expect(user.role).toBe('SUPERADMIN');
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should allow access to users own organization', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user1', role: 'ADMIN', orgId: 'org1' }
      });
      
      const user = await requireOrgAccess('org1');
      expect(user.orgId).toBe('org1');
    });

    it('should deny access to other organizations', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user1', role: 'ADMIN', orgId: 'org1' }
      });
      
      await expect(requireOrgAccess('org2')).rejects.toThrow("Forbidden: You do not have access to this organization's data.");
    });

    it('should allow SUPERADMIN to access any organization', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user1', role: 'SUPERADMIN', orgId: null }
      });
      
      const user = await requireOrgAccess('org2');
      expect(user.role).toBe('SUPERADMIN');
    });
  });
});
