import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PresentationExchangeDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  @IsObject()
  credentials: Record<string, string>;
}

class ProofFormatsDto {
  @ApiProperty({ type: PresentationExchangeDto })
  @ValidateNested()
  @Type(() => PresentationExchangeDto)
  presentationExchange: PresentationExchangeDto;
}

export class ProofWithCredDto {
  @ApiProperty({ type: ProofFormatsDto })
  @ValidateNested()
  @Type(() => ProofFormatsDto)
  proofFormats: ProofFormatsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty()
  @IsString()
  proofRecordId: string;
}
