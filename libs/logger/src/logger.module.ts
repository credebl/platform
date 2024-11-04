import {
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import WinstonLogger, {
  WinstonLoggerTransportsKey,
} from '@credebl/logger/winstonLogger';
import Logger, {
  LoggerBaseKey,
  LoggerKey,
} from '@credebl/logger/logger.interface';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import ConsoleTransport from '@credebl/logger/transports/consoleTransport';
import * as morgan from 'morgan';
import FileTransport from '@credebl/logger/transports/fileTransport';
import { ConfigService } from '@credebl/config/config.service';
import LoggerService from '@credebl/logger/logger.service';
import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config/global-config.module';

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
      useFactory: (logger: Logger) => new NestjsLoggerServiceAdapter(logger),
      inject: [LoggerKey],
    },
    {
      provide: WinstonLoggerTransportsKey,
      useFactory: (configService: ConfigService) => {
        const transports = [];

        transports.push(ConsoleTransport.createColorize());

        //transports.push(FileTransport.create());

        // if (configService.isProduction) {
        //   if (configService.slackWebhookUrl) {
        //     transports.push(
        //       SlackTransport.create(configService.slackWebhookUrl),
        //     );
        //   }
        // }

        return transports;
      },
      inject: [ConfigService, MICRO_SERVICE_NAME]
    }
  ],
  exports: [LoggerKey, NestjsLoggerServiceAdapter],
})
export class LoggerModule implements NestModule {
  public constructor(
    @Inject(LoggerKey) private logger: Logger,
    private configService: ConfigService,
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
