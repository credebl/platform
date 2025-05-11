import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AcceptProofRequestDto {
  @ApiProperty({ example: '4e687079-273b-447b-b9dd-9589c84dc6dd' })
  @IsString({ message: 'proofRecordId must be a string' })
  @IsNotEmpty({ message: 'please provide valid proofRecordId' })
  @IsUUID()
  proofRecordId: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'filterByPresentationPreview must be a boolean' })
  filterByPresentationPreview?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'filterByNonRevocationRequirements must be a boolean' })
  filterByNonRevocationRequirements?: boolean;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString({ message: 'comment must be a string' })
  comment?: string;

  userId: string;

  email: string;
}
