import {
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule
} from '@nestjs/common';

import WinstonLogger, {
  WinstonLoggerTransportsKey
} from './winstonLogger';
import Logger, {
  LoggerBaseKey,
  LoggerKey
} from './logger.interface';
import {NestjsLoggerServiceAdapter} from './nestjsLoggerServiceAdapter';
import ConsoleTransport from './transports/consoleTransport';
import * as morgan from 'morgan';
import { ConfigService } from '@credebl/config';
import LoggerService from './logger.service';
import { MICRO_SERVICE_NAME } from '@credebl/common';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: LoggerBaseKey,
      useClass: WinstonLogger
    },
    {
      provide: LoggerKey,
      useClass: LoggerService
    },
    {
      provide: NestjsLoggerServiceAdapter,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      useFactory: (logger: Logger) => new NestjsLoggerServiceAdapter(logger),
      inject: [LoggerKey]
    },
    {
      provide: WinstonLoggerTransportsKey,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
      useFactory: (configService: ConfigService) => {
        const transports = [];

        transports.push(ConsoleTransport.createColorize());
        return transports;
      },
      inject: [ConfigService, MICRO_SERVICE_NAME]
    }
  ],
  exports: [LoggerKey, NestjsLoggerServiceAdapter]
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
                sourceClass: 'RequestLogger'
              });
            }
          }
        })
      )
      .forRoutes('*');
  }
}
