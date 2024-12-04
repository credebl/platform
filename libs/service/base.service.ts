import { Logger } from '@nestjs/common';
export class BaseService {
  protected logger;
  
  constructor(loggerName: string) {
    this.logger = new Logger(loggerName);
  }

}