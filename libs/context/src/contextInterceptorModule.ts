import { ExecutionContext, Global, Module} from '@nestjs/common';
import { v4 } from 'uuid';
import { ClsModule } from 'nestjs-cls';

import { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import NestjsClsContextStorageService from '@credebl/context/nestjsClsContextStorageService';


@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,

         generateId: true,
         idGenerator: (context: ExecutionContext) => context.switchToRpc().getContext().getHeaders()['_description'] ?? v4()
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