import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'DefaultServiceName'
    }
  ],
  exports: [MICRO_SERVICE_NAME]
})
export class GlobalConfigModule {}