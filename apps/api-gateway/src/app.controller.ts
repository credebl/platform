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
  @Redirect('/api', 301)
  @ApiExcludeEndpoint()
  redirectToSwagger(): { url?: string; statusCode: number } {
    if (this.configService.isDevelopment) {
      return { url: '/api', statusCode: 301 };
    }

    return { statusCode: 200 };
  }
}
