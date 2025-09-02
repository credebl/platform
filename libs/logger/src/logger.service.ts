import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import Logger, { LoggerBaseKey } from '@credebl/logger/logger.interface';
import { LogData, LogLevel } from '@credebl/logger/log';
import { ConfigService } from '@nestjs/config';
import ContextStorageService, { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { otelLogger } from '../../../apps/api-gateway/src/tracer';

@Injectable({ scope: Scope.TRANSIENT })
export default class LoggerService implements Logger {
  private readonly sourceClass: string;
  private readonly organization: string;
  private readonly context: string;
  private readonly app: string;

  public constructor(
    @Inject(LoggerBaseKey) private readonly logger: Logger,
    configService: ConfigService,
    @Inject(INQUIRER) parentClass: object,
    @Inject(ContextStorageServiceKey)
    private readonly contextStorageService: ContextStorageService,
    @Inject(MICRO_SERVICE_NAME) private readonly microserviceName: string
  ) {
    this.sourceClass = parentClass?.constructor?.name;
    this.organization = configService.get<string>('ORGANIZATION');
    this.context = configService.get<string>('CONTEXT');
    this.app = configService.get<string>('APP');
  }

  public log(level: LogLevel, message: string | Error, data?: LogData, profile?: string): void {
    this.emitToOtel(level, message, data);
    this.logger.log(level, message, this.getLogData(data), profile);
  }

  public debug(message: string, data?: LogData, profile?: string): void {
    this.emitToOtel('DEBUG', message, data);
    this.logger.debug(message, this.getLogData(data), profile);
  }

  public info(message: string, data?: LogData, profile?: string): void {
    this.emitToOtel('INFO', message, data);
    this.logger.info(message, this.getLogData(data), profile);
  }

  public warn(message: string | Error, data?: LogData, profile?: string): void {
    this.emitToOtel('WARN', message, data);
    this.logger.warn(message, this.getLogData(data), profile);
  }

  public error(message: string | Error, data?: LogData, profile?: string): void {
    this.emitToOtel('ERROR', message, data);
    this.logger.error(message, this.getLogData(data), profile);
  }

  public fatal(message: string | Error, data?: LogData, profile?: string): void {
    this.emitToOtel('FATAL', message, data);
    this.logger.fatal(message, this.getLogData(data), profile);
  }

  public emergency(message: string | Error, data?: LogData, profile?: string): void {
    this.emitToOtel('EMERGENCY', message, data);
    this.logger.emergency(message, this.getLogData(data), profile);
  }

  public startProfile(id: string): void {
    this.logger.startProfile(id);
  }

  private emitToOtel(severityText: string, message: string | Error, data?: LogData): void {
    try {
      if (!otelLogger) {
        return;
      }
      const correlationId = data?.correlationId || this.contextStorageService.getContextId();

      const attributes = {
        app: data?.app || this.app,
        organization: data?.organization || this.organization,
        context: data?.context || this.context,
        sourceClass: data?.sourceClass || this.sourceClass,
        correlationId,
        microservice: this.microserviceName,
        ...(data ?? {})
      };

      if (data?.error) {
        let errorValue;

        if ('string' === typeof data.error) {
          errorValue = data.error;
        } else if (data.error instanceof Error) {
          errorValue = {
            name: data.error.name,
            message: data.error.message,
            stack: data.error.stack
          };
        } else if ('object' === typeof data.error) {
          errorValue = JSON.parse(JSON.stringify(data.error));
        } else {
          errorValue = String(data.error);
        }

        attributes.error = errorValue;
      }

      otelLogger.emit({
        body: `${correlationId} ${'string' === typeof message ? message : message.message}`,
        severityText,
        attributes
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to emit log to OpenTelemetry:', err);
    }
  }

  private getLogData(data?: LogData): LogData {
    return {
      ...data,
      organization: data?.organization || this.organization,
      context: data?.context || this.context,
      app: data?.app || this.app,
      sourceClass: data?.sourceClass || this.sourceClass,
      correlationId: data?.correlationId || this.contextStorageService.getContextId()
    };
  }
}
