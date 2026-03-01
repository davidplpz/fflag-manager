import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { IJwtService } from './interfaces/jwt-service.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface JwtServiceConfig {
  secret?: string;
  privateKey?: string;
  publicKey?: string;
  algorithm: 'HS256' | 'RS256';
  expiresIn?: string | number; // default: '1h'
}

@Injectable()
export class JwtService implements IJwtService {
  private readonly config: Required<JwtServiceConfig>;

  constructor(config: JwtServiceConfig) {
    // Set defaults
    this.config = {
      secret: config.secret || '',
      privateKey: config.privateKey || '',
      publicKey: config.publicKey || '',
      algorithm: config.algorithm,
      expiresIn: config.expiresIn || '1h', // default: 1 hour
    };

    // Validate configuration
    if (this.config.algorithm === 'HS256' && !this.config.secret) {
      throw new Error('HS256 algorithm requires a secret');
    }

    if (
      this.config.algorithm === 'RS256' &&
      (!this.config.privateKey || !this.config.publicKey)
    ) {
      throw new Error('RS256 algorithm requires both privateKey and publicKey');
    }
  }

  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn =
      typeof this.config.expiresIn === 'string'
        ? this.parseExpiresIn(this.config.expiresIn)
        : this.config.expiresIn;

    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    const signOptions: jwt.SignOptions = {
      algorithm: this.config.algorithm,
    };

    if (this.config.algorithm === 'HS256') {
      return jwt.sign(fullPayload, this.config.secret, signOptions);
    } else {
      return jwt.sign(fullPayload, this.config.privateKey, signOptions);
    }
  }

  verify(token: string): JwtPayload {
    try {
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: [this.config.algorithm],
      };

      let decoded: string | jwt.JwtPayload;

      if (this.config.algorithm === 'HS256') {
        decoded = jwt.verify(token, this.config.secret, verifyOptions);
      } else {
        decoded = jwt.verify(token, this.config.publicKey, verifyOptions);
      }

      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload');
      }

      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  decode(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token);

      if (!decoded || typeof decoded === 'string') {
        return null;
      }

      return decoded as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Parse expiration string (e.g., '1h', '30m', '7d') to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error(
        'Invalid expiresIn format. Use format like "1h", "30m", "7d"'
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error('Invalid time unit');
    }
  }
}
