import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateIntentTemplateDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Organization ID' })
  @IsOptional()
  @IsUUID()
  orgId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Intent ID' })
  @IsNotEmpty()
  @IsUUID()
  intentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Template ID' })
  @IsNotEmpty()
  @IsUUID()
  templateId: string;
}

export class UpdateIntentTemplateDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Organization ID' })
  @IsOptional()
  @IsUUID()
  orgId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Intent ID' })
  @IsNotEmpty()
  @IsUUID()
  intentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Template ID' })
  @IsNotEmpty()
  @IsUUID()
  templateId: string;
}
