import { Module } from '@nestjs/common';
import { EnumService } from './enum.service';

@Module({
  providers: [EnumService],
  exports: [EnumService]
})
export class EnumModule {}
