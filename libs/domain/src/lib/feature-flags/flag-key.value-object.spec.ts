import * as fc from 'fast-check';
import { FlagKey } from './flag-key.value-object.js';

describe('FlagKey', () => {
    describe('Validation', () => {
        it('should create a valid FlagKey', () => {
            const key = 'valid-key-123';
            const flagKey = new FlagKey(key);
            expect(flagKey.toString()).toBe(key);
        });

        it('should throw an error for invalid kebab-case', () => {
            const invalidKeys = [
                'Invalid-Key',
                'invalid_key',
                'invalid key',
                '-invalid',
                'invalid-',
                'inv--alid',
                '123-Invalid',
            ];

            invalidKeys.forEach(key => {
                expect(() => new FlagKey(key)).toThrow('Invalid FlagKey format');
            });
        });

        it('should throw an error for key too long (> 255)', () => {
            const longKey = 'a'.repeat(256);
            expect(() => new FlagKey(longKey)).toThrow('FlagKey is too long');
        });

        it('should throw an error for empty key', () => {
            expect(() => new FlagKey('')).toThrow();
        });
    });

    describe('Equals', () => {
        it('should return true for identical keys', () => {
            const key1 = new FlagKey('my-key');
            const key2 = new FlagKey('my-key');
            expect(key1.equals(key2)).toBe(true);
        });

        it('should return false for different keys', () => {
            const key1 = new FlagKey('my-key');
            const key2 = new FlagKey('other-key');
            expect(key1.equals(key2)).toBe(false);
        });
    });

    describe('Property-based testing (Requirement 1.9, 16.4)', () => {
        it('should always validate valid kebab-case strings', () => {
            fc.assert(
                fc.property(
                    fc.stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).filter(s => s.length > 0 && s.length <= 255),
                    (val) => {
                        const flagKey = new FlagKey(val);
                        return flagKey.toString() === val;
                    }
                )
            );
        });

        it('should never accept uppercase letters (Requirement 1.9)', () => {
            fc.assert(
                fc.property(
                    fc.stringMatching(/[A-Z]/),
                    (val) => {
                        try {
                            new FlagKey(val);
                            return false;
                        } catch (e) {
                            return true;
                        }
                    }
                )
            );
        });
    });
});
