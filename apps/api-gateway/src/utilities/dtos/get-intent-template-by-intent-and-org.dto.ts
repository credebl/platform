import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetIntentTemplateByIntentAndOrgDto {
  @ApiProperty({ example: 'WEB_CHECKIN', description: 'Intent name' })
  @IsNotEmpty()
  @IsString()
  intentName: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Verifier Organization ID' })
  @IsNotEmpty()
  @IsString()
  verifierOrgId: string;
}
