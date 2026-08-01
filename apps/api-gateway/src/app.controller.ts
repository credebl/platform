import { Controller, Get, Logger, Redirect } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ConfigService } from '@credebl/config/config.service';

@Controller()
@ApiBearerAuth()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) {}

  private readonly logger = new Logger('AppController');

  @Get()
  @Redirect('/api', 302)
  @ApiExcludeEndpoint()
  redirectToSwagger(): { url?: string; statusCode: number } {
    if (this.configService.isSwaggerAvailable) {
      return { url: '/api', statusCode: 302 };
    }

    return { statusCode: 200 };
  }
}
