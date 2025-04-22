import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { LoggerModule } from '@credebl/logger/logger.module';

import { CommonService } from './common.service';

@Module({
  imports: [HttpModule, LoggerModule],
  providers: [CommonService, Logger],
  exports: [CommonService]
})
export class CommonModule {}
