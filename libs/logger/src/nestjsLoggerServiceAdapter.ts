/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import Logger from '@credebl/logger/logger.interface';
import { LoggerService } from '@nestjs/common/services/logger.service';
import { LogData } from '@credebl/logger/log';
import api from '@opentelemetry/api';

export default class NestjsLoggerServiceAdapter extends ConsoleLogger implements LoggerService {
  public constructor(private readonly logger: Logger) {
    super();
  }

  public info(message: any, ...optionalParams: any[]): void {
    this.logger.info(message, this.getLogData(optionalParams));
  }

  public log(message: any, ...optionalParams: any[]): void {
    this.logger.info(message, this.getLogData(optionalParams));
  }

  public error(message: any, ...optionalParams: any[]): void {
    this.logger.error(message, this.getLogData(optionalParams));
  }

  public warn(message: any, ...optionalParams: any[]): void {
    this.logger.warn(message, this.getLogData(optionalParams));
  }

  public debug(message: any, ...optionalParams: any[]): void {
    this.logger.debug(message, this.getLogData(optionalParams));
  }

  public verbose(message: any, ...optionalParams: any[]): void {
    this.logger.info(message, this.getLogData(optionalParams));
  }

  private getLogData(...optionalParams: any[]): LogData {
    return {
      sourceClass: optionalParams[0] ? optionalParams[0] : undefined
    };
  }
}

@Injectable({ scope: Scope.TRANSIENT })
export class MyLoggerService extends ConsoleLogger {
  customLog(message: string): void {
    const activeSpan = api.trace.getSpan(api.context.active());
    if (activeSpan) {
      activeSpan.addEvent(message);
    }
    this.log(message);
  }
}
