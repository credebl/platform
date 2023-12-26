import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, IsArray } from 'class-validator';
const regex = /^[a-zA-Z0-9 ]*$/;
export class AgentSpinupDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'walletName is required' })
    @MinLength(2, { message: 'walletName must be at least 2 characters.' })
    @MaxLength(50, { message: 'walletName must be at most 50 characters.' })
    @IsString({ message: 'walletName must be in string format.' })
    @Matches(regex, { message: 'Wallet name must not contain special characters.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in wallet name'
    })
    walletName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'walletPassword must be in string format.' })
    @IsNotEmpty({ message: 'Password is required.' })
    walletPassword: string;

    @ApiProperty({ example: 'dfuhgfklskmjngrjekjfgjjfkoekfdad' })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'seed is required' })
    @MaxLength(32, { message: 'seed must be at most 32 characters.' })
    @IsString({ message: 'seed must be in string format.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in seed'
    })
    seed: string;

    @ApiProperty({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiProperty({ example: ['6ba7b810-9dad-11d1-80b4-00c04fd430c8'] })
    @IsOptional()
    @ApiPropertyOptional()
    @IsArray({ message: 'ledgerId must be an array' })
    @IsString({ each: true, message: 'Each ledgerId must be a string' })
    @MaxLength(36, { each: true, message: 'ledgerId must be at most 36 characters.' })
    @IsNotEmpty({ message: 'please provide valid ledgerId' })
    ledgerId?: string[];

    @ApiProperty({ example: 'ojIckSD2jqNzOqIrAGzL' })
    @IsOptional()
    @ApiPropertyOptional()
    clientSocketId?: string;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional()
    tenant?: boolean;

    orgId: string;
}