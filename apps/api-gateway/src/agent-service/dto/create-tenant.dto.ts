import { trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';
const labelRegex = /^[a-zA-Z0-9 ]*$/;
export class CreateTenantDto {
    @ApiProperty()
    @IsString()
    @Transform(({ value }) => value.trim())
    @MaxLength(25, { message: 'Maximum length for label must be 25 characters.' })
    @MinLength(2, { message: 'Minimum length for label must be 2 characters.' })
    @Matches(labelRegex, { message: 'Label must not contain special characters.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in label'
    })
    label: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'seed is required' })
    @MaxLength(32, { message: 'seed must be at most 32 characters.' })
    @IsString({ message: 'seed must be in string format.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in seed'
    })
    seed: string;

    @ApiProperty()
    @IsNumber()
    orgId: number;

    @ApiProperty()
    @IsOptional()
    clientSocketId?: string;
}