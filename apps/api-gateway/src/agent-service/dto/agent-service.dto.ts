import { IsOnPremisesValid, trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CreateDidDto } from './create-did.dto';
const regex = /^[a-zA-Z0-9 ]*$/;
export class AgentSpinupDto extends CreateDidDto {

    @ApiProperty()
    @MaxLength(25, { message: 'Maximum length for wallet must be 25 characters.' })
    @IsString({ message: 'label must be in string format.' })
    @Transform(({ value }) => trim(value))
    @MinLength(2, { message: 'Minimum length for wallet name must be 2 characters.' })
    @Matches(regex, { message: 'Wallet name must not contain special characters.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in label'
    })
    walletName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'walletPassword must be in string format.' })
    @IsNotEmpty({ message: 'Password is required.' })
    walletPassword: string;

    @ApiProperty({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiProperty({ example: 'ojIckSD2jqNzOqIrAGzL' })
    @IsOptional()
    @ApiPropertyOptional()
    clientSocketId?: string;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional()
    tenant?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional()
    isOnPremises?: boolean;

    @ApiPropertyOptional({ example: 'https://example.com' })
    @IsOnPremisesValid({ message: 'externalEndpoint is required.' })
    @IsString({ message: 'externalEndpoint must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    externalEndpoint?: string;

    @ApiPropertyOptional({ example: 'https://example.com' })
    @IsOnPremisesValid({ message: 'inboundEndpoint is required.' })
    @IsString({ message: 'inboundEndpoint must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    inboundEndpoint?: string;

    @ApiPropertyOptional({ example: '192.168.1.1' })
    @IsOnPremisesValid({ message: 'walletStorageHost is required.' })
    @IsString({ message: 'walletStorageHost must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    walletStorageHost?: string;

    @ApiPropertyOptional({ example: '5432' })
    @IsOnPremisesValid({ message: 'walletStoragePort is required.' })
    @IsString({ message: 'walletStoragePort must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    walletStoragePort?: string;

    @ApiPropertyOptional({ example: 'postgres' })
    @IsOnPremisesValid({ message: 'walletStorageUser is required.' })
    @IsString({ message: 'walletStorageUser must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    walletStorageUser?: string;

    @ApiPropertyOptional({ example: 'postgres' })
    @IsOnPremisesValid({ message: 'walletStoragePassword is required.' })
    @IsString({ message: 'walletStoragePassword must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    walletStoragePassword?: string;

    @ApiPropertyOptional({ example: 'https' })
    @IsOnPremisesValid({ message: 'protocol is required.' })
    @IsString({ message: 'protocol must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    protocol?: string;

    @ApiPropertyOptional({ example: 'credo-0.5.1' })
    @IsOnPremisesValid({ message: 'credoImage is required.' })
    @IsString({ message: 'credoImage must be in string format.' })
    @IsOptional()
    @IsNotEmpty()
    credoImage?: string;

    orgId: string;
}