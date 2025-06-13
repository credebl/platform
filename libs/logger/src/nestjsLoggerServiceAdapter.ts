/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';
import api from '@opentelemetry/api';
import Logger from '@credebl/logger/logger.interface';
import { LoggerService } from '@nestjs/common/services/logger.service';
import { LogData } from '@credebl/logger/log';

export default class NestjsLoggerServiceAdapter extends ConsoleLogger implements LoggerService {
  public constructor(private readonly logger: Logger) {
    super();
  }

  public info(message: any, ...optionalParams: any[]): void {
    return this.logger.info(message, this.getLogData(optionalParams));
  }

  public log(message: any, ...optionalParams: any[]): void {
    return this.logger.info(message, this.getLogData(optionalParams));
  }

  public error(message: any, ...optionalParams: any[]): void {
    return this.logger.error(message, this.getLogData(optionalParams));
  }

  public warn(message: any, ...optionalParams: any[]): void {
    return this.logger.warn(message, this.getLogData(optionalParams));
  }

  public debug(message: any, ...optionalParams: any[]): void {
    return this.logger.debug(message, this.getLogData(optionalParams));
  }

  public verbose(message: any, ...optionalParams: any[]): void {
    return this.logger.info(message, this.getLogData(optionalParams));
  }

  private getLogData(...optionalParams: any[]): LogData {
    return {
      sourceClass: optionalParams[0] ? optionalParams[0] : undefined
    };
  }
}

@Injectable({ scope: Scope.TRANSIENT })
export class MyLoggerService extends ConsoleLogger {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
  customLog(message: string) {
    const activeSpan = api.trace.getSpan(api.context.active());
    activeSpan?.addEvent(message);
    this.log(message);
  }
}
