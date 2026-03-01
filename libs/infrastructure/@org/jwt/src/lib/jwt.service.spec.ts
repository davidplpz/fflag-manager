import { JwtService } from './jwt.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

describe('JwtService', () => {
  describe('HS256 algorithm', () => {
    let jwtService: JwtService;

    beforeEach(() => {
      jwtService = new JwtService({
        algorithm: 'HS256',
        secret: 'test-secret-key',
        expiresIn: '1h',
      });
    });

    describe('sign', () => {
      it('should generate a valid JWT token', () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin' as const,
        };

        const token = jwtService.sign(payload);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      });

      it('should include iat and exp in the token', () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'viewer' as const,
        };

        const token = jwtService.sign(payload);
        const decoded = jwtService.decode(token);

        expect(decoded).not.toBeNull();
        expect(decoded!.iat).toBeDefined();
        expect(decoded!.exp).toBeDefined();
        expect(decoded!.exp).toBeGreaterThan(decoded!.iat);
      });

      it('should set expiration to 1 hour by default', () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin' as const,
        };

        const token = jwtService.sign(payload);
        const decoded = jwtService.decode(token);

        const expiresInSeconds = decoded!.exp - decoded!.iat;
        expect(expiresInSeconds).toBe(3600); // 1 hour = 3600 seconds
      });
    });

    describe('verify', () => {
      it('should verify and decode a valid token', () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin' as const,
        };

        const token = jwtService.sign(payload);
        const verified = jwtService.verify(token);

        expect(verified.sub).toBe(payload.sub);
        expect(verified.email).toBe(payload.email);
        expect(verified.role).toBe(payload.role);
      });

      it('should throw error for invalid token', () => {
        const invalidToken = 'invalid.token.here';

        expect(() => jwtService.verify(invalidToken)).toThrow('Invalid token');
      });

      it('should throw error for malformed token', () => {
        const malformedToken = 'not-a-jwt-token';

        expect(() => jwtService.verify(malformedToken)).toThrow('Invalid token');
      });

      it('should throw error for token with wrong signature', () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin' as const,
        };

        const token = jwtService.sign(payload);

        // Create a service with different secret
        const differentService = new JwtService({
          algorithm: 'HS256',
          secret: 'different-secret',
          expiresIn: '1h',
        });

        expect(() => differentService.verify(token)).toThrow('Invalid token');
      });

      it('should throw error for expired token', () => {
        // Create a service with very short expiration
        const shortExpiryService = new JwtService({
          algorithm: 'HS256',
          secret: 'test-secret-key',
          expiresIn: '0s', // Expires immediately
        });

        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin' as const,
        };

        const token = shortExpiryService.sign(payload);

        // Wait a tiny bit to ensure expiration
        return new Promise((resolve) => {
          setTimeout(() => {
            expect(() => jwtService.verify(token)).toThrow('Token has expired');
            resolve(undefined);
          }, 10);
        });
      });
    });

    describe('decode', () => {
      it('should decode a valid token without verification', () => {
        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'viewer' as const,
        };

        const token = jwtService.sign(payload);
        const decoded = jwtService.decode(token);

        expect(decoded).not.toBeNull();
        expect(decoded!.sub).toBe(payload.sub);
        expect(decoded!.email).toBe(payload.email);
        expect(decoded!.role).toBe(payload.role);
      });

      it('should return null for invalid token', () => {
        const invalidToken = 'invalid.token.here';

        const decoded = jwtService.decode(invalidToken);

        expect(decoded).toBeNull();
      });

      it('should return null for malformed token', () => {
        const malformedToken = 'not-a-jwt-token';

        const decoded = jwtService.decode(malformedToken);

        expect(decoded).toBeNull();
      });

      it('should decode expired token without throwing', () => {
        // Create a service with very short expiration
        const shortExpiryService = new JwtService({
          algorithm: 'HS256',
          secret: 'test-secret-key',
          expiresIn: '0s',
        });

        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin' as const,
        };

        const token = shortExpiryService.sign(payload);

        // Decode should work even if token is expired
        const decoded = jwtService.decode(token);

        expect(decoded).not.toBeNull();
        expect(decoded!.sub).toBe(payload.sub);
      });
    });

    describe('token expiration handling', () => {
      it('should handle different expiration formats', () => {
        const testCases = [
          { expiresIn: '30s', expectedSeconds: 30 },
          { expiresIn: '5m', expectedSeconds: 300 },
          { expiresIn: '2h', expectedSeconds: 7200 },
          { expiresIn: '1d', expectedSeconds: 86400 },
        ];

        testCases.forEach(({ expiresIn, expectedSeconds }) => {
          const service = new JwtService({
            algorithm: 'HS256',
            secret: 'test-secret-key',
            expiresIn,
          });

          const payload = {
            sub: 'user-123',
            email: 'test@example.com',
            role: 'admin' as const,
          };

          const token = service.sign(payload);
          const decoded = service.decode(token);

          const actualExpiration = decoded!.exp - decoded!.iat;
          expect(actualExpiration).toBe(expectedSeconds);
        });
      });

      it('should handle numeric expiration in seconds', () => {
        const service = new JwtService({
          algorithm: 'HS256',
          secret: 'test-secret-key',
          expiresIn: 1800, // 30 minutes in seconds
        });

        const payload = {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin' as const,
        };

        const token = service.sign(payload);
        const decoded = service.decode(token);

        const actualExpiration = decoded!.exp - decoded!.iat;
        expect(actualExpiration).toBe(1800);
      });
    });
  });

  describe('configuration validation', () => {
    it('should throw error if HS256 is used without secret', () => {
      expect(() => {
        new JwtService({
          algorithm: 'HS256',
          expiresIn: '1h',
        });
      }).toThrow('HS256 algorithm requires a secret');
    });

    it('should throw error if RS256 is used without keys', () => {
      expect(() => {
        new JwtService({
          algorithm: 'RS256',
          expiresIn: '1h',
        });
      }).toThrow('RS256 algorithm requires both privateKey and publicKey');
    });

    it('should throw error if RS256 is used with only privateKey', () => {
      expect(() => {
        new JwtService({
          algorithm: 'RS256',
          privateKey: 'some-key',
          expiresIn: '1h',
        });
      }).toThrow('RS256 algorithm requires both privateKey and publicKey');
    });

    it('should throw error if RS256 is used with only publicKey', () => {
      expect(() => {
        new JwtService({
          algorithm: 'RS256',
          publicKey: 'some-key',
          expiresIn: '1h',
        });
      }).toThrow('RS256 algorithm requires both privateKey and publicKey');
    });
  });

  describe('role-based payloads', () => {
    let jwtService: JwtService;

    beforeEach(() => {
      jwtService = new JwtService({
        algorithm: 'HS256',
        secret: 'test-secret-key',
        expiresIn: '1h',
      });
    });

    it('should handle admin role', () => {
      const payload = {
        sub: 'admin-user',
        email: 'admin@example.com',
        role: 'admin' as const,
      };

      const token = jwtService.sign(payload);
      const verified = jwtService.verify(token);

      expect(verified.role).toBe('admin');
    });

    it('should handle viewer role', () => {
      const payload = {
        sub: 'viewer-user',
        email: 'viewer@example.com',
        role: 'viewer' as const,
      };

      const token = jwtService.sign(payload);
      const verified = jwtService.verify(token);

      expect(verified.role).toBe('viewer');
    });
  });
});
