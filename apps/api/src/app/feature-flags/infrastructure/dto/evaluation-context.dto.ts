import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluationContextDto {
    @ApiPropertyOptional({
        description: 'ID del usuario para evaluación de estrategias (rollout, user-list)',
        example: 'user-123',
    })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({
        description: 'Atributos adicionales del usuario para segmentación personalizada',
        example: { country: 'ES', plan: 'premium' },
    })
    @IsOptional()
    attributes?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Timestamp para evaluación de ventanas de tiempo (ISO 8601)',
        example: '2026-03-12T09:19:57Z',
    })
    @IsOptional()
    @IsString()
    timestamp?: string;
}
