import { ExecutionContext, Global, Logger, Module } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from './contextStorageService.interface';
import NestjsClsContextStorageService from './nestjsClsContextStorageService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNullUndefinedOrEmpty = (obj: any): boolean =>
  null === obj || obj === undefined || ('object' === typeof obj && 0 === Object.keys(obj).length);

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,

        generateId: true,
        idGenerator: (context: ExecutionContext) => {
          try {
            const logger = new Logger('ContextInterceptorModule');
            const rpcContext = context.switchToRpc().getContext();
            const headers = rpcContext.getHeaders() ?? {};
            if (!isNullUndefinedOrEmpty(headers)) {
              logger.debug(`[idGenerator] Received contextId in headers: ${headers.get('contextId')}`);
              return headers.get('contextId');
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
            console.log('[idGenerator] Error in idGenerator: ', error);
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
