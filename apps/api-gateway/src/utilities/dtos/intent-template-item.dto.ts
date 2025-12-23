import { ApiProperty } from '@nestjs/swagger';

export class IntentTemplateItemDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createDateTime: Date;

  @ApiProperty({ type: String })
  createdBy: string;

  @ApiProperty({ type: String })
  intentId: string;

  @ApiProperty({ type: String })
  templateId: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  intent?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  templateName?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  state?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  assignedToOrg?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  templateCreatedByOrg?: string | null;
}
