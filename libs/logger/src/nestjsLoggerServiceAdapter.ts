/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConsoleLogger } from '@nestjs/common';
import Logger from './logger.interface';
import { LoggerService } from '@nestjs/common/services/logger.service';
import { LogData } from './log';

export default class NestjsLoggerServiceAdapter
  extends ConsoleLogger
  implements LoggerService {
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
      sourceClass: optionalParams[0] ? optionalParams[0] : undefined,
    };
  }
}
