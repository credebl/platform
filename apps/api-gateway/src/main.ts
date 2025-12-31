import { otelSDK } from './tracer';
import * as dotenv from 'dotenv';
import * as express from 'express';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from '@credebl/common/exception-handler';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';

import helmet from 'helmet';
import { CommonConstants } from '@credebl/common/common.constant';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { UpdatableValidationPipe } from '@credebl/common/custom-overrideable-validation-pipe';
import * as useragent from 'express-useragent';

dotenv.config();

async function bootstrap(): Promise<void> {
  try {
    if (otelSDK) {
      await otelSDK.start();
      // eslint-disable-next-line no-console
      console.log('OpenTelemetry SDK started successfully');
    } else {
      // eslint-disable-next-line no-console
      console.log('OpenTelemetry SDK disabled for this environment');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start OpenTelemetry SDK:', error);
  }
  const app = await NestFactory.create(AppModule);

  app.useLogger(app.get(NestjsLoggerServiceAdapter));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.API_GATEWAY_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('x-powered-by', false);
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use(cookieParser());
  app.use(useragent.express());

  app.use((req, res, next) => {
    let err = null;
    try {
      decodeURIComponent(req.path);
    } catch (e) {
      err = e;
    }
    if (err) {
      return res.status(500).json({ message: 'Invalid URL' });
    }
    next();
  });

  const options = new DocumentBuilder()
    .setTitle(`${process.env.PLATFORM_NAME}`)
    .setDescription(`${process.env.PLATFORM_NAME} Platform APIs`)
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`${process.env.PUBLIC_DEV_API_URL}`)
    .addServer(`${process.env.PUBLIC_LOCALHOST_URL}`)
    .addServer(`${process.env.PUBLIC_QA_API_URL}`)
    .addServer(`${process.env.PUBLIC_PRODUCTION_API_URL}`)
    .addServer(`${process.env.PUBLIC_SANDBOX_API_URL}`)
    .addServer(`${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}`)
    .addServer(`${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_GATEWAY_HOST}`)
    .build();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1']
  });

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  const httpAdapter: HttpAdapterHost = app.get(HttpAdapterHost) as HttpAdapterHost;
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  const { ENABLE_CORS_IP_LIST } = process.env || {};
  if (ENABLE_CORS_IP_LIST && '' !== ENABLE_CORS_IP_LIST) {
    app.enableCors({
      origin: ENABLE_CORS_IP_LIST.split(','),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true
    });
  }

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1', VERSION_NEUTRAL]
  });

  app.use(express.static('uploadedFiles/holder-profile'));
  app.use(express.static('uploadedFiles/org-logo'));
  app.use(express.static('uploadedFiles/tenant-logo'));
  app.use(express.static('uploadedFiles/exports'));
  app.use(express.static('resources'));
  app.use(express.static('genesis-file'));
  app.use(express.static('invoice-pdf'));
  app.use(express.static('uploadedFiles/bulk-verification-templates'));
  app.use(express.static('uploadedFiles/import'));
  // Use custom updatable global pipes
  const reflector = app.get(Reflector);
  app.useGlobalPipes(new UpdatableValidationPipe(reflector, { whitelist: true, transform: true }));
  app.use(
    helmet({
      xssFilter: true
    })
  );
  await app.listen(process.env.API_GATEWAY_PORT, `${process.env.API_GATEWAY_HOST}`);
  Logger.log(`API Gateway is listening on port ${process.env.API_GATEWAY_PORT}`, 'Success');

  if ('true' === process.env.DB_ALERT_ENABLE?.trim()?.toLowerCase()) {
    // in case it is enabled, log that
    Logger.log(
      'We have enabled DB alert for \'ledger_null\' instances. This would send email in case the \'ledger_id\' column in \'org_agents\' table is set to null',
      'DB alert enabled'
    );
  }

  if ('true' === (process.env.HIDE_EXPERIMENTAL_OIDC_CONTROLLERS || 'true').trim().toLowerCase()) {
    Logger.warn('Hiding experimental OIDC Controllers: OID4VC, OID4VP, x509 in OpenAPI docs');
    Logger.verbose(
      'To enable the use of experimental OIDC controllers. Set, \'HIDE_EXPERIMENTAL_OIDC_CONTROLLERS\' env variable to false'
    );
  }

}
bootstrap();
