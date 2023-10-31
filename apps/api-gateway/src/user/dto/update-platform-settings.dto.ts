import { ApiProperty } from '@nestjs/swagger';
import {IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export class UpdatePlatformSettingsDto {
    @ApiProperty({ example: '127.0.0.1' })
    @IsOptional()
    @IsString({ message: 'external Ip should be string' })
    externalIp: string;

    @ApiProperty({ example: '127.0.0.1' })
    @IsOptional()
    @IsString({ message: 'last Internal Id should be string' })
    lastInternalId: string;

    @ApiProperty()
    @IsOptional()
    @IsString({ message: 'sgApiKey should be string' })
    sgApiKey: string;

    @ApiProperty({ example: 'abc13@yopmail.com' })
    @IsOptional()
    @IsString({ message: 'emailFrom should be string' })
    emailFrom: string;

    @ApiProperty({ example: 'dev.credebl.id' })
    @IsOptional()
    @IsString({ message: 'API endpoint should be string' })
    apiEndPoint: string;

    @ApiProperty({ example: 'true' })
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'enableEcosystem should boolean' })
    enableEcosystem: boolean;

    @ApiProperty({ example: 'true' })
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'multiEcosystemSupport should boolean' })
    multiEcosystemSupport: boolean;

}