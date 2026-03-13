import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service.js';
import { LoginCredentialsDto } from '../dto/login-credentials.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() credentials: LoginCredentialsDto) {
        return this.authService.login(credentials.email, credentials.password);
    }
}
