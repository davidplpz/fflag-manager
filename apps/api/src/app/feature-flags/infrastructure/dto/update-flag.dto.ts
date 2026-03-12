import { PartialType } from '@nestjs/swagger';
import { CreateFlagDto } from './create-flag.dto.js';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFlagDto extends PartialType(CreateFlagDto) {
    @ApiProperty({
        description: 'Identificador único del flag (no se puede cambiar mediante update)',
        example: 'my-new-feature',
    })
    @IsString()
    @MinLength(3)
    override key!: string;
}
