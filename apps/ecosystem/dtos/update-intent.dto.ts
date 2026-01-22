import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

import { IntentBaseDto } from './intent-base.dto';

@ApiExtraModels()
export class UpdateIntentDto extends IntentBaseDto {
  @ApiProperty()
  intentId: string;

  @ApiProperty()
  ecosystemId: string;

  @ApiProperty()
  userId: string;
}
