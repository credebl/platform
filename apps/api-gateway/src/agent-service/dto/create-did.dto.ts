import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MaxLength, IsString, Matches, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDidDto {

    @ApiProperty({ example: '000000000000000000000000000Seed1' })
    @MaxLength(32, { message: 'seed must be at most 32 characters.' })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'seed must be in string format.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in seed'
    })
    seed?: string;

    @ApiProperty({ example: 'ed25519'})
    @IsNotEmpty({ message: 'key type is required' })
    @IsString({ message: 'key type be in string format.' })
    keyType: string;

    @ApiProperty({ example: 'indy'})
    @IsNotEmpty({ message: 'method is required' })
    @IsString({ message: 'method must be in string format.' })
    method: string;

    @ApiPropertyOptional({example: 'bcovrin:testnet'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'network must be in string format.' })
    network?: string;

    @ApiPropertyOptional({example: 'www.github.com'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'domain must be in string format.' })
    domain?: string;

    @ApiPropertyOptional({example: 'endorser'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'role must be in string format.' })
    role?: string;

    @ApiPropertyOptional({example: ''})
    @IsOptional()
    @IsString({ message: 'private key must be in string format.' })
    privatekey?: string;

    @ApiPropertyOptional({example: 'http://localhost:6006/docs'})
    @IsOptional()
    @IsString({ message: 'endpoint must be in string format.' })
    endpoint?: string;

    @ApiPropertyOptional({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiPropertyOptional({example: 'did:indy:bcovrin:testnet:UEeW111G1tYo1nEkPwMcF'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'endorser did must be in string format.' })
    endorserDid?: string;
}