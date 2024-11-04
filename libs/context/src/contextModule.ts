import { Global, Module } from '@nestjs/common';
import { v4 } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import NestjsClsContextStorageService from '@credebl/context/nestjsClsContextStorageService';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => req.headers['x-correlation-id'] ?? v4()
      }
    })
  ],
  controllers: [],
  providers: [
    {
      provide: ContextStorageServiceKey,
      useClass: NestjsClsContextStorageService
    }
  ],
  exports: [ContextStorageServiceKey]
})
export class ContextModule {}
