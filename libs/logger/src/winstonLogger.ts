import * as winston from 'winston';
import { Inject, Injectable } from '@nestjs/common';
import { LogData, LogLevel } from '@credebl/logger/log';
import Logger from '@credebl/logger/logger.interface';
import * as Elasticsearch from 'winston-elasticsearch';
import * as ecsFormat from '@elastic/ecs-winston-format';

export const WinstonLoggerTransportsKey = Symbol();
let esTransport;
if ('true' === process.env.ELK_LOG?.toLowerCase()) {
  const requiredVars = ['LOG_LEVEL', 'ELK_LOG_PATH', 'ELK_USERNAME', 'ELK_PASSWORD'];
  const missingVars = requiredVars.filter((v) => !process.env[v]);
  if (0 < missingVars.length) {
    // eslint-disable-next-line no-console
    console.warn(`Elasticsearch logging disabled: missing env vars [${missingVars.join(', ')}]`);
  } else {
    const esTransportOpts = {
      level: `${process.env.LOG_LEVEL}`,
      clientOpts: {
        node: `${process.env.ELK_LOG_PATH}`,
        auth: {
          username: `${process.env.ELK_USERNAME}`,
          password: `${process.env.ELK_PASSWORD}`
        }
      }
    };
    esTransport = new Elasticsearch.ElasticsearchTransport(esTransportOpts);
    esTransport.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error('Elasticsearch transport error:', error);
    });
  }
}

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
      // format: ecsFormat.ecsFormat({ convertReqRes: true }),
      format: winston.format.combine(
        ecsFormat.ecsFormat({ convertReqRes: true }),
        // Add timestamp and format the date
        // winston.format.timestamp({
        //   format: 'DD/MM/YYYY, HH:mm:ss',
        // }),
        // Errors will be logged with stack trace
        winston.format.errors({ stack: true }),
        // Add custom Log fields to the log
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        winston.format((info, _opts) => {
          // Info contains an Error property
          if (info.error && info.error instanceof Error) {
            info.stack = info.error.stack;
            info.error = undefined;
          }

          info.label = `${info.organization}.${info.context}.${info.app}`;

          return info;
        })(),
        // Add custom fields to the data property
        winston.format.metadata({
          key: 'data',
          fillExcept: ['timestamp', 'level', 'message']
        }),
        // Format the log as JSON
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
