import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { type MicroserviceOptions, Transport } from '@nestjs/microservices'
import { HttpExceptionFilter } from 'libs/http-exception.filter'
import { ConnectionModule } from './connection.module'

const logger = new Logger()

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ConnectionModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.CONNECTION_NKEY_SEED),
  })

  app.useLogger(app.get(NestjsLoggerServiceAdapter))
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen()
  logger.log('Connection-Service Microservice is listening to NATS ')
}
bootstrap()
