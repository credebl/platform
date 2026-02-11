import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class GetIntentTemplateByIntentAndOrgDto {
  @ApiProperty({ example: 'WEB_CHECKIN', description: 'Intent name' })
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'intentName is required' })
  @IsString()
  intentName: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Verifier Organization ID' })
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'verifierOrgId is required' })
  @IsString()
  verifierOrgId: string;
}
