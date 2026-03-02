import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: {
                        verifyAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should validate a valid token', async () => {
        const payload = { sub: '123', email: 'test@example.com', roles: ['admin'] };
        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

        const result = await service.validateToken('valid-token');
        expect(result).toEqual({
            id: '123',
            email: 'test@example.com',
            roles: ['admin'],
        });
    });

    it('should return null for an invalid token', async () => {
        jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid'));

        const result = await service.validateToken('invalid-token');
        expect(result).toBeNull();
    });
});
