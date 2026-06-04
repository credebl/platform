import { Global, Module } from '@nestjs/common';
import { v4 } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from './contextStorageService.interface';
import NestjsClsContextStorageService from './nestjsClsContextStorageService';
import { Request } from 'express';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => {
          // TODO: Check if we want the x-correlation-id or the correlationId
          const contextIdHeader = req.headers['contextid'] ?? req.headers['context-id'] ?? req.headers['contextId'];
          const correlationIdHeader = req.headers['x-correlation-id'];
          let resolvedContextId =
            (Array.isArray(contextIdHeader) ? contextIdHeader[0] : contextIdHeader) ??
            (Array.isArray(correlationIdHeader) ? correlationIdHeader[0] : correlationIdHeader);

          if (resolvedContextId) {
            // eslint-disable-next-line no-console
            console.log('ContextId received in request headers::::', resolvedContextId);
          } else {
            resolvedContextId = v4();
            // eslint-disable-next-line no-console
            console.log('ContextId not received in request headers, generated a new one::::', resolvedContextId);
          }
          return resolvedContextId;
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
