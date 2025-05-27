import { CommonConstants } from '@credebl/common/common.constant'
// import { nkeyAuthenticator } from 'nats';
import { getNatsOptions } from '@credebl/common/nats.config'
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { type MicroserviceOptions, Transport } from '@nestjs/microservices'
import { HttpExceptionFilter } from 'libs/http-exception.filter'
import { OrganizationModule } from './organization.module'

const logger = new Logger()

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrganizationModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.ORGANIZATION_SERVICE, process.env.ORGANIZATION_NKEY_SEED),
  })
  app.useLogger(app.get(NestjsLoggerServiceAdapter))
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen()
  logger.log('Organization Microservice is listening to NATS ')
}
bootstrap()
