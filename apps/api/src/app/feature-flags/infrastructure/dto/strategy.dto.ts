import { IsEnum, IsNumber, IsOptional, IsString, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
    @IsEnum(StrategyTypeDto)
    type!: StrategyTypeDto;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    rolloutPercentage?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    userIds?: string[];

    @IsOptional()
    isBlacklist?: boolean;

    @IsOptional()
    startTime?: string;

    @IsOptional()
    endTime?: string;

    @IsOptional()
    @IsEnum(StrategyOperatorDto)
    operator?: StrategyOperatorDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StrategyDto)
    strategies?: StrategyDto[];
}
