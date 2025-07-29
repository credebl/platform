import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './services';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true
    })
  ],
  controllers: [],
  providers: [ConfigService],
  exports: [ConfigService]
})
export class ConfigModule {}
