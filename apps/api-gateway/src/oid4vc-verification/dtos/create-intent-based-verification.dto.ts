import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDefined, IsEnum, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ResponseMode } from '@credebl/enum/enum';
import { RequestSignerDto } from './oid4vc-verifier-presentation.dto';

export class CreateIntentBasedVerificationDto {
  @ApiProperty({ description: 'Intent name to lookup template for', example: 'kyc-intent' })
  @IsDefined()
  @IsString()
  intent: string;

  @ApiProperty({ enum: ResponseMode, example: ResponseMode.DIRECT_POST_JWT })
  @IsDefined()
  @IsEnum(ResponseMode)
  responseMode: ResponseMode;

  @ApiPropertyOptional({ type: RequestSignerDto, description: 'Optional request signer option' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequestSignerDto)
  requestSigner?: RequestSignerDto;

  //TODO: check e2e flow and add ResponseMode based restrictions
  // @IsOptional()
  @ApiPropertyOptional({
    type: [String],
    description: 'Required when responseMode is dc_api or dc_api.jwt',
    example: ['https://example.com']
  })
  @ValidateIf((obj) => obj.responseMode === ResponseMode.DC_API || obj.responseMode === ResponseMode.DC_API_JWT)
  @IsDefined({ message: 'expectedOrigins is required when responseMode is dc_api or dc_api.jwt' })
  @IsArray()
  expectedOrigins: string[];
}
