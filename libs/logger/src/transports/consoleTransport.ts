/* eslint-disable @typescript-eslint/no-explicit-any */
import * as winston from 'winston';
import { LogLevel } from '@credebl/logger/log';

enum LogColors {
  red = '\x1b[31m',
  green = '\x1b[32m',
  yellow = '\x1b[33m',
  blue = '\x1b[34m',
  magenta = '\x1b[35m',
  cyan = '\x1b[36m',
  pink = '\x1b[38;5;206m',
}
interface LogData {
  label?: string;
  '@timestamp'?: string;
  correlationId?: string;
  sourceClass?: string;
  error?: string;
  durationMs?: number;
  stack?: string;
  props?: Record<string, any>;
}

export default class ConsoleTransport {
  public static createColorize(): winston.transports.ConsoleTransportInstance {
    return new winston.transports.Console({
      format: winston.format.combine(
        winston.format.printf((log) => {
          const data = log.data as LogData;
          const color = ConsoleTransport.mapLogLevelColor(log.level as LogLevel);
          const prefix = data.label ? `[${data.label}]` : '';
          const timestamp = data['@timestamp'];
          const correlationId = data.correlationId
            ? `(${ConsoleTransport.colorize(LogColors.cyan, data.correlationId)})`
            : '';
          const level = ConsoleTransport.colorize(color, log.level.toUpperCase());
          const sourceClass = data.sourceClass
            ? `${ConsoleTransport.colorize(LogColors.yellow, `[${data.sourceClass}]`)}`
            : '';
          const message = ConsoleTransport.colorize(color, `${log.message}`);
          const error = data.error ? ` - ${data.error}` : '';
          const duration = data.durationMs !== undefined
            ? ` +${data.durationMs}ms`
            : '';
          const stack = data.stack ? ` - ${data.stack}` : '';
          const props = data.props
            ? `\n  - Props: ${JSON.stringify(data.props, null, 4)}`
            : '';

          return `${ConsoleTransport.colorize(color, `${prefix} -`)} ${timestamp} ${correlationId} ${level} ${sourceClass} ${message}${error}${duration}${stack}${props}`;
        })
      )
    });
  }

  private static colorize(color: LogColors, message: string): string {
    return `${color}${message}\x1b[0m`;
  }

  private static mapLogLevelColor(level: LogLevel): LogColors {
    switch (level) {
      case LogLevel.Debug:
        return LogColors.blue;
      case LogLevel.Info:
        return LogColors.green;
      case LogLevel.Warn:
        return LogColors.yellow;
      case LogLevel.Error:
        return LogColors.red;
      case LogLevel.Fatal:
        return LogColors.magenta;
      case LogLevel.Emergency:
        return LogColors.pink;
      default:
        return LogColors.cyan;
    }
  }
}
