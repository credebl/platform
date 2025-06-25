import { ExecutionContext, Global, Module} from '@nestjs/common';
import { v4 } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from './contextStorageService.interface';
import NestjsClsContextStorageService from './nestjsClsContextStorageService';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNullUndefinedOrEmpty = (obj: any): boolean => null === obj || obj === undefined || ('object' === typeof obj && 0 === Object.keys(obj).length);

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

