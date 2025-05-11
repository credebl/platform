import { Controller, Logger } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
@Controller()
@ApiBearerAuth()
export class AppController { 
    constructor(private readonly appService: AppService) {}

    private readonly logger = new Logger('AppController');
}
