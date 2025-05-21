import { Global, Inject, type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'

import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant'
import type Logger from '@credebl/logger/logger.interface'
import { LoggerBaseKey, LoggerKey } from '@credebl/logger/logger.interface'
import LoggerService from '@credebl/logger/logger.service'
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter'
import ConsoleTransport from '@credebl/logger/transports/consoleTransport'
import WinstonLogger, { WinstonLoggerTransportsKey } from '@credebl/logger/winstonLogger'
import * as morgan from 'morgan'
import { ConfigService } from '../../config/src/config.service'

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: LoggerBaseKey,
      useClass: WinstonLogger,
    },
    {
      provide: LoggerKey,
      useClass: LoggerService,
    },
    {
      provide: NestjsLoggerServiceAdapter,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      useFactory: (logger: Logger) => new NestjsLoggerServiceAdapter(logger),
      inject: [LoggerKey],
    },
    {
      provide: WinstonLoggerTransportsKey,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
      useFactory: (_configService: ConfigService) => {
        const transports = []

        transports.push(ConsoleTransport.createColorize())
        return transports
      },
      inject: [ConfigService, MICRO_SERVICE_NAME],
    },
  ],
  exports: [LoggerKey, NestjsLoggerServiceAdapter],
})
export class LoggerModule implements NestModule {
  public constructor(
    @Inject(LoggerKey) private readonly logger: Logger,
    private readonly configService: ConfigService
  ) {}

  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        morgan(this.configService.isProduction ? 'combined' : 'dev', {
          stream: {
            write: (message: string) => {
              this.logger.debug(message, {
                sourceClass: 'RequestLogger',
              })
            },
          },
        })
      )
      .forRoutes('*')
  }
}
