import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthUser {
    id: string;
    email: string;
    roles: string[];
}

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    async validateToken(token: string): Promise<AuthUser | null> {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return {
                id: payload.sub,
                email: payload.email,
                roles: payload.roles || [],
            };
        } catch {
            return null;
        }
    }
}
