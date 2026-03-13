import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.js';

export interface AuthUser {
    id: string;
    email: string;
    roles: string[];
}

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(USER_REPOSITORY_TOKEN)
        private readonly userRepository: UserRepository
    ) { }

    async validateToken(token: string): Promise<AuthUser | null> {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            const user = await this.userRepository.findById(payload.sub);

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                email: user.email,
                roles: user.roles,
            };
        } catch {
            return null;
        }
    }

    async login(email: string, pass: string): Promise<{ token: string }> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, roles: user.roles };
        return {
            token: await this.jwtService.signAsync(payload),
        };
    }
}
