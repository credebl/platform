import { ApiExtraModels } from '@nestjs/swagger';
import { IntentBaseDto } from './intent-base.dto';

@ApiExtraModels()
export class UpdateIntentDto extends IntentBaseDto {
  intentId: string;
  ecosystemId: string;
  userId: string;
}
