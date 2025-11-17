import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class DeclineProofRequestDto {
  @ApiProperty({ example: '4e687079-273b-447b-b9dd-9589c84dc6dd' })
  @IsString({ message: 'proofRecordId must be a string' })
  @IsNotEmpty({ message: 'please provide valid proofRecordId' })
  @IsUUID()
  proofRecordId: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'sendProblemReport must be a boolean' })
  sendProblemReport?: boolean;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString({ message: 'problemReportDescription must be a string' })
  problemReportDescription?: string;

  userId: string;

  email: string;
}
