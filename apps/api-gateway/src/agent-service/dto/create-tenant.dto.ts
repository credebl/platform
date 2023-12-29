import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MaxLength, IsString, MinLength, Matches, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
const labelRegex = /^[a-zA-Z0-9 ]*$/;
export class CreateTenantDto {
    @ApiProperty()
    @MaxLength(25, { message: 'Maximum length for label must be 25 characters.' })
    @IsString({ message: 'label must be in string format.' })
    @Transform(({ value }) => trim(value))
    @MinLength(2, { message: 'Minimum length for label must be 2 characters.' })
    @Matches(labelRegex, { message: 'Label must not contain special characters.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in label'
    })
    label: string;

    @ApiProperty({ example: 'dfuhgfklskmjngrjekjfgjjfkoekfdad' })
    @MaxLength(32, { message: 'seed must be at most 32 characters.' })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'seed is required' })
    @IsString({ message: 'seed must be in string format.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in seed'
    })
    seed: string;

    @ApiProperty({ example: [1] })
    @ApiPropertyOptional()
    @IsOptional()
    @IsArray({ message: 'ledgerId must be an array' })
    @IsNotEmpty({ message: 'please provide valid ledgerId' })
    ledgerId?: string[];

    @ApiProperty({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiProperty({ example: 'ojIckSD2jqNzOqIrAGzL' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    clientSocketId?: string;

    orgId: string;
}