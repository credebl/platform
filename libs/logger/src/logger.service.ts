import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import Logger, {
  LoggerBaseKey
} from '@credebl/logger/logger.interface';
import { LogData, LogLevel } from '@credebl/logger/log';
import { ConfigService } from '@nestjs/config';
import ContextStorageService, {
  ContextStorageServiceKey
} from '@credebl/context/contextStorageService.interface';
import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant';

@Injectable({ scope: Scope.TRANSIENT })
export default class LoggerService implements Logger {
  private sourceClass: string;
  private organization: string;
  private context: string;
  private app: string;

  public constructor(
    @Inject(LoggerBaseKey) private logger: Logger,
    configService: ConfigService,
    @Inject(INQUIRER) parentClass: object,
    @Inject(ContextStorageServiceKey)
    private contextStorageService: ContextStorageService,
    @Inject(MICRO_SERVICE_NAME) private readonly microserviceName: string
  ) {
    // Set the source class from the parent class
    this.sourceClass = parentClass?.constructor?.name;
    // Set the organization, context and app from the environment variables
    this.organization = configService.get<string>('ORGANIZATION');
    this.context = configService.get<string>('CONTEXT');
    this.app = configService.get<string>('APP');
  }

  public log(
    level: LogLevel,
    message: string | Error,
    data?: LogData,
    profile?: string,
  ): void {
    return this.logger.log(level, message, this.getLogData(data), profile);
  }

  // public log(
  //   message: string | Error,
  //   data?: LogData,
  //   profile?: string,
  // ): void {
  //   return this.logger.log(LogLevel.Info, message, this.getLogData(data), profile);
  // }

  // log(
  //   levelOrMessage: LogLevel | string | Error,
  //   messageOrData?: string | Error | LogData,
  //   dataOrProfile?: LogData | string,
  //   profile?: string
  // ): void {
  //   if ('string' === typeof levelOrMessage || levelOrMessage instanceof Error) {
  //     // Handling log(message, data?, profile?)
  //     this.logger.log(LogLevel.Info, levelOrMessage, this.getLogData(messageOrData as LogData), dataOrProfile as string);
  //   } else {
  //     // Handling log(level, message, data?, profile?)
  //     this.logger.log(levelOrMessage, messageOrData as string | Error, this.getLogData(dataOrProfile as LogData), profile);
  //   }
  // }

  public debug(message: string, data?: LogData, profile?: string) : void {
    return this.logger.debug(message, this.getLogData(data), profile);
  }

  public info(message: string, data?: LogData, profile?: string) : void {
    return this.logger.info(message, this.getLogData(data), profile);
  }

  public warn(message: string | Error, data?: LogData, profile?: string) : void {
    return this.logger.warn(message, this.getLogData(data), profile);
  }

  public error(message: string | Error, data?: LogData, profile?: string) : void {
    return this.logger.error(message, this.getLogData(data), profile);
  }

  public fatal(message: string | Error, data?: LogData, profile?: string) : void {
    return this.logger.fatal(message, this.getLogData(data), profile);
  }

  public emergency(message: string | Error, data?: LogData, profile?: string) : void {
    return this.logger.emergency(message, this.getLogData(data), profile);
  }

  private getLogData(data?: LogData): LogData {
    return {
      ...data,
      organization: data?.organization || this.organization,
      context: data?.context || this.context,
      app: data?.app || this.app,
      sourceClass: data?.sourceClass || this.sourceClass,
      correlationId:
        data?.correlationId || this.contextStorageService.getContextId()
    };
  }

  public startProfile(id: string) : void {
    this.logger.startProfile(id);
  }
}
