import { NestFactory } from '@nestjs/core';
import { EcosystemModule } from './ecosystem.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(EcosystemModule);
  await app.listen(3000);
}
bootstrap();
