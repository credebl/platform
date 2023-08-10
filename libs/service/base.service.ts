/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs/operators';

export class BaseService {
  protected logger;
  
  constructor(loggerName: string) {
    this.logger = new Logger(loggerName);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendNats(serviceProxy: ClientProxy, cmd: string, payload: any): Promise<any> {
    const pattern = { cmd };

    return serviceProxy
      .send<string>(pattern, payload)
      .pipe(
        map((response: string) => ({
          response
        }))
      )
      .toPromise();
  }
}