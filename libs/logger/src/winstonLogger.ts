import { type LogData, LogLevel } from '@credebl/logger/log'
import type Logger from '@credebl/logger/logger.interface'
import * as ecsFormat from '@elastic/ecs-winston-format'
import { Inject, Injectable } from '@nestjs/common'
import * as winston from 'winston'
import * as Elasticsearch from 'winston-elasticsearch'

export const WinstonLoggerTransportsKey = Symbol()
let esTransport: winston.transport
if (process.env.ELK_LOG?.toLowerCase() === 'true') {
  const esTransportOpts = {
    level: `${process.env.LOG_LEVEL}`,
    clientOpts: {
      node: `${process.env.ELK_LOG_PATH}`,
      auth: {
        username: `${process.env.ELK_USERNAME}`,
        password: `${process.env.ELK_PASSWORD}`,
      },
    },
  }
  esTransport = new Elasticsearch.ElasticsearchTransport(esTransportOpts)

  esTransport.on('error', (_error) => {})
}

@Injectable()
export default class WinstonLogger implements Logger {
  private readonly logger: winston.Logger

  public constructor(@Inject(WinstonLoggerTransportsKey) transports: winston.transport[]) {
    if (esTransport) {
      transports.push(esTransport)
    }

    // Create winston logger
    this.logger = winston.createLogger(this.getLoggerFormatOptions(transports))
  }

  private getLoggerFormatOptions(transports: winston.transport[]): winston.LoggerOptions {
    // Setting log levels for winston
    const levels = {}
    let cont = 0

    Object.values(LogLevel).forEach((level) => {
      levels[level] = cont
      cont++
    })

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
        winston.format((info, _opts) => {
          // Info contains an Error property
          if (info.error && info.error instanceof Error) {
            info.stack = info.error.stack
            info.error = undefined
          }

          info.label = `${info.organization}.${info.context}.${info.app}`

          return info
        })(),
        // Add custom fields to the data property
        winston.format.metadata({
          key: 'data',
          fillExcept: ['timestamp', 'level', 'message'],
        }),
        // Format the log as JSON
        winston.format.json()
      ),
      transports,
      exceptionHandlers: transports,
    }
  }

  public log(level: LogLevel, message: string | Error, data?: LogData, profile?: string): void {
    const logData = {
      level: level,
      message: message instanceof Error ? message.message : message,
      error: message instanceof Error ? message : undefined,
      ...data,
    }

    if (profile) {
      this.logger.profile(profile, logData)
    } else {
      this.logger.log(logData)
    }
  }

  public debug(message: string, data?: LogData, profile?: string): void {
    this.log(LogLevel.Debug, message, data, profile)
  }

  public info(message: string, data?: LogData, profile?: string): void {
    this.log(LogLevel.Info, message, data, profile)
  }

  public warn(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Warn, message, data, profile)
  }

  public error(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Error, message, data, profile)
  }

  public fatal(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Fatal, message, data, profile)
  }

  public emergency(message: string | Error, data?: LogData, profile?: string): void {
    this.log(LogLevel.Emergency, message, data, profile)
  }

  public startProfile(id: string): void {
    this.logger.profile(id)
  }
}
