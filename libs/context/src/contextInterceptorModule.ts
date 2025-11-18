import { ExecutionContext, Global, Logger, Module } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from './contextStorageService.interface';
import NestjsClsContextStorageService from './nestjsClsContextStorageService';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,

        generateId: true,
        idGenerator: (context: ExecutionContext) => {
          const logger = new Logger('ContextInterceptorModule');
          try {
            const rpcContext = context.switchToRpc().getContext();
            const headers = rpcContext.getHeaders() ?? {};
            const contextId = headers.get?.('contextId');

            if (contextId) {
              logger.debug(`[idGenerator] Received contextId in headers: ${contextId}`);
              return contextId;
            } else {
              const uuidGenerated = uuid();
              logger.debug(
                '[idGenerator] Did not receive contextId in header, generated new contextId: ',
                uuidGenerated
              );
              return uuidGenerated;
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            logger.error('[idGenerator] Error in idGenerator, generating fallback UUID', error);
            return uuid();
          }
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
export class ContextInterceptorModule {}
