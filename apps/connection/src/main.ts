// import { NestFactory } from '@nestjs/core';
// import { ConnectionModule } from './connection.module';
// import { HttpExceptionFilter } from '@credebl/common';
// import { Logger } from '@nestjs/common';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import { getNatsOptions } from '@credebl/common';
// import { CommonConstants } from '@credebl/common';
// import {NestjsLoggerServiceAdapter} from '@credebl/logger';
import { bootstrapConnectionService } from './bootstrap';

// const logger = new Logger();

// async function bootstrap(): Promise<void> {

//   const app = await NestFactory.createMicroservice<MicroserviceOptions>(ConnectionModule, {
//     transport: Transport.NATS,
//     options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.CONNECTION_NKEY_SEED)
//   });
  
//   app.useLogger(app.get(NestjsLoggerServiceAdapter));
//   app.useGlobalFilters(new HttpExceptionFilter());

//   await app.listen();
//   logger.log('Connection-Service Microservice is listening to NATS ');
// }
// bootstrap();
async function main() {
  await bootstrapConnectionService();
}

main();

