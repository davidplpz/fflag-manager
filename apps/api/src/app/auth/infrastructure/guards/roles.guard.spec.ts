import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard.js';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator.js';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesGuard,
                {
                    provide: Reflector,
                    useValue: {
                        getAllAndOverride: jest.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<RolesGuard>(RolesGuard);
        reflector = module.get<Reflector>(Reflector);
    });

    it('should allow access if no roles are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

        const context = {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({}),
            }),
        } as unknown as ExecutionContext;

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access if user has a required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

        const request = { user: { roles: ['admin', 'user'] } };
        const context = {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if user lacks required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

        const request = { user: { roles: ['user'] } };
        const context = {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user context is missing', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

        const request = {};
        const context = {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
});
