import { Logger, Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MICRO_SERVICE_NAME } from './common.constant';
import { CommonService } from './common.service';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [CommonService, Logger, EmailService, { provide: MICRO_SERVICE_NAME, useValue: 'DefaultServiceName' }],
  exports: [CommonService, EmailService, MICRO_SERVICE_NAME]
})
export class GlobalConfigModule {}
