import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class Oid4vpPresentationWhDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  authorizationRequestId!: string;

  @ApiProperty()
  @IsString()
  createdAt!: string;

  @ApiProperty()
  @IsString()
  updatedAt!: string;

  @ApiProperty()
  @IsString()
  contextCorrelationId!: string;

  @ApiProperty()
  @IsString()
  verifierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  orgId: string;
}
