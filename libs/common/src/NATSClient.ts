/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, Logger } from '@nestjs/common';

import { ClientProxy, NatsRecordBuilder } from '@nestjs/microservices';
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
  sendNats(serviceProxy: ClientProxy, cmd: string, payload: any): Promise<any> {
    this.logger.log(`Inside NATSClient for sendNats()`);
    const pattern = { cmd };
    const headers = nats.headers(1, this.contextStorageService.getContextId());
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    return serviceProxy
      .send<string>(pattern, record)
      .pipe(
        map((response: string) => ({
          response
        }))
      )
      .toPromise();
  }

  sendNatsMessage(serviceProxy: ClientProxy, cmd: string, payload: any): Promise<any> {
    const pattern = { cmd };
    const headers = nats.headers(1, this.contextStorageService.getContextId());
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    const result = serviceProxy.send<string>(pattern, record);

    return firstValueFrom(result);
  }

  send<T>(serviceProxy: ClientProxy, pattern: object, payload: any): Promise<T> {
    let contextId = this.contextStorageService.getContextId();

    if (!contextId) {
      contextId = v4();
    }

    const headers = nats.headers(1, contextId);
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    const result = serviceProxy.send<T>(pattern, record);

    return firstValueFrom(result);
  }
}
