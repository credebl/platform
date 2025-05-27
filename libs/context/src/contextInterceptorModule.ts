import { type ExecutionContext, Global, Module } from '@nestjs/common'
import { ClsModule } from 'nestjs-cls'
import { v4 } from 'uuid'

import { ContextStorageServiceKey } from './contextStorageService.interface'
import NestjsClsContextStorageService from './nestjsClsContextStorageService'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const isNullUndefinedOrEmpty = (obj: any): boolean =>
  obj === null || obj === undefined || (typeof obj === 'object' && Object.keys(obj).length === 0)

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      interceptor: {
        mount: true,

        generateId: true,
        idGenerator: (context: ExecutionContext) => {
          const rpcContext = context.switchToRpc().getContext()
          const headers = rpcContext.getHeaders()
          if (!isNullUndefinedOrEmpty(headers)) {
            return context.switchToRpc().getContext().getHeaders()?._description
          }
          return v4()
        },
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: ContextStorageServiceKey,
      useClass: NestjsClsContextStorageService,
    },
  ],
  exports: [ContextStorageServiceKey],
})
export class ContextInterceptorModule {}
