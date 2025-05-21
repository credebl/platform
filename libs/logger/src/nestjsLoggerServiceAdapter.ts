import type { LogData } from '@credebl/logger/log'
import type Logger from '@credebl/logger/logger.interface'
import { ConsoleLogger } from '@nestjs/common'
import type { LoggerService } from '@nestjs/common/services/logger.service'

export default class NestjsLoggerServiceAdapter extends ConsoleLogger implements LoggerService {
  public constructor(private readonly logger: Logger) {
    super()
  }

  public info(message: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, this.getLogData(optionalParams))
  }

  public log(message: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, this.getLogData(optionalParams))
  }

  public error(message: string, ...optionalParams: unknown[]): void {
    this.logger.error(message, this.getLogData(optionalParams))
  }

  public warn(message: string, ...optionalParams: unknown[]) {
    this.logger.warn(message, this.getLogData(optionalParams))
  }

  public debug(message: string, ...optionalParams: unknown[]) {
    this.logger.debug(message, this.getLogData(optionalParams))
  }

  public verbose(message: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, this.getLogData(optionalParams))
  }

  private getLogData(optionalParams: unknown[]): LogData {
    return {
      sourceClass: typeof optionalParams[0] === 'string' ? optionalParams[0] : undefined,
    }
  }
}
