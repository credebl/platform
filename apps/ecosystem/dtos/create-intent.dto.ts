import { ApiExtraModels } from '@nestjs/swagger';
import { IntentBaseDto } from './intent-base.dto';

@ApiExtraModels()
export class CreateIntentDto extends IntentBaseDto {
  ecosystemId: string;
  userId: string;
}
