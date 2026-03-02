import { IsBoolean, IsOptional, IsString, Matches, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StrategyDto } from './strategy.dto.js';

export class CreateFlagDto {
    @IsString()
    @MinLength(3)
    @Matches(/^[a-z0-9-]+$/, {
        message: 'key must be in kebab-case (lowercase, numbers, and hyphens)',
    })
    key!: string;

    @IsString()
    @MinLength(1)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsBoolean()
    enabled!: boolean;

    @IsOptional()
    @ValidateNested()
    @Type(() => StrategyDto)
    strategy?: StrategyDto;
}
