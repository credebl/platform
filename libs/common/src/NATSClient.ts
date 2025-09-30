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
  sendNats(serviceProxy: Pick<ClientProxy, 'send'>, cmd: string, payload: any): Promise<any> {
    this.logger.log(`Inside NATSClient for sendNats()`);
    const pattern = { cmd };
    const contextId = this.contextStorageService.getContextId() ?? v4();
    const headers = nats.headers();
    headers.set('contextId', contextId);
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    return firstValueFrom(
      serviceProxy.send<string>(pattern, record).pipe(
        /**
         * TODO: Check dependency of this mapping.
         * This might be the reason we are getting, response.response in multiple responses
         * We are maintaining them as is for now, but it need to be updated later
         */
        map((response: string) => ({
          // This map return the reposne as `{response: string}` instead of just the `string`
          response
        }))
      )
    );
  }

  sendNatsMessage(serviceProxy: Pick<ClientProxy, 'send'>, cmd: string, payload: any): Promise<any> {
    const pattern = { cmd };
    const contextId = this.contextStorageService.getContextId() ?? v4();
    const headers = nats.headers();
    headers.set('contextId', contextId);
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    const result = serviceProxy.send<string>(pattern, record);

    return firstValueFrom(result);
  }

  send<T>(serviceProxy: Pick<ClientProxy, 'send'>, pattern: object, payload: any): Promise<T> {
    const contextId = this.contextStorageService.getContextId() ?? v4();
    const headers = nats.headers();
    headers.set('contextId', contextId);
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build();

    const result = serviceProxy.send<T>(pattern, record);

    return firstValueFrom(result);
  }
}
