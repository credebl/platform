import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { type MicroserviceOptions, Transport } from '@nestjs/microservices'
import { HttpExceptionFilter } from 'libs/http-exception.filter'
import { UtilitiesModule } from './utilities.module'

const logger = new Logger()

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UtilitiesModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.UTILITY_SERVICE, process.env.UTILITIES_NKEY_SEED),
  })
  app.useLogger(app.get(NestjsLoggerServiceAdapter))
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen()
  logger.log('utilities Microservice is listening to NATS ')
}
bootstrap()
