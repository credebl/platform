import * as dotenv from 'dotenv';
import * as express from 'express';
import helmet from 'helmet';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger, Provider, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { APIGatewayModule } from './app.module';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import {
  AllExceptionsFilter,
  CommonConstants,
  getNatsOptions,
  NatsInterceptor,
  UpdatableValidationPipe
} from '@credebl/common';
import { NestjsLoggerServiceAdapter } from '@credebl/logger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

dotenv.config();

interface AppModuleRegisterOptions {
  overrides: Provider[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllerOverrides: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedModules: any[];
}

export async function createApiGateway(options: AppModuleRegisterOptions): Promise<INestApplication> {
  // Call register and get a configured module
  const moduleRef = APIGatewayModule.register(options.overrides, options.controllerOverrides, options.importedModules);

  const app = await NestFactory.create(moduleRef);

  app.useLogger(app.get(NestjsLoggerServiceAdapter));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.API_GATEWAY_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('x-powered-by', false);
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  app.use((req, res, next) => {
    try {
      decodeURIComponent(req.path);
      next();
    } catch {
      return res.status(500).json({ message: 'Invalid URL' });
    }
  });

  const optionsBuilder = new DocumentBuilder()
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
    .addServer(`${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_GATEWAY_HOST}`);

  const swaggerOptions = optionsBuilder.build();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1']
  });

  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('api', app, document);

  const httpAdapter = app.get(HttpAdapterHost);
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

  const staticDirs = [
    'uploadedFiles/holder-profile',
    'uploadedFiles/org-logo',
    'uploadedFiles/tenant-logo',
    'uploadedFiles/exports',
    'resources',
    'genesis-file',
    'invoice-pdf',
    'uploadedFiles/bulk-verification-templates',
    'uploadedFiles/import'
  ];
  staticDirs.forEach((dir) => app.use(express.static(dir)));

  const reflector = app.get(Reflector);
  app.useGlobalPipes(new UpdatableValidationPipe(reflector, { whitelist: true, transform: true }));

  app.use(helmet({ xssFilter: true }));

  app.useGlobalInterceptors(new NatsInterceptor());

  return app;
}

/**
 * Create + start the API Gateway (both HTTP + microservices).
 * Returns the started app.
 */
export async function bootstrapApiGateway(
  host?: string | number,
  options: AppModuleRegisterOptions = {
    overrides: [],
    controllerOverrides: [],
    importedModules: []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<INestApplication<any>> {
  const port = process.env.API_GATEWAY_PORT ?? host ?? 5000;
  const app = await createApiGateway(options);

  // start microservices first
  await app.init(); // ensure all modules/microservices configured
  await app.startAllMicroservices();

  // start http server
  await app.listen(Number(port), process.env.API_GATEWAY_HOST);
  Logger.log(`API Gateway is listening on port ${port}`);

  return app;
}
