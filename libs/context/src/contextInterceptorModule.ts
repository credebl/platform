import { ExecutionContext, Global, Module} from '@nestjs/common';
import { v4 } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import NestjsClsContextStorageService from '@credebl/context/nestjsClsContextStorageService';


const isNullUndefinedOrEmpty = (obj: any): boolean => {
  return obj === null || obj === undefined || (typeof obj === 'object' && Object.keys(obj).length === 0);
};

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,

         generateId: true,
         idGenerator: (context: ExecutionContext) => {
          const rpcContext = context.switchToRpc().getContext();
          const headers = rpcContext.getHeaders();    
          if (!isNullUndefinedOrEmpty(headers)) {
            return context.switchToRpc().getContext().getHeaders()['_description'];
          } else {
            return v4();
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

