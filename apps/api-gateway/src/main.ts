import * as dotenv from 'dotenv';
import * as express from 'express';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AllExceptionsFilter } from '@credebl/common/exception-handler';

// const fs = require('fs'); 


dotenv.config();

// async function readSecretFile(filename: string): Promise<void> {
//   return fs.readFile(filename, 'utf8', function (err, data) {
//     // Display the file content 
//     return data;
//   });
// }

async function bootstrap(): Promise<void> {

  // const httpsOptions = {
  //   key: await readSecretFile(''),
  //   cert: await readSecretFile(''),
  // };

  // const config = new ConfigService();
  const app = await NestFactory.create(AppModule, {
    // httpsOptions,
  });
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe());
  const options = new DocumentBuilder()
    .setTitle(`${process.env.PLATFORM_NAME}`)
    .setDescription(`${process.env.PLATFORM_NAME} Platform APIs`)
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://192.168.1.83:5000')
    .addServer('https://devapi.credebl.id')
    .addServer('https://qa-api.credebl.id')
    .addServer('https://api.credebl.id')
    .addServer('https://sandboxapi.credebl.id')
    .addServer(`${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}`)
    .addServer(`${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_GATEWAY_HOST}`)
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.enableCors();

  app.use(express.static('uploadedFiles/holder-profile'));
  app.use(express.static('uploadedFiles/org-logo'));
  app.use(express.static('uploadedFiles/tenant-logo'));
  app.use(express.static('uploadedFiles/exports'));
  app.use(express.static('resources'));
  app.use(express.static('genesis-file'));
  app.use(express.static('invoice-pdf'));
  app.use(express.static('uploadedFiles/bulk-verification-templates'));
  app.use(express.static('uploadedFiles/exports'));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.API_GATEWAY_PORT, `${process.env.API_GATEWAY_HOST}`);
  Logger.log(`API Gateway is listening on port ${process.env.API_GATEWAY_PORT}`);
}
bootstrap();

