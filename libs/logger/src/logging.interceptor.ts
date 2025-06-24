import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import ContextStorageService, { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import Logger, { LoggerKey } from './logger.interface';
import { ClsService } from 'nestjs-cls';
import { v4 } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNullUndefinedOrEmpty = (obj: any): boolean =>
  null === obj || obj === undefined || ('object' === typeof obj && 0 === Object.keys(obj).length);

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly clsService: ClsService,
    @Inject(ContextStorageServiceKey)
    private readonly contextStorageService: ContextStorageService,
    @Inject(LoggerKey) private readonly _logger: Logger
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.clsService.run(() => {
      this._logger.info('In LoggingInterceptor configuration');
      const rpcContext = context.switchToRpc().getContext();
      const headers = rpcContext.getHeaders();

      if (!isNullUndefinedOrEmpty(headers) && headers._description) {
        this.contextStorageService.set('x-correlation-id', headers._description);
        this.contextStorageService.setContextId(headers._description);
      } else {
        const newContextId = v4();
        this.contextStorageService.set('x-correlation-id', newContextId);
        this.contextStorageService.setContextId(newContextId);
      }
      //TODO: Uncomment this when user context needs to be set
      // const userDetails =
      //   context.switchToHttp?.().getRequest?.().user ||
      //   rpcContext?.user ||
      //   rpcContext?.getUser?.();
      // if (testUser) {
      //   this.contextStorageService.set('user', testUser);
      //   console.log('✅ Set user in contextStorageService:', testUser);
      // } else {
      //   console.log('⚠️ No user found in context');
      // }

      return next.handle().pipe(
        catchError((err) => {
          this._logger.error(err);
          return throwError(() => err);
        })
      );
    });
  }
}
