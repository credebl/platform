import { Module } from '@nestjs/common';
import { ResponseService } from './response.service';

@Module({
  providers: [ResponseService],
  exports: [ResponseService]
})
export class ResponseModule {}
