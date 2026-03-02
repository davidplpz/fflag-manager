import { IsOptional, IsString } from 'class-validator';

export class EvaluationContextDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    attributes?: Record<string, any>;

    @IsOptional()
    @IsString()
    timestamp?: string;
}
