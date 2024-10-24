import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlatformSettingsDto {
    @ApiPropertyOptional({ example: '127.0.0.1' })
    @IsOptional()
    @IsString({ message: 'external Ip should be string' })
    externalIp: string;

    @ApiPropertyOptional({ example: '127.0.0.1' })
    @IsOptional()
    @IsString({ message: 'inbound endpoint should be string' })
    inboundEndpoint: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'sgApiKey should be string' })
    sgApiKey: string;

    @ApiPropertyOptional({ example: 'abc13@yopmail.com' })
    @IsOptional()
    @IsString({ message: 'emailFrom should be string' })
    emailFrom: string;

    @ApiPropertyOptional({ example: `${process.env.UPLOAD_LOGO_HOST}` })
    @IsOptional()
    @IsString({ message: 'API endpoint should be string' })
    apiEndPoint: string;
}