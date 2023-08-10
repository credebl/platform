import { HttpException, Logger } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs/operators';

export class BaseService {
  protected logger;
  
  constructor(loggerName: string) {
    this.logger = new Logger(loggerName);
  }

  sendNats(serviceProxy: ClientProxy, cmd: string, payload: any): Promise<any> {
    
    const startTs = Date.now();
    const pattern = { cmd };

    return serviceProxy
      .send<string>(pattern, payload)
      .pipe(
        map((response: string) => ({
          response
          //duration: Date.now() - startTs,
        }))
      )
      .toPromise();
  }
}
