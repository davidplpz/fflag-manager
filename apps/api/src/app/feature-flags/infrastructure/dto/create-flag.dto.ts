import { IsBoolean, IsOptional, IsString, Matches, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StrategyDto } from './strategy.dto.js';

export class CreateFlagDto {
    @ApiProperty({
        description: 'Identificador único del flag en formato kebab-case',
        example: 'my-new-feature',
        minLength: 3,
        pattern: '^[a-z0-9-]+$',
    })
    @IsString()
    @MinLength(3)
    @Matches(/^[a-z0-9-]+$/, {
        message: 'key must be in kebab-case (lowercase, numbers, and hyphens)',
    })
    key!: string;

    @ApiProperty({
        description: 'Nombre descriptivo del feature flag',
        example: 'My New Feature',
    })
    @IsString()
    @MinLength(1)
    name!: string;

    @ApiPropertyOptional({
        description: 'Descripción detallada del propósito del feature flag',
        example: 'Habilita la nueva interfaz de usuario para usuarios beta',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Estado inicial del flag (true = habilitado, false = deshabilitado)',
        example: false,
    })
    @IsBoolean()
    enabled!: boolean;

    @ApiPropertyOptional({
        description: 'Estrategia de activación del flag. Si no se especifica, el flag se activa/desactiva globalmente.',
        type: StrategyDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => StrategyDto)
    strategy?: StrategyDto;
}
