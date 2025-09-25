/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { NatsRecordBuilder } from '@nestjs/microservices';
import { map } from 'rxjs/operators';
import * as nats from 'nats';
import { firstValueFrom } from 'rxjs';
import ContextStorageService, { ContextStorageServiceKey } from '../../context/src/contextStorageService.interface';
import { v4 } from 'uuid';

@Injectable()
export class NATSClient {
  private readonly logger: Logger;
  constructor(
    @Inject(ContextStorageServiceKey)
    private readonly contextStorageService: ContextStorageService
  ) {
    this.logger = new Logger('NATSClient');
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendNats(serviceProxy, cmd: string, payload: any): Promise<any> {
    this.logger.log(`Inside NATSClient for sendNats()`);
    const pattern = { cmd };
    const contextId = this.contextStorageService.getContextId() ?? v4();
    const headers = nats.headers();
    headers.set('contextId', contextId);
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    return firstValueFrom(
      serviceProxy.send(pattern, record).pipe(
        map((response: string) => ({
          // This map return the reposne as `{response: string}` instead of just the `string`
          response
        }))
      )
    );
  }

  sendNatsMessage(serviceProxy, cmd: string, payload: any): Promise<any> {
    const pattern = { cmd };
    const contextId = this.contextStorageService.getContextId() ?? v4();
    const headers = nats.headers();
    headers.set('contextId', contextId);
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    const result = serviceProxy.send(pattern, record);

    return firstValueFrom(result);
  }

  send<T>(serviceProxy, pattern: object, payload: any): Promise<T> {
    const contextId = this.contextStorageService.getContextId() ?? v4();
    const headers = nats.headers();
    headers.set('contextId', contextId);
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    const result = serviceProxy.send(pattern, record);

    return firstValueFrom(result);
  }
}
