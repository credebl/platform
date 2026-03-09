import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateIntentNoticeDto {
  @ApiProperty({ description: 'Intent ID to associate the notice with', example: 'uuid-of-intent' })
  @IsDefined()
  @IsUUID()
  intentId: string;

  @ApiProperty({ description: 'Notice ID', example: 'notice-123' })
  @IsDefined()
  @IsString()
  noticeId: string;

  @ApiProperty({ description: 'URL of the notice', example: 'https://example.com/notice' })
  @IsDefined()
  @IsUrl()
  noticeUrl: string;
}
