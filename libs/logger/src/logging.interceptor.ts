import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import ContextStorageService, { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import Logger, { LoggerKey } from './logger.interface';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly clsService: ClsService,
    @Inject(ContextStorageServiceKey)
  private contextStorageService: ContextStorageService,
  @Inject(LoggerKey) private _logger: Logger,
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.clsService.run(() => {
    console.log(`Now intercepting call for microservice`);
    console.log(JSON.stringify(context.switchToRpc().getData(), null, 2));
    console.log(`RPC data:`, JSON.stringify(context.switchToRpc().getContext().getHeaders(), null, 2));

    const rpcContext = context.switchToRpc().getContext();
    const headers = rpcContext.getHeaders();     
    // if (isJson(rpcContext.args[0])) {
    //   store.ndiLogger.setContext(JSON.parse(rpcContext.args[0]).endpoint);
    // } else {
    //   store.ndiLogger.setContext(rpcContext.args[0]);
    // }   
    console.log(`JSON.parse(rpcContext.args[0]) headers._description : ${headers._description}`);
    console.log(`contextStorageService OBJ : ${this.contextStorageService}`);
    this.contextStorageService.set('x-correlation-id', headers._description);
    console.log(`x-correlation-id is set............`);
    this.contextStorageService.setContextId(headers._description);

    this._logger.info('In Interceptor configuration');
   
    return next.handle().pipe(
      catchError((err) => {
        console.log(`${err}`);
        this._logger.error(err);
        return throwError(() => err);
      }),
    );

  });

  }

}
