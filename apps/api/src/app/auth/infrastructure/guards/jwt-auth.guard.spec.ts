import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AuthService } from '../../application/services/auth.service.js';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtAuthGuard,
                {
                    provide: AuthService,
                    useValue: {
                        validateToken: jest.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<JwtAuthGuard>(JwtAuthGuard);
        authService = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow access with a valid token', async () => {
        const user = { id: '123', email: 'test@example.com', roles: [] };
        jest.spyOn(authService, 'validateToken').mockResolvedValue(user);

        const request = {
            headers: { authorization: 'Bearer valid-token' },
        };
        const context = {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect((request as any).user).toEqual(user);
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: {},
                }),
            }),
        } as unknown as ExecutionContext;

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
        jest.spyOn(authService, 'validateToken').mockResolvedValue(null);

        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: { authorization: 'Bearer invalid' },
                }),
            }),
        } as unknown as ExecutionContext;

        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
});
