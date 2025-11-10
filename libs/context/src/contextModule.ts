import { Global, Logger, Module } from '@nestjs/common';
import { v4 } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from './contextStorageService.interface';
import NestjsClsContextStorageService from './nestjsClsContextStorageService';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => {
          const logger = new Logger('ContextInterceptorModule');
          // TODO: Check if we want the x-correlation-id or the correlationId
          const headers = req.headers['contextId'] ?? req.headers['x-correlation-id'] ?? v4();
          logger.log('Headers received/generated::::', headers);
          return headers;
        }
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
