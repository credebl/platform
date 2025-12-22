import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SignerOption } from '@prisma/client';
import { ResponseMode } from '@credebl/enum/enum';

class RequestSignerDto {
  @ApiProperty({ enum: SignerOption, example: SignerOption.DID })
  @IsDefined()
  @IsEnum(SignerOption)
  method: SignerOption;
}

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
}
