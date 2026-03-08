import { describe, it, expect } from 'vitest';
import { cn, hexToRgb, seededRandom } from './utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'py-2')).toBe('px-2 py-2');
      expect(cn('px-2', false && 'py-2')).toBe('px-2');
      expect(cn('px-2', 'px-4')).toBe('px-4'); // Tailwind merge logic
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex colors to RGB strings', () => {
      expect(hexToRgb('#00D1FF')).toBe('0, 209, 255');
      expect(hexToRgb('#05050A')).toBe('5, 5, 10');
      expect(hexToRgb('#FFFFFF')).toBe('255, 255, 255');
    });

    it('should handle hex without # prefix', () => {
      expect(hexToRgb('00D1FF')).toBe('0, 209, 255');
    });

    it('should return default blue for invalid input', () => {
      expect(hexToRgb('invalid')).toBe('0, 209, 255');
    });
  });

  describe('seededRandom', () => {
    it('should return a deterministic random number for a given seed', () => {
      const seed = 12345;
      const val1 = seededRandom(seed);
      const val2 = seededRandom(seed);
      expect(val1).toBe(val2);
      expect(val1).toBeGreaterThanOrEqual(0);
      expect(val1).toBeLessThan(1);
    });

    it('should return different values for different seeds', () => {
      const val1 = seededRandom(1);
      const val2 = seededRandom(2);
      expect(val1).not.toBe(val2);
    });
  });
});
