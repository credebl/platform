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
      .toPromise()
      .catch((error) => {
        this.logger.error(`catch: ${JSON.stringify(error)}`);
        if (error && error.message) {
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            },
            error.statusCode
          );
        } else if (error) {
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.error
            },
            error.statusCode
            
          );
        } else {
          this.logger.error(
            `The error received was in an unexpected format. Returning generic 500 error... ${JSON.stringify(
              error
            )}`
          );
          throw new HttpException(
            {
              status: 500,
              error: error.message
            },
            500
          );
        }
      });
  }
}
