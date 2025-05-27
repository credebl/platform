import { trim } from '@credebl/common/cast.helper'
import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsString, IsUUID } from 'class-validator'

@ApiExtraModels()
export class GetWebhookDto {
  @ApiPropertyOptional({ example: '2a041d6e-d24c-4ed9-b011-1cfc371a8b8e' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Organization id must be in string format.' })
  orgId?: string

  @ApiPropertyOptional({ example: '3a041d6e-d24c-4ed9-b011-1cfc371a8b8e' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsUUID('4', { message: 'Please provide valid tenantId' })
  @IsString({ message: 'Tenant id must be in string format.' })
  tenantId?: string
}
