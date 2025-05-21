/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, Logger } from '@nestjs/common'

import { type ClientProxy, NatsRecordBuilder } from '@nestjs/microservices'
import * as nats from 'nats'
import { firstValueFrom } from 'rxjs'
import { map } from 'rxjs/operators'
import { v4 } from 'uuid'
import type ContextStorageService from '../../context/src/contextStorageService.interface'
import { ContextStorageServiceKey } from '../../context/src/contextStorageService.interface'

@Injectable()
export class NATSClient {
  private readonly logger: Logger
  constructor(
    @Inject(ContextStorageServiceKey)
    private readonly contextStorageService: ContextStorageService
  ) {
    this.logger = new Logger('NATSClient')
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  sendNats(serviceProxy: ClientProxy, cmd: string, payload: any): Promise<any> {
    this.logger.log('Inside NATSClient for sendNats()')
    const pattern = { cmd }
    const headers = nats.headers(1, this.contextStorageService.getContextId())
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build()

    return serviceProxy
      .send<string>(pattern, record)
      .pipe(
        map((response: string) => ({
          response,
        }))
      )
      .toPromise()
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  sendNatsMessage(serviceProxy: ClientProxy, cmd: string, payload: any): Promise<any> {
    const pattern = { cmd }
    const headers = nats.headers(1, this.contextStorageService.getContextId())
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build()

    const result = serviceProxy.send<string>(pattern, record)

    return firstValueFrom(result)
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  send<T>(serviceProxy: ClientProxy, pattern: object, payload: any): Promise<T> {
    let contextId = this.contextStorageService.getContextId()

    if (!contextId) {
      contextId = v4()
    }

    const headers = nats.headers(1, contextId)
    const record = new NatsRecordBuilder(payload).setHeaders(headers).build()

    const result = serviceProxy.send<T>(pattern, record)

    return firstValueFrom(result)
  }
}
