import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MaxLength, IsString, Matches, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDidDto {

    @ApiProperty({ example: '000000000000000000000000000Seed1' })
    @MaxLength(32, { message: 'seed must be at most 32 characters.' })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'seed is required' })
    @IsString({ message: 'seed must be in string format.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in seed'
    })
    seed: string;

    @ApiProperty({ example: 'ed25519'})
    @IsNotEmpty({ message: 'key type is required' })
    @IsString({ message: 'key type be in string format.' })
    keyType: string;

    @ApiProperty({ example: 'indy'})
    @IsNotEmpty({ message: 'seed is required' })
    @IsString({ message: 'did must be in string format.' })
    method: string;

    @ApiProperty({example: 'bcovrin:testnet'})
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'domain must be in string format.' })
    network?: string;

    @ApiProperty({example: 'www.github.com'})
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'domain must be in string format.' })
    domain?: string;

    @ApiProperty({example: 'endorser'})
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'role must be in string format.' })
    role?: string;

    @ApiProperty({example: 'did:indy:bcovrin:testnet:UEeW111G1tYo1nEkPwMcF'})
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'endorser did must be in string format.' })
    endorserDid?: string;
}