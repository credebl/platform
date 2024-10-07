import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlatformSettingsDto {
    @ApiProperty({ example: '127.0.0.1' })
    @IsOptional()
    @IsString({ message: 'external Ip should be string' })
    externalIp: string;

    @ApiProperty({ example: '127.0.0.1' })
    @IsOptional()
    @IsString({ message: 'inbound endpoint should be string' })
    inboundEndpoint: string;

    @ApiProperty()
    @IsOptional()
    @IsString({ message: 'sgApiKey should be string' })
    sgApiKey: string;

    @ApiProperty({ example: 'abc13@yopmail.com' })
    @IsOptional()
    @IsString({ message: 'emailFrom should be string' })
    emailFrom: string;

    @ApiProperty({ example: `${process.env.UPLOAD_LOGO_HOST}` })
    @IsOptional()
    @IsString({ message: 'API endpoint should be string' })
    apiEndPoint: string;
}