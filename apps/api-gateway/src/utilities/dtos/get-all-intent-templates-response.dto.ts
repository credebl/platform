import { ApiProperty } from '@nestjs/swagger';
import { IntentTemplateItemDto } from './intent-template-item.dto';

export class GetAllIntentTemplatesResponseDto {
  @ApiProperty({ type: Number })
  totalItems: number;

  @ApiProperty({ type: Boolean })
  hasNextPage: boolean;

  @ApiProperty({ type: Boolean })
  hasPreviousPage: boolean;

  @ApiProperty({ type: Number })
  nextPage: number;

  @ApiProperty({ type: Number })
  previousPage: number;

  @ApiProperty({ type: Number })
  lastPage: number;

  @ApiProperty({ type: [IntentTemplateItemDto] })
  data: IntentTemplateItemDto[];
}
