import { JwtPayload } from './jwt-payload.interface';

export interface IJwtService {
  /**
   * Sign a JWT token with the provided payload
   * @param payload - The payload to encode in the token
   * @returns The signed JWT token string
   */
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;

  /**
   * Verify and decode a JWT token
   * @param token - The JWT token to verify
   * @returns The decoded payload if valid
   * @throws Error if token is invalid or expired
   */
  verify(token: string): JwtPayload;

  /**
   * Decode a JWT token without verification
   * @param token - The JWT token to decode
   * @returns The decoded payload or null if invalid
   */
  decode(token: string): JwtPayload | null;
}
