import { PartialType } from '@nestjs/mapped-types';
import { CreateFlagDto } from './create-flag.dto.js';
import { IsString, MinLength } from 'class-validator';

export class UpdateFlagDto extends PartialType(CreateFlagDto) {
    @IsString()
    @MinLength(3)
    override key!: string;
}
