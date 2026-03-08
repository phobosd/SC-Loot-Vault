import { describe, it, expect } from 'vitest';
import { 
  createUserSchema, 
  provisionOrgSchema, 
  addLootItemsSchema,
  createLootSessionSchema,
  assignItemToOperatorSchema,
  allianceOverrideSchema,
  rejectLootRequestSchema,
  updateUserRoleSchema,
  updateOrgSettingsSchema
} from './validations';

describe('Zod Validations', () => {
  describe('createUserSchema', () => {
    it('should validate a correct user object', () => {
      const result = createUserSchema.safeParse({
        username: 'TESTUSER',
        password: 'password123',
        name: 'Test User',
        role: 'MEMBER',
        orgId: 'cmmghvk0o000lhk3wyx8xka8s'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if password is too short', () => {
      const result = createUserSchema.safeParse({
        username: 'TESTUSER',
        password: '123',
        role: 'MEMBER',
        orgId: 'cmmghvk0o000lhk3wyx8xka8s'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('provisionOrgSchema', () => {
    it('should validate a correct org object', () => {
      const result = provisionOrgSchema.safeParse({
        name: 'Aegis Dynamics',
        slug: 'aegis-dynamics',
        requesterName: 'Chris Roberts',
        contactInfo: 'chris@aegis.sc'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if slug has invalid characters', () => {
      const result = provisionOrgSchema.safeParse({
        name: 'Aegis Dynamics',
        slug: 'Aegis Dynamics!',
        requesterName: 'Chris Roberts',
        contactInfo: 'chris@aegis.sc'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('addLootItemsSchema', () => {
    it('should validate correct loot items array', () => {
      const result = addLootItemsSchema.safeParse([{
        orgId: 'cmmghvk0o000lhk3wyx8xka8s',
        name: 'CF-117 Bulldog',
        category: 'Weapon',
        quantity: 5
      }]);
      expect(result.success).toBe(true);
    });

    it('should fail if quantity is negative', () => {
      const result = addLootItemsSchema.safeParse([{
        orgId: 'cmmghvk0o000lhk3wyx8xka8s',
        name: 'CF-117 Bulldog',
        category: 'Weapon',
        quantity: -1
      }]);
      expect(result.success).toBe(false);
    });
  });

  describe('createLootSessionSchema', () => {
    it('should validate a correct session object', () => {
      const result = createLootSessionSchema.safeParse({
        orgId: 'GLOBAL',
        title: 'XenoThreat Manifest',
        itemIds: ['cmmghvk0o000lhk3wyx8xka8s'],
        participantIds: ['cmmghvk0o000lhk3wyx8xka8s'],
        type: 'REEL',
        mode: 'OPERATORS'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if title is too short', () => {
      const result = createLootSessionSchema.safeParse({
        orgId: 'GLOBAL',
        title: 'XT',
        itemIds: ['cmmghvk0o000lhk3wyx8xka8s'],
        participantIds: ['cmmghvk0o000lhk3wyx8xka8s']
      });
      expect(result.success).toBe(false);
    });
  });

  describe('assignItemToOperatorSchema', () => {
    it('should validate a correct assignment', () => {
      const result = assignItemToOperatorSchema.safeParse({
        orgId: 'cmmghvk0o000lhk3wyx8xka8s',
        recipientId: 'cmmghvk0o000lhk3wyx8xka8s',
        lootItemId: 'cmmghvk0o000lhk3wyx8xka8s',
        itemName: 'FS-9 LMG',
        quantity: 1
      });
      expect(result.success).toBe(true);
    });
  });

  describe('allianceOverrideSchema', () => {
    it('should validate correct org IDs', () => {
      const result = allianceOverrideSchema.safeParse({
        org1Id: 'cmmghvk0o000lhk3wyx8xka8s',
        org2Id: 'cmmghvk0o000lhk3wyx8xka8t'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if IDs are not CUIDs', () => {
      const result = allianceOverrideSchema.safeParse({
        org1Id: 'invalid',
        org2Id: 'invalid'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('rejectLootRequestSchema', () => {
    it('should validate correct rejection', () => {
      const result = rejectLootRequestSchema.safeParse({
        requestId: 'cmmghvk0o000lhk3wyx8xka8s',
        reason: 'Insufficient contribution this cycle.'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if reason is empty', () => {
      const result = rejectLootRequestSchema.safeParse({
        requestId: 'cmmghvk0o000lhk3wyx8xka8s',
        reason: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserRoleSchema', () => {
    it('should validate correct role update', () => {
      const result = updateUserRoleSchema.safeParse({
        userId: 'cmmghvk0o000lhk3wyx8xka8s',
        role: 'ADMIN'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateOrgSettingsSchema', () => {
    it('should validate correct settings object', () => {
      const result = updateOrgSettingsSchema.safeParse({
        orgId: 'cmmghvk0o000lhk3wyx8xka8s',
        name: 'Aegis Dynamics',
        primaryColor: '#000000',
        accentColor: '#FFFFFF',
        secondaryColor: '#111111',
        successColor: '#222222',
        dangerColor: '#333333',
        textColor: '#444444',
        logoUrl: 'https://example.com/logo.png',
        headerText: 'Welcome',
        footerText: 'Goodbye'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if color is invalid', () => {
      const result = updateOrgSettingsSchema.safeParse({
        orgId: 'cmmghvk0o000lhk3wyx8xka8s',
        name: 'Aegis Dynamics',
        primaryColor: 'invalid',
        accentColor: '#FFFFFF',
        secondaryColor: '#111111',
        successColor: '#222222',
        dangerColor: '#333333',
        textColor: '#444444'
      });
      expect(result.success).toBe(false);
    });
  });
});
