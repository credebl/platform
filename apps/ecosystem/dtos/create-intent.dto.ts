import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

import { IntentBaseDto } from './intent-base.dto';

@ApiExtraModels()
export class CreateIntentDto extends IntentBaseDto {
  @ApiProperty()
  ecosystemId: string;

  @ApiProperty()
  userId: string;
}
