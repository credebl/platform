import { Module } from '@nestjs/common';
import { CallbackController } from './callback.controller';
import { CallbackService } from './callback.service';

@Module({
  controllers: [CallbackController],
  providers: [CallbackService]
})
export class CallbackModule {}
