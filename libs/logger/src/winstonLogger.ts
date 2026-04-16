import * as winston from 'winston';
import { Inject, Injectable } from '@nestjs/common';
import { LogData, LogLevel } from '@credebl/logger/log';
import Logger from '@credebl/logger/logger.interface';

export const WinstonLoggerTransportsKey = Symbol();
let esTransport;

@Injectable()
export default class WinstonLogger implements Logger {
  private readonly logger: winston.Logger;

  public constructor(@Inject(WinstonLoggerTransportsKey) transports: winston.transport[]) {
    if (esTransport) {
      transports.push(esTransport);
    }

    // Create winston logger
    this.logger = winston.createLogger(this.getLoggerFormatOptions(transports));
  }

  private getLoggerFormatOptions(transports: winston.transport[]): winston.LoggerOptions {
    // Setting log levels for winston
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const levels: any = {};
    let cont = 0;
    Object.values(LogLevel).forEach((level) => {
      levels[level] = cont;
      cont++;
    });

    return {
      level: LogLevel.Debug,
      levels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format((info) => {
          if (info.error && info.error instanceof Error) {
            info.stack = info.error.stack;
            info.error = undefined;
          }

          info.label = `${info.organization}.${info.context}.${info.app}`;

          return info;
        })(),
        winston.format.metadata({
          key: 'data',
          fillExcept: ['timestamp', 'level', 'message']
        }),
        winston.format.json()
      ),
      transports,
      exceptionHandlers: transports
    };
  }

  public log(level: LogLevel, message: string | Error, data?: LogData, profile?: string): void {
    const logData = {
      level,
      message: message instanceof Error ? message.message : message,
      error: message instanceof Error ? message : undefined,
      ...data
    };

    if (profile) {
      this.logger.profile(profile, logData);
    } else {
      this.logger.log(logData);
    }
  }

  public debug(message: string, data?: LogData, profile?: string): void {
    this.log(LogLevel.Debug, message, data, profile);
  }

  public info(message: string, data?: LogData, profile?: string): void {
    this.log(LogLevel.Info, message, data, profile);
  }

  public warn(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Warn, message, data, profile);
  }

  public error(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Error, message, data, profile);
  }

  public fatal(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Fatal, message, data, profile);
  }

  public emergency(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Emergency, message, data, profile);
  }

  public startProfile(id: string): void {
    this.logger.profile(id);
  }
}
