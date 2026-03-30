import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateIntentNoticeDto {
  @ApiProperty({ description: 'Intent ID to associate the notice with', example: 'uuid-of-intent' })
  @IsDefined()
  @IsUUID()
  intentId: string;

  @ApiProperty({ description: 'URL of the notice', example: 'https://example.com/notice' })
  @IsDefined()
  @IsString()
  noticeUrl: string;

  @ApiPropertyOptional({ description: 'Organization ID (optional)', example: 'uuid-of-org' })
  @IsOptional()
  @IsUUID()
  orgId?: string;
}

export class UpdateIntentNoticeDto {
  @ApiPropertyOptional({ description: 'URL of the notice', example: 'https://example.com/notice' })
  @IsOptional()
  @IsUrl()
  noticeUrl?: string;
}
