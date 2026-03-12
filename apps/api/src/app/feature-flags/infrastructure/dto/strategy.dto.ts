import { IsEnum, IsNumber, IsOptional, IsString, Min, Max, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StrategyTypeDto {
    PERCENTAGE = 'PERCENTAGE',
    USER_LIST = 'USER_LIST',
    TIME_WINDOW = 'TIME_WINDOW',
    COMPOSITE = 'COMPOSITE',
}

export enum StrategyOperatorDto {
    AND = 'AND',
    OR = 'OR',
}

export class StrategyDto {
    @ApiProperty({
        description: 'Tipo de estrategia de activación',
        enum: StrategyTypeDto,
        example: StrategyTypeDto.PERCENTAGE,
    })
    @IsEnum(StrategyTypeDto)
    type!: StrategyTypeDto;

    @ApiPropertyOptional({
        description: '[PERCENTAGE] Porcentaje de usuarios que tendrán el flag habilitado (0-100). Usa hashing consistente por userId.',
        minimum: 0,
        maximum: 100,
        example: 25,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    rolloutPercentage?: number;

    @ApiPropertyOptional({
        description: '[USER_LIST] Lista de IDs de usuarios a incluir (whitelist) o excluir (blacklist).',
        type: [String],
        example: ['user-123', 'user-456'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    userIds?: string[];

    @ApiPropertyOptional({
        description: '[USER_LIST] Si es true, los userIds forman una blacklist (excluidos). Por defecto es whitelist (incluidos).',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    isBlacklist?: boolean;

    @ApiPropertyOptional({
        description: '[TIME_WINDOW] Fecha/hora de inicio en formato ISO 8601. El flag se activa a partir de esta fecha.',
        example: '2026-01-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiPropertyOptional({
        description: '[TIME_WINDOW] Fecha/hora de fin en formato ISO 8601. El flag se desactiva después de esta fecha.',
        example: '2026-12-31T23:59:59.999Z',
    })
    @IsOptional()
    @IsString()
    endTime?: string;

    @ApiPropertyOptional({
        description: '[COMPOSITE] Operador lógico para combinar múltiples estrategias.',
        enum: StrategyOperatorDto,
        example: StrategyOperatorDto.AND,
    })
    @IsOptional()
    @IsEnum(StrategyOperatorDto)
    operator?: StrategyOperatorDto;

    @ApiPropertyOptional({
        description: '[COMPOSITE] Lista de estrategias a combinar con el operador especificado.',
        type: [StrategyDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StrategyDto)
    strategies?: StrategyDto[];
}
