import { trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUrl, IsOptional, MinLength } from 'class-validator';

export class UpdateWebhookDto {
  orgId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'webhookUrl must be in string format.' })
  @IsUrl(undefined, { message: 'webhookUrl is not valid' })
  webhookUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'webhookSecret must be a string.' })
  @MinLength(16, { message: 'webhookSecret must be at least 16 characters long.' })
  webhookSecret?: string;
}
